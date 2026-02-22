/**
 * Geomagnetic Coordinate Conversion
 * Converts geographic coordinates to geomagnetic coordinates
 * Based on IGRF-14 model for 2025-2030
 *
 * Note: The magnetic pole shifts ~40-50 km/year towards Siberia.
 * These values should be reviewed and updated around 2030.
 * Reference: https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field
 */

// Geomagnetic pole position for 2025 (IGRF-14)
// North Magnetic Pole: 86.1°N, 156.8°W (moving towards Russia)
const GEOMAG_POLE_LAT = 86.1; // degrees North
const GEOMAG_POLE_LON = -156.8; // degrees East (156.8°W)

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculate geomagnetic coordinates from geographic coordinates
 * Uses dipole approximation - accurate enough for aurora visibility
 *
 * @param geographicLat Geographic latitude in degrees (-90 to 90)
 * @param geographicLon Geographic longitude in degrees (-180 to 180)
 * @returns Object with geomagneticLat and geomagneticLon
 */
export function toGeomagneticCoordinates(
  geographicLat: number,
  geographicLon: number
): { geomagneticLat: number; geomagneticLon: number } {
  // Convert to radians
  const lat = toRadians(geographicLat);
  const lon = toRadians(geographicLon);
  const poleLat = toRadians(GEOMAG_POLE_LAT);
  const poleLon = toRadians(GEOMAG_POLE_LON);

  // Spherical coordinate transformation
  // Calculate angular distance from geomagnetic pole
  const cosDistance =
    Math.sin(poleLat) * Math.sin(lat) +
    Math.cos(poleLat) * Math.cos(lat) * Math.cos(lon - poleLon);

  // Geomagnetic latitude (colatitude from pole)
  const geomagneticColat = Math.acos(Math.max(-1, Math.min(1, cosDistance)));
  const geomagneticLat = 90 - toDegrees(geomagneticColat);

  // Geomagnetic longitude (more complex, simplified here)
  let geomagneticLon = 0;
  if (Math.abs(geomagneticLat) < 89.9) {
    const sinAz =
      Math.cos(poleLat) * Math.sin(lon - poleLon) / Math.sin(geomagneticColat);
    const cosAz =
      (Math.sin(lat) - Math.sin(poleLat) * Math.cos(geomagneticColat)) /
      (Math.cos(poleLat) * Math.sin(geomagneticColat));
    geomagneticLon = toDegrees(Math.atan2(sinAz, cosAz));
  }

  return {
    geomagneticLat: Math.round(geomagneticLat * 100) / 100,
    geomagneticLon: Math.round(geomagneticLon * 100) / 100,
  };
}

/**
 * Calculate auroral oval position based on Kp index
 * Returns the equatorward boundary of the auroral oval in geomagnetic latitude
 *
 * Based on empirical observations:
 * - Kp 0: Oval at ~67° (quiet conditions)
 * - Kp 3: Oval at ~60° (unsettled)
 * - Kp 5: Oval at ~55° (minor storm)
 * - Kp 7: Oval at ~50° (strong storm)
 * - Kp 9: Oval at ~45° (severe storm)
 *
 * Formula derived from NOAA OVATION model
 */
export function getAuroralOvalLatitude(kp: number): {
  equatorwardEdge: number;
  centerLat: number;
  polewardEdge: number;
} {
  // Equatorward edge formula (simplified from OVATION)
  // Base: 67° at Kp=0, expands ~2.5° per Kp unit
  const equatorwardEdge = 67 - 2.5 * kp;

  // Oval center (typically 5-7° poleward of equatorward edge)
  const centerLat = equatorwardEdge + 6;

  // Poleward edge (typically 10-12° poleward of equatorward edge)
  const polewardEdge = equatorwardEdge + 11;

  return {
    equatorwardEdge: Math.max(45, equatorwardEdge), // Never goes below 45°
    centerLat: Math.min(73, centerLat), // Center maxes at ~73°
    polewardEdge: Math.min(78, polewardEdge), // Poleward edge maxes at ~78°
  };
}

/**
 * Calculate aurora visibility quality for a location
 *
 * @param geomagneticLat Geomagnetic latitude of the location
 * @param kp Current Kp index
 * @returns Visibility assessment
 */
