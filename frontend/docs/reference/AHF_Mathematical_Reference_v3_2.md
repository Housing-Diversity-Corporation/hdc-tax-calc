**HDC American Housing Fund**

**Mathematical Architecture of the Investment Analysis Platform**

Housing Diversity Corporation  |  May 2026  |  v3.2  |  Confidential — Internal Use Only

**PROPRIETARY — TRADE SECRET — Do not share externally.**

v3.1 added four new formula sections (H-1 through H-4) closing Category 1 gaps. v3.2 adds Part 8 — Risk-Adjusted Return Mathematics (R-1 through R-7). New sections marked ★ NEW. Total: 47 platform items + 7 investment analytics sections.

This paper presents the mathematical architecture of HDC’s investment analysis platform in the logical order of the investment: how a deal is modeled, how an investor’s profile is characterized, how the optimal commitment is found, how tax attributes are tracked during the hold, how exit proceeds are computed, how geography affects the result, and how the analysis scales across a portfolio. All 47 formulas and algorithms are extracted directly from the production codebase. Every expression reflects what the engine computes.

Platform Overview precedes Part 1. Supporting Methods follows Part 8. Appendix A consolidates all hardcoded constants.

**Notation Guide**

| Code | Meaning | Notes |
| :---- | :---- | :---- |
| G— | General — deal-level formula | Capital stack, cash flow, waterfall, geography. Primary file: calculations.ts |
| E— | Engine — investor-specific formula | §461(l), §469, §38(c), sizing. Primary file: investorTaxUtilization.ts |
| H— | Hole — Category 1 gap item | Deployed feature with no prior formula documentation. Added v3.1. |
| P— | Partial expansion of an existing item | Sub-formula warranting its own entry. Same file as parent. |
| C | Currently deployed | Live in production codebase at IMPL-166 or earlier |
| F | Future roadmap | Specced but not yet built. IMPL reference shown inline. |
| PARTIAL | Partly implemented | Core formula deployed; some sub-components not yet wired |
| ★ | New in v3.1 or v3.2 | Marked inline at each section header |

**Platform Overview**

HDC’s American Housing Fund deploys private capital into qualified affordable housing through three federal tax channels: the Low Income Housing Tax Credit under §42, which delivers a credit stream across a ten-year compliance period; bonus depreciation under §168(k), which produces a front-loaded deduction in Year 1; and Opportunity Zone treatment under §1400Z-2, which defers and potentially excludes capital gains for investors in designated zones. These statutory provisions form the majority of investor returns — a component that is calculated, not projected, and that does not depend on market performance or interest rates. The platform is designed to expand to additional statutory channels as deal types broaden; likely additions include the Historic Tax Credit under §47 and state-level LIHTC programs, both of which share the same statutory architecture as the federal credit.

|  | *The majority of investor returns derive from statutory provisions defined by federal law. They are calculated from deal parameters, not projected from market assumptions.* |
| :---- | :---- |

The platform’s central problem is that the optimal investment size for a given investor depends entirely on that investor’s specific tax situation. Three statutory ceilings limit how much of each year’s benefit can be absorbed: the §461(l) excess business loss cap, the §38(c) general business credit ceiling, and the §469 passive activity income ceiling. These vary by income level, filing status, and investor type. The optimizer finds the commitment level where the ratio of realized tax benefit to committed capital peaks for each specific investor.

**THREE-COMPONENT RETURN STRUCTURE**

| Component | Basis | Formula |
| :---- | :---- | :---- |
| LIHTC credits (Years 1–11) | Statutory — IRC §42 | B^qual × ρ\_42 × applicable fraction |
| Bonus depreciation (Year 1\) | Statutory — IRC §168(k) | D^basis × costSeg% × marginal rate |
| Operating distributions | Underwritten at close | NOI − debt service − reserves − fees |
| Exit appreciation | Projected (5.0% base cap rate) | Stabilized NOI ÷ exitCapRate − debt payoff |

The platform models deal and investor simultaneously. Parts 1 and 2 cover each independently. Part 3 shows how they are brought together in the optimization. Parts 4–7 follow the investment lifecycle from construction through exit, then geographic adjustment and portfolio scale.

**Part 1  The Deal Model**

The deal model translates a capital stack, project budget, and operating assumptions into a structured year-by-year benefit stream. Six components are computed: the depreciation schedule, the LIHTC credit schedule, PIK accrual on soft debt, operating cash flow through the waterfall, exit valuation, and OZ parameter wiring. Together these produce the arrays consumed by the investor model and the optimizer.

**G-1  —  Depreciation Schedule Construction**

Closed form: **YES**

The platform builds a year-by-year depreciation array: all cost-seg basis in Year 1 as bonus depreciation, then straight-line MACRS on the remaining basis across the 27.5-year residential class life. The §1245/§1250 character split is stored cumulatively for use by the exit-tax model (E-17).

**DEPRECIABLE BASIS AND COST-SEG SPLIT**

D^basis \= (C\_proj \+ C\_predev \+ F\_loan \+ C\_legal \+ C\_org) − C\_land  
D^1245  \= D^basis × p^costSeg          (§1245 bonus-eligible portion)  
D^rem   \= D^basis − D^1245            (§1250 straight-line base)

**ANNUAL DEPRECIATION SCHEDULE**

d\_1 \= D^1245,  d^SL\_1 \= 0           (Year 1: full bonus, no SL)  
d\_t \= D^rem / 27.5                  (Years 2+: straight-line MACRS)

Cumulative character at exit year T:  
  D^cum1245\_T \= D^1245              (all in Year 1\)  
  D^cum1250\_T \= (T−1) × D^rem / 27.5

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| D^basis | Real ≥0 | Depreciable basis (millions) | projectCost+predev+fees−land |
| p^costSeg | \[0,1\] | Cost-seg fraction (Year 1 %) | yearOneDepreciationPct/100 |
| D^1245 | Real ≥0 | Bonus-eligible portion | cumulative1245 |
| D^rem | Real ≥0 | Straight-line base | remainingBasis |

▶  depreciationSchedule.ts:60-203 (buildDepreciationSchedule)

**G-2  —  LIHTC Credit Schedule Construction**

Closed form: **YES**

The 11-year LIHTC credit array is built from eligible basis, DDA/QCT boost, stabilized applicable fraction, and the §42 credit rate. A Year 1 partial-year proration plus a Year 11 catch-up ensures the invariant Σ C\_t \= 10A. The §42(f)(1) election defers the credit period start, producing C\_1 \= A and C\_11 \= 0\.

**QUALIFIED BASIS AND ANNUAL CREDIT**

B^qual \= B^elig × μ × AF^stab       (μ=1.30 DDA/QCT, else 1.0)  
A      \= B^qual × ρ\_42              (full-year stabilized credit)

Year 1 proration factor:  
  π\_1 \= 1.0                        (if §42(f)(1) election active)  
  π\_1 \= (13 − m\_PIS) / 12          (otherwise)

C\_1  \= B^elig × μ × AF^Y1eff × ρ\_42 × π\_1  
C\_t  \= A                             (t \= 2..10)  
C\_11 \= A − C\_1                       (catch-up; \= 0 if election active)

Invariant: Σ C\_t \= 10A  (±$0.001M)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| B^elig | Real ≥0 | Eligible basis (millions) | lihtcEligibleBasis |
| μ | {1.0,1.3} | DDA/QCT boost multiplier | boostMultiplier |
| ρ\_42 | (0,1) | §42 credit rate (0.04 or 0.09) | creditRate |
| m\_PIS | {1..12} | Placed-in-service month | pisMonth |

▶  lihtcCreditCalculations.ts:470-595 (calculateLIHTCSchedule)

**G-3  —  PIK Accrual During Construction**

Closed form: **ALGORITHMIC**

Soft-debt tranches with a pay rate below the note rate accrue PIK interest during construction when current-pay is suppressed. Current-pay activates only after the interest-reserve period ends. If the waterfall cannot fund the full current-pay obligation, the shortfall rolls into the PIK balance.

**ANNUAL INTEREST CHARGE AND PIK SPLIT**

I\_t^j   \= B\_j^{t−1} × r^note\_j / 100      (annual interest)  
cpActive \= β^cp\_j ∧ (t \> interestReservePeriodYears)  
I^cp\_t^j \= I\_t^j × p^cp\_j / 100           (if cpActive, else 0\)  
I^PIK\_t^j \= I\_t^j − I^cp\_t^j  
B\_j^t   \= B\_j^{t−1} \+ I^PIK\_t^j \+ (I^cp\_t^j − P\_t^j)

Cash-sweep paydown (IMPL-165):  
  ΔB^sweep\_j \= min(remainingCash × p^sweep\_j/100, B\_j^t)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| B\_j^t | Real ≥0 | End-of-year PIK balance tranche j | philPikBalance, hdcDebtFundPikBalance |
| r^note\_j | Real | Note rate (%) | philanthropicDebtRate, etc. |
| p^cp\_j | \[0,100\] | Current-pay percent of interest | philCurrentPayPct |

*F — IMPL-186: per-tranche deal\_debt\_tranches schema not yet implemented; current engine uses fixed-tranche model.*

▶  calculations.ts:986-1066 (per-tranche PIK accrual); sweeps at :1428-1450

---

**H-1  —  Developer Deferred Fee (DDF) C Note** ★ NEW v3.1

Closed form: **YES per step**

*Insert after G-3 (PIK Accrual During Construction)*

The Developer Deferred Fee C Note mechanics (IMPL-166): a face-value deferred fee with no PIK accrual, split between a closing portion (paid at deal close, reducing net investor equity) and a deferred portion (paid down from CADS surplus during the hold, with any remaining balance deducted at exit).

**Closing-portion offset (reduces net investor equity at Year 0)**

```
F^{DDF,close} = min(devFeeClosingAmount, devFeeTotal)
E^{net,investor} = E^{investor} - F^{synd_offset} - F^{DDF,close}
```

**Initial deferred balance**

```
F^(0)_DDF = max(0, devFeeTotal - F^{DDF,close})
```

**Per-year paydown (Priority 5 in operating waterfall)**

For each year t where F^(t-1)\_DDF > 0 and remainingCash > 0 after upstream payments:

```
P^DDF_t = min(remainingCash_t, F^(t-1)_DDF)
F^(t)_DDF = F^(t-1)_DDF - P^DDF_t
remainingCash_t -= P^DDF_t
```

**No interest accrual**

```
F^(t)_DDF = F^(t-1)_DDF - P^DDF_t   (no PIK term - face value only)
```

Distinguishing structural feature vs G-3: the DDF balance is monotonically non-increasing during the hold. It cannot grow.

**Exit deduction (Tier 2 in G-14 waterfall)**

```
devFeeAtExit = F^(exitYear)_DDF

V^(2) = max(0, V^(1) - hdcSubAtExit - invSubAtExit
              - outsideSubAtExit - hdcDebtFundAtExit - devFeeAtExit)
```

| Symbol | Type | Description | Source field |
| :---- | :---- | :---- | :---- |
| devFeeTotal | R ≥0 | Face value of the C Note (millions) | paramDevFeeTotal |
| devFeeClosingAmount | R ≥0 | Portion paid at close from investor capital | paramDevFeeClosingAmount |
| F^{DDF,close} | R ≥0 | Closing offset (capped at face value) | devFeeClosingOffset |
| F^(t)\_DDF | R ≥0 | Deferred balance at end of year t | devFeeDeferred |
| P^DDF\_t | R ≥0 | Year-t paydown from surplus | devFeePayment |
| devFeeAtExit | R ≥0 | Remaining balance at exit | devFeeAtExit |

Closing portion is capped at face value. No interest. No PIK compounding. validateExitDebtPayoff (IMPL-164) includes devFeeAtExit in validation check. Does not participate in percentage sweep mechanism.

*Note (May 2026): IMPL-190 adds devFeePct (1–20% of TDC minus land) as computed input for devFeeTotal. devFeeClosingAmount remains a direct dollar input. Existing waterfall mechanics unchanged.*

