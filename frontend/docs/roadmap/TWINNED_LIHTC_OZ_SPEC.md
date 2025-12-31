# Twinned LIHTC + OZ Structure Specification

**Version:** 2.0-final
**Date:** 2025-11-30
**Status:** Shelved for Post-Vegas Implementation
**Author:** HDC / Claude

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-30 | Initial specification - binary LIHTC toggle approach |
| 2.0 | 2025-11-30 | Restructured to continuous optimization; two-layer architecture |
| 2.0-final | 2025-11-30 | Reviewed and tagged for post-Vegas implementation |

---

## Executive Summary

This specification defines a capital stack optimization system that combines Low-Income Housing Tax Credits (LIHTC) with Opportunity Zone (OZ) benefits. The system works backward from target investor returns to calculate the optimal mix of philanthropic debt, preferred equity, and LIHTC utilization given available constraints.

**Architecture:**
1. **Calculation Engine** - Computes investor returns for any given capital stack configuration
2. **Optimizer Layer** - Solves for optimal capital stack given target returns and constraints
3. **Scenario Comparison** - Presents feasible alternatives with trade-off analysis

---

## 1. Design Objective

**Deliver equivalent returns to OZ investors whether or not philanthropic debt is available.**

The system treats philanthropic debt and LIHTC as inverse levers: as philanthropic availability decreases, LIHTC utilization increases proportionally, with incremental credits funding the incremental cost of market-rate capital—all tuned to deliver target returns.

---

## 2. System Architecture

### 2.1 Two-Layer Design

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│  ┌─────────────────┐    ┌─────────────────────────────┐    │
│  │ Target Returns  │    │ Constraints                 │    │
│  │ • Multiple: 6.5x│    │ • Philanthropic avail: $15M │    │
│  │ • IRR: 25%      │    │ • Max affordable: 75%       │    │
│  │                 │    │ • Location: DDA/QCT         │    │
│  │                 │    │ • Preferred rate: 17%       │    │
│  └────────┬────────┘    └──────────────┬──────────────┘    │
│           │                            │                    │
│           ▼                            ▼                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OPTIMIZER LAYER                         │   │
│  │  • Goal-seek algorithm                              │   │
│  │  • Constraint satisfaction                          │   │
│  │  • Scenario generation                              │   │
│  │  • Trade-off analysis                               │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CALCULATION ENGINE                      │   │
│  │  • Capital stack math                               │   │
│  │  • LIHTC credit calculation                         │   │
│  │  • OZ benefit calculation                           │   │
│  │  • Depreciation schedule                            │   │
│  │  • Cash flow waterfall                              │   │
│  │  • IRR / Multiple computation                       │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OUTPUT                                  │   │
│  │  • Recommended capital stack                        │   │
│  │  • Alternative scenarios                            │   │
│  │  • Feasibility status                               │   │
│  │  • Sensitivity analysis                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Calculation Engine (Layer 1)

The calculation engine is the existing HDC calculator logic, extended to support LIHTC inputs. It computes investor returns for any given capital stack configuration.

**Inputs:** Complete capital stack specification
**Outputs:** IRR, Multiple, Cash flows, Tax benefits

**Must support:**
- Variable philanthropic debt (0-40% of project, 0-6% rate)
- Variable preferred equity (0-40% of project, 10-25% rate)
- Variable LIHTC (0-100% affordable, with/without DDA/QCT boost)
- All existing OZ benefit calculations (unchanged)

### 2.3 Optimizer Layer (Layer 2)

The optimizer works backward from target returns to find the optimal capital stack.

**Inputs:**
- Target returns (Multiple and/or IRR)
- Constraints (philanthropic available, location, affordable feasibility)
- Market conditions (preferred equity rate available)

**Outputs:**
- Recommended capital stack
- Alternative feasible scenarios
- Infeasibility explanation (if no solution exists)

