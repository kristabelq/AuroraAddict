import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json",
      {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 60 }, // Cache for 1 minute
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
    console.error("Error fetching plasma data:", error);
    return NextResponse.json(
      { error: "Failed to fetch plasma data" },
      { status: 500 }
    );
  }
}
