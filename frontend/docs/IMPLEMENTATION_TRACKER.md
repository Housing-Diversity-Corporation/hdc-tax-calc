# TaxBenefits Calculator — Implementation Tracker

**Document Version:** 8.5
**Last Updated:** 2026-01-22
**Branch:** main
**Current Test Count:** 1,195 passing (1 pre-existing failure: ISS-014)
**Validation Status:** 13/15 Three Sigma scenarios complete (Production Certification ✅)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v8.5 | 2026-01-22 | ISS-023: Fixed Time to Recovery using gross equity instead of net for Y0 syndication |
| v8.4 | 2026-01-22 | IMPL-078: Merged Free Investment Analysis + Tax Planning Capacity into single InvestmentRecoverySection |
| v8.3 | 2026-01-21 | ISS-022: Fixed Tax Planning Capacity double-counting bug (was showing ~$117M instead of ~$56M) |
| v8.2 | 2026-01-21 | Added IMPL-074-077 (Syndication Year timing logic), ISS-019/020/021 (State LIHTC validation fixes, Eligible vs Qualified Basis display) |
| v8.1 | 2026-01-20 | Added IMPL-073: State LIHTC Syndication as Capital Return (refactored from equity offset to capital return model) |
| v8.0 | 2026-01-20 | Added Phase 14: IMPL-068-072 (Validation Session), Bug Fixes ISS-015/016/017, Open Issues section |
| v7.9 | 2026-01-19 | Added Phase 13: IMPL-064/064b (Excel Input Sync), IMPL-065/065-3A/065-3B (Calculation Architecture Audit), IMPL-066 (State Tax Architecture) |
| v7.8 | 2026-01-18 | Added IMPL-062: Tier 2 Validation (48 checks, 8 categories) |
| v7.7 | 2026-01-18 | Added Phase 12: IMPL-056 (Live Excel Model), IMPL-061 (Tax Benefit Calculation Fix + Constitution) |
| v7.6 | 2026-01-15 | Added IMPL-060: OZ Benefits Dropdown Breakdown in Returns Buildup Strip |
| v7.5 | 2026-01-15 | Renamed documentation from "OZBenefits" to "TaxBenefits" |
| v7.4 | 2026-01-15 | Added IMPL-059: Conditional Capital Structure Display (hide 0% layers) |
| v7.3 | 2026-01-15 | Added IMPL-058: Capital Structure UI Consolidation (removed duplicate InvestmentSummarySection) |
| v7.2 | 2026-01-14 | Closed all pending IMPLs: IMPL-048/042 complete (2026-01-06), IMPL-034 obsolete |
| v7.1 | 2026-01-14 | Added IMPL-057: Expose OZ Step-Up Savings in Returns Buildup Strip |
| v7.0 | 2026-01-14 | Added Phase 11 (Jan 14): IMPL-050 through IMPL-055 (UI cleanup, OZ fixes, state data) |
| v6.0 | 2026-01-07 | Added Phase 10 (Jan 7): IMPL-026B, IMPL-049A/B/C (Pre-Debug Cleanup). Branch merged to main. |
| v5.0 | 2026-01-06 | Added Phase 9 (Jan 5-6): IMPL-045, IMPL-046 (State LIHTC UI Clarity) |
| v4.0 | 2025-12-30 | Added Phase 8 (Dec 29-30): IMPL-033, 040, 040b, 041, 044, 044b |
| v3.0 | 2025-12-28 | Complete history through IMPL-031 |
| v2.0 | 2025-12-28 | Added IMPL-019 through IMPL-023 |
| v1.0 | 2025-12-26 | Initial tracker creation |

---

## Implementation History