**Algorithm approach:**
```
1. Start with maximum philanthropic utilization
2. If target achieved → DONE (simplest structure)
3. If gap remains:
   a. Add preferred equity to fill gap
   b. Calculate LIHTC needed to offset preferred cost
   c. Check if LIHTC achievable within constraints
   d. If yes → DONE (twinned structure)
   e. If no → Report constraint violation
4. Generate alternative scenarios at different constraint levels
```

---

## 3. Strategic Rationale

### 3.1 Design Objective

**Deliver equivalent returns to OZ investors whether or not philanthropic debt is available.**

```
Target OZ Investor Multiple: ~6-7x over 10 years

WITH Philanthropic Debt (0-4%):
├── Low gap financing cost
├── No LIHTC needed
└── Multiple: ~6.6x

WITHOUT Philanthropic Debt (Twinned + 16-18% Preferred):
├── High gap financing cost
├── LIHTC credits offset the difference
└── Multiple: ~6-7x (equivalent)
```

### 3.2 The Problem

Philanthropic debt from partners like Amazon Housing Equity Fund and Ballmer Group provides 0-4% gap financing, but:
- Supply is constrained by relationship capacity
- Not scalable beyond existing partnerships
- Creates dependency on philanthropic goodwill

### 3.3 The Solution

Twinning LIHTC + OZ creates sufficient incremental value (~$42M on $100M project) to offset the cost differential between philanthropic debt (2%) and market-rate preferred equity (17%), enabling:
- Unlimited access to market capital
- Transaction-based (vs. relationship-based) gap financing
- Scalable national platform

### 3.4 Key Insight

**LIHTC credits don't replace philanthropic debt directly—they fund the higher cost of market-rate alternatives while preserving investor returns.**

---

## 4. Structure Overview

### 4.1 Legal Entity Waterfall

```
INDIVIDUAL OZ INVESTORS (with qualified capital gains)
    │
    ▼
QUALIFIED OPPORTUNITY FUND (QOF)
    │ Files Form 8996
    │ Maintains 90%+ QOZ property
    │ Holds 99.99% LP interest
    │
    ▼
OPERATING PARTNERSHIP
    │ GP: HDC (0.01%)
    │ LP: QOF (99.99%)
    │
    ▼
REAL ESTATE ASSET
    • Located in Opportunity Zone
    • Located in DDA or QCT (for 130% basis boost)
    • 75%+ affordable units (for LIHTC qualification)
    • Financed with 30%+ tax-exempt bonds (triggers 4% LIHTC)
```

### 4.2 Critical Structural Requirement

**The QOF IS the LIHTC investor.** There is no separate LIHTC syndicator. Benefits flow:

| Benefit Type | Recipient | Mechanism |
|--------------|-----------|-----------|
| LIHTC Credits | QOF → Individual Investors | K-1 allocation |
| Depreciation Losses | QOF → Individual Investors | K-1 allocation |
| OZ Deferral | Individual Investors | Form 8949 election |
| OZ Basis Step-Up | Individual Investors | Section 1400Z-2(c) |
| OZ 10-Year Exclusion | Individual Investors | Section 1400Z-2(c) |

---

## 5. Capital Stack Comparison

### 5.1 Philanthropic Model (Current)

```
$100M Project:
├── Senior Debt:           $65M (65%)  @ 5.5%
├── Philanthropic Debt:    $30M (30%)  @ 0-4%
└── OZ Investor Equity:     $5M (5%)

LIHTC: Not utilized
Annual Gap Cost: $0-1.2M
```

### 5.2 Twinned + Preferred Model (New)

```
$100M Project (DDA/QCT, 75% Affordable):
├── Senior Debt:           $35M (35%)  @ 5.5%
├── Tax-Exempt Bonds:      $30M (30%)  @ 5.0%  ← Triggers 4% LIHTC
├── Preferred Equity:      $30M (30%)  @ 16-18%
└── OZ Investor Equity:     $5M (5%)

LIHTC Generated: $41.6M over 10 years → flows to OZ investors
Annual Gap Cost: $4.8-5.4M (offset by LIHTC value)
```

### 5.3 Economic Equivalence

