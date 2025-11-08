# Hunt Participation Edge Cases - Implementation Status

**Last Updated**: October 16, 2025
**Status**: 2/5 Implemented

---

## Overview

This document tracks the implementation status of edge cases documented in `HUNT_PARTICIPATION_LOGIC.md`.

---

## Edge Case #1: User Pays but Owner Never Confirms ✅ IMPLEMENTED

### Scenario
- User completes payment (`paymentStatus = "received"`)
- Owner never confirms the payment
- User stuck in payment received state

### Expected Behavior
| Aspect | Behavior |
|--------|----------|
| Shows in "My Hunt" | ✅ Yes |
| Album access | ✅ Yes (payment received counts) |
| Counted on completion | ✅ Yes |
| Button state | "Leave Hunt" (can get refund) |

### Implementation Details

**File**: `/src/app/api/hunts/[id]/sightings/route.ts`

**Lines 38-43, 147-152**:
```typescript
// Check if user is confirmed participant or has received payment (Edge Case #1)
// Payment "received" counts as access granted even before owner confirmation
const isAuthorizedParticipant = hunt.participants.some(
  p => (p.status === "confirmed" || p.paymentStatus === "received") &&
  (p.paymentStatus === "confirmed" || p.paymentStatus === "received" || p.paymentStatus === null)
);
```

**Reasoning**: Once a user has paid, they should have access to the album even if the owner hasn't confirmed yet. This prevents owners from gatekeeping access after receiving payment.

---

## Edge Case #2: Hunt Capacity Increases While User on Waitlist 🔴 NOT IMPLEMENTED

### Scenario
- Hunt capacity increased from 10 to 15
- User on waitlist position #3
- Space now available

### Expected Behavior

**Option A - Manual Acceptance** (Current):
- User remains on waitlist
- Owner must manually accept from waitlist
- Preserves owner control

**Option B - Auto-Accept** (Future Enhancement):
- Auto-accept oldest waitlist members when capacity increases
- Send notification to accepted users
- More user-friendly

### Current Status
**Not Implemented** - Requires owner to manually accept waitlist members

### Proposed Implementation

**File**: `/src/app/api/hunts/[id]/route.ts` (PATCH endpoint)

**Trigger**: When hunt capacity is increased

```typescript
export async function PATCH(req, { params }) {
  const { capacity } = await req.json();
  const { id: huntId } = await params;

  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    include: {
      _count: {
        select: {
          participants: { where: { status: "confirmed" } }
        }
      }
    }
  });

  const oldCapacity = hunt.capacity;
  const newCapacity = capacity;
  const confirmedCount = hunt._count.participants;

  // Update capacity
  await prisma.hunt.update({
    where: { id: huntId },
    data: { capacity: newCapacity }
  });

  // Auto-accept waitlist if capacity increased
  if (newCapacity > oldCapacity) {
    const spotsAvailable = newCapacity - confirmedCount;

    if (spotsAvailable > 0) {
      // Get oldest waitlist members
      const waitlistMembers = await prisma.huntParticipant.findMany({
        where: {
          huntId,
          status: "waitlisted"
        },
        orderBy: {
          createdAt: "asc"
        },
        take: spotsAvailable
      });

      // Auto-accept them
      await Promise.all(
        waitlistMembers.map(member =>
          prisma.huntParticipant.update({
            where: { id: member.id },
            data: {
              status: hunt.isPaid ? "pending" : "confirmed",
              paymentStatus: hunt.isPaid ? "pending" : null
            }
          })
        )
      );

      // TODO: Send notifications to accepted users
    }
  }

  return NextResponse.json({ success: true });
}
```

**Priority**: MEDIUM - Enhancement for better UX

---

## Edge Case #3: User Leaves After Payment ✅ IMPLEMENTED

### Scenario
- User paid for hunt (`paymentStatus = "received"` or `"confirmed"`)
- User clicks "Leave Hunt"
- Refund should be triggered

### Expected Behavior
| Aspect | Behavior |
|--------|----------|
| Participant status | `status = "cancelled"` |
| Refund trigger | ✅ Triggered |
| Remove from "My Hunt" | ✅ Yes |
| No longer counted | ✅ Yes |

### Implementation Details

**File**: `/src/app/api/hunts/[id]/leave/route.ts`

**Lines 73-79**:
```typescript
// Edge Case #3: Trigger refund if user paid
// TODO: Implement refund logic when payment system is integrated
if (participant.paymentStatus === "pending" || participant.paymentStatus === "received") {
  // Trigger refund process here
  // This should call Stripe refund API or similar payment processor
  console.log(`Refund needed for participant ${participant.id} on hunt ${huntId}`);
}
```

**Current Status**: Placeholder for refund logic. Actual Stripe/payment integration needed.

**Next Steps**:
1. Integrate payment processor (Stripe recommended)
2. Store payment intent ID in `HuntParticipant` table
3. Call refund API when user leaves
4. Update `paymentStatus = "refunded"`

---

## Edge Case #4: Hunt Becomes Public After User Requested 🔴 NOT IMPLEMENTED

### Scenario
- Private hunt (user submitted pending request)
- Owner changes hunt to public
- New users can join directly
- Original requesters still need approval

