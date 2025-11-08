#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSightings() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'kristabelq' },
      select: { id: true },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const sightings = await prisma.sighting.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        sightingDate: true,
        createdAt: true,
      },
      orderBy: { sightingDate: 'asc' },
    });

    console.log('\n📊 All Sightings:');
    sightings.forEach((s, i) => {
      console.log(`${i + 1}. ID: ${s.id.substring(0, 8)}... | sightingDate: ${s.sightingDate?.toISOString().split('T')[0] || 'NULL'} | createdAt: ${s.createdAt.toISOString().split('T')[0]}`);
    });

    const uniqueDates = new Set(
      sightings
        .filter(s => s.sightingDate !== null)
        .map(s => s.sightingDate!.toISOString().split('T')[0])
    );

    console.log(`\n📅 Unique Sighting Dates: ${uniqueDates.size}`);
    console.log('Dates:', Array.from(uniqueDates).sort());
    console.log(`\n📝 Total Posts: ${sightings.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSightings();
