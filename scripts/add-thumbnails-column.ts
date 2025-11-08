#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

// Use DIRECT_URL (session pooler) for DDL operations
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function addThumbnailsColumn() {
  console.log('🔧 Adding thumbnails column to Sighting table...\n');
  console.log('Connection string:', process.env.DIRECT_URL?.replace(/:[^:@]+@/, ':***@'));

  try {
    // Add thumbnails column
    console.log('\n📋 Adding thumbnails column...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Sighting"
      ADD COLUMN IF NOT EXISTS "thumbnails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    `);

    console.log('✅ Successfully added thumbnails column!\n');

    // Verify column was added
    const result = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      column_default: string | null;
    }>>(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'Sighting'
      AND column_name = 'thumbnails';
    `);

    console.log('Verified column:');
    console.log(result);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addThumbnailsColumn()
  .then(() => {
    console.log('\n👋 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
