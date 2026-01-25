import { NextResponse } from "next/server";
import {
  getCached,
  cacheKeys,
  CACHE_TIMES,
  checkRateLimit,
} from "@/lib/cache/spaceWeatherCache";

/**
 * Hp30/Hp60 Index API
 *
 * The Hp30 and Hp60 indices are half-hourly planetary geomagnetic indices
 * derived from K values of 13 geomagnetic observatories.
 *
 * Source: GFZ German Research Centre for Geosciences (Potsdam)
 * URL: https://kp.gfz-potsdam.de/
 *
 * Why Hp30 is better than Kp for aurora prediction:
 * - Kp is a 3-hour index, so it lags behind actual conditions
 * - Hp30 updates every 30 minutes, catching substorms Kp misses
 * - Hp60 is hourly, still better resolution than Kp
 *
 * Cache: 15 minutes (matches data update frequency)
 */

interface HpDataPoint {
  time: string; // ISO timestamp
  Hp30: number; // Half-hourly Hp index
  Hp60: number; // Hourly Hp index (averaged from Hp30)
  ap30?: number; // Linear index corresponding to Hp30
  ap60?: number; // Linear index corresponding to Hp60
  flag?: string; // Data quality flag
}

interface GFZResponse {
  datetime: string;
  Hp30: number;
  Hp60: number;
  ap30: number;
  ap60: number;
  flag: string;
}

interface HpIndexResponse {
  current: {
    hp30: number;
    hp60: number;
    ap30: number;
    ap60: number;
    timestamp: string;
  };
  history: HpDataPoint[];
  kpComparison?: {
    currentKp: number;
    hp30DiffersSignificantly: boolean;
    warning: string | null;
  };
  metadata: {
    source: string;
    cacheStatus: "fresh" | "stale" | "miss";
    lastUpdated: string;
  };
}

async function fetchHpIndex(): Promise<HpIndexResponse> {
  // GFZ Potsdam Hp Index API
  // This fetches the most recent Hp30/Hp60 values
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Format dates for GFZ API (YYYY-MM-DD format)
  const startDate = yesterday.toISOString().split("T")[0];
  const endDate = now.toISOString().split("T")[0];

  // GFZ API endpoint for Hp30 data
  const apiUrl = `https://kp.gfz-potsdam.de/app/json/?start=${startDate}&end=${endDate}&index=Hp30`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AuroraAddict/1.0 (aurora-forecasting)",
    },
    next: { revalidate: 900 }, // 15 minutes
  });

  if (!response.ok) {
    // If GFZ API is unavailable, try to derive from NOAA Kp
    console.warn("GFZ API unavailable, using Kp-derived estimate");
    return await deriveFromKp();
  }

  const rawData: GFZResponse[] = await response.json();

  if (!Array.isArray(rawData) || rawData.length === 0) {
    return await deriveFromKp();
  }

  // Process the data
  const history: HpDataPoint[] = rawData.map((point) => ({
    time: point.datetime,
    Hp30: point.Hp30,
    Hp60: point.Hp60,
    ap30: point.ap30,
    ap60: point.ap60,
    flag: point.flag,
  }));

  // Get the most recent values
  const latest = rawData[rawData.length - 1];

  return {
    current: {
      hp30: latest.Hp30,
      hp60: latest.Hp60,
      ap30: latest.ap30,
      ap60: latest.ap60,
      timestamp: latest.datetime,
    },
    history: history.slice(-48), // Last 24 hours (48 half-hour intervals)
    metadata: {
      source: "gfz-potsdam",
      cacheStatus: "miss",
      lastUpdated: new Date().toISOString(),
    },
  };
}

/**
 * Fallback: Derive Hp30-like values from Kp when GFZ is unavailable
 * This is an estimate and not as accurate as real Hp30 data
 */
async function deriveFromKp(): Promise<HpIndexResponse> {
  try {
    const kpResponse = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (!kpResponse.ok) {
      throw new Error("NOAA Kp API also unavailable");
    }

    const kpData = await kpResponse.json();

    // NOAA Kp data format: [time_tag, kp, kp_flag, observed, ...]
    const recentKp = kpData.slice(-8); // Last 8 entries (24 hours of 3-hour data)

    // Convert Kp to approximate Hp30 (using interpolation)
    const history: HpDataPoint[] = [];
    for (let i = 0; i < recentKp.length; i++) {
      const entry = recentKp[i];
      if (Array.isArray(entry) && entry.length >= 2) {
        const kp = parseFloat(entry[1]) || 0;
        // Hp30 is roughly similar to Kp but with more variation
        history.push({
          time: entry[0],
          Hp30: kp,
          Hp60: kp,
          flag: "derived",
        });
      }
    }

    const latest = history[history.length - 1] || {
      time: new Date().toISOString(),
      Hp30: 0,
      Hp60: 0,
    };

    return {
      current: {
        hp30: latest.Hp30,
        hp60: latest.Hp60,
        ap30: kpToAp(latest.Hp30),
        ap60: kpToAp(latest.Hp60),
        timestamp: latest.time,
      },
      history,
      metadata: {
        source: "noaa-derived",
        cacheStatus: "miss",
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch {
    // Ultimate fallback
    return {
      current: {
        hp30: 0,
        hp60: 0,
        ap30: 0,
        ap60: 0,
        timestamp: new Date().toISOString(),
      },
      history: [],
      metadata: {
        source: "unavailable",
        cacheStatus: "miss",
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

/**
 * Convert Kp to ap (linear) index
 * Standard conversion table
 */
function kpToAp(kp: number): number {
  const apTable = [0, 2, 3, 4, 5, 6, 7, 9, 12, 15, 18, 22, 27, 32, 39, 48, 56, 67, 80, 94, 111, 132, 154, 179, 207, 236, 300, 400];
  const kpIndex = Math.min(Math.floor(kp * 3), 27);
  return apTable[kpIndex] || 0;
}

export async function GET() {
  try {
    // Check rate limit
    if (!checkRateLimit("GFZ")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Get cached data with stale-while-revalidate
    const { data, isStale, fromCache } = await getCached(
      cacheKeys.hpIndex(),
      fetchHpIndex,
      CACHE_TIMES.HP_INDEX
    );

    // Update cache status in response
    const response: HpIndexResponse = {
      ...data,
      metadata: {
        ...data.metadata,
        cacheStatus: fromCache ? (isStale ? "stale" : "fresh") : "miss",
      },
    };

    // Compare with current Kp to detect "Kp lagging" situations
    // This happens when Hp30 shows elevated activity but Kp hasn't caught up
    try {
      const kpResponse = await fetch(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
      );
      if (kpResponse.ok) {
        const kpData = await kpResponse.json();
        const latestKp = kpData[kpData.length - 1];
        const currentKp = parseFloat(latestKp?.[1]) || 0;

        const hp30DiffersSignificantly =
          Math.abs(response.current.hp30 - currentKp) >= 2;

        response.kpComparison = {
          currentKp,
          hp30DiffersSignificantly,
          warning: hp30DiffersSignificantly
            ? response.current.hp30 > currentKp
              ? "Hp30 is higher than Kp - activity may be increasing faster than Kp shows"
              : "Hp30 is lower than Kp - activity may be decreasing"
            : null,
        };
      }
    } catch {
      // Ignore Kp comparison errors
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("Error fetching Hp index:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Hp index data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
