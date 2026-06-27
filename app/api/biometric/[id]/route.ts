import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single device by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const device = await prisma.biometricDevice.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({ device });
  } catch (error) {
    console.error('Failed to fetch device:', error);
    return NextResponse.json({ error: 'Failed to fetch device' }, { status: 500 });
  }
}

// Update device
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const device = await prisma.biometricDevice.update({
      where: { id },
      data: {
        name: body.name,
        ipAddress: body.ipAddress,
        location: body.location,
        isActive: body.isActive,
        syncStatus: body.syncStatus,
        lastSyncAt: body.lastSyncAt ? new Date(body.lastSyncAt) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, device });
  } catch (error) {
    console.error('Failed to update device:', error);
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

// Delete device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.biometricDevice.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Failed to delete device:', error);
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
