import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/webhooks
 * List all configured webhooks
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

    // Return placeholder webhooks (in production, fetch from database)
    const webhooks = [
      {
        id: 'wh_stripe_payment',
        name: 'Stripe Payment Webhook',
        provider: 'stripe',
        url: '/api/webhooks/stripe',
        events: ['payment.succeeded', 'payment.failed', 'subscription.created', 'subscription.cancelled'],
        active: false,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
      },
      {
        id: 'wh_razorpay_payment',
        name: 'Razorpay Payment Webhook',
        provider: 'razorpay',
        url: '/api/webhooks/razorpay',
        events: ['payment.captured', 'payment.failed', 'subscription.charged', 'subscription.cancelled'],
        active: false,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
      },
      {
        id: 'wh_zoom_meeting',
        name: 'Zoom Meeting Webhook',
        provider: 'zoom',
        url: '/api/webhooks/zoom',
        events: ['meeting.created', 'meeting.updated', 'meeting.deleted', 'meeting.ended'],
        active: false,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
      },
    ];

    return NextResponse.json({ data: webhooks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { message: 'Failed to fetch webhooks', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook configuration
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
    const { name, provider, url, events } = payload;

    if (!name || !provider || !url || !events) {
      return NextResponse.json(
        { message: 'Missing required fields: name, provider, url, events' },
        { status: 400 }
      );
    }

    // In production, save to database
    // For now, return a mock response
    return NextResponse.json({
      data: {
        id: `wh_${provider}_${Date.now()}`,
        name,
        provider,
        url,
        events,
        active: true,
        createdAt: new Date().toISOString(),
        lastTriggered: null,
      },
      message: 'Webhook created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { message: 'Failed to create webhook', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
