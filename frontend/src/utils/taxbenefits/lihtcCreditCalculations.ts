/**
 * LIHTC (Low-Income Housing Tax Credit) Calculation Module
 *
 * Implements federal LIHTC credit mechanics with:
 * - 10-year credit period with Year 1 PIS proration
 * - Year 11 catch-up to ensure total = 10 × annual credit
 * - DDA/QCT 130% basis boost support
 * - Extensible architecture for state LIHTC integration (IMPL-7.0-003)
 *
 * @version 7.0.0
 * @date 2025-12-16
 * @task IMPL-7.0-005
 */

/**
 * Deal type classification controlling occupancy ramp behavior in LIHTC
 * applicable fraction computation.
 *
 * - 'acquisition': Pre-PIS purchase of stabilized building. Units already occupied.
 *   Occupancy ramp is bypassed. effectiveYear1AF = stabilizedApplicableFraction.
 *   Fund 1 default (Trace 4001, 701 S Jackson).
 *
 * - 'acquisition_rehab': Future use. Acquisition + significant rehabilitation.
 *   Tack-back rule applies (credits start later of acquisition date or Jan 1 of
 *   rehab completion year). Not implemented in Fund 1.
 *
 * - 'new_construction': Ground-up development. Occupancy ramp applies via
 *   LeaseUpRampInput. Reserved for future deals beyond Fund 1.
 */
export type DealType = 'acquisition' | 'acquisition_rehab' | 'new_construction';

/**
 * Input to the Year 1 occupancy ramp computation. Two paths:
 *
 * Linear ramp (Fund 1 implementation):
 *   Provide { leaseUpMonths } — the function computes a linear ramp from 0
 *   to stabilizedApplicableFraction over leaseUpMonths, then averages across
 *   months-in-service in credit Year 1.
 *
 * Caller-supplied array (future proforma engine hookup):
 *   Provide { monthlyOccupancyFractions } — an array of monthly applicable
 *   fractions (0.0–1.0) indexed from month 1 of the credit period. The function
 *   averages the first monthsInServiceYear1 values directly.
 *
 * NOTE: The proforma engine's lease-up S-curve is used for sizing the lease-up
 * reserve (financial modeling) — a separate purpose from LIHTC applicable fraction
 * computation. Do not conflate the two. The monthlyOccupancyFractions path is the
 * future hookup point for any occupancy curve (S-curve or otherwise) once the
 * proforma engine ships as callable TypeScript.
 */
export type LeaseUpRampInput =
  | { leaseUpMonths: number }
  | { monthlyOccupancyFractions: number[] };

/**
 * Represents a single year's LIHTC credit allocation.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 3.04 = $3,040,000).
 * See docs/CONVENTIONS.md for details.
 */
export interface YearlyCredit {
  /** Year number (1-11) */
  year: number;

  /** Credit amount for this year in millions (e.g., 3.04 = $3,040,000) */
  creditAmount: number;

  /** Proration factor (1.0 for full years, < 1.0 for Year 1) */
  prorationFactor: number;

  /** Human-readable description */
  description: string;
}

/**
 * Metadata about the LIHTC calculation.
 *
 * IMPORTANT: Monetary values are in MILLIONS. See docs/CONVENTIONS.md.
 */
export interface LIHTCMetadata {
  /** Qualified basis after all adjustments in millions */
  qualifiedBasis: number;

  /** DDA/QCT boost multiplier (1.0 or 1.3) */
  boostMultiplier: number;

  /** Placed-in-Service month (1-12) */
  pisMonth: number;

  /** Months in service during Year 1 */
  monthsInServiceYear1: number;

  /** Year 1 proration factor */
  year1ProrationFactor: number;

  /** Credit rate (typically 4% or 9%) */
  creditRate: number;

  /**
   * Stabilized applicable fraction — percentage of qualified low-income units (0.0–1.0).
   * Used for Years 2–10 of the credit period and as the Year 1 fraction for acquisition
   * and acquisition_rehab deals where units are already occupied.
   * For new_construction, Year 1 uses effectiveYear1ApplicableFraction (computed from
   * the LeaseUpRampInput).
   * NOT 0–100; must be a decimal (e.g., 1.0 for 100%).
   */
  stabilizedApplicableFraction: number;

