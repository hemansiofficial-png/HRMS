import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/integrations
 * List all available integrations and their status
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

    // Define available integrations
    const integrations = [
      {
        id: 'slack',
        name: 'Slack',
        description: 'Send notifications to Slack channels',
        category: 'Communication',
        enabled: false,
        configured: false,
        icon: 'slack',
        features: ['Interview notifications', 'Leave approvals', 'Attendance alerts'],
        setupRequired: ['Slack Bot Token', 'Webhook URL'],
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        description: 'Integrate with Microsoft Teams for notifications',
        category: 'Communication',
        enabled: false,
        configured: false,
        icon: 'teams',
        features: ['Meeting notifications', 'Team announcements', 'HR alerts'],
        setupRequired: ['Teams Webhook URL', 'Tenant ID'],
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Schedule interviews via Zoom',
        category: 'Video Conferencing',
        enabled: false,
        configured: false,
        icon: 'zoom',
        features: ['Auto-schedule interviews', 'Meeting link generation'],
        setupRequired: ['Zoom API Key', 'Zoom API Secret', 'Account ID'],
      },
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync interviews and events with Google Calendar',
        category: 'Calendar',
        enabled: false,
        configured: false,
        icon: 'calendar',
        features: ['Interview scheduling', 'Event reminders', 'Availability sync'],
        setupRequired: ['Google OAuth Credentials', 'Calendar ID'],
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Payment processing for subscriptions',
        category: 'Payment',
        enabled: false,
        configured: false,
        icon: 'stripe',
        features: ['Subscription billing', 'Invoice generation', 'Payment webhooks'],
        setupRequired: ['Stripe API Key', 'Webhook Secret', 'Publishable Key'],
      },
      {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Payment processing for Indian market',
        category: 'Payment',
        enabled: false,
        configured: false,
        icon: 'razorpay',
        features: ['UPI payments', 'Subscription billing', 'Invoice generation'],
        setupRequired: ['Razorpay Key ID', 'Key Secret', 'Webhook Secret'],
      },
      {
        id: 'email',
        name: 'Email (SMTP)',
        description: 'Send emails via SMTP',
        category: 'Communication',
        enabled: process.env.SMTP_HOST ? true : false,
        configured: !!process.env.SMTP_HOST && !!process.env.SMTP_USER,
        icon: 'mail',
        features: ['Password reset', 'Notifications', 'Reports'],
        setupRequired: ['SMTP Host', 'SMTP Port', 'SMTP Username', 'SMTP Password'],
      },
    ];

    return NextResponse.json({ data: integrations }, { status: 200 });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch integrations', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations
 * Configure an integration
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
    const { integrationId, config } = payload;

    if (!integrationId) {
      return NextResponse.json(
        { message: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Validate integration exists
    const validIntegrations = ['slack', 'teams', 'zoom', 'google-calendar', 'stripe', 'razorpay', 'email'];
    
    if (!validIntegrations.includes(integrationId)) {
      return NextResponse.json(
        { message: 'Invalid integration ID' },
        { status: 400 }
      );
    }

    // Store configuration (in production, this should be encrypted and stored securely)
    // For now, we'll validate the config structure
    const configRequirements: Record<string, string[]> = {
      'slack': ['webhookUrl', 'botToken'],
      'teams': ['webhookUrl', 'tenantId'],
      'zoom': ['apiKey', 'apiSecret', 'accountId'],
      'google-calendar': ['clientId', 'clientSecret', 'calendarId'],
      'stripe': ['apiKey', 'webhookSecret', 'publishableKey'],
      'razorpay': ['keyId', 'keySecret', 'webhookSecret'],
      'email': ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'],
    };

    const required = configRequirements[integrationId] || [];
    const missingFields = required.filter(field => !config?.[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          requiredFields: required
        },
        { status: 400 }
      );
    }

    // In production, store the config securely (encrypted in database or environment)
    // For now, we'll just validate and return success
    return NextResponse.json({
      success: true,
      message: `Integration ${integrationId} configured successfully`,
      note: 'In production, configuration should be stored securely'
    }, { status: 200 });
  } catch (error) {
    console.error('Error configuring integration:', error);
    return NextResponse.json(
      { message: 'Failed to configure integration', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
