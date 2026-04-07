/**
 * Investor Tax Utilization Engine
 *
 * Implements the statutory limitation framework (§38(c), §469, §461(l)) that determines
 * how much of each benefit channel an investor can actually use, year by year.
 *
 * Per Investor Tax Utilization & Fund Architecture Spec v2.1, Sections 5.1–5.7
 *
 * This engine accepts a BenefitStream (from a single deal or aggregated pool) and
 * an InvestorProfile, producing year-by-year utilization analysis and recapture coverage.
 */

import { doesNIITApply } from './stateProfiles';

// =============================================================================
// Core Input Interfaces
// =============================================================================

/**
 * Exit event from a deal (single deal = one event, pool = multiple)
 */
export interface ExitEvent {
  year: number;                      // Year of exit (relative to benefit stream start)
  dealId?: string;                   // Optional deal identifier for pool scenarios
  exitProceeds: number;
  cumulativeDepreciation: number;
  recaptureExposure: number;         // cumulativeDepreciation × 25% (backward compat)
  appreciationGain: number;
  ozEnabled: boolean;
  // IMPL-095: Character-split fields from calculateExitTax()
  sec1245Recapture?: number;         // §1245 ordinary income recapture (cost seg / bonus)
  sec1250Recapture?: number;         // §1250 unrecaptured gain (straight-line)
}

/**
 * Benefit stream from a single deal or aggregated pool
 *
 * The engine doesn't know or care whether this comes from a single DBP or a pool.
 * It just processes arrays.
 */
export interface BenefitStream {
  annualDepreciation: number[];      // K-1 depreciation per year
  annualLIHTC: number[];             // Federal LIHTC credits per year
  annualStateLIHTC: number[];        // State LIHTC (direct use only, not syndicated)
  annualOperatingCF: number[];       // Operating cash flow per year
  exitEvents: ExitEvent[];           // One per deal (single deal = one event)
  grossEquity: number;               // Total equity before state LIHTC syndication offset
  netEquity: number;                 // Actual cash committed (grossEquity - syndicationOffset)
  syndicationOffset: number;         // State LIHTC proceeds that reduced equity at close
}

/**
 * Investor tax profile for utilization calculations
 */
export interface InvestorProfile {
  annualPassiveIncome: number;       // K-1 from funds, rental income, partnership business income
  annualPassiveOrdinaryIncome: number;  // IMPL-154: Ordinary-rate component of passive income
  annualPassiveLTCGIncome: number;      // IMPL-154: LTCG-rate component of passive income
  annualOrdinaryIncome: number;      // W-2, active business, board fees
  annualPortfolioIncome: number;     // Stock/crypto gains, dividends, interest
  filingStatus: 'MFJ' | 'Single' | 'HoH';
  investorTrack: 'rep' | 'non-rep';
  groupingElection: boolean;         // §469(c)(7)(A)(ii) election, REP only
  federalOrdinaryRate: number;       // Override rate or 0 for bracket calculation
  federalCapGainsRate: number;       // Capital gains rate (typically 20% + 3.8% NIIT)
  investorState: string;             // State code
  stateOrdinaryRate: number;
  stateCapGainsRate: number;
  investorEquity: number;            // $ committed (gross)
  rothAnnualConversion?: number;     // IMPL-120: Annual Roth conversion (Years 1-10 only, $0 in Years 11-12)

  // IMPL-152: Lifetime Coverage Mode inputs
  incomeMode?: 'annual' | 'lifetime';            // default 'annual' — preserves existing behavior
  lowIncomeEstimate?: number;                     // expected total income in a slow year ($)
  highIncomeEstimate?: number;                    // expected total income in a peak year ($)
  incomeDistribution?: 'conservative' | 'moderate' | 'optimistic'; // weights low vs high years

  // IMPL-157: AMT exposure flag (display-only — does not modify any calculation)
  // Set to true for investors with significant ISO exercises, private activity bond
  // portfolios, or other non-HDC AMT preference items. When true, platform surfaces
  // advisor note. §168(k) bonus depreciation creates no AMTI adjustment per §168(k)(2)(G).
  hasMaterialAmtExposure?: boolean;
}

/**
 * Treatment determination: nonpassive (REP + grouped) or passive (all others)
 */
export type EffectiveTreatment = 'nonpassive' | 'passive';

// =============================================================================
// Output Interfaces
// =============================================================================

/**
 * Year-by-year utilization breakdown
 */
export interface AnnualUtilization {
  year: number;

  // Depreciation
  depreciationGenerated: number;     // Raw K-1 depreciation for the year
  depreciationAllowed: number;       // After §461(l) or §469 limitation
  depreciationSuspended: number;     // Excess (suspended passive loss or to NOL)
  depreciationTaxSavings: number;    // Allowed × marginal rate

  // LIHTC Credits
  lihtcGenerated: number;            // Credits generated this year
  lihtcUsable: number;               // After §38(c) or §469 limitation
  lihtcCarried: number;              // Added to carry pool

  // Passive treatment only
  residualPassiveIncome: number;     // Passive income remaining after depreciation offset
  residualPassiveTax: number;        // Tax on residual passive income

  // IMPL-154: Character-split passive fields (passive track only)
  passiveOrdinaryIncome: number;     // Ordinary-rate component of passive income (in millions)
  passiveLTCGIncome: number;         // LTCG-rate component of passive income (in millions)
  effectivePassiveRate: number;      // Character-weighted effective rate
  passiveOrdinaryTaxCeiling: number; // Tax ceiling from ordinary passive component
  passiveLTCGTaxCeiling: number;     // Tax ceiling from LTCG passive component

