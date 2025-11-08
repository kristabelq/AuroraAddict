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
 * PATCH /api/admin/business-verifications/[id]
 *
 * Approve or reject a business verification request
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
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

    const body = await request.json();
    const { action, rejectionReason } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate rejection reason if rejecting
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the user to verify it exists and is pending
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        verificationStatus: true,
        businessName: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.verificationStatus !== 'pending') {
      return NextResponse.json(
        { error: `Cannot ${action} verification that is not pending (current status: ${user.verificationStatus})` },
        { status: 400 }
      );
    }

    // Update verification status
    const updateData: any = {
      verificationStatus: action === 'approve' ? 'verified' : 'rejected',
      verifiedBy: session.user.id,
    };

    if (action === 'approve') {
      updateData.verifiedAt = new Date();
      updateData.rejectionReason = null; // Clear any previous rejection reason
    } else {
      updateData.rejectionReason = rejectionReason;
      updateData.verifiedAt = null; // Clear verified date if rejecting
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        verificationStatus: true,
        verifiedAt: true,
        rejectionReason: true,
      },
    });

    // TODO: Send email notification to business
    // - Approval email with next steps
    // - Rejection email with reason and reapplication instructions

    return NextResponse.json({
      message: `Business verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return NextResponse.json(
      { error: 'Failed to update verification status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/business-verifications/[id]
 *
 * Fetch a single business verification request
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch the verification request
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch verifier info if available
    let verifierInfo = null;
    if (user.verifiedBy) {
      verifierInfo = await prisma.user.findUnique({
        where: { id: user.verifiedBy },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    }

    return NextResponse.json({
      ...user,
      verifier: verifierInfo,
    });
  } catch (error) {
    console.error('Error fetching verification request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification request' },
      { status: 500 }
    );
  }
}
