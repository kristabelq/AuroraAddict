import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const sightings = await prisma.sighting.findMany({
      where: {
        sightingDate: {
          gte: twelveHoursAgo,
          not: null,
        },
      },
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
        sightingDate: "desc",
      },
    });

    return NextResponse.json(sightings);
  } catch (error) {
    console.error("Error fetching recent sightings:", error);
    return NextResponse.json([]);
  }
}
