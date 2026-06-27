import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Approve or reject overtime
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { overtimeId, status, rejectionReason } = body;

    if (!overtimeId || !status) {
      return NextResponse.json(
        { error: 'Overtime ID and Status are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const overtime = await prisma.overtime.update({
      where: { id: overtimeId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedBy: status === 'APPROVED' ? session.user.id : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    // Update attendance record
    await prisma.attendance.update({
      where: { id: overtime.attendanceId },
      data: {
        overtimeApproved: status === 'APPROVED'
      }
    });

    return NextResponse.json({
      success: true,
      message: `Overtime ${status.toLowerCase()} successfully`,
      overtime
    });
  } catch (error) {
    console.error('Failed to update overtime:', error);
    return NextResponse.json({ error: 'Failed to update overtime' }, { status: 500 });
  }
}
