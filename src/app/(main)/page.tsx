import type { Metadata } from "next";
import IntelligencePage from "./intelligence/page";

export const metadata: Metadata = {
  title: {
    absolute: "Aurora Intel — Live Aurora Borealis & Australis Forecasts",
  },
  description:
    "Live aurora forecasts for the Northern Lights (aurora borealis) and Southern Lights (aurora australis). Real-time Kp index, solar wind and Bz data, and alerts to help you see the aurora tonight.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "https://auroraintel.io",
    title: "Aurora Intel — Live Aurora Borealis & Australis Forecasts",
    description:
      "Real-time aurora forecasts for the Northern and Southern Lights: Kp index, solar wind, Bz, and aurora alerts in one place.",
  },
};

export default function Homepage() {
  return <IntelligencePage />;
}
