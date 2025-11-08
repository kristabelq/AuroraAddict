import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/businesses/[id]/tours
 *
 * Get all active tour experiences for a business (public endpoint)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    // Verify business exists and is tour operator
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

    if (!business.businessServices?.includes('tour_operator')) {
      return NextResponse.json(
        { error: 'This business does not offer tour operator services' },
        { status: 400 }
      );
    }

    // Get all active tour experiences
    const tourExperiences = await prisma.tourExperience.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        groupSizeMin: true,
        groupSizeMax: true,
        difficulty: true,
        season: true,
        priceFrom: true,
        currency: true,
        images: true,
        coverImage: true,
        highlights: true,
        included: true,
        // Don't expose raw URLs, only check availability
        directBookingUrl: true,
        getYourGuideUrl: true,
        viatorUrl: true,
        tripAdvisorUrl: true,
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
    const tourExperiencesWithOptions = tourExperiences.map(tour => ({
      id: tour.id,
      name: tour.name,
      description: tour.description,
      duration: tour.duration,
      groupSizeMin: tour.groupSizeMin,
      groupSizeMax: tour.groupSizeMax,
      difficulty: tour.difficulty,
      season: tour.season,
      priceFrom: tour.priceFrom,
      currency: tour.currency,
      images: tour.images,
      coverImage: tour.coverImage,
      highlights: tour.highlights,
      included: tour.included,
      viewCount: tour.viewCount,
      createdAt: tour.createdAt,
      // Indicate which booking platforms are available
      bookingOptions: [
        tour.directBookingUrl ? 'direct' : null,
        tour.getYourGuideUrl ? 'getyourguide' : null,
        tour.viatorUrl ? 'viator' : null,
        tour.tripAdvisorUrl ? 'tripadvisor' : null,
      ].filter(Boolean) as string[]
    }));

    return NextResponse.json({
      businessName: business.businessName,
      tourExperiences: tourExperiencesWithOptions
    });
  } catch (error) {
    console.error('Error fetching tour experiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour experiences' },
      { status: 500 }
    );
  }
}
