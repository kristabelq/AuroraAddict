#!/usr/bin/env tsx

/**
 * Backfill Script for Cached Counters
 *
 * This script calculates and updates the cached counter fields for all existing users:
 * - cachedSightingsCount: Total number of sightings posted
 * - cachedHuntsCreatedCount: Total number of hunts created
 * - cachedHuntsJoinedCount: Total number of hunts joined (as participant)
 *
 * Run this script after applying the migration that adds these fields.
 *
 * Usage: npx tsx scripts/backfill-cached-counters.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillCachedCounters() {
  console.log('🚀 Starting backfill of cached counters...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true },
    });

    console.log(`📊 Found ${users.length} users to process\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Count unique calendar dates (not datetime) for sightings
        const allSightings = await prisma.sighting.findMany({
          where: {
            userId: user.id,
            sightingDate: { not: null },
          },
          select: { sightingDate: true },
        });

        // Extract unique calendar dates (ignore time component)
        const uniqueDates = new Set(
          allSightings.map(s => {
            const date = new Date(s.sightingDate!);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          })
        );
        const sightingsCount = uniqueDates.size;

        // Count hunts created by this user
        const huntsCreatedCount = await prisma.hunt.count({
          where: { userId: user.id },
        });

        // Count hunts joined by this user (as participant)
        const huntsJoinedCount = await prisma.huntParticipant.count({
          where: { userId: user.id },
        });

        // Update the user's cached counters
        await prisma.user.update({
          where: { id: user.id },
          data: {
            cachedSightingsCount: sightingsCount,
            cachedHuntsCreatedCount: huntsCreatedCount,
            cachedHuntsJoinedCount: huntsJoinedCount,
          },
        });

        console.log(`✅ ${user.name || user.username || user.id}:`);
        console.log(`   - Sightings (unique dates): ${sightingsCount}`);
        console.log(`   - Hunts Created: ${huntsCreatedCount}`);
        console.log(`   - Hunts Joined: ${huntsJoinedCount}`);
        console.log();

        successCount++;
      } catch (error) {
        console.error(`❌ Error processing user ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   ✅ Successfully Updated: ${successCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log('='.repeat(60));
    console.log('\n✨ Backfill completed!\n');

  } catch (error) {
    console.error('❌ Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillCachedCounters()
  .then(() => {
    console.log('👋 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
