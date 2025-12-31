# IMPL-7.0-002: Data Volume Analysis
**Review of ADDENDUM-V7.0.MD**
**Date**: 2025-01-15
**Status**: Architecture Decision

---

## Executive Summary

After reviewing `/docs/domain-spec/ADDENDUM-V7.0.MD`, this document analyzes the data volume and provides an **updated architecture recommendation** for state profile lookup implementation.

---

## 1. Data Volume Analysis

### 1.1 Jurisdiction Count

From ADDENDUM-V7.0.MD Part 1:

| Category | Count | Details |
|----------|-------|---------|
| **Full OZ Conformity States** | 31 | AL, AZ, AR, CO, CT, DE, DC, GA, ID, IL, IN, IA, KS, KY, LA, MD, MN, MO, MT, NE, NJ, NM, ND, OH, OK, OR, PA, RI, SC, UT, WV |
| **No/Limited OZ Conformity** | 12 | CA, HI, MA, MI, MS, NH, NY, NC, TN, VT, VA, WI |
| **No Capital Gains Tax** | 8 | AK, FL, NV, SD, TX, WA, WY |
| **Total Jurisdictions** | **56** | 50 states + DC + 5 territories (PR, VI, GU, MP, AS) |

**Actual Total: 56 jurisdictions** (confirmed in document title)

### 1.2 Fields Per Jurisdiction

#### Core Tax Fields (from Part 1.3):
1. `code` - State abbreviation (e.g., 'NY')
2. `name` - Full name (e.g., 'New York')
3. `topRate` - Top marginal rate (e.g., 10.9%)
4. `ozConformity` - Type: full-rolling, full-adopted, limited, none, no-cg-tax, special
5. `bonusDepreciation` - Percentage: 0%, 100%, or partial
6. `ozAuthority` - Legal citation (e.g., 'N.Y. Tax Law §612')

#### State LIHTC Fields (from Part 3):
7. `stateLIHTCProgram` - Program name or null
8. `stateLIHTCType` - piggyback, supplement, standalone, grant, or null
9. `stateLIHTCPercent` - Percentage of federal (e.g., 100% for GA)
10. `stateLIHTCTransferability` - certificated, transferable, bifurcated, allocated, grant
11. `stateLIHTCSyndicationRate` - 80%, 85%, 90%, or 100%
12. `stateLIHTCCap` - Annual cap or null
13. `stateLIHTCSunset` - Expiration year or null
14. `stateLIHTCPW` - Prevailing wage required (boolean)
15. `stateLIHTCAuthority` - Legal citation

#### Priority/Tier Fields (from Part 2.1):
16. `hdcTier` - 1, 2, 3, or null
17. `combinedRate` - Pre-calculated total credits %

#### Special Rules/Notes:
18. `niitApplies` - Net Investment Income Tax applies (boolean)
19. `specialRules` - Text notes (e.g., "In-state OZ only")
20. `prevailingWageNotes` - State PW requirements
21. `acquisitionStrategy` - Pre-TCO notes (for CA, NJ)

#### Metadata:
22. `lastUpdated` - ISO date
23. `taxYear` - 2024, 2025, etc.
24. `sourceUrl` - Reference URL

### 1.3 Total Data Points

**Calculation:**
- **56 jurisdictions** × **~24 fields** = **~1,344 data points**

**Breakdown by Category:**
- Core tax data: 56 × 6 = 336 points
- State LIHTC data: 25 states × 9 fields = 225 points
- Special rules: 56 × 5 fields = 280 points
- Metadata: 56 × 3 fields = 168 points
- Priority/tier: 11 states × 2 fields = 22 points

**Approximate Total: 1,031-1,344 data points** (depending on null fields)

### 1.4 Data Complexity Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Jurisdictions** | 56 | Moderate |
| **Fields per jurisdiction** | 20-24 | Moderate-High |
| **Total data points** | ~1,200 | **Moderate** |
| **Nested structures** | 3 (LIHTC, PW, tiers) | Low-Moderate |
| **Conditional logic** | High (OZ + LIHTC + PW) | Complex |
| **Update frequency** | 1-2x/year | Low |
| **Data volatility** | Low (except new programs) | Stable |

---

## 2. Architecture Comparison

### 2.1 Option A: Hardcoded TypeScript Object

