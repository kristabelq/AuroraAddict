/**
 * Script to backfill user stats for all existing users
 *
 * This recalculates success rates for all users who have completed hunts.
 *
 * Usage: npx tsx scripts/backfill-user-stats.ts
 */

import { prisma } from '../src/lib/prisma';
import { recalculateUserSuccessRate } from '../src/lib/userStats';

async function backfillUserStats() {
  console.log('🔄 Starting user stats backfill...\n');

  try {
    // Find all users who have either created or joined hunts
    const usersWithHunts = await prisma.user.findMany({
      where: {
        OR: [
          { hunts: { some: {} } }, // Created hunts
          { huntParticipants: { some: {} } } // Joined hunts
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
      }
    });

    console.log(`📊 Found ${usersWithHunts.length} users with hunts\n`);

    if (usersWithHunts.length === 0) {
      console.log('✅ No users with hunts found. Nothing to backfill.');
      return;
    }

    // Recalculate stats for each user
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < usersWithHunts.length; i++) {
      const user = usersWithHunts[i];
      const displayName = user.username || user.name || user.id;

      try {
        console.log(`[${i + 1}/${usersWithHunts.length}] Recalculating for ${displayName}...`);

        const updatedUser = await recalculateUserSuccessRate(user.id);

        console.log(`   ✅ Success rate: ${updatedUser.cachedSuccessRate.toFixed(1)}% (${updatedUser.cachedCompletedHuntsCount} completed hunts)`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Error for ${displayName}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Backfill completed!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Errors: ${errorCount} users`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillUserStats();
