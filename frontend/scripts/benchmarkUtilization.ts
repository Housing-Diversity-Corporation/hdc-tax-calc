/**
 * Benchmark: How fast is calculateTaxUtilization()?
 *
 * Runs 1,000 calls with varied investor profiles against a fixed BenefitStream.
 * Reports: min, max, mean, median, p95, p99, and total elapsed.
 *
 * Units: BenefitStream values are in MILLIONS, InvestorProfile income/equity in DOLLARS.
 */

import { calculateTaxUtilization } from '../src/utils/taxbenefits/investorTaxUtilization';
import type { BenefitStream, InvestorProfile, ExitEvent } from '../src/utils/taxbenefits/investorTaxUtilization';

// Build a realistic BenefitStream from Trace 4001 parameters
// Partnership level, in millions
const traceBenefitStream: BenefitStream = {
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
  syndicationOffset: 0
};

// Generate 1,000 varied investor profiles
const incomes = [250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000];
const compositions = [
  { ordinary: 1.0, passive: 0, portfolio: 0 },
  { ordinary: 0, passive: 1.0, portfolio: 0 },
  { ordinary: 0.75, passive: 0.25, portfolio: 0 },
  { ordinary: 0.5, passive: 0.5, portfolio: 0 },
  { ordinary: 0.25, passive: 0.75, portfolio: 0 },
  { ordinary: 0.33, passive: 0.33, portfolio: 0.34 },
];
const tracks: Array<'rep_grouped' | 'rep_ungrouped' | 'non_rep'> = ['rep_grouped', 'rep_ungrouped', 'non_rep'];
const filings: Array<'MFJ' | 'Single'> = ['MFJ', 'Single'];
const investments = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

function buildProfile(
  income: number,
  comp: typeof compositions[0],
  track: string,
  filing: 'MFJ' | 'Single',
  invest: number
): InvestorProfile {
  return {
    annualOrdinaryIncome: income * comp.ordinary,
    annualPassiveIncome: income * comp.passive,
    annualPortfolioIncome: income * comp.portfolio,
    investorTrack: track.startsWith('rep') ? 'rep' : 'non-rep',
    groupingElection: track === 'rep_grouped',
    filingStatus: filing,
    investorState: 'WA',
    investorEquity: invest,
    federalOrdinaryRate: 0,       // Let engine compute from brackets
    federalCapGainsRate: 23.8,    // 20% + 3.8% NIIT
    stateOrdinaryRate: 0,         // WA has no income tax
    stateCapGainsRate: 7.0,       // WA LTCG tax
  };
}

// Generate profiles (cycle through combinations to reach 1,000)
const profiles: InvestorProfile[] = [];
let idx = 0;
while (profiles.length < 1000) {
  const inc = incomes[idx % incomes.length];
  const comp = compositions[Math.floor(idx / incomes.length) % compositions.length];
  const track = tracks[Math.floor(idx / (incomes.length * compositions.length)) % tracks.length];
  const filing = filings[Math.floor(idx / (incomes.length * compositions.length * tracks.length)) % filings.length];
  const invest = investments[Math.floor(idx / (incomes.length * compositions.length * tracks.length * filings.length)) % investments.length];
  profiles.push(buildProfile(inc, comp, track, filing, invest));
  idx++;
}

// Scale BenefitStream to investor's ownership percentage
function scaleBenefitStream(stream: BenefitStream, ownership: number): BenefitStream {
  return {
    annualDepreciation: stream.annualDepreciation.map(d => d * ownership),
    annualLIHTC: stream.annualLIHTC.map(c => c * ownership),
    annualStateLIHTC: stream.annualStateLIHTC.map(c => c * ownership),
    annualOperatingCF: stream.annualOperatingCF.map(c => c * ownership),
    exitEvents: stream.exitEvents.map(e => ({
      ...e,
      exitProceeds: e.exitProceeds * ownership,
      cumulativeDepreciation: e.cumulativeDepreciation * ownership,
      recaptureExposure: e.recaptureExposure * ownership,
      appreciationGain: e.appreciationGain * ownership,
      sec1245Recapture: (e.sec1245Recapture || 0) * ownership,
      sec1250Recapture: (e.sec1250Recapture || 0) * ownership,
    })),
    grossEquity: stream.grossEquity * ownership,
    netEquity: stream.netEquity * ownership,
    syndicationOffset: stream.syndicationOffset * ownership,
  };
}

