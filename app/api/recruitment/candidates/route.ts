import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/recruitment/candidates
 * Fetch all job applicants/candidates with their associated job postings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');

    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (jobId) {
      where.jobPostingId = jobId;
    }

    // Fetch applicants with job posting relation
    const applicants = await prisma.applicant.findMany({
      where,
      include: {
        jobPosting: {
          include: {
            department: true
          }
        }
      },
      orderBy: { appliedDate: 'desc' }
    });

    // Transform to match UI expectations
    const candidates = applicants.map((applicant) => {
      // Map schema status to UI status
      let uiStatus: string = applicant.status;
      if (applicant.status === 'INTERVIEW_SCHEDULED' || applicant.status === 'INTERVIEW_COMPLETED') {
        uiStatus = 'INTERVIEW';
      } else if (applicant.status === 'OFFER_EXTENDED' || applicant.status === 'OFFER_ACCEPTED') {
        uiStatus = 'OFFER';
      }
      
      return {
        id: applicant.id,
        name: applicant.candidateName,
        email: applicant.email,
        phone: applicant.phone,
        position: applicant.jobPosting.title,
        location: applicant.jobPosting.department?.name || 'Not specified',
        status: uiStatus,
        appliedDate: applicant.appliedDate.toISOString().split('T')[0],
        resume: applicant.resumeUrl,
        notes: applicant.coverLetterUrl || undefined,
      };
    });

    return NextResponse.json({ data: candidates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch candidates', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recruitment/candidates
 * Create a new job application/candidate
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { jobPostingId, candidateName, email, phone, resumeUrl, coverLetterUrl } = payload;

    if (!jobPostingId || !candidateName || !email || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields: jobPostingId, candidateName, email, phone' },
        { status: 400 }
      );
    }

    // Verify job posting exists
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId }
    });

    if (!jobPosting) {
      return NextResponse.json(
        { message: 'Job posting not found' },
        { status: 404 }
      );
    }

    // Create applicant
    const applicant = await prisma.applicant.create({
      data: {
        jobPostingId,
        candidateName,
        email,
        phone,
        resumeUrl,
        coverLetterUrl,
        status: 'APPLIED'
      },
      include: {
        jobPosting: {
          include: {
            department: true
          }
        }
      }
    });

    // Transform response
    const candidate = {
      id: applicant.id,
      name: applicant.candidateName,
      email: applicant.email,
      phone: applicant.phone,
      position: applicant.jobPosting.title,
      location: applicant.jobPosting.department?.name || 'Not specified',
      status: applicant.status,
      appliedDate: applicant.appliedDate.toISOString().split('T')[0],
      resume: applicant.resumeUrl,
      notes: applicant.coverLetterUrl || undefined,
    };

    return NextResponse.json({ 
      data: candidate,
      message: 'Candidate added successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json(
      { message: 'Failed to create candidate', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
