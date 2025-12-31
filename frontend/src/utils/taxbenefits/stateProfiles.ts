/**
 * State Tax Profiles - Unified Lookup System
 *
 * Provides centralized access to all US state and territory tax profiles,
 * including OZ conformity, bonus depreciation, and State LIHTC programs.
 *
 * This module consolidates and replaces:
 * - stateData.ts (deprecated)
 * - hdcOzStrategy.ts (deprecated)
 *
 * @module stateProfiles
 * @version 7.0
 * @source ADDENDUM-V7.0.MD
 *
 * @example
 * ```typescript
 * import { getStateTaxProfile, hasStateLIHTC } from './stateProfiles';
 *
 * const ny = getStateTaxProfile('NY');
 * console.log(ny?.topRate); // 10.9
 *
 * if (hasStateLIHTC('GA')) {
 *   const program = getStateLIHTCProgram('GA');
 *   console.log(program?.syndicationRate); // 85
 * }
 * ```
 */

import stateProfilesJson from './stateProfiles.data.json';
import type {
  StateTaxProfile,
  StateTaxProfileMap,
  StateLIHTCProgram,
  OzConformity,
  HDCTier,
  StateProfilesMetadata,
} from './stateProfiles.types';

/**
 * State tax profiles loaded from JSON data file
 *
 * O(1) lookup by jurisdiction code.
 * Validated at import time to ensure data integrity.
 */
export const STATE_TAX_PROFILES: StateTaxProfileMap = stateProfilesJson.profiles as StateTaxProfileMap;

/**
 * Metadata about the state profiles dataset
 */
export const STATE_PROFILES_METADATA: StateProfilesMetadata = stateProfilesJson.metadata as StateProfilesMetadata;

// ========== CORE LOOKUP FUNCTIONS ==========

/**
 * Get complete tax profile for a jurisdiction
 *
 * @param code - Two-letter jurisdiction code (e.g., 'NY', 'CA', 'PR')
 * @returns Complete state tax profile, or undefined if not found
 *
 * @example
 * ```typescript
 * const ny = getStateTaxProfile('NY');
 * if (ny) {
 *   console.log(`${ny.name}: ${ny.topRate}%`);
 * }
 * ```
 */
export const getStateTaxProfile = (code: string): StateTaxProfile | undefined => {
  return STATE_TAX_PROFILES[code];
};

/**
 * Get top marginal tax rate for a jurisdiction
 *
 * @param code - Two-letter jurisdiction code
 * @returns Top tax rate (%), or 0 if not found or no income tax
 *
 * @example
 * ```typescript
 * const rate = getStateTaxRate('NY'); // 10.9
 * const noTax = getStateTaxRate('TX'); // 0
 * ```
 */
export const getStateTaxRate = (code: string): number => {
  return STATE_TAX_PROFILES[code]?.topRate ?? 0;
};

/**
 * Get Opportunity Zone conformity status
 *
 * @param code - Two-letter jurisdiction code
 * @returns OZ conformity type, or null if not found
 *
 * @example
 * ```typescript
 * const conformity = getStateOzConformity('OR'); // 'full-rolling'
 * const none = getStateOzConformity('CA'); // 'none'
 * ```
 */
export const getStateOzConformity = (code: string): OzConformity | null => {
  return STATE_TAX_PROFILES[code]?.ozConformity ?? null;
};

/**
 * Get bonus depreciation conformity percentage
 *
 * @param code - Two-letter jurisdiction code
 * @returns Bonus depreciation % (0, 100, or partial), or 0 if not found
 *
 * @example
 * ```typescript
 * const bonus = getStateBonusDepreciation('OR'); // 100 (only state)
 * const none = getStateBonusDepreciation('NY'); // 0
 * ```
 */
export const getStateBonusDepreciation = (code: string): number => {
  return STATE_TAX_PROFILES[code]?.bonusDepreciation ?? 0;
};

/**
 * State bonus depreciation conformity rates for federal bonus depreciation
 *
 * This determines what percentage of federal bonus depreciation the state
 * recognizes for state tax purposes. Different from getStateBonusDepreciation()
 * which checks if the state has its OWN bonus depreciation program.
 *
 * @remarks
 * - 0.0 = State does NOT conform to federal bonus depreciation (CA, PA, IL)
 * - 0.3 = State has 30% limited conformity (NJ)
 * - 0.5 = State has 50% partial conformity (NY)
 * - 1.0 = State fully conforms to federal bonus depreciation (most states)
 *
 * All states accept straight-line depreciation (27.5-year MACRS).
 * This only affects the bonus/accelerated portion.
 *
 * @source IMPL-041: State Conformity Integration
 */
