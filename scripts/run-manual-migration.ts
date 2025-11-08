import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Running manual database migration...\n');

  try {
    // Add missing business verification columns to User table one by one
    const columns = [
      { name: 'businessDescription', type: 'TEXT' },
      { name: 'businessEmail', type: 'TEXT' },
      { name: 'businessCity', type: 'TEXT' },
      { name: 'businessCountry', type: "TEXT DEFAULT 'Finland'" },
      { name: 'businessLicenseUrl', type: 'TEXT' },
      { name: 'idDocumentUrl', type: 'TEXT' },
      { name: 'verificationSubmittedAt', type: 'TIMESTAMP(3)' },
    ];

    for (const column of columns) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type};`
        );
        console.log(`  ✓ Added column: ${column.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`  → Column already exists: ${column.name}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Successfully added business verification columns\n');

    // Verify the columns were added
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name IN (
        'businessDescription',
        'businessEmail',
        'businessCity',
        'businessCountry',
        'businessLicenseUrl',
        'idDocumentUrl',
        'verificationSubmittedAt'
      )
      ORDER BY column_name;
    `);

    console.log('📋 Verified columns:');
    console.table(result);

    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
