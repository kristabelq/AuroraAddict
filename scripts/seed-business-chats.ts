import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map businesses to their areas
const BUSINESS_CHAT_CONFIG = [
  {
    businessEmail: 'test.arcticadventures@auroraaddict.test',
    businessName: 'Arctic Adventures Levi',
    businessCategory: 'tour_operator',
    areaName: 'Levi',
    latitude: 67.8056,
    longitude: 24.8089,
  },
  {
    businessEmail: 'test.northernlightsvillage@auroraaddict.test',
    businessName: 'Northern Lights Village',
    businessCategory: 'accommodation',
    areaName: 'Saariselkä',
    latitude: 68.4195,
    longitude: 27.4039,
  },
  {
    businessEmail: 'test.lightsoverlapland@auroraaddict.test',
    businessName: 'Lights Over Lapland',
    businessCategory: 'photography',
    areaName: 'Levi', // Swedish business but we'll put in Levi for now
    latitude: 67.8056,
    longitude: 24.8089,
  },
  {
    businessEmail: 'test.aanaar@auroraaddict.test',
    businessName: 'Restaurant Aanaar',
    businessCategory: 'restaurant',
    areaName: 'Inari',
    latitude: 68.9063,
    longitude: 27.0283,
  },
  {
    businessEmail: 'test.harriniva@auroraaddict.test',
    businessName: 'Harriniva Hotels & Safaris',
    businessCategory: 'accommodation',
    areaName: 'Muonio',
    latitude: 67.9526,
    longitude: 23.6825,
  },
  {
    businessEmail: 'test.arcticgear@auroraaddict.test',
    businessName: 'Arctic Gear Rovaniemi',
    businessCategory: 'shop',
    areaName: 'Rovaniemi',
    latitude: 66.5039,
    longitude: 25.7294,
  },
];

async function seedBusinessChats() {
  console.log('🌌 Creating business chat groups...\n');

  for (const config of BUSINESS_CHAT_CONFIG) {
    console.log(`\n📋 Setting up: ${config.businessName}`);

    // Find the business user
    const businessUser = await prisma.user.findUnique({
      where: { email: config.businessEmail },
    });

    if (!businessUser) {
      console.log(`  ⚠️  Business user not found, skipping...`);
      continue;
    }

    if (businessUser.verificationStatus !== 'verified') {
      console.log(`  ⚠️  Business not verified, skipping...`);
      continue;
    }

    // Check if chats already exist
    const existingChats = await prisma.chatGroup.findMany({
      where: {
        ownerId: businessUser.id,
      },
    });

    if (existingChats.length > 0) {
      console.log(`  ✓ Chat groups already exist (${existingChats.length})`);
      continue;
    }

    // Create public chat
    const publicChat = await prisma.chatGroup.create({
      data: {
        name: `${config.businessName} - Public`,
        description: `Join ${config.businessName} for aurora updates, tours, and community discussions in ${config.areaName}.`,
        groupType: 'business_public',
        visibility: 'public',
        countryCode: 'FI',
        countryName: 'Finland',
        areaName: config.areaName,
        latitude: config.latitude,
        longitude: config.longitude,
        ownerId: businessUser.id,
        businessCategory: config.businessCategory,
        isActive: true,
        isVerified: true, // Verified businesses get verified chats
        requireApproval: false,
      },
    });

    console.log(`  ✅ Created public chat: ${publicChat.id}`);

    // Create private chat
    const privateChat = await prisma.chatGroup.create({
      data: {
        name: `${config.businessName} - Private`,
        description: `Exclusive chat for ${config.businessName} customers and VIP members.`,
        groupType: 'business_private',
        visibility: 'private',
        countryCode: 'FI',
        countryName: 'Finland',
        areaName: config.areaName,
        latitude: config.latitude,
        longitude: config.longitude,
        ownerId: businessUser.id,
        businessCategory: config.businessCategory,
        linkedChatId: publicChat.id, // Link to public chat
        isActive: true,
        isVerified: true,
        requireApproval: true, // Private requires approval
        memberLimit: 50,
      },
    });

    console.log(`  ✅ Created private chat: ${privateChat.id}`);

    // Link the public chat back to private
    await prisma.chatGroup.update({
      where: { id: publicChat.id },
      data: { linkedChatId: privateChat.id },
    });

    // Add business owner as member of both chats with owner role
    await prisma.chatMembership.createMany({
      data: [
        {
          chatGroupId: publicChat.id,
          userId: businessUser.id,
          role: 'owner',
          status: 'active',
        },
        {
          chatGroupId: privateChat.id,
          userId: businessUser.id,
          role: 'owner',
          status: 'active',
        },
      ],
    });

    console.log(`  ✅ Added owner to both chats`);

    // Create mock subscription record
    const subscription = await prisma.businessChatSubscription.create({
      data: {
        businessUserId: businessUser.id,
        areaName: config.areaName,
        businessCategory: config.businessCategory,
        publicChatId: publicChat.id,
        privateChatId: privateChat.id,
        status: 'active',
        monthlyPrice: config.businessCategory === 'accommodation' ? 79 : 59,
        currency: 'EUR',
        billingPeriod: 'monthly',
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        startDate: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    console.log(`  ✅ Created subscription: ${subscription.id}`);
    console.log(`  💰 Price: €${subscription.monthlyPrice}/month`);
  }

  console.log('\n\n🎉 Business chat groups created successfully!\n');
}

async function main() {
  try {
    await seedBusinessChats();

    // Summary
    const totalBusinessChats = await prisma.chatGroup.count({
      where: {
        groupType: {
          in: ['business_public', 'business_private'],
        },
      },
    });

    const totalSubscriptions = await prisma.businessChatSubscription.count();

    console.log('📊 Summary:');
    console.log(`   Business chat groups: ${totalBusinessChats}`);
    console.log(`   Active subscriptions: ${totalSubscriptions}`);
    console.log(`   Ready for testing! 🚀\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
