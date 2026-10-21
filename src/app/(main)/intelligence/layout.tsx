import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aurora Dashboard — Live Space Weather Intelligence",
  description:
    "The live aurora intelligence dashboard: real-time Kp index, solar wind Bz, substorm detection and an aurora verdict telling you if it's worth heading out tonight.",
  alternates: { canonical: "/intelligence" },
  openGraph: {
    url: "https://auroraintel.io/intelligence",
    title: "Aurora Dashboard — Live Space Weather Intelligence",
    description:
      "Real-time Kp index, solar wind Bz, substorm detection and an at-a-glance aurora verdict for the Northern and Southern Lights.",
  },
};

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
