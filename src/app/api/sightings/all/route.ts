import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sightings = await prisma.sighting.findMany({
      include: {
        user: {
          select: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json(sightings);
  } catch (error) {
    console.error("Error fetching all sightings:", error);
    return NextResponse.json([]);
  }
}
