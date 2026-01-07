import Stripe from "stripe";

// For intelligence-only version, allow building without real Stripe key
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === "production") {
  console.warn("⚠️  STRIPE_SECRET_KEY not configured - payment features will not work");
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Helper to get Stripe publishable key for client-side
export function getStripePublishableKey() {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined");
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
