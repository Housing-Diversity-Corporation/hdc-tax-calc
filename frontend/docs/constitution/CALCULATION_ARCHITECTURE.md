# Calculation Architecture

**Version:** 1.0
**Date:** 2026-01-18
**Status:** Active

---

## Single Source of Truth

All financial calculations must occur in the core engine (`calculations.ts` and related calculation files in `utils/taxbenefits/`).

**Hooks and UI components must never perform financial math** — they consume and display values only.

---

## Why This Matters

- Single source of truth prevents divergent results
- One place to audit, test, and validate
- Institutional credibility requires traceable calculations
- Prevents bugs like IMPL-057 (duplicate calculation producing different result)

---

## Architecture Pattern

```
calculations.ts → useHDCCalculations.ts → Component.tsx
↑                    ↑                    ↑
MATH HERE          PASS VALUES          DISPLAY ONLY
```

---

## Layer Responsibilities

| Layer | Location | Responsibility | Math Allowed? |
|-------|----------|----------------|---------------|
| **Core Engine** | `utils/taxbenefits/calculations.ts` | All financial calculations | Yes |
| **Supporting Calculators** | `utils/taxbenefits/*.ts` | Specialized calculations (depreciation, LIHTC, etc.) | Yes |
| **Hooks** | `hooks/useHDC*.ts` | Pass values from engine to components | No |
| **Components** | `components/taxbenefits/*` | Display and format values | No |

---

## Calculation Accuracy Standard

The platform must reflect **actual tax rules, IRS regulations, and statutory provisions** — never guessed or assumed values.

**Examples:**
- OZ step-up: IRC §1400Z-2 as amended by OBBBA (10% standard, 30% rural)
- LIHTC: IRC §42 (11-year credit period)
- MACRS: IRS Publication 946 depreciation tables
- State conformity: Verified state-by-state data

**When Uncertain:**
- Flag for verification rather than assume
- Reference authoritative sources (IRC, Treasury Regs, IRS guidance)
- Document source in formula map

---

## Violations

If you find financial math outside the core engine:
1. Do not add more math to fix it
2. Trace where the correct value exists in the engine
3. Wire the consumer to use the engine value
4. Delete the redundant calculation

---

## Sign Convention Standard

Cash flows use the following sign convention:
- **Positive:** Cash outflows FROM the project (payments to investors, debt service, fees)
- **Negative:** Cash inflows TO the project (rare in operating phase)

When implementing waterfall handlers, a payment should return a **positive** value
to be deducted from remaining cash:

```typescript
// CORRECT: Payment deducts from remaining cash
return paid;

// WRONG: This would ADD to remaining cash (ISS-052 bug)
return -paid;
```

---

## Override Anti-Pattern

Avoid "safety" overrides that defeat intended calculations:

```typescript
// BAD: Override wipes out the S-curve we just calculated (ISS-053 bug)
if (year === interestReservePeriodYears) {
  effectiveOccupancy = 1.0;  // Defeats S-curve!
}
```

If a calculation is complex enough to implement, trust it. Overrides should only
apply to edge cases, not default behavior.

---

## DSCR Display Standard

DSCR KPIs should reflect **stabilized operations**, not lease-up periods (ISS-054):

- When interest reserve is enabled, Year 1 may have DSCR < 1.0x (covered by reserve)
- Display the DSCR from the first **stabilized year** (effectiveOccupancy ≥ 99%)
- This aligns with lender underwriting practice (loans sized to stabilized NOI)

Functions: `findStabilizedYear()` and `calculateStabilizedDSCR()` in KPIStrip.tsx

---

## Deal Benefit Profile Persistence (IMPL-084)

The DBP layer extracts a frozen snapshot of calculator results for multi-deal modeling and investor-facing persistence.

### Architecture

```
Calculator Engine → extractDealBenefitProfile() → dbpService.save() → Backend
                                                                          ↓
Utilization Engine ← dealToBenefitStream()      ← dbpService.getById() ← DB
```

### Files

