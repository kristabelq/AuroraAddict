# Hunt Logic Edge Cases Analysis

## Flowchart Coverage Analysis

The flowchart covers **24 use cases** across different hunt configurations:
- **Privacy**: Public vs Private
- **Visibility**: Visible in Hunts vs Hidden
- **Cost**: Free vs Paid Hunt
- **Meeting Point**: Show vs Hide Location
- **Availability**: Available vs Limit Reached

## ✅ Cases Covered in Flowchart

All 24 basic happy paths and some rejection scenarios are covered.

## ⚠️ EDGE CASES NOT COVERED IN FLOWCHART

### 1. Timing & Expiration Edge Cases

#### 1.1 Hunt Start Time Conflicts
**Scenario**: User actions near hunt start time
- ❌ User joins 1 minute before hunt starts
- ❌ User pays 30 seconds before hunt starts
- ❌ Owner accepts request after hunt has started
- ❌ Waitlist cleanup doesn't happen before start

**Missing Logic**:
- Should block joins X minutes before start?
- What happens to pending payments at start time?
- Auto-cancel all non-confirmed participants at start?

**Implementation Status**: ✅ Partially handled
- Expiration set to 1 second before hunt starts
- Cleanup job clears waitlist before start
- **Need to add**: Block joins within last hour

#### 1.2 Payment Timeout Edge Cases
**Scenario**: "7 days OR 24 hours before hunt"
- ❌ Hunt is in 5 days, payment timeout should be 5 days not 7
- ❌ Hunt is in 2 hours, payment timeout should be 2 hours not 7 days
- ✅ Correctly calculated to whichever is SOONER

**Missing in Flowchart**: Clear indication of "whichever is sooner" logic

#### 1.3 Hunt End Time
**Scenario**: What happens after hunt ends?
- ❌ Can users still leave after hunt ends?
- ❌ Can owner still manage participants after hunt ends?
- ❌ Should hunt be "locked" after end time?
- ❌ What happens to unconfirmed participants?

**Missing Logic**: Post-hunt cleanup and locking

### 2. Capacity & Waitlist Edge Cases

#### 2.1 Capacity Changes Mid-Flow
**Scenario**: Owner changes capacity while users are joining
- ❌ Capacity increases from 5 to 10 → Should waitlisted users auto-promote?
- ❌ Capacity decreases from 10 to 5 with 8 confirmed → Which 3 get removed?
- ❌ Capacity removed (set to null) → Do all waitlisted users confirm?

**Missing Logic**: Dynamic capacity adjustment handling

**Implementation Status**: ⚠️ Partially handled
- Settings change blocked if users in transition
- **Need to add**: Capacity increase auto-promotion

#### 2.2 Waitlist Without Capacity
**Scenario**: `allowWaitlist = true` but `capacity = null`
- ❌ Waitlist makes no sense without capacity
- ❌ Should prevent this configuration

**Missing Logic**: Validation that waitlist requires capacity

#### 2.3 Multiple Simultaneous Waitlist Promotions
**Scenario**: 3 users leave at once, 5 on waitlist
- ❌ Which 3 get promoted?
- ❌ Race condition handling
- ✅ FIFO implemented via `waitlistPosition`

#### 2.4 Waitlist Position Gaps
**Scenario**: Users leave waitlist creating gaps
- User at position 1 leaves
- User at position 3 is now position 1?
- ❌ Should positions be recalculated or preserved?

**Missing Logic**: Waitlist position management

### 3. Payment Edge Cases

#### 3.1 Partial Payments
**Scenario**: Stripe allows partial payments
- ❌ User pays 50% of amount
- ❌ Payment succeeds but for wrong amount
- ❌ Currency mismatch

**Missing Logic**: Amount validation in webhook

