# IMPL-7.0-002: Pattern Discovery Report
**State Profile Lookup Implementation**
**Date**: 2025-01-15
**Status**: Discovery Complete - Ready for Implementation

## Executive Summary

This document analyzes existing data fetching patterns in the HDC MAP codebase to inform the implementation of state profile lookup functionality for IMPL-7.0-002.

---

## 1. Investor Tax Profiles - Reference Implementation

### 1.1 File Locations

**Core Files:**
- **Interface/Type**: `hdc-map-frontend/src/types/investorTaxInfo.ts`
- **API Service**: `hdc-map-frontend/src/services/api.ts` (lines 164-198)
- **UI Component**: `hdc-map-frontend/src/components/investor-portal/InvestorTaxProfile/InvestorTaxProfilePage.tsx`
- **Read-Only Display**: `hdc-map-frontend/src/components/investor-portal/InvestorTaxProfile/ReadOnlyTaxDisplay.tsx`

### 1.2 Data Structure

```typescript
// From InvestorTaxProfilePage.tsx:91-106 (actual usage shows structure)
interface InvestorTaxInfo {
  id?: number;
  userId?: number;
  annualIncome?: number;
  filingStatus?: 'single' | 'married';
  federalOrdinaryRate: number;
  stateOrdinaryRate: number;
  federalCapitalGainsRate: number;
  stateCapitalGainsRate: number;
  selectedState: string;
  investorTrack: 'rep' | 'non-rep';
  passiveGainType: 'short-term' | 'long-term';
  repStatus: boolean;
  ozType: 'standard' | 'rural';
  deferredCapitalGains: number;
  capitalGainsTaxRate: number;
  isDefault: boolean;
  profileName?: string;
  projectLocation?: string;
}
```

**Key Characteristics:**
- User-owned data (one-to-many relationship with users)
- Multiple profiles per user with default selection
- Stored in database (backend persistence)
- Rich metadata for tax calculations

### 1.3 Fetch Mechanism

**API Endpoints** (`services/api.ts:164-198`):
```typescript
export const investorTaxInfoService = {
  // Fetch all profiles for current user
  getUserTaxInfo: async (): Promise<InvestorTaxInfo[]> => {
    const response = await api.get<InvestorTaxInfo[]>('/investor/tax-info');
    return response.data;
  },

  // Fetch single profile by ID
  getTaxInfo: async (id: number): Promise<InvestorTaxInfo> => {
    const response = await api.get<InvestorTaxInfo>(`/investor/tax-info/${id}`);
    return response.data;
  },

  // Fetch default profile
  getDefaultTaxInfo: async (): Promise<InvestorTaxInfo> => {
    const response = await api.get<InvestorTaxInfo>('/investor/tax-info/default');
    return response.data;
  },

  // CRUD operations
  saveTaxInfo: async (taxInfo: InvestorTaxInfo): Promise<InvestorTaxInfo> => { ... },
  updateTaxInfo: async (id: number, taxInfo: InvestorTaxInfo): Promise<InvestorTaxInfo> => { ... },
  setAsDefault: async (id: number): Promise<void> => { ... },
  deleteTaxInfo: async (id: number): Promise<void> => { ... },
};
```

**Fetch Pattern**:
- **REST API calls** using axios
- **JWT authentication** via interceptor (`api.ts:14-20`)
- **Error handling** with 401/403 auto-logout (`api.ts:22-32`)

### 1.4 Caching Approach

**Component-Level State** (`InvestorTaxProfilePage.tsx:88-106`):
```typescript
const [loading, setLoading] = useState(true);
const [profiles, setProfiles] = useState<InvestorTaxInfo[]>([]);
const [currentProfile, setCurrentProfile] = useState<InvestorTaxInfo>({ ... });

useEffect(() => {
  loadProfiles();
}, []);

const loadProfiles = async () => {
  try {
    setLoading(true);
    const data = await investorTaxInfoService.getUserTaxInfo();

    // Sort: default first, then by other criteria
    const sortedData = [...data].sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      return 0;
    });

    setProfiles(sortedData);

    // Auto-select default or first profile
    const defaultProfile = data.find(p => p.isDefault);
    if (defaultProfile) {
      setCurrentProfile(defaultProfile);
    } else if (data.length > 0) {
      setCurrentProfile(data[0]);
    }
  } catch (error) {
    console.error('Error loading tax profiles:', error);
  } finally {
    setLoading(false);
  }
};
```

