import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

// POST - Approve or reject resignation
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { resignationId, action, comments, rejectionReason } = body;

    if (!resignationId || !action) {
      return NextResponse.json(
        { error: 'Resignation ID and action are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Get resignation
    const resignation = await prisma.resignation.findUnique({
      where: { id: resignationId },
      include: {
        employee: {
          include: {
            user: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!resignation) {
      return NextResponse.json({ error: 'Resignation not found' }, { status: 404 });
    }

    // Check if user is authorized to approve
    const isHR = user.role === 'ADMIN' || user.role === 'HR_MANAGER';
    const isManager = user.role === 'MANAGER';
    const isEmployeeManager = resignation.employee.managerId === user.id;

    if (!isHR && !(isManager && isEmployeeManager)) {
      return NextResponse.json(
        { error: 'You are not authorized to approve this resignation' },
        { status: 403 }
      );
    }

    // Update resignation
    const updatedResignation = await prisma.resignation.update({
      where: { id: resignationId },
      data: {
        status: action,
        approvedBy: user.id,
        approvedAt: new Date(),
        managerComments: isManager ? (comments || rejectionReason) : resignation.managerComments,
        hrComments: isHR ? (comments || rejectionReason) : resignation.hrComments,
        rejectionReason: action === 'REJECTED' ? (rejectionReason || comments) : null
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send notification to employee
    await createNotification({
      userId: updatedResignation.employeeId,
      type: action === 'APPROVED' ? 'SUCCESS' : 'ERROR',
      category: 'RESIGNATION',
      title: action === 'APPROVED' ? 'Resignation Approved' : 'Resignation Rejected',
      message: action === 'APPROVED'
        ? `Your resignation has been approved by ${user.name}. Please proceed with the handover process.`
        : `Your resignation has been rejected by ${user.name}. Please contact them for further discussion.`,
      link: '/profile'
    });

    return NextResponse.json({
      success: true,
      resignation: {
        id: updatedResignation.id,
        status: updatedResignation.status,
        approvedBy: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        approvedAt: updatedResignation.approvedAt?.toISOString(),
        rejectionReason: updatedResignation.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error processing resignation approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update clearance task status
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, status, comments } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'Task ID and status are required' },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.clearanceTask.update({
      where: { id: taskId },
      data: {
        status,
        comments,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    // Check if all tasks are completed
    const allTasks = await prisma.clearanceTask.findMany({
      where: { resignationId: updatedTask.resignationId }
    });

    const allCompleted = allTasks.every(t => t.status === 'COMPLETED');

    if (allCompleted) {
      // Update resignation status to COMPLETED
      await prisma.resignation.update({
        where: { id: updatedTask.resignationId },
        data: { status: 'COMPLETED' }
      });
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      allCompleted
    });
  } catch (error) {
    console.error('Error updating clearance task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Withdraw resignation (by employee)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const resignationId = searchParams.get('id');

    if (!resignationId) {
      return NextResponse.json(
        { error: 'Resignation ID is required' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get resignation
    const resignation = await prisma.resignation.findUnique({
      where: { id: resignationId }
    });

    if (!resignation || resignation.employeeId !== employee.id) {
      return NextResponse.json(
        { error: 'Resignation not found or not authorized' },
        { status: 404 }
      );
    }

    // Check if can be withdrawn
    if (['APPROVED', 'COMPLETED'].includes(resignation.status)) {
      return NextResponse.json(
        { error: 'Cannot withdraw resignation that has been approved or completed' },
        { status: 400 }
      );
    }

    // Update status to WITHDRAWN
    await prisma.resignation.update({
      where: { id: resignationId },
      data: { status: 'WITHDRAWN' }
    });

    return NextResponse.json({
      success: true,
      message: 'Resignation withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing resignation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
