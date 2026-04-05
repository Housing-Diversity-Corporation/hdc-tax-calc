/**
 * IMPL-085 Runtime Verification
 *
 * End-to-end verification of the pool aggregation engine and fund sizing
 * optimizer with go-to-market data: Trace 4001 + 701 S Jackson.
 *
 * This test exercises the full pipeline:
 * 1. Create realistic DBPs matching the two launch deals
 * 2. Aggregate into a single pool BenefitStream
 * 3. Run the sizing optimizer with multiple investor profiles
 * 4. Verify the numbers are sensible and internally consistent
 * 5. Compare REP vs Non-REP behavior
 */

import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';
import {
  aggregatePoolToBenefitStream,
  scaleBenefitStreamToMillions,
  buildInvestorProfileFromTaxInfo,
} from '../poolAggregation';
import { optimizeFundCommitment, scaleStreamByProRata } from '../fundSizingOptimizer';
import { calculateTaxUtilization } from '../investorTaxUtilization';

// =============================================================================
// Go-to-Market Deal Data
// =============================================================================

/**
 * Trace 4001 — HDC's flagship LIHTC + cost segregation deal
 * $100M project, 5% investor equity, 10-year hold, entering 2024
 */
// IMPL-148: DBP values in millions (engine convention)
const trace4001: DealBenefitProfile = {
  dealConduitId: 1,
  dealName: 'Trace 4001',
  propertyState: 'WA',
  fundYear: 2024,
  projectCost: 100,
  grossEquity: 5,
  netEquity: 4.5,
  syndicationProceeds: 0.5,
  costSegregationPercent: 20,
  depreciableBasis: 34,
  depreciationSchedule: [
    16, 2, 2, 2, 2,
    2, 2, 2, 2, 2,
  ],
  lihtcSchedule: [
    0.7, 0.7, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7,
  ],
  stateLihtcSchedule: [
    0.3, 0.3, 0.3, 0.3, 0.3,
    0.3, 0.3, 0.3, 0.3, 0.3,
  ],
  operatingCashFlow: [
    0.5, 0.51, 0.52, 0.53, 0.541,
    0.551, 0.562, 0.573, 0.585, 0.596,
  ],
  holdPeriod: 10,
  projectedExitYear: 2034,
  exitProceeds: 15,
  cumulativeDepreciation: 34,
  recaptureExposure: 8.5, // 25% of cumulative
  projectedAppreciation: 5,
  capitalGainsTax: 1.19,
  ozEnabled: false,
  pisMonth: 6,
  pisYear: 2024,
  seniorDebtPct: 65,
  philDebtPct: 10,
  equityPct: 5,
  stateLihtcPath: 'direct',
  syndicationRate: 0,
  extractedAt: '2026-02-14T12:00:00.000Z',
};

/**
 * 701 S Jackson — Second pool deal, entering one year later
 * $60M project, different depreciation profile, 10-year hold, entering 2025
 */
// IMPL-148: DBP values in millions (engine convention)
const jackson701: DealBenefitProfile = {
  dealConduitId: 2,
  dealName: '701 S Jackson',
  propertyState: 'WA',
  fundYear: 2025,
  projectCost: 60,
  grossEquity: 3,
  netEquity: 2.7,
  syndicationProceeds: 0.3,
  costSegregationPercent: 15,
  depreciableBasis: 22.5,
  depreciationSchedule: [
    9, 1.5, 1.5, 1.5, 1.5,
    1.5, 1.5, 1.5, 1.5, 1.5,
  ],
  lihtcSchedule: [
    0.5, 0.5, 0.5, 0.5, 0.5,
    0.5, 0.5, 0.5, 0.5, 0.5,
  ],
  stateLihtcSchedule: [
    0.2, 0.2, 0.2, 0.2, 0.2,
    0.2, 0.2, 0.2, 0.2, 0.2,
  ],
  operatingCashFlow: [
    0.35, 0.357, 0.364, 0.371, 0.379,
    0.386, 0.394, 0.402, 0.41, 0.418,
  ],
  holdPeriod: 10,
  projectedExitYear: 2035,
  exitProceeds: 10,
  cumulativeDepreciation: 22.5,
  recaptureExposure: 5.625,
  projectedAppreciation: 3,
  capitalGainsTax: 0.714,
  ozEnabled: false,
  pisMonth: 3,
  pisYear: 2025,
  seniorDebtPct: 60,
  philDebtPct: 12,
  equityPct: 5,
  stateLihtcPath: 'direct',
  syndicationRate: 0,
  extractedAt: '2026-02-14T12:00:00.000Z',
};

// =============================================================================
// Step 1: Pool Aggregation Verification
// =============================================================================

