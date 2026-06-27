import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePayroll, checkDuplicatePayroll } from '@/lib/payroll-calculator';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const employeeId = searchParams.get('employeeId');
  const status = searchParams.get('status');

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employee: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Build where clause
  const whereClause: any = {};

  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);
  if (employeeId) whereClause.employeeId = employeeId;
  if (status) whereClause.status = status;

  // EMPLOYEE: Only see their own payroll
  if (user.role === 'EMPLOYEE') {
    if (!user.employee?.id) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    const payroll = await prisma.payroll.findMany({
      where: {
        employeeId: user.employee.id,
        ...whereClause,
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: { month: 'desc' },
    });

    return NextResponse.json({ payroll, auth: { role: user.role } });
  }

  // HR_MANAGER: See all payroll (can view but limited actions)
  if (user.role === 'HR_MANAGER') {
    const payroll = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: { month: 'desc' },
    });

    return NextResponse.json({ payroll, auth: { role: user.role } });
  }

  // ADMIN: Full access to all payroll
  if (user.role === 'ADMIN' || user.role === 'PAYROLL_ADMIN') {
    const payroll = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: true,
            department: true,
          },
        },
        payrollAuditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payroll, auth: { role: user.role } });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Only ADMIN or PAYROLL_ADMIN can create payroll
  if (user?.role !== 'ADMIN' && user?.role !== 'PAYROLL_ADMIN') {
    return NextResponse.json({ error: 'Only admins can generate payroll' }, { status: 403 });
  }

  const body = await request.json();
  const {
    employeeId,
    month,
    year,
    baseSalary,
    bonus,
    deductions,
    incentive,
    arrears,
    loanDeduction,
    advanceDeduction,
    isFinalSettlement,
    notes,
    // Attendance data
    workingDays,
    presentDays,
    absentDays,
    leaveDays,
    halfDays,
    overtimeHours,
    lateDays,
  } = body;

  // Validate required fields
  if (!employeeId || !month) {
    return NextResponse.json(
      { error: 'Missing required fields: employeeId and month are required' },
      { status: 400 }
    );
  }

  // Parse year from month if not provided
  const parsedYear = year || parseInt(month.split('-')[0]);
  const parsedMonth = month; // Keep as YYYY-MM format

  // Check if employee exists
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true },
  });

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  // Check for duplicate payroll
  const duplicate = await checkDuplicatePayroll(employeeId, parsedMonth, parsedYear);
  if (duplicate.exists) {
    return NextResponse.json(
      {
        error: 'Payroll already exists for this employee and month',
        payrollId: duplicate.payrollId,
        duplicate: true,
      },
      { status: 409 }
    );
  }

  try {
    // Calculate payroll using the calculator utility
    const calculation = await calculatePayroll({
      employeeId,
      month: parsedMonth,
      year: parsedYear,
      baseSalary: baseSalary || Number(employee.salary),
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      halfDays,
      overtimeHours,
      lateDays,
      bonus,
      incentive,
      arrears,
      loanDeduction,
      advanceDeduction,
      isFinalSettlement,
    });

    // Create duplicate check key
    const duplicateCheck = `${employeeId}_${parsedMonth}_${parsedYear}`;

    // Determine initial status
    const config = await prisma.payrollConfiguration.findFirst({
      where: { isActive: true },
    });

    let initialStatus = 'DRAFT';
    if (config?.requireApproval === false) {
      initialStatus = 'APPROVED';
    } else if (config && calculation.netSalary <= Number(config.autoApproveThreshold)) {
      initialStatus = 'APPROVED';
    }

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        month: parsedMonth,
        year: parsedYear,
        duplicateCheck,

        // Salary Structure
        basicSalary: calculation.basicSalary,
        hra: calculation.hra,
        specialAllowance: calculation.specialAllowance,
        conveyanceAllowance: calculation.conveyanceAllowance,
        medicalAllowance: calculation.medicalAllowance,
        otherAllowances: calculation.otherAllowances,

        // Earnings
        overtimePay: calculation.overtimePay,
        bonus: calculation.bonus,
        incentive: calculation.incentive,
        arrears: calculation.arrears,
        leaveEncashment: calculation.leaveEncashment,
        otherEarnings: calculation.otherEarnings,

        // Deductions
        pfDeduction: calculation.pfDeduction,
        esiDeduction: calculation.esiDeduction,
        taxDeduction: calculation.taxDeduction,
        professionalTax: calculation.professionalTax,
        loanDeduction: calculation.loanDeduction,
        advanceDeduction: calculation.advanceDeduction,
        leaveDeduction: calculation.leaveDeduction,
        otherDeductions: calculation.otherDeductions,

        // Attendance
        workingDays: calculation.workingDays,
        presentDays: calculation.presentDays,
        absentDays: calculation.absentDays,
        leaveDays: calculation.leaveDays,
        halfDays: calculation.halfDays,
        overtimeHours: calculation.overtimeHours,
        lateDays: calculation.lateDays,

        // Totals
        grossSalary: calculation.grossSalary,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,

        // Status
        status: initialStatus,
        isFinalSettlement: isFinalSettlement || false,
        isBulkProcessed: false,
        notes,
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

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payroll.id,
        action: 'CREATED',
        performedBy: user.id,
        performedByName: user.name,
        newValues: JSON.stringify({
          netSalary: calculation.netSalary,
          grossSalary: calculation.grossSalary,
          totalDeductions: calculation.totalDeductions,
        }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: payroll,
        calculation,
        message: 'Payroll generated successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error generating payroll:', error);
    
    // Check for database migration error
    if (error.message?.includes('does not exist') || 
        error.message?.includes('column') || 
        error.message?.includes('relation') ||
        error.code === 'P2009' || 
        error.code === 'P2010') {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          message: 'The payroll database schema needs to be updated. Please run: npx prisma migrate dev',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate payroll', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Only ADMIN or PAYROLL_ADMIN can update payroll
  if (user?.role !== 'ADMIN' && user?.role !== 'PAYROLL_ADMIN') {
    return NextResponse.json({ error: 'Only admins can update payroll' }, { status: 403 });
  }

  const body = await request.json();
  const { payrollId, ...updates } = body;

  if (!payrollId) {
    return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
  }

  try {
    // Get existing payroll
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Store previous values for audit
    const previousValues = {
      basicSalary: Number(existingPayroll.basicSalary),
      bonus: Number(existingPayroll.bonus),
      deductions: Number(existingPayroll.totalDeductions),
      netSalary: Number(existingPayroll.netSalary),
      status: existingPayroll.status,
    };

    // Recalculate if attendance or salary data changed
    let calculation;
    if (
      updates.presentDays !== undefined ||
      updates.absentDays !== undefined ||
      updates.baseSalary !== undefined ||
      updates.bonus !== undefined
    ) {
      calculation = await calculatePayroll({
        employeeId: existingPayroll.employeeId,
        month: existingPayroll.month,
        year: existingPayroll.year,
        baseSalary: updates.baseSalary || Number(existingPayroll.basicSalary) / 0.4,
        workingDays: updates.workingDays || existingPayroll.workingDays,
        presentDays: updates.presentDays ?? existingPayroll.presentDays,
        absentDays: updates.absentDays ?? existingPayroll.absentDays,
        leaveDays: updates.leaveDays ?? existingPayroll.leaveDays,
        halfDays: updates.halfDays ?? existingPayroll.halfDays,
        overtimeHours: updates.overtimeHours ?? existingPayroll.overtimeHours,
        lateDays: updates.lateDays ?? existingPayroll.lateDays,
        bonus: updates.bonus,
        incentive: updates.incentive,
        arrears: updates.arrears,
        loanDeduction: updates.loanDeduction,
        advanceDeduction: updates.advanceDeduction,
      });
    }

    // Update payroll
    const payroll = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        ...updates,
        ...(calculation && {
          basicSalary: calculation.basicSalary,
          hra: calculation.hra,
          specialAllowance: calculation.specialAllowance,
          overtimePay: calculation.overtimePay,
          bonus: calculation.bonus,
          grossSalary: calculation.grossSalary,
          totalDeductions: calculation.totalDeductions,
          netSalary: calculation.netSalary,
          pfDeduction: calculation.pfDeduction,
          esiDeduction: calculation.esiDeduction,
          taxDeduction: calculation.taxDeduction,
          leaveDeduction: calculation.leaveDeduction,
        }),
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

    // Create audit log
    await prisma.payrollAuditLog.create({
      data: {
        payrollId: payroll.id,
        action: 'UPDATED',
        performedBy: user.id,
        performedByName: user.name,
        previousValues: JSON.stringify(previousValues),
        newValues: JSON.stringify({
          netSalary: Number(payroll.netSalary),
          grossSalary: Number(payroll.grossSalary),
          status: payroll.status,
          ...updates,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Only ADMIN can delete payroll
  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete payroll' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const payrollId = searchParams.get('id');

  if (!payrollId) {
    return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
  }

  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: { include: { user: true } } },
    });

    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    // Don't allow deletion of approved/paid payroll
    if (['APPROVED', 'PAID'].includes(payroll.status)) {
      return NextResponse.json(
        { error: 'Cannot delete approved or paid payroll. Please reject first.' },
        { status: 400 }
      );
    }

    // Delete payroll (audit logs will cascade)
    await prisma.payroll.delete({
      where: { id: payrollId },
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting payroll:', error);
    return NextResponse.json(
      { error: 'Failed to delete payroll', details: error.message },
      { status: 500 }
    );
  }
}
