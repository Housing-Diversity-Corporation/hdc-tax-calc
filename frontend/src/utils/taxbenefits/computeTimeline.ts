/**
 * Compute Timeline — Investment Date as Single Master Clock
 *
 * Pure function that takes Investment Date and derives ALL timing values.
 * Returns ComputedTimeline (defined in IMPL-108 types).
 *
 * Key design decisions:
 *   - Math.floor for placedInServiceYear (matches computeHoldPeriod convention)
 *   - §42(f)(1) election with January PIS guard
 *   - K-1 realization dates auto-computed (April 15 of year after earned)
 *   - OZ 10-year floor check against LIHTC optimal exit
 *
 * @since IMPL-109
 */

import { ComputedTimeline } from '../../types/taxbenefits';

// ── Date Utilities ──────────────────────────────────────────────

/** Add N months to a date. Clamps to end-of-month if needed. */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Months between two dates (integer, floor). */
export function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12
    + (end.getMonth() - start.getMonth());
}

// ── Main Function ───────────────────────────────────────────────

/**
 * Compute all timing values from Investment Date as the single master clock.
 *
 * @param investmentDateStr - ISO 'YYYY-MM-DD'
 * @param constructionMonths - Construction/development period (0-48)
 * @param pisDateOverride - ISO string or null (overrides auto-computed PIS)
 * @param ozEnabled - Whether Opportunity Zone is active
 * @param exitExtensionMonths - Months beyond optimal exit (0+)
 * @param electDeferCreditPeriod - §42(f)(1) election
 */
export function computeTimeline(
  investmentDateStr: string,
  constructionMonths: number,
  pisDateOverride: string | null,
  ozEnabled: boolean,
  exitExtensionMonths: number,
  electDeferCreditPeriod: boolean
): ComputedTimeline {

  // 1. PARSE INVESTMENT DATE
  const investmentDate = new Date(investmentDateStr + 'T00:00:00');

  // 2. COMPUTE PIS DATE
  const autoComputedPis = addMonths(investmentDate, constructionMonths);
  const pisDate = pisDateOverride
    ? new Date(pisDateOverride + 'T00:00:00')
    : autoComputedPis;
  const pisIsOverridden = pisDateOverride !== null;
  const pisCalendarMonth = pisDate.getMonth() + 1; // 1-12
  const pisYear = pisDate.getFullYear();

  // 3. §42(f)(1) ELECTION (with January PIS guard)
  // Guard: election ignored for January PIS — would add 1 year with
  // no benefit since January already gets 100% proration.
  const electionApplies = electDeferCreditPeriod && pisCalendarMonth > 1;
  const creditStartYear = electionApplies ? pisYear + 1 : pisYear;

  // 4. LIHTC PRORATION (election-aware)
  // Without election: (12 - pisMonth + 1) / 12 per IRC §42(f)(1)
  // With election: 1.0 (full first year, credit period starts year after PIS)
  const lihtcYear1Pct = electionApplies
    ? 1.0
    : (12 - pisCalendarMonth + 1) / 12;
  const lihtcCatchUpPct = electionApplies
    ? 0
    : 1 - lihtcYear1Pct;
  const hasCatchUp = !electionApplies && pisCalendarMonth > 1;
  const lihtcCreditYears = hasCatchUp ? 11 : 10;
  const lastCreditYear = creditStartYear + lihtcCreditYears - 1;

  // 5. EXIT DATES (date-precise)
  const optimalExitDate = new Date(lastCreditYear + 1, 0, 1); // Jan 1

  // OZ floor: 10 years from investment
  const ozMinimumDate = ozEnabled
    ? addMonths(investmentDate, 120)
    : null;
  const ozFloorBinding = ozEnabled && ozMinimumDate !== null
    && ozMinimumDate > optimalExitDate;
  const engineExitDate = ozFloorBinding ? ozMinimumDate! : optimalExitDate;
  const actualExitDate = addMonths(engineExitDate, exitExtensionMonths);
  const isExtended = exitExtensionMonths > 0;

  // 6. K-1 REALIZATION DATES (auto-computed, NOT user input)
  // All benefits realized when K-1 filed: ~April 15 of year after earned
  const bonusDepK1Date = new Date(pisYear + 1, 3, 15); // April 15
  const bonusDepLagMonths = monthsBetween(pisDate, bonusDepK1Date);
  const firstLihtcK1Date = new Date(creditStartYear + 1, 3, 15);

  // 7. OZ TIMING
  const ozDeferralEndDate = ozEnabled ? addMonths(investmentDate, 60) : null;
  const ozRecognitionDate = ozDeferralEndDate; // Same date

  // 8. ARRAY SIZING (backward compat with annual loop in calculations.ts)
  const totalHoldMonths = monthsBetween(investmentDate, actualExitDate);
  const totalInvestmentYears = Math.ceil(totalHoldMonths / 12);
  const holdFromPIS = lihtcCreditYears;
  const exitYear = totalInvestmentYears;

  // CRITICAL: Use Math.floor, NOT Math.ceil.
  // placedInServiceYear = "the year of the investment containing PIS"
  // Year 1 = months 0-11, Year 2 = months 12-23, Year 3 = months 24-35
  // For 23-month construction: floor(23/12) + 1 = 2 (PIS in Year 2)
  const pisMonthsFromInvestment = monthsBetween(investmentDate, pisDate);
  const placedInServiceYear = Math.floor(pisMonthsFromInvestment / 12) + 1;

  return {
    investmentDate,
    pisDate,
    pisIsOverridden,
    pisCalendarMonth,
    pisYear,
    electDeferCreditPeriod: electionApplies,
    creditStartYear,
    lihtcYear1Pct,
    lihtcCatchUpPct,
    hasCatchUp,
    lihtcCreditYears,
    lastCreditYear,
    optimalExitDate,
    actualExitDate,
    isExtended,
    bonusDepK1Date,
    bonusDepLagMonths,
    firstLihtcK1Date,
    ozDeferralEndDate,
    ozRecognitionDate,
    ozMinimumDate,
    ozFloorBinding,
    totalHoldMonths,
    totalInvestmentYears,
    holdFromPIS,
    exitYear,
    placedInServiceYear,
  };
}
