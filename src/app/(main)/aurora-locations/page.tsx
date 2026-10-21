import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getAuroraCountries, getLocationsByCountry } from "@/lib/auroraLocations";
import { countrySlug } from "@/lib/locationSlug";

export const metadata: Metadata = {
  title: "Where to See the Aurora: Viewing Locations by Country",
  description:
    "Browse 110+ aurora-viewing locations across 40 countries. Find the minimum Kp index needed to see the aurora borealis (Northern Lights) from Iceland, Norway, Canada and beyond.",
  alternates: { canonical: "/aurora-locations" },
  openGraph: {
    url: "https://auroraintel.io/aurora-locations",
    title: "Where to See the Aurora: Viewing Locations by Country",
    description:
      "Aurora-viewing locations by country with the Kp index needed to see the Northern Lights near you.",
  },
};

export default function AuroraLocationsPage() {
  const countries = getAuroraCountries()
    .map((country) => {
      const locations = getLocationsByCountry(country);
      const bestKp = Math.min(...locations.map((l) => l.minKpRequired));
      return { country, count: locations.length, bestKp };
    })
    .sort((a, b) => a.bestKp - b.bestKp || b.count - a.count || a.country.localeCompare(b.country));

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://auroraintel.io" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Aurora Locations",
        item: "https://auroraintel.io/aurora-locations",
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Aurora viewing locations by country",
    itemListElement: countries.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Aurora in ${c.country}`,
      url: `https://auroraintel.io/aurora-locations/${countrySlug(c.country)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      <div className="mx-auto max-w-4xl px-4 pt-10 text-gray-200">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          / <span className="text-gray-300">Aurora Locations</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Where to See the Aurora: Viewing Locations by Country
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-300">
          The aurora borealis is visible from high latitudes whenever geomagnetic activity is
          strong enough. Each country below is ranked by the lowest <strong>Kp index</strong>{" "}
          needed to see the aurora there — the lower the Kp, the more often the Northern
          Lights appear. During strong geomagnetic storms the aurora reaches far lower
          latitudes than usual. New to this? Start with{" "}
          <Link href="/what-is-the-aurora" className="text-emerald-400 hover:underline">
            what the aurora is
          </Link>{" "}
          or check the live{" "}
          <Link href="/forecast" className="text-emerald-400 hover:underline">
            Kp forecast
          </Link>
          .
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-3 pb-10 sm:grid-cols-2">
          {countries.map((c) => (
            <li key={c.country}>
              <Link
                href={`/aurora-locations/${countrySlug(c.country)}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-emerald-400/40 hover:bg-white/10"
              >
                <span className="font-medium text-white">{c.country}</span>
                <span className="text-xs text-gray-400">
                  {c.count} {c.count === 1 ? "spot" : "spots"} · from Kp {c.bestKp}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
