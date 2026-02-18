/**
 * Stage 5.5: Exit Tax Engine — Validation Suite
 *
 * Tests calculateExitTax() and getEffectiveStateCapGainsRate() covering:
 * - E-1 through E-20: Unit tests for all exit tax paths
 * - Scenarios 10A/10B: Integration tests with full engine
 *
 * IRC compliance: §1245 ordinary recapture, §1250 unrecaptured (25% cap),
 * NIIT three-source model, state conformity, OZ exclusion.
 */

import { calculateExitTax, getEffectiveStateCapGainsRate, calculateFullInvestorAnalysis } from '../../calculations';
import type { CalculationParams, ExitTaxResult } from '../../../../types/taxbenefits';
import { getDefaultTestParams } from '../test-helpers';

// ───────────────────────────────────────────────────────────────
// Helper: standard non-OZ params for unit tests
// ───────────────────────────────────────────────────────────────
const baseExitTaxParams = {
  cumulative1245: 10,         // $10M §1245 (cost seg / bonus)
  cumulative1250: 20,         // $20M §1250 (straight-line)
  appreciationGain: 15,       // $15M LTCG
  federalOrdinaryRate: 0.37,  // 37% top bracket
  federalCapGainsRate: 0.20,  // 20% LTCG
  niitRate: 0.038,            // 3.8% NIIT
  niitApplies: true,          // passive investor
  investorState: 'CA',        // non-conforming state
  stateCapitalGainsRate: 0.133, // 13.3% CA
  ozEnabled: false,
  holdPeriod: 10,
};

