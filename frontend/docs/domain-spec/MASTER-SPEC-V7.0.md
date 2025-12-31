# OZ 2.0 Master Specification

**Version:** 7.0  
**Date:** 2025-12-13  
**Status:** Final  
**Author:** HDC / Claude  
**Companion:** OZ 2.0 Addendum v7.0

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 5.0 | 2025-12-07 | Initial consolidation from legacy specs |
| 6.0 | 2025-12-08 | Added depreciation mechanics (Part 3A), state dual-track (Part 3B), fee structure update |
| 6.5 | 2025-12-09 | Unified state data, prevailing wage framework (Part 7A) |
| **7.0** | **2025-12-13** | **Major LIHTC integration:** Added Part 4A LIHTC Credit Mechanics. Added §2.4.1 Preferred Equity. Added §4.4.6 State LIHTC (25 programs). Added §5.4 Exit Constraints. Added §8.14-8.15 Mid-compliance/Lease-up. Added depreciation recapture (OZ toggle). Consolidated v6.7, v7.0-7.2 addenda. State conformity tables moved to Addendum v7.0. |

---

## Table of Contents

- Executive Summary
- Part 1: The Investor Problem HDC Solves
- Part 2: Capital Structure
- Part 3: Affordable by Design
- Part 3A: Depreciation Calculation Mechanics
- Part 3B: State Tax Dual-Track Calculations
- Part 4: Return Composition
- **Part 4A: LIHTC Credit Mechanics** *(New in v7.0)*
- Part 5: Exit Strategy
- Part 6: Investor Tax Utilization Under §469
- Part 7: HFA Compliance & Feasibility
- Part 7A: Prevailing Wage Considerations
- Part 8: Geographic Strategy
- Part 9: Pre-PIS Acquisition Strategy
- Part 10: Mid-Construction LIHTC Conversion
- Part 11: Wealth Manager Perspective
- Part 12: Market Strategy & Timeline
- Part 13: Platform Implementation Requirements
- **Part 14: Future Features** *(New in v7.0)*

---

## Executive Summary

This specification defines HDC's OZ 2.0 strategy: a capital structure combining Low-Income Housing Tax Credits (LIHTC) with Opportunity Zone (OZ) benefits to deliver **~4.3x investor multiples** (OZ investors) or **~3.3x** (non-OZ) while creating permanent affordable housing for essential workers.

### Core Innovation

HDC retains LIHTC credits for direct investors rather than selling them at 85¢ syndication pricing. For investors with direct tax liability, credits are worth $1.00. That spread, combined with OZ benefits and permanent 100% bonus depreciation under OBBBA, creates outsized returns on concentrated equity.

### Representative Deal ($100M Project)

| Component | Amount |
|-----------|--------|
| Project Cost | $100,000,000 |
| Senior Debt (65%) | $65,000,000 |
| Philanthropic Debt (30%) | $30,000,000 |
| QOF Investor Equity (5%) | $5,000,000 |
| Federal LIHTC (4%, 10-year) | $31,200,000 |
| State LIHTC (varies by state) | $0 - $31,200,000 |
| Depreciation Basis | ~$80,000,000 |

### Addressable Market

- **$700B+** annual capital gains seeking deferral
- **517,000** millionaire households in NJ/CT corridor alone
- **Target segments:** Real Estate Professionals, hedge fund partners, crypto/business exit investors

### Regulatory Foundation

- **OBBBA (July 4, 2025):** Made OZ, 100% bonus depreciation, and rolling step-up permanent
- **IRC §42:** 4% LIHTC via Private Activity Bonds
- **IRC §1400Z:** Opportunity Zone deferral and exclusion

---

## Part 1: The Investor Problem HDC Solves

### 1.1 The Tax Efficiency Gap

High-net-worth investors face a structural problem: the best tax-advantaged real estate investments (LIHTC) are inaccessible to them, while accessible investments (standard syndications) leak 25-45% of value to intermediaries.

**Traditional LIHTC Syndication:**
- Credits sold at 85-92¢ on the dollar
- Corporate investors capture spread
- Individual investors excluded from direct credit access
- Syndicator fees consume 15-25% additional value

**HDC Direct Structure:**
- Credits retained at $1.00 value
- No syndication discount
- Individual investors access credits directly
- Minimal intermediary costs (AUM fee only)

### 1.2 Target Investor Profiles