| File | Purpose |
|------|---------|
| `types/dealBenefitProfile.ts` | `DealBenefitProfile`, `DealBenefitProfileView`, `InvestmentPool` types |
| `utils/taxbenefits/dealBenefitProfile.ts` | `extractDealBenefitProfile()` — pure extraction from engine results; `dealToBenefitStream()` — reverse conversion for utilization engine |
| `services/dbpService.ts` | HTTP service → `POST /deal-benefit-profiles/extract/{conduitId}`, `GET /conduit/{id}`, `GET /{id}/view`, `DELETE /{id}` |
| `services/poolService.ts` | HTTP service → `POST /investment-pools`, `GET /{id}/deals`, `POST /{poolId}/deals/{dbpId}` |

### Key Rules

1. **DBP extraction is supplementary.** If extraction or persistence fails, the DealConduit config save still succeeds. The save flow uses try/catch isolation.
2. **No new calculations.** `extractDealBenefitProfile()` reads from existing `InvestorAnalysisResults` and `DepreciationSchedule` only.
3. **DBP is immutable after extraction.** Re-modeling creates a new DBP (append pattern).
4. **Portal metadata lives on DealConduit, not DBP.** The `DealBenefitProfileView` DTO provides source context via the `/view` endpoint.
5. **DBP extraction triggers only when `isInvestorFacing === true`** in `HDCInputsComponent.handleSaveConfiguration()`.

### Tests

| File | Tests | Coverage |
|------|-------|----------|
| `utils/taxbenefits/__tests__/dealBenefitProfile.test.ts` | 21 | Extraction, conversion, round-trip with tax utilization engine |
| `services/__tests__/dbpService.test.ts` | 8 | Endpoint URLs, request shapes, error propagation |
| `services/__tests__/poolService.test.ts` | 8 | Endpoint URLs, path params, error handling |

---

## Pool Aggregation & Fund Sizing (IMPL-085)

The pool aggregation engine consolidates N DealBenefitProfiles into a single calendar-year-aligned BenefitStream. The sizing optimizer iterates commitment levels against the pooled stream to find the utilization peak.

### Architecture

```
DBPs (from pool) → aggregatePoolToBenefitStream() → BenefitStream (DOLLARS)
                                                          ↓
                                            scaleBenefitStreamToMillions()
                                                          ↓
                                            calculateTaxUtilization()
                                                          ↓
                                            TaxUtilizationResult

Sizing:
pooledStream → optimizeFundCommitment(stream, totalEquity, investor)
                   ↓ iterates commitment levels
              scaleStreamByProRata() → scaleBenefitStreamToMillions() → calculateTaxUtilization()
                   ↓ finds peak savingsPerDollar
              FundSizingResult (optimalCommitment, efficiencyCurve, peakType)
```

### Value Scaling Convention

| Layer | Unit | Example $100M |
|-------|------|--------------|
| DealBenefitProfile (stored) | DOLLARS | 100,000,000 |
| `dealToBenefitStream()` output | DOLLARS | 100,000,000 |
| `aggregatePoolToBenefitStream()` output | DOLLARS | 100,000,000 |
| `calculateTaxUtilization()` input | MILLIONS | 100 |

### Files

| File | Purpose |
|------|---------|
| `utils/taxbenefits/poolAggregation.ts` | `aggregatePoolToBenefitStream()` — calendar-year alignment and summation; `scaleBenefitStreamToMillions()` — dollar-to-million conversion; `buildInvestorProfileFromTaxInfo()` — portal InvestorTaxInfo to engine InvestorProfile |
| `utils/taxbenefits/fundSizingOptimizer.ts` | `optimizeFundCommitment()` — iterates commitment levels, finds utilization peak; `scaleStreamByProRata()` — linear scaling by investor share |
| `types/fundSizing.ts` | Type re-exports: `PoolAggregationResult`, `FundSizingResult`, `SizingDataPoint`, `PeakType` |
| `components/investor-portal/FundDetail/` | Fund detail screen — displays pool, sizing recommendation, efficiency curve, utilization at optimal point |

