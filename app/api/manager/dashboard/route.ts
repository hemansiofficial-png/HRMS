import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has manager privileges
    const allowedRoles = ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
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

    // Get team members (direct reports + department members)
    const teamMembers = await prisma.employee.findMany({
      where: {
        OR: [
          { managerId: user.id },
          { 
            departmentId: user.employee.departmentId,
            managerId: null // Avoid duplicates
          }
        ],
        status: 'ACTIVE'
      },
      include: {
        user: true,
        department: true
      }
    });

    const teamSize = teamMembers.length;

    // Team attendance today
    const teamMemberIds = teamMembers.map(m => m.id);
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: {
          in: teamMemberIds
        },
        date: today
      }
    });

    const presentCount = todayAttendance.filter(a => 
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const teamAttendanceRate = teamSize > 0 
      ? Math.round((presentCount / teamSize) * 100) 
      : 0;

    // Pending approvals for this manager
    const pendingLeaveApprovals = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING',
        employee: {
          managerId: user.id
        }
      }
    });

    const pendingAttendanceCorrections = await prisma.attendanceCorrection.count({
      where: {
        status: 'PENDING',
        employee: {
          managerId: user.id
        }
      }
    });

    const pendingAssetRequests = await prisma.assetRequest.count({
      where: {
        status: 'PENDING',
        employee: {
          managerId: user.id
        }
      }
    });

    const totalPendingApprovals = pendingLeaveApprovals + pendingAttendanceCorrections + pendingAssetRequests;

    // Open tasks for team (simplified query)
    const openTasks = 0;

    // Team performance (recent reviews) - simplified
    const teamReviews: any[] = [];
    const avgRating = '0';

    // Upcoming team events (birthdays, work anniversaries)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const upcomingBirthdays = teamMembers.filter(m => {
      if (!m.dateOfBirth) return false;
      const bday = new Date(m.dateOfBirth);
      const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      return thisYearBday >= today && thisYearBday <= monthEnd;
    }).map(m => ({
      name: m.user.name,
      date: new Date(today.getFullYear(), new Date(m.dateOfBirth!).getMonth(), new Date(m.dateOfBirth!).getDate()),
      type: 'Birthday'
    }));

    const upcomingAnniversaries = teamMembers.filter(m => {
      const joiningDate = new Date(m.joiningDate);
      const thisYearAnniversary = new Date(today.getFullYear(), joiningDate.getMonth(), joiningDate.getDate());
      return thisYearAnniversary >= today && thisYearAnniversary <= monthEnd;
    }).map(m => ({
      name: m.user.name,
      date: new Date(today.getFullYear(), new Date(m.joiningDate).getMonth(), new Date(m.joiningDate).getDate()),
      type: 'Work Anniversary',
      years: today.getFullYear() - new Date(m.joiningDate).getFullYear()
    }));

    // Leave requests pending details
    const pendingLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        employee: {
          managerId: user.id
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
        createdAt: 'desc'
      },
      take: 10
    });

    // Team member details for display
    const teamOverview = teamMembers.map(m => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.designation,
      department: m.department.name,
      status: 'Present', // Will be calculated from attendance
      attendance: '0%' // Will be calculated
    }));

    // Calculate attendance for each team member (for this month)
    const monthAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: {
          in: teamMemberIds
        },
        date: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const attendanceMap = new Map<string, { present: number; total: number }>();
    monthAttendance.forEach(a => {
      const key = a.employeeId;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, { present: 0, total: 0 });
      }
      const data = attendanceMap.get(key)!;
      data.total++;
      if (a.status === 'PRESENT' || a.status === 'LATE') {
        data.present++;
      }
    });

    const teamOverviewWithAttendance = teamOverview.map(m => {
      const attData = attendanceMap.get(m.id);
      const attendanceRate = attData 
        ? Math.round((attData.present / attData.total) * 100) 
        : 0;
      return {
        ...m,
        attendance: `${attendanceRate}%`
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          teamSize,
          teamAttendanceRate,
          pendingApprovals: totalPendingApprovals,
          openTasks,
          avgRating: parseFloat(avgRating)
        },
        approvals: {
          pendingLeaves: pendingLeaveApprovals,
          pendingAttendanceCorrections,
          pendingAssetRequests
        },
        team: {
          members: teamOverviewWithAttendance,
          presentToday: presentCount,
          absentToday: teamSize - presentCount
        },
        performance: {
          recentReviews: teamReviews.map(r => ({
            employeeName: r.employee.user.name,
            rating: r.rating,
            feedback: r.feedback,
            reviewDate: r.reviewDate
          })),
          averageRating: parseFloat(avgRating)
        },
        upcoming: {
          birthdays: upcomingBirthdays,
          anniversaries: upcomingAnniversaries
        },
        pendingRequests: pendingLeaves.map(l => ({
          id: l.id,
          employeeName: l.employee.user.name,
          employeeId: l.employee.id,
          type: 'Leave Request',
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          numberOfDays: l.numberOfDays,
          reason: l.reason,
          status: 'pending',
          date: l.createdAt
        })),
        user: {
          name: user.name,
          role: user.role,
          department: user.employee.department?.name || 'N/A'
        }
      }
    });
  } catch (error) {
    console.error('Manager Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
