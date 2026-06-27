import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Assign shift to employee
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, shiftId } = body;

    if (!employeeId || !shiftId) {
      return NextResponse.json(
        { error: 'Employee ID and Shift ID are required' },
        { status: 400 }
      );
    }

    // Verify shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Update employee with shift assignment
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { shiftId }
    });

    return NextResponse.json({
      success: true,
      message: 'Shift assigned successfully',
      employee
    });
  } catch (error) {
    console.error('Failed to assign shift:', error);
    return NextResponse.json({ error: 'Failed to assign shift' }, { status: 500 });
  }
}
