import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get public profile by userId or username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Try to find user by ID first, then by username
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sightings: {
          select: {
            id: true,
            caption: true,
            location: true,
            images: true, // Full-size images for feed/modal view
            videos: true,
            thumbnails: true, // Use thumbnails for grid view (400x400)
            sightingType: true,
            sightingDate: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 12, // Only load first 12 for profile grid
        },
        _count: {
          select: {
            sightings: true,
            hunts: true,
            huntParticipants: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    // If not found by ID, try username
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: userId },
        include: {
          sightings: {
            select: {
              id: true,
              caption: true,
              location: true,
              images: true, // Full-size images for feed/modal view
              videos: true,
              thumbnails: true, // Use thumbnails for grid view (400x400)
              sightingType: true,
              sightingDate: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  username: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 12, // Only load first 12 for profile grid
          },
          _count: {
            select: {
              sightings: true,
              hunts: true,
              huntParticipants: true,
              followers: true,
              following: true,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is viewing their own profile
    const isOwnProfile = session?.user?.id === user.id;

    // Check if current user is following this user
    let isFollowing = false;
    if (session?.user?.id && !isOwnProfile) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    // Use cached counters for instant performance
    const sightingsCount = user.cachedSightingsCount; // Unique nights with sightings
    const postsCount = user._count.sightings; // Total number of posts
    const huntsCount = user.cachedHuntsCreatedCount;
    const huntsParticipatedCount = user.cachedHuntsJoinedCount;

    // Calculate average success rate from all hunts the user participated in
    let averageSuccessRate = 0;

    // Get all hunts where user is creator or participant
    const hunts = await prisma.hunt.findMany({
      where: {
        OR: [
          { userId: user.id }, // Hunts created by user
          {
            participants: {
              some: {
                userId: user.id
              }
            }
          } // Hunts joined by user
        ]
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        sightings: {
          select: {
            sightingDate: true
          },
          where: {
            sightingDate: { not: null }
          }
        }
      }
    });

    if (hunts.length > 0) {
      // Calculate success rate for each hunt and average them
      const successRates = hunts.map(hunt => {
        const totalNights = Math.ceil((new Date(hunt.endDate).getTime() - new Date(hunt.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Count unique nights with sightings (calendar dates only)
        const uniqueNights = new Set(
          hunt.sightings.map(s => {
            const date = new Date(s.sightingDate!);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          })
        ).size;

        return totalNights > 0 ? Math.min(100, (uniqueNights / totalNights) * 100) : 0;
      });
      averageSuccessRate = successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length;
    }

    // For business accounts, include room types
    let roomTypes = [];
    if (user.userType === "business" && user.businessServices?.includes("accommodation")) {
      roomTypes = await prisma.roomType.findMany({
        where: {
          businessId: user.id,
          isActive: true,
        },
        orderBy: [
          { displayOrder: "asc" },
          { createdAt: "desc" },
        ],
        take: 6, // Show first 6 room types on profile
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      instagram: user.instagram,
      whatsappNumber: user.whatsappNumber,
      publicEmail: user.publicEmail,
      userType: user.userType,
      businessName: user.businessName,
      businessServices: user.businessServices,
      verificationStatus: user.verificationStatus,
      sightingsCount: sightingsCount, // Cached count
      postsCount: postsCount, // Cached count
      huntsCount: huntsCount, // Cached count
      huntsParticipatedCount: huntsParticipatedCount, // Cached count
      followersCount: user._count.followers,
      followingCount: user._count.following,
      averageSuccessRate: averageSuccessRate,
      sightings: user.sightings,
      roomTypes: roomTypes,
      isOwnProfile,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
