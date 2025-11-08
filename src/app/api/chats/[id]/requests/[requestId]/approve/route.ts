import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/chats/[id]/requests/[requestId]/approve
 *
 * Approve a join request for a private chat
 * Only the chat owner can approve requests
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId, requestId } = await params;

    // Get chat details
    const chat = await prisma.chatGroup.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        memberLimit: true,
        memberCount: true,
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
        { error: 'Only the chat owner can approve requests' },
        { status: 403 }
      );
    }

    // Get join request
    const joinRequest = await prisma.chatJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    if (joinRequest.chatGroupId !== chatId) {
      return NextResponse.json(
        { error: 'Join request does not belong to this chat' },
        { status: 400 }
      );
    }

    if (joinRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been reviewed' },
        { status: 400 }
      );
    }

    // Check member limit
    if (chat.memberLimit && chat.memberCount >= chat.memberLimit) {
      return NextResponse.json(
        { error: 'Chat is at full capacity' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: joinRequest.userId,
        },
      },
    });

    if (existingMembership) {
      // Mark request as approved but don't create duplicate membership
      await prisma.chatJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'User is already a member',
      });
    }

    // Create membership and update request in a transaction
    await prisma.$transaction(async (tx) => {
      // Create membership
      await tx.chatMembership.create({
        data: {
          chatGroupId: chatId,
          userId: joinRequest.userId,
          role: 'member',
          status: 'active',
        },
      });

      // Increment member count
      await tx.chatGroup.update({
        where: { id: chatId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      });

      // Mark request as approved
      await tx.chatJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      // Create system message
      await tx.chatMessage.create({
        data: {
          chatGroupId: chatId,
          userId: joinRequest.userId,
          content: `${joinRequest.user.name || 'A user'} joined the chat`,
          messageType: 'system',
        },
      });
    });

    return NextResponse.json({
      message: 'Join request approved successfully',
      userId: joinRequest.userId,
    });
  } catch (error) {
    console.error('Error approving join request:', error);
    return NextResponse.json(
      { error: 'Failed to approve join request' },
      { status: 500 }
    );
  }
}
