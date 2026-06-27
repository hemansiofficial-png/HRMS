import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch all holidays
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
    const year = searchParams.get('year');
    const isNational = searchParams.get('isNational');

    const where: any = {
      OR: [
        { isNational: true },
        { organizationId: user.organizationId }
      ]
    };

    if (isNational !== null && isNational !== undefined) {
      if (isNational === 'true') {
        where.isNational = true;
      } else if (isNational === 'false') {
        where.isNational = false;
        where.organizationId = user.organizationId;
      }
    }

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Filter by year if provided
    let filteredHolidays = holidays;
    if (year) {
      filteredHolidays = holidays.filter(
        h => new Date(h.date).getFullYear().toString() === year
      );
    }

    return NextResponse.json({ success: true, data: filteredHolidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch holidays',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new holiday
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
      !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, date, description, isNational } = body;

    // Check for duplicate
    const existing = await prisma.holiday.findFirst({
      where: {
        name,
        date: new Date(date),
        OR: [
          { isNational: true },
          { organizationId: user.organizationId }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Holiday with this name and date already exists' },
        { status: 400 }
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        date: new Date(date),
        description,
        isNational: isNational ?? false,
        organizationId: isNational ? null : user.organizationId
      }
    });

    return NextResponse.json(
      { success: true, data: holiday, message: 'Holiday created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json(
      {
        error: 'Failed to create holiday',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update a holiday
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
      !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, date, description, isNational } = body;

    // Verify the holiday belongs to the organization or is national
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    if (
      !existingHoliday.isNational &&
      existingHoliday.organizationId !== user.organizationId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this holiday' },
        { status: 403 }
      );
    }

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name,
        date: new Date(date),
        description,
        isNational: isNational ?? existingHoliday.isNational,
        organizationId: isNational ? null : user.organizationId
      }
    });

    return NextResponse.json({
      success: true,
      data: holiday,
      message: 'Holiday updated successfully'
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    return NextResponse.json(
      {
        error: 'Failed to update holiday',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a holiday
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
      !['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID required' }, { status: 400 });
    }

    // Verify the holiday belongs to the organization
    const holiday = await prisma.holiday.findUnique({
      where: { id }
    });

    if (!holiday) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    if (
      !holiday.isNational &&
      holiday.organizationId !== user.organizationId
    ) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this holiday' },
        { status: 403 }
      );
    }

    await prisma.holiday.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete holiday',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
