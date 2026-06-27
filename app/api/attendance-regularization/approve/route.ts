import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Approve or reject attendance regularization
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { regularizationId, status, rejectionReason } = body;

    if (!regularizationId || !status) {
      return NextResponse.json(
        { error: 'Regularization ID and Status are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Get the regularization request
    const regularization = await prisma.attendanceRegularization.findUnique({
      where: { id: regularizationId },
      include: { employee: true }
    });

    if (!regularization) {
      return NextResponse.json(
        { error: 'Regularization request not found' },
        { status: 404 }
      );
    }

    if (regularization.status !== 'PENDING' && regularization.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    // Update regularization status
    const updatedRegularization = await prisma.attendanceRegularization.update({
      where: { id: regularizationId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedBy: status === 'APPROVED' ? session.user.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    // If approved, create or update the attendance record
    if (status === 'APPROVED') {
      const today = new Date(regularization.date);
      today.setHours(0, 0, 0, 0);

      // Check if attendance record exists
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: regularization.employeeId,
            date: today
          }
        }
      });

      if (existingAttendance) {
        // Update existing attendance
        await prisma.attendance.update({
          where: {
            employeeId_date: {
              employeeId: regularization.employeeId,
              date: today
            }
          },
          data: {
            checkIn: regularization.proposedCheckIn || existingAttendance.checkIn,
            checkOut: regularization.proposedCheckOut || existingAttendance.checkOut,
            isRegularized: true,
            notes: `Regularized by ${session.user.email || session.user.id}`
          }
        });
      } else {
        // Create new attendance record
        let workingHours = null;
        if (regularization.proposedCheckIn && regularization.proposedCheckOut) {
          workingHours = (
            new Date(regularization.proposedCheckOut).getTime() -
            new Date(regularization.proposedCheckIn).getTime()
          ) / (1000 * 60 * 60);
        }

        await prisma.attendance.create({
          data: {
            employeeId: regularization.employeeId,
            date: today,
            checkIn: regularization.proposedCheckIn || null,
            checkOut: regularization.proposedCheckOut || null,
            status: 'PRESENT',
            workingHours,
            isRegularized: true,
            notes: `Created via regularization by ${session.user.email || session.user.id}`
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Regularization ${status.toLowerCase()} successfully`,
      regularization: updatedRegularization
    });
  } catch (error) {
    console.error('Failed to process regularization:', error);
    return NextResponse.json(
      { error: 'Failed to process regularization' },
      { status: 500 }
    );
  }
}
