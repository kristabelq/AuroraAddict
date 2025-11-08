import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json",
      {
        headers: {
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching solar wind data:", error);
    return NextResponse.json(
      { error: "Failed to fetch solar wind data" },
      { status: 500 }
    );
  }
}
