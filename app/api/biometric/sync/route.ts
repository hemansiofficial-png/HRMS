import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface BiometricAttendance {
  employeeCode: string;
  checkIn?: string;
  checkOut?: string;
  timestamp: string;
  deviceId: string;
  direction?: 'IN' | 'OUT';
}

// Sync attendance from biometric device
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, records }: { deviceId: string; records: BiometricAttendance[] } = body;

    if (!deviceId || !records) {
      return NextResponse.json(
        { error: 'Device ID and records are required' },
        { status: 400 }
      );
    }

    // Verify device exists
    const device = await prisma.biometricDevice.findUnique({
      where: { deviceId }
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const record of records) {
      try {
        // Find employee by employeeCode
        const employee = await prisma.employee.findUnique({
          where: { employeeCode: record.employeeCode }
        });

        if (!employee) {
          results.errors.push(`Employee not found: ${record.employeeCode}`);
          continue;
        }

        const attendanceDate = new Date(record.timestamp);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if attendance record exists for this date
        const existingAttendance = await prisma.attendance.findUnique({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: attendanceDate
            }
          }
        });

        if (existingAttendance) {
          // Update existing record
          const updateData: any = {
            biometricSync: true,
            notes: `Synced from device ${deviceId}`
          };

          if (record.direction === 'IN' || record.checkIn) {
            updateData.checkIn = record.checkIn
              ? new Date(record.checkIn)
              : new Date(record.timestamp);
            updateData.checkInDeviceId = deviceId;
          }

          if (record.direction === 'OUT' || record.checkOut) {
            updateData.checkOut = record.checkOut
              ? new Date(record.checkOut)
              : new Date(record.timestamp);
            updateData.checkOutDeviceId = deviceId;

            // Calculate working hours
            if (updateData.checkIn) {
              const checkIn = new Date(updateData.checkIn);
              const checkOut = new Date(updateData.checkOut);
              updateData.workingHours =
                (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            }
          }

          await prisma.attendance.update({
            where: {
              employeeId_date: {
                employeeId: employee.id,
                date: attendanceDate
              }
            },
            data: updateData
          });

          results.updated++;
        } else {
          // Create new record
          const checkIn =
            record.checkIn ||
            (record.direction === 'IN' ? record.timestamp : null);
          const checkOut =
            record.checkOut ||
            (record.direction === 'OUT' ? record.timestamp : null);

          let workingHours = null;
          if (checkIn && checkOut) {
            workingHours =
              (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60);
          }

          await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: attendanceDate,
              checkIn: checkIn ? new Date(checkIn) : null,
              checkOut: checkOut ? new Date(checkOut) : null,
              checkInDeviceId: record.direction === 'IN' ? deviceId : null,
              checkOutDeviceId: record.direction === 'OUT' ? deviceId : null,
              status: 'PRESENT',
              biometricSync: true,
              workingHours,
              notes: `Synced from device ${deviceId}`
            }
          });

          results.created++;
        }

        results.processed++;
      } catch (error) {
        results.errors.push(
          `Error processing ${record.employeeCode}: ${(error as Error).message}`
        );
      }
    }

    // Update device sync status
    await prisma.biometricDevice.update({
      where: { deviceId },
      data: {
        lastSyncAt: new Date(),
        syncStatus: 'SYNCED'
      }
    });

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Failed to sync biometric attendance:', error);
    return NextResponse.json(
      { error: 'Failed to sync biometric attendance' },
      { status: 500 }
    );
  }
}
