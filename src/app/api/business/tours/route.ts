import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all tour experiences for the current business
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tours = await prisma.tourExperience.findMany({
      where: {
        businessId: session.user.id,
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ tours });
  } catch (error) {
    console.error("Error fetching tours:", error);
    return NextResponse.json(
      { error: "Failed to fetch tours" },
      { status: 500 }
    );
  }
}

// POST - Create a new tour experience
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify user is a verified business with tour services
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        businessServices: true,
        verificationStatus: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can create tours" },
        { status: 403 }
      );
    }

    if (!user?.businessServices?.includes("tours")) {
      return NextResponse.json(
        { error: "Only tour operators can create tours" },
        { status: 403 }
      );
    }

    if (user?.verificationStatus !== "verified") {
      return NextResponse.json(
        { error: "Your business must be verified to create tours" },
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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Tour name is required" },
        { status: 400 }
      );
    }

    if (!duration || !duration.trim()) {
      return NextResponse.json(
        { error: "Duration is required" },
        { status: 400 }
      );
    }

    // Create tour experience
    const tour = await prisma.tourExperience.create({
      data: {
        businessId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        duration: duration.trim(),
        groupSizeMin: groupSizeMin ? parseInt(groupSizeMin) : null,
        groupSizeMax: groupSizeMax ? parseInt(groupSizeMax) : null,
        difficulty: difficulty?.trim() || null,
        season: season?.trim() || null,
        priceFrom: priceFrom ? parseFloat(priceFrom) : null,
        currency: currency || "EUR",
        images: images || [],
        coverImage: coverImage || null,
        highlights: highlights || [],
        included: included || [],
        directBookingUrl: directBookingUrl?.trim() || null,
        getYourGuideUrl: getYourGuideUrl?.trim() || null,
        viatorUrl: viatorUrl?.trim() || null,
        tripAdvisorUrl: tripAdvisorUrl?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      },
    });

    return NextResponse.json({ success: true, tour });
  } catch (error) {
    console.error("Error creating tour:", error);
    return NextResponse.json(
      { error: "Failed to create tour" },
      { status: 500 }
    );
  }
}