▶  calculations.ts:303-305 (parameter ingestion); :496-498 (closing offset); :558-559 (initial deferred); :1452-1459 (Priority-5 paydown); :2002-2003 (exit balance); :2029 (exit deduction); :2034-2044 (exit-debt validation)

---

**H-2  —  AUM Fee: Deferred Balance Accumulation and Catch-Up** ★ NEW v3.1

Closed form: **ALGORITHMIC** (multi-pool recurrence with waterfall-dependent payment values)

*Insert after H-1 (Developer Deferred Fee C Note)*

HDC’s annual asset-management fee mechanics. Two deferred balance pools — intentional PIK and unpaid current-pay — each accruing interest at the HDC deferred rate, with priority-3 payment from operating cash and priority-4 catch-up.

*Note (May 2026): AUM fee is dormant in Scenario A (HDC as developer) via IMPL-190. Will be reactivated in IMPL-192 (Scenario B — HDC as asset manager). Logic preserved in codebase; dormancy is parameter-level only.*

**Step 1 — Annual fee base (active only post-PIS)**

```
F^{base,AUM}_t = C_e x (r_AUM / 100)
    (prorated by dispositionFraction in exit year)
    Fee = 0 for all t <= placedInServiceYear
```

**Step 2 — Prior-period interest accrual (before new fee charged)**

```
F^{PIK,(t-1+pre)} = F^{PIK,(t-1)} x (1 + r_HDC,def / 100)
F^{cpDef,(t-1+pre)} = F^{cpDef,(t-1)} x (1 + r_HDC,def / 100)
r_HDC,def default = 8%
```

**Step 3 — Current-pay / PIK split**

```
If aumCurrentPayEnabled:
  F^{cpDue}_t = F^{base,AUM}_t x (p^{cp,AUM} / 100)
  F^{PIKDue}_t = F^{base,AUM}_t x ((100 - p^{cp,AUM}) / 100)
Else (ISS-056):
  F^{cpDue}_t = 0
  F^{PIKDue}_t = F^{base,AUM}_t    (entire fee deferred immediately to PIK)
```

**Step 4 — Priority-3 payment queue**

```
F^{Q-AUM}_t = F^{cpDue}_t + F^{cpDef,(t-1+pre)}   (if aumCurrentPayEnabled)
F^{Q-AUM}_t = 0                                     (if disabled)
```

**Step 5 — Waterfall pays P^AUM\_t subject to DSCR retention**

```
If shortfall (P^AUM_t < F^{cpDue}_t):
  delta_cpDef = F^{cpDue}_t - P^AUM_t
If catch-up (P^AUM_t >= F^{cpDue}_t):
  delta_cpDef = -min(P^AUM_t - F^{cpDue}_t, F^{cpDef,(t-1+pre)})
F^{cpDef,(t)} = F^{cpDef,(t-1+pre)} + delta_cpDef
F^{PIK,(t)} = F^{PIK,(t-1+pre)} + F^{PIKDue}_t
```

**Step 6 — Priority-4 catch-up (IMPL-030)**

```
P^{catchup}_t = min(remainingCash_t, F^{cpDef,(t)} + F^{PIK,(t)})
delta_cpDef = min(P^{catchup}_t, F^{cpDef,(t)})
F^{cpDef,(t)} -= delta_cpDef
F^{PIK,(t)} -= max(0, P^{catchup}_t - delta_cpDef)
remainingCash_t -= P^{catchup}_t
```

**Step 7 — Total accumulated balance and exit deduction**

```
F^{deferred}_{AUM,t} = F^{PIK,(t)} + F^{cpDef,(t)}

Exit deduction (Tier 5 of G-14):
P^{LP,exit} = max(0, P^{LP,gross} - F^{deferred}_{AUM,exitYear})
```

Per HDC\_CALCULATION\_LOGIC.md: deferred AUM fees come from the LP’s exit share, not HDC’s promote.

Warning thresholds: F^deferred\_AUM,exit > P^LP,gross → console.error CRITICAL. F^deferred\_AUM,exit / P^LP,gross > 0.80 → console.warn.

| Symbol | Type | Description | Source field |
| :---- | :---- | :---- | :---- |
| r\_AUM | R | AUM fee rate (%) | paramAumFeeRate |
| r\_HDC,def | R | HDC deferred interest rate (% default 8) | paramHdcDeferredInterestRate |
| p^{cp,AUM} | R\[0,100\] | Current-pay percent of fee | paramAumCurrentPayPct |
| C\_e | R ≥0 | Effective project cost (millions) | effectiveProjectCost |
| F^{PIK,(t)} | R ≥0 | Intentional PIK pool | accumulatedAumPIK |
| F^{cpDef,(t)} | R ≥0 | Unpaid current-pay pool | accumulatedAumCurrentPayDeferred |
| F^{deferred}\_{AUM,t} | R ≥0 | Total accumulated (PIK + cpDef) | accumulatedAumFees |

ISS-056 fix: when aumCurrentPayEnabled = false, entire fee bypasses payment queue and immediately compounds into PIK pool. IMPL-030 fix: catch-up handler ensures deferred balances reduce when subsequent years generate surplus.

▶  calculations.ts:577-579 (pool init); :1172-1213 (fee base + PIK split); :1244-1250 (ISS-056); :1298-1336 (Priority-3); :1396-1426 (Priority-4 catch-up); :2068-2071 (exit deduction); :2078-2116 (warning thresholds)

---

**G-4  —  Operating Cash Flow Model**

Closed form: **ALGORITHMIC**

Annual NOI grows from a Year 1 anchor and is adjusted by the S-curve lease-up occupancy (E-6) during ramp-up. Hard debt service is computed from the standard amortization formula with an IO-period guard. A 1.05× DSCR covenant retains a cash buffer; the surplus flows through a seven-tier soft-pay waterfall.

**NOI GROWTH AND EFFECTIVE NOI**

NOI^base\_t \= NOI^base\_{t−1} × (1 \+ g\_NOI/100)  
NOI^eff\_t  \= NOI^base\_t × f\_avg\_t    (S-curve adjusted, lease-up years)  
NOI^eff\_t  \= NOI^base\_t              (post-stabilization)

**HARD DEBT SERVICE AND DSCR ENFORCEMENT**

M \= S × (r\_s/12) / (1 − (1+r\_s/12)^{−N})   (standard amortization)  
hardDS\_t \= annualSeniorDS\_t \+ annualPabDS\_t \+ philCurrentPay\_t  
requiredForDSCR\_t \= hardDS\_t × 1.05        (δ \= 1.05)  
available\_t \= max(0, NOI^eff\_t \+ ΔR\_t − requiredForDSCR\_t)

**SOFT-PAY WATERFALL PRIORITY**

1\. Outside Investor \+ DDF current-pay (pari-passu)  
2\. HDC Sub Debt \+ Investor Sub Debt current-pay  
3\. HDC AUM fee current portion  
4\. AUM catch-up on deferred balance  
5\. Phil sweep (p^sweep\_phil % of remaining cash)  
6\. DDF sweep (p^sweep\_DDF % of remaining cash)  
7\. Developer Deferred Fee paydown (face value)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| g\_NOI | Real | Annual NOI growth rate (%) | noiGrowthRate |
| S | Real ≥0 | Senior debt principal | seniorDebtAmount |
| δ | Real | DSCR covenant threshold | DSCR\_COVENANT\_THRESHOLD \= 1.05 |
| R^t | Real ≥0 | Interest reserve balance | interestReserveBalance |

▶  calculations.ts:730-1525 (cash-flow loop)

**G-5  —  Exit Valuation Model**

Closed form: **YES**

Exit value uses the income approach: trailing-12-month NOI divided by the exit cap rate. Gross exit value then flows through a five-tier waterfall — hard debt, soft debt and PIK balances, preferred equity, return of capital plus profit split, then deferred AUM fees — to produce net LP exit proceeds.

**INCOME-APPROACH VALUATION**

NOI^TTM \= (12−m\_exit)/12 × NOI^{N−1}\_ann \+ m\_exit/12 × NOI^N\_ann  
V^exit  \= NOI^TTM / r\_cap                (r\_cap \= exitCapRate/100)

Tier 1: V^1 \= max(0, V^exit − remSenior − remPhil − remPAB)  
Tier 2: V^2 \= max(0, V^1 − hdcSub − invSub − outsideSub − DDF − devFee)  
Tier 3: V^3 \= max(0, V^2 − min(V^2, E^pref × prefMOIC))  
Tier 4: ROC \= min(V^3, E^inv − E^recovered);  profit \= V^3 − ROC  
        LPProfit \= profit × p^LP / 100  
Tier 5: P^LP\_exit \= max(0, ROC \+ LPProfit − F^deferred\_AUM)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| r\_cap | (0,1) | Exit cap rate | exitCapRate/100 (base 0.05) |
| p^LP | \[0,100\] | LP promote share % of profit | investorPromoteShare |
| F^deferred\_AUM | Real ≥0 | Accumulated deferred AUM fees | accumulatedAumPIK \+ deferred |

*F — IMPL-185: forgivable debt toggle not yet implemented; all soft debt treated as real liability at exit.*

▶  calculations.ts:1950-2071 (exit valuation \+ waterfall)

**G-6  —  OZ Deal Parameter Ingestion**

Closed form: **YES**

For Opportunity Zone deals, the engine computes a version-aware deferral period and a 10-year floor binding flag. OZ 1.0 uses actual days to the statutory inclusion date (December 31, 2026). OZ 2.0 uses five years unconditionally. When the 10-year minimum hold date exceeds the LIHTC-optimal exit date, the engine extends the exit to preserve the full appreciation exclusion.

n\_1.0 \= days(investmentDate, 2026-12-31) / 365.25   (OZ 1.0, if before cutoff)  
      \= 0                                           (OZ 1.0, after cutoff)  
n\_2.0 \= 5                                           (OZ 2.0, unconditional)

ozMinimumDate  \= investmentDate \+ 120 months  
ozFloorBinding \= ozEnabled ∧ (ozMinimumDate \> optimalExitDate)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| n | Real ≥0 | Deferral years (feeds E-18) | deferralYears |
| ozFloorBinding | bool | 10-year floor overrides LIHTC exit | ozFloorBinding |

*IMPL-163 correction: prior implementation hardcoded n=5 for OZ 1.0, overstating NPV by \~14× for late-investment dates.*

▶  calculations.ts:2156-2202; computeTimeline.ts:69-115

**Part 2  The Investor Model**

The investor model characterizes the tax profile, statutory treatment track, and annual utilization constraints for each investor. The key branching decision — nonpassive vs passive treatment — is determined once per calculation and gates two structurally distinct calculation paths. Sections 2.1 through 2.7 describe the components of each path.

**G-7  —  Investor Track Selection**

Closed form: **YES**

Treatment is a discrete function of REP qualification and the §469(c)(7)(A)(ii) grouping election. It is determined once at the start of calculateTaxUtilization and persists for every year in the loop. REP+grouped is the only combination that activates nonpassive treatment, suspending §469 and activating the §461(l)/§38(c) path instead.

T(track, grouped):  
  \= 'nonpassive'  if track='rep' ∧ grouped=true  
  \= 'passive'     if track='rep' ∧ grouped=false  (REP+ungrouped)  
  \= 'passive'     if track='non-rep'

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| track | 'rep'|'non-rep' | REP qualification flag (input) | InvestorProfile.investorTrack |
| grouped | bool | §469(c)(7)(A)(ii) election | InvestorProfile.groupingElection |
| treatment | enum | Calculation-path selector | output of determineTreatment |

▶  investorTaxUtilization.ts:308-319 (determineTreatment); year-loop branch at :839-902

**E-3  —  Character-Weighted Effective Passive Rate**

Closed form: **YES**

