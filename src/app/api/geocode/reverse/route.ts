import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Use OpenStreetMap Nominatim API for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }

    const data = await response.json();

    // Extract attraction name, city, and country
    const address = data.address || {};
    const attraction =
      data.name ||
      address.tourism ||
      address.attraction ||
      address.amenity ||
      address.building ||
      null;

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      null;

    const country = address.country || null;

    // Build location string
    let locationParts: string[] = [];

    if (attraction && attraction !== city) {
      locationParts.push(attraction);
    }

    if (city) {
      locationParts.push(city);
    }

    if (country) {
      locationParts.push(country);
    }

    const locationString = locationParts.length > 0
      ? locationParts.join(", ")
      : `${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;

    return NextResponse.json({
      location: locationString,
      attraction,
      city,
      country,
      fullAddress: data.display_name,
    });
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
