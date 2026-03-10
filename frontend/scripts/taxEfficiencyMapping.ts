/**
 * Tax Efficiency Mapping — Batch Runner
 *
 * Deterministic parameter sweep of calculateTaxUtilization() across every plausible
 * investor profile for a fixed deal (Trace 260303 65M).
 *
 * Produces:
 *   output/trace_260303_65M_efficiency_map.csv   (~3.1M rows)
 *   output/trace_260303_65M_summary.txt          (summary statistics)
 *
 * Usage:
 *   npx tsx scripts/taxEfficiencyMapping.ts
 *
 * Prerequisites:
 *   - BenefitStream JSON at scripts/input/trace_260303_65M.json
 *     (export from the platform or create via scripts/exportBenefitStream.ts)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { calculateTaxUtilization, computeFederalTax } from '../src/utils/taxbenefits/investorTaxUtilization';
import { scaleBenefitStream, computeOptimalSizing } from '../src/utils/taxbenefits/investorSizing';
import { classifyInvestorFit } from '../src/utils/taxbenefits/investorFit';
import { getStateTaxRate } from '../src/utils/taxbenefits/stateProfiles';
import type { BenefitStream, InvestorProfile, TaxUtilizationResult } from '../src/utils/taxbenefits/investorTaxUtilization';

// =============================================================================
// Deal BenefitStream — Trace 260303 65M
// =============================================================================

// Hardcoded from the Trace 260303 65M saved configuration.
// Partnership level, in millions (engine convention).
const DEAL_BENEFIT_STREAM: BenefitStream = {
  annualDepreciation: [
    13.44, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833, 1.833
  ],
  annualLIHTC: [
    1.173, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 2.346, 1.173, 0
  ],
  annualStateLIHTC: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  annualOperatingCF: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  exitEvents: [{
    year: 12,
    exitProceeds: 15.26,
    cumulativeDepreciation: 34.52,
    recaptureExposure: 8.63,
    appreciationGain: 3.05,
    ozEnabled: true,
    sec1245Recapture: 13.44,
    sec1250Recapture: 21.08,
  }],
  grossEquity: 16.05,
  netEquity: 16.05,
  syndicationOffset: 0,
};

const DEAL_TOTAL_EQUITY = 16.05e6; // $16.05M in dollars

// Dollar-denominated stream for computeOptimalSizing (which internally converts to millions)
const DEAL_BENEFIT_STREAM_DOLLARS: BenefitStream = {
  annualDepreciation: DEAL_BENEFIT_STREAM.annualDepreciation.map(v => v * 1e6),
  annualLIHTC: DEAL_BENEFIT_STREAM.annualLIHTC.map(v => v * 1e6),
  annualStateLIHTC: DEAL_BENEFIT_STREAM.annualStateLIHTC.map(v => v * 1e6),
  annualOperatingCF: DEAL_BENEFIT_STREAM.annualOperatingCF.map(v => v * 1e6),
  exitEvents: DEAL_BENEFIT_STREAM.exitEvents.map(e => ({
    ...e,
    exitProceeds: e.exitProceeds * 1e6,
    cumulativeDepreciation: e.cumulativeDepreciation * 1e6,
    recaptureExposure: e.recaptureExposure * 1e6,
    appreciationGain: e.appreciationGain * 1e6,
    sec1245Recapture: (e.sec1245Recapture ?? 0) * 1e6,
    sec1250Recapture: (e.sec1250Recapture ?? 0) * 1e6,
  })),
  grossEquity: DEAL_BENEFIT_STREAM.grossEquity * 1e6,
  netEquity: DEAL_BENEFIT_STREAM.netEquity * 1e6,
  syndicationOffset: DEAL_BENEFIT_STREAM.syndicationOffset * 1e6,
};

// =============================================================================
// Combination Space
// =============================================================================

const INCOMES = [
  250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000,
  3_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000,
];

const COMPOSITIONS = [
  { label: '100_ordinary',    ordinary: 1.0,  passive: 0,    portfolio: 0 },
  { label: '100_passive',     ordinary: 0,    passive: 1.0,  portfolio: 0 },
  { label: '75_25_ord_pass',  ordinary: 0.75, passive: 0.25, portfolio: 0 },
  { label: '50_50_ord_pass',  ordinary: 0.5,  passive: 0.5,  portfolio: 0 },
  { label: '25_75_ord_pass',  ordinary: 0.25, passive: 0.75, portfolio: 0 },
  { label: '33_33_33_mixed',  ordinary: 0.33, passive: 0.33, portfolio: 0.34 },
];

const FILING_STATUSES: Array<'MFJ' | 'Single' | 'HoH'> = ['MFJ', 'Single', 'HoH'];

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC','PR','VI','GU','MP','AS',
];

const TRACKS = [
  { label: 'rep_grouped',   investorTrack: 'rep' as const,     groupingElection: true },
  { label: 'rep_ungrouped', investorTrack: 'rep' as const,     groupingElection: false },
  { label: 'non_rep',       investorTrack: 'non-rep' as const, groupingElection: false },
];

const INVESTMENTS = [
  100_000, 200_000, 500_000, 750_000, 1_000_000,
  1_500_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 10_000_000,
];

// Roth sub-loop (REP + grouped only)
const ROTH_CONVERSIONS = [0, 50_000, 100_000, 150_000, 200_000, 300_000];

// =============================================================================
// Helpers
// =============================================================================

function buildProfile(
  income: number,
  comp: typeof COMPOSITIONS[0],
  filing: 'MFJ' | 'Single' | 'HoH',
  state: string,
  track: typeof TRACKS[0],
  invest: number,
): InvestorProfile {
  const stateRate = getStateTaxRate(state);
  return {
    annualOrdinaryIncome: income * comp.ordinary,
    annualPassiveIncome: income * comp.passive,
    annualPortfolioIncome: income * comp.portfolio,
    investorTrack: track.investorTrack,
    groupingElection: track.groupingElection,
    filingStatus: filing,
    investorState: state,
    investorEquity: invest,
    federalOrdinaryRate: 0,       // Let engine compute from brackets
    federalCapGainsRate: 23.8,    // 20% + 3.8% NIIT
    stateOrdinaryRate: stateRate,
    stateCapGainsRate: stateRate,  // Most states tax CG at ordinary rate
  };
}

interface SizingCacheEntry {
  optimalCommitment: number;         // Peak efficiency (savings/dollar) commitment
  optimalUtilCommitment: number;     // Peak utilization % commitment (production optimizer)
  constraintBinding: string;
  utilizationCurve: Array<{ commitmentAmount: number; annualUtilizationPct: number; effectiveMultiple: number }>;
  peakEfficiency: number;            // Best effectiveMultiple value
}

function isValidCombination(
  track: typeof TRACKS[0],
  comp: typeof COMPOSITIONS[0],
  income: number,
  invest: number,
): boolean {
  // non_rep with groupingElection: true is impossible (already encoded in TRACKS)
  // Income < $250K with all portfolio = no utilization
  if (income <= 250_000 && comp.ordinary === 0 && comp.passive === 0) return false;
  // Investment > total equity ($16.05M) — cap at $10M (already in INVESTMENTS)
  if (invest > DEAL_TOTAL_EQUITY) return false;
  return true;
}

function isRothEligible(track: typeof TRACKS[0]): boolean {
  return track.label === 'rep_grouped';
}

/**
 * Compute actual net tax per year using correct §38(c) floor in consistent dollar units.
 *
 * The production engine has a unit mismatch bug: federalTaxLiability is in dollars but
 * depreciationTaxSavings/lihtcGenerated are in millions. This causes the §38(c) limit
 * (~$119K in dollars) to always exceed available credits (~0.146 in millions), effectively
 * disabling the floor. The batch runner corrects this by recomputing in dollars.
 *
 *   taxAfterDep = grossTax - depSavings (both dollars)
 *   sec38cLimit = 0.75 × taxAfterDep + $6,250
 *   creditsUsed = min(creditsAvailable, sec38cLimit)
 *   netTax = taxAfterDep - creditsUsed
 */
