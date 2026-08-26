import { NextResponse } from "next/server";

/**
 * Solar wind magnetic field (IMF) data.
 *
 * NOAA retired the legacy products/solar-wind/mag-*.json feeds. Real-time solar
 * wind now lives at /json/rtsw/rtsw_mag_1m.json, which returns an array of named
 * objects (bz_gsm, by_gsm, bt, ...) with several sources per timestamp.
 *
 * The intelligence page still parses the legacy array-of-arrays layout
 * [time_tag, bx_gsm, by_gsm, bz_gsm, lon_gsm, lat_gsm, bt] (indexing col 2=By,
 * 3=Bz, 6=Bt), so we normalize back to that shape here and leave the client
 * untouched.
 */

const NOAA_MAG_URL = "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json";

interface RtswMagRecord {
  time_tag: string;
  active: boolean;
  bx_gsm: number | null;
  by_gsm: number | null;
  bz_gsm: number | null;
  bt: number | null;
  lon_gsm?: number | null;
  lat_gsm?: number | null;
  phi_gsm?: number | null;
  theta_gsm?: number | null;
}

// Return only the most recent ~3 hours (1-minute cadence). The client walks
// back at most 90 minutes; this keeps the payload small.
const RECENT_ROWS = 180;

// Legacy header row: the client skips index 0 and iterates from the end.
const LEGACY_HEADER = [
  "time_tag",
  "bx_gsm",
  "by_gsm",
  "bz_gsm",
  "lon_gsm",
  "lat_gsm",
  "bt",
];

export async function GET() {
  try {
    const response = await fetch(NOAA_MAG_URL, {
      headers: {
        "User-Agent": "AuroraAddict/1.0",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `NOAA API error: ${response.status}` },
        { status: response.status }
      );
    }

    const records: RtswMagRecord[] = await response.json();

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Unexpected NOAA response format" },
        { status: 502 }
      );
    }

    // Keep only the active real-time source and sort oldest -> newest so the
    // client's "latest = last element" and backward 90-minute walk hold.
    // Trim to the last few hours: the raw feed is ~2MB (24h of 1-min data),
    // over Next's fetch-cache limit, and the client only needs ~90 minutes.
    const rows = records
      .filter((r) => r.active)
      .sort((a, b) => a.time_tag.localeCompare(b.time_tag))
      .slice(-RECENT_ROWS)
      .map((r) => [
        r.time_tag.replace("T", " "), // legacy "YYYY-MM-DD HH:MM:SS" format
        r.bx_gsm,
        r.by_gsm,
        r.bz_gsm,
        r.lon_gsm ?? r.phi_gsm ?? null,
        r.lat_gsm ?? r.theta_gsm ?? null,
        r.bt,
      ]);

    return NextResponse.json([LEGACY_HEADER, ...rows]);
  } catch (error) {
    console.error("Error fetching solar wind data:", error);
    return NextResponse.json(
      { error: "Failed to fetch solar wind data" },
      { status: 500 }
    );
  }
}
