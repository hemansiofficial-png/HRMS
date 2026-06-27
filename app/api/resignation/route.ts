import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendResignationNotification } from '@/lib/notifications';

// GET - Fetch employee's resignation status
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const resignation = await prisma.resignation.findUnique({
      where: { employeeId: employee.id },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        clearanceTasks: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!resignation) {
      return NextResponse.json({ hasResignation: false, resignation: null });
    }

    const clearanceProgress = {
      total: resignation.clearanceTasks.length,
      completed: resignation.clearanceTasks.filter(t => t.status === 'COMPLETED').length,
      pending: resignation.clearanceTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length
    };

    return NextResponse.json({
      hasResignation: true,
      resignation: {
        id: resignation.id,
        type: resignation.type,
        status: resignation.status,
        resignationDate: resignation.resignationDate.toISOString(),
        noticeDate: resignation.noticeDate.toISOString(),
        lastWorkingDay: resignation.lastWorkingDay.toISOString(),
        reason: resignation.reason,
        reasonCategory: resignation.reasonCategory,
        discussionWithManager: resignation.discussionWithManager,
        discussionSummary: resignation.discussionSummary,
        managerComments: resignation.managerComments,
        hrComments: resignation.hrComments,
        noticePeriodDays: resignation.noticePeriodDays,
        noticePeriodWaiver: resignation.noticePeriodWaiver,
        waiverReason: resignation.waiverReason,
        okToRehire: resignation.okToRehire,
        approvedBy: resignation.approver ? {
          id: resignation.approver.id,
          name: resignation.approver.name,
          email: resignation.approver.email
        } : null,
        approvedAt: resignation.approvedAt?.toISOString(),
        rejectionReason: resignation.rejectionReason,
        createdAt: resignation.createdAt.toISOString(),
        clearanceProgress
      }
    });
  } catch (error) {
    console.error('Error fetching resignation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Employee submits resignation
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      reason,
      reasonCategory,
      discussionWithManager,
      discussionSummary,
      lastWorkingDay,
      noticePeriodWaiver,
      waiverReason
    } = body;

    // Validation
    if (!reason || !lastWorkingDay) {
      return NextResponse.json(
        { error: 'Reason and last working day are required' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        department: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if already has resignation
    const existingResignation = await prisma.resignation.findUnique({
      where: { employeeId: employee.id }
    });

    if (existingResignation) {
      return NextResponse.json(
        { error: 'You already have a resignation in progress' },
        { status: 400 }
      );
    }

    // Calculate notice period days
    const noticeDate = new Date();
    const lwd = new Date(lastWorkingDay);
    const noticePeriodDays = Math.ceil((lwd.getTime() - noticeDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create resignation
    const resignation = await prisma.resignation.create({
      data: {
        employeeId: employee.id,
        type: 'RESIGNATION',
        status: 'SUBMITTED',
        noticeDate,
        lastWorkingDay: lwd,
        reason,
        reasonCategory: reasonCategory || 'Other',
        discussionWithManager: discussionWithManager || false,
        discussionSummary: discussionSummary || null,
        noticePeriodDays,
        noticePeriodWaiver: noticePeriodWaiver || false,
        waiverReason: waiverReason || null,
        okToRehire: true
      },
      include: {
        employee: {
          include: {
            department: true,
            user: true
          }
        }
      }
    });

    // Create clearance tasks
    const clearanceTasks = await createClearanceTasks(resignation.id);

    // Send notification to manager
    if (employee.managerId) {
      await sendResignationNotification(employee.user.name, employee.managerId, resignation.id);
    }

    return NextResponse.json({
      success: true,
      resignation: {
        id: resignation.id,
        status: resignation.status,
        lastWorkingDay: resignation.lastWorkingDay.toISOString(),
        noticePeriodDays: resignation.noticePeriodDays
      }
    });
  } catch (error) {
    console.error('Error submitting resignation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to create clearance tasks
async function createClearanceTasks(resignationId: string) {
  const tasks = [
    {
      taskType: 'IT_ASSETS',
      taskName: 'Return IT Assets',
      description: 'Return laptop, charger, mouse, keyboard, and other IT equipment'
    },
    {
      taskType: 'ACCESS_CARD',
      taskName: 'Return Access Cards',
      description: 'Return office access cards, parking cards, and keys'
    },
    {
      taskType: 'DOCUMENTS',
      taskName: 'Handover Documents',
      description: 'Transfer all company documents and files'
    },
    {
      taskType: 'KNOWLEDGE_TRANSFER',
      taskName: 'Complete Knowledge Transfer',
      description: 'Document processes and train team members'
    },
    {
      taskType: 'CLIENT_HANDOVER',
      taskName: 'Client Handover',
      description: 'Transfer client relationships and ongoing projects'
    },
    {
      taskType: 'NO_DUES',
      taskName: 'No Dues Certificate',
      description: 'Obtain no dues certificate from all departments'
    }
  ];

  return await Promise.all(
    tasks.map(task =>
      prisma.clearanceTask.create({
        data: {
          resignationId,
          taskType: task.taskType,
          taskName: task.taskName,
          description: task.description,
          status: 'PENDING'
        }
      })
    )
  );
}
