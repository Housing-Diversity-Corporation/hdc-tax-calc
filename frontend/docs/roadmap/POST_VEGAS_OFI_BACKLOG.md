# Post-Vegas OFI (Opportunities For Improvement) Backlog

**Created**: January 2025
**Target Implementation**: Q1 2026 (Post-Vegas Conference)
**Status**: Staged - Not Yet Implemented

---

## Overview

This document tracks improvements and feature enhancements that have been **specified but not implemented**. These items are deferred until after the Vegas conference and subsequent business model finalization.

**IMPORTANT**: Items in this backlog are **documented for future reference only**. They should NOT be implemented until explicitly authorized post-Vegas.

---

## OFI-001: Eliminate HDC 10% Tax Benefit Fee

**Category**: Fee Structure Change
**Priority**: High
**Complexity**: Medium
**Estimated Effort**: 2-3 days

### Current Model
- HDC charges 10% fee on **gross** tax benefits
- Fee calculated annually on depreciation tax savings
- Subject to DSCR-based deferral (payment priority 4)
- Deferred fees accrue interest at 8% annually

### Future Model (Post-Vegas)
- **Single AUM fee only** (currently 1% of project cost)
- Tax benefit fee **eliminated entirely**
- Simplifies investor cash flows
- Reduces administrative tracking

### Implementation Impact
**Files to modify:**
- `/src/utils/HDCCalculator/calculations.ts` - Remove tax benefit fee calculation
- `/src/utils/HDCCalculator/depreciationSchedule.ts` - Update tax benefit distribution
- `/src/types/HDCCalculator/index.ts` - Remove `hdcTaxBenefitFee` fields
- `/src/components/.../inputs/` - Remove tax benefit fee UI inputs
- `__tests__/` - Update all test expectations

**Backward Compatibility:**
- Existing models with 10% fee must remain accessible
- Add `feeModel: 'legacy' | 'aum-only'` parameter
- Default new models to `'aum-only'` post-Vegas

### Business Rationale
- Competitive pressure from other tax credit syndicators
- Simplifies investor ROI calculations
- Eliminates confusion about "double fees" (AUM + tax benefit)
- AUM fee alone provides sufficient revenue

### Test Coverage Requirements
- Verify AUM fee calculations remain accurate
- Confirm tax benefits flow 100% to investor
- Test legacy model compatibility

---

## OFI-002: State Conformity Engine

**Category**: Tax Calculation Enhancement
**Priority**: High
**Complexity**: High
**Estimated Effort**: 5-7 days

### Current Model
- **Assumes 100% state conformity** for all OZ and bonus depreciation rules
- Hardcoded state tax rates in `CONFORMING_STATES` constant
- Limited state-specific handling for bonus depreciation (CA, NY, PA, NJ, IL)

### Future Model (Post-Vegas)
- **Full state conformity engine** per [`STATE_TAX_CONFORMITY_SPEC.md`](../domain-spec/STATE_TAX_CONFORMITY_SPEC.md)
- Separate treatment of OZ conformity vs bonus depreciation conformity
- State-specific calculations for all 50 states + DC
- Dynamic conformity data from authoritative sources

### Implementation Scope

#### 1. OZ Conformity (§1400Z-2)
**Non-Conforming States:**
- **California**: State tax applies to all OZ gains (no deferral or exclusion)
- **Massachusetts**: Partial conformity TBD
- **New York**: Decoupled April 2022 - NO OZ benefits at state level

**Impact**: Reduces Year 10 exit tax benefits for these states

#### 2. Bonus Depreciation Conformity (§168(k))
**Current Spec** (per [`STATE_CONFORMITY_DATA_2025.md`](../reference/STATE_CONFORMITY_DATA_2025.md)):

| State | Bonus Depreciation | OZ Conformity | Notes |
|-------|-------------------|---------------|-------|
| Oregon | ✅ 100% | ✅ Full | **Highest-value target** |
| New Jersey | ❌ 0% | ✅ Full | State bonus = $0 |
| New York | ❌ 0% | ❌ None | State benefits = $0 |
| California | ❌ 0% | ❌ None | State benefits = $0 |
| Connecticut | ❌ 0% | ✅ Full | Mixed |
| District of Columbia | ❌ 0% | ✅ Full | Mixed |
| Minnesota | ❌ 0% | ✅ Full | Mixed |

**Impact**: Year 1 tax benefits reduced by state component for non-conforming states