  // Nonpassive treatment only (NOL tracking)
  nolGenerated: number;              // Excess business loss → NOL
  nolUsed: number;                   // NOL used this year
  nolPool: number;                   // Running NOL balance

  // Cumulative tracking
  cumulativeSuspendedLoss: number;   // Running total (passive)
  cumulativeCarriedCredits: number;  // Running total (nonpassive §39)
  cumulativeSuspendedCredits: number; // Running total (passive §469(b))

  // Summary
  totalBenefitGenerated: number;     // Depreciation value + LIHTC
  totalBenefitUsable: number;        // Tax savings + credits used
  utilizationRate: number;           // Usable / Generated
}

/**
 * Recapture coverage analysis at exit
 */
export interface RecaptureCoverage {
  exitYear: number;
  dealId?: string;
  recaptureExposure: number;         // Total recapture (§1245 + §1250)
  capitalGainsTax: number;           // Appreciation × CG rate
  totalExitTax: number;
  // IMPL-095: Character-split recapture fields
  sec1245Recapture?: number;         // §1245 ordinary income recapture (cost seg / bonus)
  sec1250Recapture?: number;         // §1250 unrecaptured gain (straight-line)

  // Offsets available
  releasedSuspendedLosses: number;   // §469(g) passive release
  releasedLossValue: number;         // Released losses × marginal rate
  availableCredits: number;          // Carried/suspended credits
  nolOffset: number;                 // NOL available (nonpassive only)
  nolOffsetValue: number;
  totalAvailableOffset: number;

  netExitExposure: number;           // max(0, totalExitTax - totalAvailableOffset)
  coverageRatio: number;             // totalAvailableOffset / totalExitTax

  // Rolling program
  rollingCoverageAvailable: boolean;
  estimatedNewDealCoverage: number;  // Year 1 bonus depreciation value from new deal
}

/**
 * NOL drawdown schedule entry (post-exit)
 */
export interface NOLDrawdownEntry {
  year: number;                      // Year post-exit (1, 2, 3, ...)
  nolUsed: number;
  nolRemaining: number;
}

/**
 * Complete tax utilization result
 */
export interface TaxUtilizationResult {
  treatment: EffectiveTreatment;
  treatmentLabel: string;            // e.g., "Non-REP — Passive Treatment"

  annualUtilization: AnnualUtilization[];
  recaptureCoverage: RecaptureCoverage[];

  // NOL drawdown (nonpassive only)
  nolDrawdownYears: number;          // Years post-exit to exhaust NOL pool
  nolDrawdownSchedule: NOLDrawdownEntry[];

  // Summary metrics
  totalDepreciationSavings: number;
  totalLIHTCUsed: number;
  totalBenefitGenerated: number;
  totalBenefitUsable: number;
  overallUtilizationRate: number;

  // Investor fit
  fitIndicator: 'green' | 'yellow' | 'red';
  fitExplanation: string;

  // Income/tax computation (for transparency)
  computedFederalTax: number;
  computedMarginalRate: number;
  incomeComputationUsed: boolean;    // true = bracket calc, false = flat rate fallback
}

// =============================================================================
// Constants
// =============================================================================

/**
 * 2025 Section 461(l) Excess Business Loss limits (indexed for inflation)
 */
export const SECTION_461L_LIMITS = {
  MFJ: 626_000,
  Single: 313_000,
  HoH: 313_000
} as const;

/**
 * 2025 Standard Deduction (OBBBA)
 */
export const STANDARD_DEDUCTION = {
  MFJ: 31_500,
  Single: 15_750,
  HoH: 23_625
} as const;

/**
 * 2025 Federal Tax Brackets (Rev. Proc. 2024-40)
 * Brackets are cumulative thresholds for MFJ
 */
export const TAX_BRACKETS_MFJ = [
  { threshold: 0, rate: 0.10 },
  { threshold: 23_850, rate: 0.12 },
  { threshold: 96_950, rate: 0.22 },
  { threshold: 206_700, rate: 0.24 },
  { threshold: 394_600, rate: 0.32 },
  { threshold: 501_050, rate: 0.35 },
  { threshold: 751_600, rate: 0.37 }
] as const;

/**
 * 2025 Federal Tax Brackets for Single (Rev. Proc. 2024-40)
 */
export const TAX_BRACKETS_SINGLE = [
  { threshold: 0, rate: 0.10 },
  { threshold: 11_925, rate: 0.12 },
  { threshold: 48_475, rate: 0.22 },
  { threshold: 103_350, rate: 0.24 },
  { threshold: 197_300, rate: 0.32 },
  { threshold: 250_525, rate: 0.35 },
  { threshold: 626_350, rate: 0.37 }
] as const;

/**
 * 2025 Federal Tax Brackets for Head of Household (Rev. Proc. 2024-40)
 */
export const TAX_BRACKETS_HOH = [
  { threshold: 0, rate: 0.10 },
  { threshold: 17_000, rate: 0.12 },
  { threshold: 64_850, rate: 0.22 },
  { threshold: 103_350, rate: 0.24 },
  { threshold: 197_300, rate: 0.32 },
  { threshold: 250_500, rate: 0.35 },
  { threshold: 626_350, rate: 0.37 }
] as const;