| Metric | Philanthropic Model | Twinned + Preferred |
|--------|--------------------|--------------------|
| 10-Year Gap Cost | $6-12M | $48-54M |
| LIHTC Credits | $0 | $41.6M |
| Net Differential | — | ~($6-12M) |
| OZ Investor Multiple | ~6.6x | ~6-7x |

**Result:** Approximately equivalent investor returns via different capital sources.

---

## 6. LIHTC Mechanics

### 6.1 Credit Calculation

```
Project Cost:                         $100,000,000
Less: Land (10%):                     ($10,000,000)
Less: Non-Depreciable:                ($10,000,000)
─────────────────────────────────────────────────
Eligible Basis:                        $80,000,000
DDA/QCT Boost (130%):                 $104,000,000
Applicable Fraction (75% affordable):          75%
─────────────────────────────────────────────────
Qualified Basis:                       $78,000,000
4% Credit Rate:                              4.00%
─────────────────────────────────────────────────
Annual Credit:                          $3,120,000
10-Year Total:                         $31,200,000
```

### 6.2 Bond Requirements (OBBBA 2025)

- **Minimum tax-exempt bond financing:** 25% of aggregate basis (reduced from 50%)
- **As-of-right 4% credits:** No competitive allocation required
- **Bond issuer:** State HFA or local housing authority

### 6.3 Compliance Requirements

| Requirement | Duration | Monitoring |
|-------------|----------|------------|
| Income Limits | 15 years + extended use | Annual certification |
| Rent Limits | 15 years + extended use | Annual certification |
| Unit Set-Aside | 15 years + extended use | Annual certification |
| Reporting | Annual | Form 8609, state reports |

**Estimated Annual Compliance Cost:** $43,000-80,000 (1-2% of credit value)

### 6.4 Extended Use Period & LURA Constraints

**Critical Constraint:** LIHTC requires a **30-year minimum affordability commitment** via Land Use Restriction Agreement (LURA) recorded against the property.

```
LIHTC TIMELINE:
├── Years 1-15:  Compliance Period (IRS enforced, recapture risk)
├── Years 16-30: Extended Use Period (State enforced via LURA)
└── LURA runs with the land - any buyer inherits restrictions
```

**OZ vs. LIHTC Timing:**

```
OZ Optimal Exit:     Year 10 (tax-free appreciation)
LIHTC Minimum:       Year 30 (or Year 15 with Qualified Contract*)

*Qualified Contract increasingly unavailable:
 - 39+ states require waiver as condition of allocation
 - HUD/FHA programs require waiver starting 2025
 - Even if available, only exercisable at Year 15, not Year 10
```

**Year 10 Exit Mechanics:**

OZ investors exit at Year 10 by selling their QOF interest.

**Planned Exit: HDC Nonprofit Affiliate Buyout**
- HDC affiliate is the anticipated (not guaranteed) Year 10 buyer
- Mission-aligned ownership continuity
- Potential for resyndication (new 4% allocation on existing asset)
- Pricing: Negotiated or formula-based (set in operating agreement)

**Fallback Exit: Third-Party Sale**
- If affiliate does not purchase, sale to third-party buyer
- Buyer inherits remaining 20 years of LURA
- Restricted buyer pool: mission-driven, resyndication sponsors, affordable REITs
- Higher exit cap rate applies (LURA premium)

**Modeling Approach:**
- Base case: Affiliate buyout at negotiated value
- Downside case: Third-party sale at market cap rate + LURA premium
- Investor materials should present both scenarios

---

## 7. OZ Mechanics (Unchanged)

### 7.1 Benefits Retained

| Benefit | Requirement | Value |
|---------|-------------|-------|
| Capital Gains Deferral | Invest within 180 days | Defer tax until Year 5 |
| 10% Basis Step-Up | Hold 5+ years | Reduce deferred gain by 10% |
| 30% Basis Step-Up (Rural) | Hold 5+ years in QROF | Reduce deferred gain by 30% |
| Tax-Free Appreciation | Hold 10+ years | $0 tax on new gains |
| No Depreciation Recapture | Hold 10+ years | Avoid 25% recapture tax |

