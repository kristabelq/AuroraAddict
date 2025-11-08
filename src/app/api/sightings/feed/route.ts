import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  try {
    const sightings = await prisma.sighting.findMany({
      select: {
        id: true,
        caption: true,
        location: true,
        images: true,
        videos: true,
        sightingType: true,
        sightingDate: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
              },
            }
          : false,
      },
      orderBy: [
        { createdAt: "desc" },
      ],
      take: 50,
    });

    // Add isLiked field based on whether user has liked
    const sightingsWithLiked = sightings.map((sighting) => ({
      ...sighting,
      isLiked: session?.user?.id ? (sighting.likes as any[]).length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    return NextResponse.json(sightingsWithLiked);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
