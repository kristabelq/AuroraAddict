# Hunt Participation Logic - Audit Findings

**Date**: October 16, 2025
**Auditor**: System Review
**Status**: ✅ PHASE 1 & 2 COMPLETE

---

## Executive Summary

Audited hunt participation endpoints against documented business logic. Found **6 critical bugs** and **3 missing features**.

**Phase 1 & 2 Status**: ✅ All 6 bugs FIXED
**Phase 3 Status**: 🔴 2 missing features remain (request approval & waitlist acceptance endpoints)

---

## Critical Bugs Found

### 🔴 BUG #1: My-Hunts Missing Pending Payment & Waitlist States
**File**: `/src/app/api/hunts/my-hunts/route.ts` (Line 57)
**Severity**: HIGH
**Impact**: Users cannot see hunts where they're pending payment or waitlisted

**Current Code**:
```typescript
where: {
  participants: {
    some: {
      userId: session.user.id,
      status: "confirmed", // ❌ ONLY shows confirmed!
    },
  },
}
```

**Expected Behavior** (per documentation):
"My Hunt" should show hunts where user has:
- `status IN ("confirmed", "pending", "waitlisted")`

**Fix Required**:
```typescript
where: {
  participants: {
    some: {
      userId: session.user.id,
      status: { in: ["confirmed", "pending", "waitlisted"] }
    },
  },
}
```

**Test Case**:
- User joins paid hunt → status = "pending"
- Expected: Shows in "My Hunt" ✅
- Actual: Does NOT show ❌

---

### 🔴 BUG #2: Missing PaymentStatus Field in Join Endpoint
**File**: `/src/app/api/hunts/[id]/join/route.ts` (Lines 79-84, 109-114)
**Severity**: HIGH
**Impact**: Payment tracking broken for paid hunts

**Current Code** (Paid Hunt Join):
```typescript
prisma.huntParticipant.create({
  data: {
    huntId,
    userId: session.user.id,
    status,  // ❌ No paymentStatus field!
  },
})
```

**Expected Behavior**:
For paid hunts, should set `paymentStatus: "pending"`

**Fix Required**:
```typescript
prisma.huntParticipant.create({
  data: {
    huntId,
    userId: session.user.id,
    status,
    paymentStatus: hunt.isPaid ? "pending" : null,  // ✅ Add this
  },
})
```

---

### 🔴 BUG #3: Leave Hunt Not Updating Status to "Cancelled"
**File**: `/src/app/api/hunts/[id]/leave/route.ts` (Line 54)
**Severity**: MEDIUM
**Impact**: Cannot track who left hunts, breaks refund logic

**Current Code**:
```typescript
await prisma.huntParticipant.delete({
  where: { id: participant.id },
});
```

**Expected Behavior**:
Should update `status = "cancelled"` instead of deleting

**Fix Required**:
```typescript
await prisma.huntParticipant.update({
  where: { id: participant.id },
  data: { status: "cancelled" }
});
```

**Why**: Need to track cancellations for:
- Refund processing
- Analytics (who leaves hunts)
- Audit trail

---

### 🔴 BUG #4: My-Hunts Has N+1 Query Pattern
**File**: `/src/app/api/hunts/my-hunts/route.ts` (Lines 114-174)
**Severity**: MEDIUM
**Impact**: Performance degradation as hunts grow

**Current Code**:
```typescript
const huntsWithSuccessRate = await Promise.all(
  allHunts.map(async (hunt) => {
    // ❌ Queries sightings for EVERY completed hunt!
    const sightingsWithDates = await prisma.sighting.findMany({
      where: { huntId: hunt.id, sightingDate: { not: null } }
    });
  })
);
```

**Expected Behavior**:
Use cached hunt stats (already implemented)

