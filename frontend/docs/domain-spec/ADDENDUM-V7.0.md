# OZ 2.0 Addendum

**Version:** 7.0  
**Date:** 2025-12-13  
**Status:** Final  
**Companion to:** OZ 2.0 Master Specification v7.0

---

## Purpose

This addendum provides detailed reference tables for the OZ 2.0 Master Specification:
- Part 1: State Tax Conformity (56 jurisdictions)
- Part 2: State Profiles & Prevailing Wage
- Part 3: State LIHTC Programs (25 states)
- Part 4: Complete Input Parameters

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 6.5 | 2025-12-09 | Initial unified state data (Appendix B) |
| **7.0** | **2025-12-13** | **Consolidated all addenda (v6.7, v7.0-7.2). Added State LIHTC transferability. Added syndication rates. Merged State Tax Conformity Spec v1.2. Complete parameter specification.** |

---

## Part 1: State Tax Conformity (56 Jurisdictions)

### 1.1 Conformity Types

**OZ Conformity:**
| Type | Description |
|------|-------------|
| `full-rolling` | Automatically adopts IRC changes including OZ |
| `full-adopted` | Adopted specific IRC version that includes OZ |
| `limited` | Partial conformity—see state notes |
| `none` | Explicitly decoupled from federal OZ |
| `no-cg-tax` | No state capital gains tax |
| `special` | Unique rules—see state notes |

**Bonus Depreciation Conformity:**
| Value | Meaning |
|-------|---------|
| 100% | Full federal §168(k) conformity |
| 0% | No bonus depreciation allowed |
| Partial | Percentage of federal allowed |

### 1.2 Full Conformity States (OZ + Bonus Dep)

States with both full OZ conformity AND 100% bonus depreciation:

| State | Top Rate | OZ Conformity | Bonus Dep | Authority |
|-------|----------|---------------|-----------|-----------|
| **OR** | 9.90% | Full-Rolling | 100% | ORS 316.007 |

**Note:** Oregon is the ONLY state with full conformity on both dimensions.

### 1.3 Full OZ Conformity States (31 States)

| State | Code | Top Rate | OZ Type | Bonus Dep | OZ Authority |
|-------|------|----------|---------|-----------|--------------|
| Alabama | AL | 5.00% | Full-Adopted | 0% | Ala. Code §40-18-14 |
| Arizona | AZ | 2.50% | Full-Rolling | 0% | A.R.S. §43-105 |
| Arkansas | AR | 4.40% | Full-Adopted | 0% | Ark. Code §26-51-403 |
| Colorado | CO | 4.40% | Full-Rolling | 0% | C.R.S. §39-22-103 |
| Connecticut | CT | 6.99% | Full-Adopted | 0% | Conn. Gen. Stat. §12-701 |
| Delaware | DE | 6.60% | Full-Adopted | 0% | 30 Del. C. §1105 |
| DC | DC | 10.75% | Full-Adopted | 0% | D.C. Code §47-1803.02 |
| Georgia | GA | 5.75% | Full-Adopted | 0% | O.C.G.A. §48-1-2 |
| Idaho | ID | 5.80% | Full-Rolling | 0% | Idaho Code §63-3004 |
| Illinois | IL | 4.95% | Full-Adopted | 0% | 35 ILCS 5/203 |
| Indiana | IN | 3.05% | Full-Adopted | 0% | Ind. Code §6-3-1-11 |
| Iowa | IA | 5.70% | Full-Adopted | 0% | Iowa Code §422.3 |
| Kansas | KS | 5.70% | Full-Adopted | 0% | K.S.A. §79-32,109 |
| Kentucky | KY | 4.00% | Full-Adopted | 0% | KRS §141.010 |
| Louisiana | LA | 4.25% | Full-Rolling | 0% | La. R.S. 47:287.654 |
| Maryland | MD | 5.75% | Full-Adopted | 0% | Md. Tax-Gen. §10-107 |
| Minnesota | MN | 9.85% | Full-Adopted | 0% | Minn. Stat. §289A.02 |
| Missouri | MO | 4.80% | Full-Adopted | 0% | Mo. Rev. Stat. §143.091 |
| Montana | MT | 5.90% | Full-Rolling | 0% | MCA §15-30-2101 |
| Nebraska | NE | 6.84% | Full-Adopted | 0% | Neb. Rev. Stat. §77-2714.01 |
| New Jersey | NJ | 10.75% | Full-Adopted | 0% | N.J.S.A. 54A:1-2 |
| New Mexico | NM | 5.90% | Full-Rolling | 0% | N.M. Stat. §7-2-2 |
| North Dakota | ND | 2.50% | Full-Rolling | 0% | N.D.C.C. §57-38-01 |
| Ohio | OH | 0% (no income tax) | Full-Adopted | 0% | Ohio Rev. Code §5701.11 |
| Oklahoma | OK | 4.75% | Full-Adopted | 0% | 68 O.S. §2353 |
| Oregon | OR | 9.90% | Full-Rolling | **100%** | ORS 316.007 |
| Pennsylvania | PA | 3.07% | Full-Adopted | 0% | 72 P.S. §7301 |
| Rhode Island | RI | 5.99% | Full-Adopted | 0% | R.I. Gen. Laws §44-30-1 |
| South Carolina | SC | 6.40% | Full-Adopted | 0% | S.C. Code §12-6-40 |
| Utah | UT | 4.65% | Full-Rolling | 0% | Utah Code §59-10-103 |
| West Virginia | WV | 5.12% | Full-Adopted | 0% | W. Va. Code §11-21-9 |

