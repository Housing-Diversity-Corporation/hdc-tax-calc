# Step 4 Discovery: Capital Structure Calculations

**Status**: Discovery Complete
**Date**: January 2025
**Purpose**: Understand capital structure implementation before validation

---

## Executive Summary

The HDC OZ Benefits Calculator uses a **percentage-based capital structure** that applies to the **effective project cost** (base cost + predevelopment + interest reserve). All capital components are calculated simultaneously based on user-defined percentages.

**Key Finding**: Capital structure calculations are **remarkably simple and consistent** - all percentages apply to effective project cost, with no complex interdependencies or circular references.

---

## 1. Capital Structure Components

### A. Debt Components

#### 1. Senior Debt
- **Purpose**: Traditional mortgage financing
- **Calculation**: `seniorDebtAmount = effectiveProjectCost × (seniorDebtPct / 100)`
- **Typical Range**: 60-65% of project cost
- **Terms**: Amortizing loan (30 years standard), monthly P&I payments
- **Priority**: First lien, paid first at exit
- **Rate**: User-defined (typically 6-7%)

#### 2. Philanthropic Debt
- **Purpose**: Impact capital from mission-aligned lenders
- **Calculation**: `philDebtAmount = effectiveProjectCost × (philanthropicDebtPct / 100)`
- **Typical Range**: 5-30% of project cost
- **Terms**: Interest-only, NO principal amortization
- **Priority**: Second lien, paid after senior debt at exit
- **Rate**: User-defined (typically 0-3%)
- **Special Features**:
  - Optional current pay: User can choose to pay portion of interest currently
  - Remainder accrues as PIK (Payment-In-Kind)
  - PIK portion compounds annually

#### 3. HDC Sub-Debt (Subordinated Debt)
- **Purpose**: HDC's capital contribution (typically none or minimal)
- **Calculation**: `hdcSubDebtAmount = effectiveProjectCost × (hdcSubDebtPct / 100)`
- **Typical Range**: 0-10% of project cost
- **Terms**: PIK loan, compounds annually
- **Priority**: Third lien (after phil debt)
- **Rate**: User-defined PIK rate (typically 8%)
- **Important**: This is HDC's ONLY capital contribution in the model

#### 4. Investor Sub-Debt
- **Purpose**: Additional investor capital structured as debt
- **Calculation**: `investorSubDebtAmount = effectiveProjectCost × (investorSubDebtPct / 100)`
- **Typical Range**: 0-10% of project cost
- **Terms**: PIK loan to investor, compounds annually
- **Priority**: Paid alongside HDC sub-debt
- **Rate**: User-defined PIK rate (typically 8%)
- **Important**: This is INCOME to investor, not an expense

#### 5. Outside Investor Sub-Debt
- **Purpose**: Strategic partner capital (e.g., insurance companies)
- **Calculation**: `outsideInvestorSubDebtAmount = effectiveProjectCost × (outsideInvestorSubDebtPct / 100)`
- **Typical Range**: 0-15% of project cost
- **Terms**: PIK loan with optional current pay
- **Priority**: MUST be repaid before promote split at exit
- **Rate**: User-defined PIK rate (typically 8%)
- **Special Feature**: Can have current pay portion in Years 2+

### B. Equity Components

#### 1. Investor Equity (Qualified Capital Gains)
- **Purpose**: Investor's primary capital contribution
- **Calculation**: `investorEquity = effectiveProjectCost × (investorEquityPct / 100)`
- **Typical Range**: 5-20% of project cost
- **Special Rules**:
  - 100% from Qualified Capital Gains in OZ investments
  - Excluded from depreciable basis per IRS OZ regulations
  - Calculated on EFFECTIVE cost (includes interest reserve)

#### 2. Philanthropic Equity (Grant Capital)
- **Purpose**: Grant funding for affordable housing
- **Calculation**: Implied as residual to reach 100%
- **Typical Range**: 0-10% of project cost
- **Important**: This is a GRANT, never repaid
- **Not modeled separately**: Reduces required debt/equity from other sources

---

