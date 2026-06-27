import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch a single payroll policy
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const policy = await policyService.getPayrollPolicy(id);

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error('Error fetching payroll policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update a payroll policy
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

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const policy = await policyService.updatePayrollPolicy(id, body);

    return NextResponse.json({
      success: true,
      data: policy,
      message: 'Payroll policy updated successfully',
    });
  } catch (error) {
    console.error('Error updating payroll policy:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a payroll policy
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

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await policyService.deletePayrollPolicy(id);

    return NextResponse.json({
      success: true,
      message: 'Payroll policy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payroll policy:', error);
    return NextResponse.json(
      { error: 'Failed to delete payroll policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
