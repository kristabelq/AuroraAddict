/**
 * Aurora Visibility by Location
 *
 * This file contains a comprehensive list of locations worldwide with their
 * latitude and the minimum Kp index required to see aurora at each location.
 *
 * Kp Index to Latitude Mapping:
 * - Kp 0-2: 65°+ (Arctic Circle regions only)
 * - Kp 3: 60°+ (Northern Scandinavia, Alaska, Northern Canada)
 * - Kp 4: 55°+ (Southern Scandinavia, Scotland, Southern Alaska)
 * - Kp 5: 50°+ (Northern England, Southern Canada, Northern Germany)
 * - Kp 6: 45°+ (Northern USA, Northern France, Northern Italy)
 * - Kp 7: 40°+ (Southern USA, Spain, Greece, Northern Japan)
 * - Kp 8: 35°+ (Mediterranean, Southern Japan, Southern USA)
 * - Kp 9: 30°+ (North Africa, Middle East, Northern Mexico)
 */

export interface AuroraLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  minKpRequired: number;
  region: string;
  notes?: string;
}

export const auroraLocations: AuroraLocation[] = [
  // KP 0-2: Arctic Circle and above (65°+)
  {
    city: "Svalbard",
    country: "Norway",
    latitude: 78.2,
    longitude: 15.6,
    minKpRequired: 1,
    region: "Arctic",
    notes: "Polar night October-February, aurora visible 24/7"
  },
  {
    city: "Longyearbyen",
    country: "Norway",
    latitude: 78.2,
    longitude: 15.6,
    minKpRequired: 1,
    region: "Arctic",
    notes: "World's northernmost settlement"
  },
  {
    city: "Barrow (Utqiaġvik)",
    country: "USA",
    latitude: 71.3,
    longitude: -156.8,
    minKpRequired: 1,
    region: "Alaska",
    notes: "Northernmost city in USA"
  },
  {
    city: "Tromsø",
    country: "Norway",
    latitude: 69.6,
    longitude: 18.9,
    minKpRequired: 1,
    region: "Northern Norway",
    notes: "Aurora capital of Norway"
  },
  {
    city: "Alta",
    country: "Norway",
    latitude: 69.9,
    longitude: 23.3,
    minKpRequired: 1,
    region: "Northern Norway"
  },
  {
    city: "Murmansk",
    country: "Russia",
    latitude: 68.9,
    longitude: 33.1,
    minKpRequired: 1,
    region: "Arctic Russia"
  },
  {
    city: "Kiruna",
    country: "Sweden",
    latitude: 67.8,
    longitude: 20.2,
    minKpRequired: 1,
    region: "Swedish Lapland"
  },
  {
    city: "Abisko",
    country: "Sweden",
    latitude: 68.3,
    longitude: 18.8,
    minKpRequired: 1,
    region: "Swedish Lapland",
    notes: "Famous for clear skies"
  },
  {
    city: "Inuvik",
    country: "Canada",
    latitude: 68.3,
    longitude: -133.7,
    minKpRequired: 1,
    region: "Northwest Territories"
  },
  {
    city: "Akureyri",
    country: "Iceland",
    latitude: 65.7,
    longitude: -18.1,
    minKpRequired: 1,
    region: "Northern Iceland"
  },
  {
    city: "Fairbanks",
    country: "USA",
    latitude: 64.8,
    longitude: -147.7,
    minKpRequired: 1,
    region: "Alaska",
    notes: "One of the best aurora cities globally"
  },

  // KP 3: Subarctic regions (60-65°)
  {
    city: "Reykjavik",
    country: "Iceland",
    latitude: 64.1,
    longitude: -21.9,
    minKpRequired: 3,
    region: "Iceland",
    notes: "Most accessible aurora destination"
  },
  {
    city: "Anchorage",
    country: "USA",
    latitude: 61.2,
    longitude: -149.9,
    minKpRequired: 3,
    region: "Alaska"
  },
  {
    city: "Whitehorse",
    country: "Canada",
    latitude: 60.7,
    longitude: -135.1,
    minKpRequired: 3,
    region: "Yukon"
  },
  {
    city: "Yellowknife",
    country: "Canada",
    latitude: 62.4,
    longitude: -114.4,
    minKpRequired: 3,
    region: "Northwest Territories",
    notes: "One of the best aurora locations in Canada"
  },
  {
    city: "Rovaniemi",
    country: "Finland",
    latitude: 66.5,
    longitude: 25.7,
    minKpRequired: 3,
    region: "Finnish Lapland",
    notes: "Home of Santa Claus Village"
  },
  {
    city: "Saariselkä",
    country: "Finland",
    latitude: 68.4,
    longitude: 27.4,
    minKpRequired: 3,
    region: "Finnish Lapland"
  },
  {
    city: "Ivalo",
    country: "Finland",
    latitude: 68.6,
    longitude: 27.5,
    minKpRequired: 3,
    region: "Finnish Lapland"
  },
  {
    city: "Luleå",
    country: "Sweden",
    latitude: 65.6,
    longitude: 22.1,
    minKpRequired: 3,
    region: "Swedish Lapland"
  },
  {
    city: "Bodø",
    country: "Norway",
    latitude: 67.3,
    longitude: 14.4,
    minKpRequired: 3,
    region: "Northern Norway"
  },
  {
    city: "Narvik",
    country: "Norway",
    latitude: 68.4,
    longitude: 17.4,
    minKpRequired: 3,
    region: "Northern Norway"
  },

  // KP 4: Northern regions (55-60°)
  {
    city: "Helsinki",
    country: "Finland",
    latitude: 60.2,
    longitude: 24.9,
    minKpRequired: 4,
    region: "Southern Finland"
  },
  {
    city: "Stockholm",
    country: "Sweden",
    latitude: 59.3,
    longitude: 18.1,
    minKpRequired: 4,
    region: "Southern Sweden"
  },
  {
    city: "Oslo",
    country: "Norway",
    latitude: 59.9,
    longitude: 10.8,
    minKpRequired: 4,
    region: "Southern Norway"
  },
  {
    city: "Bergen",
    country: "Norway",
    latitude: 60.4,
    longitude: 5.3,
    minKpRequired: 4,
    region: "Western Norway"
  },
  {
    city: "Trondheim",
    country: "Norway",
    latitude: 63.4,
    longitude: 10.4,
    minKpRequired: 4,
    region: "Central Norway"
  },
  {
    city: "St. Petersburg",
    country: "Russia",
    latitude: 59.9,
    longitude: 30.3,
    minKpRequired: 4,
    region: "Northwestern Russia"
  },
  {
    city: "Tallinn",
    country: "Estonia",
    latitude: 59.4,
    longitude: 24.7,
    minKpRequired: 4,
    region: "Estonia"
  },
  {
    city: "Riga",
    country: "Latvia",
    latitude: 56.9,
    longitude: 24.1,
    minKpRequired: 4,
    region: "Latvia"
  },
  {
    city: "Edinburgh",
    country: "UK",
    latitude: 55.9,
    longitude: -3.2,
    minKpRequired: 4,
    region: "Scotland"
  },
  {
    city: "Glasgow",
    country: "UK",
    latitude: 55.8,
    longitude: -4.3,
    minKpRequired: 4,
    region: "Scotland"
  },
  {
    city: "Aberdeen",
    country: "UK",
    latitude: 57.1,
    longitude: -2.1,
    minKpRequired: 4,
    region: "Scotland"
  },
  {
    city: "Inverness",
    country: "UK",
    latitude: 57.5,
    longitude: -4.2,
    minKpRequired: 4,
    region: "Scotland"
  },
  {
    city: "Juneau",
    country: "USA",
    latitude: 58.3,
    longitude: -134.4,
    minKpRequired: 4,
    region: "Alaska"
  },

  // KP 5: Mid-northern regions (50-55°)
  {
    city: "Moscow",
    country: "Russia",
    latitude: 55.7,
    longitude: 37.6,
    minKpRequired: 5,
    region: "Central Russia"
  },
  {
    city: "Copenhagen",
    country: "Denmark",
    latitude: 55.6,
    longitude: 12.6,
    minKpRequired: 5,
    region: "Denmark"
  },
  {
    city: "Vilnius",
    country: "Lithuania",
    latitude: 54.6,
    longitude: 25.3,
    minKpRequired: 5,
    region: "Lithuania"
  },
  {
    city: "Minsk",
    country: "Belarus",
    latitude: 53.9,
    longitude: 27.6,
    minKpRequired: 5,
    region: "Belarus"
  },
  {
    city: "Dublin",
    country: "Ireland",
    latitude: 53.3,
    longitude: -6.3,
    minKpRequired: 5,
    region: "Ireland"
  },
  {
    city: "Belfast",
    country: "UK",
    latitude: 54.6,
    longitude: -5.9,
    minKpRequired: 5,
    region: "Northern Ireland"
  },
  {
    city: "Manchester",
    country: "UK",
    latitude: 53.4,
    longitude: -2.2,
    minKpRequired: 5,
    region: "Northern England"
  },
  {
    city: "Liverpool",
    country: "UK",
    latitude: 53.4,
    longitude: -3.0,
    minKpRequired: 5,
    region: "Northern England"
  },
  {
    city: "Hamburg",
    country: "Germany",
    latitude: 53.5,
    longitude: 10.0,
    minKpRequired: 5,
    region: "Northern Germany"
  },
  {
    city: "Berlin",
    country: "Germany",
    latitude: 52.5,
    longitude: 13.4,
    minKpRequired: 5,
    region: "Germany"
  },
  {
    city: "Amsterdam",
    country: "Netherlands",
    latitude: 52.3,
    longitude: 4.9,
    minKpRequired: 5,
    region: "Netherlands"
  },
  {
    city: "Calgary",
    country: "Canada",
    latitude: 51.0,
    longitude: -114.1,
    minKpRequired: 5,
    region: "Alberta"
  },
  {
    city: "Edmonton",
    country: "Canada",
    latitude: 53.5,
    longitude: -113.5,
    minKpRequired: 5,
    region: "Alberta"
  },
  {
    city: "Saskatoon",
    country: "Canada",
    latitude: 52.1,
    longitude: -106.6,
    minKpRequired: 5,
    region: "Saskatchewan"
  },
  {
    city: "Winnipeg",
    country: "Canada",
    latitude: 49.8,
    longitude: -97.1,
    minKpRequired: 5,
    region: "Manitoba"
  },

  // KP 6: Northern temperate regions (45-50°)
  {
    city: "London",
    country: "UK",
    latitude: 51.5,
    longitude: -0.1,
    minKpRequired: 6,
    region: "Southern England"
  },
  {
    city: "Brussels",
    country: "Belgium",
    latitude: 50.8,
    longitude: 4.4,
    minKpRequired: 6,
    region: "Belgium"
  },
  {
    city: "Prague",
    country: "Czech Republic",
    latitude: 50.0,
    longitude: 14.4,
    minKpRequired: 6,
    region: "Czech Republic"
  },
  {
    city: "Krakow",
    country: "Poland",
    latitude: 50.0,
    longitude: 19.9,
    minKpRequired: 6,
    region: "Poland"
  },
  {
    city: "Warsaw",
    country: "Poland",
    latitude: 52.2,
    longitude: 21.0,
    minKpRequired: 6,
    region: "Poland"
  },
  {
    city: "Kyiv",
    country: "Ukraine",
    latitude: 50.4,
    longitude: 30.5,
    minKpRequired: 6,
    region: "Ukraine"
  },
  {
    city: "Paris",
    country: "France",
    latitude: 48.8,
    longitude: 2.3,
    minKpRequired: 6,
    region: "Northern France"
  },
  {
    city: "Munich",
    country: "Germany",
    latitude: 48.1,
    longitude: 11.6,
    minKpRequired: 6,
    region: "Southern Germany"
  },
  {
    city: "Vienna",
    country: "Austria",
    latitude: 48.2,
    longitude: 16.4,
    minKpRequired: 6,
    region: "Austria"
  },
  {
    city: "Zurich",
    country: "Switzerland",
    latitude: 47.3,
    longitude: 8.5,
    minKpRequired: 6,
    region: "Switzerland"
  },
  {
    city: "Seattle",
    country: "USA",
    latitude: 47.6,
    longitude: -122.3,
    minKpRequired: 6,
    region: "Washington"
  },
  {
    city: "Vancouver",
    country: "Canada",
    latitude: 49.2,
    longitude: -123.1,
    minKpRequired: 6,
    region: "British Columbia"
  },
  {
    city: "Montreal",
    country: "Canada",
    latitude: 45.5,
    longitude: -73.6,
    minKpRequired: 6,
    region: "Quebec"
  },
  {
    city: "Toronto",
    country: "Canada",
    latitude: 43.6,
    longitude: -79.4,
    minKpRequired: 6,
    region: "Ontario"
  },
  {
    city: "Quebec City",
    country: "Canada",
    latitude: 46.8,
    longitude: -71.2,
    minKpRequired: 6,
    region: "Quebec"
  },
  {
    city: "Minneapolis",
    country: "USA",
    latitude: 44.9,
    longitude: -93.3,
    minKpRequired: 6,
    region: "Minnesota"
  },
  {
    city: "Portland",
    country: "USA",
    latitude: 45.5,
    longitude: -122.7,
    minKpRequired: 6,
    region: "Oregon"
  },

  // KP 7: Mid-temperate regions (40-45°)
  {
    city: "Milan",
    country: "Italy",
    latitude: 45.4,
    longitude: 9.2,
    minKpRequired: 7,
    region: "Northern Italy"
  },
  {
    city: "Venice",
    country: "Italy",
    latitude: 45.4,
    longitude: 12.3,
    minKpRequired: 7,
    region: "Northern Italy"
  },
  {
    city: "Lyon",
    country: "France",
    latitude: 45.7,
    longitude: 4.8,
    minKpRequired: 7,
    region: "Central France"
  },
  {
    city: "Bordeaux",
    country: "France",
    latitude: 44.8,
    longitude: -0.6,
    minKpRequired: 7,
    region: "Southwest France"
  },
  {
    city: "Bucharest",
    country: "Romania",
    latitude: 44.4,
    longitude: 26.1,
    minKpRequired: 7,
    region: "Romania"
  },
  {
    city: "Belgrade",
    country: "Serbia",
    latitude: 44.7,
    longitude: 20.5,
    minKpRequired: 7,
    region: "Serbia"
  },
  {
    city: "Sofia",
    country: "Bulgaria",
    latitude: 42.6,
    longitude: 23.3,
    minKpRequired: 7,
    region: "Bulgaria"
  },
  {
    city: "Tbilisi",
    country: "Georgia",
    latitude: 41.7,
    longitude: 44.8,
    minKpRequired: 7,
    region: "Georgia"
  },
  {
    city: "Sapporo",
    country: "Japan",
    latitude: 43.0,
    longitude: 141.3,
    minKpRequired: 7,
    region: "Hokkaido"
  },
  {
    city: "New York",
    country: "USA",
    latitude: 40.7,
    longitude: -74.0,
    minKpRequired: 7,
    region: "New York"
  },
  {
    city: "Boston",
    country: "USA",
    latitude: 42.3,
    longitude: -71.1,
    minKpRequired: 7,
    region: "Massachusetts"
  },
  {
    city: "Chicago",
    country: "USA",
    latitude: 41.8,
    longitude: -87.6,
    minKpRequired: 7,
    region: "Illinois"
  },
  {
    city: "Denver",
    country: "USA",
    latitude: 39.7,
    longitude: -104.9,
    minKpRequired: 7,
    region: "Colorado"
  },
  {
    city: "Salt Lake City",
    country: "USA",
    latitude: 40.7,
    longitude: -111.9,
    minKpRequired: 7,
    region: "Utah"
  },
  {
    city: "Boise",
    country: "USA",
    latitude: 43.6,
    longitude: -116.2,
    minKpRequired: 7,
    region: "Idaho"
  },

  // KP 8: Southern temperate regions (35-40°)
  {
    city: "Rome",
    country: "Italy",
    latitude: 41.9,
    longitude: 12.5,
    minKpRequired: 8,
    region: "Central Italy"
  },
  {
    city: "Madrid",
    country: "Spain",
    latitude: 40.4,
    longitude: -3.7,
    minKpRequired: 8,
    region: "Central Spain"
  },
  {
    city: "Barcelona",
    country: "Spain",
    latitude: 41.3,
    longitude: 2.2,
    minKpRequired: 8,
    region: "Northeast Spain"
  },
  {
    city: "Lisbon",
    country: "Portugal",
    latitude: 38.7,
    longitude: -9.1,
    minKpRequired: 8,
    region: "Portugal"
  },
  {
    city: "Athens",
    country: "Greece",
    latitude: 37.9,
    longitude: 23.7,
    minKpRequired: 8,
    region: "Greece"
  },
  {
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0,
    longitude: 28.9,
    minKpRequired: 8,
    region: "Turkey"
  },
  {
    city: "Ankara",
    country: "Turkey",
    latitude: 39.9,
    longitude: 32.9,
    minKpRequired: 8,
    region: "Turkey"
  },
  {
    city: "Tehran",
    country: "Iran",
    latitude: 35.6,
    longitude: 51.4,
    minKpRequired: 8,
    region: "Iran"
  },
  {
    city: "Seoul",
    country: "South Korea",
    latitude: 37.5,
    longitude: 127.0,
    minKpRequired: 8,
    region: "South Korea"
  },
  {
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6,
    longitude: 139.7,
    minKpRequired: 8,
    region: "Japan"
  },
  {
    city: "Osaka",
    country: "Japan",
    latitude: 34.6,
    longitude: 135.5,
    minKpRequired: 8,
    region: "Japan"
  },
  {
    city: "Beijing",
    country: "China",
    latitude: 39.9,
    longitude: 116.4,
    minKpRequired: 8,
    region: "China"
  },
  {
    city: "San Francisco",
    country: "USA",
    latitude: 37.7,
    longitude: -122.4,
    minKpRequired: 8,
    region: "California"
  },
  {
    city: "Las Vegas",
    country: "USA",
    latitude: 36.1,
    longitude: -115.1,
    minKpRequired: 8,
    region: "Nevada"
  },
  {
    city: "Los Angeles",
    country: "USA",
    latitude: 34.0,
    longitude: -118.2,
    minKpRequired: 8,
    region: "California"
  },
  {
    city: "Phoenix",
    country: "USA",
    latitude: 33.4,
    longitude: -112.1,
    minKpRequired: 8,
    region: "Arizona"
  },
  {
    city: "Dallas",
    country: "USA",
    latitude: 32.7,
    longitude: -96.8,
    minKpRequired: 8,
    region: "Texas"
  },
  {
    city: "Atlanta",
    country: "USA",
    latitude: 33.7,
    longitude: -84.4,
    minKpRequired: 8,
    region: "Georgia"
  },
  {
    city: "Memphis",
    country: "USA",
    latitude: 35.1,
    longitude: -90.0,
    minKpRequired: 8,
    region: "Tennessee"
  },

  // KP 9: Subtropical regions (30-35°) - Extremely rare aurora events
  {
    city: "Casablanca",
    country: "Morocco",
    latitude: 33.5,
    longitude: -7.6,
    minKpRequired: 9,
    region: "Morocco",
    notes: "Extremely rare, only during major solar storms"
  },
  {
    city: "Jerusalem",
    country: "Israel",
    latitude: 31.7,
    longitude: 35.2,
    minKpRequired: 9,
    region: "Israel",
    notes: "Extremely rare"
  },
  {
    city: "Cairo",
    country: "Egypt",
    latitude: 30.0,
    longitude: 31.2,
    minKpRequired: 9,
    region: "Egypt",
    notes: "Extremely rare"
  },
  {
    city: "Shanghai",
    country: "China",
    latitude: 31.2,
    longitude: 121.5,
    minKpRequired: 9,
    region: "China",
    notes: "Extremely rare"
  },
  {
    city: "New Delhi",
    country: "India",
    latitude: 28.6,
    longitude: 77.2,
    minKpRequired: 9,
    region: "India",
    notes: "Extremely rare"
  },
  {
    city: "Houston",
    country: "USA",
    latitude: 29.7,
    longitude: -95.4,
    minKpRequired: 9,
    region: "Texas",
    notes: "Extremely rare"
  },
  {
    city: "New Orleans",
    country: "USA",
    latitude: 29.9,
    longitude: -90.1,
    minKpRequired: 9,
    region: "Louisiana",
    notes: "Extremely rare"
  },
  {
    city: "San Antonio",
    country: "USA",
    latitude: 29.4,
    longitude: -98.5,
    minKpRequired: 9,
    region: "Texas",
    notes: "Extremely rare"
  },
  {
    city: "Miami",
    country: "USA",
    latitude: 25.7,
    longitude: -80.2,
    minKpRequired: 9,
    region: "Florida",
    notes: "Extremely rare, only during extreme solar storms"
  },
];

