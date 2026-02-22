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
    // Get hunts where user is either the creator OR a participant
    const [createdHunts, participantHunts] = await Promise.all([
      // Hunts created by the user
      prisma.hunt.findMany({
        where: {
          userId: session.user.id,
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
          _count: {
            select: {
              participants: {
                where: {
                  status: "confirmed",
                },
              },
            },
          },
          participants: {
            where: {
              OR: [
                { status: "waitlisted" },
                { paymentStatus: "marked_paid", status: "pending" },
              ],
            },
            select: {
              id: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      }),
      // Hunts user is participating in
      prisma.hunt.findMany({
        where: {
          participants: {
            some: {
              userId: session.user.id,
              status: { in: ["confirmed", "pending", "waitlisted"] },
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
          _count: {
            select: {
              participants: {
                where: {
                  status: "confirmed",
                },
              },
            },
          },
          participants: {
            where: {
              OR: [
                { status: "waitlisted" },
                { paymentStatus: "marked_paid", status: "pending" },
              ],
            },
            select: {
              id: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      }),
    ]);

    // Combine and deduplicate hunts (in case user created a hunt they're also participating in)
    const huntMap = new Map();

    [...createdHunts, ...participantHunts].forEach((hunt) => {
      if (!huntMap.has(hunt.id)) {
        // Calculate waitlist and pending payment counts separately
        const waitlistCount = hunt.participants.filter(p => p.status === "waitlisted").length;
        const pendingPaymentCount = hunt.participants.filter(
          p => p.paymentStatus === "marked_paid" && p.status === "pending"
        ).length;

        huntMap.set(hunt.id, {
          ...hunt,
          participants: hunt._count.participants,
          waitlistCount,
          pendingPaymentCount,
          isCreator: hunt.userId === session.user.id,
          latitude: hunt.latitude,
          longitude: hunt.longitude,
        });
      }
    });

    const allHunts = Array.from(huntMap.values()).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Use cached stats for completed hunts to avoid N+1 queries
    const huntsWithSuccessRate = allHunts.map((hunt) => {
      const now = new Date();
      const endDate = new Date(hunt.endDate);
      const isCompleted = now > endDate;

      if (isCompleted) {
        // Calculate hunt length in days
        const startDate = new Date(hunt.startDate);
        const huntLengthMs = endDate.getTime() - startDate.getTime();
        const huntLengthDays = Math.ceil(huntLengthMs / (1000 * 60 * 60 * 24));

        return {
          ...hunt,
          startDate: hunt.startDate.toISOString(),
          endDate: hunt.endDate.toISOString(),
          successRate: hunt.cachedSuccessRate?.toFixed(1) || "0.0",
          sightingsCount: hunt.cachedSightingsCount || 0,
          huntLengthDays: huntLengthDays,
          uniqueParticipants: hunt.cachedUniqueParticipants || 0,
        };
      }

      return {
        ...hunt,
        startDate: hunt.startDate.toISOString(),
        endDate: hunt.endDate.toISOString(),
      };
    });

    return NextResponse.json(huntsWithSuccessRate);
  } catch (error) {
    console.error("Error fetching user's hunts:", error);
    return NextResponse.json({ error: "Failed to fetch hunts" }, { status: 500 });
  }
}
