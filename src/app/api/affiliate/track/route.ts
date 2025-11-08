import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/affiliate/track
 *
 * Track affiliate click and return the affiliate URL
 * This prevents exposing affiliate links directly in the frontend
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { businessId, roomTypeId, platform } = body;

    // Validate required fields
    if (!businessId || !platform) {
      return NextResponse.json(
        { error: 'businessId and platform are required' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['booking', 'agoda', 'direct'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Get room type to fetch affiliate link
    let affiliateUrl: string | null = null;

    if (roomTypeId) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: roomTypeId },
        select: {
          affiliateLinks: true,
          businessId: true,
        }
      });

      if (!roomType) {
        return NextResponse.json(
          { error: 'Room type not found' },
          { status: 404 }
        );
      }

      if (roomType.businessId !== businessId) {
        return NextResponse.json(
          { error: 'Room type does not belong to specified business' },
          { status: 400 }
        );
      }

      // Extract affiliate URL from JSON
      const links = roomType.affiliateLinks as { [key: string]: string } | null;
      affiliateUrl = links?.[platform] || null;

      if (!affiliateUrl) {
        return NextResponse.json(
          { error: `No ${platform} booking link available for this room` },
          { status: 404 }
        );
      }

      // Increment click counter for this room
      await prisma.roomType.update({
        where: { id: roomTypeId },
        data: {
          clickCount: {
            increment: 1
          }
        }
      });
    } else {
      // If no room type specified, we might want to redirect to business's main booking page
      // For now, return error
      return NextResponse.json(
        { error: 'roomTypeId is required' },
        { status: 400 }
      );
    }

    // Get device type from user agent
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';

    // Get referer/source
    const sourceUrl = request.headers.get('referer') || undefined;

    // Create affiliate click record
    await prisma.affiliateClick.create({
      data: {
        businessId,
        roomTypeId: roomTypeId || null,
        platform,
        destinationUrl: affiliateUrl,
        userId: session?.user?.id || null,
        sessionId: null, // Could implement session tracking
        sourceUrl,
        deviceType,
      }
    });

    // Return affiliate URL
    return NextResponse.json({
      url: affiliateUrl,
      platform
    });
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/affiliate/track/stats
 *
 * Get affiliate click statistics (admin/business owner only)
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

    // Get business user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
      }
    });

    if (user?.userType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can view affiliate stats' },
        { status: 403 }
      );
    }

    // Get click statistics
    const [totalClicks, clicksByPlatform, recentClicks] = await Promise.all([
      // Total clicks
      prisma.affiliateClick.count({
        where: { businessId: session.user.id }
      }),

      // Clicks by platform
      prisma.affiliateClick.groupBy({
        by: ['platform'],
        where: { businessId: session.user.id },
        _count: true
      }),

      // Recent clicks (last 30 days)
      prisma.affiliateClick.findMany({
        where: {
          businessId: session.user.id,
          clickedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { clickedAt: 'desc' },
        take: 100
      })
    ]);

    // Get room-specific stats
    const roomStats = await prisma.roomType.findMany({
      where: {
        businessId: session.user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        viewCount: true,
        clickCount: true
      },
      orderBy: { clickCount: 'desc' }
    });

    return NextResponse.json({
      totalClicks,
      clicksByPlatform: clicksByPlatform.reduce((acc, item) => {
        acc[item.platform] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentClicks: recentClicks.length,
      roomStats
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
