import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moon Phase Calendar for Aurora Photography",
  description:
    "A moon phase calendar for planning aurora photography. Dark, new-moon skies give the best contrast for shooting the aurora borealis and australis.",
  alternates: { canonical: "/moon-phase" },
  openGraph: {
    url: "https://auroraintel.io/moon-phase",
    title: "Moon Phase Calendar for Aurora Photography",
    description:
      "Plan aurora shoots around the moon. New-moon nights mean darker skies and better aurora contrast.",
  },
};

export default function MoonPhaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