### Phase 1: v7.0 Core (Dec 14-17, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-7.0-001 | Fee Structure Cleanup | ✅ Complete | 2025-12-14 |
| IMPL-7.0-002 | State Profile Lookup (56 jurisdictions) | ✅ Complete | 2025-12-14 |
| IMPL-7.0-003 | State LIHTC Calculation (25 programs) | ✅ Complete | 2025-12-15 |
| IMPL-7.0-004 | Warnings & Display | ✅ Complete | 2025-12-15 |
| IMPL-7.0-005 | LIHTC Credit Mechanics (Federal) | ✅ Complete | 2025-12-16 |
| IMPL-7.0-006 | Preferred Equity | ✅ Complete | 2025-12-16 |
| IMPL-7.0-007 | Basis Adjustments | ✅ Complete | 2025-12-17 |
| IMPL-7.0-008 | UI Scaffolding | ✅ Complete | 2025-12-17 |

### Phase 2: Wiring (Dec 18-25, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-009 | Waterfall integration | ✅ Complete | 2025-12-18 |
| IMPL-010 | StateLIHTCSection.tsx input UI | ✅ Complete | 2025-12-19 |
| IMPL-011 | LIHTCStructureSection.tsx input UI | ✅ Complete | 2025-12-20 |
| IMPL-012 | Basis Calculations Fix | ✅ Complete | 2025-12-21 |
| IMPL-013 | Connect calculations → results | ✅ Complete | 2025-12-22 |
| IMPL-014b | Property/Investor State Separation | ✅ Complete | 2025-12-24 |

### Phase 3: Refinement (Dec 25-26, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-015 | Input Panel Restructuring (9→7 panels) | ✅ Complete | 2025-12-25 |
| IMPL-016 | Codebase Consolidation (taxbenefits namespace) | ✅ Complete | 2025-12-25 |
| IMPL-017 | OZ Version Toggle (1.0/2.0) | ✅ Complete | 2025-12-25 |
| IMPL-018 | State LIHTC Capital Stack Integration | ✅ Complete | 2025-12-26 |

### Phase 4: Output Validation (Dec 26-27, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-019 | Calculation Engine Audit | ✅ Complete | 2025-12-26 |
| IMPL-020 | Waterfall Validation | ✅ Complete | 2025-12-26 |
| IMPL-020a | Violation Remediation | ✅ Complete | 2025-12-26 |
| IMPL-021 | IRR & Returns Validation | ✅ Complete | 2025-12-27 |
| IMPL-021b | Federal LIHTC Cash Flow Fix | ✅ Complete | 2025-12-27 |
| IMPL-023 | Audit Export Package - Formula Map v1.1 | ✅ Complete | 2025-12-27 |

### Phase 5: Conductor's Dashboard (Dec 27, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-024 | Engine Output Audit | ✅ Complete | 2025-12-27 |
| IMPL-025 | Deal Validation Strip | ✅ Complete | 2025-12-27 |
| IMPL-026 | Output Section Reorganization | ✅ Complete | 2025-12-27 |
| IMPL-026D | Syndicated Equity Offset Fix | ✅ Complete | 2025-12-27 |
| IMPL-026F | Returns Component Audit | ✅ Complete | 2025-12-27 |

### Phase 6: Returns Debugging (Dec 27-28, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-028 | Returns Buildup Strip | ✅ Complete | 2025-12-27 |
| IMPL-029 | Investor Returns Calculation Fixes | ✅ Complete | 2025-12-28 |
| IMPL-030 | Atrium Operating Cash Audit | ✅ Complete | 2025-12-28 |
| IMPL-031 | Atrium Baseline Validation Test | ✅ Complete | 2025-12-28 |

### Phase 7: State Conformity & PDF Export (Dec 29-30, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-040 | Tax Benefit Data Flow Trace | ✅ Complete | 2025-12-29 |
| IMPL-040b | Formula Map Update Protocol | ✅ Complete | 2025-12-29 |
| IMPL-041 | State Conformity Integration | ✅ Complete | 2025-12-29 |
| IMPL-033 | Professional PDF Export — Returns Component Display | ✅ Complete | 2025-12-30 |

