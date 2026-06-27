/**
 * Payroll Calculator Utility
 * Handles all payroll calculations including:
 * - Attendance-based salary
 * - Leave deductions
 * - Tax calculations (TDS, PF, ESI)
 * - Overtime calculations
 * - Bonus and incentives
 */

import { prisma } from './prisma';

export interface PayrollInput {
  employeeId: string;
  month: string;
  year: number;
  baseSalary?: number;
  workingDays?: number;
  presentDays?: number;
  absentDays?: number;
  leaveDays?: number;
  halfDays?: number;
  overtimeHours?: number;
  lateDays?: number;
  bonus?: number;
  incentive?: number;
  arrears?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  isFinalSettlement?: boolean;
  leaveEncashmentDays?: number;
}

export interface PayrollResult {
  // Salary Structure
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;

  // Earnings
  overtimePay: number;
  bonus: number;
  incentive: number;
  arrears: number;
  leaveEncashment: number;
  otherEarnings: number;

  // Deductions
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
  professionalTax: number;
  loanDeduction: number;
  advanceDeduction: number;
  leaveDeduction: number;
  otherDeductions: number;

  // Attendance
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  overtimeHours: number;
  lateDays: number;

  // Totals
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;

  // Calculations breakdown
  calculations: {
    perDaySalary: number;
    perHourSalary: number;
    attendanceRatio: number;
    taxableIncome: number;
    pfEmployerContribution: number;
    esiEmployerContribution: number;
  };
}

export interface PayrollConfig {
  workingDaysPerMonth: number;
  workingDaysPerWeek: number;
  dailyHours: number;
  overtimeRate: number;
  unpaidLeaveDeduction: number;
  halfDayDeduction: number;
  lateThreshold: number;
  lateDeductionDays: number;
  pfEmployeeRate: number;
  pfEmployerRate: number;
  pfMaxSalary: number;
  esiEmployeeRate: number;
  esiEmployerRate: number;
  esiMaxSalary: number;
  professionalTax: number;
  tdsBasicExemption: number;
  tdsRebateLimit: number;
  bonusPercentage: number;
  bonusMinAmount: number;
  lateFinePerDay: number;
  requireApproval: boolean;
  autoApproveThreshold: number;
  noticePeriodDays: number;
  leaveEncashmentDays: number;
}

const DEFAULT_CONFIG: PayrollConfig = {
  workingDaysPerMonth: 26,
  workingDaysPerWeek: 6,
  dailyHours: 8,
  overtimeRate: 2,
  unpaidLeaveDeduction: 1,
  halfDayDeduction: 0.5,
  lateThreshold: 3,
  lateDeductionDays: 1,
  pfEmployeeRate: 12,
  pfEmployerRate: 12,
  pfMaxSalary: 15000,
  esiEmployeeRate: 0.75,
  esiEmployerRate: 3.25,
  esiMaxSalary: 21000,
  professionalTax: 200,
  tdsBasicExemption: 300000,
  tdsRebateLimit: 500000,
  bonusPercentage: 8.33,
  bonusMinAmount: 0,
  lateFinePerDay: 100,
  requireApproval: true,
  autoApproveThreshold: 0,
  noticePeriodDays: 30,
  leaveEncashmentDays: 30,
};

/**
 * Get payroll configuration from database or use defaults
 */