#### 3. Strategic Targeting Model
**Feature**: Calculate "State Tax Benefit Score" for deal sourcing

**Formula**:
```
State Score = (OZ Conformity × Exit Benefit Weight) + (Bonus Conformity × Year 1 Benefit Weight)

Where:
- OZ Conformity: 0 (none), 0.5 (partial), 1.0 (full)
- Bonus Conformity: 0 (none), 0.5 (partial), 1.0 (full)
- Exit Benefit Weight: 40% (Year 10 value)
- Year 1 Benefit Weight: 60% (immediate value)
```

**Rankings**:
1. **Oregon**: Score = 1.0 (100% both)
2. **NJ, CT, DC, MN**: Score = 0.4 (OZ only)
3. **NY, CA, MA**: Score = 0.0 (neither)

### Implementation Requirements

**New Files:**
- `/src/utils/HDCCalculator/stateConformityEngine.ts` - Core engine
- `/src/utils/HDCCalculator/stateConformityData.ts` - Data tables
- `/src/types/HDCCalculator/StateConformity.ts` - Type definitions

**Modified Files:**
- `/src/utils/HDCCalculator/calculations.ts` - Apply state-specific rules
- `/src/utils/HDCCalculator/depreciationSchedule.ts` - State bonus handling
- `/src/components/.../inputs/BasicInputsSection.tsx` - State selection UI

**Data Sources:**
- Tax Foundation: Federal conformity tracking
- Novogradac: OZ state conformity guide
- State revenue department regulations

### Test Coverage Requirements
- Unit tests for all 50 states + DC
- Regression tests vs current model (conforming states should match)
- Edge cases: Mid-year state law changes

### Backward Compatibility
- Add `stateConformityModel: 'legacy' | 'full'` parameter
- Default to `'legacy'` (assumes conformity) until Q1 2026
- Allow override for beta testing

---

## OFI-003: Cost Segregation Percentage Configurability

**Category**: Input Enhancement
**Priority**: Medium
**Complexity**: Low
**Estimated Effort**: 1 day

### Current Model
- **Fixed 20% cost segregation** (updated from 25% in Jan 2025)
- Applied uniformly to all projects
- Based on generic cost seg studies

### Future Model
- **Project-specific cost seg percentages**
- Input field for actual cost seg study results
- Range: 15% - 40% (typical residential multifamily)
- Default remains 20% for estimates

### Implementation
**Files to modify:**
- `/src/components/.../inputs/TaxPlanningInputsSection.tsx` - Add editable input
- `/src/utils/HDCCalculator/calculations.ts` - Already parameterized (no change)
- Documentation - Update to explain variability

**UI Changes:**
- Change "Cost Seg %" from read-only display to editable input
- Add tooltip: "Typical range: 15-40%. Use 20% if no cost seg study available."
- Validation: Min 0%, Max 100%

---

## OFI-004: IRA Conversion Optimization

**Category**: Tax Planning Feature
**Priority**: Low
**Complexity**: Medium
**Estimated Effort**: 3-4 days

### Current Model
- Basic IRA conversion module exists (`iraConversion.ts`)
- Not fully integrated into investor portal
- Limited optimization logic

### Future Model
- **Multi-year IRA conversion planning**
- Coordinate conversions with depreciation timing
- Optimize to minimize lifetime tax burden
- Integration with REP/Non-REP capacity calculations

### Deferred Rationale
- Low investor demand currently
- Requires sophisticated tax planning expertise
- Better suited for post-Vegas investor education phase

---

## OFI-005: Outside Investor Structure Clarification & Flexibility

**Category**: Strategic Business Model Enhancement
**Priority**: High
**Complexity**: Medium
**Estimated Effort**: 3-4 days

### Current Model - Ambiguous Labeling
- **Label**: "HDC Platform Mode (Outside Investor = HDC Debt Fund)"
- **Field**: "HDC Debt Fund (Gap Financing) (%)"
- **Assumption**: Outside investor IS HDC (single entity model)
- **Limitation**: Cannot model scenarios with BOTH HDC debt fund AND independent outside investor

### Business Context (SDD Strategic Partners Model)

In the Strategic Development Districts (SDD) model, the "outside investor" providing gap financing can be:

1. **HDC's Own Debt Fund** (Platform Mode)
   - HDC provides gap financing from its own debt fund
   - Returns flow to HDC alongside promote and fees
   - Requires consolidated HDC returns calculation

