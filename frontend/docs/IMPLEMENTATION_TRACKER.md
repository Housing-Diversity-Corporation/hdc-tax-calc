# TaxBenefits Calculator — Implementation Tracker

**Document Version:** 10.8
**Last Updated:** 2026-03-15
**Branch:** main
**Current Test Count:** 1,844 passing (94 suites, 0 failures)
**Canonical Test Runner:** Jest (`npx jest --config jest.config.ts --watchAll=false`)
**Validation Status:** 13/15 Three Sigma scenarios complete (Production Certification ✅)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v10.8 | 2026-03-15 | IMPL-127: Fix recaptureExposure misuse as exit proceeds in Tax Efficiency Map MOIC — recaptureExposure is a tax liability, not a return. MOIC now correctly shows tax-benefit-only multiple: (investment + taxSavings) / investment. Dead extractExitValues() helper removed. 1 file modified. Test count unchanged at 1,844. |
| v10.7 | 2026-03-15 | IMPL-126: Rebuild Tax_Utilization sheet with live Excel formulas — zero hardcoded calculation results. Input cells link to Inputs/Capital_Stack named ranges; derived calculations, year-by-year table, summary, and cross-check rows all use FormulaCell pattern. §38(c) ceiling approximation with note. §461(l) filing-status-aware cap (MFJ key fix). Cross-checks use upper-bound comparison with validity row. Accurate fallback values for pre-recalculation display. 2 files modified. Test count unchanged at 1,844. |
| v10.6 | 2026-03-14 | IMPL-125: Move Tax Efficiency Map to deal view — renders from individual deal BenefitStream instead of pool aggregation. 4 files modified. Test count unchanged at 1,844. |
| v10.5 | 2026-03-13 | IMPL-124: Wire pool navigation — fund-detail view reachable via AvailableInvestments onViewPool. 2 files modified. Test count unchanged at 1,844. |
| v10.4 | 2026-03-13 | IMPL-123: Tax Efficiency Map platform integration — real engine replaces artifact simplified calculation layer. 3 new files, 1 modified. Test count 1,838→1,844. |
| v10.3 | 2026-03-12 | IMPL-122: Fix §38(c) unit mismatch in calculateTaxUtilization() — REP+grouped LIHTC ceiling and dep savings cap now use consistent units. Batch runner workaround removed. Test count 1,834→1,838. |
| v10.2 | 2026-03-12 | IMPL-121: NIIT-aware depreciation rate in calculateTaxUtilization() — passive investors now use 40.8% (37% + 3.8% NIIT). Territory exemption respected. Test count 1,830→1,834. |
| v10.1 | 2026-03-11 | IMPL-120: Tax Efficiency Mapping engine bug fixes — sizing optimizer objective (effectiveMultiple), Roth conversion duration (Years 1-10 only), passive $4M validation. Test count 1,824→1,830. |
| v10.0 | 2026-03-06 | Major update: 35 IMPLs added (084-118). B2 save-flow wiring, pool aggregation, computed hold period, fed/state depreciation breakout, exit tax engine, B3 fit/archetype/sizing, timing architecture rewire (computeTimeline, XIRR, §42(f)(1) election), LIHTC applicable fraction. Test count 1,237→1,817. |
| v9.0 | 2026-02-01 | Jan 23-31 sessions: IMPL-079-083 (Capital Stack Enhancement), ISS-024-068c (~45 bug fixes), test count 1,195→1,237, ISS-014 fixed |
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

### Phase 16: Capital Stack Enhancement (Jan 24-25, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-079 | Variable State LIHTC credit duration (6, 10 years) | ✅ Complete | 2026-01-24 |
| IMPL-080 | PAB Integration (Private Activity Bonds in capital stack) | ✅ Complete | 2026-01-24 |
| IMPL-081 | DSCR Breakdown (Must-Pay vs Phil DSCR separation) | ✅ Complete | 2026-01-24 |
| IMPL-082 | HDC Debt Fund Separation from Outside Investor Sub-Debt | ✅ Complete | 2026-01-24 |
| IMPL-083 | Eligible Basis Exclusions (8 categories) | ✅ Complete | 2026-01-24 |

