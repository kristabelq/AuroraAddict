import { PrismaClient } from '@prisma/client';
const geoTz = require('geo-tz');

const prisma = new PrismaClient();

/**
 * Get IANA timezone name from coordinates
 */
function getTimezoneFromCoordinates(lat: number, lng: number): string {
  try {
    const tzNames = geoTz.find(lat, lng);
    if (tzNames && tzNames.length > 0) {
      return tzNames[0];
    }
  } catch (error) {
    console.error("Error getting timezone:", error);
  }
  return "UTC";
}

async function updateToIANATimezones() {
  console.log('Updating all hunts to use IANA timezone names...');

  // Get all hunts with coordinates
  const hunts = await prisma.hunt.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null }
    },
    select: {
      id: true,
      name: true,
      location: true,
      latitude: true,
      longitude: true,
      timezone: true,
    }
  });

  console.log(`Found ${hunts.length} hunts to update`);

  for (const hunt of hunts) {
    if (hunt.latitude && hunt.longitude) {
      const ianaTimezone = getTimezoneFromCoordinates(hunt.latitude, hunt.longitude);

      await prisma.hunt.update({
        where: { id: hunt.id },
        data: { timezone: ianaTimezone }
      });

      console.log(`Updated "${hunt.name}": ${hunt.timezone} -> ${ianaTimezone}`);
    }
  }

  console.log('Done!');
}

updateToIANATimezones()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