**Real Estate Professionals (REPs):**
- Can use depreciation against ordinary income (no PAL limits)
- Subject to §461(l) excess business loss limitation ($626K MFJ for 2025)
- Optimal for maximizing depreciation benefits

**Passive Income Generators:**
- Hedge fund partners with K-1 passive income
- Business owners with passive investment income
- Can offset passive income with depreciation (no §461(l) cap)
- LIHTC credits reduce tax liability regardless of income type

**Capital Gains Investors:**
- Crypto gains, business exits, appreciated stock sales
- OZ deferral delays recognition
- 10+ year hold eliminates tax on OZ appreciation

### 1.3 The HDC Solution

Concentrate tax benefits on thin equity layer using qualified nonrecourse debt:

```
$100M Project Cost
├── $65M Senior Debt (65%)
├── $30M Philanthropic Debt (30%)  
└── $5M Investor Equity (5%)

Tax Benefits Flow to $5M Equity:
├── $31.2M Federal LIHTC (624% of equity)
├── $0-31.2M State LIHTC (0-624% of equity)
├── ~$16M Depreciation value (320% of equity)
└── OZ exclusion on appreciation
```

---

## Part 2: Capital Structure

### 2.1 Standard Capital Stack

| Layer | % of Cost | Source | Terms |
|-------|-----------|--------|-------|
| Senior Debt | 65% | Bank/CDFI | Market rate, 30-yr amort |
| Philanthropic Debt | 30% | Amazon HEF, Ballmer | Below-market, subordinated |
| QOF Equity | 5% | OZ investors | 10-year hold |

### 2.2 Debt Qualification

All debt must qualify under IRC §752 for basis allocation:

**Qualified Nonrecourse Debt Requirements:**
- Secured by real property
- No personal guarantees from limited partners
- Lender has no recourse beyond collateral

**Result:** 100% of project debt allocates to investor basis, enabling depreciation on full project cost despite minimal equity.

### 2.3 Philanthropic Debt Partners

| Partner | Typical Terms | Geographic Focus |
|---------|---------------|------------------|
| Amazon Housing Equity Fund | 1-2%, 10-year, subordinated | National |
| Ballmer Group | Below-market, flexible | West Coast focus |
| CDFI Loan Funds | 3-5%, patient capital | Varies |

### 2.4 Equity Structure

**Single-Investor QOF Model:**
- One investor per QOF entity
- Simplified K-1 reporting
- No allocation complexity
- Clean exit mechanics

**Multi-Investor Option (if needed):**
- Pro-rata allocation by capital contribution
- §704(b) substantial economic effect compliance
- Waterfall per Part 13D

### 2.4.1 Preferred Equity Structure *(New in v7.0)*

When capital stack includes preferred equity layer:

| Parameter | Default | Range | Notes |
|-----------|---------|-------|-------|
| Preferred Equity % | 23% | 0-40% | Of total capitalization |
| Target MOIC | 1.7x | 1.0-3.0x | Multiple on invested capital |
| Target IRR | 12% | 6-20% | Internal rate of return |
| Accrual Rate | 12% | 6-20% | Preferred return accrual |
| OZ Eligibility | Optional | — | Can structure as QOF investment |

**Waterfall Position:**
1. Senior debt service
2. Preferred equity accrued return
3. Preferred equity principal
4. Common equity distributions

### 2.5 Fee Structure

**Confirmed (v6.0+):** Tax benefit fee eliminated per legal counsel review.

| Fee | Rate | Basis | Timing |
|-----|------|-------|--------|
| AUM Fee | 1.5% | Investor equity | Annual |
| Development Fee | Per project | Total dev cost | At closing |
| Asset Management | Per project | Property level | Annual |

**Removed:**
- ~~10% Tax Benefit Fee~~ — Eliminated

### 2.6 Market Context: Structural Arbitrage

HDC's structure exploits the gap between corporate and individual tax rates post-TCJA:

| Metric | Corporate | Individual (Top) |
|--------|-----------|------------------|
| Ordinary Rate | 21% | 37% + 3.8% NIIT |
| Capital Gains | 21% | 23.8% |
| Credit Value | Lower leverage | Higher leverage |

Corporate buyers bid LIHTC at 85-92¢ based on 21% rate. Individual investors at 40.8% combined rate value same credits higher, creating arbitrage HDC captures.

---

## Part 3: Affordable by Design

