/**
 * Geomagnetic Coordinate Conversion
 * Converts geographic coordinates to geomagnetic coordinates
 * Based on IGRF-13 model approximation for 2025
 */

// Geomagnetic pole position for 2025 (approximate)
const GEOMAG_POLE_LAT = 86.5; // degrees North
const GEOMAG_POLE_LON = -164.0; // degrees East (164°W)

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

  // Too far south - no aurora
  if (geomagneticLat < oval.equatorwardEdge - 3) {
    return {
      isVisible: false,
      quality: "none",
      message: `Aurora too far north (need Kp ${Math.ceil((67 - geomagneticLat) / 2.5)}+)`,
    };
  }

  // Just below the oval - faint on northern horizon
  if (geomagneticLat < oval.equatorwardEdge) {
    return {
      isVisible: true,
      quality: "poor",
      message: "Faint glow on northern horizon",
    };
  }

  // At equatorward edge - low on horizon
  if (geomagneticLat < oval.equatorwardEdge + 2) {
    return {
      isVisible: true,
      quality: "fair",
      message: "Aurora low on northern horizon",
    };
  }

  // In the oval - good viewing
  if (geomagneticLat < oval.centerLat - 2) {
    return {
      isVisible: true,
      quality: "good",
      message: "Aurora visible in northern sky",
    };
  }

  // Near oval center - excellent viewing
  if (geomagneticLat < oval.polewardEdge - 2) {
    return {
      isVisible: true,
      quality: "excellent",
      message: "Aurora overhead or in south sky",
    };
  }

  // Too far north - aurora to the south
  if (geomagneticLat < oval.polewardEdge + 3) {
    return {
      isVisible: true,
      quality: "good",
      message: "Aurora visible to the south",
    };
  }

  // Way too far north - inside polar cap
  return {
    isVisible: false,
    quality: "none",
    message: "Too far north - inside polar cap",
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
];
