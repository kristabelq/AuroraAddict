import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get cached CME data
 * Returns cached data if available and not expired
 * Optionally triggers a refresh if forceRefresh=true
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Get cached data
    let cache = await prisma.spaceWeatherCache.findUnique({
      where: {
        dataType_source: {
          dataType: "cme",
          source: "nasa-donki",
        },
      },
    });

    // Smart refresh logic for CME data
    const now = new Date();
    const cacheAge = cache ? (now.getTime() - new Date(cache.lastUpdated).getTime()) / (1000 * 60) : Infinity; // age in minutes
    const shouldRefresh = !cache || forceRefresh || cacheAge > 30; // Refresh if >30 min old or forced

    if (shouldRefresh) {
      console.log(`[CME Cache] Refreshing (age: ${cacheAge.toFixed(0)}min, forced: ${forceRefresh})`);

      // Try to update the cache
      try {
        await updateCMECache();

        // Fetch the updated cache
        cache = await prisma.spaceWeatherCache.findUnique({
          where: {
            dataType_source: {
              dataType: "cme",
              source: "nasa-donki",
            },
          },
        });
      } catch (error) {
        console.error("[CME Cache] Failed to update cache:", error);

        // If we have old cache data, return it with a warning
        if (cache) {
          return NextResponse.json({
            data: cache.data,
            lastUpdated: cache.lastUpdated,
            cacheAgeMinutes: cacheAge,
            warning: "Failed to refresh, returning stale data",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        // No cache at all and update failed
        return NextResponse.json(
          {
            error: "Failed to fetch CME data",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    if (!cache) {
      return NextResponse.json(
        { error: "No cached data available" },
        { status: 404 }
      );
    }

    // Return cached data with freshness info
    return NextResponse.json({
      data: cache.data,
      lastUpdated: cache.lastUpdated,
      cacheAgeMinutes: Math.floor(cacheAge),
      fresh: cacheAge < 30, // Data is "fresh" if less than 30 minutes old
      cached: true,
    });
  } catch (error) {
    console.error("[CME Cache] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve CME data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function updateCMECache() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Last 7 days

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const response = await fetch(
    `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=${
      process.env.NASA_API_KEY || "DEMO_KEY"
    }`
  );

  if (!response.ok) {
    throw new Error(`NASA API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Reference expiration (not actively used)

  await prisma.spaceWeatherCache.upsert({
    where: {
      dataType_source: {
        dataType: "cme",
        source: "nasa-donki",
      },
    },
    update: {
      data: data || [],
      lastUpdated: new Date(),
      expiresAt,
    },
    create: {
      dataType: "cme",
      source: "nasa-donki",
      data: data || [],
      lastUpdated: new Date(),
      expiresAt,
    },
  });
}
