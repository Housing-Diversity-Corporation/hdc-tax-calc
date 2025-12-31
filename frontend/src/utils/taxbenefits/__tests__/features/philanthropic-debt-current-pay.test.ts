// Test to verify philanthropic debt current pay calculation is correct
import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';

describe('Philanthropic Debt Current Pay', () => {
  const baseParams = {
    projectCost: 100_000_000,
    landValue: 10_000_000,
    yearOneNOI: 5_000_000,
    yearOneDepreciationPct: 25,
    revenueGrowth: 3,
    expenseGrowth: 2,
    exitCapRate: 6,
    opexRatio: 30,
    holdPeriod: 10,
    constructionDelayMonths: 0,

    // Tax params - using effectiveTaxRate instead
    effectiveTaxRate: 47.85,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 10.9,

    // Capital structure
    investorEquityPct: 5,
    seniorDebtPct: 63,
    philanthropicDebtPct: 25,
    hdcSubDebtPct: 2,
    investorSubDebtPct: 0,
    outsideInvestorSubDebtPct: 0,

    // Debt parameters
    seniorDebtRate: 5,
    philanthropicDebtRate: 0, // 0% interest
    seniorDebtAmortization: 35,
    hdcSubDebtPikRate: 8,

    // Required params
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 5_000_000, // 5% of 100M
    totalTaxBenefit: 1_000_000,
    netTaxBenefit: 900_000,
    hdcFee: 100_000,
    investorPromoteShare: 65,
    aumFeeEnabled: false,
  };

  it('should not change HDC exit proceeds with philanthropic current pay at 0% interest', () => {
    // Test WITHOUT current pay
    const withoutCurrentPayParams = {
      ...baseParams,
      philCurrentPayEnabled: false,
      philCurrentPayPct: 0,
    };

    const investorWithout = calculateFullInvestorAnalysis(withoutCurrentPayParams);
    const hdcWithout = calculateHDCAnalysis({
      ...withoutCurrentPayParams,
      investorCashFlows: investorWithout.investorCashFlows,
      investorSubDebtAtExit: investorWithout.investorSubDebtAtExit,
      investorEquity: investorWithout.investorEquity
    });
    const hdcExitWithout = hdcWithout.hdcExitProceeds;

    // Test WITH 4% current pay
    const withCurrentPayParams = {
      ...baseParams,
      philCurrentPayEnabled: true,
      philCurrentPayPct: 4, // Only 4% current pay
    };

    const investorWith = calculateFullInvestorAnalysis(withCurrentPayParams);
    const hdcWith = calculateHDCAnalysis({
      ...withCurrentPayParams,
      investorCashFlows: investorWith.investorCashFlows,
      investorSubDebtAtExit: investorWith.investorSubDebtAtExit,
      investorEquity: investorWith.investorEquity
    });
    const hdcExitWith = hdcWith.hdcExitProceeds;

    // With 0% interest philanthropic debt, exit proceeds should be identical
    // because there's no interest to pay or accrue
    expect(hdcExitWith).toBeCloseTo(hdcExitWithout, 2);

    // The reduction should be essentially 0
    const reduction = Math.abs(hdcExitWithout - hdcExitWith);
    const reductionPct = (reduction / hdcExitWithout) * 100;
    expect(reductionPct).toBeLessThan(0.01); // Less than 0.01% difference
  });

  it('should properly calculate philanthropic debt at exit', () => {
    const params = {
      ...baseParams,
      philCurrentPayEnabled: true,
      philCurrentPayPct: 4,
    };

    const result = calculateFullInvestorAnalysis(params);
    const philDebtAmount = baseParams.projectCost * (baseParams.philanthropicDebtPct / 100); // $25M
    const seniorDebtAmount = baseParams.projectCost * (baseParams.seniorDebtPct / 100); // $63M

    // With 0% interest philanthropic debt, it remains at $25M (no growth)
    // Check that total remaining debt at exit includes the philanthropic debt

    // remainingDebtAtExit should include both senior and philanthropic debt
    // Senior debt will have paid down some principal, but philanthropic debt stays at $25M
    expect(result.remainingDebtAtExit).toBeGreaterThanOrEqual(philDebtAmount);

    // The remaining debt should be less than the original total
    // (because senior debt has been paying down principal)
    const originalTotalDebt = seniorDebtAmount + philDebtAmount;
    expect(result.remainingDebtAtExit).toBeLessThan(originalTotalDebt);
  });

  it('should maintain 1.05x DSCR regardless of philanthropic current pay', () => {
    // Test WITHOUT current pay
    const withoutParams = {
      ...baseParams,
      philanthropicDebtRate: 5, // Give it some interest rate to see the effect
      philCurrentPayEnabled: false,
      philCurrentPayPct: 0,
    };

    const resultWithout = calculateFullInvestorAnalysis(withoutParams);
    const dscrWithout = resultWithout.investorCashFlows[1]?.dscr || 0; // Year 2 DSCR

    // Test WITH current pay
    const withParams = {
      ...baseParams,
      philanthropicDebtRate: 5, // Same interest rate
      philCurrentPayEnabled: true,
      philCurrentPayPct: 50, // 50% current pay
    };

    const resultWith = calculateFullInvestorAnalysis(withParams);
    const dscrWith = resultWith.investorCashFlows[1]?.dscr || 0; // Year 2 DSCR

    // DSCR cash management system maintains 1.05x target regardless of current pay
    // Both should be 1.05x as the system targets this exactly
    expect(dscrWith).toBeCloseTo(1.05, 2);
    expect(dscrWithout).toBeCloseTo(1.05, 2);

    // The system manages cash to maintain DSCR, so both scenarios should have the same DSCR
    expect(dscrWith).toBe(dscrWithout);
  });
});
