import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Confirm payment for a participant
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId, userId: participantUserId } = await params;

    // Check if hunt exists and user is the creator
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the hunt organizer can confirm payments" },
        { status: 403 }
      );
    }

    // Find the participant
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: participantUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.status !== "pending" || participant.paymentStatus === "confirmed") {
      return NextResponse.json(
        { error: "Payment cannot be confirmed for this participant" },
        { status: 400 }
      );
    }

    // Update payment status to confirmed and participant status to confirmed
    const updatedParticipant = await prisma.huntParticipant.update({
      where: {
        huntId_userId: {
          huntId,
          userId: participantUserId,
        },
      },
      data: {
        paymentStatus: "confirmed",
        status: "confirmed",
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      participant: updatedParticipant,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

// Cancel/reject payment (participant stays pending or gets removed)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: huntId, userId: participantUserId } = await params;

    // Check if hunt exists and user is the creator
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the hunt organizer can cancel payments" },
        { status: 403 }
      );
    }

    // Find the participant
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId: participantUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.status !== "pending") {
      return NextResponse.json(
        { error: "Can only cancel pending payments" },
        { status: 400 }
      );
    }

    // Remove the participant and decrement counter
    await prisma.$transaction([
      prisma.huntParticipant.delete({
        where: {
          huntId_userId: {
            huntId,
            userId: participantUserId,
          },
        },
      }),
      prisma.user.update({
        where: { id: participantUserId },
        data: {
          cachedHuntsJoinedCount: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Payment cancelled and participant removed",
    });
  } catch (error) {
    console.error("Error cancelling payment:", error);
    return NextResponse.json(
      { error: "Failed to cancel payment" },
      { status: 500 }
    );
  }
}