### 7.2 OZ + LIHTC Interaction

**No conflict.** The same investor entity can receive both:
- OZ benefits flow from QOF structure and holding period
- LIHTC credits flow from property qualification and ownership allocation

Both benefit streams are additive, not competing.

---

## 8. Investor Requirements

### 8.1 Qualification Criteria

To receive BOTH OZ and LIHTC benefits, investors must:

| Requirement | OZ | LIHTC | Combined |
|-------------|-----|-------|----------|
| Capital gains to defer | ✓ Required | Not required | ✓ Required |
| Tax liability for credits | Not required | ✓ Required | ✓ Required |
| Passive income (for losses) | Helpful | ✓ Required* | ✓ Required* |
| 10-year hold capacity | ✓ Required | 15-year compliance | ✓ 10-year minimum |

*Unless Real Estate Professional status

### 8.2 Ideal Investor Profile

```
Target Investor:
├── High-net-worth individual or family office
├── Recent capital gains event ($500K+ to defer)
├── Substantial ordinary income ($500K+/year)
├── Existing passive income sources (for loss utilization)
├── 10+ year investment horizon
└── Interest in affordable housing impact
```

### 8.3 Investor Limitations

**Passive Activity Loss Rules (Section 469):**
- LIHTC credits can only offset tax on passive income for most investors
- Depreciation losses subject to same limitations
- Exception: Real Estate Professionals can use against any income

**At-Risk Rules (Section 465):**
- Qualified nonrecourse financing exception applies
- Allows full basis from debt for depreciation purposes

---

## 9. Preferred Equity Provider Requirements

### 9.1 Target Providers

| Provider Type | Rate Expectation | Structure Preference |
|---------------|------------------|---------------------|
| Debt Funds | 14-18% | Current pay preferred |
| Family Offices | 12-16% | PIK with equity kicker |
| Insurance Companies | 10-14% | Senior preferred, current pay |
| CDFIs (non-concessionary) | 8-12% | Flexible |

### 9.2 Structural Considerations

Preferred equity must be structured to:
- NOT be treated as debt (avoid OZ basis issues)
- NOT be treated as a disguised sale
- Maintain QOF 90% asset test compliance
- Subordinate to senior debt and bonds

### 9.3 Open Question: Preferred Position in Capital Stack

```
Priority of Payments (TBD):
1. Senior Debt Service
2. Tax-Exempt Bond Service
3. Preferred Equity Return ← Position TBD
4. Operating Expenses
5. HDC Fees
6. OZ Investor Distributions
```

**Requires:** Tax counsel review (Daniel Altman, Sidley Austin)

---

## 10. Calculator Implementation Requirements

### 10.1 Calculation Engine Inputs (Layer 1)

**Existing Inputs (unchanged):**
All current HDC calculator inputs for project costs, senior debt, OZ equity, depreciation, tax rates, etc.

**New Inputs for LIHTC/Preferred:**

| Input | Type | Default | Range |
|-------|------|---------|-------|
| `philanthropicDebtAmount` | currency | $0 | $0 - 40% of project |
| `philanthropicDebtRate` | percentage | 2% | 0-6% |
| `preferredEquityAmount` | currency | $0 | $0 - 40% of project |
| `preferredEquityRate` | percentage | 17% | 10-25% |
| `affordableUnitPct` | percentage | 0% | 0-100% |
| `isDDA` | boolean | false | — |
| `isQCT` | boolean | false | — |
| `taxExemptBondPct` | percentage | 0% | 0-50% |

### 10.2 Optimizer Inputs (Layer 2)

| Input | Type | Description |
|-------|------|-------------|
| `targetMultiple` | number | Desired investor multiple (e.g., 6.5x) |
| `targetIRR` | percentage | Desired investor IRR (e.g., 25%) |
| `philanthropicAvailable` | currency | Maximum philanthropic debt accessible |
| `philanthropicRate` | percentage | Rate on available philanthropic |
| `preferredRateAvailable` | percentage | Market rate for preferred equity |
| `maxAffordablePct` | percentage | Maximum feasible affordable units |
| `locationDDA` | boolean | Is project in DDA? |
| `locationQCT` | boolean | Is project in QCT? |
| `optimizationPriority` | enum | "SIMPLICITY" \| "MIN_LIHTC" \| "MIN_PREFERRED" |

