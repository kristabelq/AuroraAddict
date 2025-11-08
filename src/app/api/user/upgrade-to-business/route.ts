import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/user/upgrade-to-business
 *
 * Submit business verification request
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
      businessName,
      businessCategory,
      businessDescription,
      businessWebsite,
      businessPhone,
      businessEmail,
      businessAddress,
      businessCity,
      businessCountry,
      businessLicenseUrl,
      idDocumentUrl,
    } = body;

    // Validation
    if (!businessName || !businessCategory) {
      return NextResponse.json(
        { error: 'Business name and category are required' },
        { status: 400 }
      );
    }

    if (!businessLicenseUrl || !idDocumentUrl) {
      return NextResponse.json(
        { error: 'Verification documents are required' },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved verification
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        verificationStatus: true,
        userType: true,
      },
    });

    if (existingUser?.verificationStatus === 'verified') {
      return NextResponse.json(
        { error: 'Your business is already verified' },
        { status: 400 }
      );
    }

    if (existingUser?.verificationStatus === 'pending') {
      return NextResponse.json(
        { error: 'You already have a pending verification request' },
        { status: 400 }
      );
    }

    // Update user with business information
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userType: 'business',
        businessName,
        businessCategory,
        businessDescription: businessDescription || null,
        businessWebsite: businessWebsite || null,
        businessPhone: businessPhone || null,
        businessEmail: businessEmail || null,
        businessAddress: businessAddress || null,
        businessCity: businessCity || null,
        businessCountry: businessCountry || 'Finland',
        businessLicenseUrl,
        idDocumentUrl,
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date(),
      },
    });

    // TODO: Send notification to admin
    // TODO: Send confirmation email to user

    return NextResponse.json({
      message: 'Business verification request submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting business verification:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification request' },
      { status: 500 }
    );
  }
}
