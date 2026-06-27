import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/recruitment/interviews/[id]
 * Fetch a single interview
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        applicant: {
          include: {
            jobPosting: {
              select: { title: true, department: { select: { name: true } } }
            }
          }
        },
        interviewer: {
          select: { name: true, email: true }
        }
      }
    });

    if (!interview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: interview.id,
      applicantId: interview.applicantId,
      candidateName: interview.applicant.candidateName,
      candidateEmail: interview.applicant.email,
      candidatePhone: interview.applicant.phone,
      position: interview.applicant.jobPosting.title,
      department: interview.applicant.jobPosting.department?.name || 'N/A',
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
      createdAt: interview.createdAt.toISOString().split('T')[0],
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching interview:', error);
    return NextResponse.json(
      { message: 'Failed to fetch interview', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recruitment/interviews/[id]
 * Update an interview (reschedule, add feedback, etc.)
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

    // Check if interview exists
    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      include: {
        applicant: true
      }
    });

    if (!existingInterview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (payload.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(payload.scheduledDate);
    }
    if (payload.scheduledTime !== undefined) {
      updateData.scheduledTime = payload.scheduledTime;
    }
    if (payload.location !== undefined) {
      updateData.location = payload.location;
    }
    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }
    if (payload.feedback !== undefined) {
      updateData.feedback = payload.feedback;
    }
    if (payload.rating !== undefined) {
      updateData.rating = payload.rating;
    }
    if (payload.result !== undefined) {
      updateData.result = payload.result;
    }
    if (payload.round !== undefined) {
      updateData.round = payload.round;
    }
    if (payload.interviewType !== undefined) {
      updateData.interviewType = payload.interviewType;
    }

    // Update interview
    const interview = await prisma.interview.update({
      where: { id },
      data: updateData,
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

    // Update applicant status based on interview result
    if (payload.result) {
      let newStatus = existingInterview.applicant.status;
      
      if (payload.result === 'PASSED' && payload.round === 'FINAL') {
        newStatus = 'OFFER_EXTENDED';
      } else if (payload.result === 'PASSED') {
        // Keep as INTERVIEW_SCHEDULED for next round
        newStatus = 'INTERVIEW_SCHEDULED';
      } else if (payload.result === 'FAILED') {
        newStatus = 'REJECTED';
      }

      if (newStatus !== existingInterview.applicant.status) {
        await prisma.applicant.update({
          where: { id: existingInterview.applicantId },
          data: { status: newStatus }
        });
      }
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
        feedback: interview.feedback,
        rating: interview.rating,
        result: interview.result,
      },
      message: 'Interview updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating interview:', error);
    return NextResponse.json(
      { message: 'Failed to update interview', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recruitment/interviews/[id]
 * Cancel/delete an interview
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

    // Check if interview exists
    const existingInterview = await prisma.interview.findUnique({
      where: { id }
    });

    if (!existingInterview) {
      return NextResponse.json(
        { message: 'Interview not found' },
        { status: 404 }
      );
    }

    await prisma.interview.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Interview cancelled successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error cancelling interview:', error);
    return NextResponse.json(
      { message: 'Failed to cancel interview', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
