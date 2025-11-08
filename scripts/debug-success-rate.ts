#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSuccessRate() {
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'kristabelq' },
      select: { id: true, name: true, username: true },
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n📊 Success Rate Debug for:', user.name);
    console.log('═'.repeat(60));

    // Get all hunts where user is creator or participant
    const hunts = await prisma.hunt.findMany({
      where: {
        OR: [
          { userId: user.id }, // Hunts created by user
          {
            participants: {
              some: {
                userId: user.id
              }
            }
          } // Hunts joined by user
        ]
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        userId: true,
        _count: {
          select: {
            sightings: true
          }
        }
      }
    });

    console.log(`\n🎯 Total Hunts: ${hunts.length}\n`);

    if (hunts.length === 0) {
      console.log('No hunts found. Success rate should be 0%');
      return;
    }

    const successRates: number[] = [];

    // Now get sightings for each hunt to count unique nights
    for (let index = 0; index < hunts.length; index++) {
      const hunt = hunts[index];
      const totalNights = Math.ceil((new Date(hunt.endDate).getTime() - new Date(hunt.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get all sightings for this hunt with sightingDate
      const sightings = await prisma.sighting.findMany({
        where: {
          huntId: hunt.id,
          sightingDate: { not: null }
        },
        select: {
          sightingDate: true
        }
      });

      // Count unique nights (calendar dates only)
      const uniqueNights = new Set(
        sightings.map(s => {
          const date = new Date(s.sightingDate!);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
      ).size;

      const successRate = totalNights > 0 ? Math.min(100, (uniqueNights / totalNights) * 100) : 0;
      successRates.push(successRate);

      console.log(`${index + 1}. ${hunt.name}`);
      console.log(`   Role: ${hunt.userId === user.id ? 'Creator' : 'Participant'}`);
      console.log(`   Date Range: ${hunt.startDate.toISOString().split('T')[0]} to ${hunt.endDate.toISOString().split('T')[0]}`);
      console.log(`   Total Nights: ${totalNights}`);
      console.log(`   Total Posts: ${hunt._count.sightings}`);
      console.log(`   Unique Nights with Sightings: ${uniqueNights}`);
      console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
      console.log('');
    }

    const averageSuccessRate = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;

    console.log('═'.repeat(60));
    console.log(`\n✨ Average Success Rate: ${averageSuccessRate.toFixed(1)}%\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSuccessRate();