### Key Rules

1. **No new tax calculations.** Aggregation is alignment + summation. Sizing is iteration over the existing utilization engine.
2. **Exit events stay separate.** One per deal, sorted chronologically. The utilization engine handles recapture coverage per exit.
3. **Scaling at the boundary.** Pool aggregation produces DOLLARS. `scaleBenefitStreamToMillions()` converts at the call site before passing to `calculateTaxUtilization()`.
4. **Peak type classification.** The optimizer classifies curves as `peak` (benefits suspend above optimal), `plateau` (fully utilized), or `rising` (capacity exceeds fund). UI messaging adapts accordingly.

### Tests

| File | Tests | Coverage |
|------|-------|----------|
| `utils/taxbenefits/__tests__/poolAggregation.test.ts` | 28 | Aggregation, scaling, profile builder, round-trip with utilization engine |
| `utils/taxbenefits/__tests__/fundSizingOptimizer.test.ts` | 18 | Optimizer, pro-rata scaling, peak classification, capacity warnings |

---

## Exit Tax Engine — Character-Split Recapture (IMPL-094 through IMPL-101)

Replaces the flat 25% depreciation recapture rate with an IRC-compliant character-split exit tax model.

### Architecture

```
buildDepreciationSchedule() → cumulative1245, cumulative1250
                                       ↓
calculateExitTax() → ExitTaxResult (18 fields, single invocation)
       ↓                           ↓
ExitEvent (engine)      results.exitTaxAnalysis (consumers)
```

### Single Invocation Pattern

`calculateExitTax()` is called exactly once inside `calculateFullInvestorAnalysis()` (in the `includeDepreciationSchedule` block). All downstream consumers read from the result — no independent recapture computations exist.

**Two channels:**
1. **ExitEvent** — engine-internal consumption (tax utilization)
2. **results.exitTaxAnalysis** — post-engine consumers (DBP, Excel export, UI)

### ExitTaxResult Interface

| Field | Type | Description |
|-------|------|-------------|
| `sec1245Recapture` | number | §1245 ordinary income (cost seg / bonus) |
| `sec1245Rate` | number | Federal ordinary rate |
| `sec1245Tax` | number | §1245 × ordinary rate |
| `sec1250Recapture` | number | §1250 unrecaptured gain (straight-line) |
| `sec1250Rate` | number | 25% statutory cap |
| `sec1250Tax` | number | §1250 × 25% |
| `remainingGain` | number | LTCG (appreciation above basis) |
| `remainingGainRate` | number | Federal cap gains rate |
| `remainingGainTax` | number | LTCG × cap gains rate |
| `niitRate` | number | 3.8% if applicable, else 0 |
| `niitTax` | number | NIIT on all gain characters |
| `totalFederalExitTax` | number | Sum of all federal components |
| `stateExitTax` | number | Conformity-aware state tax |
| `stateConformity` | string | State OZ conformity type |
| `totalExitTaxWithState` | number | Federal + state |
| `ozExcludesRecapture` | boolean | OZ 10+ year exclusion flag |
| `ozExcludesAppreciation` | boolean | OZ 10+ year exclusion flag |
| `netExitTax` | number | $0 for OZ 10+ holds, else totalExitTaxWithState |

### Key Rules

1. **§1245 at ordinary rate.** Cost segregation / bonus depreciation recaptured as ordinary income.
2. **§1250 capped at 25%.** Straight-line depreciation uses the IRC §1250 unrecaptured gain rate.
3. **NIIT stacks on ALL characters.** 3.8% Net Investment Income Tax applies to passive investors across §1245, §1250, and LTCG.
4. **Three-source NIIT determination.** Territory auto-exempts, REP aggregation election exempts, default passive applies.
5. **Conformity-aware state tax.** `getEffectiveStateCapGainsRate()` returns 0 for full-rolling/full-adopted/no-cg-tax OZ conformity states.
6. **OZ 10+ year hold = $0 net exit tax.** Underlying components still computed for informational display.
7. **IRR/multiple adjusted.** Terminal cash flow reduced by `netExitTax` before IRR recalculation.

