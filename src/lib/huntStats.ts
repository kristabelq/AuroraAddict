/**
 * Hunt Statistics Utility Functions
 *
 * Provides functions to calculate and cache hunt success rates and statistics.
 * Success rate = (nights with sightings / total nights) × 100
 *
 * Usage:
 * - Call recalculateHuntSuccessRate(huntId) when sighting posted or hunt completes
 * - Call recalculateSuccessRatesForHunts(huntIds) for batch processing
 */

import { prisma } from './prisma';

/**
 * Calculate success rate for a single hunt
 * @param hunt Hunt with sightings included
 * @returns Success rate as percentage (0-100)
 */
export function calculateHuntSuccessRate(hunt: {
  startDate: Date;
  endDate: Date;
  sightings: Array<{ sightingDate: Date | null; userId: string }>;
}): number {
  // Calculate total nights in hunt
  const totalNightsMs = hunt.endDate.getTime() - hunt.startDate.getTime();
  const totalNights = Math.ceil(totalNightsMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

  if (totalNights <= 0) {
    return 0;
  }

  // Get sightings with dates
  const sightingsWithDates = hunt.sightings.filter((s) => s.sightingDate !== null);

  if (sightingsWithDates.length === 0) {
    return 0;
  }

  // Count unique nights with sightings using date-only comparison
  const uniqueNights = new Set(
    sightingsWithDates.map((s) => {
      const date = new Date(s.sightingDate!);
      // Format as YYYY-MM-DD for consistent comparison
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })
  );

  const nightsWithSightings = uniqueNights.size;

  // Calculate success rate capped at 100%
  const successRate = Math.min(100, (nightsWithSightings / totalNights) * 100);

  return successRate;
}

/**
 * Count unique participants who posted sightings
 * @param sightings Array of sightings with userId
 * @returns Count of unique users
 */
export function countUniqueParticipants(sightings: Array<{ userId: string }>): number {
  const uniqueUserIds = new Set(sightings.map((s) => s.userId));
  return uniqueUserIds.size;
}

/**
 * Recalculate and update cached statistics for a single hunt
 * @param huntId Hunt ID to recalculate
 * @returns Updated hunt with cached stats
 */
export async function recalculateHuntSuccessRate(huntId: string) {
  console.log(`[Hunt Stats] Recalculating stats for hunt ${huntId}`);

  try {
    // Fetch hunt with sightings
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        sightings: {
          where: {
            sightingDate: {
              not: null,
            },
          },
          select: {
            sightingDate: true,
            userId: true,
          },
        },
      },
    });

    if (!hunt) {
      console.log(`[Hunt Stats] Hunt ${huntId} not found`);
      return null;
    }

    // Calculate stats
    const successRate = calculateHuntSuccessRate(hunt);

    // Count unique nights with sightings
    const uniqueNights = new Set(
      hunt.sightings.map((s) => {
        const date = new Date(s.sightingDate!);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
    );
    const sightingsCount = uniqueNights.size;

    // Count unique participants
    const uniqueParticipants = countUniqueParticipants(hunt.sightings);

    // Update hunt with cached stats
    const updatedHunt = await prisma.hunt.update({
      where: { id: huntId },
      data: {
        cachedSuccessRate: successRate,
        cachedSightingsCount: sightingsCount,
        cachedUniqueParticipants: uniqueParticipants,
        cachedStatsLastUpdated: new Date(),
      },
    });

    console.log(
      `[Hunt Stats] ✅ Hunt ${huntId}: ${successRate.toFixed(1)}% success rate, ${sightingsCount} nights, ${uniqueParticipants} participants`
    );

    return updatedHunt;
  } catch (error) {
    console.error(`[Hunt Stats] ❌ Error recalculating hunt ${huntId}:`, error);
    throw error;
  }
}

/**
 * Recalculate success rates for multiple hunts (batch processing)
 * @param huntIds Array of hunt IDs to recalculate
 * @returns Array of updated hunts
 */
