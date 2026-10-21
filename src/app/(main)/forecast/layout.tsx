import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kp Index Aurora Forecast — 3-Day & 27-Day Outlook",
  description:
    "Live Kp index aurora forecast from NOAA SWPC. Plan aurora borealis and australis trips with 3-day and 27-day geomagnetic activity predictions.",
  alternates: { canonical: "/forecast" },
  openGraph: {
    url: "https://auroraintel.io/forecast",
    title: "Kp Index Aurora Forecast — 3-Day & 27-Day Outlook",
    description:
      "3-day and 27-day Kp index forecasts to plan when and where to see the Northern and Southern Lights.",
  },
};

export default function ForecastLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