/**
 * Calculate great-circle distance between two points using Haversine formula
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Get the minimum Kp index required to see aurora at a given latitude
 */
export function getMinKpForLatitude(latitude: number): number {
  const absLat = Math.abs(latitude);

  if (absLat >= 65) return 1;
  if (absLat >= 60) return 3;
  if (absLat >= 55) return 4;
  if (absLat >= 50) return 5;
  if (absLat >= 45) return 6;
  if (absLat >= 40) return 7;
  if (absLat >= 35) return 8;
  if (absLat >= 30) return 9;

  return null; // Aurora essentially impossible below 30°
}

/**
 * Check if aurora is visible at a given latitude with current Kp
 */
export function canSeeAuroraAtLatitude(latitude: number, currentKp: number): boolean {
  const minKpRequired = getMinKpForLatitude(latitude);
  if (minKpRequired === null) return false;
  return currentKp >= minKpRequired;
}

/**
 * Get all locations where aurora is visible at current Kp
 */
export function getVisibleLocations(currentKp: number): AuroraLocation[] {
  return auroraLocations.filter(loc => loc.minKpRequired <= currentKp);
}

/**
 * Get locations by Kp index
 */
export function getLocationsByKp(kpIndex: number): AuroraLocation[] {
  return auroraLocations.filter(loc => loc.minKpRequired === kpIndex);
}

