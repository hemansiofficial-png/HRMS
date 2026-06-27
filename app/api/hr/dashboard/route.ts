import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has HR manager privileges
    const allowedRoles = ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
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
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Employee lifecycle stats
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'ACTIVE'
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

    const resignationsThisMonth = await prisma.resignation.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const terminationsThisMonth = await prisma.employee.count({
      where: {
        status: 'RESIGNED',
        updatedAt: {
          gte: monthStart,
          lte: today
        }
      }
    });

    // Onboarding progress
    const ongoingOnboardings = await prisma.onboardingRecord.count({
      where: {
        stage: {
          not: 'COMPLETED'
        }
      }
    });

    const pendingOnboardingTasks = await prisma.onboardingRecord.findMany({
      where: {
        stage: {
          not: 'COMPLETED'
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

    // Recruitment stats
    const activeJobPostings = await prisma.jobPosting.count({
      where: {
        status: 'OPEN'
      }
    });

    const totalCandidates = await prisma.applicant.count();
    const interviewScheduled = await prisma.applicant.count({
      where: {
        status: 'INTERVIEW_SCHEDULED'
      }
    });

    const offersReleased = await prisma.applicant.count({
      where: {
        status: 'OFFER_EXTENDED'
      }
    });

    // Leave management stats
    const totalLeaveRequests = await prisma.leaveRequest.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: {
        status: 'PENDING'
      }
    });

    const approvedLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const rejectedLeaves = await prisma.leaveRequest.count({
      where: {
        status: 'REJECTED',
        createdAt: {
          gte: monthStart,
          lte: today
        }
      }
    });

    // Attendance stats
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: today
      }
    });

    const presentToday = todayAttendance.filter(a => 
      a.status === 'PRESENT' || a.status === 'LATE'
    ).length;
    
    const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = totalEmployees > 0 
      ? Math.round((presentToday / totalEmployees) * 100) 
      : 0;

    // Performance review stats
    const totalReviews = await prisma.performanceReview.count({
      where: {
        reviewDate: {
          gte: monthStart,
          lte: today
        }
      }
    });

    const pendingReviews = await prisma.performanceReview.count({
      where: {
        reviewDate: {
          lte: today
        },
        employee: {
          status: 'ACTIVE'
        }
      }
    });

    // Training stats
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

    // Employee satisfaction (from feedback)
    const totalFeedbacks = await prisma.feedback.count();
    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        ratedOn: {
          gte: monthStart,
          lte: today
        }
      },
      include: {
        receiver: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        ratedOn: 'desc'
      },
      take: 10
    });

    // Department-wise distribution
    const departmentStats = await prisma.department.findMany({
      include: {
        employees: {
          where: {
            status: 'ACTIVE'
          }
        },
        manager: true
      }
    });

    const deptDistribution = departmentStats.map(dept => ({
      name: dept.name,
      employeeCount: dept.employees.length,
      managerName: dept.manager?.name || 'Vacant',
      openPositions: 0 // Could be calculated from job postings
    }));

    // Turnover calculation
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

    // Compliance stats
    const expiringDocuments = await prisma.employeeDocument.count({
      where: {
        employee: {
          status: 'ACTIVE'
        }
      }
      // Add expiry date filter if you add expiryDate field to schema
    });

    // Policy stats (simplified since organizationPolicy may not exist)
    const totalPolicies = 0;
    const activePolicies = 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          newHires: newHiresThisMonth,
          resignations: resignationsThisMonth,
          terminations: terminationsThisMonth,
          attendanceToday: attendanceRate,
          pendingLeaves: pendingLeaveRequests,
          activeJobs: activeJobPostings,
          ongoingTrainings
        },
        recruitment: {
          activeJobs: activeJobPostings,
          totalCandidates,
          interviewScheduled,
          offersReleased,
          conversionRate: totalCandidates > 0 
            ? ((offersReleased / totalCandidates) * 100).toFixed(2) 
            : '0'
        },
        onboarding: {
          ongoing: ongoingOnboardings,
          pendingTasks: pendingOnboardingTasks.length,
          newHires: pendingOnboardingTasks.map(o => ({
            name: o.employee.user.name,
            joiningDate: o.employee.joiningDate,
            department: o.employee.departmentId || 'N/A',
            progress: 0
          }))
        },
        leaveManagement: {
          totalThisMonth: totalLeaveRequests,
          pending: pendingLeaveRequests,
          approved: approvedLeaves,
          rejected: rejectedLeaves
        },
        attendance: {
          presentToday,
          absentToday,
          totalEmployees,
          attendanceRate
        },
        performance: {
          totalReviewsThisMonth: totalReviews,
          pendingReviews,
          avgRating: 0 // Calculate from reviews if needed
        },
        training: {
          total: totalTrainings,
          ongoing: ongoingTrainings,
          completed: completedTrainings
        },
        departmentStats: deptDistribution,
        turnover: {
          rate: parseFloat(turnoverRate),
          resignedLast3Months: resignedEmployees
        },
        compliance: {
          expiringDocuments,
          activePolicies,
          totalPolicies
        },
        recentActivity: {
          recentFeedbacks: recentFeedbacks.map(f => ({
            employeeName: f.receiver.user.name,
            category: f.category,
            comments: f.comments,
            ratedOn: f.ratedOn
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
    console.error('HR Manager Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HR manager dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
