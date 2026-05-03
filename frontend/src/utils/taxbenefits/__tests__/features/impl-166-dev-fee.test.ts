/**
 * IMPL-166: Developer Deferred Fee (C Note) Tests
 * Total fee with closing piece (equity offset) and deferred balance
 * paid from surplus cash at Priority 5 (after sweeps). No interest.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('IMPL-166: Developer Deferred Fee (C Note)', () => {

  it('Closing piece reduces net equity', () => {
    const withFee = getDefaultTestParams({
      devFeeTotal: 5, // $5M
      devFeeClosingAmount: 1, // $1M at closing
    });
    const noFee = getDefaultTestParams({
      devFeeTotal: 0,
      devFeeClosingAmount: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withFee);
    const resultWithout = calculateFullInvestorAnalysis(noFee);

    // Net equity should be lower with closing piece (higher MOIC denominator offset)
    // The closing piece reduces investorEquityAfterOffset
    expect(resultWith.netEquity).toBeLessThan(resultWithout.netEquity!);
  });

  it('Deferred balance pays from surplus cash', () => {
    const params = getDefaultTestParams({
      devFeeTotal: 2, // $2M total
      devFeeClosingAmount: 0.5, // $500K at closing
      // Deferred = $1.5M, ample NOI should pay it down
    });

    const result = calculateFullInvestorAnalysis(params);

    // Verify devFeePayment fields exist in cash flows
    const totalDevFeePayments = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.devFeePayment || 0), 0
    );
    expect(totalDevFeePayments).toBeGreaterThan(0);

    // Verify devFeeBalance decreases over time
    const firstYearBalance = result.cashFlows[0].devFeeBalance;
    const lastYearBalance = result.cashFlows[result.cashFlows.length - 1].devFeeBalance;
    expect(lastYearBalance!).toBeLessThanOrEqual(firstYearBalance!);
  });

  it('Full paydown before exit: surplus exceeds deferred', () => {
    const params = getDefaultTestParams({
      devFeeTotal: 0.5, // $500K total — small, easily paid from surplus
      devFeeClosingAmount: 0.1, // $100K at closing
      // Deferred = $400K — should be paid off early
    });

    const result = calculateFullInvestorAnalysis(params);

    // With small deferred balance and ample NOI, balance should reach 0
    const lastBalance = result.cashFlows[result.cashFlows.length - 1].devFeeBalance;
    expect(lastBalance).toBe(0);

    // After payoff, devFeePayment should be 0 for remaining years
    const zeroPaymentYears = result.cashFlows.filter(
      cf => (cf.devFeeBalance || 0) === 0 && (cf.devFeePayment || 0) === 0
    );
    expect(zeroPaymentYears.length).toBeGreaterThan(0);
  });

  it('Exit deduction: remaining balance deducted at exit', () => {
    // Large devFee with tight NOI — won't pay off during operations
    const withFee = getDefaultTestParams({
      yearOneNOI: 4.5, // Tight NOI
      devFeeTotal: 4, // $4M total
      devFeeClosingAmount: 0, // Nothing at closing
    });
    const noFee = getDefaultTestParams({
      yearOneNOI: 4.5,
      devFeeTotal: 0,
    });

    const resultWith = calculateFullInvestorAnalysis(withFee);
    const resultWithout = calculateFullInvestorAnalysis(noFee);

    // Exit proceeds should be lower (devFee balance deducted at exit)
    expect(resultWith.exitProceeds).toBeLessThan(resultWithout.exitProceeds);
  });

  it('DSCR-gated: no surplus means no devFee payment', () => {
    const params = getDefaultTestParams({
      yearOneNOI: 4.2, // Barely meets DSCR
      devFeeTotal: 3,
      devFeeClosingAmount: 0,
    });

    const result = calculateFullInvestorAnalysis(params);

    // With tight DSCR, devFee payments should be minimal
    const totalDevFeePayments = result.cashFlows.reduce(
      (sum, cf) => sum + (cf.devFeePayment || 0), 0
    );

    // Compare to ample NOI case
    const ampleParams = getDefaultTestParams({
      yearOneNOI: 8,
      devFeeTotal: 3,
      devFeeClosingAmount: 0,
    });
    const ampleResult = calculateFullInvestorAnalysis(ampleParams);
    const ampleTotalPayments = ampleResult.cashFlows.reduce(
      (sum, cf) => sum + (cf.devFeePayment || 0), 0
    );

    expect(totalDevFeePayments).toBeLessThan(ampleTotalPayments);
  });

  it('Zero devFee regression: outputs identical to baseline', () => {
    const withZero = getDefaultTestParams({
      devFeeTotal: 0,
      devFeeClosingAmount: 0,
    });
    const baseline = getDefaultTestParams();

    const resultWith = calculateFullInvestorAnalysis(withZero);
    const resultBaseline = calculateFullInvestorAnalysis(baseline);

    expect(resultWith.irr).toBeCloseTo(resultBaseline.irr, 6);
    expect(resultWith.exitProceeds).toBeCloseTo(resultBaseline.exitProceeds, 2);
    expect(resultWith.cashFlows.length).toBe(resultBaseline.cashFlows.length);
  });
});