### Phase 8: Investment Portal (Dec 30, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-044 | Investment Portal — Returns Breakdown Parity | ✅ Complete | 2025-12-30 |
| IMPL-044b | Investment Portal — PDF Export Buttons | ✅ Complete | 2025-12-30 |

### Phase 9: State LIHTC UI Clarity (Jan 5-6, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-045 | State LIHTC Returns Strip Visibility & Label Accuracy | ✅ Complete | 2026-01-05 |
| IMPL-046 | Equity Display Consistency | ✅ Complete | 2026-01-05 |
| IMPL-047 | State LIHTC Toggle Fix | ✅ Complete | 2026-01-06 |
| IMPL-042 | Year 11 LIHTC Handling (via IMPL-048b) | ✅ Complete | 2026-01-06 |
| IMPL-048 | IRR Calculation Fix (exit timing, OZ benefits, recapture) | ✅ Complete | 2026-01-06 |

### Phase 10: Pre-Debug Codebase Cleanup (Jan 7, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-026B | Remove Output Display Sections (Strategic Value Hierarchy, Waterfall Distribution Logic, Tax Strategy Analysis) | ✅ Complete | 2026-01-07 |
| IMPL-049A | Delete TaxStrategy Components (8 files, 3,480 lines) | ✅ Complete | 2026-01-07 |
| IMPL-049B | Debug Scripts & Orphan Cleanup (13 files, 2,353 lines) | ✅ Complete | 2026-01-07 |
| IMPL-049C | Dead File Cleanup (18 files, 2,864 lines) | ✅ Complete | 2026-01-07 |

### Phase 11: UI Cleanup & OZ Fixes (Jan 14, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-050 | UI Redundancy Cleanup (246 lines removed) | ✅ Complete | 2026-01-14 |
| IMPL-051 | Restore Interest Reserve Input Controls | ✅ Complete | 2026-01-14 |
| IMPL-052 | Fix OZ Version Toggle Dependency | ✅ Complete | 2026-01-14 |
| IMPL-052b | Pass ozVersion to Calculation Engine | ✅ Complete | 2026-01-14 |
| IMPL-053 | State Data Single Source of Truth (WA 7% fix) | ✅ Complete | 2026-01-14 |
| IMPL-054 | Include OZ Step-Up Savings in IRR | ✅ Complete | 2026-01-14 |
| IMPL-055 | Returns Buildup Strip Decimal Precision | ✅ Complete | 2026-01-14 |
| IMPL-057 | Expose OZ Step-Up Savings in Returns Buildup Strip | ✅ Complete | 2026-01-14 |
| IMPL-058 | Capital Structure UI Consolidation (removed InvestmentSummarySection, shows both $ and %) | ✅ Complete | 2026-01-15 |
| IMPL-059 | Conditional Capital Structure Display (hide 0% layers) | ✅ Complete | 2026-01-15 |
| IMPL-060 | OZ Benefits Dropdown Breakdown in Returns Buildup Strip | ✅ Complete | 2026-01-15 |

### Phase 12: Live Excel Model & Calculation Architecture (Jan 18, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-056 | Live Calculation Excel Model (14 sheets, ~100 named ranges, live formulas) | ✅ Complete | 2026-01-18 |
| IMPL-061 | Tax Benefit Calculation Fix + CALCULATION_ARCHITECTURE.md Constitution | ✅ Complete | 2026-01-18 |
| IMPL-062 | Tier 2 Validation Expansion (48 checks across 8 categories) | ✅ Complete | 2026-01-18 |

**IMPL-056 Details:** Replaced documentation-style Audit Export with live calculation Excel model. All formulas actually compute — auditor can change any input and watch outputs recalculate.

