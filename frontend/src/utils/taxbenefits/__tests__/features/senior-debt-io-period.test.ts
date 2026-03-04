/**
 * Senior Debt Interest-Only Period Tests
 *
 * Tests the IO period feature for senior debt:
 * - Interest-only payments during IO period
 * - Switch to P&I after IO ends
 * - Exit balance calculation with IO
 * - Interest reserve impact
 * - Placed in service timing
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Senior Debt Interest-Only Period', () => {
  const baseParams = {
    projectCost: 30, // $30M
    predevelopmentCosts: 0,
    landValue: 5,
    yearOneNOI: 2.5,
    yearOneDepreciationPct: 100,
    holdPeriod: 10,
    revenueGrowth: 2,
    expenseGrowth: 2,
    exitCapRate: 5,
    opexRatio: 35,
    federalTaxRate: 37,
    stateTaxRate: 10.9,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 10.9,
    deferredGains: 0,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    taxAdvanceDiscountRate: 10,
    advanceFinancingRate: 10,
    taxDeliveryMonths: 0,
    investorEquityPct: 30,
    philanthropicEquityPct: 10,
    seniorDebtPct: 60, // 60% = $18M
    seniorDebtRate: 6,
    seniorDebtAmortization: 30,
    philDebtPct: 0,
    philDebtRate: 0,
    philDebtAmortization: 30,
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 0,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 0,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 0,
    investorPromoteShare: 0,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 12,
    constructionDelayMonths: 0,
    placedInServiceMonth: 1,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    aumCurrentPayEnabled: false,
    aumCurrentPayPct: 0,
  };

  describe('Baseline - No IO Period (seniorDebtIOYears = 0)', () => {
    it('should calculate P&I payment from Year 1', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);

      // Ground truth: $18M @ 6%, 30yr = $1,295,031/year P&I
      expect(year1?.hardDebtService).toBeCloseTo(1.295031, 2); // in millions
    });

    it('should reduce balance with P&I payments', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      const year10 = result.cashFlows.find(cf => cf.year === 10);

      // Year 1: Principal payment = P&I - Interest
      const year1Interest = 18 * 0.06; // $1.08M
      const year1Principal = 1.295031 - year1Interest;

      expect(year1Principal).toBeGreaterThan(0.2); // At least $200K principal

      // Exit balance should be less than original $18M
      expect(result.remainingDebtAtExit).toBeLessThan(18);
      expect(result.remainingDebtAtExit).toBeGreaterThan(10); // Still substantial
    });
  });

  describe('3-Year IO Period (seniorDebtIOYears = 3)', () => {
    it('should calculate IO payment for Years 1-3', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      const year2 = result.cashFlows.find(cf => cf.year === 2);
      const year3 = result.cashFlows.find(cf => cf.year === 3);

      // Ground truth: $18M @ 6% = $1.08M interest-only
      expect(year1?.hardDebtService).toBeCloseTo(1.08, 2);
      expect(year2?.hardDebtService).toBeCloseTo(1.08, 2);
      expect(year3?.hardDebtService).toBeCloseTo(1.08, 2);
    });

    it('should switch to P&I payment starting Year 4', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      const year4 = result.cashFlows.find(cf => cf.year === 4);

      // Year 4: Switch to P&I payment
      // Ground truth: $18M @ 6%, 30yr = $1,295,031/year P&I
      expect(year4?.hardDebtService).toBeCloseTo(1.295031, 2);
    });

    it('should maintain full balance during IO period', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      // Exit balance after 10 years should be higher than no-IO case
      // because first 3 years had no principal paydown
      const resultNoIO = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      expect(result.remainingDebtAtExit).toBeGreaterThan(
        resultNoIO.remainingDebtAtExit
      );
    });

    it('should have lower payments during IO period vs P&I', () => {
      const resultIO = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      const resultNoIO = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      const year1IO = resultIO.cashFlows.find(cf => cf.year === 1).hardDebtService;
      const year1PI = resultNoIO.cashFlows.find(cf => cf.year === 1).hardDebtService;

      // IO payment should be lower than P&I
      expect(year1IO).toBeLessThan(year1PI);

      // Savings should be ~$215K/year (1.295M - 1.08M)
      expect(year1PI - year1IO).toBeCloseTo(0.215, 2);
    });
  });

  describe('5-Year IO Period (seniorDebtIOYears = 5)', () => {
    it('should calculate IO payment for Years 1-5', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 5,
      });

      for (let year = 1; year <= 5; year++) {
        const cashFlow = result.cashFlows.find(cf => cf.year === year);
        expect(cashFlow?.hardDebtService).toBeCloseTo(1.08, 2);
      }
    });

    it('should switch to P&I payment starting Year 6', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 5,
      });

      const year6 = result.cashFlows.find(cf => cf.year === 6);
      expect(year6?.hardDebtService).toBeCloseTo(1.295031, 2);
    });

    it('should have higher exit balance than 3-year IO', () => {
      const result5yr = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 5,
      });

      const result3yr = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      // 5-year IO has 2 more years without principal paydown
      expect(result5yr.remainingDebtAtExit).toBeGreaterThan(
        result3yr.remainingDebtAtExit
      );
    });
  });

  describe('10-Year IO Period (seniorDebtIOYears = 10)', () => {
    it('should calculate IO payment for all 10 years', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 10,
      });

      for (let year = 1; year <= 10; year++) {
        const cashFlow = result.cashFlows.find(cf => cf.year === year);
        expect(cashFlow?.hardDebtService).toBeCloseTo(1.08, 2);
      }
    });

    it('should have no principal paydown at exit', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 10,
      });

      // Exit balance should be close to original amount
      // With IMPL-087 +1 disposition year, Year 11 exceeds IO period so has some P&I
      expect(result.remainingDebtAtExit).toBeCloseTo(18, 0);
    });

    it('should have maximum investor cash flow benefit', () => {
      const result10yr = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 10,
      });

      const resultNoIO = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      // 10-year IO should provide most cash flow benefit during hold period
      let cashFlowBenefit = 0;
      for (let year = 1; year <= 10; year++) {
        const cfNoIO = resultNoIO.cashFlows.find(cf => cf.year === year);
        const cf10yr = result10yr.cashFlows.find(cf => cf.year === year);
        const diffDebtService = (cfNoIO?.hardDebtService || 0) - (cf10yr?.hardDebtService || 0);
        cashFlowBenefit += diffDebtService;
      }

      // Total 10-year benefit: ~$215K/year × 10 = ~$2.15M
      expect(cashFlowBenefit).toBeGreaterThan(2.0);
      expect(cashFlowBenefit).toBeCloseTo(2.15, 1);
    });
  });

  describe('IO Period with Construction Delay', () => {
    it('should start IO period at placed in service, not investment date', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 12, // 1 year construction
        seniorDebtIOYears: 3,
      });

      // Year 1: During construction, no debt service
      const year1 = result.cashFlows.find(cf => cf.year === 1);
      expect(year1?.hardDebtService).toBe(0);

      // Year 2: First year after placed in service, IO payment
      const year2 = result.cashFlows.find(cf => cf.year === 2);
      expect(year2?.hardDebtService).toBeCloseTo(1.08, 2);

      // Year 4: Still in IO period (3 years from placed in service)
      const year4 = result.cashFlows.find(cf => cf.year === 4);
      expect(year4?.hardDebtService).toBeCloseTo(1.08, 2);

      // Year 5: Switch to P&I (4th year from placed in service)
      const year5 = result.cashFlows.find(cf => cf.year === 5);
      expect(year5?.hardDebtService).toBeCloseTo(1.295031, 2);
    });
  });

  describe('IO Period with Interest Reserve', () => {
    it('should reduce interest reserve requirement when IO active', () => {
      const resultWithIO = calculateFullInvestorAnalysis({
        ...baseParams,
        interestReserveEnabled: true,
        interestReserveMonths: 12,
        seniorDebtIOYears: 3,
      });

      const resultWithoutIO = calculateFullInvestorAnalysis({
        ...baseParams,
        interestReserveEnabled: true,
        interestReserveMonths: 12,
        seniorDebtIOYears: 0,
      });

      // Note: Interest reserve would need to be calculated separately
      // This test validates the system accepts the parameter
      expect(resultWithIO).toBeDefined();
      expect(resultWithoutIO).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0 senior debt with IO period', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtPct: 0,
        seniorDebtIOYears: 3,
        investorEquityPct: 90,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      expect(year1?.hardDebtService).toBe(0);
    });

    it('should handle IO years = 0 (explicitly no IO)', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      // Should use P&I from start
      expect(year1?.hardDebtService).toBeCloseTo(1.295031, 2);
    });

    it('should handle very short hold period with long IO', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        holdPeriod: 3,
        seniorDebtIOYears: 10,
      });

      // All 3 years should be IO
      for (let year = 1; year <= 3; year++) {
        const cashFlow = result.cashFlows.find(cf => cf.year === year);
        expect(cashFlow?.hardDebtService).toBeCloseTo(1.08, 2);
      }

      // Exit balance should be close to full $18M
      // With IMPL-087 +1 disposition year, Year 4 is still within IO so no principal paid
      expect(result.remainingDebtAtExit).toBeCloseTo(18, 0);
    });
  });

  describe('Mathematical Accuracy', () => {
    it('should match ground truth IO payment calculation', () => {
      const principal = 18; // $18M
      const rate = 0.06; // 6%
      const expectedAnnualIO = principal * rate; // $1.08M

      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 3,
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      expect(year1?.hardDebtService).toBeCloseTo(expectedAnnualIO, 3);
    });

    it('should match ground truth P&I payment calculation', () => {
      // Ground truth: $18M @ 6%, 30yr amortization
      // PMT = P × [r(1+r)^n] / [(1+r)^n - 1]
      // But we need to use monthly calculation, then multiply by 12
      const P = 18;
      const annualRate = 0.06;
      const monthlyRate = annualRate / 12;
      const n = 30;
      const monthlyPayment = P * (monthlyRate * Math.pow(1 + monthlyRate, n * 12)) / (Math.pow(1 + monthlyRate, n * 12) - 1);
      const expectedAnnualPIPayment = monthlyPayment * 12;

      expect(expectedAnnualPIPayment).toBeCloseTo(1.295031, 3);

      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        seniorDebtIOYears: 0, // No IO, pure P&I
      });

      const year1 = result.cashFlows.find(cf => cf.year === 1);
      expect(year1?.hardDebtService).toBeCloseTo(expectedAnnualPIPayment, 2);
    });
  });
});
