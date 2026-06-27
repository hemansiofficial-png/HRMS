import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all salary structure templates
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
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const isActive = searchParams.get('isActive');

    const where: any = { organizationId: user.organizationId };

    if (role) where.role = role;
    if (department) where.department = department;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const structures = await prisma.salaryStructureTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: structures });
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch salary structures',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new salary structure template
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

    if (
      !['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      role,
      department,
      level,
      location,
      components,
      allowances,
      deductions,
      variablePay,
      variablePercentage,
      annualCTC,
      isDefault
    } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.salaryStructureTemplate.updateMany({
        where: {
          organizationId: user.organizationId,
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const structure = await prisma.salaryStructureTemplate.create({
      data: {
        organizationId: user.organizationId,
        name,
        role: role || null,
        department: department || null,
        level: level || null,
        location: location || null,
        components: components || {},
        allowances: allowances || {},
        deductions: deductions || {},
        variablePay: variablePay || false,
        variablePercentage: variablePercentage || 0,
        annualCTC: annualCTC || 0,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json(
      { success: true, data: structure, message: 'Salary structure created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating salary structure:', error);
    return NextResponse.json(
      {
        error: 'Failed to create salary structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update a salary structure template
export async function PUT(request: NextRequest) {
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

    if (
      !['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Structure ID required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      role,
      department,
      level,
      location,
      components,
      allowances,
      deductions,
      variablePay,
      variablePercentage,
      annualCTC,
      isDefault
    } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.salaryStructureTemplate.updateMany({
        where: {
          organizationId: user.organizationId,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const structure = await prisma.salaryStructureTemplate.update({
      where: {
        id,
        organizationId: user.organizationId
      },
      data: {
        name,
        role: role || null,
        department: department || null,
        level: level || null,
        location: location || null,
        components: components || {},
        allowances: allowances || {},
        deductions: deductions || {},
        variablePay: variablePay || false,
        variablePercentage: variablePercentage || 0,
        annualCTC: annualCTC || 0,
        isDefault: isDefault || false
      }
    });

    return NextResponse.json({
      success: true,
      data: structure,
      message: 'Salary structure updated successfully'
    });
  } catch (error) {
    console.error('Error updating salary structure:', error);
    return NextResponse.json(
      {
        error: 'Failed to update salary structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a salary structure template
export async function DELETE(request: NextRequest) {
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

    if (
      !['ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Structure ID required' }, { status: 400 });
    }

    await prisma.salaryStructureTemplate.delete({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Salary structure deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting salary structure:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete salary structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
