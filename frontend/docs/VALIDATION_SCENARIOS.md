# Validation Scenario Tracker

**Version:** 1.4
**Last Updated:** 2026-01-24
**Status:** 18 of 20+ scenarios validated (90% Institutional Certification)

---

## Overview

This document tracks all validated scenarios for the TaxBenefits Calculator. It serves as the single source of truth to avoid duplicate validation work.

---

## Limited Certification (Scenarios 1-5) ✅ COMPLETE

| # | Scenario | Config | Key Validation | MOIC | Date | Status |
|---|----------|--------|----------------|------|------|--------|
| 1 | Baseline | WA/WA, REP, 4% LIHTC, OZ | Core calculations | 3.19x | 2026-01-19 | ✅ |
| 2A | Passive (Ordinary) | NIIT 40.8% | Ordinary income rates | 3.11x | 2026-01-19 | ✅ |
| 2B | Passive (Capital Gains) | LTCG 23.8% | Capital gains rates | 2.58x | 2026-01-19 | ✅ |
| 3 | NJ Conforming | NJ investor | Split state rates | 3.19x | 2026-01-19 | ✅ |
| 4 | 9% LIHTC | 9% rate | Credit scaling | 4.33x | 2026-01-19 | ✅ |

---

## Production Certification (Scenarios 6-10)

| # | Scenario | Config | Key Validation | MOIC | Recovery | Date | Status |
|---|----------|--------|----------------|------|----------|------|--------|
| 5 | No OZ | OZ disabled | OZ toggle | 2.73x | — | 2026-01-20 | ✅ |
| 6 | OR Full Conformity | OR investor | 100% bonus conformity | 3.38x | — | 2026-01-20 | ✅ |
| 7 | CA Non-Conforming | CA investor | 0% conformity | — | — | — | ☐ |
| 8 | GA Direct State LIHTC | GA property, direct path | Doubled credits | 4.11x | 4.3 years | 2026-01-22 | ✅ |
| 9 | Phil Debt (30%) | 30% phil debt | 95% leverage | 5.35x | — | 2026-01-20 | ✅ |

**Re-validation (2026-01-22):** Scenario 8 re-validated, MOIC updated to 4.11x with 4.3 year recovery.

---

## State LIHTC Syndication (Scenarios 10-11)

| # | Scenario | Config | Key Validation | MOIC | IRR | Recovery | Date | Status |
|---|----------|--------|----------------|------|-----|----------|------|--------|
| 10 | State LIHTC Synd Year 0 | GA/WA, 75% synd, Y0 | Net equity MOIC, no CF double-count | 10.15x | 89.9% | 1.4 years | 2026-01-22 | ✅ |
| 11 | State LIHTC Synd Year 1 | GA/WA, 75% synd, Y1 | Gross equity MOIC, capital return | 3.88x | 46.1% | — | 2026-01-21 | ✅ |

**Re-validation (2026-01-22):** Scenario 10 re-validated after ISS-023 fix. Time to Recovery now correctly shows 1.4 years (was 7.4 years due to using gross equity instead of net).

---

## DDA/QCT Boost Scenarios (Scenarios 12-13)

| # | Scenario | Config | Key Validation | MOIC | IRR | Date | Status |
|---|----------|--------|----------------|------|-----|------|--------|
| 12 | DDA/QCT Boost Only | GA property, no State LIHTC, 130% boost | Basis boost, Eligible vs Qualified display | 3.47x | 24.4% | 2026-01-22 | ✅ |
| 13 | DDA/QCT + State LIHTC Synd | GA property, 130% boost, 75% synd, Y0 | Stacked benefits: boost + piggyback + syndication | 31.9x | 363% | 2026-01-22 | ✅ |

**Scenario 12 Details:** Validates ISS-021 fix - LIHTC sheet now correctly displays:
- Eligible Basis: $80M (pre-boost)
- DDA/QCT Boost: 30%
- Qualified Basis: $104M (post-boost)

**Scenario 13 Details:** Maximum benefit stacking scenario combining DDA/QCT basis boost with GA piggyback State LIHTC syndicated at 75%. Demonstrates multiplicative effect of layered tax benefits.

---

## Variable Duration State LIHTC (Scenario 14)

| # | Scenario | Config | MOIC | IRR | Date | Notes |
|---|----------|--------|------|-----|------|-------|
| 14 | NE 6-Year State LIHTC | NE property, WA investor, synd Y0 75% | 5.42x | 40.8% | 2026-01-22 | IMPL-079 + ISS-024: 6-year schedule verified |

**Scenario 14 Validation Points:**
- State Credit Duration = 6 (not 10)
- State credits Years 1-7 only (Year 7 = catch-up)
- Years 8-10 show $0 state credits (fed only)
- Totals label shows "Fed: 10yr, State: 6yr"
- Syndication proceeds = $14.4M (75% of $19.2M gross)
- UI labels dynamic: "Years 2-6", "Year 7 Catch-Up", "6-Year Gross Credits"

---

## Capital Stack Enhancement (Scenarios 16-19)

| # | Scenario | Config | Key Validation | Date | Status |
|---|----------|--------|----------------|------|--------|
| 16 | PAB Integration | $100M project, $20M land, LIHTC 4%, PAB 30% | PAB Amount = 30% × Eligible Basis, Senior auto-reduces | 2026-01-24 | ✅ |
| 17 | DSCR Breakdown | Phil Debt 10%, Current Pay 50% enabled, PAB enabled | Must-Pay DSCR > Phil DSCR | 2026-01-24 | ✅ |
| 18 | HDC Debt Fund Separation | HDC Platform Mode ON, HDC DF 5%, Outside Sub-Debt 5% | Both appear as separate line items | 2026-01-24 | ✅ |
| 19 | Eligible Basis Exclusions | Commercial $1M, Syndication $1M, Financing $1M, Bond $1M | Eligible Basis = Project - Land - Exclusions | 2026-01-24 | ✅ |

