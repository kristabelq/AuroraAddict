import { NextResponse } from "next/server";
import {
  getCached,
  cacheKeys,
  CACHE_TIMES,
  checkRateLimit,
} from "@/lib/cache/spaceWeatherCache";

/**
 * 3-Day Aurora Forecast API
 *
 * Provides extended aurora forecasts for trip planning.
 * Sources:
 * - NOAA 3-day geomagnetic forecast
 * - GFZ Helmholtz Centre geomagnetic forecast
 *
 * Returns daily forecast with confidence levels and best viewing windows.
 */

interface DailyForecast {
  date: string; // ISO date
  dayOfWeek: string;

  // Kp predictions
  kpExpected: number;
  kpMin: number;
  kpMax: number;
  kpConfidence: number; // 0-1

  // Aurora conditions
  auroraLikelihood: "very_unlikely" | "unlikely" | "possible" | "likely" | "very_likely";
  auroraDescription: string;

  // Visibility at different latitudes
  visibleAtLatitude: {
    latitude: number;
    location: string;
    probability: number;
  }[];

  // Best viewing window (hour range in UTC)
  bestViewingWindow?: {
    startHour: number;
    endHour: number;
    quality: "poor" | "fair" | "good" | "excellent";
  };

  // Contributing factors
  factors: {
    cmeExpected: boolean;
    hssExpected: boolean;
    solarFlareRisk: "low" | "moderate" | "high";
    recurrentActivity: boolean;
  };
}

interface ThreeDayForecastResponse {
  forecasts: DailyForecast[];
  summary: {
    bestDay: string;
    bestDayReason: string;
    overallOutlook: string;
    tripRecommendation: string;
  };
  alerts: string[];
  metadata: {
    source: string;
    generatedAt: string;
    validUntil: string;
    cacheStatus: "fresh" | "stale" | "miss";
  };
}

// Reference latitudes for visibility predictions
const REFERENCE_LATITUDES = [
  { latitude: 70, location: "Northern Norway/Alaska" },
  { latitude: 65, location: "Iceland/Northern Finland" },
  { latitude: 60, location: "Southern Norway/Scotland" },
  { latitude: 55, location: "Northern UK/Denmark" },
  { latitude: 50, location: "Central Europe/Northern US" },
  { latitude: 45, location: "Southern Europe/Central US" },
];

/**
 * Fetch 3-day geomagnetic forecast
 */
