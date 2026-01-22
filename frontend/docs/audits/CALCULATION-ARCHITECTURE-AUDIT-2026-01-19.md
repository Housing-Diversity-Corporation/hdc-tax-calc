# Calculation Architecture Audit Report

**Date:** 2026-01-19
**Auditor:** Claude Code (IMPL-065)
**Status:** Complete - Phase 1-2 (Audit & Report)

---

## 1. Executive Summary

This audit examined the codebase for violations of the established calculation architecture principle:

> **Single Source of Truth:** All financial calculations belong in `calculations.ts` (and related engine files). Hooks pass values. Components display values. Export sheets write formula strings.

### Summary Counts

| Category | Files | Violations | Allowed | Review |
|----------|-------|------------|---------|--------|
| Hooks | 2 | **8** | 4 | 0 |
| Components | 7 | **9** | 20+ | 3 |
| Export Sheets | 14 | **1 (Critical)** | 50+ | 0 |
| **Total** | 23 | **18** | 74+ | 3 |

### Critical Finding

**`validationSheet.ts`** contains `calculatePlatformValues()` (lines 179-334), a complete reimplementation of the calculation engine covering capital stack, depreciation, tax benefits, LIHTC, operating CF, exit waterfall, debt at exit, and investor returns. This creates significant risk of calculation divergence.

---

## 2. Methodology

### Search Locations
1. `frontend/src/hooks/taxbenefits/` - 2 main hook files
2. `frontend/src/components/taxbenefits/` - 50+ component files
3. `frontend/src/utils/taxbenefits/auditExport/sheets/` - 14 sheet files

### Search Patterns
- Multiplication: `*`
- Division: `/`
- Math functions: `Math.round`, `Math.floor`, `Math.ceil`, `Math.min`, `Math.max`, `Math.abs`, `Math.pow`
- Financial terms: `depreciation`, `taxBenefit`, `noi`, `irr`, `lihtc`, `basis`

### Classification Criteria

| Classification | Definition |
|----------------|------------|
| **ALLOWED** | Formatting (×100 for %), UI logic (Math.max(0,x)), Excel formula strings |
| **VIOLATION** | Financial calculation (depreciation, tax, IRR, etc.) outside engine |
| **REVIEW** | Unclear, requires human judgment |

---

## 3. Findings by Location

### 3.1 Hooks

#### useHDCCalculations.ts - **8 VIOLATIONS**

| Line(s) | Code | Classification | Issue |
|---------|------|----------------|-------|
| 177-230 | `depreciationCalculations` useMemo | **VIOLATION** | Complete depreciation schedule calculation (bonus, MACRS, mid-month convention) |
| 238-354 | `taxCalculations` useMemo | **VIOLATION** | Complex tax rate calculations (bonus vs straight-line rates, conformity adjustments) |
| 357-379 | `advanceFinancingCalculations` | **VIOLATION** | Advance payment and financing cost calculations |
| 382-384 | `year1TaxBenefit`, `year1HdcFee`, `year1NetBenefit` | **VIOLATION** | Year 1 tax benefit calculations (duplicates engine) |
| 388-404 | `lihtcEligibleBasis` useMemo | **ALLOWED** | Calls shared utility function |
| 408-430 | `lihtcResult` useMemo | **ALLOWED** | Calls shared calculation function |
| 605-648 | `investmentCalculations` useMemo | **REVIEW** | Mostly reads engine values, but line 614 calculates `totalNetTaxBenefitsAfterCG` |
| 724-741 | `ozDeferralNPV` useMemo | **VIOLATION** | Complex NPV calculation with hardcoded discount rate |
| 753-769 | `unifiedBenefitsSummary` useMemo | **VIOLATION** | Sums up benefits and calculates multiples |

#### useHDCState.ts - **0 VIOLATIONS** (Compliant)

| Line(s) | Code | Classification | Reason |
|---------|------|----------------|--------|
| 197 | `Math.abs(hdcSubDebtPct - 1) < 0.001` | ALLOWED | Floating-point comparison for debug |
| 202 | `Math.max(0, 100 - totalDebt)` | ALLOWED | UI constraint (non-negative) |
| 220-221 | `Math.abs()` for difference checks | ALLOWED | UI logic for update suppression |
| 245 | Sum of percentages | ALLOWED | Display calculation for validation |

