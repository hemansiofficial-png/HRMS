import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, listEmployees } from '@/services/employeeService';
import { Prisma } from '@prisma/client';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const data = await listEmployees(search, departmentId);
    const response = NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return response;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employees', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await createEmployee(payload);
    return NextResponse.json({
      data,
      message: 'Employee created successfully. Default password: Pass@123'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 409 }
        );
      }
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