### 10.3 Calculation Engine Logic (Layer 1)

```typescript
// LIHTC Credit Calculation
function calculateLIHTCCredits(params: LIHTCParams): LIHTCResult {
  const eligibleBasis = params.projectCost - params.landValue - params.nonDepreciable
  const basisBoost = (params.isDDA || params.isQCT) ? 1.30 : 1.00
  const qualifiedBasis = eligibleBasis * basisBoost * params.affordableUnitPct
  const annualCredit = qualifiedBasis * 0.04  // 4% credit rate
  const totalCredits = annualCredit * 10      // 10-year credit period

  return {
    eligibleBasis,
    qualifiedBasis,
    annualCredit,
    totalCredits,
    creditsToOZInvestor: totalCredits * params.ozOwnershipPct
  }
}

// Gap Financing Cost Calculation
function calculateGapCost(params: GapParams): GapCostResult {
  const philanthropicCost = params.philanthropicAmount * params.philanthropicRate * params.holdYears
  const preferredCost = params.preferredAmount * params.preferredRate * params.holdYears

  return {
    philanthropicCost,
    preferredCost,
    totalGapCost: philanthropicCost + preferredCost
  }
}

// Investor Returns (extended to include LIHTC)
function calculateInvestorReturns(params: FullParams): ReturnsResult {
  const ozBenefits = calculateOZBenefits(params)      // Existing logic
  const depreciation = calculateDepreciation(params)  // Existing logic
  const cashFlows = calculateCashFlows(params)        // Existing logic
  const lihtc = calculateLIHTCCredits(params)         // New

  // Add LIHTC credits to investor benefit stream
  const totalBenefits = {
    ...ozBenefits,
    ...depreciation,
    lihtcCredits: lihtc.creditsToOZInvestor,
    annualLIHTCCredit: lihtc.annualCredit
  }

  return calculateIRRAndMultiple(totalBenefits, cashFlows)
}

// Exit Valuation with LURA Impact
function calculateExitValue(params: ExitParams): ExitResult {
  const noi = params.year10NOI

  // Base Case: HDC affiliate buyout (planned, not guaranteed)
  // Pricing per operating agreement formula or negotiated value
  const affiliateBuyoutValue = params.affiliateExitFormula
    ? calculateFormulaExit(params)
    : noi / params.baseCapRate  // Assume no LURA premium for affiliate

  // Downside Case: Third-party market sale
  // LURA premium applies due to:
  // - 20 years of rent restrictions remaining
  // - Restricted buyer pool
  // - No market-rate conversion optionality
  const marketCapRate = params.baseCapRate +
    (params.enableLIHTC ? params.luraCapRatePremium : 0)
  const thirdPartyValue = noi / marketCapRate

  return {
    baseCaseExit: affiliateBuyoutValue,
    downsideExit: thirdPartyValue,
    effectiveCapRate: marketCapRate,
    luraImpact: affiliateBuyoutValue - thirdPartyValue
  }
}
```

**Exit Cap Rate Premium (Downside Case Only):**

LURA cap rate premium applies only to third-party sale scenario. User input based on HDC's market knowledge. Default: 1.25%. Range: 0-4.0%.

**Exit Value Comparison ($6M NOI, 5.0% base cap):**

```
Base Case (Affiliate):      $6M ÷ 5.00% = $120.0M
Downside (1.25% premium):   $6M ÷ 6.25% = $96.0M  (-20%)
Downside (2.00% premium):   $6M ÷ 7.00% = $85.7M  (-29%)
```

Investor returns should be presented for both scenarios.

### 10.4 Optimizer Logic (Layer 2)

