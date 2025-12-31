/**
 * @deprecated This file has been deprecated and replaced by stateProfiles.ts
 *
 * Please migrate to the new unified state profiles system:
 *
 * OLD:
 * ```typescript
 * import { HDC_OZ_STRATEGY, getOzBenefits } from './hdcOzStrategy';
 * ```
 *
 * NEW:
 * ```typescript
 * import {
 *   STATE_TAX_PROFILES,
 *   getStateTaxProfile,
 *   getStateOzConformity,
 *   getStateHDCTier
 * } from './stateProfiles';
 * ```
 *
 * Migration Guide:
 * - `HDC_OZ_STRATEGY[code]` → `getStateTaxProfile(code)`
 * - `getOzBenefits(state)` → Check `ozConformity` field in profile
 * - Status mapping:
 *   - 'GO' → ozConformity: 'full-rolling' or 'full-adopted'
 *   - 'NO_GO' → ozConformity: 'none'
 *   - 'GO_IN_STATE' → ozConformity: 'limited' + projectLocationRequired: true
 *
 * This file will be removed in a future release.
 */

import {
  STATE_TAX_PROFILES,
  getStateTaxProfile,
  getStateOzConformity,
  type StateTaxProfile,
} from './stateProfiles';

// Legacy types for backward compatibility
export type OZStatus = 'GO' | 'GO_IN_STATE' | 'NO_GO';
export type OZTier = 'Exceptional' | 'Prime' | 'Secondary' | 'Conforming' | 'Future Opportunity' | 'Federal Only';

export interface HDCOzJurisdiction {
  name: string;
  rate: number;
  status: OZStatus;
  tier: OZTier;
  savings: string;
  savingsRate?: number;
  notes: string;
  special?: 'exceptional' | 'corporate-only' | 'individual-only';
  projectLocationRequired?: boolean;
}

/**
 * @deprecated Use STATE_TAX_PROFILES from stateProfiles.ts instead
 *
 * Backward compatibility wrapper that converts new StateTaxProfile format
 * to legacy HDCOzJurisdiction format.
 */
export const HDC_OZ_STRATEGY: Record<string, HDCOzJurisdiction> = Object.entries(STATE_TAX_PROFILES).reduce(
  (acc, [code, profile]) => {
    // Convert ozConformity to legacy status
    let status: OZStatus = 'NO_GO';
    if (profile.ozConformity === 'full-rolling' || profile.ozConformity === 'full-adopted') {
      status = 'GO';
    } else if (profile.ozConformity === 'limited') {
      // Check if it requires project location (like AR, HI in legacy)
      status = profile.specialRules?.toLowerCase().includes('in-state') ? 'GO_IN_STATE' : 'GO';
    } else if (profile.ozConformity === 'no-cg-tax') {
      status = 'GO'; // No state tax means federal benefits apply
    }

    // Convert hdcTier to legacy OZTier
    let tier: OZTier = 'Conforming';
    if (profile.hdcTier === 1) {
      tier = 'Prime';
    } else if (profile.hdcTier === 2) {
      tier = 'Secondary';
    } else if (profile.hdcTier === 3) {
      tier = 'Future Opportunity';
    } else if (status === 'NO_GO') {
      tier = 'Federal Only';
    }

    // Calculate savings string
    let savings = 'Federal OZ benefits';
    if (profile.combinedRate) {
      savings = `${profile.combinedRate.toFixed(1)}%`;
    } else if (status === 'GO') {
      // Estimate based on rate
      const estimatedSavings = 23.8 + profile.topRate;
      savings = `~${estimatedSavings.toFixed(1)}%`;
    }

    // Check for special conformity notes
    let special: 'exceptional' | 'corporate-only' | 'individual-only' | undefined;
    if (profile.specialRules?.toLowerCase().includes('corporate')) {
      special = 'corporate-only';
    } else if (profile.specialRules?.toLowerCase().includes('individual')) {
      special = 'individual-only';
    } else if (profile.bonusDepreciation === 100) {
      special = 'exceptional';
    }

    acc[code] = {
      name: profile.name,
      rate: profile.topRate,
      status,
      tier,
      savings,
      savingsRate: profile.combinedRate ?? undefined,
      notes: profile.specialRules ?? (status === 'GO' ? 'Full OZ conformity' : 'No state OZ benefits'),
      special,
      projectLocationRequired: profile.specialRules?.toLowerCase().includes('in-state') ?? false,
    };

    return acc;
  },
  {} as Record<string, HDCOzJurisdiction>
);

