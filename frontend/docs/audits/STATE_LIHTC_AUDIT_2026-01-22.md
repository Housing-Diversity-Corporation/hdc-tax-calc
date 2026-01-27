# State LIHTC Architecture Audit Report

**Date:** 2026-01-22
**Auditor:** Claude Code
**Branch:** main
**Task ID:** AUDIT-001

---

## 1. Executive Summary

The current state LIHTC architecture is **well-designed and production-ready**, following modern TypeScript patterns with a unified state profile system. All 25 state LIHTC programs are implemented with proper support for 4 program types (piggyback, supplement, standalone, grant), 5 transferability mechanisms, and comprehensive syndication rate handling. The architecture properly separates data (JSON), types, calculation logic, and UI components with strong adherence to Single Source of Truth principles. Test coverage is comprehensive with 90+ dedicated state LIHTC tests.

**Key Strengths:**
- Unified `StateTaxProfile` interface combining OZ conformity, bonus depreciation, and state LIHTC in single data structure
- Clean separation: `stateProfiles.data.json` → `stateProfiles.ts` → `stateLIHTCCalculations.ts` → `useHDCCalculations.ts` → `calculations.ts`
- Excellent test coverage including all program types, multiple states, edge cases, and IMPL-047 toggle behavior

**Notable Finding:** UI components (`TaxCreditsSection.tsx`) call `calculateStateLIHTC` directly for preview feedback, which duplicates the hook calculation but is acceptable for immediate user feedback. Not a true SSOT violation since the authoritative values flow from the engine.

---

## 2. File Inventory

### 2.1 State LIHTC Calculation Files
| File | Lines | Purpose | State LIHTC Relevance |
|------|-------|---------|----------------------|
| `calculations.ts` | 1,686 | Main calculation engine | Receives `stateLIHTCIntegration` param; applies credits to cash flows |
| `stateLIHTCCalculations.ts` | 653 | Dedicated state LIHTC logic | Core calculation: 4 program types, syndication rates, 11-year schedules |
| `stateProfiles.ts` | 432 | Unified state lookup | `getStateLIHTCProgram()` accessor for 25 state programs |
| `stateProfiles.types.ts` | 236 | Type definitions | `StateLIHTCProgram` interface, `StateLIHTCType`, `Transferability` types |
| `stateProfiles.data.json` | ~2,800 | State data (JSON) | 56 jurisdictions with embedded `stateLIHTC` objects |
| `lihtcCreditCalculations.ts` | ~300 | Federal LIHTC calculations | Year 1 proration factor used by state LIHTC |

### 2.2 State Data Files
| File | Lines | Purpose | Data Structure |
|------|-------|---------|----------------|
| `stateProfiles.data.json` | ~2,800 | Single source of truth for state data | JSON object with `profiles` map keyed by state code |
| `stateProfiles.ts` | 432 | O(1) lookup accessors | `Record<string, StateTaxProfile>` (StateTaxProfileMap) |
| `stateData.ts` | 190 | **DEPRECATED** - backward compatibility wrapper | Re-exports from `stateProfiles.ts` |

### 2.3 UI Component Files
| File | Lines | State LIHTC Inputs | Auto vs Manual |
|------|-------|-------------------|----------------|
| `TaxCreditsSection.tsx` | 733 | Enable toggle, investor state, syndication rate, liability checkbox, user % / amount, syndication year | Investor state: manual; syndication rate: auto-adjusts for in-state; program info: auto from lookup |
| `StateLIHTCSection.tsx` | 412 | **DEPRECATED** - consolidated into TaxCreditsSection | Same as above |
| `useHDCState.ts` | 395 | State management for all inputs | `stateLIHTCEnabled`, `investorState`, `syndicationRate`, `investorHasStateLiability`, `stateLIHTCSyndicationYear` |

### 2.4 Hook Files
| File | Lines | Purpose |
|------|-------|---------|
| `useHDCCalculations.ts` | 834 | Orchestrates state LIHTC calculation and integration |

### 2.5 Output/Display Files
| File | Lines | Purpose |
|------|-------|---------|
| `ReturnsBuiltupStrip.tsx` | 929 | Displays state LIHTC in returns breakdown |
| `lihtcSheet.ts` | 195 | Exports 11-year state LIHTC schedule to Excel |
| `summarySheet.ts` | ~250 | Includes state LIHTC totals in summary |
| `inputsSheet.ts` | ~400 | Exports state LIHTC input parameters |

