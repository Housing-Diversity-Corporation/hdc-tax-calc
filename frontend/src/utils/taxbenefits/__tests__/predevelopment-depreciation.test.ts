import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateDepreciableBasis } from '../depreciableBasisUtility';
import { HDCCalculationParams } from '../../../types/taxbenefits';

describe('Predevelopment Costs - Depreciable Basis Integration Tests', () => {
  /**
   * These tests validate that predevelopment costs are correctly included
   * in depreciable basis calculations across all code paths in calculations.ts.
   *
   * CRITICAL BUG FIX (January 2025):
   * Previously, calculations.ts used inline depreciable basis calculations that
   * excluded predevelopmentCosts, causing ~5% understatement of tax benefits.
   *
   * This test suite ensures all 4 calculation points now use the shared
   * calculateDepreciableBasis() utility function that correctly includes
   * predevelopmentCosts in the basis.
   */

  const baseParams: HDCCalculationParams = {
    projectCost: 50000000,
    predevelopmentCosts: 2000000, // $2M in predevelopment
    landValue: 10000000,
    yearOneNOI: 3000000,
    yearOneDepreciationPct: 25,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6,
    investorEquityPct: 20,
    hdcFeeRate: 0,
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    netTaxBenefit: 0,
    hdcFee: 0,
    year1NetBenefit: 0,
    investorPromoteShare: 35,
    opexRatio: 40,
    aumFeeEnabled: false,
    aumFeeRate: 0,
    seniorDebtPct: 60,
    philanthropicDebtPct: 10,
    seniorDebtRate: 6,
    philanthropicDebtRate: 3,
    seniorDebtAmortization: 30,
    philDebtAmortization: 30,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,
    hdcSubDebtPct: 5,
    hdcSubDebtPikRate: 8,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 50,
    holdPeriod: 10,
    yearOneDepreciation: 0, // Auto-calculated
    annualStraightLineDepreciation: 0, // Auto-calculated
    effectiveTaxRate: 45,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0
  };

  describe('Location 1: Auto-calculated Straight-Line Depreciation', () => {
    it('should include predevelopment costs when auto-calculating annualStraightLineDepreciation', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      // Calculate expected depreciable basis using utility function
      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Expected values (IRS MACRS: 27.5-year residential rental property with mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const expectedRemainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const expectedAnnualDepreciation = expectedRemainingBasis / 27.5;

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth;
      const year1MACRS = (monthsInYear1 / 12) * expectedAnnualDepreciation;
      const totalYear1Depreciation = bonusDepreciation + year1MACRS;

      // Verify Year 1 cash flow has correct depreciation
      const year1CashFlow = results.investorCashFlows[0];
      const year1TaxBenefit = year1CashFlow.taxBenefit;
      const expectedYear1TaxBenefit = totalYear1Depreciation * (baseParams.effectiveTaxRate / 100); // Net of HDC fee

      expect(year1TaxBenefit).toBeCloseTo(expectedYear1TaxBenefit, 0);

      // Verify Years 2-10 use correct straight-line depreciation
      for (let i = 1; i < 10; i++) {
        const cashFlow = results.investorCashFlows[i];
        const expectedAnnualTaxBenefit = expectedAnnualDepreciation * (baseParams.effectiveTaxRate / 100);
        expect(cashFlow.taxBenefit).toBeCloseTo(expectedAnnualTaxBenefit, 0);
      }
    });
  });

  describe('Location 2: Year 1 Depreciation in Cash Flow Loop', () => {
    it('should include predevelopment costs in Year 1 bonus depreciation calculation', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;
      const expectedGrossTaxBenefit = expectedYear1Depreciation * (baseParams.effectiveTaxRate / 100);
      const expectedHDCFee = 0; // Fee removed per IMPL-7.0-001
      const expectedNetTaxBenefit = expectedGrossTaxBenefit; // 100% to investor

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetTaxBenefit, 0);
    });
  });

  describe('Location 3 & 4: HDC Advance Financing Scenarios', () => {
    it('should include predevelopment costs with HDC advance financing (no delay)', () => {
      const advanceParams = {
        ...baseParams,
        hdcAdvanceFinancing: true,
        taxBenefitDelayMonths: 0
      };

      const results = calculateFullInvestorAnalysis(advanceParams);

      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;
      const expectedGrossBenefit = expectedYear1Depreciation * (baseParams.effectiveTaxRate / 100);
      const expectedNetBenefit = expectedGrossBenefit; // Net of 10% HDC fee

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedNetBenefit, 0);
    });

    it('should include predevelopment costs with HDC advance financing (with delay)', () => {
      const advanceDelayParams = {
        ...baseParams,
        hdcAdvanceFinancing: true,
        taxBenefitDelayMonths: 18 // 18-month delay
      };

      const results = calculateFullInvestorAnalysis(advanceDelayParams);

      // Year 1 should get advance (calculated with predevelopment included)
      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;
      const expectedYear1Benefit = expectedYear1Depreciation * (baseParams.effectiveTaxRate / 100);

      const year1CashFlow = results.investorCashFlows[0];
      expect(year1CashFlow.taxBenefit).toBeCloseTo(expectedYear1Benefit, 0);

      // Year 2 with delay=18 (delayFullYears=1, delayFraction=0.5):
      // Year 1 was advance-financed (not scheduled into pending array)
      // Year 2's earned benefit → 50% to Year 3, 50% to Year 4
      // So Year 2 realizes 0 from pending array
      const year2CashFlow = results.investorCashFlows[1];
      expect(year2CashFlow.taxBenefit).toBe(0);
    });
  });

  describe('Comparative Impact Analysis', () => {
    it('should show $2M predevelopment creates ~$400K higher depreciation basis', () => {
      const withoutPredevelopment: HDCCalculationParams = {
        ...baseParams,
        predevelopmentCosts: 0
      };

      const withPredevelopment: HDCCalculationParams = {
        ...baseParams,
        predevelopmentCosts: 2000000
      };

      const resultsWithout = calculateFullInvestorAnalysis(withoutPredevelopment);
      const resultsWith = calculateFullInvestorAnalysis(withPredevelopment);

      // Calculate expected difference in depreciable basis
      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // $2M predevelopment = $2M additional basis (full amount, no equity exclusion)
      const expectedBasisIncrease = 2000000;

      // Year 1: includes BOTH bonus AND partial MACRS (mid-month convention)
      const bonusIncrease = expectedBasisIncrease * 0.25;
      const remainingBasisIncrease = expectedBasisIncrease - bonusIncrease;
      const annualMACRSIncrease = remainingBasisIncrease / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRSIncrease = (monthsInYear1 / 12) * annualMACRSIncrease;

      const expectedYear1DepreciationIncrease = bonusIncrease + year1MACRSIncrease;
      const expectedYear1TaxBenefitIncrease = expectedYear1DepreciationIncrease * 0.45; // 45% tax rate, net of HDC fee

      const actualYear1Increase = resultsWith.investorCashFlows[0].taxBenefit -
                                   resultsWithout.investorCashFlows[0].taxBenefit;

      expect(actualYear1Increase).toBeCloseTo(expectedYear1TaxBenefitIncrease, 0);

      // Total 10-year impact
      const totalBenefitWith = resultsWith.investorCashFlows.reduce((sum, cf) => sum + cf.taxBenefit, 0);
      const totalBenefitWithout = resultsWithout.investorCashFlows.reduce((sum, cf) => sum + cf.taxBenefit, 0);
      const totalIncrease = totalBenefitWith - totalBenefitWithout;

      // IMPL-7.0-012: Investor equity is NOT excluded from depreciable basis
      // $2M predevelopment increases basis by full $2M
      // Expected total: $2M basis * 47.85% tax rate over 10 years
      // Due to DSCR management and deferrals, actual realized benefit may be ~50% of theoretical
      expect(totalIncrease).toBeGreaterThan(0);
      expect(totalIncrease).toBeGreaterThan(400000); // At least $400K increase
      expect(totalIncrease).toBeLessThan(900000); // Less than $900K
    });

    it('should maintain consistency between utility function and inline calculations', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      // Calculate using shared utility (source of truth)
      const utilityDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Reverse-calculate from Year 1 tax benefit
      const year1TaxBenefit = results.investorCashFlows[0].taxBenefit;
      const year1GrossBenefit = year1TaxBenefit; // No HDC fee (removed per IMPL-7.0-001)
      const year1Depreciation = year1GrossBenefit / (baseParams.effectiveTaxRate / 100);

      // Year 1 includes BOTH bonus AND partial MACRS (mid-month convention)
      // We need to solve for the basis that produces this depreciation
      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months

      // year1Depreciation = bonus + year1MACRS
      // year1Depreciation = 0.25 * basis + (monthsInYear1/12) * ((basis - 0.25*basis) / 27.5)
      // year1Depreciation = 0.25 * basis + (monthsInYear1/12) * (0.75*basis / 27.5)
      // Solve for basis:
      const year1DepreciationFactor = 0.25 + (monthsInYear1 / 12) * (0.75 / 27.5);
      const impliedDepreciableBasis = year1Depreciation / year1DepreciationFactor;

      // Should match utility function result
      expect(impliedDepreciableBasis).toBeCloseTo(utilityDepreciableBasis, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero predevelopment costs correctly', () => {
      const zeroPredevParams = {
        ...baseParams,
        predevelopmentCosts: 0
      };

      const results = calculateFullInvestorAnalysis(zeroPredevParams);

      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: 0,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;
      const expectedYear1TaxBenefit = expectedYear1Depreciation * 0.45;

      expect(results.investorCashFlows[0].taxBenefit).toBeCloseTo(expectedYear1TaxBenefit, 0);
    });

    it('should handle large predevelopment costs (>10% of project)', () => {
      const largePredevParams = {
        ...baseParams,
        predevelopmentCosts: 8000000 // $8M = 16% of project cost
      };

      const results = calculateFullInvestorAnalysis(largePredevParams);

      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: 8000000,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 1 includes BOTH bonus AND partial straight-line (mid-month convention)
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear1Depreciation = bonusDepreciation + year1MACRS;
      const expectedYear1TaxBenefit = expectedYear1Depreciation * 0.45;

      expect(results.investorCashFlows[0].taxBenefit).toBeCloseTo(expectedYear1TaxBenefit, 0);
      expect(results.investorCashFlows[0].taxBenefit).toBeGreaterThan(0);
    });

    it('should work with construction delay and predevelopment costs', () => {
      const constructionDelayParams = {
        ...baseParams,
        predevelopmentCosts: 2000000,
        constructionDelayMonths: 18
      };

      const results = calculateFullInvestorAnalysis(constructionDelayParams);

      // Year 1 should have $0 NOI (under construction)
      expect(results.investorCashFlows[0].noi).toBe(0);

      // But Year 2 should have proper depreciation with predevelopment included
      const expectedDepreciableBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: 2000000,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Year 2 is first operational year (index 1) - includes BOTH bonus AND partial MACRS
      const bonusDepreciation = expectedDepreciableBasis * 0.25;
      const remainingBasis = expectedDepreciableBasis - bonusDepreciation;
      const annualMACRS = remainingBasis / 27.5;

      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

      const expectedYear2Depreciation = bonusDepreciation + year1MACRS; // First year of depreciation
      const expectedYear2TaxBenefit = expectedYear2Depreciation * 0.45;

      // Year 2 is first operational year (index 1)
      expect(results.investorCashFlows[1].taxBenefit).toBeCloseTo(expectedYear2TaxBenefit, 0);
    });
  });

  describe('Regression Prevention', () => {
    it('should NEVER calculate depreciable basis as projectCost - land - equity (old bug)', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      // OLD (WRONG) formula that excluded predevelopment
      const oldWrongBasis = baseParams.projectCost - baseParams.landValue -
                            (baseParams.projectCost * (baseParams.investorEquityPct / 100));

      // NEW (CORRECT) formula that includes predevelopment
      const correctBasis = calculateDepreciableBasis({
        projectCost: baseParams.projectCost,
        predevelopmentCosts: baseParams.predevelopmentCosts,
        landValue: baseParams.landValue,
        investorEquityPct: baseParams.investorEquityPct
      });

      // Calculate Year 1 depreciation with mid-month convention
      const year1TaxBenefit = results.investorCashFlows[0].taxBenefit;

      // OLD formula Year 1 benefit (with mid-month convention)
      const oldBonusDepreciation = oldWrongBasis * 0.25;
      const oldRemainingBasis = oldWrongBasis - oldBonusDepreciation;
      const oldAnnualMACRS = oldRemainingBasis / 27.5;
      const placedInServiceMonth = 7; // Default mid-year
      const monthsInYear1 = 12.5 - placedInServiceMonth; // 5.5 months
      const oldYear1MACRS = (monthsInYear1 / 12) * oldAnnualMACRS;
      const oldFormulaYear1Depreciation = oldBonusDepreciation + oldYear1MACRS;
      const oldFormulaYear1Benefit = oldFormulaYear1Depreciation * 0.45;

      // NEW formula Year 1 benefit (with mid-month convention)
      const newBonusDepreciation = correctBasis * 0.25;
      const newRemainingBasis = correctBasis - newBonusDepreciation;
      const newAnnualMACRS = newRemainingBasis / 27.5;
      const newYear1MACRS = (monthsInYear1 / 12) * newAnnualMACRS;
      const newFormulaYear1Depreciation = newBonusDepreciation + newYear1MACRS;
      const newFormulaYear1Benefit = newFormulaYear1Depreciation * 0.45;

      // Verify results DON'T match old formula
      expect(year1TaxBenefit).not.toBeCloseTo(oldFormulaYear1Benefit, 0);

      // Verify results DO match new formula
      expect(year1TaxBenefit).toBeCloseTo(newFormulaYear1Benefit, 0);

      // The difference should be exactly the predevelopment impact (with mid-month convention)
      const basisDifference = correctBasis - oldWrongBasis; // Should be $1.6M
      const bonusDiff = basisDifference * 0.25;
      const remainingDiff = basisDifference - bonusDiff;
      const annualMACRSDiff = remainingDiff / 27.5;
      const year1MACRSDiff = (monthsInYear1 / 12) * annualMACRSDiff;
      const expectedDifference = (bonusDiff + year1MACRSDiff) * 0.45;
      const actualDifference = year1TaxBenefit - oldFormulaYear1Benefit;
      expect(actualDifference).toBeCloseTo(expectedDifference, 0);
    });
  });
});
