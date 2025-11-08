import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/update-services
 * Update Northern Lights Village with services
 */
export async function POST() {
  try {
    const result = await prisma.user.update({
      where: { id: '5ae6c72a-884e-459e-8c63-9952ea2e04e6' },
      data: {
        businessServices: ['accommodation', 'tour_operator']
      },
      select: {
        businessName: true,
        businessServices: true
      }
    });

    return NextResponse.json({
      success: true,
      business: result
    });
  } catch (error) {
    console.error('Error updating services:', error);
    return NextResponse.json(
      { error: 'Failed to update services' },
      { status: 500 }
    );
  }
}
