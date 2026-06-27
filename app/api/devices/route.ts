import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Employees can only see their own devices
    if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({
        where: { userId: session.user.id }
      });

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }

      // Fetch real devices from database
      const devices = await prisma.assignedAsset.findMany({
        where: { employeeId: employee.id },
        orderBy: { assignmentDate: 'desc' }
      });

      return NextResponse.json({ data: devices });
    }

    // Admins can see all devices
    const allDevices = await prisma.assignedAsset.findMany({
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
        }
      },
      orderBy: { assignmentDate: 'desc' }
    });

    return NextResponse.json({ data: allDevices });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { employeeId, assetName, assetTag, serialNumber, description, assignmentDate, condition, status } = await request.json();

    // Verify user is admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create device in database
    const device = await prisma.assignedAsset.create({
      data: {
        employeeId,
        assetName,
        assetTag,
        serialNumber,
        description: description || null,
        assignmentDate: assignmentDate ? new Date(assignmentDate) : new Date(),
        condition: condition || 'Good',
        status: status || 'ACTIVE',
        returnDate: null
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
        }
      }
    });

    return NextResponse.json({ data: device }, { status: 201 });
  } catch (error) {
    console.error('Error creating device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { assetName, assetTag, serialNumber, condition, status, employeeId } = body;

    const device = await prisma.assignedAsset.update({
      where: { id },
      data: {
        assetName,
        assetTag,
        serialNumber,
        condition,
        status,
        employeeId
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
        }
      }
    });

    return NextResponse.json({ data: device });
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.assignedAsset.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
