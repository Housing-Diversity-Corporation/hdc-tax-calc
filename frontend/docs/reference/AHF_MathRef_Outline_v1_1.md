# AHF Mathematical Reference — Restructured Outline
## v1.1 — May 2026

**Status:** Living document — updated to reflect AHF_Mathematical_Reference_v3_2.md completion
**Previous version:** AHF_MathRef_Outline_v1_0.md (pre-CC audit planning document, May 2026)

---

## Changes from v1.0

| Change | Detail |
|---|---|
| All 18 G-items resolved | v3.0 completed all G-series gap sections via CC audit |
| All Category 1 gaps resolved | H-1 through H-4 added in v3.1 |
| Part 8 added | R-1 through R-7 risk-adjusted return investment analytics added in v3.2 |
| CC Audit Scope section removed | That work is complete |
| Summary counts updated | 47 platform items + 7 investment analytics sections |
| Forward-looking section added | v3.3 and v4.0 targets identified |

---

## Document Arc — Current (v3.2)

```
Part 1 — The Deal Model
Part 2 — The Investor Model
Part 3 — Bringing Deal and Investor Together: The Optimization
Part 4 — During the Hold
Part 5 — At Exit
Part 6 — Geographic and State Adjustments
Part 7 — Portfolio Scale
Part 8 — Risk-Adjusted Return Mathematics  ← NEW v3.2
Supporting Methods
Appendix A — Constants and Defaults
```

---

## Part 1 — The Deal Model

### 1.1 Depreciation Schedule Construction
**STATUS: COMPLETE — G-1** | depreciationSchedule.ts:60-203

### 1.2 LIHTC Credit Schedule Construction
**STATUS: COMPLETE — G-2** | lihtcCreditCalculations.ts:470-595

### 1.3 Construction Timeline and PIK Accrual
**STATUS: COMPLETE — G-3** | calculations.ts:986-1066
Note: F sub-component — IMPL-186 per-tranche schema not yet deployed.

### 1.3a Developer Deferred Fee (DDF) C Note ★ NEW v3.1
**STATUS: COMPLETE — H-1** | calculations.ts:303-305, :496-498, :558-559, :1452-1459, :2002-2003
Note: IMPL-190 adds devFeePct (1–20% of TDC minus land) as computed
input for devFeeTotal. Existing DDF waterfall mechanics unchanged.

### 1.3b AUM Fee — Deferred Balance Accumulation and Catch-Up ★ NEW v3.1
**STATUS: COMPLETE — H-2** | calculations.ts:577-579, :1172-1426, :2068-2071
Note: AUM fee dormant in Scenario A (IMPL-190). Will be reactivated
in Scenario B — HDC as asset manager (IMPL-192).

### 1.4 Operating Cash Flow Model
**STATUS: COMPLETE — G-4** | calculations.ts:730-1525

### 1.5 Exit Valuation and Waterfall
**STATUS: COMPLETE — G-5** | calculations.ts:1950-2071
Note: F sub-component — IMPL-185 forgivable debt toggle not yet
deployed. All soft debt currently treated as real liability at exit.
Queenswood Phase II requires this fix.

### 1.6 OZ Deal Parameters
**STATUS: COMPLETE — G-6** | calculations.ts:2156-2202; computeTimeline.ts:69-115

---

## Part 2 — The Investor Model

### 2.1 Investor Track Selection
**STATUS: COMPLETE — G-7** | investorTaxUtilization.ts:308-319

### 2.2 Character-Weighted Effective Passive Rate
**STATUS: COMPLETE — E-3** | investorTaxUtilization.ts:521-532

### 2.3 NIIT Applicability and Passive Uplift
**STATUS: COMPLETE — E-5** | investorTaxUtilization.ts:790-796

### 2.4 §461(l) Cap and NOL Generation
**STATUS: COMPLETE — E-7** | investorTaxUtilization.ts:435-484

### 2.5 §38(c) General Business Credit Ceiling
**STATUS: COMPLETE — E-8** | investorTaxUtilization.ts:567-601

### 2.6 §469 Passive Income Ceiling
**STATUS: COMPLETE — G-8** | investorTaxUtilization.ts:499-553, :611-634

### 2.7 Benefit Timing Profile Classifier
**STATUS: COMPLETE — E-4** | investorFit.ts:257-281

---

## Part 3 — The Optimization

### 3.1 Objective Function
**STATUS: COMPLETE — G-9** | investorSizing.ts:87-297

### 3.2 Binary Search — §461(l) Target Commitment
**STATUS: COMPLETE — E-9** | investorSizing.ts:330-372

### 3.3 Efficiency Curve and Peak-Type Classifier
**STATUS: COMPLETE — E-10** | investorSizing.ts:124-319; fundSizingOptimizer.ts:99-234

