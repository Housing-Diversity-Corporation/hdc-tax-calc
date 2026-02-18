/**
 * Investor Fit Classification Engine Tests (IMPL-102)
 *
 * Tests for classifyArchetype(), calculateFitScore(), generateFitWarnings(),
 * and the orchestrator classifyInvestorFit().
 *
 * Per B3 Spec v2.0 §8.1 and Archetype Spec v1.0 §5.2.
 */

import type { InvestorProfile, TaxUtilizationResult, AnnualUtilization } from '../investorTaxUtilization';
import { SECTION_461L_LIMITS } from '../investorTaxUtilization';
import { buildInvestorProfileFromTaxInfo } from '../poolAggregation';
import {
  classifyArchetype,
  calculateFitScore,
  generateFitWarnings,
  classifyInvestorFit,
} from '../investorFit';
import type { InvestorFitResult } from '../investorFit';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Build an InvestorProfile from simplified params.
 * Income values in DOLLARS (not millions).
 */
function makeProfile(overrides: {
  isREP?: boolean;
  ordinaryIncome?: number;
  passiveIncome?: number;
  portfolioIncome?: number;
  filingStatus?: 'MFJ' | 'Single' | 'HoH';
  equity?: number;
}): InvestorProfile {
  const isREP = overrides.isREP ?? false;
  return buildInvestorProfileFromTaxInfo({
    filingStatus: overrides.filingStatus === 'Single' ? 'single' : 'married',
    annualPassiveIncome: overrides.passiveIncome ?? 0,
    annualOrdinaryIncome: overrides.ordinaryIncome ?? 0,
    annualPortfolioIncome: overrides.portfolioIncome ?? 0,
    investorTrack: isREP ? 'rep' : 'non-rep',
    groupingElection: isREP, // REPs get grouping election by default
    federalOrdinaryRate: 37,
    federalCapitalGainsRate: 20,
    niitRate: 3.8,
    selectedState: 'WA',
    stateOrdinaryRate: 0,
    stateCapitalGainsRate: 0,
  }, overrides.equity ?? 1_000_000);
}

/**
 * Create a mock TaxUtilizationResult with configurable annual utilization.
 * Monetary values in MILLIONS (matching engine output convention).
 */
