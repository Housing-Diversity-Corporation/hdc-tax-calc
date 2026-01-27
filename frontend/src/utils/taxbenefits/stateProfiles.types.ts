/**
 * State Tax Profiles - Type Definitions
 *
 * Unified type system for all US state and territory tax profiles,
 * including OZ conformity, bonus depreciation, and State LIHTC programs.
 *
 * @module stateProfiles.types
 * @version 7.0
 * @source ADDENDUM-V7.0.MD
 */

/**
 * Opportunity Zone conformity types
 *
 * - `full-rolling`: Automatically adopts IRC changes including OZ
 * - `full-adopted`: Adopted specific IRC version that includes OZ
 * - `limited`: Partial conformity—see state notes
 * - `none`: Explicitly decoupled from federal OZ
 * - `no-cg-tax`: No state capital gains tax
 * - `special`: Unique rules—see state notes
 */
export type OzConformity = 'full-rolling' | 'full-adopted' | 'limited' | 'none' | 'no-cg-tax' | 'special';

/**
 * State LIHTC program structure types
 *
 * - `piggyback`: Automatic percentage of federal credits
 * - `supplement`: Additional allocation beyond federal
 * - `standalone`: Independent allocation mechanism
 * - `grant`: Non-transferable grant structure
 */
export type StateLIHTCType = 'piggyback' | 'supplement' | 'standalone' | 'grant' | null;

/**
 * State LIHTC transferability mechanisms
 *
 * - `certificated`: Direct sale to any state taxpayer, can resell (e.g., CA)
 * - `transferable`: Direct sale with notice to state agency (e.g., NE, IL, NM)
 * - `bifurcated`: Separate from federal, syndicate to state investors (e.g., GA)
 * - `allocated`: In-state investors join partnership for allocation (most common)
 * - `grant`: Not transferable—flows directly to project (e.g., NJ)
 */
export type Transferability = 'certificated' | 'transferable' | 'bifurcated' | 'allocated' | 'grant';

/**
 * Jurisdiction type classification
 */
export type JurisdictionType = 'state' | 'territory' | 'district';

/**
 * HDC priority tier classification
 *
 * - Tier 1: Highest priority (100% State LIHTC, full OZ, no PW)
 * - Tier 2: Secondary priority (strong benefits, manageable constraints)
 * - Tier 3: Tertiary priority (some benefits with constraints)
 */
export type HDCTier = 1 | 2 | 3 | null;

/**
 * State LIHTC Program Details
 *
 * Comprehensive information about a state's Low-Income Housing Tax Credit program,
 * including structure, transferability, and syndication characteristics.
 */
export interface StateLIHTCProgram {
  /** Program name (e.g., "State LIHTC", "AHAP") */
  program: string;

  /** Program structure type */
  type: StateLIHTCType;

  /**
   * Percentage of federal credits (for piggyback/supplement)
   * Range: 0-100 for piggyback, varies for supplement
   */
  percent: number;

  /** Transferability mechanism */
  transferability: Transferability;

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

  // ========== IMPL-079: Program Enhancement Fields ==========

  /**
   * Credit duration in years (default: 10)
   * Most states mirror federal 10-year period, but some differ (e.g., NE is 6 years)
   */
  creditDurationYears?: number;

  /**
   * What the state credit calculates from
   * - federal_credit: Percentage of federal annual credit (piggyback)
   * - federal_eligible_basis: Percentage of federal eligible basis
   * - independent: Standalone allocation, not derived from federal
   */
  matchBasis?: 'federal_credit' | 'federal_eligible_basis' | 'independent';

  /**
   * When syndication must be structured
   * - before_allocation: Must structure before state allocates credits
   * - anytime: Can structure/transfer at any time
   * - at_pis: Must structure at placed-in-service
   */
  timingConstraint?: 'before_allocation' | 'anytime' | 'at_pis' | null;

  /**
   * Plain-language structuring guidance for deal teams
   * Includes timing requirements, transfer restrictions, buyer pool notes
   */
  structuringNotes?: string | null;
}

/**
 * Complete State Tax Profile
 *
 * Unified data structure containing all tax, OZ, and LIHTC information
 * for a single US state, territory, or district.
 *
 * @remarks
 * This interface is designed for easy extensibility. To add new fields:
 * 1. Add field to this interface with proper JSDoc
 * 2. Update stateProfiles.data.json with field data
 * 3. (Optional) Add utility function in stateProfiles.ts
 */
export interface StateTaxProfile {
  // ========== IDENTIFICATION ==========

  /** Two-letter jurisdiction code (e.g., 'NY', 'CA', 'PR') */
  code: string;

  /** Full jurisdiction name (e.g., 'New York', 'Puerto Rico') */
  name: string;

  /** Jurisdiction classification */
  type: JurisdictionType;

  // ========== TAX RATES & OZ CONFORMITY ==========

  /**
   * Top marginal income tax rate (%)
   * Range: 0-13.3%
   * Use 0 for no-income-tax states
   */
  topRate: number;

  /** Opportunity Zone conformity status */
  ozConformity: OzConformity;

  /**
   * Bonus depreciation conformity (%)
   * - 100: Full federal §168(k) conformity
   * - 0: No bonus depreciation allowed
   * - Partial: Percentage of federal allowed
   */
  bonusDepreciation: number;

  /** Legal authority citation for OZ conformity */
  ozAuthority: string;

  // ========== SPECIAL RULES ==========

  /**
   * Whether Net Investment Income Tax (NIIT) applies
   * Always false for territories (PR, VI, GU, MP, AS)
   */
  niitApplies: boolean;

  /**
   * Special rules or notes (e.g., "In-state OZ only", "Decoupled 2021")
   * Null if no special considerations
   */
  specialRules?: string | null;

  // ========== STATE LIHTC ==========

  /**
   * State LIHTC program details
   * Null if state has no State LIHTC program
   */
  stateLIHTC?: StateLIHTCProgram | null;

  // ========== HDC PRIORITY CLASSIFICATION ==========

  /**
   * HDC priority tier (1=highest, 3=lowest)
   * Null if not in HDC priority list
   */
  hdcTier?: HDCTier;

  /**
   * Combined federal + state LIHTC rate (%)
   * Pre-calculated for HDC priority states
   * Null if not applicable
   */
  combinedRate?: number | null;

  /**
   * State prevailing wage notes
   * Special PW requirements beyond federal
   */
  prevailingWageNotes?: string | null;

  // ========== METADATA ==========

  /** Last update date (ISO 8601 format) */
  lastUpdated: string;

  /** Tax year for rates and rules */
  taxYear: number;

  /** Reference URL to authoritative source */
  sourceUrl?: string | null;
}

/**
 * State Tax Profile Map
 *
 * Record mapping state codes to their complete tax profiles.
 * Enables O(1) lookups by jurisdiction code.
 *
 * @example
 * ```typescript
 * const profiles: StateTaxProfileMap = {
 *   'NY': { code: 'NY', name: 'New York', ... },
 *   'CA': { code: 'CA', name: 'California', ... }
 * };
 * ```
 */
export type StateTaxProfileMap = Record<string, StateTaxProfile>;

/**
 * Metadata about the state profiles dataset
 */
export interface StateProfilesMetadata {
  /** Dataset version (matches ADDENDUM version) */
  version: string;

  /** Last update date (ISO 8601 format) */
  lastUpdated: string;

  /** Source document reference */
  source: string;

  /** Total number of jurisdictions */
  jurisdictionCount: number;
}