export function calculateAuroraVisibility(
  geomagneticLat: number,
  kp: number
): {
  isVisible: boolean;
  quality: "none" | "poor" | "fair" | "good" | "excellent" | "overhead";
  message: string;
} {
  const oval = getAuroralOvalLatitude(kp);

  // Handle both hemispheres - use absolute value for calculations
  const isNorthernHemisphere = geomagneticLat >= 0;
  const absGeomagLat = Math.abs(geomagneticLat);
  const horizonDirection = isNorthernHemisphere ? "northern" : "southern";
  const poleDirection = isNorthernHemisphere ? "north" : "south";
  const equatorDirection = isNorthernHemisphere ? "south" : "north";

  // Too far from pole - no aurora
  if (absGeomagLat < oval.equatorwardEdge - 3) {
    return {
      isVisible: false,
      quality: "none",
      message: `Aurora too far ${poleDirection} (need Kp ${Math.ceil((67 - absGeomagLat) / 2.5)}+)`,
    };
  }

  // Just below the oval - faint on horizon toward pole
  if (absGeomagLat < oval.equatorwardEdge) {
    return {
      isVisible: true,
      quality: "poor",
      message: `Faint glow on ${horizonDirection} horizon`,
    };
  }

  // At equatorward edge - low on horizon
  if (absGeomagLat < oval.equatorwardEdge + 2) {
    return {
      isVisible: true,
      quality: "fair",
      message: `Aurora low on ${horizonDirection} horizon`,
    };
  }

  // In the oval - good viewing
  if (absGeomagLat < oval.centerLat - 2) {
    return {
      isVisible: true,
      quality: "good",
      message: `Aurora visible in ${horizonDirection} sky`,
    };
  }

  // Near oval center - excellent viewing
  if (absGeomagLat < oval.polewardEdge - 2) {
    return {
      isVisible: true,
      quality: "excellent",
      message: `Aurora overhead or toward ${equatorDirection}`,
    };
  }

  // Too close to pole - aurora toward equator
  if (absGeomagLat < oval.polewardEdge + 3) {
    return {
      isVisible: true,
      quality: "good",
      message: `Aurora visible to the ${equatorDirection}`,
    };
  }

  // Way too close to pole - inside polar cap
  return {
    isVisible: false,
    quality: "none",
    message: `Too far ${poleDirection} - inside polar cap`,
  };
}

/**
 * Get human-readable visibility description for a location
 */
export function getVisibilityDescription(
  geographicLat: number,
  geographicLon: number,
  kp: number
): {
  geomagneticLat: number;
  visibility: ReturnType<typeof calculateAuroraVisibility>;
  ovalPosition: ReturnType<typeof getAuroralOvalLatitude>;
} {
  const { geomagneticLat } = toGeomagneticCoordinates(
    geographicLat,
    geographicLon
  );
  const visibility = calculateAuroraVisibility(geomagneticLat, kp);
  const ovalPosition = getAuroralOvalLatitude(kp);

  return {
    geomagneticLat,
    visibility,
    ovalPosition,
  };
}

/**
 * Real-world city examples with their geomagnetic coordinates
 * Used for testing and reference
 */
