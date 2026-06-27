import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRoleAuth } from '@/lib/rbac';

/**
 * GET /api/lifecycle-events/[id]
 * Get a specific lifecycle event by ID
 * Accessible by: ADMIN, HR_MANAGER, PAYROLL_ADMIN, MANAGER, EMPLOYEE
 */
export const GET = withRoleAuth('EMPLOYEE', async (req, { params }) => {
  try {
    const { id } = await params;
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;
    const userRole = session?.user?.role as string;
    const userId = session?.user?.id as string;

    // Get employee record for the user
    let employeeId: string | undefined = undefined;
    
    if (userRole === 'EMPLOYEE') {
      const employee = await prisma.employee.findFirst({
        where: { userId: userId }
      });
      employeeId = employee?.id;
    }

    const where: Record<string, any> = {
      id: id,
      employee: {
        organizationId: organizationId
      }
    };

    // If EMPLOYEE role, only allow access to their own events
    if (userRole === 'EMPLOYEE' && employeeId) {
      where.employeeId = employeeId;
    }

    const event = await prisma.lifecycleEvent.findFirst({
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
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Lifecycle event not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedEvent = {
      id: event.id,
      employeeId: event.employeeId,
      employeeName: event.employee.user.name,
      eventType: event.eventType,
      eventDate: event.eventDate.toISOString().split('T')[0],
      description: event.description,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedEvent,
    });
  } catch (error) {
    console.error('[Get Lifecycle Event] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to fetch lifecycle event' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/lifecycle-events/[id]
 * Update a lifecycle event
 * Accessible by: ADMIN, HR_MANAGER only
 */
export const PUT = withRoleAuth('HR_MANAGER', async (req, { params }) => {
  try {
    const { id } = await params;
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;

    const body = await req.json();
    const { employeeId, eventType, eventDate, description, status } = body;

    // Verify event exists and belongs to organization
    const existingEvent = await prisma.lifecycleEvent.findFirst({
      where: {
        id: id,
        employee: {
          organizationId: organizationId
        }
      }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Lifecycle event not found' },
        { status: 404 }
      );
    }

    // Update lifecycle event
    const updatedEvent = await prisma.lifecycleEvent.update({
      where: { id: id },
      data: {
        employeeId: employeeId || existingEvent.employeeId,
        eventType: eventType || existingEvent.eventType,
        eventDate: eventDate ? new Date(eventDate) : existingEvent.eventDate,
        description: description || existingEvent.description,
        status: status || existingEvent.status
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
    });

    // Format the response
    const formattedEvent = {
      id: updatedEvent.id,
      employeeId: updatedEvent.employeeId,
      employeeName: updatedEvent.employee.user.name,
      eventType: updatedEvent.eventType,
      eventDate: updatedEvent.eventDate.toISOString().split('T')[0],
      description: updatedEvent.description,
      status: updatedEvent.status,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: formattedEvent,
      message: 'Lifecycle event updated successfully'
    });
  } catch (error) {
    console.error('[Update Lifecycle Event] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update lifecycle event' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/lifecycle-events/[id]
 * Delete a lifecycle event
 * Accessible by: ADMIN only
 */
export const DELETE = withRoleAuth('ADMIN', async (req, { params }) => {
  try {
    const { id } = await params;
    const session = await auth();
    const organizationId = (session?.user as any)?.organizationId || undefined;

    // Verify event exists and belongs to organization
    const event = await prisma.lifecycleEvent.findFirst({
      where: {
        id: id,
        employee: {
          organizationId: organizationId
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Lifecycle event not found' },
        { status: 404 }
      );
    }

    // Delete the lifecycle event
    await prisma.lifecycleEvent.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'Lifecycle event deleted successfully'
    });
  } catch (error) {
    console.error('[Delete Lifecycle Event] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete lifecycle event' },
      { status: 500 }
    );
  }
});