  /**
   * Effective applicable fraction for Year 1, accounting for lease-up ramp.
   * For acquisition deals: equals stabilizedApplicableFraction (ramp bypassed).
   * For new_construction with linear ramp: average of monthly fractions across
   * months-in-service computed from leaseUpMonths parameter.
   * For new_construction with caller-supplied array: average of provided fractions
   * across months-in-service.
   * This is the value actually used to compute Year 1 qualified basis and credits.
   */
  effectiveYear1ApplicableFraction: number;

  /** Deal type used in this calculation. */
  dealType: DealType;
}

/**
 * Complete LIHTC credit schedule over 11-year period.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 3.04 = $3,040,000).
 * See docs/CONVENTIONS.md for details.
 */
export interface LIHTCCreditSchedule {
  /** Annual credit amount (full year) in millions */
  annualCredit: number;

  /** Year 1 credit (prorated by PIS month) in millions */
  year1Credit: number;

  /** Credit amount for Years 2-10 (each year) in millions */
  years2to10Credit: number;

  /** Year 11 catch-up credit in millions */
  year11Credit: number;

  /** Total credits over all years in millions (always = 10 × annualCredit) */
  totalCredits: number;

  /** Year-by-year breakdown */
  yearlyBreakdown: YearlyCredit[];

  /** Calculation metadata */
  metadata: LIHTCMetadata;

  /**
   * True when a new_construction deal has a lease-up period extending beyond the
   * months-in-service in Year 1, meaning some units may remain unoccupied at
   * December 31 of the first credit year. Units not leased by that date receive
   * credits over 15 years instead of 10 (IRC §42(f)(3)).
   *
   * When true, the §42(f)(1) election is strongly recommended — it defers the
   * credit start year by one, giving until December 31 of the year after PIS
   * to reach full occupancy, and eliminates all §42(f)(3) exposure.
   *
   * Always false for acquisition and acquisition_rehab deal types.
   * Always false when the §42(f)(1) election is applied.
   */
  section42f3PenaltyRisk: boolean;
}

/**
 * Input parameters for LIHTC calculation.
 *
 * IMPORTANT: Monetary values are in MILLIONS. See docs/CONVENTIONS.md.
 */
export interface LIHTCCalculationParams {
  /** Total eligible basis in millions (e.g., 90 = $90M) */
  eligibleBasis: number;

  /**
   * Stabilized applicable fraction — percentage of qualified low-income units (0.0–1.0).
   * Used for Years 2–10 of the credit period and as the Year 1 fraction for acquisition
   * and acquisition_rehab deals where units are already occupied.
   * For new_construction, Year 1 uses effectiveYear1ApplicableFraction (computed from
   * the LeaseUpRampInput).
   * NOT 0–100; must be a decimal (e.g., 1.0 for 100%).
   */
  stabilizedApplicableFraction: number;

  /** Whether DDA/QCT 130% boost applies */
  ddaQctBoost: boolean;

  /** Placed-in-Service month (1 = January, 12 = December) */
  pisMonth: number;

  /** LIHTC credit rate (typically 0.04 or 0.09) */
  creditRate: number;

  /**
   * Deal type classification. Controls whether the occupancy ramp is applied.
   * Defaults to 'acquisition' if not provided — safe default for Fund 1.
   */
  dealType?: DealType;

  /**
   * Lease-up ramp input for new_construction deals.
   * Ignored when dealType is 'acquisition' or 'acquisition_rehab'.
   * See LeaseUpRampInput for the two available paths (linear ramp vs. caller-supplied array).
   * Defaults to { leaseUpMonths: 6 } if dealType is 'new_construction' and this is omitted.
   */
  leaseUpRampInput?: LeaseUpRampInput;

  /**
   * §42(f)(1) election — defer credit period start to year after PIS.
   * When true, Year 1 proration = 1.0 (full year) and §42(f)(3) penalty risk is suppressed.
   * Defaults to false if not provided.
   */
  electDeferCreditPeriod?: boolean;
}

/**
 * Validation error for LIHTC calculations
 */
