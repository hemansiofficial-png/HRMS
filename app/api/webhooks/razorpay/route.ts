import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay payment webhooks
 * 
 * Events handled:
 * - payment.captured
 * - payment.failed
 * - subscription.charged
 * - subscription.cancelled
 * - order.paid
 * - order.failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature in production
    // const signature = request.headers.get('x-razorpay-signature');
    // const isValid = verifyRazorpaySignature(body, signature);

    const event = body;
    const eventType = event.event;

    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload);
        break;
      
      case 'order.paid':
        await handleOrderPaid(event.payload);
        break;
      
      case 'order.failed':
        await handleOrderFailed(event.payload);
        break;
      
      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Razorpay Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payload: any) {
  const payment = payload.payment?.entity;
  const paymentId = payment?.id;
  const amount = payment?.amount;
  const orderId = payment?.order_id;

  console.log(`[Razorpay] Payment captured: ${paymentId}, Amount: ${amount}`);

  // TODO: Update payment records
  // await prisma.payment.update({...})
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.payment?.entity;
  console.log(`[Razorpay] Payment failed: ${payment?.id}`);

  // TODO: Notify user, update records
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription?.entity;
  const chargeId = subscription?.id;

  console.log(`[Razorpay] Subscription charged: ${chargeId}`);

  // TODO: Record subscription payment
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.subscription?.entity;
  console.log(`[Razorpay] Subscription cancelled: ${subscription?.id}`);

  // TODO: Mark subscription as cancelled
}

async function handleOrderPaid(payload: any) {
  const order = payload.order?.entity;
  const orderId = order?.id;
  const amount = order?.amount;

  console.log(`[Razorpay] Order paid: ${orderId}, Amount: ${amount}`);

  // TODO: Update order status
}

async function handleOrderFailed(payload: any) {
  const order = payload.order?.entity;
  console.log(`[Razorpay] Order failed: ${order?.id}`);

  // TODO: Notify user, retry logic
}
