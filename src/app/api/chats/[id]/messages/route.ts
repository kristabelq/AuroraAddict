import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { filterProfanity } from '@/lib/chat/profanityFilter';

/**
 * GET /api/chats/[id]/messages
 *
 * Fetch messages for a chat room
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

    // Check if user is a member
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

    if (membership.status === 'banned') {
      return NextResponse.json(
        { error: 'You have been banned from this chat' },
        { status: 403 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Message ID to fetch messages before

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatGroupId: chatId,
        isDeleted: false,
        ...(before && {
          id: {
            lt: before,
          },
        }),
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
        createdAt: 'desc',
      },
      take: limit,
    });

    // Reverse to get chronological order
    messages.reverse();

    // Update last read timestamp
    await prisma.chatMembership.update({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0, // Reset unread count
      },
    });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.contentFiltered || msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        isEdited: msg.isEdited,
        isPinned: msg.isPinned,
        user: msg.user,
      })),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats/[id]/messages
 *
 * Send a new message to a chat room
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
    const body = await request.json();
    const { content, messageType = 'text' } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Check if user is a member
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

    if (membership.status === 'banned') {
      return NextResponse.json(
        { error: 'You have been banned from this chat' },
        { status: 403 }
      );
    }

    if (membership.status === 'muted') {
      if (membership.mutedUntil && membership.mutedUntil > new Date()) {
        return NextResponse.json(
          { error: 'You are muted in this chat' },
          { status: 403 }
        );
      } else {
        // Unmute if mute period has expired
        await prisma.chatMembership.update({
          where: {
            chatGroupId_userId: {
              chatGroupId: chatId,
              userId: session.user.id,
            },
          },
          data: {
            status: 'active',
            mutedUntil: null,
            mutedReason: null,
          },
        });
      }
    }

    // Filter profanity
    const { cleanText, hasProfanity } = filterProfanity(content);

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        chatGroupId: chatId,
        userId: session.user.id,
        content: content,
        contentFiltered: hasProfanity ? cleanText : null,
        messageType: messageType,
        hasProfanity: hasProfanity,
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
    });

    // Update chat group message count
    await prisma.chatGroup.update({
      where: { id: chatId },
      data: {
        messageCount: {
          increment: 1,
        },
      },
    });

    // Update unread count for other members
    await prisma.chatMembership.updateMany({
      where: {
        chatGroupId: chatId,
        userId: {
          not: session.user.id,
        },
        status: 'active',
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.contentFiltered || message.content,
        messageType: message.messageType,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        isPinned: message.isPinned,
        user: message.user,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
