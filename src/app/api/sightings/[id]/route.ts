import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Delete a sighting
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: sightingId } = await params;

    // Check if sighting exists and user owns it
    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
      select: { userId: true },
    });

    if (!sighting) {
      return NextResponse.json({ error: "Sighting not found" }, { status: 404 });
    }

    if (sighting.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the sighting (cascade will delete likes and comments)
    await prisma.sighting.delete({
      where: { id: sightingId },
    });

    // Recalculate cached sightings count (count of unique sightingDates with non-null values)
    const uniqueSightingDatesCount = await prisma.sighting.findMany({
      where: {
        userId: session.user.id,
        sightingDate: { not: null },
      },
      select: { sightingDate: true },
      distinct: ['sightingDate'],
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        cachedSightingsCount: uniqueSightingDatesCount.length,
      },
    });

    return NextResponse.json({ message: "Sighting deleted successfully" });
  } catch (error) {
    console.error("Error deleting sighting:", error);
    return NextResponse.json(
      { error: "Failed to delete sighting" },
      { status: 500 }
    );
  }
}

// PATCH - Update a sighting
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: sightingId } = await params;
    const body = await req.json();
    const { caption } = body;

    // Check if sighting exists and user owns it
    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
      select: { userId: true },
    });

    if (!sighting) {
      return NextResponse.json({ error: "Sighting not found" }, { status: 404 });
    }

    if (sighting.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the sighting
    const updatedSighting = await prisma.sighting.update({
      where: { id: sightingId },
      data: {
        caption: caption || null,
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

    return NextResponse.json(updatedSighting);
  } catch (error) {
    console.error("Error updating sighting:", error);
    return NextResponse.json(
      { error: "Failed to update sighting" },
      { status: 500 }
    );
  }
}
