import { NextResponse } from "next/server";

export async function GET() {
  try {
    // This would integrate with real APIs like NOAA for Kp index
    // and weather APIs for cloud cover
    // For now, returning mock data

    const stats = {
      kp: 3.5,
      cloudCover: 45,
      auroraForecast: "Moderate",
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
