import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/update-real-photos
 * Update room images with actual photos from business websites
 */
export async function POST() {
  try {
    const updates = [
      // Northern Lights Village - using actual photos from their website
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Aurora Cabin - Standard',
        images: [
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/1920x1080/17568180645602_northernlightsvillagewinter.jpg',
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/17545917332684_northernlightsvillagesaariselkaaurorahuntingaur18.jpg'
        ],
        coverImage: 'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/1920x1080/17568180645602_northernlightsvillagewinter.jpg'
      },
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Aurora Cabin - Family',
        images: [
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/1920x1080/17568180645602_northernlightsvillagewinter.jpg',
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/17545913505098_northernlightsvillagesaariselkaauroracamp0122b10of11.jpg'
        ],
        coverImage: 'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/1920x1080/17568180645602_northernlightsvillagewinter.jpg'
      },
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Polar Sky Suite',
        images: [
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/17545914955852_northernlightsvillagesaariselkaauroracamp10115of10.jpg',
          'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/17545917332684_northernlightsvillagesaariselkaaurorahuntingaur18.jpg'
        ],
        coverImage: 'https://wa-uploads.profitroom.com/northernlightsvillagesaariselka/17545914955852_northernlightsvillagesaariselkaauroracamp10115of10.jpg'
      },

      // Harriniva Hotels & Safaris - using actual photos from their website
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Standard Twin Room',
        images: [
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin-room2.jpg',
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin_room3.jpg'
        ],
        coverImage: 'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin-room2.jpg'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Sauna Room',
        images: [
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva-Sauna-Room-Plus-5.jpg',
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva-Sauna-Room-Plus-1.jpg'
        ],
        coverImage: 'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva-Sauna-Room-Plus-5.jpg'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Wilderness Plus Room',
        images: [
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin-room1.jpg',
          'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin_room3.jpg'
        ],
        coverImage: 'https://harriniva.fi/wp-content/uploads/2022/12/Harriniva_double_twin-room1.jpg'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Wilderness Suite',
        images: [
          'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-6.jpg',
          'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-12.jpg'
        ],
        coverImage: 'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-6.jpg'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Safari House',
        images: [
          'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-5.jpg',
          'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-12.jpg'
        ],
        coverImage: 'https://harriniva.fi/wp-content/uploads/2022/12/harriniva_wilderness_suite_large-5.jpg'
      }
    ];

    const results = [];

    for (const update of updates) {
      const room = await prisma.roomType.updateMany({
        where: {
          businessId: update.businessId,
          name: update.name
        },
        data: {
          images: update.images,
          coverImage: update.coverImage
        }
      });

      results.push({
        name: update.name,
        updated: room.count > 0
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Updated with real photos from business websites',
      results
    });
  } catch (error) {
    console.error('Error updating room photos:', error);
    return NextResponse.json(
      { error: 'Failed to update room photos' },
      { status: 500 }
    );
  }
}