**Caching Strategy:**
- **No persistent cache** (localStorage/sessionStorage)
- **Component state only** - re-fetches on mount
- **Optimistic updates** for UI responsiveness (`InvestorTaxProfilePage.tsx:243-283`)
- **Manual refresh** after mutations (save/update/delete)

### 1.5 Component Consumption

**Pattern 1: Full Editor** (`InvestorTaxProfilePage.tsx`):
- Loads all profiles on mount
- Displays grid of saved profiles
- Provides editor for create/update
- Handles selection, drag-and-drop for default

**Pattern 2: Read-Only Display** (`ReadOnlyTaxDisplay.tsx`):
```typescript
const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);

useEffect(() => {
  loadTaxProfile();
}, []);

const loadTaxProfile = async () => {
  try {
    setLoading(true);
    const profiles = await investorTaxInfoService.getUserTaxInfo();

    // Load default or first available
    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
    setTaxProfile(defaultProfile || null);
  } catch (error) {
    console.error('Error loading tax profile:', error);
  } finally {
    setLoading(false);
  }
};
```

**Pattern 3: Dropdown Selector** (`InvestorAnalysis.tsx:31-64`):
```typescript
const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);
const [allProfiles, setAllProfiles] = useState<InvestorTaxInfo[]>([]);

// Fetch all, auto-select default
const loadInvestorTaxProfile = async () => {
  const profiles = await investorTaxInfoService.getUserTaxInfo();
  if (profiles && profiles.length > 0) {
    setAllProfiles(profiles);
    const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
    setTaxProfile(defaultProfile);
  }
};

// Switch between profiles
const handleProfileChange = (profileId: string) => {
  const selectedProfile = allProfiles.find(p => p.id === Number(profileId));
  if (selectedProfile) {
    setTaxProfile(selectedProfile);
  }
};
```

---

## 2. Investor Portal - Data Fetching Patterns

### 2.1 Available Investments Pattern

**File**: `hdc-map-frontend/src/components/investor-portal/investments/AvailableInvestments.tsx`

**Data Fetching**:
```typescript
const [loading, setLoading] = useState(true);
const [deals, setDeals] = useState<CalculatorConfiguration[]>([]);

useEffect(() => {
  loadDeals();
}, []);

const loadDeals = async () => {
  try {
    setLoading(true);

    // Fetch all configurations from all users
    const allConfigurations = await calculatorService.getAllConfigurations();

    // Filter for complete, investor-facing deals
    const completeDeals = allConfigurations.filter(config =>
      config.completionStatus === 'complete' &&
      config.isInvestorFacing === true
    );

    setDeals(completeDeals);
  } catch (error) {
    console.error('Failed to load investment opportunities:', error);
    setDeals([]);
  } finally {
    setLoading(false);
  }
};
```

**Key Pattern:**
- Fetch all data, filter client-side
- Component-level state caching
- Error handling with empty state fallback

### 2.2 Calculator Service Pattern

**File**: `hdc-map-frontend/src/services/HDCCalculator/calculatorService.ts`

**API Service Structure**:
```typescript
export const calculatorService = {
  // CRUD operations
  saveConfiguration: async (config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.post<CalculatorConfiguration>('/calculator/configurations', config);
    return response.data;
  },

  getConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/calculator/configurations');
    return response.data;
  },

  getAllConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/calculator/configurations/all');
    return response.data;
  },

  getConfiguration: async (id: number): Promise<CalculatorConfiguration> => {
    const response = await api.get<CalculatorConfiguration>(`/calculator/configurations/${id}`);
    return response.data;
  },

  updateConfiguration: async (id: number, config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.put<CalculatorConfiguration>(`/calculator/configurations/${id}`, config);
    return response.data;
  },

  deleteConfiguration: async (id: number): Promise<void> => { ... },
};
```

**Consistent Pattern:**
- Namespace exports (`calculatorService`, `investorTaxInfoService`)
- Async/await with Promise types
- Direct axios response unwrapping (`response.data`)
- Strong TypeScript typing

---

## 3. State/Jurisdiction Data - Current Implementation

### 3.1 Static Data Approach

**Files**:
- `hdc-map-frontend/src/utils/HDCCalculator/stateData.ts`
- `hdc-map-frontend/src/utils/HDCCalculator/hdcOzStrategy.ts`

