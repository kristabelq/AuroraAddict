"use client";

import Link from "next/link";
import Image from "next/image";

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
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-aurora-green/20 to-purple-500/20 mb-4 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Aurora Intel Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Aurora Intel</h2>
          <p className="text-gray-400">Your intelligent companion for aurora hunts</p>
        </div>

        {/* Connect Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Connect with me</h3>

          {/* Instagram */}
          <a
            href="https://instagram.com/auroraintel.io"
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
              <p className="text-gray-400 text-sm">@auroraintel.io</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Email */}
          <a
            href="mailto:kristabel@auroraintel.io"
            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-aurora-green/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Email for Collaboration</p>
              <p className="text-gray-400 text-sm">kristabel@auroraintel.io</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* PayPal Support */}
          <a
            href="https://paypal.me/kristabelq"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-blue-600/20 to-blue-400/20 hover:from-blue-600/30 hover:to-blue-400/30 rounded-xl p-4 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.629h6.754c2.236 0 3.954.637 5.107 1.894.551.601.913 1.283 1.088 2.048.18.79.181 1.742-.004 2.834l-.008.04v.026c-.198 1.19-.57 2.188-1.106 2.972-.537.786-1.236 1.424-2.079 1.898-.824.466-1.776.787-2.832.955-.527.084-1.09.126-1.676.126H8.51a.948.948 0 0 0-.935.8l-.01.065-.8 5.067-.006.04a.64.64 0 0 1-.633.541l-.05-.045z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Support Aurora Intel</p>
              <p className="text-gray-400 text-sm">Buy me a coffee</p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* About Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">About Aurora Intel</h3>
          <div className="bg-white/5 rounded-xl p-5 space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Aurora Intel is designed and created by Kristabel, a passionate aurora hunter, who wanted to create the ultimate tool for fellow aurora addicts. Whether you are planning your first aurora hunt or you are a seasoned veteran, this app is designed to help you catch the magic of the Northern and Southern Lights.
            </p>
            <p className="text-gray-300 leading-relaxed">
              From real-time solar wind data to community sightings and organised hunts, Aurora Intel brings everything you need into one place.
            </p>
          </div>
        </div>

        {/* Add to Home Screen Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Add to Home Screen</h3>
          <p className="text-gray-400 text-sm">Install Aurora Intel on your device for quick access and a native app experience.</p>

          {/* iOS Instructions */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span className="text-white font-medium">iPhone / iPad</span>
            </div>
            <ol className="text-gray-300 text-sm space-y-2 ml-7 list-decimal">
              <li>Tap the <span className="text-white">Share</span> button (square with arrow pointing up)</li>
              <li>Scroll down and tap <span className="text-white">Add to Home Screen</span></li>
              <li>Tap <span className="text-white">Add</span> in the top right corner</li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4483.9993.9993 0 .5511-.4483.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
              </svg>
              <span className="text-white font-medium">Android</span>
            </div>
            <ol className="text-gray-300 text-sm space-y-2 ml-7 list-decimal">
              <li>Tap the <span className="text-white">Menu</span> button (three dots in corner)</li>
              <li>Tap <span className="text-white">Add to Home Screen</span> or <span className="text-white">Install App</span></li>
              <li>Tap <span className="text-white">Add</span> or <span className="text-white">Install</span> to confirm</li>
            </ol>
          </div>
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
