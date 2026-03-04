/**
 * Computed Hold Period — Integration Tests (computeTimeline path)
 *
 * Verifies that the full calculation engine produces correct holdPeriod,
 * LIHTC exhaustion, and OZ qualification via computeTimeline.
 *
 * IMPL-117: Migrated from computeHoldPeriod (old path) to computeTimeline.
 * Scenarios now vary investmentDate + constructionDelayMonths instead of
 * placedInServiceMonth (which is auto-derived from timeline).
 *
 * totalInvestmentYears = ceil(totalHoldMonths / 12)
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('Computed Hold Period — Integration Tests (computeTimeline)', () => {
  // Scenarios: investmentDate + constructionDelayMonths → totalInvestmentYears
  // Jan PIS: 10 credit years, no catch-up
  // Non-Jan PIS: 11 credit years (Year 1 prorated + Year 11 catch-up)
  const scenarios = [
    { investmentDate: '2025-01-01', constructionDelayMonths: 0,  label: 'Jan PIS, no construction', totalYears: 10 },
    { investmentDate: '2025-07-01', constructionDelayMonths: 0,  label: 'Jul PIS, no construction', totalYears: 11 },
    { investmentDate: '2025-12-01', constructionDelayMonths: 0,  label: 'Dec PIS, no construction', totalYears: 11 },
    { investmentDate: '2025-01-01', constructionDelayMonths: 24, label: 'Jan PIS, 24mo construction', totalYears: 12 },
    { investmentDate: '2025-01-01', constructionDelayMonths: 48, label: 'Jan PIS, 48mo construction', totalYears: 14 },
  ];

  describe('holdPeriod and cashFlows.length match computeTimeline', () => {
    it.each(scenarios)(
      '$label → total=$totalYears',
      ({ investmentDate, constructionDelayMonths, totalYears }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          investmentDate,
          constructionDelayMonths,
        }));

        expect(result.holdPeriod).toBe(totalYears);
        expect(result.cashFlows.length).toBe(totalYears);
      }
    );
  });

  describe('remainingLIHTCCredits === 0 for all standard scenarios', () => {
    it.each(scenarios)(
      '$label',
      ({ investmentDate, constructionDelayMonths }) => {
        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          investmentDate,
          constructionDelayMonths,
          lihtcEnabled: true,
          lihtcEligibleBasis: 50,
        }));

        expect(result.remainingLIHTCCredits).toBe(0);
      }
    );
  });

  describe('OZ qualification: holdPeriod >= 10 for all scenarios', () => {
    it.each(scenarios)(
      '$label → total=$totalYears >= 10',
      ({ investmentDate, constructionDelayMonths, totalYears }) => {
        expect(totalYears).toBeGreaterThanOrEqual(10);

        const result = calculateFullInvestorAnalysis(getDefaultTestParams({
          investmentDate,
          constructionDelayMonths,
          ozEnabled: true,
          ozType: 'standard',
          deferredCapitalGains: 1,
          capitalGainsTaxRate: 23.8,
        }));

        expect(result.holdPeriod).toBeGreaterThanOrEqual(10);
      }
    );
  });
});
