import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tasks
 * Fetch all tasks (filtered by user role)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {};

    // Filter by assigned user (only if not admin/manager)
    if (user.role === 'EMPLOYEE' || assignedTo) {
      where.assignedTo = assignedTo || user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { name: true, email: true }
        },
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Transform tasks
    const transformedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      createdBy: task.creator.name,
      assignedTo: task.assignee.name,
      dueDate: task.dueDate.toISOString().split('T')[0],
      priority: task.priority,
      status: task.status,
      progress: task.progress,
      completionDate: task.completionDate?.toISOString().split('T')[0],
      createdAt: task.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json(transformedTasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tasks', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { title, description, assignedTo, dueDate, priority } = payload;

    if (!title || !assignedTo || !dueDate) {
      return NextResponse.json(
        { message: 'Missing required fields: title, assignedTo, dueDate' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify assignee exists
    const assignee = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignee) {
      return NextResponse.json(
        { message: 'Assignee not found' },
        { status: 404 }
      );
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        createdBy: user.id,
        assignedTo,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        status: 'TODO',
        progress: 0
      },
      include: {
        assignee: {
          select: { name: true, email: true }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        createdBy: task.creator.name,
        assignedTo: task.assignee.name,
        dueDate: task.dueDate.toISOString().split('T')[0],
        priority: task.priority,
        status: task.status,
        progress: task.progress,
      },
      message: 'Task created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Failed to create task', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