## 2. Calculation Flow

### Step-by-Step Process

```typescript
// STEP 1: Calculate Interest Reserve (if enabled)
const interestReserveAmount = calculateInterestReserve({...params});

// STEP 2: Calculate Effective Project Cost
const baseProjectCost = projectCost + predevelopmentCosts;
const effectiveProjectCost = baseProjectCost + interestReserveAmount;

// STEP 3: Calculate All Capital Components (in parallel)
const seniorDebtAmount = effectiveProjectCost * (seniorDebtPct / 100);
const philDebtAmount = effectiveProjectCost * (philanthropicDebtPct / 100);
const hdcSubDebtAmount = effectiveProjectCost * (hdcSubDebtPct / 100);
const investorSubDebtAmount = effectiveProjectCost * (investorSubDebtPct / 100);
const outsideInvestorSubDebtAmount = effectiveProjectCost * (outsideInvestorSubDebtPct / 100);
const investorEquity = effectiveProjectCost * (investorEquityPct / 100);
```

### Key Relationships

1. **All percentages apply to EFFECTIVE project cost** (not base cost)
2. **No circular dependencies** - components calculated independently
3. **Validation**: Sum of all percentages should equal 100%
4. **Flexibility**: User can adjust any percentage, others don't auto-adjust

---

## 3. Ground Truth Example

### Scenario: Typical HDC Deal Structure

**Base Parameters:**
- Project Cost: $50,000,000
- Predevelopment: $0
- Land Value: $5,000,000
- Interest Reserve: $0 (disabled for clarity)
- Effective Project Cost: $50,000,000

**Capital Structure Percentages:**
- Senior Debt: 60%
- Philanthropic Debt: 10%
- HDC Sub-Debt: 5%
- Investor Sub-Debt: 5%
- Investor Equity: 20%
- **Total: 100%**

### Calculated Capital Stack

```
CAPITAL COMPONENT             PERCENTAGE    DOLLAR AMOUNT
================================================================
Senior Debt (60%)             60.0%         $30,000,000
Philanthropic Debt (10%)      10.0%         $ 5,000,000
HDC Sub-Debt (5%)              5.0%         $ 2,500,000
Investor Sub-Debt (5%)         5.0%         $ 2,500,000
Investor Equity (20%)         20.0%         $10,000,000
----------------------------------------------------------------
TOTAL                        100.0%         $50,000,000
================================================================

DEBT BREAKDOWN:
- Hard Debt (Senior + Phil): $35,000,000 (70%)
- Sub-Debt: $5,000,000 (10%)
- Total Debt: $40,000,000 (80%)
- Total Equity: $10,000,000 (20%)
- LTV Ratio: 80%
```

### With Interest Reserve Example

**Modified Parameters:**
- Interest Reserve Enabled: Yes
- Interest Reserve Months: 12
- Calculated Interest Reserve: $2,000,000

**New Effective Cost:**
```
Base Project Cost:        $50,000,000
+ Interest Reserve:       $ 2,000,000
= Effective Project Cost: $52,000,000
```

**Recalculated Capital Stack:**

```
CAPITAL COMPONENT             PERCENTAGE    DOLLAR AMOUNT
================================================================
Senior Debt (60%)             60.0%         $31,200,000
Philanthropic Debt (10%)      10.0%         $ 5,200,000
HDC Sub-Debt (5%)              5.0%         $ 2,600,000
Investor Sub-Debt (5%)         5.0%         $ 2,600,000
Investor Equity (20%)         20.0%         $10,400,000
----------------------------------------------------------------
TOTAL                        100.0%         $52,000,000
================================================================

IMPACT ANALYSIS:
- Investor Equity increased by: $400,000 (4%)
- Total Debt increased by: $1,600,000 (4%)
- Same percentages, higher dollar amounts
- Depreciable basis DECREASED (higher equity exclusion)
```

---

## 4. Key Formulas

### Capital Structure Sizing

```typescript
// All components use same formula pattern:
amount = effectiveProjectCost × (percentage / 100)
```

### Debt Service Calculations

