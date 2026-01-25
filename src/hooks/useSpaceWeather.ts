"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Space Weather Data Hook
 *
 * Provides real-time space weather data with automatic polling and caching.
 * Consolidates API calls for efficient data fetching.
 */

// Data types
export interface KpIndexData {
  current: number;
  forecast: number[];
  history: Array<{ time: string; kp: number }>;
  trend: "rising" | "falling" | "stable";
}

export interface HpIndexData {
  hp30: number;
  hp60: number;
  timestamp: string;
  kpComparison?: {
    currentKp: number;
    hp30DiffersSignificantly: boolean;
    warning: string | null;
  };
}

export interface SolarWindData {
  speed: number; // km/s
  density: number; // particles/cm³
  temperature: number; // K
  bz: number; // nT
  by: number; // nT
  bt: number; // nT
  timestamp: string;
}

export interface MagnetometerData {
  stations: Array<{
    code: string;
    name: string;
    deltaB: number;
    latitude: number;
    longitude: number;
    substormIndicator: string;
  }>;
  substorm: {
    isActive: boolean;
    phase: string;
    peakDeltaB: number;
    confidence: number;
    description: string;
  };
}

export interface CameraNetworkData {
  auroraConfirmed: boolean;
  confirmationLocations: string[];
  networks: Array<{
    code: string;
    name: string;
    stationsOnline: number;
    auroraDetections: number;
  }>;
}

export interface ForecastData {
  forecasts: Array<{
    date: string;
    dayOfWeek: string;
    kpExpected: number;
    auroraLikelihood: string;
    auroraDescription: string;
  }>;
  summary: {
    bestDay: string;
    bestDayReason: string;
    overallOutlook: string;
    tripRecommendation: string;
  };
  alerts: string[];
}

export interface SpaceWeatherState {
  kpIndex: KpIndexData | null;
  hpIndex: HpIndexData | null;
  solarWind: SolarWindData | null;
  magnetometer: MagnetometerData | null;
  cameraNetwork: CameraNetworkData | null;
  forecast3Day: ForecastData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseSpaceWeatherOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  enableHpIndex?: boolean;
  enableMagnetometer?: boolean;
  enableCameras?: boolean;
  enableForecast?: boolean;
}

const DEFAULT_OPTIONS: UseSpaceWeatherOptions = {
  autoRefresh: true,
  refreshInterval: 60000, // 1 minute
  enableHpIndex: true,
  enableMagnetometer: true,
  enableCameras: false, // Off by default (lower priority)
  enableForecast: false, // Off by default (less frequent updates needed)
};

/**
 * Custom hook for fetching and managing space weather data
 */
