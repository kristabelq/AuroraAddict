import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Live Sightings API
 *
 * Returns all quick sightings from the last 2 hours.
 * Used to populate the real-time community sightings map.
 *
 * GET: Fetch live sightings with optional geographic filtering
 */

interface LiveSightingsQuery {
  // Optional bounding box for geographic filtering
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  // Optional minimum intensity filter
  minIntensity?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: LiveSightingsQuery = {
      minLat: searchParams.get("minLat")
        ? parseFloat(searchParams.get("minLat")!)
        : undefined,
      maxLat: searchParams.get("maxLat")
        ? parseFloat(searchParams.get("maxLat")!)
        : undefined,
      minLon: searchParams.get("minLon")
        ? parseFloat(searchParams.get("minLon")!)
        : undefined,
      maxLon: searchParams.get("maxLon")
        ? parseFloat(searchParams.get("maxLon")!)
        : undefined,
      minIntensity: searchParams.get("minIntensity")
        ? parseInt(searchParams.get("minIntensity")!)
        : undefined,
    };

    // Current time
    const now = new Date();

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      expiresAt: {
        gt: now, // Only non-expired sightings
      },
    };

    // Add geographic filters if provided
    if (query.minLat !== undefined && query.maxLat !== undefined) {
      whereClause.latitude = {
        gte: query.minLat,
        lte: query.maxLat,
      };
    }

    if (query.minLon !== undefined && query.maxLon !== undefined) {
      whereClause.longitude = {
        gte: query.minLon,
        lte: query.maxLon,
      };
    }

    // Add intensity filter if provided
    if (query.minIntensity !== undefined) {
      whereClause.intensity = {
        gte: query.minIntensity,
      };
    }

    // Fetch live sightings
    const sightings = await (prisma.quickSighting?.findMany?.({
      where: whereClause,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      take: 500, // Limit to prevent overwhelming the client
    }) ?? Promise.resolve([]));

    // Calculate statistics
    const totalCount = sightings.length;
    const avgIntensity =
      totalCount > 0
        ? sightings.reduce((sum: number, s: { intensity: number }) => sum + s.intensity, 0) / totalCount
        : 0;

    // Group by region for clustering hints
    const regionCounts: Record<string, number> = {};
    for (const sighting of sightings as Array<{ countryCode: string | null }>) {
      const region = sighting.countryCode || "Unknown";
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }

    // Identify hotspots (areas with multiple sightings)
    const hotspots = identifyHotspots(sightings);

    // Format response
    const response = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sightings: (sightings as any[]).map((s) => ({
        id: s.id,
        latitude: s.latitude,
        longitude: s.longitude,
        intensity: s.intensity,
        colors: s.colors,
        structure: s.structure,
        direction: s.direction,
        cityName: s.cityName,
        countryCode: s.countryCode,
        timestamp: s.timestamp,
        expiresAt: s.expiresAt,
        minutesAgo: Math.round((now.getTime() - s.timestamp.getTime()) / 60000),
        user: s.user
          ? {
              id: s.user.id,
              name: s.user.name,
              username: s.user.username,
              image: s.user.image,
            }
          : null,
        isVerified: s.isVerified,
      })),
      statistics: {
        totalCount,
        avgIntensity: Math.round(avgIntensity * 10) / 10,
        regionCounts,
        mostActiveRegion:
          Object.entries(regionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
          null,
      },
      hotspots,
      metadata: {
        timestamp: now.toISOString(),
        windowHours: 2,
        hasMore: sightings.length >= 500,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Error fetching live sightings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live sightings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Identify geographic hotspots where multiple sightings are clustered
 */
function identifyHotspots(
  sightings: Array<{
    latitude: number;
    longitude: number;
    intensity: number;
    cityName: string | null;
  }>
): Array<{
  latitude: number;
  longitude: number;
  count: number;
  avgIntensity: number;
  cityName: string | null;
}> {
  if (sightings.length === 0) return [];

  // Grid-based clustering (1 degree cells)
  const gridSize = 1; // degrees
  const grid = new Map<
    string,
    {
      sightings: typeof sightings;
      sumLat: number;
      sumLon: number;
    }
  >();

  for (const sighting of sightings) {
    const gridKey = `${Math.floor(sighting.latitude / gridSize)},${Math.floor(sighting.longitude / gridSize)}`;

    if (!grid.has(gridKey)) {
      grid.set(gridKey, { sightings: [], sumLat: 0, sumLon: 0 });
    }

    const cell = grid.get(gridKey)!;
    cell.sightings.push(sighting);
    cell.sumLat += sighting.latitude;
    cell.sumLon += sighting.longitude;
  }

  // Find cells with multiple sightings
  const hotspots: Array<{
    latitude: number;
    longitude: number;
    count: number;
    avgIntensity: number;
    cityName: string | null;
  }> = [];

  for (const [, cell] of grid) {
    if (cell.sightings.length >= 2) {
      const count = cell.sightings.length;
      hotspots.push({
        latitude: cell.sumLat / count,
        longitude: cell.sumLon / count,
        count,
        avgIntensity:
          Math.round(
            (cell.sightings.reduce((sum, s) => sum + s.intensity, 0) / count) *
              10
          ) / 10,
        cityName: cell.sightings.find((s) => s.cityName)?.cityName || null,
      });
    }
  }

  // Sort by count descending
  return hotspots.sort((a, b) => b.count - a.count).slice(0, 10);
}