Not all passive income is taxed at the same rate. Ordinary passive income faces the full federal marginal rate plus NIIT. LTCG passive income faces the 20% LTCG rate plus NIIT. The weighted average reflects the investor’s actual income mix. A fully LTCG passive investor’s effective rate is up to 41.7% lower than an all-ordinary assumption.

r\_eff \= (P\_ord × r\_m \+ P\_LTCG × r\_ℓ) / P     if P \> 0  
      \= r\_m                                   (legacy fallback)

Canonical values:  r\_m \= 0.408 (37% \+ 3.8% NIIT)  
                   r\_ℓ \= 0.238 (20% \+ 3.8% NIIT)  
Max discount:      (0.408 − 0.238) / 0.408 ≈ 41.7%

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| P\_ord | Real ≥0 | Ordinary passive income (millions) | passiveOrdinaryIncome |
| P\_LTCG | Real ≥0 | LTCG passive income (millions) | passiveLTCGIncome |
| r\_ℓ | \[0,1\] | LTCG rate \+ NIIT | passiveLTCGRate |

▶  investorTaxUtilization.ts:521-532 (computeDepreciationPassive)

**E-5  —  NIIT Passive Uplift Mechanism**

Closed form: **YES**

The 3.8% NIIT surcharge applies to passive investors but is explicitly excluded for REP+grouped under §1411(c)(1)(A) (materially participating trade or business). This creates a per-dollar differential between equivalent passive and nonpassive investors.

σ\_NIIT(T,s) \= 0.038   if T='passive' ∧ doesNIITApply(s)  
             \= 0       if T='nonpassive' or territory resident

r\_m^T \= r\_m^fed \+ σ\_NIIT(T,s)  
Δ \= 0.038  (3.8 cents additional savings per dollar of depreciation)

▶  investorTaxUtilization.ts:790-796

**E-7  —  §461(l) Cap, NOL Generation, and Depreciation Savings**

Closed form: **YES**

The §461(l) excess business loss cap limits how much depreciation a REP+grouped investor can deduct in Year 1\. Depreciation above the cap generates an NOL carryforward that draws down at 80% of taxable income per year under §172.

D\_allowed\_t \= min(D\_t, L\_EBL)           (L\_EBL: $626K MFJ, $313K Single)  
EBL\_t       \= max(0, D\_t − L\_EBL)       (excess → NOL)  
NOL\_gen\_t   \= EBL\_t  
S\_dep\_t     \= min(D\_allowed\_t × r\_m, T\_t)  (capped at actual tax)

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| L\_EBL | Real \>0 | §461(l) threshold in millions | SECTION\_461L\_LIMITS\[fs\]/1e6 |
| EBL\_t | Real ≥0 | Excess business loss \= NOL generated | excessBusinessLoss |

▶  investorTaxUtilization.ts:435-484 (computeDepreciationNonpassive)

**E-8  —  §38(c) General Business Credit Ceiling**

Closed form: **YES**

HDC’s LIHTC is a specified credit under §38(c)(4)(B)(iii), making TMT \= 0 by statute. The engine formula 0.75T \+ 6,250 is the algebraically exact reduced form of the statutory rule. IMPL-144 ensures the NOL consumed in the same year reduces net income tax before the ceiling is computed.

Statutory: usable \= T − 0.25 × max(0, T − $25,000)  
Identity (T \> $25K): T − 0.25(T−25K) \= 0.75T \+ 6,250  ← engine formula

T\_after\_dep\_t \= max(0, T\_t/1e6 − S\_dep\_t)  
L\_38c\_t       \= 0.75 × T\_after\_dep\_t \+ 6250/1e6  
C\_usable\_t    \= min(C\_gen\_t \+ C\_carry\_{t−1}, L\_38c\_t)  
C\_carry\_t     \= (C\_gen\_t \+ C\_carry\_{t−1}) − C\_usable\_t

▶  investorTaxUtilization.ts:567-601 (computeLIHTCNonpassive)

**G-8  —  §469 Passive Income Ceiling**

Closed form: **YES**

The passive-track analog of §461(l). Depreciation is absorbed against passive income first (§469(i)(3)(D) ordering); the residual passive income after depreciation determines the credit ceiling. Depreciation and credits that exceed the ceiling suspend under §469(d) and §469(b) respectively.

D^allowed\_t \= min(D\_t, P\_t)             (§469 passive absorption)  
L^susp\_t    \= max(0, D\_t − P\_t)         (suspends as passive loss)  
P^residual\_t \= max(0, P\_t − D\_t)        (remaining for credit ceiling)  
T^res\_t      \= P^residual\_t × r\_eff      (§469(a)(2) ceiling)  
C\_usable\_t   \= min(C\_gen\_t \+ C\_susp\_{t−1}, T^res\_t)  
C\_susp\_t     \= (C\_gen\_t \+ C\_susp\_{t−1}) − C\_usable\_t

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| P\_t | Real ≥0 | Annual passive income (millions) | passiveIncomeInMillions |
| T^res\_t | Real ≥0 | Residual passive tax \= credit ceiling | residualPassiveTax |

▶  investorTaxUtilization.ts:499-553 (computeDepreciationPassive); :611-634 (computeLIHTCPassive)

**E-4  —  Benefit Timing Profile Classifier**

Closed form: **YES**

Classifies the shape of the investor’s benefit stream as front-loaded, back-loaded, or steady. Front-loaded profiles are typical of REP investors with large Year 1 bonus depreciation. Back-loaded profiles are typical of passive investors whose value releases primarily at exit.

B\_early \= Σ u\_t for t=1,2,3    (Years 1-3 generated benefits)  
G       \= Σ u\_t for t=1..T    (total generated)  
D       \= dispositionReleaseEstimate

profile \= 'front\_loaded'  if G\>0 ∧ B\_early/G \> 0.70  
        \= 'back\_loaded'   else if (U+D)\>0 ∧ D/(U+D) ≥ 0.50  
        \= 'steady'        otherwise

▶  investorFit.ts:257-281 (determineBenefitTimingProfile)

**Part 3  The Optimization**

The sizing optimizer finds the commitment level that maximizes the investor’s after-tax return per dollar invested. The objective function, feasibility constraints, and key algorithms are presented here. The optimizer operates at two independent layers: fund-level (pooled stream, 50 samples) and investor-level (single-deal, 20 samples, with additional analytics).

**G-9  —  Objective Function — Formal Statement**

Closed form: **ALGORITHMIC**

The optimizer maximizes effective multiple — total tax benefit realized per dollar committed. This is the correct objective because it asks the investor’s actual question: how many cents of statutory savings does each dollar I commit produce? Maximizing utilization rate would recommend arbitrarily small investments; maximizing total benefit would push toward maximum commitment regardless of efficiency.

Θ(α;π) \= Σ\_t \[ S^dep\_t(α,π) \+ C^usable\_t(α,π) \]  (total benefit usable)

EM(c;π) \= Θ(c/E\_deal;π) × 1e6 / c      (effective multiple \= savings/dollar)

c\* \= argmax\_{c ∈ \[c\_min, c\_max\]}  EM(c;π)

The statutory ceilings (E-7, E-8, G-8) bound how much of Θ is  
realized at each c; they do not exclude commitments from the search.

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| c | ≥0 | Investor commitment | commitment(Amount) |
| α | \[0,1\] | Pro-rata share \= c / E\_deal | proRataShare |
| EM | Real ≥0 | Effective multiple \= savings/dollar | effectiveMultiple |

▶  investorSizing.ts:87-297 (computeOptimalSizing); EM at :153-159

**E-9  —  Binary Search — §461(l) Target Commitment**

Closed form: **ALGORITHMIC**

A secondary reference point alongside the EM peak: the commitment where Year 1 depreciation hits the §461(l) threshold exactly. Bisection exploits the strict monotonicity of depreciation-in-commitment (linear pro-rata scaling). Convergence in ≤ 30 iterations to $10K precision.

φ(c) \= Year-1 depreciation at commitment c  (strictly non-decreasing)

If φ(c\_max) \< L\_EBL → return undefined  
If φ(c\_min) ≥ L\_EBL → return c\_min

Bisection: ℓ=c\_min, u=c\_max  
  m \= (ℓ+u)/2  
  if φ(m) \< L\_EBL: ℓ=m  else: u=m  
  until u−ℓ ≤ $10K  |  max 30 iterations  
  return round\_to\_$1K((ℓ+u)/2)

▶  investorSizing.ts:330-372 (findSec461lTargetCommitment)

**E-10  —  Efficiency Curve and Peak-Type Classifier**

Closed form: **ALGORITHMIC**

The efficiency curve samples savings-per-dollar across the commitment range. A three-state classifier determines the curve shape and adjusts the recommended commitment: a clear peak is reported directly; plateau and rising curves use the highest commitment within 90% of peak.

c\_i \= c\_min \+ (i/N)(c\_max−c\_min);  spd\_i \= totalSavings\_i×1e6 / c\_i  
i\*  \= argmax spd\_i

δ \= (spd\_{i\*} − spd\_N) / spd\_{i\*}   (decline from peak to end)  
type \= 'peak'    if δ \> 0.05  
     \= 'rising'  else if i\* ≥ N−2 ∧ spd\_N \> 1.05×spd\_0  
     \= 'plateau' otherwise

i\_opt \= i\*                                      (peak)  
i\_opt \= max{i | spd\_i ≥ 0.90×spd\_{i\*}}          (plateau/rising)

▶  investorSizing.ts:124-319; fundSizingOptimizer.ts:99-234

**G-10  —  Two-Layer Sizing — Fund vs Investor**

Closed form: **ALGORITHMIC**

Fund-level sizing runs on the pooled benefit stream from N deals (50 samples, calendar-aligned per E-20). Investor-level sizing runs on a single-deal stream (20 samples) with additional analytics: binary search target, Lifetime Coverage Mode, and NOL PV. Both share the same objective function and peak-type classifier but diverge when calendar staggering smooths out the Year 1 depreciation spike.

Layer 1 (fund): c\*^fund \= argmax\_c EM(c; π, P̂)    P̂ \= pooled stream  
Layer 2 (investor): c\*^inv \= argmax\_c EM(c; π, P)    P \= single deal

Divergence driver: calendar staggering in P̂ spreads Year-1  
depreciation across years, shifting the §461(l) binding point.

▶  fundSizingOptimizer.ts:99-197 (Layer 1); investorSizing.ts:87-297 (Layer 2\)

**E-11  —  Roth Strategy Comparison**

Closed form: **PARTIAL**

Three hold-period strategies (Aggressive 3yr, Balanced 5yr, Conservative 7yr) are evaluated. Each produces a per-year conversion schedule (recurrence, not closed-form). The recommendation rule and lifetime advantage formula are closed-form.

Per-year recurrence (not closed-form):  
  conv\_t \= min(capacity\_t.allowedLoss, B\_{t−1}/(years−t+1), B\_{t−1})  
  Roth\_t \= Roth\_{t−1} × 1.07 \+ conv\_t      (g=7% hardcoded)

Lifetime advantage (closed-form given plan outputs):  
  LA\_X \= totalTaxSaved\_X \+ Roth\_T × (1.07)^{30−T} × r\_fed/100

recommend \= 'Aggressive' if LA\_A \> LA\_B  
          \= 'Conservative' else if conv\_C\_total \> conv\_B\_total  
          \= 'Balanced' otherwise

▶  iraConversion.ts:262-308 (compareConversionStrategies)

**E-12  —  Lifetime Coverage Mode**

Closed form: **PARTIAL**

For REP investors with variable income, evaluates the investment at both income endpoints and blends three scenarios. The coverage metric expresses the carryforward pool value in an investor-intelligible unit: years of peak annual tax bill covered.

Scenarios: Conservative w\_L=0.75 | Moderate w\_L=0.50 | Optimistic w\_L=0.25

Economic value at year t:  
  V\_t \= NOL\_t×r\_m×1e6 \+ C\_t×1e6 \+ L\_t×r\_m×1e6    (blended at w\_L)