function mockUtilizationResult(overrides: {
  years?: number;
  deprGeneratedPerYear?: number;
  deprAllowedPerYear?: number;
  lihtcGeneratedPerYear?: number;
  lihtcUsablePerYear?: number;
  nolGeneratedPerYear?: number;
  treatment?: 'nonpassive' | 'passive';
  marginalRate?: number;
}): TaxUtilizationResult {
  const years = overrides.years ?? 10;
  const deprGen = overrides.deprGeneratedPerYear ?? 2;
  const deprAllowed = overrides.deprAllowedPerYear ?? 2;
  const lihtcGen = overrides.lihtcGeneratedPerYear ?? 0.7;
  const lihtcUsable = overrides.lihtcUsablePerYear ?? 0.7;
  const nolGen = overrides.nolGeneratedPerYear ?? 0;
  const marginalRate = overrides.marginalRate ?? 0.37;
  const treatment = overrides.treatment ?? 'passive';

  const annualUtilization: AnnualUtilization[] = [];
  let cumulativeSuspendedLoss = 0;
  let cumulativeSuspendedCredits = 0;
  let nolPool = 0;

  for (let i = 0; i < years; i++) {
    const deprSuspended = deprGen - deprAllowed;
    cumulativeSuspendedLoss += Math.max(0, deprSuspended);
    const lihtcCarried = lihtcGen - lihtcUsable;
    cumulativeSuspendedCredits += Math.max(0, lihtcCarried);
    nolPool += nolGen;

    const deprTaxSavings = deprAllowed * marginalRate;
    const totalBenefitGenerated = deprGen * marginalRate + lihtcGen;
    const totalBenefitUsable = deprTaxSavings + lihtcUsable;

    annualUtilization.push({
      year: i + 1,
      depreciationGenerated: deprGen,
      depreciationAllowed: deprAllowed,
      depreciationSuspended: Math.max(0, deprSuspended),
      depreciationTaxSavings: deprTaxSavings,
      lihtcGenerated: lihtcGen,
      lihtcUsable: lihtcUsable,
      lihtcCarried: Math.max(0, lihtcCarried),
      residualPassiveIncome: 0,
      residualPassiveTax: 0,
      nolGenerated: nolGen,
      nolUsed: 0,
      nolPool,
      cumulativeSuspendedLoss,
      cumulativeCarriedCredits: 0,
      cumulativeSuspendedCredits,
      totalBenefitGenerated,
      totalBenefitUsable,
      utilizationRate: totalBenefitGenerated > 0 ? totalBenefitUsable / totalBenefitGenerated : 0,
    });
  }

  const totalBenefitGenerated = annualUtilization.reduce((s, y) => s + y.totalBenefitGenerated, 0);
  const totalBenefitUsable = annualUtilization.reduce((s, y) => s + y.totalBenefitUsable, 0);

  return {
    treatment,
    treatmentLabel: treatment === 'nonpassive' ? 'REP — Nonpassive Treatment' : 'Non-REP — Passive Treatment',
    annualUtilization,
    recaptureCoverage: [],
    nolDrawdownYears: 0,
    nolDrawdownSchedule: [],
    totalDepreciationSavings: annualUtilization.reduce((s, y) => s + y.depreciationTaxSavings, 0),
    totalLIHTCUsed: annualUtilization.reduce((s, y) => s + y.lihtcUsable, 0),
    totalBenefitGenerated,
    totalBenefitUsable,
    overallUtilizationRate: totalBenefitGenerated > 0 ? totalBenefitUsable / totalBenefitGenerated : 0,
    fitIndicator: 'green',
    fitExplanation: '',
    computedFederalTax: 0,
    computedMarginalRate: marginalRate,
    incomeComputationUsed: false,
  };
}

// =============================================================================
// classifyArchetype — Unit Tests
// =============================================================================

describe('classifyArchetype', () => {
  const avgBenefits = 150_000; // $150K average annual benefits

  test('REP with income below §461(l) threshold → A', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });
    // 200K + 150K = 350K < 626K MFJ threshold
    expect(classifyArchetype(profile, avgBenefits)).toBe('A');
  });

  test('REP with income above §461(l) threshold → B', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 1_500_000, passiveIncome: 500_000 });
    // 1.5M + 500K = 2M ≥ 626K threshold
    expect(classifyArchetype(profile, avgBenefits)).toBe('B');
  });

  test('Non-REP with passive ≥ average annual benefits → C', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('C');
  });

  test('Non-REP with 0 < passive < average annual benefits → D', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 350_000, passiveIncome: 40_000 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('D');
  });

  test('Non-REP with $0 passive → E', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('E');
  });

  // B3-F7: Boundary test — income exactly at §461(l) threshold
  test('REP with income exactly at §461(l) threshold → B (≥ means B)', () => {
    const threshold = SECTION_461L_LIMITS.MFJ; // 626,000
    const profile = makeProfile({ isREP: true, ordinaryIncome: threshold, passiveIncome: 0 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('B');
  });

  // B3-F8: $1 passive income → D (not E)
  test('Non-REP with $1 passive income → D (not E)', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 100_000, passiveIncome: 1 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('D');
  });

  // Boundary: passive exactly equals average benefits → C
  test('Non-REP with passive exactly equal to average benefits → C', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 100_000, passiveIncome: 150_000 });
    expect(classifyArchetype(profile, 150_000)).toBe('C');
  });

  // REP with income $1 below threshold → A
  test('REP with income $1 below threshold → A', () => {
    const threshold = SECTION_461L_LIMITS.MFJ; // 626,000
    const profile = makeProfile({ isREP: true, ordinaryIncome: threshold - 1, passiveIncome: 0 });
    expect(classifyArchetype(profile, avgBenefits)).toBe('A');
  });
});

