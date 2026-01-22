# Returns Buildup Strip Data Source Audit

**Date:** 2026-01-19
**Component:** `frontend/src/components/taxbenefits/results/ReturnsBuiltupStrip.tsx`
**Status:** ✅ COMPLIANT - All values sourced from engine

---

## Executive Summary

The Returns Buildup Strip component is **fully compliant** with the calculation architecture principle. All financial values are sourced from the calculation engine (`mainAnalysisResults` and `cashFlows`). The component only performs UI display math (multiple contributions, percentages) which is acceptable.

---

## Value Source Tracing

### Core Metrics (from `mainAnalysisResults`)

| Display Label | Source Property | Line | Status |
|---------------|-----------------|------|--------|
| Total Investment | `results.totalInvestment` | 131 | ✅ Engine |
| Total Returns | `results.totalReturns` | 378, 652 | ✅ Engine |
| MOIC (Multiple) | `mainAnalysisResults.multiple` | 651 | ✅ Engine |
| Exit Proceeds | `results.exitProceeds` | 160 | ✅ Engine |
| Depreciation Benefits | `results.investorTaxBenefits` | 149 | ✅ Engine |
| Operating Cash Flow | `results.investorOperatingCashFlows` | 157 | ✅ Engine |
| Sub-Debt At Exit | `results.investorSubDebtAtExit` | 163 | ✅ Engine |
| Sub-Debt Interest Received | `results.investorSubDebtInterestReceived` | 166 | ✅ Engine |
| Remaining LIHTC Credits | `results.remainingLIHTCCredits` | 139 | ✅ Engine |

### OZ Benefits (from `mainAnalysisResults`)

| Display Label | Source Property | Line | Status |
|---------------|-----------------|------|--------|
| OZ Step-Up Savings | `results.ozStepUpSavings` | 173 | ✅ Engine |
| OZ Recapture Avoided | `results.ozRecaptureAvoided` | 170 | ✅ Engine |
| OZ Deferral NPV | `results.ozDeferralNPV` | 171 | ✅ Engine |
| OZ Exit Appreciation | `results.ozExitAppreciation` | 172 | ✅ Engine |

### Depreciation Breakdown (from `mainAnalysisResults`)

| Display Label | Source Property | Line | Status |
|---------------|-----------------|------|--------|
| Year 1 Bonus Tax Benefit | `results.year1BonusTaxBenefit` | 227 | ✅ Engine |
| Year 1 MACRS Tax Benefit | `results.year1MacrsTaxBenefit` | 228 | ✅ Engine |
| Years 2-Exit MACRS | `results.years2ExitMacrsTaxBenefit` | 229 | ✅ Engine |

### Cash Flow Aggregations (from `cashFlows[]`)

| Display Label | Source | Lines | Status |
|---------------|--------|-------|--------|
| Federal LIHTC | `Σ cf.federalLIHTCCredit` | 134-137 | ✅ Engine aggregate |
| State LIHTC | `Σ cf.stateLIHTCCredit` | 143-146 | ✅ Engine aggregate |
| Excess Reserve | `Σ cf.excessReserveDistribution` | 152-155 | ✅ Engine aggregate |
| AUM Fee Paid | `Σ cf.aumFeePaid` | 177-180 | ✅ Engine aggregate |
| Sub-Debt Interest | `Σ cf.subDebtInterest` | 181-184 | ✅ Engine aggregate |
| Outside Investor Pay | `Σ cf.outsideInvestorCurrentPay` | 185-188 | ✅ Engine aggregate |

---

## UI Display Math (Acceptable)

The following calculations are performed in the component for **display purposes only** - they do not recalculate financial values:

### 1. Multiple Contributions (lines 203, 216, 235, etc.)
```typescript
multiple: federalLIHTCTotal / totalInvestment
```
**Purpose:** Shows how much each component contributes to the overall MOIC.
**Status:** ✅ Acceptable - UI presentation math using engine values.