**Data Structure** (`stateData.ts:11-20`):
```typescript
export interface JurisdictionData {
  name: string;
  rate: number;
  capitalGainsRate?: number;
  tier: 'Prime' | 'Secondary' | 'Standard' | 'NoTax' | 'Territory';
  type: 'state' | 'territory' | 'district';
  ozConformity: 'full' | 'partial' | 'none' | 'special';
  niitApplies: boolean;
  notes?: string;
}

export const ALL_JURISDICTIONS: Record<string, JurisdictionData> = {
  'CA': { name: 'California', rate: 13.3, tier: 'Prime', type: 'state', ozConformity: 'none', niitApplies: true, ... },
  'NY': { name: 'New York', rate: 10.9, tier: 'Prime', type: 'state', ozConformity: 'full', niitApplies: true },
  // ... 50+ states and territories
};
```

**HDC OZ Strategy** (`hdcOzStrategy.ts:11-22`):
```typescript
export interface HDCOzJurisdiction {
  name: string;
  rate: number;
  status: 'GO' | 'GO_IN_STATE' | 'NO_GO';
  tier: 'Exceptional' | 'Prime' | 'Secondary' | 'Conforming' | 'Future Opportunity' | 'Federal Only';
  savings: string;
  savingsRate?: number;
  notes: string;
  special?: 'exceptional' | 'corporate-only' | 'individual-only';
  projectLocationRequired?: boolean;
}

export const HDC_OZ_STRATEGY: Record<string, HDCOzJurisdiction> = {
  'NJ': { name: 'New Jersey', rate: 10.75, status: 'GO', tier: 'Prime', savings: '34%+', savingsRate: 34.55, notes: '...' },
  // ... all jurisdictions
};
```

**Current Usage**:
- **Hardcoded objects** (no API calls)
- **Direct imports** in components
- **O(1) lookups** by jurisdiction code
- **Utilities**:
  - `doesNIITApply(state: string): boolean` - NIIT lookup
  - `getOzBenefits(state: string, projectLocation?: string)` - OZ benefits calculator
  - `CONFORMING_STATES` - filtered subset

**Consumption Example** (`InvestorTaxProfilePage.tsx:143-151`):
```typescript
import { CONFORMING_STATES, doesNIITApply } from '../../../utils/HDCCalculator/stateData';
import { HDC_OZ_STRATEGY, getOzBenefits } from '../../../utils/HDCCalculator/hdcOzStrategy';

// Auto-update rates when state changes
useEffect(() => {
  if (currentProfile.selectedState && CONFORMING_STATES[currentProfile.selectedState]) {
    const stateInfo = CONFORMING_STATES[currentProfile.selectedState];
    setCurrentProfile(prev => ({
      ...prev,
      stateOrdinaryRate: stateInfo.rate,
      stateCapitalGainsRate: stateInfo.rate,
    }));
  }
}, [currentProfile.selectedState]);

// Check NIIT applicability
const niitRate = doesNIITApply(currentProfile.selectedState || '') ? NIIT_RATE : 0;

// Get OZ strategy
const selectedJurisdiction = HDC_OZ_STRATEGY[currentProfile.selectedState || ''];
```

---

## 4. Proposed Approach for IMPL-7.0-002 State Profiles

### 4.1 Should State Profiles be Backend or Frontend?

**Analysis of Current Architecture:**

| Aspect | Investor Tax Profiles | State Data | Recommendation for State Profiles |
|--------|----------------------|------------|----------------------------------|
| **Ownership** | User-specific | Global/static | Global/static |
| **Mutability** | User edits | Admin/code updates | Admin updates only |
| **Data Size** | ~15 fields × N users | ~50 states × ~10 fields | ~50 states × 20+ fields |
| **Update Frequency** | Constant (user actions) | Rare (tax law changes) | Rare (1-2x per year) |
| **Access Pattern** | Authenticated, per-user | Public, lookup by code | Public, lookup by code |
| **Caching Benefit** | Low (personalized) | High (universal) | High (universal) |

**Recommendation**: **Frontend-First Hybrid Approach**

### 4.2 Proposed Implementation Strategy

#### Phase 1: Enhanced Frontend Data (Immediate)

