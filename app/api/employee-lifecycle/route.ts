import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch employee lifecycle data (promotions, resignations, exit interviews)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        department: true,
        user: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if user is admin/manager to see all records, otherwise only their own
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(session.user.role as string);
    const isManager = ['MANAGER', 'HR_MANAGER'].includes(session.user.role as string);

    // Fetch promotions
    let promotionsWhere = {};
    if (!isAdmin) {
      if (isManager) {
        // Manager can see their team's promotions
        promotionsWhere = {
          employee: {
            managerId: session.user.id
          }
        };
      } else {
        // Regular employee sees only their own
        promotionsWhere = {
          employeeId: employee.id
        };
      }
    }

    const promotions = await prisma.promotion.findMany({
      where: promotionsWhere,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: {
              select: {
                name: true
              }
            },
            photoUrl: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        effectiveDate: 'desc'
      }
    });

    // Fetch resignations
    let resignationsWhere = {};
    if (!isAdmin) {
      if (isManager) {
        resignationsWhere = {
          employee: {
            managerId: session.user.id
          }
        };
      } else {
        resignationsWhere = {
          employeeId: employee.id
        };
      }
    }

    const resignations = await prisma.resignation.findMany({
      where: resignationsWhere,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: {
              select: {
                name: true
              }
            },
            photoUrl: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        exitInterview: true,
        clearanceTasks: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch exit interviews
    let exitInterviewsWhere = {};
    if (!isAdmin) {
      if (isManager) {
        exitInterviewsWhere = {
          resignation: {
            employee: {
              managerId: session.user.id
            }
          }
        };
      } else {
        exitInterviewsWhere = {
          resignation: {
            employeeId: employee.id
          }
        };
      }
    }

    const exitInterviews = await prisma.exitInterview.findMany({
      where: exitInterviewsWhere,
      include: {
        resignation: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                designation: true,
                department: {
                  select: {
                    name: true
                  }
                },
                photoUrl: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        interviewDate: 'desc'
      }
    });

    // Format data for frontend
    const formattedPromotions = promotions.map(p => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employee.user.name,
      employeeCode: p.employee.employeeCode,
      employeePhoto: p.employee.photoUrl,
      previousDesignation: p.previousDesignation,
      newDesignation: p.newDesignation,
      previousSalary: p.previousSalary.toNumber(),
      newSalary: p.newSalary.toNumber(),
      salaryIncrease: p.newSalary.toNumber() - p.previousSalary.toNumber(),
      increasePercentage: p.previousSalary.toNumber() > 0 
        ? (((p.newSalary.toNumber() - p.previousSalary.toNumber()) / p.previousSalary.toNumber()) * 100).toFixed(1)
        : '0',
      effectiveDate: p.effectiveDate.toISOString(),
      reason: p.reason,
      department: p.employee.department.name,
      createdAt: p.createdAt.toISOString()
    }));

    const formattedResignations = resignations.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.user.name,
      employeeCode: r.employee.employeeCode,
      employeePhoto: r.employee.photoUrl,
      designation: r.employee.designation,
      department: r.employee.department.name,
      type: r.type,
      status: r.status,
      resignationDate: r.resignationDate.toISOString(),
      noticeDate: r.noticeDate.toISOString(),
      lastWorkingDay: r.lastWorkingDay.toISOString(),
      reason: r.reason,
      reasonCategory: r.reasonCategory,
      discussionWithManager: r.discussionWithManager,
      discussionSummary: r.discussionSummary,
      managerComments: r.managerComments,
      hrComments: r.hrComments,
      noticePeriodDays: r.noticePeriodDays,
      noticePeriodWaiver: r.noticePeriodWaiver,
      waiverReason: r.waiverReason,
      okToRehire: r.okToRehire,
      approvedBy: r.approver ? {
        id: r.approver.id,
        name: r.approver.name,
        email: r.approver.email
      } : null,
      approvedAt: r.approvedAt?.toISOString(),
      rejectionReason: r.rejectionReason,
      hasExitInterview: !!r.exitInterview,
      clearanceProgress: {
        total: r.clearanceTasks.length,
        completed: r.clearanceTasks.filter(t => t.status === 'COMPLETED').length,
        pending: r.clearanceTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
      },
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }));

    const formattedExitInterviews = exitInterviews.map(e => ({
      id: e.id,
      resignationId: e.resignationId,
      employeeId: e.resignation.employeeId,
      employeeName: e.resignation.employee.user.name,
      employeeCode: e.resignation.employee.employeeCode,
      employeePhoto: e.resignation.employee.photoUrl,
      designation: e.resignation.employee.designation,
      department: e.resignation.employee.department.name,
      interviewDate: e.interviewDate.toISOString(),
      feedback: e.feedback,
      reason: e.reason,
      suggestions: e.suggestions,
      wouldRehire: e.wouldRehire,
      resignationStatus: e.resignation.status,
      lastWorkingDay: e.resignation.lastWorkingDay.toISOString(),
      createdAt: e.createdAt.toISOString()
    }));

    return NextResponse.json({
      promotions: formattedPromotions,
      resignations: formattedResignations,
      exitInterviews: formattedExitInterviews,
      stats: {
        totalPromotions: formattedPromotions.length,
        totalResignations: formattedResignations.length,
        totalExitInterviews: formattedExitInterviews.length,
        pendingResignations: formattedResignations.filter(r => r.status === 'PENDING' || r.status === 'SUBMITTED').length,
        approvedResignations: formattedResignations.filter(r => r.status === 'APPROVED' || r.status === 'ACCEPTED').length,
        rejectedResignations: formattedResignations.filter(r => r.status === 'REJECTED').length
      }
    });
  } catch (error) {
    console.error('Error fetching employee lifecycle data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
