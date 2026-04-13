# HDC Tax Benefits Platform — Comprehensive Program Specification

**Version:** 1.5  
**Date:** April 2026  
**Status:** Working Reference  
**Author:** HDC / Claude Chat  
**Companion Documents:**  
- OZ 2.0 Master Specification v11.0  
- OZ 2.0 Addendum v9.3  
- Tax Benefits Spec v6.0  
- Spec Implementation Registry v4.2  
- Tax Provisions Reference v1.0  

---

## Document Role

This is the **program-level reference document** for the HDC Tax Benefits Platform. It answers the question: *what is this platform, how does it work, what is built, and what is planned?*

It is **not** a CC implementation spec. For building, use:

| Need | Go To |
|------|-------|
| Function signatures, test scenarios, CC prompts | Tax Benefits Spec v6.0 |
| Deep calculation mechanics, UI architecture | OZ 2.0 Master Specification v11.0 |
| 56-jurisdiction state data tables | OZ 2.0 Addendum v9.3 |
| Which IMPLs are deployed, test counts, next priorities | Spec Implementation Registry v4.1 |
| Proforma engine build spec | HDC Proforma Engine Spec v2.0 |
| Tax efficiency batch analysis | Tax Efficiency Mapping Spec v1.1 |
| Go-to-market strategy, partnerships | HDC Strategy & Execution Plan v3.0 |
| Legal / tax opinion | Tax Counsel Verification rev2 |

**Note on retired documents:** `Tax_Benefits_Spec_Portfolio_Manager_Additions.md` has been retired — its content was a staging patch for Tax Benefits Spec v5.3 that was incorporated into v6.0 and is now covered in §13A and §16.1 of this document. `Platform_Vision_Deal_Lifecycle_Architecture_v1_0.md` has been **retired and superseded** by HDC Platform Product Roadmap v2.0 (April 2026), which expands the three-state lifecycle concept into a full seven-track architecture.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-15 | Initial consolidated spec synthesizing Master Spec v11.0, Tax Benefits Spec v6.0, Addendum v9.3, Registry v4.1, IMPLs 001–122, all session decisions, and known-correct tax law corrections |
| 1.1 | 2026-03-15 | Added Section 14A: How the App Receives Data Today — data flow from manual entry through PostgreSQL persistence, DBP extraction, and investor profile loading. Updated Table of Contents. |
| 1.2 | 2026-03-15 | Added Section 13A: Platform Screens — full description of all six screens (Deal Grid, Deal Detail, Profile Editor, Pool View, Portfolio Dashboard, Portfolio Manager) covering available investments, investor profiles, fund pooling, and per-investor tax efficiency. |
| 1.3 | 2026-03-15 | Flagged Screen 4 Pool View engine-without-UI gap in Open Issues. Added Section 16: Platform Roadmap — comprehensive future workstream covering proforma engine, deal ingestion, data mapping, deal lifecycle (Living Model / Locked Basis / Performance Ledger), capital account ledger, investor reporting, and platform maturity items. |
| 1.5 | 2026-04-12 | April 2026 architecture session. Added §16.2 workstreams: Canonical Deal Schema, CIE Integration, Deal Snapshot and Versioning, Investor Portal Fund Administration, AHF Deal Sourcing. Updated Spec Implementation Registry reference to v4.2. Retired Platform Vision v1.0 retirement note (superseded by Roadmap v2.0). |
| 1.4 | 2026-03-15 | Added Document Role section — explicit declaration of this doc's position in the spec ecosystem, routing table to companion implementation specs, and retirement notes for superseded documents. |

---

## Table of Contents

