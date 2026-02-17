/**
 * Surgical diagnostic: taxBenefitDelayMonths effect on IRR, MOIC, per-year cashflows
 *
 * Purpose: Verify that delay=6 produces measurably different IRR/MOIC than delay=0
 * in the calculation engine (not the UI). If these tests pass, the bug is in the UI path.
 * If these tests fail, the bug is in the pending array logic.
 *
 * Three test groups:
 *   1. delay=0 vs delay=6 (no construction)
 *   2. delay=0 vs delay=6 (with constructionDelayMonths=24)
 *   3. delay=0 vs delay=1 (minimal shift — proves sub-12 values work)
 */

import { calculateFullInvestorAnalysis } from '../../calculations';

// Shared base params — matches iss-064 fixture exactly
const baseParams = {
  projectCost: 100,
  predevelopmentCosts: 0,
  landValue: 5,
  yearOneNOI: 6,
  yearOneDepreciationPct: 100,
  holdPeriod: 10,
  revenueGrowth: 3,
  expenseGrowth: 2,
  exitCapRate: 5.5,
  opexRatio: 25,
  federalTaxRate: 37,
  stateTaxRate: 5,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  stateCapitalGainsRate: 5,
  depreciationRecaptureRate: 25,
  deferredGains: 0,
  hdcFeeRate: 0,
  hdcAdvanceFinancing: false,
  taxAdvanceDiscountRate: 10,
  advanceFinancingRate: 10,
  taxDeliveryMonths: 0,
  investorEquityPct: 20,
  philanthropicEquityPct: 0,
  investorUpfrontCash: 20,
  totalTaxBenefit: 10,
  netTaxBenefit: 10,
  hdcFee: 0,
  investorPromoteShare: 0,
  seniorDebtPct: 50,
  seniorDebtRate: 5.5,
  seniorDebtAmortization: 30,
  seniorDebtIOYears: 5,
  philDebtPct: 10,
  philDebtRate: 7,
  philDebtAmortization: 30,
  philCurrentPayEnabled: false,
  philCurrentPayPct: 0,
  hdcSubDebtPct: 0,
  hdcSubDebtPikRate: 0,
  investorSubDebtPct: 0,
  investorSubDebtPikRate: 0,
  outsideInvestorSubDebtPct: 0,
  outsideInvestorSubDebtPikRate: 0,
  pikCurrentPayEnabled: false,
  pikCurrentPayPct: 0,
  investorPikCurrentPayEnabled: false,
  investorPikCurrentPayPct: 0,
  outsideInvestorPikCurrentPayEnabled: false,
  outsideInvestorPikCurrentPayPct: 0,
  interestReserveEnabled: false,
  interestReserveMonths: 0,
  constructionDelayMonths: 0,
  taxBenefitDelayMonths: 0,
  aumFeeEnabled: false,
  aumFeeRate: 0,
  aumCurrentPayEnabled: false,
  aumCurrentPayPct: 0,
};

