import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all salary revisions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    const where: any = {
      employee: {
        organizationId: user.organizationId
      }
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const revisions = await prisma.salaryRevision.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
            department: true
          }
        },
        payroll: true
      },
      orderBy: { revisionDate: 'desc' }
    });

    return NextResponse.json({ success: true, data: revisions });
  } catch (error) {
    console.error('Error fetching salary revisions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch salary revisions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new salary revision
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      employeeId,
      revisionType,
      revisionDate,
      previousSalary,
      newSalary,
      reason,
      effectiveFrom,
      approvedBy,
      remarks,
      previousStructureId,
      newStructureId
    } = body;

    if (!employeeId || !revisionType || !newSalary || !effectiveFrom) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate revision amount and percentage
    const revisionAmount = newSalary - previousSalary;
    const revisionPercentage = previousSalary > 0 ? ((revisionAmount / previousSalary) * 100) : 0;

    // Create salary revision record
    const revision = await prisma.salaryRevision.create({
      data: {
        employeeId,
        revisionType,
        revisionDate: new Date(revisionDate || Date.now()),
        previousSalary: previousSalary || 0,
        newSalary,
        revisionAmount,
        revisionPercentage,
        reason: reason || null,
        effectiveFrom: new Date(effectiveFrom),
        approvedBy: approvedBy || user.id,
        remarks: remarks || null,
        previousStructureId: previousStructureId || null,
        newStructureId: newStructureId || null
      },
      include: {
        employee: {
          include: {
            user: true,
            department: true
          }
        }
      }
    });

    // Update employee's salary
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        salary: newSalary
      }
    });

    return NextResponse.json(
      { success: true, data: revision, message: 'Salary revision created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salary revision:', error);
    return NextResponse.json(
      {
        error: 'Failed to create salary revision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