### Bug Fixes: Capital Stack (Jan 24-25, 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-024 | creditDurationYears not passed to export | Object not drilled through props | HDCResultsComponent.tsx | 2026-01-24 |
| ISS-025 | Outside Sub-Debt label bug | Truthy check instead of === 'leverage' | CapitalStructureSection.tsx | 2026-01-24 |
| ISS-027 | Unit consistency (exclusions / 1M bug) | Incorrect division in UI | TaxCreditsSection.tsx | 2026-01-24 |
| ISS-028 | Eligible Basis = $0 | Same root cause as ISS-027 | TaxCreditsSection.tsx | 2026-01-24 |
| ISS-029 | PAB not in Capital Stack | Missing state and calculation | useHDCState.ts | 2026-01-24 |
| ISS-030 | PAB enabled not reaching export | Props not drilled | HDCResultsComponent.tsx | 2026-01-24 |
| ISS-031 | Capital Stack total missing PAB | pabPctOfProject not in total | capitalStackSheet.ts | 2026-01-24 |
| ISS-032 | PAB should reduce Senior Debt | No coordination logic | useHDCState.ts (mustPayDebtTarget) | 2026-01-24 |
| ISS-034 | HDC Debt Fund not reaching export | Same prop drilling issue | HDCResultsComponent.tsx | 2026-01-24 |
| ISS-035 | Exclusions not exported | 8 exclusion props missing | inputsSheet.ts | 2026-01-24 |
| ISS-036 | Capital Stack tolerance too tight | Floating point (0.001→0.01) | capitalStackSheet.ts | 2026-01-24 |
| ISS-037 | DSCR breakdown columns missing | Must-Pay DS/DSCR, Phil DSCR not exported | operatingCFSheet.ts | 2026-01-24 |
| ISS-038b | DSCR breakdown in Summary sheet | Conditional rows missing | summarySheet.ts | 2026-01-24 |
| ISS-039 | Interest Reserve circular dependency | Reserve depends on debt depends on reserve | Iterative convergence algorithm | 2026-01-25 |
| ISS-041 | PABs missing from Interest Reserve | Only Senior Debt in DS calculation | interestReserveCalculation.ts | 2026-01-25 |

### Bug Fixes: Waterfall (Jan 25-26, 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-050 | Exit waterfall double-counted ROC | Capital already recovered during hold not tracked | calculations.ts, exitSheet.ts | 2026-01-26 |
| ISS-051 | Operating promote catch-up violated conservation | Catch-up on "deferred" promote that shouldn't exist | hdcAnalysis.ts | 2026-01-26 |

### Bug Fixes: S-Curve (Jan 27, 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-052a | Excel waterfall used PIK accrued vs cash paid | Wrong field in formula | waterfallSheet.ts | 2026-01-27 |
| ISS-052b | Operating Cash included Excess Reserve | Should be separate components | ReturnsBuiltupStrip.tsx | 2026-01-27 |
| ISS-053 | S-curve forced 100% occupancy in Year 1 | Logic didn't apply in placedInServiceYear block | calculations.ts | 2026-01-27 |

### Bug Fixes: Parameter Cleanup (Jan 30-31, 2026)

