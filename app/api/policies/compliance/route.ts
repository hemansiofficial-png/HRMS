import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch all compliance policies
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
    const complianceType = searchParams.get('complianceType');
    const isActive = searchParams.get('isActive');

    const policies = await policyService.getCompliancePolicies(
      user.organizationId,
      complianceType || undefined,
      isActive ? isActive === 'true' : undefined
    );

    return NextResponse.json({ success: true, data: policies });
  } catch (error) {
    console.error('Error fetching compliance policies:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch compliance policies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new compliance policy
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

    if (!user || !user.organizationId || !['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const policy = await policyService.createCompliancePolicy({
      ...body,
      organizationId: user.organizationId,
    });

    return NextResponse.json(
      { success: true, data: policy, message: 'Compliance policy created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating compliance policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to create compliance policy',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
