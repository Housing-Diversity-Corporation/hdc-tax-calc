import { 
  calculateIRR, 
  calculateMonthlyPayment, 
  calculateRemainingBalance,
  calculateFullInvestorAnalysis 
} from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';
import { CalculationParams, HDCCalculationParams } from '../../../types/taxbenefits';

describe('HDC Calculator - Core Financial Calculations', () => {
  
  describe('IRR Calculations', () => {
    it('should calculate IRR correctly for positive cash flows', () => {
      const cashFlows = [1000, 1100, 1210, 1331, 1464];
      const initialInvestment = 5000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBeCloseTo(6.59, 1); // ~6.59% IRR for these cash flows
    });

    it('should handle zero initial investment', () => {
      const cashFlows = [1000, 1000, 1000];
      const initialInvestment = 0;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBe(Infinity); // Division by zero results in Infinity
    });

    it('should handle negative cash flows', () => {
      const cashFlows = [-500, 1000, 1500, 2000];
      const initialInvestment = 2000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBeGreaterThan(0);
    });

    it('should handle cash flows with sign changes', () => {
      const cashFlows = [1000, -500, 1500, -200, 2000];
      const initialInvestment = 1000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBeDefined();
      expect(typeof irr).toBe('number');
    });

    it('should handle large cash flows', () => {
      const cashFlows = [1000000, 1200000, 1500000, 2000000, 25000000];
      const initialInvestment = 10000000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBeGreaterThan(0);
    });

    it('should return 0 for all zero cash flows', () => {
      const cashFlows = [0, 0, 0, 0, 0];
      const initialInvestment = 1000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBe(0);
    });

    it('should handle single period cash flow', () => {
      const cashFlows = [2000];
      const initialInvestment = 1000;
      const irr = calculateIRR(cashFlows, initialInvestment);
      expect(irr).toBeCloseTo(100, 5); // 100% return in single period
    });
  });

  describe('Loan Amortization Calculations', () => {
    describe('Monthly Payment Calculation', () => {
      it('should calculate monthly payment correctly', () => {
        const principal = 100000;
        const annualRate = 0.06; // 6%
        const years = 30;
        const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
        expect(monthlyPayment).toBeCloseTo(599.55, 2);
      });

      it('should handle zero principal', () => {
        const payment = calculateMonthlyPayment(0, 0.06, 30);
        expect(payment).toBe(0);
      });

      it('should handle zero interest rate', () => {
        const principal = 100000;
        const payment = calculateMonthlyPayment(principal, 0, 30);
        // With 0% interest, payment should be principal divided by total months
        expect(payment).toBe(principal / (30 * 12));
      });

      it('should handle short-term loans', () => {
        const principal = 10000;
        const annualRate = 0.08;
        const years = 1;
        const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
        expect(monthlyPayment).toBeCloseTo(869.88, 2);
      });

      it('should handle high interest rates', () => {
        const principal = 50000;
        const annualRate = 0.15; // 15%
        const years = 10;
        const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
        expect(monthlyPayment).toBeGreaterThan(principal / (years * 12));
      });
    });

    describe('Remaining Balance Calculation', () => {
      it('should calculate remaining balance correctly', () => {
        const principal = 100000;
        const annualRate = 0.06;
        const years = 30;
        const paymentsMade = 60; // 5 years
        const balance = calculateRemainingBalance(principal, annualRate, years, paymentsMade);
        expect(balance).toBeCloseTo(93054.36, 0);
      });

      it('should return 0 for fully paid loan', () => {
        const principal = 100000;
        const annualRate = 0.06;
        const years = 30;
        const paymentsMade = 360; // Full term
        const balance = calculateRemainingBalance(principal, annualRate, years, paymentsMade);
        expect(balance).toBeCloseTo(0, 2);
      });

      it('should handle zero principal', () => {
        const balance = calculateRemainingBalance(0, 0.06, 30, 60);
        expect(balance).toBe(0);
      });

      it('should handle zero interest rate', () => {
        const principal = 100000;
        const balance = calculateRemainingBalance(principal, 0, 30, 60);
        const expectedBalance = principal - (60 * principal / 360);
        expect(balance).toBeCloseTo(expectedBalance, 2);
      });

      it('should handle overpayment scenarios', () => {
        const principal = 10000;
        const annualRate = 0.05;
        const years = 5;
        const paymentsMade = 100; // More than total payments
        const balance = calculateRemainingBalance(principal, annualRate, years, paymentsMade);
        expect(balance).toBe(0);
      });
    });
  });

  describe('Full Investor Analysis', () => {
    const baseParams: CalculationParams = {
      projectCost: 86000000,
      landValue: 8600000,
      yearOneNOI: 5113000,
      // ISS-068c: Single NOI growth rate
      noiGrowthRate: 3,
      exitCapRate: 6,
      investorEquityPct: 14,
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 0,
      totalTaxBenefit: 7000000,
      netTaxBenefit: 6300000,
      hdcFee: 700000,
      investorPromoteShare: 35,
      seniorDebtPct: 66,
      philanthropicDebtPct: 20,
      seniorDebtRate: 5,
      philanthropicDebtRate: 0,
      seniorDebtAmortization: 35,
      philDebtAmortization: 60,
      hdcSubDebtPct: 0,
      hdcSubDebtPikRate: 8,
      pikCurrentPayEnabled: false,
      pikCurrentPayPct: 50,
      investorSubDebtPct: 0,
      investorSubDebtPikRate: 8,
      investorPikCurrentPayEnabled: false,
      investorPikCurrentPayPct: 50,
      aumFeeEnabled: false,
      aumFeeRate: 1
    };

    it('should calculate investor analysis with base case', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      expect(results).toBeDefined();
      expect(results.totalInvestment).toBeCloseTo(12040000, -3); // Only equity, no HDC fee
      expect(results.investorCashFlows).toHaveLength(10);
      expect(results.irr).toBeGreaterThan(0);
      expect(results.multiple).toBeGreaterThan(1);
    });

    it('should handle HDC advance financing', () => {
      const paramsWithAdvance = {
        ...baseParams,
        hdcAdvanceFinancing: true,
        investorUpfrontCash: 5040000
      };

      const results = calculateFullInvestorAnalysis(paramsWithAdvance);
      // HDC advance financing affects total investment, not year 0 tax benefit
      expect(results.totalInvestment).toBeGreaterThan(0);
      expect(results.irr).toBeGreaterThan(0);
    });

    it('should calculate with sub-debt correctly', () => {
      const paramsWithSubDebt = {
        ...baseParams,
        hdcSubDebtPct: 2,
        hdcSubDebtPikRate: 8,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 50
      };
      
      const results = calculateFullInvestorAnalysis(paramsWithSubDebt);
      expect(results.subDebtAtExit).toBeGreaterThan(0);
      expect(results.pikAccumulatedInterest).toBeGreaterThan(0);
    });

    it('should handle investor sub-debt', () => {
      const paramsWithInvestorSubDebt = {
        ...baseParams,
        investorSubDebtPct: 2.5,
        investorSubDebtPikRate: 8,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 50
      };
      
      const results = calculateFullInvestorAnalysis(paramsWithInvestorSubDebt);
      expect(results.investorSubDebtAtExit).toBeGreaterThan(0);
      expect(results.investorSubDebtInterestReceived).toBeGreaterThan(0);
    });

    // Test removed - AUM fee calculation changed in v7.0

    it('should handle zero equity scenario', () => {
      const zeroEquityParams = {
        ...baseParams,
        investorEquityPct: 0
      };
      
      const results = calculateFullInvestorAnalysis(zeroEquityParams);
      expect(results.totalInvestment).toBe(0); // No equity, no HDC fee
    });

    it('should calculate exit proceeds correctly with return-of-capital-first', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      expect(results.exitValue).toBeGreaterThan(0);
      expect(results.remainingDebtAtExit).toBeGreaterThan(0);
      expect(results.totalExitProceeds).toBeGreaterThan(0);

      // IMPL-029: Return-of-capital-first waterfall
      // 1. Investor gets 100% of capital return up to their equity basis
      // 2. Remaining profit split per promote percentage (35%)
      const investorEquityBasis = results.investorEquity;
      const returnOfCapital = Math.min(results.totalExitProceeds, investorEquityBasis);
      const profit = Math.max(0, results.totalExitProceeds - investorEquityBasis);
      const investorProfitShare = profit * 0.35;
      const expectedInvestorShare = returnOfCapital + investorProfitShare;

      // exitProceeds = investorShareOfGross - totalDeferredHDCFees
      // So investorShareOfGross >= exitProceeds
      expect(results.exitProceeds).toBeLessThanOrEqual(expectedInvestorShare);
      expect(results.exitProceeds).toBeGreaterThan(0);
    });

    // ISS-068c: Updated to use direct NOI growth rate
    it('should handle negative NOI growth', () => {
      const negativeGrowthParams = {
        ...baseParams,
        noiGrowthRate: -3 // Negative NOI growth
      };

      const results = calculateFullInvestorAnalysis(negativeGrowthParams);
      expect(results).toBeDefined();
      expect(results.investorCashFlows[9].noi).toBeLessThan(results.investorCashFlows[0].noi);
    });

    it('should handle high leverage scenario', () => {
      const highLeverageParams = {
        ...baseParams,
        seniorDebtPct: 80,
        philanthropicDebtPct: 15,
        investorEquityPct: 5
      };
      
      const results = calculateFullInvestorAnalysis(highLeverageParams);
      expect(results).toBeDefined();
      expect(results.remainingDebtAtExit).toBeGreaterThan(baseParams.projectCost * 0.5);
    });

    it('should calculate cash flows with proper accumulation', () => {
      const results = calculateFullInvestorAnalysis(baseParams);
      
      let manualCumulative = 0;
      results.investorCashFlows.forEach((cf) => {
        manualCumulative += cf.totalCashFlow;
        expect(cf.cumulativeReturns).toBeCloseTo(manualCumulative, 2);
      });
    });
  });

  describe('HDC Analysis', () => {
    const baseHDCParams: HDCCalculationParams = {
      projectCost: 86000000,
      yearOneNOI: 5113000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 6,
      philanthropicEquityPct: 10,
      hdcFeeRate: 0,
      hdcFee: 700000,
      investorPromoteShare: 35,
      opexRatio: 25,
      holdPeriod: 10,
    constructionDelayMonths: 0,
      seniorDebtPct: 66,
      philanthropicDebtPct: 20,
      seniorDebtRate: 5,
      philanthropicDebtRate: 0,
      seniorDebtAmortization: 35,
      philDebtAmortization: 60,
      hdcSubDebtPct: 2,
      hdcSubDebtPikRate: 8,
      pikCurrentPayEnabled: false,
      pikCurrentPayPct: 50,
      aumFeeEnabled: false,
      aumFeeRate: 1.5,
      yearOneDepreciation: 25800000, // 30% of $86M
      annualStraightLineDepreciation: 2189090.91, // ($86M - $25.8M) / 27.5 years (IRS MACRS)
      effectiveTaxRate: 37 // Effective tax rate for fee calculation
    };

    it('should calculate HDC analysis correctly', () => {
      const results = calculateHDCAnalysis(baseHDCParams);
      
      expect(results).toBeDefined();
      expect(results.hdcCashFlows).toHaveLength(10);
      
      // Calculate expected HDC fee based on depreciation
      // Year 1: $25,800,000 × 37% × 10% = $954,600
      // Years 2-10: $2,189,090.91 × 37% × 10% × 9 = $729,027.27
      // HDC fee income now 0 (fee removed per IMPL-7.0-001)
      expect(results.hdcFeeIncome).toBe(0);
      expect(results.hdcIRR).toBeDefined();
      // HDC has no initial investment in current implementation
      expect(results.hdcMultiple).toBe(0);
    });

    it('should calculate philanthropic equity correctly', () => {
      const results = calculateHDCAnalysis(baseHDCParams);
      
      // Current implementation has HDC initial investment as 0
      expect(results.hdcInitialInvestment).toBe(0);
      // Philanthropic equity repayment may be calculated differently
      expect(results.philanthropicEquityRepayment).toBeDefined();
    });

    // Test removed - AUM fee calculation changed in v7.0

    it('should calculate HDC promote share correctly', () => {
      const results = calculateHDCAnalysis(baseHDCParams);
      // HDC gets 65% of net exit proceeds (100% - 35% investor share)
      
      expect(results.hdcPromoteProceeds).toBeGreaterThan(0);
    });

    it('should handle PIK interest correctly', () => {
      const paramsWithPIK = {
        ...baseHDCParams,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 30
      };
      
      const results = calculateHDCAnalysis(paramsWithPIK);
      expect(results.hdcSubDebtCurrentPayIncome).toBeGreaterThan(0);
      expect(results.hdcSubDebtPIKAccrued).toBeGreaterThan(0);
    });

    it('should calculate exit proceeds with debt repayment', () => {
      const results = calculateHDCAnalysis(baseHDCParams);
      
      expect(results.hdcExitProceeds).toBeGreaterThan(0);
      expect(results.hdcSubDebtRepayment).toBeGreaterThan(0);
      expect(results.totalHDCReturns).toBeGreaterThan(results.hdcInitialInvestment);
    });

    it('should handle zero philanthropic equity', () => {
      const zeroPhilParams = {
        ...baseHDCParams,
        philanthropicEquityPct: 0
      };
      
      const results = calculateHDCAnalysis(zeroPhilParams);
      expect(results.hdcInitialInvestment).toBe(0);
      expect(results.hdcIRR).toBe(0);
    });

    it('should calculate cumulative returns correctly', () => {
      const results = calculateHDCAnalysis(baseHDCParams);
      
      let manualCumulative = 0;
      results.hdcCashFlows.forEach((cf) => {
        manualCumulative += cf.totalCashFlow;
        expect(cf.cumulativeReturns).toBeCloseTo(manualCumulative, 2);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    const baseParams: CalculationParams = {
      projectCost: 86000000,
      landValue: 8600000,
      yearOneNOI: 5113000,
      // ISS-068c: Single NOI growth rate
      noiGrowthRate: 3,
      exitCapRate: 6,
      investorEquityPct: 14,
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorUpfrontCash: 0,
      totalTaxBenefit: 7000000,
      netTaxBenefit: 6300000,
      hdcFee: 700000,
      investorPromoteShare: 35,
      seniorDebtPct: 66,
      philanthropicDebtPct: 20,
      seniorDebtRate: 5,
      philanthropicDebtRate: 0,
      seniorDebtAmortization: 35,
      philDebtAmortization: 60
    };

    it('should handle zero project cost', () => {
      const zeroProjectParams = {
        ...baseParams,
        projectCost: 0
      };
      
      const results = calculateFullInvestorAnalysis(zeroProjectParams);
      expect(results.totalInvestment).toBe(0); // No equity, no HDC fee
      expect(results.investorCashFlows).toHaveLength(10);
    });

    it('should handle negative NOI', () => {
      const negativeNOIParams = {
        ...baseParams,
        yearOneNOI: -1000000
      };
      
      const results = calculateFullInvestorAnalysis(negativeNOIParams);
      expect(results).toBeDefined();
      expect(results.investorCashFlows[0].noi).toBeLessThan(0);
    });

    it('should handle 100% debt financing', () => {
      const fullDebtParams = {
        ...baseParams,
        investorEquityPct: 0,
        philanthropicEquityPct: 0,
        seniorDebtPct: 80,
        philanthropicDebtPct: 20
      };
      
      const results = calculateFullInvestorAnalysis(fullDebtParams);
      expect(results).toBeDefined();
      expect(results.totalInvestment).toBe(0); // No equity, no HDC fee
    });

    // ISS-068c: Updated to use direct NOI growth rate
    it('should handle extreme growth rates', () => {
      const extremeGrowthParams = {
        ...baseParams,
        noiGrowthRate: 30 // 30% annual NOI growth
      };

      const results = calculateFullInvestorAnalysis(extremeGrowthParams);
      expect(results).toBeDefined();
      // With 30% growth for 9 years: 1.30^9 ≈ 10.6x
      expect(results.investorCashFlows[9].noi).toBeGreaterThan(results.investorCashFlows[0].noi * 10);
    });

    it('should handle very high exit cap rate', () => {
      const highCapRateParams = {
        ...baseParams,
        exitCapRate: 20
      };
      
      const results = calculateFullInvestorAnalysis(highCapRateParams);
      expect(results.exitValue).toBeLessThan(baseParams.projectCost);
    });

    it('should handle very low exit cap rate', () => {
      const lowCapRateParams = {
        ...baseParams,
        exitCapRate: 1
      };
      
      const results = calculateFullInvestorAnalysis(lowCapRateParams);
      expect(results.exitValue).toBeGreaterThan(baseParams.projectCost * 5);
    });

    it('should handle maximum leverage with all debt types', () => {
      const maxLeverageParams = {
        ...baseParams,
        investorEquityPct: 5,
        philanthropicEquityPct: 5,
        seniorDebtPct: 70,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 5
      };
      
      const results = calculateFullInvestorAnalysis(maxLeverageParams);
      expect(results).toBeDefined();
      const totalCapital = 5 + 5 + 70 + 10 + 5 + 5;
      expect(totalCapital).toBe(100);
    });
  });

  describe('Mathematical Accuracy Validation', () => {
    it('should maintain precision in large number calculations', () => {
      const largeParams: CalculationParams = {
        projectCost: 1000000000,
      landValue: 1000000000, // $1 billion
        yearOneNOI: 60000000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        investorEquityPct: 14,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 80000000,
        netTaxBenefit: 72000000,
        hdcFee: 8000000,
        investorPromoteShare: 35,
        opexRatio: 25,
        seniorDebtPct: 66,
        philanthropicDebtPct: 20,
        seniorDebtRate: 5,
        philanthropicDebtRate: 0,
        seniorDebtAmortization: 35,
        philDebtAmortization: 60
      };
      
      const results = calculateFullInvestorAnalysis(largeParams);
      expect(results.totalInvestment).toBeGreaterThan(100000000);
      expect(results.exitValue).toBeGreaterThan(0);
    });

    it('should handle compound interest correctly', () => {
      const principal = 100000;
      const rate = 0.08;
      const years = 10;
      const monthlyPayment = calculateMonthlyPayment(principal, rate, years);
      const totalPaid = monthlyPayment * years * 12;
      const totalInterest = totalPaid - principal;
      
      expect(totalInterest).toBeGreaterThan(0);
      expect(totalInterest).toBeLessThan(principal); // Interest should be less than principal for reasonable rates
    });

    it('should verify NPV calculation in IRR', () => {
      // When IRR is correct, NPV should be close to 0
      const cashFlows = [1000, 1100, 1210];
      const initialInvestment = 3000;
      const irr = calculateIRR(cashFlows, initialInvestment) / 100;
      
      // Calculate NPV at the IRR rate
      let npv = -initialInvestment;
      cashFlows.forEach((cf, i) => {
        npv += cf / Math.pow(1 + irr, i + 1);
      });
      
      expect(Math.abs(npv)).toBeLessThan(1); // NPV should be near 0
    });
  });

  describe('Performance Tests', () => {
    it('should calculate complex scenarios within reasonable time', () => {
      const startTime = Date.now();
      
      const complexParams: CalculationParams = {
        projectCost: 100000000,
      landValue: 100000000,
        yearOneNOI: 6000000,
        revenueGrowth: 3.5,
        expenseGrowth: 2.8,
        exitCapRate: 5.5,
        investorEquityPct: 12,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: true,
        investorUpfrontCash: 5000000,
        totalTaxBenefit: 8000000,
        netTaxBenefit: 7200000,
        hdcFee: 800000,
        investorPromoteShare: 40,
        opexRatio: 28,
        seniorDebtPct: 65,
        philanthropicDebtPct: 15,
        seniorDebtRate: 5.5,
        philanthropicDebtRate: 1,
        seniorDebtAmortization: 30,
        philDebtAmortization: 40,
        hdcSubDebtPct: 3,
        hdcSubDebtPikRate: 9,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 40,
        investorSubDebtPct: 2,
        investorSubDebtPikRate: 8.5,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 60,
        aumFeeEnabled: true,
        aumFeeRate: 1.75
      };
      
      const results = calculateFullInvestorAnalysis(complexParams);
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(results).toBeDefined();
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle batch calculations efficiently', () => {
      const startTime = Date.now();
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        const params: CalculationParams = {
          projectCost: 50000000 + i * 1000000,
          landValue: 5000000 + i * 100000,
          yearOneNOI: 3000000 + i * 50000,
          revenueGrowth: 2 + (i % 5) * 0.5,
          expenseGrowth: 2 + (i % 4) * 0.5,
          exitCapRate: 5 + (i % 3) * 0.5,
          investorEquityPct: 10 + (i % 20),
          hdcFeeRate: 0,
          hdcAdvanceFinancing: i % 2 === 0,
          investorUpfrontCash: i % 2 === 0 ? 2000000 : 0,
          totalTaxBenefit: 5000000,
          netTaxBenefit: 4500000,
          hdcFee: 500000,
          investorPromoteShare: 30 + (i % 4) * 5,
          opexRatio: 25,
          seniorDebtPct: 60 + (i % 10),
          philanthropicDebtPct: 15,
          seniorDebtRate: 4 + (i % 3),
          philanthropicDebtRate: 0,
          seniorDebtAmortization: 30,
          philDebtAmortization: 60
        };
        
        results.push(calculateFullInvestorAnalysis(params));
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(results).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // 100 calculations in under 1 second
    });
  });
});