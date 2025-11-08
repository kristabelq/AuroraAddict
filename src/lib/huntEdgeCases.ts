import { prisma } from "@/lib/prisma";

/**
 * Edge Case Utilities for Hunt Participation System
 *
 * This module handles all the edge cases outlined in the requirements:
 * - Payment timeouts and failures
 * - Waitlist management (FIFO)
 * - Request/approval expiration
 * - State transition validation
 * - Settings change restrictions
 */

// Constants
export const PAYMENT_TIMEOUT_DAYS = 7;
export const REQUEST_TIMEOUT_DAYS = 7;
export const MAX_REJECTION_COUNT = 3;
export const WAITLIST_CLEANUP_BUFFER_SECONDS = 1; // 1 second before hunt starts
export const JOIN_CUTOFF_BEFORE_END_MINUTES = 1; // Cannot join within 1 minute before hunt ends

/**
 * Calculate expiration date for pending requests/payments
 * 7 days from now OR 1 second before hunt starts, whichever is sooner
 */
export function calculateExpirationDate(
  huntStartDate: Date,
  fromDate: Date = new Date()
): Date {
  const sevenDaysFromNow = new Date(fromDate);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + PAYMENT_TIMEOUT_DAYS);

  const huntStartWithBuffer = new Date(huntStartDate);
  huntStartWithBuffer.setSeconds(
    huntStartWithBuffer.getSeconds() - WAITLIST_CLEANUP_BUFFER_SECONDS
  );

  // Return whichever comes first
  return sevenDaysFromNow < huntStartWithBuffer
    ? sevenDaysFromNow
    : huntStartWithBuffer;
}

/**
 * Check if a user is blocked from joining due to rejection count
 */
export async function isUserBlockedFromJoining(
  huntId: string,
  userId: string
): Promise<boolean> {
  const participant = await prisma.huntParticipant.findUnique({
    where: {
      huntId_userId: {
        huntId,
        userId,
      },
    },
    select: {
      rejectionCount: true,
    },
  });

  return (participant?.rejectionCount || 0) >= MAX_REJECTION_COUNT;
}

/**
 * Check if hunt has participants in transition states
 * (pending, waitlisted, or payment processing)
 */
export async function hasParticipantsInTransition(
  huntId: string
): Promise<boolean> {
  const count = await prisma.huntParticipant.count({
    where: {
      huntId,
      status: {
        in: ["pending", "waitlisted"],
      },
    },
  });

  return count > 0;
}

/**
 * Check if hunt has any confirmed payments
 * Only counts participants with status = 'confirmed' AND paymentStatus = 'completed'
 * Pending payments are NOT counted
 */
export async function hasConfirmedPayments(huntId: string): Promise<boolean> {
  const count = await prisma.huntParticipant.count({
    where: {
      huntId,
      status: "confirmed",
      paymentStatus: "completed",
      paidAt: {
        not: null,
      },
    },
  });

  return count > 0;
}

/**
 * Get count of confirmed participants (excluding pending payments)
 * Used for capacity validation when changing hunt settings
 */
export async function getConfirmedParticipantCount(huntId: string): Promise<number> {
  const count = await prisma.huntParticipant.count({
    where: {
      huntId,
      status: "confirmed",
    },
  });

  return count;
}

/**
 * Get next available waitlist position for a hunt
 */
export async function getNextWaitlistPosition(huntId: string): Promise<number> {
  const maxPosition = await prisma.huntParticipant.aggregate({
    where: {
      huntId,
      status: "waitlisted",
    },
    _max: {
      waitlistPosition: true,
    },
  });

  return (maxPosition._max.waitlistPosition || 0) + 1;
}

/**
 * Get the next user in line from waitlist (FIFO - First In First Served)
 */
export async function getNextWaitlistedUser(huntId: string) {
  const nextUser = await prisma.huntParticipant.findFirst({
    where: {
      huntId,
      status: "waitlisted",
    },
    orderBy: [
      { waitlistPosition: "asc" }, // First come first serve by position
      { joinedAt: "asc" }, // Fallback to join date
    ],
  });

  return nextUser;
}

/**
 * Promote next waitlisted user to pending or confirmed based on hunt type
 */
