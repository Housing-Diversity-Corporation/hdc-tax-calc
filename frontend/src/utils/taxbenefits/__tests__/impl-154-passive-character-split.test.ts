/**
 * IMPL-154: Passive Income Character Split — Tax Utilization Tests
 *
 * Verifies that the engine correctly computes character-weighted effective rates
 * and §469(a)(2) credit ceilings when passive income has both ordinary and LTCG components.
 *
 * Five scenarios from the spec:
 * 1. Fully ordinary passive — $10M × 40.8% = $4,080,000 ceiling (backward compat)
 * 2. Fully LTCG passive — $10M × 23.8% = $2,380,000 ceiling
 * 3. 50/50 mixed — $10M × 32.3% = $3,230,000 ceiling
 * 4. Fully LTCG $50M — $50M × 23.8% = $11,900,000 ceiling
 * 5. Backward compat — character fields = 0, annualPassiveIncome = $10M → fully ordinary
 */

import {
  calculateTaxUtilization,
  computeFederalTax,
  InvestorProfile,
  BenefitStream,
} from '../investorTaxUtilization';

// =============================================================================
// Helper: Build a passive investor profile
// =============================================================================

function makePassiveProfile(overrides: Partial<InvestorProfile> = {}): InvestorProfile {
  return {
    annualPassiveIncome: 10_000_000,
    annualPassiveOrdinaryIncome: 0,
    annualPassiveLTCGIncome: 0,
    annualOrdinaryIncome: 0,
    annualPortfolioIncome: 0,
    filingStatus: 'MFJ',
    investorTrack: 'non-rep',
    groupingElection: false,
    federalOrdinaryRate: 37,
    federalCapGainsRate: 0.238,
    investorState: 'WA',  // NIIT applies, no state tax
    stateOrdinaryRate: 0,
    stateCapGainsRate: 0,
    investorEquity: 16_000_000,
    ...overrides,
  };
}

// Minimal benefit stream: $1M depreciation for 1 year, small LIHTC, no exit
function makeSimpleBenefitStream(): BenefitStream {
  return {
    annualDepreciation: [1],  // $1M (units = millions)
    annualLIHTC: [0.1],       // $100K LIHTC
    annualStateLIHTC: [0],
    annualOperatingCF: [0],
    exitEvents: [],
    grossEquity: 16,
    netEquity: 16,
    syndicationOffset: 0,
  };
}

// =============================================================================
// Scenario Tests
// =============================================================================

