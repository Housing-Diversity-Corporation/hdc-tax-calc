# IMPL-048: IRR Calculation Audit

**Date:** 2026-01-06
**Status:** ✅ IMPLEMENTED (2026-01-06)
**File:** `/frontend/src/utils/taxbenefits/calculations.ts`

## Implementation Summary

All three issues have been fixed:

1. **Issue 1 (Exit Timing)**: Changed `cashFlowArray.push()` to `cashFlowArray[length-1] +=`
   - Exit proceeds now correctly at t=10 instead of t=11 for 10-year hold

2. **Issue 2 (OZ Benefits in IRR)**: Added `ozDeferralNPV + ozExitAppreciation` to exit year cash flow
   - IRR now includes all OZ benefits that were previously only in multiple

3. **Issue 3 (Recapture Timing)**: Moved recapture avoided from exit to annual recognition
   - Added `ozRecaptureAvoided` field to CashFlowItem (line 47 in types)
   - Calculate `yearlyDepreciationAmount * 0.25` in main loop (lines 1240-1247)
   - Include in annual `totalCashFlow`
   - Year 1 bonus depreciation benefit now recognized at t=1 instead of t=10

### Files Changed:
- `types/taxbenefits/index.ts`: Added `ozRecaptureAvoided?: number` field
- `calculations.ts`:
  - Line ~397: Track `yearlyDepreciationAmount`
  - Lines ~437-451: Capture depreciation in Year 1 and Years 2+
  - Lines ~1240-1260: Calculate `ozRecaptureAvoided` and add to `totalCashFlow`
  - Lines ~1500-1537: Restructured OZ benefit calculation and IRR cash flow array

### Test Results:
- 319 calculation tests passing
- 33 UI component tests passing
- Build successful

---

## Executive Summary

The IRR calculation is **understated** due to three issues:
1. **Off-by-one timing error**: Exit proceeds are placed at t=11 instead of t=10 for a 10-year hold
2. **OZ Benefits omission**: Opportunity Zone benefits are included in the multiple calculation but NOT in the IRR cash flow array
3. **Recapture avoided timing**: OZ recapture avoided is booked as lump sum at exit instead of annually as depreciation is taken

---

## Issue 1: Off-by-One Timing Error

### Current Behavior (BUGGY)

**Line 322** - Main loop creates Years 1 through holdPeriod:
```typescript
for (let year = 1; year <= paramHoldPeriod; year++) {
```

For a 10-year hold, this creates `investorCashFlows` with 10 elements (Years 1-10).

**Lines 1482-1484** - Cash flow array construction:
```typescript
const cashFlowArray = investorCashFlows.map(cf => cf.totalCashFlow);  // 10 elements
cashFlowArray.push(exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits);  // 11th element!
```

**Line 43** - IRR function prepends investment:
```typescript
const completeCashFlows = [-initialInvestment, ...cashFlows];  // 12 elements total
```

### Current Cash Flow Timeline (WRONG)

| Index | Time Period | Contents |
|-------|-------------|----------|
| 0 | t=0 | -Investment |
| 1 | t=1 | Year 1 cash flow |
| 2 | t=2 | Year 2 cash flow |
| ... | ... | ... |
| 10 | t=10 | Year 10 cash flow |
| 11 | t=11 | Exit proceeds ← **BUG: Should be at t=10** |

### Expected Cash Flow Timeline (CORRECT)

| Index | Time Period | Contents |
|-------|-------------|----------|
| 0 | t=0 | -Investment |
| 1 | t=1 | Year 1 cash flow |
| 2 | t=2 | Year 2 cash flow |
| ... | ... | ... |
| 10 | t=10 | Year 10 cash flow + Exit proceeds |

### Mathematical Impact

For a 10-year hold with exit proceeds discounted back:
- **Current**: Exit at t=11 → discounted by `(1+r)^11`
- **Expected**: Exit at t=10 → discounted by `(1+r)^10`

The extra year of discounting artificially lowers the IRR.

### Proposed Fix

Change lines 1482-1484 from:
```typescript
const cashFlowArray = investorCashFlows.map(cf => cf.totalCashFlow);
cashFlowArray.push(exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits);
```

To:
```typescript
const cashFlowArray = investorCashFlows.map(cf => cf.totalCashFlow);
// Add exit proceeds to final year's cash flow (not as separate element)
cashFlowArray[cashFlowArray.length - 1] += exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits;
```

---

## Issue 2: OZ Benefits Missing from IRR

### Current Behavior (INCONSISTENT)