/**
 * AMT Constants — OBBBA 2026 (One Big Beautiful Bill Act, effective tax years beginning 2026)
 *
 * §38(c)(4)(B)(iii): LIHTC credits from buildings placed in service after December 31, 2007
 * are "specified credits" — tentative minimum tax is treated as zero by statute. AMT is
 * irrelevant to the LIHTC credit ceiling for all HDC properties.
 *
 * §168(k)(2)(G): Bonus depreciation creates no AMTI adjustment — the depreciation channel
 * is also unaffected by AMT.
 *
 * Currently unused in calculations — added for future AMT-aware analysis only.
 * These thresholds are relevant only for investors with non-HDC AMT preference items
 * (ISO exercises, private activity bonds, large SALT deductions).
 */
export const AMT_CONSTANTS_2026 = {
  exemptionMFJ: 137_000,             // Permanent, inflation-indexed
  exemptionSingle: 88_100,           // Permanent, inflation-indexed
  phaseoutThresholdMFJ: 1_000_000,   // Reset from $1,252,700 — inflation-indexed forward
  phaseoutThresholdSingle: 500_000,  // Reset from $626,350 — inflation-indexed forward
  phaseoutRate: 0.50,                // Doubled from 0.25 — effective 2026
  rate26PctCeilingMFJ: 239_100,      // Unchanged
  rate26PctCeilingSingle: 119_550,   // Unchanged
} as const;

// =============================================================================
// Treatment Determination (Task 2)
// =============================================================================

/**
 * Determine effective treatment based on investor track and grouping election
 *
 * Per Spec §5.1:
 * - REP + grouped = nonpassive (§461(l) caps depreciation, §38(c) caps credits)
 * - REP + ungrouped = passive (same as Non-REP)
 * - Non-REP = passive (always)
 */
export function determineTreatment(
  investorTrack: 'rep' | 'non-rep',
  groupingElection: boolean
): { treatment: EffectiveTreatment; label: string } {
  if (investorTrack === 'rep' && groupingElection) {
    return { treatment: 'nonpassive', label: 'REP — Nonpassive Treatment' };
  }
  if (investorTrack === 'rep' && !groupingElection) {
    return { treatment: 'passive', label: 'REP, HDC Ungrouped — Passive Treatment' };
  }
  return { treatment: 'passive', label: 'Non-REP — Passive Treatment' };
}

// =============================================================================
// Federal Tax Bracket Computation (Task 3)
// =============================================================================

/**
 * Get the appropriate tax brackets for a filing status
 */
function getTaxBrackets(filingStatus: 'MFJ' | 'Single' | 'HoH') {
  switch (filingStatus) {
    case 'MFJ':
      return TAX_BRACKETS_MFJ;
    case 'Single':
      return TAX_BRACKETS_SINGLE;
    case 'HoH':
      return TAX_BRACKETS_HOH;
    default:
      return TAX_BRACKETS_MFJ;
  }
}

/**
 * Compute federal tax liability from income composition
 *
 * Per Spec §5.2:
 * - Applies standard deduction based on filing status
 * - Computes progressive tax using 2025 brackets
 * - Tracks passive tax liability separately for §469 ceiling
 *
 * @returns Tax computation results including passive portion
 */
export function computeFederalTax(
  annualPassiveIncome: number,
  annualOrdinaryIncome: number,
  annualPortfolioIncome: number,
  filingStatus: 'MFJ' | 'Single' | 'HoH',
  annualPassiveOrdinaryIncome: number = 0,
  annualPassiveLTCGIncome: number = 0
): {
  grossIncome: number;
  taxableIncome: number;
  federalTaxLiability: number;
  passiveTaxLiability: number;      // Tax attributable to passive portion (sum of both characters)
  passiveOrdinaryTaxLiability: number;  // IMPL-154: Ordinary-rate passive tax
  passiveLTCGTaxLiability: number;      // IMPL-154: LTCG-rate passive tax
  marginalRate: number;
} {
  const grossIncome = annualPassiveIncome + annualOrdinaryIncome + annualPortfolioIncome;
  const standardDeduction = STANDARD_DEDUCTION[filingStatus];
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);

  const brackets = getTaxBrackets(filingStatus);

  // Compute progressive tax
  let federalTaxLiability = 0;
  let previousThreshold = 0;
  let marginalRate = 0.10; // Default to lowest bracket

  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    const nextThreshold = i < brackets.length - 1 ? brackets[i + 1].threshold : Infinity;

    if (taxableIncome > bracket.threshold) {
      const taxableInBracket = Math.min(taxableIncome, nextThreshold) - bracket.threshold;
      federalTaxLiability += taxableInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }
    previousThreshold = bracket.threshold;
  }

  // IMPL-154: Character-split passive tax liability
  // Backward compat: if both character fields are 0 and annualPassiveIncome > 0,
  // treat all passive as ordinary (proportional allocation, same as before)
  const hasCharacterSplit = annualPassiveOrdinaryIncome > 0 || annualPassiveLTCGIncome > 0;

  let passiveOrdinaryTaxLiability: number;
  let passiveLTCGTaxLiability: number;
  let passiveTaxLiability: number;

  if (hasCharacterSplit) {
    // Character-aware: ordinary portion at marginal rate, LTCG at cap gains rate (20%)
    passiveOrdinaryTaxLiability = annualPassiveOrdinaryIncome * marginalRate;
    passiveLTCGTaxLiability = annualPassiveLTCGIncome * 0.20; // 20% LTCG rate (NIIT added separately)
    passiveTaxLiability = passiveOrdinaryTaxLiability + passiveLTCGTaxLiability;
  } else {
    // Legacy path: proportional allocation (all passive at blended rate)
    const passiveProportion = grossIncome > 0 ? annualPassiveIncome / grossIncome : 0;
    passiveTaxLiability = federalTaxLiability * passiveProportion;
    passiveOrdinaryTaxLiability = passiveTaxLiability; // All treated as ordinary
    passiveLTCGTaxLiability = 0;
  }

  return {
    grossIncome,
    taxableIncome,
    federalTaxLiability,
    passiveTaxLiability,
    passiveOrdinaryTaxLiability,
    passiveLTCGTaxLiability,
    marginalRate
  };
}