export async function promoteNextWaitlistedUser(
  huntId: string
): Promise<boolean> {
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    select: {
      isPublic: true,
      isPaid: true,
      capacity: true,
      startDate: true,
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
  });

  if (!hunt) return false;

  // Check if there's actually capacity
  const isAtCapacity =
    hunt.capacity && hunt._count.participants >= hunt.capacity;
  if (isAtCapacity) return false;

  const nextUser = await getNextWaitlistedUser(huntId);
  if (!nextUser) return false;

  // Determine new status based on hunt type
  let newStatus: string;
  if (hunt.isPublic && !hunt.isPaid) {
    // Free public hunts: directly confirm
    newStatus = "confirmed";
  } else if (hunt.isPaid) {
    // Paid hunts: move to pending payment
    newStatus = "pending";
  } else {
    // Private hunts: move to pending approval
    newStatus = "pending";
  }

  // Calculate expiration date
  const expirationDate = calculateExpirationDate(hunt.startDate);

  await prisma.huntParticipant.update({
    where: { id: nextUser.id },
    data: {
      status: newStatus,
      requestExpiresAt: newStatus === "pending" ? expirationDate : null,
    },
  });

  return true;
}

/**
 * Cleanup expired requests and payments
 * This should be called periodically by a cron job
 */
export async function cleanupExpiredParticipants(): Promise<number> {
  const now = new Date();

  // Find all expired participants
  const expiredParticipants = await prisma.huntParticipant.findMany({
    where: {
      status: {
        in: ["pending", "waitlisted"],
      },
      requestExpiresAt: {
        lte: now,
      },
    },
    include: {
      hunt: {
        select: {
          id: true,
          capacity: true,
        },
      },
    },
  });

  let cleanedCount = 0;

  for (const participant of expiredParticipants) {
    // Update to cancelled
    await prisma.huntParticipant.update({
      where: { id: participant.id },
      data: {
        status: "cancelled",
      },
    });

    cleanedCount++;

    // Try to promote next waitlisted user if this freed up a spot
    if (participant.status === "pending") {
      await promoteNextWaitlistedUser(participant.huntId);
    }
  }

  return cleanedCount;
}

/**
 * Cleanup waitlist before hunt starts (1 second before)
 * Clear all waitlisted users to avoid conflicts
 */
export async function cleanupWaitlistBeforeHuntStart(
  huntId: string
): Promise<number> {
  const result = await prisma.huntParticipant.updateMany({
    where: {
      huntId,
      status: "waitlisted",
    },
    data: {
      status: "cancelled",
    },
  });

  return result.count;
}

/**
 * Check if settings can be changed for a hunt
 * Returns an error message if not allowed, null if allowed
 */
export async function canChangeHuntSettings(
  huntId: string,
  changingTo: { isPublic?: boolean; isPaid?: boolean }
): Promise<string | null> {
  // Check for participants in transition
  const hasTransitionUsers = await hasParticipantsInTransition(huntId);
  if (hasTransitionUsers) {
    return "Cannot change hunt settings while users are in pending or waitlisted states. All users must leave first.";
  }

  // If changing to paid or from unpaid to paid, check for confirmed participants
  if (changingTo.isPaid === false) {
    // Changing from paid to unpaid
    const hasPayments = await hasConfirmedPayments(huntId);
    if (hasPayments) {
      return "Cannot change from paid to unpaid when participants have already paid.";
    }
  }

  return null;
}

/**
 * Validate that a hunt can be cancelled/deleted
 */
export async function canCancelHunt(huntId: string): Promise<string | null> {
  const hasPayments = await hasConfirmedPayments(huntId);
  if (hasPayments) {
    return "Cannot cancel hunt with confirmed payments. Please contact support.";
  }

  return null;
}

/**
 * Update hunt's hasParticipantsInTransition flag
 * Should be called after any participant status change
 */
export async function updateHuntTransitionStatus(huntId: string): Promise<void> {
  const hasTransition = await hasParticipantsInTransition(huntId);

  await prisma.hunt.update({
    where: { id: huntId },
    data: {
      hasParticipantsInTransition: hasTransition,
    },
  });
}

/**
 * Handle rejection - increment counter and check if user should be blocked
 */
export async function handleRejection(
  participantId: string
): Promise<{ isBlocked: boolean; rejectionCount: number }> {
  const participant = await prisma.huntParticipant.update({
    where: { id: participantId },
    data: {
      rejectionCount: { increment: 1 },
      lastRejectedAt: new Date(),
      status: "cancelled",
    },
  });

  return {
    isBlocked: participant.rejectionCount >= MAX_REJECTION_COUNT,
    rejectionCount: participant.rejectionCount,
  };
}