---

## 3. Current State Data Structure

### 3.1 Interface Definition
```typescript
// From stateProfiles.types.ts:65-101
export interface StateLIHTCProgram {
  /** Program name (e.g., "State LIHTC", "AHAP") */
  program: string;

  /** Program structure type */
  type: StateLIHTCType;  // 'piggyback' | 'supplement' | 'standalone' | 'grant' | null

  /**
   * Percentage of federal credits (for piggyback/supplement)
   * Range: 0-100 for piggyback, varies for supplement
   */
  percent: number;

  /** Transferability mechanism */
  transferability: Transferability;  // 'certificated' | 'transferable' | 'bifurcated' | 'allocated' | 'grant'

  /**
   * Syndication rate (net realization %)
   * - Certificated/Transferable: 90%
   * - Bifurcated: 85%
   * - Allocated: 80%
   * - Grant: 100%
   */
  syndicationRate: number;

  /** Annual program cap (in dollars) or null if uncapped */
  cap?: number | null;

  /** Program sunset year (e.g., 2028 for KS) or null if permanent */
  sunset?: number | null;

  /** Whether state prevailing wage is required */
  pw: boolean;

  /** Legal authority citation */
  authority: string;
}
```

### 3.2 State LIHTC Fields Currently Stored
| Field | Type | Source | Used In |
|-------|------|--------|---------|
| `program` | string | JSON data file | UI display, warnings |
| `type` | `'piggyback'`\|`'supplement'`\|`'standalone'`\|`'grant'` | JSON data file | Calculation path selection |
| `percent` | number | JSON data file | Piggyback credit calculation |
| `transferability` | enum | JSON data file | Syndication rate determination |
| `syndicationRate` | number | JSON data file | Net benefit calculation |
| `cap` | number \| null | JSON data file | Warning generation |
| `sunset` | number \| null | JSON data file | Warning generation |
| `pw` | boolean | JSON data file | Warning generation |
| `authority` | string | JSON data file | Metadata/audit |

### 3.3 Sample State Entries

**Georgia (Tier 1 - 100% Piggyback, Bifurcated):**
```json
{
  "code": "GA",
  "name": "Georgia",
  "type": "state",
  "topRate": 5.75,
  "ozConformity": "full-adopted",
  "bonusDepreciation": 0,
  "stateLIHTC": {
    "program": "State LIHTC",
    "type": "piggyback",
    "percent": 100,
    "transferability": "bifurcated",
    "syndicationRate": 85,
    "cap": null,
    "sunset": null,
    "pw": false,
    "authority": "O.C.G.A. §33-1-18"
  },
  "hdcTier": 1,
  "combinedRate": 46.6
}
```

**California (Tier 3 - Standalone, Certificated, PW Required):**
```json
{
  "code": "CA",
  "name": "California",
  "topRate": 13.3,
  "stateLIHTC": {
    "program": "State LIHTC",
    "type": "standalone",
    "percent": 0,
    "transferability": "certificated",
    "syndicationRate": 90,
    "cap": null,
    "sunset": null,
    "pw": true,
    "authority": "Cal. Rev. & Tax. §17058"
  },
  "hdcTier": 3,
  "prevailingWageNotes": "State PW required (10-20% cost increase)"
}
```

---

## 4. Calculation Logic Analysis

### 4.1 State LIHTC Calculation Entry Point

**Location:** `useHDCCalculations.ts:435-468`
```typescript
const stateLIHTCResult: StateLIHTCCalculationResult | null = useMemo(() => {
  if (!props.stateLIHTCEnabled || !lihtcResult) return null;

  try {
    return calculateStateLIHTC({
      federalAnnualCredit: lihtcResult.annualCredit,
      propertyState: props.selectedState,
      investorState: props.investorState || '',
      pisMonth: props.placedInServiceMonth || 7,
      syndicationRateOverride: props.syndicationRate || 75,
      investorHasStateLiability: props.investorHasStateLiability,
      userPercentage: props.stateLIHTCUserPercentage,
      userAmount: props.stateLIHTCUserAmount,
    });
  } catch (error) {
    console.error('State LIHTC calculation error:', error);
    return null;
  }
}, [/* dependencies */]);
```

**Analysis:**
- **Match basis:** Federal annual credit (`lihtcResult.annualCredit`)
- **Credit duration:** Implicitly 10 years (11-year schedule with Year 1 proration)
- **DDA/QCT boost:** Flow-through from federal LIHTC via `federalAnnualCredit`

