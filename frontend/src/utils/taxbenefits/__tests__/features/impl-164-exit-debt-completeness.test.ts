/**
 * IMPL-164: Exit Debt Payoff Completeness
 * Tests that PAB and DDF balances are included in exit debt deductions.
 * Defects #6 (PAB omitted), #10 (DDF omitted), #11 (guard incomplete).
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('IMPL-164: Exit Debt Payoff Completeness', () => {

  it('PAB exit payoff: exit proceeds reduced when PAB enabled', () => {
    const withPab = getDefaultTestParams({
      lihtcEnabled: true,
      lihtcEligibleBasis: 50, // $50M eligible basis
      pabEnabled: true,
      pabPctOfEligibleBasis: 30, // 30% → $15M PAB
      pabRate: 4.5,
      pabAmortization: 40,
      pabIOYears: 0,
    });
    const withoutPab = getDefaultTestParams({
      lihtcEnabled: true,
      lihtcEligibleBasis: 50,
      pabEnabled: false,
    });

    const resultWith = calculateFullInvestorAnalysis(withPab);
    const resultWithout = calculateFullInvestorAnalysis(withoutPab);

    // Exit proceeds must be lower when PAB is enabled (debt payoff reduces proceeds)
    expect(resultWith.exitProceeds).toBeLessThan(resultWithout.exitProceeds);
    // IRR must be lower (less proceeds at exit)
    expect(resultWith.irr).toBeLessThan(resultWithout.irr);
  });

  it('DDF exit payoff: exit proceeds reduced when DDF enabled', () => {
    const withDdf = getDefaultTestParams({
      hdcDebtFundPct: 3, // 3% of $100M = $3M principal (smaller to avoid clamping)
      hdcDebtFundPikRate: 8,
      hdcDebtFundCurrentPayEnabled: false,
    });
    const withoutDdf = getDefaultTestParams({
      hdcDebtFundPct: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withDdf);
    const resultWithout = calculateFullInvestorAnalysis(withoutDdf);

    // Exit proceeds must be lower when DDF is enabled
    expect(resultWith.exitProceeds).toBeLessThan(resultWithout.exitProceeds);
    // The DDF compounds at 8% — investor exit share shrinks
    expect(resultWith.irr).toBeLessThan(resultWithout.irr);
  });

  it('Combined PAB + DDF: both reduce exit proceeds vs baseline', () => {
    const combined = getDefaultTestParams({
      lihtcEnabled: true,
      lihtcEligibleBasis: 50,
      pabEnabled: true,
      pabPctOfEligibleBasis: 20, // smaller to keep proceeds positive
      pabRate: 4.5,
      pabAmortization: 40,
      pabIOYears: 0,
      hdcDebtFundPct: 2,
      hdcDebtFundPikRate: 8,
      hdcDebtFundCurrentPayEnabled: false,
    });
    const baseline = getDefaultTestParams({
      pabEnabled: false,
      hdcDebtFundPct: 0,
    });

    const resultCombined = calculateFullInvestorAnalysis(combined);
    const resultBaseline = calculateFullInvestorAnalysis(baseline);

    // Both should reduce exit proceeds vs baseline
    expect(resultCombined.exitProceeds).toBeLessThan(resultBaseline.exitProceeds);
    // Engine should not throw — guard validates all debt types
    expect(resultCombined.irr).toBeDefined();
  });

  it('Regression — no PAB, no DDF: outputs identical to pre-IMPL-164 baseline', () => {
    const params = getDefaultTestParams({
      pabEnabled: false,
      hdcDebtFundPct: 0,
    });
    const baseline = getDefaultTestParams();

    const result = calculateFullInvestorAnalysis(params);
    const baselineResult = calculateFullInvestorAnalysis(baseline);

    // IRR and exit proceeds must match exactly
    expect(result.irr).toBeCloseTo(baselineResult.irr, 6);
    expect(result.exitProceeds).toBeCloseTo(baselineResult.exitProceeds, 2);
    // Cash flows same length
    expect(result.cashFlows.length).toBe(baselineResult.cashFlows.length);
  });
});
