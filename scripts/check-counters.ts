#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounters() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'kristabelq' },
      select: {
        id: true,
        name: true,
        username: true,
        cachedSightingsCount: true,
        _count: {
          select: {
            sightings: true,
          },
        },
      },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n📊 User Counters:');
    console.log(`Name: ${user.name}`);
    console.log(`Username: @${user.username}`);
    console.log(`\nCached Sightings Count (unique nights): ${user.cachedSightingsCount}`);
    console.log(`Total Posts (_count.sightings): ${user._count.sightings}`);
    console.log('\nExpected: 3 sightings, 6 posts\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounters();
