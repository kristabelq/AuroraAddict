import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CME Alerts — Earth-Directed Coronal Mass Ejections",
  description:
    "Live coronal mass ejection (CME) alerts with arrival times and Kp estimates. Earth-directed CMEs trigger strong aurora borealis and australis displays.",
  alternates: { canonical: "/cme-alerts" },
  openGraph: {
    url: "https://auroraintel.io/cme-alerts",
    title: "CME Alerts — Earth-Directed Coronal Mass Ejections",
    description:
      "Track Earth-directed CMEs, their estimated arrival times and expected Kp — the big drivers of strong, widespread aurora.",
  },
};

export default function CmeAlertsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
