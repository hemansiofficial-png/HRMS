import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/tasks/[id]
 * Fetch a single task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { name: true, email: true, id: true }
        },
        creator: {
          select: { name: true, email: true, id: true }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: task.id,
      title: task.title,
      description: task.description,
      createdBy: task.creator.name,
      assignedTo: task.assignee.name,
      assignedToId: task.assignedTo,
      dueDate: task.dueDate.toISOString().split('T')[0],
      priority: task.priority,
      status: task.status,
      progress: task.progress,
      completionDate: task.completionDate?.toISOString().split('T')[0],
      createdAt: task.createdAt.toISOString().split('T')[0],
      updatedAt: task.updatedAt.toISOString().split('T')[0],
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { message: 'Failed to fetch task', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Update a task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const payload = await request.json();

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.dueDate !== undefined) updateData.dueDate = new Date(payload.dueDate);
    if (payload.priority !== undefined) updateData.priority = payload.priority;
    if (payload.status !== undefined) {
      updateData.status = payload.status;
      // Auto-set completion date when status is DONE
      if (payload.status === 'DONE') {
        updateData.completionDate = new Date();
        updateData.progress = 100;
      }
    }
    if (payload.progress !== undefined) updateData.progress = payload.progress;
    if (payload.assignedTo !== undefined) {
      // Verify assignee exists
      const assignee = await prisma.user.findUnique({
        where: { id: payload.assignedTo }
      });
      if (!assignee) {
        return NextResponse.json(
          { message: 'Assignee not found' },
          { status: 404 }
        );
      }
      updateData.assignedTo = payload.assignedTo;
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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
      message: 'Task updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Failed to update task', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Task deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { message: 'Failed to delete task', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
