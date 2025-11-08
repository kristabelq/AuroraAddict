import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);

    // Search parameters
    const locationQuery = searchParams.get("location");
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;
    const userSearch = searchParams.get("user");
    const month = searchParams.get("month"); // 1-12
    const year = searchParams.get("year"); // e.g., "2024"
    const country = searchParams.get("country");
    const sortOrder = searchParams.get("sort") || "latest"; // "latest" or "earliest"

    // Build where clause
    const where: any = {
      images: {
        isEmpty: false, // Only sightings with images
      },
    };

    // Location search (text search in location field)
    if (locationQuery) {
      where.location = {
        contains: locationQuery,
        mode: "insensitive",
      };
    }

    // User search (by name or username)
    if (userSearch) {
      where.user = {
        OR: [
          { name: { contains: userSearch, mode: "insensitive" } },
          { username: { contains: userSearch, mode: "insensitive" } },
        ],
      };
    }

    // Month filter (all years for this month)
    if (month) {
      const monthNum = parseInt(month);
      where.sightingDate = {
        ...where.sightingDate,
        gte: new Date(`2000-${month.padStart(2, "0")}-01`),
      };
      // Use a custom filter in JS after fetching
    }

    // Year filter
    if (year) {
      const yearNum = parseInt(year);
      where.sightingDate = {
        ...where.sightingDate,
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt: new Date(`${yearNum + 1}-01-01T00:00:00.000Z`),
      };
    }

    // Country filter (in location field)
    if (country) {
      where.location = {
        ...where.location,
        contains: country,
        mode: "insensitive",
      };
    }

    // Order by date
    const orderBy: any = [];

    // If searching by location coordinates, sort by distance
    if (lat !== null && lng !== null) {
      // Fetch all and sort by distance in JS
    } else {
      // Sort by date
      orderBy.push({
        sightingDate: sortOrder === "latest" ? "desc" : "asc",
      });
      orderBy.push({
        createdAt: sortOrder === "latest" ? "desc" : "asc",
      });
    }

    // Fetch sightings
    let sightings = await prisma.sighting.findMany({
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        likes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
            }
          : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      take: 500, // Limit to 500 sightings
    });

    // Apply month filter (check month only, ignore year)
    if (month && !year) {
      const monthNum = parseInt(month);
      sightings = sightings.filter((s) => {
        if (!s.sightingDate) return false;
        const sightingMonth = new Date(s.sightingDate).getMonth() + 1;
        return sightingMonth === monthNum;
      });
    }

    // Sort by distance if location coordinates provided
    if (lat !== null && lng !== null) {
      sightings = sightings
        .map((s) => {
          if (!s.latitude || !s.longitude) return { ...s, distance: Infinity };

          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = ((s.latitude - lat) * Math.PI) / 180;
          const dLng = ((s.longitude - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((s.latitude * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          return { ...s, distance };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    // Format response
    const formattedSightings = sightings.map((sighting) => ({
      id: sighting.id,
      caption: sighting.caption,
      location: sighting.location,
      latitude: sighting.latitude,
      longitude: sighting.longitude,
      images: sighting.images,
      thumbnails: sighting.thumbnails,
      videos: sighting.videos,
      sightingType: sighting.sightingType,
      sightingDate: sighting.sightingDate,
      createdAt: sighting.createdAt,
      user: sighting.user,
      _count: sighting._count,
      isLiked: Array.isArray(sighting.likes) && sighting.likes.length > 0,
    }));

    return NextResponse.json(formattedSightings);
  } catch (error) {
    console.error("Error searching sightings:", error);
    return NextResponse.json(
      { error: "Failed to search sightings" },
      { status: 500 }
    );
  }
}
