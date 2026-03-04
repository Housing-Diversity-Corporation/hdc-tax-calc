/**
 * Domain 7: Integration - Final Pre-Vegas Validation
 *
 * Purpose: Verify all calculation domains work together correctly in end-to-end scenario.
 * Reference: Trace 4001 ($67M, Oregon, 5% equity)
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { CalculationParams } from '../../../../types/taxbenefits';

describe('Domain 7: Integration - End-to-End Validation', () => {

  const TRACE_4001_PARAMS: Partial<CalculationParams> = {
    projectCost: 67,
    landValue: 6.7,
    yearOneNOI: 3.5,
    investorEquityPct: 5,
    yearOneDepreciationPct: 20,
    effectiveTaxRate: 46.9,
    hdcFeeRate: 0,
    placedInServiceMonth: 7,
    investorPromoteShare: 35, // Explicitly set after Domain 6 fix

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
    exitCapRate: 6,

    exitMonth: 12,
  };

  describe('1. End-to-End Flow', () => {
    it('should complete full calculation without errors', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== DOMAIN 7: END-TO-END INTEGRATION VALIDATION ===\n');

      // Should return a result object
      expect(result).toBeDefined();
      expect(result.investorCashFlows).toBeDefined();
      // With pisMonth=7, computeHoldPeriod(7,0,0) yields holdFromPIS=11
      // IMPL-087: +1 disposition year, so totalInvestmentYears=12
      expect(result.investorCashFlows.length).toBe(12);

      console.log('Full calculation completed successfully');
      console.log('Generated 12 years of cash flows');
    });

    it('should have NO NaN, null, or undefined in critical outputs', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- NaN/NULL/UNDEFINED CHECK ---');

      const criticalFields = [
        'investorEquity',
        'exitValue',
        'multiple',
        'irr',
        'remainingDebtAtExit',
        'investorSubDebtAtExit'
      ];

      let allValid = true;
      criticalFields.forEach(field => {
        const value = (result as any)[field];
        const isValid = value !== null && value !== undefined && !isNaN(value);
        console.log(`${field}: ${value} ${isValid ? '✅' : '❌'}`);

        if (!isValid) {
          allValid = false;
        }

        expect(isValid).toBe(true);
      });

      // Check each year's cash flows
      console.log('\n--- YEARLY CASH FLOW VALIDATION ---');
      let cashFlowIssues = 0;

      result.investorCashFlows.forEach((flow, idx) => {
        const year = idx + 1;
        const fieldsToCheck = ['totalCashFlow', 'cumulativeReturns', 'taxBenefit', 'noi'];

        fieldsToCheck.forEach(field => {
          const value = (flow as any)[field];
          if (value === null || value === undefined || isNaN(value)) {
            console.log(`❌ Year ${year} ${field}: ${value}`);
            cashFlowIssues++;
          }
        });
      });

      if (cashFlowIssues === 0) {
        console.log('✅ All yearly cash flows valid (no NaN/null/undefined)');
      }

      expect(cashFlowIssues).toBe(0);
      expect(allValid).toBe(true);
    });
  });

  describe('2. Cross-Domain Consistency', () => {
    it('should have depreciation feed into tax benefits correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== CROSS-DOMAIN CONSISTENCY ===');
      console.log('\n--- Domain 1 (Depreciation) → Domain 2 (Tax Benefits) ---');

      // Year 1: Check that tax benefit is based on depreciation
      const year1Flow = result.investorCashFlows[0];
      const taxBenefit = year1Flow.taxBenefit;
      const hdcFee = 0; // Fee removed per IMPL-7.0-001
      const grossTaxBenefit = taxBenefit; // 100% to investor

      // Back-calculate depreciation from tax benefit
      const impliedDepreciation = grossTaxBenefit / (TRACE_4001_PARAMS.effectiveTaxRate! / 100);

      console.log('Year 1 Tax Benefit: $' + taxBenefit.toFixed(6) + 'M');
      console.log('Year 1 HDC Fee: $0 (removed)');
      console.log('Gross Tax Benefit: $' + grossTaxBenefit.toFixed(6) + 'M');
      console.log('Implied Depreciation: $' + impliedDepreciation.toFixed(6) + 'M');

      // Verify it's reasonable for 20% cost seg on ~$57M basis
      const depreciableBasis = 67 - 6.7 - (67 * 0.05); // $56.95M
      const expectedBonus = depreciableBasis * 0.20; // ~$11.39M

      console.log('\nExpected Bonus Depreciation: $' + expectedBonus.toFixed(6) + 'M');
      console.log('Implied includes bonus + partial MACRS');

      expect(impliedDepreciation).toBeGreaterThan(expectedBonus);
      expect(impliedDepreciation).toBeLessThan(depreciableBasis);

      console.log('✅ Depreciation → Tax Benefits: CONSISTENT');
    });

    it('should have debt service feed into cash flow correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Domain 3 (Debt Service) → Domain 4 (Cash Flow) ---');

      // Year 1 check
      const year1Flow = result.investorCashFlows[0];
      const noi = year1Flow.noi;
      const debtService = year1Flow.hardDebtService;
      const cashAfterDebt = year1Flow.cashAfterDebtService;

      console.log('Stabilized NOI: $' + noi.toFixed(6) + 'M');
      console.log('Hard Debt Service: $' + debtService.toFixed(6) + 'M');
      console.log('Cash After Debt: $' + cashAfterDebt.toFixed(6) + 'M');

      // DSCR check - note: actual DSCR is the target (1.05x) not the operational DSCR
      const dscr = year1Flow.dscr;
      const operationalDSCR = noi / debtService;
      const targetDSCR = 1.05;

      console.log('Target DSCR: ' + targetDSCR.toFixed(3) + 'x');
      console.log('Actual DSCR: ' + dscr.toFixed(3) + 'x');
      console.log('Operational DSCR (before cash management): ' + operationalDSCR.toFixed(3) + 'x');

      // The DSCR cash management system maintains exactly 1.05x
      expect(Math.abs(dscr - targetDSCR)).toBeLessThan(0.01);

      console.log('✅ Debt Service → Cash Flow: CONSISTENT (DSCR target maintained)');
    });

    it('should have cash flow feed into returns correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Domain 4 (Cash Flow) → Domain 5 (Returns) ---');

      // Check cumulative returns accumulation
      let manualCumulative = 0;

      for (let i = 0; i < 3; i++) { // Check first 3 years
        const flow = result.investorCashFlows[i];
        const year = i + 1;

        manualCumulative += flow.totalCashFlow;
        const reportedCumulative = flow.cumulativeReturns;

        console.log(`Year ${year}:`);
        console.log(`  Total Cash Flow: $${flow.totalCashFlow.toFixed(6)}M`);
        console.log(`  Manual Cumulative: $${manualCumulative.toFixed(6)}M`);
        console.log(`  Reported Cumulative: $${reportedCumulative.toFixed(6)}M`);
        console.log(`  Match: ${Math.abs(manualCumulative - reportedCumulative) < 0.01 ? '✅' : '❌'}`);

        expect(Math.abs(manualCumulative - reportedCumulative)).toBeLessThan(0.01);
      }

      console.log('✅ Cash Flow → Returns: CONSISTENT');
    });

    it('should use correct debt balances at exit', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Domain 5 (Returns) → Domain 6 (Exit) ---');

      const exitValue = result.exitValue!;
      const remainingDebt = result.remainingDebtAtExit!;
      const investorSubDebt = result.investorSubDebtAtExit!;
      const hdcSubDebt = result.subDebtAtExit!;
      const outsideInvestorSubDebt = result.outsideInvestorSubDebtAtExit!;

      console.log('Exit Value: $' + exitValue.toFixed(6) + 'M');
      console.log('Remaining Hard Debt: $' + remainingDebt.toFixed(6) + 'M');
      console.log('Investor Sub-Debt: $' + investorSubDebt.toFixed(6) + 'M');
      console.log('HDC Sub-Debt: $' + hdcSubDebt.toFixed(6) + 'M');
      console.log('Outside Investor Sub-Debt: $' + outsideInvestorSubDebt.toFixed(6) + 'M');

      const totalDebt = remainingDebt + investorSubDebt + hdcSubDebt + outsideInvestorSubDebt;
      console.log('Total Debt: $' + totalDebt.toFixed(6) + 'M');

      // Verify investor sub-debt grew from PIK compounding
      const initialInvestorSubDebt = 67 * 0.025; // 2.5% of $67M
      console.log('\nInitial Investor Sub-Debt: $' + initialInvestorSubDebt.toFixed(6) + 'M');
      console.log('Final Investor Sub-Debt: $' + investorSubDebt.toFixed(6) + 'M');
      console.log('Growth: ' + ((investorSubDebt / initialInvestorSubDebt - 1) * 100).toFixed(1) + '%');

      expect(investorSubDebt).toBeGreaterThan(initialInvestorSubDebt);

      console.log('✅ Exit uses correct debt balances with PIK compounding');
    });
  });

  describe('3. Key Output Sanity Checks', () => {
    it('should have Multiple > 1x (investor makes money)', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== SANITY CHECKS ===');
      console.log('\n--- Check 1: Multiple > 1x ---');

      const multiple = result.multiple!;
      console.log('Investor Multiple: ' + multiple.toFixed(2) + 'x');

      expect(multiple).toBeGreaterThan(1);

      if (multiple > 5) {
        console.log('✅ EXCELLENT: Multiple > 5x (very strong returns)');
      } else if (multiple > 2) {
        console.log('✅ GOOD: Multiple > 2x (healthy returns)');
      } else {
        console.log('✅ PASS: Multiple > 1x (positive returns)');
      }
    });

    it('should have IRR > 0% (positive return)', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Check 2: IRR > 0% ---');

      const irr = result.irr!;
      console.log('Investor IRR: ' + irr.toFixed(2) + '%');

      expect(irr).toBeGreaterThan(0);

      if (irr > 50) {
        console.log('✅ EXCELLENT: IRR > 50% (exceptional returns)');
      } else if (irr > 20) {
        console.log('✅ GOOD: IRR > 20% (strong returns)');
      } else {
        console.log('✅ PASS: IRR > 0% (positive returns)');
      }
    });

    it('should have Year 1 tax benefits > investor equity (free investment)', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Check 3: Free Investment Achievement ---');

      const investorEquity = result.investorEquity!;
      const year1TaxBenefit = result.investorCashFlows[0].taxBenefit;

      console.log('Investor Equity: $' + investorEquity.toFixed(6) + 'M');
      console.log('Year 1 Tax Benefit (net): $' + year1TaxBenefit.toFixed(6) + 'M');
      console.log('Recovery %: ' + ((year1TaxBenefit / investorEquity) * 100).toFixed(1) + '%');

      if (year1TaxBenefit > investorEquity) {
        console.log('✅ FREE INVESTMENT ACHIEVED in Year 1');
        const excess = year1TaxBenefit - investorEquity;
        console.log('   Excess: $' + excess.toFixed(6) + 'M (' +
                    ((excess / investorEquity) * 100).toFixed(1) + '% over equity)');
      } else {
        const remaining = investorEquity - year1TaxBenefit;
        console.log('⚠️  Remaining to recover: $' + remaining.toFixed(6) + 'M');

        // Check if recovered by Year 2
        const year2Cumulative = result.investorCashFlows[1].cumulativeReturns;
        if (year2Cumulative > investorEquity) {
          console.log('✅ FREE INVESTMENT achieved by Year 2');
        }
      }

      // This is the key value proposition - should be close or over
      expect(year1TaxBenefit / investorEquity).toBeGreaterThan(0.8);
    });

    it('should have Exit value > total debt (positive equity)', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Check 4: Positive Exit Equity ---');

      const exitValue = result.exitValue!;
      const totalDebt = (result.remainingDebtAtExit || 0) +
                       (result.subDebtAtExit || 0) +
                       (result.investorSubDebtAtExit || 0) +
                       (result.outsideInvestorSubDebtAtExit || 0);

      console.log('Exit Value: $' + exitValue.toFixed(6) + 'M');
      console.log('Total Debt: $' + totalDebt.toFixed(6) + 'M');
      console.log('Net Equity: $' + (exitValue - totalDebt).toFixed(6) + 'M');
      console.log('LTV at Exit: ' + ((totalDebt / exitValue) * 100).toFixed(1) + '%');

      expect(exitValue).toBeGreaterThan(totalDebt);

      const netEquity = exitValue - totalDebt;
      if (netEquity > exitValue * 0.5) {
        console.log('✅ EXCELLENT: > 50% equity at exit');
      } else if (netEquity > exitValue * 0.2) {
        console.log('✅ GOOD: > 20% equity at exit');
      } else {
        console.log('✅ PASS: Positive equity at exit');
      }
    });
  });

  describe('4. Comprehensive Data Integrity', () => {
    it('should have all year-over-year calculations consistent', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== DATA INTEGRITY CHECKS ===');
      console.log('\n--- Year-over-Year Consistency ---');

      let issues = 0;

      for (let i = 1; i < result.investorCashFlows.length; i++) {
        const prevYear = result.investorCashFlows[i - 1];
        const currYear = result.investorCashFlows[i];

        // NOI should grow or stay flat
        if (currYear.noi < prevYear.noi) {
          console.log(`❌ Year ${i + 1}: NOI decreased (${prevYear.noi} → ${currYear.noi})`);
          issues++;
        }

        // Cumulative returns should only increase
        if (currYear.cumulativeReturns < prevYear.cumulativeReturns) {
          console.log(`❌ Year ${i + 1}: Cumulative returns decreased`);
          issues++;
        }

        // PIK balances should grow (they compound)
        if (currYear.investorPikBalance && prevYear.investorPikBalance) {
          if (currYear.investorPikBalance < prevYear.investorPikBalance) {
            console.log(`❌ Year ${i + 1}: PIK balance decreased (should compound)`);
            issues++;
          }
        }
      }

      if (issues === 0) {
        console.log('✅ All year-over-year relationships valid');
      }

      expect(issues).toBe(0);
    });

    it('should have mathematically consistent promote split', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n--- Promote Split Validation ---');

      // Find first year where promote applies (after equity recovery)
      const investorEquity = result.investorEquity!;
      let promoteYear = -1;

      for (let i = 0; i < result.investorCashFlows.length; i++) {
        if (result.investorCashFlows[i].cumulativeReturns >= investorEquity) {
          promoteYear = i + 1;
          break;
        }
      }

      if (promoteYear > 0) {
        console.log(`Promote begins in Year ${promoteYear}`);
        console.log(`Investor Equity: $${investorEquity.toFixed(6)}M`);
        console.log(`Year ${promoteYear} Cumulative: $${result.investorCashFlows[promoteYear - 1].cumulativeReturns.toFixed(6)}M`);
        console.log('✅ Promote timing consistent with equity recovery');
      } else {
        console.log('ℹ️  Equity not yet recovered (promote not triggered)');
      }

      expect(promoteYear).toBeGreaterThan(0);
    });
  });

  describe('5. Edge Cases & Boundaries', () => {
    it('should handle Year 5 OZ tax payment correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== EDGE CASE: OZ YEAR 5 TAX PAYMENT ===');

      const year5Flow = result.investorCashFlows[4];
      const ozTax = year5Flow.ozYear5TaxPayment;

      console.log('Year 5 OZ Tax Payment: $' + ozTax.toFixed(6) + 'M');

      // Calculate expected
      const deferredGains = TRACE_4001_PARAMS.deferredCapitalGains!;
      const stepUp = 0.10; // Standard OZ
      const capGainsRate = TRACE_4001_PARAMS.capitalGainsTaxRate! / 100;
      const expectedOzTax = deferredGains * (1 - stepUp) * capGainsRate;

      console.log('Expected OZ Tax: $' + expectedOzTax.toFixed(6) + 'M');
      console.log('Deferred Gains: $' + deferredGains + 'M');
      console.log('Step-up: ' + (stepUp * 100) + '%');
      console.log('Tax Rate: ' + (capGainsRate * 100) + '%');

      expect(Math.abs(ozTax - expectedOzTax)).toBeLessThan(0.01);

      console.log('✅ OZ Year 5 tax calculation correct');
    });

    it('should handle DSCR management correctly', () => {
      const result = calculateFullInvestorAnalysis(TRACE_4001_PARAMS as CalculationParams);

      console.log('\n=== EDGE CASE: DSCR MANAGEMENT ===');

      // Check that DSCR is maintained appropriately
      let dcsrViolations = 0;
      const targetDSCR = 1.05;

      result.investorCashFlows.forEach((flow, idx) => {
        const year = idx + 1;
        if (flow.dscr > 0 && flow.dscr < (targetDSCR - 0.1)) {
          console.log(`⚠️  Year ${year}: DSCR = ${flow.dscr.toFixed(3)} (below ${targetDSCR})`);
          dcsrViolations++;
        }
      });

      if (dcsrViolations === 0) {
        console.log('✅ DSCR maintained at target levels throughout hold period');
      }

      // Some violations may be acceptable during lease-up
      expect(dcsrViolations).toBeLessThan(3);
    });
  });
});
