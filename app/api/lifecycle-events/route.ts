import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRoleAuth } from '@/lib/rbac';

/**
 * GET /api/lifecycle-events
 * Get all lifecycle events for the organization
 * Accessible by: ADMIN, HR_MANAGER, PAYROLL_ADMIN, MANAGER, EMPLOYEE
 * Now includes both LifecycleEvent and Resignation model data
 */
export const GET = withRoleAuth('EMPLOYEE', async (req, _context) => {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || null;
    const userRole = session?.user?.role as string;
    const userId = session?.user?.id as string;

    console.log('[Lifecycle Events API] organizationId:', organizationId);
    console.log('[Lifecycle Events API] userRole:', userRole);
    console.log('[Lifecycle Events API] userId:', userId);

    // Get employee record for the user
    let employeeId: string | undefined = undefined;

    if (userRole === 'EMPLOYEE') {
      const employee = await prisma.employee.findFirst({
        where: { userId: userId }
      });
      employeeId = employee?.id;
      console.log('[Lifecycle Events API] employeeId:', employeeId);
    }

    const where: Record<string, any> = {
      employee: organizationId ? { organizationId: organizationId } : {}
    };

    // If EMPLOYEE role, only show their own events
    if (userRole === 'EMPLOYEE' && employeeId) {
      where.employeeId = employeeId;
    }

    console.log('[Lifecycle Events API] where clause:', JSON.stringify(where, null, 2));

    // Fetch both LifecycleEvent and Resignation data
    const [lifecycleEvents, resignations] = await Promise.all([
      prisma.lifecycleEvent.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      // Also fetch resignation records for sync
      prisma.resignation.findMany({
        where: where.employeeId ? { employeeId: where.employeeId } : { employee: { organizationId } },
        include: {
          employee: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Format lifecycle events
    const formattedEvents = lifecycleEvents.map((event) => ({
      id: event.id,
      source: 'LIFECYCLE',
      employeeId: event.employeeId,
      employeeName: event.employee.user.name,
      employeeCode: event.employee.employeeCode,
      eventType: event.eventType,
      eventDate: event.eventDate.toISOString().split('T')[0],
      description: event.description,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));

    // Format resignations as lifecycle events
    const formattedResignations = resignations.map((r) => ({
      id: r.id,
      source: 'RESIGNATION',
      employeeId: r.employeeId,
      employeeName: r.employee.user.name,
      employeeCode: r.employee.employeeCode,
      eventType: r.type === 'TERMINATION' ? 'EXIT' : 'RESIGNATION',
      eventDate: r.resignationDate.toISOString().split('T')[0],
      description: r.reason,
      status: mapResignationStatusToLifecycle(r.status),
      displayStatus: r.status, // Keep original status for reference
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Combine and deduplicate by employeeId (prefer LIFECYCLE source for RESIGNATION/EXIT events)
    const allEvents = [...formattedEvents, ...formattedResignations];
    const uniqueEvents = allEvents.reduce((acc, curr) => {
      const existing = acc.find(a => a.employeeId === curr.employeeId && a.eventType === curr.eventType);
      if (!existing || curr.source === 'LIFECYCLE') {
        acc = acc.filter(a => !(a.employeeId === curr.employeeId && a.eventType === curr.eventType));
        acc.push(curr);
      }
      return acc;
    }, [] as any[]);

    // Sort by createdAt descending
    uniqueEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: uniqueEvents,
      meta: {
        total: uniqueEvents.length,
      },
    });
  } catch (error) {
    console.error('[Get Lifecycle Events] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch lifecycle events' },
      { status: 500 }
    );
  }
});

// Helper function to map Resignation status to Lifecycle status
function mapResignationStatusToLifecycle(status: string): string {
  const map: Record<string, string> = {
    'DRAFT': 'PENDING',
    'PENDING': 'PENDING',
    'SUBMITTED': 'PENDING',
    'UNDER_REVIEW': 'PENDING',
    'APPROVED': 'COMPLETED',
    'ACCEPTED': 'COMPLETED',
    'COMPLETED': 'COMPLETED',
    'REJECTED': 'CANCELLED',
    'WITHDRAWN': 'CANCELLED'
  };
  return map[status] || 'PENDING';
}

/**
 * POST /api/lifecycle-events
 * Create a new lifecycle event
 * Accessible by: ADMIN, HR_MANAGER only
 * Also creates Resignation record for RESIGNATION/EXIT event types
 */
export const POST = withRoleAuth('HR_MANAGER', async (req, _context) => {
  try {
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;

    const body = await req.json();
    const { employeeId, eventType, eventDate, description, status } = body;

    // Validate required fields
    if (!employeeId || !eventType || !eventDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify employee exists and belongs to organization
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId: organizationId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create lifecycle event and optionally resignation record
    const [lifecycleEvent] = await Promise.all([
      prisma.lifecycleEvent.create({
        data: {
          employeeId,
          eventType,
          eventDate: new Date(eventDate),
          description,
          status: status || 'PENDING'
        },
        include: {
          employee: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          }
        }
      }),
      // Create resignation record for RESIGNATION/EXIT events
      (async () => {
        if (eventType === 'RESIGNATION' || eventType === 'EXIT') {
          // Check if resignation already exists
          const existing = await prisma.resignation.findUnique({
            where: { employeeId }
          });
          
          if (!existing) {
            await prisma.resignation.create({
              data: {
                employeeId,
                type: eventType === 'EXIT' ? 'TERMINATION' : 'RESIGNATION',
                status: status === 'COMPLETED' ? 'APPROVED' : status === 'CANCELLED' ? 'REJECTED' : 'UNDER_REVIEW',
                reason: description,
                reasonCategory: 'Other',
                noticeDate: new Date(eventDate),
                lastWorkingDay: new Date(eventDate),
                noticePeriodDays: 0,
                okToRehire: eventType !== 'EXIT'
              }
            });
          }
        }
      })()
    ]);

    // Format the response
    const formattedEvent = {
      id: lifecycleEvent.id,
      employeeId: lifecycleEvent.employeeId,
      employeeName: lifecycleEvent.employee.user.name,
      eventType: lifecycleEvent.eventType,
      eventDate: lifecycleEvent.eventDate.toISOString().split('T')[0],
      description: lifecycleEvent.description,
      status: lifecycleEvent.status,
      createdAt: lifecycleEvent.createdAt,
      updatedAt: lifecycleEvent.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedEvent,
      message: 'Lifecycle event created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('[Create Lifecycle Event] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create lifecycle event' },
      { status: 500 }
    );
  }
});
