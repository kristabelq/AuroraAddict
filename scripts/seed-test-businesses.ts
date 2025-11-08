import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_BUSINESSES = [
  {
    // Real tour operator in Levi
    name: "Arctic Adventures Levi",
    email: "test.arcticadventures@auroraaddict.test",
    username: "arcticadventureslevi",
    businessName: "Arctic Adventures Levi",
    businessCategory: "tour_operator",
    businessDescription: "Experience the magic of Lapland with our aurora hunting tours, husky sledding, and snowmobile adventures. We've been guiding visitors through the Arctic wilderness for over 10 years.",
    businessWebsite: "https://www.arctictours.fi",
    businessPhone: "+358401234567",
    businessEmail: "info@arctictours.fi",
    businessAddress: "Levintie 1590",
    businessCity: "Levi",
    businessCountry: "Finland",
  },
  {
    // Real glass igloo accommodation
    name: "Northern Lights Village",
    email: "test.northernlightsvillage@auroraaddict.test",
    username: "northernlightsvillage",
    businessName: "Northern Lights Village",
    businessCategory: "accommodation",
    businessDescription: "Sleep under the northern lights in our luxury glass igloos. Each igloo offers 360-degree views of the Arctic sky, heated glass roofs, and modern amenities for an unforgettable experience.",
    businessWebsite: "https://www.northernlightsvillage.fi",
    businessPhone: "+358501234568",
    businessEmail: "reservations@northernlightsvillage.fi",
    businessAddress: "Ounasjoentie 30",
    businessCity: "Saariselkä",
    businessCountry: "Finland",
  },
  {
    // Aurora photography tours
    name: "Lights Over Lapland",
    email: "test.lightsoverlapland@auroraaddict.test",
    username: "lightsoverlapland",
    businessName: "Lights Over Lapland",
    businessCategory: "photography",
    businessDescription: "Professional aurora photography workshops and tours in Swedish Lapland. Learn to capture the northern lights with expert guidance from award-winning photographers.",
    businessWebsite: "https://www.lightsoverlapland.com",
    businessPhone: "+358451234569",
    businessEmail: "bookings@lightsoverlapland.com",
    businessAddress: "Lappeasuando 85",
    businessCity: "Abisko",
    businessCountry: "Sweden",
  },
  {
    // Traditional Lappish restaurant
    name: "Restaurant Aanaar",
    email: "test.aanaar@auroraaddict.test",
    username: "restaurantaanaar",
    businessName: "Restaurant Aanaar",
    businessCategory: "restaurant",
    businessDescription: "Authentic Sámi cuisine featuring local ingredients like reindeer, Arctic char, and cloudberries. Enjoy traditional Lappish dishes in a cozy, rustic atmosphere while watching for auroras.",
    businessWebsite: "https://www.aanaar.fi",
    businessPhone: "+358161234570",
    businessEmail: "info@aanaar.fi",
    businessAddress: "Inarintie 40",
    businessCity: "Inari",
    businessCountry: "Finland",
  },
  {
    // Wilderness lodge in Muonio
    name: "Harriniva Hotels & Safaris",
    email: "test.harriniva@auroraaddict.test",
    username: "harrinivahotels",
    businessName: "Harriniva Hotels & Safaris",
    businessCategory: "accommodation",
    businessDescription: "Family-run wilderness lodge offering aurora safaris, husky tours, and authentic Lapland experiences. Cozy log cabins with traditional Finnish saunas and modern comforts.",
    businessWebsite: "https://www.harriniva.fi",
    businessPhone: "+358401234571",
    businessEmail: "sales@harriniva.fi",
    businessAddress: "Harrinivantie 35",
    businessCity: "Muonio",
    businessCountry: "Finland",
  },
  {
    // Aurora gear shop
    name: "Arctic Gear Rovaniemi",
    email: "test.arcticgear@auroraaddict.test",
    username: "arcticgearrovaniemi",
    businessName: "Arctic Gear Rovaniemi",
    businessCategory: "shop",
    businessDescription: "Your one-stop shop for aurora hunting gear, winter clothing, and photography equipment. We offer camera rentals, thermal clothing, and expert advice for capturing the northern lights.",
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
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: business.email },
      });

      if (existingUser) {
        console.log(`  ⚠️  User already exists, updating...`);

        await prisma.user.update({
          where: { email: business.email },
          data: {
            name: business.name,
            username: business.username,
            userType: 'business',
            businessName: business.businessName,
            businessCategory: business.businessCategory,
            businessDescription: business.businessDescription,
            businessWebsite: business.businessWebsite,
            businessPhone: business.businessPhone,
            businessEmail: business.businessEmail,
            businessAddress: business.businessAddress,
            businessCity: business.businessCity,
            businessCountry: business.businessCountry,
            businessLicenseUrl: '/placeholder-business-license.pdf',
            idDocumentUrl: '/placeholder-id-document.pdf',
            verificationStatus: 'verified',
            verificationSubmittedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'system-seed',
            onboardingComplete: true,
          },
        });

        console.log(`  ✅ Updated ${business.businessName}\n`);
      } else {
        // Create new user
        const user = await prisma.user.create({
          data: {
            name: business.name,
            email: business.email,
            username: business.username,
            emailVerified: new Date(),
            userType: 'business',
            businessName: business.businessName,
            businessCategory: business.businessCategory,
            businessDescription: business.businessDescription,
            businessWebsite: business.businessWebsite,
            businessPhone: business.businessPhone,
            businessEmail: business.businessEmail,
            businessAddress: business.businessAddress,
            businessCity: business.businessCity,
            businessCountry: business.businessCountry,
            businessLicenseUrl: '/placeholder-business-license.pdf',
            idDocumentUrl: '/placeholder-id-document.pdf',
            verificationStatus: 'verified',
            verificationSubmittedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'system-seed',
            onboardingComplete: true,
          },
        });

        console.log(`  ✅ Created ${business.businessName} (ID: ${user.id})\n`);
      }
    } catch (error) {
      console.error(`  ❌ Error creating ${business.businessName}:`, error);
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
