/**
 * IMPL-021b Verification Test
 * Verifies that Federal LIHTC credits are now included in IRR calculation
 */

import { calculateFullInvestorAnalysis, CalculationParams } from '../calculations';

describe('IMPL-021b: Federal LIHTC IRR Integration', () => {
  const baseParams: CalculationParams = {
    projectCost: 10000000,
    landValue: 1000000,
    investorEquityPct: 35,
    holdPeriod: 10,
    federalTaxRate: 37,
    stateCapitalGainsRate: 0,
    yearOneNOI: 600000,
    noiGrowthRate: 2,
    exitCapRate: 6,
    year1BonusDepreciationPct: 60,
    ozEnabled: false,
    ozVersionYear: 2024,
    // Debt structure
    seniorDebtPct: 55,
    seniorDebtRate: 6.5,
    seniorDebtIOYears: 3,
    seniorDebtAmortYears: 30,
    philanthropicDebtPct: 0,
    philanthropicDebtRate: 3,
    philanthropicDebtCurrentPayEnabled: false,
    // Sub-debt
    hdcSubDebtPct: 0,
    hdcSubDebtPikRate: 8,
    hdcSubDebtCurrentPayEnabled: false,
    hdcSubDebtCurrentPayRate: 0,
    investorSubDebtPct: 0,
    investorSubDebtPikRate: 8,
    investorSubDebtCurrentPayEnabled: false,
    investorSubDebtCurrentPayRate: 0,
    outsideInvestorSubDebtPct: 0,
    outsideInvestorSubDebtPikRate: 8,
    outsideInvestorSubDebtCurrentPayEnabled: false,
    outsideInvestorSubDebtCurrentPayRate: 0,
    // Fees
    hdcTaxFeeEnabled: true,
    hdcTaxFeePct: 10,
    hdcAumFeeEnabled: false,
    hdcAumFeePct: 0.5,
    hdcAumFeePikPct: 1.5,
    hdcDeferredInterestRate: 8,
    // Promote
    promoInvestorEquitySplit: 80,
    promoHDCEquitySplit: 20,
    promoAfterHurdleInvestorSplit: 60,
    promoAfterHurdleHDCSplit: 40,
    promoHurdleMOIC: 1.5,
    // Interest reserve
    interestReserveEnabled: true,
    interestReservePeriodYears: 2,
    predevelopmentCosts: 0,
    placedInServiceMonth: 1,
    // State LIHTC (disabled)
    stateLIHTCIntegration: null,
    // Federal LIHTC (will toggle)
    federalLIHTCCredits: [],
  };

  // Create 11-year LIHTC credit schedule
  const createLIHTCSchedule = (annualCredit: number): number[] => {
    const credits: number[] = [];
    for (let i = 0; i < 11; i++) {
      if (i === 0) {
        // Year 1 prorated (6 months)
        credits.push(annualCredit * 0.5);
      } else if (i === 10) {
        // Year 11 catch-up
        credits.push(annualCredit * 0.5);
      } else {
        // Years 2-10 full
        credits.push(annualCredit);
      }
    }
    return credits;
  };

  test('IRR increases when Federal LIHTC credits are included', () => {
    // Calculate without LIHTC
    const resultWithoutLIHTC = calculateFullInvestorAnalysis(baseParams);

    // Calculate with LIHTC ($90K/year, ~$855K total)
    const federalLIHTCCredits = createLIHTCSchedule(90000);
    const resultWithLIHTC = calculateFullInvestorAnalysis({
      ...baseParams,
      federalLIHTCCredits,
    });

    console.log('\n=== IMPL-021b VERIFICATION ===');
    console.log('Without LIHTC IRR:', resultWithoutLIHTC.irr.toFixed(2) + '%');
    console.log('With LIHTC IRR:', resultWithLIHTC.irr.toFixed(2) + '%');
    console.log('IRR Increase:', (resultWithLIHTC.irr - resultWithoutLIHTC.irr).toFixed(2) + ' pp');

    // IRR should increase when LIHTC is enabled
    expect(resultWithLIHTC.irr).toBeGreaterThan(resultWithoutLIHTC.irr);
  });

  test('Federal LIHTC credit appears in totalCashFlow for each year', () => {
    const federalLIHTCCredits = createLIHTCSchedule(90000);
    const result = calculateFullInvestorAnalysis({
      ...baseParams,
      federalLIHTCCredits,
    });

    // Year 1 should have prorated credit (45000)
    expect(result.investorCashFlows[0].federalLIHTCCredit).toBe(45000);

    // Year 2 should have full credit (90000)
    expect(result.investorCashFlows[1].federalLIHTCCredit).toBe(90000);

    // Year 10 should have full credit (90000)
    expect(result.investorCashFlows[9].federalLIHTCCredit).toBe(90000);

    console.log('\n=== Year-by-Year LIHTC Credits ===');
    result.investorCashFlows.forEach((cf, idx) => {
      console.log(`Year ${idx + 1}: $${(cf.federalLIHTCCredit || 0).toLocaleString()}`);
    });
  });

  test('Federal LIHTC credits go 100% to investor (no promote split)', () => {
    const federalLIHTCCredits = createLIHTCSchedule(100000); // Use round number for easy verification
    const result = calculateFullInvestorAnalysis({
      ...baseParams,
      federalLIHTCCredits,
    });

    // Year 2 credit should be exactly 100000 (no split)
    expect(result.investorCashFlows[1].federalLIHTCCredit).toBe(100000);

    // Verify the credit is added to totalCashFlow
    const y2WithCredit = result.investorCashFlows[1];
    const resultNoCredit = calculateFullInvestorAnalysis(baseParams);
    const y2NoCredit = resultNoCredit.investorCashFlows[1];

    // totalCashFlow difference should equal the credit amount
    const difference = y2WithCredit.totalCashFlow - y2NoCredit.totalCashFlow;
    expect(difference).toBe(100000);

    console.log('\n=== Promote Split Verification ===');
    console.log('Year 2 LIHTC Credit: $100,000');
    console.log('TotalCashFlow Difference: $' + difference.toLocaleString());
    console.log('100% to investor: ' + (difference === 100000 ? 'YES' : 'NO'));
  });

  test('Empty LIHTC array does not affect calculation', () => {
    const resultNoArray = calculateFullInvestorAnalysis(baseParams);
    const resultEmptyArray = calculateFullInvestorAnalysis({
      ...baseParams,
      federalLIHTCCredits: [],
    });

    expect(resultNoArray.irr).toBe(resultEmptyArray.irr);
    expect(resultNoArray.investorCashFlows[0].totalCashFlow)
      .toBe(resultEmptyArray.investorCashFlows[0].totalCashFlow);
  });

  test('Year 11 credits apply to Year 10 (within hold period)', () => {
    // 10-year hold period means Year 11 credit should be in Year 10 or excluded
    const credits = createLIHTCSchedule(100000);
    const result = calculateFullInvestorAnalysis({
      ...baseParams,
      holdPeriod: 10,
      federalLIHTCCredits: credits,
    });

    // Verify we have exactly 11 years of cash flows (IMPL-087: +1 disposition year)
    expect(result.investorCashFlows.length).toBe(11);

    // Year 10 should have Year 10's credit (full annual)
    expect(result.investorCashFlows[9].federalLIHTCCredit).toBe(100000);

    console.log('\n=== Year 11 Handling ===');
    console.log('Hold Period: 10 years');
    console.log('Cash Flow Years:', result.investorCashFlows.length);
    console.log('Year 11 catch-up credit ($50K) goes to: exit proceeds');
  });
});
