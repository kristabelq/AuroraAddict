import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { use } from 'react';

/**
 * POST /api/chats/[id]/join
 *
 * Join a public chat or request to join a private chat
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

    // Get chat details
    const chat = await prisma.chatGroup.findUnique({
      where: { id: chatId },
      select: {
        id: true,
        name: true,
        visibility: true,
        requireApproval: true,
        memberLimit: true,
        memberCount: true,
        isActive: true,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    if (!chat.isActive) {
      return NextResponse.json(
        { error: 'This chat is no longer active' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'banned') {
        return NextResponse.json(
          { error: 'You are banned from this chat' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'You are already a member of this chat', membership: existingMembership },
        { status: 200 }
      );
    }

    // Check member limit
    if (chat.memberLimit && chat.memberCount >= chat.memberLimit) {
      return NextResponse.json(
        { error: 'This chat is at full capacity' },
        { status: 400 }
      );
    }

    // Private chats require approval
    if (chat.visibility === 'private' || chat.requireApproval) {
      // Check if there's an existing join request
      const existingRequest = await prisma.chatJoinRequest.findUnique({
        where: {
          chatGroupId_userId: {
            chatGroupId: chatId,
            userId: session.user.id,
          },
        },
      });

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          return NextResponse.json(
            { error: 'You already have a pending join request' },
            { status: 400 }
          );
        }

        if (existingRequest.status === 'rejected') {
          // Allow resubmission but update the existing request
          await prisma.chatJoinRequest.update({
            where: { id: existingRequest.id },
            data: {
              status: 'pending',
              reviewedAt: null,
              reviewedBy: null,
              responseMessage: null,
            },
          });

          return NextResponse.json({
            message: 'Join request resubmitted successfully',
            requiresApproval: true,
          });
        }
      } else {
        // Create new join request
        const body = await request.json().catch(() => ({}));
        const message = body.message || null;

        await prisma.chatJoinRequest.create({
          data: {
            chatGroupId: chatId,
            userId: session.user.id,
            message,
            status: 'pending',
          },
        });
      }

      return NextResponse.json({
        message: 'Join request submitted successfully. Waiting for approval.',
        requiresApproval: true,
      });
    }

    // Public chat - join immediately
    const membership = await prisma.chatMembership.create({
      data: {
        chatGroupId: chatId,
        userId: session.user.id,
        role: 'member',
        status: 'active',
      },
    });

    // Increment member count
    await prisma.chatGroup.update({
      where: { id: chatId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    // Create system message
    await prisma.chatMessage.create({
      data: {
        chatGroupId: chatId,
        userId: session.user.id,
        content: `${session.user.name || 'A user'} joined the chat`,
        messageType: 'system',
      },
    });

    return NextResponse.json({
      message: 'Successfully joined the chat',
      membership,
    });
  } catch (error) {
    console.error('Error joining chat:', error);
    return NextResponse.json(
      { error: 'Failed to join chat' },
      { status: 500 }
    );
  }
}
