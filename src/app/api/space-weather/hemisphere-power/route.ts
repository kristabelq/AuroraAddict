import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/text/aurora-nowcast-hemi-power.txt",
      {
        headers: {
          "Accept": "text/plain",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "NOAA API unavailable" },
        { status: response.status }
      );
    }

    const text = await response.text();

    // Parse the text data
    const lines = text.split('\n').filter(line =>
      line.trim() && !line.startsWith('#') && !line.startsWith(':')
    );

    if (lines.length === 0) {
      return NextResponse.json({ error: "No data available" }, { status: 404 });
    }

    // Get the most recent data line
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.trim().split(/\s+/);

    // Format: Observation_Time  Forecast_Time  North_GW  South_GW
    if (parts.length >= 4) {
      return NextResponse.json({
        observationTime: parts[0],
        forecastTime: parts[1],
        northGW: parseFloat(parts[2]),
        southGW: parseFloat(parts[3]),
        rawText: text
      });
    }

    return NextResponse.json({ rawText: text });
  } catch (error) {
    console.error("Error fetching hemisphere power data:", error);
    return NextResponse.json(
      { error: "Failed to fetch hemisphere power data" },
      { status: 500 }
    );
  }
}