export async function getPayrollConfig(): Promise<PayrollConfig> {
  const config = await prisma.payrollConfiguration.findFirst({
    where: { isActive: true },
  });

  if (!config) {
    return DEFAULT_CONFIG;
  }

  return {
    workingDaysPerMonth: config.workingDaysPerMonth,
    workingDaysPerWeek: config.workingDaysPerWeek,
    dailyHours: config.dailyHours,
    overtimeRate: config.overtimeRate,
    unpaidLeaveDeduction: config.unpaidLeaveDeduction,
    halfDayDeduction: config.halfDayDeduction,
    lateThreshold: config.lateThreshold,
    lateDeductionDays: config.lateDeductionDays,
    pfEmployeeRate: config.pfEmployeeRate,
    pfEmployerRate: config.pfEmployerRate,
    pfMaxSalary: Number(config.pfMaxSalary),
    esiEmployeeRate: config.esiEmployeeRate,
    esiEmployerRate: config.esiEmployerRate,
    esiMaxSalary: Number(config.esiMaxSalary),
    professionalTax: Number(config.professionalTax),
    tdsBasicExemption: Number(config.tdsBasicExemption),
    tdsRebateLimit: Number(config.tdsRebateLimit),
    bonusPercentage: config.bonusPercentage,
    bonusMinAmount: Number(config.bonusMinAmount),
    lateFinePerDay: Number(config.lateFinePerDay),
    requireApproval: config.requireApproval,
    autoApproveThreshold: Number(config.autoApproveThreshold),
    noticePeriodDays: config.noticePeriodDays,
    leaveEncashmentDays: config.leaveEncashmentDays,
  };
}

/**
 * Calculate salary structure components
 */
function calculateSalaryStructure(
  baseSalary: number,
  config: PayrollConfig
): {
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  otherAllowances: number;
} {
  // Standard salary structure (40-20-40 rule)
  const basicSalaryCalc = baseSalary * 0.4; // 40% of CTC
  const hra = basicSalaryCalc * 0.4; // 40% of Basic (HRA)
  const conveyanceAllowance = 1600; // Standard conveyance (tax-exempt up to this limit)
  const medicalAllowance = 1250; // Standard medical allowance
  const specialAllowance = baseSalary - basicSalaryCalc - hra - conveyanceAllowance - medicalAllowance;

  return {
    basicSalary: Math.round(basicSalaryCalc * 100) / 100,
    hra: Math.round(hra * 100) / 100,
    specialAllowance: Math.round(Math.max(0, specialAllowance) * 100) / 100,
    conveyanceAllowance,
    medicalAllowance,
    otherAllowances: 0,
  };
}

/**
 * Calculate attendance-based salary
 */
function calculateAttendanceBasedSalary(
  salaryStructure: { basicSalary: number; hra: number; specialAllowance: number; conveyanceAllowance: number; medicalAllowance: number; otherAllowances: number },
  workingDays: number,
  presentDays: number,
  leaveDays: number,
  halfDays: number,
  absentDays: number,
  config: PayrollConfig
): { grossSalary: number; leaveDeduction: number; perDaySalary: number; attendanceRatio: number } {
  const totalMonthlySalary =
    salaryStructure.basicSalary +
    salaryStructure.hra +
    salaryStructure.specialAllowance +
    salaryStructure.conveyanceAllowance +
    salaryStructure.medicalAllowance +
    salaryStructure.otherAllowances;

  const perDaySalary = totalMonthlySalary / config.workingDaysPerMonth;
  
  // Calculate effective working days (half days count as 0.5)
  const effectivePresentDays = presentDays + (halfDays * 0.5);
  const attendanceRatio = workingDays > 0 ? effectivePresentDays / workingDays : 1;

  // Calculate leave deduction for unpaid leaves
  const paidLeaveDays = leaveDays; // Assuming all leave days are paid (from leave balance)
  const unpaidLeaveDays = absentDays;
  const leaveDeduction = unpaidLeaveDays * perDaySalary * config.unpaidLeaveDeduction;

  // Gross salary with attendance adjustment
  const grossSalary = totalMonthlySalary * attendanceRatio - leaveDeduction;

  return {
    grossSalary: Math.round(grossSalary * 100) / 100,
    leaveDeduction: Math.round(leaveDeduction * 100) / 100,
    perDaySalary: Math.round(perDaySalary * 100) / 100,
    attendanceRatio: Math.round(attendanceRatio * 1000) / 1000,
  };
}

/**
 * Calculate overtime pay
 */
