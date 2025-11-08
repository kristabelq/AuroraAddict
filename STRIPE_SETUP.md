# Stripe Payment Integration Setup Guide

This guide explains how to set up Stripe payments for Aurora Addict, allowing hunt creators to receive payments for their paid hunts.

## Overview

The Stripe integration uses **Stripe Connect** to enable marketplace-style payments:
- Hunt creators connect their own Stripe accounts to receive payments
- Participants pay through Stripe Checkout
- Platform takes a 10% fee on each transaction
- Payments are automatically transferred to hunt creators

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Stripe API keys (available in your Stripe Dashboard)

## Setup Steps

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** and **Secret key**
4. For testing, use the test mode keys (they start with `pk_test_` and `sk_test_`)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Payment Integration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 3. Set Up Stripe Webhooks

Webhooks allow Stripe to notify your application about payment events.

#### Local Development (using Stripe CLI)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`

#### Production (Stripe Dashboard)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated`
5. Copy the **Signing secret** and add it to your production environment variables

### 4. Enable Stripe Connect

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Connect** → **Settings**
2. Enable **Express** account type
3. Configure your branding (optional)
4. Set up your platform profile

## Usage

### For Hunt Creators

1. **Connect Stripe Account**:
   - Navigate to your settings page
   - Click "Connect with Stripe"
   - Complete the Stripe onboarding process
   - Once complete, you can create paid hunts

2. **Create a Paid Hunt**:
   - Create a new hunt
   - Check "Paid Hunt"
   - Set the price
   - Publish the hunt

3. **Receive Payments**:
   - When participants join and pay, funds are automatically transferred to your Stripe account
   - Platform fee (10%) is deducted automatically
   - View payouts in your Stripe Dashboard

### For Participants

1. **Join a Paid Hunt**:
   - Browse available hunts
   - Click "Join" on a paid hunt
   - Complete payment through Stripe Checkout
   - Receive confirmation once payment is successful

## Testing

### Test Card Numbers

Use these test card numbers in development:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0027 6000 3184`
- **Payment declined**: `4000 0000 0000 0002`

Use any:
- Future expiration date (e.g., 12/34)
- Any 3-digit CVC
- Any ZIP code

### Testing the Flow

1. **Set up test Stripe Connect account**:
   - Use Stripe CLI or test mode
   - Create a test hunt creator account
   - Connect Stripe using test mode

2. **Create a test paid hunt**:
   - Log in as hunt creator
   - Create a hunt with price
   - Set isPaid to true

3. **Test payment**:
   - Log in as a different user
   - Join the paid hunt
   - Use test card `4242 4242 4242 4242`
   - Verify payment completes successfully

## API Endpoints

### Stripe Connect Onboarding
- **POST** `/api/stripe/connect-onboarding` - Create Stripe Connect account link
- **GET** `/api/stripe/connect-onboarding` - Get Stripe account status

### Payment Checkout
- **POST** `/api/stripe/create-checkout` - Create Stripe Checkout session

### Webhooks
- **POST** `/api/stripe/webhook` - Handle Stripe webhook events

## Database Schema

### User Table
```prisma
model User {
  stripeAccountId   String?   @unique
  stripeOnboarded   Boolean   @default(false)
  stripeOnboardedAt DateTime?
}
```

### HuntParticipant Table
```prisma
model HuntParticipant {
  stripePaymentIntentId   String? @unique
  stripeCheckoutSessionId String? @unique
  paymentAmount           Float?
  paymentCurrency         String? @default("usd")
  paidAt                  DateTime?
}
```

## Components

### StripeConnectButton
```tsx
import StripeConnectButton from "@/components/stripe/StripeConnectButton";

<StripeConnectButton />
```

### StripeAccountStatus
```tsx
import StripeAccountStatus from "@/components/stripe/StripeAccountStatus";

<StripeAccountStatus />
```

## Security Considerations

1. **Never expose secret keys**: Keep `STRIPE_SECRET_KEY` on the server only
2. **Verify webhooks**: Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
3. **Validate amounts**: Always validate payment amounts on the server
4. **Use HTTPS**: In production, always use HTTPS for webhook endpoints

## Troubleshooting

### "Webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
- Check that the endpoint URL matches exactly
- Verify you're using the correct secret for test/live mode

### "Stripe account not connected"
- Hunt creator needs to complete Stripe Connect onboarding
- Check `stripeAccountId` and `stripeOnboarded` in database
- Verify Stripe Connect settings in Dashboard

### "Payment not processing"
- Check Stripe logs in Dashboard → Developers → Logs
- Verify webhook is receiving events
- Check application logs for errors

## Going to Production

1. Switch to **live mode** in Stripe Dashboard
2. Get live API keys (they start with `pk_live_` and `sk_live_`)
3. Update environment variables with live keys
4. Set up production webhook endpoint
5. Test thoroughly with real payment methods
6. Enable 2FA on your Stripe account

## Platform Fees

- Currently set to **10%** of the hunt price
- Configured in `/api/stripe/create-checkout/route.ts`
- To change: modify `applicationFeeAmount` calculation

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For Aurora Addict integration issues:
- Check application logs
- Review webhook events in Stripe Dashboard
- Verify database records
