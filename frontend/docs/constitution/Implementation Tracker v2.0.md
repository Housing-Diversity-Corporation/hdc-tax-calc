# HDC Tax Benefits Calculator — Implementation Tracker

**Document Version:** 5.0
**Last Updated:** 2025-12-30
**Branch:** brad-dev
**Current Test Count:** 1,146 total (1,109 passing, 37 failing)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v5.0 | 2025-12-30 | CC audit reconciliation: Added IMPL-026E, IMPL-036b complete, Phase 9 created, test count updated |
| v3.2 | 2025-12-29 | Added IMPL-040, IMPL-040b, IMPL-041 (State Conformity Integration) |
| v3.1 | 2025-12-28 | Added IMPL-035 (Property/Investor State Field Separation) |
| v3.0 | 2025-12-28 | Complete history through IMPL-031, v7.0 numbering clarified |
| v2.0 | 2025-12-28 | Added IMPL-019 through IMPL-023, validation steps |
| v1.0 | 2025-12-26 | Initial tracker creation |

---

## Implementation History

### Phase 1: v7.0 Core (Dec 14-17, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-7.0-001 | Fee Structure Cleanup (10% tax benefit fee removed) | ✅ Complete | 2025-12-14 |
| IMPL-7.0-002 | State Profile Lookup (56 jurisdictions) | ✅ Complete | 2025-12-14 |
| IMPL-7.0-003 | State LIHTC Calculation (25 programs) | ✅ Complete | 2025-12-15 |
| IMPL-7.0-004 | Warnings & Display | ✅ Complete | 2025-12-15 |
| IMPL-7.0-005 | LIHTC Credit Mechanics (Federal) | ✅ Complete | 2025-12-16 |
| IMPL-7.0-006 | Preferred Equity | ✅ Complete | 2025-12-16 |
| IMPL-7.0-007 | Basis Adjustments (loan fees, legal, org) | ✅ Complete | 2025-12-17 |
| IMPL-7.0-008 | UI Scaffolding (result components) | ✅ Complete | 2025-12-17 |

### Phase 2: Wiring (Dec 18-25, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-009 | Waterfall integration (Phil → Preferred → Sub) | ✅ Complete | 2025-12-18 |
| IMPL-010 | StateLIHTCSection.tsx input UI | ✅ Complete | 2025-12-19 |
| IMPL-011 | LIHTCStructureSection.tsx input UI | ✅ Complete | 2025-12-20 |
| IMPL-012 | Basis Calculations Fix | ✅ Complete | 2025-12-21 |
| IMPL-013 | Connect calculations → results | ✅ Complete | 2025-12-22 |
| IMPL-014b | Property State / Investor State Separation | ✅ Complete | 2025-12-24 |

### Phase 3: Refinement (Dec 25-26, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-015 | Input Panel Restructuring (9→7 panels) | ✅ Complete | 2025-12-25 |
| IMPL-016 | Codebase Consolidation (taxbenefits namespace) | ✅ Complete | 2025-12-25 |
| IMPL-017 | OZ Version Toggle (1.0/2.0 step-ups) | ✅ Complete | 2025-12-25 |
| IMPL-018 | State LIHTC Capital Stack Integration | ✅ Complete | 2025-12-26 |

### Phase 4: Output Validation (Dec 26-27, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-019 | Calculation Engine Audit (50+ functions mapped) | ✅ Complete | 2025-12-26 |
| IMPL-020 | Waterfall Validation (found 9 violations) | ✅ Complete | 2025-12-26 |
| IMPL-020a | Violation Remediation (calculations back to engine) | ✅ Complete | 2025-12-26 |
| IMPL-021 | IRR & Returns Validation | ✅ Complete | 2025-12-27 |
| IMPL-021b | Federal LIHTC Cash Flow Fix (+3% IRR) | ✅ Complete | 2025-12-27 |
| IMPL-023 | Audit Export Package - Formula Map v1.1 | ✅ Complete | 2025-12-27 |