### 3.1 Core Concept

Size units so market rents naturally align with LIHTC income limits. No rent discount required = no economic sacrifice for affordability.

### 3.2 Unit Sizing Strategy

| AMI Tier | Target Unit Size | Market Rent | LIHTC Max Rent | Margin |
|----------|------------------|-------------|----------------|--------|
| 60% AMI | 650 SF 1BR | $1,450 | $1,500 | +$50 |
| 80% AMI | 850 SF 2BR | $1,850 | $1,900 | +$50 |

### 3.3 Income Averaging

LIHTC Income Averaging election allows units across 20-80% AMI spectrum while maintaining overall 60% average. Provides flexibility without HUD Section 8 constraints.

### 3.4 Essential Worker Focus

Target tenants: teachers, nurses, police, firefighters, service workers. Workforce housing in high-opportunity areas where market rents exceed affordable thresholds.

---

## Part 3A: Depreciation Calculation Mechanics

### 3A.1 Depreciable Basis

```
Total Project Cost
− Land Value (non-depreciable)
− Predevelopment Costs (if expensed)
+ Loan Fees (amortized or added to basis)
+ Legal/Structuring Costs
─────────────────────────────
= Depreciable Basis
```

### 3A.2 MACRS Schedule

**Residential Rental Property:** 27.5-year straight-line with mid-month convention.

**Year 1 Depreciation (without cost segregation):**
```
Year 1 = Basis × (1/27.5) × ((12 - PIS_Month + 0.5) / 12)
```

Where PIS_Month = month property placed in service (1-12).

**IRS Table A-6 Reference:** Use official MACRS percentages for exact calculations.

### 3A.3 Cost Segregation

Accelerates depreciation by reclassifying building components:

| Component | Recovery Period | Typical % of Basis |
|-----------|-----------------|-------------------|
| 5-year property | 5 years | 5-10% |
| 15-year property | 15 years | 10-15% |
| 27.5-year structure | 27.5 years | 75-85% |

**Default Assumption:** 20% of depreciable basis eligible for bonus depreciation (empirically validated across 11 HDC cost segregation studies).

### 3A.4 Bonus Depreciation (OBBBA Permanent)

Under OBBBA (July 4, 2025), 100% bonus depreciation is permanent for:
- 5-year property
- 15-year qualified improvement property
- Cost segregation components

**Year 1 Depreciation with Cost Seg:**
```
Bonus Eligible = Depreciable Basis × 20%
Year 1 Bonus = Bonus Eligible × 100%
Year 1 MACRS = (Depreciable Basis × 80%) × MACRS_Rate
Year 1 Total = Year 1 Bonus + Year 1 MACRS
```

### 3A.5 QCG Basis Exclusion Rule

Per IRS regulations, qualified capital gain invested in a QOF **cannot** be added to depreciable basis. The OZ investment creates deferral/exclusion benefits but does not increase depreciation basis.

### 3A.6 Interest Reserve Mechanics

Interest reserves capitalized during construction are added to depreciable basis at placed-in-service date, increasing Year 1 depreciation.

### 3A.7 Depreciation Recapture (OZ Toggle) *(New in v7.0)*

When `ozEnabled = false`, calculator must show depreciation recapture at exit:

**Non-OZ Exit Calculation:**
```
Cumulative Depreciation Claimed (Years 1-10)
× 25% (§1250 unrecaptured gain rate)
= Depreciation Recapture Tax
```

**OZ Exit Calculation:**
```
Depreciation Recapture = $0 (excluded under §1400Z-2)
```

**Display Requirement:** Show recapture as explicit line item when OZ disabled to demonstrate OZ value proposition.

---

## Part 3B: State Tax Dual-Track Calculations

### 3B.1 Three-Dimension Conformity Model

Each state has independent conformity status across three dimensions:

| Dimension | Question | Impact |
|-----------|----------|--------|
| **OZ Conformity** | Does state follow federal OZ deferral/exclusion? | State capital gains treatment |
| **Bonus Dep Conformity** | Does state follow federal §168(k)? | State depreciation schedule |
| **State LIHTC** | Does state offer supplemental LIHTC? | Additional credit value |

**Reference:** See Addendum v7.0 Part 1 for complete 56-jurisdiction conformity tables.

### 3B.2 Conformity Types

