import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTimezones() {
  console.log('Fixing timezones...');

  // Singapore (GMT+8)
  const singapore = await prisma.hunt.updateMany({
    where: { location: { contains: 'Singapore' } },
    data: { timezone: 'GMT+8' }
  });
  console.log(`Updated ${singapore.count} Singapore hunts to GMT+8`);

  // Stockholm, Sweden (GMT+1)
  const stockholm = await prisma.hunt.updateMany({
    where: { location: { contains: 'Stockholm' } },
    data: { timezone: 'GMT+1' }
  });
  console.log(`Updated ${stockholm.count} Stockholm hunts to GMT+1`);

  // Malmö, Sweden (GMT+1)
  const malmo = await prisma.hunt.updateMany({
    where: { location: { contains: 'Malmö' } },
    data: { timezone: 'GMT+1' }
  });
  console.log(`Updated ${malmo.count} Malmö hunts to GMT+1`);

  // Sydney, Australia (GMT+10)
  const sydney = await prisma.hunt.updateMany({
    where: { location: { contains: 'Sydney' } },
    data: { timezone: 'GMT+10' }
  });
  console.log(`Updated ${sydney.count} Sydney hunts to GMT+10`);

  // Tasmania, Australia (GMT+10)
  const tasmania = await prisma.hunt.updateMany({
    where: { location: { contains: 'Tasmania' } },
    data: { timezone: 'GMT+10' }
  });
  console.log(`Updated ${tasmania.count} Tasmania hunts to GMT+10`);

  console.log('Done!');
}

fixTimezones()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
