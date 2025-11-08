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
    // Get all users that the current user is following
    const following = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
      },
      include: {
        following: {
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

    // Transform the data to a simpler format
    const followingUsers = following.map((f) => ({
      id: f.following.id,
      name: f.following.name,
      username: f.following.username,
      image: f.following.image,
      bio: f.following.bio,
      followers: f.following._count.followers,
      sightings: f.following._count.sightings,
    }));

    return NextResponse.json(followingUsers);
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
