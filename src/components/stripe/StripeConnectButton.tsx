"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface StripeConnectButtonProps {
  refreshUrl?: string;
  returnUrl?: string;
}

export default function StripeConnectButton({
  refreshUrl,
  returnUrl,
}: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/connect-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshUrl,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to start onboarding");
      }
    } catch (error) {
      console.error("Error starting Stripe Connect onboarding:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Connecting..." : "Connect with Stripe"}
    </button>
  );
}
