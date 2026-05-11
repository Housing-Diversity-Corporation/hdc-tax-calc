# AHF Mathematical Reference — Gap Analysis

**Document:** AHF_Math_Reference_Gap_Analysis_v1_1.md
**Date:** May 2026
**Source reference:** AHF_Mathematical_Reference_v3_2.md (47 platform formulas + Part 8 investment analytics, Parts 1–8 + Supporting Methods)
**Previous version:** AHF_Math_Reference_Gap_Analysis_v1_0.md (written against v3.0, 43 formulas)
**Purpose:** Identify gaps in the mathematical reference relative to the HDC Tax Benefits Platform's current state and roadmap
**Status:** Internal working document

---

## Changes from v1.0

| Change | Detail |
|---|---|
| Category 1 — all 4 items resolved | H-1 through H-4 added in v3.1 |
| Category 3 item 3.5 resolved | OZ inclusion event moved to DOCUMENTED_ASSUMPTIONS.md (DA-1) |
| Category 4 item 4.1 resolved | §461(l) CPI indexing moved to DOCUMENTED_ASSUMPTIONS.md (DA-2) |
| Part 8 added in v3.2 | R-1 through R-7 — risk-adjusted return investment analytics |
| IMPL-190 assigned | Two-scenario fee architecture (Scenario A — HDC as developer) |
| IMPL-191 candidate | §465 at-risk basis check (QNRD validation gap) |
| IMPL-192 assigned | Two-scenario fee architecture (Scenario B — HDC as asset manager) |
| Summary counts updated | Category 1: 4→0; Category 4: 3→2 open |

---

## Summary

| Category | Count | Description |
|---|---|---|
| 1 | 0 | ~~Deployed in production but not documented~~ — all resolved in v3.1 |
| 2 | 4 | Documented as PARTIAL — formula incomplete |
| 3 | 5 | Future/roadmap items — no formula specified yet |
| 4 | 2 | Constants and structural items needing attention |
| 5 | 7 | Part 8 additions — investment analytics (v3.2, not platform formulas) |

---

## Category 1 — Deployed but not documented ✅ ALL RESOLVED IN v3.1

### 1.1 Developer Deferred Fee (DDF) C Note PIK Accrual — RESOLVED
**Resolution:** H-1 added in v3.1. Full formula documentation: closing-portion offset, initial deferred balance, per-year paydown (Priority 5), no-PIK face-value structure, exit deduction (Tier 2). File reference: calculations.ts:303-305, :496-498, :558-559, :1452-1459, :2002-2003, :2029, :2034-2044.

### 1.2 AUM Fee Deferred Balance Accumulation — RESOLVED
**Resolution:** H-2 added in v3.1. Full 7-step formula documentation: annual fee base, prior-period interest accrual, current-pay/PIK split (ISS-056), Priority-3 payment queue, waterfall payment handler, Priority-4 catch-up (IMPL-030), total accumulated balance and exit deduction. File reference: calculations.ts:577-579, :1172-1213, :1244-1250, :1298-1336, :1396-1426, :2068-2071.
**Note (May 2026):** AUM fee made dormant in Scenario A (HDC as developer) via IMPL-190. Will be reactivated in IMPL-192 (Scenario B — HDC as asset manager). Logic preserved in codebase; dormancy is parameter-level only.

### 1.3 State LIHTC Per-Program Calculation Formulas — RESOLVED
**Resolution:** H-3 added in v3.1. Four program-type formulas (piggyback, supplement, standalone, grant), syndication rate logic, variable-duration credit schedule, and full 25-program inventory table. File reference: stateLIHTCCalculations.ts:254-303, :219-243, :318-378, :495-620.

### 1.4 Preferred Equity Mechanics — RESOLVED
**Resolution:** H-4 added in v3.1. Full formula documentation: principal sizing, target amount, priority-tracking accrual schedule (decoupled from exit payment), exit payment formula (min of target MOIC and available proceeds), achieved metrics, shortfall, LP common equity integration. File reference: preferredEquityCalculations.ts:1-454; calculations.ts:2005-2024.

---

