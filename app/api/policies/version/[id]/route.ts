import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// POST - Activate a policy version
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const version = await policyService.activatePolicyVersion(id);

    return NextResponse.json({ success: true, data: version, message: 'Policy version activated' });
  } catch (error) {
    console.error('Error activating policy version:', error);
    return NextResponse.json(
      { error: 'Failed to activate policy version', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
