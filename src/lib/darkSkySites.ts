/**
 * Dark Sky Sites Database
 *
 * A collection of known dark sky locations ideal for aurora viewing.
 * Bortle Scale: 1 (darkest) to 9 (brightest urban)
 */

export interface DarkSkySite {
  name: string;
  latitude: number;
  longitude: number;
  bortleClass: number; // 1-9 scale
  country: string;
  countryCode: string;
  region: string;
  notes?: string;
  hasAmenities?: boolean; // parking, facilities, etc.
}

export const DARK_SKY_SITES: DarkSkySite[] = [
  // NEW ZEALAND
  {
    name: "Aoraki Mackenzie Dark Sky Reserve",
    latitude: -44.0048,
    longitude: 170.4653,
    bortleClass: 1,
    country: "New Zealand",
    countryCode: "NZ",
    region: "Canterbury",
    notes: "World's largest dark sky reserve",
    hasAmenities: true,
  },
  {
    name: "Lake Tekapo",
    latitude: -44.0047,
    longitude: 170.4772,
    bortleClass: 1,
    country: "New Zealand",
    countryCode: "NZ",
    region: "Canterbury",
    notes: "Church of the Good Shepherd - iconic aurora spot",
    hasAmenities: true,
  },
  {
    name: "Mt John Observatory",
    latitude: -43.9856,
    longitude: 170.4650,
    bortleClass: 1,
    country: "New Zealand",
    countryCode: "NZ",
    region: "Canterbury",
    notes: "University observatory, excellent viewing",
    hasAmenities: true,
  },
  {
    name: "Stewart Island",
    latitude: -46.8967,
    longitude: 168.1264,
    bortleClass: 1,
    country: "New Zealand",
    countryCode: "NZ",
    region: "Southland",
    notes: "Southernmost inhabited island, excellent dark skies",
    hasAmenities: false,
  },
  {
    name: "Queenstown Remarkables Lookout",
    latitude: -45.0522,
    longitude: 168.7258,
    bortleClass: 3,
    country: "New Zealand",
    countryCode: "NZ",
    region: "Otago",
    notes: "Easy access from Queenstown, some light pollution",
    hasAmenities: true,
  },

  // AUSTRALIA
  {
    name: "Warrumbungle National Park",
    latitude: -31.2750,
    longitude: 149.0667,
    bortleClass: 1,
    country: "Australia",
    countryCode: "AU",
    region: "NSW",
    notes: "Australia's first Dark Sky Park",
    hasAmenities: true,
  },
  {
    name: "Uluru",
    latitude: -25.3444,
    longitude: 131.0369,
    bortleClass: 1,
    country: "Australia",
    countryCode: "AU",
    region: "NT",
    notes: "Remote outback, pristine skies",
    hasAmenities: true,
  },
  {
    name: "Cradle Mountain",
    latitude: -41.6386,
    longitude: 145.9427,
    bortleClass: 2,
    country: "Australia",
    countryCode: "AU",
    region: "Tasmania",
    notes: "Best southern lights viewing in Tasmania",
    hasAmenities: true,
  },
  {
    name: "Bruny Island",
    latitude: -43.2833,
    longitude: 147.3167,
    bortleClass: 2,
    country: "Australia",
    countryCode: "AU",
    region: "Tasmania",
    notes: "South-facing beaches for aurora australis",
    hasAmenities: false,
  },

  // NORWAY
  {
    name: "Lofoten Islands",
    latitude: 68.2167,
    longitude: 14.4167,
    bortleClass: 2,
    country: "Norway",
    countryCode: "NO",
    region: "Nordland",
    notes: "Stunning aurora backdrop with mountains and fjords",
    hasAmenities: true,
  },
  {
    name: "Tromsø",
    latitude: 69.6492,
    longitude: 18.9553,
    bortleClass: 4,
    country: "Norway",
    countryCode: "NO",
    region: "Troms",
    notes: "Aurora Capital of Norway - drive out for darker skies",
    hasAmenities: true,
  },
  {
    name: "Senja Island",
    latitude: 69.3000,
    longitude: 17.5000,
    bortleClass: 2,
    country: "Norway",
    countryCode: "NO",
    region: "Troms",
    notes: "Less crowded than Tromsø",
    hasAmenities: true,
  },
  {
    name: "Nordkapp",
    latitude: 71.1685,
    longitude: 25.7844,
    bortleClass: 1,
    country: "Norway",
    countryCode: "NO",
    region: "Finnmark",
    notes: "Northernmost point in Europe",
    hasAmenities: true,
  },

  // ICELAND
  {
    name: "Thingvellir National Park",
    latitude: 64.2559,
    longitude: -21.1300,
    bortleClass: 2,
    country: "Iceland",
    countryCode: "IS",
    region: "Southwest",
    notes: "UNESCO World Heritage Site",
    hasAmenities: true,
  },
  {
    name: "Jökulsárlón Glacier Lagoon",
    latitude: 64.0784,
    longitude: -16.2306,
    bortleClass: 1,
    country: "Iceland",
    countryCode: "IS",
    region: "Southeast",
    notes: "Aurora reflections on ice lagoon",
    hasAmenities: true,
  },
  {
    name: "Vik",
    latitude: 63.4186,
    longitude: -19.0060,
    bortleClass: 2,
    country: "Iceland",
    countryCode: "IS",
    region: "South",
    notes: "Black sand beaches",
    hasAmenities: true,
  },

  // CANADA
  {
    name: "Yellowknife",
    latitude: 62.4540,
    longitude: -114.3718,
    bortleClass: 4,
    country: "Canada",
    countryCode: "CA",
    region: "NWT",
    notes: "One of the best aurora viewing locations on Earth",
    hasAmenities: true,
  },
  {
    name: "Whitehorse",
    latitude: 60.7212,
    longitude: -135.0568,
    bortleClass: 4,
    country: "Canada",
    countryCode: "CA",
    region: "Yukon",
    notes: "Great accessibility with excellent aurora frequency",
    hasAmenities: true,
  },
  {
    name: "Churchill",
    latitude: 58.7684,
    longitude: -94.1650,
    bortleClass: 2,
    country: "Canada",
    countryCode: "CA",
    region: "Manitoba",
    notes: "Polar bear capital + aurora",
    hasAmenities: true,
  },
  {
    name: "Jasper Dark Sky Preserve",
    latitude: 52.8737,
    longitude: -118.0814,
    bortleClass: 2,
    country: "Canada",
    countryCode: "CA",
    region: "Alberta",
    notes: "World's largest dark sky preserve",
    hasAmenities: true,
  },

  // ALASKA
  {
    name: "Fairbanks",
    latitude: 64.8378,
    longitude: -147.7164,
    bortleClass: 4,
    country: "USA",
    countryCode: "US",
    region: "Alaska",
    notes: "Drive out of town for darker skies",
    hasAmenities: true,
  },
  {
    name: "Chena Hot Springs",
    latitude: 65.0531,
    longitude: -146.0550,
    bortleClass: 2,
    country: "USA",
    countryCode: "US",
    region: "Alaska",
    notes: "Watch aurora from hot springs",
    hasAmenities: true,
  },
  {
    name: "Coldfoot",
    latitude: 67.2522,
    longitude: -150.1767,
    bortleClass: 1,
    country: "USA",
    countryCode: "US",
    region: "Alaska",
    notes: "Arctic circle location, extreme dark",
    hasAmenities: false,
  },

  // FINLAND
  {
    name: "Luosto",
    latitude: 67.1833,
    longitude: 26.9167,
    bortleClass: 2,
    country: "Finland",
    countryCode: "FI",
    region: "Lapland",
    notes: "Northern Lights Village with glass igloos",
    hasAmenities: true,
  },
  {
    name: "Saariselkä",
    latitude: 68.4167,
    longitude: 27.4167,
    bortleClass: 2,
    country: "Finland",
    countryCode: "FI",
    region: "Lapland",
    notes: "Popular ski resort with aurora viewing",
    hasAmenities: true,
  },
  {
    name: "Utsjoki",
    latitude: 69.9083,
    longitude: 27.0283,
    bortleClass: 1,
    country: "Finland",
    countryCode: "FI",
    region: "Lapland",
    notes: "Northernmost municipality in Finland",
    hasAmenities: false,
  },

  // SWEDEN
  {
    name: "Abisko National Park",
    latitude: 68.3500,
    longitude: 18.8167,
    bortleClass: 2,
    country: "Sweden",
    countryCode: "SE",
    region: "Norrbotten",
    notes: "Famous 'Blue Hole' microclimate with clear skies",
    hasAmenities: true,
  },
  {
    name: "Kiruna",
    latitude: 67.8558,
    longitude: 20.2253,
    bortleClass: 3,
    country: "Sweden",
    countryCode: "SE",
    region: "Norrbotten",
    notes: "ICEHOTEL location",
    hasAmenities: true,
  },

  // SCOTLAND
  {
    name: "Galloway Forest Dark Sky Park",
    latitude: 55.1000,
    longitude: -4.4667,
    bortleClass: 2,
    country: "UK",
    countryCode: "GB",
    region: "Scotland",
    notes: "UK's first Dark Sky Park",
    hasAmenities: true,
  },
  {
    name: "Isle of Skye",
    latitude: 57.3000,
    longitude: -6.2000,
    bortleClass: 3,
    country: "UK",
    countryCode: "GB",
    region: "Scotland",
    notes: "Dramatic landscape for aurora photography",
    hasAmenities: true,
  },

  // ARGENTINA / CHILE
  {
    name: "Ushuaia",
    latitude: -54.8019,
    longitude: -68.3030,
    bortleClass: 3,
    country: "Argentina",
    countryCode: "AR",
    region: "Tierra del Fuego",
    notes: "Southernmost city, good aurora australis chances",
    hasAmenities: true,
  },
  {
    name: "El Calafate",
    latitude: -50.3386,
    longitude: -72.2647,
    bortleClass: 2,
    country: "Argentina",
    countryCode: "AR",
    region: "Patagonia",
    notes: "Gateway to Perito Moreno glacier",
    hasAmenities: true,
  },
  {
    name: "Torres del Paine",
    latitude: -51.2500,
    longitude: -72.3333,
    bortleClass: 1,
    country: "Chile",
    countryCode: "CL",
    region: "Patagonia",
    notes: "National park with dark skies",
    hasAmenities: true,
  },
];

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate drive time based on distance
 * Uses average speeds for different distance ranges
 */