## Category 2 — Documented as PARTIAL

### 2.1 G-17 Territorial Tax Engine — Medium priority
Five territory calculators exist (PR Act 60, USVI, Guam, American Samoa, CNMI) but only NIIT suppression is wired into the main engine. Full territorial integration not yet wired into calculateTaxUtilization or calculateExitTax. No IMPL assigned for full integration.
**Target version:** v3.3

### 2.2 E-11 Roth Strategy Comparison — Medium priority
capacity_t derivation formula not traced; held-period-to-schedule mapping incomplete.
**Target version:** v3.3

### 2.3 E-21 Blended Portfolio MOIC — Low priority
Cross-investor aggregation for portfolio-level MOIC across N investors not documented.
**Target version:** v3.3

### 2.4 §469(g) Per-Deal Suspended Loss Release — Low priority
Reference documents the simplification (single aggregated pool); correct per-deal formula not specified for future implementation.
**Target version:** v4.0

---

## Category 3 — Future roadmap items with no formula yet

### 3.1 IMPL-185 — Forgivable Debt Toggle at Exit — High priority
Conditional forgiveness flag, waterfall adjustment formula, and COD income exposure not specified. Currently all soft debt is treated as a real liability at exit — this overstates exit debt payoff and understates LP proceeds on deals with forgivable tranches (Amazon HEF, AHFA grants, philanthropic debt with forgiveness provisions). Needed for Queenswood Phase II.
**Target version:** v3.3 (formula spec); IMPL-185 assigned

### 3.2 IMPL-186 — Per-Tranche Debt Schema — High priority
Generalized PIK accrual for N tranches; schema-to-engine mapping for five new Canonical Schema v1.1 tables (deal_debt_tranches, deal_grants, deal_equity_installments, deal_uses_breakdown, deal_tax_events) not documented. Blocked on canonical schema build.
**Target version:** v3.3 (formula spec); IMPL-186 assigned

### 3.3 Phase B4 — Annual Tax Capacity Model — High priority
Year-by-year tax capacity projection formula entirely absent. Must precede IMPL build regardless of blocking status. Blocked on Brad: annual_tax_positions and tax_scenarios backend tables.
**Target version:** v4.0

### 3.4 §42 Income Averaging Election — Medium priority
Income averaging under §42(g)(1)(C): weighted average formula, per-unit AMI designation tracking, applicable fraction computation not documented.
**Target version:** v4.0

### 3.5 OZ Inclusion Event Exposure Calculation — RESOLVED (DOCUMENTED_ASSUMPTIONS.md)
**Resolution:** DA-1 added to DOCUMENTED_ASSUMPTIONS.md (May 2026). Documents gross inclusion event tax, basis step-up at inclusion (§1400Z-2(b)(2)(B)), valuation protection framework (FMV-below-debt), net exposure formula, and active deal exposure (500 Broadway $610K–$859K; 6766 real exposure). Platform does not compute net exposure — operational tracking only.

---

## Category 4 — Constants and structural items

### 4.1 §461(l) Threshold Inflation Indexing Protocol — RESOLVED (DOCUMENTED_ASSUMPTIONS.md)
**Resolution:** DA-2 added to DOCUMENTED_ASSUMPTIONS.md (May 2026). Documents §461(l)(3)(B) CPI-U indexing formula, current 2025 values ($626K MFJ, $313K Single, per Rev. Proc. 2024-40), codebase location (investorTaxUtilization.ts:217-221), and annual update protocol. Cross-reference to related tax bracket and standard deduction update protocol.

### 4.2 OZ Deferral Discount Rate Justification (r_d = 0.08) — Medium priority
No rationale documented for 8% vs 7%. NPV sensitivity to this rate is material for OZ 2.0 5-year deferral. Should be added to DOCUMENTED_ASSUMPTIONS.md with sensitivity analysis showing IRR delta across r_d = [0.06, 0.07, 0.08, 0.09, 0.10].
**Target:** DOCUMENTED_ASSUMPTIONS.md addition (v3.3 or sooner)

