import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompletedHuntsMissingSightings } from "@/lib/userStats";

export async function GET() {
  const session = await getServerSession(authOptions);

  console.log('Session in profile API:', session?.user);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
            likes: {
              where: {
                userId: session.user.id,
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

    console.log('User found:', user ? 'YES' : 'NO');
    console.log('User sightings count:', user?.sightings?.length);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use cached counters for instant performance
    const sightingsCount = user.cachedSightingsCount; // Unique nights with sightings
    const postsCount = user._count.sightings; // Total number of posts
    const huntsCount = user.cachedHuntsCreatedCount;
    // Total hunts = created + joined
    const huntsParticipatedCount = user.cachedHuntsCreatedCount + user.cachedHuntsJoinedCount;

    // NEW FIELDS - gracefully handle if columns don't exist yet
    const completedHuntsCount = (user as any).cachedCompletedHuntsCount || 0;
    const averageSuccessRate = (user as any).cachedSuccessRate || 0;

    // Fetch completed hunts missing sightings for reminder banner (gracefully handle errors)
    let huntsMissingSightings: any[] = [];
    try {
      const hunts = await getCompletedHuntsMissingSightings(session.user.id);
      // Convert Date objects to ISO strings for JSON serialization
      huntsMissingSightings = hunts.map(hunt => ({
        ...hunt,
        startDate: hunt.startDate.toISOString(),
        endDate: hunt.endDate.toISOString(),
      }));
    } catch (error) {
      console.log('[Profile API] huntsMissingSightings feature not yet available:', error);
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      instagram: user.instagram,
      whatsappNumber: user.whatsappNumber,
      publicEmail: user.publicEmail,
      sightingsCount: sightingsCount, // Cached count
      postsCount: postsCount, // Cached count
      huntsCount: huntsCount, // Cached count
      huntsParticipatedCount: huntsParticipatedCount, // Cached count
      completedHuntsCount: completedHuntsCount, // NEW: Completed hunts only
      followersCount: user._count.followers,
      followingCount: user._count.following,
      averageSuccessRate: averageSuccessRate, // Only from COMPLETED hunts
      huntsMissingSightings: huntsMissingSightings, // NEW: For reminder banner
      // Business account fields
      userType: user.userType,
      verificationStatus: user.verificationStatus,
      rejectionReason: user.rejectionReason,
      businessName: user.businessName,
      businessCategory: user.businessCategory,
      sightings: user.sightings.map(sighting => ({
        ...sighting,
        isLiked: sighting.likes.length > 0,
        likes: undefined, // Remove the likes array from response
      })),
    });
  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bio, username, instagram, whatsappNumber, publicEmail } = body;

    // Check if username is being updated and if it's already taken
    if (username !== undefined && username !== null && username !== "") {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    const updateData: {
      bio?: string;
      username?: string | null;
      instagram?: string | null;
      whatsappNumber?: string | null;
      publicEmail?: string | null;
    } = {};

    if (bio !== undefined) {
      updateData.bio = bio || null;
    }
    if (username !== undefined) {
      updateData.username = username === "" || username === null ? null : username;
    }
    if (instagram !== undefined) {
      // Remove @ if user adds it
      if (instagram === null || instagram === "") {
        updateData.instagram = null;
      } else {
        const cleanInstagram = instagram.replace(/^@/, "").trim();
        updateData.instagram = cleanInstagram === "" ? null : cleanInstagram;
      }
    }
    if (whatsappNumber !== undefined) {
      // Remove all spaces, dashes, and plus signs
      if (whatsappNumber === null || whatsappNumber === "") {
        updateData.whatsappNumber = null;
      } else {
        const cleanWhatsapp = whatsappNumber.replace(/[\s\-+]/g, "").trim();
        updateData.whatsappNumber = cleanWhatsapp === "" ? null : cleanWhatsapp;
      }
    }
    if (publicEmail !== undefined) {
      if (publicEmail === null || publicEmail === "") {
        updateData.publicEmail = null;
      } else {
        updateData.publicEmail = publicEmail.trim();
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
