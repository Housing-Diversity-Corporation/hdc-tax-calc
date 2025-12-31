# Equity % to Year 1 Tax Benefit Linearity Analysis - Status Report

**Date:** 2025-01-28
**Status:** ✅ COMPLETE

## Objective

Analyze the relationship between investor equity percentage (1%-15%) and Year 1 net tax benefit to determine if the relationship is linear or non-linear.

## Context

The HDC model creates tax benefits through depreciation. As investor equity % increases:
- Investor equity amount increases (more capital)
- Depreciable basis decreases (equity excluded from basis per OZ rules)
- Year 1 tax benefit decreases (less basis to depreciate)

We need empirical data from the actual calculation engine to visualize this relationship.

## Current Status

### Scripts Created

1. **`equity-linearity-analysis.ts`** - Initial full-featured version
   - Location: `src/utils/HDCCalculator/__tests__/analysis/`
   - Status: Import/type issues with calculation functions
   - Issue: Return type structure doesn't match expectations

2. **`equity-linearity-analysis-simple.ts`** - Simplified version using test helpers
   - Location: `src/utils/HDCCalculator/__tests__/analysis/`
   - Status: Runs but returns all zeros
   - Issue: Return structure from `calculateFullInvestorAnalysis` not properly accessed

### Issues Encountered

1. **Module Import Issues**
   - Initial import path incorrect (`hdcAnalysis` vs `calculations`)
   - ES module syntax required (`.js` extensions)
   - Type imports needed proper path resolution

2. **Return Structure Mismatch**
   - Expected: `analysis.investorReturns.yearlyReturns[0].netTaxBenefit`
   - Actual: Structure exists but accessing returns undefined
   - Possible causes:
     - Return type may be wrapped differently
     - May need to call a different function
     - Tax benefits may be in a different location in the return object

3. **Parameter Complexity**
   - `calculateFullInvestorAnalysis` requires ~50+ parameters
   - Used `getDefaultTestParams()` helper to manage defaults
   - Still may be missing required parameters for proper calculation

## Next Steps

### Immediate Actions Required

1. **Debug Return Structure**
   ```typescript
   // Add debugging to see actual return structure
   const analysis = calculateFullInvestorAnalysis(params);
   console.log('Analysis keys:', Object.keys(analysis));
   console.log('Full structure:', JSON.stringify(analysis, null, 2));
   ```

2. **Reference Working Tests**
   - Review `critical-business-rules.test.ts` to see how they access Year 1 data
   - Check `calculateExpectedFinancials` helper function
   - May need to use HDC analysis function instead

3. **Verify Calculation Flow**
   - Confirm depreciation is being calculated
   - Verify tax benefits are being computed
   - Check if OZ rules are properly excluding equity from basis

### Alternative Approaches

1. **Use Existing Test Infrastructure**
   - Leverage `calculateExpectedFinancials()` from test-helpers
   - This may be the correct way to get Year 1 net benefit

2. **Direct Calculation**
   - Calculate depreciable basis manually
   - Apply Year 1 depreciation percentage
   - Calculate tax benefit = depreciation × effective tax rate
   - Subtract HDC fee (10%)

3. **Hook Integration**
   - Use `useHDCCalculations` hook structure
   - May provide cleaner access to results

## Expected Results (Theoretical)

Based on HDC model mechanics:

- **At 1% equity**: Maximum tax benefit (minimal equity exclusion from basis)
- **At 15% equity**: Reduced tax benefit (larger equity exclusion from basis)
- **Relationship**: Expected to be approximately linear with negative slope
- **Formula**: `NetBenefit ≈ Intercept - (Slope × EquityPct)`

### Why We Expect Linear

- Depreciable basis = Project Cost - Land - **Investor Equity**
- Year 1 Depreciation = Depreciable Basis × 25%
- Tax Benefit = Depreciation × 47.85%
- Net Benefit = Tax Benefit × 90% (after 10% HDC fee)

Since investor equity is directly subtracted from depreciable basis, the relationship should be linear unless:
1. Interest reserve calculations introduce non-linearity
2. DSCR management affects distributions
3. Phil debt percentage changes trigger other effects

## Deliverables Pending

- [ ] Working analysis script that outputs actual data
- [ ] CSV file with 15 data points
- [ ] Linearity determination (R² calculation)
- [ ] Markdown report with findings
- [ ] Formula for the relationship

## Resources

### Files to Reference

- `/src/utils/HDCCalculator/calculations.ts` - Main calculation function
- `/src/utils/HDCCalculator/__tests__/test-helpers.ts` - Parameter helpers
- `/src/utils/HDCCalculator/__tests__/critical-business-rules.test.ts` - Working test examples
- `/docs/domain-spec/HDC_CALCULATION_LOGIC.md` - Calculation specification

### Key Functions

```typescript
// From calculations.ts
export const calculateFullInvestorAnalysis = (
  params: CalculationParams
): InvestorAnalysisResults

// From test-helpers.ts
export function getDefaultTestParams(
  overrides: Partial<CalculationParams> = {}
): CalculationParams

export function calculateExpectedFinancials(
  params: Partial<CalculationParams>
): ExpectedFinancials
```

## Conclusion

The analysis framework is in place, but requires debugging of the return structure from the calculation functions. The theoretical expectation is a linear relationship with negative slope, but empirical data is needed to confirm and quantify this relationship.

**Recommendation**: Before proceeding further, examine the actual return structure from `calculateFullInvestorAnalysis` in a minimal test case to understand how to properly access the Year 1 net tax benefit data.
