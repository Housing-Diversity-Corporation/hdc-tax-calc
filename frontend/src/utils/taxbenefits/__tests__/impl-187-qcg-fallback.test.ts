/**
 * IMPL-187: OZ Capital Gains Field Resolution Fix — Tests
 *
 * Scope of this test file (Changes 2, 3, 5; Change 1 deferred pending audit):
 * 1. Engine `||` fallback fires when qualifiedCapitalGain = 0 and deferredCapitalGains > 0
 *    (the bug `??` left in place — state initializes QCG to 0, not undefined)
 * 2. User override: explicit QCG > 0 still wins over deferredCapitalGains
 * 3. Trace 4001 regression: QCG undefined + deferred set still produces same Year-5 tax
 * 4. DOCUMENTED_ASSUMPTIONS.md records IMPL-187 refinement
 *
 * Preview-vs-engine UI match (Changes 2 + 4) and auto-populate (Change 1) are
 * verified at runtime in the browser, not here.
 */

import fs from 'fs';
import path from 'path';
import { calculateFullInvestorAnalysis } from '../calculations';

const baseParams = {
  projectCost: 100_000_000,
  landValue: 10_000_000,
  yearOneNOI: 5_000_000,
  yearOneDepreciationPct: 25,
  revenueGrowth: 3,
  expenseGrowth: 2,
  exitCapRate: 6,
  opexRatio: 30,
  holdPeriod: 10,
  constructionDelayMonths: 0,

  federalTaxRate: 37,
  stateTaxRate: 10.9,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  stateCapitalGainsRate: 10.9,

  investorEquityPct: 5,
  philanthropicEquityPct: 0,
  seniorDebtPct: 50,
  philanthropicDebtPct: 30,
  hdcSubDebtPct: 10,
  investorSubDebtPct: 5,

  seniorDebtRate: 5,
  philanthropicDebtRate: 0,
  seniorDebtAmortization: 35,
  philDebtAmortization: 60,
  hdcSubDebtPikRate: 8,
  investorSubDebtPikRate: 8,

  hdcFeeRate: 0,
  investorPromoteShare: 65,
  aumFeeEnabled: false,
};

describe('IMPL-187: QCG `||` fallback + doc update', () => {
  // -------------------------------------------------------------------------
  // Test 1: QCG = 0 with deferred set → engine uses deferred (|| fallback fires)
  //         This is the bug — `??` left the engine using 0, ignoring the proxy.
  // -------------------------------------------------------------------------
  test('qualifiedCapitalGain = 0 falls back to deferredCapitalGains via ||', () => {
    const withZeroQCG = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      qualifiedCapitalGain: 0,
      capitalGainsTaxRate: 23.8,
    });

    const explicitProxy = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      capitalGainsTaxRate: 23.8,
    });

    const zeroQcgTax =
      withZeroQCG.investorCashFlows.find((_, i) => i === 4)?.ozYear5TaxPayment ?? 0;
    const proxyTax =
      explicitProxy.investorCashFlows.find((_, i) => i === 4)?.ozYear5TaxPayment ?? 0;

    expect(zeroQcgTax).toBeGreaterThan(0);
    expect(zeroQcgTax).toBeCloseTo(proxyTax, 6);
  });

  // -------------------------------------------------------------------------
  // Test 2: User override — explicit QCG > 0 still wins over deferred
  // -------------------------------------------------------------------------
  test('qualifiedCapitalGain > 0 takes precedence over deferredCapitalGains', () => {
    const result = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,    // would-be proxy
      qualifiedCapitalGain: 5,     // half the proxy
      capitalGainsTaxRate: 23.8,
    });

    // OZ 2.0 std → stepUp = 10%, taxable = 5 * 0.9 = 4.5M, tax = 4.5 * 0.238 = $1.071M
    const ozTax =
      result.investorCashFlows.find((_, i) => i === 4)?.ozYear5TaxPayment ?? 0;

    expect(ozTax).toBeCloseTo(1.071, 3);
  });

  // -------------------------------------------------------------------------
  // Test 3: Trace 4001 regression — QCG undefined behaves identically under ||
  // -------------------------------------------------------------------------
  test('QCG undefined + deferred set → same Year-5 tax (Trace-style regression)', () => {
    const result = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '1.0',          // Trace 4001 uses OZ 1.0 (0% step-up)
      ozType: 'standard',
      deferredCapitalGains: 10,
      qualifiedCapitalGain: undefined,
      capitalGainsTaxRate: 33.7, // matches Trace 4001 combined
    });

    // OZ 1.0 → stepUp = 0%, taxable = 10M, tax = 10 * 0.337 = $3.37M
    const ozTax =
      result.investorCashFlows.find((_, i) => i === 4)?.ozYear5TaxPayment ?? 0;

    expect(ozTax).toBeCloseTo(3.37, 2);
  });

  // -------------------------------------------------------------------------
  // Test 4: DOCUMENTED_ASSUMPTIONS.md records IMPL-187
  // -------------------------------------------------------------------------
  test('DOCUMENTED_ASSUMPTIONS.md records IMPL-187 refinement', () => {
    const daPath = path.resolve(__dirname, '../../../../docs/DOCUMENTED_ASSUMPTIONS.md');
    const da = fs.readFileSync(daPath, 'utf-8');

    expect(da).toContain('Refined: IMPL-187');
    expect(da).toContain('Operator change — `??` → `||`');
    expect(da).toContain('Preview UI aligned with engine');
  });
});
