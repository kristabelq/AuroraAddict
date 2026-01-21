import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { generateTourAffiliateLinks } from "@/lib/affiliate-injector";

// PUT - Update a tour experience
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify tour belongs to current user
    const existingTour = await prisma.tourExperience.findUnique({
      where: { id },
      select: { businessId: true },
    });

    if (!existingTour) {
      return NextResponse.json(
        { error: "Tour not found" },
        { status: 404 }
      );
    }

    if (existingTour.businessId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this tour" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      duration,
      groupSizeMin,
      groupSizeMax,
      difficulty,
      season,
      priceFrom,
      currency,
      images,
      coverImage,
      highlights,
      included,
      directBookingUrl,
      getYourGuideUrl,
      viatorUrl,
      tripAdvisorUrl,
      isActive,
      displayOrder,
    } = body;

    // Generate affiliate links for tour booking platforms
    const affiliateLinks = generateTourAffiliateLinks({
      getYourGuideUrl,
      viatorUrl,
      tripAdvisorUrl,
      directBookingUrl,
    });

    // Update tour experience
    const tour = await prisma.tourExperience.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        duration: duration?.trim(),
        groupSizeMin: groupSizeMin !== undefined ? (groupSizeMin ? parseInt(groupSizeMin) : null) : undefined,
        groupSizeMax: groupSizeMax !== undefined ? (groupSizeMax ? parseInt(groupSizeMax) : null) : undefined,
        difficulty: difficulty?.trim() || null,
        season: season?.trim() || null,
        priceFrom: priceFrom !== undefined ? (priceFrom ? parseFloat(priceFrom) : null) : undefined,
        currency: currency,
        images: images,
        coverImage: coverImage,
        highlights: highlights,
        included: included,
        directBookingUrl: directBookingUrl?.trim() || null,
        getYourGuideUrl: getYourGuideUrl?.trim() || null,
        viatorUrl: viatorUrl?.trim() || null,
        tripAdvisorUrl: tripAdvisorUrl?.trim() || null,
        affiliateLinks: affiliateLinks as Prisma.JsonObject,
        isActive: isActive,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
      },
    });

    return NextResponse.json({ success: true, tour });
  } catch (error) {
    console.error("Error updating tour:", error);
    return NextResponse.json(
      { error: "Failed to update tour" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a tour experience
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify tour belongs to current user
    const existingTour = await prisma.tourExperience.findUnique({
      where: { id },
      select: { businessId: true },
    });

    if (!existingTour) {
      return NextResponse.json(
        { error: "Tour not found" },
        { status: 404 }
      );
    }

    if (existingTour.businessId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this tour" },
        { status: 403 }
      );
    }

    await prisma.tourExperience.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tour:", error);
    return NextResponse.json(
      { error: "Failed to delete tour" },
      { status: 500 }
    );
  }
}
