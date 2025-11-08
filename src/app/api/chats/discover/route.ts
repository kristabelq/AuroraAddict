import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chats/discover
 *
 * Get all available chats for discovery
 * Supports filtering by country, category, search query
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country') || 'FI'; // Default to Finland
    const category = searchParams.get('category'); // Optional: filter by business category
    const search = searchParams.get('search'); // Optional: search by name/area

    // Build where clause
    const where: any = {
      isActive: true,
      countryCode,
    };

    // Filter by category if provided
    if (category && category !== 'all') {
      where.businessCategory = category;
    }

    // Search by name or area if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { areaName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all chats
    const chats = await prisma.chatGroup.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            businessName: true,
            businessCategory: true,
            businessServices: true,
          },
        },
        members: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,
          },
        },
      },
      orderBy: [
        { groupType: 'asc' }, // Area chats first
        { areaName: 'asc' }, // Then by area name
        { name: 'asc' }, // Then by name
      ],
    });

    // Separate area chats and business chats
    const areaChats = chats.filter(c => c.groupType === 'area');
    const businessChats = chats.filter(c => c.groupType === 'business_public' || c.groupType === 'business_private');

    // Format area chats (keep as-is)
    const formattedAreaChats = areaChats.map((chat) => {
      const membership = chat.members[0] || null;

      return {
        type: 'area',
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

        // User's membership status
        isMember: !!membership,
        memberRole: membership?.role || null,
        memberStatus: membership?.status || null,
        joinedAt: membership?.joinedAt || null,
      };
    });

    // Group business chats by owner (combine public + private)
    const businessProfiles = new Map();

    businessChats.forEach((chat) => {
      const ownerId = chat.ownerId;

      if (!businessProfiles.has(ownerId)) {
        businessProfiles.set(ownerId, {
          type: 'business',
          ownerId: ownerId,
          businessName: chat.owner.businessName,
          businessCategory: chat.businessCategory,
          businessServices: chat.owner.businessServices || [],
          areaName: chat.areaName,
          countryCode: chat.countryCode,
          countryName: chat.countryName,
          isVerified: chat.isVerified,
          owner: chat.owner,
          publicChat: null,
          privateChat: null,
        });
      }

      const profile = businessProfiles.get(ownerId);
      const membership = chat.members[0] || null;

      const chatInfo = {
        id: chat.id,
        name: chat.name,
        description: chat.description,
        memberCount: chat.memberCount,
        messageCount: chat.messageCount,
        requireApproval: chat.requireApproval,
        isMember: !!membership,
        memberRole: membership?.role || null,
        memberStatus: membership?.status || null,
      };

      if (chat.groupType === 'business_public') {
        profile.publicChat = chatInfo;
      } else if (chat.groupType === 'business_private') {
        profile.privateChat = chatInfo;
      }
    });

    const formattedBusinessProfiles = Array.from(businessProfiles.values());

    // Combine all items
    const allItems = [...formattedAreaChats, ...formattedBusinessProfiles];

    // Group by area for better UX
    const groupedByArea = allItems.reduce((acc: any, item) => {
      if (!acc[item.areaName]) {
        acc[item.areaName] = [];
      }
      acc[item.areaName].push(item);
      return acc;
    }, {});

    return NextResponse.json({
      items: allItems,
      groupedByArea,
      totalCount: allItems.length,
    });
  } catch (error) {
    console.error('Error fetching discover chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}
