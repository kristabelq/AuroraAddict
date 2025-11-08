import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/businesses/[id]/rooms
 *
 * Get all active room types for a business (public endpoint)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    // Verify business exists and is accommodation business
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        businessName: true,
        businessServices: true,
        userType: true,
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (business.userType !== 'business') {
      return NextResponse.json(
        { error: 'Not a business account' },
        { status: 400 }
      );
    }

    if (!business.businessServices?.includes('accommodation')) {
      return NextResponse.json(
        { error: 'This business does not offer accommodation services' },
        { status: 400 }
      );
    }

    // Get all active room types
    const roomTypes = await prisma.roomType.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
        priceFrom: true,
        currency: true,
        images: true,
        coverImage: true,
        amenities: true,
        // Don't expose raw URLs, only check availability
        bookingComUrl: true,
        agodaUrl: true,
        directBookingUrl: true,
        // Don't expose affiliateLinks JSON directly
        viewCount: true,
        createdAt: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { priceFrom: 'asc' }
      ]
    });

    // Transform to indicate which booking options are available
    const roomTypesWithOptions = roomTypes.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      priceFrom: room.priceFrom,
      currency: room.currency,
      images: room.images,
      coverImage: room.coverImage,
      amenities: room.amenities,
      viewCount: room.viewCount,
      createdAt: room.createdAt,
      // Indicate which booking platforms are available
      bookingOptions: [
        room.bookingComUrl ? 'booking' : null,
        room.agodaUrl ? 'agoda' : null,
        room.directBookingUrl ? 'direct' : null,
      ].filter(Boolean) as string[]
    }));

    return NextResponse.json({
      businessName: business.businessName,
      roomTypes: roomTypesWithOptions
    });
  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    );
  }
}
