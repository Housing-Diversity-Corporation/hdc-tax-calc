# Tax Benefit Optimizer — Gap Audit
## v1.0 | 2026-05-29 | Read-only

Audit of the current `hdc-tax-calc` engine against **Tax Benefit Optimizer Spec v1.0**. No source files modified.

**Bead:** `hdc-tax-calc-dx9`
**Repo:** `Housing-Diversity-Corporation/hdc-tax-calc.git` (branch: `main`, HEAD `326b6ac` at audit start; prompt-stated "HDC-platform" is a stale name).
**Registry through:** IMPL-188 (composable capital sources foundation shipped 2026-05-21); IMPL-189–193 queued per the composable sources spec.

---

## Executive summary

The engine is materially further along on cascade math than on intake, routing, and outputs. Most of the **statutory loss/credit machinery already exists**: §469 passive treatment, §469(g) disposition release, §461(l) EBL, §172 NOL at 80%, §1245/§1250 recapture, OZ step-up and vintage rules, Roth/IRA conversion planning. The **cascade order** in code is close to spec but skips two statutory gates (§704(d) basis, §465 at-risk) that the spec calls immutable — this is the most significant engine-side gap.

The **3-product taxonomy** (Product 1 / Product 2 / Product 3, DEFERRED-DEDUCTION PROFILE tag) is entirely absent. **Sizing outputs** (max-ticket current-use vs. max-ticket single-release-year) exist as a §461(l)-aware REP optimizer only. **Intake progressive disclosure**, **verification badges** (SETTLED / CONFIRMATION PENDING / PROJECTION), **CPA-verification gating** (ESTIMATE → COMMITMENT-READY), **marketing precision strings**, and the **conservation-identity hard-error** are all absent.

Two spec elements collide with legal-gate items: Product 1 release outputs (blocked on §1400Z-2(c) Sidley confirmation) and the OBBBA §461(l) carryforward tail (spec says dual-mode until resolved; user framing in this session says resolved as NOL conversion — see Section G note below).

**Verdict:** ~55% of engine capability, ~15% of intake, ~10% of output/governance layer. Most of the missing work sits above the engine (intake UI, routing, badges, marketing strings) rather than in the cascade itself.

---

## Section 4 — Grep audit results

### 4.1 §469(g) disposition release
**Status: HAVE.**

