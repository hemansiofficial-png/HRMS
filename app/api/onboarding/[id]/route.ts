import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/onboarding/[id]
 * Fetch a single onboarding record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const onboarding = await prisma.onboardingRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            department: { select: { name: true } }
          }
        },
        documents: true
      }
    });

    if (!onboarding) {
      return NextResponse.json(
        { message: 'Onboarding record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: onboarding.id,
      employeeId: onboarding.employeeId,
      employeeName: onboarding.employee.user.name,
      employeeEmail: onboarding.employee.user.email,
      department: onboarding.employee.department?.name || 'N/A',
      stage: onboarding.stage,
      startDate: onboarding.startDate.toISOString().split('T')[0],
      completionDate: onboarding.completionDate?.toISOString().split('T')[0],
      documentVerified: onboarding.documentVerified,
      systemAccessProvided: onboarding.systemAccessProvided,
      trainingCompleted: onboarding.trainingSCompleted,
      equipmentProvided: onboarding.equipmentProvided,
      documents: onboarding.documents.map((doc) => ({
        id: doc.id,
        documentName: doc.documentName,
        documentUrl: doc.documentUrl,
        isVerified: doc.isVerified,
        verifiedBy: doc.verifiedBy,
        verificationDate: doc.verificationDate?.toISOString().split('T')[0],
      })),
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching onboarding record:', error);
    return NextResponse.json(
      { message: 'Failed to fetch onboarding record', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/onboarding/[id]
 * Update an onboarding record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const payload = await request.json();

    // Check if onboarding exists
    const existingOnboarding = await prisma.onboardingRecord.findUnique({
      where: { id }
    });

    if (!existingOnboarding) {
      return NextResponse.json(
        { message: 'Onboarding record not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (payload.stage !== undefined) updateData.stage = payload.stage;
    if (payload.startDate !== undefined) updateData.startDate = new Date(payload.startDate);
    if (payload.documentVerified !== undefined) updateData.documentVerified = payload.documentVerified;
    if (payload.systemAccessProvided !== undefined) updateData.systemAccessProvided = payload.systemAccessProvided;
    if (payload.trainingSCompleted !== undefined) updateData.trainingSCompleted = payload.trainingSCompleted;
    if (payload.equipmentProvided !== undefined) updateData.equipmentProvided = payload.equipmentProvided;
    
    // Auto-set completion date when all tasks are done
    const willBeCompleted = (
      (payload.documentVerified ?? existingOnboarding.documentVerified) &&
      (payload.systemAccessProvided ?? existingOnboarding.systemAccessProvided) &&
      (payload.trainingSCompleted ?? existingOnboarding.trainingSCompleted) &&
      (payload.equipmentProvided ?? existingOnboarding.equipmentProvided)
    );
    
    if (willBeCompleted && !existingOnboarding.completionDate) {
      updateData.completionDate = new Date();
      updateData.stage = 'COMPLETED';
    }

    // Update onboarding
    const onboarding = await prisma.onboardingRecord.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            department: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json({
      data: {
        id: onboarding.id,
        employeeId: onboarding.employeeId,
        employeeName: onboarding.employee.user.name,
        employeeEmail: onboarding.employee.user.email,
        department: onboarding.employee.department?.name || 'N/A',
        stage: onboarding.stage,
        startDate: onboarding.startDate.toISOString().split('T')[0],
        completionDate: onboarding.completionDate?.toISOString().split('T')[0],
      },
      message: 'Onboarding record updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating onboarding record:', error);
    return NextResponse.json(
      { message: 'Failed to update onboarding record', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/onboarding/[id]
 * Delete an onboarding record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if onboarding exists
    const existingOnboarding = await prisma.onboardingRecord.findUnique({
      where: { id }
    });

    if (!existingOnboarding) {
      return NextResponse.json(
        { message: 'Onboarding record not found' },
        { status: 404 }
      );
    }

    await prisma.onboardingRecord.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Onboarding record deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting onboarding record:', error);
    return NextResponse.json(
      { message: 'Failed to delete onboarding record', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
