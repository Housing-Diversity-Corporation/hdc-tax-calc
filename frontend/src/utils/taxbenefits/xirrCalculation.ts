/**
 * XIRR — Internal Rate of Return for Irregularly-Spaced Cash Flows
 *
 * Uses Newton-Raphson with day-count fractions (ACT/365.25).
 * Day-precise alternative to the existing calculateIRR() which uses
 * integer year indices.
 *
 * Co-exists with calculateIRR() in calculations.ts — that function
 * is NOT modified. This file has ZERO consumers until IMPL-111
 * wires it into the calculation engine.
 *
 * @since IMPL-110
 */

import { XirrCashFlow } from '../../types/taxbenefits';

/**
 * Days between two dates (integer).
 * Uses UTC to avoid DST artifacts (spring forward / fall back
 * can produce 23 or 25 hour days in local time).
 */
export function daysBetween(d1: Date, d2: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * XIRR: Internal rate of return for irregularly-spaced cash flows.
 * Uses Newton-Raphson with day-count fractions (ACT/365.25).
 *
 * @param cashFlows - Array of { date, amount, category }.
 *   First entry should be the investment (negative).
 *   Must contain at least one positive and one negative amount.
 * @param guess - Starting rate (decimal, not percentage). Default 0.1.
 * @param maxIterations - Default 100.
 * @param tolerance - NPV convergence threshold. Default 1e-7.
 * @returns Annualized rate as PERCENTAGE (e.g., 10.5 not 0.105).
 *   Returns NaN if: no sign change, < 2 cash flows, or non-convergence.
 *   Matches calculateIRR return convention for drop-in compatibility.
 */
export function calculateXIRR(
  cashFlows: XirrCashFlow[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 1e-7
): number {
  // GUARD: need at least 2 cash flows with a sign change
  if (cashFlows.length < 2) return NaN;
  const hasPositive = cashFlows.some(cf => cf.amount > 0);
  const hasNegative = cashFlows.some(cf => cf.amount < 0);
  if (!hasPositive || !hasNegative) return NaN;

  // Parse dates once
  const parsed = cashFlows.map(cf => ({
    date: new Date(cf.date + 'T00:00:00'),
    amount: cf.amount,
  }));
  const d0 = parsed[0].date;

  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (const cf of parsed) {
      // Day-precise year fraction (ACT/365.25)
      const years = daysBetween(d0, cf.date) / 365.25;
      const factor = Math.pow(1 + rate, years);
      npv += cf.amount / factor;
      if (years > 0) {
        dnpv -= years * cf.amount / (factor * (1 + rate));
      }
    }

    if (Math.abs(npv) < tolerance) return rate * 100;
    if (Math.abs(dnpv) < tolerance) break; // derivative too flat
    rate = rate - npv / dnpv;

    // Clamp to prevent mathematical instability
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10; // 1000% cap
  }

  return NaN; // Failed to converge
}
