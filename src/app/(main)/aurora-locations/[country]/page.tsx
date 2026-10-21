import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { getAuroraCountries, getLocationsByCountry } from "@/lib/auroraLocations";
import { countrySlug, countryFromSlug } from "@/lib/locationSlug";

type Params = { country: string };

export function generateStaticParams(): Params[] {
  return getAuroraCountries().map((country) => ({ country: countrySlug(country) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const country = countryFromSlug(slug);
  if (!country) return {};

  const locations = getLocationsByCountry(country);
  const bestKp = Math.min(...locations.map((l) => l.minKpRequired));
  const topCities = locations
    .slice()
    .sort((a, b) => a.minKpRequired - b.minKpRequired)
    .slice(0, 3)
    .map((l) => l.city)
    .join(", ");

  return {
    title: `Where to See the Aurora (Northern Lights) in ${country}`,
    description: `See the aurora borealis in ${country}: ${locations.length} viewing locations including ${topCities}. Aurora is visible here from Kp ${bestKp} — check the live Kp forecast.`,
    alternates: { canonical: `/aurora-locations/${slug}` },
    openGraph: {
      type: "article",
      url: `https://auroraintel.io/aurora-locations/${slug}`,
      title: `Where to See the Aurora (Northern Lights) in ${country}`,
      description: `${locations.length} aurora-viewing locations in ${country}, visible from Kp ${bestKp}.`,
    },
  };
}

export default async function CountryAuroraPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country: slug } = await params;
  const country = countryFromSlug(slug);
  if (!country) notFound();

  const locations = getLocationsByCountry(country).sort(
    (a, b) => a.minKpRequired - b.minKpRequired || b.latitude - a.latitude,
  );
  const bestKp = Math.min(...locations.map((l) => l.minKpRequired));
  const best = locations.find((l) => l.minKpRequired === bestKp);

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
      {
        "@type": "ListItem",
        position: 3,
        name: country,
        item: `https://auroraintel.io/aurora-locations/${slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Aurora viewing locations in ${country}`,
    itemListElement: locations.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Place",
        name: l.city,
        address: { "@type": "PostalAddress", addressRegion: l.region, addressCountry: country },
        geo: { "@type": "GeoCoordinates", latitude: l.latitude, longitude: l.longitude },
      },
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a1f2e] to-[#0f1419]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      <article className="mx-auto max-w-3xl px-4 pt-10 text-gray-200">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/aurora-locations" className="hover:text-white">
            Aurora Locations
          </Link>{" "}
          / <span className="text-gray-300">{country}</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Where to See the Aurora (Northern Lights) in {country}
        </h1>
        <p className="mt-4 leading-relaxed text-gray-300">
          {country} has {locations.length} aurora-viewing{" "}
          {locations.length === 1 ? "location" : "locations"} in our guide. The aurora
          borealis is most accessible here at{" "}
          <strong>{best?.city}</strong>, where it can appear from a{" "}
          <strong>Kp index of {bestKp}</strong>. A higher Kp pushes the auroral oval toward
          the equator, so during stronger geomagnetic storms the aurora becomes visible from
          more of {country}. Check the live{" "}
          <Link href="/forecast" className="text-emerald-400 hover:underline">
            Kp forecast
          </Link>{" "}
          and the real-time{" "}
          <Link href="/intelligence" className="text-emerald-400 hover:underline">
            aurora dashboard
          </Link>{" "}
          before heading out, and read{" "}
          <Link href="/what-is-the-aurora" className="text-emerald-400 hover:underline">
            what causes the aurora
          </Link>{" "}
          to understand the conditions.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-white">
          Aurora viewing locations in {country}
        </h2>
        <ul className="mt-4 space-y-3 pb-6">
          {locations.map((l) => (
            <li
              key={`${l.city}-${l.latitude}-${l.longitude}`}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{l.city}</span>
                <span className="text-xs text-gray-400">
                  from Kp {l.minKpRequired} · {l.latitude.toFixed(1)}°
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-400">{l.region}</div>
              {l.notes && <p className="mt-1 text-sm text-gray-300">{l.notes}</p>}
            </li>
          ))}
        </ul>

        <p className="pb-4 text-sm text-gray-400">
          Looking elsewhere? Browse{" "}
          <Link href="/aurora-locations" className="text-emerald-400 hover:underline">
            all aurora viewing locations by country
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