describe('IMPL-154: Passive Income Character Split', () => {

  describe('computeFederalTax — character-split output', () => {

    it('Scenario 1: fully ordinary $10M → passiveTaxLiability at ordinary rate', () => {
      // All passive income is ordinary. Character fields = 0 (legacy path).
      const result = computeFederalTax(10_000_000, 0, 0, 'MFJ', 0, 0);

      // Passive tax = federalTaxLiability × (10M / 10M) = federalTaxLiability
      expect(result.passiveTaxLiability).toBeGreaterThan(0);
      expect(result.passiveLTCGTaxLiability).toBe(0);
      // All passive treated as ordinary
      expect(result.passiveOrdinaryTaxLiability).toBe(result.passiveTaxLiability);
    });

    it('Scenario 2: fully LTCG $10M → passiveLTCGTaxLiability at 20%', () => {
      const result = computeFederalTax(10_000_000, 0, 0, 'MFJ', 0, 10_000_000);

      // LTCG portion: $10M × 20% = $2,000,000 (pre-NIIT)
      expect(result.passiveLTCGTaxLiability).toBeCloseTo(2_000_000, -2);
      expect(result.passiveOrdinaryTaxLiability).toBe(0);
      expect(result.passiveTaxLiability).toBeCloseTo(2_000_000, -2);
    });

    it('Scenario 3: 50/50 mixed $10M → blended passive tax', () => {
      const result = computeFederalTax(10_000_000, 0, 0, 'MFJ', 5_000_000, 5_000_000);

      // Ordinary: $5M × marginalRate (37%) = $1,850,000
      // LTCG: $5M × 20% = $1,000,000
      // Total passive tax = $2,850,000
      expect(result.passiveOrdinaryTaxLiability).toBeCloseTo(5_000_000 * 0.37, -2);
      expect(result.passiveLTCGTaxLiability).toBeCloseTo(1_000_000, -2);
      expect(result.passiveTaxLiability).toBeCloseTo(
        result.passiveOrdinaryTaxLiability + result.passiveLTCGTaxLiability, 0
      );
    });

  });

  describe('calculateTaxUtilization — effectivePassiveRate and credit ceiling', () => {

    it('Scenario 1: fully ordinary $10M passive → effectiveRate = 40.8%, ceiling = $4.08M', () => {
      // annualPassiveIncome = $10M, both character fields = 0 → legacy path
      const profile = makePassiveProfile({
        annualPassiveIncome: 10_000_000,
        annualPassiveOrdinaryIncome: 0,
        annualPassiveLTCGIncome: 0,
      });
      const stream = makeSimpleBenefitStream();
      const result = calculateTaxUtilization(stream, profile);

      const year1 = result.annualUtilization[0];
      // Legacy path: effectivePassiveRate should be 0 (not populated for legacy)
      // depreciationTaxSavings = $1M × 40.8% = $0.408M
      expect(year1.depreciationTaxSavings).toBeCloseTo(0.408, 3);
      // residualPassiveTax = (10M - 1M) / 1M × 40.8% = 9 × 0.408 = $3.672M
      expect(year1.residualPassiveTax).toBeCloseTo(9 * 0.408, 2);
    });

    it('Scenario 2: fully LTCG $10M passive → effectiveRate = 23.8%, ceiling = $2.38M', () => {
      const profile = makePassiveProfile({
        annualPassiveIncome: 10_000_000,
        annualPassiveOrdinaryIncome: 0,
        annualPassiveLTCGIncome: 10_000_000,
      });
      const stream = makeSimpleBenefitStream();
      const result = calculateTaxUtilization(stream, profile);

      const year1 = result.annualUtilization[0];
      // effectivePassiveRate = (0 × 0.408 + 10M × 0.238) / 10M = 0.238
      expect(year1.effectivePassiveRate).toBeCloseTo(0.238, 3);
      // depreciationTaxSavings = $1M × 23.8% = $0.238M
      expect(year1.depreciationTaxSavings).toBeCloseTo(0.238, 3);
      // residualPassiveTax = 9 × 0.238 = $2.142M
      expect(year1.residualPassiveTax).toBeCloseTo(9 * 0.238, 2);
      // Character-split fields
      expect(year1.passiveLTCGIncome).toBeCloseTo(10, 0); // $10M in millions
      expect(year1.passiveOrdinaryIncome).toBe(0);
    });

    it('Scenario 3: 50/50 mixed $10M → effectiveRate = 32.3%, ceiling = $3.23M', () => {
      const profile = makePassiveProfile({
        annualPassiveIncome: 10_000_000,
        annualPassiveOrdinaryIncome: 5_000_000,
        annualPassiveLTCGIncome: 5_000_000,
      });
      const stream = makeSimpleBenefitStream();
      const result = calculateTaxUtilization(stream, profile);

      const year1 = result.annualUtilization[0];
      // effectivePassiveRate = (5M × 0.408 + 5M × 0.238) / 10M = 0.323
      expect(year1.effectivePassiveRate).toBeCloseTo(0.323, 3);
      // depreciationTaxSavings = $1M × 32.3% = $0.323M
      expect(year1.depreciationTaxSavings).toBeCloseTo(0.323, 3);
    });

    it('Scenario 4: fully LTCG $50M passive → ceiling = $11.9M', () => {
      const profile = makePassiveProfile({
        annualPassiveIncome: 50_000_000,
        annualPassiveOrdinaryIncome: 0,
        annualPassiveLTCGIncome: 50_000_000,
      });
      // Use a larger depreciation to test the ceiling effect
      const stream: BenefitStream = {
        annualDepreciation: [10],  // $10M
        annualLIHTC: [0.5],
        annualStateLIHTC: [0],
        annualOperatingCF: [0],
        exitEvents: [],
        grossEquity: 16,
        netEquity: 16,
        syndicationOffset: 0,
      };
      const result = calculateTaxUtilization(stream, profile);

      const year1 = result.annualUtilization[0];
      // effectivePassiveRate = 0.238
      expect(year1.effectivePassiveRate).toBeCloseTo(0.238, 3);
      // depreciationTaxSavings = $10M × 23.8% = $2.38M
      expect(year1.depreciationTaxSavings).toBeCloseTo(2.38, 2);
      // residualPassiveTax = (50 - 10) × 0.238 = $9.52M
      expect(year1.residualPassiveTax).toBeCloseTo(40 * 0.238, 2);
    });

    it('Scenario 5: backward compat — character fields = 0, annualPassiveIncome = $10M → fully ordinary', () => {
      // Both annualPassiveOrdinaryIncome and annualPassiveLTCGIncome are 0
      // annualPassiveIncome is $10M → engine treats as fully ordinary (40.8%)
      const profile = makePassiveProfile({
        annualPassiveIncome: 10_000_000,
        annualPassiveOrdinaryIncome: 0,
        annualPassiveLTCGIncome: 0,
      });
      const stream = makeSimpleBenefitStream();
      const result = calculateTaxUtilization(stream, profile);

      const year1 = result.annualUtilization[0];
      // Must match Scenario 1 exactly — 40.8% rate
      expect(year1.depreciationTaxSavings).toBeCloseTo(0.408, 3);
      expect(year1.residualPassiveTax).toBeCloseTo(9 * 0.408, 2);
      // effectivePassiveRate = 0 for legacy path (no character split)
      // The legacy path uses passiveMarginalRate directly, effectivePassiveRate = passiveMarginalRate
      expect(year1.effectivePassiveRate).toBeCloseTo(0.408, 3);
    });
  });
});
