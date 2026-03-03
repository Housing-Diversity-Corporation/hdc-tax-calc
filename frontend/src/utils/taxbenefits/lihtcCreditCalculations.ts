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

  /** Applicable fraction (percentage of qualified units) */
  applicableFraction: number;
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
}

/**
 * Input parameters for LIHTC calculation.
 *
 * IMPORTANT: Monetary values are in MILLIONS. See docs/CONVENTIONS.md.
 */
export interface LIHTCCalculationParams {
  /** Total eligible basis in millions (e.g., 90 = $90M) */
  eligibleBasis: number;

  /** Percentage of qualified low-income units (0.0 - 1.0, NOT 0-100) */
  applicableFraction: number;

  /** Whether DDA/QCT 130% boost applies */
  ddaQctBoost: boolean;

  /** Placed-in-Service month (1 = January, 12 = December) */
  pisMonth: number;

  /** LIHTC credit rate (typically 0.04 or 0.09) */
  creditRate: number;
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
  const { eligibleBasis, applicableFraction, pisMonth, creditRate } = params;

  if (eligibleBasis < 0) {
    throw new LIHTCValidationError('Eligible basis cannot be negative');
  }

  if (applicableFraction < 0 || applicableFraction > 1) {
    throw new LIHTCValidationError('Applicable fraction must be between 0 and 1');
  }

  if (!Number.isInteger(pisMonth) || pisMonth < 1 || pisMonth > 12) {
    throw new LIHTCValidationError('PIS month must be an integer between 1 and 12');
  }

  if (creditRate < 0 || creditRate > 1) {
    throw new LIHTCValidationError('Credit rate must be between 0 and 1');
  }
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
 *   applicableFraction: 0.75,
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

  const { eligibleBasis, applicableFraction, ddaQctBoost, pisMonth, creditRate } = params;

  // Step 2: Apply DDA/QCT boost
  const boostMultiplier = getDDAQCTBoostMultiplier(ddaQctBoost);

  // Step 3: Calculate qualified basis
  const qualifiedBasis = calculateQualifiedBasis(
    eligibleBasis,
    boostMultiplier,
    applicableFraction
  );

  // Step 4: Calculate annual credit
  const annualCredit = calculateAnnualLIHTCCredit(qualifiedBasis, creditRate);

  // Step 5: Calculate Year 1 proration
  const monthsInServiceYear1 = getMonthsInServiceYear1(pisMonth);
  const year1ProrationFactor = getYear1ProrationFactor(pisMonth);
  const year1Credit = annualCredit * year1ProrationFactor;

  // Step 6: Years 2-10 receive full annual credit
  const years2to10Credit = annualCredit;

  // Step 7: Calculate Year 11 catch-up
  // This ensures: year1 + (9 × annual) + year11 = 10 × annual
  const year11Credit = annualCredit - year1Credit;

  // Step 8: Verify total credits invariant
  const totalCredits = year1Credit + (9 * annualCredit) + year11Credit;
  const expectedTotal = 10 * annualCredit;

  // Allow for floating-point precision errors (within 1 cent)
  if (Math.abs(totalCredits - expectedTotal) > 0.01) {
    throw new LIHTCValidationError(
      `Total credits verification failed: expected ${expectedTotal}, got ${totalCredits}`
    );
  }

  // Step 9: Build year-by-year breakdown
  const yearlyBreakdown: YearlyCredit[] = [];

  // Year 1 (prorated)
  yearlyBreakdown.push({
    year: 1,
    creditAmount: year1Credit,
    prorationFactor: year1ProrationFactor,
    description: `Year 1 (${monthsInServiceYear1} months in service, ${(year1ProrationFactor * 100).toFixed(1)}% proration)`,
  });

  // Years 2-10 (full credit)
  for (let year = 2; year <= 10; year++) {
    yearlyBreakdown.push({
      year,
      creditAmount: years2to10Credit,
      prorationFactor: 1.0,
      description: `Year ${year} (full year)`,
    });
  }

  // Year 11 (catch-up)
  const year11ProrationFactor = year11Credit / annualCredit;
  yearlyBreakdown.push({
    year: 11,
    creditAmount: year11Credit,
    prorationFactor: year11ProrationFactor,
    description: `Year 11 (catch-up, ${(year11ProrationFactor * 100).toFixed(1)}% of annual)`,
  });

  // Step 10: Build metadata
  const metadata: LIHTCMetadata = {
    qualifiedBasis,
    boostMultiplier,
    pisMonth,
    monthsInServiceYear1,
    year1ProrationFactor,
    creditRate,
    applicableFraction,
  };

  return {
    annualCredit,
    year1Credit,
    years2to10Credit,
    year11Credit,
    totalCredits: expectedTotal, // Use exact expected value
    yearlyBreakdown,
    metadata,
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
