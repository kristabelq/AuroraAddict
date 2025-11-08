import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// GET - Get or create DM chat with a user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId) {
      return NextResponse.json(
        { error: "userId parameter is required" },
        { status: 400 }
      );
    }

    // Can't DM yourself
    if (otherUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, username: true, image: true },
    });

    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find existing DM chat between these two users
    const existingChat = await prisma.chatGroup.findFirst({
      where: {
        groupType: "direct_message",
        members: {
          every: {
            userId: {
              in: [session.user.id, otherUserId],
            },
          },
        },
        memberCount: 2,
      },
      include: {
        members: {
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
        },
        messages: {
          take: 50,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            reactions: true,
          },
        },
      },
    });

    if (existingChat) {
      return NextResponse.json({ chatGroup: existingChat });
    }

    // Create new DM chat
    const chatGroup = await prisma.chatGroup.create({
      data: {
        name: `DM: ${session.user.name} & ${otherUser.name}`,
        groupType: "direct_message",
        visibility: "private",
        memberCount: 2,
      },
    });

    // Add both users as members
    await prisma.chatMembership.createMany({
      data: [
        {
          chatGroupId: chatGroup.id,
          userId: session.user.id,
          role: "member",
        },
        {
          chatGroupId: chatGroup.id,
          userId: otherUserId,
          role: "member",
        },
      ],
    });

    // Fetch the complete chat with members
    const completeChatGroup = await prisma.chatGroup.findUnique({
      where: { id: chatGroup.id },
      include: {
        members: {
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
        },
        messages: true,
      },
    });

    return NextResponse.json({ chatGroup: completeChatGroup }, { status: 201 });
  } catch (error) {
    console.error("Error getting/creating DM:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET all DMs for current user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dmChats = await prisma.chatGroup.findMany({
      where: {
        groupType: "direct_message",
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
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
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ dmChats });
  } catch (error) {
    console.error("Error fetching DMs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