### 1.4 No/Limited OZ Conformity States (12 States)

| State | Code | Top Rate | OZ Status | Reason | Authority |
|-------|------|----------|-----------|--------|-----------|
| California | CA | 13.30% | None | Explicit decoupling | Cal. Rev. & Tax. §17024.5 |
| Hawaii | HI | 11.00% | None | No conformity | Haw. Rev. Stat. §235-2.3 |
| Massachusetts | MA | 9.00% | Limited | In-state OZ only | M.G.L. c. 62 §1 |
| Michigan | MI | 4.25% | None | No conformity | MCL 206.30 |
| Mississippi | MS | 5.00% | Limited | Partial exclusion | Miss. Code §27-7-5 |
| New Hampshire | NH | 0% (I&D only) | N/A | No broad income tax | RSA 77 |
| New York | NY | 10.90% | None | Decoupled 2021 | N.Y. Tax Law §612 |
| North Carolina | NC | 5.25% | Limited | Partial conformity | N.C.G.S. §105-130.2 |
| Tennessee | TN | 0% (I&D only) | N/A | No broad income tax | Tenn. Code §67-2-102 |
| Vermont | VT | 8.75% | Limited | Partial | 32 V.S.A. §5811 |
| Virginia | VA | 5.75% | Limited | Reduced exclusion | Va. Code §58.1-301 |
| Wisconsin | WI | 7.65% | None | No conformity | Wis. Stat. §71.01 |

### 1.5 No Capital Gains Tax States (8 States)

| State | Code | Notes |
|-------|------|-------|
| Alaska | AK | No state income tax |
| Florida | FL | No state income tax |
| Nevada | NV | No state income tax |
| South Dakota | SD | No state income tax |
| Texas | TX | No state income tax |
| Washington | WA | No income tax (7% CG tax on >$270K) |
| Wyoming | WY | No state income tax |

**Washington Note:** 7% capital gains tax on gains exceeding $270,000 (indexed). Does NOT conform to federal OZ provisions.

---

## Part 2: State Profiles & Prevailing Wage

### 2.1 HDC Priority States