**OZ Conformity:**
- `full-rolling` — Automatically adopts IRC changes
- `full-adopted` — Adopted specific IRC version including OZ
- `limited` — Partial conformity (see state notes)
- `none` — Explicitly decoupled
- `no-cg-tax` — No state capital gains tax (WA, etc.)

**Bonus Depreciation Conformity:**
- `100%` — Full federal conformity
- `0-99%` — Partial or no conformity
- Affects state-level depreciation calculations

### 3B.3 Dual-Track Calculation

When state conformity differs from federal:

```
Federal Track:
├── Depreciation: Full bonus + MACRS
├── OZ Benefits: Deferral + Exclusion
└── Tax Rate: 40.8% (top federal + NIIT)

State Track (if non-conforming):
├── Depreciation: MACRS only (no bonus)
├── OZ Benefits: None (if decoupled)
└── Tax Rate: State top rate
```

**Calculator must maintain separate schedules when state ≠ federal.**

### 3B.4 Priority States Analysis

| State | OZ | Bonus Dep | State LIHTC | Combined Rate |
|-------|-----|-----------|-------------|---------------|
| **OR** | ✅ Full | ✅ 100% | ❌ None | 50.7% |
| **GA** | ✅ Full | ❌ 0% | ✅ 100% | 46.6% |
| **NE** | ✅ Full | ❌ 0% | ✅ 100% | 47.6% |
| **NJ** | ✅ Full | ❌ 0% | ⚠️ Grant | 51.6% |
| **CA** | ❌ None | ❌ 0% | ✅ Yes (PW) | 54.1% |

**Reference:** See Addendum v7.0 Part 2 for complete state profiles.

---

## Part 4: Return Composition

### 4.1 Tax Benefit Categories

| Category | Source | Timing | OZ Investor | Non-OZ Investor |
|----------|--------|--------|-------------|-----------------|
| Depreciation | §168 + §168(k) | Years 1-10 | ✅ | ✅ |
| LIHTC Credits | §42 | Years 1-10 | ✅ | ✅ |
| State LIHTC | State statutes | Years 1-10 | ✅ | ✅ |
| Deferral NPV | §1400Z-2(a) | Year 0 | ✅ | ❌ |
| Recapture Avoidance | §1400Z-2(c) | Exit | ✅ | ❌ |
| Appreciation Exclusion | §1400Z-2(c) | Exit | ✅ | ❌ |

### 4.2 Representative Returns ($100M Project, $5M Equity)

**OZ Investor:**
| Component | Value | % of Equity |
|-----------|-------|-------------|
| Federal LIHTC | $31,200,000 | 624% |
| Depreciation Value | $16,000,000 | 320% |
| Deferral NPV | $1,500,000 | 30% |
| State LIHTC (GA) | $26,520,000 | 530% |
| **Total Benefits** | **$75,220,000** | **1,504%** |
| **Multiple** | **~4.3x** | — |

**Non-OZ Investor:**
| Component | Value | % of Equity |
|-----------|-------|-------------|
| Federal LIHTC | $31,200,000 | 624% |
| Depreciation Value | $16,000,000 | 320% |
| Less: Recapture Tax | ($4,000,000) | (80%) |
| State LIHTC (GA) | $26,520,000 | 530% |
| **Total Benefits** | **$69,720,000** | **1,394%** |
| **Multiple** | **~3.3x** | — |

### 4.3 IRR Considerations

Cash flow timing affects IRR significantly:
- Depreciation benefits: Years 1-3 concentrated (cost seg)
- LIHTC credits: Years 1-10 level (with Year 1 proration)
- Exit proceeds: Year 10-11
- Tax benefit realization: 3-month K-1 delay assumption

### 4.4 LIHTC Eligible Basis

**4% Credit Basis (PAB-financed):**
```
Total Project Cost
− Land Value
− Non-depreciable costs
× DDA/QCT Boost (130% if applicable)
× Applicable Fraction (typically 75-100%)
= Eligible Basis
× 4% Annual Credit Rate
× 10 Years
= Total Federal Credits
```

### 4.4.6 State LIHTC Credits *(Expanded in v7.0)*

Twenty-five states offer supplemental state-level LIHTC. Programs vary by structure:

