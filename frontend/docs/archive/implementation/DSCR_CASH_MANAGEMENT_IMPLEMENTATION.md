# DSCR Cash Management System Implementation Plan

## Overview
Implementing a sophisticated cash management system that maintains exactly 1.05 DSCR while optimizing distributions and protecting all stakeholders.

## Core Principle
**Target DSCR = 1.05** (not minimum, but exact target)
- Distribute all available cash while maintaining exactly 1.05x coverage
- Defer payments when necessary to maintain covenant
- Catch up deferred payments when excess cash available

## Implementation Components

### 1. New Input Fields Required
```typescript
// In HDC Fees Section or new Cash Management Section
hdcDeferralInterestRate: number; // Annual rate for deferred HDC fees (e.g., 8%)
subDebtDefaultPremium: number;   // Additional rate on deferred sub-debt (e.g., 2%)
```

### 2. Payment Priority Waterfall (Normal Operations)
When distributing available cash above 1.05 DSCR:
1. **Outside Investor Current Interest** - Honor external commitments first
2. **Other Sub-Debt Current Interest** - Investor sub-debt, HDC sub-debt
3. **HDC AUM Fee** - Ongoing management fee
4. **HDC Tax Benefit Fee** - Performance fee on tax savings
5. **Catch-up on Deferrals** - In reverse order (see below)
6. **Distributions** - To equity holders per promote split

### 3. Deferral Priority (When Cash Constrained)
When we must defer to maintain 1.05 DSCR, defer in order:
1. **First**: HDC Tax Benefit fees
2. **Second**: HDC AUM fees
3. **Third**: Other sub-debt current pay
4. **Last**: Outside investor current pay

### 4. Catch-up Priority (Reverse of Deferral)
When paying deferred amounts from excess cash:
1. **First**: Outside investor deferrals + accrued interest
2. **Second**: Other sub-debt deferrals + accrued interest
3. **Third**: HDC AUM fee deferrals + accrued interest
4. **Last**: HDC Tax Benefit fee deferrals + accrued interest

### 5. Interest on Deferrals
```typescript
// HDC Deferrals
hdcDeferredBalance = hdcDeferredPrincipal * (1 + hdcDeferralRate/12)^months

// Sub-Debt Deferrals
subDebtDeferredBalance = deferredPrincipal * (1 + (statedRate + defaultPremium)/12)^months
```

### 6. Cash Flow Logic Per Year

```typescript
function calculateYearCashFlow(year: number) {
  // Step 1: Calculate available cash maintaining 1.05 DSCR
  const requiredForDSCR = hardDebtService * 1.05;
  const availableForSoftPay = Math.max(0, NOI - requiredForDSCR);

  // Step 2: Calculate all current obligations
  const currentObligations = {
    outsideInvestor: calculateCurrentPay(outsideInvestorBalance, rate, currentPayPct),
    otherSubDebt: calculateCurrentPay(otherSubDebtBalance, rate, currentPayPct),
    hdcAUM: aumFeeAmount,
    hdcTaxBenefit: taxBenefitFeeAmount
  };

  // Step 3: Apply payment waterfall
  let remainingCash = availableForSoftPay;
  const payments = {};
  const deferrals = {};

  // Pay in priority order
  for (const [obligation, amount] of orderedObligations) {
    if (remainingCash >= amount) {
      payments[obligation] = amount;
      remainingCash -= amount;
    } else {
      payments[obligation] = remainingCash;
      deferrals[obligation] = amount - remainingCash;
      remainingCash = 0;
    }
  }

  // Step 4: Use excess for catch-up (in reverse priority)
  if (remainingCash > 0 && totalDeferredBalances > 0) {
    remainingCash = applyCatchUpPayments(remainingCash, deferredBalances);
  }

  // Step 5: Remaining cash for distributions
  const distributableCash = remainingCash;

  // Step 6: Update deferred balances with interest
  updateDeferredBalances(deferrals, payments);
}
```

## File Changes Required

### 1. `/src/types/HDCCalculator/index.ts`
- Add deferral tracking fields to CashFlowItem
- Add new parameters for deferral interest rates

### 2. `/src/utils/HDCCalculator/calculations.ts`
- Replace current DSCR logic with new cash management system
- Add payment waterfall implementation
- Add deferral and catch-up logic
- Track deferred balances with interest

### 3. `/src/components/HDCCalculator/inputs/HDCFeesSection.tsx`
- Add HDC deferral interest rate input
- Add sub-debt default premium input

### 4. `/src/components/HDCCalculator/results/DistributableCashFlowTable.tsx`
- Show maintained 1.05 DSCR
- Display deferrals by category
- Show catch-up payments

### 5. `/src/utils/HDCCalculator/HDC_CALCULATION_LOGIC.md`
- Document new cash management system
- Explain waterfall priorities
- Detail interest accrual methodology

### 6. Test Files
- Update existing tests for new logic
- Add tests for deferral scenarios
- Add tests for catch-up mechanisms

## Benefits of This System

1. **Covenant Compliance**: Always maintains 1.05 DSCR for philanthropic lender
2. **Investor Protection**: External investors paid first, caught up first
3. **Cash Optimization**: Distributes maximum possible while maintaining safety
4. **Transparency**: Clear priorities and automatic mechanisms
5. **Incentive Alignment**: Penalty rates discourage excessive deferrals

## Risk Mitigation

- 5% cushion on total debt provides ~50% coverage of outside investor needs
- Automatic deferral prevents covenant breach
- Catch-up mechanism ensures all parties eventually made whole
- Interest on deferrals compensates for time value

## Next Steps

1. Implement core calculation changes
2. Update UI components for new inputs
3. Update documentation files
4. Create comprehensive tests
5. Validate with sample scenarios