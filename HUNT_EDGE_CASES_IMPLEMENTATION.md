# Hunt Participation Edge Cases - Implementation Summary

## Overview
This document summarizes the implementation of edge case handling for the hunt participation system, addressing payment timeouts, waitlist management, request/approval flows, and state transition validation.

## Database Schema Changes

### HuntParticipant Model
Added fields to track edge cases:
- `requestExpiresAt: DateTime?` - When pending request/payment expires (7 days or 1 second before hunt starts)
- `rejectionCount: Int` - Number of times user has been rejected (default: 0, max: 3)
- `isPaymentProcessing: Boolean` - Prevents double payment attempts (default: false)
- `lastRejectedAt: DateTime?` - When last rejection occurred
- `waitlistPosition: Int?` - Position in waitlist for FIFO ordering

### Hunt Model
Added field to prevent invalid state transitions:
- `hasParticipantsInTransition: Boolean` - Tracks if hunt has users in pending/waitlisted states (default: false)

### Migration
Run the SQL script: `prisma/migrations/manual_add_edge_case_fields.sql`

## Edge Cases Handled

### 1. Payment-Related Edge Cases

#### Payment Timeout (7 days)
- **Rule**: User has 7 days to complete payment from joining, OR until 1 second before hunt starts (whichever is sooner)
- **Implementation**:
  - `calculateExpirationDate()` in `src/lib/huntEdgeCases.ts`
  - Set `requestExpiresAt` when user joins with pending payment
  - Cleanup job cancels expired payments

#### Payment Failure
- **Rule**: User returns to "Pending Payment" state, can retry within original 7-day window
- **Implementation**:
  - Webhook handler `handlePaymentFailed()` resets status to pending
  - Unlocks `isPaymentProcessing` flag
  - Preserves original expiration date

#### Double Payment Prevention
- **Rule**: Prevent user from triggering payment flow twice
- **Implementation**:
  - `canProcessPayment()` checks if payment is already processing
  - `markPaymentProcessing()` sets flag before Stripe checkout
  - Flag cleared on success/failure
  - User sees error: "Payment is already being processed. Please wait or refresh the page."

#### Owner Confirms Before Payment Received
- **Rule**: Owner should contact support if this happens
- **Implementation**: Warning in payment confirmation route (manual payment tracking)

### 2. Waitlist Edge Cases

#### Waitlist Priority (First Come First Serve)
- **Rule**: Always promote earliest user who joined waitlist
- **Implementation**:
  - Each waitlisted user gets `waitlistPosition` (incremental)
  - `getNextWaitlistedUser()` orders by `waitlistPosition ASC`, then `joinedAt ASC`
  - `promoteNextWaitlistedUser()` automatically called when capacity opens

#### Waitlist Capacity
- **Rule**: No waitlist capacity limit
- **Implementation**: Users can join waitlist indefinitely until hunt starts

#### Capacity Increases
- **Rule**: Promote first in line to next step based on hunt type (public/private/paid)
- **Implementation**:
  - Free public: Move to "confirmed"
  - Paid: Move to "pending" with payment requirement
  - Private: Move to "pending" for owner approval

#### Waitlist Cleanup Before Hunt Start
- **Rule**: Cancel all waitlisted users 1 second before hunt starts
- **Implementation**:
  - Expiration date set to `hunt.startDate - 1 second`
  - Cleanup job processes these automatically

### 3. Request/Approval Edge Cases

#### Request Timeout
- **Rule**: Expire after 7 days OR 1 second before hunt starts
- **Implementation**: Same as payment timeout using `requestExpiresAt`

#### User Cancels While Owner Reviews
- **Rule**: Request is cancelled
- **Implementation**: Leave route allows cancellation at any time before confirmation

#### Owner Rejects Request
- **Rule**: Request is cancelled, rejection counter incremented
- **Implementation**:
  - `handleRejection()` increments `rejectionCount`
  - Sets `lastRejectedAt` timestamp
  - Updates status to "cancelled"

#### Spam Prevention (3 Rejections Rule)
- **Rule**: User blocked from joining after 3 rejections
- **Implementation**:
  - `isUserBlockedFromJoining()` checks if `rejectionCount >= 3`
  - Join route returns 403 Forbidden if blocked
  - Counter resets if user successfully rejoins (e.g., hunt becomes public)

