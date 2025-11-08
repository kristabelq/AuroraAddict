#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

// Use DIRECT_URL to avoid prepared statement conflicts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function verifySightingTable() {
  console.log('🔍 Verifying Sighting Table Optimization\n');
  console.log('=' .repeat(60));

  try {
    // Check Sighting table structure
    console.log('\n📋 SIGHTING TABLE STRUCTURE');
    console.log('-'.repeat(60));
    const columns = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      column_default: string | null;
      is_nullable: string;
    }>>(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'Sighting'
      ORDER BY ordinal_position;
    `);

    console.log('Sighting table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Verify thumbnails column specifically
    console.log('\n🖼️  THUMBNAILS COLUMN');
    console.log('-'.repeat(60));
    const thumbnailsColumn = columns.find(col => col.column_name === 'thumbnails');

    if (thumbnailsColumn) {
      console.log('✅ Thumbnails column exists:');
      console.log(`  Type: ${thumbnailsColumn.data_type}`);
      console.log(`  Default: ${thumbnailsColumn.column_default}`);
      console.log(`  Nullable: ${thumbnailsColumn.is_nullable === 'YES' ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ Thumbnails column is MISSING!');
    }

    // Check indexes
    console.log('\n📑 SIGHTING TABLE INDEXES');
    console.log('-'.repeat(60));
    const indexes = await prisma.$queryRawUnsafe<Array<{
      indexname: string;
      indexdef: string;
    }>>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'Sighting'
      ORDER BY indexname;
    `);

    console.log('Indexes:');
    indexes.forEach(idx => {
      console.log(`  ✓ ${idx.indexname}`);
    });

    // Check for new performance indexes
    console.log('\n⚡ PERFORMANCE INDEXES');
    console.log('-'.repeat(60));
    const userIdIndex = indexes.find(idx => idx.indexname === 'Sighting_userId_idx');
    const compositeIndex = indexes.find(idx => idx.indexname === 'Sighting_userId_createdAt_idx');

    if (userIdIndex) {
      console.log('✅ userId index exists:');
      console.log(`  ${userIdIndex.indexdef}`);
    } else {
      console.log('❌ userId index is MISSING!');
    }

    if (compositeIndex) {
      console.log('✅ Composite (userId + createdAt) index exists:');
      console.log(`  ${compositeIndex.indexdef}`);
    } else {
      console.log('❌ Composite index is MISSING!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SIGHTING TABLE VERIFICATION COMPLETE\n');

  } catch (error) {
    console.error('\n❌ ERROR during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySightingTable()
  .then(() => {
    console.log('👋 Verification script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
