# Hunt Participation Logic & State Machine

**Last Updated**: October 16, 2025
**Version**: 1.0

---

## Overview

This document defines the complete state machine for hunt participation, including button states, access permissions, and hunt counting logic.

---

## Participation States

### Primary States

| State | Color | Description |
|-------|-------|-------------|
| **Join Hunt** | Green | User can join the hunt (public, not a participant) |
| **Confirmed** | Green | User is confirmed participant (payment received or free hunt) |
| **Pending Payment** | Orange | User joined but payment not yet received |
| **Payment Received** | Orange | Payment received, awaiting owner confirmation |
| **Pending Request** | Purple | User requested to join (private hunt, awaiting approval) |
| **Request to Join** | Purple | User can request to join (private hunt, not a participant) |
| **Join Waitlist** | Blue | Hunt at capacity, user can join waitlist |
| **Leave Waitlist** | Blue | User is on waitlist |
| **Leave Hunt** | Red | User can leave the hunt |

---

## State Machine Diagrams

### Public Hunt - No Capacity Limit - Free

```
Initial State: Join Hunt (Green)
    ↓ User clicks "Join Hunt"
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red) → Back to Join Hunt
```

### Public Hunt - No Capacity Limit - Paid

```
Initial State: Join Hunt (Green)
    ↓ User clicks "Join Hunt"
Pending Payment (Orange)
    ↓ Payment completed
Payment Received (Orange)
    ↓ Owner confirms payment
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red) → Back to Join Hunt
```

### Private Hunt - No Capacity Limit - Free

```
Initial State: Request to Join (Purple)
    ↓ User clicks "Request to Join"
Pending Request (Purple)
    ↓ Owner accepts request
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red) → Back to Request to Join
```

### Private Hunt - No Capacity Limit - Paid

```
Initial State: Request to Join (Purple)
    ↓ User clicks "Request to Join"
Pending Request (Purple)
    ↓ Owner accepts request
Pending Payment (Orange)
    ↓ Payment completed
Payment Received (Orange)
    ↓ Owner confirms payment
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red) → Back to Request to Join
```

### Public/Private Hunt - At Capacity - Free

```
Initial State: Join Waitlist (Blue)
    ↓ User clicks "Join Waitlist"
Leave Waitlist (Blue)
    ↓ Owner accepts from waitlist
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red)
```

### Public/Private Hunt - At Capacity - Paid

```
Initial State: Join Waitlist (Blue)
    ↓ User clicks "Join Waitlist"
Leave Waitlist (Blue)
    ↓ Owner accepts from waitlist
Pending Payment (Orange)
    ↓ Payment completed
Payment Received (Orange)
    ↓ Owner confirms payment
Confirmed (Green)
    ↓ User clicks "Leave Hunt"
Leave Hunt (Red)
```

---

## Button Display Logic

### Button States by Location

| # | Button on Event Card | Button on Event Detail Page | User is Participant? | Access to Shared Album? | Show in "My Hunt"? | Hunt Counted for User? |
|---|---------------------|----------------------------|---------------------|------------------------|-------------------|----------------------|
| 1 | Join Hunt (Green) | Join Hunt (Green) | No | No | No | No |
| 2 | Leave Hunt (Red) | **Confirmed (Green)** → Leave Hunt (Red) | **Yes** | **Yes** | **Yes** | **Yes** |
| 3 | Pending Payment (Orange) | Pending Payment (Orange) → Leave Hunt (Red) | No | No | **Yes** | No |
| 4 | Leave Hunt (Red) | **Payment Received (Orange)** → Leave Hunt (Red) | **Yes** | **Yes** | **Yes** | **Yes** |
| 5 | Join Waitlist (Blue) | Join Waitlist (Blue) | No | No | No | No |
| 6 | Leave Waitlist (Blue) | Leave Waitlist (Blue) | No | No | **Yes** | No |
| 7 | Request to Join (Purple) | Request to Join (Purple) | No | No | No | No |
| 8 | Pending Request (Purple) | Pending Request (Purple) | No | No | **Yes** | No |

### Key Insights from Button States

**Event Detail Page Shows Different Button Than Event Card:**
- State #2 (Confirmed): Card shows "Leave Hunt", Detail shows "Confirmed" with "Leave Hunt" option
- State #4 (Payment Received): Card shows "Leave Hunt", Detail shows "Payment Received" with "Leave Hunt" option

**"My Hunt" Visibility:**
- Shows hunts where user has taken action (even if not confirmed)
- States shown: Confirmed, Payment Received, Pending Payment, Leave Waitlist, Pending Request
- NOT shown: Join Hunt, Request to Join, Join Waitlist (initial states)

