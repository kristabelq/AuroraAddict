import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // Use Mapbox Geocoding API for location autocomplete
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      console.error("Mapbox token not configured");
      return NextResponse.json([]);
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,region,country&limit=5&language=en`
    );

    if (!response.ok) {
      throw new Error("Mapbox API request failed");
    }

    const data = await response.json();

    // Format results for autocomplete
    const suggestions = data.features.map((feature: any) => ({
      id: feature.id,
      name: feature.place_name, // Full name in English
      coordinates: feature.center, // [longitude, latitude]
    }));

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    return NextResponse.json([]);
  }
}
