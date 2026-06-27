import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/upload';
import { rateLimiters } from '@/lib/rate-limit';

// POST /api/organizations/logo - Upload organization logo
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

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
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
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/svg+xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only JPG, PNG, WEBP, and SVG are allowed.'
        },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for logos)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Save logo file
    const logoDir = 'logos';
    const fileData = await saveFile(
      file,
      `org-${user.organization.id}-${logoDir}`
    );

    // Update organization with logo URL
    const updated = await prisma.organization.update({
      where: { id: user.organization.id },
      data: { logo: fileData.url }
    });

    return NextResponse.json(
      {
        success: true,
        logo: {
          url: fileData.url,
          filename: fileData.filename
        },
        organization: {
          id: updated.id,
          name: updated.name,
          logo: updated.logo
        }
      },
      { headers: rateLimit.headers }
    );
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/logo - Remove organization logo
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Remove logo from database
    await prisma.organization.update({
      where: { id: user.organization.id },
      data: { logo: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
