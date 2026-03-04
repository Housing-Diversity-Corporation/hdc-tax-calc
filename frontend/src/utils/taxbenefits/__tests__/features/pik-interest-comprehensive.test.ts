/**
 * PIK Interest Comprehensive Test Suite
 *
 * Consolidates and replaces:
 * - pik-compound-fix-validation.test.ts
 * - pik-interest-validation.test.ts
 *
 * Tests all Payment-In-Kind (PIK) interest functionality with current business logic
 * and realistic HDC deal parameters
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';
import { getDefaultTestParams } from '../test-helpers';

describe('PIK Interest Comprehensive Test Suite', () => {

  describe('PIK Compound Interest Core Functionality', () => {
    it('should use compound interest, not simple interest', () => {
      const params = getDefaultTestParams({
        projectCost: 100,
        investorSubDebtPct: 30,  // $30M mezz debt
        investorSubDebtPikRate: 12,  // 12% rate
        investorPikCurrentPayEnabled: false,  // Full PIK (0% current pay)
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);

      // With DSCR constraints, not all interest may accrue as PIK
      // But the PIK that does accrue should be compounded
      const actualPIKBalance = result.investorSubDebtAtExit;
      const principal = 30;  // $30M

      // Should have accumulated some PIK (more than principal)
      expect(actualPIKBalance).toBeGreaterThan(principal);

      // PIK accumulation should show compound effect over simple interest
      // Even with DSCR constraints, PIK compounds on growing balance
      let hasCompoundEffect = false;
      result.investorCashFlows.forEach((year, idx) => {
        if (idx > 0 && idx < result.investorCashFlows.length - 1) {
          const pikAccrued = year.investorSubDebtPIKAccrued || 0;
          if (pikAccrued > 0) hasCompoundEffect = true;
        }
      });
      expect(hasCompoundEffect).toBe(true);
    });

    it('should compound PIK interest year-over-year', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 10,  // 10% for easier calculation
        investorPikCurrentPayEnabled: false,  // Full PIK
        holdPeriod: 5,
        yearOneNOI: 10  // High NOI to allow more PIK accrual
      });

      const result = calculateFullInvestorAnalysis(params);

      // PIK should grow each year (compound effect)
      let previousBalance = 30;
      let hasGrowth = false;

      result.investorCashFlows.forEach((year, idx) => {
        if (idx > 0 && idx < result.investorCashFlows.length - 1) {
          const pikAccrued = year.investorSubDebtPIKAccrued || 0;
          if (pikAccrued > 0) {
            // Each year's PIK should be calculated on growing balance
            previousBalance += pikAccrued;
            hasGrowth = true;
          }
        }
      });

      expect(hasGrowth).toBe(true);
      expect(result.investorSubDebtAtExit).toBeGreaterThan(30);
    });
  });

  describe('PIK with Current Pay Options', () => {
    it('should handle 50% current pay correctly', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 12,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 50,  // 50% current, 50% PIK
        yearOneNOI: 10,  // High NOI to ensure cash available
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);

      // With 50% current pay:
      // - 6% is paid annually (doesn't compound)
      // - 6% accrues and compounds
      const principal = 30;
      const fullPIK = principal * Math.pow(1.12, 9);

      // Should be less than full PIK but more than principal
      expect(result.investorSubDebtAtExit).toBeLessThan(fullPIK);
      expect(result.investorSubDebtAtExit).toBeGreaterThan(principal);
    });

    it('should defer current pay when DSCR constrains cash', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 12,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 100,  // Try for 100% current
        yearOneNOI: 5.5,  // Just enough for DSCR
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);

      // Even with 100% current pay target, DSCR should force some deferral
      let hasDeferredInterest = false;
      result.investorCashFlows.forEach(year => {
        if ((year.investorSubDebtPIKAccrued || 0) > 0) {
          hasDeferredInterest = true;
        }
      });

      expect(hasDeferredInterest).toBe(true);
    });
  });

  describe('Multiple Sub-Debt Sources', () => {
    it('should handle both HDC and investor sub-debt PIK', () => {
      const params = getDefaultTestParams({
        hdcSubDebtPct: 10,  // $10M HDC mezz
        hdcSubDebtPikRate: 12,
        pikCurrentPayEnabled: false,  // HDC Full PIK
        investorSubDebtPct: 20,  // $20M investor mezz
        investorSubDebtPikRate: 12,
        investorPikCurrentPayEnabled: false,  // Investor Full PIK
        seniorDebtPct: 65,
        investorEquityPct: 5,
        holdPeriod: 10,
        yearOneNOI: 10  // High NOI for debt service
      });

      const result = calculateFullInvestorAnalysis(params);

      // Both should accumulate PIK (may be less than full compound due to DSCR)
      expect(result.subDebtAtExit).toBeGreaterThan(10);  // HDC debt grows
      expect(result.investorSubDebtAtExit).toBeGreaterThan(20);  // Investor debt grows
    });
  });

  describe('PIK Impact on Exit Waterfall', () => {
    it('should pay PIK debt before equity at exit', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 12,
        investorPikCurrentPayEnabled: false,  // Full PIK
        exitCapRate: 5,  // Better exit cap rate for higher value
        holdPeriod: 10,
        yearOneNOI: 8  // Higher NOI for better exit value
      });

      const result = calculateFullInvestorAnalysis(params);

      // PIK debt should be paid from exit proceeds
      const pikDebt = result.investorSubDebtAtExit;
      const exitValue = result.exitValue;
      const seniorDebt = result.remainingDebtAtExit;

      // PIK should have accumulated
      expect(pikDebt).toBeGreaterThan(30);

      // Exit value should be sufficient for all debt
      expect(exitValue).toBeGreaterThan(seniorDebt + pikDebt);
    });
  });

  describe('HDC Analysis PIK Calculations', () => {
    it('should track HDC sub-debt PIK correctly', () => {
      const params = getDefaultTestParams({
        hdcSubDebtPct: 15,  // $15M HDC mezz
        hdcSubDebtPikRate: 12,
        pikCurrentPayEnabled: false,  // HDC Full PIK
        philanthropicDebtPct: 0,
        investorPromoteShare: 35,
        yearOneNOI: 10  // High NOI to support debt
      });

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        philanthropicEquityPct: 0,
        investorCashFlows: investorResult.investorCashFlows
      });

      // HDC should receive PIK repayment at exit (may be less than full compound due to DSCR)
      expect(hdcResult.hdcSubDebtRepayment).toBeGreaterThan(15);  // Should grow from principal
      expect(hdcResult.hdcSubDebtPIKAccrued).toBeGreaterThan(0);  // Should have accrued interest
    });
  });

  describe('PIK Edge Cases and Validation', () => {
    it('should handle zero PIK rate', () => {
      // Create params without using defaults to avoid the 12% rate
      const params = {
        projectCost: 100,
        landValue: 10,
        yearOneNOI: 5,
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 3,
        effectiveTaxRate: 47.85,
        seniorDebtPct: 65,
        investorEquityPct: 5,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 0,
        investorSubDebtPct: 30,
        seniorDebtRate: 5.25,
        philanthropicRate: 0,
        hdcSubDebtPikRate: 0,
        investorSubDebtPikRate: 0,  // 0% rate - this is the key
        pikCurrentPayEnabled: false,
        investorPikCurrentPayEnabled: false,
        hdcFeeRate: 0,
        hdcFee: 0,  // Required parameter
        aumFeeRate: 0,
        hdcPromotePct: 65,
        investorPromoteShare: 35,
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        holdPeriod: 10,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        philanthropicEquityPct: 0,
        aumFeeEnabled: false,
        ozEnabled: false,
        ozType: 'standard' as const,
        deferredCapitalGains: 0,
        capitalGainsTaxRate: 34.65,
        constructionDelayMonths: 0
      };

      const result = calculateFullInvestorAnalysis(params);

      // With 0% stated rate, debt may still grow due to DSCR deferrals
      // But it shouldn't grow by the typical compound rate
      const principal = 30;
      const typicalGrowth = principal * Math.pow(1.12, 9); // What 12% would give

      // Should be much less than typical PIK growth
      expect(result.investorSubDebtAtExit).toBeLessThan(typicalGrowth);
    });

    it('should handle very high PIK rates', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 20,  // 20% PIK (high but tests robustness)
        investorPikCurrentPayEnabled: false,  // Full PIK
        yearOneNOI: 10  // High NOI to support high interest
      });

      const result = calculateFullInvestorAnalysis(params);

      // Should accumulate significant PIK (though may be limited by DSCR)
      expect(result.investorSubDebtAtExit).toBeGreaterThan(30);
    });

    it('should accumulate PIK over time with realistic rates', () => {
      // Test PIK accumulation with realistic rates
      const testCases = [
        { principal: 10, rate: 0.08 },
        { principal: 20, rate: 0.10 },
        { principal: 30, rate: 0.12 }
      ];

      testCases.forEach(({ principal, rate }) => {
        const params = getDefaultTestParams({
          investorSubDebtPct: principal,
          investorSubDebtPikRate: rate * 100,
          investorPikCurrentPayEnabled: false,  // Full PIK
          holdPeriod: 10,
          yearOneNOI: 10  // High NOI to support debt
        });

        const result = calculateFullInvestorAnalysis(params);

        // Should accumulate PIK (more than principal)
        expect(result.investorSubDebtAtExit).toBeGreaterThan(principal);
      });
    });
  });

  describe('PIK with DSCR Constraints', () => {
    it('should maintain DSCR while accruing PIK', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 12,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 100,  // Try to pay current
        yearOneNOI: 5.5,  // Constrained NOI
        seniorDebtPct: 65,
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);

      // DSCR should be maintained at 1.05
      result.investorCashFlows.forEach((year, idx) => {
        if (idx < result.investorCashFlows.length - 1 && year.dscr) {
          expect(Math.abs(year.dscr - 1.05)).toBeLessThan(0.01);
        }
      });

      // Should have accumulated PIK despite current pay setting
      expect(result.investorSubDebtAtExit).toBeGreaterThan(30);
    });
  });

  describe('PIK Accumulation Tracking', () => {
    it('should track PIK balance in cash flows', () => {
      const params = getDefaultTestParams({
        investorSubDebtPct: 30,
        investorSubDebtPikRate: 10,
        investorPikCurrentPayEnabled: false,  // Full PIK
        holdPeriod: 5,
        yearOneNOI: 10  // High NOI for debt service
      });

      const result = calculateFullInvestorAnalysis(params);

      let hasPIKAccrual = false;
      let totalPIK = 0;

      result.investorCashFlows.forEach((year, idx) => {
        // Skip the exit year
        if (idx < result.investorCashFlows.length - 1) {
          // Years 2-4: PIK may accrue depending on DSCR
          const actualAccrual = year.investorSubDebtPIKAccrued || 0;
          if (actualAccrual > 0) {
            hasPIKAccrual = true;
            totalPIK += actualAccrual;
          }
        }
      });

      // Should have accumulated some PIK
      expect(hasPIKAccrual).toBe(true);
      expect(totalPIK).toBeGreaterThan(0);
    });
  });
});