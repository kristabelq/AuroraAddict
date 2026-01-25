/**
 * Space Weather Caching Layer
 * Provides stale-while-revalidate caching for external space weather APIs
 * Uses in-memory cache with optional Redis/Upstash support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTime: number;
  maxAge: number;
}

interface CacheOptions {
  staleTime: number; // Time in ms before data is considered stale
  maxAge: number; // Time in ms before data is completely expired
  key: string;
}

// In-memory cache store
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Rate limiting tracking
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// Default cache times for different data sources
export const CACHE_TIMES = {
  KP_INDEX: { staleTime: 5 * 60 * 1000, maxAge: 15 * 60 * 1000 }, // 5min stale, 15min max
  HP_INDEX: { staleTime: 10 * 60 * 1000, maxAge: 30 * 60 * 1000 }, // 10min stale, 30min max
  SOLAR_WIND: { staleTime: 1 * 60 * 1000, maxAge: 5 * 60 * 1000 }, // 1min stale, 5min max
  MAGNETOMETER: { staleTime: 1 * 60 * 1000, maxAge: 3 * 60 * 1000 }, // 1min stale, 3min max
  SUPERMAG: { staleTime: 2 * 60 * 1000, maxAge: 5 * 60 * 1000 }, // 2min stale, 5min max
  OVATION: { staleTime: 5 * 60 * 1000, maxAge: 15 * 60 * 1000 }, // 5min stale, 15min max
  CAMERA_STATUS: { staleTime: 1 * 60 * 1000, maxAge: 5 * 60 * 1000 }, // 1min stale, 5min max
  FORECAST_3DAY: { staleTime: 60 * 60 * 1000, maxAge: 3 * 60 * 60 * 1000 }, // 1hr stale, 3hr max
  CME_EVENTS: { staleTime: 15 * 60 * 1000, maxAge: 60 * 60 * 1000 }, // 15min stale, 1hr max
  HSS_EVENTS: { staleTime: 30 * 60 * 1000, maxAge: 2 * 60 * 60 * 1000 }, // 30min stale, 2hr max
} as const;

// Rate limits per API (requests per minute)
export const RATE_LIMITS = {
  NOAA: 60,
  GFZ: 30,
  SUPERMAG: 20,
  NASA: 30,
  THEMIS: 60,
} as const;

type RateLimitKey = keyof typeof RATE_LIMITS;

/**
 * Check if rate limit has been exceeded
 */
export function checkRateLimit(apiName: RateLimitKey): boolean {
  const now = Date.now();
  const tracker = rateLimitTracker.get(apiName);
  const limit = RATE_LIMITS[apiName];

  if (!tracker || now > tracker.resetTime) {
    rateLimitTracker.set(apiName, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (tracker.count >= limit) {
    return false;
  }

  tracker.count++;
  return true;
}

/**
 * Get remaining rate limit
 */
export function getRateLimitRemaining(apiName: RateLimitKey): number {
  const tracker = rateLimitTracker.get(apiName);
  if (!tracker || Date.now() > tracker.resetTime) {
    return RATE_LIMITS[apiName];
  }
  return Math.max(0, RATE_LIMITS[apiName] - tracker.count);
}

/**
 * Get cached data with stale-while-revalidate pattern
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Omit<CacheOptions, 'key'>
): Promise<{ data: T; isStale: boolean; fromCache: boolean }> {
  const now = Date.now();
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;

  // Check if we have valid cached data
  if (cached) {
    const age = now - cached.timestamp;

    // Data is fresh
    if (age < cached.staleTime) {
      return { data: cached.data, isStale: false, fromCache: true };
    }

    // Data is stale but not expired - return stale data and revalidate in background
    if (age < cached.maxAge) {
      // Trigger background revalidation (fire and forget)
      revalidateInBackground(key, fetcher, options);
      return { data: cached.data, isStale: true, fromCache: true };
    }
  }

  // No valid cache - fetch fresh data
  const data = await fetcher();
  setCached(key, data, options);
  return { data, isStale: false, fromCache: false };
}

/**
 * Set cached data
 */
export function setCached<T>(
  key: string,
  data: T,
  options: Omit<CacheOptions, 'key'>
): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    staleTime: options.staleTime,
    maxAge: options.maxAge,
  });
}