// =============================================================================
// Depreciation Utilization (Task 4)
// =============================================================================

/**
 * Compute depreciation utilization for a single year - Nonpassive Treatment
 *
 * Per Spec §5.3.1 (REP + Grouped):
 * - §461(l) excess business loss limitation applies
 * - Allowed deduction = min(depreciation, EBL threshold)
 * - Excess becomes NOL carryforward
 */
function computeDepreciationNonpassive(
  depreciation: number,
  filingStatus: 'MFJ' | 'Single' | 'HoH',
  marginalRate: number,
  previousNolPool: number,
  taxableIncome: number,
  federalTaxLiability: number
): {
  depreciationAllowed: number;
  depreciationSuspended: number;
  depreciationTaxSavings: number;
  nolGenerated: number;
  nolUsed: number;
  nolPool: number;
} {
  // Convert EBL threshold from dollars to millions to match depreciation units
  // W-2 wages excluded from §461(l)(3)(A)(i) business income per CARES Act
  // technical correction and JCT Blue Book (JCS-1-18). Flat statutory cap applies.
  const eblThresholdInMillions = SECTION_461L_LIMITS[filingStatus] / 1_000_000;

  // §461(l): Cap deduction at EBL threshold
  const depreciationAllowed = Math.min(depreciation, eblThresholdInMillions);
  const excessBusinessLoss = Math.max(0, depreciation - eblThresholdInMillions);

  // Excess becomes NOL (carried forward)
  const nolGenerated = excessBusinessLoss;

  // Tax savings from allowed depreciation, capped at actual tax liability
  // IMPL-122: Cannot save more tax than owed — cap at federalTaxLiability (converted to millions)
  const rawDepSavings = depreciationAllowed * marginalRate;
  const depreciationTaxSavings = Math.min(rawDepSavings, federalTaxLiability / 1_000_000);

  // NOL utilization: 80% of remaining taxable income after deduction
  // Convert taxableIncome from dollars to millions to match depreciation units
  const taxableIncomeInMillions = taxableIncome / 1_000_000;
  const incomeAfterDeduction = Math.max(0, taxableIncomeInMillions - depreciationAllowed);
  const nolUsableLimit = incomeAfterDeduction * 0.80;
  const totalNolAvailable = previousNolPool + nolGenerated;
  const nolUsed = Math.min(totalNolAvailable, nolUsableLimit);
  const nolPool = totalNolAvailable - nolUsed;

  return {
    depreciationAllowed,
    depreciationSuspended: nolGenerated, // For nonpassive, "suspended" = NOL
    depreciationTaxSavings,
    nolGenerated,
    nolUsed,
    nolPool
  };
}

/**
 * Compute depreciation utilization for a single year - Passive Treatment
 *
 * Per Spec §5.3.2 (Non-REP or REP Ungrouped):
 * - §469 passive activity limitation applies
 * - Allowed loss = min(depreciation, passive income)
 * - Excess is suspended (carried forward under §469)
 *
 * IMPL-154: Character-weighted effective rate
 * If passive income has both ordinary and LTCG components, the effective rate
 * is the weighted average: (ordinary × ordinaryRate + LTCG × ltcgRate) / total.
 * For backward compat (both character fields = 0), uses marginalRate (= 40.8%).
 */
function computeDepreciationPassive(
  depreciation: number,
  annualPassiveIncome: number,
  marginalRate: number,
  previousSuspendedLoss: number,
  passiveOrdinaryIncome: number = 0,
  passiveLTCGIncome: number = 0,
  ltcgRate: number = 0
): {
  depreciationAllowed: number;
  depreciationSuspended: number;
  depreciationTaxSavings: number;
  residualPassiveIncome: number;
  residualPassiveTax: number;
  cumulativeSuspendedLoss: number;
  effectivePassiveRate: number;
} {
  // §469: Passive losses can only offset passive income
  const depreciationAllowed = Math.min(depreciation, annualPassiveIncome);
  const suspendedLoss = Math.max(0, depreciation - annualPassiveIncome);

  // IMPL-154: Character-weighted effective rate
  const hasCharacterSplit = passiveOrdinaryIncome > 0 || passiveLTCGIncome > 0;
  let effectivePassiveRate: number;

  if (hasCharacterSplit && annualPassiveIncome > 0) {
    // Weighted average: (ordinary × ordinaryRate + LTCG × ltcgRate) / total
    effectivePassiveRate =
      (passiveOrdinaryIncome * marginalRate + passiveLTCGIncome * ltcgRate)
      / annualPassiveIncome;
  } else {
    // Legacy path: uniform marginalRate (includes NIIT for passive)
    effectivePassiveRate = marginalRate;
  }

  // Tax savings from allowed depreciation
  const depreciationTaxSavings = depreciationAllowed * effectivePassiveRate;

  // Residual passive income after depreciation offset
  const residualPassiveIncome = Math.max(0, annualPassiveIncome - depreciation);
  const residualPassiveTax = residualPassiveIncome * effectivePassiveRate;

  // Cumulative suspended loss
  const cumulativeSuspendedLoss = previousSuspendedLoss + suspendedLoss;

  return {
    depreciationAllowed,
    depreciationSuspended: suspendedLoss,
    depreciationTaxSavings,
    residualPassiveIncome,
    residualPassiveTax,
    cumulativeSuspendedLoss,
    effectivePassiveRate
  };
}

