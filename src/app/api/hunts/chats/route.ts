import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all hunts where user is either creator or participant
    const userHunts = await prisma.hunt.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            participants: {
              some: {
                userId: session.user.id,
                status: "confirmed",
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        coverImage: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // TODO: Once chat/messaging system is implemented in the database schema,
    // this endpoint should fetch actual chat messages and unread counts.
    // For now, we return the hunts with placeholder chat data.

    // Return chat previews for each hunt
    // When messaging system is added, this will include:
    // - lastMessage: { content, createdAt, user: { name, image } }
    // - unreadCount: number
    const chatPreviews = userHunts.map((hunt) => ({
      huntId: hunt.id,
      huntName: hunt.name,
      huntImage: hunt.coverImage,
      lastMessage: null, // Will be populated when messaging system is implemented
      unreadCount: 0, // Will be populated when messaging system is implemented
      updatedAt: new Date().toISOString(), // Will be the timestamp of last message
    }));

    return NextResponse.json(chatPreviews);
  } catch (error) {
    console.error("Error fetching hunt chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}
