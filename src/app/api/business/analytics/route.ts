import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/business/analytics
 *
 * Fetch comprehensive analytics for business dashboard including:
 * - Basic view/click metrics
 * - Affiliate conversion tracking
 * - Platform performance breakdown
 * - Revenue forecasting
 *
 * Query params:
 * - period: '7d' | '30d' | '90d' | 'all' (default: 30d)
 * - serviceType: 'accommodation' | 'tours' | null (default: all)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
        totalAffiliateClicks: true,
        totalConversions: true,
        conversionRate: true,
        totalCommissionEarned: true,
        estimatedMonthlyCommission: true,
      },
    });

    if (user?.userType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can access analytics' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const serviceType = searchParams.get('serviceType');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const businessId = session.user.id;

    // === BASIC VIEW/CLICK ANALYTICS ===
    const roomTypes = await prisma.roomType.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        viewCount: true,
        clickCount: true,
        isActive: true,
        priceFrom: true,
        currency: true,
      },
      orderBy: { viewCount: 'desc' },
    });

    const tours = await prisma.tourExperience.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        viewCount: true,
        clickCount: true,
        isActive: true,
        priceFrom: true,
        currency: true,
      },
      orderBy: { viewCount: 'desc' },
    });

    const roomTypesTotal = {
      views: roomTypes.reduce((sum, room) => sum + room.viewCount, 0),
      clicks: roomTypes.reduce((sum, room) => sum + room.clickCount, 0),
      count: roomTypes.length,
      activeCount: roomTypes.filter((room) => room.isActive).length,
    };

    const toursTotal = {
      views: tours.reduce((sum, tour) => sum + tour.viewCount, 0),
      clicks: tours.reduce((sum, tour) => sum + tour.clickCount, 0),
      count: tours.length,
      activeCount: tours.filter((tour) => tour.isActive).length,
    };

    // === AFFILIATE CONVERSION TRACKING ===
    const baseWhere: any = {
      businessId,
      clickedAt: { gte: startDate },
    };

    if (serviceType === 'accommodation') {
      baseWhere.roomTypeId = { not: null };
    } else if (serviceType === 'tours') {
      baseWhere.tourExperienceId = { not: null };
    }

    const [totalClicks, totalConversions, totalRevenue] = await Promise.all([
      prisma.affiliateClick.count({ where: baseWhere }),
      prisma.affiliateClick.count({ where: { ...baseWhere, converted: true } }),
      prisma.affiliateClick.aggregate({
        where: { ...baseWhere, converted: true },
        _sum: { conversionValue: true, estimatedCommission: true },
      }),
    ]);

    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const averageOrderValue =
      totalConversions > 0 ? (totalRevenue._sum.conversionValue || 0) / totalConversions : 0;

    // === PLATFORM BREAKDOWN ===
    const platformStats = await prisma.affiliateClick.groupBy({
      by: ['platform'],
      where: baseWhere,
      _count: { _all: true },
      _sum: { conversionValue: true, estimatedCommission: true },
    });

    const platformConversions = await prisma.affiliateClick.groupBy({
      by: ['platform'],
      where: { ...baseWhere, converted: true },
      _count: { _all: true },
    });

    const platformBreakdown = platformStats.map((stat) => {
      const conversions = platformConversions.find((c) => c.platform === stat.platform);
      const conversionCount = conversions?._count._all || 0;
      const clickCount = stat._count._all;

      return {
        platform: stat.platform,
        clicks: clickCount,
        conversions: conversionCount,
        conversionRate: clickCount > 0 ? (conversionCount / clickCount) * 100 : 0,
        revenue: stat._sum.conversionValue || 0,
        commission: stat._sum.estimatedCommission || 0,
      };
    });

    // === TIME SERIES DATA ===
    const timeSeriesData = await getTimeSeriesData(businessId, startDate, now, serviceType);

    // === TOP PERFORMING LISTINGS ===
    const topRooms = await prisma.affiliateClick.groupBy({
      by: ['roomTypeId'],
      where: { ...baseWhere, roomTypeId: { not: null } },
      _count: { _all: true },
      _sum: { estimatedCommission: true },
      orderBy: { _sum: { estimatedCommission: 'desc' } },
      take: 5,
    });

    const topTours = await prisma.affiliateClick.groupBy({
      by: ['tourExperienceId'],
      where: { ...baseWhere, tourExperienceId: { not: null } },
      _count: { _all: true },
      _sum: { estimatedCommission: true },
      orderBy: { _sum: { estimatedCommission: 'desc' } },
      take: 5,
    });

    const roomIds = topRooms.map((r) => r.roomTypeId).filter(Boolean) as string[];
    const tourIds = topTours.map((t) => t.tourExperienceId).filter(Boolean) as string[];

    const [topRoomDetails, topTourDetails] = await Promise.all([
      prisma.roomType.findMany({
        where: { id: { in: roomIds } },
        select: { id: true, name: true, coverImage: true },
      }),
      prisma.tourExperience.findMany({
        where: { id: { in: tourIds } },
        select: { id: true, name: true, coverImage: true },
      }),
    ]);

    const topPerformingRooms = topRooms
      .map((stat) => {
        const room = topRoomDetails.find((r) => r.id === stat.roomTypeId);
        if (!room) return null;
        return {
          id: room.id,
          name: room.name,
          coverImage: room.coverImage,
          clicks: stat._count._all,
          commission: stat._sum.estimatedCommission || 0,
        };
      })
      .filter(Boolean);

    const topPerformingTours = topTours
      .map((stat) => {
        const tour = topTourDetails.find((t) => t.id === stat.tourExperienceId);
        if (!tour) return null;
        return {
          id: tour.id,
          name: tour.name,
          coverImage: tour.coverImage,
          clicks: stat._count._all,
          commission: stat._sum.estimatedCommission || 0,
        };
      })
      .filter(Boolean);

    // === RECENT CONVERSIONS ===
    const recentConversions = await prisma.affiliateClick.findMany({
      where: { ...baseWhere, converted: true },
      select: {
        id: true,
        platform: true,
        conversionValue: true,
        estimatedCommission: true,
        conversionDate: true,
        roomTypeId: true,
        tourExperienceId: true,
      },
      orderBy: { conversionDate: 'desc' },
      take: 10,
    });

    // === REVENUE FORECAST ===
    const forecast = await calculateRevenueForecast(businessId);

    // === COMBINED RESPONSE ===
    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
      // Basic analytics
      basicAnalytics: {
        totalViews: roomTypesTotal.views + toursTotal.views,
        totalClicks: roomTypesTotal.clicks + toursTotal.clicks,
        clickThroughRate:
          roomTypesTotal.views + toursTotal.views > 0
            ? ((roomTypesTotal.clicks + toursTotal.clicks) /
                (roomTypesTotal.views + toursTotal.views)) *
              100
            : 0,
      },
      roomTypes: {
        total: roomTypesTotal,
        items: roomTypes,
      },
      tours: {
        total: toursTotal,
        items: tours,
      },
      // Affiliate performance
      affiliatePerformance: {
        lifetime: {
          totalClicks: user.totalAffiliateClicks,
          totalConversions: user.totalConversions,
          conversionRate: user.conversionRate,
          totalCommission: user.totalCommissionEarned,
          estimatedMonthly: user.estimatedMonthlyCommission,
        },
        period: {
          totalClicks,
          totalConversions,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRevenue: totalRevenue._sum.conversionValue || 0,
          totalCommission: totalRevenue._sum.estimatedCommission || 0,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        },
      },
      platformBreakdown: platformBreakdown.sort((a, b) => b.commission - a.commission),
      timeSeries: timeSeriesData,
      topPerformingRooms,
      topPerformingTours,
      recentConversions,
      forecast,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

