# State Data Migration Guide

## Overview
This guide explains how to migrate from the current limited state dropdown (12 states) to the comprehensive 56 jurisdiction system (50 states + DC + 5 territories).

## Key Benefits of New Structure

### 1. **Complete Coverage**
- All 50 US states
- District of Columbia
- 5 US territories (PR, VI, GU, AS, MP)
- Proper handling of special cases (e.g., WA capital gains tax, NYC additional tax)

### 2. **Optimized Data Structure**
```typescript
interface JurisdictionData {
  name: string;                // Full name
  rate: number;                // Ordinary income tax rate
  capitalGainsRate?: number;   // If different from ordinary
  tier: string;                // Grouping for UI
  type: string;                // state/territory/district
  ozConformity: string;        // OZ tax treatment
  niitApplies: boolean;        // NIIT applicability
  notes?: string;              // Special considerations
}
```

### 3. **Performance Benefits**
- O(1) lookups using object keys
- Pre-sorted groups for UI rendering
- Lazy loading potential for large datasets
- Memoized grouping functions

### 4. **Maintainability**
- Single source of truth (`stateData.ts`)
- Helper functions for common operations
- Backward compatibility layer
- Clear separation of data and UI

## Migration Steps

### Step 1: Update Imports
Replace old imports with new comprehensive data:

```typescript
// OLD
import { CONFORMING_STATES } from '../../../utils/HDCCalculator/constants';

// NEW
import {
  ALL_JURISDICTIONS,
  CONFORMING_STATES,  // Still available for backward compatibility
  getJurisdictionsByTier,
  getEffectiveTaxRate
} from '../../../utils/HDCCalculator/stateData';
```

### Step 2: Update Components

#### Option A: Use Enhanced Component (Recommended)
```typescript
import EnhancedStateSelector from './inputs/EnhancedStateSelector';

// Replace existing dropdown with:
<EnhancedStateSelector
  selectedState={selectedState}
  handleStateChange={handleStateChange}
  federalTaxRate={federalTaxRate}
  stateCapitalGainsRate={stateCapitalGainsRate}
  setStateCapitalGainsRate={setStateCapitalGainsRate}
/>
```

#### Option B: Update Existing Component
Update `TaxRatesSection.tsx` to use new data:

```typescript
const groupedStates = getJurisdictionsByTier();

// Generate optgroups dynamically
{Object.entries(groupedStates).map(([tier, jurisdictions]) => (
  <optgroup key={tier} label={tierLabels[tier]}>
    {jurisdictions.map(({ code, data }) => (
      <option key={code} value={code}>
        {getJurisdictionLabel(code)}
      </option>
    ))}
  </optgroup>
))}
```

### Step 3: Update Tax Calculations

The calculation logic needs to account for:

1. **Different Capital Gains Rates**
```typescript
const stateRate = getEffectiveTaxRate(selectedState, isCapitalGain);
```

2. **Territory NIIT Handling**
```typescript
const niitRate = doesNIITApply(selectedState) ? 3.8 : 0;
```

3. **Special OZ Conformity**
```typescript
const jurisdiction = ALL_JURISDICTIONS[selectedState];
if (jurisdiction.ozConformity === 'special') {
  // Apply special territory OZ rules
}
```

### Step 4: Update Saved Configurations

Add migration logic for saved configs:

```typescript
function migrateStateConfig(oldState: string): string {
  // Map old limited states to new codes
  const stateMap = {
    'NONE': 'NONE',
    'CUSTOM': 'CUSTOM',
    // All existing states keep same codes
  };
  return stateMap[oldState] || oldState;
}
```

## Testing Checklist

- [ ] All existing 12 states still work
- [ ] New states calculate taxes correctly
- [ ] Territories don't apply NIIT
- [ ] Capital gains rates differ where applicable
- [ ] OZ conformity indicators display correctly
- [ ] Saved configurations load properly
- [ ] Custom rate entry still works
- [ ] Performance acceptable with 56 options

## Backward Compatibility

The new system maintains backward compatibility:

1. **CONFORMING_STATES** still exported
2. **State codes** unchanged (NY, CA, etc.)
3. **Data structure** compatible via adapter
4. **API** additive, not breaking

## Special Cases to Test

### States with Unique Features
- **Washington**: No income tax but 7% capital gains tax
- **Hawaii**: Different rates for ordinary vs capital gains
- **Arkansas**: Preferential capital gains rate (3% vs 5.5%)
- **New Hampshire**: No income tax but taxes interest/dividends

### Territories
- **Puerto Rico**: Act 60 benefits, special OZ rules
- **US Virgin Islands**: Mirror tax code with US
- **Other territories**: No NIIT application

### Edge Cases
- NYC residents (state + city tax)
- States without OZ conformity (CA, NC, PA, MA, MI, MS, WA)
- Zero-tax states with OZ investments
- Custom rate entry validation

## Performance Considerations

With 56+ jurisdictions:

1. **Initial Load**: ~5KB additional data
2. **Render Time**: Negligible with proper memoization
3. **Search/Filter**: Consider adding if UX requires
4. **Lazy Loading**: Not needed for current size

## Future Enhancements

1. **Search/Filter**: Add jurisdiction search
2. **Favorites**: Allow marking frequently used states
3. **Multi-State**: Support split-year residents
4. **City Taxes**: Add major city taxes (NYC, SF, etc.)
5. **International**: Support for foreign investors

## Questions to Resolve

1. Should we show all 56 jurisdictions or filter by criteria?
2. Do we need search functionality in the dropdown?
3. Should territories be in a separate dropdown?
4. How to handle city taxes (NYC, Philadelphia, etc.)?
5. Should we cache the grouped data in localStorage?

## Implementation Timeline

1. **Phase 1**: Deploy new data structure (backward compatible)
2. **Phase 2**: Update UI components progressively
3. **Phase 3**: Add enhanced features (search, favorites)
4. **Phase 4**: Deprecate old structure (with migration path)