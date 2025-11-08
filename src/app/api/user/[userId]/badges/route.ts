import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get user's city badges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get all city badges for the user
    const badges = await prisma.cityBadge.findMany({
      where: {
        userId,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    return NextResponse.json(badges);
  } catch (error) {
    console.error("Error fetching city badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch city badges" },
      { status: 500 }
    );
  }
}
