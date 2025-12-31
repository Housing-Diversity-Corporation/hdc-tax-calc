# Audit: Depreciable Basis Calculation in OZ Benefits Code

**Date:** January 30, 2025
**Purpose:** Verify depreciable basis is independent of financing structure for Twinned LIHTC + OZ spec
**Result:** ❌ **COUPLING FOUND** - Investor equity affects depreciable basis

---

## Executive Summary

The current implementation **DOES couple depreciation to financing structure**. This is intentional per IRS Opportunity Zone regulations but creates a **critical limitation** for the Twinned LIHTC + OZ model.

### The Problem

**Core Principle We Need:** Depreciable Basis = Building Cost - Land
**Current Implementation:** Depreciable Basis = Building Cost - Land - **Investor Equity**

**Impact:** Changing investor equity % changes depreciation, which should only depend on the building's cost.

---

## 1. Depreciable Basis Calculation

### Location
[`depreciableBasisUtility.ts`](/hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts)

### Formula (Lines 54)
```typescript
const depreciableBasis = totalProjectCost - landValue - investorEquity;
```

Where:
- `totalProjectCost = projectCost + predevelopmentCosts`
- `investorEquity = effectiveProjectCost × (investorEquityPct / 100)`
- `effectiveProjectCost = totalProjectCost + interestReserve`

### Example Calculation
```
Project Cost:           $67M
Predevelopment:         $0M
Total Project Cost:     $67M
Interest Reserve:       $0M (for simplicity)
Effective Project Cost: $67M
Land Value:             $6.7M

Scenario A: 5% Investor Equity
  Investor Equity:      $67M × 0.05 = $3.35M
  Depreciable Basis:    $67M - $6.7M - $3.35M = $56.95M

Scenario B: 25% Investor Equity
  Investor Equity:      $67M × 0.25 = $16.75M
  Depreciable Basis:    $67M - $6.7M - $16.75M = $43.55M

Difference: $13.4M lower basis (23.5% reduction)
```

---

## 2. Depreciation Flow

### Year 1 Bonus Depreciation
**Location:** [`calculations.ts:398`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L398)

```typescript
const bonusDepreciation = depreciableBasis * (paramYearOneDepreciationPct / 100);
```

**Flow:**
1. Calculate depreciable basis (with investor equity exclusion)
2. Apply cost segregation % (typically 20%)
3. Calculate remaining basis for straight-line
4. Apply IRS mid-month convention for Year 1