#### Senior Debt (Amortizing)
```typescript
// Monthly payment calculation (standard mortgage formula)
const monthlyRate = annualRate / 12;
const numPayments = amortizationYears × 12;
const monthlyPayment = principal × (monthlyRate × (1 + monthlyRate)^numPayments) /
                       ((1 + monthlyRate)^numPayments - 1);
```

#### Philanthropic Debt (Interest-Only)
```typescript
// Annual interest calculation
const annualInterest = principal × annualRate;

// With current pay:
const currentPayAmount = annualInterest × (currentPayPct / 100);
const pikAmount = annualInterest - currentPayAmount;

// Without current pay:
const pikAmount = annualInterest; // All interest accrues as PIK
```

#### Sub-Debt (PIK)
```typescript
// Year 1: All interest accrues to PIK balance
pikBalance = principal;
year1PIK = principal × pikRate;

// Year 2+: Compound interest on growing balance
pikBalance_year2 = (principal + year1PIK) × (1 + pikRate);

// With optional current pay in Years 2+:
annualInterest = pikBalance × pikRate;
currentPayAmount = annualInterest × (currentPayPct / 100);
pikAccrual = annualInterest - currentPayAmount;
newPikBalance = pikBalance + pikAccrual;
```

### Coverage Ratios

#### DSCR (Debt Service Coverage Ratio)
```typescript
// Hard Debt Service = Senior + Phil (if current pay enabled)
hardDebtService = seniorDebtService + philCurrentPay;

// DSCR = NOI / Hard Debt Service
DSCR = NOI / hardDebtService;

// Target: Maintain exactly 1.05x
// Available cash = NOI - (hardDebtService × 1.05)
```

---

## 5. File Locations

### Core Calculation Engine

#### Primary Implementation
**File**: [calculations.ts](../../calculations.ts)
- **Lines 196-246**: Capital structure calculation
- **Lines 200-201**: Base debt amounts for interest reserve
- **Lines 236-245**: Final capital amounts based on effective cost
- **Lines 247-253**: Debt service calculations

**Key Code Section**:
```typescript
// Line 197: Include predevelopment in base cost
const baseProjectCost = paramProjectCost + paramPredevelopmentCosts;

// Lines 200-201: Calculate base debt for interest reserve
const baseSeniorDebtAmount = baseProjectCost * ((params.seniorDebtPct || 0) / 100);
const basePhilDebtAmount = baseProjectCost * ((params.philanthropicDebtPct || 0) / 100);

// Lines 208-229: Calculate interest reserve
const interestReserveAmount = calculateInterestReserve({...});

// Line 233: Calculate effective project cost
const effectiveProjectCost = baseProjectCost + interestReserveAmount;

// Lines 236-245: Calculate all capital components
const subDebtPrincipal = effectiveProjectCost * (paramHdcSubDebtPct / 100);
const investorSubDebtPrincipal = effectiveProjectCost * (paramInvestorSubDebtPct / 100);
const outsideInvestorSubDebtPrincipal = effectiveProjectCost * (paramOutsideInvestorSubDebtPct / 100);
const seniorDebtAmount = effectiveProjectCost * ((params.seniorDebtPct || 0) / 100);
const philDebtAmount = effectiveProjectCost * ((params.philanthropicDebtPct || 0) / 100);
const investorEquity = effectiveProjectCost * (paramInvestorEquityPct / 100);
```

### React Hooks Implementation

**File**: [useHDCCalculations.ts](../../../hooks/HDCCalculator/useHDCCalculations.ts)
- **Lines 102-147**: Interest reserve calculation
- **Line 150**: Effective project cost calculation
- **Lines 153-199**: Depreciation calculations (uses effective cost for equity)

**Key Code Section**:
```typescript
// Line 150: Calculate effective project cost
const effectiveProjectCost = props.projectCost + (props.predevelopmentCosts || 0) + interestReserveAmount;

// Line 161: Calculate investor equity from effective cost
const investorEquity = effectiveProjectCost * (props.investorEquityPct / 100);
```

### Utility Functions

