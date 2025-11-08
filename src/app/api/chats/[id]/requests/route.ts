import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chats/[id]/requests
 *
 * Get all pending join requests for a chat
 * Only the chat owner can view requests
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;

    // Get chat details
    const chat = await prisma.chatGroup.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (chat.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the chat owner can view join requests' },
        { status: 403 }
      );
    }

    // Get all pending join requests
    const requests = await prisma.chatJoinRequest.findMany({
      where: {
        chatGroupId: chatId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      requests: requests.map(req => ({
        id: req.id,
        user: req.user,
        message: req.message,
        createdAt: req.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 }
    );
  }
}