// =============================================================================
// LIHTC Credit Utilization (Task 5)
// =============================================================================

/**
 * Compute LIHTC credit utilization for a single year - Nonpassive Treatment
 *
 * Per Spec §5.4.1:
 * - §38(c) general business credit limitation applies
 * - Limit = 75% × (tax after depreciation) + $6,250
 * - Unused credits carry forward under §39 (1 back, 20 forward)
 */
function computeLIHTCNonpassive(
  lihtcGenerated: number,
  federalTaxLiability: number,
  depreciationTaxSavings: number,
  previousCarriedCredits: number
): {
  lihtcUsable: number;
  lihtcCarried: number;
  cumulativeCarriedCredits: number;
} {
  // IMPL-122: Convert federalTaxLiability (dollars) to millions for consistent units
  // lihtcGenerated and depreciationTaxSavings are already in millions
  const taxLiabilityInMillions = federalTaxLiability / 1_000_000;

  // Tax remaining after depreciation deduction (both in millions)
  const taxAfterDepreciation = Math.max(0, taxLiabilityInMillions - depreciationTaxSavings);

  // §38(c) limitation: 75% of net income tax + $6,250 (converted to millions)
  const sec38cLimit = 0.75 * taxAfterDepreciation + 6_250 / 1_000_000;

  // Available credits = generated + carryforward
  const totalAvailable = lihtcGenerated + previousCarriedCredits;

  // Usable = min(available, §38(c) limit)
  const lihtcUsable = Math.min(totalAvailable, sec38cLimit);

  // Excess carries forward
  const lihtcCarried = totalAvailable - lihtcUsable;

  return {
    lihtcUsable,
    lihtcCarried,
    cumulativeCarriedCredits: lihtcCarried
  };
}

/**
 * Compute LIHTC credit utilization for a single year - Passive Treatment
 *
 * Per Spec §5.4.2:
 * - §469 passive credit limitation applies
 * - Credits can only offset tax on passive income
 * - Unused credits suspended under §469(b) (indefinite carryforward)
 */
function computeLIHTCPassive(
  lihtcGenerated: number,
  residualPassiveTax: number,
  previousSuspendedCredits: number
): {
  lihtcUsable: number;
  lihtcCarried: number;
  cumulativeSuspendedCredits: number;
} {
  // Available credits = generated + suspended carryforward
  const totalAvailable = lihtcGenerated + previousSuspendedCredits;

  // §469: Credits can only offset tax on passive income
  const lihtcUsable = Math.min(totalAvailable, residualPassiveTax);

  // Excess is suspended (§469(b) indefinite carryforward)
  const lihtcCarried = totalAvailable - lihtcUsable;

  return {
    lihtcUsable,
    lihtcCarried,
    cumulativeSuspendedCredits: lihtcCarried
  };
}

// =============================================================================
// NOL Post-Exit Drawdown (Task 6)
// =============================================================================

/**
 * Compute post-exit NOL drawdown schedule
 *
 * Per Spec §5.5:
 * - After exit, NOL pool draws down against future taxable income
 * - 80% limitation applies (TCJA)
 * - Returns years to exhaust and schedule
 */
export function computeNOLDrawdown(
  nolPoolAtExit: number,
  annualTaxableIncome: number
): {
  nolDrawdownYears: number;
  nolDrawdownSchedule: NOLDrawdownEntry[];
} {
  if (nolPoolAtExit <= 0 || annualTaxableIncome <= 0) {
    return {
      nolDrawdownYears: 0,
      nolDrawdownSchedule: []
    };
  }

  const schedule: NOLDrawdownEntry[] = [];
  let remainingNol = nolPoolAtExit;
  let year = 1;

  // 80% of taxable income can be offset by NOL each year
  const annualNolLimit = annualTaxableIncome * 0.80;

  while (remainingNol > 0 && year <= 50) { // Cap at 50 years to prevent infinite loop
    const nolUsed = Math.min(remainingNol, annualNolLimit);
    remainingNol -= nolUsed;

    schedule.push({
      year,
      nolUsed,
      nolRemaining: remainingNol
    });

    year++;
  }

  return {
    nolDrawdownYears: schedule.length,
    nolDrawdownSchedule: schedule
  };
}

// =============================================================================
// Main Engine Function (Task 8)
// =============================================================================

/**
 * Calculate comprehensive tax utilization analysis
 *
 * This is the main engine function that orchestrates all components:
 * 1. Determine treatment (nonpassive vs passive)
 * 2. Compute federal tax (if income composition provided)
 * 3. Year-by-year depreciation utilization
 * 4. Year-by-year LIHTC credit utilization
 * 5. NOL tracking (nonpassive) or suspended loss tracking (passive)
 * 6. Recapture coverage analysis
 * 7. Summary metrics and fit indicator
 *
 * @param benefitStream - Benefit stream from deal or pool
 * @param investorProfile - Investor tax profile
 * @returns Complete tax utilization analysis
 */