```typescript
interface OptimizationResult {
  feasible: boolean
  recommendedStack: CapitalStack
  alternatives: CapitalStack[]
  infeasibilityReason?: string
}

function optimizeCapitalStack(
  targets: { multiple?: number; irr?: number },
  constraints: OptimizerConstraints,
  projectParams: ProjectParams
): OptimizationResult {

  const results: CapitalStack[] = []

  // Scenario 1: Maximum philanthropic, no LIHTC
  const scenario1 = solveWithPhilanthropicOnly(constraints, projectParams)
  if (meetsTargets(scenario1, targets)) {
    return {
      feasible: true,
      recommendedStack: scenario1,
      alternatives: []
    }
  }
  results.push(scenario1)

  // Scenario 2: Philanthropic + Preferred + Minimum LIHTC
  const scenario2 = solveWithMinimumLIHTC(constraints, projectParams, targets)
  if (scenario2.feasible) {
    results.push(scenario2.stack)
  }

  // Scenario 3: Philanthropic + Maximum LIHTC (no preferred)
  const scenario3 = solveWithMaximumLIHTC(constraints, projectParams, targets)
  if (scenario3.feasible) {
    results.push(scenario3.stack)
  }

  // Find best feasible option based on optimization priority
  const feasibleOptions = results.filter(r => meetsTargets(r, targets))

  if (feasibleOptions.length === 0) {
    return {
      feasible: false,
      recommendedStack: results[0], // Best attempt
      alternatives: results,
      infeasibilityReason: diagnoseInfeasibility(results, targets, constraints)
    }
  }

  const recommended = selectByPriority(feasibleOptions, constraints.optimizationPriority)

  return {
    feasible: true,
    recommendedStack: recommended,
    alternatives: feasibleOptions.filter(o => o !== recommended)
  }
}

// Goal-seek for LIHTC percentage needed
function solveForRequiredLIHTC(
  gapCostDelta: number,  // Additional cost vs. philanthropic-only
  projectParams: ProjectParams,
  constraints: OptimizerConstraints
): { affordablePct: number; feasible: boolean } {

  const basisBoost = (constraints.locationDDA || constraints.locationQCT) ? 1.30 : 1.00
  const maxCredits = calculateMaxLIHTCCredits(projectParams, basisBoost, constraints.maxAffordablePct)

  if (maxCredits < gapCostDelta) {
    return { affordablePct: constraints.maxAffordablePct, feasible: false }
  }

  // Binary search for minimum affordable % that generates sufficient credits
  let low = 0
  let high = constraints.maxAffordablePct

  while (high - low > 0.01) {
    const mid = (low + high) / 2
    const credits = calculateLIHTCCredits({ ...projectParams, affordableUnitPct: mid })

    if (credits.totalCredits >= gapCostDelta) {
      high = mid
    } else {
      low = mid
    }
  }

  return { affordablePct: high, feasible: true }
}
```

### 10.5 Outputs Required

**Calculation Engine Outputs:**

| Output | Description |
|--------|-------------|
| `investorMultiple` | Total return multiple for OZ investor |
| `investorIRR` | Internal rate of return for OZ investor |
| `annualLIHTCCredit` | Annual credit amount |
| `totalLIHTCCredits` | 10-year total credits |
| `totalGapCost` | Combined philanthropic + preferred cost |
| `netLIHTCBenefit` | LIHTC value minus gap cost delta |
| `effectiveExitCapRate` | Base cap rate + LURA premium (if LIHTC) |
| `luraExitImpact` | Exit value reduction due to LURA |

**Optimizer Outputs:**

| Output | Description |
|--------|-------------|
| `feasible` | Whether target returns achievable |
| `recommendedStack` | Optimal capital stack configuration |
| `alternatives` | Other feasible configurations |
| `philanthropicUsed` | Amount of philanthropic in solution |
| `preferredUsed` | Amount of preferred in solution |
| `affordablePctRequired` | Minimum affordable % to hit target |
| `lihtcGenerated` | Credits generated by solution |
| `complianceBurden` | Estimated annual compliance cost |
| `infeasibilityReason` | If infeasible, why |

### 10.6 UI/UX Requirements

**Two Operating Modes:**