### 2. Percentage of Total (lines 412-414, 504-506)
```typescript
const percentOfTotal = totalValue > 0 ? (component.value / totalValue) * 100 : 0;
```
**Purpose:** Shows each component's percentage contribution.
**Status:** ✅ Acceptable - UI presentation math using engine values.

### 3. Group Totals (lines 140, 157, 174, 191)
```typescript
const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation + ozStepUpSavings;
const operatingCashTotal = investorOperatingCashFlows + excessReserveTotal;
```
**Purpose:** Groups related engine values for display categories.
**Status:** ✅ Acceptable - Aggregating engine values for UI grouping.

---

## Validation Check (lines 376-389)

The component includes a validation check that compares the sum of displayed components to `results.totalReturns`:

```typescript
const componentSum = components.reduce((sum, c) => sum + c.value, 0);
const totalReturns = results.totalReturns || 0;
if (discrepancy > tolerance && totalReturns > 0) {
  console.warn('IMPL-048b: Returns Buildup Strip component sum mismatch', {...});
}
```

**Purpose:** Debugging/verification to ensure all return components are captured.
**Status:** ✅ Acceptable - Verification logic, not financial calculation.

---

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ReturnsBuiltupStrip                      │
│                                                             │
│  Props:                                                     │
│  ├── mainAnalysisResults: InvestorAnalysisResults (engine)  │
│  └── cashFlows: CashFlowItem[] (engine)                     │
│                                                             │
│  Display Flow:                                              │
│  1. Read values directly from engine results                │
│  2. Sum cash flow items for grouped categories              │
│  3. Calculate multiple contribution (value / investment)    │
│  4. Calculate percentage of total (value / total * 100)     │
│  5. Render with appropriate formatting                      │
│                                                             │
│  NO recalculation of: IRR, Total Returns, Tax Benefits,     │
│  Exit Proceeds, or any other financial metric               │
└─────────────────────────────────────────────────────────────┘
```

---

## Findings Summary

| Category | Count | Status |
|----------|-------|--------|
| Direct Engine Values | 18 | ✅ COMPLIANT |
| Engine Aggregations | 6 | ✅ COMPLIANT |
| UI Display Math | 3 types | ✅ ACCEPTABLE |
| Financial Recalculations | 0 | ✅ NONE FOUND |

---

## Conclusion

**Status: ✅ COMPLIANT**

The Returns Buildup Strip component follows the calculation architecture principle:
- All financial calculations come from the engine
- Component only performs acceptable UI display math
- No duplicate financial calculations
- Ready for IMPL-067 (Excel export integration)

---

## Recommendation for IMPL-067

When adding Returns Buildup Strip data to Excel export, use the same data sources:

```typescript
// For Excel export, use these engine values directly:
const returnsBreakdown = {
  federalLIHTC: cashFlows.reduce((sum, cf) => sum + (cf.federalLIHTCCredit || 0), 0)
               + (investorResults.remainingLIHTCCredits || 0),
  stateLIHTC: cashFlows.reduce((sum, cf) => sum + (cf.stateLIHTCCredit || 0), 0),
  depreciationBenefits: investorResults.investorTaxBenefits,
  ozBenefits: {
    stepUpSavings: investorResults.ozStepUpSavings,
    exitAppreciation: investorResults.ozExitAppreciation,
    deferralNPV: investorResults.ozDeferralNPV,
    recaptureAvoided: investorResults.ozRecaptureAvoided,
  },
  operatingCashFlow: investorResults.investorOperatingCashFlows
                    + cashFlows.reduce((sum, cf) => sum + (cf.excessReserveDistribution || 0), 0),
  exitProceeds: investorResults.exitProceeds,
  subDebtAtExit: investorResults.investorSubDebtAtExit,
  totalReturns: investorResults.totalReturns,
  multiple: investorResults.multiple,
};
```

---

**Audit completed:** 2026-01-19
**Auditor:** Claude Code