export function calculateTaxUtilization(
  benefitStream: BenefitStream,
  investorProfile: InvestorProfile
): TaxUtilizationResult {
  // Step 1: Determine treatment
  const { treatment, label: treatmentLabel } = determineTreatment(
    investorProfile.investorTrack,
    investorProfile.groupingElection
  );

  // Step 2: Compute federal tax (if income composition provided)
  // IMPL-120: Roth conversion income applies only in Years 1-10
  const rothConversion = investorProfile.rothAnnualConversion ?? 0;
  const hasIncomeComposition =
    investorProfile.annualPassiveIncome > 0 ||
    investorProfile.annualOrdinaryIncome > 0 ||
    investorProfile.annualPortfolioIncome > 0;

  let taxComputation = {
    grossIncome: 0,
    taxableIncome: 0,
    federalTaxLiability: 0,
    passiveTaxLiability: 0,
    passiveOrdinaryTaxLiability: 0,
    passiveLTCGTaxLiability: 0,
    marginalRate: investorProfile.federalOrdinaryRate / 100
  };
  // IMPL-120: Base tax computation without Roth (for Years 11-12)
  let baseTaxComputation = taxComputation;
  let incomeComputationUsed = false;

  if (hasIncomeComposition) {
    // Tax computation includes Roth conversion income (used for Years 1-10)
    taxComputation = computeFederalTax(
      investorProfile.annualPassiveIncome,
      investorProfile.annualOrdinaryIncome,
      investorProfile.annualPortfolioIncome,
      investorProfile.filingStatus,
      investorProfile.annualPassiveOrdinaryIncome,
      investorProfile.annualPassiveLTCGIncome
    );
    incomeComputationUsed = true;

    // IMPL-120: Compute base tax without Roth for Years 11-12
    if (rothConversion > 0) {
      baseTaxComputation = computeFederalTax(
        investorProfile.annualPassiveIncome,
        investorProfile.annualOrdinaryIncome - rothConversion,
        investorProfile.annualPortfolioIncome,
        investorProfile.filingStatus,
        investorProfile.annualPassiveOrdinaryIncome,
        investorProfile.annualPassiveLTCGIncome
      );
    } else {
      baseTaxComputation = taxComputation;
    }
  } else if (investorProfile.federalOrdinaryRate > 0) {
    // Fallback to flat rate (backward compatibility)
    taxComputation.marginalRate = investorProfile.federalOrdinaryRate / 100;
    baseTaxComputation = taxComputation;
  }

  const marginalRate = taxComputation.marginalRate;

  // IMPL-121: NIIT-aware marginal rate for passive depreciation
  // IRC §1411: 3.8% surcharge applies to passive investors (rep_ungrouped, non-rep)
  // but not REP+grouped (nonpassive) or territory residents (PR, GU, VI, AS, MP)
  const niitSurcharge = (treatment === 'passive' && doesNIITApply(investorProfile.investorState))
    ? 0.038
    : 0;
  const passiveMarginalRate = marginalRate + niitSurcharge;

  // Step 3-5: Year-by-year utilization
  const annualUtilization: AnnualUtilization[] = [];
  const holdPeriod = benefitStream.annualDepreciation.length;

  // Running totals
  let cumulativeSuspendedLoss = 0;
  let cumulativeCarriedCredits = 0;
  let cumulativeSuspendedCredits = 0;
  let nolPool = 0;

  let totalDepreciationSavings = 0;
  let totalLIHTCUsed = 0;
  let totalBenefitGenerated = 0;
  let totalBenefitUsable = 0;

  for (let yearIndex = 0; yearIndex < holdPeriod; yearIndex++) {
    const year = yearIndex + 1;
    const depreciation = benefitStream.annualDepreciation[yearIndex] || 0;
    const lihtcGenerated = benefitStream.annualLIHTC[yearIndex] || 0;

    // IMPL-120: Use Roth-inclusive tax for Years 1-10, base tax for Years 11+
    const yearTax = (rothConversion > 0 && yearIndex >= 10)
      ? baseTaxComputation
      : taxComputation;
    const yearMarginalRate = yearTax.marginalRate;
    // IMPL-121: NIIT-aware rate for passive depreciation path
    const yearPassiveMarginalRate = yearMarginalRate + niitSurcharge;

    let depResult: ReturnType<typeof computeDepreciationNonpassive | typeof computeDepreciationPassive>;
    let lihtcResult: ReturnType<typeof computeLIHTCNonpassive | typeof computeLIHTCPassive>;
    let residualPassiveIncome = 0;
    let residualPassiveTax = 0;
    let nolGenerated = 0;
    let nolUsed = 0;
    // IMPL-154: Character-split passive fields
    let yearPassiveOrdinaryIncome = 0;
    let yearPassiveLTCGIncome = 0;
    let yearEffectivePassiveRate = 0;
    let yearPassiveOrdinaryTaxCeiling = 0;
    let yearPassiveLTCGTaxCeiling = 0;

    if (treatment === 'nonpassive') {
      // Nonpassive path: §461(l) + §38(c)
      const depNonpassive = computeDepreciationNonpassive(
        depreciation,
        investorProfile.filingStatus,
        yearMarginalRate,
        nolPool,
        yearTax.taxableIncome,
        yearTax.federalTaxLiability
      );
      depResult = depNonpassive;
      nolGenerated = depNonpassive.nolGenerated;
      nolUsed = depNonpassive.nolUsed;
      nolPool = depNonpassive.nolPool;

      // IMPL-144: NOL consumed this year reduces net income tax for §38(c) ceiling
      // nolUsed is in millions, yearMarginalRate is decimal — convert to dollars
      const nolTaxReductionDollars = depNonpassive.nolUsed * yearMarginalRate * 1_000_000;
      const taxLiabilityAfterNOL = Math.max(0, yearTax.federalTaxLiability - nolTaxReductionDollars);

      lihtcResult = computeLIHTCNonpassive(
        lihtcGenerated,
        taxLiabilityAfterNOL,
        depNonpassive.depreciationTaxSavings,
        cumulativeCarriedCredits
      );
      cumulativeCarriedCredits = lihtcResult.cumulativeCarriedCredits;
    } else {
      // Passive path: §469
      // Convert passive income from dollars to millions to match depreciation units
      const passiveIncomeInMillions = investorProfile.annualPassiveIncome / 1_000_000;
      // IMPL-154: Character-split passive income (in millions)
      const passiveOrdInMillions = investorProfile.annualPassiveOrdinaryIncome / 1_000_000;
      const passiveLTCGInMillions = investorProfile.annualPassiveLTCGIncome / 1_000_000;
      // LTCG rate for passive: 20% cap gains + NIIT surcharge
      const passiveLTCGRate = 0.20 + niitSurcharge;
      const depPassive = computeDepreciationPassive(
        depreciation,
        passiveIncomeInMillions,
        yearPassiveMarginalRate,
        cumulativeSuspendedLoss,
        passiveOrdInMillions,
        passiveLTCGInMillions,
        passiveLTCGRate
      );
      depResult = depPassive;
      cumulativeSuspendedLoss = depPassive.cumulativeSuspendedLoss;
      residualPassiveIncome = depPassive.residualPassiveIncome;
      residualPassiveTax = depPassive.residualPassiveTax;

      // IMPL-154: Populate character-split passive fields
      yearPassiveOrdinaryIncome = passiveOrdInMillions;
      yearPassiveLTCGIncome = passiveLTCGInMillions;
      yearEffectivePassiveRate = depPassive.effectivePassiveRate;
      yearPassiveOrdinaryTaxCeiling = passiveOrdInMillions * yearPassiveMarginalRate;
      yearPassiveLTCGTaxCeiling = passiveLTCGInMillions * passiveLTCGRate;

      lihtcResult = computeLIHTCPassive(
        lihtcGenerated,
        residualPassiveTax,
        cumulativeSuspendedCredits
      );
      cumulativeSuspendedCredits = lihtcResult.cumulativeSuspendedCredits;
    }

    // Compute benefits (use character-weighted rate when available, else NIIT-aware rate)
    const effectiveRate = treatment === 'passive'
      ? (yearEffectivePassiveRate > 0 ? yearEffectivePassiveRate : yearPassiveMarginalRate)
      : yearMarginalRate;
    const depreciationValue = depreciation * effectiveRate;
    const benefitGenerated = depreciationValue + lihtcGenerated;
    const benefitUsable = depResult.depreciationTaxSavings + lihtcResult.lihtcUsable;
    const utilizationRate = benefitGenerated > 0 ? benefitUsable / benefitGenerated : 0;

    // Accumulate totals
    totalDepreciationSavings += depResult.depreciationTaxSavings;
    totalLIHTCUsed += lihtcResult.lihtcUsable;
    totalBenefitGenerated += benefitGenerated;
    totalBenefitUsable += benefitUsable;

    annualUtilization.push({
      year,
      depreciationGenerated: depreciation,
      depreciationAllowed: depResult.depreciationAllowed,
      depreciationSuspended: depResult.depreciationSuspended,
      depreciationTaxSavings: depResult.depreciationTaxSavings,
      lihtcGenerated,
      lihtcUsable: lihtcResult.lihtcUsable,
      lihtcCarried: lihtcResult.lihtcCarried,
      residualPassiveIncome,
      residualPassiveTax,
      // IMPL-154: Character-split passive fields
      passiveOrdinaryIncome: yearPassiveOrdinaryIncome,
      passiveLTCGIncome: yearPassiveLTCGIncome,
      effectivePassiveRate: yearEffectivePassiveRate,
      passiveOrdinaryTaxCeiling: yearPassiveOrdinaryTaxCeiling,
      passiveLTCGTaxCeiling: yearPassiveLTCGTaxCeiling,
      nolGenerated,
      nolUsed,
      nolPool,
      cumulativeSuspendedLoss,
      cumulativeCarriedCredits,
      cumulativeSuspendedCredits,
      totalBenefitGenerated: benefitGenerated,
      totalBenefitUsable: benefitUsable,
      utilizationRate
    });
  }

  // Step 6: Recapture coverage analysis (import from recaptureCoverage.ts)
  const recaptureCoverage = computeRecaptureCoverageInternal(
    benefitStream.exitEvents,
    treatment,
    cumulativeSuspendedLoss,
    cumulativeCarriedCredits,
    cumulativeSuspendedCredits,
    nolPool,
    treatment === 'passive' ? passiveMarginalRate : marginalRate,
    investorProfile.federalCapGainsRate
  );

  // Step 7: NOL drawdown (nonpassive only)
  let nolDrawdownYears = 0;
  let nolDrawdownSchedule: NOLDrawdownEntry[] = [];

  if (treatment === 'nonpassive' && nolPool > 0) {
    const drawdown = computeNOLDrawdown(nolPool, taxComputation.taxableIncome);
    nolDrawdownYears = drawdown.nolDrawdownYears;
    nolDrawdownSchedule = drawdown.nolDrawdownSchedule;
  }

  // Step 8: Summary metrics
  const overallUtilizationRate = totalBenefitGenerated > 0
    ? totalBenefitUsable / totalBenefitGenerated
    : 0;

  // Step 9: Fit indicator
  let fitIndicator: 'green' | 'yellow' | 'red';
  let fitExplanation: string;

  if (overallUtilizationRate >= 0.70) {
    fitIndicator = 'green';
    fitExplanation = `Strong fit: ${(overallUtilizationRate * 100).toFixed(0)}% of benefits utilized. Investor profile aligns well with deal structure.`;
  } else if (overallUtilizationRate >= 0.30) {
    fitIndicator = 'yellow';
    fitExplanation = `Moderate fit: ${(overallUtilizationRate * 100).toFixed(0)}% of benefits utilized. Consider income composition or investment sizing adjustments.`;
  } else {
    fitIndicator = 'red';
    fitExplanation = `Review recommended: Only ${(overallUtilizationRate * 100).toFixed(0)}% of benefits utilized. Investor profile may not be optimal for this investment structure.`;
  }

  return {
    treatment,
    treatmentLabel,
    annualUtilization,
    recaptureCoverage,
    nolDrawdownYears,
    nolDrawdownSchedule,
    totalDepreciationSavings,
    totalLIHTCUsed,
    totalBenefitGenerated,
    totalBenefitUsable,
    overallUtilizationRate,
    fitIndicator,
    fitExplanation,
    computedFederalTax: taxComputation.federalTaxLiability,
    computedMarginalRate: marginalRate,
    incomeComputationUsed
  };
}

