/**
 * IMPL-119: NIIT-Aware Depreciation Benefit Calculation
 *
 * Validates that depreciation tax savings include NIIT (3.8%) when
 * the investor's depreciation offsets passive income:
 * - REP + grouped: no NIIT (Section 1411(c)(1)(A) exception)
 * - REP ungrouped: NIIT applies (passive losses)
 * - Non-REP: NIIT applies (passive losses)
 * - Territory: no NIIT (regardless of investor type)
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import type { CalculationParams } from '../../../../types/taxbenefits';
import { getDefaultTestParams } from '../test-helpers';

const makeParams = (overrides: Partial<CalculationParams>) =>
  getDefaultTestParams({
    projectCost: 86,        // $86M
    landValue: 10,          // $10M
    yearOneNOI: 5.113,
    noiGrowthRate: 3,
    exitCapRate: 6,
    investorEquityPct: 14,
    seniorDebtPct: 66,
    philDebtPct: 20,
    yearOneDepreciationPct: 25,
    holdPeriod: 10,
    federalTaxRate: 37,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    ozEnabled: false,
    includeDepreciationSchedule: true,
    ...overrides,
  }) as CalculationParams;

describe('IMPL-119: NIIT-Aware Depreciation Benefits', () => {

  describe('Test 1: REP + grouped, WA (no state tax, no NIIT)', () => {
    it('should use federalTaxRate only (37%) for depreciation benefits', () => {
      const result = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        investorTrack: 'rep',
        groupingElection: true,
        niitApplies: false,
        effectiveTaxRate: 37,
        effectiveTaxRateForBonus: 37,
        effectiveTaxRateForStraightLine: 37,
        bonusConformityRate: 1,
      }));

      const y1Benefit = result.investorCashFlows[0]?.taxBenefit || 0;
      expect(y1Benefit).toBeGreaterThan(0);

      // Depreciable basis: 86 - 10 = 76, bonus = 76 * 0.25 = 19
      // Expected bonus benefit at 37%: 19 * 0.37 = 7.03
      const expectedBonusBenefit = (86 - 10) * 0.25 * 0.37;
      expect(y1Benefit).toBeGreaterThan(expectedBonusBenefit * 0.9);
      expect(y1Benefit).toBeLessThan(expectedBonusBenefit * 1.5);
    });
  });

  describe('Test 2: Passive investor, WA (no state tax, NIIT applies)', () => {
    it('should produce higher benefits than REP+grouped by ratio 40.8/37', () => {
      const passiveResult = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        investorTrack: 'non-rep',
        niitApplies: true,
        effectiveTaxRate: 40.8,
        effectiveTaxRateForBonus: 40.8,
        effectiveTaxRateForStraightLine: 40.8,
        bonusConformityRate: 1,
      }));

      const repResult = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        investorTrack: 'rep',
        groupingElection: true,
        niitApplies: false,
        effectiveTaxRate: 37,
        effectiveTaxRateForBonus: 37,
        effectiveTaxRateForStraightLine: 37,
        bonusConformityRate: 1,
      }));

      const ratio = passiveResult.investorTaxBenefits / repResult.investorTaxBenefits;
      expect(ratio).toBeCloseTo(40.8 / 37, 2);
    });
  });

  describe('Test 3: Passive investor, NJ (state tax + NIIT)', () => {
    it('should use 37 + 3.8 + 10.75 = 51.55% combined rate', () => {
      const result = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'NJ',
        investorState: 'NJ',
        stateTaxRate: 10.75,
        stateCapitalGainsRate: 10.75,
        investorTrack: 'non-rep',
        niitApplies: true,
        effectiveTaxRate: 51.55,
        effectiveTaxRateForBonus: 51.55,
        effectiveTaxRateForStraightLine: 51.55,
        bonusConformityRate: 1,
      }));

      const y1Benefit = result.investorCashFlows[0]?.taxBenefit || 0;
      const expectedBonusBenefit = (86 - 10) * 0.25 * 0.5155;
      expect(y1Benefit).toBeGreaterThan(expectedBonusBenefit * 0.9);
      expect(y1Benefit).toBeLessThan(expectedBonusBenefit * 1.5);
    });
  });

  describe('Test 4: REP + grouped, NJ (state tax, no NIIT)', () => {
    it('should use 37 + 10.75 = 47.75% (no NIIT for grouped REP)', () => {
      const result = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'NJ',
        investorState: 'NJ',
        stateTaxRate: 10.75,
        stateCapitalGainsRate: 10.75,
        investorTrack: 'rep',
        groupingElection: true,
        niitApplies: false,
        effectiveTaxRate: 47.75,
        effectiveTaxRateForBonus: 47.75,
        effectiveTaxRateForStraightLine: 47.75,
        bonusConformityRate: 1,
      }));

      const y1Benefit = result.investorCashFlows[0]?.taxBenefit || 0;
      const expectedBonusBenefit = (86 - 10) * 0.25 * 0.4775;
      expect(y1Benefit).toBeGreaterThan(expectedBonusBenefit * 0.9);
      expect(y1Benefit).toBeLessThan(expectedBonusBenefit * 1.5);
    });
  });

  describe('Test 5: Territory investor (PR) — no NIIT regardless', () => {
    it('should match REP+grouped benefits when both at 37%', () => {
      const territoryResult = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'PR',
        investorState: 'PR',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        investorTrack: 'non-rep',
        niitApplies: false,
        effectiveTaxRate: 37,
        effectiveTaxRateForBonus: 37,
        effectiveTaxRateForStraightLine: 37,
        bonusConformityRate: 1,
      }));

      const repGroupedResult = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        investorTrack: 'rep',
        groupingElection: true,
        niitApplies: false,
        effectiveTaxRate: 37,
        effectiveTaxRateForBonus: 37,
        effectiveTaxRateForStraightLine: 37,
        bonusConformityRate: 1,
      }));

      // Same rate → same benefits
      expect(territoryResult.investorTaxBenefits).toBeCloseTo(repGroupedResult.investorTaxBenefits, 0);
    });
  });

  describe('Engine default path: niitApplies gates NIIT', () => {
    it('should exclude NIIT from default rate when niitApplies=false', () => {
      // Clear effectiveTaxRate so engine falls through to default rate computation
      const noNIIT = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        niitApplies: false,
        effectiveTaxRate: 0,
        bonusConformityRate: 1,
      }));

      const withNIIT = calculateFullInvestorAnalysis(makeParams({
        selectedState: 'WA',
        investorState: 'WA',
        stateTaxRate: 0,
        stateCapitalGainsRate: 0,
        niitApplies: true,
        effectiveTaxRate: 0,
        bonusConformityRate: 1,
      }));

      expect(withNIIT.investorTaxBenefits).toBeGreaterThan(noNIIT.investorTaxBenefits);
      const ratio = withNIIT.investorTaxBenefits / noNIIT.investorTaxBenefits;
      expect(ratio).toBeCloseTo(40.8 / 37, 1);
    });
  });
});
