import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Debug Tax Benefit Calculation', () => {
  it('should show tax benefit calculation details', () => {
    const params = {
      projectCost: 50,
      landValue: 5,
      yearOneNOI: 2.5,
      yearOneDepreciationPct: 25,
      annualStraightLineDepreciation: 1.5,
      effectiveTaxRate: 47.85,
      investorPromoteShare: 35, // Fixed: was hdcPromotePct
      investorEquityPct: 20,
      seniorDebtPct: 60,
      philanthropicDebtPct: 10,
      hdcSubDebtPct: 5,
      investorSubDebtPct: 5,
      exitCapRate: 6,
      opexRatio: 25,
      revenueGrowth: 3,
      expenseGrowth: 3,
      hdcFeeRate: 0,
      hdcFee: 0.5,
      taxBenefitDelayMonths: 0,
      constructionDelayMonths: 0,
      ozEnabled: true,
      ozType: 'standard' as const,
      deferredCapitalGains: 10,
      capitalGainsTaxRate: 34.65,
      holdPeriod: 10,
      // Add missing required parameters
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 10, // 20% of 50M
      totalTaxBenefit: 0, // Will be calculated
      netTaxBenefit: 0, // Will be calculated
      seniorDebtRate: 6,
      philanthropicDebtRate: 0
    };

    const result = calculateFullInvestorAnalysis(params);

    console.log('Params effective tax rate:', params.effectiveTaxRate);
    console.log('Year 1 cash flow:', result.investorCashFlows[0]);
    console.log('Year 1 tax benefit:', result.investorCashFlows[0].taxBenefit);
    console.log('Total tax benefits:', result.investorTaxBenefits);

    // Calculate expected
    const depreciableBasis = params.projectCost - params.landValue;
    const year1Depreciation = depreciableBasis * (params.yearOneDepreciationPct / 100);
    const year1TaxBenefit = year1Depreciation * (params.effectiveTaxRate / 100);
    const hdcFee = year1TaxBenefit * 0.10;
    const expectedNet = year1TaxBenefit - hdcFee;

    console.log('\nExpected calculations:');
    console.log('Depreciable basis:', depreciableBasis);
    console.log('Year 1 depreciation:', year1Depreciation);
    console.log('Year 1 tax benefit:', year1TaxBenefit);
    console.log('HDC fee:', hdcFee);
    console.log('Expected net to investor:', expectedNet);

    expect(result).toBeDefined();
  });
});