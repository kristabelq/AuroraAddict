import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user has already completed onboarding
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingComplete: true,
        userType: true,
      },
    });

    // Prevent account type changes after initial onboarding
    if (existingUser?.onboardingComplete) {
      return NextResponse.json(
        { error: "Onboarding already completed. Account type cannot be changed." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userType, ...businessData } = body;

    // Prepare update data
    const updateData: any = {
      onboardingComplete: true,
      userType: userType || "personal",
    };

    // Add business data if user type is business
    if (userType === "business") {
      if (businessData.businessName) {
        updateData.businessName = businessData.businessName.trim();
      }
      if (businessData.businessServices && Array.isArray(businessData.businessServices)) {
        updateData.businessServices = businessData.businessServices;
      }
      if (businessData.businessDescription) {
        updateData.businessDescription = businessData.businessDescription.trim();
      }
      if (businessData.businessWebsite) {
        updateData.businessWebsite = businessData.businessWebsite.trim();
      }
      if (businessData.businessPhone) {
        updateData.businessPhone = businessData.businessPhone.trim();
      }
      if (businessData.businessEmail) {
        updateData.businessEmail = businessData.businessEmail.trim();
      }
      if (businessData.businessAddress) {
        updateData.businessAddress = businessData.businessAddress.trim();
      }
      if (businessData.businessCity) {
        updateData.businessCity = businessData.businessCity.trim();
      }
      if (businessData.businessCountry) {
        updateData.businessCountry = businessData.businessCountry.trim();
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
