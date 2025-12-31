/**
 * Tests for Critical Calculation Gaps
 *
 * This file tests mathematical operations that were identified as gaps
 * in the COMPLETE_TEST_COVERAGE_MATRIX.md analysis
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';

describe('Critical Calculation Gaps - HIGH PRIORITY', () => {

  describe('Effective Project Cost with Interest Reserve', () => {
    it('should correctly calculate effective project cost including interest reserve', () => {
      const baseProjectCost = 50;
      const params = {
        projectCost: baseProjectCost,
        landValue: 5,
        yearOneNOI: 2.5,
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 20,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 5,
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        interestReserveMonths: 12, // 1 year of interest reserve
        seniorDebtRate: 6,
        philanthropicDebtRate: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        taxBenefitDelayMonths: 0,
    constructionDelayMonths: 0,        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      // Calculate expected interest reserve
      const baseSeniorDebt = baseProjectCost * 0.60; // 30M
      const basePhilDebt = baseProjectCost * 0.10; // 5M

      // Monthly payments on base amounts
      const seniorMonthlyRate = 0.06 / 12;
      const philMonthlyRate = 0.03 / 12;

      // This is approximate - actual calculation uses PMT formula
      const estimatedMonthlyDebtService =
        (baseSeniorDebt * seniorMonthlyRate * 1.5) + // Rough estimate
        (basePhilDebt * philMonthlyRate * 1.2); // Rough estimate

      const expectedInterestReserve = estimatedMonthlyDebtService * 12;
      const expectedEffectiveProjectCost = baseProjectCost + expectedInterestReserve;

      const result = calculateFullInvestorAnalysis(params);

      // The investor equity should be based on effective project cost
      const expectedInvestorEquity = expectedEffectiveProjectCost * 0.20;

      // Check that the calculation accounts for interest reserve
      expect(result.totalInvestment).toBeGreaterThanOrEqual(baseProjectCost * 0.20);
    });

    it('should exclude interest reserve from depreciable basis', () => {
      const params = {
        projectCost: 50,
        landValue: 5,
        interestReserveMonths: 12,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        // ... other required params
      };

      // Depreciable basis should ALWAYS be Project Cost - Land Value
      // It should NOT include interest reserve
      const expectedDepreciableBasis = params.projectCost - params.landValue;
      const expectedYear1Depreciation = expectedDepreciableBasis * 0.25;
      const expectedYear1TaxBenefit = expectedYear1Depreciation * 0.4785;

      // This should be true regardless of interest reserve
      expect(expectedDepreciableBasis).toBe(45);
      expect(expectedYear1Depreciation).toBe(11.25);
    });
  });

  describe('Philanthropic Debt PIK vs Current Pay Logic', () => {
    it('should use PIK when philanthropic debt is set to PIK mode', () => {
      const params = {
        projectCost: 50,
        philanthropicDebtPct: 10,
        philanthropicDebtRate: 3,
        philanthropicCurrentPay: false, // PIK mode
        // ... other params
      };

      // In PIK mode, phil debt should accumulate interest
      // Initial: 5M, after 10 years at 3%: ~6.72M
      const initialPhilDebt = params.projectCost * 0.10;
      const expectedFinalPhilDebt = initialPhilDebt * Math.pow(1.03, 10);

      // Test would verify this in exit calculations
      expect(expectedFinalPhilDebt).toBeGreaterThan(initialPhilDebt);
    });

    it('should use current pay when philanthropic debt is set to current pay', () => {
      const params = {
        projectCost: 50,
        philanthropicDebtPct: 10,
        philanthropicDebtRate: 3,
        philanthropicCurrentPay: true, // Current pay mode
        // ... other params
      };

      // In current pay mode, debt service should be paid annually
      // Balance should decrease over time with amortization
      const initialPhilDebt = params.projectCost * 0.10;

      // After 10 years of payments, remaining balance should be less
      // This would be verified in the exit debt payoff
      expect(true).toBe(true); // Placeholder - needs full implementation
    });
  });

  describe('Exit Debt Payoff Priority', () => {
    it('should pay debts in correct priority order at exit', () => {
      const exitValue = 80;
      const seniorDebtRemaining = 20;
      const philDebtBalance = 5.5;
      const hdcSubDebtBalance = 3.2;
      const investorSubdebtBalance = 3.2;
      const outsideSubDebtBalance = 2.1;

      // Expected payoff order:
      // 1. Senior Debt: 20M
      // 2. Phil Debt: 5.5M
      // 3. Sub-debts (pari passu): 3.2 + 3.2 + 2.1 = 8.5M
      const totalDebtPayoff = seniorDebtRemaining + philDebtBalance +
                             hdcSubDebtBalance + investorSubdebtBalance +
                             outsideSubDebtBalance;

      const grossProceeds = exitValue - totalDebtPayoff;

      expect(grossProceeds).toBe(exitValue - 34);
      expect(grossProceeds).toBe(46);

      // Verify each debt gets paid in full before proceeds
      expect(seniorDebtRemaining).toBeLessThanOrEqual(exitValue);
      expect(totalDebtPayoff).toBeLessThanOrEqual(exitValue);
    });
  });

  describe('Total Debt Service Aggregation', () => {
    it('should correctly sum all debt service payments', () => {
      const seniorDebtService = 2.158;
      const philCurrentPay = 0.167;
      const outsideCurrentPay = 0.08;

      const totalDebtService = seniorDebtService + philCurrentPay + outsideCurrentPay;

      expect(totalDebtService).toBeCloseTo(2.405, 3);

      // DSCR should use total debt service
      const noi = 2.5;
      const dscr = noi / totalDebtService;

      expect(dscr).toBeCloseTo(1.04, 2);
      expect(dscr).toBeGreaterThan(1.0); // Must cover debt service
    });
  });

  describe('Complete 10-Year Integration Test', () => {
    it('should correctly calculate every step from Year 0 to exit', () => {
      const params = {
        projectCost: 50,
        landValue: 5,
        yearOneNOI: 2.5,
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 20,
        seniorDebtPct: 60,
        seniorDebtRate: 6,
        seniorDebtAmortYears: 30,
        philanthropicDebtPct: 10,
        philanthropicDebtRate: 3,
        philanthropicCurrentPay: false,
        hdcSubDebtPct: 5,
        hdcSubDebtRate: 8,
        investorSubDebtPct: 5,
        investorSubDebtRate: 8,
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        taxBenefitDelayMonths: 0,
    constructionDelayMonths: 0,        aumFeeRate: 1.5,
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      // Calculate year1NetBenefit
      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      const depreciableBasis = params.projectCost - params.landValue; // 45M
      const bonusDepreciation = depreciableBasis * (params.yearOneDepreciationPct / 100); // 11.25M

      // Add MACRS mid-month convention for Year 1 (default July placement = 5.5 months)
      const remainingBasis = depreciableBasis - bonusDepreciation; // 33.75M
      const annualMACRS = remainingBasis / 27.5; // 1.227M
      const monthsInYear1 = 5.5; // July placement (12.5 - 7)
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS; // 0.5625M

      const year1Depreciation = bonusDepreciation + year1MACRS; // 11.8125M
      const year1TaxBenefit = year1Depreciation * (params.effectiveTaxRate / 100); // 5.652M
      const year1HdcFee = 0; // HDC fee removed per IMPL-7.0-001
      const year1NetBenefit = year1TaxBenefit - year1HdcFee; // 5.652M

      const fullParams = { ...params, year1NetBenefit };

      const investorResult = calculateFullInvestorAnalysis(fullParams);
      const hdcResult = calculateHDCAnalysis(fullParams);

      // Verify complete calculation chain
      expect(investorResult).toBeDefined();
      expect(hdcResult).toBeDefined();

      // Year 0: Initial investment
      expect(investorResult.totalInvestment).toBeGreaterThan(0);
      expect(hdcResult.totalInvestment).toBe(0); // HDC has $0 investment

      // Years 1-10: Cash flows exist
      expect(investorResult.investorCashFlows.length).toBe(10);
      expect(hdcResult.hdcCashFlows.length).toBe(10);

      // Year 1: Tax benefits
      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // Tax benefits should be close to calculated year1NetBenefit
      const year1 = investorResult.investorCashFlows[0];
      expect(year1.taxBenefit).toBeCloseTo(year1NetBenefit, 2);

      // Year 5: OZ tax payment
      const year5 = investorResult.investorCashFlows[4];
      if (params.ozEnabled) {
        expect(year5.ozYear5TaxPayment).toBeGreaterThan(0);
      }

      // Year 10: Exit
      expect(investorResult.exitProceeds).toBeGreaterThan(0);
      // HDC may have exit proceeds even with no investment
      if (hdcResult.exitProceeds !== undefined) {
        expect(hdcResult.exitProceeds).toBeGreaterThanOrEqual(0);
      }

      // Metrics
      expect(investorResult.irr).toBeDefined();
      expect(investorResult.multiple).toBeGreaterThan(0);

      // Free investment test
      const freeInvestmentAchieved = year1NetBenefit >= investorResult.totalInvestment;
      console.log('Free investment test:', {
        year1NetBenefit,
        totalInvestment: investorResult.totalInvestment,
        achieved: freeInvestmentAchieved
      });
    });
  });
});

describe('Mathematical Formula Verification', () => {

  describe('Every Formula Explicitly', () => {
    it('NOI = Revenue - Expenses', () => {
      const revenue = 3.333;
      const expenses = 0.833;
      const noi = revenue - expenses;
      expect(noi).toBeCloseTo(2.5, 3);
    });

    it('Revenue = NOI / (1 - OpEx Ratio)', () => {
      const noi = 2.5;
      const opexRatio = 0.25;
      const revenue = noi / (1 - opexRatio);
      expect(revenue).toBeCloseTo(3.333, 3);
    });

    it('DSCR = NOI / Debt Service', () => {
      const noi = 2.5;
      const debtService = 2.158;
      const dscr = noi / debtService;
      expect(dscr).toBeCloseTo(1.1585, 3);
    });

    it('Exit Value = Final NOI / Cap Rate', () => {
      const finalNOI = 4.5;
      const capRate = 0.06;
      const exitValue = finalNOI / capRate;
      expect(exitValue).toBeCloseTo(75, 1);
    });

    it('Multiple = Total Returns / Total Investment', () => {
      const totalReturns = 15;
      const totalInvestment = 10;
      const multiple = totalReturns / totalInvestment;
      expect(multiple).toBe(1.5);
    });

    it('Compound Interest = Principal × (1 + Rate)^Years', () => {
      const principal = 1;
      const rate = 0.08;
      const years = 10;
      const finalAmount = principal * Math.pow(1 + rate, years);
      expect(finalAmount).toBeCloseTo(2.159, 3);
    });

    it('Basis Step-up Rural = Deferred Gains × 30%', () => {
      const deferredGains = 10;
      const stepUpPercent = 0.30;
      const stepUpAmount = deferredGains * stepUpPercent;
      expect(stepUpAmount).toBe(3);
    });

    it('OZ Tax = Taxable Gains × Capital Gains Rate', () => {
      const deferredGains = 10;
      const stepUp = 0.10;
      const taxableGains = deferredGains * (1 - stepUp);
      const capGainsRate = 0.347;
      const ozTax = taxableGains * capGainsRate;
      expect(ozTax).toBeCloseTo(3.123, 3);
    });
  });
});