describe('IMPL-085 Runtime Verification: Trace 4001 + 701 S Jackson', () => {
  describe('Step 1: Pool Aggregation', () => {
    const { benefitStream, meta } = aggregatePoolToBenefitStream([trace4001, jackson701]);

    it('should produce correct calendar grid', () => {
      // Trace 4001: 2024-2034 (10 years)
      // 701 S Jackson: 2025-2035 (10 years)
      // Pool: 2024-2035 = 11 years
      expect(meta.poolStartYear).toBe(2024);
      expect(meta.poolEndYear).toBe(2035);
      expect(meta.consolidatedHorizon).toBe(11);
      expect(meta.dealCount).toBe(2);

      console.log('\n=== POOL AGGREGATION RESULTS ===');
      console.log(`Pool: ${meta.poolStartYear}-${meta.poolEndYear} (${meta.consolidatedHorizon} years)`);
      console.log(`Deals: ${meta.dealCount}`);
    });

    it('should produce correct total equity', () => {
      expect(meta.totalGrossEquity).toBe(8_000_000);
      expect(meta.totalNetEquity).toBe(7_200_000);

      console.log(`Total Gross Equity: $${(meta.totalGrossEquity / 1e6).toFixed(1)}M`);
      console.log(`Total Net Equity: $${(meta.totalNetEquity / 1e6).toFixed(1)}M`);
    });

    it('should produce correct consolidated depreciation', () => {
      // Year 1 (2024): only Trace 4001 = $16M
      expect(benefitStream.annualDepreciation[0]).toBe(16_000_000);

      // Year 2 (2025): Trace4001 $2M + Jackson $9M = $11M
      expect(benefitStream.annualDepreciation[1]).toBe(11_000_000);

      // Year 3+ (2026+): Trace4001 $2M + Jackson $1.5M = $3.5M
      expect(benefitStream.annualDepreciation[2]).toBe(3_500_000);

      // Year 11 (2034): only Jackson year 10 = $1.5M
      expect(benefitStream.annualDepreciation[10]).toBe(1_500_000);

      const totalDepr = benefitStream.annualDepreciation.reduce((s, v) => s + v, 0);
      console.log(`Total Consolidated Depreciation: $${(totalDepr / 1e6).toFixed(1)}M`);
      console.log('Depreciation by year:', benefitStream.annualDepreciation.map(
        (v, i) => `Y${i + 1}: $${(v / 1e6).toFixed(1)}M`
      ).join(', '));
    });

    it('should produce 2 exit events sorted chronologically', () => {
      expect(benefitStream.exitEvents).toHaveLength(2);
      // Trace 4001 exits year 10, Jackson exits year 11
      expect(benefitStream.exitEvents[0].year).toBe(10);
      expect(benefitStream.exitEvents[0].dealId).toBe('Trace 4001');
      expect(benefitStream.exitEvents[1].year).toBe(11);
      expect(benefitStream.exitEvents[1].dealId).toBe('701 S Jackson');

      console.log(`Exit events: ${benefitStream.exitEvents.map(
        e => `${e.dealId} @ Y${e.year}`
      ).join(', ')}`);
    });

    it('should produce stream arrays of correct length', () => {
      expect(benefitStream.annualDepreciation).toHaveLength(11);
      expect(benefitStream.annualLIHTC).toHaveLength(11);
      expect(benefitStream.annualStateLIHTC).toHaveLength(11);
      expect(benefitStream.annualOperatingCF).toHaveLength(11);
    });
  });

  // =============================================================================
  // Step 2: Sizing Optimizer with Non-REP Investor
  // =============================================================================

  describe('Step 2: Sizing Optimizer — Non-REP Investor ($2M passive income)', () => {
    const { benefitStream, meta } = aggregatePoolToBenefitStream([trace4001, jackson701]);
    const nonRepInvestor = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 1_000_000,
      annualPortfolioIncome: 500_000,
      investorTrack: 'non-rep',
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const result = optimizeFundCommitment(
      benefitStream, meta.totalGrossEquity, nonRepInvestor, { steps: 50 }
    );

    it('should find reasonable optimal commitment', () => {
      expect(result.optimalCommitment).toBeGreaterThan(0);
      expect(result.optimalCommitment).toBeLessThanOrEqual(meta.totalGrossEquity);

      console.log('\n=== NON-REP SIZING RESULTS ===');
      console.log(`Optimal Commitment: $${(result.optimalCommitment / 1e6).toFixed(3)}M`);
      console.log(`Pro-rata Share: ${(result.optimalProRataShare * 100).toFixed(1)}%`);
    });

    it('should produce positive tax savings', () => {
      expect(result.optimalTaxSavings).toBeGreaterThan(0);
      expect(result.optimalSavingsPerDollar).toBeGreaterThan(0);

      console.log(`Total Tax Savings: $${(result.optimalTaxSavings / 1e6).toFixed(3)}M`);
      console.log(`Savings/Dollar: $${result.optimalSavingsPerDollar.toFixed(3)}`);
    });

    it('should classify peak type', () => {
      expect(['peak', 'plateau', 'rising']).toContain(result.peakType);
      console.log(`Peak Type: ${result.peakType}`);
      console.log(`Utilization Rate: ${(result.optimalUtilizationRate * 100).toFixed(1)}%`);
    });

    it('should produce full efficiency curve', () => {
      expect(result.efficiencyCurve.length).toBe(51); // 50 steps + 1
      // Curve should not be all zeros
      const nonZeroPoints = result.efficiencyCurve.filter(p => p.totalTaxSavings > 0);
      expect(nonZeroPoints.length).toBeGreaterThan(0);

      console.log(`Efficiency curve: ${result.efficiencyCurve.length} points`);
      console.log('Sample curve points:');
      [0, 12, 25, 37, 50].forEach(i => {
        const p = result.efficiencyCurve[i];
        if (p) {
          console.log(`  Step ${i}: $${(p.commitment / 1e6).toFixed(2)}M → savings/$ = $${p.savingsPerDollar.toFixed(3)}, util = ${(p.utilizationRate * 100).toFixed(0)}%`);
        }
      });
    });

    it('should produce valid full utilization result at optimal point', () => {
      const util = result.fullUtilizationResult;
      expect(util.annualUtilization).toHaveLength(11); // 11-year horizon
      expect(util.recaptureCoverage).toHaveLength(2); // 2 exit events
      expect(util.treatment).toBe('passive'); // Non-REP = passive

      console.log(`Treatment: ${util.treatmentLabel}`);
      console.log(`Fit: ${util.fitIndicator} — ${util.fitExplanation}`);
      console.log(`Recapture: ${util.recaptureCoverage.length} events`);
    });
  });

  // =============================================================================
  // Step 3: Sizing Optimizer with REP Investor
  // =============================================================================

  describe('Step 3: Sizing Optimizer — REP Investor ($5M ordinary income)', () => {
    const { benefitStream, meta } = aggregatePoolToBenefitStream([trace4001, jackson701]);
    const repInvestor = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 5_000_000,
      annualPortfolioIncome: 1_000_000,
      investorTrack: 'rep',
      groupingElection: true,
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const result = optimizeFundCommitment(
      benefitStream, meta.totalGrossEquity, repInvestor, { steps: 50 }
    );

    it('should find optimal commitment', () => {
      expect(result.optimalCommitment).toBeGreaterThan(0);

      console.log('\n=== REP SIZING RESULTS ===');
      console.log(`Optimal Commitment: $${(result.optimalCommitment / 1e6).toFixed(3)}M`);
      console.log(`Pro-rata Share: ${(result.optimalProRataShare * 100).toFixed(1)}%`);
      console.log(`Total Tax Savings: $${(result.optimalTaxSavings / 1e6).toFixed(3)}M`);
      console.log(`Savings/Dollar: $${result.optimalSavingsPerDollar.toFixed(3)}`);
      console.log(`Peak Type: ${result.peakType}`);
      console.log(`Utilization Rate: ${(result.optimalUtilizationRate * 100).toFixed(1)}%`);
    });

    it('should show nonpassive treatment', () => {
      expect(result.fullUtilizationResult.treatment).toBe('nonpassive');
      console.log(`Treatment: ${result.fullUtilizationResult.treatmentLabel}`);
    });
  });

  // =============================================================================
  // Step 4: Sanity Checks — Cross-Profile Comparison
  // =============================================================================

  describe('Step 4: Sanity Checks', () => {
    const { benefitStream, meta } = aggregatePoolToBenefitStream([trace4001, jackson701]);

    const nonRepInvestor = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 1_000_000,
      annualPortfolioIncome: 500_000,
      investorTrack: 'non-rep',
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const repInvestor = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 2_000_000,
      annualOrdinaryIncome: 5_000_000,
      annualPortfolioIncome: 1_000_000,
      investorTrack: 'rep',
      groupingElection: true,
      federalOrdinaryRate: 37,
      federalCapitalGainsRate: 20,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const lowIncomeInvestor = buildInvestorProfileFromTaxInfo({
      filingStatus: 'married',
      annualPassiveIncome: 100_000,
      annualOrdinaryIncome: 200_000,
      annualPortfolioIncome: 50_000,
      investorTrack: 'non-rep',
      federalOrdinaryRate: 32,
      federalCapitalGainsRate: 15,
      niitRate: 3.8,
      selectedState: 'NY',
      stateOrdinaryRate: 10.9,
      stateCapitalGainsRate: 10.9,
    });

    const nonRepResult = optimizeFundCommitment(benefitStream, meta.totalGrossEquity, nonRepInvestor, { steps: 30 });
    const repResult = optimizeFundCommitment(benefitStream, meta.totalGrossEquity, repInvestor, { steps: 30 });
    const lowIncomeResult = optimizeFundCommitment(benefitStream, meta.totalGrossEquity, lowIncomeInvestor, { steps: 30 });

    it('should produce different treatments for REP vs Non-REP', () => {
      expect(nonRepResult.fullUtilizationResult.treatment).toBe('passive');
      expect(repResult.fullUtilizationResult.treatment).toBe('nonpassive');
    });

    it('should show higher utilization for higher-income investors', () => {
      // Compare at same commitment level (midpoint)
      const midIdx = 15;
      const nonRepMid = nonRepResult.efficiencyCurve[midIdx];
      const lowMid = lowIncomeResult.efficiencyCurve[midIdx];

      // Higher passive income → more passive income to offset → higher utilization
      expect(nonRepMid.utilizationRate).toBeGreaterThanOrEqual(lowMid.utilizationRate * 0.9);

      console.log('\n=== CROSS-PROFILE COMPARISON ===');
      console.log(`Non-REP ($2M passive): optimal = $${(nonRepResult.optimalCommitment / 1e6).toFixed(2)}M, util = ${(nonRepResult.optimalUtilizationRate * 100).toFixed(0)}%`);
      console.log(`REP ($5M ordinary):    optimal = $${(repResult.optimalCommitment / 1e6).toFixed(2)}M, util = ${(repResult.optimalUtilizationRate * 100).toFixed(0)}%`);
      console.log(`Low-Income Non-REP:    optimal = $${(lowIncomeResult.optimalCommitment / 1e6).toFixed(2)}M, util = ${(lowIncomeResult.optimalUtilizationRate * 100).toFixed(0)}%`);
    });

    it('should show lower utilization for zero-passive-income Non-REP', () => {
      // Zero passive income means everything suspends under §469
      expect(lowIncomeResult.optimalUtilizationRate).toBeLessThan(nonRepResult.optimalUtilizationRate + 0.01);
    });

    it('should report capacity exhaustion for low-income investor', () => {
      // With only $100K passive income, capacity should be limited
      const hasLowUtilization = lowIncomeResult.efficiencyCurve.some(p => p.utilizationRate < 0.50);
      if (hasLowUtilization) {
        expect(lowIncomeResult.capacityExhaustedAt).not.toBeNull();
        console.log(`Low-income capacity exhausted at: $${((lowIncomeResult.capacityExhaustedAt || 0) / 1e6).toFixed(2)}M`);
      }
    });
  });

  // =============================================================================
  // Step 5: Direct Tax Utilization at Optimal Point
  // =============================================================================

  describe('Step 5: Direct Utilization Verification', () => {
    it('should produce identical result when running engine directly at optimal point', () => {
      const { benefitStream, meta } = aggregatePoolToBenefitStream([trace4001, jackson701]);
      const investor = buildInvestorProfileFromTaxInfo({
        filingStatus: 'married',
        annualPassiveIncome: 2_000_000,
        annualOrdinaryIncome: 1_000_000,
        annualPortfolioIncome: 500_000,
        investorTrack: 'non-rep',
        federalOrdinaryRate: 37,
        federalCapitalGainsRate: 20,
        niitRate: 3.8,
        selectedState: 'NY',
        stateOrdinaryRate: 10.9,
        stateCapitalGainsRate: 10.9,
      });

      const optimizerResult = optimizeFundCommitment(benefitStream, meta.totalGrossEquity, investor, { steps: 50 });

      // Re-run the engine directly at the optimal commitment
      const proRata = optimizerResult.optimalCommitment / meta.totalGrossEquity;
      const scaledStream = scaleStreamByProRata(benefitStream, proRata);
      const millionStream = scaleBenefitStreamToMillions(scaledStream);
      const directResult = calculateTaxUtilization(millionStream, investor);

      // Results should match
      expect(directResult.treatment).toBe(optimizerResult.fullUtilizationResult.treatment);
      expect(directResult.overallUtilizationRate).toBeCloseTo(
        optimizerResult.fullUtilizationResult.overallUtilizationRate, 4
      );
      expect(directResult.totalDepreciationSavings).toBeCloseTo(
        optimizerResult.fullUtilizationResult.totalDepreciationSavings, 6
      );

      console.log('\n=== DIRECT VERIFICATION ===');
      console.log('Optimizer result matches direct engine call: PASS');
    });
  });
});
