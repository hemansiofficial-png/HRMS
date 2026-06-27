import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Payroll Audit & Compliance Reports API
 * Provides various statutory and compliance reports
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'PAYROLL_ADMIN' && user?.role !== 'HR_MANAGER') {
    return NextResponse.json({ error: 'Unauthorized to view reports' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!reportType) {
    return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
  }

  try {
    switch (reportType) {
      case 'PF_REPORT':
        return await getPFReport(month ?? undefined, year ?? undefined);
      case 'ESI_REPORT':
        return await getESIReport(month ?? undefined, year ?? undefined);
      case 'TDS_REPORT':
        return await getTDSReport(year ?? undefined);
      case 'PROFESSIONAL_TAX_REPORT':
        return await getProfessionalTaxReport(month ?? undefined, year ?? undefined);
      case 'PAYROLL_REGISTER':
        return await getPayrollRegister(month ?? undefined, year ?? undefined);
      case 'ATTENDANCE_SUMMARY':
        return await getAttendanceSummary(month ?? undefined, year ?? undefined);
      case 'LEAVE_DEDUCTION_REPORT':
        return await getLeaveDeductionReport(month ?? undefined, year ?? undefined);
      case 'OVERTIME_REPORT':
        return await getOvertimeReport(month ?? undefined, year ?? undefined);
      case 'AUDIT_LOG':
        return await getAuditLog(startDate ?? undefined, endDate ?? undefined);
      case 'SALARY_BAND_REPORT':
        return await getSalaryBandReport(year ?? undefined);
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PF Report - Provident Fund Summary
 */
async function getPFReport(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      status: { in: ['APPROVED', 'PAID'] },
    },
    include: {
      employee: {
        include: {
          user: true,
          department: true,
          personalInfo: true,
        },
      },
    },
  });

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    panNumber: p.employee.personalInfo?.panNumber || 'N/A',
    uanNumber: p.employee.personalInfo?.aadharNumber || 'N/A', // Using Aadhar as placeholder for UAN
    basicSalary: Number(p.basicSalary),
    pfDeduction: Number(p.pfDeduction),
    pfEmployerContribution: Number(p.pfDeduction), // Simplified - same as employee
    totalPF: Number(p.pfDeduction) * 2,
    month: p.month,
  }));

  const totals = {
    totalBasicSalary: report.reduce((sum, r) => sum + r.basicSalary, 0),
    totalEmployeePF: report.reduce((sum, r) => sum + r.pfDeduction, 0),
    totalEmployerPF: report.reduce((sum, r) => sum + r.pfEmployerContribution, 0),
    totalPF: report.reduce((sum, r) => sum + r.totalPF, 0),
  };

  return NextResponse.json({
    reportType: 'PF_REPORT',
    period: month || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * ESI Report - Employee State Insurance
 */
async function getESIReport(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      status: { in: ['APPROVED', 'PAID'] },
      esiDeduction: { gt: 0 },
    },
    include: {
      employee: {
        include: {
          user: true,
          personalInfo: true,
        },
      },
    },
  });

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    ipNumber: p.employee.personalInfo?.aadharNumber || 'N/A', // Using Aadhar as placeholder
    grossSalary: Number(p.grossSalary),
    esiDeduction: Number(p.esiDeduction),
    esiEmployerContribution: Number(p.esiDeduction) * 4.33, // Approx employer contribution
    totalESI: Number(p.esiDeduction) + Number(p.esiDeduction) * 4.33,
    month: p.month,
  }));

  const totals = {
    totalGrossSalary: report.reduce((sum, r) => sum + r.grossSalary, 0),
    totalEmployeeESI: report.reduce((sum, r) => sum + r.esiDeduction, 0),
    totalEmployerESI: report.reduce((sum, r) => sum + r.esiEmployerContribution, 0),
    totalESI: report.reduce((sum, r) => sum + r.totalESI, 0),
  };

  return NextResponse.json({
    reportType: 'ESI_REPORT',
    period: month || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * TDS Report - Tax Deducted at Source
 */
async function getTDSReport(year?: string | null) {
  const whereClause: any = {};
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      status: { in: ['APPROVED', 'PAID'] },
      taxDeduction: { gt: 0 },
    },
    include: {
      employee: {
        include: {
          user: true,
          personalInfo: true,
        },
      },
    },
  });

  // Group by employee
  const employeeData = new Map();
  payrolls.forEach((p) => {
    const empId = p.employeeId;
    if (!employeeData.has(empId)) {
      employeeData.set(empId, {
        employeeCode: p.employee.employeeCode,
        employeeName: p.employee.user.name,
        panNumber: p.employee.personalInfo?.panNumber || 'N/A',
        totalGrossSalary: 0,
        totalTaxDeduction: 0,
        months: [],
      });
    }
    const emp = employeeData.get(empId);
    emp.totalGrossSalary += Number(p.grossSalary);
    emp.totalTaxDeduction += Number(p.taxDeduction);
    emp.months.push({
      month: p.month,
      grossSalary: Number(p.grossSalary),
      taxDeduction: Number(p.taxDeduction),
    });
  });

  const report = Array.from(employeeData.values());
  const totals = {
    totalGrossSalary: report.reduce((sum: any, r) => sum + r.totalGrossSalary, 0),
    totalTaxDeduction: report.reduce((sum: any, r) => sum + r.totalTaxDeduction, 0),
  };

  return NextResponse.json({
    reportType: 'TDS_REPORT',
    period: year || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * Professional Tax Report
 */
async function getProfessionalTaxReport(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      status: { in: ['APPROVED', 'PAID'] },
    },
    include: {
      employee: {
        include: {
          user: true,
          personalInfo: true,
        },
      },
    },
  });

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    panNumber: p.employee.personalInfo?.panNumber || 'N/A',
    grossSalary: Number(p.grossSalary),
    professionalTax: Number(p.professionalTax),
    month: p.month,
  }));

  const totals = {
    totalGrossSalary: report.reduce((sum, r) => sum + r.grossSalary, 0),
    totalProfessionalTax: report.reduce((sum, r) => sum + r.professionalTax, 0),
  };

  return NextResponse.json({
    reportType: 'PROFESSIONAL_TAX_REPORT',
    period: month || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * Payroll Register - Complete Summary
 */
async function getPayrollRegister(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: whereClause,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
    },
    orderBy: { employee: { employeeCode: 'asc' } },
  });

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    department: p.employee.department?.name || 'N/A',
    designation: p.employee.designation,
    status: p.status,
    workingDays: p.workingDays,
    presentDays: p.presentDays,
    absentDays: p.absentDays,
    leaveDays: p.leaveDays,
    overtimeHours: p.overtimeHours,
    basicSalary: Number(p.basicSalary),
    hra: Number(p.hra),
    grossSalary: Number(p.grossSalary),
    totalDeductions: Number(p.totalDeductions),
    netSalary: Number(p.netSalary),
    month: p.month,
    isFinalSettlement: p.isFinalSettlement,
  }));

  const totals = {
    totalEmployees: report.length,
    totalGrossSalary: report.reduce((sum, r) => sum + r.grossSalary, 0),
    totalDeductions: report.reduce((sum, r) => sum + r.totalDeductions, 0),
    totalNetSalary: report.reduce((sum, r) => sum + r.netSalary, 0),
  };

  return NextResponse.json({
    reportType: 'PAYROLL_REGISTER',
    period: month || 'All',
    data: report,
    totals,
  });
}

