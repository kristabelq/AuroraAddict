import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/populate-tours
 * Populate tour experiences for Arctic Adventures Levi
 */
export async function POST() {
  try {
    const businessId = '657f1234-ce64-4a47-b499-ff55b9a8e775'; // Arctic Adventures Levi

    const tours = [
      {
        name: 'Northern Lights Hunting Photography Tour',
        description: 'Join our expert guides for an unforgettable aurora hunting adventure. We\'ll take you to the best locations away from light pollution for optimal Northern Lights viewing and photography. Professional photography guidance included.',
        duration: '3-4 hours',
        groupSizeMin: 2,
        groupSizeMax: 8,
        difficulty: 'Easy',
        season: 'September - March',
        priceFrom: 145,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/real-northern-lights-hunting-levi-lapland-beyond-arctic_block.jpg',
          'https://media.voog.com/0000/0041/6144/photos/aurora-borealis-northern-lights-winter-levi-lapland-finland-beyond-arctic-web_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/real-northern-lights-hunting-levi-lapland-beyond-arctic_block.jpg',
        highlights: [
          'Professional aurora photography guidance',
          'Small group experience',
          'Best viewing locations',
          'Warm drinks and snacks included',
          'All weather gear provided'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Professional guide',
          'Thermal suits',
          'Hot drinks and snacks',
          'Photography tips and assistance'
        ],
        displayOrder: 1
      },
      {
        name: 'Private Northern Lights Photography Tour',
        description: 'Exclusive private aurora hunting experience tailored to your group. Perfect for photographers and families who want personalized attention and flexible timing. Our expert guides will ensure you get the best shots of the Northern Lights.',
        duration: '3-5 hours',
        groupSizeMin: 1,
        groupSizeMax: 6,
        difficulty: 'Easy',
        season: 'September - March',
        priceFrom: 800,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/aurora-borealis-northern-lights-winter-levi-lapland-finland-beyond-arctic-web_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/real-northern-lights-hunting-levi-lapland-beyond-arctic_block.jpg'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/aurora-borealis-northern-lights-winter-levi-lapland-finland-beyond-arctic-web_block.JPG',
        highlights: [
          'Exclusive private tour',
          'Flexible timing and locations',
          'Professional photography guidance',
          'Personalized attention',
          'All weather gear provided'
        ],
        included: [
          'Private transportation',
          'Professional guide',
          'Thermal suits',
          'Hot drinks and snacks',
          'Photography equipment tips'
        ],
        displayOrder: 2
      },
      {
        name: 'Northern Lights Snowmobile Adventure',
        description: 'Combine the thrill of snowmobiling with aurora hunting! Ride through the snowy wilderness to remote locations perfect for Northern Lights viewing. No snowmobile experience required - we provide full instruction.',
        duration: '3-4 hours',
        groupSizeMin: 2,
        groupSizeMax: 10,
        difficulty: 'Moderate',
        season: 'December - March',
        priceFrom: 165,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/snowmobile-adventure-sunny-day-snowmobilebeyond-arctic-levi-lapland-finland_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/snowmobiling-adventure-mountain-forest-beyond-arctic-levi-lapland-finland_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/aurora-borealis-northern-lights-winter-levi-lapland-finland-beyond-arctic-web_block.JPG'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/snowmobile-adventure-sunny-day-snowmobilebeyond-arctic-levi-lapland-finland_block.JPG',
        highlights: [
          'Snowmobile adventure',
          'Aurora hunting',
          'Full instruction provided',
          'Remote wilderness locations',
          'Warm drinks at campfire'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Snowmobile and fuel',
          'Safety equipment and instruction',
          'Thermal suits',
          'Hot drinks and snacks'
        ],
        displayOrder: 3
      },
      {
        name: 'Snowmobile Adventure to the Fells',
        description: 'Experience the thrill of snowmobiling through Lapland\'s stunning fell landscapes. This full adventure takes you high into the mountains with breathtaking panoramic views. Perfect for adventure seekers!',
        duration: '2-3 hours',
        groupSizeMin: 2,
        groupSizeMax: 12,
        difficulty: 'Moderate',
        season: 'December - April',
        priceFrom: 198,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/snowmobiling-adventure-mountain-forest-beyond-arctic-levi-lapland-finland_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg',
          'https://media.voog.com/0000/0041/6144/photos/snowmobile-rider-snow-winter-snowmobiling-beyond-arctic-levi-lapland-finland_block.JPG'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/snowmobiling-adventure-mountain-forest-beyond-arctic-levi-lapland-finland_block.JPG',
        highlights: [
          'Mountain fell riding',
          'Panoramic views',
          'Professional guides',
          'No experience needed',
          'Photo opportunities'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Snowmobile and fuel',
          'Safety gear and instruction',
          'Thermal suits',
          'Hot drinks'
        ],
        displayOrder: 4
      },
      {
        name: '1-Hour Easy Snowmobile Tour',
        description: 'Perfect introduction to snowmobiling! This short tour is ideal for beginners or those with limited time. Ride through beautiful snowy forests and open landscapes with expert instruction.',
        duration: '1 hour',
        groupSizeMin: 2,
        groupSizeMax: 12,
        difficulty: 'Easy',
        season: 'December - April',
        priceFrom: 99,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/snowmobile-rider-snow-winter-snowmobiling-beyond-arctic-levi-lapland-finland_block.JPG',
          'https://media.voog.com/0000/0041/6144/photos/snowmobile-adventure-sunny-day-snowmobilebeyond-arctic-levi-lapland-finland_block.JPG'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/snowmobile-rider-snow-winter-snowmobiling-beyond-arctic-levi-lapland-finland_block.JPG',
        highlights: [
          'Perfect for beginners',
          'Full instruction included',
          'Beautiful winter scenery',
          'Quick adventure',
          'Easy terrain'
        ],
        included: [
          'Snowmobile and fuel',
          'Safety equipment',
          'Full instruction',
          'Thermal suits'
        ],
        displayOrder: 5
      },
      {
        name: 'Husky Sledding Adventure',
        description: 'Experience the traditional way of Arctic travel! Meet our friendly husky pack and enjoy a thrilling 5km sled ride through the snowy wilderness. Learn about these amazing dogs and try driving the sled yourself.',
        duration: '2-3 hours',
        groupSizeMin: 2,
        groupSizeMax: 8,
        difficulty: 'Easy',
        season: 'December - April',
        priceFrom: 145,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/husky-pack-rovaniemi-lapland-beyond-arctic_block.webp'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/husky-pack-rovaniemi-lapland-beyond-arctic_block.webp',
        highlights: [
          'Meet the husky pack',
          '5km sled ride',
          'Try driving the sled',
          'Learn about huskies',
          'Photo opportunities'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Professional guide',
          'Thermal suits',
          'Hot drinks',
          'Sled ride experience'
        ],
        displayOrder: 6
      },
      {
        name: 'Ice Fishing on Frozen Lake',
        description: 'Try the traditional Lappish pastime of ice fishing! Drill through the thick ice and learn fishing techniques from our local guides. Enjoy the peaceful winter atmosphere and maybe catch your dinner!',
        duration: '2-3 hours',
        groupSizeMin: 2,
        groupSizeMax: 8,
        difficulty: 'Easy',
        season: 'December - April',
        priceFrom: 105,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg',
        highlights: [
          'Traditional ice fishing',
          'Learn local techniques',
          'Beautiful lake setting',
          'Hot drinks by the fire',
          'Keep your catch'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Fishing equipment',
          'Ice drilling equipment',
          'Thermal suits',
          'Hot drinks and snacks'
        ],
        displayOrder: 7
      },
      {
        name: 'Snowshoe Wilderness Adventure',
        description: 'Explore the pristine Arctic wilderness on snowshoes! This peaceful nature walk takes you through untouched snow-covered forests and frozen landscapes. Learn about Arctic nature and wildlife from expert guides.',
        duration: '2-3 hours',
        groupSizeMin: 2,
        groupSizeMax: 8,
        difficulty: 'Easy',
        season: 'November - April',
        priceFrom: 105,
        currency: 'EUR',
        images: [
          'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg'
        ],
        coverImage: 'https://media.voog.com/0000/0041/6144/photos/amazing-views-over-the-fells-levi-lapland-beyond-arctic_block.jpg',
        highlights: [
          'Peaceful wilderness trek',
          'Learn about Arctic nature',
          'Beautiful scenery',
          'Suitable for all fitness levels',
          'Hot drinks in nature'
        ],
        included: [
          'Hotel pickup and drop-off',
          'Snowshoes',
          'Trekking poles',
          'Thermal suits',
          'Hot drinks and snacks'
        ],
        displayOrder: 8
      }
    ];

    const results = [];

    for (const tour of tours) {
      const created = await prisma.tourExperience.create({
        data: {
          businessId,
          ...tour
        }
      });

      results.push({
        name: tour.name,
        id: created.id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} tour experiences for Arctic Adventures Levi`,
      results
    });
  } catch (error) {
    console.error('Error populating tours:', error);
    return NextResponse.json(
      { error: 'Failed to populate tours' },
      { status: 500 }
    );
  }
}