**Example Structure:**
```typescript
export const STATE_TAX_PROFILES: Record<string, StateTaxProfile> = {
  'NY': {
    code: 'NY',
    name: 'New York',
    type: 'state',
    topRate: 10.9,
    ozConformity: 'none',
    bonusDepreciation: 0,
    ozAuthority: 'N.Y. Tax Law §612',
    niitApplies: true,
    stateLIHTC: null,
    hdcTier: null,
    specialRules: 'Decoupled from federal OZ 2021',
    lastUpdated: '2025-01-15',
    taxYear: 2024,
  },
  'GA': {
    code: 'GA',
    name: 'Georgia',
    type: 'state',
    topRate: 5.75,
    ozConformity: 'full-adopted',
    bonusDepreciation: 0,
    ozAuthority: 'O.C.G.A. §48-1-2',
    niitApplies: true,
    stateLIHTC: {
      program: 'State LIHTC',
      type: 'piggyback',
      percent: 100,
      transferability: 'bifurcated',
      syndicationRate: 85,
      cap: null,
      sunset: null,
      pw: false,
      authority: 'O.C.G.A. §33-1-18',
    },
    hdcTier: 1,
    combinedRate: 46.6,
    specialRules: null,
    lastUpdated: '2025-01-15',
    taxYear: 2024,
  },
  // ... 54 more jurisdictions
};
```

**Size Estimate:**
- ~50-100 lines per jurisdiction (with nested LIHTC data)
- **56 jurisdictions × 75 avg lines = ~4,200 lines**
- **File size: ~200-250 KB**

**Pros:**
- Zero latency
- Type-safe at compile time
- Easy to search/grep in IDE
- Version controlled with code
- No runtime parsing overhead

**Cons:**
- **Large single file** (4,200 lines)
- Harder to visualize as table
- More verbose than JSON
- Requires TypeScript recompile to update

### 2.2 Option B: External JSON File

**Example Structure:**
```json
{
  "NY": {
    "code": "NY",
    "name": "New York",
    "type": "state",
    "topRate": 10.9,
    "ozConformity": "none",
    "bonusDepreciation": 0,
    "ozAuthority": "N.Y. Tax Law §612",
    "niitApplies": true,
    "stateLIHTC": null,
    "hdcTier": null,
    "specialRules": "Decoupled from federal OZ 2021",
    "lastUpdated": "2025-01-15",
    "taxYear": 2024
  },
  "GA": {
    "code": "GA",
    "name": "Georgia",
    "type": "state",
    "topRate": 5.75,
    "ozConformity": "full-adopted",
    "bonusDepreciation": 0,
    "ozAuthority": "O.C.G.A. §48-1-2",
    "niitApplies": true,
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
    "combinedRate": 46.6,
    "specialRules": null,
    "lastUpdated": "2025-01-15",
    "taxYear": 2024
  }
}
```

**Size Estimate:**
- **~2,500-3,000 lines** (more compact than TS)
- **File size: ~150-200 KB**

**Pros:**
- **Easier to read/edit** (more tabular)
- Can be edited without recompile
- Smaller file size than TypeScript
- Could be loaded from CDN/backend later
- Standard data format

**Cons:**
- No type safety at author time
- Requires runtime JSON.parse()
- Need to validate schema at load
- Less IDE autocomplete support
- Import overhead (~1-2ms)

### 2.3 Option C: Hybrid (TS + JSON)

**Structure:**
```
/src/utils/HDCCalculator/
  ├── stateProfiles.ts          # Interface, types, utilities
  ├── stateProfilesData.json    # Raw data only
  └── stateProfilesLoader.ts    # Validation & loading
```

**Pros:**
- Type-safe interfaces in TS
- Clean data separation
- Easy to update data without touching code
- Validates at load time

**Cons:**
- More files to maintain
- Slightly more complex setup

---

## 3. Performance Analysis

### 3.1 Load Time Comparison

| Option | Parse Time | Type Check | Total Overhead |
|--------|------------|------------|----------------|
| **TS Object** | 0ms (compiled) | 0ms (compile-time) | **0ms** |
| **JSON Import** | ~1-2ms | Runtime validation ~1ms | **2-3ms** |
| **Backend API** | 50-200ms | Runtime validation ~1ms | **51-201ms** |

**Verdict:** For ~200 KB data, JSON import adds negligible overhead (2-3ms).

### 3.2 Memory Footprint

| Option | Memory Usage |
|--------|--------------|
| **TS Object** | ~250 KB (in JS bundle) |
| **JSON Import** | ~200 KB (separate chunk) + ~250 KB (parsed object) = **~450 KB** |
| **Backend API** | ~250 KB (parsed) + HTTP overhead |

**Verdict:** TS object is most memory-efficient (no duplication).

---

## 4. Updated Recommendation

