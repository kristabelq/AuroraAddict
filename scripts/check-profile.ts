import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfile() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'kristabelq' },
          { email: { contains: 'kristabel' } }
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        name: true,
        updatedAt: true
      }
    });

    console.log('\n📋 User Profile for kristabelq:');
    console.log('================================');
    if (user) {
      console.log('ID:', user.id);
      console.log('Username:', user.username);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Image URL:', user.image);
      console.log('Last Updated:', user.updatedAt);

      // Check if the expected image is in the URL
      if (user.image?.includes('1771771025847-qjekhl.jpg')) {
        console.log('\n✅ Profile image IS the expected file!');
      } else if (user.image?.includes('1771771025847')) {
        console.log('\n⚠️  Profile image contains timestamp but different filename');
      } else {
        console.log('\n❌ Profile image is NOT the expected file');
        console.log('   Expected: 1771771025847-qjekhl.jpg');
        console.log('   Actual:', user.image?.split('/').pop() || 'null');
      }
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfile();