| ISS | Description | Root Cause | Fix | Date |
|-----|-------------|------------|-----|------|
| ISS-060 | Senior Debt IO toggle not affecting returns | seniorDebtIOYears not passed to calculation functions | useHDCCalculations.ts | 2026-01-30 |
| ISS-061 | seniorDebtIOYears not exported | Prop not passed to HDCResultsComponent | Multiple files | 2026-01-30 |
| ISS-061d | Parameter naming inconsistency (18 files) | Mixed naming conventions | 18 files consolidated | 2026-01-30 |
| ISS-061e | investorPromoteShare inverted in export | Data inversion bug | Export files | 2026-01-30 |
| ISS-062 | Missing params in all 3 export types | Various params not passed | All export sheets | 2026-01-30 |
| ISS-063 | 3 pre-existing test failures (including ISS-014) | Test expectations outdated | Test files | 2026-01-30 |
| ISS-064 | Construction delay causes DSCR = 0 | currentNOI not reset at PIS year | calculations.ts | 2026-01-31 |
| ISS-065 | Excess Capacity section values misleading | Formula used depreciation-only | Removed section | 2026-01-31 |
| ISS-066 | Floating-point display (29.099999...) | JS precision | roundForDisplay() utility | 2026-01-31 |
| ISS-067 | Currency display inconsistency | Local formatters, varying decimals | Standardized formatters | 2026-01-31 |
| ISS-068c | Three redundant inputs (Rev/Exp/OpEx) | Model complexity without value | Single noiGrowthRate | 2026-01-31 |

### Phase 17: B2 Save-Flow Wiring (Feb 14, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-084 | Phase B2 save-flow wiring — DBP extraction on save, service endpoints matched to backend | ✅ Complete | 2026-02-14 |

**IMPL-084 Details:** Wired `extractDealBenefitProfile` into save flow in HDCInputsComponent. Created dbpService and poolService with backend-matching endpoints. 9 files changed, 512 insertions, 115 deletions. Key files: `dbpService.ts`, `poolService.ts`, `dealBenefitProfile.ts`, `HDCInputsComponent.tsx`.

### Phase 18: Pool Aggregation & Fund Sizing (Feb 14, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-085 | Pool aggregation engine + fund sizing optimizer — 63 tests, runtime-verified | ✅ Complete | 2026-02-14 |

**IMPL-085 Details:** Created `poolAggregation.ts` (aggregatePoolToBenefitStream, scaleBenefitStreamToMillions) and `fundSizingOptimizer.ts` (iterates across commitment levels with calculateTaxUtilization). Built FundDetail page with FundDealList, FundDetailHeader, EfficiencyCurveChart, OptimalCommitmentCard, CapacityWarning. 15 files changed, 2,588 insertions. 63 new tests across poolAggregation.test.ts, fundSizingOptimizer.test.ts, impl085-runtime-verification.test.ts.

### Phase 19: Construction Timing & Exit-Month Precision (Feb 17, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-086 | Computed hold period engine | ✅ Complete | 2026-02-17 |
| IMPL-087 | Exit-month precision — 1,583 tests green | ✅ Complete | 2026-02-17 |
| IMPL-088 | *Reserved buffer — not used* | — | — |
| IMPL-089 | *Reserved buffer — not used* | — | — |

**IMPL-086+087 Details:** Introduced computed hold period engine and exit-month precision logic in hdcAnalysis.ts. 44 files changed, 2,280 insertions, 460 deletions. Test count at 1,583 after this commit.

### Phase 20: Federal/State Depreciation Breakout (Feb 18, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-090 | Federal depreciation benefit calculation (Year 1 + Hold Period) | ✅ Complete | 2026-02-18 |
| IMPL-091 | State depreciation benefit calculation (Year 1 + Hold Period) | ✅ Complete | 2026-02-18 |
| IMPL-092 | Breakout fields added to engine output | ✅ Complete | 2026-02-18 |
| IMPL-093 | Temporal sub-row restoration in returns display | ✅ Complete | 2026-02-18 |

**IMPL-090-093 Details:** Added 6 breakout fields to calculations.ts: `federalDepreciationBenefitYear1`, `stateDepreciationBenefitYear1`, `federalDepreciationBenefitHoldPeriod`, `stateDepreciationBenefitHoldPeriod`, `federalDepreciationBenefitTotal`, `stateDepreciationBenefitTotal`. Created depreciationBreakout.test.ts (465 lines). 4 files changed, 561 insertions.