coverageYears \= max\_t(V\_t) / T\_annual\_high  
  \= 'years of peak tax bill the carryforward pool covers'

▶  investorSizing.ts:412-543, 564-609 (findLifetimeCoverageCommitment, buildCarryforwardTimeline)

**Part 4  During the Hold**

Four carryforward pools are tracked year-by-year across the hold period. The annual utilization loop sequences depreciation, NOL, and credits in statutory order. Pool aggregation aligns multiple deals onto a unified calendar timeline for fund-level analysis.

**G-11  —  Annual Utilization Loop Structure**

Closed form: **STRUCTURAL**

The year-by-year loop that drives all pool updates. Treatment is determined once pre-loop. Depreciation runs first (§469(i)(3)(D) ordering), then NOL linkage (nonpassive only), then credit ceiling. The loop is the central orchestration diagram of the engine.

**LOOP PSEUDOCODE (SEE G-7, E-7, E-8, G-8 FOR SUBSTEP FORMULAS)**

PRE-LOOP: treatment \= determineTreatment(track, grouped)  \[G-7\]  
          marginalRate, niitSurcharge computed once        \[E-5\]  
INIT:     nolPool=0, cumSuspLoss=0, cumCarried=0, cumSuspCredits=0

FOR t \= 1..holdPeriod:  
  D\_t \= annualDepreciation\[t-1\]  
  C\_t \= annualLIHTC\[t-1\]

  IF nonpassive:  
    depResult \= computeDepreciationNonpassive(D\_t, ...)     \[E-7\]  
    nolPool ← depResult.nolPool  
    taxAfterNOL \= max(0, T\_fed − nolUsed×r\_m×1e6)          \[IMPL-144\]  
    lihtcResult \= computeLIHTCNonpassive(C\_t, taxAfterNOL,...)\[E-8\]  
    cumCarried ← lihtcResult.cumulativeCarriedCredits

  ELSE (passive):  
    depResult \= computeDepreciationPassive(D\_t, P\_t, ...)   \[G-8,E-3\]  
    cumSuspLoss ← depResult.cumulativeSuspendedLoss  
    lihtcResult \= computeLIHTCPassive(C\_t, residualTax,...) \[G-8,P-E15\]  
    cumSuspCredits ← lihtcResult.cumulativeSuspendedCredits

  PUSH annualUtilization record (24+ fields)

POST-LOOP: recaptureCoverage \= computeRecaptureCoverageInternal(\[E-16\])  
           if nonpassive ∧ nolPool\>0: computeNOLDrawdown(...)  \[E-14\]

▶  investorTaxUtilization.ts:726-1015 (calculateTaxUtilization); year-loop at :813-946

**P-E15  —  §469(i)(3)(D) Ordering Within Passive Track**

Closed form: **YES**

When both depreciation losses and LIHTC credits compete for the same passive income in a year, the statutory rule requires losses to be determined first, then credits face the reduced residual. The engine implements this as sequential function calls: computeDepreciationPassive runs before computeLIHTCPassive.

Step 1 FIRST — depreciation consumes passive income:  
  D\_allowed\_t  \= min(D\_t, P\_t)  
  P\_residual\_t \= max(0, P\_t − D\_t)         (← shrunk ceiling for credits)

Step 2 SECOND — credits face residual only:  
  T\_residual\_t \= P\_residual\_t × r\_eff  
  C\_usable\_t   \= min(C^gen+C^susp, T\_residual\_t)

If credits absorbed first, they would see P\_t×r\_eff (full passive tax)  
instead of P\_residual\_t×r\_eff — overstating credit utilization.

▶  investorTaxUtilization.ts:866-902 (year-loop passive branch)

**E-13  —  NOL 80% Drawdown — During Hold**

Closed form: **YES**

NOL generated when depreciation exceeds the §461(l) cap is drawn down annually at 80% of taxable income, matching the TCJA §172 limitation. Same-year depreciation is subtracted before the 80% cap is applied.

T\_after\_dep\_t \= max(0, T\_taxable\_t − D\_allowed\_t)  
N\_usable\_t    \= 0.80 × T\_after\_dep\_t          (§172 TCJA cap)  
nolUsed\_t     \= min(N\_{t−1} \+ NOL\_gen\_t, N\_usable\_t)  
N\_t           \= N\_{t−1} \+ NOL\_gen\_t − nolUsed\_t

▶  investorTaxUtilization.ts:467-484

**G-12  —  Suspended Passive Loss Pool — Annual Accumulation**

Closed form: **YES**

Depreciation that exceeds passive income in a given year suspends under §469(d) and accumulates. The pool is monotonically non-decreasing during the hold; it does not release when passive income increases in a subsequent year. Full release occurs only at exit under §469(g)(1)(A).

L^susp\_t      \= max(0, D\_t − P\_t)            (new suspension this year)  
L^cum\_t       \= L^cum\_{t−1} \+ L^susp\_t         (monotonically non-decreasing)

Pool does NOT draw down mid-hold even if P\_t \> D\_t in later years.  
Full release at exit: see G-13.

▶  investorTaxUtilization.ts:542 (per-year suspension); :885 (cumulative tracking)

**E-15  —  §39 vs §469(b) Carryforward Regime Selection**

Closed form: **YES**

Two distinct statutory credit regimes are selected at runtime by treatment. They have different ceilings, different carry durations, and critically different release mechanics at exit. §39 credits do not release under §469(g); §469(b) credits do.

§39 (nonpassive):   C\_usable\_t \= min(C^gen+C^carry, 0.75×T\_after\_dep \+ 6250/1e6)  
  Carry: 1-year back, 20-year forward  |  NO §469(g) exit release

§469(b) (passive):  C\_usable\_t \= min(C^gen+C^susp, T^residual\_t)  
  Carry: indefinite  |  Releases under §469(g) on full disposition

▶  investorTaxUtilization.ts:567-634 (both computeLIHTC\* functions)

**E-14  —  NOL Post-Exit Drawdown with Present Value**

Closed form: **PARTIAL**

An NOL pool remaining at exit continues generating value post-hold as it offsets future ordinary income at 80% per year. The engine discounts this stream to the investment date at an advisor-overrideable rate (default 7%) and reports two effective multiples: one excluding the NOL PV (conservative) and one including it.

K \= min(⌈N\_exit / (0.80×I\_taxable)⌉, 50\)    (drawdown years)  
S\_NOL \= Σ\_{i=1}^{K} nolUsed\_i × r\_m  
PV\_NOL \= Σ\_{i=1}^{K} (nolUsed\_i × r\_m) / (1+r\_d)^{H+i}  (r\_d=0.07 default)

EM\_ex-NOL   \= S\_realized / c\_opt  
EM\_with-NOL \= EM\_ex-NOL \+ PV\_NOL / c\_opt

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| r\_d | (0,1) | Discount rate; advisor-overrideable, default 0.07 | nolDiscountRate (✓) |
| H | Integer ≥0 | Hold period (years) | holdPeriod |

▶  investorTaxUtilization.ts:648-704 (computeNOLDrawdown)

**E-16  —  Recapture Coverage Ratio**

Closed form: **YES**

For each exit event, the engine computes how much of the exit tax liability can be offset by accumulated tax attributes. The coverage ratio is the single risk metric: ≥ 1.0 means full coverage.

Passive track:  
  O\_total \= cumSuspLoss×r\_m \+ cumSuspCredits  
Nonpassive track:  
  O\_total \= cumCarriedCredits \+ min(N\_T, 0.80×T\_exit)×r\_m

netExit       \= max(0, T\_exit − O\_total)  
coverageRatio \= O\_total / T\_exit    (if T\_exit\>0; else 1.0)

▶  investorTaxUtilization.ts:1025-1095 (computeRecaptureCoverageInternal)

**E-20  —  Pool Aggregation — Calendar-Year Alignment**

Closed form: **YES**

N DealBenefitProfiles are consolidated onto a unified calendar timeline. Each deal’s schedules are offset by its fund year relative to the pool start. Exit events are sorted chronologically because §469(g) suspended-loss release is disposition-order-dependent.

Y\_start   \= min\_k(deal\_k.fundYear)  
Δ\_k       \= deal\_k.fundYear − Y\_start   (calendar offset per deal)

For each deal k, schedule index i:  
  D̂\[Δ\_k+i\]     \+= deal\_k.depreciationSchedule\[i\] × 1e6  
  L^fed\[Δ\_k+i\] \+= deal\_k.lihtcSchedule\[i\] × 1e6  
  L^st\[Δ\_k+i\]  \+= deal\_k.stateLihtcSchedule\[i\] × 1e6

Exit events: sort by year ascending  (§469(g) release order-dependent)

▶  poolAggregation.ts:62-174 (aggregatePoolToBenefitStream); sort at :151

**P-E20  —  State LIHTC Independence in Pool Aggregation**

Closed form: **YES**

Federal and state LIHTC schedules accumulate into separate arrays. A state credit on Deal A does not affect Deal B’s federal or state credit. A Georgia 4% piggyback-100% deal contributes an equal amount to both the federal and state consolidated streams; other deals contribute only to the federal stream.

L̂^fed\[Δ\_k+i\] \+= deal\_k.lihtcSchedule\[i\] × 1e6        (federal only)  
L̂^st\[Δ\_k+i\]  \+= deal\_k.stateLihtcSchedule\[i\] × 1e6   (state only)

GA piggyback-100%: stateLihtcSchedule\[i\] \= lihtcSchedule\[i\]  
  ⇒ doubles the consolidated stream for that deal only

▶  poolAggregation.ts:115-124 (independent accumulation)

**Part 5  At Exit**

Exit-year computations include the three-tranche character-split exit tax with full-gain NIIT overlay, three independent OZ benefit components, the §469(g) full-disposition release of suspended losses and credits, and the five-tier LP exit waterfall.

**E-17  —  Exit Tax — Three-Tranche Character Split with NIIT Overlay**

Closed form: **YES**

Exit gain is split into three character tranches. NIIT applies as an overlay across all three characters simultaneously — not only on the LTCG tranche. This matches §1411 treatment of dispositions of passive activity property.

T\_1245 \= D^cum1245 × r\_ord        (§1245 recapture at ordinary rate)  
T\_1250 \= D^cum1250 × 0.25          (§1250 unrecaptured, capped 25%)  
T\_appr \= max(0, G\_appr) × r\_cg    (residual appreciation at LTCG)

G\_total \= D^cum1245 \+ D^cum1250 \+ max(0, G\_appr)  
T\_NIIT  \= β\_ν × 0.038 × G\_total       (overlays ALL three characters)  
T\_fed   \= T\_1245 \+ T\_1250 \+ T\_appr \+ T\_NIIT  
T\_state \= r^state\_eff\_cg × G\_total    (conformity-aware, see G-16)

T\_net \= 0              if β\_oz=1 ∧ holdPeriod≥10  
T\_net \= T\_fed+T\_state  otherwise

| Symbol | Type | Description | Source |
| :---- | :---- | :---- | :---- |
| D^cum1245 | Real ≥0 | Cumulative bonus/cost-seg depreciation | cumulative1245 |
| β\_ν | Bool | NIIT applies | niitApplies |
| r^state\_eff\_cg | Real | Conformity-adjusted state cap-gains rate | getEffectiveStateCapGainsRate() |

▶  calculations.ts:162-234 (calculateExitTax)

**E-18  —  OZ Benefits — Three Independent Components**

Closed form: **YES**

Three structurally independent OZ benefit components are computed and summed. Each uses a different formula, different timing, and different version-sensitivity. The deferral NPV uses a hardcoded discount rate of 8% and a version-aware deferral period.

**(A) RECAPTURE AVOIDED (CHARACTER-SPLIT, COMPUTED ANNUALLY)**

ozRecaptureAvoided\_t \= d^1245\_t × r\_ord \+ d^1250\_t × 0.25

