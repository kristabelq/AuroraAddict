import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        sightings: {
          select: {
            id: true,
            images: true,
            caption: true,
            location: true,
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
          take: 30, // Limit to most recent 30 sightings
        },
        _count: {
          select: {
            sightings: true,
            hunts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}
