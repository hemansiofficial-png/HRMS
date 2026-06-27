import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Disable caching for attendance API
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const date = searchParams.get('date');
  const allEmployees = searchParams.get('allEmployees') === 'true';

  // Get employee by user ID
  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id }
  });

  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const responseHeaders = {
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // If fetching for all employees (for team dashboard)
  if (allEmployees) {
    let startDate: Date;
    let endDate: Date;

    // If specific date is provided, use it; otherwise use month range
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      startDate = targetDate;
      endDate = targetDate;
    } else if (month && year) {
      // Get attendance for the entire month
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        employee: {
          organizationId: employee.organizationId || undefined
        }
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        shift: true
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ data: attendance }, { headers: responseHeaders });
  }

  // Individual attendance
  const startDate = month && year ? new Date(parseInt(year), parseInt(month) - 1, 1) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'desc' }
  });

  return NextResponse.json({ attendance, employee }, { headers: responseHeaders });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const employee = await prisma.employee.findUnique({
    where: { userId: session.user.id }
  });

  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

  const { action, latitude, longitude, accuracy } = await request.json();

  if (action === 'check-in') {
    // Get user's LOCAL date (not UTC date)
    // This ensures the date represents the calendar day when the user checked in
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth(); // 0-indexed
    const localDay = now.getDate();
    
    // Create UTC midnight for the user's LOCAL date
    // This way, March 24 in India = March 24 00:00 UTC in database
    const dateUTC = new Date(Date.UTC(localYear, localMonth, localDay));

    const locationData = latitude && longitude ? {
      latitude,
      longitude,
      accuracy: accuracy || null
    } : null;

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: dateUTC } },
      update: { 
        checkIn: new Date(), 
        status: 'PRESENT',
        ...(locationData && { checkInLocation: locationData })
      },
      create: { 
        employeeId: employee.id, 
        date: dateUTC, 
        checkIn: new Date(), 
        status: 'PRESENT',
        ...(locationData && { checkInLocation: locationData })
      }
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  }

  if (action === 'check-out') {
    // Get user's LOCAL date (not UTC date)
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = now.getMonth(); // 0-indexed
    const localDay = now.getDate();
    
    // Create UTC midnight for the user's LOCAL date
    const dateUTC = new Date(Date.UTC(localYear, localMonth, localDay));

    const locationData = latitude && longitude ? {
      latitude,
      longitude,
      accuracy: accuracy || null
    } : null;

    const record = await prisma.attendance.update({
      where: { employeeId_date: { employeeId: employee.id, date: dateUTC } },
      data: { 
        checkOut: new Date(),
        ...(locationData && { checkOutLocation: locationData })
      }
    });

    return NextResponse.json({ success: true, data: record });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