/**
 * Validate payment processing to prevent double payments
 */
export async function canProcessPayment(
  huntId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const participant = await prisma.huntParticipant.findUnique({
    where: {
      huntId_userId: {
        huntId,
        userId,
      },
    },
  });

  if (!participant) {
    return { allowed: false, reason: "Not a participant of this hunt" };
  }

  if (participant.isPaymentProcessing) {
    return {
      allowed: false,
      reason: "Payment is already being processed. Please wait or refresh the page.",
    };
  }

  if (participant.paidAt) {
    return {
      allowed: false,
      reason: "You have already paid for this hunt",
    };
  }

  return { allowed: true };
}

/**
 * Mark payment as processing to prevent double payments
 */
export async function markPaymentProcessing(
  participantId: string,
  isProcessing: boolean
): Promise<void> {
  await prisma.huntParticipant.update({
    where: { id: participantId },
    data: {
      isPaymentProcessing: isProcessing,
    },
  });
}

/**
 * Handle capacity increase - auto-promote waitlisted users (FIFO)
 * Returns the number of users promoted
 */
export async function handleCapacityIncrease(
  huntId: string,
  newCapacity: number | null
): Promise<number> {
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    select: {
      isPublic: true,
      isPaid: true,
      startDate: true,
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
  });

  if (!hunt) return 0;

  const confirmedCount = hunt._count.participants;

  // Calculate how many spots are now available
  const availableSpots = newCapacity
    ? Math.max(0, newCapacity - confirmedCount)
    : Infinity;

  if (availableSpots === 0) return 0;

  // Get waitlisted users in FIFO order
  const waitlistedUsers = await prisma.huntParticipant.findMany({
    where: {
      huntId,
      status: "waitlisted",
    },
    orderBy: [
      { waitlistPosition: "asc" },
      { joinedAt: "asc" },
    ],
    take: isFinite(availableSpots) ? availableSpots : undefined,
  });

  let promotedCount = 0;

  for (const participant of waitlistedUsers) {
    // Determine new status based on hunt type
    let newStatus: string;
    let newExpiration: Date | null = null;

    if (hunt.isPublic && !hunt.isPaid) {
      // Free public hunts: directly confirm
      newStatus = "confirmed";
    } else if (hunt.isPaid) {
      // Paid hunts: move to pending payment
      newStatus = "pending";
      newExpiration = calculateExpirationDate(hunt.startDate);
    } else {
      // Private hunts: keep in waitlist (owner must manually accept)
      continue; // Skip auto-promotion for private hunts
    }

    await prisma.huntParticipant.update({
      where: { id: participant.id },
      data: {
        status: newStatus,
        waitlistPosition: null,
        requestExpiresAt: newExpiration,
      },
    });

    // If directly confirmed (free public), increment counter
    if (newStatus === "confirmed") {
      await prisma.user.update({
        where: { id: participant.userId },
        data: {
          cachedHuntsJoinedCount: { increment: 1 },
        },
      });
    }

    promotedCount++;
  }

  return promotedCount;
}

/**
 * Validate capacity decrease - ensure it doesn't go below confirmed count
 */
