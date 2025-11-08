import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/tour-operators
 * Get all tour operator businesses
 */
export async function GET() {
  try {
    const businesses = await prisma.user.findMany({
      where: {
        userType: 'business',
        businessServices: {
          has: 'tour_operator'
        }
      },
      select: {
        id: true,
        businessName: true,
        businessServices: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Error fetching tour operators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour operators' },
      { status: 500 }
    );
  }
}
