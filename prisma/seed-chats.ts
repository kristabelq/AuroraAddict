import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Finland area chats for soft launch
const finlandAreas = [
  {
    name: 'Levi',
    latitude: 67.8056,
    longitude: 24.8089,
    description: 'Connect with aurora hunters in Levi, one of Finland\'s premier winter destinations',
  },
  {
    name: 'Muonio',
    latitude: 67.9526,
    longitude: 23.6825,
    description: 'Join the Muonio aurora community for real-time sightings and local tips',
  },
  {
    name: 'Rovaniemi',
    latitude: 66.5039,
    longitude: 25.7294,
    description: 'Share aurora experiences in Rovaniemi, the official hometown of Santa Claus',
  },
  {
    name: 'Inari',
    latitude: 68.9063,
    longitude: 27.0283,
    description: 'Connect with aurora enthusiasts in Inari, the heart of Sámi culture',
  },
  {
    name: 'Saariselkä',
    latitude: 68.4195,
    longitude: 27.4039,
    description: 'Share sightings and tips with the Saariselkä aurora hunting community',
  },
];

async function seedFinlandChats() {
  console.log('🌌 Seeding Finland area chats...\n');

  for (const area of finlandAreas) {
    const chatName = `${area.name} Aurora Community`;

    // Check if chat already exists
    const existing = await prisma.chatGroup.findFirst({
      where: {
        name: chatName,
        groupType: 'area',
      },
    });

    if (existing) {
      console.log(`✓ Chat already exists: ${chatName}`);
      continue;
    }

    // Create area chat
    const chat = await prisma.chatGroup.create({
      data: {
        name: chatName,
        description: area.description,
        groupType: 'area',
        visibility: 'public',
        countryCode: 'FI',
        countryName: 'Finland',
        areaName: area.name,
        latitude: area.latitude,
        longitude: area.longitude,
        isActive: true,
        isVerified: true, // Area chats are auto-verified
        requireApproval: false,
        ownerId: null, // Admin-owned (no specific owner)
      },
    });

    console.log(`✓ Created: ${chat.name}`);
    console.log(`  📍 ${area.name}, Finland (${area.latitude}, ${area.longitude})`);
    console.log(`  🔗 ID: ${chat.id}\n`);
  }

  console.log('✅ Finland area chats seeded successfully!\n');
}

async function main() {
  try {
    await seedFinlandChats();

    // Display summary
    const totalChats = await prisma.chatGroup.count({
      where: {
        groupType: 'area',
        countryCode: 'FI',
      },
    });

    console.log('📊 Summary:');
    console.log(`   Total Finland area chats: ${totalChats}`);
    console.log(`   Ready for soft launch! 🚀\n`);

  } catch (error) {
    console.error('❌ Error seeding chats:', error);
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
