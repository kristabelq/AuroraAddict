import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";
  const country = searchParams.get("country") || "";
  const minSuccessRate = searchParams.get("minSuccessRate");

  try {
    // Build where clause for search
    const whereClause: any = {
      NOT: {
        id: session.user.id, // Exclude current user
      },
    };

    // Search by name or username
    if (query.trim()) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ];
    }

    // Search by location through CityBadges
    const cityBadgeFilters: any = {};
    if (city.trim()) {
      cityBadgeFilters.city = { contains: city, mode: "insensitive" };
    }
    if (country.trim()) {
      cityBadgeFilters.country = { contains: country, mode: "insensitive" };
    }

    if (Object.keys(cityBadgeFilters).length > 0) {
      whereClause.cityBadges = {
        some: cityBadgeFilters,
      };
    }

    // Get users with their stats
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        cityBadges: {
          take: 5, // Limit to 5 most recent badges
          orderBy: {
            earnedAt: "desc",
          },
          select: {
            city: true,
            country: true,
            countryCode: true,
          },
        },
        _count: {
          select: {
            sightings: true,
            hunts: true,
            followers: true,
          },
        },
        followers: {
          where: {
            followerId: session.user.id,
          },
          select: {
            id: true,
          },
        },
      },
      take: 50, // Limit results
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate success rate for each user
    const usersWithSuccessRate = await Promise.all(
      users.map(async (user) => {
        // Get all completed hunts for this user
        const completedHunts = await prisma.hunt.findMany({
          where: {
            OR: [
              { userId: user.id }, // Hunts created by user
              {
                participants: {
                  some: {
                    userId: user.id,
                    status: "confirmed",
                  },
                },
              }, // Hunts user participated in
            ],
            endDate: {
              lt: new Date(), // Only completed hunts
            },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        });

        if (completedHunts.length === 0) {
          return {
            ...user,
            successRate: 0,
            isFollowing: user.followers.length > 0,
            followers: user._count.followers,
            sightings: user._count.sightings,
            hunts: user._count.hunts,
          };
        }

        // Calculate total hunt days
        let totalHuntDays = 0;
        const huntIds = completedHunts.map((h) => h.id);

        completedHunts.forEach((hunt) => {
          const start = new Date(hunt.startDate);
          const end = new Date(hunt.endDate);
          const days = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          totalHuntDays += days;
        });

        // Count unique nights with sightings across all hunts
        const sightingsWithDates = await prisma.sighting.findMany({
          where: {
            userId: user.id,
            huntId: {
              in: huntIds,
            },
            sightingDate: {
              not: null,
            },
          },
          select: {
            sightingDate: true,
          },
        });

        const uniqueNights = new Set(
          sightingsWithDates
            .map((s) => {
              if (s.sightingDate) {
                const date = new Date(s.sightingDate);
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              }
              return null;
            })
            .filter(Boolean)
        );

        const nightsWithSightings = uniqueNights.size;

        // Calculate success rate
        const successRate =
          totalHuntDays > 0
            ? Math.min((nightsWithSightings / totalHuntDays) * 100, 100)
            : 0;

        return {
          ...user,
          successRate: parseFloat(successRate.toFixed(1)),
          isFollowing: user.followers.length > 0,
          followers: user._count.followers,
          sightings: user._count.sightings,
          hunts: user._count.hunts,
        };
      })
    );

    // Filter by success rate if specified
    let filteredUsers = usersWithSuccessRate;
    if (minSuccessRate) {
      const minRate = parseFloat(minSuccessRate);
      filteredUsers = usersWithSuccessRate.filter(
        (user) => user.successRate >= minRate
      );
    }

    // Sort by success rate (highest first)
    filteredUsers.sort((a, b) => b.successRate - a.successRate);

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
