import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { storeCMERecords } from "@/lib/cme-parser";

/**
 * Get CME records from our database
 * Auto-fetches from NASA if data is stale (>30 minutes since last check)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("forceRefresh") === "true";
    const days = parseInt(searchParams.get("days") || "7");

    // Check when we last fetched from NASA
    const lastFetch = await prisma.spaceWeatherCache.findUnique({
      where: {
        dataType_source: {
          dataType: "cme-last-fetch",
          source: "nasa-donki",
        },
      },
    });

    const now = new Date();
    const shouldRefresh =
      !lastFetch ||
      forceRefresh ||
      now.getTime() - new Date(lastFetch.lastUpdated).getTime() > 30 * 60 * 1000; // 30 minutes

    if (shouldRefresh) {
      console.log("[CME Records] Fetching fresh data from NASA...");
      try {
        await fetchAndStoreCMEData();
      } catch (error) {
        console.error("[CME Records] Failed to fetch from NASA:", error);
        // Continue to return cached data even if fetch fails
      }
    }

    // Get CME records from our database
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cmeRecords = await prisma.cMERecord.findMany({
      where: {
        startTime: {
          gte: startDate,
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    // Get fetch metadata
    const fetchMeta = await prisma.spaceWeatherCache.findUnique({
      where: {
        dataType_source: {
          dataType: "cme-last-fetch",
          source: "nasa-donki",
        },
      },
    });

    const cacheAgeMinutes = fetchMeta
      ? Math.floor((now.getTime() - new Date(fetchMeta.lastUpdated).getTime()) / (1000 * 60))
      : 999;

    return NextResponse.json({
      records: cmeRecords,
      count: cmeRecords.length,
      earthDirected: cmeRecords.filter((r) => r.isEarthDirected).length,
      lastFetched: fetchMeta?.lastUpdated,
      cacheAgeMinutes,
      fresh: cacheAgeMinutes < 30,
    });
  } catch (error) {
    console.error("[CME Records] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve CME records",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function fetchAndStoreCMEData() {
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

  // Store individual CME records
  const count = await storeCMERecords(data || []);

  console.log(`[CME Records] Stored ${count} CME records`);

  // Update last fetch timestamp
  await prisma.spaceWeatherCache.upsert({
    where: {
      dataType_source: {
        dataType: "cme-last-fetch",
        source: "nasa-donki",
      },
    },
    update: {
      lastUpdated: new Date(),
      data: { count, lastFetch: new Date().toISOString() },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    create: {
      dataType: "cme-last-fetch",
      source: "nasa-donki",
      lastUpdated: new Date(),
      data: { count, lastFetch: new Date().toISOString() },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
}