**(B) DEFERRAL NPV (R\_D \= 0.08 HARDCODED)**

n \= days(investmentDate, 2026-12-31)/365.25  (OZ 1.0, if before cutoff)  
  \= 0                                        (OZ 1.0, after cutoff)  
  \= 5                                        (OZ 2.0)  
ozDeferralNPV \= G^deferred × r\_cg\_combined × (1 − 1/(1+0.08)^n)

**(C) EXIT APPRECIATION EXCLUDED (10+ YEAR HOLD)**

residualGain \= max(0, totalGain − D^cum1245 − D^cum1250)  
ozExitAppr   \= residualGain × r\_cg\_combined

▶  calculations.ts:2156-2202; annual recapture at :1819-1830

**G-13  —  §469(g) Full Disposition Release**

Closed form: **YES**

On full disposition of a passive activity, all accumulated suspended losses release as non-passive losses available to offset any income source. Suspended credits unsuspend against disposition-year tax. The nonpassive-track analog is different: §39 credits do not release under §469(g) — they continue their statutory carry schedule.

Passive track:  
  L^released\_j \= L^cum\_T                 (full pool, no proration)  
  V^release\_j  \= L^released\_j × r\_m     (value at marginal rate)  
  C^avail\_j    \= C^cum\_susp\_T            (suspended credits unsuspend)

Nonpassive track:  
  L^released\_j \= 0                      (§469(g) not applicable)  
  C^avail\_j    \= C^cum\_carried\_T         (§39 continues its schedule)  
  NOL offset   \= min(N\_T, 0.80×T\_exit) × r\_m

*Simplification: engine uses a single aggregated suspended-loss pool; per-deal release tracking is not implemented.*

▶  investorTaxUtilization.ts:1047-1062 (release branch in computeRecaptureCoverageInternal)

**G-14  —  Exit Waterfall and Net Investor Proceeds**

Closed form: **YES**

The full five-tier waterfall converts gross exit value into net LP proceeds. Strict tier ordering: if a tier cannot be fully funded, lower tiers receive zero. Deferred AUM fees come from the LP’s share, not HDC’s promote, per the calculation architecture.

Tier 1: V^1 \= max(0, V^exit − remSenior − remPhil − remPAB)  
Tier 2: V^2 \= max(0, V^1 − hdcSub − invSub − outsideSub − DDF − devFee)  
        validateExitDebtPayoff() raises hard error if V^2 \< 0  \[IMPL-164\]  
Tier 3: V^3 \= max(0, V^2 − min(V^2, E^pref×prefMOIC))  
Tier 4: ROC \= min(V^3, E^inv−E^recovered);  LPProfit \= (V^3−ROC)×p^LP/100  
Tier 5: P^LP\_exit \= max(0, ROC+LPProfit − F^deferred\_AUM)

LP exit cash (feeds IRR):  
  \= P^LP\_exit \+ invSubAtExit \+ remainingCredits \+ ozDeferralNPV \+ ozExitAppr

*F — IMPL-185: forgivable debt toggle not yet implemented. All soft debt is a real liability at exit.*

▶  calculations.ts:2026-2071 (waterfall); validation at calculationGuards.ts

---

**H-4  —  Preferred Equity Mechanics** ★ NEW v3.1

Closed form: **YES**

*Insert after G-14 (Exit Waterfall and Net Investor Proceeds)*

The preferred equity layer (Tier 3 in the exit waterfall) — sizing, priority-tracking accrual schedule, exit payoff capped at target MOIC, and waterfall integration (IMPL-7.0-009).

**Step 1 — Principal sizing**

```
E^pref = C_total x (p^pref / 100)
p^pref in [0, 40]  |  C_total = effectiveProjectCost
```

**Step 2 — Target amount at exit**

```
E^{pref,target} = E^pref x M^{pref,target}
M^{pref,target} in [1.0, 3.0]  |  default = 1.7
```

**Step 3 — Priority-tracking accrual schedule**

```
B^(t) = B^(t-1) x (1 + r^accrual / 100)
B^(0) = E^pref
End-of-hold: B^(H) = E^pref x (1 + r^accrual / 100)^H
```

**IMPORTANT:** This schedule is for priority tracking only. It does NOT determine the exit payment amount. The exit cap is independent of hold duration, protecting LP equity from runaway preferred-return accrual on long-hold deals.

**Step 4 — Exit payment formula (key formula)**

```
P^prefEq = min( E^{pref,target},  max(0, V^(2)) )
V^(2) = proceeds after hard debt and soft debt payoff (Tier 2)
```

**Step 5 — Achieved metrics**

```
M^{pref,achieved} = P^prefEq / E^pref    (if E^pref > 0)
IRR^{pref,achieved} = (P^prefEq / E^pref)^(1/H) - 1
    (single cash-flow IRR - closed form)
```

**Step 6 — Shortfall**

```
Delta_M^pref  = max(0, M^{pref,target} - M^{pref,achieved})
Delta_$^pref  = max(0, E^{pref,target} - P^prefEq)
targetAchieved = (P^prefEq >= E^{pref,target})
```

**Step 7 — Integration with LP common equity (Tier 4)**

```
V^(3) = max(0, V^(2) - P^prefEq)
```

Standard ROC-first / profit-split waterfall (G-14) applies to V^(3). If V^(2) < E^pref, LP receives zero from Tier 4.

| Symbol | Type | Description | Source field |
| :---- | :---- | :---- | :---- |
| C\_total | R > 0 | Total capitalization | totalCapitalization |
| p^pref | R\[0,40\] | Preferred equity percent of total cap | prefEquityPct |
| E^pref | R ≥0 | Preferred equity principal | principal |
| M^{pref,target} | R\[1.0,3.0\] | Target multiple (default 1.7) | prefEquityTargetMOIC |
| r^accrual | R\[6,20\] | Annual accrual rate (%) | prefEquityAccrualRate |
| P^prefEq | R ≥0 | Final preferred payoff | paymentAtExit |
| H | Z > 0 | Hold period (years) | holdPeriod |

Validated ranges: p^pref ∈ \[0,40\], M^{pref,target} ∈ \[1.0,3.0\], accrual rate ∈ \[6,20\], hold period ∈ (0,15\]. IMPL-7.0-006: “Payment capped at target MOIC, not accrued balance.” prefEquityOzEligible flag is structural metadata only.

▶  preferredEquityCalculations.ts:1-454 (full module); :179-198 (sizing); :225-250 (accrual); :264-271 (exit payment); :323-396 (orchestrator). calculations.ts:2005-2024 (waterfall integration)

---

**Part 6  Geographic and State Adjustments**

State tax calculations run across three independent conformity dimensions. Each is applied as a separate multiplier, not a composite flag. A state can be fully non-conforming on bonus depreciation while conforming on OZ and offering its own LIHTC program simultaneously.

**G-15  —  State Conformity Framework — Data Structure**

Closed form: **YES**

The platform’s state tax database stores five fields per state that drive the three conformity dimensions. All lookups are O(1) dictionary access with safe defaults.

interface StateTaxProfile {  
  code, name, type: 'state'|'territory'  
  topRate: number                  // top marginal rate (%)  
  ozConformity: 'full-rolling'|'full-adopted'|'no-cg-tax'|'partial'|'none'  
  bonusDepreciation: number        // 0-100 \= % of federal bonus flowing through  
  niitApplies: boolean             // false for PR, VI, GU, AS, MP  
  stateLIHTC: StateLIHTCProgram|null  
}

getStateBonusConformityRate(s) \= STATE\_PROFILES\[s\].bonusDepreciation / 100  
doesNIITApply(s)               \= STATE\_PROFILES\[s\].niitApplies ?? true

**SELECTED STATE CONFORMITY VALUES**

| State | topRate | ozConformity | bonusDep% | NIIT | stateLIHTC |
| :---- | :---- | :---- | :---- | :---- | :---- |
| CA | 13.3% | none | 0 | true | none |
| NY | 10.9% | none | 0 | true | none |
| NJ | 10.75% | partial | 30 | true | piggyback 20% |
| OR | 9.9% | full-rolling | 100 | true | none |
| GA | 5.75% | full-adopted | 0 | true | piggyback 100% |
| WA | 0% | n/a | n/a | true | none |

▶  stateProfiles.ts:1-319; stateProfiles.data.json

---

**H-3  —  State LIHTC Per-Program Calculation Formulas** ★ NEW v3.1

Closed form: **YES** (all formulas + syndication rate + schedule entries)

*Insert after G-15 (State Conformity Framework — Data Structure)*

The mathematical content of state LIHTC credit calculation across all 25 active state programs — the four program-type formulas, syndication-rate logic, variable-duration credit schedule, and complete program inventory.

**Step 1 — Per-program credit formulas**

Let A^fed = federal annual credit (G-2), p^state = program percent, p^user = user-provided percent (supplement), A^user = user-provided amount (standalone/grant).

Type 1 — Piggyback:
```
A^state_piggyback = A^fed x (p^state / 100)
States: GA (100%), AR (20%), KS (100%), NE (100%), SC (100%)
```

Type 2 — Supplement:
```
A^state_supplement = A^fed x (p^user / 100)   [p^user <= p^state ceiling]
States: DC (25%), MO (70%), OH (40%), VT (variable)
```

Type 3 — Standalone:
```
A^state_standalone = A^user / 10
States: AZ, CA, CO, CT, IL, IN, MA, NM, NY, PA, RI, TN, UT, VA, WI
```

Type 4 — Grant:
```
A^state_grant = A^user / 10
Syndication rate = 1.0 (no discount - grant goes directly to project)
States: NJ (STCS)
```

**Step 2 — Syndication rate**

```
r^synd(tau, lambda, r^override) =
  1.0             if tau = grant
  1.0             if lambda = true (direct use, in-state investor - IMPL-047)
  r^override/100  if r^override provided and lambda = false
  p^synd/100      otherwise (program default)

Default rates: Certificated 90%, Transferable 90%, Bifurcated 85%, Allocated 80%, Grant 100%
Net annual benefit: N^state_t = A^state_t x r^synd
```

**Step 3 — Variable-duration credit schedule**

Default credit duration N^state-dur = 10 years. Nebraska: N^state-dur = 6.

Note: §42(f)(1) election is federal-only. State credit always uses calendar-month proration.

```
pi^state_1 = (13 - m_PIS) / 12

C^state_1       = A^state x pi^state_1
C^state_t       = A^state          for t = 2,...,N^state-dur
C^state_{N+1}   = A^state x (1 - pi^state_1)   (catch-up year)

Total invariant: sum(C^state_t) = N^state-dur x A^state

Nebraska: 7-entry schedule (Y1 prorated, Y2-6 full, Y7 catch-up)
All others: 11-entry schedule (Y1 prorated, Y2-10 full, Y11 catch-up)
```

| Symbol | Type | Description | Source field |
| :---- | :---- | :---- | :---- |
| A^fed | R ≥0 | Federal annual credit (G-2) | federalAnnualCredit |
| A^state | R ≥0 | Gross annual state credit | grossAnnualCredit |
| p^state | R\[0,100\] | Program-defined percent (piggyback) | program.percent |
| p^user | R\[0,100\] | User-specified percent (supplement) | params.userPercentage |
| A^user | R ≥0 | User-specified total (standalone/grant) | params.userAmount |
| r^synd | R\[0,1\] | Effective syndication rate | syndicationRate |
| lambda | bool | Investor has state tax liability | investorHasStateLiability |
| N^state-dur | Z > 0 | Credit duration years (default 10) | program.creditDurationYears |

**Program inventory — all 25 active programs**

