import { NextResponse } from "next/server";

/**
 * Planetary K-index (observed + forecast).
 *
 * NOAA changed noaa-planetary-k-index-forecast.json from the legacy
 * array-of-arrays layout to an array of objects
 * ({ time_tag, kp, observed, noaa_scale }). Every client here still parses the
 * legacy [header, [time_tag, kp, observed], ...] shape (indexing col 0=time,
 * 1=kp, 2=observed), so we normalize back to that shape and leave the clients
 * untouched (matching the solar-wind / plasma routes).
 */

const NOAA_KP_URL =
  "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";

// Legacy header row: every client skips index 0.
const LEGACY_HEADER = ["time_tag", "kp", "observed"];

interface KpForecastRecord {
  time_tag: string;
  kp: number | string | null;
  observed: string | null;
  noaa_scale?: string | null;
}

export async function GET() {
  try {
    const response = await fetch(NOAA_KP_URL, {
      headers: {
        "User-Agent": "AuroraAddict/1.0",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status}`);
    }

    const data = await response.json();

    // Already legacy array-of-arrays? Pass through unchanged.
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return NextResponse.json(data);
    }

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Unexpected NOAA response format" },
        { status: 502 }
      );
    }

    // Normalize the new array-of-objects layout back to legacy rows.
    const rows = (data as KpForecastRecord[]).map((r) => [
      r.time_tag,
      r.kp,
      r.observed,
    ]);

    return NextResponse.json([LEGACY_HEADER, ...rows]);
  } catch (error) {
    console.error("Error fetching KP index:", error);
    return NextResponse.json(
      { error: "Failed to fetch KP index data" },
      { status: 500 }
    );
  }
}
