/**
 * Migration script to add cancellationPolicy column to Hunt table
 *
 * Usage: npx tsx scripts/add-cancellation-policy.ts
 */

import { prisma } from '../src/lib/prisma';

async function addCancellationPolicyColumn() {
  console.log('🔄 Adding cancellationPolicy column to Hunt table...\n');

  try {
    // Add the cancellationPolicy column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Hunt"
      ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT;
    `);

    console.log('✅ cancellationPolicy column added successfully!\n');

    // Verify the column was added
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'Hunt' AND column_name = 'cancellationPolicy';`
    );

    if (result.length > 0) {
      console.log('✅ Verified: cancellationPolicy column exists in Hunt table\n');
    } else {
      console.log('⚠️  Warning: Could not verify column existence\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addCancellationPolicyColumn();
