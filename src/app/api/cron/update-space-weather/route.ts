import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job to update space weather data cache
 * Should run every 30 minutes
 */
export async function GET(req: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting space weather cache update...");

    // Fetch CME data from NASA DONKI
    await updateCMECache();

    // You can add more data sources here:
    // await updateSolarFlareCache();
    // await updateKpForecastCache();

    console.log("[Cron] Space weather cache update completed");

    return NextResponse.json({
      success: true,
      message: "Space weather cache updated",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error updating space weather cache:", error);
    return NextResponse.json(
      {
        error: "Failed to update cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function updateCMECache() {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    console.log(`[CME] Fetching data from ${formatDate(startDate)} to ${formatDate(endDate)}`);

    const response = await fetch(
      `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=${
        process.env.NASA_API_KEY || "DEMO_KEY"
      }`
    );

    if (!response.ok) {
      throw new Error(`NASA API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[CME] Received ${data?.length || 0} CME records`);

    // Cache the data (upsert - update if exists, create if not)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Reference expiration (actual refresh based on age)

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

    console.log("[CME] Cache updated successfully");
  } catch (error) {
    console.error("[CME] Error updating cache:", error);
    throw error;
  }
}