**Structure** (`hdc-map-frontend/src/utils/HDCCalculator/stateProfiles.ts`):
```typescript
export interface StateTaxProfile {
  // Identification
  code: string;                          // 'NY', 'CA', etc.
  name: string;                          // 'New York'
  type: 'state' | 'territory' | 'district';

  // Tax Rates (2024)
  ordinaryIncomeRate: number;            // Top marginal rate
  capitalGainsRate: number;              // Usually same as ordinary
  corporateRate?: number;                // If different from individual

  // OZ Conformity
  ozStatus: 'GO' | 'GO_IN_STATE' | 'NO_GO';
  ozTier: 'Prime' | 'Secondary' | 'Conforming' | 'Federal Only';
  ozConformityType: 'full' | 'partial' | 'none';
  projectLocationRequired: boolean;      // True for GO_IN_STATE

  // Special Rules
  niitApplies: boolean;                  // Always false for territories
  hasAlternativeMinimumTax: boolean;
  hasPassThroughDeduction: boolean;      // 199A or similar

  // Calculator-Specific
  savingsRate?: number;                  // Pre-calculated OZ savings %
  conformityNotes: string;               // Implementation details
  specialRules?: string;                 // Edge cases, exceptions

  // Metadata
  lastUpdated: string;                   // ISO date
  taxYear: number;                       // 2024, 2025, etc.
  sourceUrl?: string;                    // Tax authority reference
}

export const STATE_TAX_PROFILES: Record<string, StateTaxProfile> = {
  'NY': {
    code: 'NY',
    name: 'New York',
    type: 'state',
    ordinaryIncomeRate: 10.9,
    capitalGainsRate: 10.9,
    ozStatus: 'GO',
    ozTier: 'Prime',
    ozConformityType: 'full',
    projectLocationRequired: false,
    niitApplies: true,
    hasAlternativeMinimumTax: false,
    hasPassThroughDeduction: false,
    savingsRate: 34.7,
    conformityNotes: 'Rolling conformity to federal IRC',
    lastUpdated: '2025-01-15',
    taxYear: 2024,
    sourceUrl: 'https://www.tax.ny.gov/...'
  },
  // ... all 50 states + DC + territories
};

// Utility functions
export const getStateTaxProfile = (code: string): StateTaxProfile | undefined => {
  return STATE_TAX_PROFILES[code];
};

export const getStateTaxRate = (code: string): number => {
  return STATE_TAX_PROFILES[code]?.ordinaryIncomeRate ?? 0;
};

export const getStateOzStatus = (code: string): 'GO' | 'GO_IN_STATE' | 'NO_GO' => {
  return STATE_TAX_PROFILES[code]?.ozStatus ?? 'NO_GO';
};

export const doesStateRequireProjectLocation = (code: string): boolean => {
  return STATE_TAX_PROFILES[code]?.projectLocationRequired ?? false;
};

export const getStatesByOzStatus = (status: 'GO' | 'GO_IN_STATE' | 'NO_GO'): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.ozStatus === status);
};
```

**Integration with Existing Code:**
```typescript
// Consolidate existing data sources
import { ALL_JURISDICTIONS } from './stateData';
import { HDC_OZ_STRATEGY } from './hdcOzStrategy';

// Merge into STATE_TAX_PROFILES
export const STATE_TAX_PROFILES: Record<string, StateTaxProfile> = Object.keys(HDC_OZ_STRATEGY).reduce((acc, code) => {
  const ozData = HDC_OZ_STRATEGY[code];
  const jurisdictionData = ALL_JURISDICTIONS[code];

  acc[code] = {
    code,
    name: ozData.name,
    type: jurisdictionData?.type ?? 'state',
    ordinaryIncomeRate: ozData.rate,
    capitalGainsRate: jurisdictionData?.capitalGainsRate ?? ozData.rate,
    ozStatus: ozData.status,
    ozTier: ozData.tier as any,
    ozConformityType: jurisdictionData?.ozConformity ?? 'none',
    projectLocationRequired: ozData.projectLocationRequired ?? false,
    niitApplies: jurisdictionData?.niitApplies ?? true,
    hasAlternativeMinimumTax: false,
    hasPassThroughDeduction: false,
    savingsRate: ozData.savingsRate,
    conformityNotes: ozData.notes,
    lastUpdated: '2025-01-15',
    taxYear: 2024,
  };

  return acc;
}, {} as Record<string, StateTaxProfile>);
```

#### Phase 2: Optional Backend API (Future Enhancement)

**Backend Endpoint** (if needed for admin editing):
```typescript
// hdc-map-backend API
GET    /api/public/state-profiles           // Get all (no auth required)
GET    /api/public/state-profiles/:code     // Get single state
PUT    /api/admin/state-profiles/:code      // Update (admin only)
POST   /api/admin/state-profiles/bulk       // Bulk update (admin only)
```