export const REFERENCE_CITIES = [
  {
    name: "Tromsø, Norway",
    geographicLat: 69.6,
    geographicLon: 18.9,
    note: "The Aurora Capital - right under the oval",
  },
  {
    name: "Reykjavik, Iceland",
    geographicLat: 64.1,
    geographicLon: -21.9,
    note: "Excellent aurora viewing",
  },
  {
    name: "Fairbanks, Alaska",
    geographicLat: 64.8,
    geographicLon: -147.7,
    note: "Prime aurora location",
  },
  {
    name: "Yellowknife, Canada",
    geographicLat: 62.5,
    geographicLon: -114.3,
    note: "Near magnetic pole - excellent",
  },
  {
    name: "Oslo, Norway",
    geographicLat: 59.9,
    geographicLon: 10.8,
    note: "Needs Kp 3-4+",
  },
  {
    name: "Anchorage, Alaska",
    geographicLat: 61.2,
    geographicLon: -149.9,
    note: "Good aurora location",
  },
  {
    name: "Murmansk, Russia",
    geographicLat: 68.9,
    geographicLon: 33.1,
    note: "Arctic - frequent aurora",
  },
  {
    name: "Mohe, China",
    geographicLat: 53.5,
    geographicLon: 122.5,
    note: "Low geomagnetic latitude - needs major storms",
  },
  {
    name: "London, UK",
    geographicLat: 51.5,
    geographicLon: -0.1,
    note: "Needs Kp 8-9",
  },
  {
    name: "New York, USA",
    geographicLat: 40.7,
    geographicLon: -74.0,
    note: "Extreme events only",
  },
  // Southern Hemisphere
  {
    name: "Ushuaia, Argentina",
    geographicLat: -54.8,
    geographicLon: -68.3,
    note: "Southernmost city - excellent aurora australis",
  },
  {
    name: "Queenstown, New Zealand",
    geographicLat: -45.0,
    geographicLon: 168.7,
    note: "Popular aurora australis destination",
  },
  {
    name: "Hobart, Tasmania",
    geographicLat: -42.9,
    geographicLon: 147.3,
    note: "Good southern lights viewing",
  },
  {
    name: "Stewart Island, New Zealand",
    geographicLat: -47.0,
    geographicLon: 167.8,
    note: "Excellent dark skies for aurora",
  },
  {
    name: "Invercargill, New Zealand",
    geographicLat: -46.4,
    geographicLon: 168.4,
    note: "Southernmost NZ city",
  },
  {
    name: "Punta Arenas, Chile",
    geographicLat: -53.2,
    geographicLon: -70.9,
    note: "Gateway to Antarctica - great aurora",
  },
  {
    name: "Sydney, Australia",
    geographicLat: -33.9,
    geographicLon: 151.2,
    note: "Visible during major storms - Kp 8+",
  },
  {
    name: "Melbourne, Australia",
    geographicLat: -37.8,
    geographicLon: 145.0,
    note: "Better chances than Sydney - Kp 7+",
  },
  {
    name: "Perth, Australia",
    geographicLat: -31.9,
    geographicLon: 115.9,
    note: "Rare sightings during extreme storms",
  },
  {
    name: "Adelaide, Australia",
    geographicLat: -34.9,
    geographicLon: 138.6,
    note: "Southern Australia - Kp 7+",
  },
  {
    name: "Buenos Aires, Argentina",
    geographicLat: -34.6,
    geographicLon: -58.4,
    note: "Major storms only - Kp 8+",
  },
  {
    name: "El Calafate, Argentina",
    geographicLat: -50.3,
    geographicLon: -72.3,
    note: "Patagonia - good aurora australis",
  },
  {
    name: "Bariloche, Argentina",
    geographicLat: -41.1,
    geographicLon: -71.3,
    note: "Patagonia - Kp 6+",
  },
  {
    name: "Stanley, Falkland Islands",
    geographicLat: -51.7,
    geographicLon: -57.9,
    note: "Remote - excellent dark skies",
  },
  {
    name: "Cape Town, South Africa",
    geographicLat: -33.9,
    geographicLon: 18.4,
    note: "Extreme events only - Kp 9",
  },
  {
    name: "Durban, South Africa",
    geographicLat: -29.9,
    geographicLon: 31.0,
    note: "Very rare - extreme storms",
  },
  // More European cities
  {
    name: "Zurich, Switzerland",
    geographicLat: 47.4,
    geographicLon: 8.5,
    note: "Visible during strong storms - Kp 7+",
  },
  {
    name: "Munich, Germany",
    geographicLat: 48.1,
    geographicLon: 11.6,
    note: "Kp 6-7+ for visibility",
  },
  {
    name: "Berlin, Germany",
    geographicLat: 52.5,
    geographicLon: 13.4,
    note: "Better than southern Germany - Kp 5+",
  },
  {
    name: "Edinburgh, Scotland",
    geographicLat: 55.9,
    geographicLon: -3.2,
    note: "Good aurora location - Kp 4+",
  },
  {
    name: "Dublin, Ireland",
    geographicLat: 53.3,
    geographicLon: -6.3,
    note: "Kp 5+ for good viewing",
  },
  {
    name: "Copenhagen, Denmark",
    geographicLat: 55.7,
    geographicLon: 12.6,
    note: "Northern Europe - Kp 4+",
  },
  {
    name: "Helsinki, Finland",
    geographicLat: 60.2,
    geographicLon: 24.9,
    note: "Great aurora location - Kp 3+",
  },
  {
    name: "Stockholm, Sweden",
    geographicLat: 59.3,
    geographicLon: 18.1,
    note: "Good viewing - Kp 3+",
  },
  // More North American cities
  {
    name: "Seattle, USA",
    geographicLat: 47.6,
    geographicLon: -122.3,
    note: "Pacific NW - Kp 6+",
  },
  {
    name: "Chicago, USA",
    geographicLat: 41.9,
    geographicLon: -87.6,
    note: "Major storms - Kp 7+",
  },
  {
    name: "Denver, USA",
    geographicLat: 39.7,
    geographicLon: -104.9,
    note: "Extreme events - Kp 8+",
  },
  {
    name: "Toronto, Canada",
    geographicLat: 43.7,
    geographicLon: -79.4,
    note: "Kp 6+ for good viewing",
  },
  {
    name: "Vancouver, Canada",
    geographicLat: 49.3,
    geographicLon: -123.1,
    note: "Pacific coast - Kp 5+",
  },
];