// =============================================================================
// calculateFitScore — Unit Tests
// =============================================================================

describe('calculateFitScore', () => {
  test('returns base score for each archetype at 0% utilization', () => {
    expect(calculateFitScore('A', 0, 0)).toBe(90);
    expect(calculateFitScore('B', 0, 0)).toBe(80);
    expect(calculateFitScore('C', 0, 0)).toBe(70);
    expect(calculateFitScore('D', 0, 0)).toBe(40);
    expect(calculateFitScore('E', 0, 0)).toBe(10);
  });

  test('adds utilization bonus (up to 10 points)', () => {
    expect(calculateFitScore('A', 100, 100)).toBe(100); // 90 + 10 = 100
    expect(calculateFitScore('C', 50, 50)).toBe(75);    // 70 + 5 = 75
    expect(calculateFitScore('D', 80, 0)).toBe(48);     // 40 + 8 = 48
  });

  test('caps at 100', () => {
    expect(calculateFitScore('A', 200, 200)).toBe(100);
  });

  test('returns values in 0–100 range for all archetypes', () => {
    for (const arch of ['A', 'B', 'C', 'D', 'E'] as const) {
      for (const util of [0, 25, 50, 75, 100]) {
        const score = calculateFitScore(arch, util, util);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });
});

// =============================================================================
// generateFitWarnings — Unit Tests
// =============================================================================

describe('generateFitWarnings', () => {
  const baseUtil = mockUtilizationResult({});

  test('returns empty array for Archetype A with low income', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });
    const warnings = generateFitWarnings('A', baseUtil, profile, 0, 0);
    expect(warnings).toHaveLength(0);
  });

  test('returns high-severity for Archetype E', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });
    const warnings = generateFitWarnings('E', baseUtil, profile, 1.0, 0);
    const highWarnings = warnings.filter(w => w.severity === 'high');
    expect(highWarnings.length).toBeGreaterThanOrEqual(1);
    expect(highWarnings.some(w => w.code === 'ARCHETYPE_E_ALL_SUSPENDED')).toBe(true);
  });

  test('Archetype E + no passive fires both E and NO_PASSIVE_INCOME warnings', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });
    const warnings = generateFitWarnings('E', baseUtil, profile, 1.0, 0);
    expect(warnings.some(w => w.code === 'ARCHETYPE_E_ALL_SUSPENDED')).toBe(true);
    expect(warnings.some(w => w.code === 'NO_PASSIVE_INCOME')).toBe(true);
  });

  test('Archetype D with >60% credit suspension triggers HIGH_CREDIT_SUSPENSION', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 350_000, passiveIncome: 40_000 });
    const warnings = generateFitWarnings('D', baseUtil, profile, 0.75, 0);
    expect(warnings.some(w => w.code === 'HIGH_CREDIT_SUSPENSION')).toBe(true);
    expect(warnings.find(w => w.code === 'HIGH_CREDIT_SUSPENSION')?.severity).toBe('medium');
  });

  test('Archetype D with ≤60% credit suspension does NOT trigger warning', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 350_000, passiveIncome: 100_000 });
    const warnings = generateFitWarnings('D', baseUtil, profile, 0.50, 0);
    expect(warnings.some(w => w.code === 'HIGH_CREDIT_SUSPENSION')).toBe(false);
  });

  test('Archetype B with >30% EBL excess triggers EBL_EXCESS_SIGNIFICANT', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 1_500_000, passiveIncome: 500_000 });
    const warnings = generateFitWarnings('B', baseUtil, profile, 0, 0.45);
    expect(warnings.some(w => w.code === 'EBL_EXCESS_SIGNIFICANT')).toBe(true);
    expect(warnings.find(w => w.code === 'EBL_EXCESS_SIGNIFICANT')?.severity).toBe('low');
  });

  test('Archetype B with ≤30% EBL excess does NOT trigger warning', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 700_000, passiveIncome: 100_000 });
    const warnings = generateFitWarnings('B', baseUtil, profile, 0, 0.20);
    expect(warnings.some(w => w.code === 'EBL_EXCESS_SIGNIFICANT')).toBe(false);
  });

  test('All warnings have statutoryRef field populated', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });
    const warnings = generateFitWarnings('E', baseUtil, profile, 1.0, 0);
    for (const w of warnings) {
      expect(w.statutoryRef).toBeTruthy();
    }
  });
});