### 4. State Transition Edge Cases

#### Settings Changes Mid-Flow
- **Private → Public while user has pending request**: Auto-accept to confirmed
  - **Implementation**: Not auto-accepted, but validation allows change
- **Unpaid → Paid while user is confirmed**: Not allowed
  - **Implementation**: `canChangeHuntSettings()` checks for transition users
- **Paid → Unpaid with existing payments**: Not allowed
  - **Implementation**: Checks for confirmed payments before allowing change

#### Settings Change Validation
- **Rule**: Cannot change hunt settings while users are in pending/waitlisted states
- **Implementation**:
  - `hasParticipantsInTransition()` checks for pending/waitlisted users
  - Hunt PATCH route calls `canChangeHuntSettings()`
  - Returns error: "Cannot change hunt settings while users are in pending or waitlisted states."

#### User Leaves During Payment Processing
- **Rule**: Allowed
- **Implementation**: Leave route cancels participant and notes refund may be needed

#### Hunt Cancellation/Deletion
- **Rule**: Cannot cancel hunt with confirmed payments
- **Implementation**:
  - `canCancelHunt()` checks for confirmed payments
  - Returns error: "Cannot cancel hunt with confirmed payments. Please contact support."

### 5. Access & Permission Edge Cases

#### User Confirmed but Event is Full
- **Rule**: Remove latest user (system should prevent this, but handled)
- **Implementation**: Capacity check before confirmation in join route

#### User in Multiple States
- **Rule**: Should not happen
- **Implementation**: Database unique constraint on `[huntId, userId]`

### 6. Missing Flows

#### Rejection Paths
- **Implementation**: DELETE endpoint on requests route handles rejections

#### Cancellation/Refund Flows
- **Rule**: Owner handles refunds at their discretion
- **Implementation**: Owner must have verified email to create paid hunts

#### Re-entry Flow
- **Rule**: User can rejoin from the beginning
- **Implementation**:
  - Leave sets status to "cancelled"
  - Join allows participation if not blocked (< 3 rejections)
  - Rejection counter resets on successful rejoin

#### Notification Failures
- **Rule**: User's responsibility to check status
- **Implementation**: Frontend should display current status

## API Routes Modified

### `/api/hunts/[id]/join` (POST)
- Added rejection check
- Added expiration date calculation
- Added waitlist position assignment
- Added transition status updates
- Handles re-joining after cancellation

### `/api/hunts/[id]/leave` (DELETE)
- Added waitlist promotion after confirmed user leaves
- Added transition status update
- Added refund logging

### `/api/hunts/[id]/requests/[userId]` (POST/DELETE)
- POST: Clears expiration on approval, increments join counter
- DELETE: Implements rejection counter and blocking logic
- Both: Update transition status and promote waitlisted users

### `/api/hunts/[id]/payments/[userId]` (POST/DELETE)
- No changes needed (manual payment confirmation for specific use cases)

### `/api/stripe/create-checkout` (POST)
- Added double payment prevention
- Added payment processing flag
- Added error handling to unlock on failure

### `/api/stripe/webhook` (POST)
- Improved checkout completion handling
- Added payment failure recovery
- Clears expiration on confirmation
- Increments user counters
- Updates transition status

### `/api/hunts/[id]` (PATCH/DELETE)
- PATCH: Added settings change validation
- DELETE: Added cancellation validation (checks for payments)

### `/api/cron/cleanup-hunt-participants` (GET/POST)
- New endpoint for automated cleanup
- Handles expired requests, payments, and waitlist
- Promotes next waitlisted user when capacity opens

## Utility Functions (`src/lib/huntEdgeCases.ts`)

### Time & Expiration
- `calculateExpirationDate()` - 7 days or 1 second before hunt start
- `PAYMENT_TIMEOUT_DAYS = 7`
- `REQUEST_TIMEOUT_DAYS = 7`

### Validation
- `isUserBlockedFromJoining()` - Check if rejection count >= 3
- `hasParticipantsInTransition()` - Check for pending/waitlisted users
- `hasConfirmedPayments()` - Check for paid participants
- `canChangeHuntSettings()` - Validate settings changes
- `canCancelHunt()` - Validate hunt deletion
- `canProcessPayment()` - Validate payment can proceed

