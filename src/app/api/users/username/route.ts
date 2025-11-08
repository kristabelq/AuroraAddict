import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUsernameAvailable, validateUsername } from "@/lib/username";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    // Validate username format
    const validation = validateUsername(username);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if username is available
    const available = await isUsernameAvailable(username);
    if (!available) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating username:", error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}
