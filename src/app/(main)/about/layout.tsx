import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Auroras Work: Solar Flares, CMEs & Coronal Holes",
  description:
    "Learn what causes the aurora borealis and aurora australis — how solar flares, CMEs, coronal holes and the solar wind's Bz create the Northern and Southern Lights.",
  alternates: { canonical: "/about" },
  openGraph: {
    url: "https://auroraintel.io/about",
    title: "How Auroras Work: Solar Flares, CMEs & Coronal Holes",
    description:
      "The science behind the aurora borealis and australis: flares, CMEs, coronal holes, the solar wind, and aurora colours explained.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