| State | Program | Type | Rate / Method | Transfer. | Synd% | Cap | Notes |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| AZ | State LIHTC | standalone | A^user/10 | allocated | 80% | $4M | |
| AR | State LIHTC | piggyback | A^fed×20% | allocated | 80% | — | |
| CA | State LIHTC | standalone | A^user/10 | certificated | 90% | — | PW req |
| CO | AHTC | standalone | A^user/10 | allocated | 80% | $10M | |
| CT | HTCC | standalone | A^user/10 | allocated | 80% | — | |
| DC | DC LIHTC | supplement | A^fed×p^user% (≤25%) | allocated | 80% | — | |
| GA | State LIHTC | piggyback | A^fed×100% | bifurcated | 85% | — | |
| IL | IAHTC | standalone | A^user/10 | transferable | 90% | — | |
| IN | AWHTC | standalone | A^user/10 | allocated | 80% | — | |
| KS | State LIHTC | piggyback | A^fed×100% | allocated | 80% | — | Sunsets 2028 |
| MA | State LIHTC | standalone | A^user/10 | allocated | 80% | $60M | |
| MO | AHAP | supplement | A^fed×p^user% (≤70%) | allocated | 80% | — | |
| NE | State LIHTC | piggyback | A^fed×100% | transferable | 90% | — | 6-yr period |
| NJ | STCS | grant | A^user/10 | grant | 100% | — | PW req |
| NM | Donation Credit | standalone | A^user/10 | transferable | 90% | — | |
| NY | SLIHC | standalone | A^user/10 | allocated | 80% | — | |
| OH | State LIHTC | supplement | A^fed×p^user% (≤40%) | allocated | 80% | $100M | |
| PA | PHTC | standalone | A^user/10 | allocated | 80% | $10M | |
| RI | State LIHTC | standalone | A^user/10 | allocated | 80% | — | |
| SC | State LIHTC | piggyback | A^fed×100% | allocated | 80% | — | |
| TN | Rural/Workforce | standalone | A^user/10 | allocated | 80% | — | |
| UT | State AHTC | standalone | A^user/10 | allocated | 80% | $10M | |
| VA | HOTC | standalone | A^user/10 | allocated | 80% | $60M | |
| VT | State LIHTC | supplement | A^fed×p^user% (no ceiling) | allocated | 80% | — | |
| WI | State LIHTC | standalone | A^user/10 | allocated | 80% | $7M | |

▶  stateLIHTCCalculations.ts:254-303 (four type functions); :219-243 (determineSyndicationRate); :318-378 (generateStateLIHTCSchedule); :495-620 (calculateStateLIHTC orchestrator). stateProfiles.data.json (25 stateLIHTC records)

---

**E-19  —  Federal/State Depreciation Benefit Breakout**

Closed form: **YES**

Decomposes the combined depreciation benefit into federal and state components using rate ratios. In non-conforming states (CA/NY: κ=0), the federal share of the bonus benefit equals 1.0, correctly producing zero state bonus savings while MACRS still flows through.

κ \= bonusConformityRate  (CA/NY: 0,  NJ: 0.30,  OR: 1.0)

φ^bonus \= r\_fed\_N / (r\_fed\_N \+ r\_state × κ)   (federal share of bonus)  
φ^macrs \= r\_fed\_N / (r\_fed\_N \+ r\_state)    (federal share of MACRS)

B\_fed\_Y1   \= B^bonus\_Y1 × φ^bonus \+ B^macrs\_Y1 × φ^macrs  
B\_state\_Y1 \= B^bonus\_Y1 × (1−φ^bonus) \+ B^macrs\_Y1 × (1−φ^macrs)

CA/NY check: φ^bonus \= r\_fed\_N/r\_fed\_N \= 1.0  ⇒  B\_state\_bonus \= 0  ✓

▶  calculations.ts:2210-2229

**G-16  —  OZ State Conformity — Exit Tax Adjustment**

Closed form: **YES**

For OZ investors in conforming states, the state cap-gains rate at exit is set to zero. The three conformity categories that trigger this are full-rolling (auto-adopts current IRC), full-adopted (explicitly adopted §1400Z-2), and no-cg-tax (no capital gains tax regardless).

r^state\_eff\_cg(r^state\_cg, s, ozEnabled):  
  \= 0           if ozEnabled ∧ ozConformity(s) ∈  
                   {full-rolling, full-adopted, no-cg-tax}  
  \= r^state\_cg  otherwise  (CA/NY/NJ: full rate applies)

T\_state \= r^state\_eff\_cg × G\_total   (feeds exit-tax E-17)

▶  calculations.ts:140 (getEffectiveStateCapGainsRate)

**G-17  —  Territorial Tax Engine**

Closed form: **PARTIAL**

Five US-territory calculators exist as standalone code. The active production path uses only NIIT suppression (doesNIITApply \= false for all territories). Full territorial integration — PR Act 60, USVI EDC 90% reduction — is not yet wired into the main engine.

Puerto Rico (Act 60):  T^PR \= 0.04 × I \+ 0 × G^cg  (qualifying activity)  
US Virgin Islands:     T^VI \= fedTax(I, G^cg) × (0.90 if OZ else 1.0)  
Guam:                  T^GU \= r^GU × I \+ r^GU\_cg × G^cg  
American Samoa:        T^AS \= r^AS × I \+ r^AS\_cg × G^cg  
CNMI:                  T^MP \= fedTax(I, G^cg)  (mirror code)

Active production path (only wired integration):  
  doesNIITApply(s) \= false  for s ∈ {PR, VI, GU, AS, MP}

*PARTIAL — territorial calculators exist but are not wired into calculateTaxUtilization / calculateExitTax. Full integration has no assigned IMPL.*

▶  territorialTaxCalculations.ts:35-227; active path: stateProfiles.ts:272-274

**Part 7  Portfolio Scale**

Portfolio analytics scale the analysis from a single investor to an advisor’s full book. The Tax Efficiency Map evaluates a 360-cell matrix (12 income × 10 investment × 3 investor types). Two MOIC metrics are reported: tax-benefit MOIC (savings per dollar) and financial MOIC (total cash multiple including operating distributions and exit proceeds).

**G-18  —  Batch Investor Optimization — Advisor Book**

Closed form: **STRUCTURAL**

The Tax Efficiency Map evaluates 360 cells in a Cartesian product of income levels, investment sizes, and investor archetypes. Each cell runs one calculateTaxUtilization call. The optimal cell per income row (peak savings-per-dollar) is marked. Binding constraint labels surface the active statutory limit for each cell.

**SAMPLE GRIDS AND PER-CELL COMPUTATION**

I^income \= {250K, 500K, 750K, 1M, 1.5M, 2M, 3M, 5M, 10M, 25M, 50M, 100M}  
I^invest \= {100K, 200K, 500K, 750K, 1M, 1.5M, 2M, 3M, 5M, 10M}  
T        \= {rep\_grouped, non\_rep\_passive, w2\_only}  
Total:   12 × 10 × 3 \= 360 cells

Per cell (I, c, T):  
  ρ \= calculateTaxUtilization(c/E\_fund × P̂, π(I,T))  
  spd \= (ρ.depSavings \+ ρ.lihtcUsed) × 1e6 / c  
  MOIC^tax \= (c \+ spd×c) / c \= 1 \+ spd

Optimal cell per row: c\*(I,T) \= argmax\_c spd(I,c,T)  
Fund ceiling: c ≤ E\_fund × 0.20  (default concentration cap)

**ARCHETYPE CLASSIFICATION (5 TYPES, PER INVESTORFIT.TS)**

A: REP ∧ (ordIncome+passiveIncome) \< EBL\_threshold  
B: REP ∧ (ordIncome+passiveIncome) ≥ EBL\_threshold  
C: Non-REP ∧ passiveIncome ≥ avgAnnualBenefits  
D: Non-REP ∧ 0 \< passiveIncome \< avgAnnualBenefits  
E: Non-REP ∧ passiveIncome ≤ 0

fitScore \= min(100, round(baseScore \+ 10×annualUtilPct/100))  
  baseScores: {A:90, B:80, C:70, D:40, E:10}

▶  useTaxEfficiencyMap.ts:201-289 (computeEfficiencyMap); investorFit.ts:96-127

**E-21  —  Blended Portfolio MOIC (PARTIAL)**

Closed form: **PARTIAL**

Two distinct MOIC metrics are computed and reported side-by-side. They answer different questions. Tax-benefit MOIC is the sizing optimizer’s objective function. Financial MOIC is the total cash return the LP earns.

MOIC^tax \= (c \+ S^tax) / c \= 1 \+ EM    (tax savings only, per G-9)

MOIC^financial \= (D^op \+ D^tax \+ P^LP\_exit) / E^investor  
  D^op     \= Σ operatingCashFlow\_t  
  D^tax    \= Σ taxBenefit\_t  
  P^LP\_exit \= exitProceeds \+ remainingCredits \+ ozBenefits

| Metric | Question answered | Reported in |
| :---- | :---- | :---- |
| MOIC^tax | How many cents of tax savings per dollar committed? | Tax Efficiency Map, sizing optimizers |
| MOIC^financial | What total cash multiple does the LP earn? | Main analysis screen, KPI strip, audit export |

▶  Tax-benefit MOIC: useTaxEfficiencyMap.ts:230-235; Financial MOIC: calculations.ts:2330-2412

**P-E21  —  Financial MOIC — Two-Metric Distinction**

Closed form: **YES**

The platform reports both metrics to prevent the ‘wrong question’ trap. MOIC^tax excludes operating distributions and exit equity proceeds. MOIC^financial includes everything the LP receives.

MOIC^tax ≤ MOIC^financial for cash-on-cash positive deals  
(financial adds D^op and P^LP\_exit to the numerator)

▶  calculations.ts:2330-2412 (calculateFullInvestorAnalysis returns both)

**Supporting Methods**

Four foundational numerical methods support the seven-part analytical framework. XIRR provides date-precise return computation. Fixed-point iteration resolves interest-reserve circularity. The S-curve sigmoid models lease-up occupancy with a closed-form analytic inverse. The §38(c) Prong-B treatment confirms that the engine’s ceiling formula is exact, not approximate.

**E-1  —  XIRR — Newton-Raphson Root-Finding**

Closed form: **ALGORITHMIC**

Standard integer-year IRR introduces timing errors when cash flows arrive on irregular dates. XIRR uses Newton-Raphson on ACT/365.25 year fractions to compute returns correctly under irregular timing. UTC day-count eliminates DST artifacts.

τ\_i \= days\_between(d\_0, d\_i) / 365.25    (ACT/365.25, UTC midnight)  
NPV(r) \= Σ cf\_i / (1+r)^τ\_i  
NPV'(r) \= −Σ \[τ\_i × cf\_i\] / \[(1+r)^τ\_i × (1+r)\]

r\_{k+1} \= r\_k − NPV(r\_k) / NPV'(r\_k)    r\_0 \= 0.10  
r\_{k+1} ← clamp(r\_{k+1}, \-0.99, 10\)  
Converge: |NPV(r\_k)| \< 1e-7  |  Max 100 iterations  
Return NaN on non-convergence or missing sign-change

▶  xirrCalculation.ts:43-88 (calculateXIRR)

**E-2  —  Interest Reserve — Fixed-Point (Picard) Iteration**

Closed form: **ALGORITHMIC**

The interest reserve must cover debt service on the total project cost, which includes the reserve itself. Picard iteration resolves this circularity: start with reserve=0, compute debt service, recompute reserve, repeat until convergence.

R^0 \= 0,  C\_e^0 \= C\_b  
R^{k+1} \= g(C\_e^k)          g(·) \= calculateInterestReserve(...)  
C\_e^{k+1} \= C\_b \+ R^{k+1}  
Stop when |R^{k+1} − R^k| \< 0.001M ($1K)  |  Max 10 iterations

▶  calculations.ts:393-450

**E-6  —  S-Curve Sigmoid Lease-Up Model**

Closed form: **YES**

The sigmoid models occupancy ramp 0→1 over N months. The analytic inverse answers ‘at what month does occupancy reach X%?’ in closed form without search. Applied to DSCR, interest reserve sizing, and LIHTC applicable fraction during ramp-up.

