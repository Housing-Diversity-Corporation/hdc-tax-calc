# State Tax Conformity Specification v1.0

## Overview

State tax conformity affects investor returns through two independent regulatory dimensions. This spec defines the backend data structure and calculation logic for the OZBenefits platform.

**STATUS: STAGED FOR Q1 2026 IMPLEMENTATION**

---

## Strategic Context

### Investor Value Proposition
State conformity directly determines investor returns:
- **Oregon investor**: Full federal + full state benefits = highest projected returns
- **New Jersey investor**: Full federal + no state bonus depreciation = ~25-30% lower state benefits
- **New York investor**: NO state OZ conformity = federal benefits only

The platform must accurately model these differences so investors see realistic, personalized projections.

### Institutional Validation
- **Novogradac**: Maintains authoritative OZ conformity data; accurate implementation demonstrates HDC speaks their language
- **Sidley Austin**: Tax opinions must reflect state-specific treatment
- **Caprock Group**: Ultra-wealthy families in different states need personalized projections

### OZ 2.0 Positioning
Sandy Pleasant (Novogradac) recognized HDC's "tax credit-like execution" of OZ funds. State conformity tracking is foundational - LIHTC syndicators have always modeled state-specific benefits. HDC bringing this rigor to OZ demonstrates institutional-grade capabilities.

### Regulatory Foundation
Two independent conformity dimensions requiring separate authoritative sources:

| Dimension | IRC Section | Source | URL |
|-----------|-------------|--------|-----|
| Bonus Depreciation | §168(k) | Tax Foundation | taxfoundation.org |
| OZ Benefits | §1400Z-2 | Novogradac | novoco.com/resource-centers/opportunity-zones-resource-center/state-tax-code-conformity-personal-income |

### Future Evolution
- **Phase 1 (current)**: Top marginal brackets only, 50 states + DC
- **Phase 2 (post-validation)**: Full bracket tables for investor portal personalization
- **Phase 3 (scale)**: Automated state legislation monitoring

---

## Data Structure

```typescript
export interface StateConformity {
  code: string;                              // "OR", "NJ", etc.
  name: string;                              // "Oregon", "New Jersey"
  topRate: number;                           // Top marginal rate (decimal)
  ozConformity: 'full' | 'partial' | 'none'; // §1400Z-2 (Source: Novogradac)
  ozNotes?: string;                          // Special conditions
  bonusDepreciationConforms: boolean;        // §168(k) (Source: Tax Foundation)
}
```

---

## Key Helper Functions

```typescript
// Check if state conforms to bonus depreciation (§168(k))
function stateConformsToBonusDepreciation(code: string): boolean

// Check if state conforms to OZ benefits (§1400Z-2)
function stateConformsToOZ(code: string): boolean

// Get effective state depreciation multiplier for Year 1 bonus
function getStateBonusMultiplier(code: string): number

// Get highest-value states (full OZ + full bonus depreciation)
function getHighestValueStates(): StateConformity[]
```

---

## Calculation Impact

**State Depreciation Benefit:**
```typescript
const stateBonusMultiplier = getStateBonusMultiplier(selectedState);

// Year 1 State Benefit
const year1StateDepreciation = bonusDepreciation * stateBonusMultiplier;
const year1StateStraightLine = stateBonusMultiplier === 0
  ? (depreciableBasis / 27.5)  // Full straight-line if no bonus
  : straightLineDepreciation;   // Normal straight-line on remainder

const year1StateBenefit = (year1StateDepreciation + year1StateStraightLine) * stateRate;
```

---

## Data Maintenance Schedule

| Source | Check Frequency | What to Update |
|--------|-----------------|----------------|
| Tax Foundation §168(k) | Annually (January) | `bonusDepreciationConforms` field |
| Novogradac §1400Z-2 | Quarterly | `ozConformity` and `ozNotes` fields |
| State tax rates | Annually (January) | `topRate` field |

---

## Known Limitations (Documented, Not Built)

- Territory NIIT exception not modeled
- City tax add-ons handled via custom rate entry in UI
- Partial bonus conformity treated as binary
- Top marginal brackets only (full bracket system is future enhancement)

---

**Document Version:** v1.0
**Last Updated:** November 29, 2025
**Implementation Target:** Q1 2026 (Post-Vegas)
