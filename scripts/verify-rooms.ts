import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== VERIFYING ROOM TYPES & CATEGORY PREVIEWS ===\n');

  const businesses = [
    { id: '5ae6c72a-884e-459e-8c63-9952ea2e04e6', name: 'Northern Lights Village' },
    { id: '292c72fc-2478-4460-960d-2526b45ca29e', name: 'Harriniva Hotels & Safaris' }
  ];

  for (const biz of businesses) {
    console.log(`\n🏨 ${biz.name}`);
    console.log('─'.repeat(50));

    const business = await prisma.user.findUnique({
      where: { id: biz.id },
      select: {
        businessServices: true
      }
    });

    console.log(`Services: [${business?.businessServices.join(', ')}]`);

    const roomTypes = await prisma.roomType.findMany({
      where: {
        businessId: biz.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceFrom: true,
        currency: true,
        capacity: true,
        bookingComUrl: true,
        directBookingUrl: true,
        affiliateLinks: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { priceFrom: 'asc' }
      ]
    });

    console.log(`\nRoom Types (${roomTypes.length}):`);
    roomTypes.forEach((room, idx) => {
      console.log(`  ${idx + 1}. ${room.name}`);
      console.log(`     Price: ${room.currency}${room.priceFrom}/night | Capacity: ${room.capacity}`);
      console.log(`     Booking.com: ${room.bookingComUrl ? '✅' : '❌'}`);
      console.log(`     Direct: ${room.directBookingUrl ? '✅' : '❌'}`);
      console.log(`     Affiliate Links: ${room.affiliateLinks ? '✅' : '❌'}`);
    });

    // Calculate preview data
    if (roomTypes.length > 0) {
      const minPrice = Math.min(...roomTypes.filter(r => r.priceFrom).map(r => r.priceFrom!));
      const highlights = roomTypes.slice(0, 3).map(r => r.name);
      const hasBookingOptions = roomTypes.some(r => r.bookingComUrl || r.directBookingUrl);

      console.log('\n📊 Category Preview Data:');
      console.log(`   Count: ${roomTypes.length}`);
      console.log(`   Min Price: €${minPrice}/night`);
      console.log(`   Has Booking Options: ${hasBookingOptions ? '✅ Yes' : '❌ No'}`);
      console.log(`   Highlights: ${highlights.join(', ')}`);
    }
  }

  console.log('\n\n✅ Verification complete!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
