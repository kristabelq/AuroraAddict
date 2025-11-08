# Payment Workflow Test Plan

## Bug Fixes Applied

### 🔧 Critical Bug Fixed
**Issue**: Hunt creation API wasn't handling `cancellationPolicy` field
**Fix**: Added cancellationPolicy extraction and storage in `/src/app/api/hunts/create/route.ts:36,122`
- Extract from FormData: `const cancellationPolicy = formData.get("cancellationPolicy") as string | null;`
- Store in database: `cancellationPolicy: cancellationPolicy || null,`

## Code Review Summary

### ✅ Verified Components

1. **Database Schema** (`prisma/schema.prisma`)
   - ✅ `paymentStatus` field on HuntParticipant (line 159)
   - ✅ `cancellationPolicy` field on Hunt (line 142)
   - ✅ Default value: "pending" for paymentStatus
   - ✅ Nullable fields properly defined

2. **Hunt Creation API** (`src/app/api/hunts/create/route.ts`)
   - ✅ Now extracts cancellationPolicy from FormData
   - ✅ Stores cancellationPolicy in database
   - ✅ Creator auto-joins with "confirmed" status
   - ✅ Increments both cachedHuntsCreatedCount and cachedHuntsJoinedCount

3. **Join Hunt API** (`src/app/api/hunts/[id]/join/route.ts`)
   - ✅ Private hunts: Creates with "pending" or "waitlisted" status
   - ✅ Paid hunts: Creates with "pending" or "waitlisted" status
   - ✅ Free public hunts: Creates with "confirmed" or "waitlisted" status
   - ✅ Capacity checking works correctly
   - ✅ Waitlist logic properly implemented
   - ✅ Always increments cachedHuntsJoinedCount

4. **Payment Confirmation API** (`src/app/api/hunts/[id]/payments/[userId]/route.ts`)
   - ✅ POST: Confirms payment and updates status to "confirmed"
   - ✅ POST: Sets paidAt timestamp
   - ✅ POST: Only allows organizer to confirm
   - ✅ POST: Validates participant is pending with unconfirmed payment
   - ✅ DELETE: Removes participant and decrements counter
   - ✅ DELETE: Only allows cancelling pending payments

5. **Approve/Reject Requests API** (`src/app/api/hunts/[id]/requests/[userId]/route.ts`)
   - ✅ POST: Approves pending/waitlisted participants
   - ✅ DELETE: Rejects and optionally moves to waitlist
   - ✅ DELETE: Properly decrements cachedHuntsJoinedCount
   - ✅ Only organizer can approve/reject

6. **Hunt Creation Form** (`src/app/(main)/createhunt/page.tsx`)
   - ✅ Added cancellationPolicy to formData state
   - ✅ Textarea appears conditionally when isPaid is true
   - ✅ Submits cancellationPolicy with form data
   - ✅ Proper styling and placeholder text

7. **Hunt Details Page** (`src/app/(main)/hunts/[id]/page.tsx`)
   - ✅ Added paymentStatus and cancellationPolicy to interfaces
   - ✅ Button state logic properly detects payment confirmation
   - ✅ Payment Received + Leave Hunt buttons display side-by-side
   - ✅ Cancellation policy section displays for paid hunts
   - ✅ Leave hunt confirmation includes cancellation policy warning
   - ✅ "Join Waitlist" button text (changed from "Join the Waitlist")

---

## Comprehensive Test Cases

### 1. Hunt Creation Tests

#### Test 1.1: Create Free Public Hunt
**Setup**: Login as Organizer A
**Steps**:
1. Navigate to Create Hunt page
2. Fill in: Name, Description, Date, Location
3. Select "Public" checkbox
4. Do NOT check "Paid event"
5. Submit form

**Expected**:
- Hunt created successfully
- No cancellation policy field visible
- Organizer auto-joins as "confirmed" participant
- cachedHuntsCreatedCount +1
- cachedHuntsJoinedCount +1

#### Test 1.2: Create Private Hunt with Capacity
**Setup**: Login as Organizer A
**Steps**:
1. Navigate to Create Hunt page
2. Fill in: Name, Description, Date, Location
3. Select "Private" checkbox
4. Set Capacity: 5
5. Check "Allow Waitlist"
6. Submit form

**Expected**:
- Hunt created with isPublic=false
- allowWaitlist=true
- capacity=5
- Organizer auto-joins as "confirmed"

