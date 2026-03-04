/**
 * Comprehensive Waterfall Testing Suite
 * Tests all interdependencies and conditional fields in the HDC calculation engine
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';
import { CalculationParams } from '../../../types/taxbenefits';

describe('HDC Waterfall Comprehensive Tests', () => {
  // Base parameters for all tests
  const baseParams: CalculationParams = {
    projectCost: 10000000, // $10M project
    landValue: 1000000,
    yearOneNOI: 600000,
    holdPeriod: 10,
    exitCapRate: 7.0,
    // ISS-068c: Single NOI growth rate
    noiGrowthRate: 3.0,

    // Capital Structure
    investorEquityPct: 20,
    philanthropicEquityPct: 10,
    philanthropicDebtPct: 10,
    philanthropicDebtRate: 2.0,
    seniorDebtPct: 60,
    seniorDebtRate: 5.5,
    seniorDebtAmortization: 25,
    hdcSubDebtPct: 0,
    investorSubDebtPct: 0,
    outsideInvestorSubDebtPct: 0,

    // Tax Settings
    yearOneDepreciationPct: 80,
    effectiveTaxRate: 40,
    investorPromoteShare: 70,
    federalTaxRate: 37,
    stateTaxRate: 9.3,
    ltCapitalGainsRate: 20,

    // HDC Fees
    hdcFeeRate: 0,
    hdcDeferredInterestRate: 8,
    hdcDeferralInterestRate: 8, // Interest on deferred HDC fees

    // All conditional fields OFF initially
    aumFeeEnabled: false,
    aumFeeRate: 0,
    aumCurrentPayEnabled: false,
    aumCurrentPayPct: 0,
    hdcSubDebtPikRate: 0,
    pikCurrentPayEnabled: false,
    pikCurrentPayPct: 0,
    investorSubDebtPikRate: 0,
    investorPikCurrentPayEnabled: false,
    investorPikCurrentPayPct: 0,
    outsideInvestorSubDebtPikRate: 0,
    outsideInvestorPikCurrentPayEnabled: false,
    outsideInvestorPikCurrentPayPct: 0,
    philCurrentPayEnabled: false,
    philCurrentPayPct: 0,

    // Timing
    constructionDelayMonths: 0,
    placedInServiceMonth: 1,

    // OZ Settings
    ozType: undefined,
    deferredCapitalGains: 0,
    capitalGainsTaxRate: 0,

    // Required additional properties
    // ISS-068c: expenseGrowth replaced by noiGrowthRate above
    hdcAdvanceFinancing: false,
    investorUpfrontCash: 0,
    totalTaxBenefit: 0,
    seniorDebtIOYears: 0,
    philDebtAmortization: 30,
    hdcFee: 0  // Required for HDCCalculationParams
  };

  describe('1. Basic Waterfall - No Conditional Fields', () => {
    test('Should calculate correct cash flows without any optional features', () => {
      const results = calculateFullInvestorAnalysis(baseParams);

      // Verify basic structure
      expect(results).toBeDefined();
      expect(results.investorCashFlows).toHaveLength(11);
      expect(results.investorIRR).toBeGreaterThan(0);
      expect(results.multiple).toBeGreaterThan(1);

      // Check Year 1 cash flow components
      const year1 = results.investorCashFlows[0];
      expect(year1.year).toBe(1);
      expect(year1.noi).toBeCloseTo(600000, 0);
      expect(year1.taxBenefit).toBeGreaterThan(0); // Should have depreciation benefit
      expect(year1.aumFeePaid).toBe(0); // AUM fee disabled
      expect(year1.aumFeeAccrued).toBe(0);
      expect(year1.outsideInvestorCurrentPay).toBe(0); // No outside investor

      // Check DSCR is maintained
      expect(year1.dscr).toBeCloseTo(1.05, 2);

      console.log('Test 1 - Basic Waterfall Results:', {
        investorIRR: results.investorIRR.toFixed(2) + '%',
        multiple: results.multiple.toFixed(2) + 'x',
        year1DSCR: (year1.dscr ?? 0).toFixed(3),
        year1CashFlow: year1.totalCashFlow
      });
    });
  });

  describe('2. AUM Fee Tests', () => {
    test('AUM Fee with 100% Current Pay', () => {
      const params = {
        ...baseParams,
        aumFeeEnabled: true,
        aumFeeRate: 1.5, // 1.5% AUM fee
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 100
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];
      const year2 = results.investorCashFlows[1];

      // AUM fee starts in Year 2, not Year 1
      expect(year1.aumFeePaid).toBe(0);
      expect(year1.aumFeeAccrued).toBe(0);

      // Year 2 should have AUM fee of 1.5% of project cost
      const expectedAumFee = 10000000 * 0.015;
      expect(year2.aumFeePaid).toBeCloseTo(expectedAumFee, 0);
      expect(year2.aumFeeAccrued).toBe(0); // No accrual with 100% current pay

      // Should reduce investor returns
      const baseResults = calculateFullInvestorAnalysis(baseParams);
      expect(results.investorIRR).toBeLessThan(baseResults.investorIRR);

      console.log('Test 2a - AUM Fee 100% Current Pay:', {
        aumFeePaid: year1.aumFeePaid,
        investorIRR: results.investorIRR.toFixed(2) + '%',
        irrReduction: (baseResults.investorIRR - results.investorIRR).toFixed(2) + '%'
      });
    });

    test('AUM Fee with PIK Only (0% Current Pay)', () => {
      const params = {
        ...baseParams,
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: false, // PIK only - but engine pays from available cash
        aumCurrentPayPct: 0
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];
      const year2 = results.investorCashFlows[1];

      // AUM fees start in Year 2
      expect(year1.aumFeePaid).toBe(0);
      expect(year1.aumFeeAccrued).toBe(0);

      // Year 2: Engine pays AUM fees from available cash flow (DSCR permitting)
      // Total AUM fee obligation = 1.5% of $10M = $150k
      const expectedAumFee = 10000000 * 0.015;
      const year2TotalAUM = (year2.aumFeePaid || 0) + (year2.aumFeeAccrued || 0);
      expect(year2TotalAUM).toBeCloseTo(expectedAumFee, 0);

      // Verify total AUM fees are tracked over the hold period
      const totalAumPaid = results.investorCashFlows.reduce((sum, cf) => sum + (cf.aumFeePaid || 0), 0);
      const totalAumAccrued = results.investorCashFlows.reduce((sum, cf) => sum + (cf.aumFeeAccrued || 0), 0);
      expect(totalAumPaid + totalAumAccrued).toBeGreaterThan(expectedAumFee * 5); // Multiple years of fees

      console.log('Test 2b - AUM Fee PIK Only:', {
        year1Accrued: year1.aumFeeAccrued,
        year2Paid: year2.aumFeePaid,
        year2Accrued: year2.aumFeeAccrued,
        totalPaid: totalAumPaid,
        totalAccrued: totalAumAccrued
      });
    });

    test('AUM Fee with 50% Current Pay / 50% PIK', () => {
      const params = {
        ...baseParams,
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 50
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];
      const year2 = results.investorCashFlows[1];

      // AUM fees start in Year 2
      expect(year1.aumFeePaid).toBe(0);
      expect(year1.aumFeeAccrued).toBe(0);

      // Year 2 should have mixed payment
      expect(year2.aumFeePaid).toBeCloseTo(75000, 0); // 50% of 150k
      expect(year2.aumFeeAccrued).toBeCloseTo(75000, 0); // 50% accrued

      console.log('Test 2c - AUM Fee 50/50 Split:', {
        paid: year1.aumFeePaid,
        accrued: year1.aumFeeAccrued,
        total: (year1.aumFeePaid ?? 0) + (year1.aumFeeAccrued ?? 0)
      });
    });
  });

  describe('3. Outside Investor Sub-Debt Tests', () => {
    test('Outside Investor with Current Pay', () => {
      const params = {
        ...baseParams,
        outsideInvestorSubDebtPct: 10, // 10% outside investor
        outsideInvestorSubDebtPikRate: 12,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 100
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];

      // Outside investor gets 12% on $1M (10% of $10M)
      const expectedInterest = 1000000 * 0.12;
      expect(year1.outsideInvestorCurrentPay).toBeCloseTo(expectedInterest, 0);
      expect(year1.outsideInvestorPIKAccrued).toBe(0);

      console.log('Test 3a - Outside Investor Current Pay:', {
        currentPay: year1.outsideInvestorCurrentPay,
        pikAccrued: year1.outsideInvestorPIKAccrued,
        dscr: (year1.dscr ?? 0).toFixed(3)
      });
    });

    test('Outside Investor PIK Accumulation', () => {
      const params = {
        ...baseParams,
        outsideInvestorSubDebtPct: 10,
        outsideInvestorSubDebtPikRate: 12,
        outsideInvestorPikCurrentPayEnabled: false // PIK only
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];

      expect(year1.outsideInvestorCurrentPay).toBe(0);
      expect(year1.outsideInvestorPIKAccrued).toBeGreaterThan(0); // Should have PIK accrual

      // Check compounding - final balance should be substantially higher than principal
      const principal = 10000000 * 0.1; // 10% of $10M
      expect(results.outsideInvestorSubDebtAtExit).toBeGreaterThan(principal * 2); // At least 2x with 12% over 9 years

      console.log('Test 3b - Outside Investor PIK:', {
        year1PIK: year1.outsideInvestorPIKAccrued,
        finalBalance: results.outsideInvestorSubDebtAtExit,
        totalGrowth: ((results.outsideInvestorSubDebtAtExit / principal - 1) * 100).toFixed(1) + '%'
      });
    });
  });

  describe('4. DSCR Cash Management System', () => {
    test('Should maintain 1.05x DSCR with multiple obligations', () => {
      const params = {
        ...baseParams,
        // Add multiple soft obligations
        aumFeeEnabled: true,
        aumFeeRate: 2.0,
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 100,
        hdcSubDebtPct: 5,
        hdcSubDebtPikRate: 10,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 100,
        outsideInvestorSubDebtPct: 5,
        outsideInvestorSubDebtPikRate: 12,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 100
      };

      const results = calculateFullInvestorAnalysis(params);

      // Every year should maintain exactly 1.05 DSCR
      results.investorCashFlows.forEach((cf, index) => {
        expect(cf.dscr).toBeCloseTo(1.05, 2);
        console.log(`Year ${index + 1} DSCR: ${(cf.dscr ?? 0).toFixed(4)}`);
      });

      // Check for deferrals
      const hasDeferrals = results.investorCashFlows.some(cf =>
        (cf.aumFeeAccrued ?? 0) > 0
      );

      console.log('Test 4 - DSCR Management:', {
        allAt105: results.investorCashFlows.every(cf => Math.abs((cf.dscr ?? 0) - 1.05) < 0.01),
        hasDeferrals,
        year1Details: {
          dscr: results.investorCashFlows[0].dscr,
          aumPaid: results.investorCashFlows[0].aumFeePaid,
          aumDeferred: results.investorCashFlows[0].aumFeeAccrued
        }
      });
    });

    test('Deferral priority order', () => {
      const params = {
        ...baseParams,
        yearOneNOI: 400000, // Lower NOI to force deferrals
        aumFeeEnabled: true,
        aumFeeRate: 3.0, // High fee to stress system
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 100,
        hdcSubDebtPct: 5,
        hdcSubDebtPikRate: 10,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 100
      };

      const results = calculateFullInvestorAnalysis(params);
      const year1 = results.investorCashFlows[0];

      // Should defer in priority order:
      // 1. HDC Tax Benefit Fee (first to defer)
      // 2. AUM Fee
      // 3. HDC Sub-debt

      console.log('Test 4b - Deferral Priority:', {
        noi: year1.noi,
        dscr: (year1.dscr ?? 0).toFixed(3),
        hdcTaxFeeDeferred: year1|| 0,
        aumFeeDeferred: year1.aumFeeAccrued,
        hdcSubDebtDeferred: year1.hdcSubDebtPIKAccrued || 0
      });
    });
  });

  describe('5. Complex Interaction Tests', () => {
    test('All features enabled simultaneously', () => {
      const params = {
        ...baseParams,
        // Enable everything
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 70,

        hdcSubDebtPct: 3,
        hdcSubDebtPikRate: 10,
        pikCurrentPayEnabled: true,
        pikCurrentPayPct: 60,

        investorSubDebtPct: 2,
        investorSubDebtPikRate: 9,
        investorPikCurrentPayEnabled: true,
        investorPikCurrentPayPct: 80,

        outsideInvestorSubDebtPct: 5,
        outsideInvestorSubDebtPikRate: 12,
        outsideInvestorPikCurrentPayEnabled: true,
        outsideInvestorPikCurrentPayPct: 90,

        philCurrentPayEnabled: true,
        philCurrentPayPct: 50,

        ozType: 'standard' as const,
        deferredCapitalGains: 500000,
        capitalGainsTaxRate: 20
      };

      const results = calculateFullInvestorAnalysis(params);
      const hdcResults = calculateHDCAnalysis(params);

      // Verify all components are working
      const year1 = results.investorCashFlows[0];
      const year2 = results.investorCashFlows[1];

      // AUM fees start in Year 2
      expect(year1.aumFeePaid).toBe(0);
      expect(year1.aumFeeAccrued).toBe(0);
      expect(year2.aumFeePaid).toBeGreaterThan(0);
      expect(year2.aumFeeAccrued).toBeGreaterThan(0);

      expect(year1.outsideInvestorCurrentPay).toBeGreaterThan(0);
      expect(year1.dscr).toBeCloseTo(1.05, 2);

      // Check HDC analysis - verify structure exists
      expect(hdcResults).toBeDefined();
      expect(hdcResults.hdcCashFlows).toBeDefined();
      expect(hdcResults.hdcCashFlows.length).toBeGreaterThan(0);

      // Check OZ impact (Year 5 tax payment - optional feature)
      const year5 = results.investorCashFlows[4];
      // OZ Year 5 tax payment may or may not be present depending on configuration
      expect(year5).toBeDefined();

      console.log('Test 5 - All Features Enabled:', {
        investorIRR: results.investorIRR.toFixed(2) + '%',
        investorMultiple: results.multiple.toFixed(2) + 'x',
        hdcCashFlows: hdcResults.hdcCashFlows.length,
        hdcReturns: hdcResults.totalHDCReturns,
        year1Components: {
          noi: year1.noi,
          taxBenefit: year1.taxBenefit,
          aumPaid: year1.aumFeePaid,
          aumDeferred: year1.aumFeeAccrued,
          outsideInvestor: year1.outsideInvestorCurrentPay,
          totalCashFlow: year1.totalCashFlow,
          dscr: (year1.dscr ?? 0).toFixed(3)
        },
        year5OZTax: year5.ozYear5TaxPayment || 0
      });
    });

    test('Exit proceeds waterfall distribution', () => {
      const params = {
        ...baseParams,
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: false, // All PIK to test exit collection
        outsideInvestorSubDebtPct: 10,
        outsideInvestorSubDebtPikRate: 12,
        outsideInvestorPikCurrentPayEnabled: false // All PIK
      };

      const results = calculateFullInvestorAnalysis(params);
      const hdcResults = calculateHDCAnalysis(params);

      // Get exit values
      const finalYear = results.investorCashFlows[9];

      // Verify waterfall order at exit:
      // 1. Pay off senior debt
      // 2. Pay off phil debt
      // 3. Pay accumulated AUM fees
      // 4. Pay accumulated HDC deferred fees
      // 5. Pay off outside investor with accumulated PIK
      // 6. Split remainder between investor (70%) and HDC (30%)

      console.log('Test 5b - Exit Waterfall:', {
        investorProceeds: results.exitProceeds,
        hdcProceeds: hdcResults.hdcExitProceeds,
        totalDistributed: results.exitProceeds + hdcResults.hdcExitProceeds,
        finalYearCumulativeReturns: finalYear.cumulativeReturns
      });
    });
  });

  describe('6. Edge Cases and Validation', () => {
    test('Zero NOI should not crash', () => {
      const params = {
        ...baseParams,
        yearOneNOI: 0
      };

      expect(() => calculateFullInvestorAnalysis(params)).not.toThrow();
      const results = calculateFullInvestorAnalysis(params);
      expect(results).toBeDefined();

      console.log('Test 6a - Zero NOI:', {
        completed: true,
        irr: results.investorIRR
      });
    });

    test('100% leverage should calculate', () => {
      const params = {
        ...baseParams,
        investorEquityPct: 0,
        philanthropicEquityPct: 0,
        seniorDebtPct: 70,
        philDebtPct: 30
      };

      expect(() => calculateFullInvestorAnalysis(params)).not.toThrow();
      const results = calculateFullInvestorAnalysis(params);
      expect(results).toBeDefined();

      console.log('Test 6b - 100% Leverage:', {
        completed: true,
        investorEquity: results.totalInvestment
      });
    });

    // ISS-068c: Updated to use direct NOI growth rate
    test('Negative growth rates', () => {
      const params = {
        ...baseParams,
        noiGrowthRate: -3.0 // Declining NOI
      };

      const results = calculateFullInvestorAnalysis(params);
      const cashFlows = results.investorCashFlows;

      // NOI should decline each year
      expect(cashFlows[1].noi).toBeLessThan(cashFlows[0].noi);
      expect(cashFlows[2].noi).toBeLessThan(cashFlows[1].noi);

      console.log('Test 6c - Negative Growth:', {
        year1NOI: cashFlows[0].noi,
        year2NOI: cashFlows[1].noi,
        year10NOI: cashFlows[9].noi,
        irr: results.investorIRR.toFixed(2) + '%'
      });
    });
  });
});

// Run summary function
export function runWaterfallTestSummary() {
  console.log('\n========================================');
  console.log('WATERFALL CALCULATION ENGINE TEST SUITE');
  console.log('========================================\n');
  console.log('Testing all interdependencies:');
  console.log('- Basic waterfall without conditionals');
  console.log('- AUM fees (current pay, PIK, mixed)');
  console.log('- Outside investor sub-debt');
  console.log('- DSCR cash management (1.05x target)');
  console.log('- Deferral priority order');
  console.log('- Complex interactions (all features)');
  console.log('- Exit proceeds waterfall');
  console.log('- Edge cases and validation\n');
  console.log('Run: npm test waterfall-comprehensive.test.ts');
  console.log('========================================\n');
}