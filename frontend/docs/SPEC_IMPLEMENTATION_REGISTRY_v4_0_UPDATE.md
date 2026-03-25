# SPEC_IMPLEMENTATION_REGISTRY v4.0 — Update Content

**Produced:** 2026-03-06
**Purpose:** Content for updating the Spec Implementation Registry from v3.0 to v4.0. Brad will upload this to Claude Chat project knowledge.

---

## 3a. Version History Entry

| Version | Date | Changes |
|---------|------|---------|
| **4.0** | **2026-03-06** | **Major update: Timing architecture + XIRR + LIHTC fraction + NIIT depreciation. Total: 119 IMPLs through IMPL-119. Test count: 1,824 (91 suites, 0 failures). Timing architecture rewire deployed (IMPL-108-117): computeTimeline() engine, XIRR with Newton-Raphson, investment date UI, exit extension slider, 42(f)(1) election toggle, bulk test migration removing deprecated timing fields. IMPL-118: First-year LIHTC applicable fraction with documented assumptions gate. IMPL-119: NIIT-aware depreciation — gate on niitApplies for REP+grouped vs passive. 8 unpushed commits identified and pushed. IMPLEMENTATION_TRACKER.md updated to v10.0 (was stale at v9.0/IMPL-083).** |

---

## 3b. IMPL Number Map Update (IMPL-108 through IMPL-118)

| IMPL | Description | Status | Date |
|------|-------------|--------|------|
| IMPL-108 | Timing rewire types -- investmentDate, ComputedTimeline, XirrCashFlow, 42(f)(1) election, @deprecated tags | Deployed | 2026-03-03 |
| IMPL-109 | computeTimeline.ts -- date-driven timing engine with K-1 realization dates, January guard | Deployed | 2026-03-03 |
| IMPL-110 | calculateXIRR -- Newton-Raphson with ACT/365.25 day-count, 10 validation scenarios | Deployed | 2026-03-03 |
| IMPL-111 | Wire computeTimeline + calculateXIRR into calculations.ts | Deployed | 2026-03-03 |
| IMPL-112 | useHDCState adds investmentDate, pisDateOverride, exitExtensionMonths, electDeferCreditPeriod | Deployed | 2026-03-03 |
| IMPL-113 | computeTimeline useMemo in useHDCCalculations, election auto-reset guard for Jan PIS | Deployed | 2026-03-03 |
| IMPL-114 | UI -- Investment Date picker, Exit Extension slider, PIS override toggle, 42(f)(1) election toggle | Deployed | 2026-03-03 |
| IMPL-115 | Timing exports -- ComputedTimeline in audit export, timingGanttSheet with calendar dates | Deployed | 2026-03-04 |
| IMPL-116 | Bulk test migration -- remove taxBenefitDelayMonths, add investmentDate to defaults | Deployed | 2026-03-04 |
| IMPL-117 | Production cleanup -- remove deprecated timing fields, delete computeHoldPeriod.ts | Deployed | 2026-03-04 |
| IMPL-118 | First-Year LIHTC Applicable Fraction -- deal type + occupancy ramp + Documented Assumptions Gate | Deployed | 2026-03-05 |
| IMPL-119 | NIIT-Aware Depreciation Benefit -- gate depreciation effective rate on niitApplies; 37%+3.8% passive, 37% REP+grouped | Deployed | 2026-03-06 |
| IMPL-120 | Exit Tax appreciationGain & ozExitAppreciation Sync | Complete | 2026-03-08 | calculations.ts | Fix ozExitAppreciation to use adjusted-basis residual gain logic matching calculateExitTax(); sync IRR terminal cash flow to engine-derived value. 1,824 tests pass. |
| IMPL-130 | §42(f)(1) election threading fix — electDeferCreditPeriod added to LIHTCCalculationParams, threaded into getYear1ProrationFactor(), section42f3PenaltyRisk gated on election, lihtcSheet.ts election-aware proration, January guard at LIHTC call site | Deployed | 2026-03-24 | lihtcCreditCalculations.ts, useHDCCalculations.ts, lihtcSheet.ts, lihtcCreditCalculations.test.ts | 1,850 tests (94 suites, 0 failures). |
| IMPL-131 | Fix TaxCreditsSection input panel preview — pass electDeferCreditPeriod, dealType, leaseUpRampInput to calculateLIHTCSchedule() preview call; input panel Year 1 Credit now matches results section when election active | Deployed | 2026-03-24 | TaxCreditsSection.tsx, HDCInputsComponent.tsx | 1,850 tests (94 suites, 0 failures). |
| IMPL-132 | Default dealType to new_construction; wire interestReserveMonths as leaseUpRampInput replacing hardcoded 6-month default. DealType prop added to UseHDCCalculationsProps for future use | Deployed | 2026-03-24 | useHDCCalculations.ts | 1,850 tests (94 suites, 0 failures). |
| IMPL-133 | Fix computeEffectiveYear1AF election-aware ramp offset — when §42(f)(1) election active, ramp averaged over months (13-pisMonth) through (13-pisMonth+11) from PIS, not months 1-monthsInServiceYear1. Add electDeferCreditPeriod and pisMonth params. 4 new test scenarios | Deployed | 2026-03-24 | lihtcCreditCalculations.ts, lihtcCreditCalculations.test.ts | 1,854 tests (94 suites, 0 failures). |