| State | OZ | Bonus | State LIHTC | Fed 4% PW | State PW | Combined Rate | HDC Tier |
|-------|-----|-------|-------------|-----------|----------|---------------|----------|
| **GA** | ✅ Full | ❌ 0% | ✅ 100% | Yes | No | 46.6% | **1** |
| **NE** | ✅ Full | ❌ 0% | ✅ 100% | Yes | No | 47.6% | **1** |
| **SC** | ✅ Full | ❌ 0% | ✅ 100% | Yes | No | 47.2% | **1** |
| **KS** | ✅ Full | ❌ 0% | ✅ 100% | Yes | No | 46.5% | **1** ⚠️ |
| **OR** | ✅ Full | ✅ 100% | ❌ None | Yes | No | 50.7% | **2** |
| **DC** | ✅ Full | ❌ 0% | ✅ 25% | Yes | No | 51.6% | **2** |
| **MO** | ✅ Full | ❌ 0% | ✅ 70% | Yes | No | 45.6% | **2** |
| **OH** | ✅ Full | ❌ 0% | ✅ Varies | Yes | No | 40.8% | **2** |
| **NJ** | ✅ Full | ❌ 0% | ⚠️ Grant | Yes | Likely | 51.6% | **3** |
| **CA** | ❌ None | ❌ 0% | ✅ Yes | Yes | **Yes** | 54.1% | **3** |
| **CT** | ✅ Full | ❌ 0% | ⚠️ NP only | Yes | No | 47.8% | **3** |

**Legend:**
- ⚠️ KS: State LIHTC sunsets 2028
- ⚠️ NJ: STCS is grant structure, likely triggers PW
- ⚠️ CT: State LIHTC restricted to nonprofit sponsors

### 2.2 Prevailing Wage Triggers

**Federal (Applies to ALL 4% LIHTC):**
- IRA 2022 requires prevailing wage for PAB-financed projects
- Unavoidable for 4% credit structure
- Typical cost impact: 5-15%

**State Triggers:**

| State | State LIHTC PW? | Notes |
|-------|-----------------|-------|
| CA | **Yes** | Significant additional cost (10-20%) |
| NJ | **Likely** | STCS grant structure may trigger |
| MN | **Yes** | Federal 4% already triggers state PW |
| All Others | No | State LIHTC does not independently trigger |

### 2.3 Pre-TCO Acquisition Strategy States

States where pre-TCO acquisition avoids state PW while federal PW already satisfied:

| State | Strategy | Benefit |
|-------|----------|---------|
| **CA** | Acquire post-TCO | Avoid 10-20% state PW premium |
| **NJ** | Acquire post-TCO | Avoid potential STCS PW trigger |

---

## Part 3: State LIHTC Programs (25 States)

### 3.1 Transferability Types

| Type | Mechanism | Default Synd. Rate | States |
|------|-----------|-------------------|--------|
| **Certificated** | Direct sale to any state taxpayer, can resell | **90%** | CA |
| **Transferable** | Direct sale with notice to state agency | **90%** | NE, IL, NM |
| **Bifurcated** | Separate from federal, syndicate to state investors | **85%** | GA |
| **Allocated** | In-state investors join partnership for allocation | **80%** | SC, KS, AR, DC, MO, OH, most others |
| **Grant** | Not transferable—flows to project | **100%** | NJ |

### 3.2 Piggyback Programs (Automatic % of Federal)

| State | Program | % of Federal | Transferability | Synd. Rate | Cap | Sunset | PW | Authority |
|-------|---------|--------------|-----------------|------------|-----|--------|-----|-----------|
| **AR** | State LIHTC | 20% | Allocated | 80% | — | — | No | Ark. Code §26-51-1702 |
| **GA** | State LIHTC | **100%** | **Bifurcated** | **85%** | — | — | No | O.C.G.A. §33-1-18 |
| **KS** | State LIHTC | **100%** | Allocated | 80% | — | **2028** | No | K.S.A. §79-32,261 |
| **NE** | State LIHTC | **100%** | **Transferable** | **90%** | — | — | No | Neb. Rev. Stat. §77-5536 |
| **SC** | State LIHTC | **100%** | Allocated | 80% | — | — | No | S.C. Code §12-6-3795 |

**Calculator Treatment:** Auto-calculate state credits = federal credits × percentage.

### 3.3 Supplement Programs (Additional Allocation)

| State | Program | Typical % | Transferability | Synd. Rate | Cap | PW | Authority |
|-------|---------|-----------|-----------------|------------|-----|-----|-----------|
| **DC** | DC LIHTC | 25% | Allocated | 80% | — | No | D.C. Code §47-4801 |
| **MO** | AHAP | Up to 70% | Allocated | 80% | — | No | Mo. Rev. Stat. §32.111 |
| **OH** | State LIHTC | 30-50% | Allocated | 80% | $100M/yr | No | Ohio Rev. Code §175.16 |
| **VT** | State LIHTC | Varies | Allocated | 80% | — | No | 32 V.S.A. §5930u |

