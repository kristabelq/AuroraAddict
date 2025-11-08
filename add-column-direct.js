const { Client } = require('pg');

async function addColumn() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || "postgresql://postgres.jjszyfcuizchczfkinfd:Kristabology123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres",
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('\nAdding hideFromPublic column...');
    await client.query(`
      ALTER TABLE "Hunt"
      ADD COLUMN IF NOT EXISTS "hideFromPublic" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Column added successfully!');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Hunt' AND column_name = 'hideFromPublic';
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Verification successful! Column details:');
      console.log(result.rows[0]);
    } else {
      console.log('\n⚠️  Column not found in verification query');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addColumn();
