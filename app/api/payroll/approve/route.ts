import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Payroll Approval Workflow API
 * Handles approve, reject, and mark as paid actions
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Only ADMIN, PAYROLL_ADMIN, or HR_MANAGER can approve payroll
  if (
    user?.role !== 'ADMIN' &&
    user?.role !== 'PAYROLL_ADMIN' &&
    user?.role !== 'HR_MANAGER'
  ) {
    return NextResponse.json({ error: 'Unauthorized to approve payroll' }, { status: 403 });
  }

  const body = await request.json();
  const {
    payrollId,
    action, // 'APPROVE', 'REJECT', 'MARK_PAID'
    rejectionReason,
    paymentReference,
  } = body;

  if (!payrollId || !action) {
    return NextResponse.json(
      { error: 'Payroll ID and action are required' },
      { status: 400 }
    );
  }

  if (!['APPROVE', 'REJECT', 'MARK_PAID'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be APPROVE, REJECT, or MARK_PAID' },
      { status: 400 }
    );
  }

  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Validate action based on current status
    if (action === 'APPROVE' && ['APPROVED', 'PAID'].includes(payroll.status)) {
      return NextResponse.json(
        { error: 'Payroll is already approved or paid' },
        { status: 400 }
      );
    }

    if (action === 'REJECT' && payroll.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot reject payroll that has been paid' },
        { status: 400 }
      );
    }

    if (action === 'MARK_PAID' && payroll.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only mark approved payroll as paid' },
        { status: 400 }
      );
    }

    // Store previous values for audit
    const previousValues = {
      status: payroll.status,
      approvedBy: payroll.approvedBy,
      approvedAt: payroll.approvedAt,
      paidAt: payroll.paidAt,
      paymentReference: payroll.paymentReference,
      rejectionReason: payroll.rejectionReason,
    };

    // Update payroll based on action
    let updatedPayroll;
    let auditAction = '';
    let newValues: any = {};

    switch (action) {
      case 'APPROVE':
        updatedPayroll = await prisma.payroll.update({
          where: { id: payrollId },
          data: {
            status: 'APPROVED',
            approvedBy: user.id,
            approvedAt: new Date(),
            rejectionReason: null,
          },
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        });
        auditAction = 'APPROVED';
        newValues = {
          status: 'APPROVED',
          approvedBy: user.name,
          approvedAt: new Date(),
        };
        break;

      case 'REJECT':
        updatedPayroll = await prisma.payroll.update({
          where: { id: payrollId },
          data: {
            status: 'REJECTED',
            approvedBy: user.id,
            approvedAt: new Date(),
            rejectionReason: rejectionReason || 'No reason provided',
          },
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        });
        auditAction = 'REJECTED';
        newValues = {
          status: 'REJECTED',
          approvedBy: user.name,
          rejectionReason: rejectionReason || 'No reason provided',
        };
        break;

      case 'MARK_PAID':
        updatedPayroll = await prisma.payroll.update({
          where: { id: payrollId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paymentReference: paymentReference || null,
          },
          include: {
            employee: {
              include: {
                user: true,
                department: true,
              },
            },
          },
        });
        auditAction = 'PAID';
        newValues = {
          status: 'PAID',
          paidAt: new Date(),
          paymentReference: paymentReference || null,
        };
        break;
    }

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payrollId,
        action: auditAction,
        performedBy: user.id,
        performedByName: user.name,
        previousValues: JSON.stringify(previousValues),
        newValues: JSON.stringify(newValues),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPayroll,
      message: `Payroll ${action.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    console.error('Error processing payroll action:', error);
    return NextResponse.json(
      { error: 'Failed to process payroll', details: error.message },
      { status: 500 }
    );
  }
}