| Structure | Behavior | States |
|-----------|----------|--------|
| **Piggyback** | Automatic % of federal | GA (100%), NE (100%), SC (100%), KS (100%), AR (20%) |
| **Supplement** | Additional allocation | DC (25%), MO (70%), OH (varies), VT |
| **Standalone** | Independent program | CA, MA, NY, VA, and 6 others |
| **Donation** | Transferable credits | IL, NM |
| **Restricted** | Limited eligibility | CT (nonprofit), NJ (grant) |

**Transferability & Syndication:**

State credits can only offset state tax in that state. Out-of-state investors monetize via syndication:

| Transferability | Mechanism | Default Rate |
|-----------------|-----------|--------------|
| Certificated | Direct sale, can resell | 90% |
| Transferable | Direct sale with notice | 90% |
| Bifurcated | Separate syndication | 85% |
| Allocated | Partnership allocation | 80% |
| Grant | Flows to project | 100% |

**Calculator Parameters:**
- `stateLIHTCEnabled` — Include state credits (auto-set from property state)
- `stateLIHTCPercent` — Credit percentage (auto for piggyback, manual otherwise)
- `stateLIHTCSyndicationRate` — Net realization (default 85%, 100% for in-state)

**Reference:** See Addendum v7.0 Part 3 for complete 25-state lookup table with authorities.

---

## Part 4A: LIHTC Credit Mechanics *(New in v7.0)*

### 4A.1 Credit Delivery Timing

**10-Year Credit Period:**
- Credits flow for 10 consecutive years beginning at placed-in-service
- First year prorated based on PIS month
- Year 11 catch-up for first-year proration shortfall

**First-Year Proration Formula:**
```
Year 1 Credits = Annual Credit Amount × (13 - PIS_Month) / 12
```

| PIS Month | Year 1 % | Year 11 Catch-up |
|-----------|----------|------------------|
| January | 100% | 0% |
| July | 50% | 50% |
| December | 8.3% | 91.7% |

**KISS Decision:** Assume full lease-up in first calendar year. Slow lease-up scenarios deferred to future version.

### 4A.2 Credit Year Election

Developer can elect to begin credit period in:
1. Year property placed in service, OR
2. Following calendar year

**Default:** Year placed in service (maximizes NPV).

### 4A.3 Credit Recapture Rules

**15-Year Compliance Period:**
- Years 1-10: Active credit period
- Years 11-15: Extended use period (no new credits, compliance continues)

**Recapture Trigger:** Noncompliance (income violations, building disposition) triggers recapture of credits taken.

**Recapture Formula:**
```
Accelerated Portion = Credits Claimed × (1/3)
Recapture Percentage = (15 - Years Held) / 15 × 100%
Recapture Amount = Accelerated Portion × Recapture Percentage
```

**Recapture Schedule:**
| Year of Event | % of Accelerated Portion Recaptured |
|---------------|-------------------------------------|
| 1 | 100% |
| 5 | 67% |
| 10 | 33% |
| 15+ | 0% |

**Nonprofit Exception:** Transfer to qualified nonprofit (EHS) for continued affordable use is NOT a recapture event under §42(j)(5).

### 4A.4 Passive Activity Treatment

**Critical Rule:** LIHTC credits are **NOT** subject to §469 passive activity limitations.

- Credits reduce tax liability directly, regardless of passive/active status
- No phase-out based on AGI
- No material participation requirement
- Credits can offset tax from any income source

**Contrast with Depreciation:**
- Depreciation IS subject to §469 for non-REP investors
- Must have passive income to utilize passive losses
- Excess losses carry forward

### 4A.5 Credit Carryforward

If credits exceed tax liability in any year:

| Direction | Period | Authority |
|-----------|--------|-----------|
| Carryback | 1 year | IRC §39 |
| Carryforward | 20 years | IRC §39 |

### 4A.6 At-Risk Basis Requirement

Investor must have sufficient at-risk basis to claim credits. For qualified nonrecourse debt secured by real property, full debt amount counts as at-risk basis.

**Verification:** At-risk basis ≥ Cumulative credits claimed.

---

## Part 5: Exit Strategy

### 5.1 EHS Nonprofit Exit

**Primary Exit (Year 10-11):** Sale to Enterprise Housing Solutions (EHS) or similar nonprofit.

**Structure:**
- Right of First Refusal (ROFR) granted at closing
- Exit price formula in operating agreement
- Continued affordable housing operation post-exit
- No LIHTC recapture (§42(j)(5) nonprofit exception)

### 5.2 Exit Pricing