function computeNetTaxPerYear(
  grossFederalTax: number,           // dollars (from computeFederalTax)
  result: TaxUtilizationResult,
  isNonpassive: boolean,
): number[] {
  let carriedCredits = 0; // recompute carryforward with correct floor
  return result.annualUtilization.map(yr => {
    const depSavDollars = yr.depreciationTaxSavings * 1e6;
    const taxAfterDep = Math.max(0, grossFederalTax - depSavDollars);

    if (isNonpassive) {
      // §38(c) floor for nonpassive — recomputed with correct units
      const sec38cLimit = 0.75 * taxAfterDep + 6_250;
      const creditsGenDollars = yr.lihtcGenerated * 1e6;
      const totalAvailable = creditsGenDollars + carriedCredits;
      const creditsUsed = Math.min(totalAvailable, sec38cLimit);
      carriedCredits = totalAvailable - creditsUsed;
      return taxAfterDep - creditsUsed;
    } else {
      // Passive: credits limited by passive tax — use engine value
      const creditsUsed = yr.lihtcUsable * 1e6;
      return taxAfterDep - creditsUsed;
    }
  });
}

const CSV_HEADER = [
  'annualIncome','incomeComposition','filingStatus','state','investorTrack','investmentSize',
  'rothAnnualConversion',
  'totalTaxSavings','totalCreditsGenerated','totalCreditsUsed','creditUtilizationRate',
  'totalDepreciationGenerated','totalDepreciationAllowed','depreciationUtilizationRate',
  'nolPoolAtExit','recaptureCoverageRatio',
  'year1EffectiveRate','year1TaxSavings',
  'steadyStateEffectiveRate','steadyStateTaxSavings',
  'taxSavingsPerDollar','realizedMOIC','utilizationRate','gapVsPlatform',
  'optimalInvestment','peakType','bindingConstraint','isAtOptimal',
  'archetype','fitScore',
  'rothTotalConverted','rothTotalConversionTax','rothEffectiveConversionRate',
  'rothConversionSavingsVsNoFund','rothOptimalInvestment','rothOptimalDelta',
].join(',');

