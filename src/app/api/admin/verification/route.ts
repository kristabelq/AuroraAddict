import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Simple admin check - in production, use a proper admin role system
const isAdmin = (email: string | null | undefined) => {
  if (!email) return false;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  return adminEmails.includes(email);
};

// GET - List all businesses pending verification
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const businesses = await prisma.user.findMany({
      where: {
        userType: "business",
        verificationStatus: status,
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessServices: true,
        businessDescription: true,
        businessEmail: true,
        businessCity: true,
        businessCountry: true,
        businessLicenseUrl: true,
        idDocumentUrl: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        createdAt: true,
      },
      orderBy: {
        verificationSubmittedAt: "desc",
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification requests" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject verification
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, action, rejectionReason } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting" },
        { status: 400 }
      );
    }

    // Verify the user is a business with pending verification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        userType: true,
        verificationStatus: true,
      },
    });

    if (!user || user.userType !== "business") {
      return NextResponse.json({ error: "User not found or not a business" }, { status: 404 });
    }

    if (user.verificationStatus !== "pending") {
      return NextResponse.json(
        { error: "User is not pending verification" },
        { status: 400 }
      );
    }

    // Update verification status
    const updateData: any = {
      verificationStatus: action === "approve" ? "verified" : "rejected",
      verifiedBy: session.user.id,
    };

    if (action === "reject" && rejectionReason) {
      updateData.verificationRejectionReason = rejectionReason;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // TODO: Send email notification to business about approval/rejection

    return NextResponse.json({
      success: true,
      message: `Business ${action === "approve" ? "verified" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Error processing verification:", error);
    return NextResponse.json(
      { error: "Failed to process verification" },
      { status: 500 }
    );
  }
}
