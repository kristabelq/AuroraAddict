"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Something Went Wrong
        </h2>
        <p className="text-gray-400 mb-8">
          The aurora forecast got a bit stormy. We're working to fix this issue.
        </p>

        {error.message && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-red-300 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
