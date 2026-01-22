# IMPL-065 Phase 3B Analysis Report

**Date:** 2026-01-19
**Analyst:** Claude Code
**Status:** Analysis Complete - Ready for Review

---

## 1. Executive Summary

After detailed analysis of `useHDCCalculations.ts` and `calculations.ts`, the findings are:

| Hook Calculation | Engine Has Equivalent? | Action |
|------------------|----------------------|--------|
| `depreciationCalculations` (177-230) | Partial | **KEEP** - Needed as INPUT |
| `taxCalculations` (238-354) | No | **KEEP** - Needed as INPUT |
| `advanceFinancingCalculations` (357-379) | No | **KEEP** - UI-specific |
| `ozDeferralNPV` (724-741) | **YES** | **REMOVE** |
| `unifiedBenefitsSummary` (753-769) | No | **KEEP** - UI aggregation |

**Only 1 calculation needs removal:** `ozDeferralNPV` (hook calculates, engine also calculates)

---

## 2. Engine Output Inventory

### 2.1 What `calculateFullInvestorAnalysis()` Returns

```typescript
// From calculations.ts:1586-1632
InvestorAnalysisResults {
  // Cash flows
  investorCashFlows: CashFlowItem[],

  // Core returns
  exitProceeds, totalInvestment, totalReturns, multiple, irr,

  // Tax benefits
  investorTaxBenefits: sum of cf.taxBenefit,

  // Depreciation breakdown (IMPL-061)
  year1BonusTaxBenefit,
  year1MacrsTaxBenefit,
  years2ExitMacrsTaxBenefit,

  // OZ benefits (IMPL-048, IMPL-057)
  ozRecaptureAvoided,
  ozDeferralNPV,          // ← ENGINE CALCULATES THIS
  ozExitAppreciation,
  ozStepUpSavings,

  // Optional depreciation schedule
  depreciationSchedule?: DepreciationSchedule  // if includeDepreciationSchedule=true
}
```

### 2.2 Key Finding: OZ Deferral NPV

**Engine calculation (calculations.ts:1518-1532):**
```typescript
// B) Deferral NPV: Time value of deferring capital gains tax for 5 years (8% discount rate)
const ozDeferredGains = params.deferredCapitalGains || 0;
const capitalGainsTaxRateDecimal = (params.capitalGainsTaxRate || calculatedCapGainsRate) / 100;
const discountRate = 0.08;
const deferralYears = 5;
const npvFactor = 1 - (1 / Math.pow(1 + discountRate, deferralYears)); // ~0.32
ozDeferralNPV = ozDeferredGains * capitalGainsTaxRateDecimal * npvFactor;
```

**Hook calculation (useHDCCalculations.ts:724-741):**
```typescript
const ozDeferralNPV = useMemo(() => {
  const discountRate = 0.10; // 10% discount rate  ← DIFFERENT FROM ENGINE!
  // ... same formula but different rate
}, [...]);
```

**DISCREPANCY:** Hook uses 10% discount rate, engine uses 8%. This is a bug!

---

## 3. Hook Calculation Analysis

### 3.1 `depreciationCalculations` (lines 177-230) - **KEEP**

**What it calculates:**
- `depreciableBasis` - Building basis for depreciation
- `yearOneDepreciation` - Bonus + Year 1 MACRS
- `annualStraightLineDepreciation` - Annual MACRS amount
- `years2toNDepreciation`, `totalDepreciation`

**Why KEEP:**
1. These values are passed TO the engine as params
2. Engine uses them internally but doesn't expose raw depreciation amounts
3. UI components display these values directly
4. Engine returns tax BENEFITS (depreciation × rate), not raw depreciation

**Architecture compliance:** This is INPUT calculation, not duplication.

### 3.2 `taxCalculations` (lines 238-354) - **KEEP**

**What it calculates:**
- `effectiveTaxRateForBonus` - Rate for bonus depreciation
- `effectiveTaxRateForStraightLine` - Rate for MACRS
- `bonusConformityRate` - State conformity adjustment
- `totalTaxBenefit`, `hdcFee`, `netTaxBenefit`

**Why KEEP:**
1. Tax rates are INPUT params to the engine
2. Hook calculates rates based on investor state, track (REP/non-REP), etc.
3. Engine receives these rates and applies them
4. Line 798: `totalTaxBenefit: mainAnalysisResults.investorTaxBenefits` - hook already uses engine value!

**Architecture compliance:** This is INPUT calculation + engine override for output.

### 3.3 `advanceFinancingCalculations` (lines 357-379) - **KEEP**

**What it calculates:**
- `investorUpfrontCash` - Advance payment amount
- `hdcAdvanceOutlay` - HDC's outlay for advance
- `hdcFinancingCost` - Financing cost

