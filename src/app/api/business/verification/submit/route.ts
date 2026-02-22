import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify user is a business
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        verificationStatus: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can submit verification" },
        { status: 403 }
      );
    }

    // Don't allow re-submission if already verified
    if (user?.verificationStatus === "verified") {
      return NextResponse.json(
        { error: "Your business is already verified" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      businessLicenseUrl,
      idDocumentUrl,
      businessDescription,
      businessEmail,
      businessCity,
      businessCountry,
    } = body;

    // Validate required fields
    if (!businessLicenseUrl) {
      return NextResponse.json(
        { error: "Business license document is required" },
        { status: 400 }
      );
    }

    if (!idDocumentUrl) {
      return NextResponse.json(
        { error: "ID document is required" },
        { status: 400 }
      );
    }

    if (!businessDescription || !businessDescription.trim()) {
      return NextResponse.json(
        { error: "Business description is required" },
        { status: 400 }
      );
    }

    if (!businessEmail || !businessEmail.trim()) {
      return NextResponse.json(
        { error: "Business email is required" },
        { status: 400 }
      );
    }

    if (!businessCity || !businessCity.trim()) {
      return NextResponse.json(
        { error: "Business city is required" },
        { status: 400 }
      );
    }

    // Update user with verification details and set status to pending
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessLicenseUrl,
        idDocumentUrl,
        businessDescription: businessDescription.trim(),
        businessEmail: businessEmail.trim(),
        businessCity: businessCity.trim(),
        businessCountry: businessCountry?.trim() || "Finland",
        verificationStatus: "pending",
        verificationSubmittedAt: new Date(),
      },
    });

    // TODO: Send email notification to admin about new verification request
    // TODO: Send confirmation email to business

    return NextResponse.json({
      success: true,
      message: "Verification request submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification request" },
      { status: 500 }
    );
  }
}

// Get verification status
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        userType: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        rejectionReason: true,
        businessLicenseUrl: true,
        idDocumentUrl: true,
        businessDescription: true,
        businessEmail: true,
        businessCity: true,
        businessCountry: true,
      },
    });

    if (user?.userType !== "business") {
      return NextResponse.json(
        { error: "Only businesses can check verification status" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      verificationStatus: user.verificationStatus || "unverified",
      verificationSubmittedAt: user.verificationSubmittedAt,
      rejectionReason: user.rejectionReason,
      hasSubmittedDocuments:
        !!user.businessLicenseUrl && !!user.idDocumentUrl,
      businessDetails: {
        businessLicenseUrl: user.businessLicenseUrl,
        idDocumentUrl: user.idDocumentUrl,
        businessDescription: user.businessDescription,
        businessEmail: user.businessEmail,
        businessCity: user.businessCity,
        businessCountry: user.businessCountry,
      },
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification status" },
      { status: 500 }
    );
  }
}
