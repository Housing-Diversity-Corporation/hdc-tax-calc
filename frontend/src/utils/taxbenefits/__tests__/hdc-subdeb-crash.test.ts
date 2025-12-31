/**
 * Test to reproduce and fix the HDC sub-debt 1% crash issue
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';

describe('HDC Sub-debt 1% Crash Investigation', () => {
  it('should handle 1% HDC sub-debt without crashing', () => {
    const projectCost = 63600000;
    const landValue = 10000000;
    const yearOneDepreciationPct = 25;
    const effectiveTaxRate = 47.9;
    const hdcFeeRate = 10;

    // Calculate tax-related values like the useHDCCalculations hook does
    const depreciableBasis = projectCost - landValue;
    const yearOneDepreciation = depreciableBasis * (yearOneDepreciationPct / 100);
    const remainingDepreciableBasis = depreciableBasis - yearOneDepreciation;
    const annualStraightLineDepreciation = remainingDepreciableBasis / 27.5;
    const holdPeriod = 10;
    const years2toNDepreciation = annualStraightLineDepreciation * (holdPeriod - 1);
    const total10YearDepreciation = yearOneDepreciation + years2toNDepreciation;
    const totalTaxBenefit = total10YearDepreciation * (effectiveTaxRate / 100);
    const hdcFee = totalTaxBenefit * (hdcFeeRate / 100);
    const netTaxBenefit = totalTaxBenefit - hdcFee;

    const params = {
      projectCost,
      yearOneNOI: 1590000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 5.5,
      hdcFeeRate,
      investorPromoteShare: 35,

      // Capital structure with 1% HDC sub-debt
      investorEquityPct: 17.61,
      philanthropicEquityPct: 7.39,
      seniorDebtPct: 61,
      philanthropicDebtPct: 13,
      hdcSubDebtPct: 1,  // This is what causes the crash
      investorSubDebtPct: 0,

      // HDC sub-debt settings
      hdcSubDebtPikRate: 8,
      pikCurrentPayEnabled: false,
      pikCurrentPayPct: 50,

      // Other parameters
      holdPeriod,
      opexRatio: 25,
      yearOneDepreciation,
      annualStraightLineDepreciation,
      effectiveTaxRate,
      landValue,
      yearOneDepreciationPct,

      // Debt parameters
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      philDebtAmortization: 30,
      philCurrentPayEnabled: false,
      philCurrentPayPct: 50,

      // Fees
      aumFeeEnabled: false,
      aumFeeRate: 1,

      // Interest reserve
      interestReserveEnabled: false,
      interestReserveMonths: 12,

      // CRITICAL: Include calculated values that the hook would provide
      hdcFee,
      netTaxBenefit,
      totalTaxBenefit,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 0,
      constructionDelayMonths: 0
    };

    // Log the params to see what's being passed
    console.log('Test params:', {
      projectCost: params.projectCost,
      investorEquityPct: params.investorEquityPct,
      hdcSubDebtPct: params.hdcSubDebtPct,
      totalCapital: params.investorEquityPct + params.philanthropicEquityPct +
                    params.seniorDebtPct + params.philanthropicDebtPct +
                    params.hdcSubDebtPct + params.investorSubDebtPct
    });

    // Test investor analysis
    let investorResult;
    try {
      investorResult = calculateFullInvestorAnalysis(params);
      console.log('Investor result:', {
        totalInvestment: investorResult.totalInvestment,
        investorEquity: params.projectCost * (params.investorEquityPct / 100),
        hdcFee: params.hdcFee
      });
      expect(investorResult).toBeDefined();
      expect(investorResult.investorCashFlows).toBeDefined();
      expect(investorResult.investorCashFlows.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Investor analysis error:', error);
      throw new Error(`Investor analysis failed with 1% HDC sub-debt: ${error}`);
    }

    // Test HDC analysis
    let hdcResult;
    try {
      hdcResult = calculateHDCAnalysis(params);
      expect(hdcResult).toBeDefined();
      expect(hdcResult.hdcCashFlows).toBeDefined();
      expect(hdcResult.hdcCashFlows.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('HDC analysis error:', error);
      throw new Error(`HDC analysis failed with 1% HDC sub-debt: ${error}`);
    }

    // Check for NaN or Infinity values
    const checkForInvalidValues = (obj: any, path = ''): void => {
      for (const key in obj) {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'number') {
          if (isNaN(value)) {
            throw new Error(`NaN found at ${currentPath}`);
          }
          if (!isFinite(value)) {
            throw new Error(`Infinity found at ${currentPath}`);
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkForInvalidValues(value, currentPath);
        }
      }
    };

    checkForInvalidValues(investorResult, 'investorResult');
    checkForInvalidValues(hdcResult, 'hdcResult');
  });

  it('should handle various small HDC sub-debt percentages', () => {
    const testPercentages = [0.1, 0.5, 1, 2, 5];

    testPercentages.forEach(pct => {
      const projectCost = 50000000;
      const landValue = 5000000;
      const yearOneDepreciationPct = 25;
      const effectiveTaxRate = 45;
      const hdcFeeRate = 10;
      const holdPeriod = 10;

      // Calculate tax-related values
      const depreciableBasis = projectCost - landValue;
      const yearOneDepreciation = depreciableBasis * (yearOneDepreciationPct / 100);
      const remainingDepreciableBasis = depreciableBasis - yearOneDepreciation;
      const annualStraightLineDepreciation = remainingDepreciableBasis / 27.5;
      const years2toNDepreciation = annualStraightLineDepreciation * (holdPeriod - 1);
      const total10YearDepreciation = yearOneDepreciation + years2toNDepreciation;
      const totalTaxBenefit = total10YearDepreciation * (effectiveTaxRate / 100);
      const hdcFee = totalTaxBenefit * (hdcFeeRate / 100);
      const netTaxBenefit = totalTaxBenefit - hdcFee;

      const params = {
        projectCost,
        yearOneNOI: 2000000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 5,
        hdcFeeRate,
        investorPromoteShare: 35,
        investorEquityPct: 20 - pct,
        philanthropicEquityPct: 10,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: pct,
        hdcSubDebtPikRate: 8,
        pikCurrentPayEnabled: false,
        holdPeriod,
        opexRatio: 30,
        yearOneDepreciation,
        annualStraightLineDepreciation,
        effectiveTaxRate,
        landValue,
        yearOneDepreciationPct,
        seniorDebtRate: 6,
        seniorDebtAmortization: 30,
        philanthropicDebtRate: 0,
        philDebtAmortization: 30,
        philCurrentPayEnabled: false,
        hdcFee,
        netTaxBenefit,
        totalTaxBenefit,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0
      };

      const result = calculateFullInvestorAnalysis(params);
      expect(result).toBeDefined();
      expect(result.multiple).toBeGreaterThan(0);
      expect(isFinite(result.multiple)).toBe(true);
      expect(isNaN(result.multiple)).toBe(false);
    });
  });

  it('should properly calculate PIK interest with 1% HDC sub-debt', () => {
    const projectCost = 50000000;
    const hdcSubDebtPct = 1; // 1% = $500,000
    const hdcSubDebtPikRate = 8;
    const landValue = 5000000;
    const yearOneDepreciationPct = 25;
    const effectiveTaxRate = 45;
    const hdcFeeRate = 10;
    const holdPeriod = 10;

    // Calculate tax-related values
    const depreciableBasis = projectCost - landValue;
    const yearOneDepreciation = depreciableBasis * (yearOneDepreciationPct / 100);
    const remainingDepreciableBasis = depreciableBasis - yearOneDepreciation;
    const annualStraightLineDepreciation = remainingDepreciableBasis / 27.5;
    const years2toNDepreciation = annualStraightLineDepreciation * (holdPeriod - 1);
    const total10YearDepreciation = yearOneDepreciation + years2toNDepreciation;
    const totalTaxBenefit = total10YearDepreciation * (effectiveTaxRate / 100);
    const hdcFee = totalTaxBenefit * (hdcFeeRate / 100);
    const netTaxBenefit = totalTaxBenefit - hdcFee;

    const params = {
      projectCost,
      yearOneNOI: 2000000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 5,
      hdcFeeRate,
      investorPromoteShare: 35,
      investorEquityPct: 19,
      philanthropicEquityPct: 10,
      seniorDebtPct: 60,
      philanthropicDebtPct: 10,
      hdcSubDebtPct,
      hdcSubDebtPikRate,
      pikCurrentPayEnabled: false,
      holdPeriod,
      opexRatio: 30,
      yearOneDepreciation,
      annualStraightLineDepreciation,
      effectiveTaxRate,
      landValue,
      yearOneDepreciationPct,
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      philDebtAmortization: 30,
      philCurrentPayEnabled: false,
      hdcFee,
      netTaxBenefit,
      totalTaxBenefit
    };

    const hdcResult = calculateHDCAnalysis(params);

    // Check Year 2 PIK calculation (first year with PIK)
    const year2 = hdcResult.hdcCashFlows[1];
    const expectedPrincipal = projectCost * (hdcSubDebtPct / 100);
    const expectedInterest = expectedPrincipal * (hdcSubDebtPikRate / 100);

    // Year 2 should have the expected interest accrued
    expect(year2.hdcSubDebtPIKAccrued).toBeCloseTo(expectedInterest, 0);
    // HDC analysis result should be valid
    expect(hdcResult).toBeDefined();
    // Should have cash flows for all years
    expect(hdcResult.hdcCashFlows.length).toBe(10);
  });
});