- [`investorTaxUtilization.ts:155`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L155) — `releasedSuspendedLosses: number; // §469(g) passive release` on `AnnualUtilization`.
- [`investorTaxUtilization.ts:1048-1050`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L1048) — exit-year branch: passive treatment releases `cumulativeSuspendedLoss` in full via §469(g).
- [`investorFit.ts:47,259,275-276,325,331,337,358`](../../src/utils/taxbenefits/investorFit.ts#L47) — `dispositionReleaseEstimate` on investor fit output, drives ≥50% deferred-benefit fit classification.
- [`poolAggregation.ts:150`](../../src/utils/taxbenefits/poolAggregation.ts#L150) — exit events sorted chronologically because "§469(g) release depends on order".

Release value = `cumulativeSuspendedLoss × marginalRate` (line 1050). Character conversion to ordinary is implicit (marginal rate is ordinary rate).

### 4.2 §461(l) EBL cap
**Status: PARTIAL — cap present, year-parameterization absent, 2026 values missing.**

- [`investorTaxUtilization.ts:217-221`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L217): 2025 values hardcoded.
  ```
  SECTION_461L_LIMITS = { MFJ: 626_000, Single: 313_000, HoH: 313_000 }
  ```
- Cap applied at [`investorTaxUtilization.ts:453-457`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L453) in `computeDepreciationNonpassive`.
- Used for REP sizing at [`investorSizing.ts:219-241`](../../src/utils/taxbenefits/investorSizing.ts#L219) — `findSec461lTargetCommitment` finds commitment where Year-1 depreciation lands at the threshold.
- REP tax capacity at [`taxCapacity.ts:33-79`](../../src/utils/taxbenefits/taxCapacity.ts#L33).
- Also referenced (read-only) from UI: [`FundDetail.tsx:28,219,225`](../../src/components/investor-portal/FundDetail/FundDetail.tsx#L28).

**Gap:** Spec §E requires a year-parameterized cap table by filing status. Code has one hardcoded year (2025). No 2026 OBBBA reset values (approx $256K single / $512K MFJ pending published figures per spec). No mechanism to index annually.

**Note:** [`investorTaxUtilization.ts:452`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L452) documents "W-2 wages excluded from §461(l)(3)(A)(i) business income per CARES Act technical correction and JCT Blue Book". Git history shows IMPL-153 attempted the opposite treatment and was reverted at `77a2493`. Spec is silent on this specific interpretation.

### 4.3 §172 NOL at 80%
**Status: HAVE.**

- [`investorTaxUtilization.ts:467-474`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L467) — in-hold cascade: `nolUsableLimit = incomeAfterDeduction * 0.80`.
- `computeNOLDrawdown()` exported (used in `investorSizing.ts:263-271` for present-value calculation + drain-schedule production).
- [`investorSizing.ts:45-50`](../../src/utils/taxbenefits/investorSizing.ts#L45) — `nolPoolAtOptimal`, `nolAbsorptionYears`, `nolPresentValue`, `effectiveMultipleExNOL`, `effectiveMultipleWithNOL`.
- Post-exit drain schedule produced by IMPL-160 (see spec §B3 "172 tail schedule" — matches).

**Gap:** Spec §B3 asks for a two-mode display ("NOL conversion vs annual re-testing") pending OBBBA resolution. User framing in this session states this is resolved as NOL conversion (single mode). Code implements single-mode NOL conversion — matches the resolved framing; would need dual-mode display added only if spec §G is re-opened.

### 4.4 §1400Z / OZ step-up / exit
**Status: HAVE (extensive).**

- OZ 1.0 vs 2.0 dispatch via `params.ozVersion` throughout `calculations.ts` and `computeTimeline.ts`.
- [`constants.ts:89-102`](../../src/utils/taxbenefits/constants.ts#L89) — `OZ_STEP_UP_RATES` with helper `getOzStepUpPercent(version, type)`. OZ 1.0 = 0%, OZ 2.0 = 10% standard / 30% rural.
- [`calculations.ts:2197-2199`](../../src/utils/taxbenefits/calculations.ts#L2197) — IMPL-163 fix: OZ 1.0 deferral ends Dec 31, 2026 per §1400Z-2(b)(1).
- Exit-side fields: `ozRecaptureAvoided`, `stepUpTaxSavings`, `ozDeferralNPV`, `ozExitAppreciation`.
- QCG resolution: `params.qualifiedCapitalGain || params.deferredCapitalGains` at [`calculations.ts:1720,2186`](../../src/utils/taxbenefits/calculations.ts#L1720) (IMPL-185 + IMPL-187).

**Gap vs spec §B3:** Product 1 branch that zeros bucket-one at exit is implicit (step-up applied via basis; recapture avoided). No explicit "Product 1 = bucket-one → 0" labeled logic.

**Gap vs spec §A1:** Related-party (20%) screen — ABSENT. OZ vintage flag per Notice 2026-40 exists as `ozVersion` on params but not as an intake question against gain date.

### 4.5 §751 / §1245 / §1250 recapture
**Status: PARTIAL.**

- [`calculations.ts:175-178`](../../src/utils/taxbenefits/calculations.ts#L175) — `sec1245Recapture = params.cumulative1245`, taxed at `federalOrdinaryRate`.
- §1250 unrecaptured gain capped at 25% (IMPL-094 comment).
- [`depreciationSchedule.ts:187-188`](../../src/utils/taxbenefits/depreciationSchedule.ts#L187) — `cumulative1245 = costSegAmount` (bonus), `cumulative1250 = SL through hold`.
- Feeds `exitTaxAnalysis.sec1245Recapture + sec1250Recapture` → `recaptureExposure` on `DealBenefitProfile`.

**Gap:** **§751 hot-asset recapture on partnership interest sale — ABSENT.** Spec §B3 Product 3 branch requires §751/1245 for the exit. Code has §1245 + §1250 but no §751 partnership-interest split. This is a real defect for any Product 3 exit modeled as a partnership interest transfer rather than an asset sale.

### 4.6 Roth conversion / IRA
**Status: HAVE (as calculation, not as headroom output).**

- [`iraConversion.ts`](../../src/utils/taxbenefits/iraConversion.ts) — 272 lines, `optimizeIRAConversion(params, repCapacity)`.
- `investorTaxUtilization.ts:738,770,773,819` — `rothConversion` used to compute Year-11+ tax when conversion is planned.
- Intake fields: [`types/taxbenefits/index.ts:482`](../../src/types/taxbenefits/index.ts#L482) — `iraBalance?: number`.
- Export layer: [`exportWealthManagerSummary.ts:61-62,221-228`](../../src/utils/exportWealthManagerSummary.ts#L61) — displays optimal annual conversion, conversion window.

**Gap vs spec §B3:** Spec asks for **conversion headroom = cap − (projected non-business income already filling the box)** as an explicit engine output. Current code uses `rothAnnualConversion` as an input (user-entered planned conversion), not as a computed headroom based on §461(l) cap remaining. This is a genuine engine gap.

### 4.7 3-product routing
**Status: MISSING.**

- `grep productType|productRouting|product1|product2|product3|DEFERRED-DEDUCTION` in engine + hooks + components returns nothing matching the spec's 3-product taxonomy.
- `dealType` exists at [`lihtcCreditCalculations.ts:121-206`](../../src/utils/taxbenefits/lihtcCreditCalculations.ts#L121) but it's `acquisition | acquisition_rehab | new_construction` — a LIHTC-side distinction, not the spec's Product 1/2/3.
- No `DEFERRED-DEDUCTION PROFILE` tag anywhere.
- No branch in [`investorFit.ts`](../../src/utils/taxbenefits/investorFit.ts) that routes based on gain-durability matrix (spec §B1).

**Verdict:** Entire routing layer is ABSENT. Would need to be built from scratch — likely as a thin dispatcher that reads existing fields (`ozEnabled`, `federalLIHTCCredits`, investor income durability) and emits a product label + profile tag.

### 4.8 Sizing / ticket
**Status: PARTIAL.**

- [`investorSizing.ts`](../../src/utils/taxbenefits/investorSizing.ts) has one commitment optimizer with these outputs (per file lines):
  - `sec461lOptimalCommitment` — commitment where Year-1 dep ≈ EBL threshold (REP-focused, IMPL-145).
  - `nolPoolAtOptimal`, `nolAbsorptionYears`, `nolPresentValue`.
  - `effectiveMultipleExNOL` (headline) + `effectiveMultipleWithNOL` (available).
- [`fundSizingOptimizer.ts`](../../src/utils/taxbenefits/fundSizingOptimizer.ts) — fund-level sizing.
- Sampling across commitment levels via `curve[]` at [`investorSizing.ts:583-595`](../../src/utils/taxbenefits/investorSizing.ts#L583).

**Gap vs spec §B4:**
- **Max ticket for full current use** = "net passive income / product-specific spike ratio" — spike ratio (per-product depreciation density) is NOT parameterized. `grep spikeRatio` returns nothing.
- **Max ticket for single-release-year full use** — needs `ticket → year-10 release ≤ (A7 business income + §461(l) cap)`. This exact formula is not present. Closest is `sec461lOptimalCommitment` which targets Year-1 for REPs, not Year-10 release for non-REPs.
- **Tradeoff curve** (current-use IRR vs release-weighted IRR at each ticket increment) — `investorSizing.ts:583-595` samples across commitments but doesn't split IRR into current-use vs release-weighted.

### 4.9 Cascade order confirmation
**Status: PARTIAL — order in code is `treatment-dispatch(469) → 461(l) → 172`; §704(d) and §465 not implemented.**

Spec order (canonical, immutable): **704(d) → 465 → 469 → 461(l) → 172 at 80%.**

**Code order** in [`investorTaxUtilization.ts` `computeYearlyUtilization` loop (~line 813 onward)](../../src/utils/taxbenefits/investorTaxUtilization.ts#L813):
1. Dispatch on `treatment` (`passive` vs `nonpassive`) — implicit §469 gate via [`getTaxTreatment()`](../../src/utils/taxbenefits/investorTaxUtilization.ts) at the top of `calculateTaxUtilization`.
2. **Nonpassive path:** `computeDepreciationNonpassive` at [line ~440](../../src/utils/taxbenefits/investorTaxUtilization.ts#L440):
   - §461(l) cap (line 456)
   - §172 NOL at 80% (line 471)
3. **Passive path:** `computeDepreciationPassive` — passive activity loss limitation; suspended losses accumulate; released at §469(g) exit (line 1048).

**Explicit gaps:**
- **§704(d) outside basis limit — ABSENT.** No basis ledger, no capacity check against `outsideBasis`. `grep 704(d)|section704|outsideBasis` returns nothing in the engine.
- **§465 at-risk limit — ABSENT.** No at-risk ledger. `grep 465|atRisk|at-risk` returns nothing in the engine.
- **QNRF (§1.752-3(a)(3)) allocation share — ABSENT.** No qualified-nonrecourse-financing computation for basis/at-risk. `grep QNRF|qualifiedNonrecourse|nonrecourseFinancing` returns nothing.

Spec Design Principle #1 requires dormant gates displayed as passed-through with zero effect. Currently the two absent gates aren't merely dormant — they don't exist at all, meaning a deal that would fail §704(d) or §465 would silently proceed to §469/§461(l) and produce answers the investor's actual basis cannot support. **This is the most significant statutory gap in the audit.**

### 4.10 Single-source-of-truth check
**Status: CLEAN.**

- `SECTION_461L_LIMITS` exported from `investorTaxUtilization.ts:217`; only readers are `taxCapacity.ts:14`, `investorSizing.ts:14`, `FundDetail.tsx:28`. Consumers import the constant; no re-declaration.
- `nolPool` computed in engine; UI (`useTaxEfficiencyMap.ts:191`, `SizingOptimizerPanel.tsx:404-412`, `FundDetail.tsx:229`) reads from `annualUtilization[].nolPool`. No recomputation.
- `§469` references in hooks/components are labels/messages only (`useTaxEfficiencyMap.ts:166,184`, `SizingOptimizerPanel.tsx:103`), not duplicated logic.
- `computeNOLDrawdown` is called only from `investorSizing.ts:263`. Not duplicated.

The single-source rule is intact for the cascade logic that exists. New engine work should preserve this.

---

## Section 5 — Gap table

Legend: **HAVE** = fully present and matches spec; **PARTIAL** = present but incomplete/partial fidelity; **MISSING** = absent.
Effort: **S** ≤1 day, **M** 2–5 days, **L** 5+ days.

### Section A — Intake

| Spec ref | Element | Status | Evidence | Effort | Depends on |
|---|---|---|---|---|---|
| A1 gain event | amount / source / date | PARTIAL | `annualPassiveLTCGIncome`, `annualPassiveOrdinaryIncome` capture character but not the specific "gain event" concept with date + 180-day window | M | — |
| A1 | 180-day window for OZ deferral | MISSING | No investment-window intake or gate | S | — |
| A1 | Real property recapture split at sale (§1245 vs §1250 OZ-eligibility) | PARTIAL | Engine has `cumulative1245/1250` but intake doesn't split "gain to be invested" by character | M | A1 gain event |
| A1 | QSBS §1202 screen | MISSING | `grep QSBS\|1202\|section1202` returns nothing | M | — |
| A1 | Related-party (20%) screen | MISSING | ABSENT | S | — |
| A1 | OZ vintage flag (pre/post 12/31/2026, Notice 2026-40) | PARTIAL | `ozVersion` is on params; not driven by gain date | S | — |
| A2 passive income | Per-source rental/LP/business | PARTIAL | Aggregate `annualPassiveIncome` + character split (IMPL-158); not per-source with own 8582 lookback | M | — |
| A2 | Own suspended-loss carryforward (Form 8582) | MISSING | No `carryforwardBalance8582` field on investor profile | S | — |
| A2 | Durability estimate per source | MISSING | ABSENT | M | Per-source A2 |
| A2 | Working-interest screen (§469(c)(3)) | MISSING | ABSENT | S | — |
| A2 | CPA confirmation checkbox | MISSING | No CPA-verified badge on inputs | S | Verification UI |
| A3 material participation | Hours, look-back, personal service | MISSING | ABSENT | M | — |
| A3 | CONFIRMED / AT RISK / FAILED output | MISSING | ABSENT | S | A3 questions |
| A4 basis and at-risk | Outside basis = ticket + QNRF share | MISSING | No `outsideBasis` computation; no QNRF allocation from deal params | L | Deal schema addition |
| A4 | Hard-stop display when cum. losses > basis + QNRF | MISSING | ABSENT | S | A4 basis calc |
| A5 annual income map | Wages / portfolio / business / filing status | PARTIAL | `annualOrdinaryIncome` + `filingStatus` present; not split into W-2 vs portfolio vs business income | S | — |
| A5 | State conformity flag (display-only) | HAVE | `investorState` + `HDC_OZ_STRATEGY` conformity | — | — |
| A5 | NIIT toggle (analysis only) | HAVE | `niitRate` param, IMPL-121 NIIT-aware depreciation | — | — |
| A6 retirement | IRA balance | HAVE | `iraBalance` on `CalculationParams:482` | — | — |
| A6 | Age (RMD horizon) | MISSING | No `age` field | S | — |
| A6 | Retirement year | MISSING | ABSENT | S | — |
| A7 disposition-year projection | Extrapolated income at Year 10 | PARTIAL | `investorTaxUtilization.ts:819` uses Year-11+ base tax when `rothConversion > 0`; no explicit A7 projection module | M | A6 retirement year |
| A7 | Roth conversion appetite | HAVE (as input) | `rothAnnualConversion` param | — | — |
| A7 | NOL mortality warning | MISSING | Drain schedule exists (IMPL-160); no age-based mortality warning | S | A6 age |

### Section B — Engine

| Spec ref | Element | Status | Evidence | Effort | Depends on |
|---|---|---|---|---|---|
| B1 | 3-product routing | MISSING | No `productType`/`product1/2/3` dispatch | M | — |
| B1 | DEFERRED-DEDUCTION PROFILE tag | MISSING | ABSENT | S | B1 routing |
| B1 | Sub-route on `iraBalance` + retirement-year step-down | MISSING | Depends on B1 + A6 | S | B1, A6 |
| B2 | Hold-phase cascade — 704(d) | MISSING | ABSENT (see 4.9) | L | Deal-schema QNRF |
| B2 | Hold-phase cascade — 465 | MISSING | ABSENT | L | 704(d) + at-risk ledger |
| B2 | Hold-phase cascade — 469 (passive gate) | HAVE | `computeDepreciationPassive`, treatment dispatch | — | — |
| B2 | Hold-phase cascade — 461(l) | HAVE | `computeDepreciationNonpassive:456` | — | — |
| B2 | Hold-phase cascade — 172 at 80% | HAVE | `computeDepreciationNonpassive:471`, `computeNOLDrawdown` | — | — |
| B2 | Per-product depreciation density (no reuse of 2.34x) | PARTIAL | Density comes from actual deal `depreciationSchedule`; no cross-product ratio reuse observed | — | B1 routing (for labeling) |
| B2 | Credit-suspension tracking (Product 2, no release) | HAVE | `cumulativeSuspendedCredits` in `annualUtilization`; `computeLIHTCPassive` suspends per §469(b); no release code path exists | — | — |
| B2 | Losses-before-credits ordering (§469(i)(3)(D)) | HAVE | `impl-144-nol-sec38c-ceiling.test.ts:138-192` explicit test | — | — |
| B2 | Carryforward year-by-year (savings-account trajectory as first-class output) | HAVE | `annualUtilization[].cumulativeSuspendedLoss`, `cumulativeSuspendedCredits`, `cumulativeCarriedCredits` | — | — |
| B2 | NIIT layered on passive net | HAVE | IMPL-121 | — | — |
| B3 exit — Product 1 bucket-one = 0 via step-up | HAVE (implicit) | Step-up applied to basis; recapture avoided under OZ 10-yr hold | S (label) | — |
| B3 exit — Product 3 bucket-one = §751/§1245 recapture | PARTIAL | §1245 + §1250 present; **§751 partnership-interest recapture ABSENT** | M | — |
| B3 | Unrelated-buyer flag | MISSING | `grep unrelatedBuyer\|relatedParty` returns nothing | S | Deal schema addition |
| B3 | §461(l) box in release year | PARTIAL | Engine applies §461(l) each year; no distinct "release year box" model that offsets released nonpassive against A7 income sources with priority (business unlimited, then non-business up to cap) | M | A7 projection |
| B3 | Conversion headroom output | MISSING (as output) | Roth conversion is an input, not a computed headroom | S | B3 §461(l) box |
| B3 | 172 tail drain schedule at 80% | HAVE | `computeNOLDrawdown`, IMPL-160 | — | — |
| B3 | Dual-mode display (NOL conversion vs annual re-testing) | N/A | User framing: resolved as NOL conversion (single mode). Code matches. | — | — |
| B4 outputs — max ticket current use | PARTIAL | REP-focused `sec461lOptimalCommitment` targets Year-1; not "net passive income / product spike ratio" for non-REPs | M | Spike ratio, B1 routing |
| B4 | Max ticket single-release-year | MISSING | No release-year sizing branch | M | B3 §461(l) box, A7 |
| B4 | Tradeoff curve (current-use IRR vs release-weighted IRR) | PARTIAL | Curve exists in `investorSizing.ts:583-595`; not split into current vs release IRR | M | B4 max-ticket variants |
| B4 | Realized after-tax IRR/MOIC both depreciation methods | HAVE (partial) | Both methods computed; conservation identity check status unclear | S–M | — |
| B4 | Conservation identity as hard error | MISSING | `grep conservationIdentity\|conservation identity\|hardError` returns nothing | S | — |
| B4 | Three-phase schedule (carryforward / release-year box / NOL drain) | PARTIAL | Carryforward + drain schedules exist; release-year-box breakdown missing | M | B3 §461(l) box |

### Section C — Outputs & display rules

| Spec ref | Element | Status | Evidence | Effort |
|---|---|---|---|---|
| C | Investor number lead / unconditional benchmark as reference line only | UNKNOWN | Requires UI audit beyond this scope | M |
| C | Marketing precision strings ("designed to", "projected", "depends on…") | MISSING | `grep designed to\|projected.*current law\|marketing precision` returns nothing in `frontend/src/` | S |
| C | Deferred-deduction disclosure string | MISSING | ABSENT | S |
| C | Verification badge per output | MISSING | `grep SETTLED\|CONFIRMATION PENDING\|PROJECTION\|verificationBadge` returns nothing | M |
| C | CPA-verification gating (ESTIMATE → COMMITMENT-READY) | MISSING | `grep ESTIMATE\|COMMITMENT-READY\|CPA.*confirm` returns nothing | M |

### Section E — Parameters

| Spec ref | Element | Status | Evidence | Effort |
|---|---|---|---|---|
| E | §461(l) cap by **year** and filing status (indexed, post-OBBBA) | PARTIAL | `SECTION_461L_LIMITS` has 2025 values only; no year dimension | S |
| E | 2026 clawback values (~$256K single / $512K MFJ, pending IRS) | MISSING | Not present in code; no source citation | S |
| E | 80% NOL limitation flag | HAVE (hardcoded 0.80) | `investorTaxUtilization.ts:471` | — |
| E | Bonus percentage permanence flag (100% permanent post-OBBBA) | PARTIAL | `yearOneDepreciationPct` is a per-deal param; no "permanent" flag | S |
| E | OZ vintage rules per Notice 2026-40 | HAVE (partial) | `ozVersion` dispatch; OZ 2.0 rolling 5-year, 10% step-up implemented; date-driven vintage assignment not explicit | S |
| E | Deal parameter schema: product type, QNRF share, unrelated-buyer flag, exit mechanism type, credit stream | MISSING | See B1/B3 gaps; overlaps with IMPL-189→193 composable sources | M |

### Section G — Verification gates

| Spec ref | Element | Status | Notes |
|---|---|---|---|
| G1 | §1400Z-2(c) release qualifies as fully taxable disposition (§469(g)) | CONFIRMATION PENDING | Sidley written confirmation required before Product 1 release outputs go public. Engine performs the release; UI gating absent (see C verification badges). |
| G2 | OBBBA §461(l) carryforward mechanics | RESOLVED per this session | User framing: NOL conversion is the enacted treatment. Spec §B3 dual-mode display is obsolete. Code matches (single-mode NOL conversion via `computeDepreciationNonpassive`). |
| G3 | Structure opinions (collar variance; economic substance) | GOVERNANCE | Not code-facing; standing rule that no output anchors a raise before Sidley opinions return. |

---

## Section 6 — Independent math verification

**Scenario:** Product 3 exit with recapture, buyer with zero external passive income, full loss suspension over 10 years.

**Code path traced (not run):**
1. `getTaxTreatment(profile)` → `passive` (non-REP, no grouping election).
2. Hold years 1–9: `computeDepreciationPassive` runs each year. `residualPassiveIncome = 0` → all depreciation adds to `cumulativeSuspendedLoss`. LIHTC (if any) suspends per §469(b). `nolPool = 0` (no NOL generated on passive path — §461(l) only fires nonpassive).
3. Year 10 exit ([`investorTaxUtilization.ts:1048-1050`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L1048)):
   ```
   releasedSuspendedLosses = cumulativeSuspendedLoss   // full pool released
   releasedLossValue = releasedSuspendedLosses × marginalRate
   ```
4. Exit tax = `sec1245Tax + sec1250Tax + capitalGainsTax` from `exitTaxAnalysis`. Recapture goes into `totalExitTax`, not into "bucket one/two" labeled buckets (spec §B3 taxonomy is absent).
5. Offset applied at [`investorTaxUtilization.ts:1064-1065`](../../src/utils/taxbenefits/investorTaxUtilization.ts#L1064):
   ```
   totalAvailableOffset = releasedLossValue + availableCredits + nolOffsetValue
   netExitExposure = max(0, totalExitTax - totalAvailableOffset)
   ```

**Same scenario with hypothetical bucket-one = 0:** The engine does not have a "bucket one" concept, so this permutation cannot be run as-is. The closest analog is "OZ 10-yr hold" (Product 1), where the exit tax on the appreciation leg = 0 and recapture is avoided per OZ step-up. Trace 4001 with `ozEnabled=true` and `holdPeriod=10` produces `netExitTax = 0` per IMPL-095 (see `full-integration.test.ts` and IMPL-095 test scenarios).

**Bucket-one/two Product 3 labeling — ABSENT.** Cannot be run at the code level. This is a real gap for the tradeoff-curve narrative the spec requires.

---

## Section 7 — Test coverage inventory

### Cascade / §461(l) / §172 coverage — present

| Test file | Covers |
|---|---|
| [`impl-144-nol-sec38c-ceiling.test.ts`](../../src/utils/taxbenefits/__tests__/impl-144-nol-sec38c-ceiling.test.ts) | NOL carryforward reduces §38(c) ceiling; §469(i)(3)(D) ordering (losses-before-credits) |
| [`impl-160-nol-present-value.test.ts`](../../src/utils/taxbenefits/__tests__/impl-160-nol-present-value.test.ts) | NOL present-value calc, drain schedule |
| [`impl-154-passive-character-split.test.ts`](../../src/utils/taxbenefits/__tests__/impl-154-passive-character-split.test.ts) | Passive income character split |
| [`impl-121-niit-utilization.test.ts`](../../src/utils/taxbenefits/__tests__/impl-121-niit-utilization.test.ts) | NIIT-aware depreciation |
| [`impl-122-sec38c-unit-fix.test.ts`](../../src/utils/taxbenefits/__tests__/impl-122-sec38c-unit-fix.test.ts) | §38(c) unit consistency |
| [`impl-185-forgiveness-and-qcg.test.ts`](../../src/utils/taxbenefits/__tests__/impl-185-forgiveness-and-qcg.test.ts) | Exit forgiveness + QCG |
| [`impl-187-qcg-fallback.test.ts`](../../src/utils/taxbenefits/__tests__/impl-187-qcg-fallback.test.ts) | QCG resolution `\|\|` fallback |
| [`investorTaxUtilization.test.ts`](../../src/utils/taxbenefits/__tests__/investorTaxUtilization.test.ts) | Treatment dispatch, `computeNOLDrawdown` unit tests |
| [`investorSizing.test.ts`](../../src/utils/taxbenefits/__tests__/investorSizing.test.ts) | §461(l)-optimal sizing curve |
| [`investorFit.test.ts`](../../src/utils/taxbenefits/__tests__/investorFit.test.ts) | Fit classification incl. `dispositionReleaseEstimate` |

### Spec §D scenarios — coverage gaps

| Spec §D scenario | Existing coverage | Gap |
|---|---|---|
| CIE Taxable PAL income vector ($0.5M/$1M/$2M/$4M/$8M) | PARTIAL — `investorSizing.test.ts` samples; not the exact income vector | Add income-vector reconciliation test |
| Both depreciation methods (bonus vs SL) at each income point | PARTIAL — bonus path well-tested; SL-only path less so | Add both-method matrix |
| Both exit branches (OZ vs non-OZ) | HAVE (partial) | Product 3 non-OZ with `netExitExposure` + release absorption not explicit-scenario tested |
| **Zero-passive-income Product 1 buyer (full suspension, full release, box overflow)** | MISSING | Add new scenario |
| **Retiree with $150K income and NOL tail** | MISSING | Age + retirement year fields don't exist; can't test |
| **Conversion headroom case with step-down retirement year** | MISSING | Conversion headroom output doesn't exist as computed value |
| Conservation identity (total realized ≡ total shield) as hard error | MISSING | No such assertion in any test |
| Elect-out IRR plateau at min-income threshold | MISSING (cross-validation pattern absent) | Add two-derivation agreement test |

---

## Section 8 — Overlap analysis: IMPL-189 → IMPL-193 (composable capital sources)

Reading [`HDC_Composable_Capital_Sources_Spec_v1_2.md`](../specs/HDC_Composable_Capital_Sources_Spec_v1_2.md) against this spec:

| Optimizer spec need | Composable sources work covers it? |
|---|---|
| A4 basis + QNRF from deal-level params | **PARTIAL.** `CapitalSource` has `amount`, `amountBasis`; no explicit QNRF share allocation per source. Could be added as a `qnrfShare` field on `CapitalSource` — small extension, natural home. |
| B3 unrelated-buyer flag | **YES** as a natural deal-level field, but not in the composable-sources spec — that's deal-metadata scope, not source-level. Add to `DealConduit` (see IMPL-186 backlog "DealConduit Identity"). |
| B3 exit mechanism type | **YES** — composable sources model waterfall priority per source, but doesn't have a top-level "exit mechanism" enum (asset sale / partnership interest / OZ 10-yr / ROFR). Add to `DealConduit`. |
| E deal parameter schema (product type, QNRF, exit type, credit stream) | **PARTIAL.** Credit stream is already deal-level via `federalLIHTCCredits`. Product type is NOT sources-scope — belongs on `DealConduit`. |
| Everything else in Optimizer spec (intake, cascade, routing, sizing outputs, badges, marketing strings) | **NO overlap.** Composable sources spec is about the capital-stack persistence model + waterfall; Optimizer is about investor-side intake + cascade + outputs. Distinct axes. |

**Bottom line:** The composable-sources IMPL sequence would naturally absorb A4-QNRF (as a `CapitalSource` field) and reinforce the deal-metadata additions (unrelated-buyer flag, exit-mechanism type) via the paired `DealConduit` extensions already in the IMPL-186 backlog. Everything else in the Optimizer spec needs new IMPL numbers.

---

## Proposed IMPL breakdown (for MISSING items)

Sequenced. Verification-gate-dependent items marked **[BLOCKED-FOR-RELEASE]** — build them, but do not surface investor-facing until the gate clears.

### Wave 1 — Statutory cascade completeness (highest priority; fixes the #1 gap in Section 4.9)

| IMPL | Scope | Effort | Depends on |
|---|---|---|---|
| **IMPL-200** | §704(d) basis ledger + §465 at-risk ledger. Add basis and at-risk tracking to `AnnualUtilization`. Wire QNRF share from deal params (initially deal-level flat allocation; per-source in IMPL-201). Cascade order in `calculateTaxUtilization` becomes `704(d) → 465 → 469 → 461(l) → 172`. Dormant gates display as passed-through with zero effect. | L | — |
| **IMPL-201** | QNRF allocation on `CapitalSource` (extends the IMPL-188 type). Each source declares `qnrfSharePct`. Engine sums per investor's ownership fraction. Feeds IMPL-200. | S | IMPL-200, composable sources scaffolding |
| **IMPL-202** | Year-parameterized §461(l) cap table. Replace `SECTION_461L_LIMITS` constant with `getSec461lCap(year, filingStatus)` reading from a canonical parameter store. Seed with 2025 + 2026 published values + inline citations. | S | — |
| **IMPL-203** | §751 hot-asset recapture on partnership interest sale. Adds `sec751Recapture` alongside `sec1245Recapture`/`sec1250Recapture`. Product 3 partnership-interest exits split ordinary vs capital portions per §751. | M | — |

### Wave 2 — 3-product routing + intake foundations

| IMPL | Scope | Effort | Depends on |
|---|---|---|---|
| **IMPL-204** | Product taxonomy + router. Add `productType: 'product1' | 'product2' | 'product3'` derived from `(ozEnabled, federalLIHTCCredits, investor.durabilityScore)`. Emit `DEFERRED-DEDUCTION PROFILE` tag when `(iraBalance > threshold) && (retirementYear within hold)`. | M | A6/A7 intake fields (IMPL-205) |
| **IMPL-205** | Intake additions: `age`, `retirementYear`, `carryforwardBalance8582`, per-source passive income with `durabilityYears` + `type` (rental / LP / passthrough / working-interest). Progressive disclosure UI. | M | — |
| **IMPL-206** | Material participation (§A3) screen — hours-test intake + CONFIRMED/AT RISK/FAILED classifier. Routes AT RISK to CPA-review badge. | M | IMPL-205, verification badge (IMPL-210) |
| **IMPL-207** | Gain event (§A1) — amount, source, date, 180-day window, related-party (20%) screen, QSBS §1202 pre-emption screen, OZ-eligibility split on real-property gains (§1245 excluded from OZ per current interpretation). Vintage flag driven by gain date × Notice 2026-40. | M | — |

### Wave 3 — Sizing + release-year outputs

| IMPL | Scope | Effort | Depends on |
|---|---|---|---|
| **IMPL-208** | Release-year §461(l) box model. Split A7-projected income into `business` / `wages+portfolio` / `conversion`; released losses offset business unlimited, then non-business up to cap. Emit `conversionHeadroom = cap − filled(non-business)`. | M | IMPL-200, IMPL-205 |
| **IMPL-209** | Sizing outputs: `maxTicketCurrentUse` (using per-product spike ratio) + `maxTicketSingleReleaseYear` (using IMPL-208 box). Tradeoff curve splits `currentUseIRR` vs `releaseWeightedIRR`. Three-phase schedule as first-class output. | M | IMPL-204, IMPL-208 |

### Wave 4 — Governance + display

| IMPL | Scope | Effort | Depends on |
|---|---|---|---|
| **IMPL-210** | Verification badge system. Every output row tagged `SETTLED` / `CONFIRMATION PENDING` / `PROJECTION`. Render component. CPA-verification state gates ESTIMATE → COMMITMENT-READY transition. Wire Section G items to badges. | M | — |
| **IMPL-211** | Marketing precision string layer. Central copy-store with "designed to", "projected", "depends on your income profile and current law" wrappers. Deferred-deduction outputs get the additional disclosure string. Lint rule (grep-based CI check) that unconditional return figures fail the build. | S | IMPL-210 |
| **IMPL-212** | Conservation identity hard error. Assert `totalRealizedBenefit == totalCanonicalShield` in every scenario. Add to test suite as invariant. Throw at engine layer on mismatch. | S | — |
| **IMPL-213** | **[BLOCKED-FOR-RELEASE]** Product 1 disposition-release outputs live behind the `§1400Z-2(c) fully-taxable` gate. Build now, gate release on Sidley written confirmation (Section G1). Show `CONFIRMATION PENDING` badge until gate clears. | S | IMPL-210 |

### Blocked-for-build (out-of-scope for v1 per Section F)

- REP-channel computation (separate project — partially exists via `taxCapacity.ts` REP-specific path; not spec target).
- State income tax computation (v1: display caveat only).
- AMT interaction (Sizing Optimizer AMT addendum governs; integrate in v1.1 — spec §F).
- Trust-entity computation (Aragona-dependent; counsel referral).
- Estate step-up beyond NOL-death warning.

### Suggested sequencing rationale

Wave 1 first because §704(d) and §465 gaps mean the engine can currently produce answers the investor's basis doesn't support — that's a correctness bug, not a feature gap. Wave 2 unblocks the routing + intake dependency chain. Wave 3 delivers the spec's headline sizing outputs. Wave 4 is required for any investor-facing release.

Under this sequencing, the composable-sources IMPL queue (IMPL-189→193) can proceed in parallel with Wave 1 (IMPL-200/202/203 are pure engine work; IMPL-201 hooks into `CapitalSource` when it lands).

---

## DoD checklist

- ✅ Gap table complete for every Section A/B/C/E element with evidence or explicit ABSENT (Section 5).
- ✅ Cascade-order confirmation with file:function citations (Section 4.9).
- ✅ Duplicate-logic findings (single-source-of-truth check) reported (Section 4.10 — CLEAN).
- ✅ Overlap analysis with IMPL-189→193 queue (Section 8 — small overlap, mostly disjoint).
- ✅ Proposed IMPL breakdown for MISSING items, sequenced, with blocked-for-release items flagged (Wave 1–4, IMPL-200–213).
- ✅ Report committed to `/frontend/docs/audits/`. Registry untouched. Bead to be closed after commit.
- ✅ No source files modified. git status shows only this audit report.

---

*Report prepared 2026-05-29 against `main` at HEAD `326b6ac`. Bead `hdc-tax-calc-dx9`.*
