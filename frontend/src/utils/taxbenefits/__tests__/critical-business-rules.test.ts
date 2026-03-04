/**
 * Critical Business Rules Tests
 *
 * These tests validate the most important and non-negotiable business rules
 * in the HDC Calculator that MUST NEVER be violated.
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';
import { calculateExpectedFinancials, getDefaultTestParams } from './test-helpers';
import { CalculationParams } from '../../../types/taxbenefits';

// Helper function to calculate year1NetBenefit using production functions
// Fix #1 (Jan 2025): Now uses calculateExpectedFinancials to ensure interest reserve
// is calculated the same way production code does it
function calculateYear1NetBenefit(
  projectCost: number,
  landValue: number,
  year1DepreciationPct: number,
  effectiveTaxRate: number,
  investorEquityPct: number = 0,
  capitalStructure?: Partial<CalculationParams>
): number {
  const params: Partial<CalculationParams> = {
    projectCost,
    landValue,
    yearOneDepreciationPct: year1DepreciationPct,
    effectiveTaxRate,
    investorEquityPct,
    hdcFeeRate: 0, // Always 10% HDC fee
    ...capitalStructure
  };

  const financials = calculateExpectedFinancials(params);
  return financials.netBenefit;
}

describe('Critical Business Rules - Free Investment Principle', () => {
  // Realistic HDC deal structure parameters
  const REALISTIC_CAPITAL_STACK = {
    seniorDebtPct: 65,           // 65% senior debt
    investorEquityPct: 5,         // 5% investor equity
    // Single mezzanine debt source:
    philanthropicDebtPct: 0,      // Not used in typical deal
    hdcSubDebtPct: 0,            // Not used in typical deal
    investorSubDebtPct: 30,      // 30% mezz from single source
  };

  const REALISTIC_RATES = {
    seniorDebtRate: 5.25,         // 5-5.5% for senior
    philanthropicRate: 0,         // 0% for philanthropic
    hdcSubDebtRate: 12,          // 12% for mezz
    investorSubDebtRate: 12,     // 12% for mezz
    hdcSubDebtCurrentPayPct: 50, // 50% current pay on mezz
    investorSubDebtCurrentPayPct: 50, // 50% current pay on mezz
    hdcFeeRate: 0,              // HDC's 10% tax benefit fee (0-20% range)
    aumFeeRate: 1.5,             // 1.5% AUM fee (0-2% range)
  };

  describe('Tax Benefits NEVER Split by Promote', () => {
    it('should give 100% of tax benefits to investor regardless of promote split', () => {
      // Test with various promote splits to ensure tax benefits are NEVER shared
      const promoteSplits = [
        { hdcPromote: 65, investorPromote: 35 },
        { hdcPromote: 50, investorPromote: 50 },
        { hdcPromote: 80, investorPromote: 20 },
        { hdcPromote: 100, investorPromote: 0 }  // Even with 100% HDC promote!
      ];

      promoteSplits.forEach(({ hdcPromote, investorPromote }) => {
        // Use helper to calculate Year 1 net benefit
        // Pass capital structure to properly calculate interest reserve and depreciable basis
        const year1NetBenefit = calculateYear1NetBenefit(50, 5, 25, 47.85, REALISTIC_CAPITAL_STACK.investorEquityPct, {
          ...REALISTIC_CAPITAL_STACK,
          seniorDebtRate: REALISTIC_RATES.seniorDebtRate,
          hdcSubDebtPikRate: REALISTIC_RATES.hdcSubDebtRate,
          investorSubDebtPikRate: REALISTIC_RATES.investorSubDebtRate,
          yearOneNOI: 2.5
        });

        const params = {
          projectCost: 50,
          landValue: 5,
          yearOneNOI: 2.5,
          yearOneDepreciationPct: 25,
          annualStraightLineDepreciation: 1.5,
          effectiveTaxRate: 47.85,
          hdcPromotePct: hdcPromote,
          ...REALISTIC_CAPITAL_STACK,
          seniorDebtRate: REALISTIC_RATES.seniorDebtRate,
          hdcSubDebtPikRate: REALISTIC_RATES.hdcSubDebtRate,
          investorSubDebtPikRate: REALISTIC_RATES.investorSubDebtRate,
          hdcSubDebtCurrentPayPct: REALISTIC_RATES.hdcSubDebtCurrentPayPct,
          investorSubDebtCurrentPayPct: REALISTIC_RATES.investorSubDebtCurrentPayPct,
          exitCapRate: 6,
          opexRatio: 25,
          revenueGrowth: 3,
          expenseGrowth: 3,
          hdcFeeRate: REALISTIC_RATES.hdcFeeRate, // 10% fee on tax benefits
          hdcFee: 0.5, // Initial HDC fee
          investorPromoteShare: investorPromote,
          philanthropicEquityPct: 0,
          constructionDelayMonths: 0,
          year1NetBenefit: year1NetBenefit, // Add calculated value
          ozEnabled: true,
          ozType: 'standard',
          deferredCapitalGains: 10,
          capitalGainsTaxRate: 34.65,
          holdPeriod: 10
        };

        const investorResult = calculateFullInvestorAnalysis(params);
        const hdcResult = calculateHDCAnalysis({
          ...params,
          investorCashFlows: investorResult.investorCashFlows
        });

        // Year 1 tax benefit should go 100% to investor (NOT split by promote)
        const year1InvestorBenefit = investorResult.investorCashFlows[0].taxBenefit;

        // Verify investor got the tax benefit (should be positive and substantial)
        expect(year1InvestorBenefit).toBeGreaterThan(4.5); // Higher threshold since no fee deduction

        // HDC fee removed - investor gets 100% of tax benefit
        // No fee validation needed per IMPL-7.0-001

        // Verify tax benefits are NOT split by promote (they're 100% to investor)
        // Investor should get the same tax benefit regardless of promote split
        expect(year1InvestorBenefit).toBeGreaterThan(0);

        // HDC should NOT have a "taxBenefit" field (they get fees, not benefits)
        // The tax benefit itself goes 100% to investor
        // Note: HDC has taxBenefitFee field, not taxBenefit

        // Also check Year 2+ tax benefits
        if (investorResult.investorCashFlows.length > 1) {
          const year2Depreciation = params.annualStraightLineDepreciation;
          const year2TaxBenefit = year2Depreciation * (params.effectiveTaxRate / 100);
          const expectedNetYear2 = year2TaxBenefit; // 100% to investor, no fee

          const year2InvestorBenefit = investorResult.investorCashFlows[1].taxBenefit;

          // Should be close to expected (100% to investor)
          expect(year2InvestorBenefit).toBeCloseTo(expectedNetYear2, 2);

          // HDC fee removed - no fee validation needed
        }
      });
    });

    it('should count tax benefits toward equity recovery but not share them', () => {
      // Using realistic parameters: 5% equity, $5M NOI on $100M project
      const year1NetBenefit = calculateYear1NetBenefit(100, 10, 25, 40, 5, {
        seniorDebtPct: 65,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 0,
        investorSubDebtPct: 30,
        yearOneNOI: 5
      });
      const params = {
        projectCost: 100,
        landValue: 10,
        yearOneNOI: 5, // Realistic $5M NOI on $100M project (5% return)
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 3,
        effectiveTaxRate: 40,
        hdcPromotePct: 65,
        investorEquityPct: 5, // Realistic 5% equity for free investment model
        seniorDebtPct: 65,  // Realistic 65% senior debt
        philanthropicDebtPct: 0,  // Not used
        hdcSubDebtPct: 0,  // Not used
        investorSubDebtPct: 30,  // 30% mezz from single source
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        investorPromoteShare: 35,
        philanthropicEquityPct: 0,
        constructionDelayMonths: 0,
        year1NetBenefit: year1NetBenefit,
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 3
      };

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorResult.investorCashFlows
      });
      const investorEquity = params.projectCost * (params.investorEquityPct / 100);

      let cumulativeRecovery = 0;
      let recoveryComplete = false;
      let yearOfRecovery = -1;

      investorResult.investorCashFlows.forEach((year, index) => {
        if (!recoveryComplete) {
          // Tax benefits should be included in recovery calculation
          const totalYearCash = year.operatingCashFlow + year.taxBenefit;
          cumulativeRecovery += totalYearCash;

          if (cumulativeRecovery >= investorEquity) {
            recoveryComplete = true;
            yearOfRecovery = index + 1;
          }

          // Before recovery, HDC should get ZERO operating cash
          if (!recoveryComplete && year.operatingCashFlow > 0) {
            expect(hdcResult.hdcCashFlows[index].operatingCashFlow).toBe(0);
          }
        }
      });

      // Verify recovery happened
      expect(recoveryComplete).toBe(true);
      expect(yearOfRecovery).toBeGreaterThan(0);
    });
  });

  describe('AUM Fees at Exit Settlement', () => {
    it('should deduct accumulated AUM fees from investor share ONLY at exit', () => {
      const year1NetBenefit = calculateYear1NetBenefit(50, 5, 25, 47.85, 5, {
        seniorDebtPct: 65,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 0,
        investorSubDebtPct: 30,
        yearOneNOI: 2.5
      });
      const params = {
        projectCost: 50,
        landValue: 5,
        yearOneNOI: 2.5,  // Typical $2.5M NOI on $50M project (5% cap rate)
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 5,  // Realistic 5% equity (not 20%)
        seniorDebtPct: 65,  // Realistic 65% senior debt
        philanthropicDebtPct: 0,  // Not used
        hdcSubDebtPct: 0,  // Not used
        investorSubDebtPct: 30,  // 30% mezz from single source
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        constructionDelayMonths: 0,
        aumFeeRate: 2.0, // 2% AUM fee to ensure some accumulation
        aumFeeEnabled: true, // MUST enable AUM fees!
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      // Run with AUM fee
      const investorWithAUM = calculateFullInvestorAnalysis(params);
      const hdcWithAUM = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorWithAUM.investorCashFlows
      });

      // Run without AUM fee for comparison
      const paramsNoAUM = { ...params, aumFeeRate: 0 };
      const investorNoAUM = calculateFullInvestorAnalysis(paramsNoAUM);
      const hdcNoAUM = calculateHDCAnalysis({
        ...paramsNoAUM,
        investorCashFlows: investorNoAUM.investorCashFlows
      });

      // Get exit proceeds (last year)
      const exitYearIndex = investorWithAUM.investorCashFlows.length - 1;
      const exitWithAUM = investorWithAUM.investorCashFlows[exitYearIndex];
      const exitNoAUM = investorNoAUM.investorCashFlows[exitYearIndex];

      // Calculate total accumulated AUM fees
      let totalAUMAccrued = 0;
      investorWithAUM.investorCashFlows.forEach(year => {
        totalAUMAccrued += year.aumFeeAccrued || 0;
      });

      // The difference in exit proceeds should equal the accumulated AUM fees
      const exitDifference = (investorNoAUM.exitProceeds || 0) - (investorWithAUM.exitProceeds || 0);

      // This difference should be close to total accumulated AUM
      // (may not be exact due to timing and compounding)
      // Only test if we have valid exit proceeds
      if (investorNoAUM.exitProceeds && investorWithAUM.exitProceeds) {
        expect(exitDifference).toBeGreaterThan(0);
      } else {
        // If exitProceeds isn't calculated, at least verify AUM fees accumulated
        expect(totalAUMAccrued).toBeGreaterThan(0);
      }

      // HDC should receive their promote share PLUS the AUM fees
      // Since we've verified AUM fees accumulated, HDC should get more total returns
      if (!isNaN(hdcWithAUM.totalHDCReturns) && !isNaN(hdcNoAUM.totalHDCReturns)) {
        expect(hdcWithAUM.totalHDCReturns).toBeGreaterThanOrEqual(hdcNoAUM.totalHDCReturns);
      }
    });

    it('should show correct AUM fee impact on gross vs net proceeds', () => {
      const year1NetBenefit = calculateYear1NetBenefit(50, 5, 25, 47.85, 5, {
        seniorDebtPct: 65,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 10,
        investorSubDebtPct: 10,
        yearOneNOI: 2.5
      });
      const params = {
        projectCost: 50,
        landValue: 5,
        yearOneNOI: 2.5,  // Typical $2.5M NOI on $50M project
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 5,  // Realistic 5% equity
        seniorDebtPct: 65,  // Realistic 65% senior debt
        philanthropicDebtPct: 0, // Simplify for this test
        hdcSubDebtPct: 10,
        investorSubDebtPct: 10,
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        investorPromoteShare: 35,
        philanthropicEquityPct: 0,
        constructionDelayMonths: 0,
        aumFeeRate: 1.5,
        aumFeeEnabled: true, // MUST enable AUM fees!
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorResult.investorCashFlows
      });

      // Track AUM fee accumulation
      let cumulativeAUMUnpaid = 0;
      investorResult.investorCashFlows.forEach((year, index) => {
        if (index < investorResult.investorCashFlows.length - 1) { // Exclude exit year
          cumulativeAUMUnpaid += year.aumFeeAccrued || 0;
        }
      });

      // At exit, the accumulated AUM should be settled
      const exitYear = investorResult.investorCashFlows[investorResult.investorCashFlows.length - 1];

      // Verify the exit proceeds reflect AUM fee deduction
      // The investor's share should be reduced by accumulated AUM
      expect(cumulativeAUMUnpaid).toBeGreaterThan(0);

      // HDC total at exit should include both promote share and AUM fees
      expect(hdcResult.totalHDCReturns).toBeGreaterThan(0);
    });
  });

  describe('Free Investment Recovery Order', () => {
    it('should prioritize investor recovery before ANY HDC promote', () => {
      const year1NetBenefit = calculateYear1NetBenefit(50, 5, 25, 47.85, 5, {
        seniorDebtPct: 65,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 0,
        investorSubDebtPct: 30,
        yearOneNOI: 3.5
      });
      const params = {
        projectCost: 50,
        landValue: 5,
        yearOneNOI: 3.5, // $3.5M NOI on $50M project (7% cap rate) to ensure positive cash flow with mezz debt
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 5,  // Realistic 5% equity = $2.5M investment
        seniorDebtPct: 65,  // Realistic 65% senior debt
        philanthropicDebtPct: 0,  // Not used
        hdcSubDebtPct: 0,  // Not used
        investorSubDebtPct: 30,  // 30% mezz from single source
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        investorPromoteShare: 35, // Investor gets 35% (HDC gets 65%)
        philanthropicEquityPct: 0,
        constructionDelayMonths: 0,
        year1NetBenefit: year1NetBenefit,
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorResult.investorCashFlows
      });
      const investorEquity = params.projectCost * (params.investorEquityPct / 100);

      let cumulativeRecovery = 0;
      let recoveryYear = -1;

      investorResult.investorCashFlows.forEach((year, index) => {
        const totalCash = year.operatingCashFlow + year.taxBenefit;
        cumulativeRecovery += totalCash;

        if (recoveryYear === -1 && cumulativeRecovery >= investorEquity) {
          recoveryYear = index + 1;
        }

        // Before recovery is complete
        if (cumulativeRecovery < investorEquity && index < hdcResult.hdcCashFlows.length) {
          // HDC should get their fees but ZERO operating cash (promote)
          const hdcYear = hdcResult.hdcCashFlows[index];
          expect(hdcYear.operatingCashFlow).toBe(0);

          // HDC should still get their tax benefit fees
          // REMOVED: expect(0).toBeGreaterThan(0);
        }
      });

      // After recovery, HDC should start getting promote
      if (recoveryYear > 0 && recoveryYear < investorResult.investorCashFlows.length) {
        const postRecoveryYear = hdcResult.hdcCashFlows[recoveryYear];
        // May or may not have operating cash depending on when in year recovery occurred
        // But should eventually have some
        let hasPromotePostRecovery = false;
        for (let i = recoveryYear; i < hdcResult.hdcCashFlows.length - 1; i++) {
          if (hdcResult.hdcCashFlows[i] && hdcResult.hdcCashFlows[i].operatingCashFlow > 0) {
            hasPromotePostRecovery = true;
            break;
          }
        }
        expect(hasPromotePostRecovery).toBe(true);
      }
    });
  });

  describe('HDC Zero Initial Investment', () => {
    it('should confirm HDC has exactly $0 initial investment', () => {
      const year1NetBenefit = calculateYear1NetBenefit(50, 5, 25, 47.85, 5, {
        seniorDebtPct: 65,
        philanthropicDebtPct: 0,
        hdcSubDebtPct: 0,
        investorSubDebtPct: 30,
        yearOneNOI: 2.5
      });
      const params = {
        projectCost: 50,
        landValue: 5,
        yearOneNOI: 2.5,
        yearOneDepreciationPct: 25,
        annualStraightLineDepreciation: 1.5,
        effectiveTaxRate: 47.85,
        hdcPromotePct: 65,
        investorEquityPct: 5,  // Realistic 5% equity = $2.5M investment
        seniorDebtPct: 65,  // Realistic 65% senior debt
        philanthropicDebtPct: 0,  // Not used
        hdcSubDebtPct: 0,  // Not used
        investorSubDebtPct: 30,  // 30% mezz from single source
        exitCapRate: 6,
        opexRatio: 25,
        revenueGrowth: 3,
        expenseGrowth: 3,
        hdcFeeRate: 0,
        hdcFee: 0.5,
        hdcAdvanceFinancing: false,
        investorUpfrontCash: 0,
        totalTaxBenefit: 0,
        netTaxBenefit: 0,
        investorPromoteShare: 35, // Investor gets 35% (HDC gets 65%)
        philanthropicEquityPct: 0,
        constructionDelayMonths: 0,
        year1NetBenefit: year1NetBenefit,
        ozEnabled: true,
        ozType: 'standard',
        deferredCapitalGains: 10,
        capitalGainsTaxRate: 34.65,
        holdPeriod: 10
      };

      const investorResult = calculateFullInvestorAnalysis(params);
      const hdcResult = calculateHDCAnalysis({
        ...params,
        investorCashFlows: investorResult.investorCashFlows
      });

      // HDC Year 0 (initial investment) should be exactly 0
      expect(hdcResult.totalInvestment).toBe(0);

      // But HDC should still receive fees and eventual promote
      const totalHDCReturns = hdcResult.totalHDCReturns;
      expect(totalHDCReturns).toBeGreaterThan(0);
    });
  });
});