// =============================================================================
// Recapture Coverage (Internal - moved from Task 7)
// =============================================================================

/**
 * Internal recapture coverage computation
 * Per Spec §5.6
 */
function computeRecaptureCoverageInternal(
  exitEvents: ExitEvent[],
  treatment: EffectiveTreatment,
  cumulativeSuspendedLoss: number,
  cumulativeCarriedCredits: number,
  cumulativeSuspendedCredits: number,
  nolPool: number,
  marginalRate: number,
  capitalGainsRate: number
): RecaptureCoverage[] {
  return exitEvents.map(exitEvent => {
    // OZ deals: no recapture or capital gains tax
    const recaptureExposure = exitEvent.ozEnabled ? 0 : exitEvent.recaptureExposure;
    const capitalGainsTax = exitEvent.ozEnabled ? 0 : exitEvent.appreciationGain * capitalGainsRate;
    const totalExitTax = recaptureExposure + capitalGainsTax;

    let releasedSuspendedLosses = 0;
    let releasedLossValue = 0;
    let availableCredits = 0;
    let nolOffset = 0;
    let nolOffsetValue = 0;

    if (treatment === 'passive') {
      // §469(g): Full taxable disposition releases all suspended losses
      releasedSuspendedLosses = cumulativeSuspendedLoss;
      releasedLossValue = releasedSuspendedLosses * marginalRate;

      // §469(b): Suspended credits can offset passive tax from disposition gain
      availableCredits = cumulativeSuspendedCredits;
    } else {
      // Nonpassive: §39 carried credits + NOL
      availableCredits = cumulativeCarriedCredits;

      // NOL offset (80% limit on exit gain)
      const nolOffsetLimit = totalExitTax * 0.80;
      nolOffset = Math.min(nolPool, nolOffsetLimit);
      nolOffsetValue = nolOffset * marginalRate;
    }

    const totalAvailableOffset = releasedLossValue + availableCredits + nolOffsetValue;
    const netExitExposure = Math.max(0, totalExitTax - totalAvailableOffset);
    const coverageRatio = totalExitTax > 0 ? totalAvailableOffset / totalExitTax : 1;

    // Rolling program: estimate coverage from new deal Year 1 bonus depreciation
    // Assume 20% cost seg on ~$50M basis = $10M depreciation = ~$3.7M tax value
    const estimatedNewDealBasis = 50_000_000;
    const estimatedNewDealCoverage = estimatedNewDealBasis * 0.20 * marginalRate;
    const rollingCoverageAvailable = netExitExposure > 0;

    return {
      exitYear: exitEvent.year,
      dealId: exitEvent.dealId,
      recaptureExposure,
      capitalGainsTax,
      totalExitTax,
      // IMPL-095: Character-split recapture from ExitEvent
      sec1245Recapture: exitEvent.sec1245Recapture,
      sec1250Recapture: exitEvent.sec1250Recapture,
      releasedSuspendedLosses,
      releasedLossValue,
      availableCredits,
      nolOffset,
      nolOffsetValue,
      totalAvailableOffset,
      netExitExposure,
      coverageRatio,
      rollingCoverageAvailable,
      estimatedNewDealCoverage
    };
  });
}

// =============================================================================
// Filing Status Mapping Helper
// =============================================================================

/**
 * Map existing codebase filing status to engine filing status
 */
export function mapFilingStatus(filingStatus?: 'single' | 'married' | 'HoH'): 'MFJ' | 'Single' | 'HoH' {
  switch (filingStatus) {
    case 'married':
      return 'MFJ';
    case 'single':
      return 'Single';
    case 'HoH':
      return 'HoH';
    default:
      return 'MFJ'; // Default to MFJ for backward compatibility
  }
}