---

### 3.2 Components

#### BasicInputsSection.tsx (DEPRECATED) - **1 VIOLATION**

| Line(s) | Code | Classification | Issue |
|---------|------|----------------|-------|
| 138-169 | `calculateDebtServiceBreakdown()` | **VIOLATION** | Full amortization/PMT formula for debt service preview |

**Note:** This file is marked deprecated in line 1-6. Low priority.

#### OpportunityZoneSection.tsx - **1 VIOLATION**

| Line(s) | Code | Classification | Issue |
|---------|------|----------------|-------|
| 60-61 | `taxableGains = deferredCapitalGains * (1 - stepUpPercent)` <br> `year5TaxDue = taxableGains * (capitalGainsTaxRate / 100)` | **VIOLATION** | OZ Year 5 tax calculation for preview |

#### FreeInvestmentAnalysisSection.tsx - **2 VIOLATIONS**

| Line(s) | Code | Classification | Issue |
|---------|------|----------------|-------|
| 38 | `monthsNeeded = (freeInvestmentHurdle / year1NetBenefit) * 12` | **VIOLATION** | Recovery time calculation |
| 59, 66-67 | `annualBenefitAfterYear1 = year1NetBenefit * 0.11` (hardcoded fallback) <br> `additionalYearsNeeded = remainingAfterYear1 / annualBenefitAfterYear1` | **VIOLATION** | Years-to-recovery with hardcoded 11% estimate |

#### HDCComprehensiveReport.tsx - **3 VIOLATIONS**

| Line(s) | Code | Classification | Issue |
|---------|------|----------------|-------|
| 118-119 | `totalProjectCost`, `depreciableBasis` | **VIOLATION** | Basis calculation |
| 121-123 | `bonusDepreciation`, `remainingBasis`, `annualMACRS` | **VIOLATION** | Depreciation schedule |
| 125-128 | `monthsInYear1`, `year1MACRS`, `totalYear1Depreciation`, `total10YearDepreciation` | **VIOLATION** | MACRS proration and totals |

#### ReturnsBuiltupStrip.tsx - **0 VIOLATIONS** (Compliant)

| Line(s) | Code | Classification | Reason |
|---------|------|----------------|--------|
| 127-392 | `deriveReturnComponents()` | ALLOWED | Extracts and displays engine values; divisions are for multiple display (value/totalInvestment) |
| 377-389 | Component sum validation | ALLOWED | Validation check, not financial calculation |

#### Other Components - **2 VIOLATIONS, 20+ ALLOWED**

| File | Line(s) | Classification | Notes |
|------|---------|----------------|-------|
| CapitalStructureSection.tsx | 44 | ALLOWED | Validation check `Math.abs(total - 100) <= 0.1` |
| DistributableCashFlowTable.tsx | 66 | ALLOWED | Rounding tolerance `paid < expected * 0.99` |
| OutsideInvestorSection.tsx | 48 | **REVIEW** | IRR approximation - needs verification |
| HDCPlatformSection.tsx | 80-96 | **VIOLATION** | Platform IRR calculation |
| KPIStrip.tsx | 253 | ALLOWED | Percentage split of multiples |

---

### 3.3 Export Sheets

#### validationSheet.ts - **1 CRITICAL VIOLATION**

**Location:** Lines 179-334 (`calculatePlatformValues()`)

**Severity:** CRITICAL

**Description:** This function reimplements the entire calculation engine in ~150 lines:

| Calculation | Lines | What it recalculates |
|-------------|-------|---------------------|
| Capital Stack | 190-194 | `investorEquity`, `seniorDebt`, `philDebt`, `hdcSubDebt` |
| Depreciation | 196-207 | `depreciableBasis`, `bonusDepr`, `annualMACRS`, `year1Depreciation`, `totalDepreciation` |
| Tax Benefits | 209-218 | `effectiveRateBonus`, `effectiveRateMACRS`, `year1TaxBenefit`, `totalTaxBenefits` |
| LIHTC | 220-231 | `lihtcEligibleBasis`, `lihtcQualifiedBasis`, `lihtcAnnualFedCredit`, full credit schedule |
| Operating CF | 233-246 | `year10NOI`, `minDSCR`, `avgDSCR`, `totalAvailForSoftPay` |
| Exit Waterfall | 248-256 | `investorROC`, `investorPrefPaid` |
| Debt at Exit | 258-262 | `totalDebtAtExit` |
| Investor Returns | 264-268 | `totalInvestment`, `investorMOIC`, `investorIRR` |
| OZ Benefits | 270-280 | `ozStepUpSavings`, `ozAppreciationExclusion` |

**Risk:** If the engine changes, this reimplementation will produce different values, causing validation failures that don't reflect actual bugs.

#### Other Export Sheets - **0 VIOLATIONS** (Compliant)

All other export sheets follow the correct pattern:
1. Receive pre-calculated values from engine
2. Write display values to cells
3. Provide Excel formulas for calculations

| File | Status | Pattern |
|------|--------|---------|
| inputsSheet.ts | COMPLIANT | Writes input parameters only |
| capitalStackSheet.ts | COMPLIANT | Uses params, writes formulas |
| debtScheduleSheet.ts | COMPLIANT | Pre-calc for display, Excel formulas |
| depreciationSheet.ts | COMPLIANT | Uses engine values |
| taxBenefitsSheet.ts | COMPLIANT | Uses engine values |
| lihtcSheet.ts | COMPLIANT | Uses engine values |
| operatingCFSheet.ts | COMPLIANT | Uses engine values, writes formulas |
| pikTrackingSheet.ts | COMPLIANT | Uses engine values |
| waterfallSheet.ts | COMPLIANT | Uses engine values |
| exitSheet.ts | COMPLIANT | Uses engine values, writes formulas |
| hdcReturnsSheet.ts | COMPLIANT | Uses engine values |
| summarySheet.ts | COMPLIANT | Uses engine values |
| investorReturnsSheet.ts | COMPLIANT | Uses engine values |

---

## 4. Violation Details

### 4.1 High Priority (Affects Calculation Correctness)

#### V-001: validationSheet.ts - calculatePlatformValues()
- **File:** `validationSheet.ts:179-334`
- **Impact:** HIGH - Validation compares reimplemented values to engine, masking real discrepancies
- **Fix:** Remove `calculatePlatformValues()`, use engine results directly
- **Effort:** Medium (refactor to pass engine values as parameters)

#### V-002: useHDCCalculations.ts - depreciationCalculations
- **File:** `useHDCCalculations.ts:177-230`
- **Impact:** HIGH - Parallel depreciation calculation could diverge from engine
- **Fix:** Remove local calculation, use `mainAnalysisResults.depreciationSchedule`
- **Effort:** High (need to add depreciation schedule to engine results)

#### V-003: useHDCCalculations.ts - taxCalculations
- **File:** `useHDCCalculations.ts:238-354`
- **Impact:** HIGH - Complex tax rate logic duplicated
- **Fix:** Move to engine, return as part of `InvestorAnalysisResults`
- **Effort:** High (significant refactor)

### 4.2 Medium Priority (Display Inconsistency Risk)

#### V-004: HDCComprehensiveReport.tsx - Depreciation calculations
- **File:** `HDCComprehensiveReport.tsx:118-128`
- **Impact:** MEDIUM - PDF could show different values than UI
- **Fix:** Use engine-provided depreciation values
- **Effort:** Low (values already in engine results)

#### V-005: FreeInvestmentAnalysisSection.tsx - Recovery calculation
- **File:** `FreeInvestmentAnalysisSection.tsx:34-77`
- **Impact:** MEDIUM - Hardcoded 0.11 (11%) assumption for years 2+ benefits
- **Fix:** Engine should provide `monthsToFreeInvestment` metric
- **Effort:** Medium (add new engine metric)

#### V-006: OpportunityZoneSection.tsx - Year 5 tax preview
- **File:** `OpportunityZoneSection.tsx:60-61`
- **Impact:** LOW - Preview only, actual calculation in engine
- **Fix:** Pass `ozYear5TaxDue` from engine results
- **Effort:** Low (value exists in cash flows)