**Mode 1: Manual Configuration (Power User)**
- User directly sets all capital stack inputs
- Calculation engine computes resulting returns
- Existing HDC calculator behavior, extended with LIHTC inputs

**Mode 2: Goal-Seek Optimization (Primary UX)**
- User specifies target returns + constraints
- Optimizer recommends capital stack
- User can fine-tune from recommended starting point

---

**Goal-Seek Interface:**

```
┌─────────────────────────────────────────────────────────────┐
│  CAPITAL STACK OPTIMIZER                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TARGET RETURNS                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Investor Multiple: [ 6.5x ]  IRR: [ 25% ]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  CONSTRAINTS                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Philanthropic Available:  $[ 15,000,000 ] @ [ 2 ]% │   │
│  │  Preferred Equity Rate:    [ 17 ]% (market)         │   │
│  │  Max Affordable Units:     [ 75 ]%                  │   │
│  │  Location: □ DDA  □ QCT                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPTIMIZATION PRIORITY                                      │
│  ○ Simplicity (minimize LIHTC compliance)                  │
│  ● Minimize Preferred Equity (maximize LIHTC)              │
│  ○ Balanced                                                │
│                                                             │
│              [ OPTIMIZE CAPITAL STACK ]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RECOMMENDED SOLUTION                               ✓ FEASIBLE │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Philanthropic Debt:  $15.0M @ 2%    (50% of gap)   │   │
│  │  Preferred Equity:    $15.0M @ 17%   (50% of gap)   │   │
│  │  Affordable Units:    62%                           │   │
│  │  LIHTC Credits:       $26.1M (10-year)              │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Resulting Multiple:  6.52x  ✓                      │   │
│  │  Resulting IRR:       25.3%  ✓                      │   │
│  │  Annual Compliance:   ~$52K                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [ Apply to Model ]  [ Show Alternatives ]  [ Fine-Tune ]  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ALTERNATIVE SCENARIOS                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Option B: Maximum Simplicity                       │   │
│  │  • 100% Philanthropic, 0% LIHTC                     │   │
│  │  • Multiple: 6.6x  IRR: 26.1%                       │   │
│  │  • Status: ⚠ INFEASIBLE (need $30M, have $15M)     │   │
│  │                                                      │   │
│  │  Option C: No Preferred Equity                      │   │
│  │  • $15M Philanthropic + 75% Affordable (max LIHTC) │   │
│  │  • Multiple: 6.1x  IRR: 23.2%                       │   │
│  │  • Status: ✓ Feasible (below target, but works)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

**Fine-Tune Interface (after optimization):**

```
┌─────────────────────────────────────────────────────────────┐
│  FINE-TUNE CAPITAL STACK                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Starting from optimized recommendation...                  │
│                                                             │
│  Philanthropic ════════════●════════════ $15.0M            │
│                            ↑ constrained by availability    │
│                                                             │
│  Preferred     ════════════●════════════ $15.0M            │
│                └─ adjust to see impact on LIHTC needed      │
│                                                             │
│  Affordable %  ════════●════════════════ 62%               │
│                └─ minimum to achieve target returns         │
│                                                             │
│  ─────────────────────────────────────────────────────     │
│  LIVE PREVIEW                                               │
│  Multiple: 6.52x → [  ]    IRR: 25.3% → [  ]              │
│  LIHTC: $26.1M → [  ]      Compliance: $52K → [  ]        │
│                                                             │
│  [ Reset to Optimized ]  [ Apply Changes ]                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Validation Requirements

### 11.1 Mathematical Validation

| Test Case | Expected Result |
|-----------|-----------------|
| $100M, 75% affordable, DDA, 30% bonds | ~$31.2M total credits |
| Credits at 17% preferred breakeven | ~$48M preferred cost = ~$42M credits |
| Investor multiple equivalence | Twinned ≈ Philanthropic (±10%) |

### 11.2 Regulatory Validation

- [ ] LIHTC credit calculation matches IRC §42
- [ ] Bond threshold matches OBBBA 2025 (25% minimum)
- [ ] DDA/QCT boost matches current HUD designations
- [ ] OZ benefits unaffected by LIHTC addition

