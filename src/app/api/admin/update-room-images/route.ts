import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/update-room-images
 * Update room images to match Arctic/Lapland theme
 */
export async function POST() {
  try {
    const updates = [
      // Northern Lights Village
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Aurora Cabin - Standard',
        images: [
          'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800'
      },
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Aurora Cabin - Family',
        images: [
          'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
          'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800'
      },
      {
        businessId: '5ae6c72a-884e-459e-8c63-9952ea2e04e6',
        name: 'Polar Sky Suite',
        images: [
          'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
          'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800'
      },
      // Harriniva Hotels & Safaris
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Standard Twin Room',
        images: [
          'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800',
          'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Sauna Room',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
          'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Wilderness Plus Room',
        images: [
          'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Wilderness Suite',
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
      },
      {
        businessId: '292c72fc-2478-4460-960d-2526b45ca29e',
        name: 'Safari House',
        images: [
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
          'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800'
        ],
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800'
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
      results
    });
  } catch (error) {
    console.error('Error updating room images:', error);
    return NextResponse.json(
      { error: 'Failed to update room images' },
      { status: 500 }
    );
  }
}