1. [Program Purpose & Problem Statement](#1-program-purpose--problem-statement)
2. [Value Hierarchy](#2-value-hierarchy)
3. [Capital Structure](#3-capital-structure)
4. [Benefit Layer 1 — LIHTC Credits (§42)](#4-benefit-layer-1--lihtc-credits-42)
5. [Benefit Layer 2 — Depreciation (§168 + §168(k))](#5-benefit-layer-2--depreciation-168--168k)
6. [Benefit Layer 3 — State LIHTC Programs](#6-benefit-layer-3--state-lihtc-programs)
7. [Benefit Layer 4 — Opportunity Zone Enhancement (§1400Z-2)](#7-benefit-layer-4--opportunity-zone-enhancement-1400z-2)
8. [Investor Tax Utilization Framework](#8-investor-tax-utilization-framework)
9. [Investor Archetype Classification](#9-investor-archetype-classification)
10. [Exit Economics & Tax Engine](#10-exit-economics--tax-engine)
11. [Sizing Optimizer](#11-sizing-optimizer)
12. [State Tax Dual-Track Calculations](#12-state-tax-dual-track-calculations)
13. [Calculation Engine Architecture](#13-calculation-engine-architecture)
13A. [Platform Screens](#13a-platform-screens)
14. [Platform Implementation Status](#14-platform-implementation-status)
14A. [How the App Receives Data Today](#14a-how-the-app-receives-data-today)
15. [Open Issues & Future Workstreams](#15-open-issues--future-workstreams)
16. [Platform Roadmap](#16-platform-roadmap)
17. [Statutory Authority Reference](#17-statutory-authority-reference)
18. [Key Decisions & Known-Correct Corrections](#18-key-decisions--known-correct-corrections)

---

## 1. Program Purpose & Problem Statement

### 1.1 The Investor Problem

Affordable housing developers have access to powerful, stacking tax benefits — §42 LIHTC credits, §168(k) bonus depreciation, §1400Z-2 Opportunity Zone incentives, and state-level supplements — but these benefits have historically flowed only to corporate syndicators, not individual investors. Individual high-net-worth investors and their wealth managers have had no tool to:

- Determine whether a given deal fits their specific tax profile
- Compute the right commitment size (oversizing wastes capital in a 10-year lock; undersizing leaves tax capacity on the table)
- Model how anticipated income changes over the hold period affect benefit utilization

### 1.2 The Wealth Manager Gap

Wealth managers face the same problem from the other side. An optimal investment for a $5M passive income earner looks nothing like the optimal investment for a $750K W-2 earner, even on the same deal. Without precision modeling, the advisory cost of manual CPA-grade analysis exceeds the fee for smaller commitment levels, locking out the $100K–$500K investor segment entirely.

### 1.3 The HDC Solution

The HDC Tax Benefits Platform sits at the intersection of two inputs:

**Deal Benefit Stream:** A frozen financial profile capturing all tax benefits a specific deal produces over its hold period — depreciation, LIHTC credits, state LIHTC, operating cash flow, and exit economics, with OZ and state layers where applicable.

**Investor Tax Profile:** A decomposition of income by type (ordinary, passive, portfolio) and the regulatory framework governing each (§469 passive activity rules, §461(l) excess business loss limits, §38(c) credit ceilings). Not a single income number — a precise tax profile.

The **sizing engine** runs the investor's profile against the deal's benefit stream and computes the optimal investment amount: the point where tax benefit utilization is maximized, above which each additional dollar generates benefits the investor cannot absorb given their income composition and filing status.

### 1.4 Business Outcome

Every dollar of optimized investment is a dollar into the American Housing Fund. Every dollar in the fund becomes affordable housing. The platform converts tax liability into housing units by making the investment case precise enough for investors and advisors to act on with confidence.

---

## 2. Value Hierarchy

The platform models four independent benefit layers. They stack when available; LIHTC is the economic foundation.

| Layer | Source | Value Driver | Availability |
|-------|--------|-------------|-------------|
| **1. LIHTC** | §42 credits | Foundation — 10-year credit stream | All investors |
| **2. Depreciation** | §168 + §168(k) | Second layer — front-loaded Year 1 bonus | All investors (utilization varies by investor type) |
| **3. State LIHTC** | State programs | Multiplier — 25 states offer supplements | Property-state dependent |
| **4. OZ Enhancement** | §1400Z-2 | Optional overlay — deferral + exclusion | OZ-located properties only |

> **Strategic Note:** OZ + Bonus Depreciation is the marketing lead. LIHTC is the economic foundation. The platform models all four layers independently regardless of which is emphasized in investor materials.

### 2.1 Representative Returns (Reference: $65M Trace 4001)

| Investor Type | MOIC | Key Driver |
|--------------|------|-----------|
| OZ Investor (10+ yr hold) | ~3.76x | All four layers + zero exit tax |
| Non-OZ Investor | ~3.3x | Layers 1-3, exit tax reduces returns |

---

## 3. Capital Structure

### 3.1 Standard Capital Stack

| Layer | % of Total Cost | Source | Terms |
|-------|----------------|--------|-------|
| Senior Debt | 65% | Bank / CDFI | Market rate, 30-yr amortization |
| Philanthropic / Gap Debt | 30% | Amazon HEF, Ballmer Group, CDFIs | Below-market, subordinated |
| QOF Investor Equity | 5% | OZ investors | 10-year hold |

> **Current Standard:** 35% equity / 65% debt (previously modeled as 5% equity / philanthropic debt — all calculations reflect the current structure).

### 3.2 Why Leverage Matters for Tax Benefits

All debt must qualify under IRC §752 as Qualified Nonrecourse Financing:
- Secured by real property
- No personal guarantees from limited partners
- Lender has no recourse beyond collateral

**Result:** 100% of project debt allocates to investor basis. A $5M equity position controls $100M in depreciable basis, enabling depreciation on the full project cost despite minimal equity. This is the leverage mechanism that makes the tax benefit multiple possible.

### 3.3 Philanthropic Debt Partners

| Partner | Typical Terms | Notes |
|---------|--------------|-------|
| Amazon Housing Equity Fund | 1–2%, 10-year, subordinated | National |
| Ballmer Group | Below-market, flexible | West Coast focus |
| CDFI Loan Funds | 3–5%, patient capital | Varies by region |

> **Note:** Philanthropic debt sources can be fickle. State LIHTC programs can replace this layer entirely in Tier 1A states — syndication proceeds offset gross equity, reducing net investor cash outlay.

### 3.4 Single-Investor QOF Model

Each investor has their own QOF entity:
- Simplified K-1 reporting
- No allocation complexity with other investors
- Clean exit mechanics
- Independent 10-year OZ clock per investor (not tied to property PIS date)

### 3.5 DSCR Covenant

**Threshold:** 1.05x (defined as `DSCR_COVENANT_THRESHOLD` in `calculations.ts`)

Waterfall priority when cash is limited:
1. Hard debt service (senior + philanthropic) — always paid, non-negotiable
2. Outside investor current pay
3. HDC sub-debt current pay / investor sub-debt current pay
4. AUM fee

When insufficient cash, soft-pay items accrue as PIK (paid-in-kind) with `hdcDeferralRate` (default 8%).

---

## 4. Benefit Layer 1 — LIHTC Credits (§42)

### 4.1 Credit Mechanics

LIHTC (Low-Income Housing Tax Credit) is a dollar-for-dollar reduction in federal income tax liability. HDC uses the **4% credit rate** applicable to bond-financed projects.

**10-Year Credit Period with Year 1 Proration:**

| PIS Month | Year 1 % | Year 11 Catch-up |
|-----------|---------|-----------------|
| January | 100% | 0% |
| July | 50% | 50% |
| December | 8.3% | 91.7% |

The §42(f)(1) first-year election allows deferring Year 1 credit to Year 2, consolidating into a fuller first-year credit. Auto-disabled for January PIS (no benefit since Year 1 is already 100%).

### 4.2 Credit Calculation Inputs

| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| `applicableFraction` | 75% | 40–100% | % of qualified units |
| `pisMonth` | 7 (July) | 1–12 | Placed-in-service month |
| `creditRate` | 4% | — | 4% only (9% deferred) |
| `ddaQctBoost` | true | — | DDA/QCT 130% basis boost |

### 4.3 Eligible Basis

Eligible basis for LIHTC is **different from OZ depreciable basis**:

- Excludes land (same as OZ basis)
- Excludes non-depreciable costs
- **Includes** DDA/QCT 130% boost when applicable
- **Does not** include loan fees or reserves (unlike OZ basis)

### 4.4 LIHTC and §469 — Corrected Treatment

> **Correction to prior versions:** Master Spec v9.0 and earlier stated "LIHTC credits are NOT subject to §469 passive activity limitations." This was incorrect. Corrected in Tax Benefits Spec v6.0 §1.3 and Master Spec v10.1.

**Correct treatment:**
- LIHTC credits receive exemption from **active participation** requirements (§469(i)(3)(B))
- LIHTC credits receive exemption from **AGI phaseout** (§469(i)(3)(C))
- LIHTC credits **remain subject** to the §469(i)(1) $25,000 deduction-equivalent cap
- **Ordering rule §469(i)(3)(D):** Passive depreciation losses consume the §469(i) allowance before LIHTC credits can access it

**For Non-REP investors:** Near-total credit suspension unless investor has sufficient passive income. Credits can only offset tax attributable to passive income under §469(a)(2).

**For REP investors:** Losses are non-passive; LIHTC credits are not competing with depreciation for the §469(i) allowance. Credits reduce tax liability subject to the §38(c) general business credit floor (~25% of regular tax above $25K).

### 4.5 LIHTC Recapture Exception

§42(j)(5) provides a nonprofit recapture exception. Exit to Essential Housing Solutions (EHS) or similar nonprofit triggers no LIHTC recapture, enabling the 10–11 year nonprofit exit strategy.

### 4.6 Deal Type: Acquisition vs. New Construction

IMPL-118 introduced differentiated Year 1 applicable fraction logic:
- **Acquisition/Rehab:** Full applicable fraction from PIS month
- **New Construction:** Occupancy ramp model — units come online progressively, reducing Year 1 fraction

---

## 5. Benefit Layer 2 — Depreciation (§168 + §168(k))

### 5.1 MACRS Depreciation Structure

| Property Type | Recovery Period | Method | IRC Authority |
|--------------|----------------|--------|--------------|
| Residential structure (§1250) | 27.5 years | Straight-line | §168(b)(3)(A) |
| Personal property — cost seg (§1245) | 5-year / 15-year | Bonus (Year 1) | §168(k) |

### 5.2 Bonus Depreciation (§168(k))

**100% first-year expensing** on cost-segregated §1245 components. Made permanent by the One Big Beautiful Budget Act (OBBBA). Prior sunset provisions no longer apply.

### 5.3 Cost Segregation

| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| `costSegPercent` | 20% | 0–35% | % of project cost eligible for bonus |
| `bonusDepPercent` | 100% | 0–100% | Bonus rate (OBBBA: permanent 100%) |

### 5.4 Depreciable Basis Calculation

**OZ Depreciable Basis Formula:**
```
Depreciable Basis = (Project Cost + Predevelopment Costs + Loan Fees + Legal/Structuring + Organization Costs)
                  − Land Value
                  − Interest Reserve
                  − Lease-up Reserve
```

> **Important:** Investor equity is **not** excluded from basis. It is a funding source, not a cost exclusion. Reserves are excluded as financing costs, not project costs.

All values in millions. Loan fees (default 1%), legal/structuring costs (default $150K), and organization costs (default $50K) are **additive** to basis.

### 5.5 Federal vs. State Depreciation Breakout

IMPL-090–093 added six breakout fields to the calculation engine output:

| Field | Description |
|-------|-------------|
| `federalDepreciationBenefitYear1` | Year 1 federal depreciation savings |
| `stateDepreciationBenefitYear1` | Year 1 state depreciation savings |
| `federalDepreciationBenefitHoldPeriod` | Years 2–exit federal savings |
| `stateDepreciationBenefitHoldPeriod` | Years 2–exit state savings |
| `federalDepreciationBenefitTotal` | Total federal depreciation savings |
| `stateDepreciationBenefitTotal` | Total state depreciation savings |

State depreciation savings depend on state bonus conformity rate (see Section 12).

### 5.6 NIIT-Aware Depreciation Rate (IMPL-121)

> **Correction deployed IMPL-121 (commit 94be0b5):** Prior versions used a flat 37% federal rate for all investor types when computing depreciation tax savings. This undercounted passive investor savings.

**Correct rates:**

| Investor Type | Depreciation Savings Rate | Statutory Basis |
|--------------|--------------------------|----------------|
| REP + Grouped | `federalTaxRate` + state | No NIIT on nonpassive losses |
| Passive / REP Ungrouped | `federalTaxRate + 3.8%` + state | NIIT applies to passive income offset |

**Impact:** Passive investor depreciation benefits increase by ~10.27% (3.8/37) at the 37% bracket. Affects Returns Buildup Strip, KPI Strip, and Excel export Tax_Benefits sheet.

### 5.7 §461(l) Excess Business Loss Cap

For REP investors, the §461(l) cap limits the annual depreciation deduction:

| Filing Status | 2025 Cap |
|--------------|---------|
| Married Filing Jointly | ~$626,000 |
| Single / HoH | ~$313,000 |

Excess becomes an NOL carryforward under §172 with an 80% taxable income limitation.

---

## 6. Benefit Layer 3 — State LIHTC Programs

### 6.1 Program Overview

25 states offer supplemental state LIHTC. Three structural types:

| Structure | Description | Example States |
|-----------|-------------|---------------|
| **Piggyback** | Auto % of federal allocation | GA (100%), NE (100%), SC (100%), KS (100%) |
| **Supplement** | Additional independent allocation | DC (25%), MO (70%), OH (varies) |
| **Standalone** | Fully independent program | CA, MA, NY, VA |

### 6.2 Treatment Paths

State LIHTC has two distinct treatment paths with different display logic:

| Path | Value | Economic Effect | Returns Strip | Capital Structure Display |
|------|-------|----------------|--------------|--------------------------|
| **Direct Use** | 100% | Increases returns (numerator) | ✅ Row shown | N/A |
| **Syndication** | 85–90% | Reduces investment (denominator) | ❌ No row | ✅ Equity offset shown |

**Rationale:** Syndicated proceeds are return OF capital (reduced cash outlay), not return ON capital (earnings). Adding to Returns Strip would double-count. Net equity denominator uses `syndicatedEquityOffset`.

### 6.3 Key State LIHTC Parameters

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `stateLIHTCEnabled` | Boolean | Auto (from state lookup) | |
| `stateLIHTCPercent` | Percentage | Auto for piggyback | Manual override available |
| `stateLIHTCStructure` | Display | Auto from lookup | Piggyback / supplement / standalone |
| `stateLIHTCTransferability` | Display | Auto from lookup | Transferable vs. non-transferable |
| `stateLIHTCSyndicationRate` | Percentage | 85% | Net realization (70–100%) |

### 6.4 Priority States Analysis

| State | OZ Conformity | Bonus Dep | State LIHTC | Combined Rate |
|-------|-------------|-----------|-------------|--------------|
| OR | ✅ Full | ✅ 100% | ❌ None | 50.7% |
| GA | ✅ Full | ❌ 0% | ✅ 100% | 46.6% |
| NE | ✅ Full | ❌ 0% | ✅ 100% | 47.6% |
| NJ | ✅ Full | ❌ 0% | ⚠️ Grant | 51.6% |
| CA | ❌ None | ❌ 0% | ✅ Yes (PW req.) | 54.1% |
| WA | ✅ Full | ✅ 100% | ❌ None | ~46% |

### 6.5 Prevailing Wage Considerations

California and some other states require prevailing wage compliance for state LIHTC eligibility. Platform surfaces PW warnings when applicable.

### 6.6 KS Sunset Warning

Kansas piggyback LIHTC sunsets in 2028. Platform displays warning for KS properties.

---

## 7. Benefit Layer 4 — Opportunity Zone Enhancement (§1400Z-2)

### 7.1 Three OZ Benefits

| Benefit | Mechanism | Timing | Statutory Basis |
|---------|-----------|--------|----------------|
| **Deferral NPV** | Defer capital gains tax on original investment | Year 0 | §1400Z-2(a) |
| **Recapture Avoidance** | Eliminate §1245/§1250 recapture | Exit | §1400Z-2(c) |
| **Appreciation Exclusion** | Tax-free appreciation on QOF investment | Exit | §1400Z-2(c) |

### 7.2 10-Year Hold Requirement

OZ investors must hold for **10+ years** to receive recapture avoidance and appreciation exclusion under §1400Z-2(c). The OZ clock starts from the investor's **investment date** (not the property PIS date). This is critical: post-PIS investors can still achieve full OZ benefits with their own independent clock.

**Roth Conversion Duration:** 10 years (not 12). Matches the credit-active period.

### 7.3 Exit Tax at OZ Exit

```
OZ Investor (10-year hold):
  §1245 Recapture:           $0 (excluded)
  §1250 Recapture:           $0 (excluded)
  Appreciation Tax:          $0 (excluded)
  Total Exit Tax:            $0
```

### 7.4 OZ 2.0 Compliance Notes

- Post-PIS OZ investment is permissible (confirmed via IRS regs and Reg §1.1400Z2(c)-1(b)(2)(ii)(A) asset sale election)
- 90% asset test compliance required; documentation standards apply
- Substantial improvement requirement does not apply to new capital in stabilized assets
- For new construction deals: verify PAB financing added before PIS for LIHTC conversion option

### 7.5 1722 Summit Avenue Rescue Recap Constraint

Cannot close until **July 2027** per IRC §42(d)(2)(B)(ii). OZ grouping strategy with Trace 4001 and 701 S Jackson must be designed from the outset in the Sidley Austin operating agreement.

---

## 8. Investor Tax Utilization Framework

### 8.1 Two Tracks

The platform classifies every investor into one of two treatment tracks:

| Track | Trigger | Depreciation Treatment | LIHTC Treatment |
|-------|---------|----------------------|----------------|
| **Nonpassive (REP + Grouped)** | REP status + §469(c)(7)(A)(ii) grouping election | Offsets ordinary income; §461(l) cap applies | Reduces tax to §38(c) floor |
| **Passive** | All others | Limited to passive income offset (§469(a)) | Limited to tax on passive income (§469(a)(2)) |

**REP Qualification Requirements (§469(c)(7)):**
- 750+ hours in real property trades/businesses
- More than 50% of personal services in real property
- Material participation in rental activity

### 8.2 §38(c) General Business Credit Floor

For REP (nonpassive) investors, LIHTC credits can reduce federal tax liability down to the §38(c) floor. The floor is approximately **25% of regular tax above $25,000** (i.e., credits cannot reduce tax below ~25% of liability above $25K).

> **Critical Unit Note:** §38(c) ceiling is expressed in **dollars**, not millions. This has been a recurring bug vector in the codebase. TypeScript branded types are the recommended long-term fix (tracked as ISS issue).

### 8.3 NOL Carryforward (REP Track)

When REP depreciation exceeds the §461(l) cap:
- Excess → NOL carryforward
- NOL limited to 80% of taxable income per year (§172)
- No expiration (indefinite carryforward)

### 8.4 §469(g) Disposition Release

At exit, all suspended passive losses and credits are released:
- Suspended passive losses offset ordinary income in exit year
- Suspended credits applied against tax in exit year
- Combined with character-split recapture exposure to compute net exit position

### 8.5 NIIT Three-Source Model

Net Investment Income Tax (3.8%) applicability is determined by three sources:

| Source | Mechanism |
|--------|-----------|
| **Territory auto-detect** | `doesNIITApply()` in `stateProfiles.ts` — U.S. territories excluded |
| **Grouping election** | REP + §469(c)(7)(A)(ii) grouping → no NIIT on rental disposition gain |
| **Income composition analysis** | Default: passive investors subject to NIIT on passive income |

§1411(c)(2)(A): REP investors with proper grouping election are excluded from NIIT on disposition gain.

### 8.6 `calculateTaxUtilization()` Engine

Phase A Tax Utilization Engine — complete. Key inputs and outputs:

**Inputs:**
- `annualPassiveIncome`, `annualOrdinaryIncome`, `annualPortfolioIncome`
- `filingStatus` (MFJ / Single / HoH)
- `investorTrack` (rep / passive)
- `groupingElection` (boolean — REP §469(c)(7)(A)(ii))
- `federalOrdinaryRate`, `stateOrdinaryRate`, `stateCapGainsRate`
- Annual benefit stream (depreciation + LIHTC per year)

**Year-by-Year Output (per `AnnualUtilization`):**

| Field | Description |
|-------|-------------|
| `depreciationGenerated` | Raw K-1 depreciation |
| `depreciationAllowed` | After §461(l) or §469 limit |
| `depreciationSuspended` | Excess (suspended or to NOL) |
| `depreciationTaxSavings` | Allowed × investor-aware rate |
| `lihtcGenerated` | Credits generated |
| `lihtcUsable` | After §38(c) or §469 limit |
| `lihtcCarried` | Added to carry pool |
| `nolGenerated` / `nolUsed` / `nolPool` | NOL tracking (nonpassive) |
| `cumulativeSuspendedLoss` | Running suspended loss (passive) |
| `cumulativeSuspendedCredits` | Running suspended credits (passive) |
| `utilizationRate` | Usable / Generated |

---

## 9. Investor Archetype Classification

### 9.1 Archetype Decision Tree

Phase B3 (IMPL-102–107) classifies every investor into one of five archetypes:

```
Is investor REP?
├── YES:
│   ├── (ordinary + passive) < §461(l) threshold → Archetype A
│   └── (ordinary + passive) ≥ §461(l) threshold → Archetype B
└── NO (Passive):
    ├── passive income = $0 → Archetype E
    ├── passive income < avg annual benefits → Archetype D
    └── passive income ≥ avg annual benefits → Archetype C
```

### 9.2 Archetype Profiles

| Archetype | Label | Fit Rating | Base Score | Annual Benefit Access |
|-----------|-------|-----------|-----------|----------------------|
| **A** | REP with Rental Portfolio | Excellent | 90 | Full — depreciation offsets ordinary income, LIHTC to §38(c) floor |
| **B** | High-Income REP | Very Good | 80 | Full utilization but §461(l) limits depreciation; excess → NOL |
| **C** | Passive Income Investor | Good | 70 | Annual benefits limited by passive income level |
| **D** | Limited Passive Income | Moderate | 40 | Partial annual utilization; substantial disposition release |
| **E** | W-2 Only | Poor (Annual) | 10 | All benefits suspended annually; full release at exit |

### 9.3 Five-Dimension Fit Score

The `InvestorFitResult` includes a composite fit score (0–100) with a 10-point bonus for high utilization. Five scoring dimensions (for batch analysis / Tax Alpha):

| Dimension | Measures |
|-----------|----------|
| Utilization | % of deal's tax benefits actually captured |
| Efficiency | Tax savings per dollar of committed capital |
| Commitment | Capital deployment capacity |
| Credit Absorption | % of LIHTC credits used annually (not carried) |
| IRA Conversion | Value of Roth conversion play using fund's losses |

### 9.4 Key Archetypes for Marketing

| Persona | Profile | Story |
|---------|---------|-------|
| **Sweet Spot REP** | $500K–$1M ordinary, conforming state, no IRA | Clean tax story, predictable returns, highest Sharpe ratio |
| **High-Income REP with Headroom** | $2M+ ordinary with passive income providing §461(l) slack | Scale story; can commit $2M+ |
| **IRA Conversion Play** | $750K+ ordinary, $2M+ IRA | Effective ~3% Roth conversion rate using fund depreciation |
| **State-Constrained** | Sweet Spot REP profile in non-conforming state | Partial benefits; manage expectations |
| **Passive Accumulator** | $3M+ passive, W-2 or business income | Annual absorption; credits reduce passive tax |

---

## 10. Exit Economics & Tax Engine

### 10.1 Exit Structure

**Primary Exit: Year 10–11** (EHS nonprofit ROFR)
- Right of First Refusal granted at closing
- Exit price formula in operating agreement
- No LIHTC recapture (§42(j)(5) nonprofit exception)
- OZ holding requirement: minimum Year 10

### 10.2 Character-Split Recapture (Non-OZ Investors)

> **Replaced flat 25% rate** (used in versions prior to v10.1). Deployed IMPL-094–101. The `depreciationRecaptureRate` parameter has been eliminated from all 12 production locations.

| Character | Property Type | Rate | IRC Authority |
|-----------|--------------|------|--------------|
| **§1245 Ordinary** | Personal property (cost-seg 5-yr / 15-yr) | 37% (ordinary rate) | §1245(a)(1) |
| **§1250 Unrecaptured** | Residential structure (27.5-yr) | 25% max | §1(h)(1)(E) |

**Blended Rate Derivation (20% cost seg):**
```
Blended Rate = (costSegPct × §1245Rate) + ((1 − costSegPct) × §1250Rate)
Example:  (0.20 × 0.37) + (0.80 × 0.25) = 0.074 + 0.200 = 27.4%
```

Note: §1250(a)(1)(A) = $0 additional depreciation for MACRS residential straight-line. Only §1245 property generates ordinary income recapture.

### 10.3 `calculateExitTax()` Engine — 18-Field ExitTaxResult

| Field | Description |
|-------|-------------|
| `sec1245Recapture` | §1245 ordinary income recapture (cost seg / bonus components) |
| `sec1250Recapture` | §1250 unrecaptured gain (structure at 25%) |
| `remainingGainTax` | Appreciation gain at preferential CG rate |
| `niitTax` | 3.8% NIIT on applicable gain |
| `stateExitTax` | Conformity-aware state CG tax |
| `totalFederalExitTax` | Sum of federal components |
| `totalExitTax` | All components combined |
| `appreciationGain` | Total gain above adjusted basis |
| ...+ 10 additional detail fields | See Tax Benefits Spec v6.0 §5.8 |

### 10.4 §38(c) Dollar/Millions Mismatch — IMPL-122

> **Bug fixed IMPL-122 (commit d8fcc68):** §38(c) ceiling was being compared in millions against a value in dollars, causing systematic overcounting (~15% of batch rows affected). Additionally, depreciation savings were being double-counted. Both fixed in IMPL-122.

**Long-term recommendation:** TypeScript branded types (`Dollars` vs `Millions`) to prevent recurrence at the type system level.

### 10.5 Returns Buildup Strip Components

**Currently Deployed:**

| Row | Source | Timing | Condition |
|-----|--------|--------|-----------|
| Federal LIHTC Credits | §42 credit stream | Years 1–11 | Always |
| State LIHTC Credits | State programs (direct use only) | Years 1–10 | If applicable |
| Depreciation Benefits (parent) | Federal + state | Years 1–10 | Always |
| ▸ Federal Depreciation Benefit | Federal rate × depreciation | Years 1–10 | Expandable |
| ▸ State Depreciation Benefit | State rate × depreciation (conforming) | Years 1–10 | Expandable |
| ▸ OZ Deferral NPV | PV of deferred gain — §1400Z-2(a) | Year 0 | OZ only |
| ▸ OZ Recapture Avoidance | §1250 recapture eliminated | Exit | OZ only |
| ▸ OZ Appreciation Exclusion | Tax-free appreciation | Exit | OZ only |
| Operating Cash Flow | NOI after debt service | Years 1–10 | Always |
| Sub-Debt Interest | PIK interest at exit | Exit | Always |
| Exit Proceeds | Sale proceeds after debt payoff | Exit | Always |
| **Exit Tax Cost (negative, red)** | §1245/§1250 + NIIT + state CG | Exit | Non-OZ only |
| ▸ §1245 Recapture | Cost-seg components at 37% | Exit | Expandable |
| ▸ §1250 Unrecaptured Gain | Structure at 25% | Exit | Expandable |
| ▸ NIIT | 3.8% on applicable gain | Exit | If applicable |
| ▸ State Exit Tax | State CG rate | Exit | Investor residence state |

---

## 11. Sizing Optimizer

### 11.1 Objective Function

> **Corrected objective (IMPL-120):** The sizing optimizer maximizes **effective multiple** (tax savings per dollar invested), NOT utilization percentage. Maximizing utilization percentage could favor smaller investments with high utilization at the cost of total value delivered.

```
Effective Multiple = Total Tax Benefit Usable / Committed Capital
```

### 11.2 Algorithm

The optimizer iterates across commitment levels, computing `calculateTaxUtilization()` at each level, and identifies:

| Peak Type | Description |
|-----------|-------------|
| `peak` | Clear optimum — utilization drops on either side |
| `plateau` | Flat region — multiple commitment levels produce similar efficiency |
| `rising` | Still increasing at max tested level — investor has more capacity |

### 11.3 Fund-Level vs. Investor-Level

**Fund-Level Sizing (IMPL-085):** Pool aggregation engine iterates commitment levels, finds peak tax savings efficiency, outputs optimal commitment card + efficiency curve chart for FundDetail view.

**Investor-Level Sizing (IMPL-104):** Per-investor optimal sizing algorithm in `investorSizing.ts` — uses `calculateTaxUtilization()` at each commitment level for a specific investor profile.

### 11.4 Roth Conversion Sizing

For REP + grouped investors, the optimizer runs twice:
1. Base income (optimal investment without Roth conversion)
2. Income + conversion (optimal investment with Roth conversion income)

The delta between the two optimal sizes quantifies the additional capital the Roth strategy can absorb.

---

## 12. State Tax Dual-Track Calculations

### 12.1 Three-Dimension Conformity Model

| Dimension | Question | Impact |
|-----------|----------|--------|
| **OZ Conformity** | Does state follow federal OZ treatment? | State capital gains treatment |
| **Bonus Dep Conformity** | Does state follow §168(k)? | State depreciation savings |
| **State LIHTC** | Does state offer credits? | Additional benefit layer |

### 12.2 State Bonus Conformity Rates

States vary significantly:

| State | Bonus Conformity | Notes |
|-------|-----------------|-------|
| OR, WA, CO | 100% | Full conformity |
| NJ | 30% | Partial conformity |
| CA, NY, MA | 0% | No bonus depreciation |
| Most other states | 100% | Full conformity |

The platform uses `getStateBonusConformityRate()` to look up the conformity rate for the investor's state and applies it to state depreciation savings only (not federal).

### 12.3 OZ Conformity (Independent of State Income Tax)

> **Architecture note (IMPL-066):** OZ conformity is independent of state income tax. Removing `isNonConforming` check from state income tax calculation. OZ conformity affects OZ benefits (deferral, step-up), not state income tax rates.

### 12.4 Two Effective Tax Rates

The engine maintains two distinct effective rates for depreciation:

| Rate | Used For | Formula |
|------|---------|---------|
| `effectiveTaxRateForBonus` | Year 1 bonus depreciation state savings | `fedRate + (stateRate × bonusConformityRate)` |
| `effectiveTaxRateForStraightLine` | Years 2+ MACRS state savings | `fedRate + stateRate` (full rate — all states accept SL) |

---

## 13. Calculation Engine Architecture

### 13.1 Core Files

| File | Role |
|------|------|
| `calculations.ts` | Single source of truth for all tax benefit calculations |
| `computeTimeline.ts` | Date-driven timing engine (IMPL-108–117) |
| `investorTaxUtilization.ts` | §469/§461(l)/§38(c) utilization engine |
| `investorFit.ts` | Archetype classification and fit scoring |
| `investorSizing.ts` | Commitment-level utilization + sizing optimizer |
| `depreciableBasisUtility.ts` | OZ depreciable basis and LIHTC eligible basis |
| `stateProfiles.ts` | 56-jurisdiction state data + `doesNIITApply()` |
| `useHDCCalculations.ts` | React hook wiring engine to UI |

### 13.2 Timing Architecture (IMPL-108–117)

`computeTimeline()` is the master clock. Investment Date drives all downstream timing:

| Input | Controls |
|-------|---------|
| `investmentDate` | OZ clock start, XIRR day-count |
| `pisMonth` | LIHTC Year 1 proration, §42(f)(1) election eligibility |
| `exitExtensionMonths` | Hold period extension |
| `electDeferCreditPeriod` | §42(f)(1) election toggle |

**IRR Calculation:** XIRR with Newton-Raphson, ACT/365.25 day-count convention (replacing integer-year approximation). 10 validation scenarios.

### 13.3 Waterfall Distribution

Three-phase waterfall for exit proceeds:
1. Senior debt payoff
2. Preferred equity accrued return + principal (if applicable)
3. Investor equity distributions per operating agreement

DSCR covenant enforced annually before soft-pay waterfall items.

### 13.4 Architecture Principles

- **Single source of truth:** `calculations.ts` engine values are authoritative. No recalculation in hooks or UI components.
- **No implicit units:** Dollar/millions confusion is the primary bug vector. §38(c) mismatch (IMPL-122) is the canonical example. Branded types are the long-term fix.
- **Tests pass ≠ UI correct:** CC must runtime-verify by starting the dev server and performing specific UI actions. Duplicate file bugs cause "tests pass but UI shows old behavior."
- **Circular verification trap:** Code and tests can both be wrong and still pass. Independent mathematical verification is mandatory.

### 13.5 Export Surfaces

All three export surfaces must be kept in sync:
1. Live Excel (real-time calculations)
2. Comprehensive Report PDF
3. Tax Report PDF

---

## 13A. Platform Screens

The platform has six screens. Three are fully deployed; two are pending. The sixth (Portfolio Manager) is specified but unbuilt. All screens share the same `calculations.ts` engine — the difference is what inputs they apply and how results are displayed.

### Screen 1 — Available Investments (Deal Grid)

**Page:** `InvestmentsStandalonePage`  
**Status:** ✅ Deployed  
**Who uses it:** Investors, wealth managers browsing available fund opportunities

This is the front door of the investor-facing portal. It displays all deals that have been saved by HDC with `completionStatus === 'complete'` and `isInvestorFacing === true`. Each deal appears as a card showing headline return metrics — MOIC, IRR, hold period, and key deal characteristics.

**What it shows per deal card:**
- Project name, location, deal size
- Headline MOIC and IRR
- Hold period and projected exit year
- OZ eligibility indicator
- State LIHTC availability indicator
- Phase B3: Investor fit indicator (archetype badge + optimal commitment amount for the logged-in investor's saved profile, if one exists)

**Data source:** `calculatorService.getAllConfigurations()` — loads pre-saved Deal Benefit Profiles from PostgreSQL. The full calculator re-runs with the investor's saved profile applied at load time to produce personalized fit indicators.

**Navigation:** Clicking a deal card opens Screen 2 (Deal Detail).

---

### Screen 2 — Deal Detail

**Page:** `FundDetailPage` (or equivalent deal detail component)  
**Status:** ✅ Deployed  
**Who uses it:** Investors and wealth managers evaluating a specific deal

The full per-deal analysis view. When the investor has a saved tax profile (Screen 3), this screen personalizes all outputs to their specific tax situation. When no profile exists, it shows a simplified tax planning section.

**What it shows:**
- Full Returns Buildup Strip (all benefit layers, expandable sub-rows)
- KPI Strip: Year 1 Tax Savings, Total Tax Benefits, MOIC, IRR
- Capital structure visualization
- Year-by-year cash flow and benefit schedule
- Tax Utilization Section (if investor profile present): year-by-year breakdown of benefits generated vs. benefits usable, §469/§461(l)/§38(c) constraints, cumulative suspended losses/credits
- Investor Fit Summary Panel (Phase B3): archetype classification (A–E), fit score, key warnings (e.g., "all benefits suspended annually — disposition release only")
- Sizing Optimizer Panel (Phase B3): efficiency curve chart showing tax savings per dollar at each commitment level, optimal commitment amount, peak type (peak/plateau/rising)
- Export controls: Live Excel, Comprehensive Report PDF, Tax Report PDF

**Personalization logic:**
```
if (investor has saved profile) → show TaxUtilizationSection + FitSummaryPanel + SizingOptimizerPanel
else → show SimplifiedTaxPlanningSection (backward compatible)
```

---

### Screen 3 — Investor Tax Profile Editor

**Page:** `InvestorTaxProfilePage`  
**Status:** ✅ Deployed  
**Who uses it:** Investors and wealth managers entering / maintaining investor tax data

Where an investor (or their advisor) enters their tax profile. Supports multiple saved profiles per user — the architectural foundation for the wealth manager's book-of-business use case.

**What it captures:**

| Field Group | Fields |
|-------------|--------|
| **Income Composition** | Annual ordinary income (W-2 / active business), annual passive income (K-1 rental / fund income), annual portfolio income (dividends, interest, capital gains), asset sale gain |
| **Filing Status** | MFJ / Single / HoH |
| **Investor Track** | REP or Non-REP; §469(c)(7)(A)(ii) grouping election toggle (conditional on REP) |
| **Tax Rates** | Federal ordinary rate, federal CG rate, investor state (auto-populates state ordinary + CG rates) |
| **IRA / Roth** | Traditional IRA balance (feeds IRA Conversion Play archetype analysis) |

**Phase B4 addition (pending):** Each profile will gain a trajectory tab — a forward-looking year-by-year income projection with discrete event inputs (business exit, retirement, Roth conversion, relocation, marriage/divorce) to model how income changes over the hold period affect annual benefit utilization.

**How profiles connect to other screens:**
- Screen 2 uses the active profile to personalize Deal Detail
- Screen 6 (Portfolio Manager) loads all profiles to evaluate a full client book against one deal
- Screen 5 (Portfolio Dashboard) uses all profiles to show capacity alerts and commitment pipeline across fund vintages

---

### Screen 4 — Pool / Fund View

**Page:** New screen — built in Phase C  
**Status:** ✅ Engine deployed (IMPL-085); **UI screen not yet built**  
**Who uses it:** Investors and wealth managers evaluating the full American Housing Fund (multi-deal pool)

The pool view shows the American Housing Fund as a whole — multiple deals aggregated into a single consolidated benefit stream. This is where staggered deal entry creates value: a fund with three deals entering in Years 1, 2, and 3 produces a benefit stream that covers more years than any single deal would alone.

**Engine — what's already deployed (`aggregatePoolToBenefitStream()`):**
- Takes N Deal Benefit Profiles, each with a `fundYear` offset
- Aligns depreciation and LIHTC schedules to calendar years (not deal years)
- Sums annual depreciation, LIHTC, and operating cash flow across all deals
- Keeps exit events separate per deal (sorted chronologically)
- Converts from dollars to millions at the utilization engine boundary
- Feeds the same `calculateTaxUtilization()` engine — pool is just a larger benefit stream

**What the UI screen will show (not yet built):**
- Fund-level Returns Buildup Strip (aggregated across all deals)
- Staggered entry timeline — when each deal's benefits start and end
- Optimal commitment at the fund level (not per-deal)
- How Year 2 and Year 3 deal entries extend benefit coverage for investors who joined in Year 1

**Current workaround:** Pool analysis runs in the backend; no dedicated UI surface exists. Investors see individual deal cards on Screen 1 but cannot currently view the combined fund economics in one view.

---

### Screen 5 — Portfolio Dashboard

**Page:** New screen — Phase B4  
**Status:** ❌ Not built (pending Phase B4 / Annual Tax Capacity Model)  
**Who uses it:** Power users (wealth managers) monitoring multiple clients across fund vintages

The portfolio dashboard is the wealth manager's ongoing monitoring tool — not a one-time analysis screen, but a recurring view for managing a book of clients already invested or being evaluated for investment.

**What it will show:**
- Client grid: one row per saved investor profile
- Per-client columns: archetype, current utilization rate, optimal commitment (this vintage), capacity alert (over/under-invested)
- Trajectory columns (B4): projected utilization in future years given anticipated income changes, optimal vintage timing, capacity trend (growing / stable / declining)
- Batch operations: evaluate all clients against a new deal with one click
- Commitment pipeline: clients at different stages (evaluating / committed / invested)

**Dependency:** Requires Phase B4 (Annual Tax Capacity Model) to be meaningful. The static columns (archetype, current utilization) are available from B3; the trajectory columns require the forward-looking income projection engine.

---

### Screen 6 — Portfolio Manager (Per-Deal Multi-Profile View)

**Page:** New screen — specified, unbuilt  
**Status:** ❌ Not built (Spec v2.1 complete, zero code exists, IMPL not yet assigned)  
**Who uses it:** Wealth managers evaluating a full client book against a specific deal in a single session

The Portfolio Manager is distinct from the Portfolio Dashboard (Screen 5). The Dashboard monitors clients over time across vintages. The Portfolio Manager is a point-in-time tool: "I have this deal — which of my clients fit it, and what should each one commit?"

**How it works:**
- Wealth manager selects one deal from Screen 1
- Platform loads all saved investor profiles (`GET /api/investor-tax-info`)
- Engine runs `calculateFullInvestorAnalysis()` across every profile with deal params held constant
- Results display as a sortable, filterable table — one row per client

**Table columns (per spec v2.1):**
- Client name / profile name
- Archetype (A–E)
- Fit score (0–100)
- Annual utilization %
- Optimal commitment amount
- MOIC at optimal commitment
- Key warnings (e.g., "§461(l) cap — excess to NOL", "all benefits suspended")
- Phase B4: Trajectory Utilization, Capacity Trend, Optimal Vintage

**Row click:** Drills into Screen 2 (Deal Detail) with that client's profile applied — the wealth manager can review the full personalized analysis for any client in one click.

**Architecture note:** No new engine code required. Same `calculateFullInvestorAnalysis()` used everywhere; Portfolio Manager just calls it in a map across N profiles.

---

### Screen Summary

| Screen | Name | Status | Primary User | Key Capability |
|--------|------|--------|-------------|---------------|
| 1 | Available Investments | ✅ Built | Investor / Advisor | Browse deals; see personalized fit indicators |
| 2 | Deal Detail | ✅ Built | Investor / Advisor | Full per-investor tax analysis, sizing optimizer |
| 3 | Investor Tax Profile Editor | ✅ Built | Investor / Advisor | Enter income profile; supports multiple profiles per user |
| 4 | Pool / Fund View | ⚠️ Engine only | Investor / Advisor | See the full AHF as a pooled benefit stream |
| 5 | Portfolio Dashboard | ❌ Not built | Wealth Manager | Monitor client book across vintages over time |
| 6 | Portfolio Manager | ❌ Not built | Wealth Manager | Evaluate full client book against one deal simultaneously |

---

## 14. Platform Implementation Status

### 14.1 IMPL Summary (as of Registry v4.1, 2026-03-08)

| Range | Description | Status |
|-------|-------------|--------|
| IMPL-001–083 | Phases 1–16: Core build through capital stack enhancement | ✅ All deployed |
| IMPL-084 | B2 save-flow wiring | ✅ Deployed |
| IMPL-085 | Pool aggregation + fund sizing optimizer | ✅ Deployed |
| IMPL-086 | Computed hold period engine | ✅ Deployed |
| IMPL-087 | Exit-month precision | ✅ Deployed |
| IMPL-088–089 | Reserved buffer | — Not used |
| IMPL-090–093 | Federal/state depreciation breakout | ✅ Deployed |
| IMPL-094–101 | Stage 5.5 Exit Tax Engine | ✅ Deployed |
| IMPL-102–107 | Phase B3 Investor Fit & Archetype | ✅ Deployed |
| IMPL-108–117 | Timing Architecture Rewire | ✅ Deployed |
| IMPL-118 | First-Year LIHTC Applicable Fraction | ✅ Deployed |
| IMPL-119 | NIIT-Aware Depreciation Benefit | ✅ Deployed |
| IMPL-120 | OZ exit tax call-site fix + sizing optimizer objective corrected | ✅ Deployed |
| IMPL-121 | NIIT-aware depreciation rate in `calculateTaxUtilization()` | ✅ Deployed |
| IMPL-122 | §38(c) unit mismatch fix + depreciation savings overcounting | ✅ Deployed |
| IMPL-123+ | Available for future work | — |

**Total deployed: 122 IMPLs**

### 14.2 Test Coverage

| Date | Tests | Suites | Status |
|------|-------|--------|--------|
| 2026-03-08 (Registry v4.1) | ~1,817+ | 90+ | 0 failures |
| 2026-02-18 (v11.0 / Registry v3.0) | 1,733 | 86 | 0 failures |
| 2026-02-17 | 1,583 | 82 | 0 failures |
| 2026-02-11 | 1,230 | 77/78 | 0 failures |

*Post-IMPL-119 through IMPL-122 exact count to be confirmed by CC.*

### 14.3 Phase Completion

| Phase | Description | Status |
|-------|-------------|--------|
| Phase A | Tax Utilization Engine | ✅ Complete |
| Phase B1 | Portal Wiring | ✅ Complete |
| Phase B2 | DBP Infrastructure + Backend | ✅ Complete |
| Phase B3 | Fit & Archetype Classification | ✅ Complete |
| Phase B4 | Annual Tax Capacity Model | 🔴 Blocked on Angel (backend tables) |
| Phase C | Pool Aggregation | ✅ Complete (pulled forward) |

---

## 14A. How the App Receives Data Today

### 14A.1 Primary Path — Manual Entry via 7 Input Panels

All deal parameters are entered directly into the UI by the HDC team. Each panel maps to a logical grouping of `CalculationParams` fields, which flow into `useHDCState` → `useHDCCalculations` → `calculations.ts`:

| Panel | Key Inputs |
|-------|-----------|
| **1 – Project Definition** | Project cost, land value, predevelopment costs, Year 1 NOI, operating expense ratio, property state |
| **2 – Capital Structure** | Investor equity %, philanthropic equity %, senior debt (%, rate, amortization, IO years), HDC sub-debt, investor sub-debt, outside investor sub-debt, PIK rates, current pay options, interest reserve months |
| **3 – Tax Credits** | LIHTC toggle, applicable fraction, PIS month, DDA/QCT boost, PAB settings, eligible basis exclusions |
| **4 – Opportunity Zone** | OZ type (standard/rural), OZ version (1.0/2.0), deferred capital gains, CG tax rate |
| **5 – Investor Profile** | Investor state, federal/state ordinary rates, CG rates, investor track (REP/Non-REP), passive gain type, income composition (W-2, business, passive, portfolio, asset sale, IRA), grouping election |
| **6 – Projections** | Hold period, NOI growth rate, exit cap rate, cost seg %, construction delay months, investment date, exit extension months, §42(f)(1) election toggle |
| **7 – State LIHTC** | Syndication rate, investor state tax liability toggle, state LIHTC percentage override |

There is no automated data ingestion from the Excel waterfall model today. Numbers are read from the Excel model and typed into the panels manually. This is the primary friction point in the current deal setup workflow.

### 14A.2 Saved Configurations — PostgreSQL via REST API

When a user saves a deal, the full `CalculationParams` snapshot is persisted to PostgreSQL via the Spring Boot backend (`/api/deal-conduits`). On subsequent loads:

- `calculatorService.getAllConfigurations()` fetches all saved deals, filtered to `completionStatus === 'complete' && isInvestorFacing === true`, for the Deal Grid (Screen 1)
- Loading an individual deal repopulates all 7 panels from the saved record
- The saved DB record is the source of truth for display — the Trace 4001 unit count bug (showing 100 instead of correct 195) is a corrupted saved record, not a code bug

### 14A.3 Deal Benefit Profile (DBP) Extraction — Triggered at Save

When `isInvestorFacing === true` in `SaveConfiguration.tsx`, the platform automatically extracts a Deal Benefit Profile from the engine results and persists it separately to PostgreSQL. The DBP is a normalized, investor-facing packaging of the engine's outputs — not a recalculation.

Key extraction notes (from CC audit corrections):
- `CashFlowItem` does NOT have a `depreciationLoss` field — extract from `DepreciationSchedule`
- LIHTC field is `federalLIHTCCredit` (not `lihtcCredits`)
- State LIHTC field is `stateLIHTCCredit`
- `totalInvestment` is GROSS equity; `syndicatedEquityOffset` exists separately

The Deal Grid and Deal Detail screens (Screens 1–2) consume the pre-extracted DBP rather than re-running the full calculator.

### 14A.4 Investor Tax Profiles — Separate API Endpoint

Investor income composition and tax data lives in its own `investor_tax_info` table. It is loaded independently from deal data via `GET /api/investor-tax-info` and returns all profiles for the current user.

The engine merges deal params and investor profile at calculation time:

```
profiles.map(p => calculateFullInvestorAnalysis({ ...dealParams, ...profileToCalcParams(p) }))
```

No engine changes are required when switching investor profiles — the same `calculations.ts` engine handles both deal-level and investor-level inputs.

### 14A.5 Data Flow Summary

```
Excel Waterfall Model
      ↓  (manual transfer — no automation today)
7 Input Panels (UI)
      ↓
useHDCState  →  React state management
      ↓
useHDCCalculations  →  prop assembly + memoized sub-calculations
      ↓
calculations.ts  →  engine (single source of truth)
      ↓
InvestorAnalysisResults  →  all UI display, exports
      ↓  (on save, isInvestorFacing = true)
extractDealBenefitProfile()  →  DBP packaging
      ↓
Spring Boot REST API  →  PostgreSQL
      ↑  (on load)
Deal Grid / Deal Detail / Portfolio Manager screens
```

Investor tax profiles travel a parallel path:
```
InvestorTaxProfilePage (Screen 3)
      ↓  (manual entry)
GET/POST /api/investor-tax-info
      ↑  (Portfolio Manager batch load)
profiles.map(calculateFullInvestorAnalysis)
```

### 14A.6 What Does Not Exist Yet

| Capability | Status |
|-----------|--------|
| Automated Excel-to-calculator mapping | Not built. Phase 1 (documented mapping spec) → Phase 2 (assisted import) → Phase 3 (integrated pipeline) defined in Platform Vision doc but unimplemented |
| Deal ingestion engine (structured input → CalculationParams) | Not built |
| CI/CD pipeline with test gates | Not built (tests run manually) |
| Object-level authorization (deal isolation by user) | Not built — any authenticated user can access any deal by ID (known security gap, pre-launch blocker per Proforma Engine Spec) |

---

## 15. Open Issues & Future Workstreams

### 15.1 Active Open Issues (Non-Blocking)

| Issue | Description | Priority |
|-------|-------------|---------|
| PDF report generation bug | Conflates gross exit value (~$60M) with net investor returns (~$35M) | High |
| **Screen 4 Pool View — engine deployed, no UI** | `aggregatePoolToBenefitStream()` is live and tested (IMPL-085, 45 tests). Investors cannot currently view combined AHF fund economics in one place — they only see individual deal cards on Screen 1. A dedicated Pool View screen needs to be built. | High |
| Trace deal unit count | Shows 100 instead of correct 195 (saved DB record, not code bug) | Medium |
| OZ Benefits strip | Does not surface state tax and NIIT savings components explicitly | Low (pre-existing) |

### 15.2 Next Implementation Priorities

| Item | Status | IMPL |
|------|--------|------|
| Tax Efficiency Map Step 3 — batch validation | Prompt ready | IMPL-123 |
| PDF report bug fix | 8-question CC audit prompt drafted | TBD |
| Screen 4 Pool View UI | Engine complete; UI screen not yet built | TBD |
| Portfolio Manager §9.7 / Screen 6 | Spec v2.1 complete, zero code exists | TBD |
| Phase B4 Annual Tax Capacity Model | Blocked on Angel (backend tables) | TBD |
| State Tax Conformity backend table | Q1 2026 priority; Spec v1.0 complete 2025-11-28 | TBD |
| Capital Account Ledger | Spec v1.0 ready; 2 CC audit items blocking | TBD |
| REP Tax Impact Visualizer | Spec v1.2 complete | TBD |
| Tier 3 / v5.0 deck (layperson version) | Scoped as v5.0 workstream | TBD |

### 15.3 Active Deals

| Deal | Location | Size | Status | Notes |
|------|---------|------|--------|-------|
| Trace 4001 | Seattle | $65M | Active | Reference deal for Tax Efficiency Map; 3.76× MOIC, 12-year hold |
| 701 S Jackson | Seattle | TBD | New construction | Active |
| 1722 Summit Avenue | TBD | TBD | Rescue recap | Cannot close until July 2027 per §42(d)(2)(B)(ii) |

### 15.4 Constitution Update Protocol

At end of each session: check for new standards/protocols/decisions. If yes, CC prompt to update `/docs/constitution/` before ending. Part of all DoDs.

---

## 16. Platform Roadmap

This section documents the full forward-looking build agenda — everything on radar beyond the current sprint. Items are organized by horizon: near-term (specced and queued), medium-term (vision with companion specs), and long-term (architectural north star).

### 16.1 Near-Term — Specced and Queued

These items have written specifications and are waiting on either implementation resources or prerequisite work.

#### Capital Account Ledger

**Spec:** v1.0 complete  
**Status:** Blocked on two CC pre-implementation audit items  
**Blocking items:**
1. Construction period depreciation display handling — how the ledger shows the period before PIS
2. Gross depreciation exposure in `calculations.ts` — audit needed before write-back decisions are made

**Scope:** Partnership-level capital account tracking. §1245 and §1250 recapture as separate line items. Reporting-only (no write-back to the exit engine). Append-only ledger that grows over the hold period and serves as the foundation for K-1 support and investor reporting.

---

#### Portfolio Manager — Screen 6

**Spec:** Multi-Profile Portfolio Manager Spec v2.1 complete  
**Status:** Zero code exists; IMPL not yet assigned  
**Scope:** Wealth manager evaluates full client book against one deal simultaneously. Batch `calculateFullInvestorAnalysis()` across all saved investor profiles, results as sortable/filterable table (one row per client), row click drills into Screen 2 with that profile applied. No new engine code required.

---

#### Phase B4 — Annual Tax Capacity Model

**Spec:** Complete  
**Status:** Blocked on Angel (backend tables for `annual_tax_positions`)  
**Scope:** Transforms investor profile from a point-in-time snapshot to a forward-looking trajectory. Wealth manager inputs anticipated income changes over the hold period — business exits, retirement, Roth conversions, relocations. Platform shows how each event shifts annual benefit utilization, flags years where utilization drops, and identifies optimal vintage timing. Feeds trajectory columns into Screen 5 (Portfolio Dashboard) and Screen 6 (Portfolio Manager).

---

#### Screen 4 — Pool View UI

**Engine:** ✅ Deployed (IMPL-085)  
**UI:** ❌ Not built  
**Scope:** Dedicated investor-facing screen showing the American Housing Fund as a whole — aggregated benefit stream across all deals, staggered entry timeline, fund-level optimal commitment, year-by-year coverage map showing how Deal 2 and Deal 3 extend benefit coverage for Year 1 investors.

---

#### Screen 5 — Portfolio Dashboard

**Status:** Architecture locked; UX open  
**Dependency:** Phase B4 for trajectory columns; B3 columns (archetype, utilization) are available now  
**Scope:** Wealth manager's ongoing monitoring tool. Client grid with per-client utilization rate, capacity alert (over/under-invested), commitment pipeline, batch deal evaluation.

---

#### Tax Efficiency Map — Batch Analysis

**Spec:** v1.1 complete  
**Status:** Step 3 (batch validation against real data) prompt ready  
**Scope:** Run the tax utilization engine across ~3.1M investor profile × investment size combinations for a given deal, producing a complete efficiency map. Outputs: income/investment heatmaps, constraint identification by segment, Roth conversion surface, top-25 archetype deep-dive, segmentation data for Caprock conversations. Batch runner in `frontend/scripts/`, Node.js, no Python.

---

#### State Tax Conformity Backend Table

**Spec:** State Conformity Enhancement Spec v1.0 (2025-11-28)  
**Status:** Q1 2026 priority; not yet implemented  
**Scope:** Move state conformity data (bonus depreciation conformity by state, OZ conformity, state LIHTC program details) from hardcoded frontend lookup tables into a configurable backend data layer. Each state record: conformity type, IRC conformity date, §168(k) treatment, §163(j) treatment, state LIHTC availability, effective date, last verified date. Flag states where last verified >90 days as "provisional." Quarterly update cadence.

---

### 16.2 Medium-Term — Vision with Companion Specs

These items have architectural specifications but no implementation specs or IMPL assignments yet.

#### Proforma Engine (Excel Replacement — Layers 1–3)

**Spec:** HDC Proforma Engine Spec v2.0 (February 2026)  
**Status:** Specified, not built  
**Why it matters:** The current platform requires manual transfer of numbers from the Excel waterfall model into the 7 calculator input panels. This is the primary operational friction in deal setup and the primary source of human error. The Proforma Engine eliminates that friction.

**Three-layer architecture:**

| Layer | Description | Status |
|-------|-------------|--------|
| **Layer 1 — Standardized Deal Schema** | Canonical data model representing any project-level proforma in normalized format. The typed contract between the proforma engine, tax benefits engine, and investor portal. | Not built |
| **Layer 2 — Calculation Engine** | Pure math layer. Given a standardized deal schema, computes monthly/annual cash flows, debt service, NOI, distributable cash flow, waterfall distributions, IRR, promote splits. Configurable per deal. | Not built |
| **Layer 3 — Ingestion Layer** | Takes an external Excel proforma and maps it into the standardized schema. Classifies cells (input vs. formula vs. cross-sheet link), identifies revenue model, expense structure, debt terms, waterfall logic. Human-guided mapping for unusual structures. | Not built |

**Publication interface:** A defined subset of the standardized deal schema maps to the Tax Benefits Engine's `CalculationParams`. This mapping is a typed contract — changes to either engine require explicit schema migration.

**Build sequence (7 phases per spec):**
1. Core data model + unit tests
2. Revenue + expense modules
3. Equity structure + crystallization snapshots
4. Debt service + proforma (iterative solver for circularity)
5. Ingestion layer (Excel → schema, first target: Atrium Court)
6. Generalization (additional deal types)
7. Publication interface (proforma engine outputs → Tax Benefits Engine inputs)

**Validation standard:** Round-trip comparison — Excel → ingest → compute → compare cell-by-cell against original Excel. Any discrepancy >0.01% on XIRR is a flag.

---

#### Deal Ingestion Tool

**Spec:** Covered in Proforma Engine Spec v2.0 (Layer 3) and Platform Vision v1.0 (Part 4)  
**Status:** Not built  
**Scope:** Upload an Excel proforma, platform classifies cells, identifies structure, presents human-guided mapping interface for ambiguous elements, populates the standardized deal schema. First ingestion target is Atrium Court.

**Evolution path:**
- **Phase 1 — Documented mapping:** Formal spec of which Excel cell → which calculator field. Manual transfer continues with a defined protocol. (Partially done — mapping is implicit in current panel structure but not formally documented.)
- **Phase 2 — Assisted import:** Upload Excel, platform reads mapped cells, human confirms before acceptance.
- **Phase 3 — Integrated pipeline:** Platform reads deal assumptions directly, Excel becomes an export format rather than the source of truth.

---

#### Deal Lifecycle Architecture (Three-State Model)

**Spec:** Platform Vision: Deal Lifecycle Architecture v1.0 (February 2026)  
**Status:** Vision only — no implementation specs yet  

The platform currently treats deals as static snapshots. The lifecycle architecture introduces three coexisting states for every deal:

| State | What It Is | Who Uses It | Mutability |
|-------|-----------|-------------|-----------|
| **Living Model** | Current best understanding of deal economics — costs as they come in, actual vs. projected performance | HDC deal team, asset managers | Continuously updated; every material change creates a new version |
| **Locked Investment Basis** | Immutable snapshot frozen at the moment investors commit capital — the contractual projections investors underwrote against | Investors, CPAs, legal, compliance | Never modified. Ever. Legal record of what investors were shown. |
| **Performance Ledger** | Append-only audit trail tracking every material change from locked basis to current actuals over the full hold period | Fund administrators, IR, CPAs, auditors | Append-only; new versions added, old versions never modified |

**Platform implications of the Locked Investment Basis:**
- Write-once, read-many storage
- Legal-grade timestamp and attribution
- Must be reproducible — given locked parameters, engine produces identical results at any future date
- DBP (Deal Benefit Profile) concept already embodies this; the implementation extends it to enforce immutability formally

**Platform implications of the Performance Ledger:**
- Temporal queries: "What did this deal look like on March 15, 2027?"
- Comparison queries: "How do current projections compare to what investors were shown?"
- Annual K-1 support — actual tax benefits delivered vs. projected
- Exit reconciliation — final performance vs. original projections

---

#### Capital Account Ledger (Medium-Term Extension)

Beyond the near-term reporting-only version, the full capital account ledger tracks:
- Opening capital account balance per investor
- Annual adjustments: income allocations, loss allocations, distributions, contributions
- §1245 recapture exposure as a running balance (separate line item)
- §1250 recapture exposure as a running balance (separate line item)
- Closing balance per year
- Exit reconciliation: actual vs. projected recapture

---

#### Investor Reporting

**Spec:** Anticipated (not yet written) — depends on Performance Ledger  
**Scope:** Investor-facing reporting showing actual performance vs. original projections, annual tax benefit delivery vs. K-1, exit reconciliation. Bridges the Performance Ledger to individual investor views.

---

---

#### Canonical Deal Schema — Four-Flow Convergence Model

**Spec:** HDC Canonical Deal Schema Spec v1.0 (April 2026)
**Status:** Specified, not built
**Why it matters:** The canonical schema is the typed contract the entire platform is built around. It defines every field in the HDC deal model, its source category, validation rules, and system mapping. Without it, the deal ingestion engine, proforma engine, CIE integration, and investor portal all have inconsistent field definitions that create data integrity problems at the seams.

**Five source categories:**

| Category | Label | Field Count | Source |
|---|---|---|---|
| A | Developer model | 27 | CIE extracts from Excel |
| B | HDC structuring | 48 | Analyst enters in app |
| C | Platform intelligence | 8 | Geospatial + state tables |
| D | Investor profile | 22 | Investor record, merged at calculation time |
| E | Derived / default | 7 | Engine computes |
| **Total** | | **112** | |

**Database footprint:** 13 deal tables, change log, snapshot table, engine version registry, subscription tables, document storage, communication log. All designed so Phase 2 audit features activate on a schema that already supports them.

**Build sequence dependency:** Canonical schema must be reviewed by Angel before any Phase 1 deal tables are created. Schema decisions made retroactively require migrations, data backfills, and broken provenance chains.

---

#### Claude in Excel (CIE) Integration — Category A Field Extraction

**Spec:** HDC Canonical Deal Schema Spec v1.0 §10 + HDC Deal Ingestion Engine Spec v1.0 (April 2026)
**CIE Capability Baseline:** CIE Capability Audit Log Entry 1.0, April 11, 2026
**Status:** Spec complete; not yet built
**Why it matters:** The ingestion engine spec was originally written assuming a batch parser. CIE changes the model to a multi-agent interactive conversation — CIE reads the developer's Excel model, populates the HDC canonical Excel template via named ranges, and hands off to the analyst for review before publish. This eliminates manual re-entry of 27 Category A fields and reduces analyst workload from 2-4 hours to 15-30 minutes per deal.

**Revised workflow:**
1. Developer submits Excel model
2. All developer files and HDC canonical template are open in Excel with CIE active
3. Standard ingestion prompt triggers CIE: extracts all 27 Category A fields with confidence scoring, cross-validates between files, looks up Category C fields from HDC reference tables in Python sandbox, populates canonical template named ranges
4. Analyst reviews 3-5 flagged exception fields, resolves inconsistencies, completes Category B fields in app
5. One-click publish: app reads named ranges, validates, creates deal profile
6. Publish event triggers snapshot

**Key CIE architecture note:** CIE is prompt-driven, not event-driven. It has no file-watching capability. There is no "live mirror." When developer files update, an analyst re-runs the ingestion prompt. See CIE Capability Audit Log v1.0 for empirical baseline.

---

#### Deal Snapshot and Versioning System (Phase 2 Audit Architecture)

**Spec:** HDC Deal Snapshot and Versioning Spec v1.0 (April 2026)
**Status:** Spec complete; not yet built
**Why it matters:** The platform needs to track changes to both the deal model (inputs) and the underlying calculation engine (code) in a way that is Novogradac-auditable and investor-defensible without the complexity of full append-only event sourcing.

**Design:** Mutable current state + lightweight change log + immutable snapshots at publish events.

**Core rules:**
1. Every publish event creates a snapshot automatically — no analyst discretion required
2. Only one snapshot per deal can have `status = 'active'` at any time
3. Snapshots are insert-only — never updated, never deleted
4. Every field change is recorded in `deal_change_log` with who, what, when, old value, new value
5. Engine version is stamped on every snapshot — enables detection of calculation changes vs. input changes

**Snapshot lifecycle:**
```
Deal created (draft)              → no snapshot
Deal published to platform        → Snapshot 1 created and locked (AUTOMATIC)
Subscription agreements signed    → linked to Snapshot 1 snapshot_id (immutable)
Model updated and republished     → Snapshot 2 created, Snapshot 1 → superseded (AUTOMATIC)
Affected investors notified       → investor_snapshot_history populated for all Snapshot 1 subscribers
```

**Relationship to three-state model (Platform Vision v1.0):** The snapshot system is the implementation of the "Locked Investment Basis" concept from the prior vision. The deal snapshot and change log together serve the function of the "Performance Ledger." This spec supersedes the prior vision's lifecycle section for implementation purposes.

---

#### Investor Portal — Fund Administration Layer

**Spec:** HDC Investor Onboarding and Subscription Spec v1.0 (April 2026) + HDC Platform Product Roadmap v2.0 Tracks 4–5
**Status:** Spec complete; not yet built
**Why it matters:** The platform is evolving from a deal modeling tool into a self-contained fund administration system. The investor portal is the interface through which investors view their holdings, access documents, receive notifications, and acknowledge model updates.

**Scope defined:**

| Layer | Description | Priority |
|---|---|---|
| Deal Management | Proforma engine, canonical schema, CIE ingestion, versioning | Before fund open |
| Fund Administration | Snapshot publishing, subscription mgmt, accreditation, capital calls | Before fund open |
| Investor Portal | Investor-facing views, document access, snapshot history, communications | Before first close |
| Document Management | DocuSign integration, cloud storage, doc-to-record linking | Before first close |
| Compliance + Reporting | K-1 linkage, AML/KYC, beneficial ownership, audit export | Post-first close |

**Key design decisions:**
- Subscription agreement execution is the legal trigger that links an investor to a snapshot — not soft circles
- Accreditation verification (90-day window) tracked per investor, flagged on expiration
- Documents stored natively in platform, linked to deal, investor, and snapshot records
- Communication log attached to each investor record
- Built natively in Spring Boot / PostgreSQL / React — this platform is itself a product

---

#### AHF Deal Sourcing — Four-Lane Taxonomy

**Spec:** AHF Deal Sourcing Brief v1.1 (April 2026)
**Status:** Complete — operational document for sourcing team
**Why it matters:** Defines HDC's four deal entry points for AHF fund sourcing. Documents risk profiles, economics, execution requirements, and soft source strategy for each lane. Includes current AHF Fund I pipeline (701 S Jackson, 4448 California Ave SW, Trace 4001).

**Four lanes:**

| Lane | Description | Overall Risk | Stack Rank |
|---|---|---|---|
| 1 | Mid-construction LIHTC conversion (private dev near PIS, HDC adds PABs) | Low | 2 |
| 2 | Allocation in hand, stack incomplete | Medium | 1 |
| 3 | Full stack, replace burdensome layers | Medium | 4 |
| 4 | Pre-construction, no LP in place | Highest | 3 |

**Current pipeline:** 701 S Jackson (202 units, Lane 4), 4448 California Ave SW (88 units, Lane 1), Trace 4001 (195 units, Lane 1). All three require PABs and 4% LIHTC from WSHFC.

**Next workstream:** State allocation process map — per-state QAP, PAB calendar, application window, and timeline for each target state. Required before multi-state sourcing scales.

---

### 16.3 Long-Term — Architectural North Star

These items represent the full vision for the platform. They inform architectural decisions made today (don't paint into corners) but are not competing with operational Fund 1 deliverables.

#### Central Math Engine (Excel Elimination)

**Status:** Long-term vision  
**What it means:** The Proforma Engine (Layer 2) eventually absorbs the waterfall logic currently living in the Excel model. At full maturity, the Excel model becomes an optional export format rather than the source of truth. The platform becomes the authoritative calculation system for deal economics. No implementation spec exists; this is the destination, not the next step.

**Sequencing principle:** The current calculator must be fully operational before lifecycle features are built. Lifecycle features must be proven before Excel replacement is attempted. Each stage earns the right to the next.

#### CI/CD Pipeline with Test Gates

**Status:** Not built (known gap)  
**Current state:** 1,800+ tests exist across 90+ suites but run only when a developer manually triggers them. No GitHub Actions, no PR gates, no coverage reporting. 
**Required for:** First 3–4 deals to secure PABs and issue LIHTC credits (per Proforma Engine Spec Ship-Readiness Assessment — classified as "Must Ship").

#### Object-Level Authorization

**Status:** Not built (security gap — pre-launch blocker)  
**Current state:** Any authenticated user can access any deal configuration by ID. JWT authorities are set to an empty list. Roles exist in the database but are never enforced.  
**Required for:** Investor data isolation before any external users access the platform.

---

### 16.4 Roadmap Summary

| Item | Horizon | Spec Exists | Blocking Factor |
|------|---------|-------------|----------------|
| Capital Account Ledger (reporting-only) | Near-term | ✅ v1.0 | 2 CC audit items |
| Portfolio Manager Screen 6 | Near-term | ✅ v2.1 | Resources |
| Phase B4 Annual Tax Capacity | Near-term | ✅ Complete | Angel (backend tables) |
| Screen 4 Pool View UI | Near-term | ✅ Engine complete | Resources |
| Screen 5 Portfolio Dashboard | Near-term | Architecture locked | B4 dependency |
| Tax Efficiency Map batch analysis | Near-term | ✅ v1.1 | Prompt ready |
| State Conformity backend table | Near-term | ✅ v1.0 | Resources |
| Proforma Engine (3-layer) | Medium-term | ✅ v2.0 | Operational readiness |
| Deal Ingestion Tool | Medium-term | ✅ (in Proforma Spec) | Proforma Engine |
| Deal Lifecycle (3-state model) | Medium-term | ✅ Vision v1.0 | Deal State Mgmt spec needed |
| Performance Ledger | Medium-term | ✅ Vision v1.0 | Deal Lifecycle |
| Investor Reporting (K-1 support) | Medium-term | ❌ Not yet written | Performance Ledger |
| CI/CD pipeline + test gates | Near-term | ❌ Not yet written | Priority |
| Object-level authorization | Near-term | ❌ Not yet written | Priority (pre-launch blocker) |
| Central Math Engine (Excel replacement) | Long-term | ❌ Not yet written | All above |

---

## 17. Statutory Authority Reference

### 16.1 Core Benefit Generation

| IRC Section | Provision | Platform Implementation |
|------------|-----------|------------------------|
| **§42** | Low-Income Housing Tax Credit | 4% credits; 10-year period with Year 1 proration and Year 11 catch-up; applicable fraction; DDA/QCT 130% basis boost; PIS month timing |
| **§42(d)(2)(B)(ii)** | Rehabilitation requirement | 1722 Summit Avenue cannot close until July 2027 |
| **§42(f)(1)** | First-year election | Defer Year 1 credit to Year 2; toggle in UI; auto-disabled for January PIS |
| **§42(j)(5)** | LIHTC nonprofit recapture exception | Enables EHS exit without recapture |
| **§168** | MACRS depreciation | 27.5-year straight-line for §1250; 5-yr/15-yr for §1245 cost-seg components |
| **§168(b)(3)(A)** | Mandatory straight-line | Required for residential rental under MACRS |
| **§168(k)** | Bonus depreciation | 100% first-year expensing on §1245 components; permanent per OBBBA |
| **§1400Z-2** | Opportunity Zone | Deferral NPV, basis step-up, appreciation exclusion |
| **§1400Z-2(a)** | OZ deferral | Deferred gain recognition |
| **§1400Z-2(c)** | OZ exclusion | 10-year hold → zero exit tax |

### 16.2 Investor Tax Utilization

| IRC Section | Provision | Platform Implementation |
|------------|-----------|------------------------|
| **§38(c)** | General business credit limit | Credit ceiling for nonpassive treatment; expressed in **dollars** (not millions) |
| **§39** | Credit carryforward/carryback | 1-year back, 20-year forward for §38(c) excess |
| **§172** | NOL carryforward | Indefinite; 80% taxable income limitation |
| **§461(l)** | Excess business loss limitation | Depreciation cap for nonpassive: ~$626K MFJ 2025 |
| **§469(a)** | Passive activity loss disallowance | Core limitation engine for passive investors |
| **§469(a)(2)** | Passive credit limitation | Credits limited to tax attributable to passive income |
| **§469(b)** | Suspended loss/credit carry | Indefinite carryforward for passive excess |
| **§469(c)(2)** | Rental = passive | HDC rental activity classified passive by default |
| **§469(c)(7)** | REP exception | Exception from passive activity rules |
| **§469(c)(7)(A)(ii)** | Grouping election | Treat all rental activities as single activity; makes HDC losses nonpassive |
| **§469(g)** | Disposition release | Suspended losses/credits released at exit |
| **§469(i)(1)** | $25K rental activity allowance | Deduction equivalent cap |
| **§469(i)(3)(B)** | LIHTC active participation exemption | LP access to §469(i) allowance for LIHTC |
| **§469(i)(3)(C)** | LIHTC AGI phaseout exemption | No AGI reduction for LIHTC |
| **§469(i)(3)(D)** | Ordering rule | Losses before credits in §469(i) allowance |
| **§752** | Partnership liabilities | Basis allocation for Qualified Nonrecourse Debt |

### 16.3 Exit Tax

| IRC Section | Provision | Platform Implementation |
|------------|-----------|------------------------|
| **§1(h)(1)(E)** | Unrecaptured §1250 gain rate | 25% max rate on structural depreciation |
| **§1(h)(6)(A)** | Unrecaptured §1250 gain definition | Excludes §1245 property by definition |
| **§1245(a)(1)** | Ordinary income recapture | Full recapture on cost-segregated bonus property at 37% |
| **§1250(a)(1)(A)** | Additional depreciation recapture | = $0 for MACRS residential straight-line |
| **§1250** | Depreciation recapture | 25% unrecaptured §1250 gain on structural component |
| **§1411(c)(2)(A)** | REP NIIT exception | Excludes disposition gain for REP investors with grouping |

### 16.4 Key Regulations

| Citation | Description |
|----------|-------------|
| Reg §1.1400Z2(c)-1(b)(2)(ii)(A) | Asset sale election — "all gains and losses" (Final Regs broadened); enables post-PIS OZ investment |

---

## 18. Key Decisions & Known-Correct Corrections

This section records decisions that have been corrected from prior erroneous versions, preventing reversion.

### 17.1 Tax Law Corrections

| Topic | Prior (Wrong) | Correct | Authority |
|-------|-------------|---------|-----------|
| LIHTC and §469 | "LIHTC credits NOT subject to §469" | LIHTC credits ARE subject to §469 for Non-REP investors — credits can only offset tax on passive income | Tax Benefits Spec v6.0 §1.3 |
| Depreciation recapture rate | Flat 25% for all property | Character-split: §1245 at 37% (ordinary), §1250 at 25% (max). Blended ~27.4% at 20% cost seg | IMPL-094–101 |
| Passive depreciation rate | Flat 37% for all investors | REP: 37%; Passive: 40.8% (37% + 3.8% NIIT) | IMPL-121 |
| §38(c) units | Treated as millions | Dollars (not millions) | IMPL-122 |
| Sizing optimizer objective | Maximize utilization % | Maximize effective multiple (savings per dollar invested) | IMPL-120 |
| Roth conversion duration | 12 years | 10 years (matches credit-active period) | IMPL-120 |
| Capital account trajectory | Year 1 bonus dep = 2–3× investor equity | Year 1 bonus dep ≈ 20% of project cost (not investor equity) | Key Learning |

### 17.2 Architecture Decisions (Permanent)

| Decision | Rationale |
|----------|-----------|
| Single source of truth: `calculations.ts` | Prevents divergent UI/export calculations |
| Branded TypeScript types for dollar/million amounts | Long-term fix for §38(c)-class bugs |
| `computeTimeline()` as master clock | Investment Date drives all timing; eliminates integer-year approximation bugs |
| Character-split recapture (no flat rate) | IRC-correct; blended rate is a derived output, not an input |
| State OZ conformity independent of state income tax | IMPL-066: OZ conformity affects OZ benefits, not state income tax rates |
| Syndicated state LIHTC → equity offset, not Returns Strip row | Prevents double-counting; syndication proceeds are return OF capital |

### 17.3 Process Standards

| Standard | Rule |
|----------|------|
| Audit-first | Before any spec, CC prompt, or commit — audit current state; stale docs must be updated BEFORE use |
| No verbal amendments | All prompt changes incorporated into full document before CC delivery |
| Git protocol | Always request `git status` + `git diff --stat` before prescribing commit messages |
| IMPL Registry | Every CC prompt that ships code must include a registry update in its DoD |
| Definition of Done | Item 11: `git status` + `git diff --stat` in completion report. Item 12: registry updated. All layers synced, 100% tests passing, grep audit, independent math verification |
| CC runtime verification | "Tests pass" is not sufficient for UI work — CC must start dev server and verify specific renders |

---

*End of HDC Tax Benefits Program Specification v1.0*

*Next version (v1.1) should incorporate: IMPL-123+ results, Tax Efficiency Map batch validation findings, Capital Account Ledger pre-implementation audit outcomes.*