### Waitlist Management
- `getNextWaitlistPosition()` - Get next position number
- `getNextWaitlistedUser()` - Get first user in line (FIFO)
- `promoteNextWaitlistedUser()` - Move waitlisted user to appropriate state

### State Management
- `updateHuntTransitionStatus()` - Update hunt's transition flag
- `handleRejection()` - Increment counter, check blocking
- `markPaymentProcessing()` - Lock/unlock payment processing

### Cleanup
- `cleanupExpiredParticipants()` - Main cleanup function
- `cleanupWaitlistBeforeHuntStart()` - Clear waitlist before start

## Deployment Steps

1. **Update Environment Variables**
   ```env
   CRON_SECRET=your-secret-key-here
   ```

2. **Run Database Migration**
   ```bash
   # Option 1: Use Prisma (if db accessible)
   npx prisma db push

   # Option 2: Run manual SQL script
   psql < prisma/migrations/manual_add_edge_case_fields.sql
   ```

3. **Set Up Cron Job**

   **For Vercel:**
   Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/cleanup-hunt-participants",
       "schedule": "0 * * * *"
     }]
   }
   ```

   **For other platforms:**
   Set up hourly cron to call:
   ```bash
   curl -X POST https://your-domain.com/api/cron/cleanup-hunt-participants \
     -H "Authorization: Bearer your-secret-key-here"
   ```

4. **Deploy Code**
   - Deploy all modified route files
   - Deploy new utility library
   - Deploy cron endpoint

5. **Test Edge Cases**
   - Test payment timeout
   - Test rejection flow (3 times)
   - Test waitlist promotion
   - Test settings change prevention
   - Test hunt deletion with payments
   - Manually trigger cleanup job

## Monitoring & Logs

Watch for these log messages:
- `Payment completed for hunt {huntId} by user {userId}`
- `Payment failed for participant {id}. Returned to pending status.`
- `Promoted next waitlisted user for hunt {huntId}`
- `Cleanup complete. Processed {count} expired participants.`
- `Refund may be needed for participant {id}`

## Constants Reference

```typescript
PAYMENT_TIMEOUT_DAYS = 7
REQUEST_TIMEOUT_DAYS = 7
MAX_REJECTION_COUNT = 3
WAITLIST_CLEANUP_BUFFER_SECONDS = 1
```

## Key Business Rules

1. **First Come First Serve**: Always honor waitlist position
2. **7-Day Window**: Users have 7 days to complete action or until hunt starts
3. **3 Strikes Rule**: Blocked after 3 rejections
4. **No Settings Changes During Transitions**: All users must leave first
5. **No Hunt Deletion with Payments**: Contact support for refunds
6. **Owner Discretion**: Owners handle refunds themselves
7. **Verified Email Required**: For creating paid hunts
8. **Re-entry Allowed**: Users can rejoin if not blocked

## Future Enhancements

1. Automated refund processing through Stripe
2. Email notifications for state changes
3. SMS notifications for waitlist promotion
4. Dashboard for hunt owners to manage participants
5. Analytics for rejection patterns
6. Automatic conversion of private to public hunts
7. Capacity adjustment warnings

## Testing Checklist

- [ ] User joins paid hunt, doesn't pay within 7 days → cancelled
- [ ] User joins hunt, hunt starts before 7 days → cancelled 1 sec before start
- [ ] User rejected 3 times → blocked from rejoining
- [ ] Payment fails → returns to pending, can retry
- [ ] User clicks pay twice → sees error message
- [ ] Hunt at capacity → user waitlisted with position number
- [ ] Confirmed user leaves → next waitlisted user promoted
- [ ] Owner tries to change paid→free with payments → blocked
- [ ] Owner tries to edit hunt with pending users → blocked
- [ ] Owner tries to delete hunt with payments → blocked
- [ ] Waitlist users before hunt start → all cancelled
- [ ] Cleanup cron runs → expired participants removed

---

**Implementation Date**: January 2025
**Version**: 1.0.0
**Author**: Claude Code
