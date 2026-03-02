/**
 * Compute Hold Period — LIHTC Credit Exhaustion-Driven
 *
 * Pure function that computes the investment timeline using month-precise
 * arithmetic. All timing interactions stay in months and convert to years
 * ONCE at the output boundary — no intermediate rounding.
 *
 * TIMING PRECISION FIX (Handoff v3.0 — Hypothesis A):
 * The old formula had two separate Math.floor operations (construction and delay)
 * that compounded rounding errors. A 1-month delay added a FULL year via
 * delaySpillover. Now we sum all months first, then convert to years once.
 *
 * Additionally splits the exit year from the model duration (Hypothesis B):
 * - exitYear: when the investor physically exits (exit proceeds land here)
 * - totalInvestmentYears: full model duration including delay (IRR timeline)
 *
 * Single source of truth. Used by both the calculation engine and state layer.
 */

export interface ComputedHoldPeriod {
  /** Years held from placed-in-service through credit exhaustion (no delay) */
  holdFromPIS: number;
  /** Full investment timeline: month-precise total including delay + disposition */
  totalInvestmentYears: number;
  /** Year in which exit/disposition occurs (no delay — where exit proceeds land) */
  exitYear: number;
  /** Extra years beyond exit needed for delayed benefit capture (0+) */
  delaySpilloverYears: number;
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

  // Hold from PIS: credit period only (no delay)
  const holdFromPIS = creditPeriodFromPIS;

  // Pre-PIS construction/development years (for annual model row count)
  const prePISYears = Math.floor(constructionDevMonths / 12);

  // Exit year: when investor physically exits (exit proceeds, debt payoff, disposition)
  // This does NOT include delay — investor exits after last credit year + disposition
  const exitYear = prePISYears + creditPeriodFromPIS + 1; // +1 disposition

  // MONTH-PRECISE total: sum all months FIRST, convert to years ONCE
  // This eliminates the compounding rounding from separate floor/ceil operations
  const totalMonths = constructionDevMonths
    + (creditPeriodFromPIS * 12)
    + taxBenefitDelayMonths;
  const totalInvestmentYears = Math.ceil(totalMonths / 12) + 1; // +1 disposition

  // Delay spillover: how many extra years beyond exit for delayed benefits
  const delaySpilloverYears = totalInvestmentYears - exitYear;

  return { holdFromPIS, totalInvestmentYears, exitYear, delaySpilloverYears };
}
