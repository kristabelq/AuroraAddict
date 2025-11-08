import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all sightings for a hunt (shared album)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: huntId } = await params;

    // Check if hunt exists
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        participants: {
          where: { userId: session?.user?.id || "" },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // For private hunts, only allow participants and creator to view
    if (!hunt.isPublic) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "This hunt is private. Please sign in." },
          { status: 401 }
        );
      }

      // Check if user is confirmed participant or has received payment (Edge Case #1)
      // Payment "received" counts as access granted even before owner confirmation
      const isAuthorizedParticipant = hunt.participants.some(
        p => (p.status === "confirmed" || p.paymentStatus === "received") &&
        (p.paymentStatus === "confirmed" || p.paymentStatus === "received" || p.paymentStatus === null)
      );
      const isCreator = hunt.userId === session.user.id;

      if (!isAuthorizedParticipant && !isCreator) {
        return NextResponse.json(
          { error: "Access denied. Payment confirmation required for paid hunts." },
          { status: 403 }
        );
      }
    }

    // For public hunts, anyone can view the album

    // Fetch all sightings for this hunt
    const sightings = await prisma.sighting.findMany({
      where: {
        huntId,
      },
      select: {
        id: true,
        caption: true,
        location: true,
        images: true, // Full-size images for feed view
        videos: true,
        thumbnails: true, // Use thumbnails for album grid (400x400)
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add isLiked field
    const sightingsWithLiked = sightings.map((sighting) => ({
      ...sighting,
      isLiked: session?.user?.id ? (sighting.likes as any[]).length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    return NextResponse.json(sightingsWithLiked);
  } catch (error) {
    console.error("Error fetching hunt sightings:", error);
    return NextResponse.json(
      { error: "Failed to fetch sightings" },
      { status: 500 }
    );
  }
}

// Create a new sighting for a hunt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: huntId } = await params;
    const body = await request.json();

    // Check if hunt exists
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        participants: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // Check if user is a confirmed participant or has received payment (Edge Case #1)
    // Payment "received" counts as access granted even before owner confirmation
    const isAuthorizedParticipant = hunt.participants.some(
      p => (p.status === "confirmed" || p.paymentStatus === "received") &&
      (p.paymentStatus === "confirmed" || p.paymentStatus === "received" || p.paymentStatus === null)
    );
    const isCreator = hunt.userId === session.user.id;

    if (!isAuthorizedParticipant && !isCreator) {
      return NextResponse.json(
        { error: "Access denied. Payment confirmation required for paid hunts." },
        { status: 403 }
      );
    }

    // Create the sighting
    const sighting = await prisma.sighting.create({
      data: {
        userId: session.user.id,
        huntId: huntId,
        caption: body.caption,
        latitude: body.latitude || hunt.latitude || 0,
        longitude: body.longitude || hunt.longitude || 0,
        location: body.location || hunt.location || "Unknown",
        images: body.images || [],
        videos: body.videos || [],
        sightingType: body.sightingType || "realtime",
      },
      include: {
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
    });

    return NextResponse.json(sighting);
  } catch (error) {
    console.error("Error creating hunt sighting:", error);
    return NextResponse.json(
      { error: "Failed to create sighting" },
      { status: 500 }
    );
  }
}
