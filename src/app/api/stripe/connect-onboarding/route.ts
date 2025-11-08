import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, refreshUrl, returnUrl } = await req.json();
    const userId = session.user.id;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeAccountId = user.stripeAccountId;

    // Create Stripe Connect account if doesn't exist
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: email || user.email || undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
      });

      stripeAccountId = account.id;

      // Update user with Stripe account ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl || `${process.env.NEXTAUTH_URL}/settings?stripe_refresh=true`,
      return_url: returnUrl || `${process.env.NEXTAUTH_URL}/settings?stripe_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Connect account" },
      { status: 500 }
    );
  }
}

// Get Stripe account status
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        stripeOnboarded: true,
        stripeOnboardedAt: true,
      },
    });

    if (!user || !user.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboarded: false,
      });
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Check if account is fully onboarded
    const isOnboarded = account.charges_enabled && account.payouts_enabled;

    // Update database if onboarding status changed
    if (isOnboarded && !user.stripeOnboarded) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeOnboarded: true,
          stripeOnboardedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      connected: true,
      onboarded: isOnboarded,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error("Error fetching Stripe account status:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe account status" },
      { status: 500 }
    );
  }
}