### Phase 5: Conductor's Dashboard (Dec 27, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-024 | Engine Output Audit | ✅ Complete | 2025-12-27 |
| IMPL-025 | Deal Validation Strip (sticky KPI dashboard) | ✅ Complete | 2025-12-27 |
| IMPL-026 | Output Section Reorganization | ✅ Complete | 2025-12-27 |
| IMPL-026D | Syndicated Equity Offset Fix | ✅ Complete | 2025-12-27 |
| IMPL-026E | Direct Use vs Syndicated State LIHTC Diagnostic | ✅ Complete | 2025-12-27 |
| IMPL-026F | Returns Component Audit | ✅ Complete | 2025-12-27 |

### Phase 6: Returns Debugging (Dec 27-28, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-028 | Returns Buildup Strip | ✅ Complete | 2025-12-27 |
| IMPL-029 | Investor Returns Calculation Fixes (comprehensive) | ✅ Complete | 2025-12-28 |
| IMPL-030 | Atrium Operating Cash Audit (AUM fee correction) | ✅ Complete | 2025-12-28 |
| IMPL-031 | Atrium Baseline Validation Test (13 tests) | ✅ Complete | 2025-12-28 |

### Phase 7: UI/UX Cleanup (Dec 28, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-035 | Property/Investor State Field Separation (014b Remediation) | ✅ Complete | 2025-12-28 |
| IMPL-036 | Config Load/Save Auto-Balance Suppression | ✅ Complete | 2025-12-28 |
| IMPL-036b | Sticky Strip Styling (solid background, unified design) | ✅ Complete | 2025-12-28 |
| IMPL-032 | State Bonus Depreciation Conformity Tables | ⏭️ Superseded by IMPL-041 | — |

**IMPL-035 Details:** Fixed confusion between Property State and Investor State fields. Property State now uses simple dropdown (no investor info). StrategicOzSelector moved to Investor Profile section. Both default to WA. No coupling between fields.

**IMPL-036 Details:** Suppresses auto-balance during configuration loading to preserve loaded values. Added `isLoadingConfig` flag and helper functions `startConfigLoading()`, `finishConfigLoading()`.

**IMPL-036b Details:** Unified styling for Deal Validation Strip and Returns Buildup Strip: aqua-haze background, gulf-stream border, solid backgrounds during scroll. Sticky behavior moved to parent container.

### Phase 8: Export & Conformity (Dec 29, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-037 | Audit Export Package - Formula Map v2.1 | ✅ Complete | 2025-12-29 |
| IMPL-038 | Complete Audit Export (12 sheets) | ✅ Complete | 2025-12-29 |
| IMPL-039b | HDC Returns Sheet Integration | ✅ Complete | 2025-12-29 |
| IMPL-040 | Tax Benefit Data Flow Trace | ✅ Complete | 2025-12-29 |
| IMPL-040b | Formula Map Update Protocol | ✅ Complete | 2025-12-29 |
| IMPL-041 | State Conformity Integration & Export Alignment | ✅ Complete | 2025-12-29 |

**IMPL-040 Details:** Traced discrepancy between Tax Benefits sheet ($10.03M) and Waterfall ($7.77M). Found state conformity data existed in `depreciationSchedule.ts` but wasn't wired into main calculations.

**IMPL-040b Details:** Added `FORMULA_MAP_UPDATE_PROTOCOL.md` to Constitution. Requires Formula Map updates for any IMPL touching calculation logic.

**IMPL-041 Details:** Wired state bonus depreciation conformity into tax benefit calculations. Split effective tax rates: bonus depreciation uses conformity-adjusted rate, MACRS uses full state rate. Fixed audit export to use engine values. Fixed Investment Summary zeros. Added 13 new conformity tests. Formula Map updated to v2.1.0. State conformity rates: CA=0%, NY=50%, NJ=30%, PA=0%, IL=0%, default=100%.

### Phase 9: Finalization (Dec 30+, 2025)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-033 | Professional PDF Export (engine data source + formatting) | 🔄 In Progress | — |
| IMPL-034 | Test Quarantine Resolution (DealValidationStrip.test.tsx) | 🔲 Pending | — |

