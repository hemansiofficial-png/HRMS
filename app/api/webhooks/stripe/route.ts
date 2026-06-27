import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe payment webhooks
 * 
 * Events handled:
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // In production, verify the webhook signature
    // const event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
    
    // For now, parse the JSON directly
    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      return NextResponse.json(
        { message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = event.type;
    const data = event.data?.object;

    console.log(`[Stripe Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(data);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(data);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(data);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(data);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoiceFailed(data);
        break;
      
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(data: any) {
  // Update subscription/payment record in database
  const paymentIntentId = data.id;
  const customerId = data.customer;
  const amount = data.amount;

  console.log(`[Stripe] Payment succeeded: ${paymentIntentId}, Amount: ${amount}`);

  // TODO: Update your subscription/payment records
  // await prisma.subscription.update({...})
}

async function handlePaymentFailed(data: any) {
  const paymentIntentId = data.id;
  console.log(`[Stripe] Payment failed: ${paymentIntentId}`);

  // TODO: Notify user, update records
}

async function handleSubscriptionCreated(data: any) {
  const subscriptionId = data.id;
  const customerId = data.customer;
  const status = data.status;

  console.log(`[Stripe] Subscription created: ${subscriptionId}, Status: ${status}`);

  // TODO: Create subscription record in database
  // await prisma.subscription.create({...})
}

async function handleSubscriptionUpdated(data: any) {
  const subscriptionId = data.id;
  const status = data.status;

  console.log(`[Stripe] Subscription updated: ${subscriptionId}, Status: ${status}`);

  // TODO: Update subscription record
}

async function handleSubscriptionDeleted(data: any) {
  const subscriptionId = data.id;
  console.log(`[Stripe] Subscription deleted: ${subscriptionId}`);

  // TODO: Mark subscription as cancelled, notify user
}

async function handleInvoicePaid(data: any) {
  const invoiceId = data.id;
  const subscriptionId = data.subscription;
  const amountPaid = data.amount_paid;

  console.log(`[Stripe] Invoice paid: ${invoiceId}, Amount: ${amountPaid}`);

  // TODO: Record payment, generate receipt
}

async function handleInvoiceFailed(data: any) {
  const invoiceId = data.id;
  console.log(`[Stripe] Invoice payment failed: ${invoiceId}`);

  // TODO: Notify user, retry logic
}
