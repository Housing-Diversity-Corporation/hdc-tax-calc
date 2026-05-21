/**
 * IMPL-188: legacyToSources migration + CapitalSource type — Tests
 *
 * Five test categories:
 *  1. Type structure (CapitalSource + CAPITAL_SOURCE_TEMPLATES)
 *  2. legacyToSources — Trace 4001 (5-source standard deal)
 *  3. legacyToSources — Queenswood-style (7-source complex deal)
 *  4. legacyToSources — empty deal (minimal params)
 *  5. Template map completeness
 */

import { CAPITAL_SOURCE_TEMPLATES } from '../../../types/taxbenefits';
import type { CalculationParams, CapitalSource } from '../../../types/taxbenefits';
import { legacyToSources } from '../legacyToSources';

// ----------------------------------------------------------------------------
// Trace 4001 reference params (matches auditExport.test.ts:27-83)
// ----------------------------------------------------------------------------
const TRACE_4001: CalculationParams = {
  projectCost: 67,
  predevelopmentCosts: 0,
  landValue: 6.7,
  yearOneNOI: 3.5,
  yearOneDepreciationPct: 20,
  federalTaxRate: 37,
  stateTaxRate: 9.9,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  stateCapitalGainsRate: 9.9,
  investorEquityPct: 5,
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
  noiGrowthRate: 3,
  exitCapRate: 6,
  investorPromoteShare: 35,
  aumFeeEnabled: true,
  aumFeeRate: 1,
  hdcFeeRate: 0,
  investorUpfrontCash: 0,
  totalTaxBenefit: 0,
  netTaxBenefit: 0,
  hdcFee: 0,
  hdcAdvanceFinancing: false,
  placedInServiceMonth: 7,
  ozEnabled: true,
  ozVersion: '1.0',
  ozType: 'standard',
  deferredCapitalGains: 10,
} as CalculationParams;

// ----------------------------------------------------------------------------
// Queenswood-style synthetic fixture — 7 sources including PAB + DDF + outside
// ----------------------------------------------------------------------------
const QUEENSWOOD_STYLE: CalculationParams = {
  ...TRACE_4001,
  projectCost: 200,
  landValue: 20,
  seniorDebtPct: 30,
  philanthropicDebtPct: 25,
  philDebtForgivenessEnabled: true,    // forgivable soft debt
  investorEquityPct: 5,
  hdcSubDebtPct: 8,                    // HDC 2nd (PIK debt)
  investorSubDebtPct: 0,
  outsideInvestorSubDebtPct: 4,        // HPD 3rd analog
  outsideInvestorSubDebtPikRate: 6,
  pabEnabled: true,
  pabPctOfEligibleBasis: 30,
  pabRate: 4.5,
  pabAmortization: 40,
  pabIOYears: 0,
  lihtcEnabled: true,
  lihtcEligibleBasis: 180,
  devFeeTotal: 12,                     // $12M total, $2M paid at close
  devFeeClosingAmount: 2,              // → $10M deferred (the C Note)
} as CalculationParams;

// ----------------------------------------------------------------------------
// Empty deal — minimal params, no capital sources
// ----------------------------------------------------------------------------
const EMPTY_DEAL: CalculationParams = {
  projectCost: 10,
  landValue: 1,
  yearOneNOI: 0.5,
  yearOneDepreciationPct: 0,
  federalTaxRate: 37,
  stateTaxRate: 0,
  ltCapitalGainsRate: 20,
  niitRate: 3.8,
  stateCapitalGainsRate: 0,
  investorEquityPct: 0,
  seniorDebtPct: 0,
  philanthropicDebtPct: 0,
  hdcSubDebtPct: 0,
  investorSubDebtPct: 0,
  seniorDebtRate: 0,
  hdcSubDebtPikRate: 0,
  investorSubDebtPikRate: 0,
  holdPeriod: 10,
  noiGrowthRate: 0,
  exitCapRate: 6,
  investorPromoteShare: 0,
  aumFeeEnabled: false,
  aumFeeRate: 0,
  hdcFeeRate: 0,
  investorUpfrontCash: 0,
  totalTaxBenefit: 0,
  netTaxBenefit: 0,
  hdcFee: 0,
  hdcAdvanceFinancing: false,
} as CalculationParams;