---

## 3c. IMPL Number Map Range Summary Update

| Range | Assignment | Status |
|-------|------------|--------|
| IMPL-001-083 | Phases 1-16 (original build through capital stack enhancement) | All deployed |
| IMPL-084 | B2 save-flow wiring -- DBP extraction on save, service endpoints | Deployed (2026-02-14) |
| IMPL-085 | Pool aggregation + fund sizing optimizer -- 63 tests | Deployed (2026-02-14) |
| IMPL-086 | Computed hold period engine | Deployed (2026-02-17) |
| IMPL-087 | Exit-month precision | Deployed (2026-02-17) |
| IMPL-088-089 | *Reserved buffer -- not used* | -- |
| IMPL-090-093 | Federal/State Depreciation Breakout | Deployed (2026-02-18) |
| IMPL-094-101 | Stage 5.5 Exit Tax Engine -- IRC character-split recapture | Deployed (2026-02-18) |
| IMPL-102-107 | Phase B3 Investor Fit & Archetype Classification + Sizing | Deployed (2026-02-17) |
| IMPL-108-117 | Timing Architecture Rewire | Deployed (2026-03-03 to 2026-03-04) |
| IMPL-118 | First-Year LIHTC Applicable Fraction | Deployed (2026-03-05) |
| IMPL-119 | NIIT-Aware Depreciation Benefit Calculation | Deployed (2026-03-06) |
| IMPL-120 | Exit Tax appreciationGain & ozExitAppreciation Sync | Deployed (2026-03-08) |
| IMPL-121 | NIIT-aware rate in calculateTaxUtilization() | Deployed (2026-03-12) |
| IMPL-122 | §38(c) unit mismatch fix | Deployed (2026-03-12) |
| IMPL-123 | Tax Efficiency Map platform integration | Deployed (2026-03-13) |
| IMPL-124 | Pool navigation wiring | Deployed (2026-03-13) |
| IMPL-125 | Tax Efficiency Map moved to deal view | Deployed (2026-03-14) |
| IMPL-126 | Tax_Utilization Excel sheet rebuilt with live formulas | Deployed (2026-03-15) |
| IMPL-127 | recaptureExposure misuse fix in Tax Efficiency Map MOIC | Deployed (2026-03-15) |
| IMPL-128 | Full hold-period MOIC with §469(g) exit release | In progress (impl-128-wip) |
| IMPL-129 | Fix Excel export: LIHTC credits + OZ benefits missing | Deployed (2026-03-23) |
| IMPL-130 | §42(f)(1) election threading fix + January guard at LIHTC call site | Deployed (2026-03-24) |
| IMPL-131 | Fix TaxCreditsSection election preview | Deployed (2026-03-24) |
| IMPL-132 | Default dealType to new_construction + wire interestReserveMonths | Deployed (2026-03-24) |
| IMPL-133 | Fix computeEffectiveYear1AF election-aware ramp offset | Deployed (2026-03-24) |
| IMPL-134+ | *Unassigned -- available for future work* | -- |

