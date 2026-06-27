import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET all biometric devices or filter by organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const isActive = searchParams.get('isActive');
    const deviceType = searchParams.get('deviceType');

    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (deviceType) {
      where.deviceType = deviceType;
    }

    const devices = await prisma.biometricDevice.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Failed to fetch biometric devices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric devices' },
      { status: 500 }
    );
  }
}

// Register a new biometric device
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, deviceId, deviceType, ipAddress, location, serialNumber, organizationId } = body;

    // Validate required fields
    if (!name || !deviceId || !deviceType) {
      return NextResponse.json(
        { error: 'Name, Device ID, and Device Type are required' },
        { status: 400 }
      );
    }

    // Check if device ID already exists
    const existingDevice = await prisma.biometricDevice.findUnique({
      where: { deviceId }
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'Device ID already exists' },
        { status: 400 }
      );
    }

    const device = await prisma.biometricDevice.create({
      data: {
        name,
        deviceId,
        deviceType,
        ipAddress: ipAddress || null,
        location: location || null,
        serialNumber: serialNumber || null,
        organizationId: organizationId || null,
        isActive: true,
        syncStatus: 'IDLE'
      }
    });

    return NextResponse.json({ success: true, device }, { status: 201 });
  } catch (error) {
    console.error('Failed to register biometric device:', error);
    return NextResponse.json(
      { error: 'Failed to register biometric device' },
      { status: 500 }
    );
  }
}