**IMPL-033 Details:** Steps 1-4b complete. HDCComprehensiveReport.tsx and HDCTaxReportJsPDF.tsx refactored to use engine results pattern (params + investorResults + hdcResults). Added `formatRate()` helper for IRR/rate formatting.

**IMPL-034 Scope:** Update 37 failing tests in DealValidationStrip.test.tsx to match IMPL-036b component changes.

---

## Skipped IMPL Numbers

The following IMPL numbers were skipped during development (scope consolidation):

| Skipped | Reason |
|---------|--------|
| IMPL-014 | Consolidated into IMPL-014b (Property/Investor State Separation) |
| IMPL-022 | Gap in numbering — scope merged into other IMPLs |
| IMPL-026A | Consolidated into IMPL-026 series (only D, E, F implemented) |
| IMPL-026B | Consolidated into IMPL-026 series |
| IMPL-026C | Consolidated into IMPL-026 series |
| IMPL-027 | Gap in numbering — scope merged into IMPL-028+ |
| IMPL-039 | Only IMPL-039b implemented (HDC Returns Sheet) |

---

## Implementation Summary

| Phase | IMPLs | Complete | Status |
|-------|-------|----------|--------|
| Phase 1: v7.0 Core | 7.0-001 to 7.0-008 | 8/8 | ✅ 100% |
| Phase 2: Wiring | 009 to 014b | 6/6 | ✅ 100% |
| Phase 3: Refinement | 015 to 018 | 4/4 | ✅ 100% |
| Phase 4: Output Validation | 019 to 023 | 6/6 | ✅ 100% |
| Phase 5: Conductor's Dashboard | 024 to 026F | 6/6 | ✅ 100% |
| Phase 6: Returns Debugging | 028 to 031 | 4/4 | ✅ 100% |
| Phase 7: UI/UX Cleanup | 032 to 036b | 3/4 | ✅ 75% |
| Phase 8: Export & Conformity | 037 to 041 | 6/6 | ✅ 100% |
| Phase 9: Finalization | 033 to 034 | 0/2 | 🔲 0% |
| **Total** | **46 IMPLs** | **44/46** | **96%** |

---

## Key Validation Milestones

### Atrium Baseline Test (IMPL-031)

| Metric | Expected | Actual | Tolerance | Status |
|--------|----------|--------|-----------|--------|
| Tax Benefits | $64.10M | $63.92M | ±2.0% | ✅ PASS |
| Operating Cash Flow | $2.54M | $2.54M | ±2.0% | ✅ PASS |
| Exit Proceeds | $50.10M | $50.14M | ±2.0% | ✅ PASS |
| Total Returns | $116.70M | $116.61M | ±2.0% | ✅ PASS |
| Multiple | 3.33x | 3.33x | ±2.0% | ✅ PASS |

### Critical Bugs Fixed

| IMPL | Bug | Impact |
|------|-----|--------|
| IMPL-020 | 9 calculations in UI components | Violated single source of truth |
| IMPL-021b | Federal LIHTC missing from IRR | +3% IRR improvement |
| IMPL-026D | Syndicated equity offset not applied | Multiple jumped 2x → 6.5x |
| IMPL-029 | Multiple calculation errors | Comprehensive debugging |
| IMPL-030 | AUM fee compounding missing | Multiple 3.77x → 3.33x (corrected) |
| IMPL-035 | Property/Investor State coupling | Fields now independent, defaults WA |
| IMPL-040 | Tax Benefits/Waterfall discrepancy | $10.03M vs $7.77M traced to conformity |
| IMPL-041 | State bonus conformity not wired | Split rates for bonus vs MACRS |

---

## Test Status

### Current Test Counts (2025-12-30)

| Category | Count | Status |
|----------|-------|--------|
| Total Tests | 1,146 | — |
| Passing | 1,109 | ✅ |
| Failing | 37 | ⚠️ DealValidationStrip.test.tsx |

### Failing Tests Detail

All 37 failures are in `DealValidationStrip.test.tsx` due to IMPL-036b component changes:
- DSCR display format assertions
- Aria-label toggle (Collapse/Expand) assertions
- Sticky positioning class assertions