export class LIHTCValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LIHTCValidationError';
  }
}

/**
 * Validates LIHTC calculation parameters
 *
 * @param params - Calculation parameters to validate
 * @throws {LIHTCValidationError} If parameters are invalid
 */
function validateLIHTCParams(params: LIHTCCalculationParams): void {
  const { eligibleBasis, stabilizedApplicableFraction, pisMonth, creditRate } = params;

  if (eligibleBasis < 0) {
    throw new LIHTCValidationError('Eligible basis cannot be negative');
  }

  if (stabilizedApplicableFraction < 0 || stabilizedApplicableFraction > 1) {
    throw new LIHTCValidationError('Applicable fraction must be between 0 and 1');
  }

  if (!Number.isInteger(pisMonth) || pisMonth < 1 || pisMonth > 12) {
    throw new LIHTCValidationError('PIS month must be an integer between 1 and 12');
  }

  if (creditRate < 0 || creditRate > 1) {
    throw new LIHTCValidationError('Credit rate must be between 0 and 1');
  }

  // Validate leaseUpMonths if provided via linear ramp path
  if (
    params.leaseUpRampInput &&
    'leaseUpMonths' in params.leaseUpRampInput
  ) {
    const { leaseUpMonths } = params.leaseUpRampInput;
    if (leaseUpMonths < 1 || leaseUpMonths > 24) {
      throw new LIHTCValidationError('leaseUpMonths must be between 1 and 24');
    }
  }

  // Validate monthlyOccupancyFractions if provided
  if (
    params.leaseUpRampInput &&
    'monthlyOccupancyFractions' in params.leaseUpRampInput
  ) {
    const { monthlyOccupancyFractions } = params.leaseUpRampInput;
    if (!Array.isArray(monthlyOccupancyFractions) || monthlyOccupancyFractions.length === 0) {
      throw new LIHTCValidationError('monthlyOccupancyFractions must be a non-empty array');
    }
    if (monthlyOccupancyFractions.some(f => f < 0 || f > 1)) {
      throw new LIHTCValidationError('monthlyOccupancyFractions values must be between 0 and 1');
    }
  }

  // leaseUpRampInput on non-new_construction deals is silently ignored — do not throw
}

/**
 * Calculates the Year 1 proration factor based on PIS month
 *
 * Formula: (13 - PIS Month) / 12
 * With §42(f)(1) election: always 1.0 (full first year)
 *
 * Examples:
 * - January (1): 12 months in service = 100% credit
 * - July (7): 6 months in service = 50% credit
 * - December (12): 1 month in service = 8.33% credit
 * - July (7) + election: 1.0 (deferred start, full first year)
 *
 * @param pisMonth - Placed-in-Service month (1-12)
 * @param electDeferCreditPeriod - §42(f)(1) election (default false).
 *   When true, credit period starts year after PIS → Year 1 gets full credit.
 * @returns Proration factor (0.0833 to 1.0)
 * @since electDeferCreditPeriod param added in IMPL-109
 */
export function getYear1ProrationFactor(
  pisMonth: number,
  electDeferCreditPeriod: boolean = false
): number {
  if (pisMonth < 1 || pisMonth > 12) {
    throw new LIHTCValidationError('PIS month must be between 1 and 12');
  }

  if (electDeferCreditPeriod) return 1.0;

  const monthsInService = 13 - pisMonth;
  return monthsInService / 12;
}

/**
 * Calculates the months in service during Year 1
 *
 * @param pisMonth - Placed-in-Service month (1-12)
 * @returns Number of months in service (1-12)
 */
export function getMonthsInServiceYear1(pisMonth: number): number {
  if (pisMonth < 1 || pisMonth > 12) {
    throw new LIHTCValidationError('PIS month must be between 1 and 12');
  }

  return 13 - pisMonth;
}

/**
 * Calculates the DDA/QCT boost multiplier
 *
 * @param ddaQctBoost - Whether boost applies
 * @returns Boost multiplier (1.0 or 1.3)
 */
export function getDDAQCTBoostMultiplier(ddaQctBoost: boolean): number {
  return ddaQctBoost ? 1.3 : 1.0;
}