Forward:  f(x;k) \= 1 / (1 \+ e^{−k(x−0.5)})   x∈\[0,1\], k=10  
Average:  f\_avg(N;k) \= (1/N) × Σ\_{m=1}^{N} f(m/N; k)

Analytic inverse (solve for x given target occupancy p):  
  f⁻¹(p;k) \= 0.5 − (1/k)×ln(1/p − 1\)    p∈(0,1)

▶  sCurveUtility.ts:38-122 (calculateSCurve, getProgressAtPercent)

**E-22  —  §38(c) Prong-B Specified Credit Treatment**

Closed form: **YES**

The engine’s 0.75T \+ 6,250 formula is not an approximation of §38(c) — it is algebraically exact for specified credits. HDC’s LIHTC qualifies under §38(c)(4)(B)(iii) (HERA 2008), which sets TMT \= 0 by statute for buildings placed in service after 2007\.

General rule (§38(c)(1)):  
  GBC\_max \= T − max(TMT, 0.25×max(0, T−$25K))

Specified-credit carve-out (TMT \= 0 by statute):  
  GBC\_max\_HDC \= T − 0.25×max(0, T−$25K)  
  \= 0.75T \+ 6,250  for T \> $25K   (← exact algebraic reduction)

Net income tax definition (§38(c)(1) \+ IMPL-144):  
  T\_net \= max(0, T\_fed\_raw − nolUsed×r\_m×1e6)

▶  investorTaxUtilization.ts:567-601 (engine); DOCUMENTED\_ASSUMPTIONS.md:193-205

**Appendix A — Constants and Defaults**

All hardcoded constants and advisor-overrideable defaults. Values marked ✓ can be changed via investor profile or deal inputs. All others are fixed in the codebase.

| Constant | Value | Context |
| :---- | :---- | :---- |
| XIRR initial rate | r\_0 \= 0.10 | Newton-Raphson starting estimate (xirrCalculation.ts) |
| XIRR tolerance | 1e-7 | Convergence criterion |NPV(r)| (xirrCalculation.ts) |
| XIRR max iterations | 100 | Non-convergence → NaN (xirrCalculation.ts) |
| XIRR rate clamp | \[−0.99, 10\] | Stability bounds on r (xirrCalculation.ts) |
| Interest reserve tolerance | 0.001 M \= $1K | Picard convergence (calculations.ts) |
| Interest reserve max iterations | 10 | Picard cap (calculations.ts) |
| S-curve steepness | k \= 10 | Default sigmoid steepness (sCurveUtility.ts) |
| §461(l) threshold MFJ | $626K \= 0.626M | 2025-indexed (investorTaxUtilization.ts) |
| §461(l) threshold Single | $313K \= 0.313M | 2025-indexed (investorTaxUtilization.ts) |
| §172 NOL utilization cap | 0.80 | Post-TCJA limit on annual NOL drawdown |
| §38(c) formula | 0.75T \+ 6,250 | Algebraically exact for specified credits |
| DSCR covenant threshold | δ \= 1.05 | Cash retention buffer (calculations.ts) |
| OZ deferral discount rate | r\_d \= 0.08 | Hardcoded; not advisor-overrideable |
| OZ 1.0 inclusion date | 2026-12-31 | Statutory cutoff (IMPL-163) |
| OZ 2.0 deferral years | n \= 5 | Per OBBBA permanence provision |
| NOL discount rate | r\_d \= 0.07  ✓ | Default; profile.nolDiscountRate |
| NOL drawdown horizon cap | 50 years | Maximum post-exit projection |
| Roth growth rate | g \= 0.07 | Roth compounding rate (iraConversion.ts) |
| Roth projection horizon | Year 30 | Retirement projection target |
| Lifetime Coverage samples | 15 | Commitment samples per two-point eval |
| Bisection tolerance | ε \= $10K | Binary search precision |
| Bisection max iterations | 30 | Cap on iterations |
| Peak decline threshold | 0.05 (5%) | declineFromPeak \> 5% ⇒ peak |
| Peak rising slope ratio | 1.05 | lastSpd \> firstSpd × 1.05 ⇒ rising |
| Plateau walkback | 0.90 | Highest c with spd ≥ 90% of peak |
| Efficiency curve samples (investor) | N \= 20 | investorSizing.ts |
| Efficiency curve samples (fund) | N \= 50 | fundSizingOptimizer.ts |
| Fund concentration cap | 0.20 (20%)  ✓ | Per-investor pool ceiling |
| Batch grid: income levels | 12 | useTaxEfficiencyMap.ts |
| Batch grid: investment levels | 10 | useTaxEfficiencyMap.ts |
| Batch grid: archetypes | 3 | 360 total cells |
| OR bonus conformity | κ \= 1.0 | Only fully conforming state |
| CA / NY bonus conformity | κ \= 0 | No state bonus depreciation |
| NJ bonus conformity | κ \= 0.30 | Partial conformity |
| NIIT rate | ν \= 0.038 | 3.8% net investment income tax (§1411) |
| §1250 gain cap | 0.25 | IRC §1(h)(1)(E) maximum rate |
| DDA/QCT boost multiplier | μ \= 1.30 | §42 difficult development area boost |
| 27.5-year class life | 27.5 | Residential rental, IRS Pub 946 |

*47 platform items + 7 investment analytics sections across 8 parts and 2 supporting sections. All platform formulas extracted from the production codebase (IMPL-166). Part 8 is independent academic analysis using platform outputs as inputs. File, function, and line references provided for independent verification. PROPRIETARY — TRADE SECRET — Internal use only.*

HDC American Housing Fund  |  calc.americanhousing.fund  |  v3.2  |  Confidential

---

## Part 8  Risk-Adjusted Return Mathematics ★ NEW v3.2

Parts 1–7 describe what the platform computes and how. Part 8 is different in character.

Part 8 is **not** a description of platform functionality. It is an independent academic analysis of the investment opportunity itself — specifically, how the fund’s return structure maps to standard institutional risk-adjusted return metrics. The mathematics in Part 8 are not computed by the platform engine. They are applied externally, using platform outputs as inputs, to characterize the fund in the language institutional allocators use to evaluate portfolio fit.

The goal is academic rigor: each metric is derived from first principles, stated assumptions are explicit, limitations and caveats are fully disclosed, and claims are grounded in independent empirical sources. HDC presents this analysis not as marketing but as a mathematical framework for institutional due diligence. The connection to Parts 1–7 is direct: the low risk shown here is not a capital markets structure. It is the mathematical consequence of the statutory return certainty the platform computes.

> **Central analytical finding:** Replacing market-dependent return drivers with statutory ones simultaneously increases return and compresses variance. This result is derived from first principles, not estimated from historical data, and is independently corroborated by three decades of LIHTC portfolio performance and federal regulatory capital treatment.

---

**R-7  —  QNRD Leverage Mechanism: Why 2.5x From Tax Benefits Is Achievable**

Closed form: **YES** | Prerequisite to R-1 through R-5

The risk-adjusted return profile in R-1 through R-5 rests on a foundational mechanism: Qualified Non-Recourse Debt (QNRD). Without QNRD, an LP investor’s tax losses would be capped at their equity investment. With QNRD, losses scale with the full project cost. This is the lever that allows the fund to return 2.5x or more from tax benefits alone — before a single dollar of exit proceeds.

**Statutory basis**

Under §465, a taxpayer can only deduct losses to the extent they are “at risk.” QNRD is the §465(b)(6) exception for real property: non-recourse financing secured by the real property itself qualifies as at-risk basis for real estate LPs, even though the investor has no personal liability. This was a deliberate congressional policy choice to encourage private capital investment in real property, including affordable housing.

**Formal expression**

```
At-risk basis (LP) = E^investor + QNRD^LP_share
QNRD^LP_share = senior_debt x pro_rata_share

Loss_deductible <= At-risk basis (LP)       [§465 constraint]
D^basis_LP = D^basis_total x pro_rata_share  [full basis, not equity only]

Loss-to-equity ratio = D^basis_LP / E^investor
                     = (C_total - C_land) x pro_rata / E^investor
                     ~= 1 / equity_pct  (when land is small relative to TDC)

At 45% equity: ratio ~= 1/0.45 ~= 2.2x
At 35% equity: ratio ~= 1/0.35 ~= 2.9x
```

> A $1M equity investment in a 45% equity / 55% debt deal with $9M depreciable basis on a $10M project receives bonus depreciation allocated from $4.5M+ of depreciable basis — not from $1M. At a 37% marginal rate, Year 1 depreciation savings alone can approach or exceed the equity investment. Add the 10-year LIHTC credit stream and OZ benefits and 2.5x from tax benefits is mathematically achievable before the property is ever sold. QNRD is the mechanism that makes the math work.

| Symbol | Type | Description | Value / Source |
| :---- | :---- | :---- | :---- |
| E^investor | R ≥0 | LP equity investment | Platform input |
| QNRD^LP\_share | R ≥0 | LP’s share of qualifying non-recourse debt (§465(b)(6)) | senior\_debt × pro\_rata\_share |
| D^basis\_LP | R ≥0 | LP’s allocated depreciable basis (full project basis × pro-rata share) | D^basis (G-1) × pro\_rata\_share |
| loss\_to\_equity | R ≥1 | Ratio of allocated depreciable basis to equity invested | ~2.2x at 45% equity; ~2.9x at 35% equity |

*Authority: §465(b)(6) (QNRD exception for real property); §465(a) (at-risk limitation). QNRD applies when the debt is secured by the real property used in the activity and no person is personally liable. HDC deal structure is designed to satisfy these requirements. Tax counsel confirms QNRD qualification deal-by-deal.*

*Platform implementation status (IMPL-191 candidate):* The engine does not currently compute LP at-risk basis under §465 or verify that allocated losses remain within QNRD-supported basis. For typical AHF deal structures with standard debt ratios, QNRD basis is unlikely to be the binding constraint. However, it should be confirmed deal-by-deal, particularly for investors with complex existing positions. A future IMPL (candidate: IMPL-191) would add a §465 at-risk ceiling check alongside the existing §461(l), §38(c), and §469 statutory ceilings.

---

**R-1  —  Four-Component Return Decomposition**

Closed form: **YES**

Total fund return decomposes into four components. Three are statutory — their amounts are determined at close by IRC provisions and delivered on IRS schedule, independent of real estate market conditions. One is market-dependent.

```
R_total = R_LIHTC + R_dep + R_OZ + R_exit

R_LIHTC  = sum(C_t x (1+r)^{-t})    (PV of credit stream, G-2)
R_dep    = D^1245 x r_m + D^rem x r_m  (depreciation savings, G-1, E-7)
R_OZ     = ozDeferralNPV + ozRecaptureAvoided + ozExitAppr  (E-18)
R_exit   = P^LP_exit                 (exit waterfall, G-14)

sigma(R_LIHTC) ~= 0   (IRS schedule, not market)
sigma(R_dep)   ~= 0   (cost-seg determined at close)
sigma(R_OZ)    ~= 0   (statute + hold period)
sigma(R_exit)  = sigma_exit  (real estate market at disposition)
```

| Component | Authority | sigma character | Approx. share |
| :---- | :---- | :---- | :---- |
| LIHTC credits | IRC §42 | Near-zero. IRS schedule. | ~40–45% |
| Bonus depreciation | IRC §168(k) | Near-zero. Amount set at close. | ~20–25% |
| OZ benefits | IRC §1400Z-2 | Near-zero. Statute + hold period. | ~10–15% |
| Exit proceeds | Market | Standard real estate exit risk. | ~25% |
| **Statutory subtotal** | | **Near-zero sigma on ~75% of return** | **~75%** |

*Cross-reference: R\_LIHTC → G-2, E-8, E-15. R\_dep → G-1, E-7, E-13. R\_OZ → E-18, G-6. R\_exit → G-5, G-14.*

---

**R-2  —  Two-Component Variance Model**

Closed form: **YES**