### 4.1 Decision Matrix

| Factor | Weight | TS Object | JSON Import | Backend API |
|--------|--------|-----------|-------------|-------------|
| **Developer Experience** | High | ✅ Excellent | ⚠️ Good | ❌ Complex |
| **Type Safety** | High | ✅ Compile-time | ⚠️ Runtime | ⚠️ Runtime |
| **Update Frequency** | Medium | ⚠️ Needs redeploy | ⚠️ Needs redeploy | ✅ Live updates |
| **Performance** | High | ✅ Zero latency | ✅ ~2ms | ❌ ~100ms |
| **Maintainability** | High | ⚠️ Large file | ✅ Clean data | ❌ Backend complexity |
| **Readability** | Medium | ⚠️ Verbose | ✅ Tabular | N/A |
| **Searchability** | Medium | ✅ IDE grep | ✅ IDE grep | ❌ DB query |
| **Version Control** | High | ✅ Git diffs | ✅ Git diffs | ⚠️ DB migration |

### 4.2 Final Recommendation

**✅ Recommended: Option B (External JSON File)**

**Rationale:**

1. **Data Volume Justifies Separation**: ~1,200 data points across 56 jurisdictions is substantial enough to warrant JSON format
2. **Maintainability**: JSON is easier to read/edit/validate than 4,200 lines of TypeScript
3. **Performance Acceptable**: 2-3ms load overhead is negligible for calculator use case
4. **Future-Proof**: Can migrate to backend API later without changing import code
5. **Best Practices**: Large static datasets typically belong in JSON, not TS objects

**Why Not TypeScript Object?**
- 4,200 lines is too large for comfortable editing
- More verbose than necessary for pure data
- Harder to review in diffs

**Why Not Backend API?**
- Update frequency (1-2x/year) doesn't justify API complexity
- Performance hit not worth it for static data
- Adds backend maintenance burden

### 4.3 Implementation Approach

**Structure:**
```
/src/utils/HDCCalculator/
  ├── stateProfiles.types.ts          # TypeScript interfaces
  ├── stateProfiles.data.json         # 56 jurisdiction data
  ├── stateProfiles.ts                # Loader + utilities
  └── __tests__/
      └── stateProfiles.test.ts       # Validation tests
```

**1. Type Definitions** (`stateProfiles.types.ts`):
```typescript
export type OzConformity = 'full-rolling' | 'full-adopted' | 'limited' | 'none' | 'no-cg-tax' | 'special';
export type StateLIHTCType = 'piggyback' | 'supplement' | 'standalone' | 'grant' | null;
export type Transferability = 'certificated' | 'transferable' | 'bifurcated' | 'allocated' | 'grant';

export interface StateLIHTCProgram {
  program: string;
  type: StateLIHTCType;
  percent: number;                    // 0-100
  transferability: Transferability;
  syndicationRate: number;            // 70-100
  cap?: number | null;                // Annual cap in dollars
  sunset?: number | null;             // Year of expiration
  pw: boolean;                        // Prevailing wage required
  authority: string;                  // Legal citation
}

export interface StateTaxProfile {
  // Identification
  code: string;
  name: string;
  type: 'state' | 'territory' | 'district';

  // Tax Rates
  topRate: number;
  ozConformity: OzConformity;
  bonusDepreciation: number;          // 0, 100, or partial
  ozAuthority: string;

  // Special Rules
  niitApplies: boolean;
  specialRules?: string | null;

  // State LIHTC
  stateLIHTC?: StateLIHTCProgram | null;

  // HDC Priority
  hdcTier?: 1 | 2 | 3 | null;
  combinedRate?: number | null;
  prevailingWageNotes?: string | null;

  // Metadata
  lastUpdated: string;                // ISO date
  taxYear: number;
  sourceUrl?: string | null;
}

export type StateTaxProfileMap = Record<string, StateTaxProfile>;
```

**2. Data File** (`stateProfiles.data.json`):
```json
{
  "metadata": {
    "version": "7.0",
    "lastUpdated": "2025-12-13",
    "source": "ADDENDUM-V7.0.MD",
    "jurisdictionCount": 56
  },
  "profiles": {
    "NY": { ... },
    "GA": { ... },
    // ... 54 more
  }
}
```