async function getTimeSeriesData(
  businessId: string,
  startDate: Date,
  endDate: Date,
  serviceType: string | null
) {
  const baseWhere: any = {
    businessId,
    clickedAt: { gte: startDate, lte: endDate },
  };

  if (serviceType === 'accommodation') {
    baseWhere.roomTypeId = { not: null };
  } else if (serviceType === 'tours') {
    baseWhere.tourExperienceId = { not: null };
  }

  const clicks = await prisma.affiliateClick.findMany({
    where: baseWhere,
    select: {
      clickedAt: true,
      converted: true,
      estimatedCommission: true,
    },
    orderBy: { clickedAt: 'asc' },
  });

  const dayMap = new Map<string, { clicks: number; conversions: number; commission: number }>();

  clicks.forEach((click) => {
    const day = click.clickedAt.toISOString().split('T')[0];
    const existing = dayMap.get(day) || { clicks: 0, conversions: 0, commission: 0 };

    dayMap.set(day, {
      clicks: existing.clicks + 1,
      conversions: existing.conversions + (click.converted ? 1 : 0),
      commission: existing.commission + (click.estimatedCommission || 0),
    });
  });

  return Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    clicks: data.clicks,
    conversions: data.conversions,
    conversionRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0,
    commission: data.commission,
  }));
}

async function calculateRevenueForecast(businessId: string) {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const conversions = await prisma.affiliateClick.findMany({
    where: {
      businessId,
      converted: true,
      conversionDate: { gte: last30Days },
    },
    select: { estimatedCommission: true },
  });

  const totalCommission = conversions.reduce((sum, c) => sum + (c.estimatedCommission || 0), 0);
  const dailyAverage = totalCommission / 30;

  return {
    next7Days: Math.round(dailyAverage * 7 * 100) / 100,
    next30Days: Math.round(dailyAverage * 30 * 100) / 100,
    next90Days: Math.round(dailyAverage * 90 * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
  };
}