export function useSpaceWeather(options: UseSpaceWeatherOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<SpaceWeatherState>({
    kpIndex: null,
    hpIndex: null,
    solarWind: null,
    magnetometer: null,
    cameraNetwork: null,
    forecast3Day: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  /**
   * Fetch Kp index data
   */
  const fetchKpIndex = useCallback(async (): Promise<KpIndexData | null> => {
    try {
      const response = await fetch("/api/space-weather/kp-index");
      if (!response.ok) throw new Error("Failed to fetch Kp index");

      const data = await response.json();

      // Process NOAA Kp forecast data
      // Format: [time_tag, kp, ...]
      if (Array.isArray(data) && data.length > 1) {
        const entries = data.slice(1); // Skip header
        const current = parseFloat(entries[entries.length - 1]?.[1]) || 0;

        const history = entries.slice(-24).map((entry: string[]) => ({
          time: entry[0],
          kp: parseFloat(entry[1]) || 0,
        }));

        const forecast = entries.slice(-8).map((entry: string[]) =>
          parseFloat(entry[1]) || 0
        );

        // Determine trend
        const recentKp = history.slice(-4).map((h) => h.kp);
        const avgRecent = recentKp.reduce((a, b) => a + b, 0) / recentKp.length;
        const olderKp = history.slice(-8, -4).map((h) => h.kp);
        const avgOlder = olderKp.length > 0
          ? olderKp.reduce((a, b) => a + b, 0) / olderKp.length
          : avgRecent;

        const trend: KpIndexData["trend"] =
          avgRecent > avgOlder + 0.5 ? "rising" :
          avgRecent < avgOlder - 0.5 ? "falling" : "stable";

        return { current, forecast, history, trend };
      }

      return null;
    } catch (error) {
      console.error("Error fetching Kp index:", error);
      return null;
    }
  }, []);

  /**
   * Fetch Hp30/Hp60 index data
   */
  const fetchHpIndex = useCallback(async (): Promise<HpIndexData | null> => {
    try {
      const response = await fetch("/api/space-weather/hp-index");
      if (!response.ok) throw new Error("Failed to fetch Hp index");

      const data = await response.json();

      return {
        hp30: data.current?.hp30 || 0,
        hp60: data.current?.hp60 || 0,
        timestamp: data.current?.timestamp || new Date().toISOString(),
        kpComparison: data.kpComparison,
      };
    } catch (error) {
      console.error("Error fetching Hp index:", error);
      return null;
    }
  }, []);

  /**
   * Fetch solar wind data
   */
  const fetchSolarWind = useCallback(async (): Promise<SolarWindData | null> => {
    try {
      const response = await fetch("/api/space-weather/solar-wind");
      if (!response.ok) throw new Error("Failed to fetch solar wind");

      const data = await response.json();

      // Process NOAA solar wind data
      if (Array.isArray(data) && data.length > 1) {
        const latest = data[data.length - 1];
        return {
          speed: parseFloat(latest[2]) || 0,
          density: parseFloat(latest[1]) || 0,
          temperature: parseFloat(latest[3]) || 0,
          bz: parseFloat(latest[6]) || 0,
          by: parseFloat(latest[5]) || 0,
          bt: Math.sqrt(
            Math.pow(parseFloat(latest[4]) || 0, 2) +
            Math.pow(parseFloat(latest[5]) || 0, 2) +
            Math.pow(parseFloat(latest[6]) || 0, 2)
          ),
          timestamp: latest[0],
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching solar wind:", error);
      return null;
    }
  }, []);

  /**
   * Fetch magnetometer data
   */
  const fetchMagnetometer = useCallback(async (): Promise<MagnetometerData | null> => {
    try {
      const response = await fetch("/api/space-weather/supermag");
      if (!response.ok) throw new Error("Failed to fetch magnetometer data");

      const data = await response.json();

      return {
        stations: data.stations || [],
        substorm: data.substorm || {
          isActive: false,
          phase: "quiet",
          peakDeltaB: 0,
          confidence: 0,
          description: "No substorm activity",
        },
      };
    } catch (error) {
      console.error("Error fetching magnetometer data:", error);
      return null;
    }
  }, []);

  /**
   * Fetch camera network status
   */
  const fetchCameraNetwork = useCallback(async (): Promise<CameraNetworkData | null> => {
    try {
      const response = await fetch("/api/cameras/network-status");
      if (!response.ok) throw new Error("Failed to fetch camera status");

      const data = await response.json();

      return {
        auroraConfirmed: data.auroraConfirmed || false,
        confirmationLocations: data.auroraConfirmationLocations || [],
        networks: data.networks || [],
      };
    } catch (error) {
      console.error("Error fetching camera network:", error);
      return null;
    }
  }, []);

  /**
   * Fetch 3-day forecast
   */
  const fetchForecast = useCallback(async (): Promise<ForecastData | null> => {
    try {
      const response = await fetch("/api/space-weather/forecast-3day");
      if (!response.ok) throw new Error("Failed to fetch forecast");

      const data = await response.json();

      return {
        forecasts: data.forecasts || [],
        summary: data.summary || {
          bestDay: "",
          bestDayReason: "",
          overallOutlook: "Unknown",
          tripRecommendation: "",
        },
        alerts: data.alerts || [],
      };
    } catch (error) {
      console.error("Error fetching forecast:", error);
      return null;
    }
  }, []);

  /**
   * Fetch all data
   */
  const fetchAllData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch core data in parallel
      const [kpIndex, solarWind] = await Promise.all([
        fetchKpIndex(),
        fetchSolarWind(),
      ]);

      // Fetch optional data based on options
      const [hpIndex, magnetometer, cameraNetwork, forecast3Day] = await Promise.all([
        opts.enableHpIndex ? fetchHpIndex() : Promise.resolve(null),
        opts.enableMagnetometer ? fetchMagnetometer() : Promise.resolve(null),
        opts.enableCameras ? fetchCameraNetwork() : Promise.resolve(null),
        opts.enableForecast ? fetchForecast() : Promise.resolve(null),
      ]);

      if (mountedRef.current) {
        setState({
          kpIndex,
          hpIndex,
          solarWind,
          magnetometer,
          cameraNetwork,
          forecast3Day,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch data",
        }));
      }
    }
  }, [
    fetchKpIndex,
    fetchSolarWind,
    fetchHpIndex,
    fetchMagnetometer,
    fetchCameraNetwork,
    fetchForecast,
    opts.enableHpIndex,
    opts.enableMagnetometer,
    opts.enableCameras,
    opts.enableForecast,
  ]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    mountedRef.current = true;
    fetchAllData();

    if (opts.autoRefresh && opts.refreshInterval) {
      intervalRef.current = setInterval(fetchAllData, opts.refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData, opts.autoRefresh, opts.refreshInterval]);

  return {
    ...state,
    refresh,
    isStale: state.lastUpdated
      ? Date.now() - state.lastUpdated.getTime() > (opts.refreshInterval || 60000) * 2
      : false,
  };
}

/**
 * Simplified hook for just Kp index
 */
export function useKpIndex(refreshInterval = 60000) {
  const [kp, setKp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchKp = async () => {
      try {
        const response = await fetch("/api/space-weather/kp-index");
        if (!response.ok) return;

        const data = await response.json();
        if (Array.isArray(data) && data.length > 1) {
          const latest = data[data.length - 1];
          if (mounted) {
            setKp(parseFloat(latest[1]) || 0);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching Kp:", error);
      }
    };

    fetchKp();
    const interval = setInterval(fetchKp, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { kp, isLoading };
}

/**
 * Hook for live sightings
 */
export function useLiveSightings(refreshInterval = 30000) {
  const [sightings, setSightings] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    intensity: number;
    cityName: string | null;
    minutesAgo: number;
    user: { name: string | null; image: string | null } | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSightings = async () => {
      try {
        const response = await fetch("/api/sightings/live");
        if (!response.ok) return;

        const data = await response.json();
        if (mounted) {
          setSightings(data.sightings || []);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching live sightings:", error);
      }
    };

    fetchSightings();
    const interval = setInterval(fetchSightings, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { sightings, isLoading, count: sightings.length };
}

export default useSpaceWeather;
