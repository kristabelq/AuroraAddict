import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json",
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour (data updates daily)
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
    console.error("Error fetching sunspot data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sunspot data" },
      { status: 500 }
    );
  }
}
