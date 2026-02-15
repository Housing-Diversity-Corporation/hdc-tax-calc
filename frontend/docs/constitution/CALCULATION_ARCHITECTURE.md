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

## History

| Date | Change | Reference |
|------|--------|-----------|
| 2026-01-18 | Initial creation | IMPL-057 audit findings |
| 2026-01-27 | Added Sign Convention Standard | ISS-052 |
| 2026-01-27 | Added Override Anti-Pattern | ISS-053 |
| 2026-01-27 | Added DSCR Display Standard | ISS-054 |
| 2026-02-14 | Added Deal Benefit Profile Persistence | IMPL-084 |
| 2026-02-14 | Added Pool Aggregation & Fund Sizing | IMPL-085 |
