import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { LeaveType } from '@prisma/client';

// GET - Fetch all leave policies
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const leaveType = searchParams.get('leaveType') as LeaveType | null;

    const policies = await prisma.leavePolicy.findMany({
      where: {
        organizationId: user.organizationId,
        ...(leaveType && { leaveType })
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: policies });
  } catch (error) {
    console.error('Error fetching leave policies:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch leave policies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new leave policy
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      leaveType,
      totalDays,
      carryingForward,
      carryForwardDays,
      encashmentAllowed,
      minTenure,
      applicableFor
    } = body;

    const policy = await prisma.leavePolicy.create({
      data: {
        organizationId: user.organizationId,
        name,
        leaveType,
        totalDays,
        carryingForward: carryingForward ?? false,
        carryForwardDays,
        encashmentAllowed: encashmentAllowed ?? false,
        minTenure: minTenure ?? 0,
        applicableFor: applicableFor || []
      }
    });

    return NextResponse.json(
      { success: true, data: policy, message: 'Leave policy created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating leave policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to create leave policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update a leave policy
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Policy ID required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      leaveType,
      totalDays,
      carryingForward,
      carryForwardDays,
      encashmentAllowed,
      minTenure,
      applicableFor
    } = body;

    const policy = await prisma.leavePolicy.update({
      where: {
        id,
        organizationId: user.organizationId
      },
      data: {
        name,
        leaveType,
        totalDays,
        carryingForward: carryingForward ?? false,
        carryForwardDays,
        encashmentAllowed: encashmentAllowed ?? false,
        minTenure: minTenure ?? 0,
        applicableFor: applicableFor || []
      }
    });

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Leave policy updated successfully'
    });
  } catch (error) {
    console.error('Error updating leave policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to update leave policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a leave policy
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Policy ID required' }, { status: 400 });
    }

    await prisma.leavePolicy.delete({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Leave policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete leave policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
