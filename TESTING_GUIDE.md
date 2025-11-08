# Hunt Logic Testing Guide

## Overview

This guide covers testing for all 24 use cases from the Hunt Logic flowchart plus additional edge cases.

## Test Files

### 1. `tests/hunt-logic.test.ts`
**Coverage**: All 24 basic use cases from flowchart
- Public/Private hunts
- Free/Paid hunts
- Available/Capacity reached
- Show/Hide location
- Owner accept/reject flows

### 2. `tests/hunt-edge-cases.test.ts`
**Coverage**: Edge cases not in flowchart
- Timing and expiration scenarios
- Capacity changes mid-flow
- Rejection and blocking (3 strikes)
- Settings change validation
- Hunt deletion restrictions
- FIFO waitlist promotion
- Owner restrictions
- Email verification

### 3. `tests/hunt-settings-changes.test.ts`
**Coverage**: All 19 settings change scenarios
- Public ↔ Private transitions
- Visible ↔ Invisible transitions
- Free ↔ Paid transitions
- Hide/Show meeting point
- Capacity increase/decrease
- Minimum pax changes
- Owner edit permissions
- Owner restrictions (leave/delete)

### 4. `tests/hunt-waitlist-edge-cases.test.ts`
**Coverage**: All 7 waitlist-specific edge cases
- 7-day owner acceptance timeout
- User leave and rejoin (loses priority)
- Capacity increase auto-accept
- Private hunt manual accept (no auto-accept)
- 1-minute before start cleanup
- Waitlisted users not counted in completion
- Waitlisted users no album access

### 5. `tests/hunt-payment-pending-edge-cases.test.ts`
**Coverage**: All 3 payment pending edge cases
- Pending payment not counted as paid user
- Payment process validation (verified email, Stripe setup)
- 7-day payment timeout with auto-cancellation
- Double payment prevention

### 6. `tests/hunt-join-limit-edge-cases.test.ts`
**Coverage**: All 3 join limit edge cases
- Allow join up to 1 minute before hunt ends (ongoing hunts)
- Owner can accept over capacity with auto-adjustment warning
- Race condition handling (two users grabbing last spot)

## Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
# Option 1: Use a separate test database
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."

# Option 2: Use in-memory SQLite for tests
npm install --save-dev @prisma/client sqlite3
```

### Environment Variables
Create `.env.test`:
```env
DATABASE_URL="postgresql://test_user:password@localhost:5432/aurora_test"
DIRECT_URL="postgresql://test_user:password@localhost:5432/aurora_test"
NODE_ENV="test"
```

### Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations on test database
npx prisma migrate dev

# Or push schema
npx prisma db push
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test tests/hunt-logic.test.ts
npm test tests/hunt-edge-cases.test.ts
npm test tests/hunt-settings-changes.test.ts
npm test tests/hunt-waitlist-edge-cases.test.ts
npm test tests/hunt-payment-pending-edge-cases.test.ts
npm test tests/hunt-join-limit-edge-cases.test.ts
```

