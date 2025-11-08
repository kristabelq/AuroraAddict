#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCachedColumns() {
  console.log('🔧 Adding cached counter columns to User table...\n');

  try {
    // Add the three cached counter columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "cachedSightingsCount" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedHuntsCreatedCount" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "cachedHuntsJoinedCount" INTEGER NOT NULL DEFAULT 0;
    `);

    console.log('✅ Successfully added cached counter columns!\n');

    // Verify columns were added
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name IN ('cachedSightingsCount', 'cachedHuntsCreatedCount', 'cachedHuntsJoinedCount')
      ORDER BY column_name;
    `);

    console.log('Verified columns:');
    console.log(result);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addCachedColumns()
  .then(() => {
    console.log('\n👋 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
