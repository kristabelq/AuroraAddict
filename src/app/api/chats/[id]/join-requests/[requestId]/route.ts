import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/chats/[id]/join-requests/[requestId]
 *
 * Approve or reject a join request
 * Only accessible by chat owners and moderators
 */
export async function PATCH(
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
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

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
        { error: 'You do not have permission to manage join requests' },
        { status: 403 }
      );
    }

    // Get the join request
    const joinRequest = await prisma.chatJoinRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        chatGroup: true,
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
        { error: 'Join request has already been reviewed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Check if chat is at capacity
      if (
        joinRequest.chatGroup.memberLimit &&
        joinRequest.chatGroup.memberCount >= joinRequest.chatGroup.memberLimit
      ) {
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
        // Update request status but don't add again
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

      // Approve: Create membership and update request
      await prisma.$transaction([
        // Create membership
        prisma.chatMembership.create({
          data: {
            chatGroupId: chatId,
            userId: joinRequest.userId,
            role: 'member',
            status: 'active',
          },
        }),
        // Update request status
        prisma.chatJoinRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
          },
        }),
        // Increment member count
        prisma.chatGroup.update({
          where: { id: chatId },
          data: {
            memberCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        message: 'Join request approved',
      });
    } else {
      // Reject: Update request status
      await prisma.chatJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Join request rejected',
      });
    }
  } catch (error) {
    console.error('Error processing join request:', error);
    return NextResponse.json(
      { error: 'Failed to process join request' },
      { status: 500 }
    );
  }
}