### Files

| File | Purpose |
|------|---------|
| `utils/taxbenefits/calculations.ts` | `calculateExitTax()`, `getEffectiveStateCapGainsRate()`, wiring |
| `utils/taxbenefits/depreciationSchedule.ts` | `cumulative1245`, `cumulative1250` on DepreciationSchedule |
| `types/taxbenefits/index.ts` | `ExitTaxResult` interface |
| `utils/taxbenefits/investorTaxUtilization.ts` | ExitEvent + RecaptureCoverage extensions |
| `utils/taxbenefits/dealBenefitProfile.ts` | DBP reads from exitTaxAnalysis |
| `utils/taxbenefits/auditExport/sheets/investorReturnsSheet.ts` | Excel export character-split section |
| `components/taxbenefits/results/ReturnsBuiltupStrip.tsx` | Exit Tax Cost row with expandable sub-rows |

### Tests

| File | Tests | Coverage |
|------|-------|----------|
| `utils/taxbenefits/__tests__/features/exit-tax-engine.test.ts` | 29 | E-1 to E-20, Scenarios 10A/10B/10C, conformity, wiring |

---

## Timing Clock Precision — Hold Period vs Model Duration (Timing Handoff v3.0)

`computeHoldPeriod.ts` now outputs **four values** instead of two, splitting the investor's hold period from the model's cash flow duration:

| Output | Meaning | Used For |
|--------|---------|----------|
| `holdFromPIS` | Credit period only (10 or 11 years) — no delay | UI display, hold period communication |
| `totalInvestmentYears` | prePIS + holdFromPIS + 1 disposition | Exit year, OZ qualification, investor hold |
| `modelDurationYears` | totalInvestmentYears + delay spillover | Cash flow loop bound, pending array sizing |
| `delaySpilloverYears` | Extra rows for delayed benefit capture | IRR accuracy (captures K-1 delayed benefits) |

### Key Rule

**K-1 delivery delay does NOT extend the investor's hold period.** The investor exits after the last credit year + disposition. The delay only extends the model's cash flow array so the IRR calculation captures delayed benefit realization in post-exit spillover rows.

### Files

| File | Role |
|------|------|
| `utils/taxbenefits/computeHoldPeriod.ts` | Pure function: computes all 4 timing outputs |
| `utils/taxbenefits/calculations.ts` | Consumes `modelDurationYears` for loop, `totalInvestmentYears` for exit |
| `hooks/taxbenefits/useHDCState.ts` | Calls `computeHoldPeriod()`, exposes all 4 values |
| `utils/taxbenefits/auditExport/sheets/timingGanttSheet.ts` | Timing Gantt chart Excel sheet for auditing |

---

## Documented Assumptions Gate (IMPL-118)

Before implementing any IMPL that touches LIHTC credit calculations, deal type, applicable fraction, or occupancy ramp, read `docs/DOCUMENTED_ASSUMPTIONS.md` in full and confirm the implementation does not violate any documented assumption.

---

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-18 | Initial creation | IMPL-057 audit findings |
| 2026-01-27 | Added Sign Convention Standard | ISS-052 |
| 2026-01-27 | Added Override Anti-Pattern | ISS-053 |
| 2026-01-27 | Added DSCR Display Standard | ISS-054 |
| 2026-02-14 | Added Deal Benefit Profile Persistence | IMPL-084 |
| 2026-02-14 | Added Pool Aggregation & Fund Sizing | IMPL-085 |
| 2026-02-18 | Added Exit Tax Engine — Character-Split Recapture | IMPL-094 to IMPL-101 |
| 2026-03-02 | Timing Clock Precision — Hold Period vs Model Duration Split | Timing Handoff v3.0 |
| 2026-03-04 | Added Documented Assumptions Gate | IMPL-118 |
