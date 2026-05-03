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
| IMPL-134 | OZ double-count fix in extended calculation path — for OZ 10+ year holds, base path adds ozRecaptureAvoided (annual) + ozExitAppreciation (exit) as explicit benefits, but exit tax engine also captures via netExitTax=0. Fix subtracts explicit OZ additions from adjustedTotalReturns and rebuilds IRR without double-counted values. ozDeferralNPV retained (separate time-value benefit). | Deployed | 2026-03-24 | calculations.ts | 1,854 tests (94 suites, 0 failures). |
| IMPL-135 | Add deal name to KPI strip and Returns Buildup strip headers — thread loadedConfigName from InvestorAnalysisCalculator and HDCInputsComponent through HDCResultsComponent to both strip components. Deal name renders as inline suffix on section title (fontWeight 500, fontSize 0.7rem, viridian-green). Fallback: nothing rendered when no config loaded. | Deployed | 2026-03-25 | InvestorAnalysisCalculator.tsx, HDCCalculatorMain.tsx, HDCInputsComponent.tsx, HDCResultsComponent.tsx, KPIStrip.tsx, ReturnsBuiltupStrip.tsx | 1,854 tests (94 suites, 0 failures). |
| IMPL-136 | Fix missing investorState + selectedState deps in mainAnalysisResults useMemo — investorState was never passed to calculateFullInvestorAnalysis() (engine fell back to selectedState || 'NY'), and selectedState was missing from the dependency array. Added investorState pass-through and both props as explicit deps. Runtime verified: investor state switch (WA→NJ) now triggers immediate MOIC recalculation. | Deployed | 2026-03-25 | useHDCCalculations.ts | 1,854 tests (94 suites, 0 failures). |
| IMPL-137 | Live Excel fix — ISS-069 (#NAME? errors) + ISS-070 (export params mismatch). ISS-069: Restored PlacedInServiceMonth named range in inputsSheet.ts — removed in IMPL-117 but 4 formula strings in depreciationSheet, lihtcSheet, taxBenefitsSheet still referenced it. ISS-070: Export was re-running engine with normalized params (placedInServiceMonth=1, constructionDelayMonths=0) producing different results than UI. Fix uses passed-in mainAnalysisResults directly. MOIC/IRR now match UI exactly (3.32x/22.20%). ISS-069 CLOSED, ISS-070 CLOSED. | Deployed | 2026-03-26 | auditExport/index.ts, auditExport/sheets/inputsSheet.ts | 1,854 tests (94 suites, 0 failures). |
| IMPL-138 | Fix ISS-075 — Summary sheet investor equity understates by interest reserve share. summarySheet.ts computed equity as `projectCost × investorEquityPct / 100` ($15.78M) instead of using engine's `investorResults.investorEquity` ($16.05M, computed on effectiveProjectCost which includes interest reserve). ISS-075 CLOSED. | Deployed | 2026-03-26 | auditExport/sheets/summarySheet.ts | 1,854 tests (94 suites, 0 failures). |
| IMPL-144 | Fix NOL carryforward effect on §38(c) ceiling. In REP (nonpassive) track, NOL consumed in Year 2+ now reduces `federalTaxLiability` before passing to `computeLIHTCNonpassive()` for §38(c) ceiling calculation. Statutory basis: §38(c)(1) GBC ceiling uses "net income tax" computed after all deductions including NOL. Impact: ~$36K reduction in total savings for $750K/$1M REP+MFJ profile (credits shift to later years via §39 carryforward). Updated IMPL-122, IMPL-121, IMPL-123 test expectations. Added 7 new tests: 5 for NOL→§38(c) interaction, 2 for explicit §469(i)(3)(D) ordering. | Deployed | 2026-04-03 | investorTaxUtilization.ts, impl-144-nol-sec38c-ceiling.test.ts, impl-122-sec38c-unit-fix.test.ts, impl-121-niit-utilization.test.ts, useTaxEfficiencyMap.test.ts | 1,787 tests (92 suites, 0 failures). |
| IMPL-145 | §461(l)-aware explicit sizing target for REP investors. Binary search finds the commitment where Year 1 depreciation lands at the §461(l) threshold ($313K Single / $626K MFJ, 2025 indexed). Adds `sec461lOptimalCommitment` and `sec461lUtilizationPct` to SizingResult. SizingOptimizerPanel displays "Optimal (§461(l) REP)" line and amber chart reference line for nonpassive investors only. | Deployed | 2026-04-04 | investorSizing.ts, SizingOptimizerPanel.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-146 | Screen 3 IRA Balance input field. Adds "Traditional IRA Balance" number input to InvestorTaxProfilePage Step 0 (Investor Information), after Filing Status. Wired to existing `iraBalance` state field and backend persistence path (input_investor_profile.ira_balance column already exists). No backend changes required. | Deployed | 2026-04-04 | InvestorTaxProfilePage.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-147 | IRA Conversion Results Display — IRAConversionPanel component on Screen 2 (FundDetail). Shows pre/post-HDC rate compression, optimal Roth conversion amount, tax savings, 30-year projected Roth value, and annual conversion schedule. Renders only for REP investors with iraBalance > 0. Computes conversion plan via existing optimizeIRAConversion() from iraConversion.ts, building REPTaxCapacityModel from fund-level TaxUtilizationResult. | Deployed | 2026-04-04 | IRAConversionPanel.tsx (new), FundDetail.tsx | 1,866 tests (96 suites, 0 failures). |

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
| IMPL-134 | OZ double-count fix in extended path (calculations.ts) | Deployed (2026-03-24) |
| IMPL-135 | Add deal name to KPI strip + Returns Buildup headers | Deployed (2026-03-25) |
| IMPL-136 | Fix missing investorState + selectedState deps in mainAnalysisResults useMemo | Deployed (2026-03-25) |
| IMPL-137 | Live Excel fix — ISS-069 + ISS-070 (#NAME? errors + export params mismatch) | Deployed (2026-03-26) |
| IMPL-138 | Fix Summary sheet investor equity understatement by interest reserve share | Deployed (2026-03-26) |
| IMPL-139 | Net Depreciation Benefit row — collapse dep + exit tax for non-OZ investors | Deployed (2026-03-28) |
| IMPL-140 | Fix 701 S Jackson hold period — timing field persistence + §42(f)(1) election | Deployed (2026-03-29) |
| IMPL-141-142 | *Reserved -- not used* | -- |
| IMPL-143 | Comprehensive Live Excel export params sync — timeline fields + income composition | Deployed (2026-04-01) |
| IMPL-144 | Fix NOL carryforward effect on §38(c) ceiling — nolUsed reduces net income tax for GBC limit | Deployed (2026-04-03) |
| IMPL-145 | §461(l)-aware explicit sizing target for REP investors | Deployed (2026-04-04) |
| IMPL-146 | Screen 3 IRA Balance input field | Deployed (2026-04-04) |
| IMPL-147 | IRA Conversion Results Display — IRAConversionPanel on Screen 2 | Deployed (2026-04-04) |
| IMPL-148 | DBP Units Normalization — millions to dollars at ingestion layer | Deployed (2026-04-04) |
| IMPL-149 | Annual Tax Profile Table Expansion — all 18 AnnualUtilization fields, conditional track columns | Deployed (2026-04-04) |
| IMPL-150 | Roth Conversion Modeling — rate compression engine + strategy comparison + lifetime value + recommendations | Deployed (2026-04-04) |
| IMPL-151 | Wealth Manager Summary Export — one-page client-meeting PDF on Screen 2 | Deployed (2026-04-04) |
| IMPL-152 | Lifetime Coverage Mode — variable-income sizing for REP investors | Deployed (2026-04-05) |
| IMPL-148 | DBP Units Normalization — all dollar fields in deal_benefit_profiles stored in millions (engine convention). aggregatePoolToBenefitStream() now converts to dollars (×1M) at ingestion. Unblocks IMPL-145 §461(l) REP sizing display. 4 test files updated with millions-scale fixtures. Runtime verified: Total Equity shows $16.1M, §461(l) REP optimal at $798K, IRA conversion at $173K/$83K savings. | Deployed | 2026-04-04 | poolAggregation.ts, poolAggregation.test.ts, impl085-runtime-verification.test.ts, investorB3Integration.test.ts, fundSizingOptimizer.test.ts | 1,866 tests (96 suites, 0 failures). |
| IMPL-149 | Annual Tax Profile Table Expansion — TaxUtilizationSection year-by-year table expanded from 6 to 14 data columns (all 18 AnnualUtilization fields). Two-row header with column groups: Depreciation (Generated/Allowed/Suspended/Tax Savings), LIHTC Credits (Generated/Usable/Carried), Track-specific (NOL Gen/Used/Pool for nonpassive; Passive Inc Offset/Suspended Loss/Suspended Credits for passive), Summary (Benefit Gen/Benefit Used/Util %). Conditional rendering by treatment track. Red/yellow highlights on suspended amounts. Runtime verified on both REP (nonpassive) and Non-REP (passive) profiles. | Deployed | 2026-04-04 | TaxUtilizationSection.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-150 | Roth Conversion Modeling — Phase 2 expansion. (1) Rate compression formula moved from FundDetail.tsx inline calc to exported `computeRateCompression()` in iraConversion.ts. (2) Three stranded functions wired to UI: `compareConversionStrategies()` renders 3-column strategy comparison table (Aggressive 3yr / Balanced 5yr / Conservative 7yr), `calculateRothConversionValue()` renders lifetime value section (Immediate Value / Future Value / Break-Even Year / Lifetime Advantage), `generateIRAConversionRecommendations()` renders bulleted recommendation list. (3) Year 1 absolute tax savings added to rate compression metrics. IRAConversionPanel props extended with optional strategy/lifetime/recommendations fields for backward compatibility. Runtime verified: pre-HDC 47.8%, post-HDC 0.0%, compression 47.8pts, Year 1 savings $48K, lifetime advantage $509K, 5 recommendations rendered. | Deployed | 2026-04-04 | iraConversion.ts, IRAConversionPanel.tsx, FundDetail.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-151 | Wealth Manager Summary Export — One-page client-meeting PDF handout on Screen 2 (FundDetail). New utility `exportWealthManagerSummary.ts` generates portrait-orientation jsPDF document with: (1) HDC-branded header band with fund name, investor name, date, "Strictly Confidential"; (2) Two-column Investment Summary / Year 1 Tax Impact section with optimal commitment, binding constraint, savings/dollar, utilization rate, pre/post-HDC rates, rate compression; (3) Condensed annual tax profile table (autoTable) — 5 columns (Year, Depr Tax Savings, LIHTC Used, NOL Pool or Suspended Loss by track, Cumulative Savings) limited to 11 years; (4) Conditional Roth Conversion Window section (REP + IRA balance only) with IRA balance, optimal conversion, window, effective rate, Yr 30 Roth value, lifetime advantage; (5) Footer disclaimer. "Export Summary" button added to profile selector row, renders only when sizing data available. Uses same jsPDF + jspdf-autotable libraries as Screen 3 reports. | Deployed | 2026-04-04 | exportWealthManagerSummary.ts (new), FundDetail.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-152 | Lifetime Coverage Mode — Variable-income sizing for REP investors. (1) InvestorProfile extended with `incomeMode`, `lowIncomeEstimate`, `highIncomeEstimate`, `incomeDistribution` fields. (2) New `findLifetimeCoverageCommitment()` in investorSizing.ts runs calculateTaxUtilization at low/high income points across 15 commitment samples, blends results by scenario weight (Conservative 75% low, Moderate 50/50, Optimistic 25% low), builds year-by-year CarryforwardBalance timeline tracking NOL pool + credit carryforward + suspended loss as economic "savings account". (3) SizingOptimizerPanel adds Annual Efficiency / Lifetime Coverage toggle (REP nonpassive only), income range inputs, savings account balance BarChart, scenario comparison table, coverage metric label. (4) FundDetail wires `handleLifetimeCoverageRequest` callback + `lifetimeCoverageResult` state. Annual Efficiency mode unchanged. Runtime verified: toggle renders for REP only, annual values unchanged ($100K/$2.17x/100%), lifetime mode renders all 3 scenarios. | Deployed | 2026-04-05 | investorTaxUtilization.ts, investorSizing.ts, SizingOptimizerPanel.tsx, FundDetail.tsx | 1,866 tests (96 suites, 0 failures). |
| IMPL-157 | OBBBA AMT Constants + `hasMaterialAmtExposure` flag — (1) `AMT_CONSTANTS_2026` named constants block added to investorTaxUtilization.ts with OBBBA 2026 values (exemptions, phaseout thresholds, doubled phaseout rate, rate brackets). Block marked unused pending future AMT-aware analysis; comments note §38(c)(4)(B)(iii) specified credits carve-out and §168(k)(2)(G) bonus depreciation no-adjustment rule. (2) `hasMaterialAmtExposure?: boolean` added to InvestorProfile (display-only, no calculation change). (3) Screen 3 checkbox added to InvestorTaxProfilePage. (4) SizingOptimizerPanel renders amber advisor note when flag true — states AMT does not affect LIHTC credits per §38(c)(4)(B)(iii), recommends tax counsel review for overall position. (5) §461(l) constants deduplicated: local copy removed from taxCapacity.ts, imports canonical export from investorTaxUtilization.ts. (6) TAX_DATA_VERSION updated to 2026.1.0. | Deployed | 2026-04-06 | investorTaxUtilization.ts, investorTaxInfo.ts, poolAggregation.ts, taxCapacity.ts, taxDataValidation.ts, SizingOptimizerPanel.tsx, FundDetail.tsx, InvestorTaxProfilePage.tsx, SPEC_IMPLEMENTATION_REGISTRY_v4_0_UPDATE.md | 1,866 tests (96 suites, 0 failures). |
| IMPL-158 | Passive Income Character Split (engine) — investorTaxUtilization.ts now computes character-weighted effectivePassiveRate from annualPassiveOrdinaryIncome (40.8%) and annualPassiveLTCGIncome (23.8%). §469(a)(2) credit ceiling uses blended rate. Backward compat: character fields = 0 → legacy proportional allocation → identical output. | Deployed | 2026-04-06 | investorTaxUtilization.ts, investorTaxInfo.ts, investorSizing.ts, poolAggregation.ts, calculations.ts, useTaxEfficiencyMap.ts, index.ts, exportParamsSync.test.ts, impl-154-passive-character-split.test.ts | 1,866 tests (96 suites, 0 failures). |
| IMPL-159 | Passive Income Character Split — Screen 3 UI. Single "Annual Passive Income" field replaced with two-field character split: "Ordinary passive income" ($, partnership/rental/short-term K-1) and "Long-term capital gains passive income" ($, PE/hedge fund distributions). Computed total displays read-only, updates reactively. Legacy profile migration: annualPassiveIncome > 0 with no character fields → treated as ordinary (conservative). Both fields persist via backend entity update. Null-safety fix for annualIncome.toLocaleString() crash. Backend: annualPassiveOrdinaryIncome, annualPassiveLTCGIncome, hasMaterialAmtExposure columns added to InvestorTaxInfo entity + update service method. | Deployed | 2026-04-07 | InvestorTaxProfilePage.tsx, investorTaxInfo.ts, poolAggregation.ts, InvestorTaxInfo.java, InvestorTaxInfoService.java, UI_NAVIGATION_MAP.md, impl-159-passive-character-ui.test.ts | 1,887 tests (99 suites, 0 failures). |
| IMPL-160 | NOL Present Value in Sizing Optimizer. (1) computeNOLDrawdown() extended with marginalRate, discountRate (default 0.07), startYear params; returns nolPresentValue, nolTotalTaxSavings. (2) computeOptimalSizing() computes NOL PV at optimal commitment, adds to SizingResult: nolPoolAtOptimal, nolPresentValue, nolAbsorptionYears, effectiveMultipleExNOL, effectiveMultipleWithNOL. (3) SizingOptimizerPanel: "Effective Multiple (excl. NOL)" label when pool > 0, secondary line "NOL Present Value (absorbed over ~Y years at 7%): $X". (4) Screen 3 Advanced section with NOL discount rate field. (5) nolDiscountRate wired through InvestorTaxInfo → InvestorProfile → engine. | Deployed | 2026-04-07 | investorTaxUtilization.ts, investorSizing.ts, SizingOptimizerPanel.tsx, InvestorTaxProfilePage.tsx, investorTaxInfo.ts, poolAggregation.ts, InvestorTaxInfo.java, InvestorTaxInfoService.java, UI_NAVIGATION_MAP.md, impl-160-nol-present-value.test.ts, investorSizing.test.ts, investorTaxUtilization.test.ts | 1,887 tests (99 suites, 0 failures). |
| IMPL-161 | Returns buildup and Live Excel sync — five reconciliation fixes | Deployed (2026-04-27) |
| IMPL-162 | Recapture Avoided sub-line display fix — informational label and muted style in Returns Buildup strip | Deployed (2026-04-27) |
| IMPL-163 | Fix OZ 1.0 deferral NPV — replace hardcoded 5-year deferral with §1400Z-2(b)(1) inclusion-date-aware calculation. OZ 1.0 deferralYears now computed as days between investmentDate and Dec 31 2026 (÷365.25). OZ 2.0 unchanged (5 years). computeTimeline.ts ozDeferralEndDate also version-aware. 4 new tests, 3 production call sites updated. | Deployed | 2026-05-02 | calculations.ts, computeTimeline.ts, useHDCState.ts, auditExport/index.ts, oz-calculations-validation.test.ts | 1,896 tests (99 suites, 0 failures). |
| IMPL-164 | Fix exit debt payoff — add PAB remaining balance and DDF compounded PIK balance to exit debt sum. PAB amortized balance now computed at exit (mirrors senior debt calc). DDF (hdcDebtFundPikBalance) deducted from gross exit proceeds. validateExitDebtPayoff guard updated with 2 new params (pabDebt, hdcDebtFund). Fixes defects #6, #10, #11 from Phase 2 Trace 4001 reconciliation audit. | Deployed | 2026-05-02 | calculations.ts, calculationGuards.ts, impl-164-exit-debt-completeness.test.ts | 1,900 tests (100 suites, 0 failures). |
| IMPL-165+ | *Unassigned -- available for future work* | -- |

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

### Net Depreciation Benefit Row (IMPL-139)
**Status:** Deployed
**IMPLs:** IMPL-139 (commit dd7da02, 2026-03-26)
**Notes:** Collapse separate "Depreciation Benefits" and "Exit Tax Cost" rows into single expandable "Net Depreciation Benefit" row for non-OZ investors (when exitTax.netExitTax > 0). Parent row shows net value (depreciationTotal - netExitTax). Sub-components: Gross Benefit (at 37%), divider, Exit Tax Cost with §1245/§1250/NIIT/State breakdown (indented, only if > 0). OZ 10+ year hold path unchanged ("Depreciation Benefits" with temporal breakdown preserved). Component count decreases by 1 for non-OZ. componentSum validation algebraically equivalent. 1 file changed (ReturnsBuiltupStrip.tsx), 67 insertions, 66 deletions. 1,854 tests pass.

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
| IMPL-139 | dd7da02 | 2026-03-26 | 1 | 67 | 66 |
| **Totals (084-139)** | **21 commits** | **Feb 14 - Mar 26** | **— ** | **~13,146** | **~3,045** |

### IMPL-153 (original): §461(l) EBL Income Offset — REVERTED

**Status:** ❌ Reverted — W-2 wages are explicitly excluded from §461(l)(3)(A)(i) "aggregate gross income attributable to trades or businesses" per CARES Act technical correction and JCT Blue Book (JCS-1-18). The flat statutory cap ($626K MFJ / $313K Single) is correct. Validation script (`frontend/scripts/validateTaxEngine.test.ts`) confirms flat cap MATCH at all tested commitment levels.

### IMPL-153 (reassigned): Year 1 Tax Reduction Display + Table Cleanup

**Status:** ✅ Complete (2026-04-05)

**Changes:**
1. **Year 1 Tax Reduction** — `depreciationTaxSavings[0] + lihtcUsable[0]` surfaced as named dollar amount in SizingOptimizerPanel KPI strip (green, first position). The single most concrete investor-facing metric.
2. **AnnualUtilization table completed (21/21 fields)** — `residualPassiveTax` (passive track, red) and `cumulativeCarriedCredits` (nonpassive track, teal) added to TaxUtilizationSection. Track-specific group expanded from 3 to 4 columns.
3. **Confusing test output fixed** — "Free Investment Test: FAILED" console.log renamed to "Year 1 Recovery Test: ACHIEVED/NOT ACHIEVED" to avoid false alarm in test runner output.

### IMPL-154: Timeline Audit Panel

**Status:** ✅ Complete (2026-04-05)

**Changes:**
Collapsible read-only panel on Screen 2 showing the full `computeTimeline()` trace for each deal in the pool. Four sections: Inputs, PIS Computation, Credit Schedule, Exit & Hold Period. Total Hold Years displayed in HDC blue. Warning dots for unoverridden PIS and January PIS + election edge case. Positioned after FundDealList, before optimization panels.

**Data source fix:** Panel reads from pre-computed `ComputedTimeline` passed as prop — zero DBP field references in component. FundDetail computes timeline per deal from DBP timing fields (`investmentDate`, `constructionDelayMonths`, `pisDateOverride`, `electDeferCreditPeriod`) added to both backend entity (DDL-auto) and frontend extraction function. Existing deals without these fields fall back to `pisMonth`/`pisYear`/`fundYear` synthesis until re-extracted.

### IMPL-158: Passive Income Character Split (Spec §IMPL-154)

**Status:** ✅ Complete (2026-04-06)

**Problem:** Engine treated all passive income as ordinary-rate (40.8% = 37% + 3.8% NIIT). For investors with predominantly LTCG passive income (PE fund distributions, hedge fund gains), the correct rate is 23.8% (20% + 3.8% NIIT). This overstated the §469(a)(2) credit ceiling and depreciation tax savings by up to 71% for a fully LTCG passive investor.

**Changes:**
1. **InvestorProfile** — added `annualPassiveOrdinaryIncome` and `annualPassiveLTCGIncome` fields (default 0, backward compat)
2. **computeFederalTax()** — character-split output: `passiveOrdinaryTaxLiability` (ordinary × marginalRate), `passiveLTCGTaxLiability` (LTCG × 20%). Legacy path unchanged when both character fields = 0.
3. **computeDepreciationPassive()** — character-weighted `effectivePassiveRate`: `(ordinaryIncome × ordinaryRate + ltcgIncome × ltcgRate) / totalPassiveIncome`. For fully ordinary investor: identical to 40.8%. For fully LTCG: 23.8%.
4. **AnnualUtilization** — 5 new passive-track fields: `passiveOrdinaryIncome`, `passiveLTCGIncome`, `effectivePassiveRate`, `passiveOrdinaryTaxCeiling`, `passiveLTCGTaxCeiling`
5. Threaded through: `InvestorTaxInfo`, `CalculationParams`, `poolAggregation`, `investorSizing`, `useTaxEfficiencyMap`, `calculations.ts`

**Test count:** 1,874 (97 suites, 0 failures). Added 8 new tests in 1 new suite. All existing tests pass unchanged (backward compat).

**Files modified:** investorTaxUtilization.ts, investorTaxInfo.ts, types/taxbenefits/index.ts, poolAggregation.ts, investorSizing.ts, calculations.ts, useTaxEfficiencyMap.ts, exportParamsSync.test.ts

### IMPL-161: Returns Buildup and Live Excel Sync — Five Reconciliation Fixes

**Status:** ✅ Complete (2026-04-27)

**Problem:** Reconciliation session between platform UI, calculation engine, and Live Excel export identified five discrepancies. The calculation engine is the single source of truth; the Excel export must mirror it exactly.

**Changes:**
1. **LIHTC double-count fix (calculations.ts)** — Replaced index-based `holdFromPIS` boundary for remaining credits with consumption tracking: `remaining = scheduleTotal - consumed`. Guarantees `consumed + remaining = scheduleTotal` with no overlap. Federal LIHTC buildup now matches credit schedule sum exactly ($23,458,610 for Trace 260327 scenario).
2. **OZ recapture avoided — character-split (calculations.ts)** — Replaced flat 25% rate with IRC-correct character split per Spec v6.0 §17.1: §1245 (cost-seg/bonus) × federalOrdinaryRate (37%), §1250 (straight-line MACRS) × 25%. Now consistent with `calculateExitTax()`.
3. **Excel Exit sheet AUM netting (exitSheet.ts)** — Equity waterfall input changed from `grossAfterAllDebt` to `netAfterFees` so investor exit proceeds match engine's `exitProceeds` (which already nets deferred AUM).
4. **Excel LIHTC sheet PIS month (lihtcSheet.ts)** — Fixed Rule 2 (`||` → `??`) and Rule 4 (reads `rawTimeline?.pisCalendarMonth` instead of normalized `params`). Added `rawTimeline` parameter threading from index.ts.
5. **Excel Depreciation sheet PIS month (depreciationSheet.ts)** — Same Rule 2/4 fix as LIHTC sheet. Both sheets now use identical PIS month source.

**Runtime verification:** Trace 260327 / 65M / 2.3 / 1300 — Federal LIHTC: $23.46M (matches expected $23,458,610). OZ Benefits: $10.16M (character-split applied).

**Test count:** 1,892 (99 suites, 0 failures). IRR sanity threshold updated for character-split increase (250 → 300).

**Files modified:** calculations.ts, exitSheet.ts, lihtcSheet.ts, depreciationSheet.ts, auditExport/index.ts, auditExport.test.ts

### IMPL-162: Recapture Avoided Sub-Line Display Fix

**Status:** ✅ Complete (2026-04-27)

**Problem:** Returns Buildup strip showed OZ Recapture Avoided as an additive sub-line identical to Deferral NPV. Recapture Avoided is not additive — it is already embedded in Exit Proceeds (net), which is computed assuming zero recapture tax due to OZ exclusion. Displaying it identically to additive components was misleading.

**Changes:**
1. **Label** — Renamed from "Recapture Avoided" to "Recapture Avoided (in exit proceeds)"
2. **Visual treatment** — Added `informational` flag to `SubComponent` interface. SubRow renders informational rows with muted opacity (0.55 label/value, 0.4 multiple/pct) and italic text. Color indicator bar opacity reduced to 0.3.
3. **Tooltip** — Skipped. No tooltip infrastructure exists on sub-lines. Not building new infrastructure for a display-only fix.

**Verification:** Total Returns $51.75M / 3.22x unchanged. OZ Benefits $10.16M unchanged. Display-only change — no calculation impact.

**Test count:** 1,892 (99 suites, 0 failures). No label text asserted in existing tests.

**Files modified:** ReturnsBuiltupStrip.tsx
