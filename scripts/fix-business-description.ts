import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding businessDescription column...\n');

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN "businessDescription" TEXT;
    `);
    console.log('✅ Added businessDescription column');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('  → Column already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
