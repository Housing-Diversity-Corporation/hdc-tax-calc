# Exit Catch-Up Waterfall Documentation

## Overview

At property exit, deferred fees and sub-debt balances are collected through a structured waterfall distribution. This document explains the catch-up mechanism implemented in v2.0 (September 2025).

## Example Structure Note
All examples use HDC's standard teaching structure for consistency and easy mental math:
- **Capital Stack**: 65% Senior Debt / 30% Philanthropic Debt / 5% Investor Equity
- **Dollar Example**: $65M / $30M / $5M on $100M total project cost
- **LTV**: 95% debt / 5% equity

*Note: Actual deals vary based on project specifics, lender requirements, and market conditions. This standardized structure is used for documentation clarity.*

## Exit Proceeds Distribution Order

The exit waterfall follows this strict priority order:

### 1. Senior Debt Repayment
- **Amount**: Outstanding senior debt balance
- **Priority**: First
- **Notes**: Must be paid in full before any other distributions

### 2. Philanthropic Debt Repayment
- **Amount**: Outstanding principal (interest-only loan, so full original amount)
- **Priority**: Second
- **Notes**: No accrued interest as it's paid monthly from operations

### 3. Outside Investor Sub-Debt Repayment
- **Amount**: Principal + accumulated PIK interest
- **Priority**: Third (highest among sub-debt)
- **Notes**: Includes both PIK accrued and any unpaid current pay portions

### 4. HDC Sub-Debt Repayment
- **Amount**: Principal + accumulated PIK interest
- **Priority**: Fourth
- **Notes**: Includes deferred current pay if applicable

### 5. Investor Sub-Debt Repayment
- **Amount**: Principal + accumulated PIK interest
- **Priority**: Fifth
- **Notes**: Paid to investor, not HDC

### 6. HDC Deferred Fee Catch-Up
- **Amount**: All accumulated deferred fees
- **Components**:
  - Deferred tax benefit fees (10% of annual tax benefits)
  - Deferred AUM fees (if applicable)
- **Priority**: Sixth (before promote split)
- **Critical**: Paid from remaining proceeds before investor/HDC split

### 7. Promote Split Distribution
- **Amount**: Remaining proceeds after all above payments
- **Split**:
  - 65% to Investor (typical)
  - 35% to HDC (typical)
- **Notes**: Only applies to true excess after all obligations

## Deferred Fee Tracking

### Tax Benefit Fees
```typescript
// Annual deferral when cash insufficient:
if (distributableCash < hdcTaxBenefitFee) {
  deferredAmount = hdcTaxBenefitFee - distributableCash;
  totalDeferredTaxFees += deferredAmount;
}
```

### AUM Fees
```typescript
// Annual deferral when cash insufficient:
if (remainingCash < aumFee) {
  deferredAmount = aumFee - remainingCash;
  totalDeferredAumFees += deferredAmount;
}
```

## Exit Calculation Example

Given:
- Exit gross proceeds: $200M
- Senior debt balance: $52M
- Philanthropic debt: $30M
- Outside investor sub-debt + PIK: $0
- HDC sub-debt + PIK: $0
- Deferred tax benefit fees: $3M
- Deferred AUM fees: $5M

### Waterfall Distribution:

1. **Senior Debt**: $200M - $52M = $148M remaining
2. **Philanthropic Debt**: $148M - $30M = $118M remaining
3. **Outside Investor Sub-Debt**: $118M - $0 = $118M remaining
4. **HDC Sub-Debt**: $118M - $0 = $118M remaining
5. **HDC Deferred Fees**: $118M - $8M = $110M remaining
   - Tax benefit fees: $3M to HDC
   - AUM fees: $5M to HDC
6. **Promote Split**: $110M
   - Investor (65%): $71.5M
   - HDC (35%): $38.5M

### HDC Total at Exit:
- Sub-debt repayment: $0
- Deferred fee catch-up: $8M
- Promote share: $38.5M
- **Total**: $46.5M

### Investor Total at Exit:
- Promote share: $71.5M
- Outside investor debt: $0
- **Net**: $71.5M

## Key Implementation Details

### 1. Deferred Fees Are NOT Sub-Debt
- Deferred fees don't accrue interest
- They're operational obligations, not debt
- Paid before promote split but after all debt

### 2. DSCR Management During Operations
- Target 1.05x DSCR maintained annually
- Fees defer when payment would break DSCR
- Deferral order:
  1. Tax benefit fees (first to defer)
  2. AUM fees
  3. Sub-debt current pay
  4. Outside investor (last to defer)

### 3. Transparency in Cash Flow Tables
The HDC Cash Flow Section now shows:
- Annual fee deferrals
- Accumulated deferred balances
- Exit catch-up amounts
- Clear tracking of all components

## Code References

### Main Calculation Logic
- **File**: `/src/utils/HDCCalculator/hdcAnalysis.ts`
- **Function**: `calculateHDCAnalysis()`
- **Lines**: Exit waterfall implementation

### Display Components
- **File**: `/src/components/HDCCalculator/results/HDCCashFlowSection.tsx`
- **Lines**: Shows deferred fees and catch-up in table

### Test Coverage
- **File**: `/src/utils/HDCCalculator/__tests__/hdc-catchup-waterfall.test.ts`
- **Purpose**: Validates catch-up calculations and priority

## Common Scenarios

### Scenario 1: Full Payment
If exit proceeds are sufficient, all deferred amounts are paid in full before the promote split.

### Scenario 2: Partial Payment
If proceeds are insufficient:
1. Senior and philanthropic debt paid first (must be paid)
2. Sub-debt paid in priority order
3. Deferred fees may be partially paid
4. Promote split only on true remainder

### Scenario 3: High Performance Exit
With high exit proceeds:
1. All debt and deferred fees paid in full
2. Large remainder for promote split
3. HDC benefits from both catch-up AND promote share

## Version History

- **v2.0 (Sep 2025)**: Initial implementation of catch-up waterfall
- **Key Fix**: HDC now properly receives deferred fees at exit
- **Enhancement**: Clear tracking and display of all components