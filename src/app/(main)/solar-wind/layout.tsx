import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Solar Wind & Bz — Real-Time Aurora Conditions",
  description:
    "Real-time solar wind speed, density and Bz (interplanetary magnetic field) from the DSCOVR satellite. A southward Bz drives aurora borealis and australis activity.",
  alternates: { canonical: "/solar-wind" },
  openGraph: {
    url: "https://auroraintel.io/solar-wind",
    title: "Live Solar Wind & Bz — Real-Time Aurora Conditions",
    description:
      "Live solar wind speed, density and Bz. When Bz turns strongly south, aurora is far more likely — track it in real time.",
  },
};

export default function SolarWindLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
