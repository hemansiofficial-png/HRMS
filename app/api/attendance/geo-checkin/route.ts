import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Geo-location based check-in
export async function POST(request: NextRequest) {
  try {
    console.log('Geo-checkin API called');
    const session = await auth();
    console.log('Session:', session?.user?.id ? 'User authenticated' : 'No session');

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { latitude, longitude, accuracy, address, action = 'check-in' } = body;

    // Validate location data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required for geo-location check-in' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: { shift: true, organization: true }
    });
    console.log('Employee found:', employee?.id ? 'Yes' : 'No');

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found. Please contact HR.' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const locationData: GeoLocation = {
      latitude,
      longitude,
      accuracy: accuracy || null,
      address: address || null
    };

    if (action === 'check-in') {
      console.log('Processing check-in...');

      // Check if already checked in today
      const existingRecord = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        }
      });
      console.log('Existing record:', existingRecord ? 'Found' : 'None');

      if (existingRecord?.checkIn) {
        return NextResponse.json(
          { error: 'Already checked in today', existingRecord },
          { status: 400 }
        );
      }

      // Get office location from organization
      const officeLat = employee.organization?.latitude || null;
      const officeLon = employee.organization?.longitude || null;
      let distanceFromOffice = null;
      let isWithinRadius = true;

      console.log('Office location:', { officeLat, officeLon });

      // Calculate distance from office if office location is set
      if (officeLat && officeLon) {
        distanceFromOffice = calculateDistance(officeLat, officeLon, latitude, longitude);
        // Default radius: 100 meters
        const allowedRadius = employee.organization?.geoFenceRadius || 100;
        isWithinRadius = distanceFromOffice <= allowedRadius;
        console.log('Distance from office:', distanceFromOffice, 'm, Within radius:', isWithinRadius);
      }

      // Determine status based on shift timing
      let status: 'PRESENT' | 'LATE' = 'PRESENT';
      if (employee.shift) {
        const [shiftHours, shiftMinutes] = employee.shift.startTime.split(':').map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(shiftHours, shiftMinutes, 0, 0);

        const gracePeriod = employee.shift.gracePeriod || 15;
        const lateThreshold = new Date(shiftStart);
        lateThreshold.setMinutes(lateThreshold.getMinutes() + gracePeriod);

        if (new Date() > lateThreshold) {
          status = 'LATE';
          console.log('Employee is LATE');
        }
      }

      console.log('Creating attendance record with status:', status);

      // Create or update attendance record
      const attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        },
        update: {
          checkIn: new Date(),
          status,
          checkInLocation: locationData as any,
          shiftId: employee.shiftId || null
        },
        create: {
          employeeId: employee.id,
          date: today,
          checkIn: new Date(),
          status,
          checkInLocation: locationData as any,
          shiftId: employee.shiftId || null
        }
      });

      console.log('Attendance created:', attendance.id);

      return NextResponse.json(
        {
          success: true,
          data: attendance,
          location: {
            distanceFromOffice: distanceFromOffice ? Math.round(distanceFromOffice) : null,
            isWithinRadius,
            checkInTime: attendance.checkIn
          }
        },
        { status: 201 }
      );
    }

    if (action === 'check-out') {
      console.log('Processing check-out...');

      // Get today's attendance record
      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        }
      });
      console.log('Attendance record:', attendance ? 'Found' : 'None');

      if (!attendance?.checkIn) {
        return NextResponse.json(
          { error: 'No check-in record found for today. Please check in first.' },
          { status: 400 }
        );
      }

      if (attendance.checkOut) {
        return NextResponse.json(
          { error: 'Already checked out today' },
          { status: 400 }
        );
      }

      // Get office location
      const officeLat = employee.organization?.latitude || null;
      const officeLon = employee.organization?.longitude || null;
      let distanceFromOffice = null;

      if (officeLat && officeLon) {
        distanceFromOffice = calculateDistance(officeLat, officeLon, latitude, longitude);
      }

      // Update attendance with check-out
      const updatedAttendance = await prisma.attendance.update({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        },
        data: {
          checkOut: new Date(),
          checkOutLocation: locationData as any
        }
      });

      console.log('Check-out recorded:', updatedAttendance.id);

      // Calculate working hours
      const workingHours = attendance.checkIn
        ? (new Date().getTime() - new Date(attendance.checkIn).getTime()) / (1000 * 60 * 60)
        : 0;

      return NextResponse.json({
        success: true,
        data: updatedAttendance,
        location: {
          distanceFromOffice: distanceFromOffice ? Math.round(distanceFromOffice) : null,
          checkOutTime: updatedAttendance.checkOut
        },
        workingHours: workingHours.toFixed(2)
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "check-in" or "check-out"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Geo-location attendance failed:', error);
    return NextResponse.json(
      { error: 'Failed to process geo-location attendance' },
      { status: 500 }
    );
  }
}

// Get employee's check-in location history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    let startDate: Date;
    let endDate: Date;

    if (month && year) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(month), 0);
    } else {
      startDate = new Date();
      startDate.setDate(1);
      endDate = new Date();
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        date: {
          gte: startDate,
          lte: endDate
        },
        OR: [
          { checkInLocation: { not: { equals: null } } },
          { checkOutLocation: { not: { equals: null } } }
        ]
      },
      select: {
        id: true,
        date: true,
        checkIn: true,
        checkOut: true,
        checkInLocation: true,
        checkOutLocation: true,
        status: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ attendanceRecords });
  } catch (error) {
    console.error('Failed to fetch location history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location history' },
      { status: 500 }
    );
  }
}
