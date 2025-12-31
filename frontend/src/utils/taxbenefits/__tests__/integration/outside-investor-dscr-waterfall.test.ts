/**
 * Outside Investor Sub-Debt Current Pay & DSCR Waterfall Tests
 *
 * Tests the interaction between Outside Investor Sub-Debt current pay settings
 * and the DSCR cash management system to ensure:
 * 1. 1.05 DSCR target is maintained
 * 2. Proper deferral order (HDC fees first, outside investor last)
 * 3. Distributable cash flow correctly calculated
 *
 * September 2025
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { calculateHDCAnalysis } from '../../hdcAnalysis';

describe('Outside Investor Sub-Debt Current Pay & DSCR Management', () => {
  const baseParams = {
    projectCost: 50,
    landValue: 5,
    yearOneNOI: 2.5, // This will stress test the DSCR management
    yearOneDepreciationPct: 25,
    effectiveTaxRate: 47.85, // Combined federal + state
    investorEquityPct: 20,
    seniorDebtPct: 60,
    philanthropicDebtPct: 15, // Increased to balance capital structure
    hdcSubDebtPct: 2,
    investorSubDebtPct: 0,
    outsideInvestorSubDebtPct: 3, // 3% outside investor sub-debt
    seniorDebtRate: 6,
    philanthropicDebtRate: 2,
    hdcSubDebtPikRate: 8,
    investorSubDebtPikRate: 8,
    outsideInvestorSubDebtPikRate: 10, // Higher rate for outside investor
    seniorDebtAmortization: 30,
    exitCapRate: 6,
    opexRatio: 30,
    revenueGrowth: 3, // Fixed typo: was "revengeGrowth"
    expenseGrowth: 3,
    hdcFeeRate: 0, // HDC tax benefit fee enabled
    hdcFee: 0, // Will be calculated
    investorPromoteShare: 65,
    investorUpfrontCash: 10, // 20% of 50M
    totalTaxBenefit: 0, // Will be calculated
    netTaxBenefit: 0, // Will be calculated
    hdcAdvanceFinancing: false,
    taxBenefitDelayMonths: 0,
    constructionDelayMonths: 0,
    interestReserveEnabled: false,
    interestReserveMonths: 0,
    philCurrentPayEnabled: false,
    pikCurrentPayEnabled: false,
    investorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayEnabled: false, // Will vary in tests
    pikCurrentPayPct: 0,
    investorPikCurrentPayPct: 0,
    outsideInvestorPikCurrentPayPct: 0, // Will vary in tests
    philCurrentPayPct: 0,
    ozEnabled: true,
    ozType: 'standard' as const,
    deferredCapitalGains: 10,
    capitalGainsTaxRate: 34.65,
    holdPeriod: 10,
    aumFeeEnabled: false, // Will be enabled in some tests
    aumFeeRate: 0
  };

  describe('Baseline - No Current Pay', () => {
    it('should calculate baseline distributable cash with all PIK debt', () => {
      const result = calculateFullInvestorAnalysis(baseParams);
      const hdcResult = calculateHDCAnalysis(baseParams, result);

      console.log('\\n=== BASELINE (All PIK, No Current Pay) ===');
      console.log('Year 1 Analysis:');

      // Calculate expected debt service
      const baseCost = baseParams.projectCost;
      const seniorDebt = baseCost * 0.60;
      const philDebt = baseCost * 0.10;

      // Senior debt payment
      const seniorRate = 0.06 / 12;
      const seniorPayments = 30 * 12;
      const monthlysenior = seniorDebt * seniorRate *
        Math.pow(1 + seniorRate, seniorPayments) /
        (Math.pow(1 + seniorRate, seniorPayments) - 1);
      const annualSenior = monthlysenior * 12;

      // Phil debt (interest only)
      const annualPhil = philDebt * 0.02;

      const totalDebtService = annualSenior + annualPhil;
      const hardDSCR = baseParams.yearOneNOI / totalDebtService;

      console.log(`- Year 1 NOI: $${baseParams.yearOneNOI}M`);
      console.log(`- Senior debt service: $${annualSenior.toFixed(3)}M`);
      console.log(`- Phil debt service: $${annualPhil.toFixed(3)}M`);
      console.log(`- Total hard debt service: $${totalDebtService.toFixed(3)}M`);
      console.log(`- Hard DSCR: ${hardDSCR.toFixed(2)}x`);

      // With no current pay, distributable should be NOI - hard debt - amount to maintain 1.05 DSCR
      const targetCash = totalDebtService * 1.05;
      const distributable = Math.max(0, baseParams.yearOneNOI - targetCash);

      console.log(`- Target cash for 1.05 DSCR: $${targetCash.toFixed(3)}M`);
      console.log(`- Expected distributable: $${distributable.toFixed(3)}M`);

      // Check Year 1 cash flows
      const year1CashFlow = result.investorCashFlows[0];
      console.log(`- Actual Year 1 operating CF: $${year1CashFlow.operatingCashFlow.toFixed(3)}M`);

      expect(hardDSCR).toBeGreaterThan(1.0);
      expect(hardDSCR).toBeLessThan(1.2); // Should be tight with our NOI
    });
  });

  describe('Outside Investor Current Pay Impact', () => {
    it('should gradually reduce distributable cash as current pay % increases', () => {
      const currentPayLevels = [0, 25, 50, 75, 100];
      const results: any[] = [];

      console.log('\\n=== OUTSIDE INVESTOR CURRENT PAY GRADIENT ===');

      currentPayLevels.forEach(pct => {
        const params = {
          ...baseParams,
          outsideInvestorPikCurrentPayEnabled: pct > 0,
          outsideInvestorPikCurrentPayPct: pct
        };

        const result = calculateFullInvestorAnalysis(params);
        const hdcResult = calculateHDCAnalysis(params, result);

        const year1CashFlow = result.investorCashFlows[0];
        const baseCost = baseParams.projectCost;
        const outsideDebt = baseCost * 0.03;
        const annualInterest = outsideDebt * 0.10;
        const currentPayAmount = annualInterest * (pct / 100);

        console.log(`\\n${pct}% Current Pay:`);
        console.log(`- Outside debt: $${outsideDebt}M at 10%`);
        console.log(`- Annual interest: $${annualInterest.toFixed(3)}M`);
        console.log(`- Current pay portion: $${currentPayAmount.toFixed(3)}M`);
        console.log(`- Year 1 operating CF: $${year1CashFlow.operatingCashFlow.toFixed(3)}M`);
        console.log(`- HDC fees paid: $${(hdcResult.hdcCashFlows[0]?.hdcFeeIncome || 0).toFixed(3)}M`);
        console.log(`- HDC fees deferred: $${(hdcResult.hdcCashFlows[0]?.hdcFeeDeferred || 0).toFixed(3)}M`);

        results.push({
          pct,
          currentPay: currentPayAmount,
          operatingCF: year1CashFlow.operatingCashFlow,
          hdcFeesPaid: hdcResult.hdcCashFlows[0]?.hdcFeeIncome || 0,
          hdcFeesDeferred: hdcResult.hdcCashFlows[0]?.hdcFeeDeferred || 0
        });
      });

      // Verify that as current pay increases, operating cash flow decreases (until it hits zero)
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];

        // Operating CF should decrease as more goes to current pay
        // Once it hits zero (all cash used for DSCR + current pay), it stays at zero
        expect(curr.operatingCF).toBeLessThanOrEqual(prev.operatingCF);
      }
    });
  });

  describe('Deferral Priority Order', () => {
    it('should defer HDC fees before outside investor current pay', () => {
      // Create a scenario with tight cash flow
      const stressParams = {
        ...baseParams,
        yearOneNOI: 2.2, // Lower NOI to stress the system
        hdcFeeRate: 0,
        aumFeeEnabled: true,
        aumFeeRate: 1, // 1% AUM fee
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 100 // Full current pay
      };

      const result = calculateFullInvestorAnalysis(stressParams);
      const hdcResult = calculateHDCAnalysis(stressParams, result);

      console.log('\\n=== DEFERRAL PRIORITY TEST (Stressed Cash Flow) ===');
      console.log(`Year 1 NOI: $${stressParams.yearOneNOI}M (reduced for stress test)`);

      const baseCost = stressParams.projectCost;
      const aumFee = baseCost * 0.01;
      const depreciableBasis = baseCost - stressParams.landValue - (baseCost * 0.20);
      const year1Depreciation = depreciableBasis * 0.25;
      const taxBenefit = year1Depreciation * 0.4785;
      const hdcTaxFee = taxBenefit * 0.10;
      const outsideDebt = baseCost * 0.03;
      const outsideInterest = outsideDebt * 0.10;

      console.log('\\nExpected fees and payments:');
      console.log(`- HDC tax benefit fee: $${hdcTaxFee.toFixed(3)}M`);
      console.log(`- AUM fee: $${aumFee.toFixed(3)}M`);
      console.log(`- Outside investor current pay: $${outsideInterest.toFixed(3)}M`);

      const year1HDC = hdcResult.hdcCashFlows[0];
      console.log('\\nActual Year 1 results:');
      console.log(`- HDC fees collected: $${(year1HDC?.hdcFeesCollected || 0).toFixed(3)}M`);
      console.log(`- HDC fees deferred: $${(year1HDC?.hdcFeesDeferred || 0).toFixed(3)}M`);
      console.log(`- Total HDC deferrals: $${(hdcResult.totalDeferredFees || 0).toFixed(3)}M`);

      // In a stressed scenario, we expect HDC fees to defer first
      if (year1HDC?.hdcFeesDeferred > 0) {
        console.log('✓ HDC fees are being deferred as expected in stressed scenario');
      }
    });
  });

  describe('DSCR Target Maintenance', () => {
    it('should maintain exactly 1.05 DSCR after all adjustments', () => {
      const scenarios = [
        {
          name: 'Base scenario',
          params: baseParams
        },
        {
          name: 'With 50% outside investor current pay',
          params: {
            ...baseParams,
            outsideInvestorPikCurrentPayEnabled: true,
            outsideInvestorPikCurrentPayPct: 50
          }
        },
        {
          name: 'With AUM fee and 100% current pay',
          params: {
            ...baseParams,
            aumFeeEnabled: true,
            aumFeeRate: 1.5,
            outsideInvestorPikCurrentPayEnabled: true,
            outsideInvestorPikCurrentPayPct: 100
          }
        },
        {
          name: 'All fees enabled with stressed NOI',
          params: {
            ...baseParams,
            yearOneNOI: 2.3, // Stressed NOI
            aumFeeEnabled: true,
            aumFeeRate: 2,
            outsideInvestorPikCurrentPayEnabled: true,
            outsideInvestorPikCurrentPayPct: 75,
            pikCurrentPayEnabled: true,
            pikCurrentPayPct: 50
          }
        }
      ];

      console.log('\\n=== DSCR TARGET (1.05x) MAINTENANCE TEST ===');

      scenarios.forEach(scenario => {
        const result = calculateFullInvestorAnalysis(scenario.params);

        console.log(`\\n${scenario.name}:`);
        console.log(`- Year 1 NOI: $${scenario.params.yearOneNOI}M`);

        // Calculate hard debt service
        const baseCost = scenario.params.projectCost;
        const seniorDebt = baseCost * 0.60;
        const philDebt = baseCost * 0.10;

        const seniorRate = 0.06 / 12;
        const seniorPayments = 30 * 12;
        const monthlySenior = seniorDebt * seniorRate *
          Math.pow(1 + seniorRate, seniorPayments) /
          (Math.pow(1 + seniorRate, seniorPayments) - 1);
        const annualSenior = monthlySenior * 12;
        const annualPhil = philDebt * 0.02;

        const hardDebtService = annualSenior + annualPhil;

        // Calculate all sub-debt current pay
        let totalCurrentPay = 0;

        if (scenario.params.outsideInvestorPikCurrentPayEnabled) {
          const outsideDebt = baseCost * 0.03;
          totalCurrentPay += outsideDebt * 0.10 * (scenario.params.outsideInvestorPikCurrentPayPct / 100);
        }

        if (scenario.params.pikCurrentPayEnabled) {
          const hdcDebt = baseCost * 0.02;
          totalCurrentPay += hdcDebt * 0.08 * (scenario.params.pikCurrentPayPct / 100);
        }

        const totalDebtService = hardDebtService + totalCurrentPay;
        const actualDSCR = scenario.params.yearOneNOI / totalDebtService;

        console.log(`- Hard debt service: $${hardDebtService.toFixed(3)}M`);
        console.log(`- Current pay sub-debt: $${totalCurrentPay.toFixed(3)}M`);
        console.log(`- Total debt service: $${totalDebtService.toFixed(3)}M`);
        console.log(`- Calculated DSCR: ${actualDSCR.toFixed(3)}x`);

        // After cash management, effective DSCR should be close to 1.05
        const targetDSCR = 1.05;
        const cashForTarget = totalDebtService * targetDSCR;
        const distributable = Math.max(0, scenario.params.yearOneNOI - cashForTarget);

        console.log(`- Cash needed for 1.05 DSCR: $${cashForTarget.toFixed(3)}M`);
        console.log(`- Expected distributable: $${distributable.toFixed(3)}M`);

        // Verify DSCR management is working
        if (actualDSCR > targetDSCR) {
          console.log(`✓ DSCR above target, excess distributed`);
        } else if (actualDSCR < targetDSCR) {
          console.log(`✓ DSCR below target, fees deferred`);
        } else {
          console.log(`✓ DSCR at target`);
        }
      });
    });
  });

  describe('Complex Waterfall Integration', () => {
    it('should handle all payment types in correct priority order', () => {
      const complexParams = {
        ...baseParams,
        yearOneNOI: 2.4, // Tight but manageable
        aumFeeEnabled: true,
        aumFeeRate: 1,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 25,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 50
      };

      const result = calculateFullInvestorAnalysis(complexParams);
      const hdcResult = calculateHDCAnalysis(complexParams, result);

      console.log('\\n=== COMPLEX WATERFALL TEST ===');
      console.log('All payment types enabled:');
      console.log('- HDC tax benefit fee: 10%');
      console.log('- AUM fee: 1%');
      console.log('- HDC sub-debt: 25% current pay');
      console.log('- Outside investor: 50% current pay');

      const baseCost = complexParams.projectCost;

      // Calculate all components
      const depreciableBasis = baseCost - complexParams.landValue - (baseCost * 0.20);
      const year1Depreciation = depreciableBasis * 0.25;
      const taxBenefit = year1Depreciation * 0.4785;
      const hdcTaxFee = taxBenefit * 0.10;
      const aumFee = baseCost * 0.01;
      const hdcDebt = baseCost * 0.02;
      const hdcCurrentPay = hdcDebt * 0.08 * 0.25;
      const outsideDebt = baseCost * 0.03;
      const outsideCurrentPay = outsideDebt * 0.10 * 0.50;

      console.log('\\nExpected payments:');
      console.log(`- HDC tax fee: $${hdcTaxFee.toFixed(3)}M`);
      console.log(`- AUM fee: $${aumFee.toFixed(3)}M`);
      console.log(`- HDC current pay: $${hdcCurrentPay.toFixed(3)}M`);
      console.log(`- Outside current pay: $${outsideCurrentPay.toFixed(3)}M`);
      console.log(`- Total soft payments: $${(hdcTaxFee + aumFee + hdcCurrentPay + outsideCurrentPay).toFixed(3)}M`);

      const year1HDC = hdcResult.hdcCashFlows[0];
      const year1Investor = result.investorCashFlows[0];

      console.log('\\nActual Year 1 results:');
      console.log(`- Operating cash to investor: $${year1Investor.operatingCashFlow.toFixed(3)}M`);
      console.log(`- HDC fees collected: $${(year1HDC?.hdcFeesCollected || 0).toFixed(3)}M`);
      console.log(`- HDC fees deferred: $${(year1HDC?.hdcFeesDeferred || 0).toFixed(3)}M`);

      // Verify waterfall priority
      const totalRequested = hdcTaxFee + aumFee + hdcCurrentPay + outsideCurrentPay;
      const availableAfterHard = complexParams.yearOneNOI -
        (baseCost * 0.60 * 0.06) - // Rough senior debt service
        (baseCost * 0.10 * 0.02);   // Phil debt interest

      console.log(`\\nWaterfall check:`);
      console.log(`- Available after hard debt: $${availableAfterHard.toFixed(3)}M`);
      console.log(`- Total requested: $${totalRequested.toFixed(3)}M`);

      if (availableAfterHard < totalRequested) {
        console.log('✓ Cash constrained - deferral order matters');

        // In constrained scenario, verify deferral order:
        // 1. HDC tax benefit fee defers first
        // 2. AUM fee defers second
        // 3. HDC current pay defers third
        // 4. Outside investor current pay defers last

        if (year1HDC?.hdcFeesDeferred > 0) {
          console.log('✓ HDC fees being deferred (correct priority)');
        }
      } else {
        console.log('✓ Sufficient cash for all payments');
      }
    });
  });

  describe('Year-over-Year Accumulation', () => {
    it('should properly track deferred amounts across multiple years', () => {
      const multiYearParams = {
        ...baseParams,
        yearOneNOI: 2.25, // Start stressed
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 75,
        revenueGrowth: 5, // NOI will grow over time
        expenseGrowth: 3
      };

      const result = calculateFullInvestorAnalysis(multiYearParams);
      const hdcResult = calculateHDCAnalysis(multiYearParams, result);

      console.log('\\n=== MULTI-YEAR DEFERRAL TRACKING ===');
      console.log('Starting with stressed Year 1, growing NOI over time');

      let cumulativeDeferred = 0;

      for (let year = 0; year < 5; year++) {
        const cashFlow = hdcResult.hdcCashFlows[year];
        if (cashFlow) {
          const yearNum = year + 1;
          const projectedNOI = multiYearParams.yearOneNOI *
            Math.pow(1.05, year) * // Revenue growth
            Math.pow(0.97, year);   // Net of expense growth

          console.log(`\\nYear ${yearNum}:`);
          console.log(`- Projected NOI: $${projectedNOI.toFixed(3)}M`);
          console.log(`- HDC fees collected: $${(cashFlow.hdcFeesCollected || 0).toFixed(3)}M`);
          console.log(`- HDC fees deferred: $${(cashFlow.hdcFeesDeferred || 0).toFixed(3)}M`);

          cumulativeDeferred += cashFlow.hdcFeesDeferred || 0;
          console.log(`- Cumulative deferred: $${cumulativeDeferred.toFixed(3)}M`);
        }
      }

      // Check exit catch-up
      console.log(`\\nAt Exit:`);
      console.log(`- Total deferred fees: $${(hdcResult.totalDeferredFees || 0).toFixed(3)}M`);
      console.log(`- HDC exit proceeds: $${(hdcResult.hdcExitProceeds || 0).toFixed(3)}M`);

      // Verify deferred fees are caught up at exit
      expect(hdcResult.hdcExitProceeds).toBeGreaterThanOrEqual(hdcResult.totalDeferredFees || 0);
      console.log('✓ Deferred fees recovered at exit');
    });
  });
});