/**
 * Get locations by country
 */
export function getLocationsByCountry(country: string): AuroraLocation[] {
  return auroraLocations.filter(loc =>
    loc.country.toLowerCase() === country.toLowerCase()
  );
}

/**
 * Get locations by region
 */
export function getLocationsByRegion(region: string): AuroraLocation[] {
  return auroraLocations.filter(loc =>
    loc.region.toLowerCase().includes(region.toLowerCase())
  );
}

/**
 * Find the nearest major city to a given latitude (within 2 degrees)
 */
export function getNearestCity(latitude: number): AuroraLocation | null {
  const absLat = Math.abs(latitude);
  let nearest: AuroraLocation | null = null;
  let minDiff = Infinity;

  for (const location of auroraLocations) {
    const diff = Math.abs(Math.abs(location.latitude) - absLat);
    if (diff < minDiff && diff < 2) {
      minDiff = diff;
      nearest = location;
    }
  }

  return nearest;
}

/**
 * Get recommended destinations for aurora hunting at current Kp
 */
export function getRecommendedDestinations(currentKp: number, limit: number = 10): AuroraLocation[] {
  // Prioritize locations where Kp is well above minimum requirement
  return auroraLocations
    .filter(loc => loc.minKpRequired <= Math.max(0, currentKp - 1))
    .sort((a, b) => {
      // Sort by: 1) Lower Kp requirement (better visibility), 2) Popular destinations
      if (a.minKpRequired !== b.minKpRequired) {
        return a.minKpRequired - b.minKpRequired;
      }
      // Prioritize locations with notes (usually popular/famous spots)
      if (a.notes && !b.notes) return -1;
      if (!a.notes && b.notes) return 1;
      return 0;
    })
    .slice(0, limit);
}