2. **Independent Third-Party Investor**
   - External debt fund or institutional investor
   - Separate from HDC's returns
   - Arms-length commercial terms

3. **BOTH** (Blended Capital Structure)
   - HDC provides partial gap financing
   - Third-party provides additional gap financing
   - Two separate outside investor tranches
   - Common in complex SDD deals

### Current System Limitations

**Cannot Model**:
- Scenario where HDC provides 2% gap + external investor provides 3% gap
- Consolidated HDC returns (promote + fees + debt fund returns)
- Comparative analysis (HDC-funded vs external-funded scenarios)

**Confusing UX**:
- "HDC Platform Mode" doesn't clearly explain the structural difference
- "Outside Investor = HDC Debt Fund" implies equation rather than explanation
- Users don't understand when to check the box

### Proposed Solution

#### Phase 1: Label Clarification (Quick Win - 1 day)

**Current**:
```
☐ HDC Platform Mode (Outside Investor = HDC Debt Fund)
  HDC Debt Fund (Gap Financing) (%)
```

**Proposed**:
```
Outside Investor (Gap Financing)

Provider:
  ○ HDC Debt Fund (platform model)
  ○ Third-Party Investor (independent)
  ○ Both (blended)

Gap Financing Percentage (%)
  [input field]
```

#### Phase 2: Dual Outside Investor Support (3-4 days)

**New Structure**:
```typescript
interface OutsideInvestorConfig {
  enabled: boolean;

  // HDC-provided gap financing
  hdcDebtFund?: {
    percentage: number;
    rate: number;
    currentPayPct: number;
  };

  // Third-party gap financing
  thirdPartyInvestor?: {
    percentage: number;
    rate: number;
    currentPayPct: number;
  };
}
```

**Waterfall Impact**:
- Payment priority: Both outside investors rank equally (priority 1)
- Can be stacked: HDC debt fund (2%) + third-party (3%) = 5% total gap
- Independent tracking for HDC's total returns calculation

#### Phase 3: HDC Consolidated Returns Report (2-3 days)

**New Report Section**: "HDC Total Returns Analysis"

Aggregates ALL HDC revenue streams:
1. **Fee Income**:
   - AUM fees (annual)
   - Tax benefit fees (10% of gross, until eliminated)

2. **Promote Income**:
   - Post-equity-recovery distributions (typically 65% HDC share)

3. **Debt Fund Returns** (if HDC Platform Mode):
   - Interest income from gap financing
   - PIK accretion
   - Principal return at exit

**Output Metrics**:
- Total HDC Cash Received
- HDC IRR (on debt fund capital deployed, if applicable)
- HDC Multiple (total returns / total investment)
- Fee vs Promote vs Debt Fund breakdown

### Implementation Requirements

**New Files**:
- `/src/types/HDCCalculator/OutsideInvestorConfig.ts` - Type definitions
- `/src/utils/HDCCalculator/hdcConsolidatedReturns.ts` - Consolidated returns calc
- `/src/components/.../reports/HDCConsolidatedReturnsReport.tsx` - New report

**Modified Files**:
- `/src/components/.../inputs/CapitalStructureSection.tsx` - UI redesign
- `/src/utils/HDCCalculator/calculations.ts` - Support dual outside investors
- `/src/types/HDCCalculator/index.ts` - Update CalculationParams

**Documentation**:
- Update HDC_CALCULATION_LOGIC.md with dual outside investor logic
- Create SDD_CAPITAL_STRUCTURE_GUIDE.md explaining use cases

### Business Value

**Enables Strategic Analysis**:
- "Should HDC provide gap financing or syndicate to third-party?"
- "What's HDC's blended IRR across all revenue streams?"
- "How much capital does HDC need to deploy at scale?"

**Clarifies User Experience**:
- Removes confusion about "HDC Platform Mode"
- Makes outside investor concept self-explanatory
- Supports actual SDD deal structures

**Supports Deal Structuring**:
- Model multiple gap financing scenarios
- Compare HDC-funded vs external-funded economics
- Optimize capital deployment strategy

### Test Coverage Requirements

**Scenarios to Test**:
1. No outside investor (status quo)
2. HDC debt fund only (current "platform mode")
3. Third-party investor only
4. Both HDC (2%) + third-party (3%)
5. HDC consolidated returns calculation accuracy

**Edge Cases**:
- Total capital stack exceeds 100% validation
- Payment priority conflicts with dual outside investors
- Exit distribution sequence with multiple gap financing sources

