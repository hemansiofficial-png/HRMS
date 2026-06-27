import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as policyService from '@/services/policyService';

// DELETE - Unassign a policy
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
    await policyService.unassignPolicy(id);

    return NextResponse.json({ success: true, message: 'Policy unassigned successfully' });
  } catch (error) {
    console.error('Error unassigning policy:', error);
    return NextResponse.json(
      { error: 'Failed to unassign policy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