// ───────────────────────────────────────────────────────────────
// E-1 through E-10: calculateExitTax() unit tests
// ───────────────────────────────────────────────────────────────
describe('Exit Tax Engine — Unit Tests (E-1 to E-20)', () => {

  describe('E-1: §1245 recapture at ordinary rate', () => {
    it('should tax §1245 at federal ordinary income rate', () => {
      const result = calculateExitTax(baseExitTaxParams);
      expect(result.sec1245Recapture).toBe(10);
      expect(result.sec1245Rate).toBe(0.37);
      expect(result.sec1245Tax).toBeCloseTo(10 * 0.37, 6);
    });
  });

  describe('E-2: §1250 recapture capped at 25%', () => {
    it('should tax §1250 at 25% regardless of ordinary rate', () => {
      const result = calculateExitTax(baseExitTaxParams);
      expect(result.sec1250Recapture).toBe(20);
      expect(result.sec1250Rate).toBe(0.25);
      expect(result.sec1250Tax).toBeCloseTo(20 * 0.25, 6);
    });
  });

  describe('E-3: LTCG at federal capital gains rate', () => {
    it('should tax remaining gain at federal cap gains rate', () => {
      const result = calculateExitTax(baseExitTaxParams);
      expect(result.remainingGain).toBe(15);
      expect(result.remainingGainRate).toBe(0.20);
      expect(result.remainingGainTax).toBeCloseTo(15 * 0.20, 6);
    });
  });

  describe('E-4: NIIT stacks on all gain characters (passive)', () => {
    it('should apply 3.8% NIIT to total gain when niitApplies is true', () => {
      const result = calculateExitTax(baseExitTaxParams);
      const totalGain = 10 + 20 + 15; // 45
      expect(result.niitRate).toBe(0.038);
      expect(result.niitTax).toBeCloseTo(totalGain * 0.038, 6);
    });
  });

  describe('E-5: NIIT excluded when niitApplies is false', () => {
    it('should set NIIT to 0 when niitApplies is false', () => {
      const result = calculateExitTax({ ...baseExitTaxParams, niitApplies: false });
      expect(result.niitRate).toBe(0);
      expect(result.niitTax).toBe(0);
    });
  });

  describe('E-6: Total federal tax = sum of all components', () => {
    it('should equal sum of §1245 + §1250 + LTCG + NIIT taxes', () => {
      const result = calculateExitTax(baseExitTaxParams);
      const expected = result.sec1245Tax + result.sec1250Tax + result.remainingGainTax + result.niitTax;
      expect(result.totalFederalExitTax).toBeCloseTo(expected, 6);
    });
  });

  describe('E-7: State exit tax for non-conforming state (CA)', () => {
    it('should apply full state rate to total gain for non-conforming OZ state', () => {
      const params = { ...baseExitTaxParams, ozEnabled: true };
      const result = calculateExitTax(params);
      const totalGain = 10 + 20 + 15;
      // CA is 'none' conformity → full state rate applied
      expect(result.stateExitTax).toBeCloseTo(totalGain * 0.133, 6);
      expect(result.stateConformity).toBe('none');
    });
  });

  describe('E-8: State exit tax for conforming state (OR)', () => {
    it('should apply 0% state rate for full-rolling conforming state', () => {
      const params = { ...baseExitTaxParams, ozEnabled: true, investorState: 'OR', stateCapitalGainsRate: 0.099 };
      const result = calculateExitTax(params);
      expect(result.stateExitTax).toBe(0);
      expect(result.stateConformity).toBe('full-rolling');
    });
  });

  describe('E-9: Total exit tax with state', () => {
    it('should equal federal + state taxes', () => {
      const result = calculateExitTax(baseExitTaxParams);
      expect(result.totalExitTaxWithState).toBeCloseTo(
        result.totalFederalExitTax + result.stateExitTax, 6
      );
    });
  });

  describe('E-10: OZ 10+ year hold excludes all exit tax', () => {
    it('should set netExitTax to 0 when OZ enabled and holdPeriod >= 10', () => {
      const params = { ...baseExitTaxParams, ozEnabled: true, holdPeriod: 10 };
      const result = calculateExitTax(params);
      expect(result.ozExcludesRecapture).toBe(true);
      expect(result.ozExcludesAppreciation).toBe(true);
      expect(result.netExitTax).toBe(0);
      // But totalExitTaxWithState is still computed (for informational display)
      expect(result.totalExitTaxWithState).toBeGreaterThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // E-11 through E-20: Edge cases and variants
  // ───────────────────────────────────────────────────────────────

  describe('E-11: OZ short hold (< 10 years) does NOT exclude tax', () => {
    it('should apply full exit tax when OZ hold period is < 10', () => {
      const params = { ...baseExitTaxParams, ozEnabled: true, holdPeriod: 7 };
      const result = calculateExitTax(params);
      expect(result.ozExcludesRecapture).toBe(false);
      expect(result.ozExcludesAppreciation).toBe(false);
      expect(result.netExitTax).toBe(result.totalExitTaxWithState);
      expect(result.netExitTax).toBeGreaterThan(0);
    });
  });

  describe('E-12: Non-OZ deal has full tax regardless of hold period', () => {
    it('should apply full exit tax when ozEnabled is false', () => {
      const result = calculateExitTax(baseExitTaxParams);
      expect(result.ozExcludesRecapture).toBe(false);
      expect(result.netExitTax).toBe(result.totalExitTaxWithState);
    });
  });

  describe('E-13: Zero §1245 (no cost segregation)', () => {
    it('should handle zero §1245 gracefully', () => {
      const params = { ...baseExitTaxParams, cumulative1245: 0 };
      const result = calculateExitTax(params);
      expect(result.sec1245Recapture).toBe(0);
      expect(result.sec1245Tax).toBe(0);
      // §1250 and LTCG should still compute normally
      expect(result.sec1250Tax).toBeGreaterThan(0);
      expect(result.remainingGainTax).toBeGreaterThan(0);
    });
  });

  describe('E-14: Zero §1250 (no straight-line depreciation)', () => {
    it('should handle zero §1250 gracefully', () => {
      const params = { ...baseExitTaxParams, cumulative1250: 0 };
      const result = calculateExitTax(params);
      expect(result.sec1250Recapture).toBe(0);
      expect(result.sec1250Tax).toBe(0);
    });
  });

  describe('E-15: Zero appreciation gain', () => {
    it('should handle zero appreciation with no LTCG tax', () => {
      const params = { ...baseExitTaxParams, appreciationGain: 0 };
      const result = calculateExitTax(params);
      expect(result.remainingGain).toBe(0);
      expect(result.remainingGainTax).toBe(0);
    });
  });

  describe('E-16: Negative appreciation gain clamped to zero', () => {
    it('should clamp negative appreciation to zero', () => {
      const params = { ...baseExitTaxParams, appreciationGain: -5 };
      const result = calculateExitTax(params);
      expect(result.remainingGain).toBe(0);
      expect(result.remainingGainTax).toBe(0);
    });
  });

  describe('E-17: Non-OZ state rate passthrough', () => {
    it('should pass state rate through when OZ is disabled', () => {
      const result = calculateExitTax(baseExitTaxParams);
      const totalGain = 10 + 20 + 15;
      expect(result.stateExitTax).toBeCloseTo(totalGain * 0.133, 6);
    });
  });

  describe('E-18: Dollar amounts — hand-verified calculation', () => {
    it('should produce exact dollar amounts for known inputs', () => {
      // Known inputs: $10M §1245, $20M §1250, $15M appreciation
      // Rates: 37% ordinary, 20% LTCG, 3.8% NIIT, 13.3% state (CA)
      const result = calculateExitTax(baseExitTaxParams);

      // §1245: $10M × 37% = $3.70M
      expect(result.sec1245Tax).toBeCloseTo(3.70, 4);
      // §1250: $20M × 25% = $5.00M
      expect(result.sec1250Tax).toBeCloseTo(5.00, 4);
      // LTCG: $15M × 20% = $3.00M
      expect(result.remainingGainTax).toBeCloseTo(3.00, 4);
      // NIIT: $45M × 3.8% = $1.71M
      expect(result.niitTax).toBeCloseTo(1.71, 4);
      // Federal total: $13.41M
      expect(result.totalFederalExitTax).toBeCloseTo(13.41, 4);
      // State: $45M × 13.3% = $5.985M
      expect(result.stateExitTax).toBeCloseTo(5.985, 4);
      // Total: $19.395M
      expect(result.totalExitTaxWithState).toBeCloseTo(19.395, 4);
      // Non-OZ: netExitTax = totalExitTaxWithState
      expect(result.netExitTax).toBeCloseTo(19.395, 4);
    });
  });

  describe('E-19: All-zero inputs produce all-zero outputs', () => {
    it('should handle all zeros without errors', () => {
      const params = {
        ...baseExitTaxParams,
        cumulative1245: 0,
        cumulative1250: 0,
        appreciationGain: 0,
      };
      const result = calculateExitTax(params);
      expect(result.totalFederalExitTax).toBe(0);
      expect(result.stateExitTax).toBe(0);
      expect(result.netExitTax).toBe(0);
    });
  });

  describe('E-20: OZ hold period boundary (exactly 9 vs 10)', () => {
    it('should charge full tax at holdPeriod=9 and zero at holdPeriod=10', () => {
      const ozParams = { ...baseExitTaxParams, ozEnabled: true };

      const at9 = calculateExitTax({ ...ozParams, holdPeriod: 9 });
      const at10 = calculateExitTax({ ...ozParams, holdPeriod: 10 });

      expect(at9.netExitTax).toBeGreaterThan(0);
      expect(at10.netExitTax).toBe(0);
    });
  });
});

// ───────────────────────────────────────────────────────────────
// getEffectiveStateCapGainsRate() tests
// ───────────────────────────────────────────────────────────────
describe('getEffectiveStateCapGainsRate()', () => {
  it('should return full rate when OZ is disabled', () => {
    expect(getEffectiveStateCapGainsRate(0.099, 'OR', false)).toBe(0.099);
  });

  it('should return 0 for full-rolling conformity (OR) with OZ', () => {
    expect(getEffectiveStateCapGainsRate(0.099, 'OR', true)).toBe(0);
  });

  it('should return full rate for non-conforming state (CA) with OZ', () => {
    expect(getEffectiveStateCapGainsRate(0.133, 'CA', true)).toBe(0.133);
  });

  it('should return 0 for full-adopted conformity (NJ) with OZ', () => {
    expect(getEffectiveStateCapGainsRate(0.1075, 'NJ', true)).toBe(0);
  });

  it('should return full rate for non-conforming state (NY) with OZ', () => {
    expect(getEffectiveStateCapGainsRate(0.0882, 'NY', true)).toBe(0.0882);
  });
});

// ───────────────────────────────────────────────────────────────
// Scenario 10A: Non-OZ Exit Tax Integration
// ───────────────────────────────────────────────────────────────
describe('Scenario 10A: Non-OZ Exit Tax Integration', () => {
  it('should compute exit tax analysis and adjust IRR/multiple for non-OZ deal', () => {
    const params = getDefaultTestParams({
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5,
      investorEquityPct: 5,
      yearOneDepreciationPct: 20,
      effectiveTaxRate: 47.85,
      holdPeriod: 10,
      exitCapRate: 6,
      noiGrowthRate: 3,
      ozEnabled: false,
      includeDepreciationSchedule: true,
      costSegregationPct: 30,
      investorState: 'CA',
      stateCapitalGainsRate: 13.3,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      niitApplies: true,
      federalOrdinaryRate: 37,
    });

    const result = calculateFullInvestorAnalysis(params as CalculationParams);

    console.log('\n=== SCENARIO 10A: NON-OZ EXIT TAX ===');
    console.log('Exit Tax Analysis:', JSON.stringify(result.exitTaxAnalysis, null, 2));
    console.log('IRR:', result.irr?.toFixed(2) + '%');
    console.log('Multiple:', result.multiple?.toFixed(2) + 'x');
    console.log('Total Returns:', result.totalReturns?.toFixed(4) + 'M');

    // Exit tax analysis should exist
    expect(result.exitTaxAnalysis).toBeDefined();
    const eta = result.exitTaxAnalysis!;

    // Non-OZ: netExitTax should be positive
    expect(eta.netExitTax).toBeGreaterThan(0);
    expect(eta.ozExcludesRecapture).toBe(false);

    // Character split should have proper rates
    expect(eta.sec1245Rate).toBeCloseTo(0.37, 4);
    expect(eta.sec1250Rate).toBe(0.25);
    expect(eta.remainingGainRate).toBeCloseTo(0.20, 4);

    // §1245 + §1250 should sum to total depreciation
    const totalRecapture = eta.sec1245Recapture + eta.sec1250Recapture;
    expect(totalRecapture).toBeGreaterThan(0);

    // State tax should be applied for CA (non-conforming)
    expect(eta.stateExitTax).toBeGreaterThan(0);
    expect(eta.stateConformity).toBe('none');
  });
});

// ───────────────────────────────────────────────────────────────
// Scenario 10B: OZ 10-Year Hold — Zero Exit Tax
// ───────────────────────────────────────────────────────────────
describe('Scenario 10B: OZ 10-Year Hold — Zero Exit Tax', () => {
  it('should produce zero net exit tax for OZ 10-year hold', () => {
    const params = getDefaultTestParams({
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5,
      investorEquityPct: 5,
      yearOneDepreciationPct: 20,
      effectiveTaxRate: 47.85,
      holdPeriod: 10,
      exitCapRate: 6,
      noiGrowthRate: 3,
      ozEnabled: true,
      ozType: 'standard',
      includeDepreciationSchedule: true,
      costSegregationPct: 30,
      investorState: 'WA',
      stateCapitalGainsRate: 7.0,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      niitApplies: true,
      federalOrdinaryRate: 37,
    });

    const result = calculateFullInvestorAnalysis(params as CalculationParams);

    console.log('\n=== SCENARIO 10B: OZ 10-YEAR HOLD ===');
    console.log('Exit Tax Analysis:', JSON.stringify(result.exitTaxAnalysis, null, 2));
    console.log('IRR:', result.irr?.toFixed(2) + '%');
    console.log('Multiple:', result.multiple?.toFixed(2) + 'x');

    // Exit tax analysis should exist
    expect(result.exitTaxAnalysis).toBeDefined();
    const eta = result.exitTaxAnalysis!;

    // OZ 10+ year: netExitTax should be 0
    expect(eta.netExitTax).toBe(0);
    expect(eta.ozExcludesRecapture).toBe(true);
    expect(eta.ozExcludesAppreciation).toBe(true);

    // But the underlying tax components should still be computed
    // (for informational purposes / what-if analysis)
    expect(eta.totalExitTaxWithState).toBeGreaterThan(0);
  });
});

// ───────────────────────────────────────────────────────────────
// Scenario 10C: OZ with non-conforming state — state tax applied
// Note: Engine computes totalInvestmentYears from PIS month (always >= 11),
// so OZ 10+ year exclusion always applies through the integration path.
// Short-hold boundary is tested in unit tests E-11 and E-20.
// ───────────────────────────────────────────────────────────────
describe('Scenario 10C: OZ Non-Conforming State (CA) — State Tax Computed', () => {
  it('should compute state exit tax for non-conforming state even when OZ excludes net tax', () => {
    const params = getDefaultTestParams({
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5,
      investorEquityPct: 5,
      yearOneDepreciationPct: 20,
      effectiveTaxRate: 47.85,
      holdPeriod: 10,
      exitCapRate: 6,
      noiGrowthRate: 3,
      ozEnabled: true,
      ozType: 'standard',
      includeDepreciationSchedule: true,
      costSegregationPct: 30,
      investorState: 'CA',
      stateCapitalGainsRate: 13.3,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      niitApplies: true,
      federalOrdinaryRate: 37,
    });

    const result = calculateFullInvestorAnalysis(params as CalculationParams);

    console.log('\n=== SCENARIO 10C: OZ NON-CONFORMING STATE ===');
    console.log('Exit Tax Analysis:', JSON.stringify(result.exitTaxAnalysis, null, 2));

    expect(result.exitTaxAnalysis).toBeDefined();
    const eta = result.exitTaxAnalysis!;

    // OZ 10+ year hold: net exit tax is 0
    expect(eta.ozExcludesRecapture).toBe(true);
    expect(eta.netExitTax).toBe(0);

    // But underlying state tax is still computed (CA is non-conforming)
    expect(eta.stateConformity).toBe('none');
    expect(eta.stateExitTax).toBeGreaterThan(0);
    // Federal components also computed for informational purposes
    expect(eta.totalFederalExitTax).toBeGreaterThan(0);
  });
});

// ───────────────────────────────────────────────────────────────
// Exit tax wiring: exitTaxAnalysis on results
// ───────────────────────────────────────────────────────────────
describe('Exit Tax Wiring — Two-Channel Integration', () => {
  it('should only populate exitTaxAnalysis when includeDepreciationSchedule=true', () => {
    const baseParams = getDefaultTestParams({
      projectCost: 100,
      landValue: 10,
      yearOneNOI: 5,
      investorEquityPct: 5,
      holdPeriod: 10,
      exitCapRate: 6,
      ozEnabled: false,
    });

    // Without depreciation schedule
    const withoutDepr = calculateFullInvestorAnalysis({
      ...baseParams,
      includeDepreciationSchedule: false,
    } as CalculationParams);
    expect(withoutDepr.exitTaxAnalysis).toBeUndefined();

    // With depreciation schedule
    const withDepr = calculateFullInvestorAnalysis({
      ...baseParams,
      includeDepreciationSchedule: true,
      costSegregationPct: 30,
      investorState: 'CA',
      stateCapitalGainsRate: 13.3,
      ltCapitalGainsRate: 20,
      niitRate: 3.8,
      niitApplies: true,
      federalOrdinaryRate: 37,
    } as CalculationParams);
    expect(withDepr.exitTaxAnalysis).toBeDefined();
  });
});