**Lines 1487-1527** calculate three OZ benefit components:
- `ozRecaptureAvoided` - Avoided 25% federal recapture tax on depreciation (line 1506)
- `ozDeferralNPV` - Time value of deferring capital gains for 5 years (line 1518)
- `ozExitAppreciation` - Tax-free appreciation for 10+ year holds (line 1523)
- `totalOzBenefits` = sum of all three (line 1527)

**Line 1538** - Multiple includes OZ benefits:
```typescript
const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + totalOzBenefits + remainingLIHTCCredits;
```

**Line 1484** - IRR cash flow array does NOT include OZ benefits:
```typescript
cashFlowArray.push(exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits);
// Missing: totalOzBenefits
```

### Result

- **Multiple**: Correctly includes OZ benefits
- **IRR**: Incorrectly excludes OZ benefits

This creates a disconnect where the IRR and multiple are calculated on different return streams.

### Proposed Fix

Update line 1484 to include OZ benefits (after applying Issue 1 fix):
```typescript
cashFlowArray[cashFlowArray.length - 1] += exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits + totalOzBenefits;
```

**Note**: This requires moving the OZ benefit calculations (lines 1487-1527) BEFORE the cash flow array construction (currently at line 1482). Alternatively, restructure to calculate OZ benefits first.

---

## Issue 3: Recapture Avoided Timing (Most Impactful)

### Background: What is Recapture Avoided?

For **non-OZ investors**, when they sell the property, they owe 25% federal tax on all depreciation taken ("recapture tax"). For **OZ investors** who hold 10+ years, this tax is completely eliminated.

**Example:**
- Depreciable Basis: $38M
- Year 1 Depreciation (60% bonus + partial MACRS): $23.5M
- Years 2-10 Annual Depreciation: ~$1.4M each
- Cumulative Depreciation over 10 years: ~$36M
- Recapture Avoided: $36M × 25% = **$9M**

### Current Behavior (WRONG)

**Lines 1491-1506** calculate recapture avoided as a **lump sum at exit**:
```typescript
if (params.ozEnabled && paramHoldPeriod >= 10) {
  // A) Recapture Avoidance: Avoided 25% federal recapture tax on depreciation
  const depreciableBasis = Math.max(0, paramProjectCost - paramLandValue);
  const bonusDepreciationPct = params.yearOneDepreciationPct || 60;
  const bonusDepreciation = depreciableBasis * (bonusDepreciationPct / 100);
  const remainingBasis = depreciableBasis - bonusDepreciation;
  const depreciableLife = 27.5;
  const annualDepreciation = remainingBasis / depreciableLife;
  const year1Depreciation = bonusDepreciation + (annualDepreciation * 0.5);
  const years2PlusDepreciation = annualDepreciation * (paramHoldPeriod - 1);
  const cumulativeDepreciation = year1Depreciation + years2PlusDepreciation;
  ozRecaptureAvoided = cumulativeDepreciation * 0.25;  // ← ENTIRE BENEFIT AT EXIT
}
```

This is **after the main cash flow loop** (line 322), so `ozRecaptureAvoided` is:
- Not included in any annual `CashFlowItem`
- Only included in `totalOzBenefits` at exit (Issue 2)
- Being discounted from t=10 back to t=0

### The Problem: Year 1 Benefit Discounted 10 Years

The recapture avoided benefit **accrues each year as depreciation is taken**:

| Year | Depreciation | Recapture Avoided (25%) | Current Treatment | Correct Treatment |
|------|--------------|-------------------------|-------------------|-------------------|
| 1    | $23.5M       | **$5.88M**              | Booked at t=10    | Book at t=1       |
| 2    | $1.4M        | $0.35M                  | Booked at t=10    | Book at t=2       |
| 3    | $1.4M        | $0.35M                  | Booked at t=10    | Book at t=3       |
| ...  | ...          | ...                     | ...               | ...               |
| 10   | $1.4M        | $0.35M                  | Booked at t=10    | Book at t=10      |

**Year 1 has ~65% of total recapture avoided** due to bonus depreciation.

### IRR Impact Example

For $5.88M Year 1 recapture avoided at 15% IRR:
- **Current (at t=10)**: PV = $5.88M / (1.15)^10 = **$1.45M**
- **Correct (at t=1)**: PV = $5.88M / (1.15)^1 = **$5.11M**
- **Difference**: $3.66M value destruction in the model

### Why This Matters Conceptually