// =============================================================================
// classifyInvestorFit — B3 Spec Scenarios
// =============================================================================

describe('classifyInvestorFit', () => {
  // B3-F1: REP, $200K ord, $150K pass → Archetype A, excellent, fitScore ≥ 90
  test('B3-F1: REP, $200K ord, $150K pass → Archetype A, excellent, fitScore ≥ 90', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });
    const util = mockUtilizationResult({
      treatment: 'nonpassive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: 2,
      lihtcGeneratedPerYear: 0.7,
      lihtcUsablePerYear: 0.7,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('A');
    expect(result.fitRating).toBe('excellent');
    expect(result.fitScore).toBeGreaterThanOrEqual(90);
    expect(result.archetypeLabel).toBe('REP with Rental Portfolio');
  });

  // B3-F2: REP, $1.5M ord, $500K pass → Archetype B, very_good, §461(l) warning
  test('B3-F2: REP, $1.5M ord, $500K pass → Archetype B, very_good', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 1_500_000, passiveIncome: 500_000 });
    const util = mockUtilizationResult({
      treatment: 'nonpassive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: 1.2,
      nolGeneratedPerYear: 0.8, // 0.8/2 = 40% > 30% threshold
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('B');
    expect(result.fitRating).toBe('very_good');
    // EBL excess 40% > 30% should trigger warning
    expect(result.warnings.some(w => w.code === 'EBL_EXCESS_SIGNIFICANT')).toBe(true);
  });

  // B3-F3: Non-REP, $400K W-2, $200K pass, annual benefits $150K → Archetype C, good, no warnings
  test('B3-F3: Non-REP, $400K W-2, $200K pass → Archetype C, good, no warnings', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 1.5,
      deprAllowedPerYear: 1.5,
      lihtcGeneratedPerYear: 0.5,
      lihtcUsablePerYear: 0.5,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('C');
    expect(result.fitRating).toBe('good');
    expect(result.warnings).toHaveLength(0);
  });

  // B3-F4: Non-REP, $350K W-2, $40K pass, annual benefits $150K → Archetype D, moderate
  test('B3-F4: Non-REP, $350K W-2, $40K pass → Archetype D, moderate, credit suspension warning', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 350_000, passiveIncome: 40_000 });
    // Most benefits suspended due to limited passive income
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 1.5,
      deprAllowedPerYear: 0.4,  // Limited by $40K passive
      lihtcGeneratedPerYear: 0.5,
      lihtcUsablePerYear: 0.1,  // Most credits suspended
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('D');
    expect(result.fitRating).toBe('moderate');
    expect(result.warnings.some(w => w.code === 'HIGH_CREDIT_SUSPENSION')).toBe(true);
  });

  // B3-F5: Non-REP, $500K W-2, $0 pass → Archetype E, poor_annual, high-severity warning
  test('B3-F5: Non-REP, $500K W-2, $0 pass → Archetype E, poor_annual, high-severity', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0 });
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: 0,
      lihtcGeneratedPerYear: 0.7,
      lihtcUsablePerYear: 0,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('E');
    expect(result.fitRating).toBe('poor_annual');
    expect(result.warnings.some(w => w.severity === 'high')).toBe(true);
    expect(result.archetypeLabel).toBe('W-2 Only (Disposition Release)');
  });

  // B3-F6: Non-REP, $100K W-2, $0 pass → Archetype E
  test('B3-F6: Non-REP, $100K W-2, $0 pass → Archetype E, poor_annual', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 100_000, passiveIncome: 0 });
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: 0,
      lihtcGeneratedPerYear: 0.7,
      lihtcUsablePerYear: 0,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('E');
    expect(result.fitRating).toBe('poor_annual');
    expect(result.warnings.some(w => w.severity === 'high')).toBe(true);
  });

  // B3-F7: REP, income exactly at §461(l) threshold → B
  test('B3-F7: REP at exactly §461(l) threshold → Archetype B', () => {
    const threshold = SECTION_461L_LIMITS.MFJ;
    const profile = makeProfile({ isREP: true, ordinaryIncome: threshold, passiveIncome: 0 });
    const util = mockUtilizationResult({ treatment: 'nonpassive' });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('B');
  });

  // B3-F8: Non-REP, $1 passive → Archetype D (not E)
  test('B3-F8: Non-REP, $1 passive → Archetype D (not E)', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 100_000, passiveIncome: 1 });
    const util = mockUtilizationResult({ treatment: 'passive' });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.archetype).toBe('D');
  });
});

