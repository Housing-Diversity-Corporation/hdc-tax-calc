/**
 * Compute Hold Period — LIHTC Credit Exhaustion-Driven
 *
 * Pure function that computes the minimum hold period required to capture
 * all LIHTC credits, including Year 11 catch-up (§42(f)(3)) when
 * pisMonth > 1, plus any K-1 delivery delay spillover.
 *
 * Single source of truth. Used by both the calculation engine and state layer.
 */

export interface ComputedHoldPeriod {
  /** Years held from placed-in-service through credit exhaustion + delay */
  holdFromPIS: number;
  /** Total investment years including pre-PIS construction/development */
  totalInvestmentYears: number;
}

/**
 * @param pisMonth - Placed-in-service month (1-12)
 * @param constructionDevMonths - Construction/development period in months (0+)
 * @param taxBenefitDelayMonths - K-1 delivery delay in months (0+)
 */
export function computeHoldPeriod(
  pisMonth: number,
  constructionDevMonths: number,
  taxBenefitDelayMonths: number
): ComputedHoldPeriod {
  // §42(f)(3): If PIS after January, Year 1 is prorated and Year 11 captures remainder
  const creditPeriodFromPIS = pisMonth > 1 ? 11 : 10;

  // K-1 delay can push benefit realization into additional years
  const delayFullYears = Math.floor(taxBenefitDelayMonths / 12);
  const delaySpillover = (taxBenefitDelayMonths % 12) > 0 ? 1 : 0;

  const holdFromPIS = creditPeriodFromPIS + delayFullYears + delaySpillover;

  // Pre-PIS construction/development years
  const prePISYears = Math.floor(constructionDevMonths / 12);

  // IMPL-087: +1 disposition year for exit-month precision
  const totalInvestmentYears = prePISYears + holdFromPIS + 1;

  return { holdFromPIS, totalInvestmentYears };
}
