import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch a single leave policy
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const policy = await prisma.leavePolicy.findUnique({
      where: { id },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: policy });
  } catch (error) {
    console.error('Error fetching leave policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a leave policy
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId || !['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const policy = await prisma.leavePolicy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: policy, message: 'Leave policy updated successfully' });
  } catch (error) {
    console.error('Error updating leave policy:', error);
    return NextResponse.json(
      { error: 'Failed to update leave policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a leave policy
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    });

    if (!user || !user.organizationId || !['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.leavePolicy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Leave policy deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete leave policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