**Scenario 16 Details (IMPL-080):**
- PAB = $22.8M (30% × $76M eligible basis)
- Senior auto-reduced: 65% → 43.2% (maintaining must-pay leverage target)
- Capital Stack balanced at 100%
- Export: PAB row in Capital_Stack sheet, PAB Details section

**Scenario 17 Details (IMPL-081):**
- Year 1: Must-Pay = 1.307, Phil = 1.307 (current pay starts Y2)
- Year 2: Must-Pay = 1.347, Phil = 1.279
- Export: 3 new columns (Must-Pay DS, Must-Pay DSCR, Phil DSCR) in Operating_CF
- Summary sheet: Min Must-Pay DSCR, Min Phil DSCR with notes

**Scenario 18 Details (IMPL-082):**
- HDC Debt Fund visible only when `hdcPlatformMode === 'leverage'`
- Outside Investor Sub-Debt no longer relabeled
- Both layers have independent PIK rate/current pay settings

**Scenario 19 Details (IMPL-083):**
- 8 exclusion fields: Commercial Space, Syndication, Marketing, Financing Fees, Bond Issuance, Operating Deficit Reserve, Replacement Reserve, Other
- Eligible Basis: $76M = $100M - $20M - $4M exclusions
- Export: Rows 72-79 in Inputs sheet

---

## Remaining (Scenarios 20-25)

| # | Scenario | Config | Key Validation | Status |
|---|----------|--------|----------------|--------|
| 20 | January Closing | Month 1 | Credit timing (max proration) | ☐ |
| 21 | December Closing | Month 12 | Credit timing (min proration) | ☐ |
| 22 | Sub-Debt Layer | HDC sub-debt | Waterfall priority | ☐ |
| 23 | High Cost Seg (40%) | — | Depreciation acceleration | ☐ |
| 24 | Short Hold (7yr) | — | Exit timing, OZ recapture | ☐ |
| 25 | Long Hold (15yr) | — | Full OZ benefit capture | ☐ |

---

## Summary

| Level | Required | Complete | Status |
|-------|----------|----------|--------|
| Limited Certification | 5 | 5 | ✅ |
| Production Certification | 10 | 11 | ✅ |
| Capital Stack Enhancement | 4 | 4 | ✅ |
| Institutional Certification | 20 | 18 | 90% |

---

## Bug Fixes Applied During Validation

| Issue | Description | Root Cause | Files Fixed | Date |
|-------|-------------|------------|-------------|------|
| ISS-021 | Eligible vs Qualified Basis display | Labels swapped | lihtcSheet.ts | 2026-01-22 |
| ISS-022 | Time to Recovery using gross equity | Should use net equity | calculations.ts | 2026-01-22 |
| ISS-023 | Syndication proceeds not in MOIC | Net equity excludes synd | calculations.ts | 2026-01-22 |
| ISS-024 | State LIHTC creditDurationYears not passed to export | stateLIHTCIntegration object not passed to export params | HDCResultsComponent.tsx + lihtcSheet.ts | 2026-01-22 |
| ISS-025 | Outside Sub-Debt label bug | Truthy check on hdcPlatformMode | CapitalStructureSection.tsx | 2026-01-24 |
| ISS-027 | Unit consistency (exclusions / 1M bug) | Incorrect division in UI | TaxCreditsSection.tsx | 2026-01-24 |
| ISS-028 | Eligible Basis = $0 | Same root cause as ISS-027 | TaxCreditsSection.tsx | 2026-01-24 |
| ISS-029 | PAB not in Capital Stack | Missing pabAmount calculation | useHDCState.ts + capitalStackSheet.ts | 2026-01-24 |
| ISS-030 | PAB enabled not reaching export | Prop drilling gap | HDCCalculatorMain.tsx → HDCResultsComponent.tsx | 2026-01-24 |
| ISS-031 | Capital Stack total missing PAB | pabPctOfProject not in total | useHDCState.ts | 2026-01-24 |
| ISS-032 | PAB should reduce Senior Debt | Added mustPayDebtTarget state | useHDCState.ts | 2026-01-24 |
| ISS-034 | HDC Debt Fund not reaching export | Same prop drilling gap as ISS-030 | HDCCalculatorMain.tsx → HDCResultsComponent.tsx | 2026-01-24 |
| ISS-035 | Exclusions not exported | Props not passed to export | HDCResultsComponent.tsx + inputsSheet.ts | 2026-01-24 |
| ISS-036 | Capital Stack validation tolerance | 0.001 threshold too tight | capitalStackSheet.ts (changed to 0.01) | 2026-01-24 |
| ISS-037 | DSCR breakdown columns missing | No Must-Pay/Phil columns | operatingCFSheet.ts | 2026-01-24 |
| ISS-038b | DSCR breakdown in Summary | No conditional rows | summarySheet.ts | 2026-01-24 |

---

## Update Protocol

After each validation session:

1. **Add new scenarios** with date, config, results
2. **Update summary counts** in the table above
3. **Commit** with session reference (e.g., "Validated scenarios 12-14")

---

## Document Maintenance

- **Version Control:** Increment version for significant updates
- **Location:** `frontend/docs/VALIDATION_SCENARIOS.md`
- **Related:** See [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) for implementation history
