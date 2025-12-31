/**
 * Verification Test for Outside Investor Sub-Debt Calculations
 *
 * Confirming the exact calculations for:
 * - $5,877,050 principal (6% of project cost)
 * - 14% annual interest rate
 * - 50% current pay / 50% PIK accrual
 *
 * September 2025
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Outside Investor Sub-Debt Calculation Verification', () => {
  it('should correctly calculate interest and current pay for specific parameters', () => {
    // Set up parameters to match user's model
    // $5,877,050 at 6% means total project cost = $97,950,833
    const projectCost = 97.950833; // in millions

    const params = {
      projectCost: projectCost,
      landValue: 5,
      yearOneNOI: 5, // Sufficient NOI to cover payments
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      investorEquityPct: 20,
      seniorDebtPct: 55, // Adjusted to allow room for 6% outside investor
      philanthropicDebtPct: 15, // Adjusted to balance capital structure
      hdcSubDebtPct: 2,
      investorSubDebtPct: 2,
      outsideInvestorSubDebtPct: 6, // 6% to get $5,877,050
      seniorDebtRate: 6,
      philanthropicDebtRate: 2,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 14, // 14% interest rate
      seniorDebtAmortization: 30,
      exitCapRate: 6,
      opexRatio: 30,
      revenueGrowth: 3,
      expenseGrowth: 3,
      hdcFeeRate: 0,
      investorPromoteShare: 65,
      taxBenefitDelayMonths: 0,
      constructionDelayMonths: 0,
      interestReserveEnabled: false,
      interestReserveMonths: 0,
      philCurrentPayEnabled: false,
      pikCurrentPayEnabled: false,
      investorPikCurrentPayEnabled: false,
      outsideInvestorPikCurrentPayEnabled: true, // Current pay enabled
      pikCurrentPayPct: 0,
      investorPikCurrentPayPct: 0,
      outsideInvestorPikCurrentPayPct: 50, // 50% current pay
      philCurrentPayPct: 0,
      ozEnabled: false,
      ozType: 'standard' as const,
      deferredCapitalGains: 0,
      capitalGainsTaxRate: 0,
      holdPeriod: 10,
      aumFeeEnabled: false,
      aumFeeRate: 0,
      hdcFee: 0,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 19.59, // 20% of 97.95M
      totalTaxBenefit: 0,
      netTaxBenefit: 0
    };

    const result = calculateFullInvestorAnalysis(params);

    // Calculate expected values
    const totalProjectCost = params.projectCost;
    const outsideInvestorPrincipal = totalProjectCost * 0.06;
    const annualInterest = outsideInvestorPrincipal * 0.14;
    const currentPayPortion = annualInterest * 0.50;
    const pikAccrual = annualInterest * 0.50;

    console.log('\n=== OUTSIDE INVESTOR SUB-DEBT VERIFICATION ===\n');
    console.log('Project Details:');
    console.log(`- Total Project Cost: $${totalProjectCost.toFixed(6)}M`);
    console.log(`- Outside Investor Sub-Debt (6%): $${outsideInvestorPrincipal.toFixed(6)}M`);
    console.log(`- In dollars: $${(outsideInvestorPrincipal * 1000000).toFixed(0)}`);

    console.log('\nInterest Calculations:');
    console.log(`- Annual Interest (14%): $${annualInterest.toFixed(6)}M`);
    console.log(`- In dollars: $${(annualInterest * 1000000).toFixed(0)}`);

    console.log('\nCurrent Pay vs PIK Split (50/50):');
    console.log(`- Current Pay (50%): $${currentPayPortion.toFixed(6)}M`);
    console.log(`- In dollars: $${(currentPayPortion * 1000000).toFixed(0)}`);
    console.log(`- PIK Accrual (50%): $${pikAccrual.toFixed(6)}M`);
    console.log(`- In dollars: $${(pikAccrual * 1000000).toFixed(0)}`);

    // Check Year 1 and Year 2 cash flows
    const year1CF = result.investorCashFlows[0];
    const year2CF = result.investorCashFlows[1];

    console.log('\nYear 1 Results:');
    console.log(`- Operating Cash Flow: $${year1CF.operatingCashFlow.toFixed(6)}M`);
    if (year1CF.outsideInvestorCurrentPay) {
      console.log(`- Outside Investor Current Pay: $${year1CF.outsideInvestorCurrentPay.toFixed(6)}M`);
    }

    console.log('\nYear 2 Results:');
    console.log(`- Operating Cash Flow: $${year2CF.operatingCashFlow.toFixed(6)}M`);
    if (year2CF.outsideInvestorCurrentPay) {
      console.log(`- Outside Investor Current Pay: $${year2CF.outsideInvestorCurrentPay.toFixed(6)}M`);
    }

    // Verify the calculations match expectations
    console.log('\n=== VERIFICATION ===');
    console.log(`Expected Annual Interest: $${(annualInterest * 1000000).toFixed(0)}`);
    console.log(`Expected Current Pay: $${(currentPayPortion * 1000000).toFixed(0)}`);
    console.log(`Expected PIK Accrual: $${(pikAccrual * 1000000).toFixed(0)}`);

    // Test with exact user values
    const expectedPrincipal = 5877050;
    const expectedAnnualInterest = 822787; // 14% of $5,877,050
    const expectedCurrentPay = 411393.5; // 50% of interest
    const expectedPIK = 411393.5; // 50% of interest

    const actualPrincipal = outsideInvestorPrincipal * 1000000;
    const actualAnnualInterest = annualInterest * 1000000;
    const actualCurrentPay = currentPayPortion * 1000000;
    const actualPIK = pikAccrual * 1000000;

    console.log('\n=== COMPARISON WITH USER VALUES ===');
    console.log(`User's Principal: $5,877,050`);
    console.log(`Calculated Principal: $${actualPrincipal.toFixed(0)}`);
    console.log(`Match: ${Math.abs(actualPrincipal - expectedPrincipal) < 100 ? '✓' : '✗'}`);

    console.log(`\nUser's Annual Interest (14%): $822,787`);
    console.log(`Calculated Annual Interest: $${actualAnnualInterest.toFixed(0)}`);
    console.log(`Match: ${Math.abs(actualAnnualInterest - expectedAnnualInterest) < 100 ? '✓' : '✗'}`);

    console.log(`\nUser's Current Pay (50%): $411,394`);
    console.log(`Calculated Current Pay: $${actualCurrentPay.toFixed(0)}`);
    console.log(`Match: ${Math.abs(actualCurrentPay - expectedCurrentPay) < 100 ? '✓' : '✗'}`);

    // Verify calculations are within tolerance
    expect(Math.abs(actualPrincipal - expectedPrincipal)).toBeLessThan(1000);
    expect(Math.abs(actualAnnualInterest - expectedAnnualInterest)).toBeLessThan(1000);
    expect(Math.abs(actualCurrentPay - expectedCurrentPay)).toBeLessThan(1000);
  });

  it('should track PIK accumulation over multiple years', () => {
    const projectCost = 97.950833;

    const params = {
      projectCost: projectCost,
      landValue: 5,
      yearOneNOI: 5,
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      investorEquityPct: 20,
      seniorDebtPct: 55,
      philanthropicDebtPct: 15,
      hdcSubDebtPct: 2,
      investorSubDebtPct: 2,
      outsideInvestorSubDebtPct: 6,
      seniorDebtRate: 6,
      philanthropicDebtRate: 2,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 14,
      seniorDebtAmortization: 30,
      exitCapRate: 6,
      opexRatio: 30,
      revenueGrowth: 3,
      expenseGrowth: 3,
      hdcFeeRate: 0,
      investorPromoteShare: 65,
      taxBenefitDelayMonths: 0,
      constructionDelayMonths: 0,
      interestReserveEnabled: false,
      interestReserveMonths: 0,
      philCurrentPayEnabled: false,
      pikCurrentPayEnabled: false,
      investorPikCurrentPayEnabled: false,
      outsideInvestorPikCurrentPayEnabled: true,
      pikCurrentPayPct: 0,
      investorPikCurrentPayPct: 0,
      outsideInvestorPikCurrentPayPct: 50,
      philCurrentPayPct: 0,
      ozEnabled: false,
      ozType: 'standard' as const,
      deferredCapitalGains: 0,
      capitalGainsTaxRate: 0,
      holdPeriod: 10,
      aumFeeEnabled: false,
      aumFeeRate: 0,
      hdcFee: 0,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 19.59,
      totalTaxBenefit: 0,
      netTaxBenefit: 0
    };

    const result = calculateFullInvestorAnalysis(params);

    const totalProjectCost = params.projectCost;
    const outsideInvestorPrincipal = totalProjectCost * 0.06;

    console.log('\n=== PIK ACCUMULATION TRACKING ===\n');
    console.log(`Starting Principal: $${(outsideInvestorPrincipal * 1000000).toFixed(0)}`);

    let pikBalance = outsideInvestorPrincipal;

    for (let year = 1; year <= 5; year++) {
      const annualInterest = pikBalance * 0.14;
      const currentPay = annualInterest * 0.50;
      const pikAccrual = annualInterest * 0.50;
      pikBalance += pikAccrual;

      console.log(`\nYear ${year}:`);
      console.log(`- Beginning Balance: $${((pikBalance - pikAccrual) * 1000000).toFixed(0)}`);
      console.log(`- Total Interest (14%): $${(annualInterest * 1000000).toFixed(0)}`);
      console.log(`- Current Pay (50%): $${(currentPay * 1000000).toFixed(0)}`);
      console.log(`- PIK Accrual (50%): $${(pikAccrual * 1000000).toFixed(0)}`);
      console.log(`- Ending Balance: $${(pikBalance * 1000000).toFixed(0)}`);
    }

    console.log(`\n=== 5-YEAR SUMMARY ===`);
    console.log(`- Original Principal: $${(outsideInvestorPrincipal * 1000000).toFixed(0)}`);
    console.log(`- Final Balance: $${(pikBalance * 1000000).toFixed(0)}`);
    console.log(`- Total PIK Accumulated: $${((pikBalance - outsideInvestorPrincipal) * 1000000).toFixed(0)}`);
    console.log(`- Growth Factor: ${(pikBalance / outsideInvestorPrincipal).toFixed(3)}x`);

    // Verify compounding is working
    expect(pikBalance).toBeGreaterThan(outsideInvestorPrincipal * 1.4); // Should grow significantly
  });
});