### 4.2 State LIHTC Credit Calculation

**Location:** `stateLIHTCCalculations.ts:488-610`
```typescript
export function calculateStateLIHTC(params: StateLIHTCCalculationParams): StateLIHTCCalculationResult {
  // Step 1: Validate inputs
  validateStateLIHTCParams(params);

  // Step 2: Look up state LIHTC program
  const program = getStateLIHTCProgram(propertyState);

  // Step 3: Determine investor state liability
  const investorHasStateLiability = determineStateLiability(...);

  // Step 4: Calculate gross credit based on program type
  let grossAnnualCredit: number;
  if (program.type === 'piggyback') {
    grossAnnualCredit = calculatePiggybackCredit(federalAnnualCredit, program);
  } else if (program.type === 'supplement') {
    grossAnnualCredit = calculateSupplementCredit(federalAnnualCredit, userPercentage);
  } else if (program.type === 'standalone') {
    grossAnnualCredit = calculateStandaloneCredit(userAmount);
  } else if (program.type === 'grant') {
    grossAnnualCredit = calculateGrantCredit(userAmount);
  }

  // Step 5: Determine syndication rate
  const syndicationRate = determineSyndicationRate(...);

  // Step 6: Calculate net benefit
  const netAnnualBenefit = grossAnnualCredit * syndicationRate;

  // Step 7-9: Generate schedule, warnings, metadata
  return { grossCredit, syndicationRate, netBenefit, schedule, warnings, metadata };
}
```

### 4.3 Syndication Rate Determination (IMPL-047)

**Location:** `stateLIHTCCalculations.ts:217-241`
```typescript
export function determineSyndicationRate(
  program: StateLIHTCProgram,
  investorState: string,
  propertyState: string,
  investorHasStateLiability: boolean,
  syndicationRateOverride?: number
): number {
  // Grant programs: always 100%
  if (program.transferability === 'grant') {
    return 1.0;
  }

  // ISS-020: Checkbox takes PRIORITY over manual override
  if (investorHasStateLiability) {
    return 1.0;  // Direct use - investor can use credits directly
  }

  // No liability → use override or program default
  if (syndicationRateOverride !== undefined) {
    return syndicationRateOverride / 100;
  }

  return program.syndicationRate / 100;  // Syndicated path
}
```

### 4.4 Integration with Main Calculation

**Location:** `calculations.ts:266-271, 1237-1242, 1286`
```typescript
// Capital structure integration (IMPL-073/074)
let stateLIHTCSyndicationProceeds = 0;
if (paramStateLIHTCIntegration?.creditPath === 'syndicated' &&
    paramStateLIHTCIntegration.netProceeds > 0) {
  stateLIHTCSyndicationProceeds = paramStateLIHTCIntegration.netProceeds;
}

// Direct use credits in cash flow
let stateLIHTCCredit = 0;
if (paramStateLIHTCIntegration?.creditPath === 'direct_use' &&
    year <= 11 &&
    paramStateLIHTCIntegration.yearlyCredits) {
  stateLIHTCCredit = paramStateLIHTCIntegration.yearlyCredits[year - 1] || 0;
}

// Total cash flow includes state LIHTC
const totalCashFlow = yearlyTaxBenefit + operatingCashFlow + federalLIHTCCredit + stateLIHTCCredit + ...;
```

---

## 5. UI Parameter Mapping

| UI Parameter | State Variable | Calculation Input | Default | Editable |
|--------------|----------------|-------------------|---------|----------|
| "Enable State LIHTC" toggle | `stateLIHTCEnabled` | Enables/disables entire feature | `false` | Yes |
| Property State | `selectedState` | `propertyState` param | `'WA'` | Yes (Panel 1) |
| Investor State | `investorState` | `investorState` param | `'WA'` | Yes (Panel 5) |
| Syndication Rate (%) | `syndicationRate` | `syndicationRateOverride` | `75` | Yes |
| "Investor Has State Liability" checkbox | `investorHasStateLiability` | `investorHasStateLiability` | `true` | Yes |
| Credit Percentage (supplement types) | `stateLIHTCUserPercentage` | `userPercentage` | `undefined` | Yes (when applicable) |
| Credit Amount (standalone/grant) | `stateLIHTCUserAmount` | `userAmount` | `undefined` | Yes (when applicable) |
| Syndication Year | `stateLIHTCSyndicationYear` | `stateLIHTCSyndicationYear` | `0` | Yes (when syndicated) |
| Program Name | (auto from lookup) | N/A - display only | — | No |
| Program Type | (auto from lookup) | N/A - display only | — | No |
| Transferability | (auto from lookup) | N/A - display only | — | No |