**Resolution:** IMPL-034 will update test assertions to match current component implementation.

### Test History

| Date | Test Count | Notes |
|------|------------|-------|
| 2025-12-30 | 1,146 (1,109 passing) | Post CC audit, 37 failing |
| 2025-12-29 | 1,133+ | Post IMPL-041 conformity tests (+13 new) |
| 2025-12-28 | 1,011+ | Post IMPL-031 Atrium baseline tests |
| 2025-12-27 | 1,006 | Post IMPL-023 |
| 2025-12-26 | 1,006 | Post IMPL-018 |
| 2025-12-25 | ~1,000 | Post IMPL-015/016/017 |

---

## Codebase Structure

```
src/
├── components/taxbenefits/    # React UI components
├── hooks/taxbenefits/         # Custom React hooks
├── types/taxbenefits/         # TypeScript interfaces
├── utils/taxbenefits/         # Calculation utilities
├── services/taxbenefits/      # Business logic services
└── styles/taxbenefits/        # Component styling
```

**Consolidation Note (IMPL-016):** 275 duplicate files deleted. All code now operates under single `taxbenefits` namespace.

---

## Key Files Reference

### Calculation Engine

- `utils/taxbenefits/calculations.ts` — Core financial calculations
- `utils/taxbenefits/irr/` — Newton-Raphson IRR implementation
- `utils/taxbenefits/depreciationSchedule.ts` — MACRS & cost segregation
- `utils/taxbenefits/hdcOzStrategy.ts` — OZ step-up/exclusion logic

### Formula Documentation (IMPL-037)

- `utils/taxbenefits/auditExport/formulaMap.ts` — Formula Map v2.1.0
  - 6 modules documented (calculations, LIHTC, state LIHTC, depreciation, preferred equity, territorial tax)
  - Cross-reference system (calc-*, lihtc-*, state-*, depr-*, pref-*, terr-*, util-*)
  - TypeScript → Excel formula mappings
  - IMPL-041: State conformity logic documented

### Audit Export (IMPL-038)

- `utils/taxbenefits/auditExport/auditExport.ts` — Excel workbook generator (12 sheets)
- `components/taxbenefits/results/ExportAuditButton.tsx` — Export button component

### PDF Reports (IMPL-033)

- `components/taxbenefits/reports/HDCComprehensiveReport.tsx` — Full investor report
- `components/taxbenefits/reports/HDCTaxReportJsPDF.tsx` — Tax-focused report
- `components/taxbenefits/reports/HDCProfessionalReport.tsx` — Executive summary

### State Tax System

- `utils/taxbenefits/stateProfiles.ts` — 56-jurisdiction profiles + conformity
- `utils/taxbenefits/stateProfiles.types.ts` — State tax interfaces
- `utils/taxbenefits/stateProfiles.data.json` — State profile data

### Capital Structure

- `hooks/taxbenefits/useHDCState.ts` — Auto-balance logic
- `hooks/taxbenefits/useHDCCalculations.ts` — Calculation orchestration

### UI Components

- `components/taxbenefits/results/DealValidationStrip.tsx` — Conductor's Dashboard
- `components/taxbenefits/results/ReturnsBuiltupStrip.tsx` — Returns breakdown

---

## Critical Design Decisions

### IMPL-041: State Bonus Depreciation Conformity

**Problem**: Tax Benefits sheet showed $10.03M while Waterfall showed $7.77M for same calculation.

**Root Cause**: State conformity data existed in `depreciationSchedule.ts` but wasn't wired into `calculations.ts`.

**Solution**:
- Added `getStateBonusConformityRate()` to `stateProfiles.ts`
- Split effective tax rates: `effectiveTaxRateForBonus` vs `effectiveTaxRateForStraightLine`
- Year 1 bonus depreciation uses conformity-adjusted rate
- Years 2+ MACRS uses full state rate (all states accept straight-line)
- Audit export now uses engine values instead of recalculating

**State Conformity Rates:**
| State | Conformity |
|-------|------------|
| CA | 0% |
| PA | 0% |
| IL | 0% |
| NJ | 30% |
| NY | 50% |
| All others | 100% |

