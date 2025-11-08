import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { toZonedTime } from "date-fns-tz";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // Extract form fields
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const additionalInfoUrl = formData.get("additionalInfoUrl") as string | null;
    const whatsappNumber = formData.get("whatsappNumber") as string | null;
    const startDateLocal = formData.get("startDate") as string;
    const endDateLocal = formData.get("endDate") as string;
    const timezone = formData.get("timezone") as string;
    const location = formData.get("location") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const hideLocation = formData.get("hideLocation") === "true";
    const isPublic = formData.get("isPublic") === "true";
    const hideFromPublic = formData.get("hideFromPublic") === "true";
    const isPaid = formData.get("isPaid") === "true";
    const price = formData.get("price") as string | null;
    const cancellationPolicy = formData.get("cancellationPolicy") as string | null;

    // Edge Case: Require verified email for paid hunts
    if (isPaid) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true, email: true },
      });

      if (!user?.emailVerified) {
        return NextResponse.json(
          {
            error:
              "You must verify your email address before creating a paid hunt. Please check your inbox for a verification email.",
          },
          { status: 403 }
        );
      }
    }

    // Validation: hideFromPublic should only be true when isPublic is false (Private mode)
    if (hideFromPublic && isPublic) {
      return NextResponse.json(
        { error: "Hide from Public can only be enabled for private hunts" },
        { status: 400 }
      );
    }
    const capacity = formData.get("capacity") as string | null;
    const allowWaitlist = formData.get("allowWaitlist") === "true";
    const coverImageFile = formData.get("coverImage") as File | null;

    // Convert local datetime to UTC using IANA timezone
    // The datetime-local input gives us a string like "2025-10-13T14:00"
    // We interpret this as the time in the hunt's IANA timezone and convert to UTC
    // We need to parse the string as if it's in the hunt's timezone, then convert to UTC

    // Parse the datetime string in the hunt's timezone
    // datetime-local format: "2025-10-13T14:00"
    // We treat this as the time in the hunt's timezone
    const parseLocalTime = (dateTimeStr: string, tz: string): Date => {
      // Add ":00" seconds if not present (datetime-local might not include seconds)
      const normalizedStr = dateTimeStr.length === 16 ? `${dateTimeStr}:00` : dateTimeStr;

      // Create a date string in ISO format but interpreted as the target timezone
      // toZonedTime interprets this as being in the target timezone
      return toZonedTime(normalizedStr, tz);
    };

    const startDate = parseLocalTime(startDateLocal, timezone);
    const endDate = parseLocalTime(endDateLocal, timezone);

    let coverImageUrl: string | null = null;

    // Process cover image if provided
    if (coverImageFile) {
      const bytes = await coverImageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Process and resize image to 16:9 landscape (1600x900)
      const processedImage = await sharp(buffer)
        .resize(1600, 900, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate unique filename
      const filename = `hunt-cover-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filepath = path.join(process.cwd(), "public", "uploads", "hunts", filename);

      // Ensure directory exists
      const dir = path.dirname(filepath);
      const fs = require("fs");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save file
      await writeFile(filepath, processedImage);
      coverImageUrl = `/uploads/hunts/${filename}`;
    }

    // Create hunt, add creator as participant, and update cached counters in a transaction
    const [hunt] = await prisma.$transaction([
      prisma.hunt.create({
        data: {
          name,
          description,
          userId: session.user.id,
          coverImage: coverImageUrl,
          additionalInfoUrl: additionalInfoUrl || null,
          whatsappNumber: whatsappNumber || null,
          startDate: startDate,
          endDate: endDate,
          timezone: timezone || "UTC",
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          location,
          hideLocation,
          isPublic,
          hideFromPublic,
          isPaid,
          price: price ? parseFloat(price) : null,
          cancellationPolicy: cancellationPolicy || null,
          capacity: capacity ? parseInt(capacity) : null,
          allowWaitlist,
        },
      }),
    ]);

    // Automatically add creator as participant, create chat, and increment counters
    await prisma.$transaction([
      prisma.huntParticipant.create({
        data: {
          huntId: hunt.id,
          userId: session.user.id,
          status: "confirmed",
        },
      }),
      // Increment both cached counters: created and joined
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          cachedHuntsCreatedCount: { increment: 1 },
          cachedHuntsJoinedCount: { increment: 1 },
        },
      }),
    ]);

    // Auto-create hunt chat group
    const chatGroup = await prisma.chatGroup.create({
      data: {
        name: `${name} - Hunt Chat`,
        description: `Group chat for ${name}`,
        groupType: "hunt",
        visibility: "private",
        huntId: hunt.id,
        ownerId: session.user.id,
        memberCount: 1,
        countryCode: null,
        countryName: null,
        areaName: null,
      },
    });

    // Add creator as chat member
    await prisma.chatMembership.create({
      data: {
        chatGroupId: chatGroup.id,
        userId: session.user.id,
        role: "owner",
      },
    });

    // Send welcome system message
    await prisma.chatMessage.create({
      data: {
        chatGroupId: chatGroup.id,
        userId: session.user.id,
        content: `Welcome to ${name}! This is your hunt's group chat. Use this space to coordinate with fellow hunters, share updates, and plan your aurora adventure.`,
        messageType: "system",
      },
    });

    return NextResponse.json(hunt);
  } catch (error) {
    console.error("Error creating hunt:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create hunt";
    return NextResponse.json({ error: errorMessage, details: String(error) }, { status: 500 });
  }
}
