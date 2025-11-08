import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/chats/[id]/leave
 *
 * Leave a chat group
 * Owners cannot leave - they must transfer ownership or delete the chat
 */
export async function POST(
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

    // Get chat and user's membership
    const chat = await prisma.chatGroup.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        name: true,
        groupType: true,
        ownerId: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    const membership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
    });

    // If no membership, check for pending join request
    if (!membership) {
      const joinRequest = await prisma.chatJoinRequest.findUnique({
        where: {
          chatGroupId_userId: {
            chatGroupId: chatId,
            userId: session.user.id,
          },
        },
      });

      if (joinRequest && joinRequest.status === 'pending') {
        // Delete the pending join request
        await prisma.chatJoinRequest.delete({
          where: { id: joinRequest.id },
        });

        return NextResponse.json({
          message: 'Join request cancelled',
          chatId,
        });
      }

      return NextResponse.json(
        { error: 'You are not a member of this chat' },
        { status: 400 }
      );
    }

    if (membership.role === 'owner') {
      return NextResponse.json(
        {
          error: 'Owners cannot leave their chat. Transfer ownership or delete the chat instead.',
          code: 'OWNER_CANNOT_LEAVE'
        },
        { status: 400 }
      );
    }

    const isPendingRequest = membership.status === 'pending';

    // Delete membership
    await prisma.chatMembership.delete({
      where: { id: membership.id },
    });

    // Only decrement member count and create system message if user was an active member
    if (!isPendingRequest) {
      // Decrement member count
      await prisma.chatGroup.update({
        where: { id: chatId },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });

      // Create system message
      await prisma.chatMessage.create({
        data: {
          chatGroupId: chatId,
          userId: session.user.id,
          content: `${session.user.name || 'A user'} left the chat`,
          messageType: 'system',
        },
      });
    }

    return NextResponse.json({
      message: isPendingRequest ? 'Request cancelled' : 'Successfully left the chat',
      chatId,
    });
  } catch (error) {
    console.error('Error leaving chat:', error);
    return NextResponse.json(
      { error: 'Failed to leave chat' },
      { status: 500 }
    );
  }
}