### 3.4 Two-Layer Sizing (Fund + Investor)
**STATUS: COMPLETE — G-10** | fundSizingOptimizer.ts:99-197; investorSizing.ts:87-297

### 3.5 Roth Strategy Comparison
**STATUS: PARTIAL — E-11** | iraConversion.ts:262-308
Target: v3.3

### 3.6 Lifetime Coverage Mode
**STATUS: PARTIAL — E-12** | investorSizing.ts:412-543
Target: v3.3

---

## Part 4 — During the Hold

### 4.1 Annual Utilization Loop Structure
**STATUS: COMPLETE — G-11** | investorTaxUtilization.ts:726-1015

### 4.2 §469(i)(3)(D) Ordering Within Passive Track
**STATUS: COMPLETE — P-E15** | investorTaxUtilization.ts:866-902

### 4.3 NOL 80% Drawdown — During Hold
**STATUS: COMPLETE — E-13** | investorTaxUtilization.ts:467-484

### 4.4 §39 vs §469(b) Credit Carryforward Regimes
**STATUS: COMPLETE — E-15** | investorTaxUtilization.ts:567-634

### 4.5 Suspended Passive Loss Pool — Annual Accumulation
**STATUS: COMPLETE — G-12** | investorTaxUtilization.ts:542, :885

### 4.6 NOL Post-Exit Drawdown with Present Value
**STATUS: PARTIAL — E-14** | investorTaxUtilization.ts:648-704; investorSizing.ts:244-296
Target: v3.3

### 4.7 Recapture Coverage Ratio
**STATUS: COMPLETE — E-16** | investorTaxUtilization.ts:1025-1095

### 4.8 Pool Aggregation — Calendar-Year Alignment
**STATUS: COMPLETE — E-20** | poolAggregation.ts:62-174

### 4.8a State LIHTC Independence in Pool Aggregation
**STATUS: COMPLETE — P-E20** | poolAggregation.ts:115-124

---

## Part 5 — At Exit

### 5.1 Exit Tax — Three-Tranche Character Split with NIIT Overlay
**STATUS: COMPLETE — E-17** | calculations.ts:162-234

### 5.2 OZ Benefits — Three Independent Components
**STATUS: COMPLETE — E-18** | calculations.ts:2156-2202; :1819-1830

### 5.3 §469(g) Full Disposition Release
**STATUS: COMPLETE — G-13** | investorTaxUtilization.ts:1047-1062

### 5.4 Exit Waterfall and Net Investor Proceeds
**STATUS: COMPLETE — G-14** | calculations.ts:2026-2071
Note: F sub-component — IMPL-185 forgivable debt carve-out not yet deployed.

### 5.4a Financial MOIC Distinction
**STATUS: COMPLETE — P-E21** | calculations.ts:2330-2412; useTaxEfficiencyMap.ts:230-235

### 5.5 Preferred Equity Mechanics ★ NEW v3.1
**STATUS: COMPLETE — H-4** | preferredEquityCalculations.ts:1-454; calculations.ts:2005-2024

---

## Part 6 — Geographic and State Adjustments

### 6.1 Three-Dimension State Conformity Framework
**STATUS: COMPLETE — G-15** | stateProfiles.ts:1-319

### 6.1a State LIHTC Per-Program Calculation Formulas ★ NEW v3.1
**STATUS: COMPLETE — H-3** | stateLIHTCCalculations.ts:254-378, :495-620; stateProfiles.data.json

### 6.2 Federal/State Depreciation Benefit Breakout
**STATUS: COMPLETE — E-19** | calculations.ts:2210-2229

### 6.3 OZ State Conformity
**STATUS: COMPLETE — G-16** | calculations.ts:140

### 6.4 Territorial Tax Engine
**STATUS: PARTIAL — G-17** | territorialTaxCalculations.ts:35-227
Active production path: NIIT suppression only. Full integration unassigned.
Target: v3.3

---

## Part 7 — Portfolio Scale

### 7.1 Blended Portfolio MOIC
**STATUS: PARTIAL — E-21** | poolAggregation.ts; useTaxEfficiencyMap.ts:230-235
Target: v3.3

### 7.2 Batch Investor Optimization
**STATUS: COMPLETE — G-18** | useTaxEfficiencyMap.ts:201-289; investorFit.ts:96-127

---

## Part 8 — Risk-Adjusted Return Mathematics ★ NEW v3.2

**Character:** Independent academic investment analysis. Not platform formulas.
Uses platform outputs as inputs. Derived from first principles with explicit
assumptions and full disclosure. R-series codes distinguish from G- and E-series.