### 11.3 Legal Status

**VALIDATED (November 2025 research):**
- [x] QOF as LIHTC investor structure - Single investor model works per IRS rules
- [x] Partnership allocation mechanics - 99.99% LP flows both credits and OZ benefits
- [x] Dual investor model rejection - Section 704(b) prevents split structures

**REQUIRES TAX COUNSEL REVIEW (Daniel Altman, Sidley Austin):**
- [ ] Preferred equity characterization (debt vs. equity for OZ basis purposes)

**REQUIRES HDC BUSINESS DECISION:**
- [ ] Preferred equity position in waterfall relative to QOF

**REQUIRES HDC RESEARCH:**
- [ ] State-specific LIHTC conformity implications

---

## 12. Open Issues & Future Work

### 12.1 Unresolved Questions

1. **Preferred equity structure:** Current pay vs. PIK vs. hybrid?
2. **Investor minimum:** Can passive investors use LIHTC credits effectively?
3. **Compliance burden allocation:** Who bears LIHTC monitoring costs?
4. **State LIHTC credits:** Do any target states offer additional state credits?

### 12.2 Future Enhancements

- [ ] 9% LIHTC competitive allocation pathway (higher value, constrained supply)
- [ ] Historic Tax Credit (HTC) twinning option
- [ ] New Markets Tax Credit (NMTC) twinning option
- [ ] State-by-state LIHTC conformity database

---

## 13. References

- IRC §42 (Low-Income Housing Tax Credit)
- IRC §1400Z-2 (Opportunity Zones)
- OBBBA 2025 (One Big Beautiful Bill Act)
- IRS Form 8609 (LIHTC Allocation Certification)
- IRS Form 8996 (QOF Annual Statement)
- Treasury Reg. §1.1400Z2 (OZ Final Regulations)

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Twinning** | Combining two tax benefit programs in a single investment structure |
| **QOF** | Qualified Opportunity Fund - investment vehicle for OZ benefits |
| **DDA** | Difficult Development Area - qualifies for 130% basis boost |
| **QCT** | Qualified Census Tract - qualifies for 130% basis boost |
| **4% LIHTC** | As-of-right credits triggered by tax-exempt bond financing |
| **9% LIHTC** | Competitive credits allocated by state HFAs |
| **Applicable Fraction** | Percentage of units qualifying for LIHTC |
| **Qualified Basis** | Eligible basis × boost × applicable fraction |

---

## Appendix B: Optimization Framework

```
INPUTS:
├── Target OZ Investor Multiple: 6-7x
├── Available Philanthropic Debt: $X (0-100% of gap)
├── Market Preferred Equity Rate: 16-18%
├── Project Location: DDA/QCT eligible? Y/N
└── Affordable Unit Feasibility: ___%

OPTIMIZATION:

Step 1: Calculate gap financing need
        Gap = Project Cost - Senior Debt - OZ Equity

Step 2: Determine philanthropic coverage
        Philanthropic Coverage = Available Philanthropic / Gap

Step 3: Calculate remaining gap at market rates
        Market Gap = Gap - Available Philanthropic
        Market Gap Cost = Market Gap × 17% × 10 years

Step 4: Determine LIHTC needed to offset market gap cost
        Required LIHTC Value ≈ Market Gap Cost
        Required Affordable % = f(Required LIHTC Value, DDA/QCT status)

Step 5: Verify investor multiple maintained
        IF multiple < 6x: Increase LIHTC or reduce market gap
        IF multiple > 7x: Reduce LIHTC (less compliance burden)

OUTPUTS:
├── Philanthropic Debt: $___M @ ___%
├── Preferred Equity: $___M @ ___%
├── Tax-Exempt Bonds: $___M (if LIHTC needed)
├── Affordable Units: ___%
├── LIHTC Credits: $___M (10-year)
└── Projected OZ Investor Multiple: ___x

RESULT: Capital stack tuned to target returns regardless of philanthropic availability
```

---

*End of Specification*