### Years 2+ Straight-Line Depreciation
**Location:** [`calculations.ts:400`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts#L400)

```typescript
const remainingBasis = depreciableBasis - bonusDepreciation;
const annualMACRS = remainingBasis / 27.5;
```

**Flow:**
1. Subtract bonus depreciation from depreciable basis
2. Divide remaining by 27.5 years (IRS MACRS for residential)
3. Apply annually for Years 2-10

---

## 3. Coupling Analysis

### ❌ COUPLING FOUND: Investor Equity

**File:** [`depreciableBasisUtility.ts:49-54`](/hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts#L49-L54)

```typescript
// Calculate investor equity (from QCGs in OZ deals)
// Uses EFFECTIVE project cost per documentation requirement
const investorEquity = effectiveProjectCost * (investorEquityPct / 100);

// Depreciable basis excludes land AND investor equity
const depreciableBasis = totalProjectCost - landValue - investorEquity;
```

**Impact:**
- ✅ Building cost (`projectCost`) drives basis - GOOD
- ✅ Land value (`landValue`) excluded - GOOD
- ❌ **Investor equity (`investorEquity`) excluded** - COUPLING

### Other Financing Parameters Checked

**✅ No coupling found with:**
- `seniorDebt` / `seniorDebtPct`
- `philanthropicDebt` / `philanthropicDebtPct`
- `hdcSubDebt` / `investorSubDebt`
- `outsideInvestorSubDebt`
- `leverageRatio` or similar terms

**Finding:** Only investor equity affects depreciation, not other financing components.

---

## 4. Why This Coupling Exists

### IRS Opportunity Zone Regulation

**Per Documentation:** [`HDC_CALCULATION_LOGIC.md`](/hdc-map-frontend/docs/domain-spec/HDC_CALCULATION_LOGIC.md)

> **CRITICAL OZ RULE: Qualified Capital Gains Exclusion**
>
> In Opportunity Zone investments, investor equity from Qualified Capital Gains (QCGs) CANNOT be included in depreciable basis per IRS rules.
>
> Since this is an OZ investment platform where 100% of investor equity comes from QCGs:
> ```
> Depreciable Basis = (Project Cost + Predevelopment Costs) - Land Value - Investor Equity
> ```

### Test Validation

**File:** [`oz-depreciation-rule.test.ts`](/hdc-map-frontend/src/utils/HDCCalculator/__tests__/features/oz-depreciation-rule.test.ts)

The test suite explicitly validates this behavior:

```typescript
// Test: "should exclude investor equity from depreciable basis"
const investorEquity = params.projectCost * (params.investorEquityPct / 100);
const expectedDepreciableBasis = params.projectCost - params.landValue - investorEquity;

// Test: "should proportionally reduce depreciation with different equity percentages"
testCases.forEach(({ equityPct, expectedBasis }) => {
  { equityPct: 10, expectedBasis: 67400000 }, // $86M - $10M - $8.6M
  { equityPct: 20, expectedBasis: 58800000 }, // $86M - $10M - $17.2M
  { equityPct: 30, expectedBasis: 50200000 }, // $86M - $10M - $25.8M
  { equityPct: 40, expectedBasis: 41600000 }, // $86M - $10M - $34.4M
});
```

**Conclusion:** This coupling is **INTENTIONAL and VALIDATED** per IRS OZ regulations.

---

## 5. Impact on Twinned LIHTC + OZ Model

### The Twinned Model Challenge

**Twinned Structure:**
```
Investor 1 (LIHTC): Uses tax credit equity (e.g., 25% LTV)
Investor 2 (OZ):    Uses QCG equity (e.g., 5% LTV)
Combined:           30% total equity, 70% debt
```

**Problem Under Current Logic:**

If we model this as a single 30% investor equity position:
```
Depreciable Basis = $67M - $6.7M - ($67M × 0.30) = $40.2M
```

But if we model only the OZ investor (5%):
```
Depreciable Basis = $67M - $6.7M - ($67M × 0.05) = $56.95M
```

**Difference:** $16.75M or 41.7% higher depreciation!

### Current Behavior Is Incorrect for Twinned Model

**Why:**
1. **LIHTC equity is NOT QCG equity** - It comes from tax credit syndication, not rolled-over capital gains
2. **Only OZ equity should be excluded** from depreciable basis, not LIHTC equity
3. **Current system cannot distinguish** between equity sources

**Example:**
```
Project: $67M building + $6.7M land = $73.7M total
LIHTC Investor: $16.75M (25% LTV) - NOT from QCGs
OZ Investor:    $3.35M (5% LTV)   - FROM QCGs

Correct Depreciable Basis:
  $67M - $6.7M - $3.35M (OZ only) = $56.95M

Current System Would Calculate:
  $67M - $6.7M - $20.1M (total equity) = $40.2M

Error: $16.75M underdepreciation (29.4% too low)
```

---

## 6. Code Locations Summary

### Primary Implementation
| File | Lines | Purpose |
|------|-------|---------|
| [`depreciableBasisUtility.ts`](/hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts) | 30-57 | Main calculation function |
| [`depreciableBasisUtility.ts`](/hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts) | 64-90 | Breakdown utility |

### Usage in Calculation Engine
| File | Line | Context |
|------|------|---------|
| [`calculations.ts`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) | 184 | Initial straight-line calculation |
| [`calculations.ts`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) | 389 | Year 1 bonus + MACRS |
| [`calculations.ts`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) | 473 | Year 2+ depreciation |
| [`calculations.ts`](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) | 1004 | Final depreciation |

### Test Coverage
| File | Lines | Purpose |
|------|-------|---------|
| [`oz-depreciation-rule.test.ts`](/hdc-map-frontend/src/utils/HDCCalculator/__tests__/features/oz-depreciation-rule.test.ts) | 14-84 | Validates QCG exclusion |
| [`oz-depreciation-rule.test.ts`](/hdc-map-frontend/src/utils/HDCCalculator/__tests__/features/oz-depreciation-rule.test.ts) | 86-140 | Tests equity % impact |

---

## 7. Audit Findings Summary

### Current Behavior
```
Depreciable Basis Source: totalProjectCost - landValue - investorEquity
Depreciation Independent of Financing: NO (coupled to investor equity %)
Any Coupling Found: YES - investorEquity parameter
```

### Validation
- ✅ Formula correctly implements IRS OZ QCG exclusion rule
- ✅ Consistent application across all calculation points
- ✅ Well-tested with comprehensive test suite
- ❌ **LIMITATION:** Cannot distinguish between QCG equity (OZ) and non-QCG equity (LIHTC)

### Architectural Assessment

**For Single-Investor OZ Model:**
- ✅ **CORRECT:** Properly implements IRS rules
- ✅ **VALIDATED:** Test suite confirms behavior
- ✅ **DOCUMENTED:** Clear comments explain rationale

**For Twinned LIHTC + OZ Model:**
- ❌ **INCORRECT:** Treats all equity as QCG equity
- ❌ **LIMITATION:** Cannot model two investor types separately
- ❌ **IMPACT:** Underestimates depreciation by excluding LIHTC equity

---

## 8. Recommendations

### For Twinned LIHTC + OZ Implementation

#### Option 1: Add Equity Type Parameter (Recommended)
```typescript
export interface DepreciableBasisParams {
  projectCost: number;
  predevelopmentCosts?: number;
  landValue: number;
  investorEquityPct: number;
  ozEquityPct?: number;        // NEW: Only this portion is QCG
  lihtcEquityPct?: number;     // NEW: This portion is NOT QCG
  interestReserve?: number;
}

// Modified calculation:
const ozEquity = effectiveProjectCost * (ozEquityPct / 100);
const lihtcEquity = effectiveProjectCost * (lihtcEquityPct / 100);

// Only OZ equity is excluded from basis
const depreciableBasis = totalProjectCost - landValue - ozEquity;
// Note: lihtcEquity is NOT excluded
```

**Benefits:**
- ✅ Supports both single-investor OZ and twinned models
- ✅ Backward compatible (default behavior unchanged)
- ✅ Accurate IRS treatment of each equity type

#### Option 2: Separate Calculation Modes
```typescript
export type InvestorModel = 'oz-only' | 'lihtc-only' | 'twinned';

function calculateDepreciableBasis(
  params: DepreciableBasisParams,
  model: InvestorModel = 'oz-only'
): number {
  switch (model) {
    case 'oz-only':
      // Current behavior
      return totalProjectCost - landValue - investorEquity;

    case 'lihtc-only':
      // LIHTC equity NOT excluded (not QCGs)
      return totalProjectCost - landValue;

    case 'twinned':
      // Only OZ portion excluded
      return totalProjectCost - landValue - ozEquity;
  }
}
```

**Benefits:**
- ✅ Explicit mode selection
- ✅ Clear separation of logic
- ✅ Easy to test each scenario

#### Option 3: Document Limitation (Minimum Viable)
Simply document that the current system:
- Assumes 100% QCG equity (OZ-only model)
- Cannot accurately model twinned LIHTC + OZ structures
- Requires manual adjustment for twinned deals

---

## 9. Conclusion

### Summary of Findings

| Aspect | Status | Details |
|--------|--------|---------|
| **Depreciable Basis Formula** | ✅ Implemented | `projectCost - land - investorEquity` |
| **Coupling to Financing** | ❌ Found | Investor equity % affects depreciation |
| **IRS Compliance** | ✅ Correct | Properly excludes QCG equity per OZ regs |
| **Twinned Model Support** | ❌ Limited | Cannot distinguish QCG vs non-QCG equity |

### Recommendation

**For immediate Twinned LIHTC + OZ spec:**
1. Implement Option 1 (equity type parameters)
2. Add test cases for twinned structures
3. Update documentation to clarify equity treatment
4. Validate with tax advisor for IRS compliance

**Priority:** Medium-High (blocks accurate Twinned modeling)

**Effort:** 1-2 days (implementation + tests + docs)

---

## Validation Sign-Off

**Auditor:** Depreciable Basis Analysis
**Date:** January 30, 2025
**Time Spent:** 25 minutes
**Outcome:** Coupling confirmed, limitation identified, solution proposed

**Evidence Files:**
- [depreciableBasisUtility.ts](/hdc-map-frontend/src/utils/HDCCalculator/depreciableBasisUtility.ts) - Implementation
- [calculations.ts](/hdc-map-frontend/src/utils/HDCCalculator/calculations.ts) - Usage (4 locations)
- [oz-depreciation-rule.test.ts](/hdc-map-frontend/src/utils/HDCCalculator/__tests__/features/oz-depreciation-rule.test.ts) - Test validation

**Next Steps:** Present findings to product team for Twinned LIHTC + OZ roadmap prioritization
