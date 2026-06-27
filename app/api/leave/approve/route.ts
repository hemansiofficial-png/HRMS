import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch leave requests for approval
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

    // Build base where clause with organization filter
    const where: any = {
      employee: {
        organizationId: user.organizationId
      }
    };

    // If manager, show only leaves from their team
    // Note: Managers must have managerId set in their Employee record to see their team's leaves
    if (user.role === 'MANAGER') {
      where.employee.managerId = user.id;
      
      // Log for debugging: Check if this manager has any direct reports
      const teamCount = await prisma.employee.count({
        where: { managerId: user.id }
      });
      if (teamCount === 0) {
        console.warn(`Manager ${user.email} has no direct reports assigned. They won't see any leave requests.`);
      }
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    console.log(`Fetching leave requests with where clause:`, JSON.stringify(where, null, 2));

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${leaveRequests.length} leave requests for approval`);
    
    return NextResponse.json({ success: true, data: leaveRequests });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch leave requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Approve or reject leave request
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, rejectionReason } = body;

    if (!id) {
      return NextResponse.json({ error: 'Leave request ID required' }, { status: 400 });
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify the leave request belongs to the organization
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.employee.organizationId !== user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if manager can approve this leave
    if (user.role === 'MANAGER' && leaveRequest.employee.managerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only approve leaves from your team members' },
        { status: 403 }
      );
    }

    // If rejecting, ensure reason is provided
    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Update leave request
    const updatedLeave = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedBy: user.id,
        updatedAt: new Date()
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

    // Update leave balance if approved
    if (status === 'APPROVED') {
      const numberOfDays = leaveRequest.numberOfDays;
      const leaveType = leaveRequest.leaveType;

      // Find or create leave balance
      const year = new Date(leaveRequest.startDate).getFullYear();
      let leaveBalance = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          leaveType,
          year
        }
      });

      if (leaveBalance) {
        // Deduct from balance
        await prisma.leaveBalance.update({
          where: { id: leaveBalance.id },
          data: {
            usedDays: leaveBalance.usedDays + numberOfDays,
            remainingDays: Math.max(0, leaveBalance.remainingDays - numberOfDays)
          }
        });
      } else {
        // Create initial balance (this would typically be initialized at year start)
        const policy = await prisma.leavePolicy.findFirst({
          where: {
            organizationId: user.organizationId,
            leaveType
          }
        });

        if (policy) {
          await prisma.leaveBalance.create({
            data: {
              employeeId: leaveRequest.employeeId,
              leaveType,
              year,
              totalDays: policy.totalDays,
              usedDays: numberOfDays,
              remainingDays: policy.totalDays - numberOfDays
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLeave,
      message: `Leave request ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Error updating leave request:', error);
    return NextResponse.json(
      {
        error: 'Failed to update leave request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
