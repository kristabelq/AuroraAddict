const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Adding hideFromPublic column to Hunt table...');

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Hunt"
      ADD COLUMN IF NOT EXISTS "hideFromPublic" BOOLEAN NOT NULL DEFAULT false;
    `);

    console.log('✅ Migration successful! Column "hideFromPublic" added.');

    // Verify the column exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Hunt' AND column_name = 'hideFromPublic';
    `);

    console.log('\nColumn details:', result);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
