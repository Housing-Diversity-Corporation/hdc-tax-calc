# TaxBenefits Calculator — Debugging Patterns

**Version:** 1.0
**Created:** 2026-01-14
**Last Updated:** 2026-01-14

---

## Purpose

This document catalogs debugging patterns discovered during development.
Check this document FIRST when encountering unexpected behavior to save debugging time.

---

## Pattern Index

| Pattern | Symptom | Time Saved |
|---------|---------|------------|
| [Hidden Value Bug](#pattern-hidden-value-bug) | UI doesn't respond to parameter changes | 4+ hours |
| [Layer-by-Layer Validation](#pattern-layer-by-layer-validation) | Display value incorrect, unclear where the bug is | 2+ hours |
| [Excess Reserve Diagnostic](#pattern-excess-reserve-diagnostic) | Interest reserve nearly 100% returned | 3+ hours |

---

## Pattern: Hidden Value Bug

**IMPL Reference:** IMPL-057 (2026-01-14)
**Discovered During:** OZ Version toggle debugging

### Symptoms

- UI display doesn't respond to parameter changes
- Percentage calculations appear "inverted" (increase when should decrease, or vice versa)
- Multiple doesn't change when component values should change
- Value appears correct in IRR/Multiple but not in displayed breakdown

### Root Cause

Value is calculated and used internally (e.g., in IRR calculation) but NOT exposed in the results interface for UI display.

**The calculation is CORRECT. The display is INCOMPLETE.**

### Why This Happens

1. Developer adds new calculation to engine
2. Value is included in totalCashFlow/totalReturns
3. IRR and Multiple calculations work correctly
4. But value is NOT added to:
   - `InvestorAnalysisResults` interface
   - `baseResults` return object
   - UI component's display logic

### Diagnosis Steps

**Do these BEFORE assuming calculation bugs:**

1. **Verify calculation exists in engine:**
   ```bash
   grep -n "variableName" src/utils/taxbenefits/calculations.ts
   ```

2. **Check if value is in interface:**
   ```bash
   grep -n "variableName" src/types/taxbenefits/index.ts
   ```

3. **Check if value is returned in results:**
   Search `baseResults` object in calculations.ts (~line 1568)

4. **Check if UI receives the value:**
   ```bash
   grep -n "variableName" src/components/taxbenefits/results/*.tsx
   ```

### Fix Pattern

Typically requires only 4-5 lines of code:

```typescript
// 1. Add to types/taxbenefits/index.ts (InvestorAnalysisResults interface)
variableName?: number;  // Description of what this value represents

// 2. Sum/assign value in calculations.ts (before baseResults)
const variableName = investorCashFlows.reduce((sum, cf) => sum + (cf.variableName || 0), 0);

// 3. Include in baseResults return object (calculations.ts)
variableName,

// 4. Add to UI component's total calculation
const totalValue = existingValue + variableName;
```

### Example: ozStepUpSavings (IMPL-057)

**Problem:** OZ Benefits row showed LOWER % when switching to higher step-up percentage.

**Investigation showed:**
- `stepUpTaxSavings` was calculated correctly in engine (line 1206)
- Included in annual `totalCashFlow` (line 1267)
- Included in `cumulativeReturns` and `totalReturns`
- IRR and Multiple were CORRECT
- BUT `stepUpTaxSavings` was NOT in `baseResults`
- AND NOT displayed in Returns Buildup Strip

**The "inversion":**
- Denominator (`totalReturns`) increased with step-up savings
- Numerator (displayed OZ Benefits) stayed the same
- Therefore percentage = numerator/denominator DECREASED

**Fix:** Expose `ozStepUpSavings` in interface and include in UI total.

### Prevention Checklist

For any new calculated value:

- [ ] Calculated in engine? ✓
- [ ] In cash flow items (if per-year)? ✓
- [ ] Added to InvestorAnalysisResults interface? ← Often missed
- [ ] Returned in baseResults? ← Often missed
- [ ] Included in UI component totals? ← Often missed
- [ ] UI responds to parameter changes? ← Final verification

---

## Pattern: Layer-by-Layer Validation

**ISS Reference:** ISS-052 (2026-01-27)
**Discovered During:** Operating Cash Flow 406% overstatement debugging

### Symptoms

- A display value is clearly wrong (e.g., 406% too high)
- Per-year values in Excel look correct, but total is wrong
- Or vice versa: total looks correct but per-year is off

### Diagnosis Steps

When a display value is wrong, trace through layers systematically:

1. **Check Excel export** — Does the wrong value appear there too?
   - If YES: Bug is in engine or aggregation
   - If NO: Bug is in UI display logic

2. **Check Waterfall sheet** — Are per-year values correct?
   - If YES: Bug is in aggregation/totaling
   - If NO: Bug is in waterfall calculation

3. **Check conservation** — Does Investor + HDC = Total Available?
   - If YES: Waterfall split is correct, look elsewhere
   - If NO: Waterfall has a bug

4. **Trace aggregation** — If per-year correct but total wrong, find where sum is computed

### Example: ISS-052

**Problem:** Operating Cash showed $1.95M but per-year waterfall summed to $385K.

**Layer trace:**
- Excel export: $1.95M (wrong appears in export too → not UI bug)
- Waterfall per-year: $0-50K each, sums to ~$385K (correct)
- Conservation: Investor + HDC = Total ✓
- Aggregation: `totalOperatingCash` was computed separately and included Excess Reserve

**Root cause:** Two separate bugs:
1. `totalOperatingCash` included Excess Reserve component
2. Sub-debt handler returned `-paid` instead of `paid` (sign error)

### Fix Pattern

Split aggregated values into components and verify each independently.

---

## Pattern: Excess Reserve Diagnostic

**ISS Reference:** ISS-053 (2026-01-27)
**Discovered During:** S-curve appeared non-functional

### Symptoms

- Interest reserve is enabled with S-curve lease-up
- Excess Reserve equals ~100% of Calculated Reserve
- Year 1 DSCR shows impossible values (e.g., 0.37x but property cash-flows)

### Root Cause

The S-curve calculation exists but is being overridden to 100% occupancy.

### Quick Diagnostic

| Excess Reserve | Meaning |
|----------------|---------|
| ≈ $0 | Healthy — reserve consumed during lease-up |
| ≈ 100% of Calculated Reserve | Bug — S-curve not being applied |

### Example: ISS-053

**Problem:** $1.56M interest reserve calculated, but $1.56M returned as excess.

**Investigation:**
- S-curve formula existed and was called
- But later code reset `effectiveOccupancy = 1.0` unconditionally
- This override defeated the entire S-curve calculation

**Fix:** Remove the override, trust the S-curve calculation.

### Investigation Steps

If excess reserve equals nearly all of the calculated reserve:

1. Is S-curve being overridden? (Search for `effectiveOccupancy = 1`)
2. Is reserve draw logic executing? (Add console.log in draw function)
3. Is effectiveOccupancy reaching 100% too early? (Log values per month)

---

## Adding New Patterns

When you discover a new debugging pattern:

1. Document the symptoms (what the user sees)
2. Document the root cause (why it happened)
3. Document the diagnosis steps (how to identify)
4. Document the fix pattern (how to resolve)
5. Add to the Pattern Index at top of this file
6. Update VALIDATION_PROTOCOL.md if needed

---

## Related Documentation

- [VALIDATION_PROTOCOL.md](./VALIDATION_PROTOCOL.md) - Pre/post implementation validation
- [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) - Complete IMPL history

---

## Document Maintenance

Update this document when:
- A debugging session takes >2 hours to resolve
- The same type of bug occurs twice
- A pattern emerges that should be checked routinely

**Location:** `frontend/docs/debugging-patterns.md`
