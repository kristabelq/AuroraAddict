"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TimeHeader from "@/components/TimeHeader";

interface Expert {
  name: string;
  handle: string;
  platform: "twitter" | "youtube" | "website" | "facebook";
  url: string;
  description: string;
  specialty: string;
  avatar?: string;
}

const experts: Expert[] = [
  // Add your experts here
  // Example:
  // {
  //   name: "Dr. Tamitha Skov",
  //   handle: "@TamithaSkov",
  //   platform: "twitter",
  //   url: "https://twitter.com/TamithaSkov",
  //   description: "Space Weather Woman - PhD in Geophysics, provides weekly space weather forecasts",
  //   specialty: "Space Weather Forecasting",
  // },
];

export default function ExpertsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user && !session.user.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [session, status, router]);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "𝕏";
      case "youtube":
        return "▶️";
      case "facebook":
        return "📘";
      case "website":
        return "🌐";
      default:
        return "🔗";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter":
        return "from-gray-800 to-gray-900 border-gray-600";
      case "youtube":
        return "from-red-900/40 to-red-800/40 border-red-500/30";
      case "facebook":
        return "from-blue-900/40 to-blue-800/40 border-blue-500/30";
      case "website":
        return "from-purple-900/40 to-indigo-900/40 border-purple-500/30";
      default:
        return "from-gray-900/40 to-gray-800/40 border-gray-500/30";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f1420] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-300 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1420] text-white pb-24">
      <TimeHeader />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/intelligence?tab=aurora-intel")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Aurora Intel
          </button>

          <h1 className="text-3xl font-bold mb-2">Aurora Experts</h1>
          <p className="text-gray-400">
            Follow these experts for aurora forecasts and space weather updates
          </p>
        </div>

        {/* Experts List */}
        {experts.length > 0 ? (
          <div className="space-y-4">
            {experts.map((expert, index) => (
              <a
                key={index}
                href={expert.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block bg-gradient-to-br ${getPlatformColor(expert.platform)} rounded-2xl p-5 border hover:scale-[1.01] transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    {expert.avatar || getPlatformIcon(expert.platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{expert.name}</h3>
                      <span className="text-sm text-gray-400">{expert.handle}</span>
                    </div>
                    <p className="text-sm text-purple-300 mb-2">{expert.specialty}</p>
                    <p className="text-gray-300 text-sm">{expert.description}</p>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 border border-purple-500/30 text-center">
            <span className="text-6xl mb-4 block">👨‍🔬</span>
            <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400">
              We&apos;re curating a list of trusted space weather experts and aurora forecasters.
              <br />
              Check back soon for recommendations on who to follow!
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">Why Follow Experts?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Get real-time aurora alerts before automated systems</li>
                <li>Learn to interpret space weather data yourself</li>
                <li>Receive expert analysis during geomagnetic storms</li>
                <li>Join a community of aurora enthusiasts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
