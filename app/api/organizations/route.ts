import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      industry,
      size,
      email,
      phone,
      address,
      city,
      state,
      country = 'India'
    } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Organization name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already taken' },
        { status: 400 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create organization and update user
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          industry,
          size,
          email,
          phone,
          address,
          city,
          state,
          country
        }
      });

      // Update user with organization ID and make them admin
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          role: 'ADMIN'
        }
      });

      // Create default subscription (FREE plan with trial)
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planType: 'FREE',
          status: 'TRIAL',
          billingCycle: 'MONTHLY',
          pricePerEmployee: 0,
          maxEmployees: 10,
          features: [
            'attendance',
            'leave',
            'profiles',
            'basic_reports'
          ],
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }
      });

      return organization;
    });

    return NextResponse.json({ organization: result });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// GET /api/organizations - Get current user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          include: { subscription: true }
        }
      }
    });

    if (!user?.organization) {
      return NextResponse.json({ organization: null });
    }

    return NextResponse.json({ organization: user.organization });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations - Update current user's organization
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const body = await request.json();
    const {
      name,
      slug,
      industry,
      size,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      gstNumber,
      panNumber,
      timezone,
      currency,
      primaryColor
    } = body;

    // Update organization
    const updated = await prisma.organization.update({
      where: { id: user.organization.id },
      data: {
        name,
        slug,
        industry,
        size,
        email,
        phone,
        website,
        address,
        city,
        state,
        country,
        gstNumber,
        panNumber,
        timezone,
        currency,
        primaryColor
      }
    });

    return NextResponse.json({ organization: updated });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}
