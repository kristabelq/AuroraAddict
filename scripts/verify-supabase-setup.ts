/**
 * Verification script for Supabase Auth integration
 * Run with: npx ts-node scripts/verify-supabase-setup.ts
 */

import { createClient } from '@supabase/supabase-js'

async function verifySetup() {
  console.log('🔍 Verifying Supabase Auth Integration...\n')

  // Check environment variables
  const checks = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
    'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  }

  let allConfigured = true

  console.log('📋 Environment Variables:')
  for (const [key, value] of Object.entries(checks)) {
    if (value) {
      const masked = key.includes('KEY') || key.includes('SECRET')
        ? value.substring(0, 10) + '...'
        : value
      console.log(`  ✅ ${key}: ${masked}`)
    } else {
      console.log(`  ❌ ${key}: NOT SET`)
      allConfigured = false
    }
  }

  console.log()

  if (!allConfigured) {
    console.log('❌ Some environment variables are missing!')
    console.log('\nTo get your SUPABASE_SERVICE_ROLE_KEY:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Project Settings → API')
    console.log('4. Copy the service_role key')
    console.log('5. Add it to your .env file as SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Test Supabase connection
  console.log('🔌 Testing Supabase Connection...')
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test a simple query
    const { error } = await supabase.from('User').select('count').limit(1)

    if (error && error.code !== 'PGRST116') {
      console.log(`  ⚠️  Database connection: ${error.message}`)
    } else {
      console.log('  ✅ Successfully connected to Supabase')
    }
  } catch (error) {
    console.log(`  ❌ Failed to connect: ${error}`)
    process.exit(1)
  }

  // Test admin client
  console.log('\n🔑 Testing Admin Access...')
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })

    if (error) {
      console.log(`  ❌ Admin access failed: ${error.message}`)
      console.log('  Make sure your SUPABASE_SERVICE_ROLE_KEY is correct')
      process.exit(1)
    }

    console.log(`  ✅ Admin access working (${data?.users?.length || 0} users found in Supabase Auth)`)
  } catch (error) {
    console.log(`  ❌ Admin test failed: ${error}`)
    process.exit(1)
  }

  console.log('\n✨ All checks passed! Supabase Auth integration is ready to use.')
  console.log('\nNext steps:')
  console.log('1. Create a test user via your registration flow')
  console.log('2. Check that they appear in Supabase Dashboard → Authentication → Users')
  console.log('3. Try using Supabase Storage or Realtime features')
  console.log('\nFor usage examples, see: SUPABASE_AUTH_INTEGRATION.md')
}

verifySetup().catch(console.error)
