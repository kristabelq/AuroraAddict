/**
 * Backfill script to recalculate cached statistics for existing hunts
 *
 * This script:
 * 1. Finds all completed hunts (endDate < now)
 * 2. Recalculates success rates for each
 * 3. Updates cached statistics columns
 *
 * Usage: npx tsx scripts/backfill-hunt-stats.ts
 */

import { prisma } from '../src/lib/prisma';
import { recalculateHuntSuccessRate } from '../src/lib/huntStats';

async function backfillHuntStats() {
  console.log('📊 Backfilling hunt statistics...\n');

  try {
    // Find all completed hunts
    const now = new Date();
    const completedHunts = await prisma.hunt.findMany({
      where: {
        endDate: {
          lt: now,
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    console.log(`📋 Found ${completedHunts.length} completed hunts to process\n`);

    if (completedHunts.length === 0) {
      console.log('✅ No completed hunts found. Nothing to backfill.\n');
      return;
    }

    // Process each hunt
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < completedHunts.length; i++) {
      const hunt = completedHunts[i];
      const progress = `[${i + 1}/${completedHunts.length}]`;

      console.log(`${progress} Processing: ${hunt.name}`);
      console.log(`   Hunt ID: ${hunt.id}`);
      console.log(`   Date: ${hunt.startDate.toDateString()} → ${hunt.endDate.toDateString()}`);

      try {
        const updated = await recalculateHuntSuccessRate(hunt.id);

        if (updated) {
          console.log(`   ✅ Success rate: ${updated.cachedSuccessRate?.toFixed(1)}%`);
          console.log(`   ✅ Nights with sightings: ${updated.cachedSightingsCount}`);
          console.log(`   ✅ Unique participants: ${updated.cachedUniqueParticipants}\n`);
          successCount++;
        } else {
          console.log(`   ⚠️  Hunt not found, skipping\n`);
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing hunt:`, error);
        console.log('');
        failCount++;
      }
    }

    console.log('═'.repeat(60));
    console.log('📈 Backfill Summary');
    console.log('═'.repeat(60));
    console.log(`Total hunts processed: ${completedHunts.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('═'.repeat(60));
    console.log('');

    if (successCount > 0) {
      console.log('✅ Backfill completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Restart your dev server to pick up the new data');
      console.log('2. Check /api/hunts/upcoming endpoint for cached stats\n');
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillHuntStats();
