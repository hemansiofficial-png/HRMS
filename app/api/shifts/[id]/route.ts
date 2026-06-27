import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single shift by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            userId: true,
            designation: true,
            departmentId: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Failed to fetch shift:', error);
    return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
  }
}

// Update shift
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        description: body.description,
        startTime: body.startTime,
        endTime: body.endTime,
        breakDuration: body.breakDuration,
        gracePeriod: body.gracePeriod,
        isFlexible: body.isFlexible,
        workingHours: body.workingHours,
        overtimeEligible: body.overtimeEligible,
        nightShift: body.nightShift,
        nightShiftStart: body.nightShiftStart,
        nightShiftEnd: body.nightShiftEnd,
        applicableDays: body.applicableDays,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, shift });
  } catch (error) {
    console.error('Failed to update shift:', error);
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
  }
}

// Delete shift
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if shift has employees assigned
    const employeeCount = await prisma.employee.count({
      where: { shiftId: id }
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete shift. ${employeeCount} employee(s) are assigned to this shift.` },
        { status: 400 }
      );
    }

    await prisma.shift.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Failed to delete shift:', error);
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
  }
}
