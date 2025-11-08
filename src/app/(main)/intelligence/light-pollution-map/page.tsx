"use client";

import { useRouter } from "next/navigation";

export default function LightPollutionMapPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col">
      {/* Header with Back Button */}
      <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-screen-lg mx-auto p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/intelligence")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
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
              <span className="font-medium">Back to Addict's Intel</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">HD Light Pollution Map</h1>
          <p className="text-gray-400 text-sm mt-2">
            Interactive map showing light pollution levels and aurora visibility worldwide
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <iframe
          src="https://lightpollutionmap.app/embed?lat=45.274886&lng=5.537109&zoom=3&opacity=50&auroraVisible=true&auroraOpacity=100"
          className="w-full h-full border-0"
          allowFullScreen
          aria-hidden="false"
          tabIndex={0}
          title="Light Pollution Map"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        />
      </div>
    </div>
  );
}
