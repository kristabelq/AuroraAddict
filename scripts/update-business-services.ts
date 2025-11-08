import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== UPDATING BUSINESS SERVICES ===\n');

  // Multi-service businesses
  const updates = [
    {
      id: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
      name: 'Northern Lights Village',
      services: ['accommodation', 'tour_operator']
    },
    {
      id: 'ba89e8e8-55a8-4297-91fc-47a1dcaf5ed0',
      name: 'Lights Over Lapland',
      services: ['photography', 'tour_operator']
    },
    {
      id: '292c72fc-2478-4460-960d-2526b45ca29e',
      name: 'Harriniva Hotels & Safaris',
      services: ['accommodation', 'tour_operator']
    },
    // Single-service businesses
    {
      id: '657f1234-ce64-4a47-b499-ff55b9a8e775',
      name: 'Arctic Adventures Levi',
      services: ['tour_operator']
    },
    {
      id: '08e34c2e-c2e7-4443-8b82-89d4a6f290f5',
      name: 'Restaurant Aanaar',
      services: ['restaurant']
    },
    {
      id: 'ee02ddb4-6796-4fc2-998b-e60690bce741',
      name: 'Arctic Gear Rovaniemi',
      services: ['shop']
    }
  ];

  for (const update of updates) {
    try {
      await prisma.user.update({
        where: { id: update.id },
        data: {
          businessServices: update.services
        }
      });

      const multiTag = update.services.length > 1 ? '✅ MULTI-TAG' : '  single';
      console.log(`${multiTag} | ${update.name}`);
      console.log(`           Services: ${update.services.join(', ')}`);
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to update ${update.name}:`, error);
    }
  }

  console.log('=== VERIFICATION ===\n');

  const businesses = await prisma.user.findMany({
    where: {
      userType: 'business'
    },
    select: {
      businessName: true,
      businessCategory: true,
      businessServices: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  businesses.forEach((business) => {
    console.log(`${business.businessName}`);
    console.log(`  Legacy Category: ${business.businessCategory}`);
    console.log(`  Services Array: [${business.businessServices.join(', ')}]`);
    console.log('');
  });

  console.log('✅ All businesses updated successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
