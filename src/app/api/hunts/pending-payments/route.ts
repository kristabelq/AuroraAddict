import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all hunts created by this user that have participants with marked_paid status
    const huntsWithPendingPayments = await prisma.hunt.findMany({
      where: {
        userId: session.user.id,
        isPaid: true,
        participants: {
          some: {
            paymentStatus: "marked_paid",
            status: "pending",
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        participants: {
          where: {
            paymentStatus: "marked_paid",
            status: "pending",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        _count: {
          select: {
            participants: {
              where: {
                status: "confirmed",
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    // Transform the data
    const result = huntsWithPendingPayments.map((hunt) => ({
      id: hunt.id,
      name: hunt.name,
      coverImage: hunt.coverImage,
      startDate: hunt.startDate.toISOString(),
      endDate: hunt.endDate.toISOString(),
      price: hunt.price,
      pendingPayments: hunt.participants.map((p) => ({
        id: p.id,
        odUserId: p.userId, // Used by UI for confirm action
        userName: p.user.name,
        userUsername: p.user.username,
        userImage: p.user.image,
        joinedAt: p.joinedAt.toISOString(),
      })),
      pendingCount: hunt.participants.length,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending payments" },
      { status: 500 }
    );
  }
}
