import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import {
  markPaymentProcessing,
  updateHuntTransitionStatus,
  calculateExpirationDate,
} from "@/lib/huntEdgeCases";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature found" },
      { status: 400 }
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not defined");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(paymentIntent);
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { huntId, userId, participantId } = session.metadata || {};

  if (!huntId || !userId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const paymentIntentId = session.payment_intent as string;
  const amountTotal = session.amount_total || 0;
  const currency = session.currency || "usd";

  // Check if participant already exists
  if (participantId) {
    // Update existing participant
    await prisma.$transaction([
      prisma.huntParticipant.update({
        where: { id: participantId },
        data: {
          status: "confirmed",
          paymentStatus: "confirmed",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: session.id,
          paymentAmount: amountTotal / 100, // Convert from cents
          paymentCurrency: currency,
          isPaymentProcessing: false, // Edge Case: Unlock payment processing
          requestExpiresAt: null, // Edge Case: Clear expiration on confirmation
        },
      }),
      // Edge Case: Increment user's cached hunts joined count
      prisma.user.update({
        where: { id: userId },
        data: {
          cachedHuntsJoinedCount: { increment: 1 },
        },
      }),
    ]);

    // Edge Case: Update hunt transition status
    await updateHuntTransitionStatus(huntId);
  } else {
    // Create new participant (shouldn't happen with new flow, but handle it)
    await prisma.$transaction([
      prisma.huntParticipant.create({
        data: {
          huntId,
          userId,
          status: "confirmed",
          paymentStatus: "confirmed",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntentId,
          stripeCheckoutSessionId: session.id,
          paymentAmount: amountTotal / 100,
          paymentCurrency: currency,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          cachedHuntsJoinedCount: { increment: 1 },
        },
      }),
    ]);

    await updateHuntTransitionStatus(huntId);
  }

  console.log(`Payment completed for hunt ${huntId} by user ${userId}`);
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Additional logic if needed
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);

  // Find participant with this payment intent
  const participant = await prisma.huntParticipant.findUnique({
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
    include: {
      hunt: {
        select: {
          id: true,
          startDate: true,
        },
      },
    },
  });

  if (participant) {
    // Edge Case: Calculate new expiration date from when payment was first attempted
    // User gets remaining time from original 7-day window
    const expirationDate = participant.requestExpiresAt
      ? new Date(participant.requestExpiresAt)
      : calculateExpirationDate(participant.hunt.startDate);

    // Edge Case: Return to pending payment status and unlock payment processing
    await prisma.huntParticipant.update({
      where: { id: participant.id },
      data: {
        status: "pending",
        paymentStatus: "pending",
        isPaymentProcessing: false, // Unlock so user can retry
        requestExpiresAt: expirationDate,
        stripePaymentIntentId: null, // Clear failed payment intent
      },
    });

    console.log(
      `Payment failed for participant ${participant.id}. Returned to pending status. Expires at ${expirationDate.toISOString()}`
    );
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const { participantId } = session.metadata || {};

  if (!participantId) {
    console.log("No participantId in expired checkout session");
    return;
  }

  // Edge Case: Unlock payment processing when checkout expires/is cancelled
  const participant = await prisma.huntParticipant.findUnique({
    where: { id: participantId },
  });

  if (participant && participant.isPaymentProcessing) {
    await markPaymentProcessing(participantId, false);
    console.log(
      `Checkout expired for participant ${participantId}. Payment processing unlocked.`
    );
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment canceled: ${paymentIntent.id}`);

  // Find participant with this payment intent
  const participant = await prisma.huntParticipant.findUnique({
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  if (participant) {
    // Edge Case: Unlock payment processing when user cancels
    await markPaymentProcessing(participant.id, false);
    console.log(
      `Payment canceled for participant ${participant.id}. User can retry payment.`
    );
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const isOnboarded = account.charges_enabled && account.payouts_enabled;

  // Update user's Stripe onboarding status
  const user = await prisma.user.findUnique({
    where: { stripeAccountId: account.id },
  });

  if (user && isOnboarded && !user.stripeOnboarded) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeOnboarded: true,
        stripeOnboardedAt: new Date(),
      },
    });
    console.log(`User ${user.id} Stripe onboarding completed`);
  }
}
