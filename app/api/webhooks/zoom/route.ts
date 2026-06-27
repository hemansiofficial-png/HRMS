import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/zoom
 * Handle Zoom meeting webhooks
 * 
 * Events handled:
 * - meeting.created
 * - meeting.updated
 * - meeting.deleted
 * - meeting.ended
 * - meeting.started
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature in production
    // const signature = request.headers.get('Authorization');
    // const isValid = verifyZoomSignature(body, signature);

    const payload = body.payload;
    const eventType = payload.event;

    console.log(`[Zoom Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'meeting.created':
        await handleMeetingCreated(payload);
        break;
      
      case 'meeting.updated':
        await handleMeetingUpdated(payload);
        break;
      
      case 'meeting.deleted':
        await handleMeetingDeleted(payload);
        break;
      
      case 'meeting.ended':
        await handleMeetingEnded(payload);
        break;
      
      case 'meeting.started':
        await handleMeetingStarted(payload);
        break;
      
      default:
        console.log(`[Zoom Webhook] Unhandled event type: ${eventType}`);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Zoom Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { message: 'Webhook processing failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleMeetingCreated(payload: any) {
  const meeting = payload.object;
  const meetingId = meeting?.id;
  const topic = meeting?.topic;
  const startTime = meeting?.start_time;

  console.log(`[Zoom] Meeting created: ${meetingId}, Topic: ${topic}`);

  // TODO: Update interview record with Zoom link
  // await prisma.interview.update({
  //   where: { zoomMeetingId: meetingId },
  //   data: { 
  //     location: meeting.join_url,
  //     status: 'SCHEDULED'
  //   }
  // })
}

async function handleMeetingUpdated(payload: any) {
  const meeting = payload.object;
  console.log(`[Zoom] Meeting updated: ${meeting?.id}`);

  // TODO: Update meeting details
}

async function handleMeetingDeleted(payload: any) {
  const meeting = payload.object;
  console.log(`[Zoom] Meeting deleted: ${meeting?.id}`);

  // TODO: Notify interviewer/candidate, reschedule
}

async function handleMeetingEnded(payload: any) {
  const meeting = payload.object;
  const duration = meeting?.duration;

  console.log(`[Zoom] Meeting ended: ${meeting?.id}, Duration: ${duration}min`);

  // TODO: Update interview status, send follow-up emails
}

async function handleMeetingStarted(payload: any) {
  const meeting = payload.object;
  console.log(`[Zoom] Meeting started: ${meeting?.id}`);

  // TODO: Send notification to participants
}