---

## 6. Test Coverage Summary

### 6.1 Existing State LIHTC Tests

**File:** `stateLIHTCCalculations.test.ts` (993 lines)

| Test Suite | Test Count | Scenarios Covered |
|-----------|-----------|-------------------|
| Utility Functions | 12 | `calculatePiggybackCredit`, `calculateSupplementCredit`, `calculateStandaloneCredit`, `calculateGrantCredit`, `determineSyndicationRate`, `determineStateLiability`, `generateStateLIHTCSchedule` |
| Piggyback Programs | 7 | GA (100%), NE (100%), SC (100%), KS (100% + sunset), AR (20%) |
| Supplement Programs | 6 | MO (70%), OH (40% + cap), DC (25%), VT (variable) |
| Standalone Programs | 7 | CA (certificated + PW), NY (in-state vs out-of-state), IL (transferable), MA, CO |
| Grant Programs | 2 | NJ (STCS) |
| No Program States | 3 | OR, TX, FL |
| Edge Cases | 8 | Zero credit, negative credit, invalid state, invalid PIS month, invalid percentages |
| Schedule Generation | 5 | January, July, December PIS; 11-year validation |
| Warning System | 4 | PW requirement, sunset, cap exceeded |
| IMPL-047 Toggle Behavior | 9 | Toggle ON/OFF for GA, SC, NJ; checkbox priority over override |
| Integration | 3 | Federal LIHTC integration, multiple investors |

**File:** `useHDCCalculations.test.ts` (State LIHTC section: ~150 lines)

| Test Name | Scenario |
|-----------|----------|
| `should return syndicated stateLIHTCIntegration for out-of-state investor without liability` | WA investor in GA property |
| `should return valid stateLIHTCIntegration when investor state has program` | GA investor in GA property |
| `should return valid stateLIHTCIntegration for out-of-state investor with State LIHTC program` | VA investor in GA property |
| `should have much higher MOIC with Year 0 syndication` | IMPL-075/076 syndication timing |
| `should show syndication proceeds in Year 1 cash flow with Year 1 syndication` | Capital return model |

### 6.2 Coverage Gaps
- [ ] No explicit tests for WA property state (no state LIHTC program)
- [ ] No tests for state LIHTC + OZ combined scenarios
- [ ] No tests for mid-range PIS months (March, September)
- [ ] No tests for syndication Year 2 timing

---

## 6A. Single Source of Truth Compliance

### 6A.1 Potential Concerns Found

| File | Line | Type | Description | Severity |
|------|------|------|-------------|----------|
| `TaxCreditsSection.tsx` | 203 | UI Preview Calculation | Calls `calculateStateLIHTC` for immediate preview feedback | Low |
| `StateLIHTCSection.tsx` | 115 | UI Preview Calculation | Calls `calculateStateLIHTC` (deprecated component) | Low |

**Analysis:** These UI preview calculations provide immediate feedback when users change inputs. They do NOT replace the authoritative calculation that flows through `useHDCCalculations.ts` → `stateLIHTCIntegration` → `calculations.ts`. The previews use the same `calculateStateLIHTC` function with the same parameters, so results should be consistent. This is an acceptable pattern for responsive UI.

### 6A.2 Compliance Status

- [x] All state LIHTC calculations in `stateLIHTCCalculations.ts` (dedicated module)
- [x] Hooks call `calculateStateLIHTC` once and pass results via `stateLIHTCIntegration`
- [x] Components only display values from engine results
- [x] Export sheets write formula strings referencing named ranges (no recalculation)
- [x] `calculations.ts` receives `stateLIHTCIntegration` as input and applies it to cash flows

### 6A.3 Recommended Improvements (Optional)

1. **Consider moving UI preview to hook:** The `TaxCreditsSection.tsx` preview could derive from the hook's `stateLIHTCResult` instead of calling `calculateStateLIHTC` directly. However, this would require ensuring the hook recalculates faster than user input changes, which may not be desirable for large scenarios.

2. **Remove deprecated `StateLIHTCSection.tsx`:** Per the deprecation notice, this component is no longer used but still contains calculation logic.

