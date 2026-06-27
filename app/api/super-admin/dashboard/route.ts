import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has super admin privileges
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: {
          include: {
            department: true,
            organization: true
          }
        }
      }
    });

    if (!user?.employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Organization-wide stats
    const totalOrganizations = await prisma.organization.count();
    
    const activeOrganizations = totalOrganizations; // All organizations are active by default

    // Total employees across all organizations
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // User stats by role
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    const roleDistribution = userStats.map(s => ({
      role: s.role,
      count: s._count
    }));

    // Employee stats
    const activeEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE'
      }
    });

    const inactiveEmployees = await prisma.employee.count({
      where: {
        status: {
          in: ['INACTIVE', 'RESIGNED']
        }
      }
    });

    const newHiresThisMonth = await prisma.employee.count({
      where: {
        joiningDate: {
          gte: monthStart,
          lte: today
        },
        status: 'ACTIVE'
      }
    });

    // Attendance overview (today)
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: today
      }
    });

    const presentToday = todayAttendance.filter(a => 
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    
    const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const onLeaveToday = todayAttendance.filter(a => a.status === 'ON_LEAVE').length;
    
    const overallAttendanceRate = totalEmployees > 0 
      ? Math.round((presentToday / totalEmployees) * 100) 
      : 0;

    // Leave management overview
    const totalLeaveRequests = await prisma.leaveRequest.count();
    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING'
      }
    });

    const approvedLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED'
      }
    });

    const rejectedLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'REJECTED'
      }
    });

    // Payroll overview
    const currentMonth = today.toISOString().slice(0, 7);
    const totalPayrollRecords = await prisma.payroll.count({
      where: {
        month: currentMonth
      }
    });

    const payrollStats = await prisma.payroll.findMany({
      where: {
        month: currentMonth
      }
    });

    const totalGrossSalary = payrollStats.reduce((sum, p) => sum + Number(p.grossSalary), 0);
    const totalNetSalary = payrollStats.reduce((sum, p) => sum + Number(p.netSalary), 0);
    const totalDeductions = payrollStats.reduce((sum, p) => sum + Number(p.totalDeductions), 0);

    const payrollPending = payrollStats.filter(p => 
      p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL'
    ).length;

    const payrollApproved = payrollStats.filter(p => p.status === 'APPROVED').length;
    const payrollPaid = payrollStats.filter(p => p.status === 'PAID').length;

    // Recruitment overview
    const totalJobs = await prisma.jobPosting.count();
    const activeJobs = await prisma.jobPosting.count({
      where: {
        status: 'OPEN'
      }
    });

    const totalCandidates = await prisma.applicant.count();
    const candidatesByStatus = await prisma.applicant.groupBy({
      by: ['status'],
      _count: true
    });

    // Department overview
    const totalDepartments = await prisma.department.count();
    const departmentStats = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    // Device management
    const totalDevices = await prisma.device.count();
    const assignedDevices = await prisma.device.count({
      where: {
        status: 'ASSIGNED'
      }
    });

    const availableDevices = await prisma.device.count({
      where: {
        status: 'AVAILABLE'
      }
    });

    const deviceIssues = await prisma.deviceIssue.count();
    const openDeviceIssues = await prisma.deviceIssue.count({
      where: {
        status: {
          in: ['open', 'in-progress']
        }
      }
    });

    // Performance management
    const totalReviews = await prisma.performanceReview.count({
      where: {
        reviewDate: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const avgOrganizationRating = await prisma.performanceReview.aggregate({
      _avg: {
        rating: true
      },
      where: {
        reviewDate: {
          gte: monthStart,
          lte: today
        }
      }
    });

    // Training overview
    const totalTrainings = await prisma.trainingEnrollment.count();
    const ongoingTrainings = await prisma.trainingEnrollment.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });

    const completedTrainings = await prisma.trainingEnrollment.count({
      where: {
        status: 'COMPLETED'
      }
    });

    // System health & activity
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        isActive: true
      }
    });

    const usersLoggedInToday = await prisma.user.count({
      where: {
        isActive: true,
        lastLoginAt: {
          gte: today
        }
      }
    });

    // Recent activity across system
    const recentEmployees = await prisma.employee.findMany({
      where: {
        createdAt: {
          gte: monthStart
        }
      },
      include: {
        user: true,
        department: true,
        organization: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Turnover rate
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const resignedEmployees = await prisma.employee.count({
      where: {
        status: 'RESIGNED',
        updatedAt: {
          gte: threeMonthsAgo
        }
      }
    });

    const turnoverRate = totalEmployees > 0 
      ? ((resignedEmployees / (totalEmployees + resignedEmployees)) * 100).toFixed(2)
      : '0';

    // Organization-wise breakdown
    const orgBreakdown = await prisma.organization.findMany({
      include: {
        employees: {
          where: {
            status: 'ACTIVE'
          }
        },
        departments: true,
        users: true
      }
    });

    const orgStats = orgBreakdown.map(org => ({
      name: org.name,
      employeeCount: org.employees.length,
      departmentCount: org.departments.length,
      userCount: org.users.length,
      isActive: true
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrganizations,
          activeOrganizations,
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          newHiresThisMonth,
          attendanceToday: overallAttendanceRate,
          turnoverRate: parseFloat(turnoverRate)
        },
        attendance: {
          presentToday,
          absentToday,
          onLeaveToday,
          totalEmployees,
          attendanceRate: overallAttendanceRate
        },
        leaveManagement: {
          totalRequests: totalLeaveRequests,
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves
        },
        payroll: {
          totalRecords: totalPayrollRecords,
          grossSalary: totalGrossSalary,
          netSalary: totalNetSalary,
          deductions: totalDeductions,
          pending: payrollPending,
          approved: payrollApproved,
          paid: payrollPaid
        },
        recruitment: {
          totalJobs,
          activeJobs,
          totalCandidates,
          candidatesByStatus: candidatesByStatus.map(s => ({
            status: s.status,
            count: s._count
          }))
        },
        departments: {
          total: totalDepartments,
          distribution: departmentStats.map(d => ({
            name: d.name,
            employeeCount: d._count.employees
          }))
        },
        devices: {
          total: totalDevices,
          assigned: assignedDevices,
          available: availableDevices,
          totalIssues: deviceIssues,
          openIssues: openDeviceIssues
        },
        performance: {
          reviewsThisMonth: totalReviews,
          averageRating: avgOrganizationRating._avg.rating || 0
        },
        training: {
          total: totalTrainings,
          ongoing: ongoingTrainings,
          completed: completedTrainings
        },
        systemHealth: {
          totalUsers,
          activeUsers,
          usersLoggedInToday,
          roleDistribution
        },
        organizations: orgStats,
        recentActivity: {
          recentHires: recentEmployees.map(e => ({
            name: e.user.name,
            email: e.user.email,
            designation: e.designation,
            department: e.department?.name || 'N/A',
            organization: e.organization?.name || 'N/A',
            joiningDate: e.joiningDate
          }))
        },
        user: {
          name: user.name,
          role: user.role,
          department: user.employee.department?.name || 'N/A',
          organization: user.employee.organization?.name || 'System-wide'
        }
      }
    });
  } catch (error) {
    console.error('Super Admin Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch super admin dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
