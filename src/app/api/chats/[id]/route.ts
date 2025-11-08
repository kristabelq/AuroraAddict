import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chats/[id]
 *
 * Get detailed information about a specific chat
 * Includes members, settings, and user's access status
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

    // Get chat with full details
    const chat = await prisma.chatGroup.findUnique({
      where: { id: chatId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            businessName: true,
            businessCategory: true,
            verificationStatus: true,
          },
        },
        members: {
          where: {
            status: 'active',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                userType: true,
                businessName: true,
              },
            },
          },
          orderBy: [
            { role: 'asc' }, // Owners first, then moderators, then members
            { joinedAt: 'asc' },
          ],
        },
        messages: {
          where: {
            isPinned: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        linkedChat: {
          select: {
            id: true,
            name: true,
            visibility: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Get user's membership
    const membership = chat.members.find((m) => m.userId === session.user.id);

    // Get user's join request status (for private chats)
    let joinRequest = null;
    if (!membership) {
      joinRequest = await prisma.chatJoinRequest.findUnique({
        where: {
          chatGroupId_userId: {
            chatGroupId: chatId,
            userId: session.user.id,
          },
        },
        select: {
          id: true,
          status: true,
          message: true,
          responseMessage: true,
          createdAt: true,
          reviewedAt: true,
        },
      });
    }

    // Check if user can join (for non-members)
    const canJoin = !membership && chat.isActive &&
      (!chat.memberLimit || chat.memberCount < chat.memberLimit) &&
      (!joinRequest || joinRequest.status === 'rejected');

    // Format members list
    const formattedMembers = chat.members.map((member) => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    }));

    // Format response
    const response = {
      // Basic info
      id: chat.id,
      name: chat.name,
      description: chat.description,
      groupType: chat.groupType,
      visibility: chat.visibility,
      isActive: chat.isActive,

      // Location
      areaName: chat.areaName,
      countryCode: chat.countryCode,
      countryName: chat.countryName,
      latitude: chat.latitude,
      longitude: chat.longitude,

      // Settings
      isVerified: chat.isVerified,
      avatarUrl: chat.avatarUrl,
      requireApproval: chat.requireApproval,
      memberLimit: chat.memberLimit,
      slowModeSeconds: chat.slowModeSeconds,
      businessCategory: chat.businessCategory,

      // Counts
      memberCount: chat.memberCount,
      messageCount: chat.messageCount,

      // Owner
      owner: chat.owner,

      // Linked chat (for business chats with public/private pairs)
      linkedChat: chat.linkedChat,

      // Members
      members: formattedMembers,

      // Pinned messages
      pinnedMessages: chat.messages.map((msg) => ({
        id: msg.id,
        content: msg.contentFiltered || msg.content,
        createdAt: msg.createdAt,
        user: msg.user,
      })),

      // User's status
      membership: membership ? {
        id: membership.id,
        role: membership.role,
        status: membership.status,
        unreadCount: membership.unreadCount,
        joinedAt: membership.joinedAt,
        lastReadAt: membership.lastReadAt,
        mutedUntil: membership.mutedUntil,
      } : null,

      // Join request status (if applicable)
      joinRequest,

      // Access control
      isMember: !!membership,
      canJoin,
      canLeave: !!membership && membership.role !== 'owner',
      canModerate: !!membership && (membership.role === 'owner' || membership.role === 'moderator'),
      canInvite: !!membership && chat.visibility === 'private',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching chat details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat details' },
      { status: 500 }
    );
  }
}