#### Test 1.3: Create Paid Hunt with Cancellation Policy
**Setup**: Login as Organizer A
**Steps**:
1. Navigate to Create Hunt page
2. Fill in: Name, Description, Date, Location
3. Select "Public" checkbox
4. Check "Paid event"
5. Enter Price: 50.00
6. Enter Cancellation Policy: "Full refund if cancelled 48 hours before event. No refund after."
7. Set Capacity: 10
8. Submit form

**Expected**:
- Hunt created with isPaid=true
- price=50.00
- cancellationPolicy stored in database
- Cancellation policy textarea appeared when "Paid event" was checked
- Hunt visible on hunts listing

---

### 2. Join Hunt Tests

#### Test 2.1: Join Free Public Hunt
**Setup**:
- Hunt: Free, Public, Capacity: 10, Current: 1 (organizer)
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Join Hunt" button

**Expected**:
- Status immediately changes to "confirmed"
- Button changes to green "Confirmed" + "Leave Hunt"
- cachedHuntsJoinedCount +1 for User B
- Can view exact location on map

#### Test 2.2: Join Private Hunt (Request to Join)
**Setup**:
- Hunt: Free, Private, No capacity limit
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Request to Join" button (Purple)

**Expected**:
- Status changes to "pending"
- Button changes to gold "Pending Approval" + "Cancel Request"
- Message: "Request sent! Waiting for organizer approval"
- cachedHuntsJoinedCount +1 for User B

#### Test 2.3: Join Paid Hunt (Requires Payment)
**Setup**:
- Hunt: Paid ($50), Public, Capacity: 10, Current: 1
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Join Hunt" button

**Expected**:
- Status changes to "pending"
- Button changes to orange "Payment Pending" + "Cancel Request"
- Message: "Proceed to payment to confirm your spot"
- paymentStatus="pending"
- cachedHuntsJoinedCount +1 for User B

#### Test 2.4: Join Hunt at Full Capacity (With Waitlist Allowed)
**Setup**:
- Hunt: Free, Public, Capacity: 5, Current: 5 (full)
- allowWaitlist: true
- Login as User C

**Steps**:
1. Navigate to hunt details page
2. Click "Join Waitlist" button (Blue)

**Expected**:
- Status changes to "waitlisted"
- Button changes to blue "Waitlisted" + "Leave Waitlist"
- Message: "Added to waitlist! You'll be notified if a spot opens up"
- cachedHuntsJoinedCount +1 for User C

#### Test 2.5: Join Hunt at Full Capacity (No Waitlist)
**Setup**:
- Hunt: Free, Public, Capacity: 5, Current: 5 (full)
- allowWaitlist: false
- Login as User C

**Steps**:
1. Navigate to hunt details page
2. Attempt to join

**Expected**:
- Error: "Hunt is at full capacity"
- Button disabled or shows "Full"
- No participant record created
- cachedHuntsJoinedCount unchanged

---

### 3. Payment Confirmation Tests (Organizer Actions)

#### Test 3.1: Confirm Payment for Pending Participant
**Setup**:
- Hunt: Paid ($50), created by Organizer A
- User B joined, status="pending", paymentStatus="pending"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. View Pending Approvals section
3. Click "Confirm Payment" button for User B

**Expected**:
- API call to POST `/api/hunts/[id]/payments/[userId]`
- User B's paymentStatus updates to "confirmed"
- User B's status updates to "confirmed"
- paidAt timestamp set
- User B now sees: Green "Payment Received" + Red "Leave Hunt"
- User B moves from Pending to Confirmed Participants section

#### Test 3.2: Cancel Payment for Pending Participant
**Setup**:
- Hunt: Paid ($50), created by Organizer A
- User B joined, status="pending", paymentStatus="pending"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. View Pending Approvals section
3. Click "Cancel Payment" or "Remove" button for User B

**Expected**:
- API call to DELETE `/api/hunts/[id]/payments/[userId]`
- User B's participant record deleted
- User B's cachedHuntsJoinedCount -1
- User B no longer appears in Pending section
- User B can rejoin the hunt if desired

#### Test 3.3: Attempt to Confirm Already Confirmed Payment
**Setup**:
- Hunt: Paid ($50), created by Organizer A
- User B: status="confirmed", paymentStatus="confirmed"
- Login as Organizer A

**Steps**:
1. Try to confirm payment again via API

**Expected**:
- Error: "Payment cannot be confirmed for this participant"
- Status 400
- No changes to participant record

#### Test 3.4: Non-Organizer Attempts to Confirm Payment
**Setup**:
- Hunt: Paid ($50), created by Organizer A
- User B: status="pending", paymentStatus="pending"
- Login as User C (different user)