export async function recalculateSuccessRatesForHunts(huntIds: string[]) {
  console.log(`[Hunt Stats] Batch recalculating ${huntIds.length} hunts`);

  const results = [];

  for (const huntId of huntIds) {
    try {
      const updatedHunt = await recalculateHuntSuccessRate(huntId);
      if (updatedHunt) {
        results.push(updatedHunt);
      }
    } catch (error) {
      console.error(`[Hunt Stats] Failed to recalculate hunt ${huntId}:`, error);
      // Continue with other hunts even if one fails
    }
  }

  console.log(`[Hunt Stats] ✅ Batch complete: ${results.length}/${huntIds.length} hunts updated`);

  return results;
}

/**
 * Get all completed hunts that need stats recalculation
 * @returns Array of completed hunt IDs
 */
export async function getCompletedHuntsNeedingRecalculation() {
  const now = new Date();

  const hunts = await prisma.hunt.findMany({
    where: {
      endDate: {
        lt: now,
      },
      OR: [
        { cachedStatsLastUpdated: null }, // Never calculated
        {
          cachedStatsLastUpdated: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      endDate: true,
    },
    orderBy: {
      endDate: 'desc',
    },
  });

  return hunts;
}

/**
 * Trigger cache recalculation when a sighting is posted to a hunt
 * Call this function in the sighting creation API
 * @param huntId Hunt ID where sighting was posted
 */
export async function onSightingPostedToHunt(huntId: string) {
  console.log(`[Hunt Stats] Sighting posted to hunt ${huntId}, triggering recalculation`);

  try {
    await recalculateHuntSuccessRate(huntId);
    console.log(`[Hunt Stats] ✅ Cache updated for hunt ${huntId}`);
  } catch (error) {
    console.error(`[Hunt Stats] ⚠️ Failed to update cache for hunt ${huntId}:`, error);
    // Don't throw - we don't want sighting creation to fail if cache update fails
  }
}

/**
 * Get hunt statistics (with fallback to real-time calculation if cache doesn't exist)
 * @param huntId Hunt ID
 * @returns Hunt stats object
 */
export async function getHuntStatistics(huntId: string) {
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    include: {
      sightings: {
        where: {
          sightingDate: {
            not: null,
          },
        },
        select: {
          sightingDate: true,
          userId: true,
        },
      },
    },
  });

  if (!hunt) {
    return null;
  }

  // Check if we have cached stats and they're recent
  const hasCachedStats = hunt.cachedStatsLastUpdated !== null;
  const cacheIsRecent =
    hasCachedStats &&
    hunt.cachedStatsLastUpdated! > new Date(Date.now() - 24 * 60 * 60 * 1000); // Less than 24 hours old

  // Use cached stats if available and recent
  if (hasCachedStats && cacheIsRecent) {
    return {
      successRate: hunt.cachedSuccessRate || 0,
      sightingsCount: hunt.cachedSightingsCount || 0,
      uniqueParticipants: hunt.cachedUniqueParticipants || 0,
      lastUpdated: hunt.cachedStatsLastUpdated,
      source: 'cached' as const,
    };
  }

  // Calculate real-time if cache doesn't exist or is old
  const successRate = calculateHuntSuccessRate(hunt);
  const uniqueNights = new Set(
    hunt.sightings.map((s) => {
      const date = new Date(s.sightingDate!);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    })
  );
  const sightingsCount = uniqueNights.size;
  const uniqueParticipants = countUniqueParticipants(hunt.sightings);

  // Trigger async cache update (don't wait for it)
  recalculateHuntSuccessRate(huntId).catch((error) => {
    console.error(`[Hunt Stats] Background cache update failed for hunt ${huntId}:`, error);
  });

  return {
    successRate,
    sightingsCount,
    uniqueParticipants,
    lastUpdated: null,
    source: 'realtime' as const,
  };
}