function extractMetrics(
  result: TaxUtilizationResult,
  profile: InvestorProfile,
  invest: number,
  rothConversion: number,
  baseIncome: number,
  baseResult: TaxUtilizationResult | null,
  sizingResult: SizingCacheEntry | null,
  fitResult: { archetype: string; fitScore: number } | null,
): string {
  const annuals = result.annualUtilization;
  const years = annuals.length;
  const isNonpassiveProfile = profile.investorTrack === 'rep' && profile.groupingElection;

  // For REP+grouped profiles, recompute tax savings with corrected §38(c) floor
  // (the engine's totalLIHTCUsed is inflated due to dollar/millions unit mismatch)
  let totalTaxSavings: number;
  let totalCreditsUsed: number;
  const totalCreditsGenerated = annuals.reduce((s, yr) => s + yr.lihtcGenerated, 0);

  if (isNonpassiveProfile) {
    const netTaxPerYear = computeNetTaxPerYear(result.computedFederalTax, result, true);
    const grossTaxTotal = result.computedFederalTax * years;
    const netTaxTotal = netTaxPerYear.reduce((s, t) => s + t, 0);
    totalTaxSavings = (grossTaxTotal - netTaxTotal) / 1e6; // back to millions for CSV
    // Corrected credits used = total savings minus depreciation savings
    totalCreditsUsed = totalTaxSavings - result.totalDepreciationSavings;
  } else {
    totalTaxSavings = result.totalDepreciationSavings + result.totalLIHTCUsed;
    totalCreditsUsed = result.totalLIHTCUsed;
  }
  const creditUtilizationRate = totalCreditsGenerated > 0 ? totalCreditsUsed / totalCreditsGenerated : 0;

  // Depreciation
  const totalDepreciationGenerated = annuals.reduce((s, yr) => s + yr.depreciationGenerated, 0);
  const totalDepreciationAllowed = annuals.reduce((s, yr) => s + yr.depreciationAllowed, 0);
  const depreciationUtilizationRate = totalDepreciationGenerated > 0 ? totalDepreciationAllowed / totalDepreciationGenerated : 0;

  // NOL at exit
  const nolPoolAtExit = years > 0 ? annuals[years - 1].nolPool : 0;

  // Recapture coverage
  const recaptureCoverageRatio = result.recaptureCoverage.length > 0
    ? result.recaptureCoverage[0].coverageRatio
    : 0;

  // Year 1 metrics
  const year1 = annuals[0];
  const year1TaxSavings = year1 ? year1.totalBenefitUsable : 0;
  const year1EffectiveRate = year1 && year1.totalBenefitGenerated > 0
    ? year1.totalBenefitUsable / year1.totalBenefitGenerated
    : 0;

  // Steady state: average of Years 3-10 (indices 2-9)
  const steadyYears = annuals.slice(2, 10);
  const steadyStateTaxSavings = steadyYears.length > 0
    ? steadyYears.reduce((s, yr) => s + yr.totalBenefitUsable, 0) / steadyYears.length
    : 0;
  const steadyGenerated = steadyYears.length > 0
    ? steadyYears.reduce((s, yr) => s + yr.totalBenefitGenerated, 0) / steadyYears.length
    : 0;
  const steadyStateEffectiveRate = steadyGenerated > 0
    ? steadyStateTaxSavings / steadyGenerated
    : 0;

  // Per-dollar metrics
  const investDollars = invest;
  const taxSavingsPerDollar = investDollars > 0 ? (totalTaxSavings * 1e6) / investDollars : 0;
  const realizedMOIC = investDollars > 0 ? (totalTaxSavings * 1e6) / investDollars : 0;
  const utilizationRate = result.overallUtilizationRate;
  const gapVsPlatform = 0; // Would need platform results to compare

  // Sizing
  const optimalInvestment = sizingResult?.optimalCommitment ?? 0;
  const bindingConstraint = sizingResult?.constraintBinding ?? '';
  const peakType = sizingResult ? determinePeakType(sizingResult.utilizationCurve) : '';
  const isAtOptimal = optimalInvestment > 0 && Math.abs(invest - optimalInvestment) / optimalInvestment < 0.1 ? 1 : 0;

  // Fit
  const archetype = fitResult?.archetype ?? '';
  const fitScore = fitResult?.fitScore ?? 0;

  // Roth metrics
  let rothTotalConverted = 0;
  let rothTotalConversionTax = 0;
  let rothEffectiveConversionRate = 0;
  let rothConversionSavingsVsNoFund = 0;
  let rothOptimalInvestment = 0;
  let rothOptimalDelta = 0;

  if (rothConversion > 0 && baseResult) {
    rothTotalConverted = rothConversion * 10; // 10 years of conversions
    const ROTH_YEARS = 10;

    // Compute correct net tax per year using §38(c) floor with consistent dollar units
    const baseNetTax = computeNetTaxPerYear(baseResult.computedFederalTax, baseResult, isNonpassiveProfile);
    const rothNetTax = computeNetTaxPerYear(result.computedFederalTax, result, isNonpassiveProfile);

    let netTaxDeltaYr1to10 = 0;
    for (let i = 0; i < Math.min(ROTH_YEARS, annuals.length); i++) {
      netTaxDeltaYr1to10 += rothNetTax[i] - baseNetTax[i];
    }
    rothTotalConversionTax = netTaxDeltaYr1to10;
    rothEffectiveConversionRate = rothTotalConverted > 0 ? rothTotalConversionTax / rothTotalConverted : 0;
    // Without-fund cost: raw incremental tax with no fund benefits at all
    const grossTaxDeltaPerYear = result.computedFederalTax - baseResult.computedFederalTax;
    const withoutFundCost = grossTaxDeltaPerYear * ROTH_YEARS;
    rothConversionSavingsVsNoFund = withoutFundCost - rothTotalConversionTax;
    rothOptimalInvestment = 0;
    rothOptimalDelta = 0;
  }

  const vals = [
    baseIncome,
    '', // composition label filled by caller
    profile.filingStatus,
    profile.investorState,
    `${profile.investorTrack}${profile.groupingElection ? '_grouped' : profile.investorTrack === 'rep' ? '_ungrouped' : ''}`,
    invest,
    rothConversion,
    totalTaxSavings.toFixed(6),
    totalCreditsGenerated.toFixed(6),
    totalCreditsUsed.toFixed(6),
    creditUtilizationRate.toFixed(4),
    totalDepreciationGenerated.toFixed(6),
    totalDepreciationAllowed.toFixed(6),
    depreciationUtilizationRate.toFixed(4),
    nolPoolAtExit.toFixed(6),
    recaptureCoverageRatio.toFixed(4),
    year1EffectiveRate.toFixed(4),
    year1TaxSavings.toFixed(6),
    steadyStateEffectiveRate.toFixed(4),
    steadyStateTaxSavings.toFixed(6),
    taxSavingsPerDollar.toFixed(4),
    realizedMOIC.toFixed(4),
    utilizationRate.toFixed(4),
    gapVsPlatform.toFixed(4),
    optimalInvestment,
    peakType,
    bindingConstraint.replace(/,/g, ';'), // escape commas
    isAtOptimal,
    archetype,
    fitScore,
    rothTotalConverted,
    rothTotalConversionTax.toFixed(2),
    rothEffectiveConversionRate.toFixed(4),
    rothConversionSavingsVsNoFund.toFixed(2),
    rothOptimalInvestment,
    rothOptimalDelta,
  ];
  return vals.join(',');
}

