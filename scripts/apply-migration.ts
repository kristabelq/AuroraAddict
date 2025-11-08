#!/usr/bin/env tsx

/**
 * Apply migration SQL directly to the database
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Applying migration...\n');

  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/20251014190703_add_cached_counters/migration.sql'),
      'utf-8'
    );

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('');

    // Execute the migration
    await prisma.$executeRawUnsafe(migrationSQL);

    console.log('✅ Migration applied successfully!\n');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('👋 Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
