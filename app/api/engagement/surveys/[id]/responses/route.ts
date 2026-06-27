import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/engagement/surveys/[id]/responses
 * Fetch survey responses/results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if survey exists
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
                department: { select: { name: true } },
                user: { select: { name: true, email: true } }
              }
            }
          }
        }
      }
    });

    if (!survey) {
      return NextResponse.json(
        { message: 'Survey not found' },
        { status: 404 }
      );
    }

    // Calculate response statistics
    const totalResponses = survey.responses.length;
    const questionStats = survey.questions.map((question) => {
      const questionResponses = survey.responses.map((response) => {
        const answers = JSON.parse(response.answers as string) as Record<string, string>;
        return answers[question.id];
      }).filter(Boolean);

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        responseCount: questionResponses.length,
        responses: questionResponses
      };
    });

    return NextResponse.json({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.surveyType,
        status: survey.isActive ? 'ACTIVE' : 'COMPLETED',
        totalResponses
      },
      questions: survey.questions,
      stats: questionStats,
      responses: survey.responses.map((response) => ({
        id: response.id,
        employeeName: response.employee?.user?.name || 'Anonymous',
        employeeCode: response.employee?.employeeCode || 'N/A',
        department: response.employee?.department?.name || 'N/A',
        answers: JSON.parse(response.answers as string),
        submittedAt: response.submittedAt.toISOString()
      }))
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch survey responses', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/engagement/surveys/[id]/responses
 * Submit a survey response
 */
export async function POST(
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
    const { answers } = payload;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { message: 'Answers are required' },
        { status: 400 }
      );
    }

    // Check if survey exists and is active
    const survey = await prisma.survey.findUnique({
      where: { id }
    });

    if (!survey) {
      return NextResponse.json(
        { message: 'Survey not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    if (!survey.isActive || survey.endDate < now) {
      return NextResponse.json(
        { message: 'Survey is no longer active' },
        { status: 400 }
      );
    }

    // Get user's employee record
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

    // Check if already responded
    const existingResponse = await prisma.surveyResponse.findFirst({
      where: {
        surveyId: id,
        employeeId: user.employee.id
      }
    });

    if (existingResponse) {
      return NextResponse.json(
        { message: 'You have already responded to this survey' },
        { status: 409 }
      );
    }

    // Create response
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        employeeId: user.employee.id,
        answers: JSON.stringify(answers)
      }
    });

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Survey response submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json(
      { message: 'Failed to submit survey response', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