// =============================================================================
// FI — InvestorFitResult Field Completeness
// =============================================================================

describe('InvestorFitResult field completeness', () => {
  function makeResult(archetype: string): InvestorFitResult {
    const isREP = archetype === 'A' || archetype === 'B';
    const passiveIncome =
      archetype === 'E' ? 0 :
      archetype === 'D' ? 40_000 :
      200_000;
    const ordinaryIncome =
      archetype === 'A' ? 200_000 :
      archetype === 'B' ? 1_500_000 :
      400_000;

    const profile = makeProfile({ isREP, ordinaryIncome, passiveIncome });
    const util = mockUtilizationResult({
      treatment: isREP ? 'nonpassive' : 'passive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: archetype === 'E' ? 0 : archetype === 'D' ? 0.4 : 2,
      lihtcGeneratedPerYear: 0.7,
      lihtcUsablePerYear: archetype === 'E' ? 0 : archetype === 'D' ? 0.1 : 0.7,
    });

    return classifyInvestorFit(util, profile, 150_000);
  }

  for (const arch of ['A', 'B', 'C', 'D', 'E']) {
    test(`FI: Archetype ${arch} has all required fields populated`, () => {
      const result = makeResult(arch);
      expect(result.archetype).toBeTruthy();
      expect(result.archetypeLabel).toBeTruthy();
      expect(result.fitRating).toBeTruthy();
      expect(typeof result.fitScore).toBe('number');
      expect(typeof result.annualUtilizationPct).toBe('number');
      expect(typeof result.annualCreditUtilizationPct).toBe('number');
      expect(typeof result.annualDepreciationUtilizationPct).toBe('number');
      expect(typeof result.cumulativeSuspendedLosses).toBe('number');
      expect(typeof result.cumulativeSuspendedCredits).toBe('number');
      expect(typeof result.dispositionReleaseEstimate).toBe('number');
      expect(result.benefitTimingProfile).toBeTruthy();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.effectiveMultiple).toBe('number');
      expect(typeof result.utilizationAdjustedIRR).toBe('number');
    });
  }
});

// =============================================================================
// Benefit Timing Profile
// =============================================================================

