import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.user.findMany({
    where: {
      userType: 'business'
    },
    select: {
      id: true,
      businessName: true,
      businessCategory: true,
      businessServices: true,
      businessDescription: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('\n=== BUSINESS ANALYSIS ===\n');
  businesses.forEach((business, index) => {
    console.log(`${index + 1}. ${business.businessName}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Legacy Category: ${business.businessCategory || 'N/A'}`);
    console.log(`   Current Services: ${business.businessServices.length > 0 ? business.businessServices.join(', ') : 'NONE'}`);
    console.log(`   Description: ${business.businessDescription || 'N/A'}`);
    console.log('');
  });

  console.log(`Total businesses: ${businesses.length}\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
