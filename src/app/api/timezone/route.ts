import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 }
      );
    }

    // Use geo-tz to get IANA timezone (server-side only)
    const geoTz = require('geo-tz');
    const tzNames = geoTz.find(parseFloat(lat), parseFloat(lng));

    if (tzNames && tzNames.length > 0) {
      return NextResponse.json({ timezone: tzNames[0] });
    }

    return NextResponse.json({ timezone: "UTC" });
  } catch (error) {
    console.error("Error getting timezone:", error);
    return NextResponse.json({ timezone: "UTC" });
  }
}
