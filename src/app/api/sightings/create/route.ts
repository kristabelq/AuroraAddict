import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/supabase/storage";
import { onSightingPostedToHunt } from "@/lib/huntStats";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let caption: string;
    let location: string;
    let latitude: number;
    let longitude: number;
    let sightingType: string;
    let huntId: string | null;
    let sightingDate: string | null;
    let sightingTime: string | null;
    let timezone: string | null = null;
    let imageUrls: string[] = [];
    let thumbnailUrls: string[] = [];
    let imageFiles: File[] = [];

    if (isJson) {
      // New format: JSON with pre-uploaded image URLs
      const body = await req.json();
      caption = body.caption;
      location = body.location;
      latitude = parseFloat(body.latitude);
      longitude = parseFloat(body.longitude);
      sightingType = body.sightingType || "realtime";
      huntId = body.huntId || null;
      sightingDate = body.sightingDate || null;
      sightingTime = body.sightingTime || null;
      timezone = body.timezone || null;
      imageUrls = body.imageUrls || [];
      thumbnailUrls = body.thumbnailUrls || [];
    } else {
      // Old format: FormData with files
      const formData = await req.formData();
      caption = formData.get("caption") as string;
      location = formData.get("location") as string;
      latitude = parseFloat(formData.get("latitude") as string);
      longitude = parseFloat(formData.get("longitude") as string);
      sightingType = (formData.get("sightingType") as string) || "realtime";
      huntId = formData.get("huntId") as string | null;
      sightingDate = formData.get("sightingDate") as string | null;
      sightingTime = formData.get("sightingTime") as string | null;
      timezone = formData.get("timezone") as string | null;
      imageFiles = formData.getAll("images") as File[];
    }

    console.log("Received sighting data:", { sightingDate, sightingTime, sightingType });

    // Validate required fields
    if (!location || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Process images if using FormData (old format)
    if (imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        try {
          // Upload to Supabase Storage with automatic thumbnail generation
          const result = await uploadImage({
            bucket: 'sightings',
            userId: session.user.id,
            file,
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 85,
            generateThumbnail: true,
            thumbnailSize: 400,
          });

          imageUrls.push(result.url);
          if (result.thumbnailUrl) {
            thumbnailUrls.push(result.thumbnailUrl);
          }
        } catch (error) {
          console.error('Error uploading image to Supabase:', error);
          return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 }
          );
        }
      }
    }

    // Validate we have images (either uploaded or provided as URLs)
    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Parse sightingDate if provided
    let parsedSightingDate: Date | null = null;
    if (sightingDate) {
      try {
        // If time is also provided, combine them
        if (sightingTime) {
          parsedSightingDate = new Date(`${sightingDate}T${sightingTime}`);
        } else {
          parsedSightingDate = new Date(sightingDate);
        }
      } catch (e) {
        console.error("Error parsing sighting date:", e);
      }
    }

    // Create sighting in database and update user's cached counter
    const sighting = await prisma.sighting.create({
      data: {
        userId: session.user.id,
        huntId: huntId || null,
        caption: caption || null,
        location,
        latitude,
        longitude,
        sightingType,
        sightingDate: parsedSightingDate,
        sightingTime: sightingTime || null,
        images: imageUrls,
        thumbnails: thumbnailUrls,
        videos: [],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
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

    // Trigger hunt stats recalculation if sighting is linked to a hunt
    if (huntId) {
      // Run async without blocking response (fire-and-forget)
      onSightingPostedToHunt(huntId).catch((error) => {
        console.error(`[Sighting Create] Failed to update hunt stats for ${huntId}:`, error);
      });
    }

    return NextResponse.json({
      success: true,
      sighting,
      message: "Sighting posted successfully",
    });
  } catch (error) {
    console.error("Error creating sighting:", error);
    return NextResponse.json(
      { error: "Failed to create sighting" },
      { status: 500 }
    );
  }
}
