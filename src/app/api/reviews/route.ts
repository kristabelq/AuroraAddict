import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reviews
 * Get reviews for a business with filters and pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status') || 'approved';
    const rating = searchParams.get('rating');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      businessId,
      status,
      isPublished: true
    };

    if (rating) {
      where.rating = parseInt(rating);
    }

    // Get reviews with pagination
    const [reviews, totalCount, avgRating] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true
            }
          },
          response: {
            include: {
              responder: {
                select: {
                  id: true,
                  name: true,
                  businessName: true
                }
              }
            }
          },
          hunt: {
            select: {
              id: true,
              name: true,
              startDate: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      // Total count
      prisma.review.count({ where }),
      // Average rating
      prisma.review.aggregate({
        where: {
          businessId,
          status: 'approved',
          isPublished: true
        },
        _avg: {
          rating: true
        }
      })
    ]);

    // Rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        businessId,
        status: 'approved',
        isPublished: true
      },
      _count: true
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        averageRating: avgRating._avg.rating || 0,
        totalReviews: totalCount,
        ratingDistribution: ratingDistribution.reduce((acc, item) => {
          acc[item.rating] = item._count;
          return acc;
        }, {} as Record<number, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Submit a new review
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      businessId,
      huntId,
      rating,
      title,
      content,
      images,
      reviewType,
      serviceType,
      specificItemId
    } = body;

    // Validate required fields
    if (!businessId || !rating || !content) {
      return NextResponse.json(
        { error: 'businessId, rating, and content are required' },
        { status: 400 }
      );
    }

    // Validate rating is 1-5
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = await prisma.user.findUnique({
      where: { id: businessId },
      select: { userType: true }
    });

    if (!business || business.userType !== 'business') {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this business for this hunt
    if (huntId) {
      const existingReview = await prisma.review.findUnique({
        where: {
          userId_businessId_huntId: {
            userId: session.user.id,
            businessId,
            huntId
          }
        }
      });

      if (existingReview) {
        return NextResponse.json(
          { error: 'You have already reviewed this business for this hunt' },
          { status: 409 }
        );
      }
    }

    // Check if user participated in the hunt (if huntId provided)
    let verifiedPurchase = false;
    if (huntId) {
      const participation = await prisma.huntParticipant.findFirst({
        where: {
          huntId,
          userId: session.user.id,
          status: 'confirmed'
        }
      });
      verifiedPurchase = !!participation;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        businessId,
        userId: session.user.id,
        huntId: huntId || null,
        rating,
        title: title || null,
        content,
        images: images || [],
        reviewType: reviewType || 'general',
        serviceType: serviceType || null,
        specificItemId: specificItemId || null,
        verifiedPurchase,
        status: 'pending', // Requires moderation
        isPublished: false
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully. It will be published after moderation.'
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