**Formula Approach:**
```
Exit Price = Outstanding Debt + Accrued Returns + Negotiated Premium
```

**Cap Rate Approach:**
```
Exit Price = Year 10 NOI / Exit Cap Rate
Less: Outstanding Debt
= Equity Proceeds
```

### 5.3 OZ Exit Benefits

**10+ Year Hold Required for Full Benefits:**
- Basis step-up eliminates deferred gain
- Appreciation exclusion (100% tax-free)
- No depreciation recapture

**Exit Timing Optimization:**
- Year 10 minimum for OZ exclusion
- Year 11 captures full LIHTC (if PIS after January)
- Balance IRR optimization vs. credit capture

### 5.4 Exit Year Constraints *(New in v7.0)*

**Calculator Limits:**
- Minimum exit: Year 10 (OZ holding requirement)
- Maximum exit: Year 11 (EHS ROFR structure)
- Default: Year 10

**KISS Decision:** Complex variable exit years (7-15) deferred. Current version supports Year 10 or 11 only.

---

## Part 6: Investor Tax Utilization Under §469

### 6.1 Real Estate Professional Track

**Qualification:**
- 750+ hours in real property trades/businesses
- More than 50% of personal services in real property activities
- Material participation in rental activity

**Benefits:**
- Depreciation offsets ordinary income (not limited to passive)
- Subject to §461(l) excess business loss cap ($626K MFJ 2025)
- Excess converts to NOL carryforward

### 6.2 Passive Investor Track

**Treatment:**
- Depreciation limited to passive income offset
- Excess losses carry forward indefinitely
- LIHTC credits NOT limited by passive rules

### 6.3 REP Investment Sizing

**Optimization Target:**
```
Maximum Efficient Investment = §461(l) Cap / Year 1 Depreciation Rate
```

Investments above this threshold create NOL carryforward rather than immediate deduction—still valuable but lower NPV.

### 6.4 Spousal Attribution

Non-REP spouse can benefit from REP spouse's status if:
- Filing jointly
- Material participation through spouse's activities
- Joint ownership of investment

---

## Part 7: HFA Compliance & Feasibility

### 7.1 4% LIHTC Requirements

**Private Activity Bond (PAB) Threshold:**
- Minimum 50% of aggregate basis financed with PABs
- Some states allow 25% threshold for specific programs

**Income Limits:**
- 40/60 Test: 40% of units at 60% AMI, OR
- 20/50 Test: 20% of units at 50% AMI, OR
- Income Averaging: Average across units ≤ 60% AMI

### 7.2 WSHFC Specific Requirements

Washington State Housing Finance Commission:
- Land Use Restrictive Agreement (LURA) for 40-year term
- Annual compliance reporting
- Amazon HEF qualifies as "public support"

### 7.3 Income Averaging Election

Allows unit-by-unit designation from 20-80% AMI while maintaining 60% average. Provides operational flexibility for mixed-income properties.

---

## Part 7A: Prevailing Wage Considerations

### 7A.1 Three-Tier Framework

| Tier | Trigger | PW Required | HDC Strategy |
|------|---------|-------------|--------------|
| **Federal 4% LIHTC** | PAB financing | **Yes** (IRA 2022) | Accept—unavoidable for 4% |
| **Federal 9% LIHTC** | Competitive allocation | **Yes** (IRA 2022) | Not pursuing 9% |
| **State LIHTC** | Varies by state | Varies | Evaluate per state |

### 7A.2 Pre-TCO Acquisition Strategy

**Avoiding State LIHTC PW:**
1. Acquire property after construction complete (TCO issued)
2. Construction performed by third party without LIHTC involvement
3. HDC applies for state LIHTC post-acquisition
4. Federal PW already satisfied; state PW not triggered

**Applicable States:** California, potentially New Jersey.

### 7A.3 PW Cost Impact

| Scenario | Typical Premium | Notes |
|----------|-----------------|-------|
| Federal PW (4%) | 5-15% | Built into all 4% deals |
| State PW (CA) | 10-20% additional | Significant cost increase |
| Pre-TCO Strategy | 0% state premium | Avoids state trigger |

### 7A.4 Display Requirements

Calculator must show:
- Federal PW status (always Yes for 4% LIHTC)
- State PW warning if property state triggers
- Cost impact estimate if PW applies

**Reference:** See Addendum v7.0 Part 2 for state-by-state PW triggers.

