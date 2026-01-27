# TaxBenefits Calculator — Audit Process

**Version:** 1.0
**Last Updated:** 2026-01-22
**Status:** Production Certified

---

## Overview

This document defines the audit process for validating TaxBenefits Calculator outputs. It ensures calculation accuracy and provides a consistent methodology for third-party review.

---

## Audit Artifacts

### 1. Excel Export
The primary audit artifact is the live Excel model exported via the "Export Audit Package" button.

**Contents:**
- **Inputs Sheet** — All calculation parameters with named ranges
- **Summary Sheet** — Key outputs and Returns Buildup breakdown
- **Investor Returns Sheet** — Year-by-year cash flows with IRR/MOIC
- **LIHTC Sheet** — Federal and State credit schedules
- **Validation Sheet** — 48 automated checks across 8 categories

**Key Feature:** All formulas are live — auditors can modify inputs and watch outputs recalculate.

### 2. Validation Checks (Tier 2)
The Validation Sheet contains 48 automated checks:

| Category | Checks | Examples |
|----------|--------|----------|
| Capital Stack | 6 | Sources = Uses, Debt/Equity balance |
| Depreciation | 6 | Cost Seg + S/L = Basis, Year 1 calculation |
| Tax Benefits | 6 | Rate × Depreciation = Benefit |
| LIHTC | 8 | Credit rate × QAF × Basis, 10-year schedule |
| Operating CF | 6 | NOI, DSCR, growth rates |
| Exit Waterfall | 6 | Priority ordering, promote calculations |
| Debt at Exit | 4 | Amortization, payoff amounts |
| Investor Returns | 6 | IRR methodology, MOIC denominator |

---

## Audit Workflow

### Step 1: Export Audit Package
1. Configure scenario in calculator UI
2. Click "Export Audit Package" button
3. Save Excel file with scenario name

### Step 2: Review Inputs Sheet
1. Verify all inputs match intended scenario
2. Check tax rates against investor profile
3. Confirm property/investor state settings

### Step 3: Run Validation Checks
1. Navigate to Validation sheet
2. Review all 48 checks — all should show "✅ PASS"
3. Investigate any failures before proceeding

### Step 4: Trace Key Calculations
Priority calculations to verify:

1. **Depreciable Basis**
   - Formula: `ProjectCost - LandValue - InvestorEquity`
   - Location: Summary Sheet, Cell Reference

2. **Year 1 Tax Benefit**
   - Formula: `DepreciableBasis × CostSegPct × EffectiveTaxRate`
   - Location: Investor Returns Sheet, Year 1

3. **Federal LIHTC Credits**
   - Formula: `QualifiedBasis × ApplicableFraction × CreditRate × 10 years`
   - Location: LIHTC Sheet

4. **MOIC**
   - Formula: `TotalReturns / InitialInvestment`
   - Note: Y0 syndication uses net equity; Y1+ uses gross equity

5. **IRR**
   - Formula: Excel XIRR on cash flow series
   - Location: Investor Returns Sheet

### Step 5: Spot Check Cash Flows
1. Select 2-3 random years from Investor Returns
2. Manually verify component calculations
3. Confirm sum matches total row

---

## Single Source of Truth Principle

**CRITICAL:** All financial calculations originate from `calculations.ts`.

- Hooks pass engine values to components
- Components display values without modification
- Export sheets write formula strings referencing engine outputs

See [CALCULATION_ARCHITECTURE.md](./constitution/CALCULATION_ARCHITECTURE.md) for details.

---

## Known Limitations

| Item | Notes |
|------|-------|
| State LIHTC | Limited to 25 programs; contact for additional states |
| OZ Rules | Based on 2025 regulations; verify for post-2026 changes |
| Cost Segregation | Assumes standard 5/7/15-year allocation |

---

## Validation Scenarios

For scenario-specific validation details, see [VALIDATION_SCENARIOS.md](./VALIDATION_SCENARIOS.md).

Current status: 13/15 scenarios validated (87% Institutional Certification).

---

## Contact

For audit support or custom validation requests:
- Review [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) for feature history
- Reference specific IMPL/ISS numbers when reporting discrepancies

---

## Document Maintenance

- **Version Control:** Increment for process changes
- **Location:** `frontend/docs/AUDIT_PROCESS.md`
