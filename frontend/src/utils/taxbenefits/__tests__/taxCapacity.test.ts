/**
 * Tests for Tax Capacity Calculations (§461(l) and Passive Loss Tracking)
 *
 * Phase 0 prerequisite: Lock in existing behavior before modifying taxCapacity.ts
 *
 * Tests cover:
 * 1. REP Tax Capacity with §461(l) limitations
 * 2. Non-REP Passive Loss capacity (unlimited)
 * 3. NOL carryforward tracking
 * 4. Scenario analysis for different income levels
 */

import { buildDepreciationSchedule } from '../depreciationSchedule';
import { calculateREPCapacity, calculateNonREPCapacity } from '../taxCapacity';
import { calculateFullInvestorAnalysis } from '../calculations';
import { CalculationParams, REPTaxCapacityModel, NonREPCapacityModel } from '../../../types/taxbenefits';

describe('Tax Capacity Calculations', () => {
  // Base params for a standard $86M project with 25% cost seg
  const createBaseParams = (overrides: Partial<CalculationParams> = {}): CalculationParams => ({
    projectCost: 86_000_000,
    landValue: 10_000_000,
    yearOneNOI: 5_113_000,
    yearOneDepreciationPct: 25, // 25% cost segregation = $19M year 1 depreciation
    noiGrowthRate: 3,
    exitCapRate: 6,
    investorEquityPct: 14,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 12_040_000,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    hdcFee: 0,
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
    stateCapitalGainsRate: 10.9,
    ...overrides,
  });

  describe('calculateREPCapacity - §461(l) Limitations', () => {
    describe('Section 461(l) Limit Constants', () => {
      it('should apply $626K limit for married filing jointly (default)', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
          filingStatus: 'married',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        // Year 1 should have the MFJ limit of $626,000
        expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
      });

      it('should use $626K MFJ limit as default when filingStatus not specified', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
          // filingStatus not specified
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        // Current implementation defaults to MFJ
        expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
      });

      // NOTE: Current implementation always uses MFJ limit ($626K)
      // These tests document expected behavior for future implementation
      it('should currently use MFJ limit even when filingStatus is single', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
          filingStatus: 'single',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        // Current behavior: always uses MFJ ($626K), not Single ($313K)
        // TODO: When filing status support is added, this should change to $313,000
        expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
      });
    });

    describe('allowedLoss Calculation', () => {
      it('should limit allowedLoss to §461(l) cap when depreciation exceeds limit', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const year1 = capacity.annualLimitations[0];
        // Year 1 depreciation ($19M) >> §461(l) limit ($626K)
        // allowedLoss should be capped at the limit
        expect(year1.allowedLoss).toBe(626_000);
      });

      it('should allow full depreciation when under §461(l) limit', () => {
        // Use smaller project to get depreciation under $626K
        const params = createBaseParams({
          projectCost: 10_000_000,
          landValue: 2_000_000,
          yearOneDepreciationPct: 5, // Small cost seg = $400K depreciation
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const year1 = capacity.annualLimitations[0];
        // Depreciation ($400K) < §461(l) limit ($626K)
        // allowedLoss should equal full depreciation
        expect(year1.allowedLoss).toBe(schedule.schedule[0].totalDepreciation);
        expect(year1.disallowedLoss).toBe(0);
      });

      it('should include business income offset before W-2 limitation', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 500_000,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const year1 = capacity.annualLimitations[0];
        // businessOffset ($500K) + w2Offset (up to $626K) = max $1.126M allowed
        expect(year1.allowedLoss).toBeLessThanOrEqual(500_000 + 626_000);
        expect(year1.allowedLoss).toBeGreaterThan(626_000); // Should exceed W-2 limit due to business income
      });
    });

    describe('disallowedLoss and NOL Generation', () => {
      it('should generate NOL from excess business losses', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const year1 = capacity.annualLimitations[0];
        // Year 1: $19M depreciation - $626K allowed = $18.374M disallowed
        expect(year1.disallowedLoss).toBeGreaterThan(18_000_000);
        expect(year1.nolGenerated).toBe(year1.disallowedLoss);
      });

      it('should have disallowedLoss = totalDepreciation - allowedLoss', () => {
        const params = createBaseParams({
          w2Income: 1_500_000,
          businessIncome: 200_000,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        capacity.annualLimitations.forEach((year, idx) => {
          const expectedDisallowed = schedule.schedule[idx].totalDepreciation - year.allowedLoss;
          expect(year.disallowedLoss).toBeCloseTo(Math.max(0, expectedDisallowed), 0);
        });
      });

      it('should have zero NOL when depreciation is under limit', () => {
        // Small project with depreciation under limit
        const params = createBaseParams({
          projectCost: 8_000_000,
          landValue: 2_000_000,
          yearOneDepreciationPct: 10, // ~$600K depreciation
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const year1 = capacity.annualLimitations[0];
        expect(year1.nolGenerated).toBe(0);
      });
    });

    describe('NOL Carryforward Accumulation', () => {
      it('should accumulate NOL carryforward across years', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        let runningTotal = 0;
        capacity.annualLimitations.forEach((year) => {
          runningTotal += year.nolGenerated;
          expect(year.nolCarryforward).toBe(runningTotal);
        });
      });

      it('should have nolBank equal to final nolCarryforward', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        const lastYear = capacity.annualLimitations[capacity.annualLimitations.length - 1];
        expect(capacity.totalCapacity.nolBank).toBe(lastYear.nolCarryforward);
      });

      it('should generate larger NOL pool for longer hold periods', () => {
        const params7Year = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
          holdPeriod: 7,
        });
        const params15Year = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
          holdPeriod: 15,
        });

        const schedule7 = buildDepreciationSchedule(params7Year);
        const schedule15 = buildDepreciationSchedule(params15Year);
        const capacity7 = calculateREPCapacity(params7Year, schedule7);
        const capacity15 = calculateREPCapacity(params15Year, schedule15);

        // Longer hold = more years of depreciation = larger NOL bank
        expect(capacity15.totalCapacity.nolBank).toBeGreaterThan(capacity7.totalCapacity.nolBank);
      });
    });

    describe('Income Level Scenarios', () => {
      const incomeScenarios = [
        { w2Income: 500_000, label: '$500K' },
        { w2Income: 750_000, label: '$750K' },
        { w2Income: 1_000_000, label: '$1M' },
        { w2Income: 2_000_000, label: '$2M' },
      ];

      incomeScenarios.forEach(({ w2Income, label }) => {
        it(`should calculate correct capacity at ${label} income level`, () => {
          const params = createBaseParams({
            w2Income,
            businessIncome: 0,
          });

          const schedule = buildDepreciationSchedule(params);
          const capacity = calculateREPCapacity(params, schedule);

          // All scenarios should have same §461(l) limit (MFJ default)
          expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
          expect(capacity.annualLimitations[0].w2Income).toBe(w2Income);

          // allowedLoss should be capped at §461(l) limit for large depreciation
          const year1Depreciation = schedule.schedule[0].totalDepreciation;
          if (year1Depreciation > 626_000) {
            expect(capacity.annualLimitations[0].allowedLoss).toBe(626_000);
          }
        });
      });

      it('should track W-2 income correctly in annual limitations', () => {
        const params = createBaseParams({
          w2Income: 1_500_000,
          businessIncome: 300_000,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        capacity.annualLimitations.forEach((year) => {
          expect(year.w2Income).toBe(1_500_000);
        });
      });
    });

    describe('IRA Conversion Capacity', () => {
      it('should calculate IRA conversion capacity based on current year capacity', () => {
        const params = createBaseParams({
          w2Income: 1_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        // IRA conversion capacity should be limited to min of allowed losses and §461(l) limit
        expect(capacity.totalCapacity.iraConversionCapacity).toBeLessThanOrEqual(626_000);
        expect(capacity.totalCapacity.iraConversionCapacity).toBeGreaterThan(0);
      });

      it('should cap IRA conversion at §461(l) limit', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 1_000_000, // Large business income
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        // Even with large allowed losses, IRA conversion capped at §461(l) limit
        expect(capacity.totalCapacity.iraConversionCapacity).toBeLessThanOrEqual(626_000);
      });
    });

    describe('Total Capacity Calculation', () => {
      it('should calculate currentYear as year 1 allowedLoss', () => {
        const params = createBaseParams({
          w2Income: 2_000_000,
          businessIncome: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateREPCapacity(params, schedule);

        expect(capacity.totalCapacity.currentYear).toBe(capacity.annualLimitations[0].allowedLoss);
      });

      it('should have consistent annual limitation array length with hold period', () => {
        const holdPeriods = [5, 7, 10, 15];

        holdPeriods.forEach((holdPeriod) => {
          const params = createBaseParams({
            w2Income: 1_000_000,
            holdPeriod,
          });

          const schedule = buildDepreciationSchedule(params);
          const capacity = calculateREPCapacity(params, schedule);

          // Annual limitations should match hold period
          expect(capacity.annualLimitations.length).toBe(Math.min(holdPeriod, schedule.schedule.length));
        });
      });
    });
  });

  describe('calculateNonREPCapacity - Passive Loss Capacity', () => {
    describe('Unlimited Capacity Flag', () => {
      it('should return unlimitedCapacity: true', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
          passiveIncome: 5_000_000,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        expect(capacity.unlimitedCapacity).toBe(true);
      });

      it('should work regardless of passive income level', () => {
        const incomes = [0, 100_000, 1_000_000, 10_000_000];

        incomes.forEach((passiveIncome) => {
          const params = createBaseParams({
            investorTrack: 'non-rep',
            passiveIncome,
          });

          const schedule = buildDepreciationSchedule(params);
          const capacity = calculateNonREPCapacity(params, schedule);

          expect(capacity.unlimitedCapacity).toBe(true);
        });
      });
    });

    describe('Total Passive Losses', () => {
      it('should equal total depreciation from schedule', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        expect(capacity.totalPassiveLosses).toBe(schedule.totalDepreciation);
      });

      it('should scale with project size', () => {
        const smallParams = createBaseParams({
          projectCost: 50_000_000,
          landValue: 5_000_000,
          investorTrack: 'non-rep',
        });
        const largeParams = createBaseParams({
          projectCost: 150_000_000,
          landValue: 15_000_000,
          investorTrack: 'non-rep',
        });

        const smallSchedule = buildDepreciationSchedule(smallParams);
        const largeSchedule = buildDepreciationSchedule(largeParams);
        const smallCapacity = calculateNonREPCapacity(smallParams, smallSchedule);
        const largeCapacity = calculateNonREPCapacity(largeParams, largeSchedule);

        expect(largeCapacity.totalPassiveLosses).toBeGreaterThan(smallCapacity.totalPassiveLosses);
      });
    });

    describe('Scenario Analysis', () => {
      it('should include 6 gain scenarios (1M, 5M, 10M, 25M, 50M, 100M)', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        expect(capacity.scenarioAnalysis).toHaveLength(6);

        const expectedGains = [1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];
        capacity.scenarioAnalysis.forEach((scenario, index) => {
          expect(scenario.gainAmount).toBe(expectedGains[index]);
        });
      });

      it('should calculate percentCovered correctly', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        capacity.scenarioAnalysis.forEach((scenario) => {
          const lossesUsed = Math.min(scenario.gainAmount, capacity.totalPassiveLosses);
          const expectedPct = (lossesUsed / scenario.gainAmount) * 100;
          expect(scenario.percentCovered).toBeCloseTo(expectedPct, 1);
        });
      });

      it('should calculate taxSavings at capital gains rates', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
          ltCapitalGainsRate: 20,
          niitRate: 3.8,
          stateCapitalGainsRate: 10.9,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        const totalRate = (20 + 3.8 + 10.9) / 100; // 34.7%

        capacity.scenarioAnalysis.forEach((scenario) => {
          const lossesUsed = Math.min(scenario.gainAmount, capacity.totalPassiveLosses);
          const expectedSavings = lossesUsed * totalRate;
          expect(scenario.taxSavings).toBeCloseTo(expectedSavings, -3);
        });
      });

      it('should show 100% coverage for gains less than total losses', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        // Find scenarios where gain < totalPassiveLosses
        capacity.scenarioAnalysis
          .filter((s) => s.gainAmount <= capacity.totalPassiveLosses)
          .forEach((scenario) => {
            expect(scenario.percentCovered).toBe(100);
          });
      });

      it('should show partial coverage for gains exceeding total losses', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        // Find scenarios where gain > totalPassiveLosses
        const largeGainScenarios = capacity.scenarioAnalysis.filter(
          (s) => s.gainAmount > capacity.totalPassiveLosses
        );

        if (largeGainScenarios.length > 0) {
          largeGainScenarios.forEach((scenario) => {
            expect(scenario.percentCovered).toBeLessThan(100);
            expect(scenario.percentCovered).toBeGreaterThan(0);
          });
        }
      });
    });

    describe('Tax Rate Variations', () => {
      it('should use combined capital gains rate for tax savings', () => {
        const customRates = {
          ltCapitalGainsRate: 15,
          niitRate: 0,
          stateCapitalGainsRate: 5,
        };

        const params = createBaseParams({
          investorTrack: 'non-rep',
          ...customRates,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        const totalRate = (15 + 0 + 5) / 100; // 20%
        const scenario1M = capacity.scenarioAnalysis[0];
        const lossesUsed = Math.min(1_000_000, capacity.totalPassiveLosses);
        const expectedSavings = lossesUsed * totalRate;

        expect(scenario1M.taxSavings).toBeCloseTo(expectedSavings, -3);
      });

      it('should handle zero NIIT rate', () => {
        const params = createBaseParams({
          investorTrack: 'non-rep',
          niitRate: 0,
        });

        const schedule = buildDepreciationSchedule(params);
        const capacity = calculateNonREPCapacity(params, schedule);

        // Should still calculate valid tax savings
        expect(capacity.scenarioAnalysis[0].taxSavings).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should produce different results for REP vs Non-REP on same project', () => {
      const repParams = createBaseParams({
        investorTrack: 'rep',
        w2Income: 2_000_000,
      });
      const nonRepParams = createBaseParams({
        investorTrack: 'non-rep',
        passiveIncome: 2_000_000,
      });

      const repSchedule = buildDepreciationSchedule(repParams);
      const nonRepSchedule = buildDepreciationSchedule(nonRepParams);

      const repCapacity = calculateREPCapacity(repParams, repSchedule);
      const nonRepCapacity = calculateNonREPCapacity(nonRepParams, nonRepSchedule);

      // REP has limited capacity, Non-REP has unlimited
      expect(repCapacity.totalCapacity.currentYear).toBeLessThanOrEqual(626_000 + (repParams.businessIncome || 0));
      expect(nonRepCapacity.unlimitedCapacity).toBe(true);
    });

    it('should handle edge case of zero income', () => {
      const repParams = createBaseParams({
        investorTrack: 'rep',
        w2Income: 0,
        businessIncome: 0,
      });

      const schedule = buildDepreciationSchedule(repParams);
      const capacity = calculateREPCapacity(repParams, schedule);

      // With zero income, allowedLoss should still be calculated
      // (losses can be used against future income via NOL)
      expect(capacity.annualLimitations[0].section461lLimit).toBe(626_000);
    });

    it('should handle very large projects correctly', () => {
      const params = createBaseParams({
        projectCost: 500_000_000,
        landValue: 50_000_000,
        w2Income: 5_000_000,
        businessIncome: 0,
      });

      const schedule = buildDepreciationSchedule(params);
      const capacity = calculateREPCapacity(params, schedule);

      // Large project should generate significant NOL
      expect(capacity.totalCapacity.nolBank).toBeGreaterThan(100_000_000);
    });

    it('should compute adjustedBasis = investorEquity - cumulativeDepreciation', () => {
      const params = createBaseParams({
        projectCost: 86_000_000,
        landValue: 10_000_000,
        investorEquityPct: 14,
        yearOneDepreciationPct: 25,
        holdPeriod: 10,
        includeDepreciationSchedule: true,
      });

      const results = calculateFullInvestorAnalysis(params);

      // investorEquity = 86M * 14% = $12.04M
      const expectedInvestorEquity = 86_000_000 * 0.14;

      // Depreciation schedule: 25% of (86M - 10M land) = 19M Year 1
      // Plus ~$2.07M/year MACRS for years 2-10 = ~18.6M
      // Total ~ 37.6M over 10 years
      const totalDepreciation = results.depreciationSchedule?.totalDepreciation || 0;

      // adjustedBasis = investorEquity - totalDepreciation
      const expectedAdjustedBasis = expectedInvestorEquity - totalDepreciation;

      expect(results.adjustedBasis).toBeDefined();
      expect(results.adjustedBasis).toBeCloseTo(expectedAdjustedBasis, 0);
      expect(results.investorEquity).toBeCloseTo(expectedInvestorEquity, 0);

      // adjustedBasis should be negative for this scenario (depreciation > equity)
      expect(results.adjustedBasis!).toBeLessThan(0);
    });
  });
});
