import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get employee ID from session if not provided
    let targetEmployeeId = employeeId;
    
    if (!targetEmployeeId) {
      // Get the employee ID from the session user
      const user = await prisma.user.findUnique({
        where: { id: session.user?.id },
        include: { employee: true }
      });
      targetEmployeeId = user?.employee?.id ?? null;
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get current year
    const currentYear = new Date().getFullYear();

    // Fetch leave balances for the current year
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId: targetEmployeeId,
        year: currentYear
      }
    });

    // If no balances exist, create default balances
    if (balances.length === 0) {
      const defaultBalances = [
        { leaveType: 'ANNUAL', totalDays: 15, usedDays: 0, remainingDays: 15 },
        { leaveType: 'SICK', totalDays: 10, usedDays: 0, remainingDays: 10 },
        { leaveType: 'CASUAL', totalDays: 5, usedDays: 0, remainingDays: 5 },
        { leaveType: 'MATERNITY', totalDays: 90, usedDays: 0, remainingDays: 90 },
      ];

      await prisma.leaveBalance.createMany({
        data: defaultBalances.map(b => ({
          employeeId: targetEmployeeId,
          leaveType: b.leaveType as any,
          totalDays: b.totalDays,
          usedDays: b.usedDays,
          remainingDays: b.remainingDays,
          year: currentYear
        }))
      });

      const newBalances = await prisma.leaveBalance.findMany({
        where: {
          employeeId: targetEmployeeId,
          year: currentYear
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: newBalances,
        year: currentYear
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: balances,
      year: currentYear
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave balance' },
      { status: 500 }
    );
  }
}
