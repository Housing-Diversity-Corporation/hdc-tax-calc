# State Profiles Migration Guide
**Version**: 7.0
**Date**: 2025-12-16
**Status**: Complete

---

## Overview

The legacy `stateData.ts` and `hdcOzStrategy.ts` files have been **deprecated** and replaced with a unified `stateProfiles` system that consolidates all state/territory tax data, OZ conformity, and State LIHTC programs into a single, maintainable structure.

---

## What Changed

### Old Architecture (Deprecated)
```
stateData.ts         → Basic tax rates + NIIT
hdcOzStrategy.ts     → OZ conformity + HDC tiers
(Multiple sources)   → State LIHTC data scattered
```

### New Architecture (v7.0)
```
stateProfiles.types.ts     → TypeScript interfaces
stateProfiles.data.json    → 56 jurisdictions data
stateProfiles.ts           → Loader + 18 utility functions
```

---

## Migration Examples

### Example 1: Basic State Lookup

**OLD:**
```typescript
import { ALL_JURISDICTIONS } from './stateData';

const ny = ALL_JURISDICTIONS['NY'];
console.log(ny.rate); // 10.9
```

**NEW:**
```typescript
import { getStateTaxProfile } from './stateProfiles';

const ny = getStateTaxProfile('NY');
console.log(ny?.topRate); // 10.9
```

---

### Example 2: NIIT Check

**OLD:**
```typescript
import { doesNIITApply } from './stateData';

if (doesNIITApply('NY')) {
  // Add NIIT
}
```

**NEW:**
```typescript
import { doesNIITApply } from './stateProfiles';

if (doesNIITApply('NY')) {
  // Add NIIT
}
```
✅ **No change needed** - Same function signature

---

### Example 3: OZ Conformity Check

**OLD:**
```typescript
import { HDC_OZ_STRATEGY } from './hdcOzStrategy';

const jurisdiction = HDC_OZ_STRATEGY['NY'];
if (jurisdiction.status === 'GO') {
  // Full OZ benefits
}
```

**NEW:**
```typescript
import { getStateTaxProfile } from './stateProfiles';

const profile = getStateTaxProfile('NY');
if (profile?.ozConformity === 'full-rolling' || profile?.ozConformity === 'full-adopted') {
  // Full OZ benefits
}
```

---

### Example 4: HDC Tier Check

**OLD:**
```typescript
import { HDC_OZ_STRATEGY } from './hdcOzStrategy';

const jurisdiction = HDC_OZ_STRATEGY['GA'];
if (jurisdiction.tier === 'Prime') {
  // Tier 1 state
}
```

**NEW:**
```typescript
import { getStateHDCTier } from './stateProfiles';

if (getStateHDCTier('GA') === 1) {
  // Tier 1 state
}
```

---

### Example 5: State LIHTC Check

**OLD:**
```typescript
// Data was scattered or hardcoded
if (state === 'GA' || state === 'NE' || state === 'SC') {
  // Has State LIHTC
}
```

**NEW:**
```typescript
import { hasStateLIHTC, getStateLIHTCProgram } from './stateProfiles';

if (hasStateLIHTC('GA')) {
  const program = getStateLIHTCProgram('GA');
  console.log(program?.percent); // 100
  console.log(program?.syndicationRate); // 85
}
```

---

### Example 6: Filtering States

**OLD:**
```typescript
import { ALL_JURISDICTIONS } from './stateData';

const conformingStates = Object.values(ALL_JURISDICTIONS)
  .filter(j => j.ozConformity === 'full');
```

**NEW:**
```typescript
import { getStatesWithFullOZConformity } from './stateProfiles';

const conformingStates = getStatesWithFullOZConformity();
```

---

## Complete API Reference

### Core Lookup Functions
| Function | Description | Example |
|----------|-------------|---------|
| `getStateTaxProfile(code)` | Get complete profile | `getStateTaxProfile('NY')` |
| `getStateTaxRate(code)` | Get top tax rate | `getStateTaxRate('CA')` → 13.3 |
| `getStateOzConformity(code)` | Get OZ status | `getStateOzConformity('OR')` → 'full-rolling' |
| `getStateBonusDepreciation(code)` | Get bonus dep % | `getStateBonusDepreciation('OR')` → 100 |

### State LIHTC Functions
| Function | Description | Example |
|----------|-------------|---------|
| `hasStateLIHTC(code)` | Check if LIHTC exists | `hasStateLIHTC('GA')` → true |
| `getStateLIHTCProgram(code)` | Get LIHTC details | `getStateLIHTCProgram('GA')?.percent` → 100 |
| `getStateLIHTCSyndicationRate(code)` | Get syndication % | `getStateLIHTCSyndicationRate('NE')` → 90 |