When an OZ investor takes depreciation in Year 1, they **lock in** the right to avoid recapture on that depreciation (assuming 10+ year hold). This is:
1. **Certain** - If they complete the hold period
2. **Earned** - At the time depreciation is taken
3. **Time-valuable** - Earlier is better

Non-OZ investors create a recapture *liability* each year; OZ investors create a recapture *savings* each year.

### Proposed Fix: Annual Recognition

**Option A: Add to Annual Cash Flows (Recommended)**

In the main loop (line 322), after calculating `depreciationTaxBenefit`, calculate and add recapture avoided:

```typescript
// Inside main loop, after depreciationTaxBenefit calculation (around line 455)
let yearlyRecaptureAvoided = 0;
if (params.ozEnabled && paramHoldPeriod >= 10) {
  // Calculate this year's depreciation amount (not the tax benefit)
  const thisYearDepreciation = /* from existing calculation */;
  yearlyRecaptureAvoided = thisYearDepreciation * 0.25; // 25% federal recapture rate
}

// Add to totalCashFlow for this year
totalCashFlow = operatingCashFlow + yearlyTaxBenefit + subDebtInterest + yearlyRecaptureAvoided;
```

**Option B: NPV Adjustment (Alternative)**

If you want to keep recapture avoided as a single line item but value it correctly, calculate the NPV of each year's avoided recapture at the investor's discount rate.

### Implementation Details

**New field needed in CashFlowItem:**
```typescript
// In /frontend/src/types/taxbenefits/index.ts
export interface CashFlowItem {
  // ... existing fields ...
  ozRecaptureAvoided?: number;  // NEW: This year's recapture avoided (OZ only)
}
```

**Track depreciation in main loop:**

The depreciation calculation already exists in the main loop (lines 393-455). We need to:
1. Capture the pre-tax depreciation amount (not just the tax benefit)
2. Calculate 25% of that as recapture avoided
3. Add it to that year's cash flow

**Existing depreciation calculation (lines 415-433):**
```typescript
// Year 1:
const bonusDepreciation = depreciableBasis * (paramYearOneDepreciationPct / 100);
const remainingBasis = depreciableBasis - bonusDepreciation;
const annualMACRS = remainingBasis / 27.5;
const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
// TOTAL Year 1 depreciation = bonusDepreciation + year1MACRS

// Years 2+:
const annualDepreciation = annualStraightLineDepreciation; // line 439
```

**Key insight:** The depreciation amount is already calculated each year but only the *tax benefit* (`depreciationTaxBenefit`) is used. We need to also track the *depreciation amount* to calculate recapture avoided.

### Validation

After fix, verify:
1. Sum of yearly `ozRecaptureAvoided` equals current total `ozRecaptureAvoided`
2. IRR increases significantly (due to front-loading Year 1 benefit)
3. Multiple stays the same (total dollars unchanged, just timing)

### Comparison: Three OZ Benefit Components

| Benefit | Timing | Current | Correct |
|---------|--------|---------|---------|
| Recapture Avoided | As depreciation taken | Exit only | **Annual** |
| Deferral NPV | Investment date | Exit only | **t=0** (arguably) |
| Exit Appreciation | At exit | Exit only | Exit only ✓ |

**Note on Deferral NPV:** This represents the time value of deferring capital gains tax. Since the investor benefits from this deferral starting at investment (t=0), it could arguably be recognized at t=0 rather than t=10. This is a smaller impact than recapture avoided.

---

## Code Structure for Fix

Current order (lines 1482-1540):
1. Line 1482-1484: Build cash flow array
2. Lines 1487-1527: Calculate OZ benefits
3. Line 1538: Calculate totalReturns (includes OZ)
4. Line 1540: Calculate IRR (uses cash flow array without OZ)

Proposed order:
1. Calculate OZ benefits FIRST
2. Build cash flow array INCLUDING OZ benefits
3. Calculate totalReturns
4. Calculate IRR

---

## Validation Test Cases

### Test Case 1: Basic 10-Year Hold (No OZ)

**Inputs:**
- Investor Equity: $8.2M
- Annual Cash Flows (Years 1-10): $0.65M each
- Exit Proceeds: $5M

**Expected:**
```
Cash Flow Array: [-8.2, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 5.65]
                  t=0   t=1   t=2   t=3   t=4   t=5   t=6   t=7   t=8   t=9   t=10
```

**Current Bug:**
```
Cash Flow Array: [-8.2, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 5.0]
                  t=0   t=1   t=2   t=3   t=4   t=5   t=6   t=7   t=8   t=9   t=10  t=11
```

### Test Case 2: With OZ Benefits

