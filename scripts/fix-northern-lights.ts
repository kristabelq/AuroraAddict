import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Updating Northern Lights Village ===\n');

  const result = await prisma.user.update({
    where: { id: '5ae6c72a-884e-459e-8c63-9952ea2e04e6' },
    data: {
      businessServices: ['accommodation', 'tour_operator']
    },
    select: {
      businessName: true,
      businessServices: true
    }
  });

  console.log(`✅ ${result.businessName}`);
  console.log(`   Services: [${result.businessServices.join(', ')}]`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