// ============================================================================
// Test 1 — Type structure
// ============================================================================
describe('IMPL-188: CapitalSource type structure', () => {
  test('a valid CapitalSource has hardPayPct + softPayPct + pikPct = 100', () => {
    const senior: CapitalSource = {
      id: 's1',
      label: 'Senior Debt',
      sourceType: 'senior_debt',
      amountBasis: 'pct_project_cost',
      amountPct: 50,
      amount: 33.5,
      rate: 5,
      hardPayPct: 100,
      softPayPct: 0,
      pikPct: 0,
      isEquity: false,
      isGrant: false,
      dscrIncluded: true,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 1,
      includeIn100PctSum: true,
    };
    expect(senior.hardPayPct + senior.softPayPct + senior.pikPct).toBe(100);
  });

  test('CAPITAL_SOURCE_TEMPLATES.senior_debt produces a 100-sum split', () => {
    const t = CAPITAL_SOURCE_TEMPLATES.senior_debt;
    expect((t.hardPayPct ?? 0) + (t.softPayPct ?? 0) + (t.pikPct ?? 0)).toBe(100);
    expect(t.dscrIncluded).toBe(true);
    expect(t.isEquity).toBe(false);
    expect(t.forgivenessEnabled).toBe(false);
  });

  test('CAPITAL_SOURCE_TEMPLATES.lp_equity sets isEquity=true with no debt service', () => {
    const t = CAPITAL_SOURCE_TEMPLATES.lp_equity;
    expect(t.isEquity).toBe(true);
    expect(t.dscrIncluded).toBe(false);
    expect((t.hardPayPct ?? 0) + (t.softPayPct ?? 0) + (t.pikPct ?? 0)).toBe(0);
  });

  test('CAPITAL_SOURCE_TEMPLATES.grant sets isGrant=true with no repayment', () => {
    const t = CAPITAL_SOURCE_TEMPLATES.grant;
    expect(t.isGrant).toBe(true);
    expect(t.isEquity).toBe(false);
    expect(t.dscrIncluded).toBe(false);
    expect(t.forgivenessEnabled).toBe(false);
  });
});

// ============================================================================
// Test 2 — legacyToSources: Trace 4001 (5 sources)
// ============================================================================
describe('IMPL-188: legacyToSources — Trace 4001', () => {
  const effectiveProjectCost = 67;
  const lihtcEligibleBasis = 60.3;
  const sources = legacyToSources(TRACE_4001, effectiveProjectCost, lihtcEligibleBasis);

  test('produces 5 sources (senior, phil debt, LP equity, HDC sub, inv sub)', () => {
    expect(sources).toHaveLength(5);
  });

  test('senior debt: dscrIncluded=true, hardPayPct=100, forgivenessEnabled=false', () => {
    const senior = sources.find(s => s.sourceType === 'senior_debt');
    expect(senior).toBeDefined();
    expect(senior!.dscrIncluded).toBe(true);
    expect(senior!.hardPayPct).toBe(100);
    expect(senior!.forgivenessEnabled).toBe(false);
    expect(senior!.amount).toBeCloseTo(44.22, 2); // 67 × 0.66
    expect(senior!.rate).toBe(5);
  });

  test('LP equity: isEquity=true, dscrIncluded=false', () => {
    const lp = sources.find(s => s.sourceType === 'lp_equity');
    expect(lp).toBeDefined();
    expect(lp!.isEquity).toBe(true);
    expect(lp!.dscrIncluded).toBe(false);
    expect(lp!.amount).toBeCloseTo(3.35, 2); // 67 × 0.05
  });

  test('soft debt (phil): dscrIncluded=false, sourceType=soft_debt', () => {
    const phil = sources.find(s => s.sourceType === 'soft_debt');
    expect(phil).toBeDefined();
    expect(phil!.dscrIncluded).toBe(false);
    expect(phil!.amount).toBeCloseTo(13.4, 2); // 67 × 0.20
  });

  test('sum of source amounts equals expected total (95.5% of project cost)', () => {
    const sum = sources.reduce((a, s) => a + s.amount, 0);
    // 67 × (0.66 + 0.20 + 0.05 + 0.02 + 0.025) = 67 × 0.955 = 63.985
    expect(sum).toBeCloseTo(63.985, 2);
  });
});