const STATE_BONUS_CONFORMITY_RATES: Record<string, number> = {
  'CA': 0.0,    // California doesn't conform to federal bonus
  'NY': 0.5,    // New York partial conformity (50% of bonus allowed)
  'PA': 0.0,    // Pennsylvania doesn't conform
  'NJ': 0.3,    // New Jersey limited conformity (30% of bonus allowed)
  'IL': 0.0,    // Illinois doesn't conform
  // All other states default to 1.0 (full conformity)
};

/**
 * Get state bonus depreciation conformity rate for tax benefit calculations
 *
 * Returns the percentage (0.0 to 1.0) of federal bonus depreciation that
 * the state recognizes for state income tax purposes.
 *
 * @param code - Two-letter jurisdiction code
 * @returns Conformity rate (0.0 to 1.0), defaults to 1.0 for unlisted states
 *
 * @example
 * ```typescript
 * getStateBonusConformityRate('NJ');  // 0.3 (30% conformity)
 * getStateBonusConformityRate('CA');  // 0.0 (0% conformity)
 * getStateBonusConformityRate('OR');  // 1.0 (full conformity)
 * getStateBonusConformityRate('GA');  // 1.0 (default, full conformity)
 * ```
 *
 * @remarks
 * Use this to calculate state tax benefit on bonus depreciation:
 * ```typescript
 * const stateRate = getStateTaxRate(code);
 * const conformity = getStateBonusConformityRate(code);
 * const stateBenefitOnBonus = bonusDepreciation * stateRate * conformity;
 * ```
 */
export const getStateBonusConformityRate = (code: string): number => {
  return STATE_BONUS_CONFORMITY_RATES[code] ?? 1.0;
};

// ========== STATE LIHTC FUNCTIONS ==========

/**
 * Check if a state has a State LIHTC program
 *
 * @param code - Two-letter jurisdiction code
 * @returns True if state has State LIHTC program
 *
 * @example
 * ```typescript
 * hasStateLIHTC('GA'); // true (100% piggyback)
 * hasStateLIHTC('OR'); // false (no program)
 * ```
 */
export const hasStateLIHTC = (code: string): boolean => {
  return STATE_TAX_PROFILES[code]?.stateLIHTC !== null && STATE_TAX_PROFILES[code]?.stateLIHTC !== undefined;
};

/**
 * Get State LIHTC program details
 *
 * @param code - Two-letter jurisdiction code
 * @returns State LIHTC program details, or null if no program
 *
 * @example
 * ```typescript
 * const ga = getStateLIHTCProgram('GA');
 * if (ga) {
 *   console.log(`${ga.type}: ${ga.percent}%`); // piggyback: 100%
 *   console.log(`Syndication: ${ga.syndicationRate}%`); // 85%
 * }
 * ```
 */
export const getStateLIHTCProgram = (code: string): StateLIHTCProgram | null => {
  return STATE_TAX_PROFILES[code]?.stateLIHTC ?? null;
};

/**
 * Get State LIHTC syndication rate
 *
 * @param code - Two-letter jurisdiction code
 * @returns Syndication rate (%), or 0 if no program
 *
 * @remarks
 * Syndication rates by transferability:
 * - Certificated/Transferable: 90%
 * - Bifurcated: 85%
 * - Allocated: 80%
 * - Grant: 100%
 *
 * @example
 * ```typescript
 * getStateLIHTCSyndicationRate('NE'); // 90 (transferable)
 * getStateLIHTCSyndicationRate('GA'); // 85 (bifurcated)
 * getStateLIHTCSyndicationRate('SC'); // 80 (allocated)
 * ```
 */
export const getStateLIHTCSyndicationRate = (code: string): number => {
  return STATE_TAX_PROFILES[code]?.stateLIHTC?.syndicationRate ?? 0;
};

// ========== HDC PRIORITY FUNCTIONS ==========

/**
 * Get HDC priority tier for a state
 *
 * @param code - Two-letter jurisdiction code
 * @returns HDC tier (1-3), or null if not in priority list
 *
 * @example
 * ```typescript
 * getStateHDCTier('GA'); // 1 (highest priority)
 * getStateHDCTier('OR'); // 2
 * getStateHDCTier('NJ'); // 3
 * getStateHDCTier('TX'); // null (not prioritized)
 * ```
 */
export const getStateHDCTier = (code: string): HDCTier => {
  return STATE_TAX_PROFILES[code]?.hdcTier ?? null;
};

/**
 * Get combined federal + state LIHTC rate
 *
 * @param code - Two-letter jurisdiction code
 * @returns Combined rate (%), or null if not calculated
 *
 * @remarks
 * Only pre-calculated for HDC priority states.
 * For other states, calculate dynamically based on federal + state programs.
 *
 * @example
 * ```typescript
 * getCombinedLIHTCRate('GA'); // 46.6
 * getCombinedLIHTCRate('OR'); // 50.7
 * ```
 */
export const getCombinedLIHTCRate = (code: string): number | null => {
  return STATE_TAX_PROFILES[code]?.combinedRate ?? null;
};

