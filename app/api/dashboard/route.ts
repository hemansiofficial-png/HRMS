import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle users without employee records (ADMIN, MANAGER, etc.)
    if (!user.employee) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get pending leave requests (for managers)
      let pendingApprovals = 0;
      if (user.role === 'MANAGER' || user.role === 'HR_MANAGER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        pendingApprovals = await prisma.leaveRequest.count({
          where: {
            status: 'PENDING',
            employee: {
              managerId: user.id
            }
          }
        });
      }

      // Get team size (for managers)
      let teamSize = 0;
      if (user.role === 'MANAGER' || user.role === 'HR_MANAGER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        teamSize = await prisma.employee.count({
          where: {
            managerId: user.id
          }
        });
      }

      // Get recent leave requests
      const recentLeaves = await prisma.leaveRequest.findMany({
        where: { 
          employee: {
            managerId: user.id
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              employeeCode: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          approver: {
            select: { name: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          user: {
            name: user.name,
            email: user.email,
            role: user.role,
            employee: null
          },
          attendance: {
            today: null,
            attendancePercentage: 0
          },
          leave: {
            totalRequests: 0,
            pending: 0,
            approved: 0
          },
          approvals: {
            pending: pendingApprovals
          },
          team: {
            size: teamSize
          },
          devices: {
            assigned: 0
          },
          activity: {
            leaves: recentLeaves.map(l => ({
              type: 'leave_approval',
              title: `Leave Request - ${l.employee.user.name}`,
              description: `${l.startDate} - ${l.endDate} (${l.leaveType})`,
              timestamp: l.createdAt,
              status: l.status
            })),
            attendance: []
          },
          upcoming: {
            holidays: []
          }
        }
      });
    }

    const employee = user.employee;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get today's attendance
    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: today
      }
    });

    // Get leave balance
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get pending leave requests (for managers)
    let pendingApprovals = 0;
    if (user.role === 'MANAGER' || user.role === 'HR_MANAGER' || user.role === 'ADMIN') {
      pendingApprovals = await prisma.leaveRequest.count({
        where: {
          status: 'PENDING',
          employee: {
            managerId: user.id
          }
        }
      });
    }

    // Get team size (for managers)
    let teamSize = 0;
    if (user.role === 'MANAGER' || user.role === 'HR_MANAGER' || user.role === 'ADMIN') {
      teamSize = await prisma.employee.count({
        where: {
          OR: [
            { managerId: user.id },
            { departmentId: employee.departmentId }
          ]
        }
      });
    }

    // Get assigned devices
    const assignedDevices = await prisma.device.count({
      where: {
        assignedTo: employee.id
      }
    });

    // Get recent activity
    const recentActivity = await Promise.all([
      // Recent leave requests
      prisma.leaveRequest.findMany({
        where: { employeeId: employee.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          approver: {
            select: { name: true }
          }
        }
      }),
      // Recent attendance
      prisma.attendance.findMany({
        where: { employeeId: employee.id },
        take: 2,
        orderBy: { date: 'desc' }
      })
    ]);

    // Get upcoming holidays
    const upcomingHolidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: today
        },
        OR: [
          { isNational: true },
          { organizationId: employee.organizationId }
        ]
      },
      take: 3,
      orderBy: { date: 'asc' }
    });

    // Calculate attendance percentage for the month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const presentDays = monthAttendance.filter(a => 
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    const totalDays = monthAttendance.length;
    const attendancePercentage = totalDays > 0 
      ? Math.round((presentDays / totalDays) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role,
          employee: {
            id: employee.id,
            employeeCode: employee.employeeCode,
            designation: employee.designation,
            department: employee.department?.name || 'N/A'
          }
        },
        attendance: {
          today: todayAttendance ? {
            status: todayAttendance.status,
            checkIn: todayAttendance.checkIn,
            checkOut: todayAttendance.checkOut
          } : null,
          attendancePercentage
        },
        leave: {
          totalRequests: leaveRequests.length,
          pending: leaveRequests.filter(l => l.status === 'PENDING').length,
          approved: leaveRequests.filter(l => l.status === 'APPROVED').length
        },
        approvals: {
          pending: pendingApprovals
        },
        team: {
          size: teamSize
        },
        devices: {
          assigned: assignedDevices
        },
        activity: {
          leaves: recentActivity[0]?.map(l => ({
            type: 'leave',
            title: `Leave ${l.status.toLowerCase()}`,
            description: `${l.startDate} - ${l.endDate} (${l.leaveType})`,
            timestamp: l.createdAt,
            status: l.status
          })) || [],
          attendance: recentActivity[1]?.map(a => ({
            type: 'attendance',
            title: a.status,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            timestamp: a.date
          })) || []
        },
        upcoming: {
          holidays: upcomingHolidays.map(h => ({
            name: h.name,
            date: h.date,
            isNational: h.isNational
          }))
        }
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
