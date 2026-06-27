import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';
import { rateLimiters } from '@/lib/rate-limit';

// POST /api/profile/photo - Upload profile photo
export async function POST(request: NextRequest) {
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

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WEBP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for photos)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Save photo file
    const photoDir = 'photos';
    const fileData = await saveFile(file, `profile-${employee.id}-${photoDir}`);

    // Update employee with photo URL
    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { photoUrl: fileData.url },
    });

    return NextResponse.json(
      {
        success: true,
        photo: {
          url: fileData.url,
          filename: fileData.filename,
        },
        employee: {
          id: updated.id,
          photoUrl: updated.photoUrl,
        },
      },
      { headers: rateLimit.headers }
    );
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/photo - Remove profile photo
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Remove photo from database
    await prisma.employee.update({
      where: { id: employee.id },
      data: { photoUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
