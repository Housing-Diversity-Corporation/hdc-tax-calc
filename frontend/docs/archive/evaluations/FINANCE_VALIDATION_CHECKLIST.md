# Finance Validation Checklist for HDC Calculator

## Critical Validation Points

### 1. Waterfall Distribution Logic Validation
**Issue**: Waterfall distributions must follow proper private equity principles
**What to Check**:
- ✅ Investor receives 100% of ALL distributions (tax benefits + cash flows) until they recover their initial investment
- ✅ Only AFTER full recovery does HDC get catch-up distributions
- ✅ Promote splits only apply AFTER both investor recovery AND HDC catch-up
- ❌ **COMMON BUG**: Never cap investor benefits at hurdle amount when benefits exceed hurdle

**Test Case**: 
- If Year 1 tax benefits = 256% of investment ($2.56M on $1M investment)
- Investor should receive FULL $2.56M (not capped at $1M)
- Expected IRR should be 90%+ (not 25%)
- Multiple should reflect full benefit receipt

**Code Location**: 
- `/src/utils/HDCCalculator/calculations.ts` lines 256-340
- Look for waterfall distribution logic and hurdle calculations

### 2. IRR Consistency Check
**Issue**: IRR must be consistent with cash flow timing
**What to Check**:
- If investor receives >100% of investment in Year 1, IRR should be >100%
- If investor receives >200% of investment in Year 1, IRR should be >150%
- Formula: Year 1 return of 256% should yield ~94% IRR minimum

**Red Flags**:
- IRR < 30% when Year 1 benefits > 150% of investment
- IRR < 50% when Year 1 benefits > 200% of investment
- Multiple < 2x when total benefits > 300% of investment

### 3. Tax Benefit Allocation
**Issue**: Tax benefits must flow through waterfall correctly
**What to Check**:
- Year 1 special depreciation benefits go 100% to investor (after HDC fee)
- Years 2+ straight-line depreciation benefits follow waterfall rules
- Tax benefits continue for full depreciation period (27.5 years for residential)
- HDC fees are deducted from GROSS tax benefits before waterfall

### 4. Free Investment Analysis
**Issue**: Coverage ratio must match actual cash flows
**What to Check**:
- Coverage % = (Year 1 Net Tax Benefit / Initial Investment) × 100
- If coverage > 100%, investor is "playing with house money"
- If coverage > 200%, IRR should reflect immediate 2x+ return

**Formula Validation**:
```
Year 1 Net Benefit = (Depreciation × Tax Rate) - HDC Fee
Coverage = Year 1 Net Benefit / Investor Equity
If Coverage > 100%:
  Expected Minimum IRR = Coverage - 100%
```

### 5. Promote Structure Validation
**Issue**: Promote percentages must be applied at correct waterfall tier
**What to Check**:
- Tier 1: 100% to investor until hurdle recovery
- Tier 2: 100% to HDC until catch-up achieved
- Tier 3: Split per promote percentage (e.g., 65% investor / 35% HDC)
- Catch-up amount = Total Distributions × HDC Promote %

### 6. Hold Period Impact
**Issue**: Variable hold periods must properly affect all calculations
**What to Check**:
- Depreciation continues for min(hold period, 27.5 years)
- Exit calculations occur at correct year
- IRR calculation uses correct number of periods
- Cash flows array length matches hold period

## Testing Protocol

When validating financial calculations, always run these test scenarios:

### Scenario 1: High Tax Benefit (Free Investment)
- Year 1 Depreciation: 30-40%
- Expected: Coverage > 100%, IRR > 50%

### Scenario 2: Standard Tax Benefit
- Year 1 Depreciation: 10-15%
- Expected: Coverage 30-50%, IRR 15-25%

### Scenario 3: Extended Hold (20-30 years)
- Verify depreciation continues through year 27.5
- Verify HDC fees continue for full depreciation period
- Verify exit calculations at correct year

### Scenario 4: Complex Capital Stack
- Multiple debt tranches with different rates
- PIK interest accrual
- Verify all components calculate correctly

## Common Bugs to Check

1. **Capped Benefits Bug**: Benefits being capped at hurdle amount instead of flowing through
2. **Premature Promote Bug**: Promote splits applied before investor recovery
3. **Lost Tax Benefits Bug**: Tax benefits not being credited to investor cash flows
4. **IRR Inconsistency Bug**: IRR not matching actual cash flow returns
5. **Depreciation Cutoff Bug**: Depreciation stopping at year 10 instead of continuing

## Validation Commands

Run these checks when validating changes:
```bash
# Run waterfall distribution tests
npm test -- waterfallFix.test.ts

# Check IRR calculations
npm test -- useHDCCalculations.test.ts

# Validate with TypeScript
npx tsc --noEmit
```

## Finance Agent Instructions

When asked to validate HDC Calculator financial logic:
1. First check for the Waterfall Distribution Logic issues above
2. Verify IRR consistency with cash flows
3. Confirm tax benefits flow correctly through all years
4. Validate coverage ratios match actual benefits
5. Test with high tax benefit scenarios (>200% coverage)
6. Alert if IRR seems inconsistent with Year 1 returns

**Critical Rule**: If Year 1 benefits exceed initial investment, the IRR must be high (50%+). Low IRR with high Year 1 coverage indicates a waterfall bug.