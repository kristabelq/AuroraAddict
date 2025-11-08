import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAffiliateLinks, validateBookingUrl } from '@/lib/affiliate-injector';

/**
 * GET /api/business/room-types
 *
 * List all room types for authenticated business
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user is business type
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
      }
    });

    if (user?.userType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can manage room types' },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes('accommodation')) {
      return NextResponse.json(
        { error: 'Only accommodation businesses can manage room types' },
        { status: 403 }
      );
    }

    // Get all room types for this business
    const roomTypes = await prisma.roomType.findMany({
      where: {
        businessId: session.user.id,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.error('Error fetching room types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/room-types
 *
 * Create new room type with affiliate link injection
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user is business type
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
      }
    });

    if (user?.userType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can create room types' },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes('accommodation')) {
      return NextResponse.json(
        { error: 'Only accommodation businesses can create room types' },
        { status: 403 }
      );
    }

    // Check room count limit (max 20)
    const roomCount = await prisma.roomType.count({
      where: {
        businessId: session.user.id,
        isActive: true
      }
    });

    if (roomCount >= 20) {
      return NextResponse.json(
        { error: 'Maximum 20 room types allowed per business' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const { name, capacity, bookingComUrl, agodaUrl, directBookingUrl } = body;

    if (!name || !capacity) {
      return NextResponse.json(
        { error: 'Name and capacity are required' },
        { status: 400 }
      );
    }

    // Validate booking URLs
    if (bookingComUrl) {
      const validation = validateBookingUrl(bookingComUrl, 'booking');
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid Booking.com URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    if (agodaUrl) {
      const validation = validateBookingUrl(agodaUrl, 'agoda');
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid Agoda URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    if (directBookingUrl) {
      const validation = validateBookingUrl(directBookingUrl);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid direct booking URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    // Generate affiliate links
    const affiliateLinks = generateAffiliateLinks({
      bookingComUrl,
      agodaUrl,
      directBookingUrl
    });

    // Create room type
    const roomType = await prisma.roomType.create({
      data: {
        businessId: session.user.id,
        name,
        description: body.description || null,
        capacity,
        priceFrom: body.priceFrom || null,
        currency: body.currency || 'EUR',
        images: body.images || [],
        coverImage: body.coverImage || null,
        amenities: body.amenities || [],
        bookingComUrl: bookingComUrl || null,
        agodaUrl: agodaUrl || null,
        directBookingUrl: directBookingUrl || null,
        affiliateLinks,
        displayOrder: body.displayOrder || 0,
      }
    });

    return NextResponse.json({
      roomType,
      message: 'Room type created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating room type:', error);
    return NextResponse.json(
      { error: 'Failed to create room type' },
      { status: 500 }
    );
  }
}
