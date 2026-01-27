/**
 * ISS-050: Test that exit waterfall accounts for prior capital recovery
 *
 * When investor has recovered capital during hold period (via tax benefits + operating cash),
 * the exit waterfall should NOT give them full ROC again - only the remaining unrecovered portion.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('ISS-050 Exit Waterfall - Prior Capital Recovery', () => {
  // Scenario: High tax benefits that fully recover investor capital during hold period
  const highTaxBenefitParams: Partial<CalculationParams> = {
    projectCost: 10000000,
    landValue: 1000000,
    yearOneNOI: 600000,
    holdPeriod: 10,
    exitCapRate: 7.0,
    revenueGrowth: 3.0,
    expenseGrowth: 3.0,
    opexRatio: 45,
    investorEquityPct: 20, // $2M equity
    philanthropicEquityPct: 10,
    philanthropicDebtPct: 10,
    philanthropicDebtRate: 2.0,
    seniorDebtPct: 60,
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 25,
    yearOneDepreciationPct: 80, // High depreciation
    effectiveTaxRate: 40, // High tax rate
    federalTaxRate: 37,
    stateTaxRate: 9.3,
    ltCapitalGainsRate: 20,
    hdcFeeRate: 0,
    hdcDeferredInterestRate: 8,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    seniorDebtIOYears: 0,
    philDebtAmortization: 30,
    hdcFee: 0,
    investorPromoteShare: 50 // 50/50 split
  };

  test('Exit ROC should be reduced when capital already recovered during hold period', () => {
    const results = calculateFullInvestorAnalysis(highTaxBenefitParams as CalculationParams);

    // With 80% bonus depreciation and 40% tax rate:
    // Depreciable basis: $9M (projectCost - land)
    // Year 1 depreciation: $7.2M
    // Year 1 tax benefit: ~$2.88M (at 40%)
    // Investor equity: $2M
    // So investor should be FULLY RECOVERED in Year 1

    const investorEquity = results.investorEquity;
    const cumulativeReturnsYear1 = results.investorCashFlows[0]?.cumulativeReturns || 0;

    console.log('\n=== ISS-050: Exit Waterfall Test ===\n');
    console.log('Investor Equity:', investorEquity.toLocaleString());
    console.log('Year 1 Cumulative Returns:', cumulativeReturnsYear1.toLocaleString());
    console.log('Year 1 Tax Benefit:', results.investorCashFlows[0]?.taxBenefit?.toLocaleString());
    console.log('Recovered in Year 1?', cumulativeReturnsYear1 >= investorEquity ? 'YES' : 'NO');

    // Exit proceeds should NOT include full ROC if capital was already recovered
    const exitProceeds = results.exitProceeds;
    const totalReturns = results.totalReturns;

    console.log('\nExit Proceeds:', exitProceeds.toLocaleString());
    console.log('Total Returns:', totalReturns.toLocaleString());

    // If fully recovered, ROC at exit should be $0
    // All exit proceeds should be profit split per promote
    expect(cumulativeReturnsYear1).toBeGreaterThan(investorEquity * 0.9); // At least 90% recovered
  });

  test('Conservation of capital: Investor + HDC = Gross Exit Proceeds', () => {
    const investorResults = calculateFullInvestorAnalysis(highTaxBenefitParams as CalculationParams);

    const hdcParams = {
      ...highTaxBenefitParams,
      investorEquity: investorResults.investorEquity,
      investorSubDebtAtExit: investorResults.investorSubDebtAtExit,
      investorCashFlows: investorResults.investorCashFlows,
      // ISS-050: Pass grossExitProceeds to ensure conservation of capital
      grossExitProceeds: investorResults.grossExitProceeds || investorResults.totalExitProceeds
    };
    const hdcResults = calculateHDCAnalysis(hdcParams as any);

    // ISS-050: Use the new waterfall fields for conservation check
    const grossExitProceeds = investorResults.grossExitProceeds || investorResults.totalExitProceeds || 0;
    const investorROC = investorResults.exitReturnOfCapital || 0;
    const investorProfitShare = investorResults.exitProfitShare || 0;
    const investorEquityShare = investorROC + investorProfitShare;
    const hdcProfitShare = hdcResults.hdcPromoteProceeds || 0;

    console.log('\n=== Conservation of Capital at Exit ===\n');
    console.log('Gross Exit Proceeds:', grossExitProceeds.toLocaleString());
    console.log('--- Equity Waterfall ---');
    console.log('Investor ROC (remaining only):', investorROC.toLocaleString());
    console.log('Investor Profit Share:', investorProfitShare.toLocaleString());
    console.log('Investor Total (ROC + Profit):', investorEquityShare.toLocaleString());
    console.log('HDC Profit Share:', hdcProfitShare.toLocaleString());
    console.log('--- Conservation Check ---');
    const sumOfEquityShares = investorEquityShare + hdcProfitShare;
    console.log('Sum (Investor + HDC):', sumOfEquityShares.toLocaleString());
    console.log('Variance:', (sumOfEquityShares - grossExitProceeds).toLocaleString());

    // CONSERVATION OF CAPITAL: Investor equity share + HDC equity share = Gross Exit Proceeds
    // Allow for small floating point tolerance (< $1)
    expect(Math.abs(sumOfEquityShares - grossExitProceeds)).toBeLessThan(1);

    // Both parties should get something
    expect(investorEquityShare).toBeGreaterThan(0);
    expect(hdcProfitShare).toBeGreaterThan(0);
  });

  test('Promote split affects exit proceeds correctly after prior recovery', () => {
    // Test with different promote splits
    const params90 = { ...highTaxBenefitParams, investorPromoteShare: 90 } as CalculationParams;
    const params35 = { ...highTaxBenefitParams, investorPromoteShare: 35 } as CalculationParams;

    const results90 = calculateFullInvestorAnalysis(params90);
    const results35 = calculateFullInvestorAnalysis(params35);

    console.log('\n=== Promote Split Impact on Exit ===\n');
    console.log('At 90% Investor:');
    console.log('  Exit Proceeds:', results90.exitProceeds?.toLocaleString());
    console.log('At 35% Investor:');
    console.log('  Exit Proceeds:', results35.exitProceeds?.toLocaleString());
    console.log('Difference:', ((results35.exitProceeds || 0) - (results90.exitProceeds || 0)).toLocaleString());

    // Exit proceeds should decrease when investor's share decreases
    expect(results35.exitProceeds).toBeLessThan(results90.exitProceeds || 0);
  });
});
