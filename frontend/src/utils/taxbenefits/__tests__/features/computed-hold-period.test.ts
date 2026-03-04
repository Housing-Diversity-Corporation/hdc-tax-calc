/**
 * Computed Hold Period — Integration Tests
 *
 * Verifies that the full calculation engine produces correct results
 * when holdPeriod is driven by LIHTC credit exhaustion via computeHoldPeriod().
 *
 * IMPL-116: Removed taxBenefitDelayMonths (deprecated).
 * Will be replaced by computeTimeline.test.ts in IMPL-116c.
 *
 * TIMING PRECISION FIX (Hypothesis A): Month-precise arithmetic.
 * totalInvestmentYears = Math.ceil((construction + credits) / 12) + 1
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('Computed Hold Period — Integration Tests', () => {
  // totalYears = Math.ceil((constMo + creditPeriod*12) / 12) + 1 disposition
  const scenarios = [
    { constructionDevMonths: 0,  pisMonth: 1,  holdFromPIS: 10, totalYears: 11 }, // ceil(120/12)+1
    { constructionDevMonths: 0,  pisMonth: 7,  holdFromPIS: 11, totalYears: 12 }, // ceil(132/12)+1
    { constructionDevMonths: 0,  pisMonth: 12, holdFromPIS: 11, totalYears: 12 }, // ceil(132/12)+1
    { constructionDevMonths: 24, pisMonth: 7,  holdFromPIS: 11, totalYears: 14 }, // ceil(156/12)+1
    { constructionDevMonths: 48, pisMonth: 7,  holdFromPIS: 11, totalYears: 16 }, // ceil(180/12)+1
  ];

  describe('holdPeriod and cashFlows.length match expected totalInvestmentYears', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth → total=$totalYears',
      ({ constructionDevMonths, pisMonth, totalYears }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
          investmentDate: undefined, // force old path — will be rewritten in IMPL-116c
        }));

        expect(result.holdPeriod).toBe(totalYears);
        expect(result.cashFlows.length).toBe(totalYears);
      }
    );
  });

  describe('remainingLIHTCCredits === 0 for all standard scenarios', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth',
      ({ constructionDevMonths, pisMonth }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
          lihtcEnabled: true,
          lihtcEligibleBasis: 50,
        }));

        expect(result.remainingLIHTCCredits).toBe(0);
      }
    );
  });

  describe('OZ qualification: totalInvestmentYears >= 10 for all scenarios', () => {
    it.each(scenarios)(
      'construction=$constructionDevMonths, pisMonth=$pisMonth → total=$totalYears >= 10',
      ({ constructionDevMonths, pisMonth, totalYears }) => {
        expect(totalYears).toBeGreaterThanOrEqual(10);

        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          constructionDelayMonths: constructionDevMonths,
          placedInServiceMonth: pisMonth,
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
