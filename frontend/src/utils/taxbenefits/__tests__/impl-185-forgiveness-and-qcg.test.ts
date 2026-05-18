/**
 * IMPL-185: Exit Model Forgiveness Toggle + QCG Fix — Tests
 *
 * 1. philDebtForgivenessEnabled = true excludes phil debt + HDC sub PIK from exit waterfall
 * 2. philDebtForgivenessEnabled = false → forgivenDebtAtExit = 0 (regression)
 * 3. qualifiedCapitalGain replaces deferredCapitalGains proxy in OZ Year-5 math
 * 4. qualifiedCapitalGain null/0 → falls back to deferredCapitalGains (backward compat)
 * 5. DOCUMENTED_ASSUMPTIONS.md contains the new entry
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

  // Capital structure with material phil + HDC sub balances so forgiveness shifts proceeds
  investorEquityPct: 5,
  philanthropicEquityPct: 0,
  seniorDebtPct: 50,
  philanthropicDebtPct: 30, // material phil/soft balance
  hdcSubDebtPct: 10,        // material HDC sub balance (PIK accrues)
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

describe('IMPL-185: Forgiveness toggle + QCG', () => {
  // -------------------------------------------------------------------------
  // Test 1: Forgiveness ON — phil + HDC sub excluded
  // -------------------------------------------------------------------------
  test('Forgiveness ON: forgivenDebtAtExit = remainingPhilDebt + subDebtAtExit', () => {
    const resultOn = calculateFullInvestorAnalysis({
      ...baseParams,
      philDebtForgivenessEnabled: true,
    });

    const expectedForgiven =
      (resultOn.remainingPhilDebtAtExit || 0) + (resultOn.subDebtAtExit || 0);

    expect(resultOn.forgivenDebtAtExit).toBeCloseTo(expectedForgiven, 2);
    expect(resultOn.forgivenDebtAtExit!).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Test 2: Forgiveness OFF — regression to current behavior
  // -------------------------------------------------------------------------
  test('Forgiveness OFF: forgivenDebtAtExit = 0', () => {
    const resultOff = calculateFullInvestorAnalysis({
      ...baseParams,
      philDebtForgivenessEnabled: false,
    });

    expect(resultOff.forgivenDebtAtExit).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 3: Forgiveness ON increases LP gross exit proceeds vs OFF
  // -------------------------------------------------------------------------
  test('Forgiveness ON yields strictly more gross exit proceeds than OFF', () => {
    const off = calculateFullInvestorAnalysis({
      ...baseParams,
      philDebtForgivenessEnabled: false,
    });
    const on = calculateFullInvestorAnalysis({
      ...baseParams,
      philDebtForgivenessEnabled: true,
    });

    const onProceeds = on.grossExitProceeds ?? on.totalExitProceeds;
    const offProceeds = off.grossExitProceeds ?? off.totalExitProceeds;

    // Forgiveness should free up at least the forgiven balance in gross proceeds.
    expect(onProceeds).toBeGreaterThan(offProceeds);
    expect(onProceeds - offProceeds).toBeCloseTo(on.forgivenDebtAtExit ?? 0, 0);
  });

  // -------------------------------------------------------------------------
  // Test 4: qualifiedCapitalGain replaces deferredCapitalGains in OZ math
  // -------------------------------------------------------------------------
  test('qualifiedCapitalGain drives Year-5 OZ tax when set', () => {
    // Proxy case: deferredCapitalGains = 10 ($M)
    const proxy = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      capitalGainsTaxRate: 23.8,
    });

    // Explicit QCG = 5 ($M) — half the proxy amount
    const qcg = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      qualifiedCapitalGain: 5,
      capitalGainsTaxRate: 23.8,
    });

    // Year-5 OZ tax should be half when QCG is half (linear in QCG amount)
    const proxyOzTax =
      proxy.investorCashFlows.find((cf, i) => i === 4)?.ozYear5TaxPayment ?? 0;
    const qcgOzTax =
      qcg.investorCashFlows.find((cf, i) => i === 4)?.ozYear5TaxPayment ?? 0;

    expect(proxyOzTax).toBeGreaterThan(0);
    expect(qcgOzTax).toBeCloseTo(proxyOzTax / 2, 4);
  });

  // -------------------------------------------------------------------------
  // Test 5: Backward compatibility — null/0 QCG falls back to deferredCapitalGains
  // -------------------------------------------------------------------------
  test('qualifiedCapitalGain undefined → falls back to deferredCapitalGains', () => {
    const explicitProxy = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      capitalGainsTaxRate: 23.8,
    });

    const fallback = calculateFullInvestorAnalysis({
      ...baseParams,
      ozEnabled: true,
      ozVersion: '2.0',
      ozType: 'standard',
      deferredCapitalGains: 10,
      qualifiedCapitalGain: undefined,
      capitalGainsTaxRate: 23.8,
    });

    const proxyOzTax =
      explicitProxy.investorCashFlows.find((cf, i) => i === 4)?.ozYear5TaxPayment ?? 0;
    const fallbackOzTax =
      fallback.investorCashFlows.find((cf, i) => i === 4)?.ozYear5TaxPayment ?? 0;

    expect(fallbackOzTax).toBeCloseTo(proxyOzTax, 6);
  });

  // -------------------------------------------------------------------------
  // Test 6: DOCUMENTED_ASSUMPTIONS.md has the IMPL-185 entries
  // -------------------------------------------------------------------------
  test('DOCUMENTED_ASSUMPTIONS.md records IMPL-185 closure', () => {
    const daPath = path.resolve(__dirname, '../../../../docs/DOCUMENTED_ASSUMPTIONS.md');
    const da = fs.readFileSync(daPath, 'utf-8');

    expect(da).toContain('OZ Qualified Capital Gain Amount');
    expect(da).toContain('Exit Model — Forgivable Soft Debt at Exit');
    expect(da).toContain('Closed by: IMPL-185');
  });
});
