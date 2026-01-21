import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reviews/[id]/helpful
 * Mark a review as helpful (toggle)
 */
export async function POST(
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

    const { id: reviewId } = await params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user already marked as helpful
    const existingVote = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id
        }
      }
    });

    if (existingVote) {
      // Remove vote (toggle off)
      await prisma.$transaction([
        prisma.reviewHelpful.delete({
          where: { id: existingVote.id }
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              decrement: 1
            }
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        helpful: false,
        message: 'Removed helpful vote'
      });
    } else {
      // Add vote (toggle on)
      await prisma.$transaction([
        prisma.reviewHelpful.create({
          data: {
            reviewId,
            userId: session.user.id
          }
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              increment: 1
            }
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        helpful: true,
        message: 'Marked as helpful'
      });
    }
  } catch (error) {
    console.error('Error toggling helpful:', error);
    return NextResponse.json(
      { error: 'Failed to toggle helpful' },
      { status: 500 }
    );
  }
}