### IMPL-035: Property/Investor State Field Separation

**Problem**: Property State field in Project Definition was using StrategicOzSelector which showed investor-related info (OZ conformity, tax rates). This was confusing because:
- Property State = where project is physically located (determines State LIHTC eligibility)
- Investor State = where investor files taxes (determines OZ conformity, tax rates)

**Solution**:
- Created `PropertyStateDropdown.tsx` - simple dropdown with no OZ/investor info
- Moved `StrategicOzSelector` to Investor Profile section (where it belongs)
- Removed all fallback patterns coupling the two states (`investorState || selectedState`)
- Both states now default to 'WA' (HDC home state, Atrium location)

### IMPL-030: Atrium Model Correction

**Finding**: AUM fees (1.5% annually starting Year 2) consume most operating cash during Years 2-8 due to catch-up logic for deferred fees compounding at 8%.

| Metric | Original Claim | Corrected Value |
|--------|----------------|-----------------|
| Operating Cash Flow | $16M | $2.54M |
| Total Returns | $130M | $116.7M |
| Multiple | 3.77x | 3.33x |

**Impact**: Established Atrium baseline as regression test (IMPL-031)

### IMPL-025: Deal Validation Strip (Conductor's Dashboard)

**Purpose**: Sticky, collapsible KPI dashboard showing deal validation metrics for all stakeholders

**Sections**:
- SENIOR: Min DSCR, Covenant status
- INVESTOR: Multiple, IRR, Break-even year
- HDC: Total Returns, Promote, Deferred AUM
- SUB DEBT: Status, Balance at exit (conditional)
- PREF EQUITY: Achieved MOIC, Target status (conditional)

### IMPL-018: State LIHTC Treatment

| Path | Condition | Value | Treatment |
|------|-----------|-------|-----------|
| Syndication | Out-of-state OR transferable | 75% | Reduces investor equity via offset |
| Direct Use | In-state + liability | 100% | Added to tax benefits, impacts IRR numerator |

### IMPL-017: OZ Version Toggle

| Version | 5-Year Step-Up | 7-Year Step-Up |
|---------|----------------|----------------|
| OZ 1.0 | 0% | 0% |
| OZ 2.0 (OBBBA) | 10% | 30% |

### IMPL-015: Input Panel Organization

| Panel | Contents |
|-------|----------|
| 1 | Property Details (including Property State) |
| 2 | Capital Structure |
| 3 | Debt Terms |
| 4 | Tax Parameters |
| 5 | Investor Profile (including Investor State) |
| 6 | Gap Funding (LIHTC/Philanthropic) |
| 7 | Analysis Options |

---

## Open TODOs in Codebase

| File | Line | Item |
|------|------|------|
| useHDCCalculations.ts | 389 | Add lease-up reserve when available |
| useHDCCalculations.ts | 390 | Add syndication costs when available |
| useHDCCalculations.ts | 391 | Add marketing costs when available |
| useHDCCalculations.ts | 392 | Add commercial space costs when available |
| useHDCCalculations.ts | 711 | Make discountRate user-configurable |
| calculations.ts | 333 | Construction period support |
| calculations.ts | 522 | Financing cost calculation for delay period |

**Assessment:** All TODOs are future feature placeholders, not blocking items.

---

## Validation Protocol Reference

All Claude Code prompts must reference `VALIDATION_PROTOCOL.md` and require:

1. All layers synced
2. Test pass rate documented
3. Grep audit for consistency
4. Independent mathematical verification
5. Complete file inventory

---

## Next Priorities

### IMPL-033: Professional PDF Export (In Progress)

**Scope**: Steps 1-4b complete. Verify PDF exports render correctly.

### IMPL-034: Test Quarantine Resolution

**Scope**: Update 37 failing tests in DealValidationStrip.test.tsx to match IMPL-036b component changes.

---

## Document Maintenance

Update this tracker when:

- New IMPL is completed
- Test count changes significantly
- Key architectural decisions are made
- Codebase structure changes
- Validation steps complete

**Version Control:** Major changes = full number revision (v5.0), minor updates = decimal (v5.1)
