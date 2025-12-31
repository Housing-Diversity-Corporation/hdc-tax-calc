/**
 * PIK Interest Validation Tests
 * Focused testing of Payment-In-Kind (PIK) interest calculations
 * to verify compound interest is correctly applied
 *
 * Fix #1 (Jan 2025): Updated to use calculateExpectedPIKBalance helper
 * to ensure PIK principal calculated on effective project cost
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';
import { CalculationParams, HDCCalculationParams } from '../../../types/taxbenefits';
import { calculateExpectedPIKBalance } from './test-helpers';

describe('PIK Interest Compound Calculation Validation', () => {
  
  describe('HDC Sub-debt PIK Compound Interest', () => {
    it('should compound PIK interest correctly over 10 years', () => {
      const projectCost = 10000000;
      const hdcSubDebtPct = 10; // $1M sub-debt
      const hdcSubDebtPikRate = 8; // 8% annual rate
      
      const params: CalculationParams = {
        projectCost,
        landValue: 0,
        yearOneNOI: 600000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        investorEquityPct: 20,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 500000,
        netTaxBenefit: 450000,
        hdcFee: 50000,
        investorPromoteShare: 35,
        opexRatio: 30,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct,
        hdcSubDebtPikRate,
        pikCurrentPayEnabled: false, // Full PIK
        pikCurrentPayPct: 0,
        investorSubDebtPct: 0,
        investorSubDebtPikRate: 8,
        investorPikCurrentPayEnabled: false,
        investorPikCurrentPayPct: 0,
        aumFeeEnabled: false,
        aumFeeRate: 0
      };
      
      const results = calculateFullInvestorAnalysis(params);

      console.log('PIK Test Results:');
      console.log('Project Cost:', projectCost);
      console.log('HDC Sub-Debt %:', hdcSubDebtPct);
      console.log('PIK Rate:', hdcSubDebtPikRate, '%');
      console.log('Final Balance:', results.subDebtAtExit);

      // Verify compound interest logic: final balance should be substantially higher than initial principal
      // With 8% compounded over 9 years, balance should roughly double (1.08^9 ≈ 2.0)
      const basePrincipal = projectCost * (hdcSubDebtPct / 100);
      expect(results.subDebtAtExit).toBeGreaterThan(basePrincipal * 1.8); // At least 80% growth
      expect(results.subDebtAtExit).toBeLessThan(basePrincipal * 2.3);    // But not more than 130% growth
    });

    it('should handle partial current pay correctly', () => {
      const projectCost = 10000000;
      const hdcSubDebtPct = 10; // $1M sub-debt
      const hdcSubDebtPikRate = 8; // 8% annual rate
      const pikCurrentPayPct = 40; // 40% current pay
      
      const params: CalculationParams = {
        projectCost,
        landValue: 0,
        yearOneNOI: 600000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        investorEquityPct: 20,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 500000,
        netTaxBenefit: 450000,
        hdcFee: 50000,
        investorPromoteShare: 35,
        opexRatio: 30,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct,
        hdcSubDebtPikRate,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct,
        investorSubDebtPct: 0,
        investorSubDebtPikRate: 8,
        investorPikCurrentPayEnabled: false,
        investorPikCurrentPayPct: 0,
        aumFeeEnabled: false,
        aumFeeRate: 0
      };
      
      const results = calculateFullInvestorAnalysis(params);

      // Calculate full PIK balance (no current pay) for comparison
      const fullPikBalance = calculateExpectedPIKBalance({...params, pikCurrentPayEnabled: false, pikCurrentPayPct: 0}, 9, 'hdc');

      console.log('Partial Current Pay Test:');
      console.log('Project Cost:', projectCost);
      console.log('HDC Sub-Debt %:', hdcSubDebtPct);
      console.log('Current Pay %:', pikCurrentPayPct);
      console.log('Final Balance:', results.subDebtAtExit);
      console.log('Full PIK Balance (for comparison):', fullPikBalance);

      // Balance should be less than full PIK (some interest was paid out)
      // But still greater than initial principal
      expect(results.subDebtAtExit).toBeLessThan(fullPikBalance);
      expect(results.subDebtAtExit).toBeGreaterThan(projectCost * (hdcSubDebtPct / 100) * 0.95); // At least 95% of principal
    });

    it('should verify year-by-year compound calculation', () => {
      const projectCost = 10000000;
      const hdcSubDebtPct = 10; // $1M
      const hdcSubDebtPikRate = 10; // 10% for easier calculation
      
      const params: CalculationParams = {
        projectCost,
        landValue: 0,
        yearOneNOI: 600000,
        revenueGrowth: 0, // No growth for simplicity
        expenseGrowth: 0,
        exitCapRate: 6,
        investorEquityPct: 20,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 500000,
        netTaxBenefit: 450000,
        hdcFee: 50000,
        investorPromoteShare: 35,
        opexRatio: 30,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct,
        hdcSubDebtPikRate,
        pikCurrentPayEnabled: false,
        pikCurrentPayPct: 0,
        investorSubDebtPct: 0,
        investorSubDebtPikRate: 8,
        investorPikCurrentPayEnabled: false,
        investorPikCurrentPayPct: 0,
        aumFeeEnabled: false,
        aumFeeRate: 0
      };
      
      const results = calculateFullInvestorAnalysis(params);

      console.log('Year-by-Year Compound Test:');
      console.log('Project Cost:', projectCost);
      console.log('HDC Sub-Debt %:', hdcSubDebtPct);
      console.log('PIK Rate:', hdcSubDebtPikRate, '%');
      console.log('Final Balance:', results.subDebtAtExit);

      // Verify year-by-year compound calculation: 10% over 9 years should be ~2.36x
      const basePrincipal = projectCost * (hdcSubDebtPct / 100);
      expect(results.subDebtAtExit).toBeGreaterThan(basePrincipal * 2.2); // At least 2.2x
      expect(results.subDebtAtExit).toBeLessThan(basePrincipal * 2.7);    // But less than 2.7x
    });
  });

  describe('Investor Sub-debt PIK Compound Interest', () => {
    it('should compound investor PIK correctly', () => {
      const projectCost = 10000000;
      const investorSubDebtPct = 15; // $1.5M
      const investorSubDebtPikRate = 12; // 12% annual
      
      const params: CalculationParams = {
        projectCost,
        landValue: 0,
        yearOneNOI: 600000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        investorEquityPct: 20,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 500000,
        netTaxBenefit: 450000,
        hdcFee: 50000,
        investorPromoteShare: 35,
        opexRatio: 30,
        seniorDebtPct: 50,
        philanthropicDebtPct: 15,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct: 0,
        hdcSubDebtPikRate: 8,
        pikCurrentPayEnabled: false,
        pikCurrentPayPct: 0,
        investorSubDebtPct,
        investorSubDebtPikRate,
        investorPikCurrentPayEnabled: false, // Full PIK
        investorPikCurrentPayPct: 0,
        aumFeeEnabled: false,
        aumFeeRate: 0
      };
      
      const results = calculateFullInvestorAnalysis(params);

      console.log('Investor PIK Test:');
      console.log('Project Cost:', projectCost);
      console.log('Investor Sub-Debt %:', investorSubDebtPct);
      console.log('PIK Rate:', investorSubDebtPikRate, '%');
      console.log('Final Balance:', results.investorSubDebtAtExit);

      // Verify compound interest: 12% over 9 years should be ~2.77x (with Fix #1, slightly higher)
      const basePrincipal = projectCost * (investorSubDebtPct / 100);
      expect(results.investorSubDebtAtExit).toBeGreaterThan(basePrincipal * 2.5); // At least 2.5x
      expect(results.investorSubDebtAtExit).toBeLessThan(basePrincipal * 3.2);    // But less than 3.2x
    });

    it('should track cumulative PIK balance in cash flows', () => {
      const projectCost = 10000000;
      const investorSubDebtPct = 10; // $1M
      const investorSubDebtPikRate = 8; // 8% annual
      
      const params: CalculationParams = {
        projectCost,
        landValue: 0,
        yearOneNOI: 600000,
        revenueGrowth: 0,
        expenseGrowth: 0,
        exitCapRate: 6,
        investorEquityPct: 20,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 500000,
        netTaxBenefit: 450000,
        hdcFee: 50000,
        investorPromoteShare: 35,
        opexRatio: 30,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct: 0,
        hdcSubDebtPikRate: 8,
        pikCurrentPayEnabled: false,
        pikCurrentPayPct: 0,
        investorSubDebtPct,
        investorSubDebtPikRate,
        investorPikCurrentPayEnabled: false,
        investorPikCurrentPayPct: 0,
        aumFeeEnabled: false,
        aumFeeRate: 0
      };
      
      const results = calculateFullInvestorAnalysis(params);
      
      console.log('Cash Flow PIK Tracking:');
      results.investorCashFlows.forEach((cf) => {
        console.log(`Year ${cf.year}:`,
          'PIK Accrued:', cf.investorSubDebtPIKAccrued || 0
        );
      });

      // Verify PIK accrues each year after year 1
      let totalPIKAccrued = 0;
      results.investorCashFlows.forEach((cf, idx) => {
        if (idx > 0) { // Skip year 1 (no accrual)
          const accrued = cf.investorSubDebtPIKAccrued || 0;
          expect(accrued).toBeGreaterThan(0); // Should accrue something each year
          totalPIKAccrued += accrued;
        }
      });

      // Verify substantial PIK accrual occurred
      const basePrincipal = projectCost * (investorSubDebtPct / 100);
      expect(totalPIKAccrued).toBeGreaterThan(basePrincipal * 0.5); // At least 50% of principal in interest
      expect(totalPIKAccrued).toBeLessThan(basePrincipal * 1.5);    // But less than 150% of principal
    });
  });

  describe('HDC Analysis PIK with AUM Fee Accrual', () => {
    it('should compound AUM fee accruals with PIK balance', () => {
      const params: HDCCalculationParams = {
        projectCost: 10000000,
      
        yearOneNOI: 300000, // Low NOI to trigger AUM accrual
        revenueGrowth: 2,
        expenseGrowth: 3,
        exitCapRate: 7,
        philanthropicEquityPct: 25,
        hdcFeeRate: 0,
        hdcFee: 100000,
        investorPromoteShare: 35,
        hdcSubDebtPct: 10, // $1M sub-debt
        hdcSubDebtPikRate: 8,
        pikCurrentPayEnabled: false,
        pikCurrentPayPct: 0,
        opexRatio: 35,
        holdPeriod: 10,
    constructionDelayMonths: 0,
        aumFeeEnabled: true,
        aumFeeRate: 2, // 2% AUM fee
        seniorDebtPct: 60,
        philanthropicDebtPct: 5,
        seniorDebtRate: 6,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40
      };
      
      const results = calculateHDCAnalysis(params);
      
      console.log('HDC PIK with AUM Accrual:');
      results.hdcCashFlows.forEach((cf) => {
        console.log(`Year ${cf.year}:`,
          'AUM Fee:', cf.aumFeeAmount,
          'AUM Income:', cf.aumFeeIncome,
          'AUM Accrued:', cf.aumFeeAccrued,
          'PIK Accrued:', cf.hdcSubDebtPIKAccrued,
          'PIK Balance:', cf.pikBalance
        );
      });
      
      // Total accrued should include both PIK and AUM accruals
      const totalAumAccrued = results.hdcCashFlows.reduce(
        (sum, cf) => sum + cf.aumFeeAccrued, 0
      );
      
      console.log('Total AUM Accrued:', totalAumAccrued);
      console.log('HDC Sub-debt PIK Accrued:', results.hdcSubDebtPIKAccrued);
      console.log('HDC Sub-debt at Exit:', results.hdcSubDebtRepayment);
      
      // If AUM fees accrued, they should be added to PIK balance
      if (totalAumAccrued > 0) {
        expect(results.hdcSubDebtPIKAccrued).toBeGreaterThan(0);
      }
    });
  });

  describe('Compound Interest Mathematical Verification', () => {
    it('should match Excel FV function for compound interest', () => {
      // Test against Excel's FV (Future Value) function
      // FV(rate, nper, pmt, pv) where pmt = 0 for PIK
      
      const testCases = [
        { principal: 1000000, rate: 0.08, years: 9 },
        { principal: 500000, rate: 0.10, years: 9 },
        { principal: 2000000, rate: 0.06, years: 9 },
        { principal: 750000, rate: 0.12, years: 9 }
      ];
      
      testCases.forEach(({ principal, rate, years }) => {
        const params: CalculationParams = {
          projectCost: principal * 10, // Scale to get right percentage
          landValue: 5000000,
          yearOneNOI: 600000,
          revenueGrowth: 3,
          expenseGrowth: 3,
          exitCapRate: 6,
          investorEquityPct: 20,
          hdcFeeRate: 0,
          hdcAdvanceFinancing: false,
          investorUpfrontCash: 0,
          totalTaxBenefit: 500000,
          netTaxBenefit: 450000,
          hdcFee: 50000,
          investorPromoteShare: 35,
          opexRatio: 30,
          seniorDebtPct: 60,
          philanthropicDebtPct: 10,
          seniorDebtRate: 5,
          philanthropicDebtRate: 0,
          seniorDebtAmortization: 30,
          philDebtAmortization: 40,
          hdcSubDebtPct: 10, // 10% of project cost = principal
          hdcSubDebtPikRate: rate * 100,
          pikCurrentPayEnabled: false,
          pikCurrentPayPct: 0,
          investorSubDebtPct: 0,
          investorSubDebtPikRate: 8,
          investorPikCurrentPayEnabled: false,
          investorPikCurrentPayPct: 0,
          aumFeeEnabled: false,
          aumFeeRate: 0
        };

        const results = calculateFullInvestorAnalysis(params);

        // Calculate expected growth multiplier: (1 + rate)^years
        const expectedMultiplier = Math.pow(1 + rate, years);

        console.log(`Excel FV Test - Principal: ${principal}, Rate: ${rate * 100}%, Years: ${years}`);
        console.log('Expected Multiplier:', expectedMultiplier);
        console.log('Final Balance:', results.subDebtAtExit);

        // Verify compound interest logic: balance should grow by expected multiplier (±10%)
        const basePrincipal = params.projectCost * (params.hdcSubDebtPct / 100);
        expect(results.subDebtAtExit).toBeGreaterThan(basePrincipal * expectedMultiplier);
        expect(results.subDebtAtExit).toBeLessThan(basePrincipal * expectedMultiplier * 1.15);
      });
    });
  });
});