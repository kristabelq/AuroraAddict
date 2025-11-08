/**
 * Migration script to add cached statistics columns to Hunt table
 *
 * Adds:
 * - cachedSuccessRate (DOUBLE PRECISION)
 * - cachedSightingsCount (INTEGER)
 * - cachedUniqueParticipants (INTEGER)
 * - cachedStatsLastUpdated (TIMESTAMP)
 *
 * Usage: npx tsx scripts/add-hunt-stats-columns.ts
 */

import { prisma } from '../src/lib/prisma';

async function addHuntStatsColumns() {
  console.log('🔄 Adding cached statistics columns to Hunt table...\n');

  try {
    // Add the cached statistics columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Hunt"
      ADD COLUMN IF NOT EXISTS "cachedSuccessRate" DOUBLE PRECISION DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedSightingsCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedUniqueParticipants" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedStatsLastUpdated" TIMESTAMP(3);
    `);

    console.log('✅ Cached statistics columns added successfully!\n');

    // Verify the columns were added
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'Hunt' AND column_name LIKE 'cached%';`
    );

    console.log('✅ Verified columns in Hunt table:');
    result.forEach((col) => {
      console.log(`   - ${col.column_name}`);
    });
    console.log('');

    console.log('✅ Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: npx tsx scripts/backfill-hunt-stats.ts');
    console.log('3. Restart your dev server\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addHuntStatsColumns();