**Steps**:
1. Try to call POST `/api/hunts/[id]/payments/[userId]` directly

**Expected**:
- Error: "Only the hunt organizer can confirm payments"
- Status 403
- No changes to participant record

---

### 4. Approve/Reject Request Tests

#### Test 4.1: Approve Private Hunt Request
**Setup**:
- Hunt: Free, Private, created by Organizer A
- User B: status="pending"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. View Pending Approvals section
3. Click "Approve" button for User B

**Expected**:
- API call to POST `/api/hunts/[id]/requests/[userId]`
- User B's status updates to "confirmed"
- User B sees green "Confirmed" + "Leave Hunt" buttons
- User B moves to Confirmed Participants section

#### Test 4.2: Reject Request (With Waitlist Allowed)
**Setup**:
- Hunt: Free, Private, allowWaitlist=true
- User B: status="pending"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. View Pending Approvals section
3. Click "Reject" button for User B

**Expected**:
- User B's status updates to "waitlisted"
- User B sees blue "Waitlisted" + "Leave Waitlist" buttons
- Message: "Request rejected and user added to waitlist"
- cachedHuntsJoinedCount unchanged (still +1)

#### Test 4.3: Reject Request (No Waitlist)
**Setup**:
- Hunt: Free, Private, allowWaitlist=false
- User B: status="pending"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. View Pending Approvals section
3. Click "Reject" button for User B

**Expected**:
- User B's participant record deleted
- User B's cachedHuntsJoinedCount -1
- User B no longer appears in hunt
- Message: "Request rejected"
- User B can rejoin the hunt if desired

#### Test 4.4: Approve Waitlisted Participant
**Setup**:
- Hunt: Capacity=5, Current confirmed=4, User B="waitlisted"
- Login as Organizer A

**Steps**:
1. Navigate to hunt details page
2. Find User B in Waitlist section
3. Click "Approve" button

**Expected**:
- User B's status updates to "confirmed"
- User B moves to Confirmed Participants section
- Current confirmed participants: 5 (at capacity)

---

### 5. Leave Hunt Tests

#### Test 5.1: Leave Free Hunt
**Setup**:
- Hunt: Free, Public
- User B: status="confirmed"
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Leave Hunt" button
3. Confirm dialog: "Are you sure you want to leave this hunt?"

**Expected**:
- Participant record deleted
- cachedHuntsJoinedCount -1
- User B sees "Join Hunt" button again
- Can rejoin immediately

#### Test 5.2: Leave Paid Hunt (With Cancellation Policy Warning)
**Setup**:
- Hunt: Paid ($50), cancellationPolicy="Full refund if cancelled 48 hours before event"
- User B: status="confirmed", paymentStatus="confirmed"
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Leave Hunt" button
3. View confirmation dialog

**Expected**:
- Dialog shows: "Are you sure you want to leave this hunt?\n\nBy leaving, you are adhering to the cancellation policy:\n\nFull refund if cancelled 48 hours before event"
- If confirmed: Participant record deleted
- If confirmed: cachedHuntsJoinedCount -1
- User B can view cancellation policy in yellow warning box on hunt page

#### Test 5.3: Cancel Pending Request
**Setup**:
- Hunt: Free, Private
- User B: status="pending"
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Cancel Request" button

**Expected**:
- Participant record deleted
- cachedHuntsJoinedCount -1
- Button changes back to purple "Request to Join"

#### Test 5.4: Leave Waitlist
**Setup**:
- Hunt: Capacity=5, Current=5 (full)
- User B: status="waitlisted"
- Login as User B

**Steps**:
1. Navigate to hunt details page
2. Click "Leave Waitlist" button

**Expected**:
- Participant record deleted
- cachedHuntsJoinedCount -1
- Button changes back to blue "Join Waitlist"

---

### 6. Hunt Details Page UI Tests

#### Test 6.1: Button States - Not Joined (Free Public)
**Expected Button**: Green "Join Hunt"
**Gradient**: from-aurora-green to-aurora-blue

#### Test 6.2: Button States - Not Joined (Private)
**Expected Button**: Purple "Request to Join"
**Gradient**: from-purple-500 to-purple-700

#### Test 6.3: Button States - Not Joined (Paid)
**Expected Button**: Green "Join Hunt"
**Gradient**: from-aurora-green to-aurora-blue

#### Test 6.4: Button States - Not Joined (At Capacity, Waitlist Allowed)
**Expected Button**: Blue "Join Waitlist"
**Gradient**: from-blue-500 to-blue-700