**Calculator Treatment:** User inputs allocated percentage.

### 3.4 Standalone Programs (Independent Allocation)

| State | Program | Transferability | Synd. Rate | Cap | PW | Authority |
|-------|---------|-----------------|------------|-----|-----|-----------|
| **AZ** | State LIHTC | Allocated | 80% | $4M/yr | No | A.R.S. §43-1164 |
| **CA** | State LIHTC | **Certificated** | **90%** | Varies | **Yes** | Cal. Rev. & Tax. §17058 |
| **CO** | AHTC | Allocated | 80% | $10M/yr | No | C.R.S. §39-22-2102 |
| **IN** | AWHTC | Allocated | 80% | — | No | Ind. Code §5-28-37 |
| **MA** | State LIHTC | Allocated | 80% | $60M/yr | No | M.G.L. c. 62 §6I |
| **NY** | SLIHC | Allocated | 80% | Varies | No | N.Y. Tax Law §18 |
| **PA** | PHTC | Allocated | 80% | $10M/yr | No | 72 P.S. §8702-C |
| **UT** | State AHTC | Allocated | 80% | $10M/yr | No | Utah Code §59-7-607 |
| **VA** | HOTC | Allocated | 80% | $60M→$250M | No | Va. Code §36-55.63:2 |
| **WI** | State LIHTC | Allocated | 80% | $7M/yr | No | Wis. Stat. §71.07(2dx) |

**Calculator Treatment:** User inputs allocated percentage.

### 3.5 Donation/Transfer Programs

| State | Program | Transferability | Synd. Rate | Cap | PW | Authority |
|-------|---------|-----------------|------------|-----|-----|-----------|
| **IL** | IAHTC | Transferable | 90% | Varies | No | 35 ILCS 5/214 |
| **NM** | Donation Credit | Transferable | 90% | Varies | No | N.M. Stat. §7-2A-19 |

**Calculator Treatment:** User inputs net credit value after transfer.

### 3.6 Restricted/Special Programs

| State | Program | Restriction | Transferability | PW | Authority |
|-------|---------|-------------|-----------------|-----|-----------|
| **AL** | WHTC | New Jan 2025 | TBD | No | Ala. Code §24-10-1 |
| **CT** | HTCC | Nonprofit sponsors only | Allocated | No | Conn. Gen. Stat. §8-395 |
| **NJ** | STCS | Grant structure | **Grant (N/A)** | **Likely** | N.J.S.A. 55:14K-40 |
| **RI** | State LIHTC | New 2024 | TBD | No | R.I. Gen. Laws §44-33.6 |
| **TN** | Rural/Workforce | New 2024 | TBD | No | Tenn. Code §13-23-133 |

**Calculator Treatment:** Verify eligibility; if eligible, user inputs percentage.

### 3.7 States Without State LIHTC (26)

AK, DE, FL, HI, ID, IA, KY, LA, ME, MD, MI, MN, MS, MT, NV, NH, NC, ND, OK, **OR**, SD, TX, WA, WV, WY

**Note:** Oregon is HDC's only dual-conformity state but has no state LIHTC program.

### 3.8 State LIHTC Value Analysis

**Out-of-State Investors (Syndication Required):**

| Property State | Gross Credits | Synd. Rate | Net Credits | Total w/ Federal | PW Risk |
|----------------|---------------|------------|-------------|------------------|---------|
| **NE** | $31.2M | 90% | **$28.1M** | $59.3M | None |
| **GA** | $31.2M | 85% | **$26.5M** | $57.7M | None |
| **SC** | $31.2M | 80% | **$25.0M** | $56.2M | None |
| **KS** | $31.2M | 80% | **$25.0M** | $56.2M | None ⚠️ |
| **CA** | $9.4M | 90% | **$8.4M** | $39.6M | **Yes** |
| **MO** | $15.6M | 80% | **$12.5M** | $43.7M | None |
| **OH** | $12.5M | 80% | **$10.0M** | $41.2M | None |
| **OR** | $0 | — | **$0** | $31.2M | None |