/**
 * Invalidate cached data
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  memoryCache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  entries: number;
  keys: string[];
  memoryUsage: string;
} {
  return {
    entries: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
    memoryUsage: `~${Math.round(JSON.stringify([...memoryCache.entries()]).length / 1024)}KB`,
  };
}

// Background revalidation tracking to prevent duplicate fetches
const revalidationInProgress = new Set<string>();

/**
 * Revalidate cache in background (stale-while-revalidate)
 */
async function revalidateInBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: Omit<CacheOptions, 'key'>
): Promise<void> {
  // Prevent duplicate revalidation
  if (revalidationInProgress.has(key)) {
    return;
  }

  revalidationInProgress.add(key);

  try {
    const data = await fetcher();
    setCached(key, data, options);
  } catch (error) {
    console.error(`Background revalidation failed for ${key}:`, error);
    // Keep stale data on failure
  } finally {
    revalidationInProgress.delete(key);
  }
}

/**
 * Cache key generators for consistent key naming
 */
export const cacheKeys = {
  kpIndex: () => 'space-weather:kp-index',
  kpForecast: () => 'space-weather:kp-forecast',
  hpIndex: () => 'space-weather:hp-index',
  solarWind: () => 'space-weather:solar-wind',
  solarWindMag: () => 'space-weather:solar-wind-mag',
  magnetometer: (station: string) => `space-weather:magnetometer:${station}`,
  supermag: (chain: string) => `space-weather:supermag:${chain}`,
  supermagAll: () => 'space-weather:supermag:all',
  ovation: (hemisphere: 'north' | 'south') => `space-weather:ovation:${hemisphere}`,
  cameraStatus: (network: string) => `space-weather:cameras:${network}`,
  forecast3Day: () => 'space-weather:forecast-3day',
  cmeEvents: () => 'space-weather:cme-events',
  hssEvents: () => 'space-weather:hss-events',
  substormState: () => 'space-weather:substorm-state',
  hemispherePower: () => 'space-weather:hemisphere-power',
} as const;

/**
 * Wrapper for NOAA API calls with caching and rate limiting
 */
export async function fetchNOAACached<T>(
  endpoint: string,
  cacheKey: string,
  cacheConfig: { staleTime: number; maxAge: number }
): Promise<{ data: T; isStale: boolean; fromCache: boolean }> {
  return getCached<T>(
    cacheKey,
    async () => {
      if (!checkRateLimit('NOAA')) {
        throw new Error('NOAA rate limit exceeded');
      }

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: Math.floor(cacheConfig.staleTime / 1000) },
      });

      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }

      return response.json();
    },
    cacheConfig
  );
}

/**
 * Wrapper for GFZ API calls with caching and rate limiting
 */
export async function fetchGFZCached<T>(
  endpoint: string,
  cacheKey: string,
  cacheConfig: { staleTime: number; maxAge: number }
): Promise<{ data: T; isStale: boolean; fromCache: boolean }> {
  return getCached<T>(
    cacheKey,
    async () => {
      if (!checkRateLimit('GFZ')) {
        throw new Error('GFZ rate limit exceeded');
      }

      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: Math.floor(cacheConfig.staleTime / 1000) },
      });

      if (!response.ok) {
        throw new Error(`GFZ API error: ${response.status}`);
      }

      return response.json();
    },
    cacheConfig
  );
}

/**
 * Wrapper for SuperMAG API calls with caching and rate limiting
 */
export async function fetchSuperMAGCached<T>(
  endpoint: string,
  cacheKey: string,
  cacheConfig: { staleTime: number; maxAge: number },
  apiKey?: string
): Promise<{ data: T; isStale: boolean; fromCache: boolean }> {
  return getCached<T>(
    cacheKey,
    async () => {
      if (!checkRateLimit('SUPERMAG')) {
        throw new Error('SuperMAG rate limit exceeded');
      }

      const url = apiKey ? `${endpoint}&logon=${apiKey}` : endpoint;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: Math.floor(cacheConfig.staleTime / 1000) },
      });

      if (!response.ok) {
        throw new Error(`SuperMAG API error: ${response.status}`);
      }

      return response.json();
    },
    cacheConfig
  );
}

/**
 * Graceful degradation - return last known good data on API failure
 */
export function getLastKnownGood<T>(key: string): T | null {
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  return cached?.data ?? null;
}

/**
 * Pre-warm cache with initial data
 */
export function preWarmCache<T>(
  key: string,
  data: T,
  options: Omit<CacheOptions, 'key'>
): void {
  setCached(key, data, options);
}

export type { CacheEntry, CacheOptions };
