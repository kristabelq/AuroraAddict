"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const steps = [
  {
    title: "Welcome to Aurora Addict",
    description: "Track, plan, and share aurora sightings with a global community of aurora chasers.",
    icon: "🌌",
  },
  {
    title: "Get Real-Time Updates",
    description: "View live Kp index values, cloud coverage, and recent sightings on an interactive map.",
    icon: "📊",
  },
  {
    title: "Plan Your Hunt",
    description: "Create public or private aurora hunting events and connect with other enthusiasts.",
    icon: "🗺️",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await fetch("/api/user/complete-onboarding", {
        method: "POST",
      });
      // Force page reload to refresh session
      window.location.href = "/";
    }
  };

  const handleSkip = async () => {
    await fetch("/api/user/complete-onboarding", {
      method: "POST",
    });
    // Force page reload to refresh session
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0e17] via-[#1a1f2e] to-[#0a0e17] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{steps[currentStep].icon}</div>
          <h2 className="text-2xl font-bold mb-2">{steps[currentStep].title}</h2>
          <p className="text-gray-400">{steps[currentStep].description}</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-aurora-green"
                  : "w-2 bg-white/20"
              }`}
            />
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleNext}
            className="w-full bg-aurora-green hover:bg-aurora-green/80 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {currentStep < steps.length - 1 ? "Next" : "Get Started"}
          </button>

          {currentStep < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full text-gray-400 hover:text-white py-2 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