**Additional Inputs:**
- OZ Enabled: true
- OZ Recapture Avoided: $9.5M
- OZ Deferral NPV: $2M
- OZ Exit Appreciation: $1.5M
- Total OZ Benefits: $13M

**Expected Total at Exit (t=10):**
```
Year 10 cash flow + Exit Proceeds + OZ Benefits = $0.65M + $5M + $13M = $18.65M
```

---

## IRR Function Reference

The `calculateIRR` function (lines 42-76) uses Newton-Raphson iteration to find the discount rate where NPV = 0.

Key implementation details:
- Line 43: Prepends `-initialInvestment` to cash flows
- Line 52-58: Standard NPV calculation loop using `t` as the time index
- Line 74-75: Fallback CAGR calculation if Newton-Raphson fails

The function itself is correct; the issue is the input array being constructed incorrectly.

---

## Files to Modify

1. **`/frontend/src/utils/taxbenefits/calculations.ts`**
   - Lines 1482-1484: Fix cash flow array construction
   - Lines 1487-1527: Move OZ calculation before cash flow array OR add OZ to array after calculation

2. **`/frontend/src/utils/taxbenefits/__tests__/calculations.test.ts`**
   - Add test cases verifying correct exit timing
   - Add test cases verifying OZ benefits included in IRR

---

## Summary of Changes Required

### Issue 1 & 2: Exit Timing and OZ Benefits

| Line | Current Code | Change Required |
|------|--------------|-----------------|
| 1482-1484 | `.push(exitProceeds...)` | Use `[length-1] +=` instead |
| 1484 | Missing `totalOzBenefits` | Add `+ ozDeferralNPV + ozExitAppreciation` (NOT recapture) |
| 1487-1527 | After cash flow array | Move before OR restructure |

### Issue 3: Recapture Avoided Annual Recognition

| File | Location | Change Required |
|------|----------|-----------------|
| `types/taxbenefits/index.ts` | CashFlowItem | Add `ozRecaptureAvoided?: number` field |
| `calculations.ts` | Line ~455 (main loop) | Calculate yearly recapture avoided |
| `calculations.ts` | Line ~700 (totalCashFlow) | Include `ozRecaptureAvoided` in total |
| `calculations.ts` | Lines 1487-1506 | Remove lump-sum recapture calculation (now done annually) |

### Priority Order

1. **Issue 3 (Recapture Timing)** - Most impactful on IRR due to Year 1 bonus depreciation
2. **Issue 1 (Off-by-One)** - Straightforward fix, moderate impact
3. **Issue 2 (OZ in IRR)** - Already partially addressed by Issue 3

---

## Risk Assessment

**Medium Risk**: These changes affect both IRR calculation and annual cash flow displays.

### Expected Outcomes:
- IRR will increase significantly (all three issues compound)
- Multiple stays the same (total dollars unchanged)
- Annual cash flows will show new `ozRecaptureAvoided` column (for OZ deals)
- IRR and Multiple will be mathematically consistent

### Testing Required:
- Unit tests for IRR calculation with known expected values
- Unit tests verifying sum of annual recapture equals total
- Integration tests comparing IRR vs Multiple consistency
- UI verification that new cash flow field displays correctly
- Regression tests for non-OZ scenarios (should be unchanged)

---

## Appendix: Full Implementation Checklist

### Phase 1: Annual Recapture Recognition (Issue 3)

- [ ] Add `ozRecaptureAvoided?: number` to `CashFlowItem` interface
- [ ] In main loop, track raw depreciation amount (not just tax benefit)
- [ ] Calculate `yearlyRecaptureAvoided = depreciation * 0.25` when OZ enabled
- [ ] Add to `CashFlowItem` for each year
- [ ] Include in `totalCashFlow` calculation
- [ ] Remove post-loop `ozRecaptureAvoided` calculation (lines 1492-1506)
- [ ] Update audit export to show annual breakdown

### Phase 2: Exit Timing Fix (Issue 1)

- [ ] Change `cashFlowArray.push(...)` to `cashFlowArray[length-1] += ...`
- [ ] Add unit test with known IRR to verify timing

### Phase 3: Remaining OZ Benefits in IRR (Issue 2)

- [ ] Add `ozDeferralNPV + ozExitAppreciation` to exit year cash flow
- [ ] Consider moving `ozDeferralNPV` to t=0 (optional enhancement)

### Phase 4: Validation

- [ ] Run existing test suite
- [ ] Add new tests for each issue
- [ ] Manual testing with known deal parameters
- [ ] Compare IRR before/after with explanation
