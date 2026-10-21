import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coronal Holes & High-Speed Streams — Predictable Aurora",
  description:
    "Track coronal holes and high-speed solar wind streams (HSS). They produce predictable, multi-day aurora borealis and australis activity (Kp 4–6) on a 27-day cycle.",
  alternates: { canonical: "/coronal-holes" },
  openGraph: {
    url: "https://auroraintel.io/coronal-holes",
    title: "Coronal Holes & High-Speed Streams — Predictable Aurora",
    description:
      "Coronal holes send high-speed solar wind to Earth, producing reliable multi-day aurora — ideal for planning trips in advance.",
  },
};

export default function CoronalHolesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
