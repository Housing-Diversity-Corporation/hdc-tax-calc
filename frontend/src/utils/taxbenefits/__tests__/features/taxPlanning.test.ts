/**
 * Tests for Tax Planning Features
 */

import { buildDepreciationSchedule, formatDepreciationSchedule } from '../../depreciationSchedule';
import { calculateREPCapacity, calculateNonREPCapacity } from '../../taxCapacity';
import { optimizeIRAConversion } from '../../iraConversion';
import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('Tax Planning Calculations', () => {
  const baseParams: CalculationParams = {
    projectCost: 86_000_000,
    landValue: 10_000_000,
    yearOneNOI: 5_113_000,
    yearOneDepreciationPct: 25,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    investorEquityPct: 14,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 12_040_000, // 14% of 86M
    totalTaxBenefit: 1_247_842,
    netTaxBenefit: 1_123_058,
    hdcFee: 124_784,
    investorPromoteShare: 35,
    effectiveTaxRate: 47.85,
    holdPeriod: 10,
    investorTrack: 'rep' as const,
    includeDepreciationSchedule: true,
    federalTaxRate: 37,
    stateTaxRate: 10.9,
    selectedState: 'NY',
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 10.9
  };

  describe('Depreciation Schedule', () => {
    it('should calculate 25% cost segregation in year 1', () => {
      const schedule = buildDepreciationSchedule(baseParams);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // Building basis = 86M - 10M land = 76M
      // Year 1 depreciation = 25% of 76M = 19M
      expect(schedule.year1Spike).toBe(19_000_000);
      expect(schedule.schedule[0].bonusDepreciation).toBe(19_000_000);
      expect(schedule.schedule[0].totalDepreciation).toBe(19_000_000);
    });

    it('should calculate straight-line depreciation for years 2-10', () => {
      const schedule = buildDepreciationSchedule(baseParams);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // Remaining basis = 76M - 19M = 57M
      // Annual straight-line = 57M / 27.5 = 2,072,727
      const expectedAnnualDepreciation = (76_000_000 - 19_000_000) / 27.5;

      for (let i = 1; i < 10; i++) {
        expect(schedule.schedule[i].year).toBe(i + 1);
        expect(schedule.schedule[i].straightLineDepreciation).toBeCloseTo(expectedAnnualDepreciation, 0);
        expect(schedule.schedule[i].bonusDepreciation).toBe(0);
      }
    });

    it('should calculate tax benefits correctly', () => {
      const schedule = buildDepreciationSchedule(baseParams);

      const year1 = schedule.schedule[0];

      // IMPL-7.0-012: Year 1 tax benefit (based on 19M depreciation)
      const expectedFederalBenefit = 19_000_000 * 0.37;
      const expectedGrossStateBenefit = 19_000_000 * 0.109; // Before conformity
      const expectedNetStateBenefit = 19_000_000 * 0.109 * 0.5; // NY 50% conformity
      const expectedTotalBenefit = expectedFederalBenefit + expectedNetStateBenefit;

      expect(year1.federalBenefit).toBeCloseTo(expectedFederalBenefit, 0);
      expect(year1.stateBenefit).toBeCloseTo(expectedGrossStateBenefit, 0);
      expect(year1.stateConformityAdjustment).toBeCloseTo(expectedGrossStateBenefit * 0.5, 0);
      expect(year1.totalTaxBenefit).toBeCloseTo(expectedTotalBenefit, 0);
    });

    it('should have zero HDC fee (fee removed per IMPL-7.0-014)', () => {
      const schedule = buildDepreciationSchedule(baseParams);

      const year1 = schedule.schedule[0];
      const expectedHDCFee = 0; // Fee removed

      expect(year1.hdcFee).toBe(expectedHDCFee);
      expect(year1.netBenefit).toBeCloseTo(year1.totalTaxBenefit, 0); // Full benefit to investor
    });

    it('should format schedule for display', () => {
      const schedule = buildDepreciationSchedule(baseParams);
      const formatted = formatDepreciationSchedule(schedule);

      expect(formatted).toContain('DEPRECIATION SCHEDULE');
      // IMPL-7.0-012: Year 1 spike is now $19M (investor equity not excluded)
      expect(formatted).toContain('Year 1 Spike: $19,000,000');
      expect(formatted).toContain('Average Annual Benefit');
    });
  });

  describe('REP Tax Capacity (§461(l) Tracking)', () => {
    it('should apply $626K limitation for married filing jointly', () => {
      const repParams = {
        ...baseParams,
        w2Income: 2_000_000,
        businessIncome: 500_000
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);

      // IMPL-7.0-012: Year 1 has 19M in losses, but limited to 626K against W-2
      expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
      expect(capacity.annualLimitations[0].allowedLoss).toBeLessThanOrEqual(626_000 + 500_000);
    });

    it('should generate NOL carryforward for excess losses', () => {
      const repParams = {
        ...baseParams,
        w2Income: 2_000_000,
        businessIncome: 0 // No business income to offset
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);

      const year1 = capacity.annualLimitations[0];
      // IMPL-7.0-012: 19M loss - 626K allowed = 18.374M NOL
      expect(year1.disallowedLoss).toBeGreaterThan(18_000_000);
      expect(year1.nolGenerated).toBeGreaterThan(18_000_000);
    });

    it('should track cumulative NOL over multiple years', () => {
      const schedule = buildDepreciationSchedule(baseParams);
      const capacity = calculateREPCapacity(baseParams, schedule);

      let totalNOL = 0;
      capacity.annualLimitations.forEach(year => {
        totalNOL += year.nolGenerated;
      });

      expect(capacity.totalCapacity.nolBank).toBeCloseTo(totalNOL, 0);
    });

    it('should calculate IRA conversion capacity', () => {
      const repParams = {
        ...baseParams,
        w2Income: 1_000_000
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);

      // IRA conversion capacity should be limited to allowed losses, max 626K
      expect(capacity.totalCapacity.iraConversionCapacity).toBeLessThanOrEqual(626_000);
      expect(capacity.totalCapacity.iraConversionCapacity).toBeGreaterThan(0);
    });
  });

  describe('Non-REP Passive Loss Capacity', () => {
    it('should show unlimited capacity for passive gains', () => {
      const nonRepParams = {
        ...baseParams,
        investorTrack: 'non-rep' as const,
        passiveIncome: 5_000_000
      };

      const schedule = buildDepreciationSchedule(nonRepParams);
      const capacity = calculateNonREPCapacity(nonRepParams, schedule);

      expect(capacity.unlimitedCapacity).toBe(true);
      expect(capacity.totalPassiveLosses).toBeGreaterThan(0);
    });

    it('should analyze scenarios for different gain amounts', () => {
      const nonRepParams = {
        ...baseParams,
        investorTrack: 'non-rep' as const
      };

      const schedule = buildDepreciationSchedule(nonRepParams);
      const capacity = calculateNonREPCapacity(nonRepParams, schedule);

      // Should have scenarios for 1M, 5M, 10M, 25M, 50M, 100M
      expect(capacity.scenarioAnalysis).toHaveLength(6);

      // Check 10M scenario
      const scenario10M = capacity.scenarioAnalysis.find(s => s.gainAmount === 10_000_000);
      expect(scenario10M).toBeDefined();
      expect(scenario10M!.percentCovered).toBeGreaterThan(0);
      expect(scenario10M!.taxSavings).toBeGreaterThan(0);
    });

    it('should calculate tax savings at capital gains rates', () => {
      const nonRepParams = {
        ...baseParams,
        investorTrack: 'non-rep' as const,
        ltCapitalGainsRate: 20,
        niitRate: 3.8,
        stateCapitalGainsRate: 10.9
      };

      const schedule = buildDepreciationSchedule(nonRepParams);
      const capacity = calculateNonREPCapacity(nonRepParams, schedule);

      const totalRate = (20 + 3.8 + 10.9) / 100; // 34.7%
      const scenario1M = capacity.scenarioAnalysis[0];

      // Tax savings should be at capital gains rate
      const expectedSavings = Math.min(1_000_000, capacity.totalPassiveLosses) * totalRate;
      expect(scenario1M.taxSavings).toBeCloseTo(expectedSavings, -3);
    });
  });

  describe('IRA Conversion Optimization', () => {
    it('should create conversion plan for REPs with IRA balance', () => {
      const repParams = {
        ...baseParams,
        iraBalance: 2_000_000,
        w2Income: 1_000_000
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);
      const conversionPlan = optimizeIRAConversion(repParams, capacity);

      expect(conversionPlan).toBeDefined();
      expect(conversionPlan!.totalConverted).toBeGreaterThan(0);
      expect(conversionPlan!.totalConverted).toBeLessThanOrEqual(2_000_000);
    });

    it('should optimize conversion within available capacity', () => {
      const repParams = {
        ...baseParams,
        iraBalance: 5_000_000,
        w2Income: 1_000_000
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);
      const conversionPlan = optimizeIRAConversion(repParams, capacity);

      // Each year's conversion should not exceed that year's capacity
      conversionPlan!.schedule.forEach((year, index) => {
        const yearCapacity = capacity.annualLimitations[index];
        expect(year.recommendedConversion).toBeLessThanOrEqual(yearCapacity.allowedLoss);
      });
    });

    it('should calculate tax savings from HDC losses', () => {
      const repParams = {
        ...baseParams,
        iraBalance: 1_000_000,
        effectiveTaxRate: 47.85
      };

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);
      const conversionPlan = optimizeIRAConversion(repParams, capacity);

      // Tax savings should be conversion amount * effective rate
      const expectedSavings = conversionPlan!.totalConverted * 0.4785;
      expect(conversionPlan!.totalTaxSaved).toBeCloseTo(expectedSavings, -4);
    });

    it('should not create plan for non-REPs', () => {
      const nonRepParams = {
        ...baseParams,
        investorTrack: 'non-rep' as const,
        iraBalance: 2_000_000
      };

      const schedule = buildDepreciationSchedule(nonRepParams);
      const capacity = calculateREPCapacity(nonRepParams, schedule); // Will still calculate but...
      const conversionPlan = optimizeIRAConversion(nonRepParams, capacity);

      expect(conversionPlan).toBeUndefined(); // Should not create plan for non-REPs
    });
  });

  describe('Full Integration Test', () => {
    it('should add tax planning fields when includeDepreciationSchedule is true', () => {
      const params = {
        ...baseParams,
        includeDepreciationSchedule: true,
        investorTrack: 'rep' as const,
        w2Income: 2_000_000,
        iraBalance: 3_000_000
      };

      const results = calculateFullInvestorAnalysis(params);

      // Should have all tax planning fields
      expect(results.depreciationSchedule).toBeDefined();
      expect(results.repTaxCapacity).toBeDefined();
      expect(results.iraConversionPlan).toBeDefined();

      // Verify depreciation schedule
      // IMPL-7.0-012: Investor equity NOT excluded, so Year 1 = 19M
      expect(results.depreciationSchedule!.year1Spike).toBe(19_000_000);

      // Verify REP capacity
      expect(results.repTaxCapacity!.totalCapacity.currentYear).toBeLessThanOrEqual(626_000);

      // Verify IRA plan
      expect(results.iraConversionPlan!.totalConverted).toBeGreaterThan(0);
    });

    it('should not include tax planning fields when flag is false', () => {
      const params = {
        ...baseParams,
        includeDepreciationSchedule: false
      };

      const results = calculateFullInvestorAnalysis(params);

      expect(results.depreciationSchedule).toBeUndefined();
      expect(results.repTaxCapacity).toBeUndefined();
      expect(results.nonRepCapacity).toBeUndefined();
      expect(results.iraConversionPlan).toBeUndefined();
    });

    it('should handle non-REP investors correctly', () => {
      const params = {
        ...baseParams,
        includeDepreciationSchedule: true,
        investorTrack: 'non-rep' as const,
        passiveIncome: 10_000_000
      };

      const results = calculateFullInvestorAnalysis(params);

      expect(results.nonRepCapacity).toBeDefined();
      expect(results.repTaxCapacity).toBeUndefined();
      expect(results.nonRepCapacity!.unlimitedCapacity).toBe(true);
    });
  });
});
