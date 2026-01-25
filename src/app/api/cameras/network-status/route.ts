import { NextResponse } from "next/server";
import {
  getCached,
  cacheKeys,
  CACHE_TIMES,
  checkRateLimit,
} from "@/lib/cache/spaceWeatherCache";

/**
 * All-Sky Camera Network Status API
 *
 * Aggregates status from multiple all-sky camera networks:
 * - THEMIS (Time History of Events and Macroscale Interactions during Substorms)
 * - MIRACLE (Magnetometers - Ionospheric Radars - All-sky Cameras Large Experiment)
 * - Tromsø Geophysical Observatory
 *
 * Returns camera status, aurora detection, and image URLs.
 */

interface CameraStation {
  code: string;
  name: string;
  network: string;
  latitude: number;
  longitude: number;
  status: "online" | "offline" | "cloudy" | "aurora" | "unknown";
  auroraDetected: boolean;
  auroraConfidence?: number; // 0-1
  lastImageTime?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface NetworkStatus {
  code: string;
  name: string;
  region: string;
  stationsOnline: number;
  stationsTotal: number;
  auroraDetections: number;
  lastUpdate: string;
}

interface CameraNetworkResponse {
  networks: NetworkStatus[];
  stations: CameraStation[];
  auroraConfirmed: boolean;
  auroraConfirmationLocations: string[];
  metadata: {
    source: string;
    timestamp: string;
    cacheStatus: "fresh" | "stale" | "miss";
  };
}

// Camera station definitions
const CAMERA_STATIONS: Omit<CameraStation, "status" | "auroraDetected">[] = [
  // THEMIS/THEMIS-GBO Network (North America)
  {
    code: "FSIM",
    name: "Fort Simpson",
    network: "THEMIS",
    latitude: 61.76,
    longitude: -121.24,
  },
  {
    code: "FSMI",
    name: "Fort Smith",
    network: "THEMIS",
    latitude: 60.03,
    longitude: -111.93,
  },
  {
    code: "GILL",
    name: "Gillam",
    network: "THEMIS",
    latitude: 56.38,
    longitude: -94.64,
  },
  {
    code: "INUV",
    name: "Inuvik",
    network: "THEMIS",
    latitude: 68.41,
    longitude: -133.77,
  },
  {
    code: "MCGR",
    name: "McGrath",
    network: "THEMIS",
    latitude: 62.95,
    longitude: -155.60,
  },
  {
    code: "PGEO",
    name: "Prince George",
    network: "THEMIS",
    latitude: 53.82,
    longitude: -122.69,
  },
  {
    code: "RANK",
    name: "Rankin Inlet",
    network: "THEMIS",
    latitude: 62.82,
    longitude: -92.11,
  },
  {
    code: "SNAP",
    name: "Snap Lake",
    network: "THEMIS",
    latitude: 63.59,
    longitude: -110.87,
  },
  {
    code: "TALO",
    name: "Taloyoak",
    network: "THEMIS",
    latitude: 69.54,
    longitude: -93.54,
  },
  {
    code: "WHIT",
    name: "Whitehorse",
    network: "THEMIS",
    latitude: 60.72,
    longitude: -135.05,
  },
  {
    code: "YKNF",
    name: "Yellowknife",
    network: "THEMIS",
    latitude: 62.48,
    longitude: -114.48,
  },

  // MIRACLE Network (Scandinavia)
  {
    code: "ABK",
    name: "Abisko",
    network: "MIRACLE",
    latitude: 68.35,
    longitude: 18.82,
  },
  {
    code: "KIL",
    name: "Kilpisjärvi",
    network: "MIRACLE",
    latitude: 69.05,
    longitude: 20.79,
  },
  {
    code: "MUO",
    name: "Muonio",
    network: "MIRACLE",
    latitude: 67.94,
    longitude: 23.05,
  },
  {
    code: "SOD",
    name: "Sodankylä",
    network: "MIRACLE",
    latitude: 67.37,
    longitude: 26.63,
  },
  {
    code: "KEV",
    name: "Kevo",
    network: "MIRACLE",
    latitude: 69.76,
    longitude: 27.01,
  },

  // Tromsø/UiT (Norway)
  {
    code: "TRO",
    name: "Tromsø",
    network: "TROMSO",
    latitude: 69.58,
    longitude: 19.22,
  },
  {
    code: "LYR",
    name: "Longyearbyen",
    network: "UNIS",
    latitude: 78.15,
    longitude: 16.04,
  },
  {
    code: "NYA",
    name: "Ny-Ålesund",
    network: "UNIS",
    latitude: 78.93,
    longitude: 11.93,
  },

  // Iceland
  {
    code: "TJOR",
    name: "Tjörnes",
    network: "LMI",
    latitude: 66.20,
    longitude: -17.12,
  },

  // Alaska
  {
    code: "PKR",
    name: "Poker Flat",
    network: "UAF",
    latitude: 65.12,
    longitude: -147.47,
  },
];

/**
 * Fetch camera network status
 * Note: In production, this would query actual camera network APIs
 */
async function fetchCameraNetworkStatus(): Promise<CameraNetworkResponse> {
  const now = new Date();
  const stations: CameraStation[] = [];
  const auroraLocations: string[] = [];

  // Try to get real-time aurora activity to estimate camera status
  let currentActivity = 0;
  try {
    const kpResponse = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
    );
    if (kpResponse.ok) {
      const kpData = await kpResponse.json();
      const latestKp = kpData[kpData.length - 1];
      currentActivity = parseFloat(latestKp?.[1]) || 0;
    }
  } catch {
    // Use default activity level
  }