---

## 3d. Sub-Spec Registry Entries (Part 3 Completed Sub-Specs)

| Sub-Spec | Version | Spec Section | IMPLs | Date | Commits |
|----------|---------|--------------|-------|------|---------|
| B2 Save-Flow Wiring | v1.0 | Phase B2 | IMPL-084 | 2026-02-14 | 4086d0f |
| Pool Aggregation & Fund Sizing | v1.0 | Phase C | IMPL-085 | 2026-02-14 | 272dbbb |
| Construction Timing & Exit-Month Precision | v1.0 | Timing | IMPL-086-087 | 2026-02-17 | 4cc1615 |
| Federal/State Depreciation Breakout | v1.0 | Tax Engine | IMPL-090-093 | 2026-02-18 | b911611 |
| Exit Tax Engine -- Character-Split Recapture | v1.0 | Stage 5.5 | IMPL-094-101 | 2026-02-18 | 80c2dd9 |
| Investor Fit & Archetype Classification | v1.0 | Phase B3 | IMPL-102-107 | 2026-02-17 | cae4566 |
| Timing Architecture Rewire | v1.0 | Timing | IMPL-108-117 | 2026-03-03 to 2026-03-04 | 6d6897c-94bc376 |
| First-Year LIHTC Applicable Fraction | v1.0 | LIHTC | IMPL-118 | 2026-03-05 | fff6177, 18da3e2 |
| NIIT-Aware Depreciation Benefit | v1.0 | Tax Engine | IMPL-119 | 2026-03-06 | ae1a519 |
| Exit Tax appreciationGain Sync | v1.0 | Tax Engine | IMPL-120 | 2026-03-08 | TBD (this commit) |

---

## 3e. Version Sync Log Entry

| Date | Spec Version | Tracker Version | Registry Version | Notes |
|------|-------------|-----------------|-----------------|-------|
| **2026-03-08** | **v6.0** | **v10.0** | **v4.0** | **37 IMPLs added (084-120). 1,824 tests (91 suites, 0 failures). Timing architecture complete. XIRR deployed. LIHTC applicable fraction deployed. NIIT-aware depreciation deployed. Exit tax ozExitAppreciation synced to engine. Both tracker and registry current.** |

---

## 3f. Part 1 Section Status Updates

### B2 Save-Flow Wiring (IMPL-084)
**Status:** Deployed
**IMPLs:** IMPL-084 (commit 4086d0f, 2026-02-14)
**Notes:** `extractDealBenefitProfile` wired into save flow in HDCInputsComponent.tsx. dbpService.ts and poolService.ts endpoints matched to backend. 9 files, 512 insertions.

### Pool Aggregation & Fund Sizing (IMPL-085)
**Status:** Deployed
**IMPLs:** IMPL-085 (commit 272dbbb, 2026-02-14)
**Notes:** poolAggregation.ts (aggregatePoolToBenefitStream, scaleBenefitStreamToMillions). fundSizingOptimizer.ts (iterates commitment levels). FundDetail page with FundDealList, EfficiencyCurveChart, OptimalCommitmentCard. 15 files, 2,588 insertions. 63 new tests.

### Construction Timing & Exit-Month Precision (IMPL-086-087)
**Status:** Deployed
**IMPLs:** IMPL-086-087 (commit 4cc1615, 2026-02-17)
**Notes:** Computed hold period engine in hdcAnalysis.ts. Exit-month precision logic. 44 files, 2,280 insertions. Test count reached 1,583.

