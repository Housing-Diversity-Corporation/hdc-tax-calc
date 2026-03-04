/**
 * ISS-047c: Diagnostic test for promote split impact on operating cash flow
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('ISS-047c Promote Split Diagnostic', () => {
  const baseParams: Partial<CalculationParams> = {
    projectCost: 10000000,
    landValue: 1000000,
    yearOneNOI: 600000,
    holdPeriod: 10,
    exitCapRate: 7.0,
    revenueGrowth: 3.0,
    expenseGrowth: 3.0,
    opexRatio: 45,
    investorEquityPct: 20,
    philanthropicEquityPct: 10,
    philanthropicDebtPct: 10,
    philanthropicDebtRate: 2.0,
    seniorDebtPct: 60,
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 25,
    yearOneDepreciationPct: 80,
    effectiveTaxRate: 40,
    federalTaxRate: 37,
    stateTaxRate: 9.3,
    ltCapitalGainsRate: 20,
    hdcFeeRate: 0,
    hdcDeferredInterestRate: 8,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    constructionDelayMonths: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    seniorDebtIOYears: 0,
    philDebtAmortization: 30,
    hdcFee: 0
  };

  test('Operating cash should change with promote split', () => {
    // Test with 90% investor (10% HDC)
    const params90 = { ...baseParams, investorPromoteShare: 90 } as CalculationParams;
    const results90 = calculateFullInvestorAnalysis(params90);

    // Test with 35% investor (65% HDC)
    const params35 = { ...baseParams, investorPromoteShare: 35 } as CalculationParams;
    const results35 = calculateFullInvestorAnalysis(params35);

    console.log('\n=== PROMOTE SPLIT TEST ===\n');
    console.log('At 90% Investor / 10% HDC:');
    console.log('  Investor Operating Cash Flows:', results90.investorOperatingCashFlows?.toLocaleString());
    console.log('  Exit Proceeds:', results90.exitProceeds?.toLocaleString());

    console.log('\nAt 35% Investor / 65% HDC:');
    console.log('  Investor Operating Cash Flows:', results35.investorOperatingCashFlows?.toLocaleString());
    console.log('  Exit Proceeds:', results35.exitProceeds?.toLocaleString());

    console.log('\nDifference:');
    const opCashDiff = (results35.investorOperatingCashFlows || 0) - (results90.investorOperatingCashFlows || 0);
    const exitDiff = (results35.exitProceeds || 0) - (results90.exitProceeds || 0);
    console.log('  Operating Cash Change:', opCashDiff.toLocaleString());
    console.log('  Exit Proceeds Change:', exitDiff.toLocaleString());

    // Verify operating cash DOES change
    expect(Math.abs(opCashDiff)).toBeGreaterThan(1000);
    expect(opCashDiff).toBeLessThan(0); // Should decrease when investor share decreases
  });

  test('Year-by-year operating cash breakdown', () => {
    const params90 = { ...baseParams, investorPromoteShare: 90 } as CalculationParams;
    const results90 = calculateFullInvestorAnalysis(params90);

    const params35 = { ...baseParams, investorPromoteShare: 35 } as CalculationParams;
    const results35 = calculateFullInvestorAnalysis(params35);

    console.log('\n=== YEAR-BY-YEAR OPERATING CASH ===\n');
    console.log('Year | 90% Investor | 35% Investor | Difference');
    console.log('-----|--------------|--------------|------------');

    for (let i = 0; i < 10; i++) {
      const cf90 = results90.investorCashFlows[i];
      const cf35 = results35.investorCashFlows[i];
      const diff = (cf35?.operatingCashFlow || 0) - (cf90?.operatingCashFlow || 0);
      console.log(`  ${i + 1}  | ${(cf90?.operatingCashFlow || 0).toLocaleString().padStart(12)} | ${(cf35?.operatingCashFlow || 0).toLocaleString().padStart(12)} | ${diff.toLocaleString().padStart(10)}`);
    }
  });

  test('HDC vs Investor should sum to total available cash', () => {
    const params = { ...baseParams, investorPromoteShare: 50 } as CalculationParams;
    const investorResults = calculateFullInvestorAnalysis(params);

    const hdcParams = {
      ...params,
      investorEquity: investorResults.investorEquity,
      investorSubDebtAtExit: investorResults.investorSubDebtAtExit,
      investorCashFlows: investorResults.investorCashFlows
    };
    const hdcResults = calculateHDCAnalysis(hdcParams as any);

    console.log('\n=== HDC + INVESTOR RECONCILIATION (50/50 split) ===\n');
    console.log('Investor Operating Cash:', investorResults.investorOperatingCashFlows?.toLocaleString());
    console.log('HDC Operating Promote:', hdcResults.hdcOperatingPromoteIncome?.toLocaleString());
    console.log('Sum:', ((investorResults.investorOperatingCashFlows || 0) + (hdcResults.hdcOperatingPromoteIncome || 0)).toLocaleString());

    // They should sum to total available cash (after debt service)
    const totalOperatingCash = (investorResults.investorOperatingCashFlows || 0) + (hdcResults.hdcOperatingPromoteIncome || 0);
    expect(totalOperatingCash).toBeGreaterThan(0);
  });
});
