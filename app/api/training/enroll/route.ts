import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * POST /api/training/enroll
 * Enroll the current user in a course
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { courseId } = payload;

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { employee: true }
    });

    if (!user?.employee) {
      return NextResponse.json(
        { message: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Get course details
    const course = await prisma.onlineCourse.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.trainingEnrollment.findFirst({
      where: {
        employeeId: user.employee.id,
        trainingName: course.name,
        trainingProvider: course.provider
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: 'Already enrolled in this course' },
        { status: 409 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.trainingEnrollment.create({
      data: {
        employeeId: user.employee.id,
        trainingName: course.name,
        trainingProvider: course.provider,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ENROLLED',
      }
    });

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in course'
    }, { status: 201 });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { message: 'Failed to enroll in course', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
