import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch policy assignments
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
    const policyType = searchParams.get('policyType') as policyService.PolicyType | null;
    const policyId = searchParams.get('policyId');
    const entityType = searchParams.get('entityType') as policyService.EntityType | null;
    const entityId = searchParams.get('entityId');

    const assignments = await policyService.getPolicyAssignments(
      policyType || undefined,
      policyId || undefined,
      entityType || undefined,
      entityId || undefined
    );

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching policy assignments:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch policy assignments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Assign a policy to an entity
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

    if (!user || !user.organizationId || !['ADMIN', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { policyType, policyId, entityType, entityId, effectiveFrom, effectiveTo } = body;

    if (!policyType || !policyId || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: policyType, policyId, entityType, entityId' },
        { status: 400 }
      );
    }

    const assignment = await policyService.assignPolicy({
      policyType,
      policyId,
      entityType,
      entityId,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      organizationId: user.organizationId
    });

    return NextResponse.json(
      { success: true, data: assignment, message: 'Policy assigned successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error assigning policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
