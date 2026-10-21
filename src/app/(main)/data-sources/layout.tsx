import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aurora Data Sources — NOAA, NASA, GFZ & SuperMAG",
  description:
    "The official space-weather data powering Aurora Intel's aurora borealis and australis forecasts: NOAA SWPC, NASA DSCOVR, GFZ Hp30/Hp60 and the SuperMAG network.",
  alternates: { canonical: "/data-sources" },
  openGraph: {
    url: "https://auroraintel.io/data-sources",
    title: "Aurora Data Sources — NOAA, NASA, GFZ & SuperMAG",
    description:
      "Transparent, official data sources behind our aurora forecasts: NOAA, NASA DSCOVR, GFZ and SuperMAG.",
  },
};

export default function DataSourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
