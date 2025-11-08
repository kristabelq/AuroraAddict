import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/chats/[id]/members/[memberId]
 *
 * Manage chat members: mute, unmute, ban, kick, promote, demote
 * Only accessible by chat owners and moderators
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId, memberId } = await params;
    const body = await request.json();
    const { action } = body; // 'mute', 'unmute', 'ban', 'kick', 'promote', 'demote'

    const validActions = ['mute', 'unmute', 'ban', 'kick', 'promote', 'demote'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get moderator's membership
    const moderatorMembership = await prisma.chatMembership.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId: chatId,
          userId: session.user.id,
        },
      },
    });

    if (!moderatorMembership || (moderatorMembership.role !== 'owner' && moderatorMembership.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'You do not have permission to manage members' },
        { status: 403 }
      );
    }

    // Get target member
    const targetMembership = await prisma.chatMembership.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMembership.chatGroupId !== chatId) {
      return NextResponse.json(
        { error: 'Member does not belong to this chat' },
        { status: 400 }
      );
    }

    // Cannot modify owner
    if (targetMembership.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify the chat owner' },
        { status: 403 }
      );
    }

    // Cannot modify yourself
    if (targetMembership.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own membership' },
        { status: 403 }
      );
    }

    // Only owner can promote/demote
    if ((action === 'promote' || action === 'demote') && moderatorMembership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only the chat owner can promote or demote members' },
        { status: 403 }
      );
    }

    // Perform the action
    switch (action) {
      case 'mute':
        await prisma.chatMembership.update({
          where: { id: memberId },
          data: {
            status: 'muted',
            mutedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            mutedReason: `Muted by moderator`,
          },
        });
        return NextResponse.json({ message: 'Member muted for 24 hours' });

      case 'unmute':
        await prisma.chatMembership.update({
          where: { id: memberId },
          data: {
            status: 'active',
            mutedUntil: null,
            mutedReason: null,
          },
        });
        return NextResponse.json({ message: 'Member unmuted' });

      case 'ban':
        await prisma.$transaction([
          // Update membership to banned
          prisma.chatMembership.update({
            where: { id: memberId },
            data: {
              status: 'banned',
            },
          }),
          // Decrement member count
          prisma.chatGroup.update({
            where: { id: chatId },
            data: {
              memberCount: {
                decrement: 1,
              },
            },
          }),
        ]);
        return NextResponse.json({ message: 'Member banned' });

      case 'kick':
        await prisma.$transaction([
          // Delete membership
          prisma.chatMembership.delete({
            where: { id: memberId },
          }),
          // Decrement member count
          prisma.chatGroup.update({
            where: { id: chatId },
            data: {
              memberCount: {
                decrement: 1,
              },
            },
          }),
        ]);
        return NextResponse.json({ message: 'Member removed' });

      case 'promote':
        if (targetMembership.role === 'moderator') {
          return NextResponse.json(
            { error: 'Member is already a moderator' },
            { status: 400 }
          );
        }
        await prisma.chatMembership.update({
          where: { id: memberId },
          data: {
            role: 'moderator',
          },
        });
        return NextResponse.json({ message: 'Member promoted to moderator' });

      case 'demote':
        if (targetMembership.role !== 'moderator') {
          return NextResponse.json(
            { error: 'Member is not a moderator' },
            { status: 400 }
          );
        }
        await prisma.chatMembership.update({
          where: { id: memberId },
          data: {
            role: 'member',
          },
        });
        return NextResponse.json({ message: 'Member demoted to member' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing member:', error);
    return NextResponse.json(
      { error: 'Failed to manage member' },
      { status: 500 }
    );
  }
}
