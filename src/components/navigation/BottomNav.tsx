"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      name: "Intelligence",
      path: "/intelligence",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "fill-aurora-green" : "fill-gray-400"}`}
          viewBox="0 0 24 24"
        >
          <path d="M4 18 Q6 14, 8 16 T12 14 T16 16 T20 18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <path d="M3 14 Q5 10, 7 12 T11 10 T15 12 T19 10 T21 14" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
          <path d="M2 10 Q4 6, 6 8 T10 6 T14 8 T18 6 T22 10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
          <circle cx="8" cy="5" r="1" opacity="0.9" />
          <circle cx="12" cy="3" r="1" opacity="0.9" />
          <circle cx="16" cy="5" r="1" opacity="0.9" />
        </svg>
      ),
    },
    {
      name: "Sightings",
      path: "/feed",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "fill-aurora-green" : "fill-gray-400"}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
      ),
    },
    {
      name: "Spotted",
      path: "/sightings/new",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "stroke-aurora-green" : "stroke-gray-400"}`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      name: "Chats",
      path: "/chats",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "fill-aurora-green" : "fill-gray-400"}`}
          viewBox="0 0 24 24"
        >
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: "Hunts",
      path: "/hunts",
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? "stroke-aurora-green" : "stroke-gray-400"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (active: boolean) => {
        // @ts-ignore - userType exists on session.user when available
        const isBusinessUser = session?.user?.userType === "business";

        if (isBusinessUser) {
          // Business icon (briefcase)
          return (
            <svg
              className={`w-6 h-6 ${active ? "fill-aurora-green" : "fill-gray-400"}`}
              viewBox="0 0 24 24"
            >
              <path d="M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              <path d="M12 11h.01" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" />
            </svg>
          );
        }

        // Personal icon (default)
        return (
          <svg
            className={`w-6 h-6 ${active ? "fill-aurora-green" : "fill-gray-400"}`}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M3 21v-2a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v2" />
          </svg>
        );
      },
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-t border-white/10 z-50">
      <div className="max-w-screen-lg mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path ||
              (item.path === "/chats" && pathname.startsWith("/chats/"));
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center gap-1 min-w-[50px]"
              >
                {item.icon(isActive)}
                <span
                  className={`text-xs ${
                    isActive ? "text-aurora-green" : "text-gray-400"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
