import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch all gratuity/PF/ESI policies
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
    const isActive = searchParams.get('isActive');

    const [gratuity, pf, esi] = await Promise.all([
      policyService.getGratuityPolicies(
        user.organizationId,
        isActive ? isActive === 'true' : undefined
      ),
      policyService.getProvidentFundPolicies(
        user.organizationId,
        isActive ? isActive === 'true' : undefined
      ),
      policyService.getESIPolicies(
        user.organizationId,
        isActive ? isActive === 'true' : undefined
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: { gratuity, pf, esi },
    });
  } catch (error) {
    console.error('Error fetching statutory policies:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch statutory policies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new gratuity policy
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
    const { type } = body;
    let policy;

    if (type === 'GRATUITY') {
      policy = await policyService.createGratuityPolicy({
        ...body,
        organizationId: user.organizationId,
      });
    } else if (type === 'PF') {
      policy = await policyService.createProvidentFundPolicy({
        ...body,
        organizationId: user.organizationId,
      });
    } else if (type === 'ESI') {
      policy = await policyService.createESIPolicy({
        ...body,
        organizationId: user.organizationId,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid policy type. Use GRATUITY, PF, or ESI' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data: policy, message: `${type} policy created` },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating statutory policy:', error);
    return NextResponse.json(
      {
        error: 'Failed to create statutory policy',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
