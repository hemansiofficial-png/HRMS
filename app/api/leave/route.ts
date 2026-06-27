import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitLeave } from '@/services/leaveService';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
  
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Build query based on user role and filters
    let whereClause: any = {};
    
    // If employeeId is provided (for employees viewing their own requests)
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }
    
    const data = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: true,
            department: true
          }
        },
        approver: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const data = await submitLeave(payload);

  return NextResponse.json({ data }, {
    status: 201,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
