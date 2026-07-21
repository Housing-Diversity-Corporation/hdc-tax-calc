/**
 * IMPL-197 (F4 / ISS-077): the interest reserve must not be distributed before the
 * lease-up draw window opens; actual shortfall draws deplete it during the window; only
 * a genuine unused remainder is returned, at/after the window closes.
 *
 * Pre-fix: the whole balance was distributed at `year === interestReservePeriodYears`
 * (Year 2 on the 701 preset) — before the draw window opens at placed-in-service (Year 3,
 * DSCR 0.43x) — returning the full, undrawn, mostly debt-funded reserve as an early inflow.
 *
 * 701-style OZ scenario (values in $M). Draw window = PIS(3)..leaseUpEndYear(4);
 * distribution now fires at leaseUpEndYear + 1 (Year 5).
 */

import { calculateFullInvestorAnalysis } from '../calculations';

const ozParams: any = {
  projectCost: 60.5, landValue: 2.5, predevelopmentCosts: 0,
  yearOneNOI: 2.387, noiGrowthRate: 3, exitCapRate: 5.5,
  investorEquityPct: 23.08, seniorDebtPct: 50, philanthropicDebtPct: 26.92,
  seniorDebtRate: 5.5, philanthropicDebtRate: 0, seniorDebtAmortization: 30,
  investorPromoteShare: 100, yearOneDepreciationPct: 20,
  federalTaxRate: 37, stateTaxRate: 0, ltCapitalGainsRate: 20, niitRate: 3.8,
  ozEnabled: true, ozType: 'standard', ozVersion: '2.0', deferredCapitalGains: 14.24,
  investorState: 'WA', investorTrack: 'non-rep', filingStatus: 'single', annualOrdinaryIncome: 750000,
  interestReserveEnabled: true, interestReserveMonths: 16,
  holdPeriod: 150, constructionDelayMonths: 24, investmentDate: '2026-07-01',
  electDeferCreditPeriod: true, philDebtForgivenessEnabled: true,
  includeDepreciationSchedule: true,
};

const cfs = () => calculateFullInvestorAnalysis(ozParams).investorCashFlows;

describe('IMPL-197 (F4): reserve draw-window discipline', () => {
  it('does not distribute the reserve before the draw window opens (no Year-2 distribution)', () => {
    const flows = cfs();
    // Years 1-2 (pre-PIS) carry no excess-reserve distribution.
    expect(flows[0].excessReserveDistribution || 0).toBe(0);
    expect(flows[1].excessReserveDistribution || 0).toBe(0);
  });

  it('debits actual shortfall draws against the balance during the draw window', () => {
    const flows = cfs();
    const y3 = flows[2]; // PIS year, DSCR < 1
    expect(y3.dscr).toBeLessThan(1);
    expect(y3.interestReserveDraw || 0).toBeGreaterThan(1); // ~$1.19M draw covers the shortfall
    expect(y3.interestReserveBalance || 0).toBeLessThan(0.05); // balance nearly exhausted
  });

  it('returns only the unused remainder, and only after the window closes', () => {
    const flows = cfs();
    const totalExcess = flows.reduce((s, c) => s + (c.excessReserveDistribution || 0), 0);
    // Remainder is a tiny fraction of the ~$1.2M funded reserve (most was drawn).
    expect(totalExcess).toBeLessThan(0.1);
    // Any distribution occurs after the draw window (year >= 5), never in year 2.
    const distYears = flows.filter(c => (c.excessReserveDistribution || 0) > 0).map(c => c.year);
    distYears.forEach(y => expect(y).toBeGreaterThanOrEqual(5));
  });

  it('removes the early reserve inflow from returns (MOIC below the pre-fix 3.54x)', () => {
    const res = calculateFullInvestorAnalysis(ozParams);
    expect(res.multiple).toBeLessThan(3.5);
    expect(res.multiple).toBeGreaterThan(3.4); // ~3.46x
  });
});
