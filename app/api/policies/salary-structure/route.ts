import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// GET - Fetch all salary structure templates
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
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const isActive = searchParams.get('isActive');

    const policies = await policyService.getSalaryStructureTemplates(
      user.organizationId,
      role || undefined,
      department || undefined,
      isActive ? isActive === 'true' : undefined
    );

    return NextResponse.json({ success: true, data: policies });
  } catch (error) {
    console.error('Error fetching salary structure templates:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch salary structure templates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new salary structure template
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
    const policy = await policyService.createSalaryStructureTemplate({
      ...body,
      organizationId: user.organizationId,
    });

    return NextResponse.json(
      { success: true, data: policy, message: 'Salary structure template created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salary structure template:', error);
    return NextResponse.json(
      {
        error: 'Failed to create salary structure template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
