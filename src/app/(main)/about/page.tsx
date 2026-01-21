"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-white">About</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* App Logo/Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-aurora-green/20 to-purple-500/20 mb-4">
            <svg className="w-12 h-12 text-aurora-green" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 18 Q6 14, 8 16 T12 14 T16 16 T20 18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
              <path d="M3 14 Q5 10, 7 12 T11 10 T15 12 T19 10 T21 14" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
              <path d="M2 10 Q4 6, 6 8 T10 6 T14 8 T18 6 T22 10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
              <circle cx="8" cy="5" r="1" opacity="0.9" />
              <circle cx="12" cy="3" r="1" opacity="0.9" />
              <circle cx="16" cy="5" r="1" opacity="0.9" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">AuroraAddict</h2>
          <p className="text-gray-400">Your companion for chasing the Northern Lights</p>
        </div>

        {/* About Text */}
        <div className="bg-white/5 rounded-xl p-5 space-y-4">
          <p className="text-gray-300 leading-relaxed">
            AuroraAddict was created by a passionate aurora hunter who wanted to build the ultimate tool
            for fellow chasers. Whether you&apos;re planning your first aurora hunt or you&apos;re a seasoned
            veteran, this app is designed to help you catch the magic of the Northern (and Southern) Lights.
          </p>
          <p className="text-gray-300 leading-relaxed">
            From real-time solar wind data to community sightings and organized hunts,
            AuroraAddict brings everything you need into one place.
          </p>
        </div>

        {/* Connect Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Connect with me</h3>

          {/* Instagram */}
          <a
            href="https://instagram.com/auroraaddict"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 rounded-xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Follow on Instagram</p>
              <p className="text-gray-400 text-sm">@auroraaddict</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Email */}
          <a
            href="mailto:hello@auroraaddict.com"
            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-aurora-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Send an Email</p>
              <p className="text-gray-400 text-sm">hello@auroraaddict.com</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-aurora-green/10 to-blue-500/10 rounded-xl p-5 text-center">
          <p className="text-gray-300 mb-3">
            Love the app? Your support helps keep the lights on (pun intended)!
          </p>
          <a
            href="https://buymeacoffee.com/auroraaddict"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-6 py-3 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
            </svg>
            Buy me a coffee
          </a>
        </div>

        {/* Version */}
        <div className="text-center text-gray-500 text-sm">
          <p>Version 1.0.0</p>
          <p className="mt-1">Made with love for aurora chasers everywhere</p>
        </div>
      </div>
    </div>
  );
}
