import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/business/cta-variants
 *
 * Fetch all CTA variants for the business (or platform-wide)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');

    const where: any = {
      OR: [
        { businessId: session.user.id }, // Business-specific variants
        { businessId: null }, // Platform-wide variants
      ],
    };

    if (serviceType) {
      where.serviceType = serviceType;
    }

    const variants = await prisma.cTAVariant.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Error fetching CTA variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CTA variants' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/cta-variants
 *
 * Create a new CTA variant for A/B testing
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can create CTA variants' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      buttonText,
      buttonColor,
      buttonStyle,
      placement,
      size = 'medium',
      serviceType,
      trafficAllocation = 50,
      endDate,
    } = body;

    // Validate required fields
    if (!name || !buttonText || !buttonColor || !buttonStyle || !placement) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, buttonText, buttonColor, buttonStyle, placement',
        },
        { status: 400 }
      );
    }

    // Validate button style
    if (!['solid', 'outline', 'ghost'].includes(buttonStyle)) {
      return NextResponse.json(
        { error: 'Invalid buttonStyle. Must be: solid, outline, or ghost' },
        { status: 400 }
      );
    }

    // Validate placement
    if (!['top', 'bottom', 'both'].includes(placement)) {
      return NextResponse.json(
        { error: 'Invalid placement. Must be: top, bottom, or both' },
        { status: 400 }
      );
    }

    // Validate size
    if (!['small', 'medium', 'large'].includes(size)) {
      return NextResponse.json(
        { error: 'Invalid size. Must be: small, medium, or large' },
        { status: 400 }
      );
    }

    // Validate traffic allocation
    if (trafficAllocation < 0 || trafficAllocation > 100) {
      return NextResponse.json(
        { error: 'Traffic allocation must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Create variant
    const variant = await prisma.cTAVariant.create({
      data: {
        businessId: session.user.id,
        name,
        buttonText,
        buttonColor,
        buttonStyle,
        placement,
        size,
        serviceType: serviceType || null,
        trafficAllocation,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({
      success: true,
      variant,
      message: 'CTA variant created successfully',
    });
  } catch (error) {
    console.error('Error creating CTA variant:', error);
    return NextResponse.json(
      { error: 'Failed to create CTA variant' },
      { status: 500 }
    );
  }
}
