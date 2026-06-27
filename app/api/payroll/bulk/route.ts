import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePayroll, checkDuplicatePayroll } from '@/lib/payroll-calculator';

/**
 * Bulk Payroll Processing API
 * Generates payroll for all active employees for a given month
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Only ADMIN or PAYROLL_ADMIN can process bulk payroll
  if (user?.role !== 'ADMIN' && user?.role !== 'PAYROLL_ADMIN') {
    return NextResponse.json({ error: 'Only admins can process bulk payroll' }, { status: 403 });
  }

  const body = await request.json();
  const {
    month,
    year,
    employeeIds, // Optional: specific employees, if not provided process all active
    skipDuplicates = true, // Skip if payroll already exists
    overwriteDuplicates = false, // Overwrite existing payroll
    autoApprove = false, // Auto-approve generated payroll
  } = body;

  if (!month) {
    return NextResponse.json({ error: 'Month is required (YYYY-MM format)' }, { status: 400 });
  }

  const parsedYear = year || parseInt(month.split('-')[0]);
  const parsedMonth = month;

  try {
    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: {
        ...(employeeIds && employeeIds.length > 0
          ? { id: { in: employeeIds } }
          : { status: 'ACTIVE' }),
      },
      include: {
        user: true,
        department: true,
      },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found', employees: [] },
        { status: 404 }
      );
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Process each employee
    for (const employee of employees) {
      try {
        // Check for duplicate
        const duplicate = await checkDuplicatePayroll(employee.id, parsedMonth, parsedYear);

        if (duplicate.exists && skipDuplicates && !overwriteDuplicates) {
          duplicateCount++;
          results.push({
            employeeId: employee.id,
            employeeName: employee.user.name,
            status: 'SKIPPED',
            message: 'Payroll already exists for this month',
            payrollId: duplicate.payrollId,
          });
          continue;
        }

        // If overwriting, delete existing payroll
        if (duplicate.exists && overwriteDuplicates) {
          await prisma.payroll.delete({
            where: { id: duplicate.payrollId! },
          });
        }

        // Calculate payroll
        const calculation = await calculatePayroll({
          employeeId: employee.id,
          month: parsedMonth,
          year: parsedYear,
          baseSalary: Number(employee.salary),
        });

        // Create duplicate check key
        const duplicateCheck = `${employee.id}_${parsedMonth}_${parsedYear}`;

        // Create payroll record
        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
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
            status: autoApprove ? 'APPROVED' : 'DRAFT',
            isBulkProcessed: true,
            isFinalSettlement: false,
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
              isBulkProcessed: true,
            }),
          },
        });

        successCount++;
        results.push({
          employeeId: employee.id,
          employeeName: employee.user.name,
          status: 'SUCCESS',
          payrollId: payroll.id,
          netSalary: calculation.netSalary,
          grossSalary: calculation.grossSalary,
          totalDeductions: calculation.totalDeductions,
        });
      } catch (error: any) {
        errorCount++;
        errors.push({
          employeeId: employee.id,
          employeeName: employee.user.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: employees.length,
        success: successCount,
        duplicates: duplicateCount,
        errors: errorCount,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Bulk payroll processed: ${successCount} successful, ${duplicateCount} duplicates, ${errorCount} errors`,
    });
  } catch (error: any) {
    console.error('Error in bulk payroll processing:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk payroll', details: error.message },
      { status: 500 }
    );
  }
}
