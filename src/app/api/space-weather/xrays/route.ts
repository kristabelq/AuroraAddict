import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json",
      {
        headers: {
          "Accept": "application/json",
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching X-ray data:", error);
    return NextResponse.json(
      { error: "Failed to fetch X-ray data" },
      { status: 500 }
    );
  }
}
