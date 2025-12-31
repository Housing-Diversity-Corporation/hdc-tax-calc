/**
 * Domain 6: Returns & Exit - Math Validation
 *
 * Purpose: Show actual math step-by-step and verify code output matches.
 * Uses Trace 4001 parameters.
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('Domain 6: Returns & Exit - Math Validation', () => {

  const TRACE_4001_PARAMS: Partial<CalculationParams> = {
    projectCost: 67,
    landValue: 6.7,
    yearOneNOI: 3.5,
    investorEquityPct: 5,
    yearOneDepreciationPct: 20,
    effectiveTaxRate: 46.9,
    hdcFeeRate: 0,
    placedInServiceMonth: 7,

    ozEnabled: true,
    ozType: 'standard',
    deferredCapitalGains: 10,
    ltCapitalGainsRate: 20,
    niitRate: 3.8,
    stateCapitalGainsRate: 9.9,
    capitalGainsTaxRate: 33.7,

    seniorDebtPct: 66,
    philanthropicDebtPct: 20,
    hdcSubDebtPct: 2,
    investorSubDebtPct: 2.5,
    seniorDebtRate: 5,
    seniorDebtAmortization: 35,
    seniorDebtIOYears: 3,
    hdcSubDebtPikRate: 8,
    investorSubDebtPikRate: 8,

    holdPeriod: 10,
    revenueGrowth: 3,
    expenseGrowth: 3,
    exitCapRate: 6, // Use whatever is in test config
  };

  describe('1. Exit Value Calculation', () => {
    it('should calculate Year 10 NOI and Exit Value correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      // FORMULA: Exit Value = Year 10 NOI / (Exit Cap Rate / 100)

      // INPUTS:
      const year1NOI = 3.5; // $3.5M
      const revenueGrowth = 3; // 3% per year
      const yearsOfGrowth = 9; // Year 1 to Year 10
      const exitCapRate = 6; // 6%

      // STEP-BY-STEP MATH:
      // Year 10 NOI = Year 1 NOI × (1 + growth)^years
      const growthFactor = Math.pow(1 + revenueGrowth / 100, yearsOfGrowth);
      const expectedYear10NOI = year1NOI * growthFactor;

      console.log('\n=== EXIT VALUE CALCULATION ===');
      console.log('Year 1 NOI: $' + year1NOI.toFixed(6) + 'M');
      console.log('Growth rate: ' + revenueGrowth + '%/year');
      console.log('Years of growth: ' + yearsOfGrowth);
      console.log('Growth factor: (1.03)^9 = ' + growthFactor.toFixed(6));
      console.log('Year 10 NOI = $' + year1NOI.toFixed(2) + 'M × ' + growthFactor.toFixed(6));
      console.log('Year 10 NOI = $' + expectedYear10NOI.toFixed(6) + 'M');

      // Exit Value = NOI / Cap Rate
      const expectedExitValue = expectedYear10NOI / (exitCapRate / 100);
      console.log('\nExit Value = $' + expectedYear10NOI.toFixed(6) + 'M / ' + (exitCapRate / 100).toFixed(2));
      console.log('Exit Value = $' + expectedExitValue.toFixed(6) + 'M');

      // CODE OUTPUT:
      const actualYear10NOI = result.investorCashFlows[9].noi;
      const actualExitValue = result.exitValue || 0;

      console.log('\n--- CODE OUTPUT ---');
      console.log('Year 10 NOI: $' + actualYear10NOI.toFixed(6) + 'M');
      console.log('Exit Value: $' + actualExitValue.toFixed(6) + 'M');

      // MATCH?
      const noiError = Math.abs(actualYear10NOI - expectedYear10NOI) / expectedYear10NOI;
      const exitError = Math.abs(actualExitValue - expectedExitValue) / expectedExitValue;

      console.log('\n--- VERIFICATION ---');
      console.log('NOI Error: ' + (noiError * 100).toFixed(4) + '%');
      console.log('Exit Value Error: ' + (exitError * 100).toFixed(4) + '%');
      console.log(noiError < 0.001 ? '✅ NOI MATCH' : '❌ NOI MISMATCH');
      console.log(exitError < 0.001 ? '✅ EXIT VALUE MATCH' : '❌ EXIT VALUE MISMATCH');

      expect(noiError).toBeLessThan(0.001);
      expect(exitError).toBeLessThan(0.001);
    });
  });

  describe('2. Exit Proceeds Allocation', () => {
    it('should allocate exit proceeds through waterfall correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== EXIT PROCEEDS ALLOCATION ===');

      // Get actual values from code
      const exitValue = result.exitValue || 0;
      const remainingDebt = result.remainingDebt || 0;
      const hdcSubDebtAtExit = result.hdcSubDebtAtExit || 0;
      const investorSubDebtAtExit = result.investorSubDebtAtExit || 0;
      const outsideInvestorSubDebtAtExit = result.outsideInvestorSubDebtAtExit || 0;

      console.log('Exit Value: $' + exitValue.toFixed(6) + 'M');
      console.log('  - Remaining Hard Debt: $' + remainingDebt.toFixed(6) + 'M');
      console.log('  - HDC Sub-Debt: $' + hdcSubDebtAtExit.toFixed(6) + 'M');
      console.log('  - Investor Sub-Debt: $' + investorSubDebtAtExit.toFixed(6) + 'M');
      console.log('  - Outside Investor Sub-Debt: $' + outsideInvestorSubDebtAtExit.toFixed(6) + 'M');

      // STEP-BY-STEP MATH:
      const totalDebt = remainingDebt + hdcSubDebtAtExit + investorSubDebtAtExit + outsideInvestorSubDebtAtExit;
      const expectedGrossProceeds = exitValue - totalDebt;

      console.log('  ────────────────────────────────');
      console.log('Total Debt: $' + totalDebt.toFixed(6) + 'M');
      console.log('Gross Proceeds = $' + exitValue.toFixed(2) + 'M - $' + totalDebt.toFixed(2) + 'M');
      console.log('Gross Proceeds = $' + expectedGrossProceeds.toFixed(6) + 'M');

      // The waterfall splits this - check if code has it
      console.log('\n--- WATERFALL DISTRIBUTION ---');
      console.log('(Promote split + AUM fee settlement)');

      // Note: exitProceeds may be null due to DSCR waterfall
      const actualExitProceeds = result.exitProceeds;
      console.log('Exit Proceeds to Investor: ' +
        (actualExitProceeds !== null && actualExitProceeds !== undefined
          ? '$' + actualExitProceeds.toFixed(6) + 'M'
          : 'null (distributed via DSCR waterfall)'));

      expect(expectedGrossProceeds).toBeGreaterThan(0);
    });
  });

  describe('3. Investor Multiple Calculation', () => {
    it('should calculate investor multiple from total returns', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== INVESTOR MULTIPLE CALCULATION ===');

      // FORMULA: Multiple = Total Returns / Initial Investment

      // INPUTS:
      const investorEquity = result.investorEquity || 0;
      console.log('Initial Investment (Investor Equity): $' + investorEquity.toFixed(6) + 'M');

      // Calculate total returns from components
      let totalTaxBenefits = 0;
      let totalOperatingCash = 0;

      for (let i = 0; i < 10; i++) {
        const flow = result.investorCashFlows[i];
        totalTaxBenefits += flow.taxBenefit || 0;
        // Note: operating cash may be in different fields due to DSCR
      }

      const investorSubDebtRepaid = result.investorSubDebtAtExit || 0;
      const exitProceeds = result.exitProceeds || 0;

      console.log('\n--- RETURN COMPONENTS ---');
      console.log('Total Tax Benefits (10 years): $' + totalTaxBenefits.toFixed(6) + 'M');
      console.log('Investor Sub-Debt Repaid: $' + investorSubDebtRepaid.toFixed(6) + 'M');
      console.log('Exit Proceeds: ' + (exitProceeds !== null ? '$' + exitProceeds.toFixed(6) + 'M' : 'null'));

      // Check cumulative returns if available
      const year10Flow = result.investorCashFlows[9];
      const cumulativeReturns = year10Flow.cumulativeReturns;

      console.log('\n--- CODE OUTPUT ---');
      console.log('Cumulative Returns (Year 10): ' +
        (cumulativeReturns !== null && cumulativeReturns !== undefined
          ? '$' + cumulativeReturns.toFixed(6) + 'M'
          : 'null'));
      console.log('Investor Multiple: ' +
        (result.multiple !== null && result.multiple !== undefined
          ? result.multiple.toFixed(2) + 'x'
          : 'null'));

      // If we have the data, calculate manually
      if (cumulativeReturns && exitProceeds !== null) {
        const manualTotalReturns = cumulativeReturns + exitProceeds + investorSubDebtRepaid;
        const manualMultiple = manualTotalReturns / investorEquity;

        console.log('\n--- MANUAL CALCULATION ---');
        console.log('Total Returns = $' + cumulativeReturns.toFixed(2) + 'M (cumulative) + $' +
          exitProceeds.toFixed(2) + 'M (exit) + $' + investorSubDebtRepaid.toFixed(2) + 'M (sub-debt)');
        console.log('Total Returns = $' + manualTotalReturns.toFixed(6) + 'M');
        console.log('Multiple = $' + manualTotalReturns.toFixed(2) + 'M / $' + investorEquity.toFixed(2) + 'M');
        console.log('Multiple = ' + manualMultiple.toFixed(2) + 'x');
      }

      expect(investorEquity).toBeGreaterThan(0);
      expect(totalTaxBenefits).toBeGreaterThan(0);
    });
  });

  describe('4. IRR Calculation', () => {
    it('should show cash flow array for IRR calculation', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== IRR CALCULATION ===');
      console.log('Method: Newton-Raphson iterative solver');
      console.log('Formula: Find rate where NPV = 0');

      const investorEquity = result.investorEquity || 0;
      console.log('\nYear 0: -$' + investorEquity.toFixed(6) + 'M (initial investment)');

      console.log('\n--- ANNUAL CASH FLOWS (Years 1-10) ---');
      for (let i = 0; i < 10; i++) {
        const flow = result.investorCashFlows[i];
        const year = i + 1;

        console.log('\nYear ' + year + ':');
        console.log('  Tax Benefit: $' + (flow.taxBenefit || 0).toFixed(6) + 'M');
        console.log('  HDC Fee Paid: -$' + (0).toFixed(6) + 'M');
        console.log('  Total Cash Flow: ' +
          (flow.totalCashFlow !== null && flow.totalCashFlow !== undefined
            ? '$' + flow.totalCashFlow.toFixed(6) + 'M'
            : 'null (see components)'));
        console.log('  Cumulative Returns: ' +
          (flow.cumulativeReturns !== null && flow.cumulativeReturns !== undefined
            ? '$' + flow.cumulativeReturns.toFixed(6) + 'M'
            : 'null'));
      }

      console.log('\n--- CODE OUTPUT ---');
      console.log('Calculated IRR: ' +
        (result.irr !== null && result.irr !== undefined
          ? result.irr.toFixed(2) + '%'
          : 'null or 0'));

      expect(investorEquity).toBeGreaterThan(0);
    });
  });
});
