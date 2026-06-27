import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all resignations/terminations (for HR and Managers)
// Primary source is Resignation model, LifecycleEvent is used as fallback only
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status');
    const department = searchParams.get('department');

    // Check user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organizationId = (session.user as any).organizationId || null;
    console.log('[Exits API] organizationId:', organizationId);

    const isAdmin = user.role === 'ADMIN' || user.role === 'HR_MANAGER';
    const isManager = user.role === 'MANAGER';

    // Build where clause
    const whereClause: any = {};

    if (!isAdmin) {
      // Managers can only see their department
      if (isManager && user.employee?.departmentId) {
        whereClause.employee = {
          departmentId: user.employee.departmentId
        };
      } else if (!isManager) {
        // Regular employees see nothing here
        return NextResponse.json({ resignations: [] });
      }
    }

    if (type !== 'ALL') {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    // Fetch resignations from Resignation model (primary source)
    const resignations = await prisma.resignation.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            department: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        clearanceTasks: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format resignations from Resignation model
    const formattedResignations = resignations.map(r => ({
      id: r.id,
      source: 'RESIGNATION',
      type: r.type,
      eventType: r.type === 'TERMINATION' ? 'EXIT' : 'RESIGNATION', // For lifecycle tab filtering
      status: r.status, // Keep original Resignation status
      displayStatus: mapResignationStatusToDisplay(r.status), // For UI display
      employee: {
        id: r.employee.id,
        name: r.employee.user.name,
        email: r.employee.user.email,
        employeeCode: r.employee.employeeCode,
        designation: r.employee.designation,
        department: r.employee.department?.name || 'N/A'
      },
      resignationDate: r.resignationDate.toISOString(),
      noticeDate: r.noticeDate.toISOString(),
      lastWorkingDay: r.lastWorkingDay.toISOString(),
      eventDate: r.resignationDate.toISOString().split('T')[0],
      reason: r.reason,
      reasonCategory: r.reasonCategory,
      noticePeriodDays: r.noticePeriodDays,
      okToRehire: r.okToRehire,
      approvedBy: r.approver ? {
        id: r.approver.id,
        name: r.approver.name,
        email: r.approver.email
      } : null,
      approvedAt: r.approvedAt?.toISOString(),
      createdAt: r.createdAt.toISOString(),
      clearanceProgress: {
        total: r.clearanceTasks.length,
        completed: r.clearanceTasks.filter(t => t.status === 'COMPLETED').length,
        pending: r.clearanceTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
      }
    }));

    return NextResponse.json({ resignations: formattedResignations });
  } catch (error) {
    console.error('Error fetching resignations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to map Resignation status to Display status
function mapResignationStatusToDisplay(status: string): string {
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
  return map[status] || status;
}

// POST - Initiate termination (for HR/Admin only)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'HR_MANAGER')) {
      return NextResponse.json(
        { error: 'Only HR/Admin can initiate termination' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      type,
      reason,
      reasonCategory,
      discussionWithEmployee,
      discussionSummary,
      noticeDate,
      lastWorkingDay,
      okToRehire,
      additionalComments
    } = body;

    // Use reasonCategory as reason if reason is not provided (form sends reasonCategory)
    const finalReason = reason || reasonCategory;

    // Validation
    if (!employeeId || !finalReason || !lastWorkingDay) {
      return NextResponse.json(
        { error: 'Employee ID, reason, and last working day are required' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        department: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if already has resignation
    const existingResignation = await prisma.resignation.findUnique({
      where: { employeeId }
    });

    if (existingResignation) {
      return NextResponse.json(
        { error: 'Employee already has an exit in progress' },
        { status: 400 }
      );
    }

    // Calculate notice period days
    const noticeDt = new Date(noticeDate);
    const lwd = new Date(lastWorkingDay);
    const noticePeriodDays = Math.ceil((lwd.getTime() - noticeDt.getTime()) / (1000 * 60 * 60 * 24));

    // Create resignation/termination record
    const resignation = await prisma.resignation.create({
      data: {
        employeeId,
        type: type || 'TERMINATION',
        status: 'UNDER_REVIEW',
        noticeDate: noticeDt,
        lastWorkingDay: lwd,
        reason: finalReason,
        reasonCategory: reasonCategory || 'Other',
        discussionWithManager: discussionWithEmployee || false,
        discussionSummary: discussionSummary || additionalComments || null,
        noticePeriodDays,
        okToRehire: okToRehire !== undefined ? okToRehire : true
      },
      include: {
        employee: {
          include: {
            department: true,
            user: true
          }
        }
      }
    });

    // Create clearance tasks
    await createClearanceTasks(resignation.id);

    // Also create a lifecycle event for sync with Employee Lifecycle Management
    try {
      await prisma.lifecycleEvent.create({
        data: {
          employeeId,
          eventType: type === 'TERMINATION' ? 'EXIT' : 'RESIGNATION',
          eventDate: lwd,
          description: finalReason,
          status: 'PENDING'
        }
      });
    } catch (lifecycleError) {
      console.error('Failed to create lifecycle event:', lifecycleError);
      // Don't fail the request if lifecycle event creation fails
    }

    // TODO: Send notification to employee and stakeholders
    // await sendTerminationNotification(employee, resignation);

    return NextResponse.json({
      success: true,
      resignation: {
        id: resignation.id,
        type: resignation.type,
        status: resignation.status,
        lastWorkingDay: resignation.lastWorkingDay.toISOString(),
        noticePeriodDays: resignation.noticePeriodDays
      }
    });
  } catch (error) {
    console.error('Error initiating termination:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to create clearance tasks
async function createClearanceTasks(resignationId: string) {
  const tasks = [
    {
      taskType: 'IT_ASSETS',
      taskName: 'Return IT Assets',
      description: 'Return laptop, charger, mouse, keyboard, and other IT equipment'
    },
    {
      taskType: 'ACCESS_CARD',
      taskName: 'Return Access Cards',
      description: 'Return office access cards, parking cards, and keys'
    },
    {
      taskType: 'DOCUMENTS',
      taskName: 'Handover Documents',
      description: 'Transfer all company documents and files'
    },
    {
      taskType: 'KNOWLEDGE_TRANSFER',
      taskName: 'Complete Knowledge Transfer',
      description: 'Document processes and train team members'
    },
    {
      taskType: 'CLIENT_HANDOVER',
      taskName: 'Client Handover',
      description: 'Transfer client relationships and ongoing projects'
    },
    {
      taskType: 'NO_DUES',
      taskName: 'No Dues Certificate',
      description: 'Obtain no dues certificate from all departments'
    }
  ];

  return await Promise.all(
    tasks.map(task =>
      prisma.clearanceTask.create({
        data: {
          resignationId,
          taskType: task.taskType,
          taskName: task.taskName,
          description: task.description,
          status: 'PENDING'
        }
      })
    )
  );
}
