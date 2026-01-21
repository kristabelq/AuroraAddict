import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/chats/[id]/messages/[messageId]
 *
 * Manage chat messages: pin, unpin, delete
 * Only accessible by chat owners and moderators (and message authors for delete)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId, messageId } = await params;
    const body = await request.json();
    const { action } = body; // 'pin', 'unpin', 'delete'

    const validActions = ['pin', 'unpin', 'delete'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user's membership
    const membership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this chat' },
        { status: 403 }
      );
    }

    // Get the message
    const message = await prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.chatGroupId !== chatId) {
      return NextResponse.json(
        { error: 'Message does not belong to this chat' },
        { status: 400 }
      );
    }

    if (message.isDeleted) {
      return NextResponse.json(
        { error: 'Message has already been deleted' },
        { status: 400 }
      );
    }

    // Check permissions based on action
    const canModerate = membership.role === 'owner' || membership.role === 'moderator';
    const isAuthor = message.userId === session.user.id;

    if (action === 'delete') {
      // Authors can delete their own messages, moderators can delete any message
      if (!isAuthor && !canModerate) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this message' },
          { status: 403 }
        );
      }

      // Soft delete the message
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedBy: session.user.id,
        },
      });

      return NextResponse.json({ message: 'Message deleted' });
    }

    // Pin/unpin requires moderator permissions
    if (action === 'pin' || action === 'unpin') {
      if (!canModerate) {
        return NextResponse.json(
          { error: 'You do not have permission to pin messages' },
          { status: 403 }
        );
      }

      if (action === 'pin') {
        if (message.isPinned) {
          return NextResponse.json(
            { error: 'Message is already pinned' },
            { status: 400 }
          );
        }

        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            isPinned: true,
          },
        });

        return NextResponse.json({ message: 'Message pinned' });
      } else {
        // unpin
        if (!message.isPinned) {
          return NextResponse.json(
            { error: 'Message is not pinned' },
            { status: 400 }
          );
        }

        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            isPinned: false,
          },
        });

        return NextResponse.json({ message: 'Message unpinned' });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing message:', error);
    return NextResponse.json(
      { error: 'Failed to manage message' },
      { status: 500 }
    );
  }
}
