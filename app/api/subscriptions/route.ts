import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/subscriptions - Get current organization's subscription
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            subscription: true
          }
        }
      }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    return NextResponse.json({
      organization: user.organization,
      subscription: user.organization.subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions - Create or update subscription
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { planType, billingCycle } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Define plan configurations
    const planConfigs = {
      FREE: {
        pricePerEmployee: 0,
        maxEmployees: 10,
        features: ['attendance', 'leave', 'profiles', 'basic_reports']
      },
      STARTER: {
        pricePerEmployee: 49,
        maxEmployees: 50,
        features: ['attendance', 'leave', 'profiles', 'payroll', 'reports', 'mobile_app']
      },
      PRO: {
        pricePerEmployee: 99,
        maxEmployees: 200,
        features: ['attendance', 'leave', 'profiles', 'payroll', 'performance', 'analytics', 'api', 'branding']
      },
      ENTERPRISE: {
        pricePerEmployee: 0,
        maxEmployees: 999999,
        features: ['all']
      }
    };

    const config = planConfigs[planType as keyof typeof planConfigs];
    if (!config) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: {
        organizationId: user.organization.id
      },
      update: {
        planType,
        billingCycle: billingCycle || 'MONTHLY',
        pricePerEmployee: config.pricePerEmployee,
        maxEmployees: config.maxEmployees,
        features: config.features,
        status: 'TRIAL',
        trialStartDate: new Date(),
        trialEndDate,
      },
      create: {
        organizationId: user.organization.id,
        planType,
        billingCycle: billingCycle || 'MONTHLY',
        pricePerEmployee: config.pricePerEmployee,
        maxEmployees: config.maxEmployees,
        features: config.features,
        status: 'TRIAL',
        trialStartDate: new Date(),
        trialEndDate,
      }
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
