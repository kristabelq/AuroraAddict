#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countUsers() {
  try {
    const userCount = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${userCount}\n`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          cachedSightingsCount: true,
          cachedHuntsCreatedCount: true,
          cachedHuntsJoinedCount: true,
        },
      });

      console.log('Users:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name || 'No name'} (${user.username || user.email})`);
        console.log(`   - Sightings: ${user.cachedSightingsCount}`);
        console.log(`   - Hunts Created: ${user.cachedHuntsCreatedCount}`);
        console.log(`   - Hunts Joined: ${user.cachedHuntsJoinedCount}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countUsers();