### Run Specific Test Suite
```bash
npm test -- --testNamePattern="Cases 1-2"
npm test -- --testNamePattern="Edge Case 1"
npm test -- --testNamePattern="Settings Change"
npm test -- --testNamePattern="Waitlist"
npm test -- --testNamePattern="Payment Pending"
npm test -- --testNamePattern="Join Limit"
npm test -- --testNamePattern="Race Condition"
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

## Test Coverage Map

### ✅ Fully Tested (All 24 Use Cases)

| Case | Privacy | Visibility | Cost | Location | Availability | Status |
|------|---------|-----------|------|----------|--------------|--------|
| 1 | Public | Visible | Free | Show | Available | ✅ |
| 2 | Public | Visible | Free | Hide | Available | ✅ |
| 3 | Public | Visible | Paid | Show | Available | ✅ |
| 4 | Public | Visible | Paid | Hide | Available | ✅ |
| 5 | Public | Visible | Free | Show | Limit | ✅ |
| 6 | Public | Visible | Free | Hide | Limit | ✅ |
| 7 | Public | Visible | Paid | Show | Limit | ✅ |
| 8 | Public | Visible | Paid | Hide | Limit | ✅ |
| 9 | Private | Visible | Free | Show | Available | ✅ |
| 10 | Private | Visible | Free | Hide | Available | ✅ |
| 11 | Private | Hidden | Free | Show | Available | ✅ |
| 12 | Private | Hidden | Free | Hide | Available | ✅ |
| 13 | Private | Visible | Paid | Show | Available | ✅ |
| 14 | Private | Visible | Paid | Hide | Available | ✅ |
| 15 | Private | Hidden | Paid | Show | Available | ✅ |
| 16 | Private | Hidden | Paid | Hide | Available | ✅ |
| 17 | Private | Visible | Free | Show | Limit | ✅ |
| 18 | Private | Visible | Free | Hide | Limit | ✅ |
| 19 | Private | Hidden | Free | Show | Limit | ✅ |
| 20 | Private | Hidden | Free | Hide | Limit | ✅ |
| 21 | Private | Visible | Paid | Show | Limit | ✅ |
| 22 | Private | Visible | Paid | Hide | Limit | ✅ |
| 23 | Private | Hidden | Paid | Show | Limit | ✅ |
| 24 | Private | Hidden | Paid | Hide | Limit | ✅ |

### ✅ Edge Cases Tested

| Edge Case | Description | Status |
|-----------|-------------|--------|
| Payment timeout (7 days) | Expiration calculation | ✅ |
| Payment timeout (before start) | Uses hunt start time | ✅ |
| Expired participant cleanup | Cron job cleanup | ✅ |
| Capacity increase | Auto-promote waitlist | ✅ |
| 3 Rejection blocking | User blocked after 3 rejections | ✅ |
| 2 Rejections allowed | User can rejoin | ✅ |
| Settings with pending users | Blocked | ✅ |
| Settings with confirmed users | Allowed | ✅ |
| Paid→Unpaid with payments | Blocked | ✅ |
| Hunt deletion with payments | Blocked | ✅ |
| Hunt deletion without payments | Allowed | ✅ |
| FIFO waitlist promotion | Correct order | ✅ |
| Owner leaving hunt | Blocked | ✅ |
| Unverified email paid hunt | Blocked | ✅ |

### ⚠️ Needs Manual/Integration Testing

These require API endpoint testing or manual verification:

1. **Stripe Webhook Integration**
   - Payment success webhook
   - Payment failure webhook
   - Checkout cancellation webhook
   - Checkout expiration webhook

2. **Concurrent Actions**
   - Two users joining for last spot simultaneously
   - User pays while request expires
   - Owner accepts while user leaves

3. **Private→Public Auto-Accept**
   - Pending users auto-accepted when hunt becomes public
   - Capacity respected during transition

4. **Double Payment Prevention**
   - `isPaymentProcessing` flag works correctly
   - Stripe checkout prevents multiple sessions

5. **Waitlist Cleanup Before Hunt**
   - All waitlisted users cancelled 1 second before start
   - Triggered by cron job

## Manual Test Scenarios

### Scenario 1: Full Payment Flow
1. Create paid hunt (owner must have verified email)
2. User joins → Pending Payment
3. User clicks "Pay"
4. Complete Stripe checkout
5. Webhook fires → Status changes to Confirmed
6. ✅ User can access hunt details

**Test Cancel Flow:**
7. Different user joins
8. User clicks "Pay"
9. User cancels checkout
10. ✅ User returned to hunt page
11. ✅ Can click "Pay" again (not locked)

### Scenario 2: Waitlist Promotion
1. Create hunt with capacity = 2
2. User1 and User2 join → Confirmed
3. User3 joins → Waitlisted (position #1)
4. User4 joins → Waitlisted (position #2)
5. User1 leaves
6. ✅ User3 auto-promoted to Confirmed
7. User2 leaves
8. ✅ User4 auto-promoted to Confirmed

### Scenario 3: Rejection Blocking
1. Create private hunt
2. User requests to join
3. Owner rejects (rejectionCount = 1)
4. User requests again
5. Owner rejects (rejectionCount = 2)
6. User requests again
7. Owner rejects (rejectionCount = 3)
8. ✅ User cannot join again (403 Forbidden)

### Scenario 4: Payment Timeout
1. Create paid hunt starting in 30 days
2. User joins → Pending Payment (expires in 7 days)
3. Wait 7 days (or manually set expiration to past)
4. Run cleanup cron job
5. ✅ User status = Cancelled
6. ✅ Next waitlisted user promoted (if applicable)

### Scenario 5: Settings Change Prevention
1. Create private hunt
2. User requests to join → Pending
3. Owner tries to change hunt to public
4. ✅ Error: "Cannot change settings while users in pending state"
5. Owner accepts user → Confirmed
6. Owner changes hunt to public
7. ✅ Success

### Scenario 6: Private → Public Auto-Accept
1. Create private hunt with capacity = 5
2. User1 requests → Pending
3. User2 requests → Pending
4. User3 requests → Pending
5. Owner changes hunt to Public
6. ✅ User1, User2, User3 auto-accepted to Confirmed
7. ✅ Their counters incremented

### Scenario 7: Capacity Increase
1. Create hunt with capacity = 2
2. Fill capacity (User1, User2 confirmed)
3. User3 joins → Waitlisted
4. Owner increases capacity to 5
5. ✅ User3 auto-promoted to Confirmed

### Scenario 8: Hunt Deletion
1. Create paid hunt
2. User joins and pays → Confirmed
3. Owner tries to delete hunt
4. ✅ Error: "Cannot cancel hunt with confirmed payments"
5. Different free hunt
6. User joins → Confirmed
7. Owner deletes hunt
8. ✅ Success, all participants cancelled

## Common Test Failures & Fixes

### Issue: "Database connection failed"
**Fix**:
```bash
# Check DATABASE_URL in .env.test
# Ensure test database exists
createdb aurora_test