**Fix Required**:
```typescript
if (isCompleted) {
  return {
    ...hunt,
    startDate: hunt.startDate.toISOString(),
    endDate: hunt.endDate.toISOString(),
    successRate: hunt.cachedSuccessRate?.toFixed(1) || "0.0",  // ✅ Use cached
    sightingsCount: hunt.cachedSightingsCount || 0,
    huntLengthDays,
    uniqueParticipants: hunt.cachedUniqueParticipants || 0,
  };
}
```

---

### 🔴 BUG #5: Wrong Capacity Count Logic
**File**: `/src/app/api/hunts/[id]/join/route.ts` (Line 67)
**Severity**: HIGH
**Impact**: Capacity enforcement broken

**Current Code**:
```typescript
const isAtCapacity = hunt.capacity && hunt._count.participants >= hunt.capacity;
```

**Problem**: Counts both "confirmed" AND "pending" participants

**Expected Behavior**:
Only count "confirmed" participants for capacity

**Already Fixed**: Lines 26-29 correctly count only confirmed/pending, but should be:
```typescript
_count: {
  select: {
    participants: {
      where: { status: "confirmed" }  // ✅ Only confirmed
    }
  }
}
```

---

### 🔴 BUG #6: Cached Hunts Joined Count Incorrect
**File**: `/src/app/api/hunts/[id]/join/route.ts` (Lines 86-91, 116-121, 144-149)
**Severity**: LOW
**Impact**: User stats inaccurate

**Current Code**:
```typescript
prisma.user.update({
  where: { id: session.user.id },
  data: {
    cachedHuntsJoinedCount: { increment: 1 },  // ❌ Increments for ALL joins
  },
})
```

**Problem**: Increments even for pending/waitlist joins

**Expected Behavior**:
Only increment `cachedHuntsJoinedCount` when `status = "confirmed"`

**Fix Required**:
```typescript
// Only increment if confirmed
...(status === "confirmed" && {
  user: prisma.user.update({
    where: { id: session.user.id },
    data: { cachedHuntsJoinedCount: { increment: 1 } }
  })
})
```

---

## Missing Features

### ⚠️ MISSING #1: Album Access Authorization
**File**: `/src/app/api/hunts/[id]/sightings/route.ts`
**Severity**: HIGH
**Impact**: Anyone can access hunt albums (security issue)

**Current**: No access control
**Expected**: Authorize based on:
```typescript
const participant = await prisma.huntParticipant.findFirst({
  where: {
    huntId,
    userId: currentUserId,
    status: "confirmed",
    OR: [
      { paymentStatus: "confirmed" },
      { paymentStatus: null }  // Free hunt
    ]
  }
});

if (!participant && hunt.userId !== currentUserId) {
  return { error: "Access denied", status: 403 };
}
```

---

### ⚠️ MISSING #2: Request Approval Endpoint
**File**: Does not exist
**Location**: Should be `/src/app/api/hunts/[id]/requests/[userId]/route.ts`
**Severity**: MEDIUM
**Impact**: Hunt owners cannot approve pending requests

**Required**:
```typescript
export async function PATCH(req, { params }) {
  // Owner approves pending request
  await prisma.huntParticipant.update({
    where: { id: participantId },
    data: { status: "confirmed" }  // or "pending" if paid
  });
}
```

---

### ⚠️ MISSING #3: Waitlist Acceptance Endpoint
**File**: Does not exist
**Location**: Should be `/src/app/api/hunts/[id]/waitlist/[userId]/route.ts`
**Severity**: MEDIUM
**Impact**: Hunt owners cannot accept waitlisted users

**Required**:
```typescript
export async function PATCH(req, { params }) {
  // Check capacity
  // Move from waitlist to confirmed/pending
  await prisma.huntParticipant.update({
    where: { id: participantId },
    data: { status: hunt.isPaid ? "pending" : "confirmed" }
  });
}
```

---

## Summary of Issues

