import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Where to See the Aurora: Visibility by Kp Index & Location",
  description:
    "Find where you can see the aurora borealis and aurora australis by Kp index. 50+ locations across Iceland, Norway, Finland, Canada, Alaska, New Zealand and Tasmania.",
  alternates: { canonical: "/aurora-guide" },
  openGraph: {
    url: "https://auroraintel.io/aurora-guide",
    title: "Where to See the Aurora: Visibility by Kp Index & Location",
    description:
      "Aurora visibility by location and Kp index — the minimum geomagnetic activity needed to see the Northern and Southern Lights near you.",
  },
};

export default function AuroraGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
