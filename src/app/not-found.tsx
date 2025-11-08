import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-aurora-blue"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          Looks like this aurora disappeared into the night sky. The page you're
          looking for doesn't exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="/feed"
            className="bg-white/10 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
          >
            View Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
