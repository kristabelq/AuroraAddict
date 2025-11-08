import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get timezone from coordinates using API
 */
async function getTimezoneFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`
    );

    if (response.ok) {
      const data = await response.json();
      const offset = data.currentUtcOffset?.hours || 0;

      if (offset === 0) return "UTC";
      if (offset > 0) return `GMT+${offset}`;
      return `GMT${offset}`;
    }
  } catch (error) {
    console.error("Error fetching timezone from API:", error);
  }

  // Fallback: simple calculation
  const offset = Math.round(lng / 15);
  if (offset === 0) return "UTC";
  if (offset > 0) return `GMT+${offset}`;
  return `GMT${offset}`;
}

async function updateHuntTimezones() {
  console.log('Starting to update hunt timezones...');

  // Get all hunts to update with accurate timezone data
  const hunts = await prisma.hunt.findMany({
    where: {},
    select: {
      id: true,
      name: true,
      location: true,
      longitude: true,
      timezone: true,
    }
  });

  console.log(`Found ${hunts.length} hunts to update`);

  for (const hunt of hunts) {
    if (hunt.longitude !== null && hunt.longitude !== undefined) {
      // Get all hunts to check for latitude
      const fullHunt = await prisma.hunt.findUnique({
        where: { id: hunt.id },
        select: { latitude: true, longitude: true }
      });

      if (fullHunt?.latitude && fullHunt?.longitude) {
        const newTimezone = await getTimezoneFromCoordinates(fullHunt.latitude, fullHunt.longitude);

        await prisma.hunt.update({
          where: { id: hunt.id },
          data: { timezone: newTimezone }
        });

        console.log(`Updated "${hunt.name}" (${hunt.location}): ${hunt.timezone || 'null'} -> ${newTimezone}`);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`Skipped "${hunt.name}": No coordinate data`);
      }
    } else {
      console.log(`Skipped "${hunt.name}": No longitude data`);
    }
  }

  console.log('Done!');
}

updateHuntTimezones()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