#### Test 6.5: Button States - Pending Approval (Private)
**Expected Buttons**:
- Left: Gold "Pending Approval" (inactionable, cursor-default)
- Right: Red "Cancel Request"

#### Test 6.6: Button States - Pending Payment (Paid)
**Expected Buttons**:
- Left: Orange "Payment Pending" (inactionable, cursor-default)
- Right: Red "Cancel Request"

#### Test 6.7: Button States - Confirmed (Free Hunt)
**Expected Buttons**:
- Left: Green "Confirmed" (inactionable, cursor-default)
- Right: Red "Leave Hunt"

#### Test 6.8: Button States - Payment Confirmed (Paid Hunt)
**Expected Buttons**:
- Left: Green "Payment Received" (inactionable, cursor-default, with checkmark icon)
- Right: Red "Leave Hunt"

#### Test 6.9: Button States - Waitlisted
**Expected Buttons**:
- Left: Blue "Waitlisted" (inactionable, cursor-default)
- Right: Red "Leave Waitlist"

#### Test 6.10: Cancellation Policy Display
**Setup**: Hunt with isPaid=true and cancellationPolicy text
**Expected**:
- Yellow warning box appears after Description section
- Warning icon visible
- Title: "Cancellation Policy"
- Policy text displayed with whitespace-pre-wrap
- Yellow-themed styling (yellow-500/10 bg, yellow-500/30 border)

---

### 7. Edge Cases and Error Handling

#### Test 7.1: Join Hunt That Already Ended
**Setup**:
- Hunt: endDate in the past
- Login as User B (not creator)

**Expected**:
- Error: "This hunt has already ended"
- Cannot join
- Creator can still add participants manually

#### Test 7.2: Double Join Attempt
**Setup**:
- User B already joined hunt
- Try to join again

**Expected**:
- Error: "Already joined this hunt"
- No duplicate participant record
- cachedHuntsJoinedCount unchanged

#### Test 7.3: Create Hunt Without Required Fields
**Steps**:
1. Try to submit hunt creation form without Name or Date

**Expected**:
- HTML5 validation prevents submission
- Form shows required field errors

#### Test 7.4: Paid Hunt Without Price
**Steps**:
1. Check "Paid event"
2. Leave price empty
3. Submit form

**Expected**:
- Hunt creates with price=null
- Should validate and require price (may need validation logic)

#### Test 7.5: Hide Location for Non-Paid, Non-Private Hunt
**Steps**:
1. Select "Public"
2. Try to check "Hide exact location"

**Expected**:
- Checkbox is disabled
- Cannot hide location unless Paid or Private

#### Test 7.6: Cancellation Policy for Non-Paid Hunt
**Setup**: Create hunt without "Paid event" checked
**Expected**:
- Cancellation policy textarea does not appear
- No cancellation policy stored or displayed

---

### 8. Counter Integrity Tests

#### Test 8.1: Create Hunt Counter
**Setup**: User A has cachedHuntsCreatedCount=5
**Steps**: Create a new hunt
**Expected**: cachedHuntsCreatedCount=6

#### Test 8.2: Join Hunt Counter
**Setup**: User B has cachedHuntsJoinedCount=3
**Steps**: Join a hunt
**Expected**: cachedHuntsJoinedCount=4

#### Test 8.3: Leave Hunt Counter
**Setup**: User B has cachedHuntsJoinedCount=4, joined a hunt
**Steps**: Leave the hunt
**Expected**: cachedHuntsJoinedCount=3

#### Test 8.4: Reject Request Counter
**Setup**: User B joined (pending), cachedHuntsJoinedCount=4
**Steps**: Organizer rejects (no waitlist)
**Expected**: cachedHuntsJoinedCount=3

#### Test 8.5: Cancel Payment Counter
**Setup**: User B joined paid hunt, cachedHuntsJoinedCount=4
**Steps**: Organizer cancels payment
**Expected**: cachedHuntsJoinedCount=3

#### Test 8.6: Creator Auto-Join Counter
**Setup**: User A: cachedHuntsCreatedCount=5, cachedHuntsJoinedCount=10
**Steps**: Create new hunt
**Expected**:
- cachedHuntsCreatedCount=6
- cachedHuntsJoinedCount=11 (both increment)

---

### 9. Authorization Tests

#### Test 9.1: Unauthenticated User Creates Hunt
**Expected**: Error 401 Unauthorized

#### Test 9.2: Unauthenticated User Joins Hunt
**Expected**: Error 401 Unauthorized

