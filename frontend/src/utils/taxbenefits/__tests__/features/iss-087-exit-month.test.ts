/**
 * IMPL-087: Exit-Month Precision — Integration Tests
 *
 * Runs on the OLD path (no investmentDate) so exitMonth param directly
 * controls disposition-year proration fraction.
 * (On the new path, exitMonth is auto-derived from timeline.actualExitDate.)
 *
 * Verifies disposition year proration across all financial items:
 *   - NOI prorated by exitMonth/12
 *   - MACRS uses IRC §168(d)(2) mid-month convention: (exitMonth - 0.5) / 12
 *   - Senior debt service prorated by exitMonth/12
 *   - AUM fees prorated by exitMonth/12
 *   - Sub-debt PIK prorated by exitMonth/12
 *   - LIHTC credits = 0 in disposition year
 *   - Trailing 12-month NOI blends prior + disposition year for exit valuation
 *   - exitMonth=12 → backward compatible (full year)
 */

import { calculateFullInvestorAnalysis } from '../../calculations';
import { getDefaultTestParams } from '../test-helpers';

describe('IMPL-087: Exit-Month Precision', () => {
  /**
   * Helper: run engine with specified exitMonth and return key fields.
   * Forces OLD path (investmentDate: undefined) so exitMonth param is used directly.
   * Jan PIS → holdPeriod = 11 on old path (computeHoldPeriod adds +1 disposition).
   */
  function runWithExitMonth(exitMonth: number, overrides: Record<string, any> = {}) {
    const result = calculateFullInvestorAnalysis(getDefaultTestParams({
      investmentDate: undefined, // Force old path — exitMonth param controls proration
      exitMonth,
      ...overrides,
    }));
    const lastYear = result.cashFlows[result.cashFlows.length - 1];
    const priorYear = result.cashFlows.length >= 2
      ? result.cashFlows[result.cashFlows.length - 2]
      : null;
    return { result, lastYear, priorYear };
  }

  describe('disposition year NOI proration', () => {
    it('exitMonth=6 → disposition year NOI ≈ 50% of annualized', () => {
      const { lastYear } = runWithExitMonth(6);
      const fraction = 6 / 12;

      // annualizedNOI is the full-year NOI before proration
      expect(lastYear.annualizedNOI).toBeGreaterThan(0);
      expect(lastYear.noi).toBeCloseTo(lastYear.annualizedNOI! * fraction, 4);
    });

    it('exitMonth=12 → disposition year NOI = annualized (full year)', () => {
      const { lastYear } = runWithExitMonth(12);
      expect(lastYear.noi).toBeCloseTo(lastYear.annualizedNOI!, 4);
    });

    it('exitMonth=1 → disposition year NOI ≈ 1/12 of annualized', () => {
      const { lastYear } = runWithExitMonth(1);
      const fraction = 1 / 12;
      expect(lastYear.noi).toBeCloseTo(lastYear.annualizedNOI! * fraction, 4);
    });
  });

  describe('disposition year MACRS — IRC §168(d)(2) mid-month convention', () => {
    it('exitMonth=6 → MACRS fraction = (6-0.5)/12 = 45.83%', () => {
      const { result: full } = runWithExitMonth(12);
      const { result: partial } = runWithExitMonth(6);

      const fullLastYear = full.cashFlows[full.cashFlows.length - 1];
      const partialLastYear = partial.cashFlows[partial.cashFlows.length - 1];

      // Both should be in depreciation years (Year 11 with pisMonth=1)
      // The mid-month convention means (6-0.5)/12 = 0.4583 of the full-year amount
      const expectedFraction = (6 - 0.5) / 12;
      const fullFraction = (12 - 0.5) / 12;

      // Tax benefit in disposition year scales with MACRS fraction
      // (not exactly linear because taxBenefit includes other components, but depreciation dominates)
      if (fullLastYear.taxBenefit !== 0 && partialLastYear.taxBenefit !== 0) {
        const ratio = partialLastYear.taxBenefit / fullLastYear.taxBenefit;
        expect(ratio).toBeCloseTo(expectedFraction / fullFraction, 1);
      }
    });
  });

  describe('disposition year senior debt proration', () => {
    it('exitMonth=6 → senior debt service ≈ 50% of full year', () => {
      const { result: full } = runWithExitMonth(12);
      const { result: partial } = runWithExitMonth(6);

      const fullLastDS = full.cashFlows[full.cashFlows.length - 1].debtService;
      const partialLastDS = partial.cashFlows[partial.cashFlows.length - 1].debtService;

      if (fullLastDS > 0) {
        expect(partialLastDS / fullLastDS).toBeCloseTo(6 / 12, 1);
      }
    });
  });

  describe('disposition year AUM fee proration', () => {
    it('exitMonth=6 with AUM enabled → fee ≈ 50% of full year', () => {
      const overrides = {
        aumFeeEnabled: true,
        aumFeeRate: 1.5,
        aumCurrentPayEnabled: true,
        aumCurrentPayPct: 100,
      };
      const { result: full } = runWithExitMonth(12, overrides);
      const { result: partial } = runWithExitMonth(6, overrides);

      const fullLastAUM = full.cashFlows[full.cashFlows.length - 1].aumFee || 0;
      const partialLastAUM = partial.cashFlows[partial.cashFlows.length - 1].aumFee || 0;

      if (fullLastAUM > 0) {
        expect(partialLastAUM / fullLastAUM).toBeCloseTo(0.5, 1);
      }
    });
  });

  describe('disposition year sub-debt PIK proration', () => {
    it('exitMonth=6 with HDC sub-debt → PIK interest prorated in disposition year', () => {
      const overrides = {
        hdcSubDebtPct: 5,
        hdcSubDebtPikRate: 8,
      };
      const { result: full } = runWithExitMonth(12, overrides);
      const { result: partial } = runWithExitMonth(6, overrides);

      // With exitMonth=6, disposition year PIK accrual should be ~50% of exitMonth=12
      // The PIK balance compounds, so compare the disposition year increment
      const fullCFs = full.cashFlows;
      const partialCFs = partial.cashFlows;
      const fullLastPIK = fullCFs[fullCFs.length - 1].hdcSubDebtPIKBalance || 0;
      const fullPriorPIK = fullCFs[fullCFs.length - 2].hdcSubDebtPIKBalance || 0;
      const partialLastPIK = partialCFs[partialCFs.length - 1].hdcSubDebtPIKBalance || 0;
      const partialPriorPIK = partialCFs[partialCFs.length - 2].hdcSubDebtPIKBalance || 0;

      const fullIncrement = fullLastPIK - fullPriorPIK;
      const partialIncrement = partialLastPIK - partialPriorPIK;

      if (fullIncrement > 0) {
        expect(partialIncrement / fullIncrement).toBeCloseTo(0.5, 1);
      }
    });
  });

  describe('LIHTC credits = 0 in disposition year', () => {
    it('all credits exhausted before disposition year', () => {
      const { result } = runWithExitMonth(6, {
        lihtcEnabled: true,
        lihtcEligibleBasis: 50,
      });

      expect(result.remainingLIHTCCredits).toBe(0);

      // The disposition year (last year) should have 0 LIHTC
      const lastYear = result.cashFlows[result.cashFlows.length - 1];
      expect(lastYear.federalLIHTCCredit || 0).toBe(0);
    });
  });

  describe('trailing 12-month NOI for exit valuation', () => {
    it('exitMonth=6 → blends 50% prior year + 50% disposition year annualized NOI', () => {
      const { result, lastYear, priorYear } = runWithExitMonth(6);

      // Trailing NOI = (priorYearNOI * (12-exitMonth)/12) + (dispoYearAnnualizedNOI * exitMonth/12)
      const exitMonth = 6;
      const priorNOI = priorYear!.annualizedNOI ?? priorYear!.noi;
      const dispoNOI = lastYear.annualizedNOI!;
      const expectedTrailing = (priorNOI * (12 - exitMonth) / 12) + (dispoNOI * exitMonth / 12);
      const expectedExitValue = expectedTrailing / (5.0 / 100); // exitCapRate = 5%

      // exitValue is the raw trailing NOI / cap rate (before debt payoff)
      expect(result.exitValue).toBeCloseTo(expectedExitValue, -2);
    });

    it('exitMonth=12 → trailing NOI = 100% disposition year annualized', () => {
      const { result, lastYear } = runWithExitMonth(12);

      const dispoNOI = lastYear.annualizedNOI!;
      const expectedExitValue = dispoNOI / (5.0 / 100);

      expect(result.exitValue).toBeCloseTo(expectedExitValue, -2);
    });
  });

  describe('exitMonth=12 backward compatibility', () => {
    it('dispositionFraction = 1.0 → full final year values', () => {
      const { lastYear } = runWithExitMonth(12);

      // NOI should equal annualizedNOI (no proration)
      expect(lastYear.noi).toBeCloseTo(lastYear.annualizedNOI!, 4);
    });

    it('holdPeriod and cashFlows.length match computeHoldPeriod (old path)', () => {
      // Old path: Jan PIS, no construction → totalInvestmentYears = 11
      const { result } = runWithExitMonth(12);
      expect(result.holdPeriod).toBe(11);
      expect(result.cashFlows.length).toBe(11);
    });
  });

  describe('exitMonth=6 → dispositionFraction=0.5 halves all items', () => {
    it('all prorated items are approximately half of exitMonth=12', () => {
      const { result: full } = runWithExitMonth(12);
      const { result: half } = runWithExitMonth(6);

      const fullLast = full.cashFlows[full.cashFlows.length - 1];
      const halfLast = half.cashFlows[half.cashFlows.length - 1];

      // NOI: exactly 50%
      expect(halfLast.noi / fullLast.noi).toBeCloseTo(0.5, 2);

      // Debt service: approximately 50%
      if (fullLast.debtService > 0) {
        expect(halfLast.debtService / fullLast.debtService).toBeCloseTo(0.5, 1);
      }
    });
  });

  describe('exitMonth=1 → near-zero disposition year', () => {
    it('disposition year NOI ≈ 1/12 of annualized', () => {
      const { lastYear } = runWithExitMonth(1);
      expect(lastYear.noi / lastYear.annualizedNOI!).toBeCloseTo(1 / 12, 2);
    });

    it('holdPeriod unchanged (still 11 for old path default params)', () => {
      const { result } = runWithExitMonth(1);
      expect(result.holdPeriod).toBe(11);
      expect(result.cashFlows.length).toBe(11);
    });
  });
});
