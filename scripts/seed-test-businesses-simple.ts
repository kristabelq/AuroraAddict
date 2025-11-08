import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_BUSINESSES = [
  {
    name: "Arctic Adventures Levi",
    email: "test.arcticadventures@auroraaddict.test",
    username: "arcticadventureslevi",
    businessName: "Arctic Adventures Levi",
    businessCategory: "tour_operator",
    businessDescription: "Experience the magic of Lapland with our aurora hunting tours, husky sledding, and snowmobile adventures.",
    businessWebsite: "https://www.arctictours.fi",
    businessPhone: "+358401234567",
    businessEmail: "info@arctictours.fi",
    businessAddress: "Levintie 1590",
    businessCity: "Levi",
    businessCountry: "Finland",
  },
  {
    name: "Northern Lights Village",
    email: "test.northernlightsvillage@auroraaddict.test",
    username: "northernlightsvillage",
    businessName: "Northern Lights Village",
    businessCategory: "accommodation",
    businessDescription: "Sleep under the northern lights in our luxury glass igloos.",
    businessWebsite: "https://www.northernlightsvillage.fi",
    businessPhone: "+358501234568",
    businessEmail: "reservations@northernlightsvillage.fi",
    businessAddress: "Ounasjoentie 30",
    businessCity: "Saariselkä",
    businessCountry: "Finland",
  },
  {
    name: "Lights Over Lapland",
    email: "test.lightsoverlapland@auroraaddict.test",
    username: "lightsoverlapland",
    businessName: "Lights Over Lapland",
    businessCategory: "photography",
    businessDescription: "Professional aurora photography workshops and tours.",
    businessWebsite: "https://www.lightsoverlapland.com",
    businessPhone: "+358451234569",
    businessEmail: "bookings@lightsoverlapland.com",
    businessAddress: "Lappeasuando 85",
    businessCity: "Abisko",
    businessCountry: "Sweden",
  },
  {
    name: "Restaurant Aanaar",
    email: "test.aanaar@auroraaddict.test",
    username: "restaurantaanaar",
    businessName: "Restaurant Aanaar",
    businessCategory: "restaurant",
    businessDescription: "Authentic Sámi cuisine featuring local ingredients.",
    businessWebsite: "https://www.aanaar.fi",
    businessPhone: "+358161234570",
    businessEmail: "info@aanaar.fi",
    businessAddress: "Inarintie 40",
    businessCity: "Inari",
    businessCountry: "Finland",
  },
  {
    name: "Harriniva Hotels & Safaris",
    email: "test.harriniva@auroraaddict.test",
    username: "harrinivahotels",
    businessName: "Harriniva Hotels & Safaris",
    businessCategory: "accommodation",
    businessDescription: "Family-run wilderness lodge offering aurora safaris.",
    businessWebsite: "https://www.harriniva.fi",
    businessPhone: "+358401234571",
    businessEmail: "sales@harriniva.fi",
    businessAddress: "Harrinivantie 35",
    businessCity: "Muonio",
    businessCountry: "Finland",
  },
  {
    name: "Arctic Gear Rovaniemi",
    email: "test.arcticgear@auroraaddict.test",
    username: "arcticgearrovaniemi",
    businessName: "Arctic Gear Rovaniemi",
    businessCategory: "shop",
    businessDescription: "Your one-stop shop for aurora hunting gear and photography equipment.",
    businessWebsite: "https://www.arcticgear.fi",
    businessPhone: "+358161234572",
    businessEmail: "shop@arcticgear.fi",
    businessAddress: "Koskikatu 25",
    businessCity: "Rovaniemi",
    businessCountry: "Finland",
  },
];

async function main() {
  console.log('🌌 Seeding test business accounts...\n');

  for (const business of TEST_BUSINESSES) {
    console.log(`Creating ${business.businessName}...`);

    try {
      // Use INSERT ... ON CONFLICT to handle existing users
      await prisma.$executeRawUnsafe(`
        INSERT INTO "User" (
          id, name, email, username, "emailVerified",
          "userType", "businessName", "businessCategory", "businessDescription",
          "businessWebsite", "businessPhone", "businessEmail",
          "businessAddress", "businessCity", "businessCountry",
          "businessLicenseUrl", "idDocumentUrl",
          "verificationStatus", "verificationSubmittedAt", "verifiedAt", "verifiedBy",
          "onboardingComplete", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          '${business.name}',
          '${business.email}',
          '${business.username}',
          NOW(),
          'business',
          '${business.businessName}',
          '${business.businessCategory}',
          '${business.businessDescription.replace(/'/g, "''")}',
          '${business.businessWebsite}',
          '${business.businessPhone}',
          '${business.businessEmail}',
          '${business.businessAddress}',
          '${business.businessCity}',
          '${business.businessCountry}',
          '/placeholder-business-license.pdf',
          '/placeholder-id-document.pdf',
          'verified',
          NOW(),
          NOW(),
          'system-seed',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
          "userType" = 'business',
          "businessName" = '${business.businessName}',
          "businessCategory" = '${business.businessCategory}',
          "businessDescription" = '${business.businessDescription.replace(/'/g, "''")}',
          "businessWebsite" = '${business.businessWebsite}',
          "businessPhone" = '${business.businessPhone}',
          "businessEmail" = '${business.businessEmail}',
          "businessAddress" = '${business.businessAddress}',
          "businessCity" = '${business.businessCity}',
          "businessCountry" = '${business.businessCountry}',
          "verificationStatus" = 'verified',
          "verificationSubmittedAt" = NOW(),
          "verifiedAt" = NOW(),
          "verifiedBy" = 'system-seed',
          "updatedAt" = NOW();
      `);

      console.log(`  ✅ Created/Updated ${business.businessName}\n`);
    } catch (error: any) {
      console.error(`  ❌ Error creating ${business.businessName}:`, error.message);
    }
  }

  console.log('\n🎉 Finished seeding test businesses!');
  console.log('\n📋 Test Business Accounts:');
  console.log('═══════════════════════════════════════════════════════');

  for (const business of TEST_BUSINESSES) {
    console.log(`\n${business.businessName}`);
    console.log(`  Category: ${business.businessCategory}`);
    console.log(`  Location: ${business.businessCity}, ${business.businessCountry}`);
    console.log(`  Email: ${business.email}`);
    console.log(`  Username: @${business.username}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n💡 These accounts are now verified and ready for testing!');
  console.log('   View them at: http://localhost:3002/admin/business-verifications\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