**File**: [interestReserveCalculation.ts](../../interestReserveCalculation.ts)
- Complete interest reserve calculation logic
- Handles all debt service components
- Considers current pay vs PIK for each debt type

### TypeScript Interfaces

**File**: [types/HDCCalculator/index.ts](../../../../types/HDCCalculator/index.ts)
- **Lines 180-220**: CalculationParams interface
- All capital structure percentage parameters defined
- All debt rate parameters defined

---

## 6. Validation Points

### Mathematical Consistency

✅ **Percentage Sum Validation**
```typescript
// These should sum to 100% (or less if philanthropic equity is implied):
const totalPct = seniorDebtPct + philanthropicDebtPct + hdcSubDebtPct +
                 investorSubDebtPct + outsideInvestorSubDebtPct + investorEquityPct;

// Acceptable range: 90-100% (allowing for phil equity grant)
```

✅ **Dollar Amount Validation**
```typescript
// Sum of all capital components should equal effective project cost:
const totalCapital = seniorDebtAmount + philDebtAmount + hdcSubDebtAmount +
                     investorSubDebtAmount + outsideInvestorSubDebtAmount + investorEquity;

expect(totalCapital).toBeCloseTo(effectiveProjectCost, 2);
```

✅ **Interest Reserve Impact**
```typescript
// When interest reserve increases:
// - Effective project cost ↑
// - All dollar amounts ↑ (same percentages, higher base)
// - Investor equity ↑ (used in depreciable basis exclusion)
// - Depreciable basis ↓ (higher equity exclusion)
```

### Boundary Conditions

1. **Zero Interest Reserve**: Capital structure on base cost only
2. **Maximum Leverage**: 95% debt / 5% equity scenarios
3. **Conservative Structure**: 50% debt / 50% equity scenarios
4. **Multiple Sub-Debts**: All three sub-debt types active simultaneously
5. **Edge Percentages**: Very small (<1%) or large (>90%) percentages

---

## 7. Known Edge Cases & Considerations

### A. Percentage Validation
- **Issue**: UI doesn't enforce 100% sum constraint
- **Current Behavior**: User can create any sum (under or over 100%)
- **Recommendation**: Add validation warning if sum ≠ 100%

### B. Interest Reserve Circular Dependency
- **Issue**: Interest reserve depends on debt amounts, which depend on effective cost, which includes interest reserve
- **Solution**: Calculate interest reserve using BASE project cost, then scale all percentages to effective cost
- **Status**: ✅ Correctly implemented

### C. Philanthropic Equity (Grant) Not Explicitly Modeled
- **Issue**: UI shows debt + equity percentages, but grant funding is implied
- **Current Behavior**: User adjusts other percentages to account for grant
- **Example**: If 10% grant, user sets debt/equity to sum to 90%
- **Status**: Working as designed, could be more explicit in UI

### D. Outside Investor Sub-Debt Priority
- **Critical**: Must be repaid BEFORE promote split at exit
- **Impact**: Reduces both HDC and investor proceeds proportionally
- **Validation**: Exit waterfall tests confirm correct ordering

---

## 8. Test Coverage

### Existing Tests

**File**: [oz-depreciation-rule.test.ts](./oz-depreciation-rule.test.ts)
- Tests capital structure: 60% senior / 5% phil / 10% HDC sub / 5% investor sub / 20% equity
- Validates dollar amounts match percentage calculations
- Verifies depreciable basis excludes investor equity correctly

**File**: [macrs-depreciation.test.ts](../macrs-depreciation.test.ts)
- Tests capital structure: 60% senior / 10% phil / 5% HDC sub / 20% equity
- Confirms interest reserve impact on capital stack
- Validates effective cost calculation

**File**: [hdc-subdeb-crash.test.ts](../hdc-subdeb-crash.test.ts)
- Tests edge cases with multiple sub-debts
- Validates PIK compounding calculations
- Confirms exit waterfall ordering

### Needed Tests for Step 4 Validation

1. **Capital Structure Percentages**
   - Sum to 100% validation
   - Edge cases: 0%, 100%, fractional percentages
   - Multiple valid structures (conservative vs aggressive)