**Hunt Counted for User (Upon Completion):**
- Only states #2 and #4 count (Confirmed, Payment Received)
- These are the only states where user is a confirmed participant
- Pending payments, waitlist, and pending requests DO NOT count

**Shared Album Access:**
- Only confirmed participants (states #2, #4) can access shared album
- Album contains sightings from all confirmed participants

---

## Database Schema

### HuntParticipant Status Values

```typescript
type ParticipantStatus =
  | "pending"      // Requested to join (private hunt)
  | "confirmed"    // Confirmed participant
  | "cancelled"    // User left the hunt
  | "waitlisted"   // On waitlist (capacity reached)
```

### HuntParticipant Payment Status Values

```typescript
type PaymentStatus =
  | "pending"      // Payment not yet made
  | "received"     // Payment received, awaiting confirmation
  | "confirmed"    // Payment confirmed by owner
```

---

## Business Rules

### Rule 1: Hunt Counting for User Stats
**When**: Hunt completes (endDate < now)
**Count**: Only participants with `status = "confirmed"` AND (`paymentStatus = "confirmed"` OR hunt is free)

### Rule 2: Shared Album Access
**Requirement**: Participant must have:
- `status = "confirmed"`
- AND (`paymentStatus = "confirmed"` OR hunt is free)

### Rule 3: "My Hunt" Display
**Show hunt if**: User has `HuntParticipant` record with:
- `status IN ("confirmed", "pending", "waitlisted")`
- OR `paymentStatus IN ("pending", "received")`

### Rule 4: Capacity Management
**At capacity when**:
```typescript
confirmedCount >= hunt.capacity (if capacity is set)
```

**Accept from waitlist**:
- Owner can manually accept waitlisted participants
- Changes `status` from "waitlisted" to "confirmed" (or "pending" if paid)
- If paid hunt, creates payment intent

### Rule 5: Payment Flow
**For paid hunts**:
1. User joins → `status = "pending"`, `paymentStatus = "pending"`
2. User pays → `paymentStatus = "received"`
3. Owner confirms → `status = "confirmed"`, `paymentStatus = "confirmed"`

**For free hunts**:
1. User joins (public) → `status = "confirmed"`, `paymentStatus = null`
2. User requests (private) → `status = "pending"`, `paymentStatus = null`
3. Owner accepts → `status = "confirmed"`, `paymentStatus = null`

---

## Complete State Table

Based on Image #1 (the comprehensive state diagram):

### Column Definitions
- **Event Settings**: Public/Private, Hide/Unhide from Public, Free/Paid, Hide/Unhide Location
- **Initial Button**: First action available to non-participants
- **After User Action**: State after user clicks initial button
- **After Owner Action**: State after owner accepts/confirms
- **After Payment**: State after payment received (paid hunts only)
- **Final State**: Confirmed participant state
- **Exit Action**: How user leaves the hunt

### All Possible State Flows

See Image #1 for the complete 24-row state table covering all combinations of:
- Public/Private hunts
- With/Without capacity limits
- Free/Paid hunts
- Location visibility settings

---

## Test Cases

### Test Case 1: Public Free Hunt - Happy Path
```typescript
// Initial state
user.isParticipant = false
hunt.isPublic = true
hunt.isPaid = false
hunt.capacity = null

// Expected button: "Join Hunt" (Green)
// Expected in "My Hunt": No
// Expected album access: No

// After user joins
participant.status = "confirmed"
participant.paymentStatus = null

// Expected button: "Leave Hunt" (Red) on card, "Confirmed" on detail
// Expected in "My Hunt": Yes
// Expected album access: Yes
// Expected counted on completion: Yes
```

### Test Case 2: Public Paid Hunt - Full Flow
```typescript
// Initial state
hunt.isPublic = true
hunt.isPaid = true
hunt.price = 100

// Step 1: User joins
participant.status = "pending"
participant.paymentStatus = "pending"
// Expected button: "Pending Payment" (Orange)
// Expected in "My Hunt": Yes
// Expected album access: No
// Expected counted: No

// Step 2: User pays
participant.paymentStatus = "received"
// Expected button: "Leave Hunt" (Red) on card, "Payment Received" on detail
// Expected in "My Hunt": Yes
// Expected album access: Yes (payment received counts)
// Expected counted: Yes

// Step 3: Owner confirms
participant.status = "confirmed"
participant.paymentStatus = "confirmed"
// Expected button: "Leave Hunt" (Red) on card, "Confirmed" on detail
// Expected in "My Hunt": Yes
// Expected album access: Yes
// Expected counted: Yes
```

### Test Case 3: Private Free Hunt
```typescript
// Initial state
hunt.isPublic = false
hunt.isPaid = false

// Step 1: User requests
participant.status = "pending"
participant.paymentStatus = null
// Expected button: "Pending Request" (Purple)
// Expected in "My Hunt": Yes
// Expected album access: No
// Expected counted: No

// Step 2: Owner accepts
participant.status = "confirmed"
// Expected button: "Leave Hunt" (Red) on card, "Confirmed" on detail
// Expected in "My Hunt": Yes
// Expected album access: Yes
// Expected counted: Yes
```

### Test Case 4: Public Hunt - At Capacity
```typescript
// Initial state
hunt.capacity = 10
hunt.confirmedParticipants = 10

// Expected button: "Join Waitlist" (Blue)

// After user joins waitlist
participant.status = "waitlisted"
// Expected button: "Leave Waitlist" (Blue)
// Expected in "My Hunt": Yes
// Expected album access: No
// Expected counted: No

// Owner accepts from waitlist
participant.status = "confirmed"
// Expected button: "Leave Hunt" (Red) on card, "Confirmed" on detail
// Expected in "My Hunt": Yes
// Expected album access: Yes
// Expected counted: Yes
```

### Test Case 5: User Leaves Hunt
```typescript
// User is confirmed participant
participant.status = "confirmed"

// User clicks "Leave Hunt"
participant.status = "cancelled"

// Expected button: Back to initial state (Join Hunt / Request to Join / Join Waitlist)
// Expected in "My Hunt": No
// Expected album access: No
// Expected counted: No
```

---

## API Endpoints Affected

### GET /api/hunts/upcoming
**Returns**: Hunt card data with button state for current user

**Logic**:
```typescript
const participantRecord = hunt.participants.find(p => p.userId === currentUserId);

if (!participantRecord) {
  // Not a participant
  if (hunt.capacity && confirmedCount >= hunt.capacity) {
    button = "Join Waitlist";
  } else if (!hunt.isPublic) {
    button = "Request to Join";
  } else {
    button = "Join Hunt";
  }
} else {
  // Is a participant
  if (participantRecord.status === "confirmed") {
    button = "Leave Hunt"; // Green on detail, Red on card
  } else if (participantRecord.status === "pending" && hunt.isPaid) {
    if (participantRecord.paymentStatus === "received") {
      button = "Leave Hunt"; // Payment Received on detail
    } else {
      button = "Pending Payment";
    }
  } else if (participantRecord.status === "pending") {
    button = "Pending Request";
  } else if (participantRecord.status === "waitlisted") {
    button = "Leave Waitlist";
  }
}
```

### GET /api/hunts/my-hunts
**Returns**: Hunts where user has participated

**Filter**:
```typescript
const myHunts = await prisma.hunt.findMany({
  where: {
    participants: {
      some: {
        userId: currentUserId,
        status: {
          in: ["confirmed", "pending", "waitlisted"]
        }
      }
    }
  }
});
```

### GET /api/hunts/[id]/album
**Returns**: Shared album of sightings

**Authorization**:
```typescript
const participant = await prisma.huntParticipant.findFirst({
  where: {
    huntId,
    userId: currentUserId,
    status: "confirmed",
    OR: [
      { paymentStatus: "confirmed" },
      { paymentStatus: null } // Free hunt
    ]
  }
});

if (!participant) {
  return { error: "Access denied", status: 403 };
}
```

### POST /api/hunts/[id]/join
**Creates participant record**

**Logic**:
```typescript
if (hunt.capacity && confirmedCount >= hunt.capacity) {
  // Add to waitlist
  await prisma.huntParticipant.create({
    data: {
      huntId,
      userId,
      status: "waitlisted"
    }
  });
} else if (!hunt.isPublic) {
  // Private hunt - request to join
  await prisma.huntParticipant.create({
    data: {
      huntId,
      userId,
      status: "pending",
      paymentStatus: hunt.isPaid ? "pending" : null
    }
  });
} else if (hunt.isPaid) {
  // Public paid hunt - create checkout session
  await prisma.huntParticipant.create({
    data: {
      huntId,
      userId,
      status: "pending",
      paymentStatus: "pending"
    }
  });
  // Redirect to Stripe checkout
} else {
  // Public free hunt - immediate confirmation
  await prisma.huntParticipant.create({
    data: {
      huntId,
      userId,
      status: "confirmed"
    }
  });
}
```

---

## Frontend Component Logic

### HuntCard Component
```typescript
function getButtonState(hunt, currentUserId) {
  const participant = hunt.participants?.find(p => p.userId === currentUserId);

  if (!participant) {
    // Not a participant
    if (hunt.capacity && hunt.confirmedCount >= hunt.capacity) {
      return { text: "Join Waitlist", color: "blue", action: "joinWaitlist" };
    }
    if (!hunt.isPublic) {
      return { text: "Request to Join", color: "purple", action: "requestJoin" };
    }
    return { text: "Join Hunt", color: "green", action: "joinHunt" };
  }

  // Is a participant
  switch (participant.status) {
    case "confirmed":
      return { text: "Leave Hunt", color: "red", action: "leaveHunt" };
    case "pending":
      if (hunt.isPaid) {
        if (participant.paymentStatus === "received") {
          return { text: "Leave Hunt", color: "red", action: "leaveHunt" };
        }
        return { text: "Pending Payment", color: "orange", action: "viewPayment" };
      }
      return { text: "Pending Request", color: "purple", action: "viewRequest" };
    case "waitlisted":
      return { text: "Leave Waitlist", color: "blue", action: "leaveWaitlist" };
    default:
      return { text: "Join Hunt", color: "green", action: "joinHunt" };
  }
}
```

### HuntDetail Component
```typescript
function getDetailButtonState(hunt, currentUserId) {
  const participant = hunt.participants?.find(p => p.userId === currentUserId);

  if (!participant) {
    // Same as card for non-participants
    return getButtonState(hunt, currentUserId);
  }

  // Detail page shows status prominently
  switch (participant.status) {
    case "confirmed":
      return {
        status: "Confirmed",
        statusColor: "green",
        action: { text: "Leave Hunt", color: "red" }
      };
    case "pending":
      if (hunt.isPaid && participant.paymentStatus === "received") {
        return {
          status: "Payment Received",
          statusColor: "orange",
          action: { text: "Leave Hunt", color: "red" }
        };
      }
      if (hunt.isPaid) {
        return {
          status: "Pending Payment",
          statusColor: "orange",
          action: { text: "Leave Hunt", color: "red" }
        };
      }
      return {
        status: "Pending Request",
        statusColor: "purple",
        action: null
      };
    case "waitlisted":
      return {
        status: "On Waitlist",
        statusColor: "blue",
        action: { text: "Leave Waitlist", color: "blue" }
      };
  }
}
```

---

## Success Rate Calculation

**Only counts participants with**:
- `status = "confirmed"`
- AND (`paymentStatus = "confirmed"` OR `paymentStatus IS NULL`)

**Formula**:
```typescript
const completedHunts = await prisma.hunt.findMany({
  where: {
    endDate: { lt: new Date() },
    participants: {
      some: {
        userId,
        status: "confirmed",
        OR: [
          { paymentStatus: "confirmed" },
          { paymentStatus: null }
        ]
      }
    }
  }
});

// Calculate success rate for each hunt
// Average all success rates = user's overall success rate
```

---

## Edge Cases

### Edge Case 1: User Pays but Owner Never Confirms
**State**: `status = "pending"`, `paymentStatus = "received"`
**Behavior**:
- Shows in "My Hunt": Yes
- Album access: Yes (payment received counts as confirmed for access)
- Counted on completion: Yes (payment received counts)
- Button: "Leave Hunt" (can refund)

### Edge Case 2: Hunt Capacity Increases While User on Waitlist
**Scenario**: Hunt capacity increased, space available
**Behavior**:
- User remains on waitlist (manual action required)
- Owner can accept from waitlist manually
- Alternative: Auto-accept oldest waitlist member when capacity increases

### Edge Case 3: User Leaves After Payment
**State**: User paid, then clicks "Leave Hunt"
**Behavior**:
- `status = "cancelled"`
- Trigger refund process
- Remove from "My Hunt"
- No longer counted

### Edge Case 4: Hunt Becomes Public After User Requested
**Scenario**: Private hunt becomes public, user has pending request
**Behavior**:
- Pending request still requires owner approval
- New users can join directly
- Owner can bulk-accept all pending requests

### Edge Case 5: Multiple Hunt States in "My Hunt"
**Scenario**: User is in different states for different hunts
**Display**: Group by state
- Confirmed Hunts (green)
- Pending Payments (orange)
- Pending Requests (purple)
- Waitlisted Hunts (blue)

---

## Notifications

### User Notifications
- **Request Accepted**: Private hunt request approved
- **Payment Confirmed**: Owner confirmed payment
- **Moved from Waitlist**: Accepted from waitlist
- **Hunt Reminder**: Hunt starting soon (for confirmed participants)
- **Payment Required**: Reminder for pending payments

### Owner Notifications
- **New Join Request**: User requested to join private hunt
- **Payment Received**: User completed payment
- **User Left Hunt**: Participant left the hunt
- **Waitlist Member**: New user joined waitlist

---

**End of Document**
