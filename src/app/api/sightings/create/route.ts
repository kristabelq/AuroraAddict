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
    const formData = await req.formData();

    const caption = formData.get("caption") as string;
    const location = formData.get("location") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const sightingType = (formData.get("sightingType") as string) || "realtime";
    const huntId = formData.get("huntId") as string | null;
    const sightingDate = formData.get("sightingDate") as string | null;
    const sightingTime = formData.get("sightingTime") as string | null;
    const imageFiles = formData.getAll("images") as File[];

    console.log("Received sighting data:", { sightingDate, sightingTime, sightingType });

    // Validate required fields
    if (!location || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    const thumbnailUrls: string[] = [];

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