2. **Dollar Amount Calculations**
   - Verify each component = effectiveProjectCost × percentage
   - Confirm sum equals effective project cost
   - Test with various project sizes ($10M, $50M, $100M, $500M)

3. **Interest Reserve Impact**
   - Compare with vs without interest reserve
   - Validate percentage stays constant, dollars increase
   - Confirm depreciable basis decreases correctly

4. **Debt Service Calculations**
   - Senior debt P&I formula validation
   - Philanthropic interest-only validation
   - PIK compounding accuracy over 10 years

5. **Exit Waterfall**
   - Verify repayment priority order
   - Confirm outside investor sub-debt paid before promote
   - Test with various debt balances at exit

---

## 9. Next Steps for Step 4 Validation

### Phase 1: Ground Truth Examples (Ready to Define)
1. **Example 1**: Simple structure (60/20/20 senior/phil/equity)
2. **Example 2**: Complex structure (all debt types active)
3. **Example 3**: With interest reserve impact
4. **Example 4**: Edge case: 95% leverage

### Phase 2: Implementation
1. Create `capital-structure-validation.test.ts`
2. Implement ground truth examples as test cases
3. Add boundary condition tests
4. Validate against documentation

### Phase 3: Documentation
1. Update this discovery document with validation results
2. Document any discrepancies found
3. Create fix recommendations if needed

---

## 10. Summary & Recommendations

### ✅ Strengths
1. **Simple, Consistent Formula**: All components use same percentage-based calculation
2. **No Circular Dependencies**: Interest reserve solved with two-pass approach
3. **Well-Documented**: Business logic clearly explained in HDC_CALCULATION_LOGIC.md
4. **Single Source of Truth**: Effective project cost used everywhere

### ⚠️ Areas for Improvement
1. **UI Validation**: Add warning if capital structure percentages don't sum to 100%
2. **Philanthropic Equity**: Make grant funding more explicit in UI
3. **Test Coverage**: Need comprehensive capital structure validation tests
4. **Documentation**: Add capital structure examples to CALCULATION_FLOW_ORDER.md

### 📋 Validation Readiness
**Status**: ✅ **READY FOR STEP 4 VALIDATION**

The capital structure implementation is:
- Mathematically sound
- Consistently implemented across engine and hooks
- Well-documented
- Ready for ground truth validation

**Next Action**: Define ground truth examples and create validation test file.

---

## Appendix A: Capital Structure Validation Checklist

```typescript
// ✅ Implement these validation checks in Step 4 tests:

// 1. Percentage sum validation
const totalPct = seniorDebtPct + philanthropicDebtPct + hdcSubDebtPct +
                 investorSubDebtPct + outsideInvestorSubDebtPct + investorEquityPct;
expect(totalPct).toBeCloseTo(100, 1); // Within 0.1%

// 2. Dollar amount calculation
expect(seniorDebtAmount).toBe(effectiveProjectCost * (seniorDebtPct / 100));
expect(philDebtAmount).toBe(effectiveProjectCost * (philanthropicDebtPct / 100));
expect(investorEquity).toBe(effectiveProjectCost * (investorEquityPct / 100));

// 3. Total capital equals effective cost
const totalCapital = seniorDebtAmount + philDebtAmount + hdcSubDebtAmount +
                     investorSubDebtAmount + outsideInvestorSubDebtAmount + investorEquity;
expect(totalCapital).toBeCloseTo(effectiveProjectCost, 2);

// 4. Interest reserve impact
// If interest reserve increases by $X:
// - Effective project cost increases by $X
// - Each capital component increases by (percentage × $X)
// - Percentages remain unchanged

// 5. Debt service calculations
const expectedMonthlySeniorPayment = calculateMonthlyPayment(
  seniorDebtAmount,
  seniorDebtRate / 100,
  seniorDebtAmortization
);
expect(monthlySeniorDebtService).toBeCloseTo(expectedMonthlySeniorPayment, 2);
```

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: After Step 4 Validation Complete
