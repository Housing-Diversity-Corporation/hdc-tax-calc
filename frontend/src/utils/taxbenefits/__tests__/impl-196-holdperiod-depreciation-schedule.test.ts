/**
 * IMPL-196 (F5): buildDepreciationSchedule must run its §1250 straight-line loop over
 * the deal's actual hold, not the full 27.5-year statutory life.
 *
 * Pre-fix: calculations.ts passed params.holdPeriod (a large sentinel, e.g. 150) into
 * buildDepreciationSchedule, so `min(holdPeriod, 27.5)` capped at 27.5 and the loop ran
 * years 2–27 (26 straight-line years), inflating cumulative1250 (~$43.9M on the 701
 * preset) and the exit-tax recapture it feeds far beyond the depreciation actually taken
 * over the ~13-year hold. The fix passes the real hold (exitYear − placedInServiceYear + 1).
 *
 * These assertions use a 701-style OZ scenario (values in $M).
 */

import { calculateFullInvestorAnalysis } from '../calculations';

const ozParams: any = {
  projectCost: 60.5,
  landValue: 2.5,
  predevelopmentCosts: 0,
  yearOneNOI: 2.387,
  noiGrowthRate: 3,
  exitCapRate: 5.5,
  investorEquityPct: 23.08,
  seniorDebtPct: 50,
  philanthropicDebtPct: 26.92,
  seniorDebtRate: 5.5,
  philanthropicDebtRate: 0,
  seniorDebtAmortization: 30,
  investorPromoteShare: 100,
  yearOneDepreciationPct: 20,
  federalTaxRate: 37,
  stateTaxRate: 0,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  ozEnabled: true,
  ozType: 'standard',
  ozVersion: '2.0',
  deferredCapitalGains: 14.24,
  investorState: 'WA',
  investorTrack: 'non-rep',
  filingStatus: 'single',
  annualOrdinaryIncome: 750000,
  interestReserveEnabled: true,
  interestReserveMonths: 16,
  holdPeriod: 150, // sentinel that previously forced the 27.5-year run
  constructionDelayMonths: 24,
  investmentDate: '2026-07-01',
  electDeferCreditPeriod: true,
  philDebtForgivenessEnabled: true,
  includeDepreciationSchedule: true,
};

describe('IMPL-196 (F5): depreciation schedule bounded by hold, not the 27.5-year cap', () => {
  it('schedule length equals the hold (exitYear − placedInServiceYear + 1), not 27', () => {
    const res = calculateFullInvestorAnalysis(ozParams);
    const tl = res.computedTimeline!;
    const expectedHold = tl.exitYear - tl.placedInServiceYear + 1;
    expect(res.depreciationSchedule!.schedule.length).toBe(expectedHold);
    expect(res.depreciationSchedule!.schedule.length).toBeLessThan(27);
  });

  it('§1250 accumulates only over the hold (well below the pre-fix ~$43.9M 27.5-year run)', () => {
    const ds = calculateFullInvestorAnalysis(ozParams).depreciationSchedule!;
    expect(ds.cumulative1245).toBeCloseTo(11.6, 1); // Year-1 cost-seg unchanged
    expect(ds.cumulative1250).toBeGreaterThan(0);
    expect(ds.cumulative1250).toBeLessThan(20); // was 43.869 pre-fix
  });

  it('exit-tax recapture converges toward the annual Recapture-Avoided line', () => {
    const res = calculateFullInvestorAnalysis(ozParams);
    const eta = res.exitTaxAnalysis!;
    const exitRecaptureTax = eta.sec1245Tax + eta.sec1250Tax; // pre-fix ~$15.26M
    const avoided = res.ozRecaptureAvoided; // ~$8.30M
    // Pre-fix gap was ~$7M; post-fix within the mid-month-convention residual (~$0.5M).
    expect(Math.abs(exitRecaptureTax - avoided)).toBeLessThan(0.5);
  });

  it('OZ 10-year hold remains value-neutral at exit (netExitTax = 0)', () => {
    expect(calculateFullInvestorAnalysis(ozParams).exitTaxAnalysis!.netExitTax).toBe(0);
  });
});
