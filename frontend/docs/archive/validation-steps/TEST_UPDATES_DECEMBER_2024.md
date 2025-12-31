# HDC Calculator Test Updates - September 2025

## Overview

This document tracks all test-related changes and improvements made in September 2025 (v2.0 release). These changes address calculation accuracy, display transparency, and test coverage gaps.

## New Test Files Created

### 1. `s-curve-interest-reserve.test.ts`
**Purpose**: Validates S-curve occupancy modeling for interest reserve sizing
**Key Test Cases**:
- Monthly average occupancy calculation (~31% for Year 1)
- Interest reserve reduction (40-50% vs simple calculation)
- Different lease-up periods (6, 12, 18, 24 months)
- Current pay impact on reserve sizing
- Integration with Year 1 tax benefit calculations

### 2. `hdc-catchup-waterfall.test.ts`
**Purpose**: Validates exit proceeds catch-up distribution
**Key Test Cases**:
- Deferred fee tracking during operations
- Exit waterfall priority order
- HDC catch-up before promote split
- Partial payment scenarios
- Integration with DSCR management

### 3. `verify-waterfall-fix.test.ts`
**Purpose**: Confirms waterfall fixes are working correctly
**Key Test Cases**:
- Debt repayment priority
- Deferred fee collection
- Promote split accuracy
- Edge cases with insufficient proceeds

## Existing Tests Requiring Updates

### Tests Affected by S-Curve Implementation (~30 tests)
**Files**: Various calculation tests
**Issue**: Tests assume midpoint occupancy (15.9%) instead of monthly average (31%)
**Fix Required**: Update expected values for:
- Year 1 NOI calculations
- Interest reserve amounts
- Tax benefit calculations
- Free investment coverage

### Tests Affected by Display Fix (~15 tests)
**Files**: UI component tests
**Issue**: Tests expect separate Year 1 tax benefit display (now removed)
**Fix Required**: Update snapshot tests and display expectations

### Tests Affected by Exit Catch-Up (~20 tests)
**Files**: HDC analysis and waterfall tests
**Issue**: Tests don't account for deferred fee catch-up
**Fix Required**: Add deferred fee tracking and exit distribution

### Tests Affected by Cash Flow Transparency (~10 tests)
**Files**: Cash flow display tests
**Issue**: Tests don't expect OZ Year 5 Tax column
**Fix Required**: Update table structure expectations

## Test Coverage Gaps Identified

### 1. Tax Benefit Delay Impact on IRR
**Gap**: Annual IRR can't detect delays < 12 months
**Recommendation**: Add tests for fractional year scenarios
**Status**: Deferred to roadmap (maintain stability)

### 2. Monthly vs Annual IRR Accuracy
**Gap**: No tests comparing monthly vs annual IRR precision
**Recommendation**: Create comparison tests
**Status**: Long-term roadmap item

### 3. Complex Deferral Scenarios
**Gap**: Limited tests for multi-year fee deferrals
**Recommendation**: Add stress tests for extended low-cash periods
**Status**: To be implemented

## Critical Test Validations

### 1. Year 1 Tax Benefit Calculation
```typescript
// Correct calculation (no double-counting):
const year1Benefit = depreciation * taxRate * (1 - hdcFeeRate);
// NOT: year1Benefit + totalBenefits
```

### 2. S-Curve Occupancy Formula
```typescript
// Monthly occupancy during lease-up:
occupancy = 1 / (1 + exp(-10 * (month/totalMonths - 0.5)));
// Average ~31% for 12-month lease-up
```

### 3. Interest Reserve Sizing
```typescript
// Reserve = Sum of monthly shortfalls:
for (month = 1 to leaseUpMonths) {
  monthlyNOI = stabilizedNOI * occupancy(month);
  shortfall = max(0, debtService - monthlyNOI);
  totalReserve += shortfall;
}
```

### 4. Exit Catch-Up Priority
```
1. Senior Debt
2. Philanthropic Debt
3. Outside Investor Sub-Debt
4. HDC Sub-Debt
5. Investor Sub-Debt
6. HDC Deferred Fees (catch-up)
7. Promote Split
```

## Test Maintenance Plan

### Immediate (Q4 2025)
1. Fix 86 failing tests to match new logic
2. Update snapshot tests for UI changes
3. Add validation for S-curve calculations
4. Create integration tests for catch-up logic

### Short-term (Q1 2026)
1. Add performance benchmarks
2. Create stress tests for edge cases
3. Improve test documentation
4. Add visual regression tests

### Long-term (2026+)
1. Implement monthly IRR test comparisons
2. Add Monte Carlo simulation tests
3. Create property-based testing suite
4. Add cross-browser testing

## Test Running Instructions

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- s-curve-interest-reserve
npm test -- hdc-catchup-waterfall
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Update Snapshots
```bash
npm test -- -u
```

## Known Test Issues

### 1. Floating Point Precision
Some tests may fail due to floating-point rounding differences. Use `toBeCloseTo()` with appropriate precision.

### 2. Timing Dependencies
Tests involving delays may be sensitive to system time. Use fixed dates when possible.

### 3. Large Number Formatting
Million/billion formatting can cause string comparison issues. Compare numeric values before formatting.

## Documentation Cross-References

- Main calculation logic: `/HDC_CALCULATION_LOGIC.md`
- S-curve implementation: `/calculations.ts` (lines 850-900)
- Exit waterfall: `/hdcAnalysis.ts` (exit distribution section)
- UI components: `/results/InvestorCashFlowSection.tsx`

## Version Control

- **Created**: September 2025
- **Version**: 2.0
- **Last Updated**: September 2025
- **Next Review**: Q4 2025

## Contact

For questions about test implementation or validation:
- Review HDC_CALCULATION_LOGIC.md first
- Check existing test files for patterns
- Consult development roadmap for priorities