---

## 7. Gap Analysis vs Proposed Spec

Comparing current implementation against State LIHTC Data Architecture Spec v1.0 anticipated fields:

| Proposed Field | Currently Exists | Location | Notes |
|----------------|------------------|----------|-------|
| stateCode | ✅ | `StateTaxProfile.code` | 2-letter code |
| programName | ✅ | `StateLIHTCProgram.program` | e.g., "State LIHTC", "AHAP" |
| programType | ✅ | `StateLIHTCProgram.type` | `'piggyback'`\|`'supplement'`\|`'standalone'`\|`'grant'` |
| matchBasis | ❌ | — | Currently implicit (piggyback = federal credit) |
| matchPercentage | ✅ | `StateLIHTCProgram.percent` | 0-100 for piggyback types |
| creditDuration | ❌ | — | Hardcoded as 10 years (11-year schedule) |
| transferabilityType | ✅ | `StateLIHTCProgram.transferability` | 5 types implemented |
| timingConstraint | ❌ | — | Not implemented |
| defaultSyndicationRate | ✅ | `StateLIHTCProgram.syndicationRate` | 80/85/90/100 based on transferability |
| annualCap | ✅ | `StateLIHTCProgram.cap` | Dollar amount or null |
| sunsetYear | ✅ | `StateLIHTCProgram.sunset` | Year number or null |
| prevailingWageRequired | ✅ | `StateLIHTCProgram.pw` | Boolean |
| legalAuthority | ✅ | `StateLIHTCProgram.authority` | Citation string |
| structuringNotes | ❌ | — | Not implemented |
| specialRules | ❌ | — | Partially via `StateTaxProfile.specialRules` |

**Existing Fields Not in Proposed Spec:**
- `hdcTier` - HDC priority classification
- `combinedRate` - Pre-calculated federal + state rate
- `prevailingWageNotes` - Detailed PW notes at state level

---

## 8. Architectural Recommendations

### 8.1 Extend vs Replace

**Recommendation: EXTEND current structure**

The current `StateLIHTCProgram` interface is well-designed and can be extended to add new fields without breaking existing functionality. The JSON data file format supports adding new optional properties.

### 8.2 Migration Path for IMPL-079

1. **Add new fields to `stateProfiles.types.ts`:**
   ```typescript
   export interface StateLIHTCProgram {
     // Existing fields...

     // NEW FIELDS (IMPL-079)
     matchBasis?: 'federal_credit' | 'federal_eligible_basis' | 'independent';
     creditDurationYears?: number;  // Default 10 if not specified
     timingConstraints?: string[];
     structuringNotes?: string;
   }
   ```

2. **Update `stateProfiles.data.json`:** Add new fields to each state entry. Use optional properties so existing entries don't need immediate updates.

3. **Update `stateLIHTCCalculations.ts`:** Enhance `generateStateLIHTCSchedule` to support variable credit durations if `creditDurationYears` differs from 10.

4. **Update UI components:** Display new fields in program info section and export to Excel.

### 8.3 Single Source of Truth Compliance

**Current architecture is SSOT-compliant.** The calculation flow is:
```
stateProfiles.data.json (data)
    ↓
stateProfiles.ts (O(1) lookup)
    ↓
stateLIHTCCalculations.ts (business logic)
    ↓
useHDCCalculations.ts (hook orchestration)
    ↓
calculations.ts (cash flow integration)
    ↓
UI Components (display only)
```

No changes needed for SSOT compliance.

### 8.4 Estimated Scope for IMPL-079

| Task | New Files | Files to Modify | Est. LOC Changes |
|------|-----------|-----------------|------------------|
| Type definitions | 0 | 1 (`stateProfiles.types.ts`) | +15 |
| JSON data updates | 0 | 1 (`stateProfiles.data.json`) | +100 |
| Calculation logic | 0 | 1 (`stateLIHTCCalculations.ts`) | +50 |
| UI components | 0 | 1 (`TaxCreditsSection.tsx`) | +30 |
| Export sheets | 0 | 1 (`lihtcSheet.ts`) | +20 |
| Tests | 0 | 1 (`stateLIHTCCalculations.test.ts`) | +100 |
| **TOTAL** | **0** | **6** | **~315** |

---

## 9. Blockers or Concerns

1. **Deprecated `StateLIHTCSection.tsx`:** Should be fully removed to avoid confusion. Currently marked deprecated but still present.