*Based on $31.2M federal credits from representative $100M project.*

**In-State Investors (Use Credits Directly):**

| Property State | Gross = Net | Total w/ Federal | Notes |
|----------------|-------------|------------------|-------|
| **GA** | **$31.2M** | **$62.4M** | 100% realization |
| **NE** | **$31.2M** | **$62.4M** | 100% realization |
| **SC** | **$31.2M** | **$62.4M** | 100% realization |

**Key Insight:** In-state investors capture 15-25% more value by using credits directly vs. syndicating.

---

## Part 4: Complete Input Parameters

### 4.1 Project Basics

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `projectCost` | Currency | — | $10M-$500M | Total development cost |
| `landValue` | Currency | — | 5-20% of project | Non-depreciable |
| `predevelopmentCosts` | Currency | $0 | 0-10% of project | Arch, eng, permits |
| `yearOneNOI` | Currency | — | — | Net Operating Income Y1 |
| `noiGrowthRate` | Percentage | 2% | 0-5% | Annual NOI escalation |

### 4.2 Timing Parameters

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `holdPeriod` | Years | 10 | 10-11 | Constrained to EHS exit |
| `placedInServiceMonth` | Month | 7 | 1-12 | Affects MACRS & LIHTC proration |
| `constructionMonths` | Months | 18 | 12-36 | Construction period |
| `taxBenefitDelayMonths` | Months | 3 | 0-12 | K-1 delivery timing |

### 4.3 Capital Structure - Equity

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `investorEquityPct` | Percentage | 5% | 5-25% | QOF investor equity |
| `autoBalanceCapital` | Boolean | true | — | Auto-balance to 100% |

### 4.4 Capital Structure - Senior Debt

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `seniorDebtPct` | Percentage | 65% | 30-70% | First lien debt |
| `seniorDebtRate` | Percentage | 5.5% | 4-8% | Interest rate |
| `seniorDebtAmortization` | Years | 30 | 25-35 | Amortization period |
| `seniorDebtIOYears` | Years | 0 | 0-10 | Interest-only period |

### 4.5 Capital Structure - Philanthropic Debt

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `philDebtPct` | Percentage | 30% | 0-35% | Amazon HEF, Ballmer |
| `philDebtRate` | Percentage | 2% | 0-4% | Below-market rate |
| `philDebtIOYears` | Years | 10 | 5-15 | Interest-only period |

### 4.6 Capital Structure - PABs

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `pabPct` | Percentage | 50% | 25-70% | Of senior debt |
| `pabRate` | Percentage | 5.0% | 3.5-6% | Tax-exempt rate |

### 4.7 Capital Structure - Preferred Equity *(New in v7.0)*

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `prefEquityEnabled` | Boolean | false | — | Include pref equity layer |
| `prefEquityPct` | Percentage | 23% | 0-40% | Of total capitalization |
| `prefEquityTargetMOIC` | Decimal | 1.7 | 1.0-3.0 | Target multiple |
| `prefEquityTargetIRR` | Percentage | 12% | 6-20% | Target IRR |
| `prefEquityAccrualRate` | Percentage | 12% | 6-20% | Accrual rate |

### 4.8 Tax Parameters

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `federalOrdinaryRate` | Percentage | 37% | 32-37% | Federal ordinary rate |
| `federalCapGainsRate` | Percentage | 20% | 15-20% | Federal CG rate |
| `niitRate` | Percentage | 3.8% | 0-3.8% | Net Investment Income Tax |
| `investorState` | Select | — | 50+DC | Investor residence |
| `propertyState` | Select | — | 50+DC | Property location |
| `stateOrdinaryRate` | Percentage | Auto | 0-13.3% | From investor state |
| `stateCapGainsRate` | Percentage | Auto | 0-13.3% | From investor state |

### 4.9 Depreciation Parameters

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `costSegPercent` | Percentage | 20% | 0-35% | Bonus-eligible portion |
| `bonusDepPercent` | Percentage | 100% | 0-100% | OBBBA permanent |

