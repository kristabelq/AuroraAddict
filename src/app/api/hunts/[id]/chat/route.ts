import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get hunt chat details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: huntId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a participant or organizer of the hunt
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        participants: {
          where: { userId: session.user.id, status: "confirmed" },
        },
        chatGroup: {
          include: {
            members: true,
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    // User must be organizer or confirmed participant
    const isOrganizer = hunt.userId === session.user.id;
    const isParticipant = hunt.participants.length > 0;

    if (!isOrganizer && !isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      chatGroup: hunt.chatGroup,
      isOrganizer,
    });
  } catch (error) {
    console.error("Error fetching hunt chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create hunt chat
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: huntId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the hunt organizer
    const hunt = await prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        chatGroup: true,
        participants: {
          where: { status: "confirmed" },
          include: { user: true },
        },
      },
    });

    if (!hunt) {
      return NextResponse.json({ error: "Hunt not found" }, { status: 404 });
    }

    if (hunt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only hunt organizer can create chat" },
        { status: 403 }
      );
    }

    // Check if chat already exists
    if (hunt.chatGroup) {
      return NextResponse.json(
        { error: "Chat already exists for this hunt", chatGroup: hunt.chatGroup },
        { status: 400 }
      );
    }

    // Create chat group
    const chatGroup = await prisma.chatGroup.create({
      data: {
        name: `${hunt.name} - Hunt Chat`,
        description: `Group chat for participants of ${hunt.name}`,
        groupType: "hunt",
        visibility: "private",
        huntId: huntId,
        ownerId: session.user.id,
        memberCount: 1,
      },
    });

    // Add organizer as owner
    await prisma.chatMembership.create({
      data: {
        chatGroupId: chatGroup.id,
        userId: session.user.id,
        role: "owner",
      },
    });

    // Add all confirmed participants as members
    for (const participant of hunt.participants) {
      await prisma.chatMembership.create({
        data: {
          chatGroupId: chatGroup.id,
          userId: participant.userId,
          role: "member",
        },
      });
    }

    // Update member count
    await prisma.chatGroup.update({
      where: { id: chatGroup.id },
      data: { memberCount: 1 + hunt.participants.length },
    });

    // Send system welcome message
    await prisma.chatMessage.create({
      data: {
        chatGroupId: chatGroup.id,
        userId: session.user.id,
        content: `Welcome to the ${hunt.name} chat! Use this space to coordinate with fellow hunters.`,
        messageType: "system",
      },
    });

    return NextResponse.json({ chatGroup }, { status: 201 });
  } catch (error) {
    console.error("Error creating hunt chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