**3. Loader** (`stateProfiles.ts`):
```typescript
import stateProfilesJson from './stateProfiles.data.json';
import type { StateTaxProfile, StateTaxProfileMap } from './stateProfiles.types';

// Load and validate
const STATE_TAX_PROFILES: StateTaxProfileMap = stateProfilesJson.profiles as StateTaxProfileMap;

// Utility functions
export const getStateTaxProfile = (code: string): StateTaxProfile | undefined => {
  return STATE_TAX_PROFILES[code];
};

export const getStateTaxRate = (code: string): number => {
  return STATE_TAX_PROFILES[code]?.topRate ?? 0;
};

export const getStateOzConformity = (code: string): OzConformity | null => {
  return STATE_TAX_PROFILES[code]?.ozConformity ?? null;
};

export const hasStateLIHTC = (code: string): boolean => {
  return STATE_TAX_PROFILES[code]?.stateLIHTC !== null;
};

export const getStateLIHTCProgram = (code: string): StateLIHTCProgram | null => {
  return STATE_TAX_PROFILES[code]?.stateLIHTC ?? null;
};

export const getStatesByOzStatus = (status: OzConformity): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.ozConformity === status);
};

export const getStatesByHDCTier = (tier: 1 | 2 | 3): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.hdcTier === tier);
};

export const getStatesWithStateLIHTC = (): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.stateLIHTC !== null);
};

// Export for direct access
export { STATE_TAX_PROFILES };
export default STATE_TAX_PROFILES;
```

**4. Validation Tests** (`__tests__/stateProfiles.test.ts`):
```typescript
import { STATE_TAX_PROFILES, getStateTaxProfile } from '../stateProfiles';

describe('State Tax Profiles', () => {
  it('should have 56 jurisdictions', () => {
    expect(Object.keys(STATE_TAX_PROFILES).length).toBe(56);
  });

  it('should have valid New York data', () => {
    const ny = getStateTaxProfile('NY');
    expect(ny).toBeDefined();
    expect(ny?.topRate).toBe(10.9);
    expect(ny?.ozConformity).toBe('none');
  });

  it('should have Georgia with state LIHTC', () => {
    const ga = getStateTaxProfile('GA');
    expect(ga?.stateLIHTC).toBeDefined();
    expect(ga?.stateLIHTC?.percent).toBe(100);
    expect(ga?.stateLIHTC?.syndicationRate).toBe(85);
  });

  it('should have Oregon with 100% bonus depreciation', () => {
    const or = getStateTaxProfile('OR');
    expect(or?.bonusDepreciation).toBe(100);
  });

  it('should have 25 states with state LIHTC', () => {
    const withLIHTC = Object.values(STATE_TAX_PROFILES).filter(s => s.stateLIHTC !== null);
    expect(withLIHTC.length).toBe(25);
  });
});
```

---

## 5. Migration Path

### Phase 1: Create JSON Data File (Week 1)
- [ ] Extract all 56 jurisdictions from ADDENDUM-V7.0.MD
- [ ] Create `stateProfiles.data.json` with complete data
- [ ] Validate against spec (all fields present)

### Phase 2: Create TypeScript Wrapper (Week 1)
- [ ] Define types in `stateProfiles.types.ts`
- [ ] Create loader in `stateProfiles.ts`
- [ ] Write validation tests
- [ ] Document usage in JSDoc

### Phase 3: Migrate Components (Week 2)
- [ ] Update components importing `stateData.ts`
- [ ] Update components importing `hdcOzStrategy.ts`
- [ ] Ensure backward compatibility
- [ ] Run full test suite

### Phase 4: Deprecate Old Files (Week 3)
- [ ] Mark old files as deprecated
- [ ] Create migration guide
- [ ] Remove old files in separate PR

---

## 6. Conclusion

**Updated Recommendation: External JSON File**

**Data Volume Analysis:**
- **56 jurisdictions** × **~24 fields** = **~1,200 data points**
- **File size: ~200 KB JSON** vs. ~250 KB TypeScript
- **Complexity: Moderate** (nested LIHTC data, conditional logic)

**Why JSON Wins:**
- ✅ **Maintainability**: 2,500 lines of clean JSON > 4,200 lines of verbose TS
- ✅ **Readability**: Tabular format easier to review/edit
- ✅ **Performance**: 2-3ms load time is negligible
- ✅ **Future-proof**: Can migrate to backend API without code changes
- ✅ **Best Practice**: Standard approach for large static datasets

**Implementation:**
- Store data in `/src/utils/HDCCalculator/stateProfiles.data.json`
- Provide TypeScript interfaces for type safety
- Wrap with utility functions for O(1) lookups
- Validate with comprehensive test suite

**Next Step:**
Proceed with JSON-based implementation as outlined in Section 4.3.

---

*End of Data Volume Analysis*
