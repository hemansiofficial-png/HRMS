import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/engagement/surveys
 * Fetch all surveys (active & completed) with response statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build where clause
    const where: any = {};
    
    if (status) {
      const now = new Date();
      if (status === 'ACTIVE') {
        where.isActive = true;
        where.endDate = { gte: now };
      } else if (status === 'COMPLETED') {
        where.OR = [
          { isActive: false },
          { endDate: { lt: now } }
        ];
      }
    }

    if (type) {
      where.surveyType = type;
    }

    // Fetch surveys with questions and responses
    const surveys = await prisma.survey.findMany({
      where,
      include: {
        questions: true,
        responses: true,
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match UI expectations
    const transformedSurveys = surveys.map((survey) => {
      const now = new Date();
      const isExpired = survey.endDate < now;
      const isActive = survey.isActive && !isExpired;
      
      // Calculate response rate (responses / total employees)
      const totalEmployees = 100; // Would need to fetch actual count
      const responseCount = survey.responses.length;
      const responseRate = totalEmployees > 0 ? Math.round((responseCount / totalEmployees) * 100) : 0;

      return {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        type: survey.surveyType,
        responseRate: Math.min(responseRate, 100), // Cap at 100%
        status: isActive ? 'ACTIVE' : 'COMPLETED',
        createdDate: survey.startDate.toISOString().split('T')[0],
        questions: survey.questions.length,
        endDate: survey.endDate.toISOString().split('T')[0],
        createdBy: survey.creator.name,
      };
    });

    return NextResponse.json(transformedSurveys, { status: 200 });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json(
      { message: 'Failed to fetch surveys', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/engagement/surveys
 * Create a new survey
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
    const { title, description, surveyType, startDate, endDate, questions } = payload;

    if (!title || !surveyType || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required fields: title, surveyType, startDate, endDate' },
        { status: 400 }
      );
    }

    // Get user to get creator info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Create survey with questions
    const survey = await prisma.survey.create({
      data: {
        title,
        description: description || '',
        surveyType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        createdBy: user.id,
        questions: questions ? {
          create: questions.map((q: any, index: number) => ({
            questionText: q.questionText,
            questionType: q.questionType || 'TEXT',
            options: q.options || [],
            isRequired: q.isRequired ?? true,
            order: index
          }))
        } : undefined
      },
      include: {
        questions: true
      }
    });

    return NextResponse.json({
      data: survey,
      message: 'Survey created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json(
      { message: 'Failed to create survey', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
