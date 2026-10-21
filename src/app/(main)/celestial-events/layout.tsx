import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meteor Showers & Celestial Events Calendar",
  description:
    "A calendar of meteor showers, eclipses and celestial events — pair the Perseids, Geminids and more with your aurora borealis and australis hunts.",
  alternates: { canonical: "/celestial-events" },
  openGraph: {
    url: "https://auroraintel.io/celestial-events",
    title: "Meteor Showers & Celestial Events Calendar",
    description:
      "Meteor showers, eclipses and celestial events to combine with your aurora hunts for a complete night-sky experience.",
  },
};

export default function CelestialEventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
