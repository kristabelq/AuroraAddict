import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAffiliateLinks, validateBookingUrl } from '@/lib/affiliate-injector';

/**
 * PUT /api/business/room-types/[id]
 *
 * Update room type (with affiliate link re-injection)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check room type exists and belongs to user
    const existingRoom = await prisma.roomType.findUnique({
      where: { id },
      select: { businessId: true }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }

    if (existingRoom.businessId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own room types' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate booking URLs if provided
    const { bookingComUrl, agodaUrl, directBookingUrl } = body;

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

    // Re-generate affiliate links with new URLs
    const affiliateLinks = generateAffiliateLinks({
      bookingComUrl: bookingComUrl || undefined,
      agodaUrl: agodaUrl || undefined,
      directBookingUrl: directBookingUrl || undefined
    });

    // Update room type
    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? undefined,
        capacity: body.capacity,
        priceFrom: body.priceFrom ?? undefined,
        currency: body.currency ?? undefined,
        images: body.images ?? undefined,
        coverImage: body.coverImage ?? undefined,
        amenities: body.amenities ?? undefined,
        bookingComUrl: bookingComUrl ?? undefined,
        agodaUrl: agodaUrl ?? undefined,
        directBookingUrl: directBookingUrl ?? undefined,
        affiliateLinks,
        displayOrder: body.displayOrder ?? undefined,
      }
    });

    return NextResponse.json({
      roomType,
      message: 'Room type updated successfully'
    });
  } catch (error) {
    console.error('Error updating room type:', error);
    return NextResponse.json(
      { error: 'Failed to update room type' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/business/room-types/[id]
 *
 * Soft delete room type (set isActive = false)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check room type exists and belongs to user
    const existingRoom = await prisma.roomType.findUnique({
      where: { id },
      select: { businessId: true }
    });

    if (!existingRoom) {
      return NextResponse.json(
        { error: 'Room type not found' },
        { status: 404 }
      );
    }

    if (existingRoom.businessId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own room types' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.roomType.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: 'Room type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room type:', error);
    return NextResponse.json(
      { error: 'Failed to delete room type' },
      { status: 500 }
    );
  }
}
