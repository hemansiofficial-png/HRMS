import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch policy versions
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const policyType = searchParams.get('policyType') as policyService.PolicyType | null;
    const policyId = searchParams.get('policyId');

    if (!policyType || !policyId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: policyType, policyId' },
        { status: 400 }
      );
    }

    const versions = await policyService.getPolicyVersions(policyType, policyId);

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching policy versions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch policy versions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new policy version
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      policyType,
      policyId,
      changesSummary,
      previousData,
      currentData,
      effectiveFrom,
      effectiveTo,
    } = body;

    if (!policyType || !policyId || !changesSummary || !previousData || !currentData) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: policyType, policyId, changesSummary, previousData, currentData',
        },
        { status: 400 }
      );
    }

    const version = await policyService.createPolicyVersion({
      policyType,
      policyId,
      changesSummary,
      changedBy: user.id,
      previousData,
      currentData,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined,
      organizationId: user.organizationId,
    });

    return NextResponse.json(
      { success: true, data: version, message: 'Policy version created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating policy version:', error);
    return NextResponse.json(
      {
        error: 'Failed to create policy version',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
