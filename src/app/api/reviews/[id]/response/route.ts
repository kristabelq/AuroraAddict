import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reviews/[id]/response
 * Business owner responds to a review
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

    // Get review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        businessId: true,
        hasResponse: true
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Verify user is the business owner
    if (review.businessId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the business owner can respond to reviews' },
        { status: 403 }
      );
    }

    // Check if review already has a response
    if (review.hasResponse) {
      return NextResponse.json(
        { error: 'Review already has a response. Use PUT to update it.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      );
    }

    // Create response
    const response = await prisma.$transaction([
      prisma.reviewResponse.create({
        data: {
          reviewId,
          content: content.trim(),
          respondedBy: session.user.id
        },
        include: {
          responder: {
            select: {
              id: true,
              name: true,
              businessName: true,
              image: true
            }
          }
        }
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { hasResponse: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      response: response[0],
      message: 'Response posted successfully'
    });
  } catch (error) {
    console.error('Error creating review response:', error);
    return NextResponse.json(
      { error: 'Failed to create response' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reviews/[id]/response
 * Update business response to a review
 */
export async function PUT(
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

    // Get existing response
    const existingResponse = await prisma.reviewResponse.findUnique({
      where: { reviewId },
      include: {
        review: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      );
    }

    // Verify user is the business owner
    if (existingResponse.review.businessId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the business owner can update their response' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      );
    }

    // Update response
    const updatedResponse = await prisma.reviewResponse.update({
      where: { id: existingResponse.id },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        responder: {
          select: {
            id: true,
            name: true,
            businessName: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      response: updatedResponse,
      message: 'Response updated successfully'
    });
  } catch (error) {
    console.error('Error updating review response:', error);
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    );
  }
}