/**
 * Calculates qualified basis for LIHTC
 *
 * Formula: Eligible Basis × DDA/QCT Boost × Applicable Fraction
 *
 * @param eligibleBasis - Total eligible basis
 * @param boostMultiplier - DDA/QCT boost (1.0 or 1.3)
 * @param applicableFraction - Percentage of qualified units
 * @returns Qualified basis
 */
export function calculateQualifiedBasis(
  eligibleBasis: number,
  boostMultiplier: number,
  applicableFraction: number
): number {
  return eligibleBasis * boostMultiplier * applicableFraction;
}

/**
 * Calculates annual LIHTC credit amount
 *
 * Formula: Qualified Basis × Credit Rate
 *
 * @param qualifiedBasis - Qualified basis after all adjustments
 * @param creditRate - LIHTC credit rate (typically 4% or 9%)
 * @returns Annual credit amount
 */
export function calculateAnnualLIHTCCredit(
  qualifiedBasis: number,
  creditRate: number
): number {
  return qualifiedBasis * creditRate;
}

/**
 * Computes the effective Year 1 applicable fraction accounting for lease-up ramp.
 *
 * For acquisition and acquisition_rehab deals (units pre-occupied):
 *   Returns stabilizedApplicableFraction directly. Ramp is bypassed.
 *
 * For new_construction with { leaseUpMonths }:
 *   Computes a linear ramp from 0 to stabilizedAF over leaseUpMonths, then
 *   averages across all months-in-service in credit Year 1.
 *   monthlyAF[m] = stabilizedAF × min(m / leaseUpMonths, 1.0)  (m is 1-indexed from PIS)
 *
 * For new_construction with { monthlyOccupancyFractions }:
 *   Averages the first monthsInServiceYear1 values from the provided array directly.
 *   This is the hookup point for any external occupancy curve (e.g., proforma engine
 *   S-curve output) once that engine ships as callable TypeScript.
 *
 * NOTE: The proforma engine's lease-up S-curve sizes the lease-up reserve — a separate
 * financial modeling purpose. Do not conflate with this computation.
 *
 * @param dealType - Deal type classification. Defaults to 'acquisition'.
 * @param stabilizedAF - Target applicable fraction at full stabilization (0.0–1.0).
 * @param monthsInServiceYear1 - Months in credit Year 1 (derived from PIS proration).
 * @param rampInput - Linear ramp scalar or caller-supplied monthly array.
 *   Ignored for acquisition and acquisition_rehab deal types.
 * @returns Effective Year 1 applicable fraction (0.0–1.0).
 */
export function computeEffectiveYear1AF(
  dealType: DealType = 'acquisition',
  stabilizedAF: number,
  monthsInServiceYear1: number,
  rampInput: LeaseUpRampInput = { leaseUpMonths: 6 }
): number {
  // Acquisition and acquisition_rehab: units already occupied, bypass ramp
  if (dealType === 'acquisition' || dealType === 'acquisition_rehab') {
    return stabilizedAF;
  }

  // New construction — discriminate on ramp input type
  if ('monthlyOccupancyFractions' in rampInput) {
    // Caller-supplied array path (future proforma engine hookup)
    const fractions = rampInput.monthlyOccupancyFractions.slice(0, monthsInServiceYear1);
    if (fractions.length === 0) return stabilizedAF;
    return fractions.reduce((sum, f) => sum + f, 0) / monthsInServiceYear1;
  }

  // Linear ramp path (Fund 1 implementation)
  const { leaseUpMonths } = rampInput;
  let totalAF = 0;
  for (let m = 1; m <= monthsInServiceYear1; m++) {
    totalAF += stabilizedAF * Math.min(m / leaseUpMonths, 1.0);
  }
  return totalAF / monthsInServiceYear1;
}

