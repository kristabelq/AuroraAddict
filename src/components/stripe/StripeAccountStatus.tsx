"use client";

import { useEffect, useState } from "react";
import StripeConnectButton from "./StripeConnectButton";

interface StripeStatus {
  connected: boolean;
  onboarded: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
}

export default function StripeAccountStatus() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/stripe/connect-onboarding");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Accept Payments</h3>
        <p className="text-gray-600 mb-4">
          Connect your Stripe account to receive payments for paid hunts.
          Stripe handles all payment processing securely.
        </p>
        <StripeConnectButton />
      </div>
    );
  }

  if (!status.onboarded) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Complete Stripe Setup</h3>
        <p className="text-gray-600 mb-4">
          Your Stripe account is connected but onboarding is not complete.
          Finish setting up to receive payments.
        </p>
        <StripeConnectButton />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Payment Setup Complete</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Active
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Charges Enabled:</span>
          <span className={status.chargesEnabled ? "text-green-600" : "text-red-600"}>
            {status.chargesEnabled ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Payouts Enabled:</span>
          <span className={status.payoutsEnabled ? "text-green-600" : "text-red-600"}>
            {status.payoutsEnabled ? "✓ Yes" : "✗ No"}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        You can now create paid hunts and receive payments from participants.
      </p>
    </div>
  );
}