// ============================================================================
// Test 3 — legacyToSources: Queenswood-style (7 sources)
// ============================================================================
describe('IMPL-188: legacyToSources — Queenswood-style (7 sources)', () => {
  const effectiveProjectCost = 200;
  const lihtcEligibleBasis = 180;
  const sources = legacyToSources(QUEENSWOOD_STYLE, effectiveProjectCost, lihtcEligibleBasis);

  test('produces 7 sources', () => {
    // Senior + PAB + phil-debt + LP equity + HDC sub + outside sub + DDF = 7
    expect(sources).toHaveLength(7);
  });

  test('dscrIncluded=true on senior debt and PAB only', () => {
    const dscr = sources.filter(s => s.dscrIncluded);
    expect(dscr).toHaveLength(2);
    expect(dscr.map(s => s.sourceType).sort()).toEqual(['pab', 'senior_debt']);
  });

  test('forgivenessEnabled=true on philanthropic debt (silent_expected)', () => {
    const phil = sources.find(s => s.sourceType === 'soft_debt');
    expect(phil!.forgivenessEnabled).toBe(true);
    expect(phil!.forgivenessTriggerType).toBe('silent_expected');
  });

  test('DDF source present with amountBasis=dollars', () => {
    const ddf = sources.find(s => s.sourceType === 'deferred_dev_fee');
    expect(ddf).toBeDefined();
    expect(ddf!.amountBasis).toBe('dollars');
    expect(ddf!.amount).toBeCloseTo(10, 2); // 12 total - 2 closing = 10 deferred
    expect(ddf!.cashSweepPriority).toBe(4);
  });

  test('PAB sized from eligible basis, not project cost', () => {
    const pab = sources.find(s => s.sourceType === 'pab');
    expect(pab).toBeDefined();
    expect(pab!.amountBasis).toBe('pct_eligible_basis');
    expect(pab!.amount).toBeCloseTo(54, 2); // 180 × 0.30 = 54
  });

  test('outside investor sub-debt classified as pik_debt', () => {
    const outsideSubs = sources.filter(
      s => s.sourceType === 'pik_debt' && s.label.includes('Outside'),
    );
    expect(outsideSubs).toHaveLength(1);
    expect(outsideSubs[0].rate).toBe(6);
  });
});

// ============================================================================
// Test 4 — legacyToSources: empty deal
// ============================================================================
describe('IMPL-188: legacyToSources — empty deal', () => {
  test('returns empty array when no capital sources are configured', () => {
    const sources = legacyToSources(EMPTY_DEAL, 10, 9);
    expect(sources).toEqual([]);
  });

  test('does not throw on minimal params', () => {
    expect(() => legacyToSources(EMPTY_DEAL, 10, 9)).not.toThrow();
  });

  test('skips sources with zero or missing percentages', () => {
    const params = { ...EMPTY_DEAL, investorEquityPct: 100 } as CalculationParams;
    const sources = legacyToSources(params, 10, 9);
    expect(sources).toHaveLength(1);
    expect(sources[0].sourceType).toBe('lp_equity');
  });
});

// ============================================================================
// Test 5 — CAPITAL_SOURCE_TEMPLATES completeness
// ============================================================================
describe('IMPL-188: CAPITAL_SOURCE_TEMPLATES completeness', () => {
  const EXPECTED_KEYS = [
    'senior_debt',
    'soft_debt',
    'pab',
    'lp_equity',
    'grant',
    'deferred_dev_fee',
    'pik_debt',
    'accrued_interest',
    'home_soft',
    'htf_soft',
  ];

  test('has entry for each documented sourceType', () => {
    EXPECTED_KEYS.forEach(key => {
      expect(CAPITAL_SOURCE_TEMPLATES[key]).toBeDefined();
    });
  });

  test('every template defines isEquity, isGrant, dscrIncluded, forgivenessEnabled', () => {
    Object.entries(CAPITAL_SOURCE_TEMPLATES).forEach(([key, t]) => {
      expect(typeof t.isEquity).toBe('boolean');
      expect(typeof t.isGrant).toBe('boolean');
      expect(typeof t.dscrIncluded).toBe('boolean');
      expect(typeof t.forgivenessEnabled).toBe('boolean');
      expect(typeof t.affectsEligibleBasis).toBe('boolean');
      expect(typeof t.waterfallPriority).toBe('number');
      expect(typeof t.includeIn100PctSum).toBe('boolean');
      // hardPayPct + softPayPct + pikPct must be 0 or 100
      const sum = (t.hardPayPct ?? 0) + (t.softPayPct ?? 0) + (t.pikPct ?? 0);
      expect([0, 100]).toContain(sum);
      // Track which template for debug
      expect(key).toBe(key);
    });
  });

  test('home_soft and htf_soft have affectsEligibleBasis=true and forgivenessTriggerType=regulatory', () => {
    expect(CAPITAL_SOURCE_TEMPLATES.home_soft.affectsEligibleBasis).toBe(true);
    expect(CAPITAL_SOURCE_TEMPLATES.home_soft.forgivenessTriggerType).toBe('regulatory');
    expect(CAPITAL_SOURCE_TEMPLATES.htf_soft.affectsEligibleBasis).toBe(true);
    expect(CAPITAL_SOURCE_TEMPLATES.htf_soft.forgivenessTriggerType).toBe('regulatory');
  });
});