export function estimateDriveTime(distanceKm: number): number {
  // Rough estimates:
  // 0-50km: 50 km/h average (suburban/rural)
  // 50-200km: 70 km/h average (highway)
  // 200km+: 80 km/h average (mostly highway)

  if (distanceKm <= 50) {
    return Math.round((distanceKm / 50) * 60); // minutes
  } else if (distanceKm <= 200) {
    const firstPart = 60; // 50km at 50km/h
    const remainder = (distanceKm - 50) / 70 * 60;
    return Math.round(firstPart + remainder);
  } else {
    const firstPart = 60; // 50km at 50km/h
    const secondPart = (150) / 70 * 60; // 150km at 70km/h
    const remainder = (distanceKm - 200) / 80 * 60;
    return Math.round(firstPart + secondPart + remainder);
  }
}

/**
 * Format drive time as human-readable string
 */
export function formatDriveTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get Bortle class description
 */
export function getBortleDescription(bortleClass: number): string {
  switch (bortleClass) {
    case 1: return "Excellent dark-sky site";
    case 2: return "Typical truly dark site";
    case 3: return "Rural sky";
    case 4: return "Rural/suburban transition";
    case 5: return "Suburban sky";
    case 6: return "Bright suburban sky";
    case 7: return "Suburban/urban transition";
    case 8: return "City sky";
    case 9: return "Inner-city sky";
    default: return "Unknown";
  }
}