function determinePeakType(curve: SizingCacheEntry['utilizationCurve']): string {
  if (!curve || curve.length < 3) return 'unknown';
  const maxEff = Math.max(...curve.map(p => p.effectiveMultiple));
  const lastEff = curve[curve.length - 1].effectiveMultiple;

  if (lastEff >= maxEff * 0.98) return 'rising';
  const plateauCount = curve.filter(p => p.effectiveMultiple >= maxEff * 0.95).length;
  if (plateauCount >= curve.length * 0.4) return 'plateau';
  return 'peak';
}

// =============================================================================
// Main Runner
// =============================================================================

async function main() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const csvPath = path.join(outputDir, 'trace_260303_65M_efficiency_map.csv');
  const summaryPath = path.join(outputDir, 'trace_260303_65M_summary.txt');

  // Write CSV header
  fs.writeFileSync(csvPath, CSV_HEADER + '\n');

  // Count total combinations for progress reporting
  let totalCombinations = 0;
  for (const income of INCOMES) {
    for (const comp of COMPOSITIONS) {
      for (const filing of FILING_STATUSES) {
        for (const state of STATES) {
          for (const track of TRACKS) {
            for (const invest of INVESTMENTS) {
              if (!isValidCombination(track, comp, income, invest)) continue;
              if (isRothEligible(track)) {
                totalCombinations += ROTH_CONVERSIONS.length; // includes 0
              } else {
                totalCombinations += 1;
              }
            }
          }
        }
      }
    }
  }

  console.log(`Total combinations to run: ${totalCombinations.toLocaleString()}`);
  console.log(`Deal: Trace 260303 65M | Equity: $${(DEAL_TOTAL_EQUITY / 1e6).toFixed(2)}M`);
  console.log('');

  // Pre-compute sizing for unique profiles (income × comp × filing × state × track)
  // That's 12 × 6 × 3 × 56 × 3 = 36,288 unique profiles
  type SizingKey = string;
  const sizingCache = new Map<SizingKey, SizingCacheEntry>();

  console.log('Phase 1: Pre-computing optimal sizing for unique profiles...');
  const sizingStart = performance.now();
  let sizingCount = 0;

  for (const income of INCOMES) {
    for (const comp of COMPOSITIONS) {
      for (const filing of FILING_STATUSES) {
        for (const state of STATES) {
          for (const track of TRACKS) {
            // Use reference investment ($500K) for sizing profile
            const profile = buildProfile(income, comp, filing, state, track, 500_000);
            const key = `${income}_${comp.label}_${filing}_${state}_${track.label}`;

            try {
              const sizing = computeOptimalSizing(
                DEAL_BENEFIT_STREAM_DOLLARS,
                profile,
                DEAL_TOTAL_EQUITY,
                { samplePoints: 40 }
              );

              // Fix 1: Find the efficiency frontier — highest commitment where
              // effectiveMultiple is still >= 90% of peak. This gives the "sweet spot"
              // where investors get maximum absolute savings without wasting capital
              // on low-return marginal dollars.
              const peakMultiple = Math.max(...sizing.utilizationCurve.map(p => p.effectiveMultiple));
              const efficiencyThreshold = peakMultiple * 0.90;
              let bestEffIdx = 0;
              let bestEffMultiple = peakMultiple;
              // Walk from largest to smallest commitment; first one above threshold is optimal
              for (let i = sizing.utilizationCurve.length - 1; i >= 0; i--) {
                const pt = sizing.utilizationCurve[i];
                if (pt.effectiveMultiple >= efficiencyThreshold) {
                  bestEffIdx = i;
                  bestEffMultiple = pt.effectiveMultiple;
                  break;
                }
              }

              sizingCache.set(key, {
                optimalCommitment: sizing.utilizationCurve[bestEffIdx]?.commitmentAmount ?? 0,
                optimalUtilCommitment: sizing.optimalCommitment,
                constraintBinding: sizing.constraintBinding,
                utilizationCurve: sizing.utilizationCurve,
                peakEfficiency: bestEffMultiple,
              });
            } catch {
              sizingCache.set(key, {
                optimalCommitment: 0,
                optimalUtilCommitment: 0,
                constraintBinding: 'Error',
                utilizationCurve: [],
                peakEfficiency: 0,
              });
            }
            sizingCount++;
          }
        }
      }
    }
  }
  const sizingElapsed = (performance.now() - sizingStart) / 1000;
  console.log(`  ${sizingCount.toLocaleString()} sizing profiles computed in ${sizingElapsed.toFixed(1)}s`);
  console.log('');

  // Phase 2: Main sweep
  console.log('Phase 2: Running tax utilization sweep...');
  const sweepStart = performance.now();
  let processed = 0;
  let errors = 0;
  let batchBuffer: string[] = [];
  const BATCH_SIZE = 10_000;

  // Summary accumulators
  const archetypeCounts: Record<string, number> = {};
  const constraintCounts: Record<string, number> = {};
  let highUtilCount = 0; // >95%
  let lowUtilCount = 0;  // <50%
  const optimalByIncome: Record<number, { sum: number; count: number }> = {};
  const rothRateByIncome: Record<number, { sum: number; count: number }> = {};

  for (const income of INCOMES) {
    for (const comp of COMPOSITIONS) {
      for (const filing of FILING_STATUSES) {
        for (const state of STATES) {
          for (const track of TRACKS) {
            for (const invest of INVESTMENTS) {
              if (!isValidCombination(track, comp, income, invest)) continue;

              const rothList = isRothEligible(track) ? ROTH_CONVERSIONS : [0];
              const profile = buildProfile(income, comp, filing, state, track, invest);
              const sizingKey = `${income}_${comp.label}_${filing}_${state}_${track.label}`;
              const sizing = sizingCache.get(sizingKey) ?? null;

              // Scale stream for this investment
              const ownership = invest / DEAL_TOTAL_EQUITY;
              const scaledStream = scaleBenefitStream(DEAL_BENEFIT_STREAM, ownership);

              // Base run (no Roth)
              let baseResult: TaxUtilizationResult | null = null;

              for (const rothConversion of rothList) {
                try {
                  let currentProfile = profile;
                  if (rothConversion > 0) {
                    // Roth adds ordinary income for Years 1-10
                    // We approximate by adding annual Roth to ordinary income
                    currentProfile = {
                      ...profile,
                      annualOrdinaryIncome: profile.annualOrdinaryIncome + rothConversion,
                    };
                  }

                  const result = calculateTaxUtilization(scaledStream, currentProfile);

                  if (rothConversion === 0) {
                    baseResult = result;
                  }

                  // Fit classification
                  const avgBenefits = result.annualUtilization.length > 0
                    ? result.annualUtilization.reduce((s, yr) => s + yr.totalBenefitGenerated, 0) / result.annualUtilization.length
                    : 0;
                  let fitResult: { archetype: string; fitScore: number } | null = null;
                  try {
                    const fit = classifyInvestorFit(result, currentProfile, avgBenefits);
                    fitResult = { archetype: fit.archetype, fitScore: fit.fitScore };
                  } catch {
                    fitResult = { archetype: '?', fitScore: 0 };
                  }

                  // Build row
                  let row = extractMetrics(
                    result, currentProfile, invest, rothConversion, income,
                    rothConversion > 0 ? baseResult : null,
                    sizing, fitResult
                  );
                  // Patch in composition label (field index 1)
                  const parts = row.split(',');
                  parts[1] = comp.label;
                  row = parts.join(',');

                  batchBuffer.push(row);

                  // Accumulate summary stats
                  if (fitResult) {
                    archetypeCounts[fitResult.archetype] = (archetypeCounts[fitResult.archetype] || 0) + 1;
                  }
                  if (sizing) {
                    const c = sizing.constraintBinding;
                    constraintCounts[c] = (constraintCounts[c] || 0) + 1;
                  }
                  if (result.overallUtilizationRate > 0.95) highUtilCount++;
                  if (result.overallUtilizationRate < 0.50) lowUtilCount++;

                  if (!optimalByIncome[income]) optimalByIncome[income] = { sum: 0, count: 0 };
                  if (sizing && sizing.optimalCommitment > 0) {
                    optimalByIncome[income].sum += sizing.optimalCommitment;
                    optimalByIncome[income].count++;
                  }

                  if (rothConversion > 0 && baseResult) {
                    if (!rothRateByIncome[income]) rothRateByIncome[income] = { sum: 0, count: 0 };
                    const rothTotalConvertedLocal = rothConversion * 10;
                    const isNP = currentProfile.investorTrack === 'rep' && currentProfile.groupingElection;
                    const bNetTax = computeNetTaxPerYear(baseResult.computedFederalTax, baseResult, isNP);
                    const rNetTax = computeNetTaxPerYear(result.computedFederalTax, result, isNP);
                    let netDelta = 0;
                    const ROTH_YRS = 10;
                    for (let ri = 0; ri < Math.min(ROTH_YRS, result.annualUtilization.length); ri++) {
                      netDelta += rNetTax[ri] - bNetTax[ri];
                    }
                    const effRate = rothTotalConvertedLocal > 0 ? netDelta / rothTotalConvertedLocal : 0;
                    rothRateByIncome[income].sum += effRate;
                    rothRateByIncome[income].count++;
                  }
                } catch {
                  errors++;
                }

                processed++;

                // Flush batch
                if (batchBuffer.length >= BATCH_SIZE) {
                  fs.appendFileSync(csvPath, batchBuffer.join('\n') + '\n');
                  batchBuffer = [];
                }

                // Progress
                if (processed % 100_000 === 0) {
                  const elapsed = (performance.now() - sweepStart) / 1000;
                  const rate = processed / elapsed;
                  const eta = (totalCombinations - processed) / rate;
                  const pct = ((processed / totalCombinations) * 100).toFixed(1);
                  console.log(
                    `[${processed.toLocaleString().padStart(11)} / ${totalCombinations.toLocaleString()}] ` +
                    `${pct.padStart(5)}%  elapsed: ${elapsed.toFixed(1)}s  rate: ${(rate / 1000).toFixed(0)}K/s  ETA: ${eta.toFixed(0)}s`
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  // Flush remaining
  if (batchBuffer.length > 0) {
    fs.appendFileSync(csvPath, batchBuffer.join('\n') + '\n');
  }

  const sweepElapsed = (performance.now() - sweepStart) / 1000;
  const totalElapsed = sizingElapsed + sweepElapsed;

  console.log('');
  console.log('='.repeat(60));
  console.log('SWEEP COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total rows:    ${processed.toLocaleString()}`);
  console.log(`Errors:        ${errors}`);
  console.log(`Sweep time:    ${sweepElapsed.toFixed(1)}s`);
  console.log(`Total time:    ${totalElapsed.toFixed(1)}s`);
  console.log(`Rate:          ${(processed / sweepElapsed / 1000).toFixed(0)}K/s`);
  console.log(`Output:        ${csvPath}`);

  // =========================================================================
  // Summary report
  // =========================================================================
  const summary: string[] = [];
  summary.push('='.repeat(60));
  summary.push('TAX EFFICIENCY MAPPING — SUMMARY REPORT');
  summary.push(`Deal: Trace 260303 65M | Equity: $${(DEAL_TOTAL_EQUITY / 1e6).toFixed(2)}M`);
  summary.push(`Date: ${new Date().toISOString()}`);
  summary.push('='.repeat(60));
  summary.push('');

  summary.push(`1. Total combinations tested: ${processed.toLocaleString()}`);
  summary.push(`   Errors: ${errors}`);
  summary.push(`   Runtime: ${totalElapsed.toFixed(1)}s (sizing: ${sizingElapsed.toFixed(1)}s, sweep: ${sweepElapsed.toFixed(1)}s)`);
  summary.push('');

  summary.push('2. Archetype distribution:');
  const totalRows = processed;
  for (const [arch, count] of Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])) {
    summary.push(`   ${arch}: ${count.toLocaleString()} (${((count / totalRows) * 100).toFixed(1)}%)`);
  }
  summary.push('');

  summary.push('3. Binding constraint distribution:');
  for (const [c, count] of Object.entries(constraintCounts).sort((a, b) => b[1] - a[1])) {
    summary.push(`   ${c}: ${count.toLocaleString()} (${((count / totalRows) * 100).toFixed(1)}%)`);
  }
  summary.push('');

  summary.push(`4. High utilization (>95%): ${highUtilCount.toLocaleString()} (${((highUtilCount / totalRows) * 100).toFixed(1)}%)`);
  summary.push(`5. Low utilization (<50%):  ${lowUtilCount.toLocaleString()} (${((lowUtilCount / totalRows) * 100).toFixed(1)}%)`);
  summary.push('');

  summary.push('6. Average optimal investment by income level:');
  for (const income of INCOMES) {
    const data = optimalByIncome[income];
    if (data && data.count > 0) {
      const avg = data.sum / data.count;
      summary.push(`   $${(income / 1000).toFixed(0)}K income → $${(avg / 1000).toFixed(0)}K optimal`);
    }
  }
  summary.push('');

  summary.push('7. Average effective Roth conversion rate by income level:');
  for (const income of INCOMES) {
    const data = rothRateByIncome[income];
    if (data && data.count > 0) {
      const avg = data.sum / data.count;
      summary.push(`   $${(income / 1000).toFixed(0)}K income → ${(avg * 100).toFixed(1)}% effective rate`);
    }
  }
  summary.push('');

  // State ranking — reference: $1M income / $500K invest / REP grouped / MFJ
  summary.push('8. Top 10 states by utilization (REP grouped, $1M income, $500K invest, MFJ):');
  const stateUtils: Array<{ state: string; rate: number }> = [];
  for (const state of STATES) {
    const refProfile = buildProfile(1_000_000, COMPOSITIONS[0], 'MFJ', state, TRACKS[0], 500_000);
    const refOwnership = 500_000 / DEAL_TOTAL_EQUITY;
    const refStream = scaleBenefitStream(DEAL_BENEFIT_STREAM, refOwnership);
    try {
      const refResult = calculateTaxUtilization(refStream, refProfile);
      stateUtils.push({ state, rate: refResult.overallUtilizationRate });
    } catch {
      stateUtils.push({ state, rate: 0 });
    }
  }
  stateUtils.sort((a, b) => b.rate - a.rate);
  for (const s of stateUtils.slice(0, 10)) {
    summary.push(`   ${s.state}: ${(s.rate * 100).toFixed(1)}%`);
  }
  summary.push('');

  summary.push('9. Bottom 10 states by utilization (same reference):');
  for (const s of stateUtils.slice(-10).reverse()) {
    summary.push(`   ${s.state}: ${(s.rate * 100).toFixed(1)}%`);
  }
  summary.push('');

  fs.writeFileSync(summaryPath, summary.join('\n') + '\n');
  console.log(`Summary:       ${summaryPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
