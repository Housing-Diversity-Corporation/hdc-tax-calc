# v7.0/7.1 Implementation Tasks

**Version:** 1.1  
**Date:** 2025-12-14  
**Status:** ⛔ HOLD — Awaiting Discovery Audit & Spec Finalization

---

## ⛔ IMPLEMENTATION GATE

**DO NOT BEGIN** until:
1. [ ] DISCOVERY_AUDIT_V7.0.md completed
2. [ ] Audit results reviewed by human
3. [ ] Spec refinements incorporated
4. [ ] Human approval to proceed

**Prerequisite:** See `DISCOVERY_AUDIT_V7.0.md`

---

## Table of Contents

1. [Overview & Dependencies](#overview)
2. [SPEC-7.1-001: Innovation Origin](#spec-71-001)
3. [SPEC-7.1-002: Tax Benefits Rename](#spec-71-002)
4. [IMPL-7.0-001: Fee Structure Cleanup](#impl-70-001)
5. [IMPL-7.0-002: State Profile Lookup](#impl-70-002)
6. [IMPL-7.0-003: State LIHTC Calculation](#impl-70-003)
7. [IMPL-7.0-004: Warnings & Display](#impl-70-004)
8. [IMPL-7.0-005: LIHTC Credit Mechanics](#impl-70-005)
9. [IMPL-7.0-006: Preferred Equity](#impl-70-006)
10. [IMPL-7.0-007: Basis Adjustments](#impl-70-007)

---

<a name="overview"></a>
## 1. Overview & Dependencies

### Core Principle

The OZBenefits calculator is a working codebase. All v7.0/7.1 work is **additive enhancement**, not reconstruction. Preserve validated calculation logic; extend where specified.

### Task Summary

| Task ID | Category | Priority | Blocked By |
|---------|----------|----------|------------|
| SPEC-7.1-001 | Documentation | Low | — |
| SPEC-7.1-002 | Naming | Medium | — |
| IMPL-7.0-001 | Fee Cleanup | Critical | — |
| IMPL-7.0-002 | State Lookup | Critical | — |
| IMPL-7.0-003 | State Calc | Critical | 002 |
| IMPL-7.0-004 | Warnings | High | 002 |
| IMPL-7.0-005 | LIHTC Mechanics | Critical | — |
| IMPL-7.0-006 | Preferred Equity | Critical | — |
| IMPL-7.0-007 | Basis Adjustments | Medium | — |

### Recommended Order

**Phase 1:** 001 → 002 → 005 (parallel: 006, 007)  
**Phase 2:** 003 → 004  
**Phase 3:** SPEC-7.1-001, SPEC-7.1-002

---

<a name="spec-71-001"></a>
## 2. SPEC-7.1-001: Innovation Origin

**Purpose:** Document AHEF/BG learning that enabled concentrated equity strategy.

### Changes to Master Spec

Insert new §0.1 after Executive Summary:

```markdown
## Section 0.1: Innovation Origin

HDC's core innovation emerged from direct experience with Amazon Housing 
Equity Fund (AHEF) and Ballmer Group philanthropic debt partnerships. 
These partnerships demonstrated that **90% leverage with qualified 
nonrecourse philanthropic debt concentrates massive tax benefits on 
thin equity**.

### Why OBBBA Was the Catalyst

| Pre-OBBBA | Post-OBBBA |
|-----------|------------|
| OZ sunset uncertainty | OZ permanent |
| Bonus depreciation phasing out | 100% bonus permanent |
| Platform investment risk | Regulatory certainty |

### Market Positioning

> "We learned from our work with Amazon Housing Equity Fund and Ballmer 
> Group that 90% leverage with qualified nonrecourse philanthropic debt 
> concentrates benefits on thin equity—and OBBBA made that structure 
> permanent."
```

### Acceptance Criteria
- [ ] §0.1 exists after Executive Summary
- [ ] AHEF/BG language exact as specified
- [ ] Executive Summary references §0.1

---

<a name="spec-71-002"></a>
## 4. SPEC-7.1-002: Tax Benefits Rename

**Purpose:** Reframe from OZ-centric to comprehensive tax benefits.

### Naming Changes

| Current | Updated |
|---------|---------|
| OZBenefits Calculator | Tax Benefits Calculator |
| "OZ is the product" | "Tax Benefits is the product, OZ is one layer" |

### Value Hierarchy (Correct Order)

1. **LIHTC Credits** — Foundation (always present)
2. **State LIHTC** — Where available
3. **Depreciation** — Concentrated on thin equity
4. **OZ Enhancement** — Toggle for qualifying investors

### Preserve
- OZ + Bonus Depreciation in marcoms (strategic wedge)
- RetireBetterOZ.com domain
- All OZ calculation logic

### Acceptance Criteria
- [ ] "OZBenefits" replaced with "Tax Benefits" throughout
- [ ] Value hierarchy updated in Executive Summary
- [ ] OZ marcoms positioning preserved

---

<a name="impl-70-001"></a>
## 5. IMPL-7.0-001: Fee Structure Cleanup

**Category:** A - Fee Structure  
**Branch:** `impl-7.0-fee-cleanup`

### Purpose
Remove 10% tax benefit fee. AUM fee only per legal counsel.

### Changes

**Remove from types.ts:**
```typescript
hdcTaxBenefitFee: number; // DELETE
```

**Remove from calculations.ts:**
```typescript
taxBenefitFee: investorBenefit * hdcTaxBenefitFee; // DELETE
```

**Search pattern:**
```bash
grep -rn "taxBenefitFee" src --include="*.ts" --include="*.tsx"
```

### Acceptance Criteria
- [ ] Zero references to `taxBenefitFee` in production code
- [ ] No fee UI elements remain
- [ ] AUM fee still functional
- [ ] All tests pass

---

<a name="impl-70-002"></a>
## 6. IMPL-7.0-002: Unified State Profile Lookup

**Category:** B - State Data  
**Branch:** `impl-7.0-state-profile-lookup`

### Purpose
Unified state lookup covering ALL state-level parameters: OZ conformity, bonus depreciation conformity, state LIHTC programs, and prevailing wage requirements. 56 jurisdictions (50 states + DC + 5 territories).

**Key Decision:** Data fetched at runtime from external JSON, NOT hardcoded.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────►│  state-data.json│
│  Calculator     │     │  (S3/CDN/API)   │
└─────────────────┘     └─────────────────┘
```

### Data Storage Requirements

| Requirement | Specification |
|-------------|---------------|
| Format | JSON file |
| Compiled in? | NO — fetched at runtime |
| Hosting | TBD (S3, CDN, or API endpoint) |
| Caching | Fetch once per session (or TTL-based) |
| Fallback | Bundled default if fetch fails |
| Update process | Edit JSON + upload (no code deploy) |

### JSON Schema: StateProfile

```typescript
interface StateProfile {
  stateCode: string;
  stateName: string;
  
  // Tax Rates
  topOrdinaryRate: number;
  capitalGainsRate: number | null;
  
  // OZ Conformity
  ozConformity: 'full' | 'partial' | 'none';
  ozConformityType: 'rolling' | 'static' | null;
  ozStaticDate: string | null;
  ozDecouplingDate: string | null;
  ozStateGainsTaxed: boolean;
  ozAuthority: string;
  
  // Bonus Depreciation Conformity
  bonusDepConformity: number;  // 0.0 to 1.0
  bonusDepAuthority: string;
  
  // State LIHTC
  stateLIHTCProgram: boolean;
  stateLIHTCStructure: 'piggyback' | 'supplement' | 'standalone' | 'donation' | 'grant' | null;
  stateLIHTCPercent: number | null;
  stateLIHTCTransferable: boolean;
  stateLIHTCSunset: string | null;
  stateLIHTCAuthority: string | null;
  
  // Prevailing Wage
  pwRequired4Percent: boolean;
  pwRequiredStateLIHTC: boolean;
  pwCostImpact: number | null;
  pwAuthority: string | null;
  
  // Metadata
  lastUpdated: string;
  notes: string | null;
}
```

### New Files

**stateProfileService.ts:**
```typescript
// Fetch with caching
let cachedProfiles: StateProfile[] | null = null;

export async function getStateProfiles(): Promise<StateProfile[]> {
  if (cachedProfiles) return cachedProfiles;
  
  try {
    const response = await fetch(STATE_DATA_URL);
    cachedProfiles = await response.json();
    return cachedProfiles;
  } catch (error) {
    console.warn('Failed to fetch state data, using fallback');
    return FALLBACK_STATE_DATA;
  }
}

export async function getStateProfile(stateCode: string): Promise<StateProfile | null> {
  const profiles = await getStateProfiles();
  return profiles.find(p => p.stateCode === stateCode) || null;
}
```

**state-data.json (hosted externally):**
```json
[
  {
    "stateCode": "GA",
    "stateName": "Georgia",
    "topOrdinaryRate": 0.0549,
    "capitalGainsRate": null,
    "ozConformity": "full",
    "ozConformityType": "rolling",
    "bonusDepConformity": 0,
    "stateLIHTCProgram": true,
    "stateLIHTCStructure": "piggyback",
    "stateLIHTCPercent": 100,
    "stateLIHTCTransferable": true,
    "stateLIHTCSunset": null,
    "pwRequired4Percent": false,
    "pwRequiredStateLIHTC": false,
    "lastUpdated": "2025-12-14"
  }
]
```

**fallbackStateData.ts:**
```typescript
// Bundled copy for offline/failure scenarios
export const FALLBACK_STATE_DATA: StateProfile[] = [...]
```

### Data Sources for Initial Population

- OZ conformity: Addendum v7.0 Appendix B
- Bonus dep: Tax Foundation July 2025
- State LIHTC: 25-state survey from v6.5
- PW triggers: PW research from v6.4
- Tax rates: Tax Foundation 2025

### Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-1 | 56 jurisdictions in JSON | Count rows |
| AC-2 | All fields populated | Schema validation |
| AC-3 | Fetched at runtime | Network tab shows request |
| AC-4 | Cached after first fetch | No duplicate requests |
| AC-5 | Fallback works if fetch fails | Disable network, test |
| AC-6 | OZ conformity accurate | Spot check NY, CA, OR |
| AC-7 | State LIHTC accurate | Spot check GA, NE, HI |
| AC-8 | No hardcoded state data in source | Grep audit |

---

<a name="impl-70-003"></a>
## 7. IMPL-7.0-003: State LIHTC Calculation

**Category:** C - State LIHTC Calculation  
**Branch:** `impl-7.0-state-lihtc-calc`  
**Blocked by:** IMPL-7.0-002 (Unified State Profile)

### Purpose
Calculate state credits with syndication discount. Uses state LIHTC data from unified StateProfile.

### Calculation Logic

**Piggyback:**
```
State Credit = Federal Credit × stateLIHTCPercent
```

**Syndication:**
```
Net Benefit = Gross Credit × Syndication Rate (default 85%)
```

### New File: stateLIHTCCalculations.ts

```typescript
export async function calculateStateLIHTC(params: {
  federalCredit: number;
  propertyState: string;
  syndicationRateOverride?: number;
  investorHasStateLiability?: boolean;
}): Promise<StateLIHTCCalculationResult> {
  const profile = await getStateProfile(params.propertyState);
  
  if (!profile?.stateLIHTCProgram) {
    return { grossCredit: 0, netBenefit: 0, warnings: ['No state LIHTC program'] };
  }
  
  let grossCredit = 0;
  if (profile.stateLIHTCStructure === 'piggyback' && profile.stateLIHTCPercent) {
    grossCredit = params.federalCredit * (profile.stateLIHTCPercent / 100);
  }
  
  const syndicationRate = profile.stateLIHTCTransferable 
    ? (params.syndicationRateOverride ?? 0.85)
    : (params.investorHasStateLiability ? 1.0 : 0);
    
  return {
    grossCredit,
    syndicationRate,
    netBenefit: grossCredit * syndicationRate,
  };
}
```

### Acceptance Criteria
- [ ] GA: $31.2M federal → $31.2M state gross (100% piggyback)
- [ ] 85% syndication applied by default for transferable
- [ ] Non-transferable: 100% if liability, 0% if not
- [ ] 10-year schedule generated
- [ ] Pulls from unified StateProfile

---

<a name="impl-70-004"></a>
## 8. IMPL-7.0-004: Warnings & Display

**Category:** D - Warnings & Display  
**Branch:** `impl-7.0-warnings-display`  
**Blocked by:** IMPL-7.0-002 (Unified State Profile)

### Warning Types (All from StateProfile data)

| Type | Trigger | Severity |
|------|---------|----------|
| prevailing_wage | pwRequired4Percent or pwRequiredStateLIHTC | warning |
| sunset | stateLIHTCSunset ≤24 months | critical |
| transferability | !stateLIHTCTransferable + no liability | warning |
| oz_conformity | ozConformity !== 'full' + ozEnabled | info |
| bonus_dep_conformity | bonusDepConformity < 1.0 | info |

### New File: warningGenerator.ts

```typescript
export async function generateWarnings(params: {
  propertyState: string;
  investorState: string;
  pisDate: Date;
  stateLIHTCEnabled: boolean;
  ozEnabled: boolean;
}): Promise<CalculatorWarning[]> {
  const propertyProfile = await getStateProfile(params.propertyState);
  const investorProfile = await getStateProfile(params.investorState);
  
  const warnings: CalculatorWarning[] = [];
  
  // PW Warning
  if (params.stateLIHTCEnabled && propertyProfile?.pwRequiredStateLIHTC) {
    warnings.push({
      type: 'prevailing_wage',
      severity: 'warning',
      message: `${propertyProfile.stateName} requires prevailing wage for state LIHTC`,
      impact: `May increase costs ${(propertyProfile.pwCostImpact || 0.15) * 100}%`
    });
  }
  
  // OZ Conformity Warning (investor state)
  if (params.ozEnabled && investorProfile?.ozConformity !== 'full') {
    warnings.push({
      type: 'oz_conformity',
      severity: 'info',
      message: `${investorProfile.stateName} does not fully conform on OZ benefits`,
      impact: investorProfile.ozStateGainsTaxed 
        ? 'State will tax gains federal excludes' 
        : 'State OZ treatment differs from federal'
    });
  }
  
  // Bonus Dep Conformity Warning (investor state)
  if (investorProfile?.bonusDepConformity < 1.0) {
    warnings.push({
      type: 'bonus_dep_conformity',
      severity: 'info',
      message: `${investorProfile.stateName} allows ${investorProfile.bonusDepConformity * 100}% bonus depreciation`,
      impact: 'State depreciation schedule differs from federal'
    });
  }
  
  return warnings;
}
```

### Acceptance Criteria
- [ ] PW warning for CA property with state LIHTC
- [ ] OZ conformity warning for NY investor
- [ ] Bonus dep warning for NJ investor (0%)
- [ ] Sunset warning for HI (2027)
- [ ] All warnings pull from unified StateProfile

---

<a name="impl-70-005"></a>
## 9. IMPL-7.0-005: LIHTC Credit Mechanics

**Category:** F - LIHTC Credit Mechanics  
**Branch:** `impl-7.0-lihtc-mechanics`

### Purpose
10-year credit period, PIS proration, Year 11 catch-up.

### Calculation Logic

**Year 1 Proration:**
```
Year 1 Credit = Annual Credit × (Months in Service / 12)
```

**Year 11 Catch-up:**
```
Year 11 Credit = Annual Credit - Year 1 Credit
```

### New File: lihtcCreditCalculations.ts

```typescript
export function calculateLIHTCSchedule(params: {
  eligibleBasis: number;
  applicableFraction: number;
  creditRate: number;
  pisMonth: number;
  ddaQctBoost: boolean;
}): LIHTCCreditSchedule
```

### Acceptance Criteria
- [ ] July PIS: Year 1 = 50%, Year 11 = 50%
- [ ] January PIS: Year 1 = 100%, Year 11 = 0
- [ ] Total always = 10 × annual
- [ ] DDA/QCT 130% boost applied

---

<a name="impl-70-006"></a>
## 10. IMPL-7.0-006: Preferred Equity

**Category:** H - Preferred Equity  
**Branch:** `impl-7.0-preferred-equity`

### Purpose
Preferred equity layer with 1.7x MOIC, waterfall priority.

### Capital Structure (Slate brief)

| Layer | Amount | Terms |
|-------|--------|-------|
| Senior Debt | $40M | 5.5% |
| PABs | $25M | 5.0% |
| **Preferred Equity** | **$23M** | **1.7x MOIC** |
| QOF Equity | $12M | — |

### Waterfall Priority
1. Senior Debt → 2. PABs → 3. Preferred → 4. Sponsor/Investor

### New File: preferredEquityCalculations.ts

```typescript
export function calculatePreferredEquity(params): PreferredEquityResult
```

### Acceptance Criteria
- [ ] $23M × 1.7 = $39.1M target
- [ ] Waterfall order enforced
- [ ] Shortfall tracked
- [ ] MOIC achieved calculated

---

<a name="impl-70-007"></a>
## 11. IMPL-7.0-007: Basis Adjustments

**Category:** I - Basis Adjustments  
**Branch:** `impl-7.0-basis-adjustments`

### Purpose
Add loan fees, legal costs, org costs to depreciable basis.

### Parameters

| Parameter | Default | Range |
|-----------|---------|-------|
| loanFeesPercent | 1% | 0.5-3% |
| legalStructuringCosts | $150,000 | $50K-$500K |
| organizationCosts | $50,000 | $25K-$150K |

### Calculation

```typescript
const basisAdjustments = 
  (totalDebt * loanFeesPercent) + 
  legalStructuringCosts + 
  organizationCosts;

depreciableBasis += basisAdjustments;
```

### Acceptance Criteria
- [ ] 1% of $65M debt = $650K loan fees
- [ ] All three add to basis
- [ ] Year 1 depreciation increases
- [ ] UI inputs functional

---

## Global Definition of Done

Per VALIDATION_PROTOCOL.md, each task requires:
- [ ] All layers synced (types, calculations, hooks, UI)
- [ ] 100% test coverage for new code
- [ ] Grep audits pass
- [ ] Independent mathematical verification
- [ ] Commit message format: `feat: [description] (TASK-ID)`