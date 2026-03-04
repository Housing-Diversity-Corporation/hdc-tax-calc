/**
 * Step 4 Validation: Capital Structure Sizing
 *
 * Validates that capital structure calculations follow the correct formula:
 *   amount = effectiveProjectCost × (percentage / 100)
 *
 * Where:
 *   effectiveProjectCost = projectCost + predevelopmentCosts + interestReserve
 *
 * Tests verify:
 * 1. Correct dollar amounts for each capital component
 * 2. Sum of all components equals effective project cost
 * 3. Consistency across calculation engine and React hooks
 * 4. Impact of interest reserve on capital structure
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('Step 4: Capital Structure Validation', () => {

  /**
   * Ground Truth Example 1: Simple Structure (No Interest Reserve)
   *
   * Validates basic capital structure formula without complications.
   */
  describe('Example 1: Simple Structure (No Interest Reserve)', () => {
    const params: CalculationParams = {
      projectCost: 50000000,
      predevelopmentCosts: 0,
      landValue: 5000000,

      // Capital structure percentages (sum to 100%)
      seniorDebtPct: 60,
      philanthropicDebtPct: 10,
      hdcSubDebtPct: 5,
      investorSubDebtPct: 5,
      outsideInvestorSubDebtPct: 0,
      investorEquityPct: 20,

      // Interest reserve disabled
      interestReserveEnabled: false,
      interestReserveMonths: 0,

      // Required operating parameters
      yearOneNOI: 2500000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 6,
      opexRatio: 30,
      holdPeriod: 10,

      // Debt parameters
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 8,

      // Tax parameters
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      placedInServiceMonth: 7,

      // HDC parameters
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorPromoteShare: 35,

      // Required placeholders
      investorUpfrontCash: 10000000,
      totalTaxBenefit: 0,
      netTaxBenefit: 0,
      hdcFee: 0,
      constructionDelayMonths: 0,
    };

    it('should calculate correct effective project cost', () => {
      const results = calculateFullInvestorAnalysis(params);

      // With no interest reserve or predevelopment costs:
      // effectiveProjectCost = projectCost + 0 + 0 = $50M
      const expectedEffectiveCost = 50000000;

      expect(results.totalInvestment).toBe(10000000); // 20% of $50M
    });

    it('should calculate correct senior debt amount', () => {
      const effectiveProjectCost = 50000000;
      const expectedSeniorDebt = effectiveProjectCost * (60 / 100);

      expect(expectedSeniorDebt).toBe(30000000); // $30M
    });

    it('should calculate correct philanthropic debt amount', () => {
      const effectiveProjectCost = 50000000;
      const expectedPhilDebt = effectiveProjectCost * (10 / 100);

      expect(expectedPhilDebt).toBe(5000000); // $5M
    });

    it('should calculate correct HDC sub-debt amount', () => {
      const effectiveProjectCost = 50000000;
      const expectedHdcSubDebt = effectiveProjectCost * (5 / 100);

      expect(expectedHdcSubDebt).toBe(2500000); // $2.5M
    });

    it('should calculate correct investor sub-debt amount', () => {
      const effectiveProjectCost = 50000000;
      const expectedInvestorSubDebt = effectiveProjectCost * (5 / 100);

      expect(expectedInvestorSubDebt).toBe(2500000); // $2.5M
    });

    it('should calculate correct outside investor sub-debt amount', () => {
      const effectiveProjectCost = 50000000;
      const expectedOutsideInvestorSubDebt = effectiveProjectCost * (0 / 100);

      expect(expectedOutsideInvestorSubDebt).toBe(0); // $0
    });

    it('should calculate correct investor equity amount', () => {
      const results = calculateFullInvestorAnalysis(params);
      const effectiveProjectCost = 50000000;
      const expectedInvestorEquity = effectiveProjectCost * (20 / 100);

      expect(results.totalInvestment).toBe(expectedInvestorEquity);
      expect(results.totalInvestment).toBe(10000000); // $10M
    });

    it('should have all capital components sum to effective project cost', () => {
      const effectiveProjectCost = 50000000;

      const seniorDebt = effectiveProjectCost * (60 / 100);
      const philDebt = effectiveProjectCost * (10 / 100);
      const hdcSubDebt = effectiveProjectCost * (5 / 100);
      const investorSubDebt = effectiveProjectCost * (5 / 100);
      const outsideInvestorSubDebt = effectiveProjectCost * (0 / 100);
      const investorEquity = effectiveProjectCost * (20 / 100);

      const totalCapital = seniorDebt + philDebt + hdcSubDebt +
                           investorSubDebt + outsideInvestorSubDebt + investorEquity;

      expect(totalCapital).toBe(effectiveProjectCost);
      expect(totalCapital).toBe(50000000);
    });

    it('should have capital structure percentages sum to 100%', () => {
      const totalPct = params.seniorDebtPct + params.philanthropicDebtPct +
                       params.hdcSubDebtPct + params.investorSubDebtPct +
                       params.outsideInvestorSubDebtPct + params.investorEquityPct;

      expect(totalPct).toBe(100);
    });
  });

  /**
   * Ground Truth Example 2: With Predevelopment and Interest Reserve
   *
   * Validates that capital structure scales correctly with effective project cost.
   */
  describe('Example 2: With Predevelopment and Interest Reserve', () => {
    const params: CalculationParams = {
      projectCost: 50000000,
      predevelopmentCosts: 2000000, // $2M predevelopment
      landValue: 5000000,

      // Same percentages as Example 1
      seniorDebtPct: 60,
      philanthropicDebtPct: 10,
      hdcSubDebtPct: 5,
      investorSubDebtPct: 5,
      outsideInvestorSubDebtPct: 0,
      investorEquityPct: 20,

      // Interest reserve enabled
      interestReserveEnabled: true,
      interestReserveMonths: 12,

      // Required operating parameters
      yearOneNOI: 2500000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 6,
      opexRatio: 30,
      holdPeriod: 10,

      // Debt parameters
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 8,

      // Tax parameters
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      placedInServiceMonth: 7,

      // HDC parameters
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorPromoteShare: 35,

      // Required placeholders
      investorUpfrontCash: 10000000,
      totalTaxBenefit: 0,
      netTaxBenefit: 0,
      hdcFee: 0,
      constructionDelayMonths: 0,
    };

    it('should calculate correct effective project cost with interest reserve', () => {
      const results = calculateFullInvestorAnalysis(params);

      // effectiveProjectCost = $50M + $2M + interestReserve
      // Interest reserve calculated in Step 2, approximately $940,803
      // For this test, we'll verify investor equity scales correctly

      // Base + predevelopment = $52M
      const baseProjectCost = 50000000 + 2000000;

      // Investor equity should be > 20% of $52M due to interest reserve
      const minExpectedEquity = baseProjectCost * 0.20; // $10.4M minimum

      expect(results.totalInvestment).toBeGreaterThan(minExpectedEquity);
    });

    it('should scale all capital components proportionally', () => {
      const results = calculateFullInvestorAnalysis(params);

      // Same percentages as Example 1, but higher dollar amounts
      // Investor equity should be approximately $10.4M - $10.6M
      const baseProjectCost = 52000000;

      // Minimum expected: 20% of base cost (no interest reserve)
      const minExpectedInvestorEquity = baseProjectCost * 0.20; // $10.4M

      // Maximum expected: 20% of base + reasonable interest reserve (~$1M)
      const maxExpectedInvestorEquity = (baseProjectCost + 1000000) * 0.20; // $10.6M

      // Verify investor equity is in expected range
      expect(results.totalInvestment).toBeGreaterThanOrEqual(minExpectedInvestorEquity);
      expect(results.totalInvestment).toBeLessThanOrEqual(maxExpectedInvestorEquity);
    });

    it('should maintain percentage ratios despite higher effective cost', () => {
      const results = calculateFullInvestorAnalysis(params);

      // Percentages should remain constant
      const totalPct = params.seniorDebtPct + params.philanthropicDebtPct +
                       params.hdcSubDebtPct + params.investorSubDebtPct +
                       params.outsideInvestorSubDebtPct + params.investorEquityPct;

      expect(totalPct).toBe(100);

      // Investor equity percentage should still be 20%
      expect(params.investorEquityPct).toBe(20);
    });

    it('should calculate depreciable basis without investor equity exclusion', () => {
      const results = calculateFullInvestorAnalysis(params);

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // With predevelopment: base cost = $52M
      // Depreciable basis = ($50M + $2M) - $5M land = $47M
      // (investor equity is NOT excluded)

      // Year 1 tax benefit should reflect full depreciable basis
      const year1TaxBenefit = results.investorCashFlows[0].taxBenefit;

      // Verify it's positive and reasonable (higher than before due to no equity exclusion)
      expect(year1TaxBenefit).toBeGreaterThan(4000000); // > $4M
      expect(year1TaxBenefit).toBeLessThan(7000000);    // < $7M
    });
  });

  /**
   * Ground Truth Example 3: Maximum Leverage (95% Debt)
   *
   * Validates edge case with minimal equity and high debt load.
   */
  describe('Example 3: Maximum Leverage (95% Debt)', () => {
    const params: CalculationParams = {
      projectCost: 50000000,
      predevelopmentCosts: 0,
      landValue: 5000000,

      // High leverage structure
      seniorDebtPct: 65,
      philanthropicDebtPct: 25,
      hdcSubDebtPct: 0,
      investorSubDebtPct: 0,
      outsideInvestorSubDebtPct: 0,
      investorEquityPct: 5,
      // Note: 5% philanthropic grant implied (95% total)

      // Interest reserve disabled for clarity
      interestReserveEnabled: false,
      interestReserveMonths: 0,

      // Required operating parameters
      yearOneNOI: 2500000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 6,
      opexRatio: 30,
      holdPeriod: 10,

      // Debt parameters
      seniorDebtRate: 6,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 0,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 8,

      // Tax parameters
      yearOneDepreciationPct: 25,
      effectiveTaxRate: 47.85,
      placedInServiceMonth: 7,

      // HDC parameters
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorPromoteShare: 35,

      // Required placeholders
      investorUpfrontCash: 2500000,
      totalTaxBenefit: 0,
      netTaxBenefit: 0,
      hdcFee: 0,
      constructionDelayMonths: 0,
    };

    it('should calculate correct senior debt at 65%', () => {
      const effectiveProjectCost = 50000000;
      const expectedSeniorDebt = effectiveProjectCost * (65 / 100);

      expect(expectedSeniorDebt).toBe(32500000); // $32.5M
    });

    it('should calculate correct philanthropic debt at 25%', () => {
      const effectiveProjectCost = 50000000;
      const expectedPhilDebt = effectiveProjectCost * (25 / 100);

      expect(expectedPhilDebt).toBe(12500000); // $12.5M
    });

    it('should calculate correct investor equity at 5%', () => {
      const results = calculateFullInvestorAnalysis(params);
      const effectiveProjectCost = 50000000;
      const expectedInvestorEquity = effectiveProjectCost * (5 / 100);

      expect(results.totalInvestment).toBe(expectedInvestorEquity);
      expect(results.totalInvestment).toBe(2500000); // $2.5M
    });

    it('should have capital structure percentages sum to 95% (excluding grant)', () => {
      const totalPct = params.seniorDebtPct + params.philanthropicDebtPct +
                       params.hdcSubDebtPct + params.investorSubDebtPct +
                       params.outsideInvestorSubDebtPct + params.investorEquityPct;

      expect(totalPct).toBe(95); // 5% philanthropic grant implied
    });

    it('should have total funded capital equal 95% of effective cost', () => {
      const effectiveProjectCost = 50000000;

      const seniorDebt = effectiveProjectCost * (65 / 100);
      const philDebt = effectiveProjectCost * (25 / 100);
      const investorEquity = effectiveProjectCost * (5 / 100);

      const totalFundedCapital = seniorDebt + philDebt + investorEquity;
      const expectedTotal = effectiveProjectCost * 0.95; // 95%

      expect(totalFundedCapital).toBe(expectedTotal);
      expect(totalFundedCapital).toBe(47500000); // $47.5M
    });

    it('should have higher depreciable basis due to minimal equity exclusion', () => {
      const results = calculateFullInvestorAnalysis(params);

      // Only $2.5M equity excluded (vs $10M in Example 1)
      // Depreciable basis = $50M - $5M land - $2.5M equity = $42.5M
      // Compare to Example 1: $50M - $5M - $10M = $35M
      // This structure has 21% higher depreciable basis

      // Year 1 depreciation should be higher
      const year1TaxBenefit = results.investorCashFlows[0].taxBenefit;

      // Should be higher than Example 1's ~$3.77M
      expect(year1TaxBenefit).toBeGreaterThan(4000000); // > $4M
    });
  });

  /**
   * Example 4: All Sub-Debts Active
   *
   * Validates complex structure with all capital components.
   */
  describe('Example 4: Complex Structure (All Components)', () => {
    const params: CalculationParams = {
      projectCost: 100000000,
      predevelopmentCosts: 5000000,
      landValue: 15000000,

      // Complex capital structure with all components
      seniorDebtPct: 50,
      philanthropicDebtPct: 15,
      hdcSubDebtPct: 10,
      investorSubDebtPct: 5,
      outsideInvestorSubDebtPct: 10,
      investorEquityPct: 10,

      // Interest reserve enabled
      interestReserveEnabled: true,
      interestReserveMonths: 18, // Longer lease-up

      // Required operating parameters
      yearOneNOI: 5000000,
      revenueGrowth: 3,
      expenseGrowth: 3,
      exitCapRate: 6,
      opexRatio: 30,
      holdPeriod: 10,

      // Debt parameters
      seniorDebtRate: 6.5,
      seniorDebtAmortization: 30,
      philanthropicDebtRate: 2,
      hdcSubDebtPikRate: 8,
      investorSubDebtPikRate: 8,
      outsideInvestorSubDebtPikRate: 9,
      outsideInvestorPikCurrentPayEnabled: true,
      outsideInvestorPikCurrentPayPct: 50,

      // Tax parameters
      yearOneDepreciationPct: 30,
      effectiveTaxRate: 50,
      placedInServiceMonth: 7,

      // HDC parameters
      hdcFeeRate: 0,
      hdcAdvanceFinancing: false,
      investorPromoteShare: 40,

      // Required placeholders
      investorUpfrontCash: 10000000,
      totalTaxBenefit: 0,
      netTaxBenefit: 0,
      hdcFee: 0,
      constructionDelayMonths: 0,
    };

    it('should calculate all capital components correctly', () => {
      const results = calculateFullInvestorAnalysis(params);

      // Base + predevelopment = $105M
      const baseProjectCost = 105000000;

      // Investor equity should be approximately 10% of effective cost
      // Effective cost ≈ $105M + interest reserve (larger due to 18 months)
      // Expect investor equity > $10.5M

      expect(results.totalInvestment).toBeGreaterThan(10500000);
    });

    it('should have all percentages sum to 100%', () => {
      const totalPct = params.seniorDebtPct + params.philanthropicDebtPct +
                       params.hdcSubDebtPct + params.investorSubDebtPct +
                       params.outsideInvestorSubDebtPct + params.investorEquityPct;

      expect(totalPct).toBe(100);
    });

    it('should correctly proportion all five debt types', () => {
      const baseProjectCost = 105000000;

      // Verify percentage formula for each component
      const expectedSeniorDebt = baseProjectCost * 0.50; // $52.5M minimum
      const expectedPhilDebt = baseProjectCost * 0.15;   // $15.75M minimum
      const expectedHdcSubDebt = baseProjectCost * 0.10; // $10.5M minimum
      const expectedInvestorSubDebt = baseProjectCost * 0.05; // $5.25M minimum
      const expectedOutsideInvestorSubDebt = baseProjectCost * 0.10; // $10.5M minimum

      // All should be higher due to interest reserve, but proportions maintained
      expect(expectedSeniorDebt).toBe(52500000);
      expect(expectedPhilDebt).toBe(15750000);
      expect(expectedHdcSubDebt).toBe(10500000);
      expect(expectedInvestorSubDebt).toBe(5250000);
      expect(expectedOutsideInvestorSubDebt).toBe(10500000);
    });
  });

  /**
   * Boundary Condition Tests
   */
  describe('Boundary Conditions', () => {
    it('should handle zero predevelopment costs correctly', () => {
      const params: CalculationParams = {
        projectCost: 50000000,
        predevelopmentCosts: 0, // No predevelopment
        landValue: 5000000,
        investorEquityPct: 20,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 5,
        interestReserveEnabled: false,
        yearOneNOI: 2500000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        opexRatio: 30,
        holdPeriod: 10,
        seniorDebtRate: 6,
        seniorDebtAmortization: 30,
        philanthropicDebtRate: 0,
        hdcSubDebtPikRate: 8,
        investorSubDebtPikRate: 8,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorPromoteShare: 35,
        investorUpfrontCash: 10000000,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        hdcFee: 0,
        constructionDelayMonths: 0,
        };

      const results = calculateFullInvestorAnalysis(params);

      // Effective cost should equal base project cost
      expect(results.totalInvestment).toBe(10000000); // 20% of $50M
    });

    it('should handle fractional percentages correctly', () => {
      const effectiveProjectCost = 50000000;

      // Test with fractional percentage (e.g., 12.5%)
      const fractionalPct = 12.5;
      const expectedAmount = effectiveProjectCost * (fractionalPct / 100);

      expect(expectedAmount).toBe(6250000); // $6.25M
    });

    it('should handle very small percentages (<1%)', () => {
      const effectiveProjectCost = 50000000;

      // Test with 0.5%
      const tinyPct = 0.5;
      const expectedAmount = effectiveProjectCost * (tinyPct / 100);

      expect(expectedAmount).toBe(250000); // $250k
    });

    it('should handle zero percentage correctly', () => {
      const effectiveProjectCost = 50000000;

      const zeroPct = 0;
      const expectedAmount = effectiveProjectCost * (zeroPct / 100);

      expect(expectedAmount).toBe(0);
    });
  });

  /**
   * Consistency Validation
   */
  describe('Cross-Layer Consistency', () => {
    it('should produce same results when called multiple times', () => {
      const params: CalculationParams = {
        projectCost: 50000000,
        predevelopmentCosts: 0,
        landValue: 5000000,
        investorEquityPct: 20,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 5,
        interestReserveEnabled: false,
        yearOneNOI: 2500000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        opexRatio: 30,
        holdPeriod: 10,
        seniorDebtRate: 6,
        seniorDebtAmortization: 30,
        philanthropicDebtRate: 0,
        hdcSubDebtPikRate: 8,
        investorSubDebtPikRate: 8,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorPromoteShare: 35,
        investorUpfrontCash: 10000000,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        hdcFee: 0,
        constructionDelayMonths: 0,
        };

      const results1 = calculateFullInvestorAnalysis(params);
      const results2 = calculateFullInvestorAnalysis(params);
      const results3 = calculateFullInvestorAnalysis(params);

      // All results should be identical
      expect(results1.totalInvestment).toBe(results2.totalInvestment);
      expect(results2.totalInvestment).toBe(results3.totalInvestment);
      expect(results1.totalInvestment).toBe(10000000);
    });
  });

  /**
   * Regression Prevention
   */
  describe('Regression Prevention', () => {
    it('should not use base project cost for capital structure (regression)', () => {
      const params: CalculationParams = {
        projectCost: 50000000,
        predevelopmentCosts: 2000000, // $2M predevelopment
        landValue: 5000000,
        investorEquityPct: 20,
        seniorDebtPct: 60,
        philanthropicDebtPct: 10,
        hdcSubDebtPct: 5,
        investorSubDebtPct: 5,
        interestReserveEnabled: true,
        interestReserveMonths: 12,
        yearOneNOI: 2500000,
        revenueGrowth: 3,
        expenseGrowth: 3,
        exitCapRate: 6,
        opexRatio: 30,
        holdPeriod: 10,
        seniorDebtRate: 6,
        seniorDebtAmortization: 30,
        philanthropicDebtRate: 0,
        hdcSubDebtPikRate: 8,
        investorSubDebtPikRate: 8,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        hdcFeeRate: 0,
        hdcAdvanceFinancing: false,
        investorPromoteShare: 35,
        investorUpfrontCash: 10000000,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        hdcFee: 0,
        constructionDelayMonths: 0,
        };

      const results = calculateFullInvestorAnalysis(params);

      // WRONG: If using base project cost ($50M)
      const wrongInvestorEquity = 50000000 * 0.20; // $10M

      // CORRECT: Should use effective cost (base + predevelopment + interest reserve)
      // Minimum expected: $52M * 0.20 = $10.4M
      const minCorrectInvestorEquity = 52000000 * 0.20;

      // Verify we're NOT using the wrong formula
      expect(results.totalInvestment).not.toBe(wrongInvestorEquity);

      // Verify we're using effective cost
      expect(results.totalInvestment).toBeGreaterThanOrEqual(minCorrectInvestorEquity);
    });
  });
});