### 4.3 Three-State Deal Architecture — Structural (v4.0 prerequisite)
Current reference operates implicitly on Living Model inputs. No documentation of which variables freeze at Locked Basis and Performance Ledger transitions, or how actuals override projected formula inputs. Requires Canonical Schema v1.1 live and Phase B4 unblocked before spec can be written.
**Target version:** v4.0

---

## Category 5 — Part 8 Additions (v3.2) — Investment Analytics

Part 8 was added in v3.2. These sections are **not platform formulas** — they are an independent academic analysis of the investment opportunity in risk-adjusted return terms. They use platform outputs as inputs but are not computed by the engine. R-series codes distinguish them from G- and E-series platform formulas.

| Code | Section | Status | Notes |
|---|---|---|---|
| R-7 | QNRD Leverage Mechanism | Complete | §465(b)(6) at-risk basis extension. Loss-to-equity ratio ~2.2–2.9×. Platform gap flagged: §465 at-risk basis check not in engine — IMPL-191 candidate. |
| R-1 | Four-Component Return Decomposition | Complete | §42, §168(k), §1400Z-2 named as three statutory channels (~75% near-zero σ). Market component ~25%. |
| R-2 | Two-Component Variance Model | Complete | σ_total ≈ w_exit × σ_exit ≈ 6–8%. Empirical corroboration: CohnReznick foreclosure data, Fed DFAST stress shock, Basel III regulatory capital treatment (scoped to bank LIHTC equity investments). |
| R-3 | Sharpe Ratio | Complete | S ≈ 2.75–3.67. Derived from first principles. Comparative context table with desmoothed PE, real estate, infrastructure, hedge fund figures. |
| R-4 | Statutory Floor — Bounded Downside | Complete | IRR_floor ≈ 23.5% / MOIC_floor ≈ 2.42x at zero exit. Exceeds top-quartile PE under normal conditions. |
| R-5 | Sortino Ratio | Complete | Sortino ≈ 8–15+ (MAR = 10%). Sortino/Sharpe gap ~3.5× signals structural positive skew. Presentation guidance and required disclosure language included. |
| R-6 | Required Caveats | Complete | Six required disclosures for institutional presentation: illiquidity, distribution, legislative risk, small sample, comparability, GIPS 2020. |

**New platform gap identified in Part 8 (May 2026):**
The engine does not compute LP at-risk basis under §465 or verify allocated losses remain within QNRD-supported basis. For typical AHF deal structures this is unlikely to be the binding constraint, but should be confirmed deal-by-deal. IMPL-191 is the candidate IMPL for adding a §465 at-risk ceiling check alongside the existing §461(l), §38(c), and §469 statutory ceilings. Operational confirmation by HDC and tax counsel on a per-deal, per-investor basis until IMPL-191 ships.

---

## Recommended versioning approach (updated)

| Version | Scope | Status |
|---|---|---|
| v3.0 | Original 43 items — Parts 1–7 + Supporting Methods | Complete ✅ |
| v3.1 | Category 1 gap closure — H-1 through H-4 | Complete ✅ |
| v3.2 | Part 8 — Risk-adjusted return investment analytics (R-1 through R-7) | Complete ✅ |
| v3.3 | Category 2 PARTIAL items (G-17, E-11, E-21); IMPL-185 forgivable debt formula; IMPL-186 per-tranche schema formula; OZ discount rate justification (4.2) | Target: post-IMPL-185/186 build |
| v4.0 | Full rewrite: three-state architecture, Phase B4 annual tax capacity, N-tranche debt, §42 income averaging, §469(g) per-deal release | After Canonical Schema v1.1 live and Phase B4 unblocked |

**DOCUMENTED_ASSUMPTIONS.md additions (outside versioned reference):**
- DA-1: OZ Inclusion Event — Net Exposure Calculation (May 2026) ✅
- DA-2: §461(l) Threshold Indexing — Annual Update Protocol (May 2026) ✅
- Pending: OZ Deferral Discount Rate Justification (r_d = 0.08) — target v3.3 cycle

---

*AHF_Math_Reference_Gap_Analysis_v1_1.md | HDC Internal | May 2026 | Confidential*
