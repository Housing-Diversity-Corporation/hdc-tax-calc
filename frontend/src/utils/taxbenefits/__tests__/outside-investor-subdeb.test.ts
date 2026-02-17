import { calculateFullInvestorAnalysis } from '../calculations';

describe('Outside Investor Sub-Debt Feature', () => {
  const baseParams = {
    projectCost: 10000000,
    landValue: 2000000,
    yearOneNOI: 800000,
    yearOneDepreciationPct: 6,
    revenueGrowth: 3,
    expenseGrowth: 2,
    exitCapRate: 6.5,
    investorEquityPct: 30,
    hdcFeeRate: 2,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 3000000,
    totalTaxBenefit: 1500000,
    netTaxBenefit: 1000000,
    hdcFee: 200000,
    year1NetBenefit: 100000,
    investorPromoteShare: 80,
    hdcSubDebtPct: 5,
    hdcSubDebtPikRate: 8,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorSubDebtPct: 5,
    investorSubDebtPikRate: 8,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 0,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    opexRatio: 35,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    seniorDebtPct: 40,
    philanthropicDebtPct: 10,
    seniorDebtRate: 5,
    philanthropicDebtRate: 4,
    seniorDebtAmortization: 30,
    philDebtAmortization: 30,
    seniorLoanAmount: 4000000,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0,
    taxAdvanceDiscountRate: 8,
    advanceFinancingRate: 6,
    taxDeliveryMonths: 6,
    holdPeriod: 5,
    constructionDelayMonths: 0,
    placedInServiceMonth: 1,
    yearOneDepreciation: 600000,
    annualStraightLineDepreciation: 300000,
    effectiveTaxRate: 40
  };

  it('should calculate outside investor sub-debt with PIK only', () => {
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 10,  // $1M principal
      outsideInvestorSubDebtPikRate: 10,  // 10% annual interest
      outsideInvestorPikCurrentPayEnabled: false,
      outsideInvestorPikCurrentPayPct: 0
    };

    const result = calculateFullInvestorAnalysis(params);

    // Check that outside investor sub-debt is tracked
    expect(result.outsideInvestorSubDebtAtExit).toBeGreaterThan(1000000);
    expect(result.outsideInvestorTotalCost).toBeDefined();
    expect(result.outsideInvestorCashPaid).toBe(0); // No current pay
    expect(result.outsideInvestorTotalInterest).toBeGreaterThan(0);

    // Verify it reduces exit proceeds
    const resultWithoutOutsideDebt = calculateFullInvestorAnalysis(baseParams);
    expect(result.exitProceeds).toBeLessThan(resultWithoutOutsideDebt.exitProceeds);
  });

  it('should calculate outside investor sub-debt with current pay', () => {
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 10,  // $1M principal
      outsideInvestorSubDebtPikRate: 10,  // 10% annual interest
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 50  // 50% current, 50% PIK
    };

    const result = calculateFullInvestorAnalysis(params);

    // Check that cash is paid out
    expect(result.outsideInvestorCashPaid).toBeGreaterThan(0);

    // Check that PIK still accumulates (but less than full PIK)
    const fullPikParams = {
      ...params,
      outsideInvestorPikCurrentPayEnabled: false
    };
    const fullPikResult = calculateFullInvestorAnalysis(fullPikParams);
    expect(result.outsideInvestorSubDebtAtExit).toBeLessThan(fullPikResult.outsideInvestorSubDebtAtExit);

    // Total interest should be less with current pay (no compounding on paid portion)
    expect(result.outsideInvestorTotalInterest).toBeLessThan(fullPikResult.outsideInvestorTotalInterest || 0);
  });

  it('should reduce investor cash flows when current pay is enabled', () => {
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 10,
      outsideInvestorSubDebtPikRate: 10,
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 100  // 100% current pay
    };

    const result = calculateFullInvestorAnalysis(params);

    // Year 2 onwards should have reduced cash flow due to current pay
    const year2CashFlow = result.investorCashFlows[1];
    expect(year2CashFlow.outsideInvestorCurrentPay).toBeGreaterThan(0);

    // Total cash flow should be reduced by the current pay amount
    const resultWithoutOutsideDebt = calculateFullInvestorAnalysis(baseParams);
    const year2CashFlowWithoutDebt = resultWithoutOutsideDebt.investorCashFlows[1];
    expect(year2CashFlow.totalCashFlow).toBeLessThan(year2CashFlowWithoutDebt.totalCashFlow);
  });

  it('should properly calculate total cost of outside investor debt', () => {
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 10,  // $1M principal
      outsideInvestorSubDebtPikRate: 12,  // 12% annual interest
      outsideInvestorPikCurrentPayEnabled: false
    };

    const result = calculateFullInvestorAnalysis(params);

    const principal = params.projectCost * params.outsideInvestorSubDebtPct / 100;

    // Total cost should be principal + all interest (use toBeCloseTo for floating-point precision)
    expect(result.outsideInvestorTotalCost).toBeCloseTo(result.outsideInvestorSubDebtAtExit, 2);
    expect(result.outsideInvestorTotalCost).toBeGreaterThan(principal);

    // Total interest should equal total cost minus principal
    expect(result.outsideInvestorTotalInterest).toBeCloseTo(
      (result.outsideInvestorTotalCost || 0) - principal,
      2
    );
  });

  it('should show outside investor debt in cash flow items', () => {
    const params = {
      ...baseParams,
      outsideInvestorSubDebtPct: 10,
      outsideInvestorSubDebtPikRate: 10,
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 60
    };

    const result = calculateFullInvestorAnalysis(params);

    // Check year 1 (PIK only)
    const year1 = result.investorCashFlows[0];
    expect(year1.outsideInvestorCurrentPay).toBeGreaterThanOrEqual(0);
    expect(year1.outsideInvestorPIKAccrued).toBeGreaterThan(0);

    // Check year 2+ (current pay + PIK)
    const year2 = result.investorCashFlows[1];
    expect(year2.outsideInvestorCurrentPay).toBeGreaterThan(0);
    expect(year2.outsideInvestorPIKAccrued).toBeGreaterThan(0);

    // Current pay should be 60% of interest
    const totalYear2Interest = (year2.outsideInvestorCurrentPay || 0) + (year2.outsideInvestorPIKAccrued || 0);
    const currentPayRatio = (year2.outsideInvestorCurrentPay || 0) / totalYear2Interest;
    expect(currentPayRatio).toBeCloseTo(0.6, 2);
  });
});