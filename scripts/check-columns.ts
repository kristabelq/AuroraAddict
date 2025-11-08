import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking User table columns...\n');

  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY column_name;
    `);

    console.log('📋 All User table columns:');
    console.table(result);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
