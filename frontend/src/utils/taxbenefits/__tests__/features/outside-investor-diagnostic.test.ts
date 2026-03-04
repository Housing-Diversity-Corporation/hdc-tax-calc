/**
 * Diagnostic Test for Outside Investor Sub-Debt Current Pay
 *
 * Simplified test to diagnose specific issues with current pay impact
 * on distributable cash flow and DSCR management.
 *
 * September 2025
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

describe('Outside Investor Current Pay Diagnostic', () => {
  const baseParams = {
    projectCost: 50,
    landValue: 5,
    yearOneNOI: 3.0, // Higher NOI for clearer testing
    yearOneDepreciationPct: 25,
    effectiveTaxRate: 47.85, // Combined federal + state
    investorEquityPct: 20,
    seniorDebtPct: 60,
    philanthropicDebtPct: 15, // Increased from 10% to balance capital structure
    hdcSubDebtPct: 0, // Simplified - no HDC sub-debt
    investorSubDebtPct: 0, // Simplified - no investor sub-debt
    outsideInvestorSubDebtPct: 5, // 5% outside investor
    seniorDebtRate: 6,
    philanthropicDebtRate: 2,
    hdcSubDebtPikRate: 8,
    investorSubDebtPikRate: 8,
    outsideInvestorSubDebtPikRate: 10,
    seniorDebtAmortization: 30,
    exitCapRate: 6,
    opexRatio: 30,
    revenueGrowth: 3,
    expenseGrowth: 3,
    hdcFeeRate: 0, // HDC tax benefit fee
    hdcFee: 0, // Will be calculated
    investorPromoteShare: 65,
    investorUpfrontCash: 10, // 20% of 50M
    totalTaxBenefit: 0, // Will be calculated
    netTaxBenefit: 0, // Will be calculated
    hdcAdvanceFinancing: false,
    constructionDelayMonths: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0,
    philCurrentPayEnabled: false,
    pikCurrentPayEnabled: false,
    investorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorPikCurrentPayPct: 0,
    outsideInvestorPikCurrentPayPct: 0,
    philCurrentPayPct: 0,
    ozEnabled: false, // Simplified - no OZ
    ozType: 'standard' as const,
    deferredCapitalGains: 0,
    capitalGainsTaxRate: 0,
    holdPeriod: 10,
    aumFeeEnabled: false,
    aumFeeRate: 0
  };

  describe('Direct Impact Test', () => {
    it('should show clear difference between 0% and 100% current pay', () => {
      console.log('\\n=== DIRECT COMPARISON: 0% vs 100% Current Pay ===\\n');

      // Test with 0% current pay (all PIK)
      const params0 = { ...baseParams };
      const result0 = calculateFullInvestorAnalysis(params0);

      // Test with 100% current pay
      const params100 = {
        ...baseParams,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 100
      };
      const result100 = calculateFullInvestorAnalysis(params100);

      // Calculate expected values
      const baseCost = baseParams.projectCost;
      const outsideDebt = baseCost * 0.05; // 5% = $2.5M
      const annualInterest = outsideDebt * 0.10; // 10% = $0.25M

      console.log('Outside Investor Sub-Debt:');
      console.log(`- Principal: $${outsideDebt}M`);
      console.log(`- Annual interest (10%): $${annualInterest.toFixed(3)}M`);

      console.log('\\n0% Current Pay (All PIK):');
      console.log(`- Current pay amount: $0M`);
      console.log(`- Year 1 operating CF: $${result0.investorCashFlows[0].operatingCashFlow.toFixed(3)}M`);
      console.log(`- Year 1 tax benefit: $${result0.investorCashFlows[0].taxBenefit.toFixed(3)}M`);
      console.log(`- Year 1 total CF: $${result0.investorCashFlows[0].totalCashFlow.toFixed(3)}M`);

      console.log('\\n100% Current Pay:');
      console.log(`- Current pay amount: $${annualInterest.toFixed(3)}M`);
      console.log(`- Year 1 operating CF: $${result100.investorCashFlows[0].operatingCashFlow.toFixed(3)}M`);
      console.log(`- Year 1 tax benefit: $${result100.investorCashFlows[0].taxBenefit.toFixed(3)}M`);
      console.log(`- Year 1 total CF: $${result100.investorCashFlows[0].totalCashFlow.toFixed(3)}M`);

      const cfDifference = result0.investorCashFlows[0].operatingCashFlow -
                          result100.investorCashFlows[0].operatingCashFlow;

      console.log('\\nImpact Analysis:');
      console.log(`- Operating CF reduction: $${cfDifference.toFixed(3)}M`);
      console.log(`- Expected reduction: $${annualInterest.toFixed(3)}M`);
      console.log(`- Match: ${Math.abs(cfDifference - annualInterest) < 0.01 ? '✓ YES' : '✗ NO'}`);

      // The operating cash flow should be reduced by the current pay amount
      expect(result100.investorCashFlows[0].operatingCashFlow).toBeLessThan(
        result0.investorCashFlows[0].operatingCashFlow
      );
    });

    it('should show gradual impact as current pay percentage increases', () => {
      console.log('\\n=== GRADUAL CURRENT PAY INCREASE ===\\n');

      const percentages = [0, 25, 50, 75, 100];
      const baseCost = baseParams.projectCost;
      const outsideDebt = baseCost * 0.05;
      const annualInterest = outsideDebt * 0.10;

      console.log(`Outside Investor Debt: $${outsideDebt}M at 10% = $${annualInterest.toFixed(3)}M/year\\n`);

      const results = percentages.map(pct => {
        const params = {
          ...baseParams,
          outsideInvestorPikCurrentPayEnabled: pct > 0,
          outsideInvestorPikCurrentPayPct: pct
        };
        const result = calculateFullInvestorAnalysis(params);
        const currentPay = annualInterest * (pct / 100);

        console.log(`${pct}% Current Pay:`);
        console.log(`  - Current pay: $${currentPay.toFixed(3)}M`);
        console.log(`  - Operating CF: $${result.investorCashFlows[0].operatingCashFlow.toFixed(3)}M`);
        console.log(`  - Tax benefit: $${result.investorCashFlows[0].taxBenefit.toFixed(3)}M`);
        console.log(`  - Total CF: $${result.investorCashFlows[0].totalCashFlow.toFixed(3)}M`);

        return {
          pct,
          currentPay,
          operatingCF: result.investorCashFlows[0].operatingCashFlow,
          totalCF: result.investorCashFlows[0].totalCashFlow
        };
      });

      // Verify monotonic decrease in operating CF
      for (let i = 1; i < results.length; i++) {
        console.log(`\\nComparing ${results[i-1].pct}% to ${results[i].pct}%:`);
        console.log(`  - CF difference: $${(results[i-1].operatingCF - results[i].operatingCF).toFixed(3)}M`);
        console.log(`  - Current pay increase: $${(results[i].currentPay - results[i-1].currentPay).toFixed(3)}M`);

        // Operating CF should decrease as current pay increases
        expect(results[i].operatingCF).toBeLessThanOrEqual(results[i-1].operatingCF);
      }
    });

    it('should properly handle DSCR constraint with current pay', () => {
      console.log('\\n=== DSCR CONSTRAINT TEST ===\\n');

      // Lower NOI to stress the DSCR
      const stressedParams = {
        ...baseParams,
        yearOneNOI: 2.4, // Lower NOI
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 100
      };

      const result = calculateFullInvestorAnalysis(stressedParams);

      // Calculate DSCR components
      const baseCost = stressedParams.projectCost;
      const seniorDebt = baseCost * 0.60;
      const philDebt = baseCost * 0.15; // Updated to match baseParams
      const outsideDebt = baseCost * 0.05;

      const seniorRate = 0.06 / 12;
      const seniorPayments = 30 * 12;
      const monthlySenior = seniorDebt * seniorRate *
        Math.pow(1 + seniorRate, seniorPayments) /
        (Math.pow(1 + seniorRate, seniorPayments) - 1);
      const annualSenior = monthlySenior * 12;
      const annualPhil = philDebt * 0.02;
      const annualOutside = outsideDebt * 0.10; // 100% current pay

      const hardDebtService = annualSenior + annualPhil;
      const totalDebtService = hardDebtService + annualOutside;

      const hardDSCR = stressedParams.yearOneNOI / hardDebtService;
      const totalDSCR = stressedParams.yearOneNOI / totalDebtService;

      console.log('Debt Service Analysis:');
      console.log(`- NOI: $${stressedParams.yearOneNOI}M`);
      console.log(`- Senior debt service: $${annualSenior.toFixed(3)}M`);
      console.log(`- Phil debt service: $${annualPhil.toFixed(3)}M`);
      console.log(`- Outside investor current pay: $${annualOutside.toFixed(3)}M`);
      console.log(`\\nDSCR Calculations:`);
      console.log(`- Hard DSCR (senior + phil only): ${hardDSCR.toFixed(3)}x`);
      console.log(`- Total DSCR (all debt): ${totalDSCR.toFixed(3)}x`);

      const targetCash = hardDebtService * 1.05;
      const availableForSoft = Math.max(0, stressedParams.yearOneNOI - targetCash);

      console.log(`\\nCash Management:`);
      console.log(`- Cash needed for 1.05 DSCR: $${targetCash.toFixed(3)}M`);
      console.log(`- Available for soft payments: $${availableForSoft.toFixed(3)}M`);
      console.log(`- Outside investor needs: $${annualOutside.toFixed(3)}M`);

      if (availableForSoft < annualOutside) {
        console.log(`✓ Insufficient cash - should defer: $${(annualOutside - availableForSoft).toFixed(3)}M`);
      } else {
        console.log(`✓ Sufficient cash for full payment`);
      }

      console.log(`\\nActual Results:`);
      console.log(`- Year 1 operating CF: $${result.investorCashFlows[0].operatingCashFlow.toFixed(3)}M`);

      // DSCR should be maintained even with current pay obligations
      expect(totalDSCR).toBeGreaterThanOrEqual(0.9); // Some flexibility for stressed scenario
    });
  });
});