/**
 * Get Bortle class color for UI
 */
export function getBortleColor(bortleClass: number): string {
  if (bortleClass <= 2) return "#22c55e"; // green
  if (bortleClass <= 4) return "#84cc16"; // lime
  if (bortleClass <= 5) return "#eab308"; // yellow
  if (bortleClass <= 6) return "#f97316"; // orange
  return "#ef4444"; // red
}

export interface DarkSkySiteWithDistance extends DarkSkySite {
  distanceKm: number;
  driveTimeMinutes: number;
}

/**
 * Find nearest dark sky sites to a given location
 * Returns sites sorted by distance with drive time estimates
 */
export function findNearestDarkSites(
  userLat: number,
  userLon: number,
  maxResults: number = 5,
  maxDistanceKm: number = 500,
  maxBortleClass: number = 4
): DarkSkySiteWithDistance[] {
  const sitesWithDistance = DARK_SKY_SITES
    .filter(site => site.bortleClass <= maxBortleClass)
    .map(site => {
      const distanceKm = calculateDistance(userLat, userLon, site.latitude, site.longitude);
      return {
        ...site,
        distanceKm: Math.round(distanceKm),
        driveTimeMinutes: estimateDriveTime(distanceKm),
      };
    })
    .filter(site => site.distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return sitesWithDistance.slice(0, maxResults);
}

/**
 * Find sites in the same hemisphere as the user
 * Useful for aurora australis vs borealis
 */
export function findSitesInHemisphere(
  userLat: number,
  maxResults: number = 10
): DarkSkySite[] {
  const isNorthern = userLat >= 0;

  return DARK_SKY_SITES
    .filter(site => (site.latitude >= 0) === isNorthern)
    .slice(0, maxResults);
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
