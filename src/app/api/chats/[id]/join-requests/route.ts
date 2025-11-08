import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chats/[id]/join-requests
 *
 * Fetch pending join requests for a private chat
 * Only accessible by chat owners and moderators
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

    // Check if user is owner or moderator
    const membership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || (membership.role !== 'owner' && membership.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'You do not have permission to view join requests' },
        { status: 403 }
      );
    }

    // Fetch pending join requests
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
            userType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      requests: requests.map((req) => ({
        id: req.id,
        message: req.message,
        createdAt: req.createdAt,
        user: req.user,
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