function calculateOvertimePay(
  basicSalary: number,
  overtimeHours: number,
  config: PayrollConfig
): number {
  if (overtimeHours <= 0) return 0;

  const perHourSalary = basicSalary / (config.workingDaysPerMonth * config.dailyHours);
  const overtimePay = overtimeHours * perHourSalary * config.overtimeRate;

  return Math.round(overtimePay * 100) / 100;
}

/**
 * Calculate Provident Fund deduction
 */
function calculatePF(basicSalary: number, config: PayrollConfig): { employee: number; employer: number } {
  const pfApplicableSalary = Math.min(basicSalary, config.pfMaxSalary);
  const employeePF = (pfApplicableSalary * config.pfEmployeeRate) / 100;
  const employerPF = (pfApplicableSalary * config.pfEmployerRate) / 100;

  return {
    employee: Math.round(employeePF * 100) / 100,
    employer: Math.round(employerPF * 100) / 100,
  };
}

/**
 * Calculate ESI deduction
 */
function calculateESI(grossSalary: number, config: PayrollConfig): { employee: number; employer: number } {
  if (grossSalary > config.esiMaxSalary) {
    return { employee: 0, employer: 0 };
  }

  const employeeESI = (grossSalary * config.esiEmployeeRate) / 100;
  const employerESI = (grossSalary * config.esiEmployerRate) / 100;

  return {
    employee: Math.round(employeeESI * 100) / 100,
    employer: Math.round(employerESI * 100) / 100,
  };
}

/**
 * Calculate income tax (TDS) - Simplified calculation
 */
function calculateTax(
  annualGrossSalary: number,
  config: PayrollConfig,
  taxRegime: 'OLD' | 'NEW' = 'NEW'
): number {
  let taxableIncome = annualGrossSalary;
  let tax = 0;

  if (taxRegime === 'NEW') {
    // New Tax Regime (FY 2023-24)
    const standardDeduction = 50000;
    taxableIncome = annualGrossSalary - standardDeduction;

    if (taxableIncome <= config.tdsBasicExemption) {
      tax = 0;
    } else if (taxableIncome <= 600000) {
      tax = (taxableIncome - config.tdsBasicExemption) * 0.05;
    } else if (taxableIncome <= 900000) {
      tax = 15000 + (taxableIncome - 600000) * 0.1;
    } else if (taxableIncome <= 1200000) {
      tax = 45000 + (taxableIncome - 900000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 90000 + (taxableIncome - 1200000) * 0.2;
    } else {
      tax = 150000 + (taxableIncome - 1500000) * 0.3;
    }

    // Rebate under 87A
    if (taxableIncome <= config.tdsRebateLimit && tax <= 25000) {
      tax = 0;
    }
  } else {
    // Old Tax Regime
    const standardDeduction = 50000;
    taxableIncome = annualGrossSalary - standardDeduction;

    // Basic exemption
    if (taxableIncome <= config.tdsBasicExemption) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - config.tdsBasicExemption) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.2;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.3;
    }

    // Rebate under 87A
    if (taxableIncome <= config.tdsRebateLimit && tax <= 12500) {
      tax = 0;
    }
  }

  // Add 4% cess
  const cess = tax * 0.04;
  tax = tax + cess;

  // Monthly TDS
  return Math.round((tax / 12) * 100) / 100;
}

/**
 * Calculate bonus (as per Payment of Bonus Act)
 */
function calculateBonus(
  basicSalary: number,
  customBonus?: number,
  config?: PayrollConfig
): number {
  if (customBonus !== undefined && customBonus > 0) {
    return customBonus;
  }

  if (!config) return 0;

  // Minimum bonus as per Payment of Bonus Act (8.33% of annual basic)
  const annualBasic = basicSalary * 12;
  const minBonus = (annualBasic * config.bonusPercentage) / 100;

  return Math.round((minBonus / 12) * 100) / 100;
}

/**
 * Calculate late fine
 */
