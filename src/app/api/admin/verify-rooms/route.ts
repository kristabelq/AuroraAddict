import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/verify-rooms
 * Verify room types and category previews
 */
export async function GET() {
  try {
    const businesses = [
      { id: '5ae6c72a-884e-459e-8c63-9952ea2e04e6', name: 'Northern Lights Village' },
      { id: '292c72fc-2478-4460-960d-2526b45ca29e', name: 'Harriniva Hotels & Safaris' }
    ];

    const results = [];

    for (const biz of businesses) {
      const business = await prisma.user.findUnique({
        where: { id: biz.id },
        select: {
          businessServices: true
        }
      });

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

      let preview = null;
      if (roomTypes.length > 0) {
        const minPrice = Math.min(...roomTypes.filter(r => r.priceFrom).map(r => r.priceFrom!));
        const highlights = roomTypes.slice(0, 3).map(r => r.name);
        const hasBookingOptions = roomTypes.some(r => r.bookingComUrl || r.directBookingUrl);

        preview = {
          count: roomTypes.length,
          minPrice,
          highlights,
          hasBookingOptions
        };
      }

      results.push({
        businessName: biz.name,
        businessServices: business?.businessServices || [],
        roomCount: roomTypes.length,
        rooms: roomTypes.map(r => ({
          name: r.name,
          price: `${r.currency}${r.priceFrom}`,
          capacity: r.capacity,
          hasBooking: !!r.bookingComUrl,
          hasDirect: !!r.directBookingUrl,
          hasAffiliate: !!r.affiliateLinks
        })),
        categoryPreview: preview
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error verifying rooms:', error);
    return NextResponse.json(
      { error: 'Failed to verify rooms' },
      { status: 500 }
    );
  }
}