// Run benchmark
console.log('Starting benchmark: 1,000 calculateTaxUtilization() calls');
console.log(`Profile variety: ${incomes.length} incomes × ${compositions.length} comps × ${tracks.length} tracks × ${filings.length} filings × ${investments.length} investments`);
console.log('');

const times: number[] = [];
let errors = 0;
const errorMessages: string[] = [];

for (let i = 0; i < profiles.length; i++) {
  const profile = profiles[i];

  // Ownership = investorEquity (dollars) / grossEquity (millions → dollars)
  const ownership = profile.investorEquity / (traceBenefitStream.grossEquity * 1_000_000);
  const scaledStream = scaleBenefitStream(traceBenefitStream, ownership);

  const start = performance.now();
  try {
    calculateTaxUtilization(scaledStream, profile);
  } catch (e: any) {
    errors++;
    if (errorMessages.length < 5) {
      errorMessages.push(`Profile ${i}: ${e.message}`);
    }
  }
  const elapsed = performance.now() - start;
  times.push(elapsed);
}

// Stats
times.sort((a, b) => a - b);
const sum = times.reduce((s, t) => s + t, 0);
const mean = sum / times.length;
const median = times[Math.floor(times.length / 2)];
const p95 = times[Math.floor(times.length * 0.95)];
const p99 = times[Math.floor(times.length * 0.99)];
const min = times[0];
const max = times[times.length - 1];

console.log('='.repeat(60));
console.log('BENCHMARK RESULTS: calculateTaxUtilization()');
console.log('='.repeat(60));
console.log(`Calls:    ${times.length}`);
console.log(`Errors:   ${errors}`);
if (errorMessages.length > 0) {
  console.log('First errors:');
  errorMessages.forEach(m => console.log(`  ${m}`));
}
console.log(`Total:    ${sum.toFixed(1)}ms`);
console.log('');
console.log(`Min:      ${min.toFixed(3)}ms`);
console.log(`Mean:     ${mean.toFixed(3)}ms`);
console.log(`Median:   ${median.toFixed(3)}ms`);
console.log(`P95:      ${p95.toFixed(3)}ms`);
console.log(`P99:      ${p99.toFixed(3)}ms`);
console.log(`Max:      ${max.toFixed(3)}ms`);
console.log('');

// Projections
const combos = [3_100_000, 6_200_000, 7_400_000];
const labels = ['3.1M (base + Roth)', '6.2M (+ OZ toggle)', '7.4M (+ accelerated Roth)'];
console.log('RUNTIME PROJECTIONS (single-threaded):');
for (let i = 0; i < combos.length; i++) {
  const secs = (combos[i] * mean) / 1000;
  const mins = secs / 60;
  const hrs = mins / 60;
  if (hrs >= 1) {
    console.log(`  ${labels[i]}: ${hrs.toFixed(1)} hours (at mean ${mean.toFixed(3)}ms/call)`);
  } else {
    console.log(`  ${labels[i]}: ${mins.toFixed(1)} minutes (at mean ${mean.toFixed(3)}ms/call)`);
  }
}

console.log('');
console.log('RUNTIME PROJECTIONS (4 worker threads):');
for (let i = 0; i < combos.length; i++) {
  const secs = (combos[i] * mean) / 1000 / 4;
  const mins = secs / 60;
  const hrs = mins / 60;
  if (hrs >= 1) {
    console.log(`  ${labels[i]}: ${hrs.toFixed(1)} hours`);
  } else {
    console.log(`  ${labels[i]}: ${mins.toFixed(1)} minutes`);
  }
}

console.log('');
console.log('RUNTIME PROJECTIONS (8 worker threads):');
for (let i = 0; i < combos.length; i++) {
  const secs = (combos[i] * mean) / 1000 / 8;
  const mins = secs / 60;
  const hrs = mins / 60;
  if (hrs >= 1) {
    console.log(`  ${labels[i]}: ${hrs.toFixed(1)} hours`);
  } else {
    console.log(`  ${labels[i]}: ${mins.toFixed(1)} minutes`);
  }
}
