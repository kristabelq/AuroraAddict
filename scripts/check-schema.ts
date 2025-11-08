#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check if User table exists and what columns it has
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'User'
      ORDER BY ordinal_position;
    `;

    console.log('User table columns:');
    console.log(result);
    console.log('');

    // Check if cached counter columns exist
    const cachedColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name IN ('cachedSightingsCount', 'cachedHuntsCreatedCount', 'cachedHuntsJoinedCount');
    `;

    console.log('Cached counter columns found:');
    console.log(cachedColumns);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