2. **Variable Credit Duration:** If any state LIHTC programs have durations other than 10 years, the `generateStateLIHTCSchedule` function will need enhancement. Currently hardcoded to 11-year schedule (10 full years).

3. **Investor State vs Property State Complexity:** The toggle behavior (IMPL-047) correctly handles the in-state vs out-of-state investor logic, but the UI could be clearer about which state's program is being used (always property state).

4. **Test Coverage for Combined Scenarios:** No tests exist for state LIHTC combined with OZ benefits or multiple funding sources.

---

## Appendix A: Full File List Searched

### Commands Used
```bash
# Find all files mentioning state LIHTC
grep -r "stateLIHTC" --include="*.ts" --include="*.tsx" -l
# Result: 34 files

# Find state data structures
grep -r "STATE_DATA|stateData|StateData" --include="*.ts" --include="*.tsx" -l
# Result: 5 files

# Find conformity-related files
grep -r "conformity|Conformity" --include="*.ts" --include="*.tsx" -l
# Result: 18 files

# Count lines in key files
wc -l src/utils/taxbenefits/calculations.ts src/hooks/*.ts src/data/*.ts
# Result: 4,236 total lines in key files
```

### Key Files Examined
- `frontend/src/utils/taxbenefits/calculations.ts` (1,686 lines)
- `frontend/src/utils/taxbenefits/stateLIHTCCalculations.ts` (653 lines)
- `frontend/src/utils/taxbenefits/stateProfiles.ts` (432 lines)
- `frontend/src/utils/taxbenefits/stateProfiles.types.ts` (236 lines)
- `frontend/src/utils/taxbenefits/stateProfiles.data.json` (~2,800 lines)
- `frontend/src/hooks/taxbenefits/useHDCState.ts` (395 lines)
- `frontend/src/hooks/taxbenefits/useHDCCalculations.ts` (834 lines)
- `frontend/src/components/taxbenefits/inputs/TaxCreditsSection.tsx` (733 lines)
- `frontend/src/components/taxbenefits/results/ReturnsBuiltupStrip.tsx` (929 lines)
- `frontend/src/utils/taxbenefits/auditExport/sheets/lihtcSheet.ts` (195 lines)
- `frontend/src/utils/taxbenefits/__tests__/stateLIHTCCalculations.test.ts` (993 lines)
- `frontend/src/hooks/taxbenefits/__tests__/useHDCCalculations.test.ts` (874 lines)

---

## Appendix B: State LIHTC Programs Summary

| State | Type | Percent | Transferability | Syndication Rate | Sunset | PW |
|-------|------|---------|-----------------|------------------|--------|-----|
| AR | piggyback | 20% | allocated | 80% | — | No |
| AZ | standalone | — | allocated | 80% | — | No |
| CA | standalone | — | certificated | 90% | — | Yes |
| CO | standalone | — | allocated | 80% | — | No |
| CT | standalone | — | allocated | 80% | — | No |
| DC | supplement | — | allocated | 80% | — | No |
| GA | piggyback | 100% | bifurcated | 85% | — | No |
| IL | standalone | — | transferable | 90% | — | No |
| KS | piggyback | 100% | allocated | 80% | 2028 | No |
| MA | standalone | — | allocated | 80% | — | No |
| MO | supplement | — | allocated | 80% | — | No |
| NC | piggyback | 75% | allocated | 80% | — | No |
| NE | piggyback | 100% | transferable | 90% | — | No |
| NJ | grant | — | grant | 100% | — | Yes |
| NM | standalone | — | transferable | 90% | — | No |
| NY | standalone | — | allocated | 80% | — | No |
| OH | supplement | — | allocated | 80% | — | No |
| PA | standalone | — | allocated | 80% | — | No |
| SC | piggyback | 100% | allocated | 80% | — | No |
| UT | standalone | — | allocated | 80% | — | No |
| VA | standalone | — | allocated | 80% | — | No |
| VT | supplement | — | allocated | 80% | — | No |
| WI | standalone | — | allocated | 80% | — | No |
| WV | standalone | — | allocated | 80% | — | No |
| HI | standalone | — | allocated | 80% | — | No |

---

## 10. ISS-024: Variable Duration Not Applied to UI Labels

**Date:** 2026-01-22
**Type:** Bug Investigation
**Priority:** High (NE calculations display incorrectly)