/**
 * Attendance Summary Report
 */
async function getAttendanceSummary(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: whereClause,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
    },
  });

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    department: p.employee.department?.name || 'N/A',
    workingDays: p.workingDays,
    presentDays: p.presentDays,
    absentDays: p.absentDays,
    leaveDays: p.leaveDays,
    halfDays: p.halfDays,
    lateDays: p.lateDays,
    overtimeHours: p.overtimeHours,
    attendancePercentage: p.workingDays > 0 
      ? Math.round(((p.presentDays + p.leaveDays) / p.workingDays) * 100) 
      : 0,
    month: p.month,
  }));

  return NextResponse.json({
    reportType: 'ATTENDANCE_SUMMARY',
    period: month || 'All',
    data: report,
    count: report.length,
  });
}

/**
 * Leave Deduction Report
 */
async function getLeaveDeductionReport(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      leaveDeduction: { gt: 0 },
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

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    department: p.employee.department?.name || 'N/A',
    leaveDays: p.leaveDays,
    absentDays: p.absentDays,
    halfDays: p.halfDays,
    leaveDeduction: Number(p.leaveDeduction),
    perDaySalary: p.workingDays > 0 ? Number(p.grossSalary) / p.workingDays : 0,
    month: p.month,
  }));

  const totals = {
    totalLeaveDeduction: report.reduce((sum, r) => sum + r.leaveDeduction, 0),
  };

  return NextResponse.json({
    reportType: 'LEAVE_DEDUCTION_REPORT',
    period: month || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * Overtime Report
 */
async function getOvertimeReport(month?: string | null, year?: string | null) {
  const whereClause: any = {};
  if (month) whereClause.month = month;
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: {
      ...whereClause,
      overtimeHours: { gt: 0 },
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

  const report = payrolls.map((p) => ({
    employeeCode: p.employee.employeeCode,
    employeeName: p.employee.user.name,
    department: p.employee.department?.name || 'N/A',
    overtimeHours: p.overtimeHours,
    overtimePay: Number(p.overtimePay),
    perHourRate: p.overtimeHours > 0 
      ? Number(p.overtimePay) / p.overtimeHours 
      : 0,
    month: p.month,
  }));

  const totals = {
    totalOvertimeHours: report.reduce((sum, r) => sum + r.overtimeHours, 0),
    totalOvertimePay: report.reduce((sum, r) => sum + r.overtimePay, 0),
  };

  return NextResponse.json({
    reportType: 'OVERTIME_REPORT',
    period: month || 'All',
    data: report,
    totals,
    count: report.length,
  });
}

/**
 * Audit Log Report
 */
async function getAuditLog(startDate?: string | null, endDate?: string | null) {
  const whereClause: any = {};
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const auditLogs = await prisma.payrollAuditLog.findMany({
    where: whereClause,
    include: {
      payroll: {
        include: {
          employee: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const report = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    performedBy: log.performedByName,
    employeeName: log.payroll?.employee?.user.name || 'N/A',
    payrollMonth: log.payroll?.month || 'N/A',
    timestamp: log.createdAt,
    previousValues: log.previousValues ? JSON.parse(log.previousValues) : null,
    newValues: log.newValues ? JSON.parse(log.newValues) : null,
  }));

  return NextResponse.json({
    reportType: 'AUDIT_LOG',
    period: startDate && endDate ? `${startDate} to ${endDate}` : 'Recent',
    data: report,
    count: report.length,
  });
}

/**
 * Salary Band Report
 */
async function getSalaryBandReport(year?: string | null) {
  const whereClause: any = {};
  if (year) whereClause.year = parseInt(year);

  const payrolls = await prisma.payroll.findMany({
    where: whereClause,
    include: {
      employee: {
        include: {
          user: true,
          department: true,
        },
      },
    },
  });

  // Get latest payroll for each employee
  const latestPayrolls = new Map();
  payrolls.forEach((p) => {
    const empId = p.employeeId;
    if (!latestPayrolls.has(empId) || p.month > latestPayrolls.get(empId).month) {
      latestPayrolls.set(empId, p);
    }
  });

  // Categorize into salary bands
  const bands = {
    'Below 3L': { count: 0, employees: [] as any[] },
    '3L - 5L': { count: 0, employees: [] as any[] },
    '5L - 8L': { count: 0, employees: [] as any[] },
    '8L - 12L': { count: 0, employees: [] as any[] },
    '12L - 20L': { count: 0, employees: [] as any[] },
    'Above 20L': { count: 0, employees: [] as any[] },
  };

  latestPayrolls.forEach((p) => {
    const annualCTC = Number(p.grossSalary) * 12;
    const emp = {
      employeeCode: p.employee.employeeCode,
      employeeName: p.employee.user.name,
      department: p.employee.department?.name || 'N/A',
      designation: p.employee.designation,
      annualCTC,
    };

    if (annualCTC < 300000) {
      bands['Below 3L'].count++;
      bands['Below 3L'].employees.push(emp);
    } else if (annualCTC < 500000) {
      bands['3L - 5L'].count++;
      bands['3L - 5L'].employees.push(emp);
    } else if (annualCTC < 800000) {
      bands['5L - 8L'].count++;
      bands['5L - 8L'].employees.push(emp);
    } else if (annualCTC < 1200000) {
      bands['8L - 12L'].count++;
      bands['8L - 12L'].employees.push(emp);
    } else if (annualCTC < 2000000) {
      bands['12L - 20L'].count++;
      bands['12L - 20L'].employees.push(emp);
    } else {
      bands['Above 20L'].count++;
      bands['Above 20L'].employees.push(emp);
    }
  });

  return NextResponse.json({
    reportType: 'SALARY_BAND_REPORT',
    period: year || 'Current',
    data: bands,
    totalEmployees: Array.from(latestPayrolls.values()).length,
  });
}