async function fetchThreeDayForecast(): Promise<ThreeDayForecastResponse> {
  const now = new Date();
  const forecasts: DailyForecast[] = [];
  const alerts: string[] = [];

  // Fetch NOAA 3-day forecast
  let noaaForecast: { date: string; kp: number }[] = [];

  try {
    const response = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AuroraAddict/1.0",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      // NOAA format: [time_tag, kp_value, ...]
      noaaForecast = data
        .slice(1) // Skip header
        .map((row: string[]) => ({
          date: row[0],
          kp: parseFloat(row[1]) || 0,
        }));
    }
  } catch (error) {
    console.warn("Failed to fetch NOAA forecast:", error);
  }

  // Check for Earth-directed CMEs using NASA DONKI API
  let cmeExpected = false;
  let hssExpected = false;

  try {
    // Fetch CME data from NASA DONKI - only Earth-directed CMEs matter
    const startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const cmeResponse = await fetch(
      `https://api.nasa.gov/DONKI/CMEAnalysis?startDate=${startDate}&endDate=${endDate}&mostAccurateOnly=true&completeEntryOnly=true&api_key=DEMO_KEY`
    );

    if (cmeResponse.ok) {
      const cmeData = await cmeResponse.json();

      // Filter for Earth-directed CMEs with significant impact
      const earthDirectedCMEs = cmeData.filter((cme: {
        isMostAccurate: boolean;
        halfAngle?: number;
        speed?: number;
        latitude?: number;
        longitude?: number;
      }) => {
        // Earth is at longitude 0° by definition (Sun-Earth line)
        // A CME hits Earth if Earth is within its angular cone
        const cmeLongitude = cme.longitude ?? 0;
        const cmeHalfAngle = cme.halfAngle ?? 0;

        // Earth is within CME cone if |longitude| < halfAngle
        // Add 15° buffer for uncertainty in measurements
        const isEarthInCone = Math.abs(cmeLongitude) <= (cmeHalfAngle + 15);

        // CME must be near the ecliptic plane (Earth's orbital plane)
        const isNearEcliptic = cme.latitude !== undefined && Math.abs(cme.latitude) < 30;

        // CME needs sufficient speed to cause geomagnetic impact
        // Slow CMEs (<400 km/s) rarely cause significant storms
        const isSignificant = cme.speed && cme.speed > 400;

        // Halo CMEs (halfAngle >= 90°) directed at Earth are most impactful
        const isHalo = cmeHalfAngle >= 60;

        // Earth-directed if: within cone AND near ecliptic AND fast enough
        // OR if it's a halo CME (very wide) near the ecliptic
        return (isEarthInCone || isHalo) && isNearEcliptic && isSignificant;
      });

      if (earthDirectedCMEs.length > 0) {
        cmeExpected = true;
        const fastestCME = earthDirectedCMEs.reduce(
          (fastest: { speed?: number; longitude?: number; halfAngle?: number }, cme: { speed?: number; longitude?: number; halfAngle?: number }) =>
            (cme.speed || 0) > (fastest.speed || 0) ? cme : fastest
        );
        const speed = fastestCME.speed || 0;
        const longitude = fastestCME.longitude ?? 0;
        const halfAngle = fastestCME.halfAngle ?? 0;
        const isHalo = halfAngle >= 60;
        const cmeType = isHalo ? "Halo CME" : "CME";
        const directionInfo = `lon: ${longitude > 0 ? "+" : ""}${longitude.toFixed(0)}°, width: ${halfAngle.toFixed(0)}°`;

        if (speed > 1000) {
          alerts.push(`Fast Earth-directed ${cmeType} detected (${speed} km/s, ${directionInfo}) - Strong geomagnetic storm possible`);
        } else if (speed > 700) {
          alerts.push(`Earth-directed ${cmeType} detected (${speed} km/s, ${directionInfo}) - Moderate geomagnetic activity expected`);
        } else {
          alerts.push(`Earth-directed ${cmeType} detected (${speed} km/s, ${directionInfo}) - Minor geomagnetic activity possible`);
        }
      }
    }

    // Check for High-Speed Streams from coronal holes
    const hssResponse = await fetch(
      `https://api.nasa.gov/DONKI/HSS?startDate=${startDate}&endDate=${endDate}&api_key=DEMO_KEY`
    );

    if (hssResponse.ok) {
      const hssData = await hssResponse.json();

      // Filter for HSS that will arrive in next 3 days
      const upcomingHSS = hssData.filter((hss: { eventTime: string }) => {
        const eventTime = new Date(hss.eventTime);
        return eventTime >= now && eventTime <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      });

      if (upcomingHSS.length > 0) {
        hssExpected = true;
        alerts.push("High-Speed Stream from coronal hole expected - Sustained elevated activity possible");
      }
    }
  } catch (error) {
    console.warn("Failed to fetch CME/HSS data from NASA DONKI:", error);
    // Fallback to NOAA alerts but be more conservative
    try {
      const alertsResponse = await fetch(
        "https://services.swpc.noaa.gov/products/alerts.json"
      );

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        for (const alert of alertsData.slice(-5)) {
          const message = alert.message?.toLowerCase() || "";
          // Only alert on explicit geomagnetic storm warnings, not just CME mentions
          if (message.includes("geomagnetic storm watch") || message.includes("geomagnetic storm warning")) {
            if (message.includes("g3") || message.includes("g4") || message.includes("g5")) {
              cmeExpected = true;
              alerts.push("NOAA Geomagnetic Storm Watch in effect");
            }
          }
          if (message.includes("high speed stream") && message.includes("expected")) {
            hssExpected = true;
            alerts.push("High-Speed Stream expected");
          }
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }

  // Generate 3-day forecast
  for (let day = 0; day < 3; day++) {
    const forecastDate = new Date(now);
    forecastDate.setDate(forecastDate.getDate() + day);
    forecastDate.setHours(0, 0, 0, 0);

    const dateStr = forecastDate.toISOString().split("T")[0];
    const dayOfWeek = forecastDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Get Kp predictions for this day from NOAA data
    const dayPredictions = noaaForecast.filter((f) =>
      f.date.startsWith(dateStr)
    );

    let kpExpected = 2;
    let kpMin = 1;
    let kpMax = 3;

    if (dayPredictions.length > 0) {
      const kpValues = dayPredictions.map((p) => p.kp);
      kpExpected = Math.round(kpValues.reduce((a, b) => a + b) / kpValues.length * 10) / 10;
      kpMin = Math.min(...kpValues);
      kpMax = Math.max(...kpValues);
    } else {
      // Fallback: decay from current conditions
      kpExpected = Math.max(1, 3 - day * 0.5);
      kpMin = Math.max(0, kpExpected - 1);
      kpMax = kpExpected + 2;
    }

    // Adjust for expected events
    if (cmeExpected && day >= 1 && day <= 2) {
      kpExpected = Math.min(9, kpExpected + 2);
      kpMax = Math.min(9, kpMax + 3);
    }

    if (hssExpected && day >= 0 && day <= 2) {
      kpExpected = Math.min(9, kpExpected + 1);
      kpMax = Math.min(9, kpMax + 2);
    }

    // Calculate confidence (decreases with forecast horizon)
    const kpConfidence = Math.max(0.3, 0.9 - day * 0.2);

    // Determine aurora likelihood
    let auroraLikelihood: DailyForecast["auroraLikelihood"];
    let auroraDescription: string;

    if (kpExpected >= 6) {
      auroraLikelihood = "very_likely";
      auroraDescription = "Strong geomagnetic storm expected. Aurora visible at mid-latitudes.";
    } else if (kpExpected >= 5) {
      auroraLikelihood = "likely";
      auroraDescription = "Moderate storm conditions. Good aurora viewing at high latitudes.";
    } else if (kpExpected >= 4) {
      auroraLikelihood = "possible";
      auroraDescription = "Unsettled conditions. Aurora possible at auroral latitudes.";
    } else if (kpExpected >= 3) {
      auroraLikelihood = "unlikely";
      auroraDescription = "Quiet to unsettled. Weak aurora possible near the auroral oval.";
    } else {
      auroraLikelihood = "very_unlikely";
      auroraDescription = "Geomagnetically quiet. Aurora limited to far north.";
    }

    // Calculate visibility at different latitudes
    const visibleAtLatitude = REFERENCE_LATITUDES.map((ref) => {
      // Probability based on Kp and latitude
      // Higher Kp = aurora visible at lower latitudes
      const minVisibleLat = 67 - 2.5 * kpExpected;
      let probability = 0;

      if (ref.latitude >= minVisibleLat + 5) {
        probability = Math.min(100, 50 + (kpExpected - 3) * 15);
      } else if (ref.latitude >= minVisibleLat) {
        probability = Math.min(100, 20 + (kpExpected - 3) * 10);
      } else if (ref.latitude >= minVisibleLat - 5) {
        probability = Math.max(0, (kpExpected - 4) * 10);
      }

      return {
        latitude: ref.latitude,
        location: ref.location,
        probability: Math.round(probability),
      };
    });

    // Best viewing window (typically 10 PM - 2 AM local, but simplified to UTC)
    let bestViewingWindow: DailyForecast["bestViewingWindow"] | undefined;
    if (kpExpected >= 3) {
      bestViewingWindow = {
        startHour: 21,
        endHour: 3,
        quality: kpExpected >= 6 ? "excellent" : kpExpected >= 5 ? "good" : kpExpected >= 4 ? "fair" : "poor",
      };
    }

    // Solar flare risk (simplified)
    const solarFlareRisk: "low" | "moderate" | "high" =
      kpMax >= 7 ? "high" : kpMax >= 5 ? "moderate" : "low";

    forecasts.push({
      date: dateStr,
      dayOfWeek,
      kpExpected,
      kpMin,
      kpMax,
      kpConfidence,
      auroraLikelihood,
      auroraDescription,
      visibleAtLatitude,
      bestViewingWindow,
      factors: {
        cmeExpected: cmeExpected && day >= 1 && day <= 2,
        hssExpected: hssExpected && day >= 0 && day <= 2,
        solarFlareRisk,
        recurrentActivity: false, // Would need solar rotation period tracking
      },
    });
  }

  // Generate summary
  const bestForecast = forecasts.reduce((best, current) =>
    current.kpExpected > best.kpExpected ? current : best
  );

  const bestDay = bestForecast.date;
  let bestDayReason = `${bestForecast.dayOfWeek} has the highest expected Kp (${bestForecast.kpExpected})`;
  if (bestForecast.factors.cmeExpected) {
    bestDayReason += " due to incoming CME";
  } else if (bestForecast.factors.hssExpected) {
    bestDayReason += " due to high-speed solar wind stream";
  }

  const avgKp = forecasts.reduce((sum, f) => sum + f.kpExpected, 0) / forecasts.length;
  let overallOutlook: string;
  if (avgKp >= 5) {
    overallOutlook = "Excellent aurora viewing conditions expected over the next 3 days";
  } else if (avgKp >= 4) {
    overallOutlook = "Good aurora viewing opportunities, especially at high latitudes";
  } else if (avgKp >= 3) {
    overallOutlook = "Moderate aurora activity possible at auroral latitudes";
  } else {
    overallOutlook = "Quiet geomagnetic conditions; aurora limited to far north";
  }

  let tripRecommendation: string;
  if (avgKp >= 4) {
    tripRecommendation = "Great time for an aurora trip! Book accommodations in the auroral zone.";
  } else if (avgKp >= 3) {
    tripRecommendation = "Fair conditions for aurora hunting. Consider locations above 65°N.";
  } else {
    tripRecommendation = "Conditions are quiet. Best to wait for increased activity or travel far north.";
  }

  return {
    forecasts,
    summary: {
      bestDay,
      bestDayReason,
      overallOutlook,
      tripRecommendation,
    },
    alerts,
    metadata: {
      source: "noaa-aggregated",
      generatedAt: now.toISOString(),
      validUntil: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      cacheStatus: "miss",
    },
  };
}

export async function GET() {
  try {
    // Check rate limit
    if (!checkRateLimit("NOAA")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Get cached data
    const { data, isStale, fromCache } = await getCached(
      cacheKeys.forecast3Day(),
      fetchThreeDayForecast,
      CACHE_TIMES.FORECAST_3DAY
    );

    // Update cache status in response
    const response: ThreeDayForecastResponse = {
      ...data,
      metadata: {
        ...data.metadata,
        cacheStatus: fromCache ? (isStale ? "stale" : "fresh") : "miss",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Error fetching 3-day forecast:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch 3-day forecast",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