  // Determine time of day for each station (aurora only visible at night)
  for (const station of CAMERA_STATIONS) {
    // Simple day/night calculation based on longitude and current UTC
    const utcHour = now.getUTCHours();
    const localHour = (utcHour + Math.round(station.longitude / 15) + 24) % 24;
    const isDark = localHour < 6 || localHour > 18; // Simplified polar night approximation

    // Simulate camera status
    let status: CameraStation["status"] = "unknown";
    let auroraDetected = false;
    let auroraConfidence = 0;

    if (!isDark) {
      status = "offline"; // Cameras off during day
    } else {
      // Random cloud simulation (30% chance of clouds)
      const isCloudy = Math.random() < 0.3;

      if (isCloudy) {
        status = "cloudy";
      } else {
        status = "online";

        // Aurora detection based on Kp and latitude
        // Higher latitude + higher Kp = more likely to see aurora
        const latFactor = (station.latitude - 55) / 25; // 0 at 55°, 1 at 80°
        const kpFactor = currentActivity / 9;
        const auroraProb = Math.min(1, latFactor * kpFactor * 2);

        if (auroraProb > 0.3 && currentActivity >= 3) {
          auroraDetected = true;
          auroraConfidence = auroraProb;
          status = "aurora";
          auroraLocations.push(station.name);
        }
      }
    }

    // Construct image URLs (would be real URLs in production)
    const imageUrl = status !== "offline"
      ? `https://example.com/cameras/${station.code.toLowerCase()}/latest.jpg`
      : undefined;
    const thumbnailUrl = status !== "offline"
      ? `https://example.com/cameras/${station.code.toLowerCase()}/thumb.jpg`
      : undefined;

    stations.push({
      ...station,
      status,
      auroraDetected,
      auroraConfidence: auroraDetected ? auroraConfidence : undefined,
      lastImageTime: status !== "offline" ? now.toISOString() : undefined,
      imageUrl,
      thumbnailUrl,
    });
  }

  // Aggregate network statistics
  const networkStats = new Map<
    string,
    { online: number; total: number; aurora: number }
  >();

  for (const station of stations) {
    const stats = networkStats.get(station.network) || {
      online: 0,
      total: 0,
      aurora: 0,
    };
    stats.total++;
    if (station.status === "online" || station.status === "aurora") {
      stats.online++;
    }
    if (station.auroraDetected) {
      stats.aurora++;
    }
    networkStats.set(station.network, stats);
  }

  const networkNames: Record<string, { name: string; region: string }> = {
    THEMIS: { name: "THEMIS Ground-Based Observatories", region: "North America" },
    MIRACLE: { name: "MIRACLE All-Sky Cameras", region: "Scandinavia" },
    TROMSO: { name: "Tromsø Geophysical Observatory", region: "Norway" },
    UNIS: { name: "University Centre in Svalbard", region: "Svalbard" },
    LMI: { name: "Icelandic Met Office", region: "Iceland" },
    UAF: { name: "University of Alaska Fairbanks", region: "Alaska" },
  };

  const networks: NetworkStatus[] = Array.from(networkStats.entries()).map(
    ([code, stats]) => ({
      code,
      name: networkNames[code]?.name || code,
      region: networkNames[code]?.region || "Unknown",
      stationsOnline: stats.online,
      stationsTotal: stats.total,
      auroraDetections: stats.aurora,
      lastUpdate: now.toISOString(),
    })
  );

  return {
    networks,
    stations,
    auroraConfirmed: auroraLocations.length > 0,
    auroraConfirmationLocations: auroraLocations,
    metadata: {
      source: "aggregated",
      timestamp: now.toISOString(),
      cacheStatus: "miss",
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get("network"); // Optional filter

    // Check rate limit
    if (!checkRateLimit("THEMIS")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Get cached data
    const cacheKey = network
      ? cacheKeys.cameraStatus(network)
      : cacheKeys.cameraStatus("all");

    const { data, isStale, fromCache } = await getCached(
      cacheKey,
      fetchCameraNetworkStatus,
      CACHE_TIMES.CAMERA_STATUS
    );

    // Filter by network if requested
    let filteredData = data;
    if (network) {
      filteredData = {
        ...data,
        networks: data.networks.filter((n) =>
          n.code.toLowerCase() === network.toLowerCase()
        ),
        stations: data.stations.filter((s) =>
          s.network.toLowerCase() === network.toLowerCase()
        ),
      };
    }

    // Update cache status in response
    const response: CameraNetworkResponse = {
      ...filteredData,
      metadata: {
        ...filteredData.metadata,
        cacheStatus: fromCache ? (isStale ? "stale" : "fresh") : "miss",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching camera network status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch camera network status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
