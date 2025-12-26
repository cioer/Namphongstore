# Quick Test Guide

## Prerequisites

```bash
# Install dependencies
npm install --legacy-peer-deps

# Install Playwright browsers (first time only)
npx playwright install chromium
```

## Running Tests

### Unit Tests (Fast, No Dependencies)

```bash
# Run all unit tests
npm test

# Run in watch mode (for development)
npm run test:watch
```

**What's tested**:
- ✅ formatVND() - Vietnamese currency formatting
- ✅ isPromoActive() - Promo window validation
- ✅ generateWarrantyCode() - Warranty code format

**Expected**: 15 tests passing

---

### Integration Tests (Requires Database)

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Wait 5 seconds for database to be ready
timeout 5

# Run integration tests
npm run test:integration
```

**What's tested**:
- ✅ Delivered idempotency (no duplicate warranties)
- ✅ Snapshot integrity (price/warranty unchanged)
- ✅ Cancel rules (NEW/CONFIRMED only)
- ✅ Return window (30-day validation)
- ✅ Replacement linking (old.replaced_by = new.id)

**Expected**: 5 test suites passing

---

### E2E Tests (Requires App Running)

```bash
# Start full app stack
docker compose up --build -d

# Wait for app to be ready (check http://localhost:3000)
timeout 10

# Run E2E tests
npm run test:e2e

# Or run with UI (interactive mode)
npm run test:e2e:ui
```

**What's tested**:
- ✅ Flow 1: Browse → Cart → Checkout → Success
- ✅ Flow 2: Admin DELIVERED → Warranty codes generated
- ✅ Flow 3: Return → Approve → Replacement → New warranty

**Expected**: 3 flows passing

---

## Troubleshooting

### Unit Tests Fail

**Error**: `formatVND` test failures
**Fix**: Ensure Node.js locale support installed

### Integration Tests Fail

**Error**: Cannot connect to database
**Fix**: 
```bash
docker compose up -d postgres
docker compose logs postgres  # Check if ready
```

**Error**: Database schema mismatch
**Fix**:
```bash
docker compose exec app npm run migrate
```

### E2E Tests Fail

**Error**: Timeout waiting for http://localhost:3000
**Fix**:
```bash
docker compose up --build
# Wait for "ready" message
curl http://localhost:3000  # Test manually
```

**Error**: Playwright browser not found
**Fix**:
```bash
npx playwright install chromium
```

---

## Test File Locations

```
tests/
├── setup.ts                               # Unit test setup
├── integration/
│   ├── setup.ts                          # Integration setup
│   ├── delivered-idempotency.test.ts     # Warranty duplication test
│   ├── snapshot-integrity.test.ts        # Price/warranty snapshot test
│   ├── cancel-rule.test.ts               # Order cancel rules
│   ├── return-window.test.ts             # 30-day return validation
│   └── replacement-link.test.ts          # Warranty replacement chain
└── e2e/
    ├── checkout-flow.spec.ts             # Customer checkout journey
    ├── warranty-generation.spec.ts       # Admin warranty workflow
    └── return-replacement.spec.ts        # Return & replacement flow

src/
└── lib/
    └── utils.test.ts                     # Unit tests for utilities
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install --legacy-peer-deps
      - run: npm test

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install --legacy-peer-deps
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install --legacy-peer-deps
      - run: npx playwright install chromium
      - run: docker compose up -d
      - run: npm run test:e2e
```

---

## Quick Verification

Run this to verify everything works:

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Run unit tests (should be instant)
npm test

# 3. Start Docker
docker compose up -d

# 4. Check app is running
curl http://localhost:3000

# 5. Run all tests
npm test && npm run test:integration && npm run test:e2e
```

**Expected Total**: ~23+ tests passing

---

For detailed test report, see [TEST_REPORT.md](./TEST_REPORT.md)
