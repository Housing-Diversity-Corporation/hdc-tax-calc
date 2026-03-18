# HDC Platform — Spec Registry Notes

**Maintained by:** Claude Code (CC) — updated with every IMPL
**Read by:** Claude Chat — live via GitHub project knowledge connection
**Purpose:** Interpretive layer on top of IMPLEMENTATION_TRACKER.md.
Tracks spec-section mapping, phase status, open issues, priorities,
and blocked items. Replaces manual Registry update document uploads.

---

## Current Codebase Baseline

| Field | Value |
|-------|-------|
| Branch | main |
| Latest IMPL deployed | IMPL-127 |
| IMPL-128 | In progress on impl-128-wip branch — not yet merged |
| Next available after 128 | IMPL-129 |
| Test count | 1,844 (94 suites, 0 failures) |
| Last updated | 2026-03-17 |

---

## IMPL Range Summary

| Range | Description | Status |
|-------|-------------|--------|
| 001–083 | Phases 1–16: core build through capital stack enhancement | ✅ All deployed |
| 084 | B2 save-flow wiring | ✅ Deployed 2026-02-14 |
| 085 | Pool aggregation + fund sizing optimizer | ✅ Deployed 2026-02-14 |
| 086–087 | Computed hold period engine + exit-month precision | ✅ Deployed 2026-02-17 |
| 088–089 | Reserved buffer | — Not used |
| 090–093 | Federal/state depreciation breakout | ✅ Deployed 2026-02-18 |
| 094–101 | Stage 5.5 Exit Tax Engine | ✅ Deployed 2026-02-18 |
| 102–107 | Phase B3 Fit & Archetype classification | ✅ Deployed 2026-02-17 |
| 108–117 | Timing Architecture Rewire (computeTimeline, XIRR) | ✅ Deployed 2026-03-03/04 |
| 118 | First-Year LIHTC Applicable Fraction | ✅ Deployed 2026-03-05 |
| 119 | NIIT-Aware Depreciation Benefit | ✅ Deployed 2026-03-06 |
| 120 | Tax Efficiency Mapping engine bug fixes | ✅ Deployed 2026-03-11 |
| 121 | NIIT-aware rate in calculateTaxUtilization() | ✅ Deployed 2026-03-12 |
| 122 | §38(c) unit mismatch fix | ✅ Deployed 2026-03-12 |
| 123 | Tax Efficiency Map platform integration | ✅ Deployed 2026-03-13 |
| 124 | Pool navigation wiring | ✅ Deployed 2026-03-13 |
| 125 | Tax Efficiency Map moved to deal view | ✅ Deployed 2026-03-14 |
| 126 | Tax_Utilization Excel sheet rebuilt with live formulas | ✅ Deployed 2026-03-15 |
| 127 | recaptureExposure misuse fix in Tax Efficiency Map MOIC | ✅ Deployed 2026-03-15 |
| 128 | Full hold-period MOIC with §469(g) exit release | 🔄 In progress (impl-128-wip) |
| 129+ | Unassigned — available | — |

---

## Phase Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase A | Tax Utilization Engine | ✅ Complete |
| Phase B1 | Portal Wiring | ✅ Complete |
| Phase B2 | DBP Infrastructure + Backend | ✅ Complete |
| Phase B3 | Fit & Archetype Classification | ✅ Complete |
| Phase B4 | Annual Tax Capacity Model | 🔴 Blocked — Angel (backend tables) |
| Phase C | Pool Aggregation | ✅ Complete (pulled forward) |

---

## Open Issues (Non-Blocking)

| Issue | Description | Blocking? |
|-------|-------------|-----------|
| IMPL-128 | Full hold-period MOIC — active troubleshooting on impl-128-wip | Holding doc updates |
| PDF report bug | Conflates gross exit value (~$60M) with net investor returns (~$35M) | No — audit prompt drafted |
| Trace unit count | Shows 100 instead of correct 195 — corrupted saved DB record, not code | No |
| OZ Benefits strip | Does not surface state tax and NIIT savings components explicitly | No — pre-existing |
| Screen 4 Pool View | Engine deployed (IMPL-085), UI screen not yet built | No |

---

## Next Implementation Priorities

| Priority | Item | Status |
|----------|------|--------|
| 1 | IMPL-128: Full hold-period MOIC with §469(g) exit release | 🔄 In progress |
| 2 | PDF report bug fix — CC audit prompt drafted | Ready |
| 3 | Capital Account Ledger — blocked on 2 pre-implementation audit items | Blocked |
| 4 | Portfolio Manager Screen 6 — spec v2.1 complete, zero code exists | Ready to spec IMPL |
| 5 | Phase B4 Annual Tax Capacity Model | Blocked on Angel |
| 6 | State Tax Conformity backend table | Q1 2026 priority |
| 7 | Tax Efficiency Map Step 3 batch validation | Prompt ready |

---

## Companion Document Versions (Current)

| Document | Version | Location |
|----------|---------|----------|
| OZ 2.0 Master Specification | v11.0 | Claude Chat project knowledge |
| OZ 2.0 Addendum | v9.3 | Claude Chat project knowledge |
| Tax Benefits Spec | v6.0 | Claude Chat project knowledge |
| Tax Benefits Program Spec | v1.4 | Claude Chat project knowledge |
| Tax Efficiency Mapping Spec | v1.1 | Claude Chat project knowledge |
| HDC Strategy & Execution Plan | v3.0 | Claude Chat project knowledge |
| Implementation Tracker | v10.8 | frontend/docs/IMPLEMENTATION_TRACKER.md |
| This file | v1.0 | frontend/docs/SPEC_REGISTRY_NOTES.md |

---

## CC Maintenance Instructions

Update this file as part of every IMPL's Definition of Done — same commit as IMPLEMENTATION_TRACKER.md:
```
□ "Current Codebase Baseline": update Latest IMPL, test count, last updated date
□ "IMPL Range Summary": mark new IMPL ✅ Deployed with date; update in-progress items
□ "Next Implementation Priorities": remove completed items, add new ones
□ "Open Issues": resolve closed items, add new ones
□ "Companion Document Versions": update if any spec versions changed this session
```

**This file is read by Claude Chat live via GitHub. No manual upload step required.**
