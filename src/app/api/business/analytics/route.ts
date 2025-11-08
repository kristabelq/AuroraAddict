import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify user is a business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can access analytics" },
        { status: 403 }
      );
    }

    // Get room types analytics
    const roomTypes = await prisma.roomType.findMany({
      where: { businessId: session.user.id },
      select: {
        id: true,
        name: true,
        viewCount: true,
        clickCount: true,
        isActive: true,
        priceFrom: true,
        currency: true,
      },
      orderBy: {
        viewCount: "desc",
      },
    });

    // Get tour experiences analytics
    const tours = await prisma.tourExperience.findMany({
      where: { businessId: session.user.id },
      select: {
        id: true,
        name: true,
        viewCount: true,
        clickCount: true,
        isActive: true,
        priceFrom: true,
        currency: true,
      },
      orderBy: {
        viewCount: "desc",
      },
    });

    // Calculate totals
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

    // Calculate overall metrics
    const totalViews = roomTypesTotal.views + toursTotal.views;
    const totalClicks = roomTypesTotal.clicks + toursTotal.clicks;
    const clickThroughRate =
      totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

    return NextResponse.json({
      overview: {
        totalViews,
        totalClicks,
        clickThroughRate: parseFloat(clickThroughRate),
      },
      roomTypes: {
        total: roomTypesTotal,
        items: roomTypes,
      },
      tours: {
        total: toursTotal,
        items: tours,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