### Backward Compatibility

**Migration Strategy**:
- Existing `outsideInvestorSubDebtPct` maps to third-party investor
- If `hdcPlatformMode: true`, migrate to `hdcDebtFund.percentage`
- Default to "third-party" mode to preserve existing behavior

**Legacy Support**:
- Add `legacyOutsideInvestorMode: boolean` flag
- Maintain single outside investor logic as fallback
- Deprecate after Q2 2026

---

## Maintenance Notes

### Adding New OFI Items
When adding items to this backlog:
1. Assign sequential OFI number (OFI-005, OFI-006, etc.)
2. Include all required sections (Current/Future Model, Implementation, etc.)
3. Update this document's table of contents
4. Reference any related spec documents
5. Add `POST-VEGAS` label to any related GitHub issues

### Implementation Authorization Process
Before implementing ANY item from this backlog:
1. Verify Vegas conference outcomes align with OFI
2. Get explicit authorization from product owner
3. Update OFI status to "In Progress"
4. Create implementation branch: `ofi-XXX-description`
5. Update this document when complete

### Related Documentation
- [`STATE_TAX_CONFORMITY_SPEC.md`](../domain-spec/STATE_TAX_CONFORMITY_SPEC.md) - Full state conformity specification
- [`STATE_CONFORMITY_DATA_2025.md`](../reference/STATE_CONFORMITY_DATA_2025.md) - Current state-by-state data
- [`HDC_CALCULATION_LOGIC.md`](../domain-spec/HDC_CALCULATION_LOGIC.md) - Core business logic

---

## Backlog Summary

| OFI # | Title | Priority | Effort | Status |
|-------|-------|----------|--------|--------|
| OFI-001 | Eliminate 10% Tax Benefit Fee | High | 2-3d | Staged |
| OFI-002 | State Conformity Engine | High | 5-7d | Staged |
| OFI-003 | Cost Seg Configurability | Medium | 1d | Staged |
| OFI-004 | IRA Conversion Optimization | Low | 3-4d | Staged |
| OFI-005 | Outside Investor Structure Clarification | High | 3-4d | Staged |

**Total Estimated Effort**: 14-19 days
**Target Start**: Q1 2026
**Target Completion**: Q2 2026

---

## RESOLVED ISSUES (January 2025)

### ✅ FIXED: Missing Default for `investorPromoteShare` Parameter

**Category**: Bug Fix
**Severity**: Critical
**Date Fixed**: January 30, 2025
**Discovered During**: Domain 6 Returns & Exit Validation

#### Problem
When `investorPromoteShare` parameter was not provided in test configurations, all calculations involving promote splits resulted in NaN:
```typescript
operatingCashFlow = cashAfterDebtAndFees * (paramInvestorPromoteShare / 100);
// If paramInvestorPromoteShare = undefined:
// result = value * (undefined / 100) = NaN
```

**Impact:**
- `totalCashFlow`: NaN
- `cumulativeReturns`: NaN
- `multiple`: NaN
- `irr`: 0 (unable to calculate with NaN cash flows)
- `exitProceeds`: NaN

#### Fix Applied
[calculations.ts:145](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L145)
```typescript
// BEFORE:
investorPromoteShare: paramInvestorPromoteShare,

// AFTER:
investorPromoteShare: paramInvestorPromoteShare = 35, // Default: 35% investor, 65% HDC
```

#### Validation
- ✅ All Domain 6 tests now pass with exact math verification
- ✅ Six sigma tax benefits test still passes (±0.1% accuracy)
- ✅ Multiple now calculates correctly: 7.05x for Trace 4001
- ✅ IRR now calculates correctly: 81.16% for Trace 4001
- ✅ Complete validation documented in [DOMAIN_6_RETURNS_EXIT_VALIDATION.md](/hdc-map-frontend/docs/archive/validation-steps/DOMAIN_6_RETURNS_EXIT_VALIDATION.md)

#### Root Cause
All other parameters in `calculations.ts` have defaults (e.g., `hdcSubDebtPct = 0`), but `investorPromoteShare` was the only required parameter without a default value. This worked fine in production (UI always provides the value) but broke in test scenarios where minimal parameter sets were used.

#### Lesson Learned
ALL calculation parameters should have sensible defaults to enable flexible testing and prevent NaN propagation.

---

*This backlog is a living document. Updates should follow the Constitution Update Protocol.*