### Phase 21: Stage 5.5 — Exit Tax Engine (Feb 18, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-094 | ExitTaxParams and ExitTaxResult interfaces | ✅ Complete | 2026-02-18 |
| IMPL-095 | Character-split fields in investorTaxUtilization | ✅ Complete | 2026-02-18 |
| IMPL-096 | depreciationRecaptureRate removal — rates derived inside calculateExitTax() | ✅ Complete | 2026-02-18 |
| IMPL-097 | §1245 ordinary income recapture (cost seg / bonus) | ✅ Complete | 2026-02-18 |
| IMPL-098 | §1250 unrecaptured gain capped at 25% | ✅ Complete | 2026-02-18 |
| IMPL-099 | NIIT calculation with territory-aware doesNIITApply() | ✅ Complete | 2026-02-18 |
| IMPL-100 | State exit tax with conformity-aware rate lookup | ✅ Complete | 2026-02-18 |
| IMPL-101 | OZ 10-year hold exit tax exclusion | ✅ Complete | 2026-02-18 |

**IMPL-094-101 Details:** Built IRC-compliant exit tax engine with character-split recapture: sec1245Recapture (ordinary rate), sec1250Recapture (25% cap), remainingGainTax, niitTax, totalFederalExitTax, state exit tax. Removed single depreciationRecaptureRate in favor of derived rates. Added doesNIITApply() for territories. 28 files changed, 937 insertions. exit-tax-engine.test.ts (471 lines) with E-1 through E-10 unit tests + Scenario 10A/10B integration.

### Phase 22: B3 — Investor Fit & Archetype Classification (Feb 17, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-102 | Investor archetype classification engine (A-F grades) | ✅ Complete | 2026-02-17 |
| IMPL-103 | Fit scoring with passive income, REP track, benefit timing | ✅ Complete | 2026-02-17 |
| IMPL-104 | Investor sizing — commitment-level tax utilization | ✅ Complete | 2026-02-17 |
| IMPL-105 | FitSummaryPanel UI component | ✅ Complete | 2026-02-17 |
| IMPL-106 | SizingOptimizerPanel UI component | ✅ Complete | 2026-02-17 |
| IMPL-107 | useInvestorFit and useInvestorSizing hooks | ✅ Complete | 2026-02-17 |

**IMPL-102-107 Details:** Built investorFit.ts (364 lines, A-F archetype grading with passive income thresholds, REP track detection, benefit timing profiles) and investorSizing.ts (224 lines, commitment-level utilization via calculateTaxUtilization). UI: FitSummaryPanel.tsx, SizingOptimizerPanel.tsx wired into FundDetail. Hooks: useInvestorFit.ts, useInvestorSizing.ts. 11 files changed, 2,588 insertions. 76 tests across investorFit.test.ts, investorSizing.test.ts, investorB3Integration.test.ts.

### Phase 23: Timing Architecture Rewire (Mar 3-4, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-108 | Timing rewire types — investmentDate, ComputedTimeline, XirrCashFlow, §42(f)(1) election | ✅ Complete | 2026-03-03 |
| IMPL-109 | computeTimeline.ts — date-driven timing engine with K-1 realization dates, January guard | ✅ Complete | 2026-03-03 |
| IMPL-110 | calculateXIRR — Newton-Raphson with ACT/365.25 day-count, 10 validation scenarios | ✅ Complete | 2026-03-03 |
| IMPL-111 | Wire computeTimeline + calculateXIRR into calculations.ts | ✅ Complete | 2026-03-03 |
| IMPL-112 | useHDCState adds investmentDate, pisDateOverride, exitExtensionMonths, electDeferCreditPeriod | ✅ Complete | 2026-03-03 |
| IMPL-113 | computeTimeline useMemo in useHDCCalculations, election auto-reset guard for Jan PIS | ✅ Complete | 2026-03-03 |
| IMPL-114 | UI — Investment Date picker, Exit Extension slider, PIS override toggle, §42(f)(1) election toggle | ✅ Complete | 2026-03-03 |
| IMPL-115 | Timing exports — ComputedTimeline in audit export, timingGanttSheet with calendar dates | ✅ Complete | 2026-03-04 |
| IMPL-116 | Bulk test migration — remove taxBenefitDelayMonths, add investmentDate to defaults | ✅ Complete | 2026-03-04 |
| IMPL-117 | Production cleanup — remove deprecated timing fields, delete computeHoldPeriod.ts | ✅ Complete | 2026-03-04 |

