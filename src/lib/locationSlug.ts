import { getAuroraCountries } from "./auroraLocations";

/** Convert a country name to a URL slug, e.g. "Czech Republic" -> "czech-republic". */
export function countrySlug(country: string): string {
  return country
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve a slug back to its canonical country name (undefined if unknown). */
export function countryFromSlug(slug: string): string | undefined {
  return getAuroraCountries().find((c) => countrySlug(c) === slug);
}
