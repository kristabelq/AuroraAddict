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

    // Check if hunt exists and is a paid hunt
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      select: { id: true, isPaid: true, price: true, userId: true },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (!hunt.isPaid) {
      return NextResponse.json(
        { error: "This is not a paid hunt" },
        { status: 400 }
      );
    }

    // Check if user is a participant with pending payment
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

    if (participant.status !== "pending") {
      return NextResponse.json(
        { error: "Your participation status does not allow this action" },
        { status: 400 }
      );
    }

    if (participant.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Payment has already been marked or confirmed" },
        { status: 400 }
      );
    }

    // Update payment status to marked_paid
    await prisma.huntParticipant.update({
      where: { id: participant.id },
      data: {
        paymentStatus: "marked_paid",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment marked as complete! The organizer will confirm once they receive it.",
    });
  } catch (error) {
    console.error("Error marking payment:", error);
    return NextResponse.json(
      { error: "Failed to mark payment" },
      { status: 500 }
    );
  }
}
