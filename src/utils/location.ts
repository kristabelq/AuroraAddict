/**
 * Country name to ISO code mapping (including native names)
 */
const countryToCode: { [key: string]: string } = {
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'scotland': 'GB',
  'england': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'new zealand': 'NZ',
  'germany': 'DE',
  'deutschland': 'DE',
  'france': 'FR',
  'italy': 'IT',
  'italia': 'IT',
  'spain': 'ES',
  'españa': 'ES',
  'portugal': 'PT',
  'netherlands': 'NL',
  'nederland': 'NL',
  'belgium': 'BE',
  'belgië': 'BE',
  'belgique': 'BE',
  'switzerland': 'CH',
  'schweiz': 'CH',
  'suisse': 'CH',
  'svizzera': 'CH',
  'austria': 'AT',
  'österreich': 'AT',
  'sweden': 'SE',
  'sverige': 'SE',
  'norway': 'NO',
  'norge': 'NO',
  'denmark': 'DK',
  'danmark': 'DK',
  'finland': 'FI',
  'suomi': 'FI',
  'iceland': 'IS',
  'ísland': 'IS',
  'ireland': 'IE',
  'éire': 'IE',
  'poland': 'PL',
  'polska': 'PL',
  'czech republic': 'CZ',
  'česko': 'CZ',
  'japan': 'JP',
  '日本': 'JP',
  'china': 'CN',
  '中国': 'CN',
  'south korea': 'KR',
  '한국': 'KR',
  'singapore': 'SG',
  'thailand': 'TH',
  'ประเทศไทย': 'TH',
  'india': 'IN',
  'भारत': 'IN',
  'brazil': 'BR',
  'brasil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'mexico': 'MX',
  'méxico': 'MX',
  'south africa': 'ZA',
  'russia': 'RU',
  'россия': 'RU',
  'turkey': 'TR',
  'türkiye': 'TR',
  'greece': 'GR',
  'ελλάδα': 'GR',
  'greenland': 'GL',
  'grønland': 'GL',
  'kalaallit nunaat': 'GL',
  'faroe islands': 'FO',
  'føroyar': 'FO',
  'alaska': 'US',
};

/**
 * Convert ISO country code to flag emoji
 */
