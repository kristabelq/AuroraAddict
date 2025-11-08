import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
