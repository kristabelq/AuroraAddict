/**
 * Script to run the User Stats migration
 *
 * This adds the cached success rate fields to the User table.
 *
 * Usage: npx tsx scripts/run-migration.ts
 */

import { prisma } from '../src/lib/prisma';

async function runMigration() {
  console.log('🔄 Running User Stats migration...\n');

  try {
    // Add the new columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "cachedCompletedHuntsCount" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedLastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('✅ Successfully added columns:');
    console.log('   - cachedCompletedHuntsCount (INTEGER)');
    console.log('   - cachedSuccessRate (DOUBLE PRECISION)');
    console.log('   - cachedLastUpdated (TIMESTAMP)');
    console.log();

    // Verify the columns exist
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name LIKE 'cached%' ORDER BY column_name;`
    );

    console.log('✅ Verified User table now has these cached columns:');
    result.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    console.log();

    console.log('🎉 Migration completed successfully!');
    console.log();
    console.log('Next steps:');
    console.log('1. Profile page will now work with the new fields');
    console.log('2. Success rates will show as 0% until recalculated');
    console.log('3. You can manually recalculate for a user with:');
    console.log('   import { recalculateUserSuccessRate } from "@/lib/userStats";');
    console.log('   await recalculateUserSuccessRate(userId);');
    console.log();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
