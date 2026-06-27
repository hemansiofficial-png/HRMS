import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/onboarding
 * Fetch all onboarding records
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const employeeId = searchParams.get('employeeId');

    // Build where clause
    const where: any = {};
    
    if (stage) {
      where.stage = stage;
    }
    
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Fetch onboarding records
    const onboardingRecords = await prisma.onboardingRecord.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform records
    const records = onboardingRecords.map((record) => ({
      id: record.id,
      employeeId: record.employeeId,
      employeeName: record.employee.user.name,
      employeeEmail: record.employee.user.email,
      department: record.employee.department?.name || 'N/A',
      stage: record.stage,
      startDate: record.startDate.toISOString().split('T')[0],
      completionDate: record.completionDate?.toISOString().split('T')[0],
      documentVerified: record.documentVerified,
      systemAccessProvided: record.systemAccessProvided,
      trainingCompleted: record.trainingSCompleted,
      equipmentProvided: record.equipmentProvided,
      documentsCount: record.documents.length,
      progress: calculateOnboardingProgress(record),
    }));

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error fetching onboarding records:', error);
    return NextResponse.json(
      { message: 'Failed to fetch onboarding records', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Create a new onboarding record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { employeeId, startDate } = payload;

    if (!employeeId || !startDate) {
      return NextResponse.json(
        { message: 'Missing required fields: employeeId, startDate' },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if onboarding already exists
    const existingOnboarding = await prisma.onboardingRecord.findUnique({
      where: { employeeId }
    });

    if (existingOnboarding) {
      return NextResponse.json(
        { message: 'Onboarding record already exists for this employee' },
        { status: 409 }
      );
    }

    // Create onboarding record
    const onboarding = await prisma.onboardingRecord.create({
      data: {
        employeeId,
        stage: 'NOT_STARTED',
        startDate: new Date(startDate),
        documentVerified: false,
        systemAccessProvided: false,
        trainingSCompleted: false,
        equipmentProvided: false,
      },
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
        progress: 0,
      },
      message: 'Onboarding record created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating onboarding record:', error);
    return NextResponse.json(
      { message: 'Failed to create onboarding record', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function calculateOnboardingProgress(record: any): number {
  let completed = 0;
  const total = 5; // 5 stages: documentVerified, systemAccessProvided, trainingSCompleted, equipmentProvided, completion

  if (record.documentVerified) completed++;
  if (record.systemAccessProvided) completed++;
  if (record.trainingSCompleted) completed++;
  if (record.equipmentProvided) completed++;
  if (record.completionDate) completed++;

  return Math.round((completed / total) * 100);
}
