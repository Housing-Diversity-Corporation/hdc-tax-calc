/**
 * Computed Hold Period — Integration Tests
 *
 * Verifies that the full calculation engine produces correct results
 * when holdPeriod is driven by LIHTC credit exhaustion via computeHoldPeriod().
 *
 * TIMING PRECISION FIX (Hypothesis A): Month-precise arithmetic.
 * totalInvestmentYears = Math.ceil((construction + credits + delay) / 12) + 1
 * This replaces the old dual-floor+spillover formula that compounded rounding errors.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('Computed Hold Period — Integration Tests', () => {
  // totalYears = Math.ceil((constMo + creditPeriod*12 + delayMo) / 12) + 1 disposition
  const scenarios = [
    { constructionDevMonths: 0,  pisMonth: 1,  delayMonths: 0,  holdFromPIS: 10, totalYears: 11 }, // ceil(120/12)+1
    { constructionDevMonths: 0,  pisMonth: 7,  delayMonths: 0,  holdFromPIS: 11, totalYears: 12 }, // ceil(132/12)+1
    { constructionDevMonths: 0,  pisMonth: 7,  delayMonths: 6,  holdFromPIS: 11, totalYears: 13 }, // ceil(138/12)+1
    { constructionDevMonths: 0,  pisMonth: 12, delayMonths: 0,  holdFromPIS: 11, totalYears: 12 }, // ceil(132/12)+1
    { constructionDevMonths: 24, pisMonth: 7,  delayMonths: 0,  holdFromPIS: 11, totalYears: 14 }, // ceil(156/12)+1
    { constructionDevMonths: 24, pisMonth: 7,  delayMonths: 6,  holdFromPIS: 11, totalYears: 15 }, // ceil(162/12)+1
    { constructionDevMonths: 48, pisMonth: 7,  delayMonths: 6,  holdFromPIS: 11, totalYears: 17 }, // ceil(186/12)+1
    { constructionDevMonths: 0,  pisMonth: 1,  delayMonths: 12, holdFromPIS: 10, totalYears: 12 }, // ceil(132/12)+1
    { constructionDevMonths: 0,  pisMonth: 1,  delayMonths: 13, holdFromPIS: 10, totalYears: 13 }, // ceil(133/12)+1
  ];

  describe('holdPeriod and cashFlows.length match expected totalInvestmentYears', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth, delay=$delayMonths → total=$totalYears',
      ({ constructionDevMonths, pisMonth, delayMonths, totalYears }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
          taxBenefitDelayMonths: delayMonths,
        }));

        expect(result.holdPeriod).toBe(totalYears);
        expect(result.cashFlows.length).toBe(totalYears);
      }
    );
  });

  describe('remainingLIHTCCredits === 0 for all standard scenarios', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth, delay=$delayMonths',
      ({ constructionDevMonths, pisMonth, delayMonths }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
          taxBenefitDelayMonths: delayMonths,
          lihtcEnabled: true,
          lihtcEligibleBasis: 50,
        }));

        expect(result.remainingLIHTCCredits).toBe(0);
      }
    );
  });

  describe('OZ qualification: totalInvestmentYears >= 10 for all scenarios', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth, delay=$delayMonths → total=$totalYears >= 10',
      ({ constructionDevMonths, pisMonth, delayMonths, totalYears }) => {
        expect(totalYears).toBeGreaterThanOrEqual(10);

        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
          taxBenefitDelayMonths: delayMonths,
          ozEnabled: true,
          ozType: 'standard',
          deferredCapitalGains: 1,
          capitalGainsTaxRate: 23.8,
        }));

        // OZ benefit should be present since totalInvestmentYears >= 10
        expect(result.holdPeriod).toBeGreaterThanOrEqual(10);
      }
    );
  });
});
