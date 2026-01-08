# IMPL-048b: Returns Buildup Strip Audit

**Date:** 2026-01-06
**Status:** ✅ IMPLEMENTED (2026-01-06)

## Implementation Summary

All issues have been fixed:

1. **Double-counting bug**: Changed `totalReturns` formula to use `exitOnlyOzBenefits = ozDeferralNPV + ozExitAppreciation`
   - `ozRecaptureAvoided` is no longer double-counted (it's already in `cumulativeReturns`)

2. **Missing `remainingLIHTCCredits`**: Now included in Federal LIHTC total in strip
   - Added `remainingLIHTCCredits` to `InvestorAnalysisResults` type
   - Exposed in calculation results

3. **Missing `excessReserveDistribution`**: Now included in Operating Cash Flow total in strip

4. **Validation check**: Added console warning when components don't sum to total

### Files Changed:
- `types/taxbenefits/index.ts`: Added `remainingLIHTCCredits?: number` field
- `calculations.ts`:
  - Line ~1548-1551: Fixed `totalReturns` formula to avoid double-counting
  - Line ~1599: Exposed `remainingLIHTCCredits` in results
- `ReturnsBuiltupStrip.tsx`:
  - Lines ~115-122: Include `remainingLIHTCCredits` in Federal LIHTC total
  - Lines ~133-139: Include `excessReserveDistribution` in Operating Cash Flow
  - Lines ~284-299: Added validation check for component sum

### Test Results:
- 319 calculation tests passing
- 12 Returns Buildup Strip tests passing

---

## Original Problem Statement

The Returns Buildup Strip shows component values that don't sum to the displayed total:
- Sum of components: $111.53M
- Displayed total: $123.29M
- Gap: $11.76M (~0.32x / 9%)

---

## Audit Findings

### 1. CRITICAL BUG: Double-Counting `ozRecaptureAvoided` in `totalReturns`

**Location:** `calculations.ts` lines 1527-1548

**Root Cause:** The IMPL-048 fix introduced a regression. When `ozRecaptureAvoided` was moved from a lump-sum exit calculation to annual recognition, it was:

1. Added to each year's `totalCashFlow` (line 1260):
```typescript
const totalCashFlow = yearlyTaxBenefit + operatingCashFlow + federalLIHTCCredit + stateLIHTCCredit +
                     investorSubDebtInterestReceived + excessReserveDistribution + ozRecaptureAvoided;
```

2. Accumulated into `cumulativeReturns` (line 1261):
```typescript
cumulativeReturns += totalCashFlow;
```

3. **BUT ALSO** included in `totalOzBenefits` (line 1530):
```typescript
const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation;
```

4. And then `totalOzBenefits` is added to `totalReturns` (line 1548):
```typescript
const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits;
```

**Result:** `ozRecaptureAvoided` is counted TWICE in `totalReturns`:
- Once in `cumulativeReturns` (from annual cash flows)
- Again in `totalOzBenefits`

**Note:** The IRR calculation correctly avoids this double-count (see line 1536-1537 comment), but `totalReturns` does not.

---

### 2. Missing Display Component: `remainingLIHTCCredits`

**Location:** `calculations.ts` lines 1471-1495

**Description:** For hold periods < 11 years, any remaining LIHTC credits (Year 11+ catch-up) are added to `totalReturns` at exit.

**Problem:**
- `remainingLIHTCCredits` is calculated and used in `totalReturns` formula
- NOT exposed in `InvestorAnalysisResults` type
- NOT displayed in Returns Buildup Strip
- NOT included in Federal/State LIHTC totals (those only sum from cash flows)

**Impact:** If a deal has remaining LIHTC credits, they're in the total but not visible in the component breakdown.

---

### 3. Missing Display Component: `excessReserveDistribution`

**Location:** `calculations.ts` lines 1208-1217

**Description:** When the interest reserve period ends with unused funds, the excess is distributed to investors.

**Problem:**
- `excessReserveDistribution` IS in each `CashFlowItem`
- IS included in `totalCashFlow` → `cumulativeReturns`
- NOT summed and displayed in Returns Buildup Strip

**Impact:** Minor - only affects deals with interest reserves that aren't fully drawn.

---

## Component Mapping

### What's in `totalReturns` (line 1548):
```typescript
totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits
```

### What's in `cumulativeReturns` (from `totalCashFlow`):
| Component | Strip Display | Status |
|-----------|---------------|--------|
| `yearlyTaxBenefit` | "Depreciation Benefits" | ✅ Displayed |
| `operatingCashFlow` | "Operating Cash Flow" | ✅ Displayed |
| `federalLIHTCCredit` | "Federal LIHTC" | ✅ Displayed |
| `stateLIHTCCredit` | "State LIHTC Credits" | ✅ Displayed |
| `investorSubDebtInterestReceived` | "Sub-Debt Interest" | ✅ Displayed |
| `excessReserveDistribution` | — | ❌ NOT Displayed |
| `ozRecaptureAvoided` | "OZ Benefits" (part of) | ⚠️ Double-counted |

### Exit Components (added to `totalReturns`):
| Component | Strip Display | Status |
|-----------|---------------|--------|
| `exitProceeds` | "Exit Proceeds (net)" | ✅ Displayed |
| `investorSubDebtAtExit` | "Sub-Debt Repayment" | ✅ Displayed |
| `ozDeferralNPV` | "OZ Benefits" (part of) | ✅ Displayed |
| `ozExitAppreciation` | "OZ Benefits" (part of) | ✅ Displayed |
| `ozRecaptureAvoided` | "OZ Benefits" (part of) | ⚠️ DOUBLE-COUNTED |
| `remainingLIHTCCredits` | — | ❌ NOT Displayed |

---

## Recommended Fixes

### Fix 1: Remove Double-Counting from `totalReturns` (CRITICAL)

**In `calculations.ts` around line 1548:**

Change:
```typescript
const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits;
```

To:
```typescript
// IMPL-048b: Don't double-count ozRecaptureAvoided - it's already in cumulativeReturns
const exitOnlyOzBenefits = ozDeferralNPV + ozExitAppreciation;
const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + exitOnlyOzBenefits + remainingLIHTCCredits;
```

### Fix 2: Expose `remainingLIHTCCredits` in Results

**In `types/taxbenefits/index.ts` - InvestorAnalysisResults:**
```typescript
remainingLIHTCCredits?: number; // Year 11+ LIHTC credits received at exit
```

**In `calculations.ts` baseResults:**
```typescript
remainingLIHTCCredits, // IMPL-048b: Expose for UI display
```

### Fix 3: Update Returns Buildup Strip

**In `ReturnsBuiltupStrip.tsx` - deriveReturnComponents:**

Add remaining LIHTC credits display:
```typescript
// Add remaining LIHTC credits (Year 11+) if any
const remainingLIHTC = results.remainingLIHTCCredits || 0;
if (remainingLIHTC > 0) {
  components.push({
    label: 'Remaining LIHTC (Year 11+)',
    value: remainingLIHTC,
    multiple: remainingLIHTC / totalInvestment,
    color: COMPONENT_COLORS.federalLIHTC,
    category: 'tax',
  });
}
```

Add excess reserve display (optional):
```typescript
// Sum excess reserve distributions
const excessReserveTotal = cashFlows.reduce(
  (sum, cf) => sum + (cf.excessReserveDistribution || 0),
  0
);
if (excessReserveTotal > 0) {
  components.push({
    label: 'Excess Reserve Distribution',
    value: excessReserveTotal,
    multiple: excessReserveTotal / totalInvestment,
    color: COMPONENT_COLORS.operatingCash,
    category: 'cash',
  });
}
```

---

## Expected Impact of Fix 1

After removing double-counting:
- `totalReturns` will decrease by `ozRecaptureAvoided` amount
- The gap between component sum and total should be eliminated
- Multiple will be recalculated lower (more accurate)

**User's numbers:**
- Gap: $11.76M
- If `ozRecaptureAvoided` ≈ $11.76M, this confirms the double-counting is the primary cause

---

## Verification Checklist

After implementing fixes:
- [ ] Component sum equals displayed total (within rounding)
- [ ] OZ Benefits shown once (not double-counted)
- [ ] IRR calculation still correct (already properly handles this)
- [ ] Remaining LIHTC credits visible when applicable
- [ ] All tests pass
