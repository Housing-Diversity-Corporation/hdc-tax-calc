/**
 * IMPL-7.0-009: Preferred Equity Waterfall Integration Tests
 *
 * Tests the integration of preferred equity into the main exit waterfall.
 * Preferred equity sits at TIER 3: after hard debt, before sub-debt.
 *
 * 8-Tier Waterfall Structure:
 * TIER 1: Senior Debt
 * TIER 2: Philanthropic Debt
 * TIER 3: Preferred Equity (NEW - MOIC-based payment)
 * TIER 4: Outside Investor Sub-Debt
 * TIER 5: HDC Sub-Debt
 * TIER 6: Investor Sub-Debt
 * TIER 7: HDC Deferred Fees
 * TIER 8: Equity Promote Split
 *
 * @version 7.0.0
 * @date 2025-12-17
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { CalculationParams } from '../../../types/taxbenefits';

/**
 * Creates baseline parameters for preferred equity tests
 */
function createBaselineParams(overrides?: Partial<CalculationParams>): CalculationParams {
  return {
    // Project economics
    projectCost: 10_000_000,
    landValue: 0,
    yearOneNOI: 800_000,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    investorEquityPct: 25,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 500_000,
    netTaxBenefit: 450_000,
    hdcFee: 50_000,
    investorPromoteShare: 85,
    opexRatio: 30,

    // Capital stack
    seniorDebtPct: 60,
    seniorDebtRate: 5.0,
    seniorDebtAmortization: 30,
    philanthropicDebtPct: 0,
    philanthropicDebtRate: 0,
    philDebtAmortization: 40,

    // Preferred equity settings
    prefEquityEnabled: true,
    prefEquityPct: 15, // 15% = $1.5M
    prefEquityTargetMOIC: 1.7, // Target 1.7x = $2.55M
    prefEquityAccrualRate: 12,
    prefEquityOzEligible: false,

    // Sub-debt
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 10,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 8,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,

    // Outside investor sub-debt
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtRate: 8,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,

    // HDC fees
    aumFeeEnabled: false,
    aumFeeRate: 0,

    ...overrides
  };
}