describe('DIAGNOSTIC: taxBenefitDelayMonths effect on engine output', () => {

  // =========================================================================
  // GROUP 1: delay=0 vs delay=6, no construction
  // =========================================================================
  describe('Group 1: delay=0 vs delay=6 (no construction)', () => {
    let noDelay: ReturnType<typeof calculateFullInvestorAnalysis>;
    let delay6: ReturnType<typeof calculateFullInvestorAnalysis>;

    beforeAll(() => {
      noDelay = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
        taxBenefitDelayMonths: 0,
      });
      delay6 = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
        taxBenefitDelayMonths: 6,
      });
    });

    it('delay=0 and delay=6 produce different per-year taxBenefit arrays', () => {
      // Collect per-year taxBenefit for both
      const noDelayBenefits = noDelay.cashFlows.map(cf => cf.taxBenefit);
      const delay6Benefits = delay6.cashFlows.map(cf => cf.taxBenefit);

      // At least Year 1 must differ
      expect(delay6Benefits[0]).not.toBeCloseTo(noDelayBenefits[0], 0);

      // Print exact values for debugging
      const table = noDelayBenefits.map((nd, i) => ({
        year: i + 1,
        'delay=0 taxBenefit': nd,
        'delay=6 taxBenefit': delay6Benefits[i],
        delta: delay6Benefits[i] - nd,
      }));
      // Use expect().toMatchSnapshot() to freeze values for inspection
      expect(table).toMatchSnapshot('per-year taxBenefit comparison');
    });

    it('CRITICAL: delay=0 and delay=6 produce different per-year totalCashFlow arrays', () => {
      // totalCashFlow is what feeds IRR — if this is the same, IRR will be the same
      const noDelayTCF = noDelay.cashFlows.map(cf => cf.totalCashFlow);
      const delay6TCF = delay6.cashFlows.map(cf => cf.totalCashFlow);

      // Also check operatingCashFlow for waterfall compensation
      const noDelayOCF = noDelay.cashFlows.map(cf => cf.operatingCashFlow);
      const delay6OCF = delay6.cashFlows.map(cf => cf.operatingCashFlow);

      const table = noDelayTCF.map((nd, i) => ({
        year: i + 1,
        'delay=0 totalCF': nd,
        'delay=6 totalCF': delay6TCF[i],
        'totalCF delta': delay6TCF[i] - nd,
        'delay=0 opCF': noDelayOCF[i],
        'delay=6 opCF': delay6OCF[i],
        'opCF delta': delay6OCF[i] - noDelayOCF[i],
        'delay=0 taxBen': noDelay.cashFlows[i].taxBenefit,
        'delay=6 taxBen': delay6.cashFlows[i].taxBenefit,
      }));
      expect(table).toMatchSnapshot('per-year totalCashFlow + operatingCashFlow comparison');

      // At least Year 1 totalCashFlow must differ for IRR to differ
      expect(delay6TCF[0]).not.toBe(noDelayTCF[0]);
    });

    it('delay=6 IRR is strictly less than delay=0 IRR', () => {
      expect(noDelay.irr).toBeGreaterThan(0);
      expect(delay6.irr).toBeGreaterThan(0);
      expect(delay6.irr).toBeLessThan(noDelay.irr);

      // Print exact values
      expect({
        'delay=0 IRR': noDelay.irr,
        'delay=6 IRR': delay6.irr,
        'IRR delta': delay6.irr - noDelay.irr,
        'IRR delta bps': Math.round((delay6.irr - noDelay.irr) * 10000),
      }).toMatchSnapshot('IRR comparison');
    });

    it('delay=6 multiple EQUALS delay=0 (cumulative sum unchanged — only timing shifts)', () => {
      // MOIC = totalReturns / investment. Delay doesn't lose benefits (no LIHTC in this test),
      // so the cumulative sum is identical. Only IRR changes (time-value of money).
      expect(noDelay.multiple).toBeGreaterThan(0);
      expect(delay6.multiple).toBe(noDelay.multiple);
    });

    it('delay=6 totalReturns EQUALS delay=0 (cumulative sum unchanged)', () => {
      // Same reasoning: delay redistributes benefits across years without losing any
      expect(delay6.totalReturns).toBe(noDelay.totalReturns);
    });

    it('Year 1: delay=6 taxBenefit ≈ 50% of delay=0', () => {
      const ratio = delay6.cashFlows[0].taxBenefit / noDelay.cashFlows[0].taxBenefit;
      expect(ratio).toBeCloseTo(0.5, 1);
    });
  });

  // =========================================================================
  // GROUP 2: delay=0 vs delay=6, with constructionDelayMonths=24
  // =========================================================================
  describe('Group 2: delay=0 vs delay=6 (construction=24)', () => {
    let noDelay: ReturnType<typeof calculateFullInvestorAnalysis>;
    let delay6: ReturnType<typeof calculateFullInvestorAnalysis>;

    beforeAll(() => {
      noDelay = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        taxBenefitDelayMonths: 0,
      });
      delay6 = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 24,
        taxBenefitDelayMonths: 6,
      });
    });

    it('Years 1-2 are construction (both delay=0 and delay=6 have taxBenefit=0)', () => {
      expect(noDelay.cashFlows[0].taxBenefit).toBe(0);
      expect(noDelay.cashFlows[1].taxBenefit).toBe(0);
      expect(delay6.cashFlows[0].taxBenefit).toBe(0);
      expect(delay6.cashFlows[1].taxBenefit).toBe(0);
    });

    it('Year 3 (PIS year): delay=6 taxBenefit ≈ 50% of delay=0', () => {
      // Year 3 = placedInServiceYear = 3 for constructionMonths=24
      const noDelayY3 = noDelay.cashFlows[2].taxBenefit;
      const delay6Y3 = delay6.cashFlows[2].taxBenefit;

      expect(noDelayY3).toBeGreaterThan(0);
      expect(delay6Y3).toBeGreaterThan(0);

      const ratio = delay6Y3 / noDelayY3;
      expect(ratio).toBeCloseTo(0.5, 1);

      expect({
        'delay=0 Y3 taxBenefit': noDelayY3,
        'delay=6 Y3 taxBenefit': delay6Y3,
        ratio,
      }).toMatchSnapshot('Year 3 taxBenefit with construction=24');
    });

    it('delay=6 IRR < delay=0 IRR (with construction)', () => {
      expect(delay6.irr).toBeLessThan(noDelay.irr);

      expect({
        'delay=0 IRR': noDelay.irr,
        'delay=6 IRR': delay6.irr,
        'IRR delta bps': Math.round((delay6.irr - noDelay.irr) * 10000),
      }).toMatchSnapshot('IRR comparison with construction=24');
    });

    it('delay=6 multiple EQUALS delay=0 (with construction — cumulative sum unchanged)', () => {
      expect(delay6.multiple).toBe(noDelay.multiple);
    });

    it('full per-year taxBenefit array differs between delay=0 and delay=6', () => {
      const noDelayBenefits = noDelay.cashFlows.map(cf => cf.taxBenefit);
      const delay6Benefits = delay6.cashFlows.map(cf => cf.taxBenefit);

      const table = noDelayBenefits.map((nd, i) => ({
        year: i + 1,
        'delay=0': nd,
        'delay=6': delay6Benefits[i],
        delta: delay6Benefits[i] - nd,
      }));
      expect(table).toMatchSnapshot('per-year taxBenefit with construction=24');

      // At least Year 3 (PIS) must differ
      expect(delay6Benefits[2]).not.toBeCloseTo(noDelayBenefits[2], 0);
    });
  });

  // =========================================================================
  // GROUP 3: delay=0 vs delay=1 (minimal shift — proves sub-12 values work)
  // =========================================================================
  describe('Group 3: delay=0 vs delay=1 (minimal shift)', () => {
    let noDelay: ReturnType<typeof calculateFullInvestorAnalysis>;
    let delay1: ReturnType<typeof calculateFullInvestorAnalysis>;

    beforeAll(() => {
      noDelay = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
        taxBenefitDelayMonths: 0,
      });
      delay1 = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
        taxBenefitDelayMonths: 1,
      });
    });

    it('delay=1 produces different Year 1 taxBenefit than delay=0', () => {
      // delay=1: delayFraction = 1/12 ≈ 0.0833
      // Year 1 realized = (1 - 1/12) * Year 1 earned ≈ 91.67% of baseline
      const noDelayY1 = noDelay.cashFlows[0].taxBenefit;
      const delay1Y1 = delay1.cashFlows[0].taxBenefit;

      expect(noDelayY1).toBeGreaterThan(0);
      expect(delay1Y1).toBeGreaterThan(0);
      expect(delay1Y1).not.toBe(noDelayY1);

      const ratio = delay1Y1 / noDelayY1;
      // Should be ~11/12 ≈ 0.9167
      expect(ratio).toBeCloseTo(11 / 12, 2);

      expect({
        'delay=0 Y1': noDelayY1,
        'delay=1 Y1': delay1Y1,
        ratio,
        'expected ratio': 11 / 12,
      }).toMatchSnapshot('delay=1 Year 1 comparison');
    });

    it('delay=1 IRR is strictly less than delay=0 IRR', () => {
      expect(delay1.irr).toBeLessThan(noDelay.irr);

      expect({
        'delay=0 IRR': noDelay.irr,
        'delay=1 IRR': delay1.irr,
        'delta bps': Math.round((delay1.irr - noDelay.irr) * 10000),
      }).toMatchSnapshot('delay=1 IRR comparison');
    });

    it('delay=1 multiple EQUALS delay=0 (cumulative sum unchanged)', () => {
      expect(delay1.multiple).toBe(noDelay.multiple);
    });
  });

  // =========================================================================
  // BONUS: Print raw engine output structure for delay=6 (full inspection)
  // =========================================================================
  describe('Raw engine output inspection', () => {
    it('delay=6 engine output has expected shape and non-trivial values', () => {
      const result = calculateFullInvestorAnalysis({
        ...baseParams,
        constructionDelayMonths: 0,
        taxBenefitDelayMonths: 6,
      });

      // Verify the result has the expected top-level properties
      expect(result).toHaveProperty('irr');
      expect(result).toHaveProperty('multiple');
      expect(result).toHaveProperty('totalReturns');
      expect(result).toHaveProperty('cashFlows');
      expect(result.cashFlows.length).toBeGreaterThanOrEqual(10);

      // Snapshot the full summary for inspection
      expect({
        irr: result.irr,
        moic: result.multiple,
        totalReturns: result.totalReturns,
        cashFlowCount: result.cashFlows.length,
        perYearTaxBenefit: result.cashFlows.map((cf, i) => ({
          year: i + 1,
          taxBenefit: cf.taxBenefit,
          federalLIHTCCredit: cf.federalLIHTCCredit || 0,
          stateLIHTCCredit: cf.stateLIHTCCredit || 0,
        })),
      }).toMatchSnapshot('full delay=6 engine output');
    });
  });
});