**IMPL-108 Details:** Added investmentDate (Date), ComputedTimeline interface, XirrCashFlow type, §42(f)(1) election boolean, @deprecated tags on taxBenefitDelayMonths/placedInServiceMonth/exitMonth. 1 file changed (types/index.ts), 113 insertions.

**IMPL-109 Details:** Created computeTimeline.ts (157 lines) — pure function producing ComputedTimeline from investmentDate + pisDate + election. K-1 realization dates, January guard (auto-disables election for Jan PIS). Math.floor placedInServiceYear preserves existing gate convention. computeTimeline.test.ts (10 scenarios). 3 files changed, 556 insertions.

**IMPL-110 Details:** Created xirrCalculation.ts (88 lines) — day-precise Newton-Raphson with ACT/365.25 day-count, daysBetween UTC utility. xirrCalculation.test.ts (271 lines, 10 scenarios including HDC K-1 timing and Jan/Dec PIS comparison). 2 files changed, 359 insertions.

**IMPL-111 Details:** Wired computeTimeline and calculateXIRR into calculations.ts. Added timeline-aware code paths alongside legacy paths. 10 files changed, 469 insertions.

**IMPL-112+113 Details:** Added investmentDate, pisDateOverride, exitExtensionMonths, electDeferCreditPeriod state to useHDCState. computeTimeline useMemo in useHDCCalculations. Election auto-reset guard for Jan PIS. All 1,841 existing tests unchanged. 3 files changed, 186 insertions.

**IMPL-114 Details:** Investment Date picker, Exit Extension slider (months), PIS override toggle with OVERRIDDEN badge, §42(f)(1) election toggle (disabled for Jan PIS). Deprecated controls hidden behind computedTimeline gate. 4 files changed, 324 insertions.

**IMPL-115 Details:** ComputedTimeline wired to audit export. timingGanttSheet updated with calendar dates. Calendar year labels on investor returns sheet. 6 new tests in timingGanttSheet.test.ts. 9 files changed, 380 insertions.

**IMPL-116 Details:** Bulk test migration removing taxBenefitDelayMonths references, adding investmentDate to test defaults, migrating exit-month tests to computeTimeline path. 35 files changed, 44 insertions, 1,319 deletions.

**IMPL-117 Details:** Production cleanup — removed deprecated timing fields from types and calculations, deleted computeHoldPeriod.ts (65 lines). Migrated computed-hold-period.test.ts to computeTimeline path. 29 files changed (across 2 commits), 205 insertions, 709 deletions.

### Phase 24: First-Year LIHTC Applicable Fraction (Mar 5, 2026)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-118 | First-Year LIHTC Applicable Fraction — deal type + occupancy ramp + Documented Assumptions Gate | ✅ Complete | 2026-03-05 |
| IMPL-119 | NIIT-Aware Depreciation Benefit Calculation | ✅ Complete | 2026-03-06 |
| IMPL-120 | Tax Efficiency Mapping Engine Bug Fixes | ✅ Complete | 2026-03-11 |
| IMPL-121 | NIIT-Aware Rate in calculateTaxUtilization() | ✅ Complete | 2026-03-12 |
| IMPL-122 | Fix §38(c) Unit Mismatch in calculateTaxUtilization() | ✅ Complete | 2026-03-12 |
| IMPL-123 | Tax Efficiency Map Platform Integration | ✅ Complete | 2026-03-13 |
| IMPL-124 | Wire Pool Navigation to Fund Detail View | ✅ Complete | 2026-03-13 |
| IMPL-125 | Move Tax Efficiency Map to Deal View | ✅ Complete | 2026-03-14 |

