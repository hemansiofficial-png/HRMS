import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/engagement/surveys/[id]
 * Fetch a single survey with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        responses: {
          include: {
            employee: {
              select: {
                employeeCode: true,
                department: { select: { name: true } }
              }
            }
          }
        },
        creator: {
          select: { name: true, email: true }
        }
      }
    });

    if (!survey) {
      return NextResponse.json(
        { message: 'Survey not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = survey.endDate < now;
    const isActive = survey.isActive && !isExpired;

    return NextResponse.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      type: survey.surveyType,
      status: isActive ? 'ACTIVE' : 'COMPLETED',
      startDate: survey.startDate.toISOString().split('T')[0],
      endDate: survey.endDate.toISOString().split('T')[0],
      createdBy: survey.creator.name,
      questions: survey.questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        isRequired: q.isRequired,
        order: q.order
      })),
      totalResponses: survey.responses.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { message: 'Failed to fetch survey', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/engagement/surveys/[id]
 * Update a survey
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const payload = await request.json();

    // Check if survey exists
    const existingSurvey = await prisma.survey.findUnique({
      where: { id }
    });

    if (!existingSurvey) {
      return NextResponse.json(
        { message: 'Survey not found' },
        { status: 404 }
      );
    }

    // Update survey
    const survey = await prisma.survey.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description,
        surveyType: payload.surveyType,
        startDate: payload.startDate ? new Date(payload.startDate) : undefined,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        isActive: payload.isActive !== undefined ? payload.isActive : existingSurvey.isActive,
      },
      include: {
        questions: true
      }
    });

    return NextResponse.json({
      data: survey,
      message: 'Survey updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json(
      { message: 'Failed to update survey', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/engagement/surveys/[id]
 * Delete a survey
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if survey exists
    const existingSurvey = await prisma.survey.findUnique({
      where: { id }
    });

    if (!existingSurvey) {
      return NextResponse.json(
        { message: 'Survey not found' },
        { status: 404 }
      );
    }

    await prisma.survey.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Survey deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json(
      { message: 'Failed to delete survey', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
