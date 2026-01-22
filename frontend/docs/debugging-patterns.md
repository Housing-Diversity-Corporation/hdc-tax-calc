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
