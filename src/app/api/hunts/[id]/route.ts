import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { toZonedTime } from "date-fns-tz";
import {
  canChangeHuntSettings,
  canCancelHunt,
  updateHuntTransitionStatus,
} from "@/lib/huntEdgeCases";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId } = await params;

    // Check if hunt exists and user is creator
    const existingHunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      select: {
        userId: true,
        isPaid: true,
        isPublic: true,
        _count: {
          select: {
            participants: {
              where: {
                status: "confirmed"
              }
            }
          }
        }
      },
    });

    if (!existingHunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (existingHunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the creator can edit this hunt" },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    // Extract form fields
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
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

    // Edge Case: Check if settings can be changed
    const settingsChangeError = await canChangeHuntSettings(huntId, {
      isPublic,
      isPaid,
    });

    if (settingsChangeError) {
      return NextResponse.json(
        { error: settingsChangeError },
        { status: 400 }
      );
    }

    // Convert local datetime to UTC using IANA timezone
    // The datetime-local input gives us a string like "2025-10-13T14:00"
    // We interpret this as the time in the hunt's IANA timezone and convert to UTC
    const parseLocalTime = (dateTimeStr: string, tz: string): Date => {
      // Add ":00" seconds if not present (datetime-local might not include seconds)
      const normalizedStr = dateTimeStr.length === 16 ? `${dateTimeStr}:00` : dateTimeStr;

      // Parse the datetime string in the hunt's timezone
      return toZonedTime(normalizedStr, tz);
    };

    // Convert dates and validate
    const startDate = startDateLocal ? parseLocalTime(startDateLocal, timezone) : undefined;
    const endDate = endDateLocal ? parseLocalTime(endDateLocal, timezone) : undefined;

    if (startDate && endDate) {
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    let coverImageUrl: string | undefined = undefined;

    // Process cover image if provided
    if (coverImageFile && coverImageFile.size > 0) {
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

    // Update hunt
    const updatedHunt = await prisma.hunt.update({
      where: { id: huntId },
      data: {
        name,
        description,
        ...(coverImageUrl !== undefined && { coverImage: coverImageUrl }),
        startDate: startDate,
        endDate: endDate,
        timezone: timezone || "UTC",
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        hideLocation,
        isPublic,
        hideFromPublic,
        isPaid,
        price: price ? parseFloat(price) : null,
        cancellationPolicy: cancellationPolicy || null,
        capacity: capacity ? parseInt(capacity) : null,
        allowWaitlist,
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

    // Edge Case: Auto-accept pending users when private hunt becomes public
    if (!existingHunt.isPublic && isPublic) {
      // Convert private to public - auto-accept all pending requests
      const pendingParticipants = await prisma.huntParticipant.findMany({
        where: {
          huntId,
          status: "pending",
        },
        include: {
          user: {
            select: { id: true },
          },
        },
      });

      if (pendingParticipants.length > 0) {
        // Check capacity
        const capacity = updatedHunt.capacity || Infinity;
        const currentConfirmed = existingHunt._count.participants;
        const availableSpots = capacity - currentConfirmed;

        // Auto-accept up to available capacity
        const toAccept = pendingParticipants.slice(0, availableSpots);
        const toWaitlist = pendingParticipants.slice(availableSpots);

        // Accept the ones that fit
        if (toAccept.length > 0) {
          await prisma.$transaction([
            prisma.huntParticipant.updateMany({
              where: {
                id: {
                  in: toAccept.map((p) => p.id),
                },
              },
              data: {
                status: "confirmed",
                requestExpiresAt: null,
              },
            }),
            // Increment cached hunts joined count for each accepted user
            ...toAccept.map((p) =>
              prisma.user.update({
                where: { id: p.userId },
                data: {
                  cachedHuntsJoinedCount: { increment: 1 },
                },
              })
            ),
          ]);
        }

        // Move overflow to waitlist if allowed
        if (toWaitlist.length > 0 && allowWaitlist) {
          await prisma.huntParticipant.updateMany({
            where: {
              id: {
                in: toWaitlist.map((p) => p.id),
              },
            },
            data: {
              status: "waitlisted",
            },
          });
        }

        console.log(
          `Hunt ${huntId} changed to public: ${toAccept.length} users auto-accepted, ${toWaitlist.length} moved to waitlist`
        );
      }

      // Update transition status
      await updateHuntTransitionStatus(huntId);
    }

    return NextResponse.json({
      success: true,
      hunt: updatedHunt,
      message: "Hunt updated successfully",
    });
  } catch (error) {
    console.error("Error updating hunt:", error);
    return NextResponse.json(
      { error: "Failed to update hunt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId } = await params;

    // Check if hunt exists and user is creator
    const existingHunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      select: { userId: true },
    });

    if (!existingHunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (existingHunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the creator can delete this hunt" },
        { status: 403 }
      );
    }

    // Edge Case: Check if hunt can be cancelled
    const cancelError = await canCancelHunt(huntId);
    if (cancelError) {
      return NextResponse.json({ error: cancelError }, { status: 400 });
    }

    // Delete hunt (this will cascade delete participants due to onDelete: Cascade)
    await prisma.hunt.delete({
      where: { id: huntId },
    });

    return NextResponse.json({
      success: true,
      message: "Hunt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hunt:", error);
    return NextResponse.json(
      { error: "Failed to delete hunt" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  try {
    const { id: huntId } = await params;

    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        participants: {
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
          orderBy: {
            joinedAt: "asc",
          },
        },
        chatGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // Note: Private hunts are now visible to all users
    // They can see the details but only invited users can join

    // Check if current user is a confirmed participant
    const isUserParticipant = session?.user?.id
      ? hunt.participants.some((p) => p.userId === session.user.id && p.status === "confirmed")
      : false;

    return NextResponse.json({
      ...hunt,
      startDate: hunt.startDate.toISOString(),
      endDate: hunt.endDate.toISOString(),
      isUserParticipant,
      isCreator: hunt.userId === session?.user?.id,
    });
  } catch (error) {
    console.error("Error fetching hunt:", error);
    return NextResponse.json(
      { error: "Failed to fetch hunt" },
      { status: 500 }
    );
  }
}
