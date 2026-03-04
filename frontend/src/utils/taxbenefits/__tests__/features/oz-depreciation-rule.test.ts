/**
 * Tests for OZ Depreciation Rule
 *
 * IMPORTANT: Investor equity is a FUNDING SOURCE, not a cost exclusion.
 * The OZ depreciable basis excludes:
 * - Land value (standard real estate rule)
 * - Interest reserve (financing cost)
 * - Lease-up reserve (financing cost)
 *
 * But does NOT exclude investor equity - it's how the project is financed,
 * not what the project costs.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('OZ Depreciation Rule', () => {
  it('should calculate depreciable basis excluding only land and reserves', () => {
    const params: CalculationParams = {
      projectCost: 86000000,
      predevelopmentCosts: 0,
      landValue: 10000000,
      investorEquityPct: 20, // $17.2M investor equity (funding source, NOT excluded)

      // Tax parameters for depreciation calculation
      effectiveTaxRate: 47.85, // Combined federal + state
      yearOneDepreciationPct: 25, // Cost segregation

      // Other required parameters
      holdPeriod: 10,
      seniorDebtPct: 60,
      philanthropicDebtPct: 5,
      hdcSubDebtPct: 10,
      investorSubDebtPct: 5,
      yearOneNOI: 2580000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 7.5,
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 17200000, // 20% of 86M
      totalTaxBenefit: 1000000, // Placeholder
      netTaxBenefit: 900000, // Placeholder
      hdcFee: 100000, // Placeholder
      investorPromoteShare: 35,
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      opexRatio: 30,
      constructionDelayMonths: 0,
    };

    const results = calculateFullInvestorAnalysis(params);

    // Calculate expected depreciable basis
    // NEW FORMULA: Investor equity is NOT excluded (it's a funding source)
    const expectedDepreciableBasis = params.projectCost - params.landValue;

    // Expected: $86M - $10M = $76M
    expect(expectedDepreciableBasis).toBe(76000000);

    // Year 1 depreciation includes bonus + MACRS mid-month convention
    // Bonus depreciation: 25% of depreciable basis
    const bonusDepreciation = expectedDepreciableBasis * 0.25;
    expect(bonusDepreciation).toBe(19000000); // $19M

    // MACRS straight-line on remaining basis (27.5 years)
    const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
    const annualMACRS = remainingBasis / 27.5;
    const placedInServiceMonth = params.placedInServiceMonth || 7; // Default mid-year
    const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months for July
    const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

    const expectedYear1Depreciation = bonusDepreciation + year1MACRS;

    // Tax benefit should be based on depreciation
    const effectiveTaxRate = params.effectiveTaxRate || 47.85;
    const expectedTaxBenefit = expectedYear1Depreciation * (effectiveTaxRate / 100);
    const expectedNetBenefit = expectedTaxBenefit; // 100% to investor (fee removed per IMPL-7.0-001)

    // Verify first year cash flow includes correct tax benefit
    const year1CashFlow = results.investorCashFlows[0];
    expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, -2);
  });

  it('should have same depreciable basis regardless of equity percentage', () => {
    // Since investor equity is NOT excluded, different equity percentages
    // should result in the SAME depreciable basis
    const testCases = [
      { equityPct: 10 },
      { equityPct: 20 },
      { equityPct: 30 },
      { equityPct: 40 },
    ];

    // Expected basis is the same for all: $86M - $10M = $76M
    const expectedBasis = 76000000;

    testCases.forEach(({ equityPct }) => {
      const params: CalculationParams = {
        projectCost: 86000000,
        landValue: 10000000,
        investorEquityPct: equityPct,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        holdPeriod: 10,
        seniorDebtPct: 60 - equityPct,
        philanthropicDebtPct: 5,
        hdcSubDebtPct: 10,
        investorSubDebtPct: 5,
        yearOneNOI: 2580000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 7.5,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 86000000 * (equityPct / 100),
        totalTaxBenefit: 1000000,
        netTaxBenefit: 900000,
        hdcFee: 100000,
        investorPromoteShare: 35,
        seniorDebtRate: 6,
        seniorDebtAmortization: 30,
        philanthropicDebtRate: 0,
        hdcSubDebtPikRate: 8,
        investorSubDebtPikRate: 8,
        opexRatio: 30,
      };

      const results = calculateFullInvestorAnalysis(params);

      // Year 1 depreciation includes bonus + MACRS mid-month convention
      const bonusDepreciation = expectedBasis * 0.25;
      const remainingBasis = expectedBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;
      const placedInServiceMonth = params.placedInServiceMonth || 7;
      const monthsInYear1 = 12.5 - placedInServiceMonth;
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;

      const effectiveTaxRate = params.effectiveTaxRate || 47.85;
      const expectedTaxBenefit = expectedYear1Depreciation * (effectiveTaxRate / 100);
      const expectedNetBenefit = expectedTaxBenefit; // 100% to investor

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, -2);

      console.log(`Equity ${equityPct}%: Basis=$${expectedBasis/1000000}M (same for all), Year1Depr=$${expectedYear1Depreciation/1000000}M`);
    });
  });

  it('should handle 10-year depreciation schedule', () => {
    const params: CalculationParams = {
      projectCost: 86000000,
      landValue: 10000000,
      investorEquityPct: 20,
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      holdPeriod: 10,
      hdcFeeRate: 0,
      seniorDebtPct: 60,
      philanthropicDebtPct: 5,
      hdcSubDebtPct: 10,
      investorSubDebtPct: 5,
      yearOneNOI: 2580000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 7.5,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 17200000,
      totalTaxBenefit: 1000000,
      netTaxBenefit: 900000,
      hdcFee: 100000,
      investorPromoteShare: 35,
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      opexRatio: 30,
      constructionDelayMonths: 0,
    };

    const results = calculateFullInvestorAnalysis(params);

    // Calculate expected values with MACRS mid-month convention
    // NEW FORMULA: Investor equity NOT excluded
    const depreciableBasis = params.projectCost - params.landValue;

    // Year 1: Bonus + MACRS partial
    const bonusDepreciation = depreciableBasis * 0.25;
    const remainingBasis = depreciableBasis - bonusDepreciation;
    const annualStraightLine = remainingBasis / 27.5;
    const placedInServiceMonth = params.placedInServiceMonth || 7;
    const monthsInYear1 = 12.5 - placedInServiceMonth;
    const year1MACRS = (monthsInYear1 / 12) * annualStraightLine;
    const year1Depreciation = bonusDepreciation + year1MACRS;

    // Total 10-year depreciation
    const total10YearDepreciation = year1Depreciation + (annualStraightLine * 9);

    // Verify total tax benefits over 10 years
    const effectiveTaxRate = (params.effectiveTaxRate || 47.85) / 100;
    const totalTaxBenefits = total10YearDepreciation * effectiveTaxRate;
    const totalNetBenefits = totalTaxBenefits; // 100% to investor

    // Sum up all tax benefits from cash flows
    const actualTotalBenefits = results.investorCashFlows
      .slice(0, 10)
      .reduce((sum, cf) => sum + cf.taxBenefit, 0);

    // Allow for up to 5% variance for timing adjustments
    const variance = Math.abs(actualTotalBenefits - totalNetBenefits);
    const variancePct = (variance / totalNetBenefits) * 100;
    expect(variancePct).toBeLessThan(5);

    console.log(`10-Year Depreciation Summary:`);
    console.log(`- Depreciable Basis: $${depreciableBasis/1000000}M (investor equity NOT excluded)`);
    console.log(`- Total Depreciation: $${total10YearDepreciation/1000000}M`);
    console.log(`- Expected Tax Benefits: $${totalNetBenefits/1000000}M`);
    console.log(`- Actual Tax Benefits: $${actualTotalBenefits/1000000}M (variance: ${variancePct.toFixed(2)}%)`);
  });
});