describe('benefitTimingProfile', () => {
  test('front-loaded when >70% of benefits in Years 1-3', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });
    // Extreme front-loading: 25M year 1, 1M years 2-10, no LIHTC
    const annualUtil: AnnualUtilization[] = [];
    const deprSchedule = [25, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // Total 34M
    for (let i = 0; i < 10; i++) {
      const depr = deprSchedule[i];
      const benefitGen = depr * 0.37; // no LIHTC to dilute
      annualUtil.push({
        year: i + 1,
        depreciationGenerated: depr,
        depreciationAllowed: depr,
        depreciationSuspended: 0,
        depreciationTaxSavings: depr * 0.37,
        lihtcGenerated: 0,
        lihtcUsable: 0,
        lihtcCarried: 0,
        residualPassiveIncome: 0,
        residualPassiveTax: 0,
        nolGenerated: 0,
        nolUsed: 0,
        nolPool: 0,
        cumulativeSuspendedLoss: 0,
        cumulativeCarriedCredits: 0,
        cumulativeSuspendedCredits: 0,
        totalBenefitGenerated: benefitGen,
        totalBenefitUsable: benefitGen,
        utilizationRate: 1,
      });
    }
    // Years 1-3 benefits = (25+1+1)*0.37 = 9.99, total = 34*0.37 = 12.58
    // Ratio = 9.99/12.58 = 0.794 > 0.70 → front_loaded

    const util: TaxUtilizationResult = {
      treatment: 'nonpassive',
      treatmentLabel: 'REP — Nonpassive Treatment',
      annualUtilization: annualUtil,
      recaptureCoverage: [],
      nolDrawdownYears: 0,
      nolDrawdownSchedule: [],
      totalDepreciationSavings: annualUtil.reduce((s, y) => s + y.depreciationTaxSavings, 0),
      totalLIHTCUsed: 0,
      totalBenefitGenerated: annualUtil.reduce((s, y) => s + y.totalBenefitGenerated, 0),
      totalBenefitUsable: annualUtil.reduce((s, y) => s + y.totalBenefitUsable, 0),
      overallUtilizationRate: 1,
      fitIndicator: 'green',
      fitExplanation: '',
      computedFederalTax: 0,
      computedMarginalRate: 0.37,
      incomeComputationUsed: false,
    };

    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.benefitTimingProfile).toBe('front_loaded');
  });

  test('back-loaded when disposition release >50% of total economic value', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 500_000, passiveIncome: 0, equity: 1_000_000 });
    // All benefits suspended → large disposition release
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 2,
      deprAllowedPerYear: 0,
      lihtcGeneratedPerYear: 0.7,
      lihtcUsablePerYear: 0,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    // annualBenefitUsable ≈ 0, dispositionRelease is large
    expect(result.benefitTimingProfile).toBe('back_loaded');
  });

  test('steady when benefits distributed evenly', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 400_000, passiveIncome: 200_000 });
    const util = mockUtilizationResult({
      treatment: 'passive',
      deprGeneratedPerYear: 1.5,
      deprAllowedPerYear: 1.5,
      lihtcGeneratedPerYear: 0.5,
      lihtcUsablePerYear: 0.5,
    });
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.benefitTimingProfile).toBe('steady');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  test('empty annualUtilization array returns safe defaults', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000 });
    const util = mockUtilizationResult({ years: 0 });
    // Manually set to 0-length arrays
    util.annualUtilization = [];
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(result.annualUtilizationPct).toBe(0);
    expect(result.cumulativeSuspendedLosses).toBe(0);
    expect(result.cumulativeSuspendedCredits).toBe(0);
  });

  test('zero average annual benefits: Non-REP with any passive → C', () => {
    const profile = makeProfile({ isREP: false, ordinaryIncome: 100_000, passiveIncome: 50_000 });
    // If deal has 0 benefits, passive ≥ 0 average → C
    expect(classifyArchetype(profile, 0)).toBe('C');
  });

  test('investorEquity of 0 does not cause division by zero', () => {
    const profile = makeProfile({ isREP: true, ordinaryIncome: 200_000, passiveIncome: 150_000, equity: 0 });
    const util = mockUtilizationResult({});
    // Should not throw
    const result = classifyInvestorFit(util, profile, 150_000);
    expect(typeof result.effectiveMultiple).toBe('number');
    expect(isFinite(result.effectiveMultiple)).toBe(true);
  });
});