function calculateLateFine(
  lateDays: number,
  config: PayrollConfig
): number {
  if (lateDays <= config.lateThreshold) return 0;

  const deductibleLateDays = lateDays - config.lateThreshold;
  const lateFine = Math.ceil(deductibleLateDays / config.lateDeductionDays) * config.lateFinePerDay;

  return Math.round(lateFine * 100) / 100;
}

/**
 * Calculate final settlement (Full & Final)
 */
function calculateFinalSettlement(
  salaryStructure: { basicSalary: number; hra: number; specialAllowance: number; conveyanceAllowance: number; medicalAllowance: number; otherAllowances: number },
  leaveBalance: number,
  noticePeriodServed: boolean,
  config: PayrollConfig
): { leaveEncashment: number; noticePeriodRecovery: number; totalSettlement: number } {
  const totalMonthlySalary =
    salaryStructure.basicSalary +
    salaryStructure.hra +
    salaryStructure.specialAllowance +
    salaryStructure.conveyanceAllowance +
    salaryStructure.medicalAllowance +
    salaryStructure.otherAllowances;

  const perDaySalary = totalMonthlySalary / config.workingDaysPerMonth;

  // Leave encashment for unused leaves
  const leaveEncashment = leaveBalance * perDaySalary;

  // Notice period recovery if not served
  const noticePeriodRecovery = !noticePeriodServed
    ? config.noticePeriodDays * perDaySalary
    : 0;

  const totalSettlement = leaveEncashment - noticePeriodRecovery;

  return {
    leaveEncashment: Math.round(leaveEncashment * 100) / 100,
    noticePeriodRecovery: Math.round(noticePeriodRecovery * 100) / 100,
    totalSettlement: Math.round(totalSettlement * 100) / 100,
  };
}

/**
 * Main payroll calculation function
 */
