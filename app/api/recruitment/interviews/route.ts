import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/recruitment/interviews
 * Fetch all interviews
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (applicantId) {
      where.applicantId = applicantId;
    }

    // Fetch interviews
    const interviews = await prisma.interview.findMany({
      where,
      include: {
        applicant: {
          include: {
            jobPosting: {
              select: { title: true }
            }
          }
        },
        interviewer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // Transform interviews
    const transformedInterviews = interviews.map((interview) => ({
      id: interview.id,
      applicantId: interview.applicantId,
      candidateName: interview.applicant.candidateName,
      position: interview.applicant.jobPosting.title,
      interviewerName: interview.interviewer.name,
      interviewerEmail: interview.interviewer.email,
      scheduledDate: interview.scheduledDate.toISOString().split('T')[0],
      scheduledTime: interview.scheduledTime,
      round: interview.round,
      location: interview.location,
      interviewType: interview.interviewType,
      status: interview.status,
      feedback: interview.feedback,
      rating: interview.rating,
      result: interview.result,
    }));

    return NextResponse.json(transformedInterviews, { status: 200 });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { message: 'Failed to fetch interviews', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recruitment/interviews
 * Schedule a new interview
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
    const { 
      applicantId, 
      interviewerId, 
      scheduledDate, 
      scheduledTime, 
      round, 
      location, 
      interviewType 
    } = payload;

    if (!applicantId || !interviewerId || !scheduledDate || !scheduledTime || !round) {
      return NextResponse.json(
        { message: 'Missing required fields: applicantId, interviewerId, scheduledDate, scheduledTime, round' },
        { status: 400 }
      );
    }

    // Verify applicant exists
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: { jobPosting: true }
    });

    if (!applicant) {
      return NextResponse.json(
        { message: 'Applicant not found' },
        { status: 404 }
      );
    }

    // Verify interviewer exists
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerId }
    });

    if (!interviewer) {
      return NextResponse.json(
        { message: 'Interviewer not found' },
        { status: 404 }
      );
    }

    // Create interview
    const interview = await prisma.interview.create({
      data: {
        applicantId,
        interviewerId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        round,
        location: location || 'TBD',
        interviewType: interviewType || 'IN_PERSON',
        status: 'SCHEDULED'
      },
      include: {
        applicant: {
          include: {
            jobPosting: {
              select: { title: true }
            }
          }
        },
        interviewer: {
          select: { name: true, email: true }
        }
      }
    });

    // Update applicant status to INTERVIEW_SCHEDULED if still in APPLIED or SCREENING
    if (applicant.status === 'APPLIED' || applicant.status === 'SCREENING') {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: { status: 'INTERVIEW_SCHEDULED' }
      });
    }

    return NextResponse.json({
      data: {
        id: interview.id,
        applicantId: interview.applicantId,
        candidateName: interview.applicant.candidateName,
        position: interview.applicant.jobPosting.title,
        interviewerName: interview.interviewer.name,
        interviewerEmail: interview.interviewer.email,
        scheduledDate: interview.scheduledDate.toISOString().split('T')[0],
        scheduledTime: interview.scheduledTime,
        round: interview.round,
        location: interview.location,
        interviewType: interview.interviewType,
        status: interview.status,
      },
      message: 'Interview scheduled successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    return NextResponse.json(
      { message: 'Failed to schedule interview', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
