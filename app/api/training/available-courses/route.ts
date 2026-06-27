import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/training/available-courses
 * Fetch all available online courses for enrollment
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.onlineCourse.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Transform courses to match UI expectations
    const availableCourses = courses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description || '',
      provider: course.provider,
      hours: course.duration,
      difficulty: course.level,
    }));

    return NextResponse.json(availableCourses, { status: 200 });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch available courses', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
