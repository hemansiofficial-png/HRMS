import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user?.employee) {
      return NextResponse.json({ error: 'Employee profile not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Total employees count
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE'
      }
    });

    // New hires this month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const newHires = await prisma.employee.count({
      where: {
        joiningDate: {
          gte: monthStart,
          lte: today
        },
        status: 'ACTIVE'
      }
    });

    // Attendance today
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: today,
        status: {
          in: ['PRESENT', 'LATE']
        }
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      }
    });

    const attendanceTodayCount = todayAttendance.length;
    const attendancePercentage = totalEmployees > 0 
      ? Math.round((attendanceTodayCount / totalEmployees) * 100) 
      : 0;

    // Pending leave approvals
    const pendingLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING'
      }
    });

    // Active devices count
    const activeDevices = await prisma.device.count({
      where: {
        status: 'ASSIGNED'
      }
    });

    // Pending approvals (leave + attendance corrections + asset requests)
    const pendingAttendanceCorrections = await prisma.attendanceCorrection.count({
      where: {
        status: 'PENDING'
      }
    });

    const pendingAssetRequests = await prisma.assetRequest.count({
      where: {
        status: 'PENDING'
      }
    });

    const totalPendingApprovals = pendingLeaves + pendingAttendanceCorrections + pendingAssetRequests;

    // Recruitment stats
    const activeJobs = await prisma.jobPosting.count({
      where: {
        status: 'OPEN'
      }
    });

    const pendingCandidates = await prisma.applicant.count({
      where: {
        status: 'INTERVIEW_SCHEDULED'
      }
    });

    // Payroll stats
    const currentMonth = today.toLocaleString('default', { month: 'long' }).toLowerCase();
    const payrollPending = await prisma.payroll.count({
      where: {
        month: today.toISOString().slice(0, 7),
        status: {
          in: ['DRAFT', 'PENDING_APPROVAL']
        }
      }
    });

    // Recent activity
    const recentHires = await prisma.employee.findMany({
      where: {
        joiningDate: {
          gte: monthStart
        }
      },
      include: {
        user: true,
        department: true
      },
      take: 5,
      orderBy: {
        joiningDate: 'desc'
      }
    });

    // Department-wise employee count
    const departmentStats = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            employees: true
          }
        }
      }
    });

    // Leave statistics
    const leaveStats = await prisma.leaveRequest.groupBy({
      by: ['status'],
      _count: true
    });

    // Turnover rate (employees who left in last 3 months)
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

    // Training stats
    const ongoingTrainings = await prisma.trainingEnrollment.count({
      where: {
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          newHires,
          attendanceToday: attendancePercentage,
          pendingApprovals: totalPendingApprovals,
          activeDevices,
          activeJobs,
          pendingCandidates,
          payrollPending,
          ongoingTrainings
        },
        stats: {
          turnoverRate: parseFloat(turnoverRate),
          departmentStats: departmentStats.map(d => ({
            name: d.name,
            count: d._count.employees
          })),
          leaveStats: leaveStats.map(l => ({
            status: l.status,
            count: l._count
          }))
        },
        recentActivity: {
          recentHires: recentHires.map(h => ({
            name: h.user.name,
            designation: h.designation,
            department: h.department.name,
            joiningDate: h.joiningDate,
            email: h.user.email
          }))
        },
        user: {
          name: user.name,
          role: user.role,
          department: user.employee.department?.name || 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Admin Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
