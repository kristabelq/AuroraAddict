import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/chats/[id]/requests/[requestId]/reject
 *
 * Reject a join request for a private chat
 * Only the chat owner can reject requests
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
        { error: 'Only the chat owner can reject requests' },
        { status: 403 }
      );
    }

    // Get join request
    const joinRequest = await prisma.chatJoinRequest.findUnique({
      where: { id: requestId },
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

    // Get optional rejection message from request body
    const body = await request.json().catch(() => ({}));
    const responseMessage = body.message || null;

    // Mark request as rejected
    await prisma.chatJoinRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        responseMessage,
      },
    });

    return NextResponse.json({
      message: 'Join request rejected',
      userId: joinRequest.userId,
    });
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return NextResponse.json(
      { error: 'Failed to reject join request' },
      { status: 500 }
    );
  }
}
