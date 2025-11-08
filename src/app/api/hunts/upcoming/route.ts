import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const hunts = await prisma.hunt.findMany({
      where: {
        hideFromPublic: false,
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
            status: {
              in: userId ? ["confirmed", "waitlisted", "pending"] : ["waitlisted"],
            },
          },
          select: {
            id: true,
            userId: true,
            status: true,
            paymentStatus: true,
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
      take: 50,
    });

    // Transform hunts with cached stats (instant performance!)
    const huntsWithSuccessRate = hunts.map((hunt) => {
      const now = new Date();
      const endDate = new Date(hunt.endDate);
      const isCompleted = now > endDate;

      // Find current user's participant record (including pending)
      const userParticipant = userId ? hunt.participants.find(p => p.userId === userId) : null;

      // Calculate waitlist count and user participation
      const waitlistCount = hunt.participants.filter(p => p.status === "waitlisted").length;
      const isUserParticipant = userParticipant ? userParticipant.status === "confirmed" || userParticipant.status === "waitlisted" : false;

      // Check for pending payment status
      const isPendingPayment = userParticipant?.status === "pending" && hunt.isPaid && userParticipant?.paymentStatus !== "confirmed";

      // Base hunt data
      const baseData = {
        ...hunt,
        startDate: hunt.startDate.toISOString(),
        endDate: hunt.endDate.toISOString(),
        participants: hunt._count.participants,
        waitlistCount,
        isUserParticipant,
        isPendingPayment: isPendingPayment || false,
        latitude: hunt.latitude,
        longitude: hunt.longitude,
      };

      // For completed hunts, add cached stats
      if (isCompleted) {
        const startDate = new Date(hunt.startDate);
        const huntLengthMs = endDate.getTime() - startDate.getTime();
        const huntLengthDays = Math.ceil(huntLengthMs / (1000 * 60 * 60 * 24)) + 1;

        return {
          ...baseData,
          successRate: hunt.cachedSuccessRate?.toFixed(1) || "0.0",
          sightingsCount: hunt.cachedSightingsCount || 0,
          huntLengthDays: huntLengthDays,
          uniqueParticipants: hunt.cachedUniqueParticipants || 0,
        };
      }

      // For ongoing/upcoming hunts, no success rate
      return baseData;
    });

    return NextResponse.json(huntsWithSuccessRate);
  } catch (error) {
    console.error("Error fetching upcoming hunts:", error);
    return NextResponse.json([]);
  }
}
