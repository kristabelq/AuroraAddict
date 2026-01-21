"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AboutFab() {
  const pathname = usePathname();

  // Hide FAB on the about page itself and in chat conversations
  if (pathname === "/about" || pathname.match(/^\/chats\/[^/]+$/)) {
    return null;
  }

  return (
    <Link
      href="/about"
      className="fixed bottom-20 right-4 z-40 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105"
      aria-label="About AuroraAddict"
    >
      <svg
        className="w-5 h-5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </Link>
  );
}
