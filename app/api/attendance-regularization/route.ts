import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET attendance regularization requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) {
      where.status = status.toUpperCase();
    }

    const regularizationRequests = await prisma.attendanceRegularization.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            userId: true,
            designation: true,
            departmentId: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ regularizationRequests });
  } catch (error) {
    console.error('Failed to fetch regularization requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regularization requests' },
      { status: 500 }
    );
  }
}

// Create attendance regularization request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, date, reason, missingDetails, proposedCheckIn, proposedCheckOut } = body;

    // Validate required fields
    if (!employeeId || !date || !reason) {
      return NextResponse.json(
        { error: 'Employee ID, Date, and Reason are required' },
        { status: 400 }
      );
    }

    // Get employee to find approver
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { manager: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if regularization already exists for this date
    const existingRequest = await prisma.attendanceRegularization.findFirst({
      where: {
        employeeId,
        date: new Date(date)
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Regularization request already exists for this date' },
        { status: 400 }
      );
    }

    // Create regularization request
    const regularization = await prisma.attendanceRegularization.create({
      data: {
        employeeId,
        date: new Date(date),
        reason,
        missingDetails: missingDetails || [],
        proposedCheckIn: proposedCheckIn ? new Date(proposedCheckIn) : null,
        proposedCheckOut: proposedCheckOut ? new Date(proposedCheckOut) : null,
        status: 'PENDING',
        approvedBy: null
      }
    });

    return NextResponse.json(
      {
        success: true,
        regularization,
        message: 'Regularization request submitted for approval'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create regularization request:', error);
    return NextResponse.json(
      { error: 'Failed to create regularization request' },
      { status: 500 }
    );
  }
}
