import { NextResponse } from "next/server";

/**
 * Cloud Cover API
 *
 * Fetches cloud cover data from OpenWeatherMap for a given location.
 * Used for aurora chase decision making.
 */

interface CloudCoverResponse {
  cloudCover: number; // 0-100%
  description: string;
  visibility: number; // meters
  humidity: number; // 0-100%
  temperature: number; // Celsius
  windSpeed: number; // m/s
  timestamp: string;
  location?: string;
}

interface OpenWeatherResponse {
  clouds: { all: number };
  weather: Array<{ description: string; main: string }>;
  visibility?: number;
  main: { humidity: number; temp: number };
  wind: { speed: number };
  name?: string;
}

// Simple in-memory cache to avoid hammering the API
const cache = new Map<string, { data: CloudCoverResponse; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Missing lat or lon parameter" },
      { status: 400 }
    );
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: "Invalid lat or lon parameter" },
      { status: 400 }
    );
  }

  // Round coordinates for cache key (reduce unique requests)
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
    });
  }

  // Check for API key
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;

  if (!apiKey) {
    // Return mock data if no API key configured
    console.warn("OPENWEATHERMAP_API_KEY not configured, returning mock data");
    const mockData: CloudCoverResponse = {
      cloudCover: Math.floor(Math.random() * 100),
      description: "partly cloudy (mock data)",
      visibility: 10000,
      humidity: 50,
      temperature: 10,
      windSpeed: 5,
      timestamp: new Date().toISOString(),
      location: "Mock Location",
    };
    return NextResponse.json({
      ...mockData,
      mock: true,
    });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    );

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 500 }
        );
      }
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const data: OpenWeatherResponse = await response.json();

    const result: CloudCoverResponse = {
      cloudCover: data.clouds?.all || 0,
      description: data.weather?.[0]?.description || "unknown",
      visibility: data.visibility || 10000,
      humidity: data.main?.humidity || 0,
      temperature: Math.round(data.main?.temp || 0),
      windSpeed: Math.round((data.wind?.speed || 0) * 10) / 10,
      timestamp: new Date().toISOString(),
      location: data.name,
    };

    // Update cache
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching cloud cover:", error);
    return NextResponse.json(
      { error: "Failed to fetch cloud cover data" },
      { status: 500 }
    );
  }
}

/**
 * Batch endpoint for fetching cloud cover for multiple locations
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { locations } = body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid locations array" },
        { status: 400 }
      );
    }

    // Limit to 10 locations per request
    const limitedLocations = locations.slice(0, 10);

    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      // Return mock data
      const results = limitedLocations.map((loc: { lat: number; lon: number; name?: string }) => ({
        lat: loc.lat,
        lon: loc.lon,
        name: loc.name,
        cloudCover: Math.floor(Math.random() * 100),
        description: "mock data",
        mock: true,
      }));
      return NextResponse.json({ results, mock: true });
    }

    // Fetch all locations in parallel
    const results = await Promise.all(
      limitedLocations.map(async (loc: { lat: number; lon: number; name?: string }) => {
        const cacheKey = `${loc.lat.toFixed(2)},${loc.lon.toFixed(2)}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return {
            lat: loc.lat,
            lon: loc.lon,
            name: loc.name,
            ...cached.data,
            cached: true,
          };
        }

        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${loc.lat}&lon=${loc.lon}&appid=${apiKey}&units=metric`
          );

          if (!response.ok) {
            return {
              lat: loc.lat,
              lon: loc.lon,
              name: loc.name,
              error: `API error: ${response.status}`,
            };
          }

          const data: OpenWeatherResponse = await response.json();

          const result = {
            lat: loc.lat,
            lon: loc.lon,
            name: loc.name || data.name,
            cloudCover: data.clouds?.all || 0,
            description: data.weather?.[0]?.description || "unknown",
            visibility: data.visibility || 10000,
            humidity: data.main?.humidity || 0,
            temperature: Math.round(data.main?.temp || 0),
          };

          // Cache individual result
          cache.set(cacheKey, {
            data: {
              cloudCover: result.cloudCover,
              description: result.description,
              visibility: result.visibility,
              humidity: result.humidity,
              temperature: result.temperature,
              windSpeed: 0,
              timestamp: new Date().toISOString(),
            },
            timestamp: Date.now(),
          });

          return result;
        } catch (error) {
          return {
            lat: loc.lat,
            lon: loc.lon,
            name: loc.name,
            error: "Failed to fetch",
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in batch cloud cover:", error);
    return NextResponse.json(
      { error: "Failed to process batch request" },
      { status: 500 }
    );
  }
}
