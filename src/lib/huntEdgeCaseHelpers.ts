/**
 * Frontend Helper Utilities for Hunt Edge Cases
 *
 * These utilities help display user-friendly messages and handle edge case states
 * on the frontend.
 */

export interface HuntParticipant {
  id: string;
  status: string;
  paymentStatus?: string | null;
  requestExpiresAt?: string | null;
  rejectionCount?: number;
  waitlistPosition?: number | null;
  isPaymentProcessing?: boolean;
  paidAt?: string | null;
}

export interface Hunt {
  id: string;
  isPublic: boolean;
  isPaid: boolean;
  capacity?: number | null;
  allowWaitlist: boolean;
  startDate: string;
  endDate: string;
}

/**
 * Get user-friendly status message for a participant
 */
export function getParticipantStatusMessage(
  participant: HuntParticipant,
  hunt: Hunt
): string {
  const { status, paymentStatus, waitlistPosition, requestExpiresAt } =
    participant;

  switch (status) {
    case "confirmed":
      return "You're confirmed for this hunt!";

    case "pending":
      if (hunt.isPaid && paymentStatus === "pending") {
        return "Payment required to confirm your spot";
      }
      if (!hunt.isPublic) {
        return "Waiting for organizer approval";
      }
      return "Your request is pending";

    case "waitlisted":
      const position = waitlistPosition ? `#${waitlistPosition}` : "";
      return `You're on the waitlist ${position}`.trim();

    case "cancelled":
      return "You left this hunt";

    default:
      return "Unknown status";
  }
}

/**
 * Get expiration warning message if applicable
 */
export function getExpirationWarning(
  participant: HuntParticipant
): string | null {
  if (!participant.requestExpiresAt) return null;

  const expiresAt = new Date(participant.requestExpiresAt);
  const now = new Date();
  const timeLeft = expiresAt.getTime() - now.getTime();

  // Already expired
  if (timeLeft <= 0) {
    return "This request has expired";
  }

  // Less than 24 hours
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  if (hoursLeft < 24) {
    return `Expires in ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""}`;
  }

  // Less than 7 days
  const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  if (daysLeft < 7) {
    return `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
  }

  return null;
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return `today at ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } else if (diffInDays === 1) {
    return `tomorrow at ${date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  } else if (diffInDays < 7) {
    return `in ${diffInDays} days`;
  } else {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
}

/**
 * Check if user can join a hunt
 */
export function canJoinHunt(
  participant: HuntParticipant | null,
  hunt: Hunt,
  currentUserId: string,
  huntOwnerId: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Owner is automatically in
  if (currentUserId === huntOwnerId) {
    return { allowed: false, reason: "You're the organizer of this hunt" };
  }

  // Check if blocked (3 rejections)
  if (participant && participant.rejectionCount && participant.rejectionCount >= 3) {
    return {
      allowed: false,
      reason: "You've been rejected from this hunt too many times",
    };
  }

  // Check if already participating
  if (participant && participant.status !== "cancelled") {
    return {
      allowed: false,
      reason: `You're already ${participant.status}`,
    };
  }

  // Check if hunt has started
  const startDate = new Date(hunt.startDate);
  if (new Date() > startDate) {
    return {
      allowed: false,
      reason: "This hunt has already started",
    };
  }

  return { allowed: true };
}

/**
 * Check if user can leave/cancel
 */
export function canLeaveHunt(
  participant: HuntParticipant | null
): {
  allowed: boolean;
  reason?: string;
  warning?: string;
} {
  if (!participant || participant.status === "cancelled") {
    return { allowed: false, reason: "You're not part of this hunt" };
  }

  if (participant.paidAt) {
    return {
      allowed: true,
      warning:
        "You've paid for this hunt. Refunds are handled by the organizer at their discretion.",
    };
  }

  return { allowed: true };
}

/**
 * Get appropriate action button text
 */
export function getJoinButtonText(
  participant: HuntParticipant | null,
  hunt: Hunt
): string {
  if (!participant || participant.status === "cancelled") {
    if (hunt.isPaid) {
      return "Join & Pay";
    }
    if (!hunt.isPublic) {
      return "Request to Join";
    }
    return "Join Hunt";
  }

  switch (participant.status) {
    case "pending":
      if (hunt.isPaid && participant.paymentStatus === "pending") {
        return "Complete Payment";
      }
      return "Request Pending";

    case "waitlisted":
      return `Waitlisted ${participant.waitlistPosition ? `(#${participant.waitlistPosition})` : ""}`;

    case "confirmed":
      return "Confirmed";

    default:
      return "Join Hunt";
  }
}

/**
 * Get CSS class for status badge
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "waitlisted":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * Check if payment processing is locked
 */
export function isPaymentLocked(participant: HuntParticipant | null): boolean {
  return participant?.isPaymentProcessing === true;
}

/**
 * Get warning message for settings changes
 */
export function getSettingsChangeWarning(
  hunt: Hunt,
  hasParticipantsInTransition: boolean,
  hasConfirmedPayments: boolean,
  changingTo: { isPublic?: boolean; isPaid?: boolean }
): string | null {
  if (hasParticipantsInTransition) {
    return "Cannot change settings while users are pending or waitlisted. All users must leave first.";
  }

  if (changingTo.isPaid === false && hasConfirmedPayments) {
    return "Cannot change from paid to unpaid when participants have already paid.";
  }

  return null;
}

/**
 * Get cancel hunt warning
 */
export function getCancelHuntWarning(
  hasConfirmedPayments: boolean
): string | null {
  if (hasConfirmedPayments) {
    return "Cannot cancel hunt with confirmed payments. Please contact support.";
  }

  return null;
}

/**
 * Format waitlist position
 */
export function formatWaitlistPosition(position?: number | null): string {
  if (!position) return "";
  return `#${position} in line`;
}

/**
 * Get time until hunt starts
 */
export function getTimeUntilStart(startDate: string): string {
  const start = new Date(startDate);
  const now = new Date();
  const diff = start.getTime() - now.getTime();

  if (diff <= 0) return "Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `Starts in ${days} day${days !== 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `Starts in ${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Starts in ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}

/**
 * Check if hunt is full
 */
export function isHuntFull(
  confirmedCount: number,
  capacity?: number | null
): boolean {
  if (!capacity) return false;
  return confirmedCount >= capacity;
}

/**
 * Get spots available text
 */
export function getSpotsAvailableText(
  confirmedCount: number,
  capacity?: number | null
): string {
  if (!capacity) return "Unlimited spots";

  const spotsLeft = capacity - confirmedCount;

  if (spotsLeft <= 0) return "Full";
  if (spotsLeft === 1) return "1 spot left";
  return `${spotsLeft} spots left`;
}
