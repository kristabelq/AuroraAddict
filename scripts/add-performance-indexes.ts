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

async function addPerformanceIndexes() {
  console.log('🔧 Adding performance indexes to Sighting table...\n');
  console.log('Connection string:', process.env.DIRECT_URL?.replace(/:[^:@]+@/, ':***@'));

  try {
    // Check existing indexes first
    console.log('\n📋 Checking existing indexes...');
    const existingIndexes = await prisma.$queryRawUnsafe<Array<{
      indexname: string;
    }>>(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'Sighting';
    `);
    console.log('Existing indexes:', existingIndexes.map(i => i.indexname).join(', '));

    // Add indexes one by one
    console.log('\n🔧 Adding new indexes...');

    // Index for userId
    console.log('Creating index on userId...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Sighting_userId_idx" ON "Sighting" ("userId");
    `);

    // Composite index for userId + createdAt (for user timeline queries)
    console.log('Creating composite index on userId + createdAt...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Sighting_userId_createdAt_idx" ON "Sighting" ("userId", "createdAt");
    `);

    console.log('✅ Successfully added performance indexes!\n');

    // Verify indexes were added
    const result = await prisma.$queryRawUnsafe<Array<{
      indexname: string;
      indexdef: string;
    }>>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'Sighting'
      ORDER BY indexname;
    `);

    console.log('All Sighting table indexes:');
    result.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPerformanceIndexes()
  .then(() => {
    console.log('\n👋 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