# Run migrations
npx prisma migrate deploy
```

### Issue: "Unique constraint violation"
**Fix**:
```bash
# Clear test database between runs
npx prisma migrate reset --force
```

### Issue: "Module not found"
**Fix**:
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Jest cache
npm test -- --clearCache
```

### Issue: "Test timeout"
**Fix**:
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: aurora_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aurora_test

      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aurora_test
```

## Performance Benchmarks

Expected test execution times:

- **hunt-logic.test.ts**: ~5-10 seconds (24 test cases)
- **hunt-edge-cases.test.ts**: ~3-5 seconds (8 test suites)
- **hunt-settings-changes.test.ts**: ~4-6 seconds (19 test cases)
- **hunt-waitlist-edge-cases.test.ts**: ~3-5 seconds (7 test suites)
- **hunt-payment-pending-edge-cases.test.ts**: ~2-4 seconds (3 test suites)
- **hunt-join-limit-edge-cases.test.ts**: ~3-5 seconds (3 test suites)
- **Total**: < 35 seconds

If tests are slower:
- Check database connection speed
- Optimize cleanup in `afterEach`
- Use transactions for faster rollbacks

## Next Steps

### Additional Tests Needed

1. **API Integration Tests**
   ```bash
   tests/api/hunts/join.integration.test.ts
   tests/api/hunts/leave.integration.test.ts
   tests/api/hunts/requests.integration.test.ts
   tests/api/stripe/webhook.integration.test.ts
   ```

2. **End-to-End Tests**
   - Use Playwright or Cypress
   - Test full user flows through UI
   - Test payment flows with Stripe test mode

3. **Load Testing**
   - Test with 100+ concurrent users
   - Test waitlist with 1000+ users
   - Test cleanup job performance

4. **Security Testing**
   - Test authorization (can't accept other hunts' requests)
   - Test rate limiting
   - Test SQL injection prevention

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Stripe Testing](https://stripe.com/docs/testing)

---

**Last Updated**: January 2025
**Test Coverage**:
- 24/24 use cases from flowchart ✅
- 14 edge cases ✅
- 19 settings change scenarios ✅
- 7 waitlist edge cases ✅
- 3 payment pending edge cases ✅
- 3 join limit edge cases ✅
- **Total**: 70 comprehensive test scenarios
