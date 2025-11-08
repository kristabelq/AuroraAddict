import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users that are following the current user
    const followers = await prisma.follow.findMany({
      where: {
        followingId: session.user.id,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            bio: true,
            _count: {
              select: {
                followers: true,
                sightings: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if current user is following each follower back
    const followerIds = followers.map((f) => f.follower.id);
    const followingBack = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: {
          in: followerIds,
        },
      },
      select: {
        followingId: true,
      },
    });

    const followingBackIds = new Set(followingBack.map((f) => f.followingId));

    // Transform the data to include isFollowing status
    const followerUsers = followers.map((f) => ({
      id: f.follower.id,
      name: f.follower.name,
      username: f.follower.username,
      image: f.follower.image,
      bio: f.follower.bio,
      followers: f.follower._count.followers,
      sightings: f.follower._count.sightings,
      isFollowing: followingBackIds.has(f.follower.id),
    }));

    return NextResponse.json(followerUsers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