export async function calculatePayroll(input: PayrollInput): Promise<PayrollResult> {
  const config = await getPayrollConfig();

  // Get employee's salary or use provided base salary
  let baseSalary = input.baseSalary;
  if (!baseSalary) {
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
      select: { salary: true },
    });
    baseSalary = Number(employee?.salary) || 0;
  }

  // Calculate salary structure
  const salaryStructure = calculateSalaryStructure(baseSalary, config);

  // Get attendance data if not provided
  let workingDays = input.workingDays || config.workingDaysPerMonth;
  let presentDays = input.presentDays || 0;
  let absentDays = input.absentDays || 0;
  let leaveDays = input.leaveDays || 0;
  let halfDays = input.halfDays || 0;
  let overtimeHours = input.overtimeHours || 0;
  let lateDays = input.lateDays || 0;

  // Fetch attendance from database if not provided
  if (!input.presentDays && !input.workingDays) {
    const [year, month] = input.month.split('-').map(Number);
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: input.employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      workingDays = attendance.filter(a => 
        a.status === 'PRESENT' || a.status === 'WFH' || a.status === 'LATE' || a.status === 'EARLY_CHECKOUT'
      ).length;
      
      presentDays = attendance.filter(a => 
        a.status === 'PRESENT' || a.status === 'WFH'
      ).length;
      
      absentDays = attendance.filter(a => a.status === 'ABSENT').length;
      leaveDays = attendance.filter(a => a.status === 'ON_LEAVE').length;
      halfDays = attendance.filter(a => a.status === 'HALF_DAY').length;
      lateDays = attendance.filter(a => a.status === 'LATE' || a.status === 'EARLY_CHECKOUT').length;

      // Calculate overtime from working hours
      const totalWorkingHours = attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
      const expectedHours = presentDays * config.dailyHours;
      overtimeHours = Math.max(0, totalWorkingHours - expectedHours);
    }
  }

  // Calculate attendance-based salary
  const attendanceCalc = calculateAttendanceBasedSalary(
    salaryStructure,
    workingDays,
    presentDays,
    leaveDays,
    halfDays,
    absentDays,
    config
  );

  // Calculate overtime pay
  const overtimePay = calculateOvertimePay(salaryStructure.basicSalary, overtimeHours, config);

  // Calculate bonus
  const bonus = calculateBonus(salaryStructure.basicSalary, input.bonus, config);

  // Calculate PF
  const pf = calculatePF(salaryStructure.basicSalary, config);

  // Calculate ESI
  const esi = calculateESI(attendanceCalc.grossSalary, config);

  // Calculate tax (monthly)
  const annualGross = attendanceCalc.grossSalary * 12 + bonus * 12 + overtimePay * 12;
  const taxDeduction = calculateTax(annualGross, config);

  // Calculate late fine
  const lateFine = calculateLateFine(lateDays, config);

  // Calculate final settlement if applicable
  let leaveEncashment = 0;
  if (input.isFinalSettlement) {
    const leaveBalance = await prisma.leaveBalance.findMany({
      where: {
        employeeId: input.employeeId,
      },
    });
    const totalLeaveDays = leaveBalance.reduce((sum, lb) => sum + lb.remainingDays, 0);
    
    const settlement = calculateFinalSettlement(
      salaryStructure,
      totalLeaveDays,
      true, // Assuming notice period served
      config
    );
    leaveEncashment = settlement.leaveEncashment;
  }

  // Calculate total earnings
  const otherEarnings = (input.arrears || 0) + (input.incentive || 0);
  const totalEarnings =
    attendanceCalc.grossSalary +
    overtimePay +
    bonus +
    (input.incentive || 0) +
    (input.arrears || 0) +
    leaveEncashment;

  // Calculate total deductions
  const loanDeduction = input.loanDeduction || 0;
  const advanceDeduction = input.advanceDeduction || 0;
  const totalDeductions =
    pf.employee +
    esi.employee +
    taxDeduction +
    config.professionalTax +
    loanDeduction +
    advanceDeduction +
    attendanceCalc.leaveDeduction +
    lateFine;

  // Net salary
  const netSalary = totalEarnings - totalDeductions;

  return {
    // Salary Structure
    basicSalary: salaryStructure.basicSalary,
    hra: salaryStructure.hra,
    specialAllowance: salaryStructure.specialAllowance,
    conveyanceAllowance: salaryStructure.conveyanceAllowance,
    medicalAllowance: salaryStructure.medicalAllowance,
    otherAllowances: salaryStructure.otherAllowances,

    // Earnings
    overtimePay,
    bonus,
    incentive: input.incentive || 0,
    arrears: input.arrears || 0,
    leaveEncashment,
    otherEarnings,

    // Deductions
    pfDeduction: pf.employee,
    esiDeduction: esi.employee,
    taxDeduction,
    professionalTax: config.professionalTax,
    loanDeduction,
    advanceDeduction,
    leaveDeduction: attendanceCalc.leaveDeduction,
    otherDeductions: lateFine,

    // Attendance
    workingDays,
    presentDays,
    absentDays,
    leaveDays,
    halfDays,
    overtimeHours,
    lateDays,

    // Totals
    grossSalary: Math.round(totalEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,

    // Calculations breakdown
    calculations: {
      perDaySalary: attendanceCalc.perDaySalary,
      perHourSalary: Math.round((salaryStructure.basicSalary / (config.workingDaysPerMonth * config.dailyHours)) * 100) / 100,
      attendanceRatio: attendanceCalc.attendanceRatio,
      taxableIncome: Math.round((totalEarnings * 12 - config.tdsBasicExemption) * 100) / 100,
      pfEmployerContribution: pf.employer,
      esiEmployerContribution: esi.employer,
    },
  };
}

/**
 * Validate payroll for duplicate entry
 */
export async function checkDuplicatePayroll(
  employeeId: string,
  month: string,
  year: number
): Promise<{ exists: boolean; payrollId?: string }> {
  const duplicateCheck = `${employeeId}_${month}_${year}`;
  
  const existing = await prisma.payroll.findFirst({
    where: {
      duplicateCheck,
    },
    select: { id: true },
  });

  return {
    exists: !!existing,
    payrollId: existing?.id,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format month for display
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year - 1 || 0, (month || 1) - 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