Because the three statutory components carry near-zero variance and are uncorrelated with the exit component (IRS credit delivery is independent of real estate market conditions), the general portfolio variance formula collapses to a single term.

**General portfolio variance formula**

```
sigma^2(R_total) = w^2_stat x sigma^2_stat + w^2_exit x sigma^2_exit
                 + 2 x w_stat x w_exit x rho x sigma_stat x sigma_exit

Where:
  w_stat  ~= 0.75  (statutory weight)
  w_exit  ~= 0.25  (market weight)
  sigma_stat ~= 0  (near-zero by statutory certainty)
  rho     ~= 0     (IRS schedule uncorrelated with real estate market)
```

**Simplified form (sigma\_stat ~= 0, rho ~= 0)**

```
sigma^2(R_total) ~= w^2_exit x sigma^2_exit
                 = (0.25)^2 x sigma^2_exit
                 = 0.0625 x sigma^2_exit

sigma(R_total) ~= 0.25 x sigma_exit

If sigma_exit in [25%, 30%] (opportunistic real estate):
  sigma(R_total) ~= 6.25% - 7.50%
```

> The fund carries approximately one-quarter of exit-value volatility — not because of hedging or structuring, but because three-quarters of return is delivered by statute.

**Empirical corroboration**

| Data point | Finding | Source |
| :---- | :---- | :---- |
| Cumulative LIHTC foreclosure rate (36,400+ properties) | ~0.47% | CohnReznick 11th Biennial Study (2025) |
| New LIHTC foreclosures since 2021 | Zero | CohnReznick 2025 |
| Fed stress shock: LIHTC vs general equities | -4.9% vs -69.9% | Federal Reserve DFAST severely adverse scenario |
| Basel III regulatory capital weight: bank LIHTC equity investments vs general equities held on bank balance sheets | 100% vs 400% | OCC Bulletin 2021-15; Basel III NPR |

*Note on Basel III scope:* The 100% vs 400% risk weight comparison applies specifically to bank regulatory capital requirements for equity investments held on a bank balance sheet — not to AHF LP interests directly. Banks that invest in LIHTC projects as limited partners are assigned a 100% risk weight on that position (equal to a standard commercial loan), versus 400% for general equity holdings. Regulators assign the lower weight precisely because the LIHTC return is predominantly driven by the statutory credit stream rather than property market performance. This is independent corroborating evidence for the near-zero sigma thesis, but it describes bank capital treatment of LIHTC equity, not AHF investor risk directly.

*The fund’s low sigma is not a smoothing artifact. Private asset Sharpe ratios are typically overstated because appraisal-based NAVs suppress reported volatility (Getmansky, Lo & Makarov, 2004). AHF’s low sigma reflects structural return certainty from statutory delivery — which, if anything, means the reported sigma is not understated.*

| Symbol | Type | Description | Value / Source |
| :---- | :---- | :---- | :---- |
| w\_stat | \[0,1\] | Statutory component weight (~0.75) | Deal-specific; platform output |
| w\_exit | \[0,1\] | Market component weight (~0.25) | 1 - w\_stat |
| sigma\_stat | R ≥0 | Statutory return std deviation | ~= 0 (IRS schedule) |
| sigma\_exit | R ≥0 | Exit proceeds std deviation | 25–30% (opportunistic RE) |
| rho | \[-1,1\] | Correlation: statutory ↔ exit | ~= 0 (independent delivery) |
| sigma\_total | R ≥0 | Total fund std deviation | ~= w\_exit x sigma\_exit ~= 6–8% |

---

**R-3  —  Sharpe Ratio**

Closed form: **YES**

The Sharpe ratio is excess return per unit of total standard deviation. For AHF it is derived directly from the variance model in R-2 rather than estimated empirically — which makes it more defensible, not less, in front of an investment committee.

```
S = (R_p - R_f) / sigma_p

R_p  = fund IRR (base case ~26.5%)
R_f  = risk-free rate (~4.5%, 10-year UST)
sigma_p = total fund std deviation (R-2: ~6-8%)

S = (0.265 - 0.045) / 0.07  ~= 3.1   (midpoint estimate)
S = (0.265 - 0.045) / 0.08  ~= 2.75  (conservative sigma)
S = (0.265 - 0.045) / 0.06  ~= 3.67  (optimistic sigma)

Range: S in [2.75, 3.67]  -> reported conservatively as ~2.0-3.0+
```

> A Sharpe above 1.0 is considered strong for any diversified strategy. Above 2.0 is exceptional. For AHF the high Sharpe reflects low sigma from structural statutory certainty — not smoothed NAVs, hidden leverage, or a favorable sample period.

**Comparative context**

| Strategy | Reported Sharpe | Desmoothed | Notes |
| :---- | :---- | :---- | :---- |
| AHF (estimated) | 2.75–3.67 | N/A † | sigma ~= 6–8%; not a smoothing artifact |
| S&P 500 (long-run) | 0.4–0.5 | 0.4–0.5 | Publicly priced; no smoothing |
| Berkshire Hathaway (1976–2017) | 0.79 | 0.79 | Highest sustained 30Y+ individual record |
| Top-quartile PE (5-year) | 1.5–2.2 | 0.5–1.0 | NAV-based; significant appraisal smoothing |
| Value-add real estate | 0.6–1.0 | 0.3–0.5 | Appraisal smoothing; true risk higher |
| Unlisted infrastructure (contracted) | ~1.0 | 0.7–0.9 | Closest structural analogue; EDHECinfra |
| Hedge funds (HFRI FWC) | 0.4–0.6 | 0.3–0.5 | Broad index since 1990 |

*† AHF’s low sigma does not require desmoothing — credits are delivered on IRS schedule, not marked to model.*

| Symbol | Type | Description | Value |
| :---- | :---- | :---- | :---- |
| R\_p | R | Fund IRR | ~26.5% base case (platform output) |
| R\_f | R | Risk-free rate | ~4.5% (10-year UST at analysis date) |
| sigma\_p | R ≥0 | Total fund std deviation | ~6–8% from R-2 |
| S | R | Sharpe ratio | ~2.75–3.67 (reported conservatively as 2.0–3.0+) |

---

**R-4  —  Statutory Floor as Bounded-Downside Property**

Closed form: **YES**

The statutory components establish a mathematically definable return floor: the IRR and MOIC that the investment delivers if exit proceeds are zero. This floor is not an assumption or stress scenario — it is a closed-form calculation from the platform engine with R\_exit = 0.

```
IRR_floor = XIRR({-E^investor, R_LIHTC_t, R_dep_t, R_OZ_t})
    Where R_exit = 0  (full loss of exit proceeds assumed)

Base case:  IRR ~= 26.5%,  MOIC ~= 3.37x
Floor case: IRR ~= 23.5%,  MOIC ~= 2.42x  (exit proceeds = $0)
Floor gap:  Delta_IRR ~= 3.0pp  |  Delta_MOIC ~= 0.95x
```

| Scenario | Total MOIC | IRR | Context |
| :---- | :---- | :---- | :---- |
| Base case | 3.37x | ~26.5% | Normal exit at 5.0% cap rate |
| Floor (exit proceeds = $0) | 2.42x | ~23.5% | Total loss of exit value |
| PE top-quartile (typical) | 2.0–2.5x | 15–20% | Normal conditions |

> The floor IRR of ~23.5% exceeds top-quartile PE performance under normal conditions. The worst-case outcome here compares favorably to most strategies’ best case.

The floor IRR defines the left tail of the return distribution. Because the statutory components are near-zero sigma and the market component is bounded below at zero exit proceeds, the return distribution is positively skewed — most of the total variance is upside variance, not downside variance.

| Symbol | Type | Description | Value |
| :---- | :---- | :---- | :---- |
| IRR\_floor | R | Floor IRR with R\_exit = 0 | ~23.5% (platform output, E-1) |
| MOIC\_floor | R ≥0 | Floor MOIC with R\_exit = 0 | ~2.42x |
| Delta\_IRR | R | Base-to-floor IRR gap | ~3.0 percentage points |
| Delta\_MOIC | R ≥0 | Base-to-floor MOIC gap | ~0.95x |

---

**R-5  —  Sortino Ratio**

Closed form: **YES** (given stated MAR and downside deviation)

The Sortino ratio penalizes only downside deviation — returns falling below a Minimum Acceptable Return (MAR) — rather than total standard deviation.

```
Sortino = (R_p - MAR) / sigma_D

MAR  = minimum acceptable return (typically 10%)
sigma_D = downside deviation = sqrt( E[min(R_p - MAR, 0)^2] )

Given floor IRR ~= 23.5% > MAR = 10%:
  Very few outcomes fall below MAR
  sigma_D ~= 1-2%  (structurally near-zero)

Sortino = (0.265 - 0.10) / 0.015  ~= 11
Range: Sortino in [8, 15+]  depending on MAR and sigma_D assumption
```

**Sortino/Sharpe gap as a signal**

```
Sortino / Sharpe ~= 11 / 3.1  ~= 3.5x  (vs 1.35-1.5x for symmetric strategies)
Gap of ~3.5x signals strongly positive skew - accurate for this structure.
```

| Metric | Value | Basis |
| :---- | :---- | :---- |
| Sharpe ratio | ~2.75–3.67 | sigma ~= 6–8%; penalizes all variance including upside |
| Sortino ratio (MAR = 10%) | ~8–15+ | sigma\_D ~= 1–2%; penalizes only below-MAR outcomes |
| Sortino / Sharpe gap | ~3.5x | vs 1.35–1.5x for symmetric strategies — signals positive skew |

*Recommended approach:* Present the Sortino ratio as supplementary context for allocators who ask for it, not as a headline metric. Always disclose MAR, downside deviation, and the Sortino/Sharpe gap alongside the point estimate. The floor-case scenario (23.5% IRR at zero exit) communicates the same bounded-downside reality more intuitively.

| Symbol | Type | Description | Value |
| :---- | :---- | :---- | :---- |
| MAR | R | Minimum acceptable return | 10% (standard institutional threshold) |
| sigma\_D | R ≥0 | Downside deviation | ~= 1–2% (structurally near-zero given R-4 floor) |
| Sortino | R | Sortino ratio | ~8–15+ (MAR = 10%; always disclose inputs) |

---

**R-6  —  Required Caveats for Institutional Presentation**

All six caveats must accompany institutional presentation of risk metrics.

| Caveat | Required disclosure |
| :---- | :---- |
| Illiquidity | Returns are based on infrequent valuations and a single exit event rather than continuous market pricing. This may understate realized volatility relative to metrics derived from publicly traded instruments. |
| Distribution | The return distribution is non-normal, with a regulatory floor creating positive skew and bounded downside. Standard deviation is an incomplete risk measure for this structure; scenario analysis is the primary risk communication tool. |
| Legislative risk | A substantial portion of returns depends on IRC §42, §168(k), and §1400Z-2. These provisions are subject to legislative modification. LIHTC was made permanent in 1993, has survived every major tax reform since, and was expanded in 2025. The legislative risk is real but historically low. |
| Small sample | Metrics derived from a single fund vintage carry wide confidence intervals. Sharpe and Sortino estimates should be presented as ranges with stated assumptions, not point values. |
| Comparability | Ratios are not directly comparable to those computed from daily or monthly liquid market returns. The standard private-asset desmoothing correction (Getmansky-Lo-Makarov) does not apply here — AHF’s low sigma reflects statutory delivery certainty rather than appraisal smoothing. |
| GIPS 2020 | Primary performance metrics for closed-end private market funds per GIPS 2020 are SI-IRR and MOIC/TVPI. Sharpe and Sortino ratios are supplementary analytics. Where presented, all methodology, assumptions, MAR, and observation period must be disclosed in full. |

---

*Part 8 uses R-codes to distinguish risk-adjusted return analytics from deal-model (G-) and investor-engine (E-) formulas. All R-series inputs are derived from platform outputs — no independent data sources are required. Part 8 is independent academic investment analysis, not a description of platform functionality.*