function countryCodeToFlag(code: string): string {
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

/**
 * Extract city name and country from OpenStreetMap location string
 * OSM format: "Place, Street, District, City, Municipality, State, Postal, Country"
 *
 * Examples:
 * - "Gamla stan, ..., Stockholm, ..., Sweden" → { city: "Stockholm", country: "Sweden" }
 * - "Sydney Opera House, ..., Sydney, ..., Australia" → { city: "Sydney", country: "Australia" }
 */
export function parseCityFromLocation(location: string): { city: string; country: string } {
  if (!location) return { city: 'Unknown', country: '' };

  const parts = location.split(',').map(p => p.trim());

  // Country is typically the last part
  const country = parts[parts.length - 1] || '';

  let city = '';

  // Strategy 1: Look for a city name that appears in multiple parts
  // Example: "Stockholm" in ["Stockholm", "Stockholm Municipality", "Stockholm County"]
  const validParts = parts.filter(p =>
    p !== country &&
    !/^\d+$/.test(p) &&
    !/^\d/.test(p) &&
    p.length >= 3
  );

  // Check each part to see if it appears as a substring in multiple other parts
  // Build a list of candidates with their occurrence counts
  const candidates: Array<{ part: string; occurrences: number }> = [];

  for (const part of validParts) {
    // Skip parts with administrative keywords
    if (part.includes('Municipality') || part.includes('County') || part.includes('Province')) continue;

    // Count how many parts contain this part as a substring or exact match
    let occurrences = 0;
    for (const otherPart of validParts) {
      if (otherPart.includes(part)) {
        occurrences++;
      }
    }

    // If this part appears in multiple places and is substantial
    if (occurrences > 1 && part.length >= 4) {
      candidates.push({ part, occurrences });
    }
  }

  // Sort candidates: prioritize by occurrences, then by length (longer = more specific city name)
  candidates.sort((a, b) => {
    if (b.occurrences !== a.occurrences) {
      return b.occurrences - a.occurrences;
    }
    return b.part.length - a.part.length;
  });

  if (candidates.length > 0) {
    city = candidates[0].part;
  }

  // Strategy 1b: If no substring match, look for exact duplicates
  if (!city) {
    const partCounts = new Map<string, number>();
    for (const part of validParts) {
      const count = partCounts.get(part) || 0;
      partCounts.set(part, count + 1);
    }

    let maxCount = 0;
    for (const [part, count] of partCounts.entries()) {
      if (count > maxCount && count > 1) {
        maxCount = count;
        city = part;
      }
    }
  }

  // Strategy 2: If no repeated parts, look for municipality/city keywords
  // or find a substantial part in the middle of the address
  if (!city && parts.length > 3) {
    // Look in the middle portions (skip first 2-3 which are usually specific places/streets)
    const middleStart = Math.min(3, Math.floor(parts.length / 3));
    const middleEnd = Math.max(parts.length - 3, middleStart + 1);

    for (let i = middleStart; i < middleEnd; i++) {
      const part = parts[i];
      if (part === country) continue;
      if (/^\d/.test(part)) continue;
      if (/^\d+$/.test(part)) continue;

      // Check if it looks like a city name (substantial word, not too generic)
      if (part.length >= 4 && !part.includes('Municipality') && !part.includes('County')) {
        city = part;
        break;
      }
    }
  }

  // Strategy 3: Fallback - use first substantial non-address part
  if (!city) {
    for (const part of parts) {
      if (part === country) continue;
      if (/^\d/.test(part)) continue;
      if (/^\d+$/.test(part)) continue;
      if (part.length >= 4) {
        city = part;
        break;
      }
    }
  }

  // Final fallback
  if (!city) {
    city = parts.find(p => !/^\d+$/.test(p) && p !== country) || parts[0];
  }

  return { city, country };
}

/**
 * Get flag emoji for a country name
 * Detects country from full location string, supporting native language names
 */
export function getCountryFlag(country: string): string {
  if (!country) return '';

  const locationLower = country.toLowerCase().trim();
  const parts = locationLower.split(',').map(p => p.trim());

  // Check from last part to first (country is usually at the end)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    for (const [countryName, code] of Object.entries(countryToCode)) {
      if (part === countryName || part.includes(countryName)) {
        return countryCodeToFlag(code);
      }
    }
  }

  // If no match found, return empty string (no flag)
  return '';
}

/**
 * Format location as "Flag City"
 * Example: "🇸🇪 Stockholm", "🇦🇺 Sydney"
 * For coordinate-only locations, shows coordinates without flag
 */
export function formatLocationWithFlag(location: string): string {
  // Check if string matches coordinate pattern
  const coordPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
  if (coordPattern.test(location.trim())) {
    // Pure coordinates without country info
    const firstCoord = location.split(',')[0].trim();
    return firstCoord;
  }

  const { city, country } = parseCityFromLocation(location);
  const flag = getCountryFlag(location);

  // If flag was found, show it; otherwise just show the city
  if (flag) {
    return `${flag} ${city}`;
  }
  return city;
}

/**
 * Check if a location string looks like GPS coordinates (e.g., "67.8502, 20.2258")
 */
function isCoordinateFormat(location: string): boolean {
  // Check if string matches pattern: number, number (with optional spaces and decimals)
  const coordPattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
  return coordPattern.test(location.trim());
}

/**
 * Format location for sighting cards as "Sighted in City Flag"
 * Example: "Sighted in Stockholm 🇸🇪"
 * For coordinate-only locations, shows coordinates without flag
 */
export function formatSightingLocation(location: string): string {
  // If location looks like pure coordinates, show without flag
  if (isCoordinateFormat(location)) {
    const firstCoord = location.split(',')[0].trim();
    return `Sighted in ${firstCoord}`;
  }

  const { city, country } = parseCityFromLocation(location);
  const flag = getCountryFlag(location);

  // Show flag after the city name
  if (flag) {
    return `Sighted in ${city} ${flag}`;
  }
  return `Sighted in ${city}`;
}

/**
 * Format location as "Flag Country" (without city)
 * Used when location is hidden for paid events
 * Example: "🇳🇴 Norway"
 */
export function formatCountryOnly(location: string): string {
  const { country } = parseCityFromLocation(location);
  const flag = getCountryFlag(location);

  // If flag was found, show it; otherwise just show the country
  if (flag && country) {
    return `${flag} ${country}`;
  }
  return country || 'Unknown';
}
