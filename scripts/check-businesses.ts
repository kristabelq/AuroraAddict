import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('Checking for business users...\n');

    const businesses = await prisma.user.findMany({
      where: {
        userType: 'business',
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessCategory: true,
        verificationStatus: true,
      },
      take: 10,
    });

    console.log(`Found ${businesses.length} business users:\n`);

    businesses.forEach((business) => {
      console.log(`ID: ${business.id}`);
      console.log(`Name: ${business.name}`);
      console.log(`Business Name: ${business.businessName}`);
      console.log(`Email: ${business.email}`);
      console.log(`Category: ${business.businessCategory}`);
      console.log(`Status: ${business.verificationStatus}`);
      console.log('---');
    });

    // Check chat groups
    console.log('\nChecking chat groups...\n');

    const chatGroups = await prisma.chatGroup.findMany({
      where: {
        groupType: {
          in: ['business_public', 'business_private'],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      take: 10,
    });

    console.log(`Found ${chatGroups.length} business chat groups:\n`);

    chatGroups.forEach((chat) => {
      console.log(`Chat ID: ${chat.id}`);
      console.log(`Owner ID: ${chat.ownerId}`);
      console.log(`Owner Name: ${chat.owner?.businessName}`);
      console.log(`Type: ${chat.groupType}`);
      console.log(`Name: ${chat.name}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
