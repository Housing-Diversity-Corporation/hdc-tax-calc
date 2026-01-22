# Validation Scenario Tracker

**Version:** 1.1
**Last Updated:** 2026-01-22
**Status:** 13 of 15+ scenarios validated

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

| # | Scenario | Config | Key Validation | MOIC | Date | Status |
|---|----------|--------|----------------|------|------|--------|
| 5 | No OZ | OZ disabled | OZ toggle | 2.73x | 2026-01-20 | ✅ |
| 6 | OR Full Conformity | OR investor | 100% bonus conformity | 3.38x | 2026-01-20 | ✅ |
| 7 | CA Non-Conforming | CA investor | 0% conformity | — | — | ☐ |
| 8 | GA Direct State LIHTC | GA property, direct path | Doubled credits | 4.18x | 2026-01-20 | ✅ |
| 9 | Phil Debt (30%) | 30% phil debt | 95% leverage | 5.35x | 2026-01-20 | ✅ |

---

## State LIHTC Syndication (Scenarios 10-11)

| # | Scenario | Config | Key Validation | MOIC | IRR | Date | Status |
|---|----------|--------|----------------|------|-----|------|--------|
| 10 | State LIHTC Synd Year 0 | GA/WA, 75% synd, Y0 | Net equity MOIC, no CF double-count | 10.15x | 89.9% | 2026-01-21 | ✅ |
| 11 | State LIHTC Synd Year 1 | GA/WA, 75% synd, Y1 | Gross equity MOIC, capital return | 3.88x | 46.1% | 2026-01-21 | ✅ |

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

## Remaining (Scenarios 14-20)

| # | Scenario | Config | Key Validation | Status |
|---|----------|--------|----------------|--------|
| 14 | January Closing | Month 1 | Credit timing (max proration) | ☐ |
| 15 | December Closing | Month 12 | Credit timing (min proration) | ☐ |
| 16 | Sub-Debt Layer | HDC sub-debt | Waterfall priority | ☐ |
| 17 | High Cost Seg (40%) | — | Depreciation acceleration | ☐ |
| 18 | Low Cost Seg (15%) | — | Depreciation baseline | ☐ |
| 19 | Short Hold (7yr) | — | Exit timing, OZ recapture | ☐ |
| 20 | Long Hold (15yr) | — | Full OZ benefit capture | ☐ |

---

## Summary

| Level | Required | Complete | Status |
|-------|----------|----------|--------|
| Limited Certification | 5 | 5 | ✅ |
| Production Certification | 10 | 11 | ✅ |
| Institutional Certification | 15 | 13 | 87% |

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
