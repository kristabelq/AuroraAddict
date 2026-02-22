import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function testCMEFetch() {
  console.log('\n🔍 Testing CME Data Fetch...\n');

  // 1. Check NASA API Key
  console.log('1️⃣ Checking NASA API Key:');
  const apiKey = process.env.NASA_API_KEY;
  if (apiKey && apiKey !== 'DEMO_KEY') {
    console.log(`   ✅ NASA_API_KEY is set (${apiKey.substring(0, 8)}...)\n`);
  } else {
    console.log(`   ⚠️  Using DEMO_KEY (rate limited to 30 requests/hour)\n`);
  }

  // 2. Check last fetch record
  console.log('2️⃣ Checking last fetch record:');
  const lastFetch = await prisma.spaceWeatherCache.findUnique({
    where: {
      dataType_source: {
        dataType: 'cme-last-fetch',
        source: 'nasa-donki',
      },
    },
  });

  if (lastFetch) {
    const ageMinutes = Math.floor(
      (Date.now() - new Date(lastFetch.lastUpdated).getTime()) / (1000 * 60)
    );
    console.log(`   ✅ Last fetch found: ${lastFetch.lastUpdated}`);
    console.log(`   Age: ${ageMinutes} minutes old`);
    console.log(`   Data: ${JSON.stringify(lastFetch.data)}\n`);
  } else {
    console.log('   ❌ No last fetch record found\n');
  }

  // 3. Test NASA API call
  console.log('3️⃣ Testing NASA DONKI API:');
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const url = `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=${apiKey || 'DEMO_KEY'}`;

    console.log(`   URL: ${url.replace(apiKey || 'DEMO_KEY', '***')}\n`);

    const response = await fetch(url);

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ API Error: ${text}\n`);
      return;
    }

    const data = await response.json();
    console.log(`   ✅ API Success: ${data.length} CME records found\n`);

    if (data.length > 0) {
      console.log('   Latest CME:');
      console.log(`   - Activity ID: ${data[0].activityID}`);
      console.log(`   - Start Time: ${data[0].startTime}`);
      console.log(`   - Source: ${data[0].sourceLocation || 'Unknown'}\n`);
    }

  } catch (error) {
    console.error('   ❌ Fetch failed:', error);
  }

  // 4. Check CME records in database
  console.log('4️⃣ Checking CME records in database:');
  const cmeCount = await prisma.cMERecord.count();
  console.log(`   Total records: ${cmeCount}`);

  if (cmeCount > 0) {
    const latestCME = await prisma.cMERecord.findFirst({
      orderBy: { startTime: 'desc' },
    });
    console.log(`   Latest CME: ${latestCME?.activityID} at ${latestCME?.startTime}\n`);
  } else {
    console.log('   ⚠️  No CME records in database\n');
  }

  await prisma.$disconnect();
}

testCMEFetch();