### Expected Behavior
- Pending requests still require owner approval
- New users can join directly (no approval needed)
- Owner can bulk-accept all pending requests
- Fair to users who requested when private

### Current Status
**Not Implemented** - No special handling when hunt visibility changes

### Proposed Implementation

**File**: `/src/app/api/hunts/[id]/requests/bulk-accept/route.ts` (NEW)

```typescript
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id: huntId } = await params;

  // Verify owner
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId, userId: session.user.id }
  });

  if (!hunt) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Accept all pending requests
  await prisma.huntParticipant.updateMany({
    where: {
      huntId,
      status: "pending",
      paymentStatus: null // Only free hunt requests
    },
    data: {
      status: "confirmed"
    }
  });

  return NextResponse.json({ success: true });
}
```

**Priority**: LOW - Edge case, low frequency

---

## Edge Case #5: Multiple Hunt States in "My Hunt" 🔴 NOT IMPLEMENTED

### Scenario
- User has 10 hunts they're part of
- Different states: 3 confirmed, 2 pending payment, 2 pending requests, 1 waitlisted
- UI should group by state for clarity

### Expected Behavior

**Display Groups**:
1. **Confirmed Hunts** (green badge)
2. **Pending Payments** (orange badge)
3. **Pending Requests** (purple badge)
4. **Waitlisted Hunts** (blue badge)

### Current Status
**Not Implemented** - All hunts shown in single list, no grouping

### Proposed Implementation

**File**: `/src/app/(main)/hunts/my-hunts/page.tsx` (Frontend)

```typescript
function MyHuntsPage() {
  const { data: hunts } = useSWR("/api/hunts/my-hunts");

  // Group hunts by user's participation state
  const groupedHunts = {
    confirmed: [],
    pendingPayment: [],
    pendingRequest: [],
    waitlisted: []
  };

  hunts?.forEach(hunt => {
    const participant = hunt.participants.find(p => p.userId === currentUserId);

    if (participant.status === "confirmed") {
      groupedHunts.confirmed.push(hunt);
    } else if (participant.status === "pending" && hunt.isPaid) {
      groupedHunts.pendingPayment.push(hunt);
    } else if (participant.status === "pending") {
      groupedHunts.pendingRequest.push(hunt);
    } else if (participant.status === "waitlisted") {
      groupedHunts.waitlisted.push(hunt);
    }
  });

  return (
    <div>
      {groupedHunts.confirmed.length > 0 && (
        <section>
          <h2>Confirmed Hunts</h2>
          <div className="grid">
            {groupedHunts.confirmed.map(hunt => <HuntCard key={hunt.id} hunt={hunt} />)}
          </div>
        </section>
      )}

      {groupedHunts.pendingPayment.length > 0 && (
        <section>
          <h2>Pending Payment</h2>
          <div className="grid">
            {groupedHunts.pendingPayment.map(hunt => <HuntCard key={hunt.id} hunt={hunt} />)}
          </div>
        </section>
      )}

      {/* ... similar sections for pending requests and waitlist ... */}
    </div>
  );
}
```

**Priority**: MEDIUM - Improves UX when users join many hunts

---

## Summary

| Edge Case | Status | Priority | Estimated Time |
|-----------|--------|----------|----------------|
| #1: Payment received but never confirmed | ✅ IMPLEMENTED | HIGH | Completed |
| #2: Capacity increases with waitlist | 🔴 NOT IMPLEMENTED | MEDIUM | 2-3 hours |
| #3: User leaves after payment (refund) | ✅ IMPLEMENTED | HIGH | Completed (placeholder) |
| #4: Hunt visibility changes | 🔴 NOT IMPLEMENTED | LOW | 1-2 hours |
| #5: Multiple states in My Hunt | 🔴 NOT IMPLEMENTED | MEDIUM | 3-4 hours |

**Total Remaining Work**: 6-9 hours

---

## Next Steps

### Immediate (High Priority)
1. ✅ **COMPLETED**: Implement Edge Case #1 (payment received access)
2. ✅ **COMPLETED**: Implement Edge Case #3 placeholder (refund trigger)

### Short Term (This Sprint)
3. **TODO**: Integrate actual payment processor for refunds
4. **TODO**: Implement Edge Case #5 (grouped My Hunts UI)

### Long Term (Next Sprint)
5. **TODO**: Implement Edge Case #2 (auto-accept waitlist on capacity increase)
6. **TODO**: Implement Edge Case #4 (bulk accept requests)

---

## Testing Checklist

### Edge Case #1 - Payment Received Access
- [ ] User pays for hunt (`paymentStatus = "received"`)
- [ ] Verify user appears in "My Hunt"
- [ ] Verify user can access shared album
- [ ] Verify hunt is counted on completion
- [ ] Verify owner can still confirm payment

### Edge Case #3 - Refund on Leave
- [ ] User with pending payment leaves hunt
- [ ] Verify `status = "cancelled"`
- [ ] Verify refund trigger is logged
- [ ] Verify user removed from "My Hunt"
- [ ] Verify cached count decremented correctly

---

**End of Document**
