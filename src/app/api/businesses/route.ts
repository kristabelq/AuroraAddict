import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const search = searchParams.get("search") || "";
    const services = searchParams.get("services")?.split(",").filter(Boolean) || [];
    const city = searchParams.get("city") || "";
    const country = searchParams.get("country") || "";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      userType: "business",
    };

    // Only show verified businesses by default, or all if explicitly requested
    if (verifiedOnly) {
      where.verificationStatus = "verified";
    }

    // Search by business name or description
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { businessDescription: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by services
    if (services.length > 0) {
      where.businessServices = {
        hasSome: services,
      };
    }

    // Filter by city
    if (city) {
      where.businessCity = { contains: city, mode: "insensitive" };
    }

    // Filter by country
    if (country) {
      where.businessCountry = { contains: country, mode: "insensitive" };
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Fetch businesses
    const businesses = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        businessName: true,
        businessServices: true,
        businessDescription: true,
        businessCity: true,
        businessCountry: true,
        businessWebsite: true,
        verificationStatus: true,
        latitude: true,
        longitude: true,
        _count: {
          select: {
            sightings: true,
            roomTypes: true,
          },
        },
      },
      orderBy: [
        { verificationStatus: "desc" }, // Verified first
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // For accommodation businesses, get a preview of their room types
    const businessesWithRooms = await Promise.all(
      businesses.map(async (business) => {
        let roomTypePreview = null;

        if (business.businessServices?.includes("accommodation")) {
          const roomTypes = await prisma.roomType.findMany({
            where: {
              businessId: business.id,
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              coverImage: true,
              priceFrom: true,
              currency: true,
            },
            orderBy: [
              { displayOrder: "asc" },
              { createdAt: "desc" },
            ],
            take: 1, // Just get one for preview
          });

          roomTypePreview = roomTypes[0] || null;
        }

        return {
          ...business,
          roomTypePreview,
        };
      })
    );

    return NextResponse.json({
      businesses: businessesWithRooms,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}