### 4.3 Low Priority (Deprecated or Minimal Impact)

#### V-007: BasicInputsSection.tsx - Debt service breakdown (DEPRECATED)
- **File:** `BasicInputsSection.tsx:138-169`
- **Impact:** LOW - File is deprecated
- **Fix:** Remove file or extract to engine
- **Effort:** Low (file is deprecated, consider deletion)

#### V-008: useHDCCalculations.ts - ozDeferralNPV
- **File:** `useHDCCalculations.ts:724-741`
- **Impact:** LOW - Convenience calculation, main OZ logic in engine
- **Fix:** Move to engine
- **Effort:** Low

---

## 5. Priority Ranking

### Immediate (Before Next Release)

| ID | File | Issue | Effort |
|----|------|-------|--------|
| V-001 | validationSheet.ts | calculatePlatformValues() reimplements engine | Medium |

### High Priority (Next Sprint)

| ID | File | Issue | Effort |
|----|------|-------|--------|
| V-002 | useHDCCalculations.ts | depreciationCalculations | High |
| V-003 | useHDCCalculations.ts | taxCalculations | High |
| V-004 | HDCComprehensiveReport.tsx | Depreciation calculations | Low |

### Medium Priority (Backlog)

| ID | File | Issue | Effort |
|----|------|-------|--------|
| V-005 | FreeInvestmentAnalysisSection.tsx | Recovery calculation with hardcoded 11% | Medium |
| V-006 | OpportunityZoneSection.tsx | Year 5 tax preview | Low |
| V-008 | useHDCCalculations.ts | ozDeferralNPV | Low |

### Low Priority (Cleanup)

| ID | File | Issue | Effort |
|----|------|-------|--------|
| V-007 | BasicInputsSection.tsx | Deprecated file with debt service calculation | Low |

---

## 6. Recommended Next Steps

### Phase 3a: Fix Critical Violation (V-001)

1. **Refactor validationSheet.ts**
   - Remove `calculatePlatformValues()` function
   - Modify `buildValidationSheet()` to receive all needed values from caller
   - Update `auditExport.ts` to pass engine results to validation sheet
   - Verify 48 validation checks still pass

### Phase 3b: Fix High Priority Hook Violations (V-002, V-003)

1. **Add comprehensive depreciation to engine results**
   - Add `depreciationSchedule` to `InvestorAnalysisResults` interface
   - Include: `year1Bonus`, `year1MACRS`, `yearsToN`, `total`
   - Remove parallel calculation from `useHDCCalculations.ts`

2. **Consolidate tax rate calculations in engine**
   - Add `effectiveTaxRates` to engine results
   - Include: `forBonus`, `forMACRS`, `combined`
   - Remove local calculation from hook

### Phase 3c: Component Cleanup

1. **HDCComprehensiveReport.tsx** - Replace local depreciation with engine values
2. **FreeInvestmentAnalysisSection.tsx** - Add `monthsToFreeInvestment` to engine
3. **OpportunityZoneSection.tsx** - Use `ozYear5TaxDue` from cash flows

### Validation

After each fix:
- Run existing tests: `npm test`
- Generate fresh audit export
- Verify 47/48+ validation checks pass
- Compare key metrics before/after

---

## 7. Appendix: Allowed Patterns

### Formatting (ALLOWED)
```typescript
// Converting decimal to percentage for display
const displayPercent = value * 100;

// Converting millions to dollars
const dollars = valueInMillions * 1000000;
```

### UI Logic (ALLOWED)
```typescript
// Preventing negative display
const displayValue = Math.max(0, value);

// Validation tolerance
const isValid = Math.abs(actual - expected) < tolerance;

// Bounds checking
const clampedValue = Math.min(100, Math.max(0, value));
```

### Excel Formula Strings (ALLOWED)
```typescript
// Building Excel formula (string, not calculation)
ws['B5'] = { t: 'n', v: preCalculatedValue, f: '=B3*B4' };
```

---

**End of Audit Report**