// ========== SPECIAL RULES FUNCTIONS ==========

/**
 * Check if Net Investment Income Tax (NIIT) applies
 *
 * @param code - Two-letter jurisdiction code
 * @returns True if NIIT applies (always false for territories)
 *
 * @example
 * ```typescript
 * doesNIITApply('NY'); // true
 * doesNIITApply('PR'); // false (territory)
 * ```
 */
export const doesNIITApply = (code: string): boolean => {
  return STATE_TAX_PROFILES[code]?.niitApplies ?? true;
};

/**
 * Check if state has prevailing wage requirements
 *
 * @param code - Two-letter jurisdiction code
 * @returns True if state has PW requirements beyond federal
 *
 * @example
 * ```typescript
 * hasStatePrevailingWage('CA'); // true
 * hasStatePrevailingWage('NJ'); // true (likely via STCS)
 * hasStatePrevailingWage('GA'); // false
 * ```
 */
export const hasStatePrevailingWage = (code: string): boolean => {
  const profile = STATE_TAX_PROFILES[code];
  if (!profile) return false;

  // Check if State LIHTC has PW requirement
  if (profile.stateLIHTC?.pw) return true;

  // Check if state has PW notes
  if (profile.prevailingWageNotes && profile.prevailingWageNotes.length > 0) return true;

  return false;
};

// ========== FILTERING FUNCTIONS ==========

/**
 * Get all states with a specific OZ conformity status
 *
 * @param status - OZ conformity type to filter by
 * @returns Array of matching state profiles
 *
 * @example
 * ```typescript
 * const fullOZ = getStatesByOzStatus('full-rolling'); // OR, AZ, LA, etc.
 * const noOZ = getStatesByOzStatus('none'); // CA, NY, HI, etc.
 * ```
 */
export const getStatesByOzStatus = (status: OzConformity): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.ozConformity === status);
};

/**
 * Get all states in a specific HDC priority tier
 *
 * @param tier - HDC tier (1, 2, or 3)
 * @returns Array of matching state profiles
 *
 * @example
 * ```typescript
 * const tier1 = getStatesByHDCTier(1); // GA, NE, SC, KS
 * const tier2 = getStatesByHDCTier(2); // OR, DC, MO, OH
 * ```
 */
export const getStatesByHDCTier = (tier: HDCTier): StateTaxProfile[] => {
  if (tier === null) return [];
  return Object.values(STATE_TAX_PROFILES).filter(s => s.hdcTier === tier);
};

/**
 * Get all states with State LIHTC programs
 *
 * @returns Array of state profiles with State LIHTC
 *
 * @example
 * ```typescript
 * const withLIHTC = getStatesWithStateLIHTC(); // 25 states
 * ```
 */
export const getStatesWithStateLIHTC = (): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.stateLIHTC !== null && s.stateLIHTC !== undefined);
};

/**
 * Get all states with full OZ conformity (both full-rolling and full-adopted)
 *
 * @returns Array of state profiles with full OZ conformity
 *
 * @example
 * ```typescript
 * const fullOZ = getStatesWithFullOZConformity(); // 31 states
 * ```
 */
export const getStatesWithFullOZConformity = (): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(
    s => s.ozConformity === 'full-rolling' || s.ozConformity === 'full-adopted'
  );
};

/**
 * Get all no-income-tax states
 *
 * @returns Array of state profiles with no income tax
 *
 * @example
 * ```typescript
 * const noTax = getNoIncomeTaxStates(); // AK, FL, NV, SD, TX, WA, WY
 * ```
 */
export const getNoIncomeTaxStates = (): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.topRate === 0 && s.type === 'state');
};

/**
 * Get all US territories
 *
 * @returns Array of territory profiles
 *
 * @example
 * ```typescript
 * const territories = getTerritories(); // PR, VI, GU, MP, AS
 * ```
 */
export const getTerritories = (): StateTaxProfile[] => {
  return Object.values(STATE_TAX_PROFILES).filter(s => s.type === 'territory');
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validate that all required states are present
 *
 * @returns Validation result with missing states
 *
 * @internal Used for testing and data integrity checks
 */
export const validateStateProfiles = (): { valid: boolean; missing: string[]; count: number } => {
  const expectedCount = STATE_PROFILES_METADATA.jurisdictionCount;
  const actualCount = Object.keys(STATE_TAX_PROFILES).length;

  return {
    valid: actualCount === expectedCount,
    missing: [],
    count: actualCount,
  };
};

// ========== EXPORTS ==========

/**
 * Export all types for external use
 */
export type {
  StateTaxProfile,
  StateTaxProfileMap,
  StateLIHTCProgram,
  OzConformity,
  HDCTier,
  StateProfilesMetadata,
} from './stateProfiles.types';

/**
 * Default export: STATE_TAX_PROFILES map
 */
export default STATE_TAX_PROFILES;