### 8.1 QNRD Leverage Mechanism
**STATUS: COMPLETE — R-7**
§465(b)(6) at-risk basis extension. Loss-to-equity ratio ~2.2–2.9×.
Platform gap: §465 at-risk basis check not in engine — IMPL-191 candidate.

### 8.2 Four-Component Return Decomposition
**STATUS: COMPLETE — R-1**
§42, §168(k), §1400Z-2 as three statutory channels (~75% near-zero σ).
Market component ~25%.

### 8.3 Two-Component Variance Model
**STATUS: COMPLETE — R-2**
σ_total ≈ w_exit × σ_exit ≈ 6–8%.

### 8.4 Sharpe Ratio
**STATUS: COMPLETE — R-3**
S ≈ 2.75–3.67. Derived from first principles, not estimated empirically.

### 8.5 Statutory Floor — Bounded Downside Property
**STATUS: COMPLETE — R-4**
IRR_floor ≈ 23.5% / MOIC_floor ≈ 2.42× at zero exit.

### 8.6 Sortino Ratio
**STATUS: COMPLETE — R-5**
Sortino ≈ 8–15+ (MAR = 10%). Sortino/Sharpe gap ~3.5× signals positive skew.

### 8.7 Required Caveats for Institutional Presentation
**STATUS: COMPLETE — R-6**
Six required disclosures: illiquidity, distribution, legislative risk,
small sample, comparability, GIPS 2020.

---

## Supporting Methods

### S-1 XIRR — Newton-Raphson
**STATUS: COMPLETE — E-1** | xirrCalculation.ts:43-88

### S-2 Interest Reserve — Fixed-Point Iteration
**STATUS: COMPLETE — E-2** | calculations.ts:393-450

### S-3 S-Curve Sigmoid Lease-Up
**STATUS: COMPLETE — E-6** | sCurveUtility.ts:38-122

### S-4 §38(c) Prong-B Specified Credit Treatment
**STATUS: COMPLETE — E-22** | investorTaxUtilization.ts:567-601, :854-864

---

## Appendix A — Constants and Defaults

**STATUS: COMPLETE** | 47 constants. 10 new constants added in v3.1 (H-1 through H-4).
Highlighted in blue in v3.2 document.

---

## Summary (v3.2)

| | Count |
|---|---|
| Complete G/E/H platform items | 43 |
| Partial platform items (G-17, E-11, E-12, E-14, E-21) | 5 |
| F sub-components flagged (IMPL-185, IMPL-186) | 2 |
| Part 8 investment analytics items (R-series) | 7 |
| **Total sections** | **57** |

---

## Forward-Looking: v3.3 Target Scope

| Item | Code | Notes |
|---|---|---|
| Forgivable debt toggle at exit | G-5 / G-14 update | IMPL-185. Queenswood blocker. |
| Per-tranche debt schema | G-3 update | IMPL-186. N-tranche generalization. |
| Territorial tax engine (full) | G-17 expansion | No IMPL assigned yet. |
| Roth strategy comparison (complete) | E-11 expansion | capacity_t derivation. |
| Lifetime coverage mode (complete) | E-12 expansion | Two-point income evaluation. |
| NOL post-exit PV (complete) | E-14 expansion | Multi-year drawdown. |
| Blended portfolio MOIC (complete) | E-21 expansion | N-investor aggregation. |
| OZ deferral discount rate justification | DOCUMENTED_ASSUMPTIONS.md | r_d = 8% rationale + sensitivity. |

## Forward-Looking: v4.0 Target Scope

| Item | Code | Notes |
|---|---|---|
| Three-state deal architecture | New Part | Living Model → Locked Basis → Performance Ledger. Requires canonical schema live. |
| Phase B4 Annual Tax Capacity Model | New section | Year-by-year tax capacity projection. Blocked on backend tables. |
| §42 Income Averaging Election | New item | §42(g)(1)(C) weighted average formula. |
| §469(g) Per-Deal Suspended Loss Release | G-13 expansion | Per-deal pool tracking (vs current aggregated). |
| Two-scenario fee architecture (full) | H-1/H-2 update | IMPL-190 (Scenario A) + IMPL-192 (Scenario B). |

---

## DOCUMENTED_ASSUMPTIONS.md Additions (outside versioned reference)

| Item | Added | Status |
|---|---|---|
| DA-1: OZ Inclusion Event — Net Exposure Calculation | May 2026 | ✅ CC commit prompt ready |
| DA-2: §461(l) Threshold Indexing — Annual Update Protocol | May 2026 | ✅ CC commit prompt ready |
| DA-3: OZ Deferral Discount Rate Justification (r_d = 0.08) | Pending | Target: v3.3 cycle |

---

*AHF_MathRef_Outline_v1_1.md | HDC Internal | May 2026 | Confidential*
