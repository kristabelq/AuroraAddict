import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solar Flares & X-Ray Flux — Live Flare Tracking",
  description:
    "Track solar flares and GOES X-ray flux in real time. M- and X-class flares can launch CMEs that trigger aurora borealis and australis storms within 1–3 days.",
  alternates: { canonical: "/solar-flares" },
  openGraph: {
    url: "https://auroraintel.io/solar-flares",
    title: "Solar Flares & X-Ray Flux — Live Flare Tracking",
    description:
      "Real-time solar flare classification and X-ray flux. See which flares are likely to launch Earth-directed CMEs and spark aurora.",
  },
};

export default function SolarFlaresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
