# Quick Test Reference

## Run All Tests

```bash
npm test
```

Expected: 70 test scenarios across 6 test files

---

## Run Individual Test Files

### Basic Use Cases (24 scenarios)
```bash
npm test tests/hunt-logic.test.ts
```

### Edge Cases (14 scenarios)
```bash
npm test tests/hunt-edge-cases.test.ts
```

### Settings Changes (19 scenarios)
```bash
npm test tests/hunt-settings-changes.test.ts
```

### Waitlist Edge Cases (7 scenarios)
```bash
npm test tests/hunt-waitlist-edge-cases.test.ts
```

### Payment Pending Edge Cases (3 scenarios)
```bash
npm test tests/hunt-payment-pending-edge-cases.test.ts
```

### Join Limit Edge Cases (3 scenarios) ⭐ NEW
```bash
npm test tests/hunt-join-limit-edge-cases.test.ts
```

---

## Run by Test Pattern

### Settings Change Tests
```bash
npm test -- --testNamePattern="Settings Change"
```

### Waitlist Tests
```bash
npm test -- --testNamePattern="Waitlist"
```

### Payment Tests
```bash
npm test -- --testNamePattern="Payment"
```

### Capacity Tests
```bash
npm test -- --testNamePattern="Capacity"
```

### Rejection Tests
```bash
npm test -- --testNamePattern="Rejection"
```

### Join Limit Tests ⭐ NEW
```bash
npm test -- --testNamePattern="Join Limit"
```

### Race Condition Tests ⭐ NEW
```bash
npm test -- --testNamePattern="Race Condition"
```

---

## Test Coverage

```bash
npm test -- --coverage
```

---

## Watch Mode (Development)

```bash
npm test -- --watch
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Ensure database exists
createdb aurora_test

# Run migrations
npx prisma migrate deploy
```

### Clear Jest Cache
```bash
npm test -- --clearCache
```

### Regenerate Prisma Client
```bash
npx prisma generate
```

---

## Test Status Quick Check

| File | Tests | Status |
|------|-------|--------|
| hunt-logic.test.ts | 24 | ✅ Ready |
| hunt-edge-cases.test.ts | 14 | ✅ Ready |
| hunt-settings-changes.test.ts | 19 | ✅ Ready |
| hunt-waitlist-edge-cases.test.ts | 7 | ✅ Ready |
| hunt-payment-pending-edge-cases.test.ts | 3 | ✅ Ready |
| hunt-join-limit-edge-cases.test.ts | 3 | ✅ Ready NEW |
| **Total** | **70** | **✅ Ready** |

---

## Key Test Categories

### 🔒 Settings Validation (19 tests)
- Public/Private transitions
- Visible/Invisible transitions
- Free/Paid transitions
- Capacity changes
- Owner permissions

### ⏳ Waitlist Management (7 tests)
- FIFO ordering
- Timeout handling
- Auto-promotion
- Manual acceptance
- Cleanup before start

### 💳 Payment Processing (3 tests)
- Pending payment handling
- Email verification
- Payment timeout
- Double payment prevention

### 🎯 Core Logic (24 tests)
- All flowchart scenarios
- Public/Private hunts
- Free/Paid hunts
- Show/Hide location
- Accept/Reject flows

### 🚨 Edge Cases (14 tests)
- Expiration scenarios
- Rejection blocking
- Deletion validation
- Owner restrictions

### ⏱️ Join Timing (3 tests) ⭐ NEW
- Ongoing hunt join
- 1-minute before end cutoff
- Owner accept over capacity
- Race condition handling

---

**Expected Execution Time**: ~35 seconds for all 70 tests
**Database**: PostgreSQL (test database required)
**Coverage**: All 24 use cases + 46 edge cases = 70 scenarios
