import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Track tour booking link click
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment click count
    await prisma.tourExperience.update({
      where: { id },
      data: {
        clickCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking tour click:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