/**
 * Calculates complete LIHTC credit schedule over 11-year period
 *
 * Implements the following mechanics:
 * 1. Apply DDA/QCT boost to eligible basis (if applicable)
 * 2. Calculate qualified basis (eligible basis × boost × applicable fraction)
 * 3. Calculate annual credit (qualified basis × credit rate)
 * 4. Calculate Year 1 credit with PIS proration
 * 5. Years 2-10 receive full annual credit
 * 6. Year 11 receives catch-up to ensure total = 10 × annual credit
 * 7. Build year-by-year breakdown
 * 8. Verify total credits invariant
 *
 * @param params - Calculation parameters
 * @returns Complete LIHTC credit schedule
 * @throws {LIHTCValidationError} If parameters are invalid or calculation fails
 *
 * @example
 * ```typescript
 * // July PIS with DDA/QCT boost
 * const schedule = calculateLIHTCSchedule({
 *   eligibleBasis: 50000000,
 *   stabilizedApplicableFraction: 0.75,
 *   ddaQctBoost: true,
 *   pisMonth: 7,
 *   creditRate: 0.04
 * });
 *
 * // Results:
 * // qualifiedBasis = $48,750,000
 * // annualCredit = $1,950,000
 * // year1Credit = $975,000 (50%)
 * // year11Credit = $975,000 (50%)
 * // totalCredits = $19,500,000
 * ```
 */
export function calculateLIHTCSchedule(
  params: LIHTCCalculationParams
): LIHTCCreditSchedule {
  // Step 1: Validate inputs
  validateLIHTCParams(params);

  const { eligibleBasis, stabilizedApplicableFraction, ddaQctBoost, pisMonth, creditRate } = params;
  const dealType = params.dealType ?? 'acquisition';

  // Step 2: Apply DDA/QCT boost
  const boostMultiplier = getDDAQCTBoostMultiplier(ddaQctBoost);

  // Step 3: Calculate stabilized qualified basis (used for Years 2–10 and annualCredit)
  const qualifiedBasis = calculateQualifiedBasis(
    eligibleBasis,
    boostMultiplier,
    stabilizedApplicableFraction
  );

  // Step 4: Calculate annual credit (always from stabilized AF)
  const annualCredit = calculateAnnualLIHTCCredit(qualifiedBasis, creditRate);

  // Step 5: Calculate Year 1 proration and effective applicable fraction
  const monthsInServiceYear1 = getMonthsInServiceYear1(pisMonth);
  const year1ProrationFactor = getYear1ProrationFactor(pisMonth, params.electDeferCreditPeriod ?? false);

  const effectiveYear1AF = computeEffectiveYear1AF(
    dealType,
    stabilizedApplicableFraction,
    monthsInServiceYear1,
    params.leaseUpRampInput ?? { leaseUpMonths: 6 }
  );

  // Step 6: Calculate Year 1 credit using effective AF
  const year1QualifiedBasis = calculateQualifiedBasis(
    eligibleBasis,
    boostMultiplier,
    effectiveYear1AF
  );
  const year1AnnualEquiv = calculateAnnualLIHTCCredit(year1QualifiedBasis, creditRate);
  const year1Credit = year1AnnualEquiv * year1ProrationFactor;

  // Step 7: Years 2-10 receive full annual credit (stabilized AF)
  const years2to10Credit = annualCredit;

  // Step 8: Calculate Year 11 catch-up
  // Ensures: year1 + (9 × annual) + year11 = 10 × annual
  const year11Credit = annualCredit - year1Credit;

  // Step 9: Verify total credits invariant
  const totalCredits = year1Credit + (9 * annualCredit) + year11Credit;
  const expectedTotal = 10 * annualCredit;

  // Allow for floating-point precision errors (within $0.001M)
  if (Math.abs(totalCredits - expectedTotal) > 0.001) {
    throw new LIHTCValidationError(
      `Total credits verification failed: expected ${expectedTotal}, got ${totalCredits}`
    );
  }

  // Step 10: Build year-by-year breakdown
  const yearlyBreakdown: YearlyCredit[] = [];

  // Year 1 (prorated, possibly with ramp-adjusted AF)
  yearlyBreakdown.push({
    year: 1,
    creditAmount: year1Credit,
    prorationFactor: year1ProrationFactor,
    description: `Year 1 (${monthsInServiceYear1} months in service, ${(year1ProrationFactor * 100).toFixed(1)}% proration)`,
  });

  // Years 2-10 (full credit at stabilized AF)
  for (let year = 2; year <= 10; year++) {
    yearlyBreakdown.push({
      year,
      creditAmount: years2to10Credit,
      prorationFactor: 1.0,
      description: `Year ${year} (full year)`,
    });
  }

  // Year 11 (catch-up)
  const year11ProrationFactor = annualCredit > 0 ? year11Credit / annualCredit : 0;
  yearlyBreakdown.push({
    year: 11,
    creditAmount: year11Credit,
    prorationFactor: year11ProrationFactor,
    description: `Year 11 (catch-up, ${(year11ProrationFactor * 100).toFixed(1)}% of annual)`,
  });

  // Step 11: Build metadata
  const metadata: LIHTCMetadata = {
    qualifiedBasis,
    boostMultiplier,
    pisMonth,
    monthsInServiceYear1,
    year1ProrationFactor,
    creditRate,
    stabilizedApplicableFraction,
    effectiveYear1ApplicableFraction: effectiveYear1AF,
    dealType,
  };

  // Determine §42(f)(3) penalty risk: lease-up extends beyond Year 1 months-in-service
  const rampInput = params.leaseUpRampInput ?? { leaseUpMonths: 6 };
  const leaseUpLength = 'leaseUpMonths' in rampInput
    ? rampInput.leaseUpMonths
    : rampInput.monthlyOccupancyFractions.length;
  const section42f3PenaltyRisk =
    dealType === 'new_construction' &&
    leaseUpLength > monthsInServiceYear1 &&
    !(params.electDeferCreditPeriod ?? false);

  return {
    annualCredit,
    year1Credit,
    years2to10Credit,
    year11Credit,
    totalCredits: expectedTotal, // Use exact expected value
    yearlyBreakdown,
    metadata,
    section42f3PenaltyRisk,
  };
}