**IMPL-125 Details:** Moved TaxEfficiencyMapPanel from FundDetail (pool view) to InvestorAnalysisCalculator (deal view). Surfaced BenefitStream from the calculation engine by adding it to `InvestorAnalysisResults` and `calculations.ts` return. The engine BenefitStream (millions) is converted to dollars via useMemo before passing to `useTaxEfficiencyMap`. Panel renders after LocationAnalysisSection using the individual deal's BenefitStream and investorEquity. Guard condition prevents render when benefitStream or investorEquity is absent.
Files changed: `InvestorAnalysisCalculator.tsx` (modified), `FundDetail.tsx` (modified), `calculations.ts` (modified), `types/taxbenefits/index.ts` (modified), `IMPLEMENTATION_TRACKER.md`. 1,844 tests pass, 94 suites, 0 regressions.

**IMPL-124 Details:** Connected the existing `fund-detail` view to the platform UI. Added `onViewPool` prop to `AvailableInvestments`, loads pools via `poolService.getAll()` in parallel with deal loading, renders fund cards with "View Fund Details" button above the deal grid. Wired `onViewPool` in `App.tsx` to set `selectedPoolId` + `currentView('fund-detail')`. No new routes or screens — purely connects existing state that was declared but never triggered.
Files changed: `AvailableInvestments.tsx` (modified), `App.tsx` (modified), `IMPLEMENTATION_TRACKER.md`. 1,844 tests pass, 94 suites, 0 regressions.

**IMPL-123 Details:** Replaced the Tax Efficiency Map artifact's simplified engine with direct calls to `calculateTaxUtilization()`. Two-layer architecture: Layer 1 (`useTaxEfficiencyMap.ts`) computes 360 cells (12 incomes × 10 investments × 3 investor types) using real `BenefitStream` rates from the pool aggregation pipeline. Layer 2 (`TaxEfficiencyMapPanel.tsx`) renders a heatmap with investor type tabs, metric selector (MOIC/Utilization/Savings-per-dollar), fund ceiling slider, OPT markers, and click-to-detail panel. Placed in FundDetail view after the Sizing Optimizer. All 3 reference cells match batch CSV within 0.00% (vs ±1% threshold). W-2 track correctly shows $0 for all cells (§469 blocks all benefits). Fund ceiling slider correctly dims cells above concentration limit.
Files changed: `useTaxEfficiencyMap.ts` (new), `TaxEfficiencyMapPanel.tsx` (new), `FundDetail.tsx` (modified), `useTaxEfficiencyMap.test.ts` (new, 6 tests). 1,844 tests pass, 94 suites, 0 regressions.

**IMPL-122 Details:** Fixed two unit mismatch bugs in `calculateTaxUtilization()` for REP+grouped (nonpassive) investors: (1) `computeLIHTCNonpassive()` compared `federalTaxLiability` in dollars against `depreciationTaxSavings`/`lihtcGenerated` in millions — §38(c) ceiling never bound. Fixed by converting tax liability to millions. (2) `computeDepreciationNonpassive()` counted `depreciationAllowed × marginalRate` as savings even when it exceeded the actual tax owed — overcounted by $22.9K for $750K income. Fixed by capping at `federalTaxLiability / 1e6`. Removed the `computeNetTaxPerYear()` workaround from the batch runner's `extractMetrics()` — engine values now used directly.
Files changed: investorTaxUtilization.ts, taxEfficiencyMapping.ts (batch runner workaround removal), impl-121-niit-utilization.test.ts (updated baseline), IMPLEMENTATION_TRACKER.md. 1 new test suite (impl-122-sec38c-unit-fix.test.ts) with 4 tests. 1,838 tests pass, 93 suites, 0 regressions.

**IMPL-121 Details:** Fixed `calculateTaxUtilization()` to apply 3.8% NIIT surcharge on depreciation tax savings for passive investors (non-rep, rep_ungrouped). Previously used flat 37% marginal rate for all tracks; now uses 40.8% (37% + 3.8%) for passive treatment when `doesNIITApply(state)` is true. Territory residents (PR, GU, VI, AS, MP) remain exempt. Nonpassive path (REP+grouped) unchanged. Also applied NIIT-aware rate to recapture coverage `releasedLossValue` and `benefitGenerated` denominator for consistent utilization ratios.
Files changed: investorTaxUtilization.ts (import + 4 lines), IMPLEMENTATION_TRACKER.md. 1 new test suite (impl-121-niit-utilization.test.ts) with 4 tests. 1,834 tests pass, 92 suites, 0 regressions.

