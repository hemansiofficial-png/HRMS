import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all shifts or get shifts by organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    const shifts = await prisma.shift.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
  }
}

// Create a new shift
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      code,
      description,
      startTime,
      endTime,
      breakDuration,
      gracePeriod,
      isFlexible,
      workingHours,
      overtimeEligible,
      nightShift,
      nightShiftStart,
      nightShiftEnd,
      applicableDays,
      organizationId
    } = body;

    // Validate required fields
    if (!name || !code || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, code, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingShift = await prisma.shift.findUnique({
      where: { code }
    });

    if (existingShift) {
      return NextResponse.json(
        { error: 'Shift code already exists' },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        name,
        code,
        description: description || null,
        startTime,
        endTime,
        breakDuration: breakDuration || 30,
        gracePeriod: gracePeriod || 15,
        isFlexible: isFlexible || false,
        workingHours: workingHours || 8,
        overtimeEligible: overtimeEligible !== false,
        nightShift: nightShift || false,
        nightShiftStart: nightShiftStart || null,
        nightShiftEnd: nightShiftEnd || null,
        applicableDays: applicableDays || [1, 2, 3, 4, 5],
        organizationId: organizationId || null
      }
    });

    return NextResponse.json({ success: true, shift }, { status: 201 });
  } catch (error) {
    console.error('Failed to create shift:', error);
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
  }
}
