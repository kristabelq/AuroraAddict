import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chats/my-chats
 *
 * Get all chats the current user has joined
 * Returns chats with unread counts and last message info
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's chat memberships with chat details
    const memberships = await prisma.chatMembership.findMany({
      where: {
        userId: session.user.id,
        status: 'active', // Only active memberships
      },
      include: {
        chatGroup: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                image: true,
                businessName: true,
              },
            },
            hunt: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
              },
            },
            messages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc', // Order by most recently joined
      },
    });

    // Format response
    const chats = memberships.map((membership) => {
      const chat = membership.chatGroup;
      const lastMessage = chat.messages[0] || null;

      // Calculate hunt status if this is a hunt chat
      let huntData = null;
      if (chat.hunt) {
        const now = new Date();
        const startDate = new Date(chat.hunt.startDate);
        const endDate = new Date(chat.hunt.endDate);

        let status: 'upcoming' | 'ongoing' | 'completed';
        if (now < startDate) {
          status = 'upcoming';
        } else if (now >= startDate && now <= endDate) {
          status = 'ongoing';
        } else {
          status = 'completed';
        }

        huntData = {
          id: chat.hunt.id,
          startDate: chat.hunt.startDate.toISOString(),
          endDate: chat.hunt.endDate.toISOString(),
          status,
        };
      }

      return {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        groupType: chat.groupType,
        visibility: chat.visibility,
        areaName: chat.areaName,
        countryCode: chat.countryCode,
        countryName: chat.countryName,
        isVerified: chat.isVerified,
        avatarUrl: chat.avatarUrl,
        memberCount: chat.memberCount,
        messageCount: chat.messageCount,
        businessCategory: chat.businessCategory,
        requireApproval: chat.requireApproval,
        memberLimit: chat.memberLimit,
        owner: chat.owner,
        hunt: huntData, // Hunt data with calculated status

        // Membership info
        unreadCount: membership.unreadCount,
        role: membership.role,
        joinedAt: membership.joinedAt,
        lastReadAt: membership.lastReadAt,

        // Last message
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.contentFiltered || lastMessage.content,
              messageType: lastMessage.messageType,
              createdAt: lastMessage.createdAt,
              user: lastMessage.user,
            }
          : null,
      };
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching my chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
