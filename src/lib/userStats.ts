/**
 * User Statistics Management
 *
 * This module handles calculation and caching of user statistics,
 * specifically success rates from COMPLETED hunts only.
 *
 * Key Design Decisions:
 * - Success rate only counts COMPLETED hunts (endDate < now)
 * - Excludes ongoing and upcoming hunts to prevent artificial drops
 * - Statistics are cached in the User model for instant profile loads
 * - Recalculation is triggered when:
 *   1. A hunt completes (endDate passes)
 *   2. A sighting is added to a completed hunt
 *   3. A user joins/leaves a completed hunt
 */

import { prisma } from "@/lib/prisma";

/**
 * Calculate success rate for a COMPLETED hunt
 *
 * Success Rate = (Unique nights with sightings / Total nights) * 100
 *
 * @param hunt Hunt object with startDate, endDate, and sightings
 * @returns Success rate percentage (0-100)
 */
function calculateHuntSuccessRate(hunt: {
  startDate: Date;
  endDate: Date;
  sightings: Array<{ sightingDate: Date | null }>;
}): number {
  // Calculate total nights in hunt
  const totalNights = Math.ceil(
    (hunt.endDate.getTime() - hunt.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Count unique nights with sightings (calendar dates only, ignore time)
  const uniqueNights = new Set(
    hunt.sightings
      .filter(s => s.sightingDate !== null)
      .map(s => {
        const date = new Date(s.sightingDate!);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
  ).size;

  // Calculate success rate, cap at 100%
  return totalNights > 0 ? Math.min(100, (uniqueNights / totalNights) * 100) : 0;
}

/**
 * Recalculate and update cached success rate for a user
 *
 * Only includes COMPLETED hunts where:
 * - endDate < now
 * - User is either creator OR participant with status='confirmed'
 *
 * Updates User fields:
 * - cachedSuccessRate: Average success rate across all completed hunts
 * - cachedCompletedHuntsCount: Total number of completed hunts
 * - cachedLastUpdated: Timestamp of this update
 *
 * @param userId User ID to recalculate
 * @returns Updated user record
 */
export async function recalculateUserSuccessRate(userId: string) {
  const now = new Date();

  // Fetch all COMPLETED hunts where user participated
  const completedHunts = await prisma.hunt.findMany({
    where: {
      AND: [
        {
          endDate: {
            lt: now, // Only completed hunts
          },
        },
        {
          OR: [
            { userId }, // Hunts created by user
            {
              participants: {
                some: {
                  userId,
                  status: 'confirmed', // Only confirmed participants count
                },
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      sightings: {
        select: {
          sightingDate: true,
        },
        where: {
          sightingDate: { not: null },
        },
      },
    },
  });

  console.log(`[UserStats] Recalculating success rate for user ${userId}`);
  console.log(`[UserStats] Found ${completedHunts.length} completed hunts`);

  // Calculate success rate for each hunt
  const successRates = completedHunts.map(hunt => calculateHuntSuccessRate(hunt));

  // Calculate average success rate
  const averageSuccessRate =
    successRates.length > 0
      ? successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length
      : 0;

  console.log(`[UserStats] Average success rate: ${averageSuccessRate.toFixed(2)}%`);

  // Update cached stats
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      cachedSuccessRate: averageSuccessRate,
      cachedCompletedHuntsCount: completedHunts.length,
      cachedLastUpdated: new Date(),
    },
  });

  return updatedUser;
}

/**
 * Get completed hunts that are missing sightings
 *
 * Returns hunts where:
 * - endDate < now (completed)
 * - User participated (creator or confirmed participant)
 * - User has NOT posted any sightings to this hunt
 *
 * Used to show reminders on profile page
 *
 * @param userId User ID
 * @returns Array of hunts missing sightings from this user
 */
export async function getCompletedHuntsMissingSightings(userId: string) {
  const now = new Date();

  const hunts = await prisma.hunt.findMany({
    where: {
      AND: [
        {
          endDate: {
            lt: now, // Only completed hunts
          },
        },
        {
          OR: [
            { userId }, // Hunts created by user
            {
              participants: {
                some: {
                  userId,
                  status: 'confirmed',
                },
              },
            },
          ],
        },
        {
          // No sightings from this user
          NOT: {
            sightings: {
              some: {
                userId,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      location: true,
    },
    orderBy: {
      endDate: 'desc', // Most recent first
    },
    take: 5, // Limit to 5 most recent
  });

  return hunts;
}

/**
 * Trigger success rate recalculation for multiple users
 *
 * Used when a hunt completes or sightings are updated
 *
 * @param userIds Array of user IDs to recalculate
 */
export async function recalculateSuccessRatesForUsers(userIds: string[]) {
  console.log(`[UserStats] Batch recalculating for ${userIds.length} users`);

  const results = await Promise.allSettled(
    userIds.map(userId => recalculateUserSuccessRate(userId))
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`[UserStats] Batch complete: ${succeeded} succeeded, ${failed} failed`);

  return { succeeded, failed };
}
