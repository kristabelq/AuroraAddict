import { PrismaClient, Prisma } from '@prisma/client';
import { generateAffiliateLinks } from '../src/lib/affiliate-injector';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== POPULATING ACCOMMODATION ROOM TYPES ===\n');

  // Northern Lights Village Saariselkä
  const northernLightsId = '5ae6c72a-884e-459e-8c63-9952ea2e04e6';
  const bookingUrlNLV = 'https://www.booking.com/hotel/fi/northern-lights-village.html';

  const nlvRooms = [
    {
      name: 'Aurora Cabin - Standard',
      description: 'Cozy cabin with half-glass roof for Northern Lights viewing. Twin or double beds situated beneath the panoramic laser-heated glass roof. Includes private bathroom, complimentary WiFi, and tea/coffee facilities.',
      capacity: 2,
      priceFrom: 320,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      amenities: [
        'Heated Glass Roof', 'Northern Lights View', 'WiFi', 'Private Bathroom',
        'Shower & Hairdryer', 'Tea/Coffee Maker', 'Minibar', 'Double Bed',
        'Luggage Storage', 'Non-Smoking', '29 sqm'
      ],
      bookingComUrl: bookingUrlNLV,
      displayOrder: 1
    },
    {
      name: 'Aurora Cabin - Family',
      description: 'Spacious cabin with half-glass roof perfect for families. Features twin or double bed plus additional sofa bed suitable for 1-2 children. All the comforts of standard cabin with extra space.',
      capacity: 4,
      priceFrom: 450,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
        'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      amenities: [
        'Heated Glass Roof', 'Northern Lights View', 'WiFi', 'Private Bathroom',
        'Shower & Hairdryer', 'Tea/Coffee Maker', 'Minibar', 'Double Bed',
        'Sofa Bed', 'Family Friendly', 'Luggage Storage', 'Non-Smoking', '29 sqm'
      ],
      bookingComUrl: bookingUrlNLV,
      displayOrder: 2
    },
    {
      name: 'Polar Sky Suite',
      description: 'Luxurious suite on the southern slopes of Kaunispää Hill with panoramic glass roof. Open-plan design with kitchenette, dining area, TV, and private sauna. Complimentary shuttle service included.',
      capacity: 4,
      priceFrom: 580,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
      amenities: [
        'Heated Glass Roof', 'Northern Lights View', 'Private Sauna', 'Kitchenette',
        'WiFi', 'TV', 'Dining Table', 'Sofa Bed', 'Double Bed',
        'Private Bathroom', 'Shower', 'Shuttle Service', 'Mountain View', 'Premium'
      ],
      bookingComUrl: bookingUrlNLV,
      agodaUrl: undefined,
      directBookingUrl: 'https://saariselka.northernlightsvillage.com/',
      displayOrder: 3
    }
  ];

  // Harriniva Hotels & Safaris
  const harrinivaId = '292c72fc-2478-4460-960d-2526b45ca29e';
  const bookingUrlHarriniva = 'https://www.booking.com/hotel/fi/harriniva.html';

  const harrinivaRooms = [
    {
      name: 'Standard Twin Room',
      description: 'Cozy log-style room sleeping up to four people with twin beds, plus single or bunk beds. Rustic pine-clad interiors in tune with Lappish surroundings. En-suite bathroom with shower.',
      capacity: 4,
      priceFrom: 180,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800',
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800',
      amenities: [
        'Twin Beds', 'Bunk Beds', 'Private Bathroom', 'Shower', 'Hairdryer',
        'Log Cabin Style', 'Rustic Decor', 'Family Friendly', 'Forest View',
        'WiFi', 'Heating', 'Non-Smoking'
      ],
      bookingComUrl: bookingUrlHarriniva,
      displayOrder: 1
    },
    {
      name: 'Sauna Room',
      description: 'Charming room with double bed and open-plan seating area with sofa bed. Features a private traditional Finnish sauna for the ultimate relaxation after arctic adventures.',
      capacity: 3,
      priceFrom: 240,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      amenities: [
        'Private Sauna', 'Double Bed', 'Sofa Bed', 'Open Plan Living',
        'Private Bathroom', 'Shower', 'Hairdryer', 'Log Cabin Style',
        'Forest View', 'WiFi', 'Heating', 'Relaxation', 'Couples Friendly'
      ],
      bookingComUrl: bookingUrlHarriniva,
      displayOrder: 2
    },
    {
      name: 'Wilderness Plus Room',
      description: 'Recently renovated room with modern amenities and traditional charm. Double or twin beds with unfolding sofa bed. Perfect balance of comfort and wilderness experience.',
      capacity: 3,
      priceFrom: 220,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
      amenities: [
        'Renovated', 'Twin/Double Beds', 'Sofa Bed', 'Private Bathroom',
        'Shower', 'Hairdryer', 'Modern Amenities', 'Log Cabin Style',
        'Forest View', 'WiFi', 'Heating', 'Non-Smoking', 'Contemporary Design'
      ],
      bookingComUrl: bookingUrlHarriniva,
      displayOrder: 3
    },
    {
      name: 'Wilderness Suite',
      description: 'Spacious duplex-style suite sleeping up to five people. Double bed on mezzanine level, sofa bed on lower level. Includes mini-fridge and ecological Finnish hair and body products.',
      capacity: 5,
      priceFrom: 320,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      amenities: [
        'Duplex Suite', 'Mezzanine Bedroom', 'Double Bed', 'Sofa Bed',
        'Mini-Fridge', 'Private Bathroom', 'Shower', 'Ecological Products',
        'Forest View', 'WiFi', 'Spacious', 'Family Friendly', 'Two Levels'
      ],
      bookingComUrl: bookingUrlHarriniva,
      displayOrder: 4
    },
    {
      name: 'Safari House',
      description: 'Private cabin-style accommodation with full facilities including private sauna. Independent entrance, shower room, toilet, and hairdryer. Perfect for those seeking privacy and authentic wilderness experience.',
      capacity: 4,
      priceFrom: 380,
      currency: 'EUR',
      images: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800'
      ],
      coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      amenities: [
        'Private Cabin', 'Private Sauna', 'Independent Entrance', 'Shower Room',
        'Toilet', 'Hairdryer', 'Log Cabin', 'Forest View', 'WiFi',
        'Privacy', 'Authentic Experience', 'Full Kitchen', 'River View'
      ],
      bookingComUrl: bookingUrlHarriniva,
      agodaUrl: undefined,
      directBookingUrl: 'https://harriniva.fi/en/',
      displayOrder: 5
    }
  ];

  // Create Northern Lights Village rooms
  console.log('🏨 Northern Lights Village Saariselkä:\n');
  for (const room of nlvRooms) {
    // Generate affiliate links
    const affiliateLinks = generateAffiliateLinks({
      bookingComUrl: room.bookingComUrl,
      agodaUrl: room.agodaUrl,
      directBookingUrl: room.directBookingUrl
    });

    const created = await prisma.roomType.create({
      data: {
        businessId: northernLightsId,
        ...room,
        affiliateLinks: affiliateLinks as Prisma.JsonObject,
        isActive: true
      }
    });
    console.log(`   ✅ ${created.name} - ${created.currency}${created.priceFrom}/night`);
  }

  console.log('\n🏨 Harriniva Hotels & Safaris:\n');
  for (const room of harrinivaRooms) {
    // Generate affiliate links
    const affiliateLinks = generateAffiliateLinks({
      bookingComUrl: room.bookingComUrl,
      agodaUrl: room.agodaUrl,
      directBookingUrl: room.directBookingUrl
    });

    const created = await prisma.roomType.create({
      data: {
        businessId: harrinivaId,
        ...room,
        affiliateLinks: affiliateLinks as Prisma.JsonObject,
        isActive: true
      }
    });
    console.log(`   ✅ ${created.name} - ${created.currency}${created.priceFrom}/night`);
  }

  console.log('\n=== SUMMARY ===\n');

  // Count rooms per business
  const nlvCount = await prisma.roomType.count({
    where: { businessId: northernLightsId, isActive: true }
  });
  const harrinivaCount = await prisma.roomType.count({
    where: { businessId: harrinivaId, isActive: true }
  });

  console.log(`Northern Lights Village: ${nlvCount} room types`);
  console.log(`Harriniva Hotels & Safaris: ${harrinivaCount} room types`);
  console.log(`\n✅ Total: ${nlvCount + harrinivaCount} room types created!\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
