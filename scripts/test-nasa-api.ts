import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testNASAAPI() {
  console.log('\n🚀 Testing NASA DONKI API with different date ranges...\n');

  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

  // Test 1: Recent dates (last 30 days)
  console.log('1️⃣ Testing last 30 days:');
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const url = `https://api.nasa.gov/DONKI/CME?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&api_key=${apiKey}`;

    console.log(`   Date range: ${formatDate(startDate)} to ${formatDate(endDate)}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: ${data.length} CME records\n`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error: ${text.substring(0, 200)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}\n`);
  }

  // Test 2: Known good date range (Jan 2025)
  console.log('2️⃣ Testing known good date (Jan 2025):');
  try {
    const url = `https://api.nasa.gov/DONKI/CME?startDate=2025-01-01&endDate=2025-01-31&api_key=${apiKey}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    console.log(`   Date range: 2025-01-01 to 2025-01-31`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Success: ${data.length} CME records\n`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Error: ${text.substring(0, 200)}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}\n`);
  }

  // Test 3: API status endpoint
  console.log('3️⃣ Testing NASA API status:');
  try {
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&count=1`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log(`   ✅ NASA API is reachable\n`);
    } else {
      console.log(`   ❌ NASA API unreachable\n`);
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : error}\n`);
  }

  console.log('💡 Recommendations:');
  console.log('   1. Get a free NASA API key: https://api.nasa.gov/');
  console.log('   2. Add NASA_API_KEY to Vercel environment variables');
  console.log('   3. Consider adding fallback/retry logic for API failures\n');
}

testNASAAPI();
