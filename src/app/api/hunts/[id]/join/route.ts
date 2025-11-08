import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isUserBlockedFromJoining,
  calculateExpirationDate,
  getNextWaitlistPosition,
  updateHuntTransitionStatus,
} from "@/lib/huntEdgeCases";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId } = await params;

    // Check if hunt exists
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        _count: {
          select: {
            participants: {
              where: {
                status: "confirmed"
              }
            }
          },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // Check if hunt has already ended (only allow creator to add participants to past hunts)
    const now = new Date();
    const huntEndDate = new Date(hunt.endDate);
    if (now > huntEndDate && hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "This hunt has already ended" },
        { status: 400 }
      );
    }

    // Edge Case: Check if user is blocked from joining (3 rejections)
    const isBlocked = await isUserBlockedFromJoining(huntId, session.user.id);
    if (isBlocked) {
      return NextResponse.json(
        {
          error:
            "You have been rejected from this hunt too many times and cannot join again.",
        },
        { status: 403 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: session.user.id,
        },
      },
    });

    if (existingParticipant && existingParticipant.status !== "cancelled") {
      return NextResponse.json(
        { error: "Already joined this hunt" },
        { status: 400 }
      );
    }

    // Check capacity - if at capacity and waitlist is not allowed, reject
    const isAtCapacity = hunt.capacity && hunt._count.participants >= hunt.capacity;
    if (isAtCapacity && !hunt.allowWaitlist) {
      return NextResponse.json(
        { error: "Hunt is at full capacity" },
        { status: 400 }
      );
    }

    // For private hunts (isPublic: false), create with "pending" or "waitlisted" status
    if (!hunt.isPublic) {
      const status = isAtCapacity ? "waitlisted" : "pending";

      // Edge Case: Calculate expiration date (7 days or 1 second before hunt starts)
      const expirationDate = calculateExpirationDate(hunt.startDate);

      // Edge Case: Get waitlist position if being waitlisted
      const waitlistPosition = isAtCapacity
        ? await getNextWaitlistPosition(huntId)
        : null;

      const participantData = existingParticipant
        ? await prisma.huntParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              status,
              paymentStatus: hunt.isPaid ? "pending" : null,
              requestExpiresAt: expirationDate,
              waitlistPosition,
              rejectionCount: 0, // Reset on rejoin
            },
          })
        : await prisma.huntParticipant.create({
            data: {
              huntId,
              userId: session.user.id,
              status,
              paymentStatus: hunt.isPaid ? "pending" : null,
              requestExpiresAt: expirationDate,
              waitlistPosition,
            },
          });

      // Edge Case: Update hunt transition status
      await updateHuntTransitionStatus(huntId);

      return NextResponse.json({
        success: true,
        participant: participantData,
        requiresApproval: !isAtCapacity,
        isWaitlisted: isAtCapacity,
        expiresAt: expirationDate.toISOString(),
        waitlistPosition,
        message: isAtCapacity
          ? `Added to waitlist (position #${waitlistPosition})! You'll be notified if a spot opens up. This will expire on ${expirationDate.toLocaleString()}.`
          : `Request sent! Waiting for organizer approval. This request will expire on ${expirationDate.toLocaleString()} if not approved.`,
      });
    }

    // For paid hunts, require payment checkout or add to waitlist if at capacity
    if (hunt.isPaid && hunt.price) {
      const status = isAtCapacity ? "waitlisted" : "pending";

      // Edge Case: Calculate expiration date (7 days or 1 second before hunt starts)
      const expirationDate = calculateExpirationDate(hunt.startDate);

      // Edge Case: Get waitlist position if being waitlisted
      const waitlistPosition = isAtCapacity
        ? await getNextWaitlistPosition(huntId)
        : null;

      const participantData = existingParticipant
        ? await prisma.huntParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              status,
              paymentStatus: "pending",
              requestExpiresAt: expirationDate,
              waitlistPosition,
              rejectionCount: 0, // Reset on rejoin
            },
          })
        : await prisma.huntParticipant.create({
            data: {
              huntId,
              userId: session.user.id,
              status,
              paymentStatus: "pending",
              requestExpiresAt: expirationDate,
              waitlistPosition,
            },
          });

      // Edge Case: Update hunt transition status
      await updateHuntTransitionStatus(huntId);

      return NextResponse.json({
        success: true,
        participant: participantData,
        requiresPayment: !isAtCapacity,
        isWaitlisted: isAtCapacity,
        expiresAt: expirationDate.toISOString(),
        waitlistPosition,
        message: isAtCapacity
          ? `Added to waitlist (position #${waitlistPosition})! You'll be notified if a spot opens up. This will expire on ${expirationDate.toLocaleString()}.`
          : `Proceed to payment to confirm your spot. Payment must be completed by ${expirationDate.toLocaleString()} or your reservation will be cancelled.`,
      });
    }

    // For free public hunts, confirm immediately or add to waitlist if at capacity
    const status = isAtCapacity ? "waitlisted" : "confirmed";

    // Edge Case: Calculate expiration date for waitlist
    const expirationDate = isAtCapacity
      ? calculateExpirationDate(hunt.startDate)
      : null;

    // Edge Case: Get waitlist position if being waitlisted
    const waitlistPosition = isAtCapacity
      ? await getNextWaitlistPosition(huntId)
      : null;

    // Only increment cached count if status is confirmed (not waitlisted)
    const operations: any[] = [
      existingParticipant
        ? prisma.huntParticipant.update({
            where: { id: existingParticipant.id },
            data: {
              status,
              paymentStatus: null,
              requestExpiresAt: expirationDate,
              waitlistPosition,
              rejectionCount: 0, // Reset on rejoin
            },
          })
        : prisma.huntParticipant.create({
            data: {
              huntId,
              userId: session.user.id,
              status,
              paymentStatus: null,
              requestExpiresAt: expirationDate,
              waitlistPosition,
            },
          }),
    ];

    if (status === "confirmed") {
      operations.push(
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            cachedHuntsJoinedCount: { increment: 1 },
          },
        })
      );
    }

    const [participant] = await prisma.$transaction(operations);

    // Add confirmed participant to hunt chat
    if (status === "confirmed") {
      // Find the hunt's chat group
      const chatGroup = await prisma.chatGroup.findFirst({
        where: { huntId },
      });

      if (chatGroup) {
        // Add user as chat member
        await prisma.chatMembership.upsert({
          where: {
            chatGroupId_userId: {
              chatGroupId: chatGroup.id,
              userId: session.user.id,
            },
          },
          update: {
            status: "active",
          },
          create: {
            chatGroupId: chatGroup.id,
            userId: session.user.id,
            role: "member",
          },
        });

        // Update member count
        await prisma.chatGroup.update({
          where: { id: chatGroup.id },
          data: { memberCount: { increment: 1 } },
        });
      }
    }

    // Edge Case: Update hunt transition status (waitlisted = in transition)
    if (isAtCapacity) {
      await updateHuntTransitionStatus(huntId);
    }

    return NextResponse.json({
      success: true,
      participant,
      requiresPayment: false,
      isWaitlisted: isAtCapacity,
      expiresAt: expirationDate?.toISOString(),
      waitlistPosition,
      message: isAtCapacity
        ? `Added to waitlist (position #${waitlistPosition})! You'll be notified if a spot opens up. This will expire on ${expirationDate?.toLocaleString()}.`
        : "Successfully joined hunt",
    });
  } catch (error) {
    console.error("Error joining hunt:", error);
    return NextResponse.json(
      { error: "Failed to join hunt" },
      { status: 500 }
    );
  }
}
