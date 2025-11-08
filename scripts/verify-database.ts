#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying Database Schema and Synchronization\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check all tables exist
    console.log('\n📋 1. CHECKING ALL TABLES');
    console.log('-'.repeat(60));
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('Tables in database:', tables.map(t => t.tablename).join(', '));

    // 2. Check User table structure
    console.log('\n👤 2. USER TABLE STRUCTURE');
    console.log('-'.repeat(60));
    const userColumns = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      column_default: string | null;
      is_nullable: string;
    }>>(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'User'
      ORDER BY ordinal_position;
    `);

    console.log('User table columns:');
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // 3. Verify cached counter columns specifically
    console.log('\n📊 3. CACHED COUNTER COLUMNS');
    console.log('-'.repeat(60));
    const cachedColumns = userColumns.filter(col =>
      col.column_name === 'cachedSightingsCount' ||
      col.column_name === 'cachedHuntsCreatedCount' ||
      col.column_name === 'cachedHuntsJoinedCount'
    );

    if (cachedColumns.length === 3) {
      console.log('✅ All 3 cached counter columns exist:');
      cachedColumns.forEach(col => {
        console.log(`  ✓ ${col.column_name}: ${col.data_type}, default = ${col.column_default}`);
      });
    } else {
      console.log('❌ MISSING cached counter columns!');
      console.log(`  Found: ${cachedColumns.length}/3`);
      ['cachedSightingsCount', 'cachedHuntsCreatedCount', 'cachedHuntsJoinedCount'].forEach(name => {
        const exists = cachedColumns.some(col => col.column_name === name);
        console.log(`  ${exists ? '✓' : '✗'} ${name}`);
      });
    }

    // 4. Count records in each table
    console.log('\n📈 4. RECORD COUNTS');
    console.log('-'.repeat(60));
    const counts = {
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      sessions: await prisma.session.count(),
      sightings: await prisma.sighting.count(),
      hunts: await prisma.hunt.count(),
      huntParticipants: await prisma.huntParticipant.count(),
      comments: await prisma.comment.count(),
      likes: await prisma.like.count(),
      follows: await prisma.follow.count(),
      cityBadges: await prisma.cityBadge.count(),
    };

    Object.entries(counts).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(20)} : ${count}`);
    });

    // 5. Check if any users exist and their cached counters
    console.log('\n👥 5. USER DATA SAMPLE');
    console.log('-'.repeat(60));
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        cachedSightingsCount: true,
        cachedHuntsCreatedCount: true,
        cachedHuntsJoinedCount: true,
        _count: {
          select: {
            sightings: true,
            hunts: true,
            huntParticipants: true,
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('No users found in database.');
    } else {
      users.forEach((user, i) => {
        console.log(`\nUser ${i + 1}: ${user.name} (${user.username || user.email})`);
        console.log(`  Cached: Sightings=${user.cachedSightingsCount}, HuntsCreated=${user.cachedHuntsCreatedCount}, HuntsJoined=${user.cachedHuntsJoinedCount}`);
        console.log(`  Actual: Sightings=${user._count.sightings}, Hunts=${user._count.hunts}, Participants=${user._count.huntParticipants}`);

        // Check if cached matches actual
        const sightingsMatch = user.cachedSightingsCount === user._count.sightings;
        const huntsMatch = user.cachedHuntsCreatedCount === user._count.hunts;
        const participantsMatch = user.cachedHuntsJoinedCount === user._count.huntParticipants;

        if (sightingsMatch && huntsMatch && participantsMatch) {
          console.log(`  ✅ Cached counters are synchronized`);
        } else {
          console.log(`  ⚠️  Cached counters need updating:`);
          if (!sightingsMatch) console.log(`     - Sightings: cached=${user.cachedSightingsCount}, actual=${user._count.sightings}`);
          if (!huntsMatch) console.log(`     - Hunts: cached=${user.cachedHuntsCreatedCount}, actual=${user._count.hunts}`);
          if (!participantsMatch) console.log(`     - Participants: cached=${user.cachedHuntsJoinedCount}, actual=${user._count.huntParticipants}`);
        }
      });
    }

    // 6. Check database constraints and indexes
    console.log('\n🔗 6. KEY CONSTRAINTS AND INDEXES');
    console.log('-'.repeat(60));
    const constraints = await prisma.$queryRawUnsafe<Array<{
      table_name: string;
      constraint_name: string;
      constraint_type: string;
    }>>(`
      SELECT table_name, constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'Account', 'Session', 'Sighting', 'Hunt', 'HuntParticipant')
      ORDER BY table_name, constraint_type;
    `);

    const groupedConstraints = constraints.reduce((acc, c) => {
      if (!acc[c.table_name]) acc[c.table_name] = [];
      acc[c.table_name].push(`${c.constraint_type}: ${c.constraint_name}`);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(groupedConstraints).forEach(([table, cons]) => {
      console.log(`\n${table}:`);
      cons.forEach(c => console.log(`  - ${c}`));
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE VERIFICATION COMPLETE\n');

  } catch (error) {
    console.error('\n❌ ERROR during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase()
  .then(() => {
    console.log('👋 Verification script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  });
