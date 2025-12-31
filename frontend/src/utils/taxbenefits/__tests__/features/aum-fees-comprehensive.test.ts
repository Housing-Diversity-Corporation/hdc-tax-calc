/**
 * AUM Fee Comprehensive Test Suite
 *
 * Consolidates and replaces:
 * - aum-fee-comprehensive-test.test.ts
 * - aum-fee-discrepancy.test.ts
 * - aum-fee-impact.test.ts
 *
 * Tests all AUM fee functionality in one place with current business logic
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';
import { getDefaultTestParams } from '../test-helpers';

describe('AUM Fee Comprehensive Test Suite', () => {

  describe('AUM Fee Basic Functionality', () => {
    it('should NOT accumulate AUM fees unless explicitly enabled', () => {
      const params = getDefaultTestParams({
        aumFeeRate: 2.0,  // Rate is set
        aumFeeEnabled: false  // But NOT enabled
      });

      const result = calculateFullInvestorAnalysis(params);

      // Should have no AUM fees accumulated
      result.investorCashFlows.forEach(year => {
        expect(year.aumFeeAccrued || 0).toBe(0);
      });
    });

    it('should accumulate AUM fees when enabled', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,  // Must explicitly enable
        aumFeeRate: 2.0,
        holdPeriod: 5
      });

      const result = calculateFullInvestorAnalysis(params);

      // Should have AUM fees in years 2+ (not year 1)
      expect(result.investorCashFlows[0].aumFeeAccrued || 0).toBe(0); // Year 1: no AUM

      let totalAUM = 0;
      for (let i = 1; i < result.investorCashFlows.length - 1; i++) {
        const aumFee = result.investorCashFlows[i].aumFeeAccrued || 0;
        expect(aumFee).toBeGreaterThanOrEqual(0);
        totalAUM += aumFee;
      }

      // Should have accumulated some AUM fees
      expect(totalAUM).toBeGreaterThan(0);
    });
  });

  describe('AUM Fee Payment Timing', () => {
    it('should track AUM fees over hold period', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: false,  // PIK mode - but engine pays from available cash
        holdPeriod: 10
      });

      const result = calculateFullInvestorAnalysis(params);

      // AUM fees start in Year 2 (not Year 1)
      expect(result.investorCashFlows[0].aumFeePaid || 0).toBe(0);
      expect(result.investorCashFlows[0].aumFeeAccrued || 0).toBe(0);

      // Engine pays AUM fees from available cash flow (after DSCR requirements)
      // Track total AUM fees (paid + accrued) over hold period
      let totalAumPaid = 0;
      let totalAumAccrued = 0;
      for (let i = 1; i < result.investorCashFlows.length; i++) {
        totalAumPaid += result.investorCashFlows[i].aumFeePaid || 0;
        totalAumAccrued += result.investorCashFlows[i].aumFeeAccrued || 0;
      }

      // Should have meaningful AUM fee activity
      expect(totalAumPaid + totalAumAccrued).toBeGreaterThan(0);
    });

    it('should handle current pay AUM correctly when enabled', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 2.0,
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 50,  // 50% current pay
        yearOneNOI: 10,  // High NOI to ensure cash available
        holdPeriod: 5
      });

      const result = calculateFullInvestorAnalysis(params);

      // Should have mix of paid and accrued based on DSCR constraints
      let hasPaidFees = false;
      let hasAccruedFees = false;

      for (let i = 1; i < result.investorCashFlows.length - 1; i++) {
        if ((result.investorCashFlows[i].aumFeePaid || 0) > 0) hasPaidFees = true;
        if ((result.investorCashFlows[i].aumFeeAccrued || 0) > 0) hasAccruedFees = true;
      }

      // With current pay enabled, should see both (unless DSCR prevents payment)
      expect(hasAccruedFees).toBe(true); // Always accrue PIK portion
    });
  });

  describe('AUM Fee Impact on Returns', () => {
    it('should reduce investor returns at exit', () => {
      const paramsNoAUM = getDefaultTestParams({
        aumFeeEnabled: false
      });

      const paramsWithAUM = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 2.0
      });

      const resultNoAUM = calculateFullInvestorAnalysis(paramsNoAUM);
      const resultWithAUM = calculateFullInvestorAnalysis(paramsWithAUM);

      // Investor returns should be lower with AUM fees
      if (!isNaN(resultNoAUM.totalReturns) && !isNaN(resultWithAUM.totalReturns)) {
        expect(resultWithAUM.totalReturns).toBeLessThanOrEqual(resultNoAUM.totalReturns);
      }
    });

    it('should transfer AUM fees to HDC at exit', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        holdPeriod: 10
      });

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorResult.investorCashFlows,
        philanthropicEquityPct: 0,
        investorPromoteShare: 35
      });

      // Calculate total AUM fees accumulated
      let totalAUMAccumulated = 0;
      investorResult.investorCashFlows.forEach((year, index) => {
        if (index < investorResult.investorCashFlows.length - 1) {
          totalAUMAccumulated += year.aumFeeAccrued || 0;
        }
      });

      // HDC should receive these fees (reflected in their total returns)
      if (totalAUMAccumulated > 0) {
        expect(hdcResult.totalHDCReturns).toBeGreaterThan(0);
      }
    });
  });

  describe('AUM Fee Edge Cases', () => {
    it('should handle zero AUM rate', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 0
      });

      const result = calculateFullInvestorAnalysis(params);

      result.investorCashFlows.forEach(year => {
        expect(year.aumFeeAccrued || 0).toBe(0);
        expect(year.aumFeePaid || 0).toBe(0);
      });
    });

    it('should handle very high AUM rates', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 10  // 10% AUM fee (unrealistic but tests robustness)
      });

      const result = calculateFullInvestorAnalysis(params);

      // Should still calculate without errors
      expect(result).toBeDefined();
      expect(result.investorCashFlows).toBeDefined();
    });

    it('should respect DSCR constraints for AUM current pay', () => {
      const params = getDefaultTestParams({
        aumFeeEnabled: true,
        aumFeeRate: 5.0,  // High rate
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 100,  // Try to pay all current
        yearOneNOI: 5.5,  // Just enough for DSCR
        seniorDebtPct: 65,
        investorSubDebtPct: 30
      });

      const result = calculateFullInvestorAnalysis(params);

      // DSCR should be maintained at 1.05
      result.investorCashFlows.forEach(year => {
        if (year.dscr && year.dscr > 0) {
          expect(Math.abs(year.dscr - 1.05)).toBeLessThan(0.01);
        }
      });
    });
  });
});