**IMPL-120 Details:** Three bug fixes for the Tax Efficiency Mapping batch runner and supporting production engine:
1. **Sizing optimizer objective** (investorSizing.ts): Changed `computeOptimalSizing` to maximize `effectiveMultiple` (taxSavingsPerDollar) instead of `annualUtilizationPct`. Added `peakType` field to `SizingResult` with `determinePeakType()` function. Plateau/rising curves select highest commitment within 90% of peak efficiency.
2. **Roth conversion duration** (investorTaxUtilization.ts): Added `rothAnnualConversion` field to `InvestorProfile`. Engine now computes per-year tax computation: Years 1-10 include Roth income, Years 11-12 use base income. Previously, Roth income was applied uniformly to all years.
3. **Passive $4M validation** (VALIDATION_SCENARIOS.md): Added Scenario 36 (Non-REP Passive $2M/$4M/WA/MFJ). Actual engine output $8.45M vs estimated $9.28M (−9% due to sub-linear scaling). Documented discrepancy with explanation.
Files changed: investorSizing.ts, investorTaxUtilization.ts, taxEfficiencyMapping.ts (batch runner), VALIDATION_SCENARIOS.md, IMPLEMENTATION_TRACKER.md, types/taxbenefits/index.ts. 6 new tests (3 Roth + 3 sizing). 1,830 tests pass, 91 suites, 0 regressions.

**IMPL-118 Details:** Added deal type (acquisition vs new construction) and occupancy ramp logic to first-year LIHTC applicable fraction in lihtcCreditCalculations.ts (255 lines of changes). Created DOCUMENTED_ASSUMPTIONS.md gate. Added section to CALCULATION_ARCHITECTURE.md. 7 files changed, 807 insertions. lihtcCreditCalculations.test.ts expanded by 453 lines with deal type + ramp scenarios.

**IMPL-119 Details:** Fixed depreciation tax savings to conditionally include NIIT (3.8%) based on investor type. REP + grouped (§469(c)(7) grouping election) = no NIIT (Section 1411(c)(1)(A) active income exception). REP ungrouped / non-REP = NIIT applies (passive income). Territories (PR/GU/VI/AS/MP) = no NIIT regardless. Updated useHDCCalculations.ts hook (unified NIIT logic via `depreciationNiitApplies`), calculations.ts engine (3 default-rate locations gated on `niitApplies`), taxBenefitsSheet.ts Excel formulas (IF(AND(IsREP=1,GroupingElection=1),...)), inputsSheet.ts (added GroupingElection named range), validationSheet.ts. 7 files changed. 6 new feature tests + 5 existing test updates. 1,824 tests pass, 0 regressions.

---

## Open Issues

