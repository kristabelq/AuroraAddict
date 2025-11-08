import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { canProcessPayment, markPaymentProcessing } from "@/lib/huntEdgeCases";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { huntId } = await req.json();

    // Get hunt details
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        user: {
          select: {
            stripeAccountId: true,
            stripeOnboarded: true,
          },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // Check if hunt requires payment
    if (!hunt.isPaid || !hunt.price) {
      return NextResponse.json(
        { error: "This hunt does not require payment" },
        { status: 400 }
      );
    }

    // Check if hunt creator has connected Stripe account
    if (!hunt.user.stripeAccountId || !hunt.user.stripeOnboarded) {
      return NextResponse.json(
        { error: "Hunt creator has not set up payment receiving" },
        { status: 400 }
      );
    }

    // Check if user is the hunt creator
    if (hunt.userId === session.user.id) {
      return NextResponse.json(
        { error: "Hunt creator cannot pay for their own hunt" },
        { status: 400 }
      );
    }

    // Edge Case: Check if payment can be processed (prevents double payments)
    const paymentCheck = await canProcessPayment(huntId, session.user.id);
    if (!paymentCheck.allowed) {
      return NextResponse.json(
        { error: paymentCheck.reason },
        { status: 400 }
      );
    }

    // Get participant record
    const existingParticipant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: session.user.id,
        },
      },
    });

    if (!existingParticipant) {
      return NextResponse.json(
        { error: "You must join the hunt first" },
        { status: 400 }
      );
    }

    // Edge Case: Mark payment as processing to prevent concurrent payment attempts
    await markPaymentProcessing(existingParticipant.id, true);

    // Calculate application fee (10% platform fee)
    const applicationFeeAmount = Math.round(hunt.price * 100 * 0.1); // 10% fee in cents
    const totalAmount = Math.round(hunt.price * 100); // Convert to cents

    // Create Checkout Session
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: hunt.name,
                description:
                  hunt.description || `Aurora hunt at ${hunt.location}`,
                images: hunt.coverImage
                  ? [
                      hunt.coverImage.startsWith("http")
                        ? hunt.coverImage
                        : `${process.env.NEXTAUTH_URL}${hunt.coverImage}`,
                    ]
                  : undefined,
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: hunt.user.stripeAccountId,
          },
        },
        metadata: {
          huntId,
          userId: session.user.id,
          participantId: existingParticipant.id,
        },
        success_url: `${process.env.NEXTAUTH_URL}/hunts/${huntId}?payment=success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/hunts/${huntId}?payment=cancelled`,
      });

      return NextResponse.json({
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      });
    } catch (stripeError) {
      // Edge Case: Unlock payment processing if checkout creation fails
      await markPaymentProcessing(existingParticipant.id, false);
      throw stripeError;
    }
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
