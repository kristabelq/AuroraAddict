import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  handleRejection,
  updateHuntTransitionStatus,
  promoteNextWaitlistedUser,
} from "@/lib/huntEdgeCases";

// Approve a join request
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId, userId: requestUserId } = await params;

    // Check if hunt exists and user is the creator
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the hunt organizer can approve requests" },
        { status: 403 }
      );
    }

    // Find the pending participant
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: requestUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (participant.status !== "pending" && participant.status !== "waitlisted") {
      return NextResponse.json(
        { error: "Request is not pending or waitlisted" },
        { status: 400 }
      );
    }

    // For paid hunts, check if payment has been confirmed
    // If payment is still pending/marked_paid, don't auto-confirm - use payment confirmation flow instead
    if (hunt.isPaid && participant.paymentStatus !== "confirmed") {
      return NextResponse.json(
        { error: "This is a paid hunt. Please use the payment confirmation flow to confirm participants after they've marked payment." },
        { status: 400 }
      );
    }

    // Update status to confirmed and clear expiration
    const updatedParticipant = await prisma.huntParticipant.update({
      where: {
        huntId_userId: {
          huntId,
          userId: requestUserId,
        },
      },
      data: {
        status: "confirmed",
        paymentStatus: hunt.isPaid ? "confirmed" : null, // Ensure payment status is synced
        requestExpiresAt: null, // Clear expiration when confirmed
      },
    });

    // Edge Case: Update hunt transition status
    await updateHuntTransitionStatus(huntId);

    // Edge Case: Increment user's cached hunts joined count
    await prisma.user.update({
      where: { id: requestUserId },
      data: {
        cachedHuntsJoinedCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      message: "Request approved successfully",
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    );
  }
}

// Reject a join request
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId, userId: requestUserId } = await params;

    // Check if hunt exists and user is the creator
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the hunt organizer can reject requests" },
        { status: 403 }
      );
    }

    // Find the pending participant
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: requestUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (participant.status !== "pending" && participant.status !== "waitlisted") {
      return NextResponse.json(
        { error: "Request is not pending or waitlisted" },
        { status: 400 }
      );
    }

    // Edge Case: Handle rejection - increment counter and check if blocked
    const rejectionResult = await handleRejection(participant.id);

    // Edge Case: Update hunt transition status
    await updateHuntTransitionStatus(huntId);

    // Edge Case: Try to promote next waitlisted user since a spot freed up
    const promoted = await promoteNextWaitlistedUser(huntId);

    return NextResponse.json({
      success: true,
      message: rejectionResult.isBlocked
        ? `Request rejected. User has been rejected ${rejectionResult.rejectionCount} times and can no longer join this hunt.`
        : `Request rejected. User has been rejected ${rejectionResult.rejectionCount} time(s).`,
      rejectionCount: rejectionResult.rejectionCount,
      isBlocked: rejectionResult.isBlocked,
      promoted: promoted,
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json(
      { error: "Failed to reject request" },
      { status: 500 }
    );
  }
}
