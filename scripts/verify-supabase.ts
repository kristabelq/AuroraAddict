import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySupabase() {
  console.log('🔍 Verifying Supabase Setup...\n');

  try {
    // 1. Check Database Connection
    console.log('1️⃣ Checking database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('   ✅ Database connection successful\n');

    // 2. Check SpaceWeatherCache table
    console.log('2️⃣ Checking SpaceWeatherCache table...');
    const cacheCount = await prisma.spaceWeatherCache.count();
    console.log(`   ✅ SpaceWeatherCache table exists (${cacheCount} records)\n`);

    // 3. Check CMERecord table
    console.log('3️⃣ Checking CMERecord table...');
    try {
      const cmeCount = await prisma.cMERecord.count();
      console.log(`   ✅ CMERecord table exists (${cmeCount} records)\n`);
    } catch (error) {
      console.log('   ❌ CMERecord table NOT found');
      console.log('   → Run ADD_CME_RECORD_TABLE.sql in Supabase SQL Editor\n');
    }

    // 4. Check Session table (for RLS)
    console.log('4️⃣ Checking Session table RLS...');
    const sessionRLS = await prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'Session'
    `;
    if (sessionRLS.length > 0 && sessionRLS[0].rowsecurity) {
      console.log('   ✅ Session table has RLS enabled\n');
    } else {
      console.log('   ⚠️  Session table RLS not enabled (recommended for security)\n');
    }

    // 5. Check Storage Buckets (via Supabase client)
    console.log('5️⃣ Checking Supabase Storage buckets...');
    console.log('   ℹ️  Check manually in Supabase Dashboard → Storage:');
    console.log('      - sightings bucket (10MB limit)');
    console.log('      - profiles bucket (2MB limit)');
    console.log('      - hunts bucket (10MB limit)\n');

    // 6. Check Environment Variables
    console.log('6️⃣ Checking environment variables...');
    const requiredEnvVars = [
      'DATABASE_URL',
      'DIRECT_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'CRON_SECRET',
    ];

    const missingVars: string[] = [];
    requiredEnvVars.forEach((varName) => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}`);
      } else {
        console.log(`   ❌ ${varName} - MISSING`);
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log(`\n   ⚠️  Missing ${missingVars.length} environment variable(s)`);
      console.log('   → Add these to Vercel environment variables\n');
    } else {
      console.log('');
    }

    // 7. Test CME Data Fetch (if CMERecord table exists)
    try {
      console.log('7️⃣ Testing CME data functionality...');
      const recentCMEs = await prisma.cMERecord.findMany({
        take: 5,
        orderBy: { startTime: 'desc' },
      });

      if (recentCMEs.length > 0) {
        console.log(`   ✅ Found ${recentCMEs.length} recent CME records`);
        console.log(`   Latest CME: ${recentCMEs[0].activityID} at ${recentCMEs[0].startTime}`);
      } else {
        console.log('   ℹ️  No CME records yet (will populate on first user visit)');
      }
    } catch (error) {
      console.log('   ⚠️  CMERecord table not available yet');
    }

    console.log('\n✅ Verification complete!\n');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySupabase();
