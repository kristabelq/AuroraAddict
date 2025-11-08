import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Admin emails (can be moved to env variable later)
const ADMIN_EMAILS = [
  'kristabel.quek@gmail.com',
  'kristabelq@gmail.com',
  // Add more admin emails here
];

/**
 * GET /api/admin/business-verifications
 *
 * Fetch all business verification requests (pending, verified, rejected)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'all' | 'pending' | 'verified' | 'rejected'

    // Build filter
    const where: any = {
      userType: 'business',
    };

    if (status !== 'all') {
      where.verificationStatus = status;
    }

    // Fetch business verification requests
    const verifications = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        userType: true,
        businessName: true,
        businessCategory: true,
        businessDescription: true,
        businessWebsite: true,
        businessPhone: true,
        businessEmail: true,
        businessAddress: true,
        businessCity: true,
        businessCountry: true,
        businessLicenseUrl: true,
        idDocumentUrl: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        verifiedAt: true,
        verifiedBy: true,
        rejectionReason: true,
        createdAt: true,
      },
      orderBy: {
        verificationSubmittedAt: 'desc', // Most recent first
      },
    });

    return NextResponse.json({
      verifications,
      total: verifications.length,
    });
  } catch (error) {
    console.error('Error fetching business verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}
