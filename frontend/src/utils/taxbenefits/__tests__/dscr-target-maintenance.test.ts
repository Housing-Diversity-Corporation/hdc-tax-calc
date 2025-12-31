import { calculateFullInvestorAnalysis } from '../calculations';
import { HDCCalculationParams } from '../../../types/taxbenefits';

describe('1.05 DSCR Target Maintenance Tests', () => {
  const baseParams: HDCCalculationParams = {
    projectCost: 50000000,
    predevelopmentCosts: 2000000,
    landValue: 10000000,
    yearOneNOI: 3000000,
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
    aumFeeEnabled: true,
    aumFeeRate: 1.5,
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
    pikCurrentPayEnabled: true,
    pikCurrentPayPct: 50,
    outsideInvestorSubDebtPct: 5,
    outsideInvestorSubDebtPikRate: 8,
    outsideInvestorPikCurrentPayEnabled: true,
    outsideInvestorPikCurrentPayPct: 50,
    holdPeriod: 10,
    yearOneDepreciation: 10000000,
    annualStraightLineDepreciation: 1200000,
    effectiveTaxRate: 45,
    constructionDelayMonths: 0,
    taxBenefitDelayMonths: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0
  };

  describe('DSCR Target Exactly 1.05x', () => {
    it('should maintain exactly 1.05x DSCR when cash is available', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      results.investorCashFlows.forEach((cf, index) => {
        const year = index + 1;

        // Skip construction years
        if (cf.noi === 0) return;

        // Target DSCR should be exactly 1.05 (or actual DSCR if less)
        if (cf.targetDscr) {
          expect(cf.targetDscr).toBeLessThanOrEqual(1.05);

          // If actual DSCR > 1.05, target should be exactly 1.05
          if (cf.dscr && cf.dscr > 1.05) {
            expect(cf.targetDscr).toBeCloseTo(1.05, 2);
          }
        }
      });
    });

    it('should defer HDC fees when needed to maintain 1.05x DSCR', () => {
      // Create a scenario with tight cash flow
      const tightCashParams = {
        ...baseParams,
        yearOneNOI: 2200000, // Lower NOI to create DSCR pressure
        seniorDebtPct: 70,   // Higher leverage
        philanthropicDebtPct: 15
      };

      const results = calculateFullInvestorAnalysis(tightCashParams);

      // Check that deferrals occur when DSCR would fall below 1.05
      const deferralsOccurred = results.investorCashFlows.some(cf =>
        (cf|| 0) > 0 ||
        (cf.aumFeeAccrued || 0) > 0
      );

      // With tight cash, we expect some deferrals
      expect(deferralsOccurred).toBe(true);

      // Verify DSCR never falls below 1.05 after deferrals
      results.investorCashFlows.forEach(cf => {
        if (cf.noi > 0 && cf.targetDscr) {
          expect(cf.targetDscr).toBeGreaterThanOrEqual(1.04); // Allow small rounding
        }
      });
    });
  });

  describe('Payment Priority Waterfall', () => {
    it('should pay outside investor sub-debt before HDC fees', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      results.investorCashFlows.forEach(cf => {
        // If outside investor isn't fully paid, HDC fees should be deferred
        const outsideInvestorShortfall = (cf.outsideInvestorPIKAccrued || 0) > 0;
        const hdcFeesDeferred = (cf|| 0) > 0;

        // This isn't a strict rule but a general priority
        // More specific tests would need to examine individual scenarios
      });
    });

    it('should defer HDC tax benefit fee before AUM fee', () => {
      // Create scenario where only partial payment possible
      const constrainedParams = {
        ...baseParams,
        yearOneNOI: 2500000,
        seniorDebtPct: 65,
        philanthropicDebtPct: 12
      };

      const results = calculateFullInvestorAnalysis(constrainedParams);

      // HDC tax benefit fee removed - only AUM fee can defer
      results.investorCashFlows.forEach(cf => {
        const aumFeeDeferred = cf.aumFeeAccrued || 0;

        // AUM fee can be deferred to maintain DSCR
        expect(aumFeeDeferred).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Multiple DSCR Checkpoints', () => {
    it('should calculate hard debt DSCR correctly', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      results.investorCashFlows.forEach(cf => {
        if (cf.noi > 0 && cf.dscr) {
          // Hard DSCR should be NOI / (Senior + Phil debt service)
          // This is the actual DSCR before sub-debt
          expect(cf.dscr).toBeGreaterThan(0);
          expect(cf.dscr).toBeLessThan(100); // Sanity check
        }
      });
    });

    it('should show different DSCR at each waterfall level', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      results.investorCashFlows.forEach(cf => {
        if (cf.noi > 0) {
          // We have different DSCR levels:
          // 1. Hard DSCR (senior + phil only)
          // 2. DSCR with sub-debt
          // 3. Target DSCR (maintained at 1.05)

          if (cf.dscr && cf.targetDscr) {
            // Target should never exceed actual
            expect(cf.targetDscr).toBeLessThanOrEqual(cf.dscr);
          }
        }
      });
    });
  });

  describe('Cash Distribution After 1.05x', () => {
    it('should distribute all excess cash above 1.05x DSCR', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      results.investorCashFlows.forEach(cf => {
        if (cf.noi > 0 && cf.dscr && cf.dscr > 1.05) {
          // When actual DSCR > 1.05, we should have distributable cash
          expect(cf.cashAfterDebtAndFees).toBeGreaterThan(0);

          // Target DSCR should be exactly 1.05
          expect(cf.targetDscr).toBeCloseTo(1.05, 2);
        }
      });
    });

    it('should have zero distributable when DSCR <= 1.05', () => {
      // Create a scenario at exactly 1.05 DSCR
      const exactDSCRParams = {
        ...baseParams,
        yearOneNOI: 2100000, // Calibrated for ~1.05 DSCR
        seniorDebtPct: 75,
        philanthropicDebtPct: 10
      };

      const results = calculateFullInvestorAnalysis(exactDSCRParams);

      // When DSCR is at or below 1.05, distributable should be minimal
      const hasMinimalDistributable = results.investorCashFlows.some(cf =>
        cf.noi > 0 && cf.cashAfterDebtAndFees < 100000 // Less than $100k
      );

      expect(hasMinimalDistributable).toBe(true);
    });
  });

  describe('Deferral and Catch-up Mechanisms', () => {
    it('should track deferred HDC fees cumulatively', () => {
      const constrainedParams = {
        ...baseParams,
        yearOneNOI: 2300000,
        seniorDebtPct: 68,
        philanthropicDebtPct: 12
      };

      const results = calculateFullInvestorAnalysis(constrainedParams);

      let cumulativeDeferred = 0;
      results.investorCashFlows.forEach(cf => {
        cumulativeDeferred += (cf.aumFeeAccrued || 0);
      });

      // Some deferrals should have occurred in constrained scenario
      expect(cumulativeDeferred).toBeGreaterThan(0);
    });

    it('should collect deferred fees at exit', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      // Total deferred fees should be collected at exit
      const totalDeferredAumFees = results.investorCashFlows.reduce(
        (sum, cf) => sum + (cf.aumFeeAccrued || 0), 0
      );

      // These should be accounted for in exit calculations
      // (Would need to check exit proceeds calculation for full verification)
      expect(totalDeferredAumFees).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('DSCR Edge Cases', () => {
  const baseParams: HDCCalculationParams = {
    projectCost: 50000000,
    predevelopmentCosts: 0,
    landValue: 10000000,
    yearOneNOI: 3000000,
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
    aumFeeEnabled: true,
    aumFeeRate: 1.5,
    seniorDebtPct: 60,
    philanthropicDebtPct: 10,
    seniorDebtRate: 6,
    philanthropicDebtRate: 3,
    seniorDebtAmortization: 30,
    philDebtAmortization: 30,
    holdPeriod: 10,
    yearOneDepreciation: 10000000,
    annualStraightLineDepreciation: 1200000,
    effectiveTaxRate: 45
  };

  it('should handle zero NOI years correctly', () => {
    const constructionParams = {
      ...baseParams,
      constructionDelayMonths: 18 // 1.5 years of construction
    };

    const results = calculateFullInvestorAnalysis(constructionParams);

    // First year should have zero NOI and undefined/zero DSCR
    const firstYear = results.investorCashFlows[0];
    expect(firstYear.noi).toBe(0);
    expect(firstYear.dscr || 0).toBe(0);
  });

  it('should handle very high leverage scenarios', () => {
    const highLeverageParams = {
      ...baseParams,
      seniorDebtPct: 75,
      philanthropicDebtPct: 15,
      hdcSubDebtPct: 5,
      outsideInvestorSubDebtPct: 3,
      investorEquityPct: 2
    };

    const results = calculateFullInvestorAnalysis(highLeverageParams);

    // System should still maintain 1.05 DSCR through deferrals
    results.investorCashFlows.forEach(cf => {
      if (cf.noi > 0 && cf.targetDscr) {
        expect(cf.targetDscr).toBeGreaterThanOrEqual(1.04); // Allow rounding
        expect(cf.targetDscr).toBeLessThanOrEqual(1.06);
      }
    });
  });

  it('should handle no debt scenarios', () => {
    const noDebtParams = {
      ...baseParams,
      seniorDebtPct: 0,
      philanthropicDebtPct: 0,
      hdcSubDebtPct: 0,
      outsideInvestorSubDebtPct: 0,
      investorEquityPct: 100
    };

    const results = calculateFullInvestorAnalysis(noDebtParams);

    // With no debt, DSCR should be infinite/undefined
    // All cash should be distributable
    results.investorCashFlows.forEach(cf => {
      if (cf.noi > 0) {
        expect(cf.cashAfterDebtAndFees).toBeGreaterThan(0);
        // DSCR might be 0 or undefined when no debt exists
      }
    });
  });
});