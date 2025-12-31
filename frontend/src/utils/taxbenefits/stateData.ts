/**
 * @deprecated This file has been deprecated and replaced by stateProfiles.ts
 *
 * Please migrate to the new unified state profiles system:
 *
 * OLD:
 * ```typescript
 * import { ALL_JURISDICTIONS, doesNIITApply, CONFORMING_STATES } from './stateData';
 * ```
 *
 * NEW:
 * ```typescript
 * import {
 *   STATE_TAX_PROFILES,
 *   doesNIITApply,
 *   getStateTaxProfile
 * } from './stateProfiles';
 * ```
 *
 * Migration Guide:
 * - `ALL_JURISDICTIONS` → `STATE_TAX_PROFILES`
 * - `doesNIITApply(state)` → Same function, now in stateProfiles
 * - `CONFORMING_STATES` → Filter `STATE_TAX_PROFILES` by ozConformity
 * - `getEffectiveTaxRate()` → Calculate from profile data
 *
 * This file will be removed in a future release.
 */

import {
  STATE_TAX_PROFILES,
  doesNIITApply as doesNIITApplyNew,
  getStateTaxProfile,
  type StateTaxProfile,
} from './stateProfiles';

// Re-export for backward compatibility
export const doesNIITApply = doesNIITApplyNew;

// Legacy interface for backward compatibility
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

/**
 * @deprecated Use STATE_TAX_PROFILES from stateProfiles.ts instead
 *
 * Backward compatibility wrapper that converts new StateTaxProfile format
 * to legacy JurisdictionData format.
 */
export const ALL_JURISDICTIONS: Record<string, JurisdictionData> = Object.entries(STATE_TAX_PROFILES).reduce(
  (acc, [code, profile]) => {
    // Convert new ozConformity types to legacy format
    let legacyConformity: 'full' | 'partial' | 'none' | 'special' = 'none';
    if (profile.ozConformity === 'full-rolling' || profile.ozConformity === 'full-adopted') {
      legacyConformity = 'full';
    } else if (profile.ozConformity === 'limited') {
      legacyConformity = 'partial';
    } else if (profile.ozConformity === 'special') {
      legacyConformity = 'special';
    }

    // Convert HDC tier to legacy tier
    let legacyTier: 'Prime' | 'Secondary' | 'Standard' | 'NoTax' | 'Territory' = 'Standard';
    if (profile.type === 'territory') {
      legacyTier = 'Territory';
    } else if (profile.topRate === 0) {
      legacyTier = 'NoTax';
    } else if (profile.hdcTier === 1) {
      legacyTier = 'Prime';
    } else if (profile.hdcTier === 2 || profile.hdcTier === 3) {
      legacyTier = 'Secondary';
    }

    acc[code] = {
      name: profile.name,
      rate: profile.topRate,
      capitalGainsRate: profile.topRate, // In new system, usually same as ordinary
      tier: legacyTier,
      type: profile.type,
      ozConformity: legacyConformity,
      niitApplies: profile.niitApplies,
      notes: profile.specialRules ?? undefined,
    };

    return acc;
  },
  {} as Record<string, JurisdictionData>
);

/**
 * @deprecated Use getStatesWithFullOZConformity() from stateProfiles.ts instead
 *
 * Legacy filtered view of conforming states
 */
export const CONFORMING_STATES = Object.entries(STATE_TAX_PROFILES)
  .filter(([, profile]) => profile.ozConformity === 'full-rolling' || profile.ozConformity === 'full-adopted')
  .reduce((acc, [code, profile]) => {
    acc[code] = {
      name: profile.name,
      rate: profile.topRate,
      capitalGainsRate: profile.topRate,
      tier: 'Prime' as const,
      type: profile.type,
      ozConformity: 'full' as const,
      niitApplies: profile.niitApplies,
      notes: profile.specialRules ?? undefined,
    };
    return acc;
  }, {} as Record<string, JurisdictionData>);

/**
 * @deprecated Use getStateTaxProfile from stateProfiles.ts instead
 *
 * Get effective tax rate for a jurisdiction.
 * Handles special cases like different capital gains rates.
 * Returns just the STATE tax rate (not combined with federal).
 */
export function getEffectiveTaxRate(
  jurisdictionCode: string,
  isCapitalGain: boolean = false
): number {
  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];
  if (!jurisdiction) return 0;

  if (isCapitalGain && jurisdiction.capitalGainsRate !== undefined) {
    return jurisdiction.capitalGainsRate;
  }

  return jurisdiction.rate;
}

/**
 * @deprecated Use STATE_TAX_PROFILES from stateProfiles.ts instead
 *
 * Helper function to get jurisdictions grouped by tier for UI display
 */
export function getJurisdictionsByTier(): Record<string, Array<{code: string, data: JurisdictionData}>> {
  const grouped: Record<string, Array<{code: string, data: JurisdictionData}>> = {
    'Prime': [],
    'Secondary': [],
    'Standard': [],
    'NoTax': [],
    'Territory': []
  };

  Object.entries(ALL_JURISDICTIONS).forEach(([code, data]) => {
    grouped[data.tier].push({ code, data });
  });

  // Sort each group by rate (descending) then name
  Object.keys(grouped).forEach(tier => {
    grouped[tier].sort((a, b) => {
      if (a.data.rate !== b.data.rate) {
        return b.data.rate - a.data.rate;  // Higher rates first
      }
      return a.data.name.localeCompare(b.data.name);
    });
  });

  return grouped;
}

/**
 * @deprecated Use getStateTaxProfile from stateProfiles.ts instead
 *
 * Get display label for dropdown
 */
export function getJurisdictionLabel(code: string): string {
  const data = ALL_JURISDICTIONS[code];
  if (!data) return code;

  const rateStr = data.rate === 0 ? 'No Tax' : `${data.rate}%`;
  const ozStr = data.ozConformity === 'full' ? ' ✓' :
                data.ozConformity === 'partial' ? ' ◐' :
                data.ozConformity === 'special' ? ' ★' : '';

  return `${data.name} (${rateStr})${ozStr}`;
}

console.warn(
  '⚠️ stateData.ts is deprecated. Please migrate to stateProfiles.ts. See file header for migration guide.'
);
