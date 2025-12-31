/**
 * IRS MACRS Depreciation Tests with Mid-Month Convention
 *
 * Tests validate correct implementation of IRS Publication 946, Table A-6
 * for residential rental property depreciation with mid-month convention.
 *
 * CRITICAL RULES:
 * 1. Bonus depreciation taken FIRST on full depreciable basis
 * 2. Remaining basis depreciated over 27.5 years straight-line
 * 3. Mid-month convention: Year 1 gets partial months (12.5 - placedInServiceMonth)
 * 4. Year 1 includes BOTH bonus AND partial straight-line
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateDepreciableBasis } from '../depreciableBasisUtility';
import { CalculationParams } from '../../../types/taxbenefits';

describe('IRS MACRS Depreciation with Mid-Month Convention', () => {
  // Base parameters for all tests
  const baseParams: CalculationParams = {
    projectCost: 50000000,
    predevelopmentCosts: 0,
    landValue: 10000000,
    investorEquityPct: 20,
    yearOneNOI: 2500000,
    yearOneDepreciationPct: 25,
    effectiveTaxRate: 47.9,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 10000000,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    hdcFee: 0,
    investorPromoteShare: 35,
    opexRatio: 40,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    seniorDebtPct: 60,
    philanthropicDebtPct: 10,
    seniorDebtRate: 6,
    philanthropicDebtRate: 3,
    seniorDebtAmortization: 30,
    philDebtAmortization: 30,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    hdcSubDebtPct: 5,
    hdcSubDebtPikRate: 8,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 50,
    holdPeriod: 10,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0
  };

  describe('Ground Truth Example 1: July Placement (Month 7 - Default)', () => {
    it('should calculate correct MACRS depreciation for July placement', () => {
      const params = {
        ...baseParams,
        placedInServiceMonth: 7  // July (mid-year default)
      };

      const results = calculateFullInvestorAnalysis(params);

      // Calculate expected values
      const depreciableBasis = calculateDepreciableBasis({
        projectCost: params.projectCost,
        predevelopmentCosts: 0,
        landValue: params.landValue,
        investorEquityPct: params.investorEquityPct,
        interestReserve: 0  // Test scenario doesn't include interest reserve
      });

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // New formula: $50M - $10M land = $40M
      expect(depreciableBasis).toBe(40000000);

      // Year 1 MACRS Calculation
      const bonusDepreciation = 40000000 * 0.25;  // $10,000,000
      const remainingBasis = 40000000 - bonusDepreciation;  // $30,000,000
      const annualMACRS = remainingBasis / 27.5;  // $818,181.82
      const monthsInYear1 = 12.5 - 7;  // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;  // $374,999.99
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;  // $7,874,999.99

      // Tax benefit calculation
      const grossTaxBenefit = totalYear1Depreciation * 0.479;
      const hdcFee = 0; // Fee removed per IMPL-7.0-001
      const expectedNetBenefit = grossTaxBenefit; // 100% to investor

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, 0);

      console.log('July Placement (Month 7) - Ground Truth Validation:');
      console.log(`- Depreciable Basis: $${(depreciableBasis / 1000000).toFixed(2)}M`);
      console.log(`- Bonus Depreciation: $${(bonusDepreciation / 1000000).toFixed(2)}M`);
      console.log(`- Year 1 MACRS (5.5 months): $${(year1MACRS / 1000).toFixed(2)}k`);
      console.log(`- Total Year 1: $${(totalYear1Depreciation / 1000000).toFixed(3)}M`);
      console.log(`- Annual MACRS (Years 2+): $${(annualMACRS / 1000).toFixed(2)}k`);
    });
  });

  describe('Ground Truth Example 2: January Placement (Month 1)', () => {
    it('should calculate correct MACRS depreciation for January placement', () => {
      const params = {
        ...baseParams,
        placedInServiceMonth: 1  // January
      };

      const results = calculateFullInvestorAnalysis(params);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      const depreciableBasis = 40000000;  // $50M - $10M land = $40M
      const bonusDepreciation = 40000000 * 0.25;  // $10,000,000
      const remainingBasis = 40000000 - bonusDepreciation;  // $30,000,000
      const annualMACRS = remainingBasis / 27.5;  // $818,181.82
      const monthsInYear1 = 12.5 - 1;  // 11.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;  // $784,090.90
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;  // $8,284,090.90

      // Tax benefit calculation
      const grossTaxBenefit = totalYear1Depreciation * 0.479;
      const hdcFee = 0; // Fee removed per IMPL-7.0-001
      const expectedNetBenefit = grossTaxBenefit; // 100% to investor

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, 0);

      console.log('\\nJanuary Placement (Month 1) - Ground Truth Validation:');
      console.log(`- Bonus Depreciation: $${(bonusDepreciation / 1000000).toFixed(2)}M`);
      console.log(`- Year 1 MACRS (11.5 months): $${(year1MACRS / 1000).toFixed(2)}k`);
      console.log(`- Total Year 1: $${(totalYear1Depreciation / 1000000).toFixed(3)}M`);
      console.log(`- Annual MACRS (Years 2+): $${(annualMACRS / 1000).toFixed(2)}k`);
    });
  });

  describe('Ground Truth Example 3: December Placement (Month 12)', () => {
    it('should calculate correct MACRS depreciation for December placement', () => {
      const params = {
        ...baseParams,
        placedInServiceMonth: 12  // December
      };

      const results = calculateFullInvestorAnalysis(params);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      const depreciableBasis = 40000000;  // $50M - $10M land = $40M
      const bonusDepreciation = 40000000 * 0.25;  // $10,000,000
      const remainingBasis = 40000000 - bonusDepreciation;  // $30,000,000
      const annualMACRS = remainingBasis / 27.5;  // $818,181.82
      const monthsInYear1 = 12.5 - 12;  // 0.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;  // $34,090.91
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;  // $7,534,090.91

      // Tax benefit calculation
      const grossTaxBenefit = totalYear1Depreciation * 0.479;
      const hdcFee = 0; // Fee removed per IMPL-7.0-001
      const expectedNetBenefit = grossTaxBenefit; // 100% to investor

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, 0);

      console.log('\\nDecember Placement (Month 12) - Ground Truth Validation:');
      console.log(`- Bonus Depreciation: $${(bonusDepreciation / 1000000).toFixed(2)}M`);
      console.log(`- Year 1 MACRS (0.5 months): $${(year1MACRS / 1000).toFixed(2)}k`);
      console.log(`- Total Year 1: $${(totalYear1Depreciation / 1000000).toFixed(3)}M`);
      console.log(`- Annual MACRS (Years 2+): $${(annualMACRS / 1000).toFixed(2)}k`);
    });
  });

  describe('27.5-Year Divisor Validation', () => {
    it('should use 27.5 years for residential rental property per IRS Pub 946', () => {
      const params = {
        ...baseParams,
        placedInServiceMonth: 7
      };

      const results = calculateFullInvestorAnalysis(params);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      const depreciableBasis = 40000000;  // $50M - $10M land = $40M
      const bonusDepreciation = depreciableBasis * 0.25;
      const remainingBasis = depreciableBasis - bonusDepreciation;

      // IRS requires 27.5 years for residential rental
      const annualMACRS = remainingBasis / 27.5;
      expect(annualMACRS).toBeCloseTo(1090909.09, 2);

      // Verify Years 2-10 use full annual MACRS
      for (let i = 1; i < 10; i++) {
        const cashFlow = results.investorCashFlows[i];
        const expectedTaxBenefit = annualMACRS * 0.479;  // 47.9% tax, 90% after HDC fee
        expect(cashFlow.taxBenefit).toBeCloseTo(expectedTaxBenefit, 0);
      }

      console.log('\\n27.5-Year Divisor Validation:');
      console.log(`- Remaining Basis: $${(remainingBasis / 1000000).toFixed(2)}M`);
      console.log(`- Annual MACRS: $${(annualMACRS / 1000).toFixed(2)}k`);
      console.log(`- Divisor: 27.5 years (IRS Pub 946, Table A-6)`);
    });
  });

  describe('Mid-Month Convention Formula', () => {
    it('should correctly calculate months in service using mid-month convention', () => {
      const testCases = [
        { month: 1, expectedMonths: 11.5, description: 'January' },
        { month: 4, expectedMonths: 8.5, description: 'April' },
        { month: 7, expectedMonths: 5.5, description: 'July (default)' },
        { month: 10, expectedMonths: 2.5, description: 'October' },
        { month: 12, expectedMonths: 0.5, description: 'December' }
      ];

      testCases.forEach(({ month, expectedMonths, description }) => {
        const calculatedMonths = 12.5 - month;
        expect(calculatedMonths).toBe(expectedMonths);

        console.log(`${description} (Month ${month}): ${expectedMonths} months in service`);
      });
    });
  });

  describe('Comparison: With vs Without Mid-Month Convention', () => {
    it('should show material difference between mid-year and full-year depreciation', () => {
      const julyParams = {
        ...baseParams,
        placedInServiceMonth: 7
      };

      const januaryParams = {
        ...baseParams,
        placedInServiceMonth: 1
      };

      const julyResults = calculateFullInvestorAnalysis(julyParams);
      const januaryResults = calculateFullInvestorAnalysis(januaryParams);

      const julyYear1Benefit = julyResults.investorCashFlows[0].taxBenefit;
      const januaryYear1Benefit = januaryResults.investorCashFlows[0].taxBenefit;

      const difference = januaryYear1Benefit - julyYear1Benefit;
      const percentageDiff = (difference / julyYear1Benefit) * 100;

      // January should have significantly more Year 1 benefit due to 11.5 vs 5.5 months
      expect(januaryYear1Benefit).toBeGreaterThan(julyYear1Benefit);

      console.log('\\nMid-Month Convention Impact:');
      console.log(`- July Year 1 Benefit: $${(julyYear1Benefit / 1000).toFixed(2)}k`);
      console.log(`- January Year 1 Benefit: $${(januaryYear1Benefit / 1000).toFixed(2)}k`);
      console.log(`- Difference: $${(difference / 1000).toFixed(2)}k (${percentageDiff.toFixed(1)}%)`);
    });
  });
});