### Federal/State Depreciation Breakout (IMPL-090-093)
**Status:** Deployed
**IMPLs:** IMPL-090-093 (commit b911611, 2026-02-18)
**Notes:** 6 breakout fields in calculations.ts: federalDepreciationBenefitYear1, stateDepreciationBenefitYear1, federalDepreciationBenefitHoldPeriod, stateDepreciationBenefitHoldPeriod, federalDepreciationBenefitTotal, stateDepreciationBenefitTotal. depreciationBreakout.test.ts (465 lines). 4 files, 561 insertions.

### Stage 5.5 Exit Tax Engine (IMPL-094-101)
**Status:** Deployed
**IMPLs:** IMPL-094-101 (commit 80c2dd9, 2026-02-18)
**Notes:** IRC-compliant character-split recapture: sec1245Recapture (ordinary rate), sec1250Recapture (25% cap), remainingGainTax, niitTax, totalFederalExitTax, state exit tax with conformity-aware rates. Removed single depreciationRecaptureRate. doesNIITApply() for territories. 28 files, 937 insertions. exit-tax-engine.test.ts with E-1 through E-10 + integration scenarios.

### Investor Fit & Archetype Classification (IMPL-102-107)
**Status:** Deployed
**IMPLs:** IMPL-102-107 (commit cae4566, 2026-02-17)
**Notes:** investorFit.ts (A-F archetype grading, passive income thresholds, REP track detection, benefit timing). investorSizing.ts (commitment-level utilization). FitSummaryPanel, SizingOptimizerPanel in FundDetail. useInvestorFit, useInvestorSizing hooks. 11 files, 2,588 insertions. 76 tests.

### Timing Architecture Rewire (IMPL-108-117)
**Status:** Deployed
**IMPLs:** IMPL-108-117 (commits 6d6897c through 94bc376, 2026-03-03 to 2026-03-04)
**Notes:** computeTimeline() replaces integer-based timing with date-driven engine. XIRR with Newton-Raphson (ACT/365.25). Investment date picker, exit extension slider, 42(f)(1) election toggle (auto-disabled for Jan PIS). ComputedTimeline wired to audit export and timingGanttSheet with calendar dates. Bulk test migration removed deprecated taxBenefitDelayMonths across 35 files. computeHoldPeriod.ts deleted. Test baseline: 1,841 at IMPL-112 start, 1,817 after IMPL-117 cleanup (test consolidation reduced count while maintaining coverage).

### First-Year LIHTC Applicable Fraction (IMPL-118)
**Status:** Deployed
**IMPLs:** IMPL-118 (commits fff6177, 18da3e2, 2026-03-05)
**Notes:** Deal type (acquisition vs new construction) and occupancy ramp logic in lihtcCreditCalculations.ts. DOCUMENTED_ASSUMPTIONS.md gate created. Section added to CALCULATION_ARCHITECTURE.md. 7 files, 807 insertions. lihtcCreditCalculations.test.ts expanded by 453 lines.

### NIIT-Aware Depreciation Benefit (IMPL-119)
**Status:** Deployed
**IMPLs:** IMPL-119 (2026-03-06)
**Notes:** Gate depreciation effective rate on niitApplies: REP+grouped (§469(c)(7)) = 37% only (Section 1411(c)(1)(A) active income exception), REP ungrouped / non-REP = 37%+3.8% (passive income), territories = no NIIT. calculations.ts (3 default-rate locations), useHDCCalculations.ts (unified depreciationNiitApplies logic), taxBenefitsSheet.ts (Excel IF(AND(IsREP,GroupingElection)) formulas), inputsSheet.ts (GroupingElection named range), validationSheet.ts. 7 files changed. niit-depreciation.test.ts with 6 scenarios. 1,824 tests pass.