#### Test 9.3: Non-Organizer Approves Request
**Expected**: Error 403 Forbidden

#### Test 9.4: Non-Organizer Confirms Payment
**Expected**: Error 403 Forbidden

---

### 10. Integration Tests

#### Test 10.1: Complete Paid Hunt Flow
**Steps**:
1. Organizer A creates paid hunt ($50, capacity=3)
2. User B joins (pending payment)
3. User C joins (pending payment)
4. User D joins (pending payment)
5. Organizer A confirms payment for User B
6. Organizer A confirms payment for User C
7. User E tries to join (should be waitlisted if capacity reached)
8. User B leaves hunt
9. Organizer A approves User E from waitlist

**Expected**:
- All status transitions work correctly
- Counters remain accurate throughout
- Capacity enforcement works
- Waitlist promotion works

#### Test 10.2: Complete Private Hunt Flow
**Steps**:
1. Organizer A creates private hunt (capacity=2, waitlist allowed)
2. User B requests to join
3. User C requests to join
4. User D requests to join
5. Organizer A approves User B
6. Organizer A rejects User C (moves to waitlist)
7. User B leaves hunt (spot opens)
8. Organizer A approves User C from waitlist

**Expected**:
- All transitions work correctly
- Waitlist logic functions properly
- Counters accurate throughout

---

## Database Schema Validation

### Required Migrations
Run this SQL to verify schema is correct:

```sql
-- Check Hunt table for cancellationPolicy
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Hunt' AND column_name = 'cancellationPolicy';

-- Check HuntParticipant table for paymentStatus
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'HuntParticipant' AND column_name = 'paymentStatus';

-- Verify paymentStatus values
SELECT DISTINCT "paymentStatus" FROM "HuntParticipant";
```

Expected results:
- `cancellationPolicy`: String?, nullable
- `paymentStatus`: String?, nullable, default "pending"
- Possible values: "pending", "confirmed", "cancelled" (or null)

---

## API Endpoint Testing

### Manual API Tests with curl

#### 1. Confirm Payment
```bash
curl -X POST http://localhost:3000/api/hunts/[huntId]/payments/[userId] \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "participant": { ... },
  "message": "Payment confirmed successfully"
}
```

#### 2. Cancel Payment
```bash
curl -X DELETE http://localhost:3000/api/hunts/[huntId]/payments/[userId] \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Payment cancelled and participant removed"
}
```

---

## Performance Considerations

### Database Queries to Monitor
1. Hunt fetch with participants (N+1 query risk)
2. Counter updates in transactions
3. Participant status filtering

### Optimization Notes
- Using cached counters (cachedHuntsJoinedCount, etc.)
- Composite indexes on [userId, createdAt] for user sightings
- Indexes on huntId, userId, status for filtering

---

## Known Limitations

1. **Manual Payment Tracking**: System doesn't integrate with payment providers (Stripe, etc.)
2. **No Refund Logic**: Cancellation policy is informational only
3. **No Email Notifications**: Status changes don't trigger emails
4. **No Payment Receipt**: No proof of payment storage
5. **Organizer Trust**: Relies on organizer manually confirming payments

---

## Future Enhancements

1. Integrate Stripe for automatic payment confirmation
2. Add email/push notifications for status changes
3. Store payment receipts and transaction IDs
4. Add refund request workflow
5. Add payment deadline (auto-cancel if not paid within X hours)
6. Add waitlist auto-promotion when spots open
7. Add bulk payment confirmation for organizers
8. Add payment reminder notifications

---

## Testing Checklist

- [ ] All 10 test categories executed
- [ ] Database schema verified
- [ ] API endpoints tested manually
- [ ] Button states verified for all scenarios
- [ ] Counter integrity confirmed
- [ ] Authorization properly enforced
- [ ] Error handling works as expected
- [ ] UI displays correctly on mobile and desktop
- [ ] Cancellation policy displays properly
- [ ] Payment confirmation flow works end-to-end

---

## Critical Success Criteria

✅ **MUST WORK**:
1. Hunt creation with cancellation policy saves to database
2. Join paid hunt creates pending payment status
3. Organizer can confirm payment → status becomes "confirmed"
4. Payment confirmed users see green "Payment Received" button
5. Leave paid hunt shows cancellation policy warning
6. Cancellation policy displays on hunt details page
7. All button states display correct colors and text
8. Counters remain accurate through all flows

---

**Test Plan Version**: 1.0
**Date**: 2025-10-15
**Last Updated**: After critical bug fix for cancellationPolicy