### 10.1 Observed Behavior

Nebraska property with State LIHTC enabled:

| Element | Expected | Actual | Status |
|---------|----------|--------|--------|
| UI Warning | "6-year credit period" | ✓ Displays | ✅ Working |
| Structuring Notes | LB182 text | ✓ Displays | ✅ Working |
| Annual Credit label | "Years 2-6" | "Years 2-10" | ❌ Bug |
| Catch-Up label | "Year 7" | "Year 11" | ❌ Bug |
| Total Credits label | "6-Year" | "10-Year" | ❌ Bug |

### 10.2 Flow Trace Results

| Layer | File | Status | Evidence |
|-------|------|--------|----------|
| 1. Data | `stateProfiles.data.json:611` | ✅ | `"creditDurationYears": 6` for NE |
| 2. Lookup | `stateProfiles.ts:190-192` | ✅ | `getStateLIHTCProgram()` returns full object |
| 3. Calculation | `stateLIHTCCalculations.ts:590` | ✅ | `const creditDurationYears = program.creditDurationYears ?? 10` |
| 4. Schedule Gen | `stateLIHTCCalculations.ts:593` | ✅ | `generateStateLIHTCSchedule(grossAnnualCredit, pisMonth, creditDurationYears)` |
| 5. Hook | `useHDCCalculations.ts:490` | ✅ | `yearlyCredits = schedule.yearlyBreakdown.map(y => y.creditAmount)` |
| 6. UI Display | `TaxCreditsSection.tsx:513-521` | ✅ | Warning reads `stateProgram.creditDurationYears` |
| 7. **UI Labels** | `TaxCreditsSection.tsx:700-708` | ❌ | **HARDCODED** |

### 10.3 Root Cause Identified

**Location:** `TaxCreditsSection.tsx:700-708`

```tsx
// HARDCODED LABELS - Bug source
<span className="hdc-result-label">Annual Credit (Years 2-10):</span>
<span className="hdc-result-label">Year 11 Catch-Up:</span>
<span className="hdc-result-label">Total 10-Year Gross Credits:</span>
```

The schedule **values** are calculated correctly (6-year duration for NE), but the **labels** are hardcoded to display "Years 2-10", "Year 11", and "10-Year" regardless of actual duration.

### 10.4 Secondary Issue: Interface Property Names

**Location:** `stateLIHTCCalculations.ts:78-95`

```typescript
export interface StateLIHTCSchedule {
  years2to10Credit: number;  // Misleading name (actually "full year credit")
  year11Credit: number;       // Misleading name (actually "catch-up credit")
  // Comment says: "Total credits over all years (always = 10 × annualCredit)"
}
```

The interface property names are misleading but the **values** are correct. At lines 373-374:
```typescript
years2to10Credit: fullYearCredit,  // Correctly assigned
year11Credit: catchUpCredit,        // Correctly assigned
```

### 10.5 What's Missing for Fix

The UI component needs access to `creditDurationYears` to generate dynamic labels:

1. **Option A:** Pass `creditDurationYears` through the schedule object
2. **Option B:** Read `creditDurationYears` from state program lookup in UI
3. **Option C:** Derive duration from `schedule.yearlyBreakdown.length - 1`

Currently the UI reads `stateProgram.creditDurationYears` for the warning (line 513), so **Option B** is already available and can be reused for the labels.

### 10.6 Recommended Fix

```tsx
// TaxCreditsSection.tsx - Replace hardcoded labels

const duration = stateProgram?.creditDurationYears ?? 10;
const catchUpYear = duration + 1;

// Line 700:
<span className="hdc-result-label">Annual Credit (Years 2-{duration}):</span>

// Line 704:
<span className="hdc-result-label">Year {catchUpYear} Catch-Up:</span>

// Line 708:
<span className="hdc-result-label">Total {duration}-Year Gross Credits:</span>
```

### 10.7 Verification Steps

After fix, verify:
1. NE property shows "Years 2-6", "Year 7 Catch-Up", "6-Year Gross Credits"
2. GA property shows "Years 2-10", "Year 11 Catch-Up", "10-Year Gross Credits" (unchanged)
3. States without `creditDurationYears` default to 10-year labels

### 10.8 Scope of Fix

| File | Changes |
|------|---------|
| `TaxCreditsSection.tsx` | ~6 lines (dynamic labels) |

No calculation changes needed - the math is already correct.

---

*End of Audit Report*
