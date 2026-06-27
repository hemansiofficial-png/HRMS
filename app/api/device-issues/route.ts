import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch device issues for the logged-in user
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Admins can see all issues
    if (role === 'ADMIN' || ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      const issues = await prisma.deviceIssue.findMany({
        include: {
          device: {
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
          }
        },
        orderBy: { reportedDate: 'desc' }
      });
      return NextResponse.json({ data: issues });
    }

    // Employees can only see their own issues
    const issues = await prisma.deviceIssue.findMany({
      where: {
        device: {
          employee: {
            id: employee.id
          }
        }
      },
      include: {
        device: true
      },
      orderBy: { reportedDate: 'desc' }
    });

    return NextResponse.json({ data: issues });
  } catch (error) {
    console.error('Error fetching device issues:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new device issue report
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deviceId, issue, severity } = body;

    // Validate required fields
    if (!deviceId || !issue || !severity) {
      return NextResponse.json(
        { error: 'Missing required fields: deviceId, issue, severity' },
        { status: 400 }
      );
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be one of: low, medium, high' },
        { status: 400 }
      );
    }

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify the device belongs to the employee
    const device = await prisma.assignedAsset.findUnique({
      where: { id: deviceId }
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    if (device.employeeId !== employee.id) {
      return NextResponse.json(
        { error: 'You can only report issues for devices assigned to you' },
        { status: 403 }
      );
    }

    // Create the device issue
    const deviceIssue = await prisma.deviceIssue.create({
      data: {
        deviceId,
        employeeId: employee.id,
        issue,
        severity,
        status: 'open'
      },
      include: {
        device: true
      }
    });

    return NextResponse.json({ data: deviceIssue }, { status: 201 });
  } catch (error) {
    console.error('Error creating device issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a device issue
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('id');

    if (!issueId) {
      return NextResponse.json({ error: 'Issue ID required' }, { status: 400 });
    }

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Get the issue
    const issue = await prisma.deviceIssue.findUnique({
      where: { id: issueId },
      include: {
        device: true
      }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if user owns the issue or is admin
    const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(session.user.role || '');
    const isOwner = issue.device.assignedTo === employee.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized to delete this issue' }, { status: 403 });
    }

    // Delete the issue
    await prisma.deviceIssue.delete({
      where: { id: issueId }
    });

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting device issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a device issue status and resolution
export async function PUT(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('id');

    if (!issueId) {
      return NextResponse.json({ error: 'Issue ID required' }, { status: 400 });
    }

    // Check if user is admin/HR
    const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(session.user.role || '');
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins and HR can update issue status' }, { status: 403 });
    }

    const body = await request.json();
    const { status, resolution } = body;

    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: open, in-progress, resolved' },
        { status: 400 }
      );
    }

    // Get the issue
    const issue = await prisma.deviceIssue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Update the issue
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolvedDate = new Date();
        updateData.resolvedBy = session.user.id;
      }
    }
    
    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }

    const updatedIssue = await prisma.deviceIssue.update({
      where: { id: issueId },
      data: updateData,
      include: {
        device: {
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
        }
      }
    });

    return NextResponse.json({ data: updatedIssue });
  } catch (error) {
    console.error('Error updating device issue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
