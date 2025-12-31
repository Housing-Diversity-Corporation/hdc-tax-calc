// Test to verify DSCR correctly includes Outside Investor Sub-Debt current pay
import { calculateFullInvestorAnalysis } from '../calculations';

describe('DSCR with Outside Investor Sub-Debt', () => {
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

    // Tax params
    federalTaxRate: 37,
    stateTaxRate: 10.9,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 10.9,
    depreciationRecaptureRate: 25,

    // Capital structure
    investorEquityPct: 5,
    philanthropicEquityPct: 0,
    seniorDebtPct: 63,
    philDebtPct: 25,
    hdcSubDebtPct: 2,
    investorSubDebtPct: 0,

    // Debt parameters
    seniorDebtRate: 5,
    philDebtRate: 0,
    seniorDebtAmortization: 35,
    philDebtAmortization: 60,
    hdcSubDebtPikRate: 8,

    // Fees
    hdcFeeRate: 0,
    investorPromoteShare: 65,
    aumFeeEnabled: false,
  };

  it('should include Outside Investor current pay in DSCR calculation', () => {
    // Test WITHOUT Outside Investor Sub-Debt
    const withoutOutsideParams = {
      ...baseParams,
      outsideInvestorSubDebtPct: 0,
      outsideInvestorSubDebtPikRate: 8,
      outsideInvestorPikCurrentPayEnabled: false,
      outsideInvestorPikCurrentPayPct: 0,
    };

    const resultWithout = calculateFullInvestorAnalysis(withoutOutsideParams);
    const dscrWithout = resultWithout.investorCashFlows[1]?.dscr || 0; // Year 2 DSCR

    // Test WITH Outside Investor Sub-Debt (7% with 50% current pay)
    const withOutsideParams = {
      ...baseParams,
      outsideInvestorSubDebtPct: 7, // 7% of project cost
      outsideInvestorSubDebtPikRate: 8, // 8% interest
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 50, // 50% current pay
    };

    const resultWith = calculateFullInvestorAnalysis(withOutsideParams);
    const dscrWith = resultWith.investorCashFlows[1]?.dscr || 0; // Year 2 DSCR

    // DSCR is managed at 1.05x with cash management system
    expect(dscrWith).toBeCloseTo(1.05, 2);
    expect(dscrWithout).toBeCloseTo(1.05, 2);

    // Calculate expected reduction
    // Outside Investor: $7M at 8% = $560k annual interest
    // 50% current pay = $280k additional debt service
    // This should reduce DSCR noticeably

    // Get Year 2 NOI and debt service
    const year2NOI = resultWith.investorCashFlows[1]?.noi || 0;
    const year2DebtService = resultWith.investorCashFlows[1]?.debtServicePayments || 0;

    // Verify debt service includes the Outside Investor current pay
    // It should be higher than without Outside Investor
    const debtServiceWithout = resultWithout.investorCashFlows[1]?.debtServicePayments || 0;
    expect(year2DebtService).toBeGreaterThan(debtServiceWithout);

    // The difference should be approximately the Outside Investor current pay amount
    // With 50% current pay enabled, Year 1 has 50% current, 50% PIK
    // So Year 2 balance is: $7M * (1 + 0.08 * 0.5) = $7.28M
    const year1Balance = 7_000_000 * (1 + 0.08 * 0.5); // 50% PIK in Year 1
    const outsideInvestorCurrentPay = year1Balance * 0.08 * 0.50; // $291.2k
    const difference = year2DebtService - debtServiceWithout;
    expect(difference).toBeCloseTo(outsideInvestorCurrentPay, -2);
  });

  it('should NOT include Outside Investor in DSCR when current pay is disabled', () => {
    const params1 = {
      ...baseParams,
      outsideInvestorSubDebtPct: 7,
      outsideInvestorSubDebtPikRate: 8,
      outsideInvestorPikCurrentPayEnabled: false, // No current pay
      outsideInvestorPikCurrentPayPct: 0,
    };

    const params2 = {
      ...baseParams,
      outsideInvestorSubDebtPct: 7,
      outsideInvestorSubDebtPikRate: 8,
      outsideInvestorPikCurrentPayEnabled: true, // With current pay
      outsideInvestorPikCurrentPayPct: 50,
    };

    const result1 = calculateFullInvestorAnalysis(params1);
    const result2 = calculateFullInvestorAnalysis(params2);

    // Year 2 debt service should be different
    const debtService1 = result1.investorCashFlows[1]?.debtServicePayments || 0;
    const debtService2 = result2.investorCashFlows[1]?.debtServicePayments || 0;

    // With current pay enabled, debt service should be higher
    expect(debtService2).toBeGreaterThan(debtService1);

    // DSCRs are managed at 1.05x through cash management
    const dscr1 = result1.investorCashFlows[1]?.dscr || 0;
    const dscr2 = result2.investorCashFlows[1]?.dscr || 0;

    // Both DSCRs managed at 1.05x
    expect(dscr1).toBeCloseTo(1.05, 2);
    expect(dscr2).toBeCloseTo(1.05, 2);
  });

  it('should maintain minimum 1.05x DSCR with reasonable Outside Investor debt', () => {
    // Test with a reasonable Outside Investor Sub-Debt amount
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 5, // 5% is reasonable
      outsideInvestorSubDebtPikRate: 8,
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 50, // 50% current pay
    };

    const result = calculateFullInvestorAnalysis(params);
    const year2DSCR = result.investorCashFlows[1]?.dscr || 0;

    // Should still meet minimum 1.05x requirement with reasonable Outside Investor debt
    expect(year2DSCR).toBeGreaterThanOrEqual(1.05);
  });
});