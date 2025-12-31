# HDC Calculator Test Migration Strategy

## Context
After significant changes to the calculation engine (single source of truth, depreciable basis fix, DSCR enforcement), we need a strategic approach to our test suite.

## Current State
- 295 total tests, 73 failing (25% failure rate)
- Tests written against old business logic
- Many tests have hardcoded expected values that are now wrong

## Recommended Strategy: Three-Tier Approach

### Tier 1: KEEP & FIX (Critical Business Logic)
These tests validate core business rules that MUST work correctly:
- `critical-business-rules.test.ts` ✅ (Already fixed)
- `calculations.test.ts` ✅ (Core math - passing)
- `dscr-target-maintenance.test.ts` (DSCR is critical)
- `oz-depreciation-rule.test.ts` (Tax calculation core)
- `waterfall-comprehensive.test.ts` (Payment priority core)

**Action:** Fix these immediately as they test unchanging business rules

### Tier 2: REWRITE (Feature Tests)
These test specific features that have changed significantly:
- `aum-fee-*.test.ts` (4 files) - AUM logic changed
- `tax-benefit-*.test.ts` - Depreciable basis changed
- `year1-*.test.ts` - Many assumptions changed
- `pik-*.test.ts` - Interest calculations affected

**Action:** Rewrite using new test helpers and current logic

### Tier 3: DEPRECATE & REPLACE (Integration/Scenario Tests)
These test complex scenarios that may no longer be relevant:
- `high-priority-gaps.test.ts`
- `calculation-gaps.test.ts`
- `full-integration.test.ts`
- Various specific scenario tests

**Action:** Review each for relevance, deprecate outdated ones, write new scenario tests

## Implementation Plan

### Phase 1: Core Test Suite (Week 1)
1. Create comprehensive test helpers ✅
2. Fix Tier 1 tests (5 critical test files)
3. Document changes needed for each

### Phase 2: Feature Test Rewrite (Week 2)
1. Group related tests (AUM, PIK, Tax, etc.)
2. Rewrite each group using test helpers
3. Validate against business requirements

### Phase 3: New Scenario Tests (Week 3)
1. Identify current business scenarios
2. Write new integration tests
3. Deprecate outdated tests

## New Test Structure

```
__tests__/
├── core/                 # Tier 1: Critical business logic
│   ├── business-rules.test.ts
│   ├── calculations.test.ts
│   └── dscr-enforcement.test.ts
├── features/            # Tier 2: Feature-specific
│   ├── aum-fees.test.ts
│   ├── tax-benefits.test.ts
│   ├── pik-interest.test.ts
│   └── oz-investments.test.ts
├── scenarios/           # Tier 3: Real-world scenarios
│   ├── typical-deal.test.ts
│   ├── high-leverage.test.ts
│   └── tax-optimization.test.ts
└── helpers/
    └── test-helpers.ts
```

## Key Testing Principles Going Forward

1. **Use Realistic Parameters**: 5% equity, 65% senior, 30% mezz
2. **Test Business Rules, Not Implementation**: Focus on outcomes
3. **Use Test Helpers**: Consistent parameter sets
4. **Document Intent**: Each test should clearly state what business rule it validates
5. **Avoid Hardcoded Values**: Calculate expected values programmatically

## Decision Points

### What to Test
- ✅ Business rules (tax benefits to investor, DSCR maintenance)
- ✅ Edge cases (zero values, PIK accumulation)
- ✅ Realistic scenarios (typical HDC deals)
- ❌ Implementation details (internal calculation steps)
- ❌ Outdated business models (old fee structures)

### When to Rewrite vs Fix
**Fix if:**
- Test validates current business rule
- Only expected values need updating
- Test structure is sound

**Rewrite if:**
- Business logic has fundamentally changed
- Test assumptions are invalid
- Test is testing implementation not behavior

**Delete if:**
- Business rule no longer exists
- Test duplicates other coverage
- Scenario is unrealistic/outdated

## Metrics for Success
- All Tier 1 tests passing (critical business logic)
- 90%+ overall test pass rate
- Clear documentation of what each test validates
- Reduced test maintenance burden
- Faster test execution

## Next Steps
1. Review this strategy with team
2. Prioritize which Tier 1 tests to fix first
3. Begin systematic migration
4. Track progress and adjust as needed