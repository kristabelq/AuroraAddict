// Country mapping for aurora hunting locations
export const COUNTRIES = [
  { code: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "BY", flag: "🇧🇾", name: "Belarus" },
  { code: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "EE", flag: "🇪🇪", name: "Estonia" },
  { code: "FK", flag: "🇫🇰", name: "Falkland Islands" },
  { code: "FI", flag: "🇫🇮", name: "Finland" },
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "IS", flag: "🇮🇸", name: "Iceland" },
  { code: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "KZ", flag: "🇰🇿", name: "Kazakhstan" },
  { code: "LV", flag: "🇱🇻", name: "Latvia" },
  { code: "LT", flag: "🇱🇹", name: "Lithuania" },
  { code: "MN", flag: "🇲🇳", name: "Mongolia" },
  { code: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "GB-SCT", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", name: "Scotland" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "UA", flag: "🇺🇦", name: "Ukraine" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "US", flag: "🇺🇸", name: "United States" },
];

// Common location name variations and aliases
const COUNTRY_ALIASES: Record<string, string> = {
  // USA variations
  "usa": "US",
  "united states of america": "US",
  "america": "US",
  "alaska": "US",

  // UK variations
  "uk": "GB",
  "england": "GB",
  "wales": "GB",
  "northern ireland": "GB",
  "great britain": "GB",

  // Other common aliases
  "holland": "NL",
  "russia": "RU",
  "russian federation": "RU",
};

/**
 * Extract country information from a location string
 * @param location - The location string (e.g., "Tromsø, Norway" or "Australia")
 * @returns Object with countryCode, countryName, and areaName
 */
export function extractCountryFromLocation(location: string): {
  countryCode: string | null;
  countryName: string | null;
  areaName: string | null;
} {
  if (!location) {
    return { countryCode: null, countryName: null, areaName: null };
  }

  const locationLower = location.toLowerCase().trim();

  // First, try to find a direct match with country names
  for (const country of COUNTRIES) {
    const countryNameLower = country.name.toLowerCase();

    // Check if location contains the country name
    if (locationLower.includes(countryNameLower)) {
      // Extract area name (everything before the country name, if comma-separated)
      const parts = location.split(",").map(p => p.trim());
      let areaName: string | null = null;

      if (parts.length > 1) {
        // Find which part is the country and use the rest as area
        const countryPartIndex = parts.findIndex(
          p => p.toLowerCase().includes(countryNameLower)
        );
        if (countryPartIndex > 0) {
          areaName = parts.slice(0, countryPartIndex).join(", ");
        } else if (countryPartIndex === 0 && parts.length > 1) {
          areaName = parts.slice(1).join(", ");
        }
      }

      return {
        countryCode: country.code,
        countryName: country.name,
        areaName,
      };
    }
  }

  // Try to match with aliases
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (locationLower.includes(alias)) {
      const country = COUNTRIES.find(c => c.code === code);
      if (country) {
        // Extract area name
        const parts = location.split(",").map(p => p.trim());
        let areaName: string | null = null;

        if (parts.length > 1) {
          const aliasPartIndex = parts.findIndex(
            p => p.toLowerCase().includes(alias)
          );
          if (aliasPartIndex > 0) {
            areaName = parts.slice(0, aliasPartIndex).join(", ");
          } else if (aliasPartIndex === 0 && parts.length > 1) {
            areaName = parts.slice(1).join(", ");
          }
        }

        return {
          countryCode: country.code,
          countryName: country.name,
          areaName,
        };
      }
    }
  }

  // If no country match found, treat the whole location as an area name
  return {
    countryCode: null,
    countryName: null,
    areaName: location,
  };
}