---

## Part 8: Geographic Strategy

### 8.1 Property Location Criteria

**Tier 1 Markets (100% State LIHTC + Full OZ + No State PW):**
- Georgia
- Nebraska
- South Carolina
- Kansas (2028 sunset)

**Tier 2 Markets (Partial Benefits):**
- Oregon (dual conformity, no state LIHTC)
- Ohio, Missouri, DC (supplement state LIHTC)

**Tier 3 Markets (Federal Only):**
- California (no OZ conformity, state PW)
- New York (OZ decoupled 2021)

### 8.2 Investor Location Strategy

**Optimize for High-Tax Conforming States:**
- New Jersey: 10.75% + full OZ conformity
- Connecticut: 6.99% + full OZ conformity
- Oregon: 9.9% + full OZ + full bonus dep
- Minnesota: 9.85% + full OZ (but state 4% triggers PW)

**NJ/CT Corridor Concentration:**
- 517,000 millionaire households
- Massive hedge fund presence
- Full OZ conformity
- 2-hour radius from NYC

### 8.3 Property-Investor Mismatch Strategy

Property location ≠ Investor residence. Optimal structure:
- Property in GA/NE/SC (100% state LIHTC, no state PW)
- Investors in NJ/CT/OR (high state rates, full OZ conformity)
- State LIHTC syndicated to in-state investors at 80-90%

### 8.14 Mid-Compliance Property Transfers *(From v6.7)*

**LIHTC Credit Succession:**
- Credits can transfer to new qualified owners
- New owner assumes compliance obligations
- No recapture if continued qualified use
- §42(d)(7) acquisition credit rules apply

**EHS Exit Implications:**
- Tax-exempt buyer cannot use credits
- All credit value must be captured pre-exit
- Year 10-11 exit timing critical for credit optimization

### 8.15 Lease-Up Strategy *(From v6.7)*

**First-Year Credit Optimization:**

| PIS Month | Lease-Up Window | Year 1 Credit Capture |
|-----------|-----------------|----------------------|
| January | 12 months | 100% |
| July | 6 months | 50% |
| December | 1 month | 8.3% |

**Optimal Strategy:** Target January 1 PIS when feasible. Provides full calendar year for lease-up within first credit year.

**Aggressive Lease-Up Assumption:**
- 100% qualified occupancy by end of first calendar year
- Market-ready units pre-PIS
- Pre-leasing to qualified tenants
- This is optimization, not survival—even 24-month lease-up yields viable ~2.9x returns

---

## Part 9: Pre-PIS Acquisition Strategy

### 9.1 Concept

Acquire properties in Opportunity Zones before placed-in-service date to capture both:
- Development-phase value creation
- Full OZ holding period from acquisition

### 9.2 Timing Requirements

- QOF must hold QOZP within 180 days of capital gain
- 31-month working capital safe harbor for development
- Substantial improvement test (double basis in 30 months) if existing structure

### 9.3 Mid-Construction Entry

If entering after construction start:
- Verify remaining work qualifies for substantial improvement
- Confirm OZ census tract designation still active
- Structure acquisition to preserve OZ eligibility

---

## Part 10: Mid-Construction LIHTC Conversion

### 10.1 Conversion Mechanics

Properties under construction can convert to LIHTC structure if:
- PAB financing added before PIS
- Income restrictions implemented at lease-up
- Compliance documentation established

### 10.2 OID Considerations

Original Issue Discount may arise if bonds issued at discount. Track for:
- Basis calculations
- Interest expense timing
- Investor K-1 reporting

---

## Part 11: Wealth Manager Perspective

### 11.1 Channel Strategy

**Primary Channel:** RIAs and family offices serving:
- Real Estate Professionals
- Hedge fund principals
- Business exit investors
- Crypto gains investors

**Distribution Partners:**
- Caprock Group ($8.6B AUM, 308 ultra-wealthy families)
- Specialist OZ advisors
- Tax-focused wealth managers

### 11.2 Investment Minimums

| Tier | Minimum | Typical Investor |
|------|---------|------------------|
| Standard | $500K | High-net-worth individual |
| Institutional | $2M+ | Family office, RIA allocation |

### 11.3 Comparison to Alternatives

