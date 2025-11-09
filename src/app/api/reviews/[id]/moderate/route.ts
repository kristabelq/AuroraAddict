import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reviews/[id]/moderate
 * Moderate a review (approve/reject) - Admin only
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

    // TODO: Add admin role check here
    // For now, only business owners can moderate reviews of their business

    const { id: reviewId } = await params;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject', 'flag'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or flag' },
        { status: 400 }
      );
    }

    // Get review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        businessId: true,
        status: true
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify user is business owner or admin
    // For now, allow business owner to moderate
    if (review.businessId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only admins or business owners can moderate reviews' },
        { status: 403 }
      );
    }

    // Update review status
    let updateData: any = {
      moderatedBy: session.user.id,
      moderatedAt: new Date()
    };

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
        break;
      case 'reject':
        if (!rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required' },
            { status: 400 }
          );
        }
        updateData.status = 'rejected';
        updateData.isPublished = false;
        updateData.rejectionReason = rejectionReason;
        break;
      case 'flag':
        updateData.status = 'flagged';
        updateData.isPublished = false;
        break;
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: `Review ${action}d successfully`
    });
  } catch (error) {
    console.error('Error moderating review:', error);
    return NextResponse.json(
      { error: 'Failed to moderate review' },
      { status: 500 }
    );
  }
}
