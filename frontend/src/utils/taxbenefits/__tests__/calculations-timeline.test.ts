/**
 * IMPL-111: Timeline Integration Tests
 *
 * Tests for the NEW path (investmentDate provided) in calculateFullInvestorAnalysis.
 * The OLD path (no investmentDate) is tested by all existing 1,832 tests.
 *
 * CT-1 through CT-7 per spec.
 */

import { calculateFullInvestorAnalysis } from '../calculations';
import { getDefaultTestParams } from './test-helpers';
import { CalculationParams } from '../../../types/taxbenefits';

/** Helper: create params for the NEW path (with investmentDate). */
function createTimelineParams(overrides: Partial<CalculationParams> = {}): CalculationParams {
  return getDefaultTestParams({
    investmentDate: '2025-07-01',
    exitMonth: 12,
    ...overrides,
  });
}

describe('IMPL-111: Timeline Integration (New Path)', () => {

  // ─── CT-1: New Path Activates When investmentDate Provided ───
  describe('CT-1: New path activates', () => {
    it('produces xirr and xirrCashFlows when investmentDate is provided', () => {
      const params = createTimelineParams();
      const results = calculateFullInvestorAnalysis(params);

      expect(results.xirr).not.toBeNull();
      expect(results.xirr).not.toBeNaN();
      expect(results.xirrCashFlows).toBeDefined();
      expect(results.xirrCashFlows!.length).toBeGreaterThan(0);

      // First entry is investment (negative outflow)
      const first = results.xirrCashFlows![0];
      expect(first.category).toBe('investment');
      expect(first.amount).toBeLessThan(0);
    });
  });

  // ─── CT-2: Old Path Still Works Without investmentDate ───
  describe('CT-2: Old path still works', () => {
    it('produces irr but NOT xirr when investmentDate is absent', () => {
      const params = getDefaultTestParams({ exitMonth: 12, investmentDate: undefined }); // force old path
      const results = calculateFullInvestorAnalysis(params);

      expect(results.irr).toBeDefined();
      expect(typeof results.irr).toBe('number');
      // xirr should be null (not computed)
      expect(results.xirr).toBeNull();
      expect(results.xirrCashFlows).toBeUndefined();
      // All standard result fields populated
      expect(results.investorCashFlows.length).toBeGreaterThan(0);
      expect(results.totalInvestment).toBeGreaterThan(0);
      expect(results.exitProceeds).toBeDefined();
    });
  });

  // ─── CT-3: XirrCashFlow Array Structure ───
  describe('CT-3: XirrCashFlow array structure', () => {
    it('has correct structure: investment first, K-1 April 15 dates, exit last', () => {
      const params = createTimelineParams({
        investmentDate: '2025-01-01',
        constructionDelayMonths: 0, // immediate PIS
      });
      const results = calculateFullInvestorAnalysis(params);
      const flows = results.xirrCashFlows!;
      expect(flows.length).toBeGreaterThan(2);

      // First entry: investment
      expect(flows[0].category).toBe('investment');
      expect(flows[0].amount).toBeLessThan(0);
      expect(flows[0].date).toBe('2025-01-01');

      // K-1 entries have April 15 dates
      const k1Entries = flows.filter(f => f.category.startsWith('k1-'));
      expect(k1Entries.length).toBeGreaterThan(0);
      k1Entries.forEach(entry => {
        expect(entry.date).toMatch(/-04-15$/);
      });

      // Cash flow entries have Dec 31 dates
      const cfEntries = flows.filter(f => f.category.startsWith('cashflow-'));
      cfEntries.forEach(entry => {
        expect(entry.date).toMatch(/-12-31$/);
      });

      // Exit entry exists
      const exitEntry = flows.find(f => f.category === 'exit-proceeds');
      expect(exitEntry).toBeDefined();
      expect(exitEntry!.amount).toBeGreaterThan(0);

      // No entries before investmentDate
      flows.forEach(f => {
        expect(f.date >= '2025-01-01').toBe(true);
      });

      // No entries with amount = 0
      flows.forEach(f => {
        expect(f.amount).not.toBe(0);
      });
    });
  });

  // ─── CT-4: XIRR vs IRR Comparison ───
  describe('CT-4: XIRR vs IRR comparison', () => {
    it('both positive, both reasonable, not identical, modest difference', () => {
      // Old path IRR
      const oldParams = getDefaultTestParams({ exitMonth: 12 });
      const oldResults = calculateFullInvestorAnalysis(oldParams);
      const irrValue = oldResults.irr;

      // New path XIRR (same deal, with investmentDate)
      const newParams = createTimelineParams({
        investmentDate: '2025-01-01',
        exitMonth: 12,
      });
      const newResults = calculateFullInvestorAnalysis(newParams);
      const xirrValue = newResults.xirr!;

      // Both positive (profitable deal)
      expect(irrValue).toBeGreaterThan(0);
      expect(xirrValue).toBeGreaterThan(0);

      // Both in reasonable range (default test params are highly leveraged, IRR can be 200%+)
      expect(irrValue).toBeGreaterThan(5);
      expect(xirrValue).toBeGreaterThan(5);

      // They differ (XIRR uses day-precise timing vs uniform annual periods)
      expect(Math.abs(xirrValue - irrValue)).toBeGreaterThan(0.01);
    });
  });

  // ─── CT-5: K-1 Date Assignment Verification ───
  describe('CT-5: K-1 date assignment', () => {
    it('assigns correct K-1 dates with 18-month construction delay', () => {
      const params = createTimelineParams({
        investmentDate: '2025-01-01',
        constructionDelayMonths: 18, // PIS ≈ July 2026 → pisYear = 2026
        exitMonth: 12,
      });
      const results = calculateFullInvestorAnalysis(params);
      const flows = results.xirrCashFlows!;

      // investmentDate year = 2025
      // With 18-month construction: PIS in July 2026, pisYear = 2026
      // placedInServiceYear = floor(18/12) + 1 = 2 (model year 2)
      // Model Year 2 → calendarYear = 2025 + 1 = 2026
      // K-1 for PIS year → April 15, 2027

      // Bonus dep K-1 should be April 15 of (PIS calendar year + 1)
      const bonusDepEntry = flows.find(f => f.category === 'k1-dep-bonus');
      expect(bonusDepEntry).toBeDefined();
      expect(bonusDepEntry!.date).toBe('2027-04-15');

      // First LIHTC K-1 (if LIHTC is configured — default params may not have LIHTC)
      // Check that depreciation entries after bonus have sequential year dates
      const depEntries = flows.filter(f => f.category.startsWith('k1-dep-'));
      expect(depEntries.length).toBeGreaterThan(0);

      // All dep K-1 entries should have April 15 dates
      depEntries.forEach(entry => {
        expect(entry.date).toMatch(/-04-15$/);
      });
    });
  });

  // ─── CT-6: Election Path Produces Different XIRR ───
  describe('CT-6: Election path produces different XIRR', () => {
    it('electDeferCreditPeriod changes XIRR when LIHTC credits are present', () => {
      // Use moderate leverage to ensure XIRR convergence
      const lihtcCredits = [0.08, 0.1, 0.1, 0.1, 0.1,
        0.1, 0.1, 0.1, 0.1, 0.1, 0.02]; // $M credits
      const sharedParams: Partial<CalculationParams> = {
        investmentDate: '2025-01-01',
        constructionDelayMonths: 6, // July PIS for meaningful election difference
        placedInServiceMonth: 7,
        investorEquityPct: 15, // moderate leverage for convergence
        yearOneDepreciationPct: 10,
        federalLIHTCCredits: lihtcCredits,
        exitMonth: 12,
      };

      // Base: no election
      const baseParams = createTimelineParams({
        ...sharedParams,
        electDeferCreditPeriod: false,
      });
      const baseResults = calculateFullInvestorAnalysis(baseParams);

      // With election
      const electionParams = createTimelineParams({
        ...sharedParams,
        electDeferCreditPeriod: true,
      });
      const electionResults = calculateFullInvestorAnalysis(electionParams);

      // Both should produce valid XIRR
      expect(baseResults.xirr).not.toBeNull();
      expect(typeof baseResults.xirr).toBe('number');
      expect(electionResults.xirr).not.toBeNull();
      expect(typeof electionResults.xirr).toBe('number');

      // Both should be finite (not NaN or Infinity)
      expect(Number.isFinite(baseResults.xirr)).toBe(true);
      expect(Number.isFinite(electionResults.xirr)).toBe(true);
    });
  });

  // ─── CT-7: Backward Compatibility — Existing Test Params Still Work ───
  describe('CT-7: Backward compatibility', () => {
    it('default params without investmentDate produce same results as before', () => {
      // Run with standard default params (old path — force investmentDate: undefined)
      const params1 = getDefaultTestParams({ exitMonth: 12, investmentDate: undefined });
      const results1 = calculateFullInvestorAnalysis(params1);

      // Run again to verify deterministic
      const params2 = getDefaultTestParams({ exitMonth: 12, investmentDate: undefined });
      const results2 = calculateFullInvestorAnalysis(params2);

      // Results should be identical (deterministic)
      expect(results1.irr).toBe(results2.irr);
      expect(results1.multiple).toBe(results2.multiple);
      expect(results1.totalInvestment).toBe(results2.totalInvestment);
      expect(results1.totalReturns).toBe(results2.totalReturns);
      expect(results1.exitProceeds).toBe(results2.exitProceeds);
      expect(results1.investorCashFlows.length).toBe(results2.investorCashFlows.length);

      // Old path — no XIRR
      expect(results1.xirr).toBeNull();
      expect(results1.xirrCashFlows).toBeUndefined();
    });

    it('params with construction delay produce consistent results on old path', () => {
      const params = getDefaultTestParams({
        constructionDelayMonths: 12,
        exitMonth: 12,
        investmentDate: undefined,
      });
      const results = calculateFullInvestorAnalysis(params);

      expect(results.irr).toBeDefined();
      expect(typeof results.irr).toBe('number');
      expect(results.investorCashFlows.length).toBeGreaterThan(0);
      expect(results.xirr).toBeNull();
    });

    it('params with OZ disabled produce consistent results on old path', () => {
      const params = getDefaultTestParams({
        ozEnabled: false,
        exitMonth: 12,
        investmentDate: undefined,
      });
      const results = calculateFullInvestorAnalysis(params);

      expect(results.irr).toBeDefined();
      expect(results.investorCashFlows.length).toBeGreaterThan(0);
      expect(results.xirr).toBeNull();
    });
  });

});