### 4.10 LIHTC Parameters

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `ozEnabled` | Boolean | true | — | Include OZ benefits |
| `ddaQctBoost` | Boolean | true | — | 130% basis boost |
| `applicableFraction` | Percentage | 75% | 40-100% | Qualified units |
| `pisMonth` | Integer | 7 | 1-12 | Placed-in-service month |
| `creditRate` | Display | 4% | — | 4% only (9% deferred) |

### 4.11 State LIHTC Parameters *(New in v7.0)*

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `stateLIHTCEnabled` | Boolean | Auto | — | From property state lookup |
| `stateLIHTCPercent` | Percentage | Auto/Manual | 0-100% | Auto for piggyback |
| `stateLIHTCStructure` | Display | Auto | — | From lookup |
| `stateLIHTCTransferability` | Display | Auto | — | From lookup |
| `stateLIHTCSyndicationRate` | Percentage | 85% | 70-100% | Net realization |

### 4.12 Basis Adjustments *(New in v7.0)*

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `loanFeesPercent` | Percentage | 1% | 0.5-3% | Added to basis |
| `legalStructuringCosts` | Currency | $150,000 | $50K-$500K | Added to basis |
| `organizationCosts` | Currency | $50,000 | $25K-$150K | Added to basis |

### 4.13 Fee Parameters

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `hdcAumFee` | Percentage | 1.5% | 0-3% | Annual AUM fee |
| `hdcDeferralRate` | Percentage | 8% | 0-15% | Fee deferral accrual |

**Removed:**
- ~~`hdcTaxBenefitFee`~~ — Eliminated per legal counsel

### 4.14 Exit Parameters *(New in v7.0)*

| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| `exitYear` | Select | 10 | 10, 11 | Constrained to EHS structure |
| `exitCapRate` | Percentage | 5.5% | 4-7% | For residual value calc |

---

## Part 5: Acceptance Criteria Reference

### 5.1 State LIHTC Calculation Tests

| Test | Input | Expected Output |
|------|-------|-----------------|
| GA piggyback (out-of-state) | $31.2M federal, GA property, 85% synd | $26.52M net state credits |
| GA piggyback (in-state) | $31.2M federal, GA property, 100% synd | $31.2M net state credits |
| NE transferable | $31.2M federal, NE property, 90% synd | $28.08M net state credits |
| CA standalone | $31.2M federal, CA property, 30% alloc, 90% synd | $8.42M net state credits, PW warning |
| OR (no program) | $31.2M federal, OR property | $0 state credits |
| KS piggyback | $31.2M federal, KS property | $25.0M net (80%), sunset warning |

### 5.2 Conformity Combination Tests

| Test | Property State | Investor State | Expected |
|------|----------------|----------------|----------|
| Dual conformity | OR | OR | Full OZ + full bonus + no state LIHTC |
| State LIHTC only | GA | NJ | Full OZ (NJ), no bonus (NJ), 100% state LIHTC (GA) |
| Federal only | CA | CA | No OZ, no bonus, state LIHTC with PW warning |
| No state tax | GA | WA | No state benefits, 100% state LIHTC (GA) |

### 5.3 Depreciation Recapture Tests

| Test | OZ Enabled | Expected |
|------|------------|----------|
| OZ investor exit | true | $0 recapture |
| Non-OZ exit | false | Cumulative depreciation × 25% shown |

---

## Appendix: Data Sources

| Data Category | Primary Source | Last Updated |
|---------------|----------------|--------------|
| OZ Conformity | Novogradac State Tax Code Conformity | December 2025 |
| Bonus Depreciation | Tax Foundation + state statutes | December 2025 |
| State LIHTC | NCSHA Housing Credit Database + state HFAs | December 2025 |
| Tax Rates | Tax Foundation | December 2025 |
| PW Requirements | IRA 2022 + state statutes | December 2025 |

**Maintenance Note:** State LIHTC programs change frequently. Annual review required for:
- New programs (AL, RI, TN launched 2024-2025)
- Sunsets (KS 2028)
- Cap changes (VA expanding 2026)
- PW rule changes

---

*End of OZ 2.0 Addendum v7.0*

*Companion Document: OZ 2.0 Master Specification v7.0*