### HDC Priority Functions
| Function | Description | Example |
|----------|-------------|---------|
| `getStateHDCTier(code)` | Get HDC tier (1-3) | `getStateHDCTier('GA')` → 1 |
| `getCombinedLIHTCRate(code)` | Get combined rate | `getCombinedLIHTCRate('GA')` → 46.6 |

### Special Rules Functions
| Function | Description | Example |
|----------|-------------|---------|
| `doesNIITApply(code)` | Check NIIT | `doesNIITApply('PR')` → false |
| `hasStatePrevailingWage(code)` | Check state PW | `hasStatePrevailingWage('CA')` → true |

### Filtering Functions
| Function | Description | Returns |
|----------|-------------|---------|
| `getStatesByOzStatus(status)` | Filter by OZ conformity | Array of profiles |
| `getStatesByHDCTier(tier)` | Filter by HDC tier | Array of profiles |
| `getStatesWithStateLIHTC()` | Get all with LIHTC | 25 states |
| `getStatesWithFullOZConformity()` | Get full OZ states | 37 jurisdictions |
| `getNoIncomeTaxStates()` | Get no-tax states | Array of profiles |
| `getTerritories()` | Get all territories | 5 territories |

---

## Data Structure Changes

### OZ Conformity Mapping

| Old (hdcOzStrategy) | New (stateProfiles) |
|---------------------|---------------------|
| `status: 'GO'` | `ozConformity: 'full-rolling'` or `'full-adopted'` |
| `status: 'NO_GO'` | `ozConformity: 'none'` |
| `status: 'GO_IN_STATE'` | `ozConformity: 'limited'` + `specialRules` |

### Tier Mapping

| Old (hdcOzStrategy) | New (stateProfiles) |
|---------------------|---------------------|
| `tier: 'Prime'` | `hdcTier: 1` |
| `tier: 'Secondary'` | `hdcTier: 2` |
| `tier: 'Future Opportunity'` | `hdcTier: 3` |
| `tier: 'Conforming'` | `hdcTier: null` |
| `tier: 'Federal Only'` | `hdcTier: null` |

---

## Backward Compatibility

**Current Status**: ✅ **Fully backward compatible**

The old files (`stateData.ts` and `hdcOzStrategy.ts`) have been converted to **compatibility wrappers** that:
- Re-export functions with same signatures
- Convert new data format to legacy format
- Log deprecation warnings to console
- Will be removed in v8.0

**Action Required**: None immediately, but plan migration for v8.0

---

## Testing

### Verify Migration
```bash
npm test -- stateProfiles.test.ts
```

**Expected**: 72/72 tests passing

### Check for Direct Usage
```bash
# Find files still using old imports
grep -r "from.*stateData" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*hdcOzStrategy" src/ --include="*.ts" --include="*.tsx"
```

---

## New Features in v7.0

### 1. State LIHTC Programs
Now includes complete data for all 25 state programs:
- Program type (piggyback, supplement, standalone, grant)
- Transferability mechanism
- Syndication rates
- Caps and sunsets
- Prevailing wage requirements

### 2. Enhanced Metadata
Every jurisdiction includes:
- Legal authority citations
- Special rules and notes
- Last update date
- Source URLs

### 3. Territories Support
Full data for all 5 US territories:
- Puerto Rico (PR)
- U.S. Virgin Islands (VI)
- Guam (GU)
- Northern Mariana Islands (MP)
- American Samoa (AS)

### 4. Type Safety
- Compile-time type checking
- Autocomplete in IDEs
- Enum-based conformity types

---

## Adding New Fields

The architecture is designed for easy extensibility. To add a new field:

### Step 1: Update Interface
```typescript
// stateProfiles.types.ts
export interface StateTaxProfile {
  // ... existing fields

  // NEW FIELD:
  /** Description of new field */
  newField: string | number | boolean;
}
```

### Step 2: Update JSON Data
```json
{
  "NY": {
    // ... existing fields
    "newField": "value"
  }
}
```

### Step 3: (Optional) Add Utility Function
```typescript
// stateProfiles.ts
export const getNewField = (code: string): ReturnType => {
  return STATE_TAX_PROFILES[code]?.newField ?? defaultValue;
};
```

**That's it!** No need to update 56 separate locations.

---

## Timeline

| Date | Milestone |
|------|-----------|
| **2025-12-16** | v7.0 released with backward compatibility |
| **Q1 2026** | Grace period - migrate existing code |
| **v8.0** | Remove old files and compatibility wrappers |

---

## Support

- **Documentation**: `/docs/implementation/`
- **Examples**: See test file `stateProfiles.test.ts`
- **Issues**: Report via GitHub issues

---

*End of Migration Guide*
