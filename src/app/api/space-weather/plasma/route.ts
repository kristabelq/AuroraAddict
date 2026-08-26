import { NextResponse } from "next/server";

/**
 * Solar wind plasma data (speed, density, temperature).
 *
 * NOAA retired products/solar-wind/plasma-*.json. Real-time plasma now lives at
 * /json/rtsw/rtsw_wind_1m.json (array of named objects, multiple sources per
 * timestamp). The intelligence page parses the legacy array-of-arrays layout
 * [time_tag, density, speed, temperature] (col 1=density, 2=speed), so we
 * normalize back to that shape here.
 */

const NOAA_WIND_URL =
  "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json";

interface RtswWindRecord {
  time_tag: string;
  active: boolean;
  proton_density: number | null;
  proton_speed: number | null;
  proton_temperature: number | null;
}

// Return only the most recent ~3 hours (1-minute cadence). The raw feed is
// ~3MB (24h), over Next's fetch-cache limit; the client only needs recent data.
const RECENT_ROWS = 180;

// Legacy header row: the client skips index 0 and reads the last element.
const LEGACY_HEADER = ["time_tag", "density", "speed", "temperature"];

export async function GET() {
  try {
    const response = await fetch(NOAA_WIND_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "AuroraAddict/1.0",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "NOAA API unavailable" },
        { status: response.status }
      );
    }

    const records: RtswWindRecord[] = await response.json();

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Unexpected NOAA response format" },
        { status: 502 }
      );
    }

    const rows = records
      .filter((r) => r.active)
      .sort((a, b) => a.time_tag.localeCompare(b.time_tag))
      .slice(-RECENT_ROWS)
      .map((r) => [
        r.time_tag.replace("T", " "),
        r.proton_density,
        r.proton_speed,
        r.proton_temperature,
      ]);

    return NextResponse.json([LEGACY_HEADER, ...rows]);
  } catch (error) {
    console.error("Error fetching plasma data:", error);
    return NextResponse.json(
      { error: "Failed to fetch plasma data" },
      { status: 500 }
    );
  }
}
