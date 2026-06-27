import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for sign-up (prevent abuse)
  const rateLimit = await rateLimiters.auth(request);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
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

  try {
    const body = await request.json();
    const { name, email, password, organization } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (!organization?.name || !organization?.slug) {
      return NextResponse.json(
        { error: 'Organization name and slug are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if organization slug is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: organization.slug }
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug already taken. Please try a different name.' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Define plan configurations
    const plan = (organization.plan || 'free').toLowerCase();
    const planConfigs: Record<string, {
      pricePerEmployee: number;
      maxEmployees: number;
      features: string[];
    }> = {
      free: {
        pricePerEmployee: 0,
        maxEmployees: 10,
        features: ['attendance', 'leave', 'profiles', 'basic_reports'],
      },
      starter: {
        pricePerEmployee: 49,
        maxEmployees: 50,
        features: ['attendance', 'leave', 'profiles', 'payroll', 'reports', 'mobile_app'],
      },
      pro: {
        pricePerEmployee: 99,
        maxEmployees: 200,
        features: ['attendance', 'leave', 'profiles', 'payroll', 'performance', 'analytics', 'api', 'branding'],
      },
      enterprise: {
        pricePerEmployee: 0,
        maxEmployees: 999999,
        features: ['all'],
      },
    };

    const planConfig = planConfigs[plan] || planConfigs.free;

    // Create user, organization, and subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        }
      });

      // 2. Create organization
      const organizationData = await tx.organization.create({
        data: {
          name: organization.name,
          slug: organization.slug.toLowerCase().replace(/\s+/g, '-'),
          industry: organization.industry || null,
          size: organization.size || null,
          email: organization.email || null,
          phone: organization.phone || null,
          country: 'India',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          primaryColor: '#673ab7',
        }
      });

      // 3. Update user with organization ID
      await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: organizationData.id,
        }
      });

      // 4. Create subscription with 14-day trial
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organizationData.id,
          planType: plan.toUpperCase() as any,
          status: 'TRIAL',
          billingCycle: 'MONTHLY',
          pricePerEmployee: planConfig.pricePerEmployee,
          maxEmployees: planConfig.maxEmployees,
          currentEmployees: 0,
          features: planConfig.features,
          trialStartDate: new Date(),
          trialEndDate,
          apiCallsLimit: plan === 'pro' ? 10000 : plan === 'enterprise' ? 100000 : 1000,
          storageLimit: plan === 'pro' ? 5000 : plan === 'enterprise' ? 10000 : 1000,
        }
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        organization: {
          id: organizationData.id,
          name: organizationData.name,
          slug: organizationData.slug,
        },
        subscription: {
          id: subscription.id,
          planType: subscription.planType,
          status: subscription.status,
          trialEndDate: subscription.trialEndDate,
        }
      };
    });

    // Return success with rate limit headers
    return NextResponse.json(result, {
      headers: rateLimit.headers,
    });
  } catch (error) {
    console.error('Error creating user and organization:', error);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
