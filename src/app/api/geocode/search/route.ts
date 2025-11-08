import { NextResponse } from "next/server";

/**
 * GET /api/geocode/search?q=<query>
 *
 * Search for location suggestions using OpenStreetMap Nominatim API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 3) {
      return NextResponse.json([]);
    }

    // Use Nominatim API with proper headers
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AuroraAddict/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error("Nominatim API error:", response.status, response.statusText);
      return NextResponse.json([]);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return NextResponse.json([]);
  }
}