/**
 * @deprecated Use getStateTaxProfile() and check ozConformity instead
 *
 * Legacy function for OZ benefits calculation
 */
export const getOzBenefits = (
  investorState: string,
  projectLocation?: string
): {
  status: OZStatus;
  stateTaxSavings: number;
  totalSavings: number;
  showProjectSelector: boolean;
  notes: string;
  message: string;
  effectiveSavings: number;
} => {
  const profile = getStateTaxProfile(investorState);

  if (!profile) {
    return {
      status: 'NO_GO',
      stateTaxSavings: 0,
      totalSavings: 23.8,
      showProjectSelector: false,
      notes: 'State not found',
      message: 'State not found in profiles',
      effectiveSavings: 23.8,
    };
  }

  // Determine status
  let status: OZStatus = 'NO_GO';
  let showProjectSelector = false;
  let message = '';

  if (profile.ozConformity === 'full-rolling' || profile.ozConformity === 'full-adopted') {
    status = 'GO';
    message = `${profile.name} fully conforms to federal OZ treatment`;
  } else if (profile.ozConformity === 'limited') {
    if (profile.specialRules?.toLowerCase().includes('in-state')) {
      status = 'GO_IN_STATE';
      showProjectSelector = true;
      message = `${profile.name} requires in-state OZ investment for state benefits`;

      // If project location matters and is out of state, no state benefits
      if (projectLocation && projectLocation !== investorState && projectLocation !== 'in-state') {
        status = 'NO_GO';
        message = `${profile.name} does not provide state benefits for out-of-state OZ investments`;
      }
    } else {
      status = 'GO'; // Limited but still provides benefits
      message = `${profile.name} has limited OZ conformity`;
    }
  } else if (profile.ozConformity === 'no-cg-tax') {
    status = 'GO'; // Federal benefits apply
    message = `${profile.name} has no capital gains tax - federal benefits apply`;
  } else {
    message = `${profile.name} does not conform to federal OZ treatment`;
  }

  // Calculate savings
  const stateTaxSavings = status === 'GO' || status === 'GO_IN_STATE' ? profile.topRate : 0;
  const totalSavings = 23.8 + stateTaxSavings;
  const effectiveSavings = totalSavings;

  return {
    status,
    stateTaxSavings,
    totalSavings,
    showProjectSelector,
    notes: profile.specialRules ?? '',
    message,
    effectiveSavings,
  };
};

console.warn(
  '⚠️ hdcOzStrategy.ts is deprecated. Please migrate to stateProfiles.ts. See file header for migration guide.'
);

/**
 * @deprecated Group jurisdictions by strategic tier for UI display
 */
export function getStrategicGroups() {
  const groups: Record<string, Array<{ code: string; data: HDCOzJurisdiction }>> = {
    'Exceptional': [],
    'Prime': [],
    'Secondary': [],
    'Conforming': [],
    'Future Opportunity': [],
    'Federal Only': []
  };

  Object.entries(HDC_OZ_STRATEGY).forEach(([code, data]) => {
    groups[data.tier].push({ code, data });
  });

  // Sort within each group
  Object.keys(groups).forEach(tier => {
    groups[tier].sort((a, b) => {
      // Sort by savings rate (descending), then by name
      const rateA = a.data.savingsRate || 0;
      const rateB = b.data.savingsRate || 0;
      if (rateA !== rateB) return rateB - rateA;
      return a.data.name.localeCompare(b.data.name);
    });
  });

  return groups;
}

/**
 * @deprecated Get display badge for OZ status
 */
export function getOzStatusBadge(status: OZStatus): {
  icon: string;
  color: string;
  label: string;
} {
  switch (status) {
    case 'GO':
      return { icon: '✅', color: '#4CAF50', label: 'Full Benefits' };
    case 'GO_IN_STATE':
      return { icon: '📍', color: '#FF9800', label: 'Location Dependent' };
    case 'NO_GO':
      return { icon: '🚫', color: '#F44336', label: 'Federal Only' };
    default:
      return { icon: '❓', color: '#9E9E9E', label: 'Unknown' };
  }
}