**IMPL-061 Details:** Fixed bug where Tax Planning Capacity displayed $72M instead of ~$15M. Root cause: redundant calculation in `useHDCCalculations.ts`. Fix: Wire display to use engine values (single source of truth). Added `CALCULATION_ARCHITECTURE.md` to constitution.

**IMPL-062 Details:** Expanded validation sheet from 16 to 48 checks across 8 categories: Capital Stack (6), Depreciation (6), Tax Benefits (6), LIHTC (8), Operating CF (6), Exit Waterfall (6), Debt at Exit (4), Investor Returns (6). Added invariant checks for cross-validation (Sources = Uses, CostSeg + S/L = Basis, etc.).

### Phase 13: Calculation Architecture Audit (Jan 19, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-064 | Excel Export Input Sync (Inputs sheet reflects all calculation params) | ✅ Complete | 2026-01-19 |
| IMPL-064b | Investor State Prop Fix (pass investorState to validation sheet) | ✅ Complete | 2026-01-19 |
| IMPL-065 | Calculation Architecture Audit (18 violations identified, report generated) | ✅ Complete | 2026-01-19 |
| IMPL-065-3A | Remove calculatePlatformValues() reimplementation, remove hardcoded 11% fallback | ✅ Complete | 2026-01-19 |
| IMPL-065-3B | Remove ozDeferralNPV from hook (was 10% vs engine's 8%), use engine value | ✅ Complete | 2026-01-19 |
| IMPL-066 | State Tax Architecture (investor state rate lookup from single source) | ✅ Complete | 2026-01-19 |
| IMPL-067 | Add Returns Buildup to Excel Export (Summary sheet section with component breakdown) | ✅ Complete | 2026-01-19 |

**IMPL-065 Details:** Comprehensive audit enforcing the principle "All financial calculations belong in `calculations.ts` - hooks pass values, components display values, export sheets write formula strings." Found 18 violations across hooks, components, and export sheets. Key finding: `validationSheet.ts` had `calculatePlatformValues()` reimplementing ~155 lines of engine logic. Fixed by replacing with `extractPlatformValues()` that uses engine values directly.

**IMPL-065-3B Details:** Discovered `ozDeferralNPV` was calculated both in hook (10% discount rate) and engine (8% discount rate). This caused inconsistency. Removed hook calculation and now uses `mainAnalysisResults.ozDeferralNPV` as single source of truth.

**IMPL-067 Details:** Added Returns Buildup section to Summary sheet in Excel export. Includes all return components (Federal LIHTC, State LIHTC, Depreciation Benefits, OZ Benefits with sub-components, Operating Cash Flow, Exit Proceeds, Sub-Debt) with validation check (Sum = Total). Mirrors UI ReturnsBuiltupStrip component using same engine values.

### Phase 14: Three Sigma Validation Session (Jan 17-20, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-068 | Fix effective tax rate display for REP investors | ✅ Complete | 2026-01-19 |
| IMPL-069 | Fix NJ bonus conformity (was 30%, correct is 0%) | ✅ Complete | 2026-01-19 |
| IMPL-070 | Fix split-rate header display in validation sheet | ✅ Complete | 2026-01-19 |
| IMPL-071 | Expose OZ toggle in UI (was hidden despite ozEnabled state) | ✅ Complete | 2026-01-20 |
| IMPL-072 | Fix ISS-012 (OZ NPV calc) + ISS-013 (OZ export) | ✅ Complete | 2026-01-20 |

**Phase 14 Details:** Weekend validation session using Three Sigma scenarios. Completed 9 of 15 scenarios with 432 validation checks passing. Fixed critical bugs in State LIHTC export flow (ISS-015/016/017).

### Bug Fixes (Jan 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-015 | Syndication rate export showed 85 instead of 100 | syndicationRate not passed to export | HDCResultsComponent.tsx, inputsSheet.ts | 2026-01-20 |
| ISS-016 | State LIHTC annual credit = $0 in export | stateLIHTCRate hardcoded to 0 | lihtcSheet.ts, types/index.ts, calculations.ts, ReturnsBuiltupStrip.tsx | 2026-01-20 |
| ISS-017 | Duplicate investor state dropdown causing 10x MOIC bug | Two dropdowns allowed state mismatch | TaxCreditsSection.tsx (replaced with read-only display) | 2026-01-20 |

### Feature: State LIHTC Capital Return Model (Jan 20, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-073 | State LIHTC Syndication as Capital Return | ✅ Complete | 2026-01-20 |

**IMPL-073 Details:** Refactored State LIHTC syndication from an equity offset model to a capital return model.

**Previous Behavior:**
- Syndicated proceeds reduced investor equity at close via `syndicatedEquityOffset`
- MOIC denominator = `investorEquity - syndicatedEquityOffset`
- Created confusing "net investment" concept

**New Behavior:**
- Investor commits full equity at close (gross investment)
- Syndication proceeds are cash returned in Year 0, 1, or 2 (configurable via new "Syndication Year" input)
- MOIC denominator = gross `investorEquity` (no offset)
- Syndication proceeds appear in Returns Buildup as "State LIHTC Syndication" line item
- Capital Stack shows full equity (no offset display)

**Files Modified:**
- `types/taxbenefits/index.ts` - Added `stateLIHTCSyndicationYear`, `stateLIHTCSyndicationProceeds`
- `calculations.ts` - Removed equity offset, added proceeds to cash flow at selected year
- `useHDCState.ts` - Added syndication year state
- `TaxCreditsSection.tsx` - Added "Syndication Year" selector (Year 0/1/2)
- `ReturnsBuiltupStrip.tsx` - Added "State LIHTC Syndication" component
- `CapitalStructureSection.tsx` - Removed offset display, simplified to show full equity
- `StateLIHTCIntegrationSection.tsx` - Updated treatment label to "Capital Return"
- Excel export files - Added syndication year input and proceeds row

### Feature: Syndication Year Timing Logic (Jan 21, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-074 | Net Investment breakdown in Summary/Export (Gross → Offset → Net) | ✅ Complete | 2026-01-21 |
| IMPL-075 | MOIC denominator conditional on Syndication Year (Y0=net, Y1+=gross) | ✅ Complete | 2026-01-21 |
| IMPL-076 | Double-counting bug fix for Year 0 syndication + default changed to Y0 | ✅ Complete | 2026-01-21 |
| IMPL-077 | Syndication Year export capture fix + Initial Investment display by scenario | ✅ Complete | 2026-01-21 |

**IMPL-074 Details:** When syndication offset exists, Summary and Investor Returns sheets now display breakdown: Investor Equity (Gross) → Less: Syndication Offset → Net Investment (MOIC basis). Provides audit trail for MOIC denominator calculation.

**IMPL-075 Details:** MOIC denominator now varies by syndication timing:
- Year 0 syndication: Syndicator funds offset at close → MOIC uses net equity
- Year 1+ syndication: Investor funds full amount → MOIC uses gross equity

**IMPL-076 Details:** Fixed critical double-counting bug where Year 0 syndication was:
1. Reducing equity ($35M → $11M via syndicatedEquityOffset) ✓
2. ALSO appearing as +$24M cash inflow in Year 0 ✗

This caused impossible 275% IRR. Fix: Year 0 syndication proceeds are netted in equity only (no cash flow line item). Year 1+ proceeds appear as cash flow in selected year. Default syndication year changed from 1 to 0.

**IMPL-077 Details:** Two fixes for export accuracy:
1. Export now captures `stateLIHTCSyndicationYear` from engine results (was missing from ExportAuditButton params)
2. Initial Investment row in Investor Returns sheet uses correct formula based on syndication year:
   - Year 0: `-(InvestorEquity-StateLIHTCSyndProceeds+InvestorSubDebt)` (net equity)
   - Year 1+: `-(InvestorEquity+InvestorSubDebt)` (gross equity)

**Files Modified:**
- `calculations.ts` - MOIC denominator logic, cash flow timing, default year
- `useHDCState.ts` - Default syndication year changed to 0
- `HDCResultsComponent.tsx` - Added stateLIHTCSyndicationYear to export params
- `investorReturnsSheet.ts` - Initial Investment formula, Summary section display
- `summarySheet.ts` - Total Investment calculation, display breakdown
- `inputsSheet.ts` - Default syndication year changed to 0
- `useHDCCalculations.test.ts` - Updated tests for Year 0 vs Year 1+ behavior

### Bug Fixes: State LIHTC Validation (Jan 20-21, 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-019 | State LIHTC investor validation | Investor state check incomplete | Updated validation in stateLIHTCCalculations.ts | 2026-01-20 |
| ISS-020 | Tax liability checkbox integration | Missing path toggle logic | Added checkbox to toggle direct (100% credits) vs syndicated (75% cash) path based on investor's state tax liability | 2026-01-20 |
| ISS-021 | Eligible Basis vs Qualified Basis display in LIHTC sheet | eligibleBasis already included 130% boost | lihtcSheet.ts: Eligible Basis now shows pre-boost ($80M), added DDA/QCT Boost row (30%), Qualified Basis shows post-boost ($104M) | 2026-01-21 |
| ISS-022 | Tax Planning Capacity showing wildly inflated numbers | Double-counting bug in hook's depreciation calculation | useHDCCalculations.ts: Use engine's `investorTaxBenefits` instead of buggy `taxCalculations.netTaxBenefit` | 2026-01-21 |
| ISS-023 | Time to Recovery showing 7.4 years instead of ~1.4 years for Y0 syndication | Recovery used gross equity ($35M) instead of net equity ($11M) | InvestmentRecoverySection.tsx: Use `totalInvestment` (MOIC basis) for recovery calculation | 2026-01-22 |

**ISS-020 Details:** When investor has no state tax liability (out-of-state or no income tax), the tax liability checkbox now correctly routes to syndication path. Direct use path requires in-state investor with tax liability to use credits directly.

**ISS-021 Details:** LIHTC sheet was showing $104M for both Eligible and Qualified Basis because the boost was applied too early. Fixed to properly distinguish:
- **Eligible Basis:** Project Cost - Land (pre-boost) = $80M
- **DDA/QCT Boost:** 30% (only shown when applicable)
- **Qualified Basis:** Eligible Basis × (1 + Boost) × Applicable Fraction = $104M

**ISS-022 Details:** Tax Planning Capacity section was showing ~$117M Total 10-Year Benefits (should be ~$56M) and ~$231M Depreciation Offset (should be ~$40-60M). Root cause: `useHDCCalculations.ts` lines 299-301 had a double-counting bug where `years2toNDepreciation` (already TOTAL for years 2-N) was multiplied by `(holdPeriod - 1)` again, inflating by ~9x. Fixed by using the engine's correct `mainAnalysisResults.investorTaxBenefits` in `unifiedBenefitsSummary` instead of the buggy hook calculation.

**ISS-023 Details:** Time to Full Recovery was showing 7.4 years instead of ~1.4 years for Year 0 syndicated scenarios. Root cause: `InvestmentRecoverySection.tsx` used `investorEquity` (gross $35M) instead of `totalInvestment` (net $11M after Y0 syndication offset). Fix: Added `totalInvestment` prop and updated all recovery calculations (Year 1 Coverage, Free Investment Status, Time to Recovery) to use MOIC basis. This aligns with IMPL-075 which established that Y0 syndication uses net equity for MOIC.

### Phase 15: UI Consolidation (Jan 22, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-078 | Merge Free Investment Analysis + Tax Planning Capacity sections | ✅ Complete | 2026-01-22 |

**IMPL-078 Details:** Merged two overlapping UI sections into a single coherent "Investment Recovery & Tax Planning" section:
- **Created:** `InvestmentRecoverySection.tsx` - New merged component with simplified props
- **Deleted:** `FreeInvestmentAnalysisSection.tsx` - Functionality merged
- **Deleted:** `TaxPlanningCapacitySection.tsx` - Functionality merged
- **Updated:** `HDCResultsComponent.tsx` - Uses new merged component

**Key Improvements:**
- Single source of truth: All values from calculation engine (ISS-022 fix)
- Simplified props: 11 props instead of 33+ combined
- Cleaner UI: Three logical sections (Summary, Recovery Timeline, Excess Capacity)
- Conditional display: Excess Capacity only shows when benefits > investment
- Time to Recovery: Now uses ALL benefit sources (depreciation + LIHTC + syndication)
- Code reduction: ~150 lines vs ~455 combined

---

## Open Issues

| ISS | Description | Priority | Notes |
|-----|-------------|----------|-------|
| ISS-014 | stateConformityAdjustment test failure | Low | Pre-existing, non-blocking |
| ISS-018 | Returns Buildup LIHTC catch-up allocation display | Low | Cosmetic - catch-up shows in Federal row instead of split |

---

## Skipped IMPL Numbers

| IMPL | Notes |
|------|-------|
| IMPL-014 / 014a | Only 014b implemented |
| IMPL-022 | Skipped |
| IMPL-063 | Skipped |
| IMPL-034 | Obsolete — no quarantined tests remain |
| IMPL-026A/C/E | 026B used for output cleanup; 026C/D/E renumbered to 049A/B/C |
| IMPL-027 | Skipped |
| IMPL-032 | Superseded by IMPL-041 |
| IMPL-035 to 039 | Skipped |
| IMPL-043 | Skipped |

---

## Implementation Summary

| Phase | IMPLs | Complete | Status |
|-------|-------|----------|--------|
| Phase 1: v7.0 Core | 7.0-001 to 7.0-008 | 8/8 | ✅ 100% |
| Phase 2: Wiring | 009 to 014b | 6/6 | ✅ 100% |
| Phase 3: Refinement | 015 to 018 | 4/4 | ✅ 100% |
| Phase 4: Output Validation | 019 to 023 | 6/6 | ✅ 100% |
| Phase 5: Conductor's Dashboard | 024 to 026F | 5/5 | ✅ 100% |
| Phase 6: Returns Debugging | 028 to 031 | 4/4 | ✅ 100% |
| Phase 7: State Conformity & PDF | 033, 040, 040b, 041 | 4/4 | ✅ 100% |
| Phase 8: Investment Portal | 044, 044b | 2/2 | ✅ 100% |
| Phase 9: State LIHTC UI Clarity | 045-048 | 5/5 | ✅ 100% |
| Phase 10: Pre-Debug Cleanup | 026B, 049A-C | 4/4 | ✅ 100% |
| Phase 11: UI Cleanup & OZ Fixes | 050-055, 057-060 | 11/11 | ✅ 100% |
| Phase 12: Live Excel & Architecture | 056, 061, 062 | 3/3 | ✅ 100% |
| Phase 13: Calculation Architecture Audit | 064, 064b, 065, 065-3A, 065-3B, 066, 067 | 7/7 | ✅ 100% |
| Phase 14: Three Sigma Validation | 068-072 | 5/5 | ✅ 100% |
| Feature: State LIHTC Capital Return | 073 | 1/1 | ✅ 100% |
| Feature: Syndication Year Timing | 074-077 | 4/4 | ✅ 100% |
| Phase 15: UI Consolidation | 078 | 1/1 | ✅ 100% |
| **Total** | **80 IMPLs** | **80/80** | **✅ 100%** |

---

## Test History

| Date | Test Count | Notes |
|------|------------|-------|
| 2026-01-22 | 1,176 | Post IMPL-078 (UI Consolidation: merged Investment Recovery sections) |
| 2026-01-21 | 1,195 | Post IMPL-074-077 (Syndication Year timing logic, ISS-019/020 fixes) |
| 2026-01-20 | 1,182 | Post Phase 14 (Three Sigma Validation: ISS-015/016/017 fixes, 9/15 scenarios validated) |
| 2026-01-19 | 1,175 | Post Phase 13 (Calculation Architecture Audit: 6 IMPLs, single source of truth enforcement) |
| 2026-01-18 | 1,178 | Post IMPL-062 (Tier 2 Validation: 48 checks, 8 categories) |
| 2026-01-18 | 1,176 | Post IMPL-056/061 (Live Excel Model, Tax Benefit Fix) |
| 2026-01-14 | 1,167 | Post IMPL-055 (OZ step-up, state data fixes) |
| 2026-01-07 | 1,167 | Post IMPL-049C (codebase cleanup, 8,700 lines removed) |
| 2026-01-06 | 1,140+ | Post IMPL-047 (toggle fix) |
| 2026-01-05 | 1,140+ | Post IMPL-046 (equity display tests) |
| 2025-12-30 | 1,133+ | Post IMPL-044b (portal tests added) |
| 2025-12-29 | 1,100+ | Post IMPL-041 (conformity tests added) |
| 2025-12-28 | 1,011+ | Post IMPL-031 Atrium baseline |
| 2025-12-27 | 1,006 | Post IMPL-023 |

---

## Codebase Metrics

| Date | Files | Lines | Notes |
|------|-------|-------|-------|
| 2026-01-14 | ~225 | ~64,000 | Post UI cleanup (246 lines removed) |
| 2026-01-07 | 230 | ~64,500 | Post cleanup (39 files, 8,700 lines removed) |
| 2026-01-06 | 248 | ~73,200 | Pre-cleanup baseline |

---

## Validation Protocol Reference

All Claude Code prompts must reference `VALIDATION_PROTOCOL.md` and require:

1. All layers synced
2. 100% test pass rate
3. Grep audit for consistency
4. Independent mathematical verification
5. Complete file inventory

**Before debugging calculation issues:** Check [debugging-patterns.md](./debugging-patterns.md) for known patterns (e.g., Hidden Value Bug).

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [VALIDATION_PROTOCOL.md](./VALIDATION_PROTOCOL.md) | Pre/post implementation validation checklist |
| [VALIDATION_SCENARIOS.md](./VALIDATION_SCENARIOS.md) | Validated scenario tracker (13/15+ complete, Production ✅) |
| [debugging-patterns.md](./debugging-patterns.md) | Known debugging patterns and solutions |
| [constitution/CALCULATION_ARCHITECTURE.md](./constitution/CALCULATION_ARCHITECTURE.md) | Single source of truth principle for calculations |
| [audits/CALCULATION-ARCHITECTURE-AUDIT-2026-01-19.md](./audits/CALCULATION-ARCHITECTURE-AUDIT-2026-01-19.md) | IMPL-065 calculation architecture audit report |
| [audits/IMPL-065-PHASE-3B-ANALYSIS.md](./audits/IMPL-065-PHASE-3B-ANALYSIS.md) | Phase 3B detailed analysis (hook vs engine calculations) |
| [audits/RETURNS-BUILDUP-STRIP-AUDIT-2026-01-19.md](./audits/RETURNS-BUILDUP-STRIP-AUDIT-2026-01-19.md) | Returns Buildup Strip data source audit (IMPL-067 pre-req) |

---

## Document Maintenance

Update this tracker when:
- New IMPL is completed
- Test count changes significantly
- Key architectural decisions are made

**Version Control:** Major changes = full number revision (v7.0), minor updates = decimal (v6.1)

**Location:** This file lives in the repo at `frontend/docs/IMPLEMENTATION_TRACKER.md`
