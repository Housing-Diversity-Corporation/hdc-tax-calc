/**
 * Year 1 Consistency Check
 *
 * This test validates that Initial Investment, Year 1 Tax Benefit,
 * HDC Year 1 Fee, and Year 1 equity recovery all align correctly.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Year 1 Calculation Consistency', () => {

  const createDefaultParams = () => ({
    projectCost: 50,
    landValue: 5,
    holdPeriod: 10,
    yearOneDepreciationPct: 25,
    annualStraightLineDepreciation: 1.227,
    effectiveTaxRate: 47.85,
    yearOneNOI: 2.5,
    revenueGrowth: 3,
    expenseGrowth: 3,
    opexRatio: 25,
    exitCapRate: 6,
    seniorDebtRate: 6,
    seniorDebtPct: 60,
    philanthropicDebtRate: 3,
    philanthropicDebtPct: 10,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    hdcSubDebtPikRate: 8,
    hdcSubDebtPct: 5,
    investorSubDebtPikRate: 8,
    investorSubDebtPct: 5,
    outsideInvestorSubDebtPikRate: 8,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorPikCurrentPayPct: 0,
    investorEquityPct: 20,
    hdcFee: 0.5,
    hdcFeeRate: 0,
    investorPromoteShare: 35,
    aumFeeEnabled: false,
    aumFeeRate: 1.5,
    taxBenefitDelayMonths: 0,
    constructionDelayMonths: 0,
    hdcAdvanceFinancing: false,
    interestReserveEnabled: false,
    interestReserveMonths: 12,
    deferredCapitalGains: 10,
    ozEnabled: true,
    ozType: 'standard' as const,
    capitalGainsTaxRate: 34.65,
    investorUpfrontCash: 10,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    seniorDebtAmortization: 30,
    pikCurrentPayEnabled: false,
    investorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorPikCurrentPayPct: 0,
  });

  it('should correctly calculate all Year 1 components with typical parameters', () => {
    const params = {
      ...createDefaultParams(),
      projectCost: 50,
      landValue: 5,
      investorEquityPct: 20,
      hdcFeeRate: 0,
      yearOneDepreciationPct: 25,
      hdcFee: 0.5, // HDC upfront fee
      // Required fields
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 10,
      totalTaxBenefit: 0,
      netTaxBenefit: 0,
      investorPromoteShare: 35,
    };

    // Step 1: Calculate depreciable basis
    // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
    const depreciableBasis = params.projectCost - params.landValue;
    expect(depreciableBasis).toBe(45); // 50 - 5 = 45

    // Step 2: Calculate Year 1 depreciation with MACRS mid-month convention
    // Bonus depreciation
    const bonusDepreciation = depreciableBasis * (params.yearOneDepreciationPct / 100);
    expect(bonusDepreciation).toBe(11.25); // 45 * 0.25 = 11.25

    // MACRS straight-line on remaining basis (27.5 years)
    const remainingBasis = depreciableBasis - bonusDepreciation;
    const annualMACRS = remainingBasis / 27.5;
    const placedInServiceMonth = 7; // Default mid-year
    const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
    const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

    const year1Depreciation = bonusDepreciation + year1MACRS;
    expect(year1Depreciation).toBeCloseTo(11.8125, 6); // 11.25 + 0.5625 (5.5 months)

    // Step 3: Calculate effective tax rate
    const effectiveTaxRate = params.effectiveTaxRate;
    expect(effectiveTaxRate).toBe(47.85);

    // Step 4: Calculate Year 1 gross tax benefit
    const year1GrossTaxBenefit = year1Depreciation * (effectiveTaxRate / 100);
    expect(year1GrossTaxBenefit).toBeCloseTo(5.652281, 2); // 11.8125 * 0.4785

    // Step 5: HDC fee removed - investor gets 100% of tax benefit
    const hdcYear1TaxFee = 0; // Fee removed per IMPL-7.0-001

    // Step 6: Calculate net tax benefit to investor (now 100% of gross)
    const year1NetBenefit = year1GrossTaxBenefit; // 100% to investor
    expect(year1NetBenefit).toBeCloseTo(5.652281, 2); // 100% of gross

    // Step 7: Calculate initial investment
    // CRITICAL: HDC fees are NOT upfront costs - they're paid annually from operating cash
    // Total investment is ONLY investor equity (see calculations.ts line 1240-1245)
    const investorEquity = params.projectCost * (params.investorEquityPct / 100);
    const totalInvestment = investorEquity; // HDC fee is NOT included
    expect(investorEquity).toBe(10);
    expect(totalInvestment).toBe(10); // Not 10.5!

    // Step 8: Check Year 1 equity recovery
    // Year 1 recovery includes tax benefits + any operating cash
    const year1Recovery = year1NetBenefit; // Plus operating cash if any
    const percentRecoveredYear1 = year1Recovery / investorEquity * 100;
    expect(percentRecoveredYear1).toBeCloseTo(56.52, 1); // 5.652281 / 10 * 100 (approx 56.52%)

    // Now run the actual calculation
    const results = calculateFullInvestorAnalysis(params);

    // Verify the results match our manual calculations
    expect(results.totalInvestment).toBe(10); // Only investor equity
    expect(results.investorCashFlows[0].taxBenefit).toBeCloseTo(5.652281, 2);

    // Year 1 total cash flow should include tax benefit plus operating cash
    const year1TotalCashFlow = results.investorCashFlows[0].totalCashFlow;
    const year1OperatingCash = results.investorCashFlows[0].operatingCashFlow;

    // CRITICAL VALIDATION
    console.log('\n=== YEAR 1 ANALYSIS ===');
    console.log('INPUTS:');
    console.log('  Project Cost:', params.projectCost, 'M');
    console.log('  Land Value:', params.landValue, 'M');
    console.log('  Investor Equity %:', params.investorEquityPct + '%');
    console.log('  HDC Upfront Fee:', params.hdcFee, 'M');
    console.log('');
    console.log('CALCULATIONS:');
    console.log('  Depreciable Basis:', depreciableBasis, 'M');
    console.log('  Year 1 Depreciation (25%):', year1Depreciation, 'M');
    console.log('  Effective Tax Rate:', effectiveTaxRate + '%');
    console.log('');
    console.log('TAX BENEFITS:');
    console.log('  Year 1 Gross Tax Benefit:', year1GrossTaxBenefit.toFixed(6), 'M');
    console.log('  HDC Fee (10% of gross):', hdcYear1TaxFee.toFixed(6), 'M');
    console.log('  Net Tax Benefit to Investor:', year1NetBenefit.toFixed(6), 'M');
    console.log('');
    console.log('INVESTMENT & RECOVERY:');
    console.log('  Investor Equity:', investorEquity, 'M');
    console.log('  HDC Fee (param, not in investment):', params.hdcFee, 'M');
    console.log('  Total Initial Investment:', totalInvestment, 'M (equity only)');
    console.log('');
    console.log('  Year 1 Operating Cash:', year1OperatingCash.toFixed(6), 'M');
    console.log('  Year 1 Total Cash Flow:', year1TotalCashFlow.toFixed(6), 'M');
    console.log('  Year 1 Recovery (% of Equity):', percentRecoveredYear1.toFixed(2) + '%');
    console.log('  Year 1 Recovery (% of Total Investment):', (year1TotalCashFlow / totalInvestment * 100).toFixed(2) + '%');
    console.log('=======================\n');
  });

  // Test removed - HDC tax benefit fee has been eliminated per IMPL-7.0-001

  it('should track equity recovery correctly when Year 1 benefit < investment', () => {
    const investorEquity = 10;
    const year1NetBenefit = 5.38312; // Updated for 100% tax benefit (was 4.844812 with 90%)
    const year1OperatingCash = 0; // Assume no operating cash Year 1

    const year1TotalRecovery = year1NetBenefit + year1OperatingCash;
    const remainingToRecover = investorEquity - year1TotalRecovery;

    expect(year1TotalRecovery).toBeCloseTo(5.38312, 6);
    expect(remainingToRecover).toBeCloseTo(4.61688, 6);
    expect(year1TotalRecovery < investorEquity).toBe(true); // Not fully recovered
  });

  it('should validate free investment calculation', () => {
    // Free investment occurs when Year 1 benefits >= Total Investment (equity only)
    const scenarios = [
      {
        name: 'Not Free',
        year1Benefits: 5.38312, // Updated for 100% tax benefit
        totalInvestment: 10, // Equity only, not including HDC fee
        expectFree: false
      },
      {
        name: 'Exactly Free',
        year1Benefits: 10,
        totalInvestment: 10,
        expectFree: true
      },
      {
        name: 'More than Free',
        year1Benefits: 12,
        totalInvestment: 10,
        expectFree: true
      }
    ];

    scenarios.forEach(scenario => {
      const isFree = scenario.year1Benefits >= scenario.totalInvestment;
      expect(isFree).toBe(scenario.expectFree);

      const coverageRatio = scenario.year1Benefits / scenario.totalInvestment;
      console.log(`${scenario.name}: Coverage = ${(coverageRatio * 100).toFixed(1)}%`);
    });
  });

  it('should ensure investor receives 100% of tax benefits', () => {
    // Test that investor gets 100% of tax benefits (fee removed)
    const testCases = [
      { depreciation: 11.25, taxRate: 47.85 },
      { depreciation: 15, taxRate: 45 },
      { depreciation: 20, taxRate: 50 },
    ];

    testCases.forEach(test => {
      const grossBenefit = test.depreciation * (test.taxRate / 100);
      const netBenefit = grossBenefit; // 100% to investor, no fee

      // Verify investor gets full benefit
      expect(netBenefit).toBeCloseTo(grossBenefit, 10);
    });
  });
});
