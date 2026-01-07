import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateTourAffiliateLinks, validateBookingUrl } from '@/lib/affiliate-injector';

/**
 * GET /api/business/tour-experiences
 *
 * List all tour experiences for authenticated business
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
        { error: 'Only businesses can manage tour experiences' },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes('tour_operator')) {
      return NextResponse.json(
        { error: 'Only tour operator businesses can manage tour experiences' },
        { status: 403 }
      );
    }

    // Get all tour experiences for this business
    const tourExperiences = await prisma.tourExperience.findMany({
      where: {
        businessId: session.user.id,
        isActive: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ tourExperiences });
  } catch (error) {
    console.error('Error fetching tour experiences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour experiences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/tour-experiences
 *
 * Create new tour experience with affiliate link injection
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
        { error: 'Only businesses can create tour experiences' },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes('tour_operator')) {
      return NextResponse.json(
        { error: 'Only tour operator businesses can create tour experiences' },
        { status: 403 }
      );
    }

    // Check tour count limit (max 50)
    const tourCount = await prisma.tourExperience.count({
      where: {
        businessId: session.user.id,
        isActive: true
      }
    });

    if (tourCount >= 50) {
      return NextResponse.json(
        { error: 'Maximum 50 tour experiences allowed per business' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const { name, duration, directBookingUrl, getYourGuideUrl, viatorUrl, tripAdvisorUrl } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'Name and duration are required' },
        { status: 400 }
      );
    }

    // Validate booking URLs
    if (directBookingUrl) {
      const validation = validateBookingUrl(directBookingUrl);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid direct booking URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    if (getYourGuideUrl) {
      const validation = validateBookingUrl(getYourGuideUrl, 'getyourguide');
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid GetYourGuide URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    if (viatorUrl) {
      const validation = validateBookingUrl(viatorUrl, 'viator');
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid Viator URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    if (tripAdvisorUrl) {
      const validation = validateBookingUrl(tripAdvisorUrl, 'tripadvisor');
      if (!validation.isValid) {
        return NextResponse.json(
          { error: `Invalid TripAdvisor URL: ${validation.error}` },
          { status: 400 }
        );
      }
    }

    // Generate affiliate links
    const affiliateLinks = generateTourAffiliateLinks({
      directBookingUrl,
      getYourGuideUrl,
      viatorUrl,
      tripAdvisorUrl
    });

    // Create tour experience
    const tourExperience = await prisma.tourExperience.create({
      data: {
        businessId: session.user.id,
        name,
        description: body.description || null,
        duration,
        groupSizeMin: body.groupSizeMin || null,
        groupSizeMax: body.groupSizeMax || null,
        difficulty: body.difficulty || null,
        season: body.season || null,
        priceFrom: body.priceFrom || null,
        currency: body.currency || 'EUR',
        images: body.images || [],
        coverImage: body.coverImage || null,
        highlights: body.highlights || [],
        included: body.included || [],
        directBookingUrl: directBookingUrl || null,
        getYourGuideUrl: getYourGuideUrl || null,
        viatorUrl: viatorUrl || null,
        tripAdvisorUrl: tripAdvisorUrl || null,
        affiliateLinks: affiliateLinks as Prisma.JsonObject,
        displayOrder: body.displayOrder || 0,
      }
    });

    return NextResponse.json({
      tourExperience,
      message: 'Tour experience created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tour experience:', error);
    return NextResponse.json(
      { error: 'Failed to create tour experience' },
      { status: 500 }
    );
  }
}
