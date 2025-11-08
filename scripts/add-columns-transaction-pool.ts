#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

// Create a Prisma client that connects directly using the DIRECT_URL (session pooler)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function addCachedColumns() {
  console.log('🔧 Adding cached counter columns to User table via DIRECT_URL...\n');
  console.log('Connection string:', process.env.DIRECT_URL?.replace(/:[^:@]+@/, ':***@'));

  try {
    // Check existing columns first
    console.log('\n📋 Checking existing columns...');
    const existingColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'User';
    `);
    console.log('Existing columns:', existingColumns);

    // Add the three cached counter columns
    console.log('\n🔧 Adding columns...');
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
