import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  promoteNextWaitlistedUser,
  updateHuntTransitionStatus,
} from "@/lib/huntEdgeCases";

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

    // Check if hunt exists
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // Check if user is the creator (can't leave own hunt)
    if (hunt.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot leave your own hunt. Delete it instead." },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant of this hunt" },
        { status: 400 }
      );
    }

    // Update participant status to cancelled (don't delete for audit trail)
    const operations: any[] = [
      prisma.huntParticipant.update({
        where: { id: participant.id },
        data: { status: "cancelled" },
      }),
    ];

    // If participant was confirmed, decrement the cached hunts joined count
    if (participant.status === "confirmed") {
      operations.push(
        prisma.user.update({
          where: { id: session.user.id },
          data: { cachedHuntsJoinedCount: { decrement: 1 } },
        })
      );
    }

    await prisma.$transaction(operations);

    // Edge Case: Trigger refund if user paid
    if (participant.paidAt && participant.stripePaymentIntentId) {
      // Log refund request - owner handles refunds at their discretion
      console.log(
        `Refund may be needed for participant ${participant.id} on hunt ${huntId}. User left after payment. Owner to handle refund.`
      );
    }

    // Edge Case: Update hunt transition status
    await updateHuntTransitionStatus(huntId);

    // Edge Case: If user was confirmed, try to promote next waitlisted user
    if (participant.status === "confirmed") {
      const promoted = await promoteNextWaitlistedUser(huntId);
      if (promoted) {
        console.log(
          `Promoted next waitlisted user for hunt ${huntId} after user left`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully left hunt",
    });
  } catch (error) {
    console.error("Error leaving hunt:", error);
    return NextResponse.json(
      { error: "Failed to leave hunt" },
      { status: 500 }
    );
  }
}