#### 3.2 Refund Scenarios
**Scenario**: User requests refund after payment
- ❌ User paid, then owner cancels hunt
- ❌ User paid, then owner rejects them (shouldn't happen but...)
- ❌ User paid, then changes mind
- ✅ Noted as "owner discretion" but no workflow

**Missing Logic**: Refund request workflow

#### 3.3 Payment Provider Failures
**Scenario**: Stripe is down or account issues
- ❌ Stripe webhook fails to deliver
- ❌ Owner's Stripe account suspended
- ❌ Payment succeeds but webhook fails

**Missing Logic**: Payment reconciliation and recovery

#### 3.4 Double Payment Prevention
**Scenario**: User clicks "Pay" multiple times
- ✅ Handled via `isPaymentProcessing` flag
- ✅ Webhook unlocks on cancel/expire
- **But not shown in flowchart**

### 4. Owner Actions Edge Cases

#### 4.1 Owner Leaving Their Own Hunt
**Scenario**: Can the owner leave their own hunt?
- ❌ Owner is always a participant
- ❌ Should block or require hunt deletion?

**Implementation Status**: ✅ Handled - owner can't leave

#### 4.2 Owner Deleting Hunt
**Scenario**: Owner deletes hunt with participants
- ❌ Free hunt with confirmed users → Just cancel?
- ❌ Paid hunt with payments → Must contact support
- ✅ Implemented but not in flowchart

#### 4.3 Owner Payment Collection
**Scenario**: Owner needs to receive payments
- ❌ Owner hasn't set up Stripe account
- ❌ Owner's bank details invalid
- ✅ Checked before paid hunt creation

#### 4.4 Owner Accepts More Than Capacity
**Scenario**: Owner manually accepts 11 users for 10-person hunt
- ❌ System should prevent this
- ❌ Or auto-expand capacity?

**Missing Logic**: Capacity enforcement on owner actions

### 5. State Transition Edge Cases

#### 5.1 Settings Changes During Transitions
**Scenario**: Owner changes hunt settings while users pending
- ✅ Blocked if users in transition
- ✅ Auto-accept if private→public
- **But flowchart doesn't show this**

#### 5.2 User in Multiple Hunts
**Scenario**: Same user in different hunts
- ❌ User joins 5 hunts at same time
- ❌ Payment processing for multiple hunts
- ❌ Should there be a limit?

**Missing Logic**: User participation limits (if any)

#### 5.3 Concurrent State Changes
**Scenario**: Race conditions
- ❌ User clicks "Leave" while owner clicks "Accept"
- ❌ User pays while request expires
- ❌ Two users join at exactly same time for last spot

**Missing Logic**: Optimistic locking or transaction handling

### 6. Rejection & Blocking Edge Cases

#### 6.1 Rejection Counter
**Scenario**: User rejected 3 times
- ✅ Blocked from joining again
- ❌ Can owner manually override block?
- ❌ Does block expire? (e.g., after 30 days)
- ❌ Counter per hunt or global?

**Implementation**: ✅ Per hunt, permanent block
**Missing in Flowchart**: Block indication

#### 6.2 Rejection of Waitlisted Users
**Scenario**: Owner rejects user on waitlist
- ✅ Removes from waitlist
- ✅ Increments rejection counter
- ❌ Should this count as a rejection?

**Missing Logic**: Waitlist rejection policy

### 7. Notification & Communication Edge Cases

#### 7.1 Missing Notifications
**Scenario**: User doesn't receive status change notifications
- ❌ Email not delivered
- ❌ User's responsibility to check
- **Not covered in flowchart at all**

#### 7.2 Language & Timezone
**Scenario**: International hunts
- ❌ Hunt in Iceland, user in Japan
- ❌ Timezone confusion for start time
- ✅ Stored with timezone but UI might confuse

**Missing Logic**: Clear timezone display

### 8. Data Integrity Edge Cases

#### 8.1 Orphaned Records
**Scenario**: Database inconsistencies
- ❌ Hunt deleted but participants remain (cascade delete should handle)
- ❌ User deleted but participations remain (cascade delete should handle)
- ✅ Schema has cascade deletes

#### 8.2 Invalid State Combinations
**Scenario**: Data corruption or bugs
- ❌ User is both "confirmed" and "waitlisted"
- ❌ Participant has `paidAt` but `paymentStatus = 'pending'`
- ❌ Hunt is `isPaid = false` but has `price = 100`

**Missing Logic**: Data validation constraints

### 9. Privacy & Security Edge Cases

#### 9.1 Hidden Hunt Access
**Scenario**: Hidden from public hunts
- ❌ How do users find hidden hunts? (Direct link only?)
- ❌ Can users share the link?
- ❌ Should there be a password?

**Missing Logic**: Hidden hunt access control

#### 9.2 Private Hunt Invitations
**Scenario**: How do users know about private hunts?
- ❌ Owner must manually invite?
- ❌ Users can request if they find it?
- **Assumes users can find and request**

#### 9.3 Data Visibility
**Scenario**: Who can see what?
- ❌ Can pending users see confirmed participants?
- ❌ Can waitlisted users see their position?
- ❌ Hide location until confirmed?
- ✅ `hideLocation` flag exists but visibility rules unclear

### 10. Performance & Scale Edge Cases

#### 10.1 Large Capacity Hunts
**Scenario**: Hunt with 1000 participants
- ❌ All 1000 get waitlisted
- ❌ Promoting users becomes slow
- ❌ Notification spam

**Missing Logic**: Pagination and batch processing

#### 10.2 Spam Prevention
**Scenario**: User spams join/leave
- ❌ Join and leave 100 times
- ❌ Request to join 50 different hunts
- ❌ Rate limiting?

**Missing Logic**: Rate limiting and abuse prevention

## CRITICAL EDGE CASES (MUST FIX)

### Priority 1: High Risk
1. **Hunt start time enforcement** - Block joins too close to start
2. **Capacity enforcement on owner actions** - Prevent over-acceptance
3. **Payment amount validation** - Verify correct amount paid
4. **Concurrent join race conditions** - Last spot conflicts

### Priority 2: Important
5. **Capacity increase auto-promotion** - Waitlist users auto-confirm
6. **Waitlist without capacity validation** - Prevent invalid config
7. **Post-hunt cleanup** - Lock hunt after end time
8. **Rejection counter reset** - After X days or manual override

### Priority 3: Nice to Have
9. **Refund workflow** - User-initiated refund requests
10. **Notification failure handling** - Retry or user dashboard
11. **Hidden hunt access control** - Password or invite-only
12. **Rate limiting** - Prevent spam

## MISSING TRANSITION STATES IN FLOWCHART

The flowchart shows final states but misses intermediate states:

### Not Shown:
1. **`isPaymentProcessing`** - Prevents double payment
2. **`rejectionCount`** - Tracks rejections for blocking
3. **`waitlistPosition`** - Determines promotion order
4. **`requestExpiresAt`** - Automatic expiration
5. **`lastRejectedAt`** - Audit trail

### Transition Not Shown:
- Pending → Cancelled (on timeout)
- Waitlisted → Pending (on acceptance for private hunts)
- Pending → Waitlisted (when capacity added after request)
- Any state → Cancelled (user leaves)

## RECOMMENDATIONS

### 1. Add Missing States to Flowchart
- Show "Expired" as distinct from "Cancelled"
- Show "Blocked" state for 3+ rejections
- Show "Processing Payment" as intermediate state

### 2. Add Timeout Indicators
- Visual timer showing expiration
- Clear "whichever is sooner" logic

### 3. Add Constraint Validations
- Capacity > 0 if allowWaitlist = true
- Price > 0 if isPaid = true
- Owner has Stripe account if isPaid = true
- Owner has verified email if isPaid = true

### 4. Add Error States
- Payment failed (retryable)
- Request expired (can rejoin)
- Hunt cancelled by owner
- User blocked from hunt

### 5. Add Owner Override Paths
- Force accept despite capacity
- Unblock user (reset rejection counter)
- Cancel hunt with refunds

## TEST COVERAGE SUMMARY

### ✅ Covered in Tests
- All 24 basic use cases
- Leave hunt functionality
- Waitlist promotion
- Payment timeout
- Rejection counter
- State transitions

### ⚠️ Needs Additional Tests
- Capacity change scenarios
- Payment amount validation
- Race conditions
- Post-hunt actions
- Hidden hunt access
- Rejection counter reset
- Block override

### ❌ Not Yet Tested
- Stripe webhook failures
- Email notification failures
- Concurrent user actions
- Large-scale performance
- Timezone edge cases

---

**Created**: January 2025
**Based On**: Hunt Logic.pdf flowchart
**Version**: 1.0.0