export async function canDecreaseCapacity(
  huntId: string,
  newCapacity: number
): Promise<{ allowed: boolean; reason?: string }> {
  const confirmedCount = await getConfirmedParticipantCount(huntId);

  if (newCapacity < confirmedCount) {
    return {
      allowed: false,
      reason: `Cannot decrease capacity to ${newCapacity} as there are already ${confirmedCount} confirmed participants (including owner).`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can join hunt based on timing
 * Allows join during ongoing hunt but blocks within 1 minute before end
 */
export function canJoinBasedOnTiming(
  huntStartDate: Date,
  huntEndDate: Date,
  currentDate: Date = new Date()
): { allowed: boolean; reason?: string } {
  // Block if hunt has already ended
  if (currentDate >= huntEndDate) {
    return {
      allowed: false,
      reason: "This hunt has already ended. You cannot join.",
    };
  }

  // Block if within 1 minute before hunt ends
  const oneMinuteBeforeEnd = new Date(
    huntEndDate.getTime() - JOIN_CUTOFF_BEFORE_END_MINUTES * 60 * 1000
  );

  if (currentDate >= oneMinuteBeforeEnd) {
    return {
      allowed: false,
      reason: "Cannot join within 1 minute before hunt ends. Please try again later.",
    };
  }

  // Allow join - either before start or during hunt (but not too close to end)
  return { allowed: true };
}

/**
 * Check if accepting a participant would exceed capacity
 * Returns info about whether auto-adjustment is needed
 */
export async function checkCapacityForAcceptance(
  huntId: string
): Promise<{
  wouldExceed: boolean;
  currentCapacity: number;
  confirmedCount: number;
  newCapacity?: number;
  warningMessage?: string;
}> {
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    select: { capacity: true },
  });

  if (!hunt) {
    throw new Error("Hunt not found");
  }

  const confirmedCount = await getConfirmedParticipantCount(huntId);
  const currentCapacity = hunt.capacity || 0;

  // Check if accepting one more would exceed capacity
  const wouldExceed = confirmedCount >= currentCapacity;

  if (wouldExceed) {
    const newCapacity = confirmedCount + 1;
    return {
      wouldExceed: true,
      currentCapacity,
      confirmedCount,
      newCapacity,
      warningMessage: `This will increase the hunt capacity from ${currentCapacity} to ${newCapacity} to accommodate this participant. Do you want to continue?`,
    };
  }

  return {
    wouldExceed: false,
    currentCapacity,
    confirmedCount,
  };
}

/**
 * Accept participant and auto-adjust capacity if needed
 * Used when owner accepts over capacity
 */
export async function acceptParticipantWithCapacityAdjustment(
  participantId: string,
  huntId: string
): Promise<{ success: boolean; capacityAdjusted: boolean; newCapacity?: number }> {
  const capacityCheck = await checkCapacityForAcceptance(huntId);

  if (capacityCheck.wouldExceed) {
    // Accept participant and auto-adjust capacity in transaction
    await prisma.$transaction([
      prisma.huntParticipant.update({
        where: { id: participantId },
        data: {
          status: "confirmed",
          requestExpiresAt: null,
        },
      }),
      prisma.hunt.update({
        where: { id: huntId },
        data: {
          capacity: capacityCheck.newCapacity,
        },
      }),
    ]);

    return {
      success: true,
      capacityAdjusted: true,
      newCapacity: capacityCheck.newCapacity,
    };
  } else {
    // Just accept participant without capacity adjustment
    await prisma.huntParticipant.update({
      where: { id: participantId },
      data: {
        status: "confirmed",
        requestExpiresAt: null,
      },
    });

    return {
      success: true,
      capacityAdjusted: false,
    };
  }
}

/**
 * Attempt to join hunt with race condition handling
 * Returns error if hunt becomes full during the check
 */
export async function joinHuntWithRaceConditionHandling(
  huntId: string,
  userId: string
): Promise<{ success: boolean; error?: string; status?: string; waitlistPosition?: number }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock hunt for update to prevent race conditions
      const hunt = await tx.hunt.findUnique({
        where: { id: huntId },
        include: {
          _count: {
            select: {
              participants: {
                where: { status: "confirmed" },
              },
            },
          },
        },
      });

      if (!hunt) {
        throw new Error("Hunt not found");
      }

      const confirmedCount = hunt._count.participants;
      const hasSpace = !hunt.capacity || confirmedCount < hunt.capacity;

      // Check timing constraints
      const timingCheck = canJoinBasedOnTiming(hunt.startDate, hunt.endDate);
      if (!timingCheck.allowed) {
        throw new Error(timingCheck.reason || "Cannot join at this time");
      }

      if (hasSpace) {
        // Space available - join as confirmed
        const participant = await tx.huntParticipant.create({
          data: {
            huntId,
            userId,
            status: "confirmed",
          },
        });

        return { success: true, status: "confirmed", participantId: participant.id };
      } else if (hunt.allowWaitlist) {
        // No space but waitlist available
        const maxPosition = await tx.huntParticipant.aggregate({
          where: {
            huntId,
            status: "waitlisted",
          },
          _max: {
            waitlistPosition: true,
          },
        });

        const nextPosition = (maxPosition._max.waitlistPosition || 0) + 1;
        const expirationDate = calculateExpirationDate(hunt.startDate);

        const participant = await tx.huntParticipant.create({
          data: {
            huntId,
            userId,
            status: "waitlisted",
            waitlistPosition: nextPosition,
            requestExpiresAt: expirationDate,
          },
        });

        return {
          success: true,
          status: "waitlisted",
          waitlistPosition: nextPosition,
          participantId: participant.id,
        };
      } else {
        // No space and no waitlist
        throw new Error("This hunt is full. Please try again later.");
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join hunt",
    };
  }
}
