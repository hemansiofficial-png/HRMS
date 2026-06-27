import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch payroll configuration
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

    // Get the latest configuration
    const config = await prisma.payrollConfiguration.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!config) {
      // Return default configuration
      return NextResponse.json({
        success: true,
        data: {
          workingDaysPerMonth: 26,
          workingDaysPerWeek: 6,
          dailyHours: 8,
          overtimeRate: 2,
          unpaidLeaveDeduction: 1,
          halfDayDeduction: 0.5,
          lateThreshold: 3,
          lateDeductionDays: 1,
          pfEmployeeRate: 12,
          pfEmployerRate: 12,
          pfMaxSalary: 15000,
          esiEmployeeRate: 0.75,
          esiEmployerRate: 3.25,
          esiMaxSalary: 21000,
          professionalTax: 200,
          tdsBasicExemption: 300000,
          tdsRebateLimit: 500000,
          bonusPercentage: 8.33,
          bonusMinAmount: 0,
          lateFinePerDay: 100,
          requireApproval: true,
          autoApproveThreshold: 0,
          noticePeriodDays: 30,
          leaveEncashmentDays: 30,
          isActive: true
        }
      });
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching payroll configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payroll configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create/Update payroll configuration
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

    if (
      !user ||
      !user.organizationId ||
      !['ADMIN', 'PAYROLL_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const config = await prisma.payrollConfiguration.create({
      data: {
        ...body,
        name: body.name || `Config_${new Date().toISOString()}`,
        date: new Date()
      }
    });

    return NextResponse.json(
      { success: true, data: config, message: 'Payroll configuration saved successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving payroll configuration:', error);
    return NextResponse.json(
      {
        error: 'Failed to save payroll configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
