import { prisma } from '@/lib/prisma';
import { calculatePayroll, checkDuplicatePayroll } from '@/lib/payroll-calculator';

export interface PayrollGenerateInput {
  employeeId: string;
  month: string;
  bonus?: number;
  incentive?: number;
  arrears?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  overtimeHours?: number;
}

export async function generatePayroll(payload: PayrollGenerateInput) {
  const { employeeId, month, bonus = 0, incentive = 0, arrears = 0, loanDeduction = 0, advanceDeduction = 0, overtimeHours = 0 } = payload;

  // Check if employee exists
  const employee = await prisma.employee.findUnique({ 
    where: { id: employeeId },
    include: { user: true }
  });
  
  if (!employee) throw new Error('Employee not found');

  // Parse year and month
  const parsedYear = parseInt(month.split('-')[0]);
  const parsedMonth = month;

  // Check for duplicate
  const duplicate = await checkDuplicatePayroll(employeeId, parsedMonth, parsedYear);
  if (duplicate.exists) {
    throw new Error('Payroll already exists for this employee and month');
  }

  // Calculate payroll using the calculator utility
  const calculation = await calculatePayroll({
    employeeId,
    month: parsedMonth,
    year: parsedYear,
    baseSalary: Number(employee.salary),
    bonus,
    incentive,
    arrears,
    loanDeduction,
    advanceDeduction,
    overtimeHours,
  });

  // Create duplicate check key
  const duplicateCheck = `${employeeId}_${parsedMonth}_${parsedYear}`;

  // Create payroll record
  return prisma.payroll.create({
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
      status: 'DRAFT',
      isBulkProcessed: false,
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
}

export async function getPayrollByEmployee(employeeId: string, month?: string) {
  return prisma.payroll.findMany({
    where: {
      employeeId,
      ...(month && { month }),
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
}

export async function approvePayroll(payrollId: string, approvedBy: string) {
  return prisma.payroll.update({
    where: { id: payrollId },
    data: {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
    },
  });
}

export async function rejectPayroll(payrollId: string, rejectedBy: string, reason: string) {
  return prisma.payroll.update({
    where: { id: payrollId },
    data: {
      status: 'REJECTED',
      approvedBy: rejectedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    },
  });
}

export async function markAsPaid(payrollId: string, paymentReference?: string) {
  return prisma.payroll.update({
    where: { id: payrollId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paymentReference: paymentReference || null,
    },
  });
}
