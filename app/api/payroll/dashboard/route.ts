import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has payroll privileges
    const allowedRoles = ['PAYROLL_ADMIN', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: true
      }
    });

    if (!user?.employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

    // Total employees with salary structure
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE',
        salary: {
          gt: 0
        }
      }
    });

    // Payroll stats for current month
    const currentMonthPayroll = await prisma.payroll.findMany({
      where: {
        month: currentMonth
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    // Calculate totals
    const totalGrossSalary = currentMonthPayroll.reduce((sum, p) => sum + Number(p.grossSalary), 0);
    const totalDeductions = currentMonthPayroll.reduce((sum, p) => sum + Number(p.totalDeductions), 0);
    const totalNetSalary = currentMonthPayroll.reduce((sum, p) => sum + Number(p.netSalary), 0);

    // Status counts
    const pendingApproval = currentMonthPayroll.filter(p => 
      p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL'
    ).length;

    const approved = currentMonthPayroll.filter(p => p.status === 'APPROVED').length;
    const paid = currentMonthPayroll.filter(p => p.status === 'PAID').length;
    const rejected = currentMonthPayroll.filter(p => p.status === 'REJECTED').length;

    // Previous month comparison
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
    const lastMonthPayroll = await prisma.payroll.findMany({
      where: {
        month: lastMonth
      }
    });

    const lastMonthTotal = lastMonthPayroll.reduce((sum, p) => sum + Number(p.netSalary), 0);
    const monthOverMonthChange = lastMonthTotal > 0 
      ? (((totalNetSalary - lastMonthTotal) / lastMonthTotal) * 100).toFixed(2)
      : '0';

    // Department-wise salary distribution
    const departmentWiseSalary = await prisma.department.findMany({
      include: {
        employees: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            user: true
          }
        }
      }
    });

    const deptSalaryStats = departmentWiseSalary.map(dept => {
      const employeeIds = dept.employees.map(e => e.id);
      const deptPayroll = currentMonthPayroll.filter(p => employeeIds.includes(p.employeeId));
      const totalDeptSalary = deptPayroll.reduce((sum, p) => sum + Number(p.netSalary), 0);
      return {
        department: dept.name,
        employeeCount: dept.employees.length,
        totalSalary: totalDeptSalary,
        averageSalary: dept.employees.length > 0 ? totalDeptSalary / dept.employees.length : 0
      };
    });

    // Recent payroll activity
    const recentPayrolls = await prisma.payroll.findMany({
      where: {
        month: currentMonth
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });

    // Salary revision stats
    const recentRevisions = await prisma.salaryRevision.findMany({
      where: {
        revisionDate: {
          gte: new Date(today.getFullYear(), today.getMonth() - 1, 1)
        }
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        revisionDate: 'desc'
      },
      take: 10
    });

    // Payroll configuration
    const payrollConfig = await prisma.payrollConfiguration.findFirst({
      where: {
        isActive: true
      }
    });

    // Upcoming payroll deadlines (next month processing)
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const payrollDueDate = new Date(today.getFullYear(), today.getMonth(), 28); // Assuming 28th as payroll date

    // Deductions breakdown
    const totalPFDeduction = currentMonthPayroll.reduce((sum, p) => sum + Number(p.pfDeduction), 0);
    const totalESIDeduction = currentMonthPayroll.reduce((sum, p) => sum + Number(p.esiDeduction), 0);
    const totalTaxDeduction = currentMonthPayroll.reduce((sum, p) => sum + Number(p.taxDeduction), 0);
    const totalProfessionalTax = currentMonthPayroll.reduce((sum, p) => sum + Number(p.professionalTax), 0);

    // Earnings breakdown
    const totalBonus = currentMonthPayroll.reduce((sum, p) => sum + Number(p.bonus), 0);
    const totalIncentive = currentMonthPayroll.reduce((sum, p) => sum + Number(p.incentive), 0);
    const totalArrears = currentMonthPayroll.reduce((sum, p) => sum + Number(p.arrears), 0);
    const totalOvertimePay = currentMonthPayroll.reduce((sum, p) => sum + Number(p.overtimePay), 0);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          totalGrossSalary,
          totalDeductions,
          totalNetSalary,
          pendingApproval,
          approved,
          paid,
          rejected,
          monthOverMonthChange: parseFloat(monthOverMonthChange)
        },
        breakdown: {
          deductions: {
            pf: totalPFDeduction,
            esi: totalESIDeduction,
            tax: totalTaxDeduction,
            professionalTax: totalProfessionalTax,
            other: totalDeductions - totalPFDeduction - totalESIDeduction - totalTaxDeduction - totalProfessionalTax
          },
          earnings: {
            bonus: totalBonus,
            incentive: totalIncentive,
            arrears: totalArrears,
            overtime: totalOvertimePay
          }
        },
        departmentStats: deptSalaryStats,
        recentActivity: {
          recentPayrolls: recentPayrolls.map(p => ({
            employeeName: p.employee.user.name,
            employeeCode: p.employee.employeeCode,
            department: p.employee.departmentId || 'N/A',
            netSalary: Number(p.netSalary),
            status: p.status,
            updatedAt: p.updatedAt
          })),
          recentRevisions: recentRevisions.map(r => ({
            employeeName: r.employee.user.name,
            previousSalary: Number(r.previousSalary),
            newSalary: Number(r.newSalary),
            revisionPercentage: r.revisionPercentage,
            revisionDate: r.revisionDate,
            reason: r.reason
          }))
        },
        config: {
          workingDaysPerMonth: payrollConfig?.workingDaysPerMonth || 26,
          requireApproval: payrollConfig?.requireApproval || true,
          noticePeriodDays: payrollConfig?.noticePeriodDays || 30
        },
        deadlines: {
          nextPayrollDate: payrollDueDate,
          nextMonth: nextMonth.toISOString().slice(0, 7)
        },
        user: {
          name: user.name,
          role: user.role,
          department: user.employee.departmentId || 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Payroll Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