**Why KEEP:**
1. This is UI-specific preview calculation
2. Engine handles actual cash flow impact internally
3. Not a financial calculation that affects returns

**Architecture compliance:** UI logic, not duplication.

### 3.4 `ozDeferralNPV` (lines 724-741) - **REMOVE**

**What it calculates:**
- NPV of deferring capital gains tax for 5 years

**Why REMOVE:**
1. Engine already calculates `ozDeferralNPV` at lines 1518-1532
2. Hook uses DIFFERENT discount rate (10% vs engine's 8%)
3. This is causing inconsistency

**Fix:**
- Remove hook calculation
- Use `mainAnalysisResults.ozDeferralNPV` directly

### 3.5 `unifiedBenefitsSummary` (lines 753-769) - **KEEP**

**What it calculates:**
- `total10YearBenefits` - Sum of all benefits for display
- `benefitMultiple` - Benefits / equity ratio
- `excessBenefits` - Benefits beyond investment recovery

**Why KEEP:**
1. This is UI aggregation for display purposes
2. Combines values FROM engine (netTaxBenefit, lihtcResult)
3. Engine doesn't provide a summary like this

**Architecture compliance:** UI aggregation using engine values.

---

## 4. HDCComprehensiveReport.tsx Analysis

### Lines 118-128 - Depreciation calculations

**What it calculates:**
```typescript
const totalProjectCost = (params.projectCost || 0) + (params.predevelopmentCosts || 0);
const depreciableBasis = totalProjectCost - (params.landValue || 0);
const bonusDepreciation = depreciableBasis * (costSegPct / 100);
const remainingBasis = depreciableBasis - bonusDepreciation;
const annualMACRS = remainingBasis / 27.5;
// ... mid-month convention calculations
```

**Why REMOVE:**
1. Engine provides `depreciationSchedule` with all these values
2. Component receives `mainAnalysisResults` which has depreciation data
3. Values should match, so use engine values

**Fix:**
- Use values from `mainAnalysisResults.depreciationSchedule` or `depreciationCalculations` passed as props

---

## 5. Recommended Actions

### Phase 3B-1: Remove `ozDeferralNPV` from hook (LOW RISK)

**File:** `useHDCCalculations.ts`
**Lines:** 724-749

**Change:**
1. Remove the `useMemo` block calculating `ozDeferralNPV`
2. Update return statement to use `mainAnalysisResults.ozDeferralNPV`

**Impact:**
- Fixes discount rate inconsistency (hook 10% vs engine 8%)
- Single source of truth for OZ deferral NPV

### Phase 3B-2: Fix HDCComprehensiveReport.tsx (LOW RISK)

**File:** `HDCComprehensiveReport.tsx`
**Lines:** 118-128

**Change:**
- Remove local depreciation calculations
- Use values from props (already receives `mainAnalysisResults`)

**Impact:**
- Consistent depreciation values in PDF export

### Phase 3B-3: NO CHANGES NEEDED

The following are NOT violations - they are architecture-compliant:

| Calculation | Reason |
|-------------|--------|
| `depreciationCalculations` | Input to engine, not duplication |
| `taxCalculations` | Input rates, already uses engine output |
| `advanceFinancingCalculations` | UI preview only |
| `unifiedBenefitsSummary` | UI aggregation using engine values |

---

## 6. UI Dependencies Check

### Components using `ozDeferralNPV`:

| Component | Usage |
|-----------|-------|
| `TaxPlanningCapacitySection.tsx` | Display OZ benefit |
| `InvestorReturnsSheet.ts` | Export value |
| `validationSheet.ts` | Validation check |

**All can use `mainAnalysisResults.ozDeferralNPV` instead.**

### Components using depreciation values:

| Component | Usage |
|-----------|-------|
| `HDCComprehensiveReport.tsx` | PDF export |
| `DepreciationSection.tsx` | Display schedule |
| `ReturnsBuiltupStrip.tsx` | Show breakdown |

**All receive values via props from hook, which calculates them for engine input.**

---

## 7. Verification Plan

After Phase 3B changes:

1. **Unit tests:** Run `npm test`
2. **Export validation:** Generate fresh Excel, verify 47/48 checks pass
3. **UI spot check:**
   - OZ Deferral NPV displays correctly
   - Depreciation values in PDF match UI
   - No console errors

---

## 8. Conclusion

The hook violations are less severe than initially assessed:

- **1 true violation:** `ozDeferralNPV` (duplicate calculation with different rate)
- **4 false positives:** Calculations that are INPUT prep or UI aggregation

Phase 3B scope reduced to:
1. Remove `ozDeferralNPV` from hook
2. Clean up HDCComprehensiveReport.tsx depreciation

**Risk level:** LOW - Both changes have engine equivalents available.

---

**Approved for implementation:** [ ] Yes / [ ] No (needs discussion)
