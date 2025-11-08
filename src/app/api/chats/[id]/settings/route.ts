import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/chats/[id]/settings
 *
 * Update chat settings (slow mode, etc.)
 * Only accessible by chat owners and moderators
 */
export async function PATCH(
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
    const { slowModeSeconds } = body;

    // Validate slow mode value
    if (slowModeSeconds !== undefined) {
      if (typeof slowModeSeconds !== 'number' || slowModeSeconds < 0) {
        return NextResponse.json(
          { error: 'Invalid slow mode value. Must be a non-negative number' },
          { status: 400 }
        );
      }
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
        { error: 'You do not have permission to update chat settings' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (slowModeSeconds !== undefined) {
      updateData.slowModeSeconds = slowModeSeconds === 0 ? null : slowModeSeconds;
    }

    // Update chat settings
    const updatedChat = await prisma.chatGroup.update({
      where: { id: chatId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        slowModeSeconds: updatedChat.slowModeSeconds,
      },
    });
  } catch (error) {
    console.error('Error updating chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}