**Frontend Service** (only if backend is implemented):
```typescript
// hdc-map-frontend/src/services/api.ts
export const stateTaxProfileService = {
  getAllProfiles: async (): Promise<StateTaxProfile[]> => {
    const response = await api.get<StateTaxProfile[]>('/public/state-profiles');
    return response.data;
  },

  getProfile: async (code: string): Promise<StateTaxProfile> => {
    const response = await api.get<StateTaxProfile>(`/public/state-profiles/${code}`);
    return response.data;
  },
};
```

**Caching Strategy** (if using backend):
```typescript
// hdc-map-frontend/src/utils/HDCCalculator/stateProfileCache.ts
const CACHE_KEY = 'hdc_state_profiles';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: Record<string, StateTaxProfile>;
  timestamp: number;
}

export const loadStateProfiles = async (): Promise<Record<string, StateTaxProfile>> => {
  // Check cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;
    if (age < CACHE_DURATION) {
      console.log('✓ Using cached state profiles');
      return entry.data;
    }
  }

  // Fetch from API
  console.log('⬇️ Fetching state profiles from API');
  const profiles = await stateTaxProfileService.getAllProfiles();
  const profileMap = profiles.reduce((acc, p) => {
    acc[p.code] = p;
    return acc;
  }, {} as Record<string, StateTaxProfile>);

  // Cache result
  const entry: CacheEntry = {
    data: profileMap,
    timestamp: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));

  return profileMap;
};

export const invalidateCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
```

### 4.3 Recommendation Summary

**For IMPL-7.0-002, follow Pattern A (Frontend Static Data):**

✅ **Advantages:**
- Zero latency (no network calls)
- No backend complexity
- O(1) lookups
- Easy to version control with code
- Follows existing `stateData.ts` and `hdcOzStrategy.ts` pattern
- Type-safe at compile time

❌ **Disadvantages:**
- Requires code deploy to update tax rates
- Cannot be edited by non-developers

**Migration Path:**
1. **Now**: Implement enhanced `stateProfiles.ts` with consolidated data
2. **Q1 2025**: Add admin UI for viewing profiles (read-only)
3. **Q2 2025**: (Optional) Add backend API for admin editing if tax law updates become frequent

---

## 5. Implementation Checklist for IMPL-7.0-002

### Step 1: Create Unified State Profiles Module
- [ ] Create `hdc-map-frontend/src/utils/HDCCalculator/stateProfiles.ts`
- [ ] Define `StateTaxProfile` interface with all required fields
- [ ] Migrate data from `stateData.ts` and `hdcOzStrategy.ts`
- [ ] Add utility functions (getStateTaxProfile, getStateOzStatus, etc.)
- [ ] Write unit tests for utility functions

### Step 2: Update Existing Components
- [ ] Replace direct imports of `CONFORMING_STATES` with `getStateTaxProfile()`
- [ ] Replace direct imports of `HDC_OZ_STRATEGY` with `getStateTaxProfile()`
- [ ] Update `InvestorTaxProfilePage.tsx` to use new API
- [ ] Update calculator components to use new API
- [ ] Ensure backward compatibility during transition

### Step 3: Add Documentation
- [ ] Create `STATE_PROFILES_REFERENCE.md` with all state profiles
- [ ] Document update process for tax law changes
- [ ] Add JSDoc comments to all public functions
- [ ] Update CLAUDE.md with new module reference

### Step 4: Deprecate Old Modules (Gradual)
- [ ] Mark `stateData.ts` as deprecated in comments
- [ ] Mark `hdcOzStrategy.ts` as deprecated in comments
- [ ] Create migration guide for other developers
- [ ] Remove old modules after full migration (separate PR)

---

## 6. Conclusion

**Recommended Implementation:**
- **Follow Pattern**: Static frontend data (like current `stateData.ts` / `hdcOzStrategy.ts`)
- **Data Structure**: Enhanced `StateTaxProfile` interface consolidating all tax/OZ data
- **Access Method**: Direct import + utility functions (no API calls)
- **Caching**: Not required (instant access)
- **Future-Proof**: Can add backend API later if needed without breaking changes

**Rationale:**
- State tax data is **global, static, and rarely changes**
- Matches existing architecture patterns
- Zero latency for calculator performance
- Simpler implementation (no backend changes)
- Easy to test and maintain
- Follows principle of "simplest thing that works"

**Next Step:**
Proceed with implementation using frontend static data approach as outlined in Section 4.2 Phase 1.