| ISS | Description | Priority | Notes |
|-----|-------------|----------|-------|
| ISS-018 | Returns Buildup LIHTC catch-up allocation display | Low | Cosmetic - catch-up shows in Federal row instead of split |
| ISS-069 | Excel export: PlacedInServiceMonth named range removed in IMPL-117 but still referenced in LIHTC/Depreciation/Tax Benefits formula strings — causes #NAME? errors on Excel recalculation | Medium | Pre-existing since IMPL-117; pre-calc v: values are correct so cached display is accurate; fix requires either restoring the named range or rewriting affected formula strings |
| ISS-070 | Live Excel export key metrics don't match UI — MOIC (3.794x vs 3.83x), IRR (33.58% vs 31.98%), Investor Equity ($15.782M vs $16.048M). Root cause: HDCResultsComponent.tsx manually constructs export params with different values than useHDCCalculations renders in the UI. Same class of issue as IMPL-128/129 prop wiring gaps. | High | Confirmed on Trace 4001 $65M — exported simultaneously from same deal state |

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
| IMPL-088, 089 | Reserved buffer — not used |

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
| Phase 16: Capital Stack Enhancement | 079-083 | 5/5 | ✅ 100% |
| Phase 17: B2 Save-Flow Wiring | 084 | 1/1 | ✅ 100% |
| Phase 18: Pool Aggregation & Fund Sizing | 085 | 1/1 | ✅ 100% |
| Phase 19: Construction Timing & Exit-Month | 086-087 | 2/2 | ✅ 100% |
| Phase 20: Fed/State Depreciation Breakout | 090-093 | 4/4 | ✅ 100% |
| Phase 21: Stage 5.5 Exit Tax Engine | 094-101 | 8/8 | ✅ 100% |
| Phase 22: B3 Fit & Archetype | 102-107 | 6/6 | ✅ 100% |
| Phase 23: Timing Architecture Rewire | 108-117 | 10/10 | ✅ 100% |
| Phase 24: LIHTC Applicable Fraction + TEM Fixes | 118-122 | 5/5 | ✅ 100% |
| **Total** | **122 IMPLs** | **122/122** | **✅ 100%** |

---

## Test History

| Date | Test Count | Notes |
|------|------------|-------|
| 2026-03-13 | 1,844 | Post IMPL-123 (94 suites, 6 new efficiency map tests, 0 failures) |
| 2026-03-12 | 1,838 | Post IMPL-122 (93 suites, 4 new §38(c) unit tests, 0 failures) |
| 2026-03-12 | 1,834 | Post IMPL-121 (92 suites, 4 new NIIT-utilization tests, 0 failures) |
| 2026-03-11 | 1,830 | Post IMPL-120 (91 suites, 6 new tests: 3 Roth duration + 3 sizing objective, 0 failures) |
| 2026-03-06 | 1,824 | Post IMPL-119 (91 suites, 6 new NIIT tests, 0 failures) |
| 2026-03-06 | 1,817 | Post IMPL-118 (90 suites, 0 failures) |
| 2026-03-05 | ~1,817 | Post IMPL-118 (LIHTC applicable fraction, 453 new test lines) |
| 2026-03-04 | ~1,841 | Post IMPL-115-117 (timing exports, bulk test migration, deprecated field cleanup) |
| 2026-03-03 | ~1,841 | Post IMPL-108-114 (timing architecture rewire, XIRR, UI controls) |
| 2026-02-18 | ~1,583+ | Post IMPL-090-101 (depreciation breakout, exit tax engine) |
| 2026-02-17 | 1,583 | Post IMPL-086-087+102-107 (hold period, B3 fit/sizing, 76 new tests) |
| 2026-02-14 | ~1,300+ | Post IMPL-084-085 (B2 wiring, pool aggregation, 63 new tests) |
| 2026-01-31 | 1,237 | Post ISS-064-068c (Construction delay, NOI Growth Rate simplification) |
| 2026-01-30 | 1,223 | Post ISS-060-063 (Senior Debt IO, export params, test fixes) |
| 2026-01-27 | 1,220 | Post ISS-052-055 (S-curve, DSCR fixes) |
| 2026-01-26 | 1,205 | Post ISS-050/051 (Exit waterfall conservation) |
| 2026-01-25 | 1,200 | Post ISS-039/041 (Interest Reserve convergence, PABs) |
| 2026-01-24 | 1,194 | Post IMPL-079-083 (Capital Stack Enhancement) |
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
| [DOCUMENTED_ASSUMPTIONS.md](./DOCUMENTED_ASSUMPTIONS.md) | Documented assumptions gate (IMPL-118) |

---

## Document Maintenance

Update this tracker when:
- New IMPL is completed
- Test count changes significantly
- Key architectural decisions are made

**Version Control:** Major changes = full number revision (v7.0), minor updates = decimal (v6.1)

**Location:** This file lives in the repo at `frontend/docs/IMPLEMENTATION_TRACKER.md`
