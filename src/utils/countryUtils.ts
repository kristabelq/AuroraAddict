/**
 * Country utilities for extracting and formatting country information
 */

export interface CountryData {
  code: string; // ISO 3166-1 alpha-2 code
  name: string;
  flag: string; // Emoji flag
}

/**
 * Map of country names to ISO codes
 * Includes both English and native names
 */
const countryMap: { [key: string]: { code: string; name: string } } = {
  // North America
  'united states': { code: 'US', name: 'United States' },
  'usa': { code: 'US', name: 'United States' },
  'canada': { code: 'CA', name: 'Canada' },
  'alaska': { code: 'US', name: 'Alaska' },

  // Nordic Countries
  'norway': { code: 'NO', name: 'Norway' },
  'norge': { code: 'NO', name: 'Norway' },
  'sweden': { code: 'SE', name: 'Sweden' },
  'sverige': { code: 'SE', name: 'Sweden' },
  'finland': { code: 'FI', name: 'Finland' },
  'suomi': { code: 'FI', name: 'Finland' },
  'iceland': { code: 'IS', name: 'Iceland' },
  'ísland': { code: 'IS', name: 'Iceland' },
  'denmark': { code: 'DK', name: 'Denmark' },
  'danmark': { code: 'DK', name: 'Denmark' },

  // Other European
  'united kingdom': { code: 'GB', name: 'United Kingdom' },
  'scotland': { code: 'GB', name: 'Scotland' },
  'russia': { code: 'RU', name: 'Russia' },
  'россия': { code: 'RU', name: 'Russia' },

  // Territories
  'greenland': { code: 'GL', name: 'Greenland' },
  'grønland': { code: 'GL', name: 'Greenland' },
  'kalaallit nunaat': { code: 'GL', name: 'Greenland' },
  'faroe islands': { code: 'FO', name: 'Faroe Islands' },
  'føroyar': { code: 'FO', name: 'Faroe Islands' },

  // Pacific
  'new zealand': { code: 'NZ', name: 'New Zealand' },
  'australia': { code: 'AU', name: 'Australia' },

  // Asia
  'japan': { code: 'JP', name: 'Japan' },
  'china': { code: 'CN', name: 'China' },
};

/**
 * Extract country code from a location string
 */
export function getCountryCode(location: string): string | null {
  if (!location) return null;

  const locationLower = location.toLowerCase().trim();

  // Split by comma and check the last part first (usually contains the country)
  const parts = locationLower.split(',').map(p => p.trim());

  // Check from last part to first
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    for (const [countryKey, countryInfo] of Object.entries(countryMap)) {
      if (part === countryKey || part.includes(countryKey)) {
        return countryInfo.code;
      }
    }
  }

  return null;
}

/**
 * Get country name from code
 */
export function getCountryName(code: string): string {
  const entry = Object.values(countryMap).find(c => c.code === code);
  return entry?.name || code;
}

/**
 * Convert country code to flag emoji
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';

  return String.fromCodePoint(
    ...([...countryCode.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)))
  );
}

/**
 * Get country data from location string
 */
export function getCountryDataFromLocation(location: string): CountryData | null {
  const code = getCountryCode(location);
  if (!code) return null;

  return {
    code,
    name: getCountryName(code),
    flag: getCountryFlag(code),
  };
}
