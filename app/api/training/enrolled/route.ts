import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/training/enrolled
 * Fetch all training enrollments for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        employee: {
          include: {
            trainingEnrollments: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user?.employee) {
      return NextResponse.json([], { status: 200 });
    }

    // Transform enrollments to match UI expectations
    const trainings = user.employee.trainingEnrollments.map((enrollment) => ({
      id: enrollment.id,
      courseName: enrollment.trainingName,
      provider: enrollment.trainingProvider,
      enrollmentDate: enrollment.startDate.toISOString().split('T')[0],
      completionDate: enrollment.endDate?.toISOString().split('T')[0],
      status: enrollment.status,
      hours: 0, // Not stored in DB, would need to be calculated from course
      certificate: !!enrollment.certificateUrl,
    }));

    return NextResponse.json(trainings, { status: 200 });
  } catch (error) {
    console.error('Error fetching enrolled trainings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch enrolled trainings', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
