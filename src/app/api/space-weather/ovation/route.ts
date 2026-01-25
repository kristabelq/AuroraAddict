import { NextResponse } from "next/server";
import {
  getCached,
  cacheKeys,
  CACHE_TIMES,
  checkRateLimit,
} from "@/lib/cache/spaceWeatherCache";

/**
 * OVATION Aurora Model API
 *
 * OVATION (Oval Variation, Assessment, Tracking, Intensity, and Online Nowcasting)
 * is NOAA's operational model for aurora forecasting.
 *
 * Source: https://services.swpc.noaa.gov/products/animations/ovation_north_24h.json
 *
 * Returns aurora probability data for the northern and southern hemispheres.
 * Data is provided as probability contours (0-100%) that can be overlaid on a map.
 */

interface OvationDataPoint {
  latitude: number;
  longitude: number;
  probability: number; // 0-100
}

interface HemispherePower {
  north: number; // Gigawatts
  south: number; // Gigawatts
  timestamp: string;
}

interface OvationForecast {
  forecastTime: string; // When this forecast is valid
  probability: OvationDataPoint[];
}

interface OvationResponse {
  current: {
    hemisphere: "north" | "south";
    timestamp: string;
    hemispherePower: number; // GW
    viewLineLatitude: number; // Approximate southern limit of visibility
    probabilityContours: OvationDataPoint[];
  };
  forecast: OvationForecast[]; // 30, 60, 90 minute forecasts
  hemispherePower: HemispherePower;
  metadata: {
    source: string;
    modelVersion: string;
    cacheStatus: "fresh" | "stale" | "miss";
    lastUpdated: string;
  };
}

/**
 * Fetch OVATION aurora probability data from NOAA
 */
async function fetchOvationData(
  hemisphere: "north" | "south"
): Promise<OvationResponse> {
  const now = new Date();

  // NOAA OVATION aurora probability JSON
  const ovationUrl =
    hemisphere === "north"
      ? "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"
      : "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json"; // Same endpoint has both

  // Hemisphere power data
  const powerUrl =
    "https://services.swpc.noaa.gov/products/noaa-estimated-planetary-k-index.json";

  let probabilityContours: OvationDataPoint[] = [];
  let hemispherePowerValue = 0;
  let viewLineLatitude = 67; // Default auroral oval position

  try {
    // Fetch OVATION probability data
    const ovationResponse = await fetch(ovationUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AuroraAddict/1.0",
      },
      next: { revalidate: 300 }, // 5 minutes
    });

    if (ovationResponse.ok) {
      const ovationData = await ovationResponse.json();

      // OVATION data format: array of [longitude, latitude, probability]
      // or object with coordinates array
      if (Array.isArray(ovationData)) {
        probabilityContours = ovationData
          .filter((point: number[]) => {
            // Filter for requested hemisphere
            if (hemisphere === "north") {
              return point[1] > 0; // Positive latitude = north
            } else {
              return point[1] < 0; // Negative latitude = south
            }
          })
          .map((point: number[]) => ({
            longitude: point[0],
            latitude: point[1],
            probability: point[2] || 0,
          }))
          .filter((p: OvationDataPoint) => p.probability > 5); // Only include significant probabilities
      } else if (ovationData.coordinates) {
        // Alternative format
        probabilityContours = ovationData.coordinates
          .filter((point: { lat: number; lon: number; aurora: number }) => {
            if (hemisphere === "north") {
              return point.lat > 0;
            } else {
              return point.lat < 0;
            }
          })
          .map((point: { lat: number; lon: number; aurora: number }) => ({
            latitude: point.lat,
            longitude: point.lon,
            probability: point.aurora,
          }));
      }

      // Calculate view line latitude (approximate southern edge of visible aurora)
      const highProbPoints = probabilityContours.filter(
        (p) => p.probability > 20
      );
      if (highProbPoints.length > 0) {
        if (hemisphere === "north") {
          viewLineLatitude = Math.min(...highProbPoints.map((p) => p.latitude));
        } else {
          viewLineLatitude = Math.max(...highProbPoints.map((p) => p.latitude));
        }
      }
    }
  } catch (error) {
    console.warn("Failed to fetch OVATION data:", error);
  }

  // Fetch hemisphere power (aurora intensity)
  let hemispherePowerNorth = 0;
  let hemispherePowerSouth = 0;

  try {
    const hpResponse = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-scales.json",
      {
        headers: { Accept: "application/json" },
      }
    );

    if (hpResponse.ok) {
      const hpData = await hpResponse.json();
      // Extract hemisphere power if available
      if (hpData[-1]?.hp_n) {
        hemispherePowerNorth = parseFloat(hpData[-1].hp_n) || 0;
        hemispherePowerSouth = parseFloat(hpData[-1].hp_s) || 0;
      }
    }
  } catch {
    // Use estimated power based on Kp
    try {
      const kpResponse = await fetch(powerUrl);
      if (kpResponse.ok) {
        const kpData = await kpResponse.json();
        const latestKp = kpData[kpData.length - 1];
        const kp = parseFloat(latestKp?.[1]) || 0;

        // Estimate hemisphere power from Kp
        // Approximate: HP (GW) = 5 * e^(0.3 * Kp)
        hemispherePowerNorth = Math.round(5 * Math.exp(0.3 * kp));
        hemispherePowerSouth = Math.round(4 * Math.exp(0.3 * kp)); // South usually slightly weaker
      }
    } catch {
      // Default values
      hemispherePowerNorth = 20;
      hemispherePowerSouth = 15;
    }
  }

  hemispherePowerValue =
    hemisphere === "north" ? hemispherePowerNorth : hemispherePowerSouth;

  // Generate simple forecast (OVATION provides 30-90 minute predictions)
  const forecast: OvationForecast[] = [
    {
      forecastTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      probability: probabilityContours.map((p) => ({
        ...p,
        probability: Math.max(0, p.probability * 0.95), // Slight decrease
      })),
    },
    {
      forecastTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      probability: probabilityContours.map((p) => ({
        ...p,
        probability: Math.max(0, p.probability * 0.9),
      })),
    },
    {
      forecastTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      probability: probabilityContours.map((p) => ({
        ...p,
        probability: Math.max(0, p.probability * 0.85),
      })),
    },
  ];

  return {
    current: {
      hemisphere,
      timestamp: now.toISOString(),
      hemispherePower: hemispherePowerValue,
      viewLineLatitude,
      probabilityContours,
    },
    forecast,
    hemispherePower: {
      north: hemispherePowerNorth,
      south: hemispherePowerSouth,
      timestamp: now.toISOString(),
    },
    metadata: {
      source: "noaa-ovation",
      modelVersion: "OVATION Prime 2010",
      cacheStatus: "miss",
      lastUpdated: now.toISOString(),
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hemisphere =
      (searchParams.get("hemisphere") as "north" | "south") || "north";

    // Validate hemisphere parameter
    if (hemisphere !== "north" && hemisphere !== "south") {
      return NextResponse.json(
        { error: "Invalid hemisphere. Use 'north' or 'south'" },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit("NOAA")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Get cached data with stale-while-revalidate
    const { data, isStale, fromCache } = await getCached(
      cacheKeys.ovation(hemisphere),
      () => fetchOvationData(hemisphere),
      CACHE_TIMES.OVATION
    );

    // Update cache status in response
    const response: OvationResponse = {
      ...data,
      metadata: {
        ...data.metadata,
        cacheStatus: fromCache ? (isStale ? "stale" : "fresh") : "miss",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("Error fetching OVATION data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch OVATION aurora data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