describe('IMPL-7.0-009: Preferred Equity Waterfall Integration', () => {
  describe('Basic Integration', () => {
    test('01: Preferred equity disabled - no impact on calculations', () => {
      const params = createBaselineParams({
        prefEquityEnabled: false,
        prefEquityPct: 0
      });

      const result = calculateFullInvestorAnalysis(params);

      expect(result.preferredEquityResult).toBeUndefined();
      expect(result.preferredEquityAtExit).toBe(0);
      expect(result.exitProceeds).toBeGreaterThan(0);
    });

    test('02: Preferred equity enabled with 15% allocation', () => {
      const params = createBaselineParams();

      const result = calculateFullInvestorAnalysis(params);

      expect(result.preferredEquityResult).toBeDefined();
      expect(result.preferredEquityResult!.principal).toBe(1_500_000); // 15% of $10M
      expect(result.preferredEquityAtExit).toBeGreaterThan(0);
    });

    test('03: Preferred equity returns properly structured', () => {
      const params = createBaselineParams();

      const result = calculateFullInvestorAnalysis(params);

      const prefEquity = result.preferredEquityResult!;
      expect(prefEquity).toHaveProperty('principal');
      expect(prefEquity).toHaveProperty('targetAmount');
      expect(prefEquity).toHaveProperty('paymentAtExit');
      expect(prefEquity).toHaveProperty('achievedMOIC');
      expect(prefEquity).toHaveProperty('achievedIRR');
      expect(prefEquity).toHaveProperty('moicShortfall');
      expect(prefEquity).toHaveProperty('dollarShortfall');
      expect(prefEquity).toHaveProperty('targetAchieved');
      expect(prefEquity).toHaveProperty('metadata');
    });
  });

  describe('MOIC Achievement', () => {
    test('04: Full MOIC achievement - 1.5x target', () => {
      const params = createBaselineParams({
        prefEquityPct: 10,
        prefEquityTargetMOIC: 1.5,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(1_000_000); // 10% of $10M
      expect(prefEquity.targetAmount).toBe(1_500_000); // 1.5x
      expect(prefEquity.achievedMOIC).toBeCloseTo(1.5, 2);
      expect(prefEquity.targetAchieved).toBe(true);
      expect(prefEquity.moicShortfall).toBe(0);
      expect(prefEquity.dollarShortfall).toBe(0);
    });

    test('05: Full MOIC achievement - 1.7x target', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        prefEquityTargetMOIC: 1.7,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(1_500_000); // 15% of $10M
      expect(prefEquity.targetAmount).toBe(2_550_000); // 1.7x
      expect(prefEquity.achievedMOIC).toBeCloseTo(1.7, 2);
      expect(prefEquity.targetAchieved).toBe(true);
      expect(prefEquity.moicShortfall).toBe(0);
    });

    test('06: Full MOIC achievement - 2.0x target', () => {
      const params = createBaselineParams({
        prefEquityPct: 10,
        prefEquityTargetMOIC: 2.0,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(1_000_000);
      expect(prefEquity.targetAmount).toBe(2_000_000); // 2.0x
      expect(prefEquity.achievedMOIC).toBeCloseTo(2.0, 2);
      expect(prefEquity.targetAchieved).toBe(true);
    });

    test('07: Full MOIC achievement - 2.0x target with 20% allocation', () => {
      const params = createBaselineParams({
        prefEquityPct: 20,
        prefEquityTargetMOIC: 2.0,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(2_000_000); // 20% of $10M
      expect(prefEquity.targetAmount).toBe(4_000_000); // 2.0x target
      expect(prefEquity.achievedMOIC).toBeCloseTo(2.0, 1);
      expect(prefEquity.targetAchieved).toBe(true);
    });
  });

  describe('Waterfall Priority Order', () => {
    test('08: TIER 3 - Paid after senior debt, before sub-debt', () => {
      const params = createBaselineParams({
        seniorDebtPct: 60,
        prefEquityPct: 15,
        hdcSubDebtPct: 5,
      });

      const result = calculateFullInvestorAnalysis(params);

      // Senior debt is paid off first
      expect(result.remainingDebtAtExit).toBeGreaterThan(0);

      // Preferred equity is paid next (TIER 3)
      expect(result.preferredEquityAtExit).toBeGreaterThan(0);

      // Sub-debt is paid after (TIER 5)
      expect(result.subDebtAtExit).toBeGreaterThan(0);

      // Equity gets remainder (TIER 8)
      expect(result.exitProceeds).toBeGreaterThan(0);
    });

    test('09: TIER 3 - Preferred equity before outside investor sub-debt', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        outsideInvestorSubDebtPct: 10,
        outsideInvestorSubDebtPikRate: 8,
      });

      const result = calculateFullInvestorAnalysis(params);

      // Preferred equity paid (TIER 3)
      expect(result.preferredEquityAtExit).toBeGreaterThan(0);

      // Outside investor sub-debt paid after (TIER 4)
      expect(result.outsideInvestorSubDebtAtExit).toBeGreaterThan(0);

      // Both should receive payments
      const prefEquity = result.preferredEquityResult!;
      expect(prefEquity.paymentAtExit).toBeGreaterThan(0);
    });

    test('10: Exit proceeds reduced by preferred equity payment', () => {
      const params = createBaselineParams({
        prefEquityEnabled: false,
        prefEquityPct: 0
      });

      const resultWithout = calculateFullInvestorAnalysis(params);

      const paramsWithPrefEquity = createBaselineParams({
        prefEquityEnabled: true,
        prefEquityPct: 15
      });

      const resultWith = calculateFullInvestorAnalysis(paramsWithPrefEquity);

      // Exit proceeds should be lower when preferred equity is enabled
      expect(resultWith.exitProceeds).toBeLessThan(resultWithout.exitProceeds);

      // Reduction equals investor's share (85%) of preferred equity payment
      const reduction = resultWithout.exitProceeds - resultWith.exitProceeds;
      const expectedReduction = (resultWith.preferredEquityAtExit || 0) * 0.85;
      expect(reduction).toBeCloseTo(expectedReduction, -3);
    });
  });

  describe('Edge Cases', () => {
    test('11: Zero percent preferred equity - equivalent to disabled', () => {
      const params = createBaselineParams({
        prefEquityEnabled: true,
        prefEquityPct: 0
      });

      const result = calculateFullInvestorAnalysis(params);

      expect(result.preferredEquityResult).toBeUndefined();
      expect(result.preferredEquityAtExit).toEqual(0);
    });

    test('12: Maximum 40% preferred equity allocation', () => {
      const params = createBaselineParams({
        prefEquityPct: 40,
        prefEquityTargetMOIC: 1.5,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(4_000_000); // 40% of $10M
      expect(prefEquity.targetAmount).toBe(6_000_000); // 1.5x
    });

    test('13: Low exit value - preferred equity gets partial payment', () => {
      const params = createBaselineParams({
        prefEquityPct: 20,
        prefEquityTargetMOIC: 2.0,
        exitCapRate: 20, // Distressed market - NOI/0.20 ≈ $5M exit value
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.principal).toBe(2_000_000);
      expect(prefEquity.targetAmount).toBe(4_000_000);
      expect(prefEquity.achievedMOIC).toBeLessThan(1.0); // Doesn't even get principal back
      expect(prefEquity.targetAchieved).toBe(false);
      expect(prefEquity.dollarShortfall).toBeGreaterThan(2_000_000);
    });

    test('14: Very high exit value - all tiers satisfied', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        prefEquityTargetMOIC: 2.0,
        hdcSubDebtPct: 5, // HDC sub-debt enabled
        exitCapRate: 4, // Strong market - higher exit value
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.achievedMOIC).toBeCloseTo(2.0, 2);
      expect(prefEquity.targetAchieved).toBe(true);
      expect(result.subDebtAtExit).toBeGreaterThan(0);
      expect(result.exitProceeds).toBeGreaterThan(5_000_000); // Substantial equity proceeds
    });
  });

  describe('Integration with Other Features', () => {
    test('15: Preferred equity with philanthropic debt', () => {
      const params = createBaselineParams({
        philanthropicDebtPct: 10,
        philanthropicDebtRate: 0,
        prefEquityPct: 15,
      });

      const result = calculateFullInvestorAnalysis(params);

      // Both phil debt and preferred equity should be present
      expect(result.remainingDebtAtExit).toBeGreaterThan(5_500_000); // Senior (amortized) + Phil
      expect(result.remainingDebtAtExit).toBeLessThan(7_000_000);    // Sanity check
      expect(result.preferredEquityAtExit).toBeGreaterThan(0);
      expect(result.preferredEquityResult!.targetAchieved).toBe(true);
    });

    test('16: Preferred equity with HDC sub-debt', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        hdcSubDebtPct: 5,           // HDC sub-debt as % of project cost
        hdcSubDebtPikRate: 10,      // 10% PIK interest rate
        pikCurrentPayEnabled: false, // Full PIK (no current pay)
      });

      const result = calculateFullInvestorAnalysis(params);

      // Preferred equity paid before HDC sub-debt
      expect(result.preferredEquityAtExit).toBeGreaterThan(0);
      expect(result.subDebtAtExit).toBeGreaterThan(500_000);

      const prefEquity = result.preferredEquityResult!;
      expect(prefEquity.targetAchieved).toBe(true);
    });

    test('17: Preferred equity with all debt layers', () => {
      const params = createBaselineParams({
        seniorDebtPct: 60,
        philanthropicDebtPct: 5,
        philanthropicDebtRate: 2,
        prefEquityPct: 10,
        hdcSubDebtPct: 5,              // HDC sub-debt
        investorSubDebtPct: 5,         // Investor sub-debt
        outsideInvestorSubDebtPct: 5,  // Outside investor sub-debt
      });

      const result = calculateFullInvestorAnalysis(params);

      // All layers should receive payments
      expect(result.remainingDebtAtExit).toBeGreaterThan(0); // TIER 1-2
      expect(result.preferredEquityAtExit).toBeGreaterThan(0); // TIER 3
      expect(result.outsideInvestorSubDebtAtExit).toBeGreaterThan(0); // TIER 4
      expect(result.subDebtAtExit).toBeGreaterThan(0); // TIER 5
      expect(result.investorSubDebtAtExit).toBeGreaterThan(0); // TIER 6
      expect(result.exitProceeds).toBeGreaterThan(0); // TIER 8
    });
  });

  describe('IRR and Return Calculations', () => {
    test('18: Preferred equity achieves target IRR with MOIC', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        prefEquityTargetMOIC: 1.7,
        holdPeriod: 7,
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.achievedMOIC).toBeCloseTo(1.7, 2);
      expect(prefEquity.achievedIRR).toBeGreaterThan(5); // Reasonable IRR for 1.7x over 7 years
      expect(prefEquity.achievedIRR).toBeLessThan(15);
    });

    test('19: Preferred equity metadata correctly captured', () => {
      const params = createBaselineParams({
        prefEquityPct: 15,
        prefEquityTargetMOIC: 1.8,
        prefEquityAccrualRate: 14,
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);
      const prefEquity = result.preferredEquityResult!;

      expect(prefEquity.metadata.prefEquityPct).toBe(15);
      expect(prefEquity.metadata.targetMOIC).toBe(1.8);
      expect(prefEquity.metadata.accrualRate).toBe(14);
      expect(prefEquity.metadata.holdPeriod).toBe(10);
    });

    test('20: Common equity returns reduced proportionally', () => {
      const paramsWithout = createBaselineParams({
        prefEquityEnabled: false,
        investorPromoteShare: 85
      });

      const resultWithout = calculateFullInvestorAnalysis(paramsWithout);

      const paramsWith = createBaselineParams({
        prefEquityEnabled: true,
        prefEquityPct: 15,
        investorPromoteShare: 85
      });

      const resultWith = calculateFullInvestorAnalysis(paramsWith);

      // Common equity IRR should be lower when preferred equity takes priority payment
      expect(resultWith.irr).toBeLessThan(resultWithout.irr);

      // But project should still be viable
      expect(resultWith.irr).toBeGreaterThan(0);
      expect(resultWith.multiple).toBeGreaterThan(1.0);
    });
  });
});