| Vehicle | Typical Multiple | Liquidity | Tax Efficiency |
|---------|------------------|-----------|----------------|
| HDC OZ 2.0 | 4.3x | 10-year lock | Highest |
| Traditional OZ | 2.5-3.0x | 10-year lock | High |
| LIHTC Syndication | N/A (corp only) | 15-year | N/A |
| DST/1031 | 1.5-2.0x | 7-10 year | Medium |

---

## Part 12: Market Strategy & Timeline

### 12.1 2025-2026 Roadmap

| Phase | Timing | Milestone |
|-------|--------|-----------|
| Vegas Summit | Dec 2025 | ✅ Strategy validation |
| Novogradac Opinion | Q1 2026 | Platform credentialing |
| Sidley Tax Opinion | Q1 2026 | Federal tax confirmation |
| Calculator Launch | Q2 2026 | RetireBetterOZ.com live |
| First Fund Close | Q2-Q3 2026 | $50-100M target |

### 12.2 Strategic Partners

| Partner | Role | Status |
|---------|------|--------|
| Novogradac | CPA, industry credentialing | Active |
| Sidley Austin | Federal tax counsel | Engaged |
| Slate Property Group | National development execution | LOI stage |
| Caprock Group | Wealth management distribution | Discussions |

### 12.3 Deployment Targets

| Year | Target AUM | Project Count |
|------|------------|---------------|
| 2026 | $100M | 2-3 |
| 2027 | $250M | 5-7 |
| 2028 | $500M | 10-15 |

---

## Part 13: Platform Implementation Requirements

### 13.1 Calculator Core Requirements

**Investor Classification:**
- REP vs. Passive toggle
- Determines depreciation treatment track
- Affects §461(l) application

**OZ Toggle:**
- `ozEnabled: true/false`
- When false: show depreciation recapture at exit
- Demonstrates OZ value proposition

**State Selection:**
- Property state: determines LIHTC, PW triggers
- Investor state: determines OZ conformity, tax rates
- Dual-track calculation when states differ

### 13.2 Input Parameters

*See Addendum v7.0 Part 4 for complete parameter specification.*

**Key Parameter Groups:**
- Project basics (cost, land, NOI)
- Timing (hold period, PIS month)
- Capital structure (debt layers, equity)
- Tax assumptions (rates, cost seg %)
- LIHTC settings (DDA/QCT, applicable fraction)
- State LIHTC (enabled, percentage, syndication rate)
- Fees (AUM only)

### 13.3 Calculation Engine

**Required Calculations:**
1. Depreciable basis with cost segregation
2. MACRS schedule (federal and state tracks)
3. LIHTC credit stream (10 years + Year 11 catch-up)
4. State LIHTC (gross → syndication → net)
5. OZ benefits (deferral NPV, exclusion value)
6. Depreciation recapture (when OZ off)
7. IRR (Newton-Raphson)
8. Waterfall distributions

### 13.4 Output Requirements

**Summary Display:**
- Total investor benefits
- Multiple on invested capital
- IRR
- Year-by-year cash flow table

**Comparison Views:**
- OZ vs. non-OZ investor
- State-by-state analysis
- Scenario sensitivity

**Warnings:**
- PW triggers
- State LIHTC sunset dates
- Conformity limitations

---

## Part 14: Future Features *(New in v7.0)*

Features documented for future implementation when market demands:

| Feature | Complexity | Trigger |
|---------|------------|---------|
| 9% LIHTC credits | High | Competitive allocation deal |
| Variable exit years (7-15) | Medium | Investor demand |
| Slow lease-up modeling | Medium | Underperforming project |
| Multi-investor class waterfall | High | Institutional LP request |
| §461(l) NOL carryforward tracking | Medium | Large REP investments |
| Real-time state conformity updates | Low | Legislative changes |

**Deferred by Design:** These add complexity without improving core value proposition for initial launch.

---

## Part 15: Open Items

### Business Decisions
1. Income test election: 40-60 or Income Averaging?
2. Unit mix by AMI tier
3. EHS ROFR pricing formula

### Legal/Tax Counsel
4. §704(b) allocation confirmation for single-investor QOF
5. QOZB structure for LIHTC property ownership
6. All `[OPEN QUESTION]` items in Part 6

### Platform Implementation
7. Calculator build per Part 13
8. State conformity data sync with Addendum v7.0

---

*End of OZ 2.0 Master Specification v7.0*

*Companion Document: OZ 2.0 Addendum v7.0 (state tables, lookup data, authorities)*