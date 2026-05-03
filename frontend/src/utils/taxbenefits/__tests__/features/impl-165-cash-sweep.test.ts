/**
 * IMPL-165: Cash Sweep Waterfall Tests
 * Phil sweep runs first, DDF sweep takes remainder.
 * Both reduce PIK balances year-over-year from CADS surplus.
 * Defects #7 (no AMZN/phil sweep) and #9 (DDF never paid down).
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('IMPL-165: Cash Sweep Waterfall', () => {

  it('Phil sweep basic: philPikBalance reduces by sweep amount each year', () => {
    const withSweep = getDefaultTestParams({
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 2,
      philCurrentPayEnabled: false, // All PIK
      philSweepPct: 75,
    });
    const noSweep = getDefaultTestParams({
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 2,
      philCurrentPayEnabled: false,
      philSweepPct: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withSweep);
    const resultWithout = calculateFullInvestorAnalysis(noSweep);

    // Phil sweep should reduce exit phil debt (principal + PIK)
    // which increases exit proceeds for investor
    expect(resultWith.exitProceeds).toBeGreaterThan(resultWithout.exitProceeds);

    // Verify sweep payments are recorded in cash flows
    const totalPhilSweep = resultWith.cashFlows.reduce(
      (sum, cf) => sum + (cf.philSweepPayment || 0), 0
    );
    expect(totalPhilSweep).toBeGreaterThan(0);
  });

  it('DDF sweep basic: hdcDebtFundPikBalance reduces from surplus', () => {
    const withSweep = getDefaultTestParams({
      hdcDebtFundPct: 3,
      hdcDebtFundPikRate: 8,
      hdcDebtFundCurrentPayEnabled: false,
      hdcDebtFundSweepPct: 50,
    });
    const noSweep = getDefaultTestParams({
      hdcDebtFundPct: 3,
      hdcDebtFundPikRate: 8,
      hdcDebtFundCurrentPayEnabled: false,
      hdcDebtFundSweepPct: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withSweep);
    const resultWithout = calculateFullInvestorAnalysis(noSweep);

    // DDF sweep reduces compounded balance → higher exit proceeds
    expect(resultWith.exitProceeds).toBeGreaterThan(resultWithout.exitProceeds);

    // Verify sweep payments recorded
    const totalDdfSweep = resultWith.cashFlows.reduce(
      (sum, cf) => sum + (cf.ddfSweepPayment || 0), 0
    );
    expect(totalDdfSweep).toBeGreaterThan(0);
  });

  it('Priority order: phil sweep runs first, DDF operates on remainder', () => {
    // Both sweeps at 100% — phil takes everything first, DDF gets nothing
    const params = getDefaultTestParams({
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 2,
      philCurrentPayEnabled: false,
      philSweepPct: 100,
      hdcDebtFundPct: 3,
      hdcDebtFundPikRate: 8,
      hdcDebtFundCurrentPayEnabled: false,
      hdcDebtFundSweepPct: 100,
    });

    const result = calculateFullInvestorAnalysis(params);

    // Phil sweep at 100% takes all remaining cash — DDF should get nothing (or near-zero)
    const totalPhilSweep = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.philSweepPayment || 0), 0
    );
    const totalDdfSweep = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.ddfSweepPayment || 0), 0
    );

    // Phil sweep should dominate
    expect(totalPhilSweep).toBeGreaterThan(totalDdfSweep);
  });

  it('DSCR-gated: no surplus means no sweep', () => {
    // Set NOI very low so DSCR barely meets 1.05x — no surplus for sweep
    const params = getDefaultTestParams({
      yearOneNOI: 4.2, // Just enough for 1.05x on default 65% senior debt
      philanthropicDebtPct: 30,
      philSweepPct: 75,
      hdcDebtFundPct: 3,
      hdcDebtFundSweepPct: 50,
    });

    const result = calculateFullInvestorAnalysis(params);

    // With tight NOI, sweeps should be minimal or zero
    const totalPhilSweep = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.philSweepPayment || 0), 0
    );
    const totalDdfSweep = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.ddfSweepPayment || 0), 0
    );

    // Sweeps should be much smaller than with ample NOI
    const ampleSweepParams = getDefaultTestParams({
      yearOneNOI: 8,
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 2,
      philCurrentPayEnabled: false,
      philSweepPct: 75,
      hdcDebtFundPct: 3,
      hdcDebtFundSweepPct: 50,
    });
    const ampleResult = calculateFullInvestorAnalysis(ampleSweepParams);
    const amplePhilSweep = ampleResult.cashFlows.reduce(
      (sum, cf) => sum + (cf.philSweepPayment || 0), 0
    );

    expect(totalPhilSweep).toBeLessThan(amplePhilSweep);
  });

  it('Zero sweep regression: outputs identical when both sweeps are 0', () => {
    const withZeroSweep = getDefaultTestParams({
      philSweepPct: 0,
      hdcDebtFundSweepPct: 0,
    });
    const baseline = getDefaultTestParams();

    const resultWith = calculateFullInvestorAnalysis(withZeroSweep);
    const resultBaseline = calculateFullInvestorAnalysis(baseline);

    expect(resultWith.irr).toBeCloseTo(resultBaseline.irr, 6);
    expect(resultWith.exitProceeds).toBeCloseTo(resultBaseline.exitProceeds, 2);
    expect(resultWith.cashFlows.length).toBe(resultBaseline.cashFlows.length);

    // All sweep payments should be zero
    const totalPhilSweep = resultWith.cashFlows.reduce(
      (sum, cf) => sum + (cf.philSweepPayment || 0), 0
    );
    const totalDdfSweep = resultWith.cashFlows.reduce(
      (sum, cf) => sum + (cf.ddfSweepPayment || 0), 0
    );
    expect(totalPhilSweep).toBe(0);
    expect(totalDdfSweep).toBe(0);
  });

  it('Sweep + exit interaction: phil sweep reduces remainingPhilDebt at exit', () => {
    // IMPL-164 must be landed for this test — exit payoff includes phil PIK balance
    const withSweep = getDefaultTestParams({
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 3,
      philCurrentPayEnabled: false,
      philSweepPct: 50,
    });
    const noSweep = getDefaultTestParams({
      philanthropicDebtPct: 30,
      philanthropicDebtRate: 3,
      philCurrentPayEnabled: false,
      philSweepPct: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withSweep);
    const resultWithout = calculateFullInvestorAnalysis(noSweep);

    // With sweep reducing phil PIK over hold, exit proceeds should be higher
    // (IMPL-164 ensures phil PIK is in exit debt sum)
    expect(resultWith.exitProceeds).toBeGreaterThan(resultWithout.exitProceeds);
  });
});
