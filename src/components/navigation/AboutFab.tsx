"use client";

import Link from "next/link";
import Image from "next/image";
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
      className="fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full overflow-hidden transition-all shadow-lg hover:scale-110 ring-2 ring-white/20 hover:ring-white/40"
      aria-label="About Aurora Intel"
    >
      <Image
        src="/logo.png"
        alt="Aurora Intel"
        width={44}
        height={44}
        className="w-full h-full object-cover"
      />
    </Link>
  );
}
