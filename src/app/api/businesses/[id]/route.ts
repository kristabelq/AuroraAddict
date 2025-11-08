import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/businesses/[id]
 *
 * Get detailed business profile including:
 * - Business info
 * - Hunt stats and success rates
 * - Public and private chat info
 * - User's membership status
 */
export async function GET(
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

    const { id: businessId } = await params;

    // Get business user
    const business = await prisma.user.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        userType: true,
        businessName: true,
        businessCategory: true,
        businessServices: true,
        businessDescription: true,
        businessWebsite: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessCountry: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    if (business.userType !== 'business') {
      return NextResponse.json(
        { error: 'User is not a business account' },
        { status: 400 }
      );
    }

    // Get business stats with error handling
    let totalHunts = 0;
    let completedHunts = 0;
    let recentHunts: any[] = [];

    try {
      [totalHunts, completedHunts] = await Promise.all([
        // Total hunts created
        prisma.hunt.count({
          where: {
            userId: businessId,
          },
        }),
        // Completed hunts
        prisma.hunt.count({
          where: {
            userId: businessId,
          },
        }),
      ]);

      // Get recent hunts
      recentHunts = await prisma.hunt.findMany({
        where: {
          userId: businessId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          startDate: true,
          endDate: true,
          isPaid: true,
          price: true,
          capacity: true,
          cancellationPolicy: true,
          createdAt: true,
        },
        orderBy: {
          startDate: 'desc',
        },
        take: 10,
      });
    } catch (huntError) {
      console.error('Error fetching hunt data, continuing with defaults:', huntError);
      // Continue with default values (0, 0, [])
    }

    // Get business chats
    const chats = await prisma.chatGroup.findMany({
      where: {
        ownerId: businessId,
        isActive: true,
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,
            unreadCount: true,
          },
        },
        joinRequests: {
          where: {
            userId: session.user.id,
            status: 'pending',
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    // Separate public and private chats
    const publicChat = chats.find(c => c.groupType === 'business_public');
    const privateChat = chats.find(c => c.groupType === 'business_private');

    // Format chat info
    const formatChat = (chat: typeof chats[0] | undefined) => {
      if (!chat) return null;

      const membership = chat.members[0] || null;
      const joinRequest = chat.joinRequests[0] || null;

      return {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        memberCount: chat.memberCount,
        messageCount: chat.messageCount,
        requireApproval: chat.requireApproval,
        areaName: chat.areaName,
        // User's membership
        isMember: membership?.status === 'active',
        memberRole: membership?.role || null,
        memberStatus: membership?.status || null,
        unreadCount: membership?.unreadCount || 0,
        joinedAt: membership?.joinedAt || null,
        // Join request status
        hasPendingRequest: !!joinRequest,
        joinRequestId: joinRequest?.id || null,
      };
    };

    // Calculate success rate (placeholder - can be enhanced with actual hunt outcome data)
    const successRate = totalHunts > 0 ? (completedHunts / totalHunts) * 100 : 0;

    // Get room types if business offers accommodation services
    const businessServices = business.businessServices || [];
    const categoryPreviews: Record<string, any> = {};

    if (businessServices.includes('accommodation')) {
      try {
        const roomTypes = await prisma.roomType.findMany({
          where: {
            businessId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            capacity: true,
            priceFrom: true,
            currency: true,
            coverImage: true,
            amenities: true,
            // Don't expose raw booking URLs or affiliate links in preview
            bookingComUrl: true, // just to check if exists
            agodaUrl: true,
            directBookingUrl: true,
          },
          orderBy: [
            { displayOrder: 'asc' },
            { priceFrom: 'asc' }
          ],
          take: 10
        });

        if (roomTypes.length > 0) {
          const minPrice = Math.min(...roomTypes.filter(r => r.priceFrom).map(r => r.priceFrom!));
          const highlights = roomTypes.slice(0, 3).map(r => r.name);

          categoryPreviews.accommodation = {
            count: roomTypes.length,
            minPrice,
            currency: roomTypes[0]?.currency || 'EUR',
            highlights,
            hasBookingOptions: roomTypes.some(r => r.bookingComUrl || r.agodaUrl || r.directBookingUrl)
          };
        }
      } catch (error) {
        console.error('Error fetching room types for preview:', error);
        // Continue without room preview
      }
    }

    // Get tour experiences if business offers tour_operator services
    if (businessServices.includes('tour_operator')) {
      try {
        const tourExperiences = await prisma.tourExperience.findMany({
          where: {
            businessId,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            duration: true,
            difficulty: true,
            priceFrom: true,
            currency: true,
            coverImage: true,
            highlights: true,
            // Don't expose raw booking URLs or affiliate links in preview
            directBookingUrl: true,
            getYourGuideUrl: true,
            viatorUrl: true,
            tripAdvisorUrl: true,
          },
          orderBy: [
            { displayOrder: 'asc' },
            { priceFrom: 'asc' }
          ],
          take: 10
        });

        if (tourExperiences.length > 0) {
          const minPrice = Math.min(...tourExperiences.filter(t => t.priceFrom).map(t => t.priceFrom!));
          const highlights = tourExperiences.slice(0, 3).map(t => t.name);

          categoryPreviews.tour_operator = {
            count: tourExperiences.length,
            minPrice,
            currency: tourExperiences[0]?.currency || 'EUR',
            highlights,
            hasBookingOptions: tourExperiences.some(t =>
              t.directBookingUrl || t.getYourGuideUrl || t.viatorUrl || t.tripAdvisorUrl
            )
          };
        }
      } catch (error) {
        console.error('Error fetching tour experiences for preview:', error);
        // Continue without tour preview
      }
    }

    // TODO: Add other service previews (restaurant, photography, etc.) in future

    return NextResponse.json({
      // Business info
      id: business.id,
      name: business.name,
      businessName: business.businessName,
      businessCategory: business.businessCategory, // Legacy field
      businessServices, // New multi-service field
      businessDescription: business.businessDescription,
      businessWebsite: business.businessWebsite,
      businessPhone: business.businessPhone,
      businessAddress: business.businessAddress,
      businessCity: business.businessCity,
      businessCountry: business.businessCountry,
      image: business.image,
      username: business.username,
      isVerified: business.verificationStatus === 'verified',
      verificationStatus: business.verificationStatus,
      createdAt: business.createdAt,

      // Stats
      stats: {
        totalHunts,
        completedHunts,
        successRate: Math.round(successRate),
        activeHunts: totalHunts - completedHunts,
      },

      // Recent hunts
      recentHunts: recentHunts.map(hunt => ({
        id: hunt.id,
        name: hunt.name,
        description: hunt.description,
        location: hunt.location,
        startDate: hunt.startDate,
        endDate: hunt.endDate,
        isPaid: hunt.isPaid,
        price: hunt.price,
        capacity: hunt.capacity,
        cancellationPolicy: hunt.cancellationPolicy,
        createdAt: hunt.createdAt,
      })),

      // Category previews (for multi-service businesses)
      categoryPreviews,

      // Chats
      publicChat: formatChat(publicChat),
      privateChat: formatChat(privateChat),
    });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business profile' },
      { status: 500 }
    );
  }
}