/**
 * Get all unique countries with aurora visibility
 */
export function getAuroraCountries(): string[] {
  return Array.from(new Set(auroraLocations.map(loc => loc.country))).sort();
}

/**
 * Get Kp index ranges with descriptions
 */
export const kpRanges = [
  {
    kp: 0,
    description: "Quiet - Aurora only in Arctic Circle (65°+)",
    minLatitude: 65,
    visibility: "Very limited, only extreme northern locations"
  },
  {
    kp: 3,
    description: "Unsettled - Aurora in Lapland, Alaska, Northern Canada (60°+)",
    minLatitude: 60,
    visibility: "Good in classic aurora destinations"
  },
  {
    kp: 4,
    description: "Active - Aurora in Scotland, Scandinavia (55°+)",
    minLatitude: 55,
    visibility: "Visible across Northern Europe and Alaska"
  },
  {
    kp: 5,
    description: "Minor Storm - Aurora in Northern UK, Germany, Canada (50°+)",
    minLatitude: 50,
    visibility: "Visible in northern USA, UK, Central Europe"
  },
  {
    kp: 6,
    description: "Moderate Storm - Aurora in London, Paris, Seattle (45°+)",
    minLatitude: 45,
    visibility: "Widespread visibility across northern regions"
  },
  {
    kp: 7,
    description: "Strong Storm - Aurora in Northern USA, Italy, Spain (40°+)",
    minLatitude: 40,
    visibility: "Visible in Mediterranean, Japan, northern USA"
  },
  {
    kp: 8,
    description: "Severe Storm - Aurora in Southern USA, Greece, Tokyo (35°+)",
    minLatitude: 35,
    visibility: "Rare event, visible in southern regions"
  },
  {
    kp: 9,
    description: "Extreme Storm - Aurora visible down to 30° latitude",
    minLatitude: 30,
    visibility: "Very rare, once in decades event"
  }
];
