import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Quick Sighting API
 *
 * Allows users to quickly report "I see aurora!" with minimal friction.
 * Sightings automatically expire after 2 hours to keep the map current.
 *
 * POST: Create a new quick sighting
 * GET: Get user's recent quick sightings
 */

interface QuickSightingInput {
  latitude: number;
  longitude: number;
  intensity: number; // 1-5 scale
  colors?: string[]; // ['green', 'purple', 'red', etc.]
  structure?: string; // 'arc' | 'band' | 'corona' | 'diffuse' | 'pulsating'
  direction?: string; // Cardinal direction (N, NE, E, etc.)
}

// Rate limit: Max 3 quick sightings per user per hour
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkUserRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  if (userLimit.count >= 3) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check rate limit
    if (!checkUserRateLimit(session.user.id)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You can only report 3 quick sightings per hour",
        },
        { status: 429 }
      );
    }

    const body: QuickSightingInput = await request.json();

    // Validate input
    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      typeof body.intensity !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input: latitude, longitude, and intensity are required" },
        { status: 400 }
      );
    }

    // Validate intensity range (1-5)
    if (body.intensity < 1 || body.intensity > 5) {
      return NextResponse.json(
        { error: "Intensity must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (
      body.latitude < -90 ||
      body.latitude > 90 ||
      body.longitude < -180 ||
      body.longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Valid colors
    const validColors = ["green", "purple", "red", "blue", "pink", "white", "yellow"];
    const colors = body.colors?.filter((c) => validColors.includes(c.toLowerCase())) || [];

    // Valid structures
    const validStructures = ["arc", "band", "corona", "diffuse", "pulsating", "curtain"];
    const structure = body.structure && validStructures.includes(body.structure.toLowerCase())
      ? body.structure.toLowerCase()
      : null;

    // Calculate expiration time (2 hours from now)
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // Reverse geocode to get city name (simplified)
    let cityName: string | null = null;
    let countryCode: string | null = null;

    try {
      const geocodeResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${body.latitude}&lon=${body.longitude}&format=json`,
        {
          headers: {
            "User-Agent": "AuroraAddict/1.0",
          },
        }
      );

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        cityName =
          geocodeData.address?.city ||
          geocodeData.address?.town ||
          geocodeData.address?.village ||
          geocodeData.address?.county ||
          null;
        countryCode = geocodeData.address?.country_code?.toUpperCase() || null;
      }
    } catch {
      // Geocoding failed, continue without city name
    }

    // Create the quick sighting
    const sighting = await prisma.quickSighting.create({
      data: {
        userId: session.user.id,
        latitude: body.latitude,
        longitude: body.longitude,
        intensity: body.intensity,
        colors,
        structure,
        direction: body.direction || null,
        cityName,
        countryCode,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        sighting: {
          id: sighting.id,
          latitude: sighting.latitude,
          longitude: sighting.longitude,
          intensity: sighting.intensity,
          colors: sighting.colors,
          structure: sighting.structure,
          direction: sighting.direction,
          cityName: sighting.cityName,
          countryCode: sighting.countryCode,
          timestamp: sighting.timestamp,
          expiresAt: sighting.expiresAt,
          user: sighting.user,
        },
        message: "Aurora sighting reported! It will appear on the map for 2 hours.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quick sighting:", error);
    return NextResponse.json(
      {
        error: "Failed to create sighting",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    // Get user's recent quick sightings (including expired for history)
    const sightings = await (prisma.quickSighting?.findMany?.({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
    }) ?? Promise.resolve([]));

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sightings: (sightings as any[]).map((s) => ({
        id: s.id,
        latitude: s.latitude,
        longitude: s.longitude,
        intensity: s.intensity,
        colors: s.colors,
        structure: s.structure,
        direction: s.direction,
        cityName: s.cityName,
        countryCode: s.countryCode,
        timestamp: s.timestamp,
        expiresAt: s.expiresAt,
        isExpired: new Date() > s.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching user quick sightings:", error);
    return NextResponse.json(
      { error: "Failed to fetch sightings" },
      { status: 500 }
    );
  }
}
