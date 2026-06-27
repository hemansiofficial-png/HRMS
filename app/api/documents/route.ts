import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';
import { sanitizeRequest, sanitizeFilename } from '@/lib/sanitize';
import { rateLimiters } from '@/lib/rate-limit';

// GET /api/documents - Fetch all documents for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // If no employee record, return empty array
    if (!employee) {
      return NextResponse.json({ documents: [] });
    }

    // Format documents for frontend
    const documents = employee.documents.map((doc) => ({
      id: doc.id,
      name: doc.documentName,
      type: doc.documentType,
      uploadedDate: doc.createdAt.toISOString(),
      uploadedBy: employee.user.name || 'Unknown',
      size: 'Unknown', // Would need to store this in database
      category: doc.documentType,
      status: 'Active',
      url: doc.documentUrl,
    }));

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/documents - Upload new document
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for file uploads
    const rateLimit = await rateLimiters.upload(request);

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Too many uploads. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '60',
          }
        }
      );
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedCategory = sanitizeRequest({ category }).category;
    const safeFilename = sanitizeFilename(file.name);

    // Save file to local storage
    const fileData = await saveFile(file, employee.id);

    // Save document record to database
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        documentName: safeFilename,
        documentUrl: fileData.url,
        documentType: sanitizedCategory,
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

// DELETE /api/documents/:id - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // Get document from database
    const document = await prisma.employeeDocument.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from storage
    const filename = document.documentUrl.split('/').pop();
    if (filename) {
      const { deleteFile } = await import('@/lib/upload');
      await deleteFile(filename);
    }

    // Delete record from database
    await prisma.employeeDocument.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
