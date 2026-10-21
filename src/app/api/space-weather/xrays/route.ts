import { NextResponse } from "next/server";

// The GOES xrays-7-day feed is ~6MB (two energy bands at 1-min cadence over 7
// days), which exceeds Next's 2MB fetch-cache limit and is far more than the
// client needs — the Intelligence page only charts the last 3 days. Skip the
// oversized upstream cache and trim the response to recent records (object
// shape preserved so client parsing is unchanged).
const RECENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface XrayRecord {
  time_tag: string;
  flux: number;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json",
      {
        headers: {
          "Accept": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "NOAA API unavailable" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const cutoff = Date.now() - RECENT_WINDOW_MS;
      const recent = (data as XrayRecord[]).filter((r) => {
        const t = new Date(r.time_tag).getTime();
        return Number.isNaN(t) || t >= cutoff;
      });
      // Guard against an unexpected empty window: fall back to the full feed.
      return NextResponse.json(recent.length > 0 ? recent : data);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching X-ray data:", error);
    return NextResponse.json(
      { error: "Failed to fetch X-ray data" },
      { status: 500 }
    );
  }
}
