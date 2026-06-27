import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET overtime records
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) {
      where.status = status.toUpperCase();
    }
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      where.date = { gte: startDate, lte: endDate };
    }

    const overtimeRecords = await prisma.overtime.findMany({
      where,
      include: {
        attendance: {
          select: {
            date: true,
            checkIn: true,
            checkOut: true,
            shift: {
              select: {
                name: true,
                startTime: true,
                endTime: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate summary
    const summary = {
      totalHours: overtimeRecords.reduce((sum, record) => sum + record.durationHours, 0),
      totalAmount: overtimeRecords.reduce(
        (sum, record) => sum + parseFloat(record.amount.toString()),
        0
      ),
      pendingCount: overtimeRecords.filter(r => r.status === 'PENDING').length,
      approvedCount: overtimeRecords.filter(r => r.status === 'APPROVED').length
    };

    return NextResponse.json({ overtimeRecords, summary });
  } catch (error) {
    console.error('Failed to fetch overtime:', error);
    return NextResponse.json({ error: 'Failed to fetch overtime' }, { status: 500 });
  }
}

// Create overtime request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attendanceId, employeeId, date, startTime, endTime, reason, rate } = body;

    if (!attendanceId || !employeeId || !date || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: 'Attendance ID, Employee ID, Date, Start Time, and End Time are required'
        },
        { status: 400 }
      );
    }

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Get overtime policy
    const overtimePolicy = await prisma.overtimePolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate rate and amount
    const otRate = rate || overtimePolicy?.otRate || 2;
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        employee: {
          select: { salary: true }
        }
      }
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Calculate amount based on policy
    let amount = 0;
    if (overtimePolicy?.otCalculationBase === 'HOURLY_BASIC') {
      const hourlyRate = parseFloat(attendance.employee.salary.toString()) / (26 * 8);
      amount = hourlyRate * durationHours * otRate;
    } else if (overtimePolicy?.fixedOtRate) {
      amount = parseFloat(overtimePolicy.fixedOtRate.toString()) * durationHours;
    } else {
      const hourlyRate = parseFloat(attendance.employee.salary.toString()) / (26 * 8);
      amount = hourlyRate * durationHours * otRate;
    }

    // Check if approval is required
    const status = overtimePolicy?.approvalRequired ? 'PENDING' : 'APPROVED';

    const overtime = await prisma.overtime.create({
      data: {
        attendanceId,
        employeeId,
        date: new Date(date),
        startTime: start,
        endTime: end,
        durationHours,
        rate: otRate,
        amount,
        reason: reason || null,
        status
      }
    });

    // Update attendance with overtime hours
    await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        overtimeHours: durationHours,
        overtimeApproved: status === 'APPROVED'
      }
    });

    return NextResponse.json({ success: true, overtime }, { status: 201 });
  } catch (error) {
    console.error('Failed to create overtime:', error);
    return NextResponse.json({ error: 'Failed to create overtime' }, { status: 500 });
  }
}