| # | Issue | Severity | File | Fix Status |
|---|-------|----------|------|------------|
| 1 | My-Hunts missing pending/waitlist | HIGH | my-hunts/route.ts | ✅ FIXED |
| 2 | Missing paymentStatus field | HIGH | join/route.ts | ✅ FIXED |
| 3 | Leave hunt deletes instead of cancels | MEDIUM | leave/route.ts | ✅ FIXED |
| 4 | My-Hunts N+1 query pattern | MEDIUM | my-hunts/route.ts | ✅ FIXED |
| 5 | Wrong capacity count logic | HIGH | join/route.ts | ✅ FIXED |
| 6 | Cached hunts joined count wrong | LOW | join/route.ts | ✅ FIXED |
| 7 | No album access authorization | HIGH | sightings/route.ts | ✅ FIXED |
| 8 | No request approval endpoint | MEDIUM | N/A | 🔴 Missing |
| 9 | No waitlist acceptance endpoint | MEDIUM | N/A | 🔴 Missing |

**Total Issues**: 9 (6 bugs + 3 missing features)
**Critical**: 4
**High**: 4
**Medium**: 3
**Low**: 1

---

## Impact Analysis

### User Experience Breaks
1. ✅ FIXED: Users with pending payments can now see their hunts
2. ✅ FIXED: Waitlisted users can now see their status
3. ✅ FIXED: Payment status is now properly tracked
4. 🔴 REMAINING: Owners can't approve requests or accept waitlist (Phase 3)

### Security Issues
1. ✅ FIXED: Album access now requires payment confirmation for paid hunts

### Data Integrity Issues
1. ✅ FIXED: Hunt stats now use cached values
2. ✅ FIXED: User stats counts are now accurate
3. ✅ FIXED: Cancellations now preserved with status="cancelled" (audit trail maintained)

### Performance Issues
1. ✅ FIXED: My-Hunts endpoint now uses cached stats (N+1 query eliminated)

---

## Recommended Fix Priority

### Phase 1: Critical Security & Data Integrity (Today)
1. ✅ Fix Bug #1: My-Hunts missing states
2. ✅ Fix Bug #2: Add paymentStatus field
3. ✅ Fix Bug #7: Album access authorization
4. ✅ Fix Bug #3: Update to cancelled (not delete)

### Phase 2: Performance & Accuracy (This Week)
5. ✅ Fix Bug #4: Use cached stats in My-Hunts
6. ✅ Fix Bug #5: Correct capacity count
7. ✅ Fix Bug #6: Fix cached count logic

### Phase 3: Missing Features (Next Week)
8. 🔴 TODO: Implement request approval endpoint
9. 🔴 TODO: Implement waitlist acceptance endpoint

---

## Next Steps

1. ✅ **COMPLETED**: All 6 critical bugs fixed (Phase 1 & 2)
2. 🔴 **TODO**: Implement missing features (Phase 3)
   - Request approval endpoint
   - Waitlist acceptance endpoint
3. 🔴 **TODO**: Write integration tests - Ensure fixes work correctly
4. 🔴 **TODO**: Manual testing - Test all hunt participation scenarios

---

## Fixes Applied (October 16, 2025)

1. **Bug #1**: Updated `/src/app/api/hunts/my-hunts/route.ts:57` to include `pending` and `waitlisted` statuses
2. **Bug #2**: Added `paymentStatus` field to all participant creation in `/src/app/api/hunts/[id]/join/route.ts`
3. **Bug #3**: Changed delete to update with `status="cancelled"` in `/src/app/api/hunts/[id]/leave/route.ts:54`
4. **Bug #4**: Replaced N+1 queries with cached stats in `/src/app/api/hunts/my-hunts/route.ts:114-141`
5. **Bug #5**: Fixed capacity count to only include confirmed participants in `/src/app/api/hunts/[id]/join/route.ts:27`
6. **Bug #6**: Only increment `cachedHuntsJoinedCount` for confirmed joins in `/src/app/api/hunts/[id]/join/route.ts`
7. **Bug #7**: Added payment status check to album access in `/src/app/api/hunts/[id]/sightings/route.ts:38-50,146-158`

---

**End of Audit Report**
