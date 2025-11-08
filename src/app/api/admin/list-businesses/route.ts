import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/list-businesses
 * List all businesses with their service tags
 */
export async function GET() {
  try {
    const businesses = await prisma.user.findMany({
      where: {
        userType: 'business'
      },
      select: {
        id: true,
        businessName: true,
        businessCategory: true,
        businessServices: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