/**
 * Calculates total LIHTC credits over full 10-year period
 *
 * This is a convenience function that always returns 10 × annual credit,
 * regardless of PIS month (Year 11 catch-up ensures this invariant).
 *
 * @param annualCredit - Full year credit amount
 * @returns Total credits (always 10 × annual)
 */
export function calculateTotalLIHTCCredits(annualCredit: number): number {
  return 10 * annualCredit;
}

/**
 * Formats LIHTC credit schedule for display
 *
 * @param schedule - Credit schedule to format
 * @returns Formatted string representation
 */
export function formatLIHTCSchedule(schedule: LIHTCCreditSchedule): string {
  const { metadata, annualCredit, year1Credit, year11Credit, totalCredits } = schedule;

  const lines: string[] = [];
  lines.push('=== LIHTC Credit Schedule ===');
  lines.push('');
  lines.push('PARAMETERS:');
  lines.push(`  Qualified Basis: $${metadata.qualifiedBasis.toLocaleString()}`);
  lines.push(`  Credit Rate: ${(metadata.creditRate * 100).toFixed(1)}%`);
  lines.push(`  DDA/QCT Boost: ${metadata.boostMultiplier}x`);
  lines.push(`  PIS Month: ${metadata.pisMonth} (${metadata.monthsInServiceYear1} months in service)`);
  lines.push('');
  lines.push('ANNUAL CREDITS:');
  lines.push(`  Full Year Credit: $${annualCredit.toLocaleString()}`);
  lines.push(`  Year 1 Credit: $${year1Credit.toLocaleString()} (${(metadata.year1ProrationFactor * 100).toFixed(1)}%)`);
  lines.push(`  Years 2-10 Credit: $${annualCredit.toLocaleString()} each`);
  lines.push(`  Year 11 Credit: $${year11Credit.toLocaleString()} (${((year11Credit / annualCredit) * 100).toFixed(1)}%)`);
  lines.push('');
  lines.push(`TOTAL CREDITS: $${totalCredits.toLocaleString()}`);
  lines.push('');
  lines.push('YEARLY BREAKDOWN:');

  schedule.yearlyBreakdown.forEach(({ year, creditAmount, description }) => {
    lines.push(`  Year ${year.toString().padStart(2)}: $${creditAmount.toLocaleString().padStart(15)} - ${description}`);
  });

  return lines.join('\n');
}