### Exit Tax appreciationGain & ozExitAppreciation Sync (IMPL-120)
**Status:** Deployed
**IMPLs:** IMPL-120 (2026-03-08)
**Notes:** Fixed ozExitAppreciation to use adjusted-basis residual gain logic matching calculateExitTax(). Previously used raw `exitProceeds - investorEquity` which overstated appreciation by ignoring depreciation's basis reduction. Now computes depreciable basis inline (`projectCost + predevelopmentCosts - landValue`), splits §1245/§1250, derives adjusted basis and residual gain. Moved `engineOzExitAppreciation` computation before IRR recalc block so terminal cash flow uses engine-derived value instead of stale `baseResults.ozExitAppreciation`. DoD: `ozExitAppreciation == remainingGainTax` within $0.001M. 1 file changed (calculations.ts). 1,824 tests pass.

---

## 3g. Appendix Update

**Current codebase baseline (2026-03-06):**
- Branch: main
- Latest IMPL: IMPL-120
- Latest commit: TBD (this commit)
- Test suites: 91 passing
- Tests: 1,824 passing, 0 failing
- Unpushed commits: 0

**Next implementation priorities:**
1. Push unpushed commits to origin/main
2. REP Tax Impact Visualizer (spec v1.2 complete, IMPL TBD)
3. Phase B4 Annual Tax Capacity (spec complete, blocked on backend tables)
4. Portfolio Manager (spec v2.1 complete, IMPL TBD)
5. State tax conformity backend table (Q1 2026 priority)

**Not yet implemented (confirmed absent from codebase):**
- Phase B4: Annual Tax Capacity Model (AnnualTaxPosition, taxCapacityService -- 0 matches)
- Screen 5: Portfolio Dashboard (PortfolioDashboard -- 0 matches)
- REP Impact Visualizer (REPImpact -- 0 matches)

---

## Commit Reference Table

| IMPL Range | Commit(s) | Date | Files | Insertions | Deletions |
|------------|-----------|------|-------|------------|-----------|
| IMPL-084 | 4086d0f | 2026-02-14 | 9 | 512 | 115 |
| IMPL-085 | 272dbbb | 2026-02-14 | 15 | 2,588 | 5 |
| IMPL-086-087 | 4cc1615 | 2026-02-17 | 44 | 2,280 | 460 |
| IMPL-090-093 | b911611 | 2026-02-18 | 4 | 561 | 3 |
| IMPL-094-101 | 80c2dd9 | 2026-02-18 | 28 | 937 | 70 |
| IMPL-102-107 | cae4566 | 2026-02-17 | 11 | 2,588 | 0 |
| IMPL-108 | 6d6897c | 2026-03-03 | 1 | 113 | 0 |
| IMPL-109 | fdd22f5 | 2026-03-03 | 3 | 556 | 1 |
| IMPL-110 | 7098424 | 2026-03-03 | 2 | 359 | 0 |
| IMPL-111 | cc47d69 | 2026-03-03 | 10 | 469 | 38 |
| IMPL-112+113 | 095d43a | 2026-03-03 | 3 | 186 | 2 |
| IMPL-114 | 7d5db78 | 2026-03-03 | 4 | 324 | 59 |
| IMPL-115 | 8377818 | 2026-03-04 | 9 | 380 | 71 |
| IMPL-116 | c992327 | 2026-03-04 | 35 | 44 | 1,319 |
| IMPL-117 | 94bc376, 7c1cfb1 | 2026-03-04 | 29 | 205 | 709 |
| IMPL-118 | fff6177, 18da3e2 | 2026-03-05 | 7 | 807 | 57 |
| IMPL-119 | ae1a519 | 2026-03-06 | 7 | ~126 | ~60 |
| IMPL-120 | TBD (this commit) | 2026-03-08 | 1 | ~19 | ~10 |
| **Totals (084-120)** | **20 commits** | **Feb 14 - Mar 8** | **— ** | **~13,079** | **~2,979** |
