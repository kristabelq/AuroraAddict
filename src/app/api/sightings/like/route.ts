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
    const body = await req.json();
    const { sightingId } = body;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_sightingId: {
          userId: session.user.id,
          sightingId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: session.user.id,
          sightingId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
