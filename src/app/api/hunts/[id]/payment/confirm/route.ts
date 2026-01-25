import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if hunt exists and user is the creator
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      select: { id: true, isPaid: true, userId: true },
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

    if (!hunt.isPaid) {
      return NextResponse.json(
        { error: "This is not a paid hunt" },
        { status: 400 }
      );
    }

    // Check if participant exists with marked_paid status
    const participant = await prisma.huntParticipant.findUnique({
      where: {
        huntId_userId: {
          huntId,
          userId,
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
        { error: "Participant status does not allow this action" },
        { status: 400 }
      );
    }

    // Verify payment has been marked as paid by the participant
    if (participant.paymentStatus !== "marked_paid") {
      return NextResponse.json(
        { error: "Participant has not marked their payment as made yet" },
        { status: 400 }
      );
    }

    // Update participant to confirmed
    await prisma.$transaction([
      prisma.huntParticipant.update({
        where: { id: participant.id },
        data: {
          status: "confirmed",
          paymentStatus: "confirmed",
        },
      }),
      // Increment user's hunt count
      prisma.user.update({
        where: { id: userId },
        data: {
          cachedHuntsJoinedCount: { increment: 1 },
        },
      }),
    ]);

    // Add user to hunt chat if exists
    const chatGroup = await prisma.chatGroup.findFirst({
      where: { huntId },
    });

    if (chatGroup) {
      await prisma.chatMembership.upsert({
        where: {
          chatGroupId_userId: {
            chatGroupId: chatGroup.id,
            userId,
          },
        },
        update: { status: "active" },
        create: {
          chatGroupId: chatGroup.id,
          userId,
          role: "member",
        },
      });

      await prisma.chatGroup.update({
        where: { id: chatGroup.id },
        data: { memberCount: { increment: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmed! Participant is now confirmed for the hunt.",
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
