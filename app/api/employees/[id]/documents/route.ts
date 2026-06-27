import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';
import { sanitizeFilename } from '@/lib/sanitize';
import { rateLimiters } from '@/lib/rate-limit';

// GET /api/employees/[id]/documents - Get employee documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get employee documents
    const documents = await prisma.employeeDocument.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/employees/[id]/documents - Upload employee document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimit = await rateLimiters.upload(request);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Sanitize filename
    const safeFilename = sanitizeFilename(file.name);

    const { id } = await params;

    // Save file to local storage
    const fileData = await saveFile(file, `employee-${id}`);

    // Save document record to database
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: id,
        documentName: safeFilename,
        documentUrl: fileData.url,
        documentType: documentType,
        expiryDate: null,
      }
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.documentName,
        url: document.documentUrl,
        type: document.documentType,
        uploadedDate: document.createdAt.toISOString(),
      }
    }, {
      headers: rateLimit.headers,
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
