/**
 * Investor Sizing Engine (IMPL-103)
 *
 * Per-investor sizing optimizer that finds the optimal commitment amount
 * maximizing annual utilization percentage. Different from the fund-level
 * optimizer (IMPL-085) which maximizes savings-per-dollar.
 *
 * Pure functions only — no state, no side effects, no API calls.
 *
 * Per Phase B3 Specification v2.0 §4.3.
 */

import type { BenefitStream, InvestorProfile, TaxUtilizationResult } from './investorTaxUtilization';
import { calculateTaxUtilization, SECTION_461L_LIMITS } from './investorTaxUtilization';
import { scaleStreamByProRata } from './fundSizingOptimizer';
import { scaleBenefitStreamToMillions } from './poolAggregation';
import { classifyInvestorFit } from './investorFit';
import type { InvestorFitResult } from './investorFit';

// =============================================================================
// Types
// =============================================================================

export interface SizingPoint {
  commitmentAmount: number;
  annualUtilizationPct: number;
  creditUtilizationPct: number;
  depreciationUtilizationPct: number;
  effectiveMultiple: number;
}

export type PeakType = 'peak' | 'plateau' | 'rising';

export interface SizingResult {
  optimalCommitment: number;
  optimalUtilizationPct: number;
  minimumEffective: number;     // lowest commitment with >80% utilization
  maximumEffective: number;     // highest commitment before util drops below 80%
  utilizationCurve: SizingPoint[];
  constraintBinding: string;
  peakType: PeakType;           // IMPL-120: curve shape at optimal point
  // IMPL-145: §461(l)-aware REP sizing — commitment where Year 1 depreciation ≈ EBL threshold
  sec461lOptimalCommitment?: number;
  sec461lUtilizationPct?: number;
}

export interface InvestorSizingConfig {
  minCommitment?: number;
  maxCommitment?: number;
  samplePoints?: number;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Scale a BenefitStream by a pro-rata share.
 * Delegates to the existing scaleStreamByProRata from fundSizingOptimizer.
 */
export function scaleBenefitStream(stream: BenefitStream, proRataShare: number): BenefitStream {
  return scaleStreamByProRata(stream, proRataShare);
}

/**
 * Compute optimal investor sizing by sampling across commitment levels.
 *
 * Algorithm (B3 Spec v2.0 §4.3):
 * 1. Define search range: min = $100,000 (default), max = dealTotalEquity
 * 2. Sample 20 points across the range, evenly spaced
 * 3. For each point, compute pro-rata share, scale benefit stream, run utilization engine
 * 4. Find optimal: highest annualUtilizationPct
 * 5. Find effective range: all points where annualUtilizationPct >= 80
 * 6. Identify binding constraint
 *
 * @param poolBenefitStream - Consolidated BenefitStream in DOLLARS
 * @param profile - InvestorProfile
 * @param dealTotalEquity - Total deal/fund equity in DOLLARS
 * @param config - Optional configuration overrides
 */
export function computeOptimalSizing(
  poolBenefitStream: BenefitStream,
  profile: InvestorProfile,
  dealTotalEquity: number,
  config?: InvestorSizingConfig
): SizingResult {
  // Edge case: zero equity deal
  if (dealTotalEquity <= 0) {
    return {
      optimalCommitment: 0,
      optimalUtilizationPct: 0,
      minimumEffective: 0,
      maximumEffective: 0,
      utilizationCurve: [],
      constraintBinding: 'None — deal has no equity',
      peakType: 'plateau',
    };
  }

  const samplePoints = config?.samplePoints ?? 20;
  const minCommitment = config?.minCommitment ?? 100_000;
  const maxCommitment = Math.min(config?.maxCommitment ?? dealTotalEquity, dealTotalEquity);

  // Clamp range
  const effectiveMin = Math.min(minCommitment, maxCommitment);
  const stepSize = samplePoints > 1 ? (maxCommitment - effectiveMin) / (samplePoints - 1) : 0;

  const curve: SizingPoint[] = [];
  let bestEfficiency = -1;
  let bestIndex = 0;
  let bestUtilResult: TaxUtilizationResult | null = null;

  for (let i = 0; i < samplePoints; i++) {
    const commitment = effectiveMin + i * stepSize;
    const proRataShare = commitment / dealTotalEquity;

    // Scale pool stream by pro-rata share, then convert to millions
    const scaledStream = scaleStreamByProRata(poolBenefitStream, proRataShare);
    const millionStream = scaleBenefitStreamToMillions(scaledStream);

    // Run utilization engine
    const utilResult = calculateTaxUtilization(millionStream, profile);

    // Compute utilization percentages from annual data
    const annuals = utilResult.annualUtilization;
    let totalBenefitGen = 0;
    let totalBenefitUsed = 0;
    let totalCreditsGen = 0;
    let totalCreditsUsed = 0;
    let totalDeprGen = 0;
    let totalDeprAllowed = 0;

    for (const yr of annuals) {
      totalBenefitGen += yr.totalBenefitGenerated;
      totalBenefitUsed += yr.totalBenefitUsable;
      totalCreditsGen += yr.lihtcGenerated;
      totalCreditsUsed += yr.lihtcUsable;
      totalDeprGen += yr.depreciationGenerated;
      totalDeprAllowed += yr.depreciationAllowed;
    }

    const annualUtilizationPct = totalBenefitGen > 0 ? (totalBenefitUsed / totalBenefitGen) * 100 : 0;
    const creditUtilizationPct = totalCreditsGen > 0 ? (totalCreditsUsed / totalCreditsGen) * 100 : 0;
    const depreciationUtilizationPct = totalDeprGen > 0 ? (totalDeprAllowed / totalDeprGen) * 100 : 0;

    // Effective multiple: total benefit usable / commitment (converted from millions)
    const totalValueDollars = utilResult.totalBenefitUsable * 1_000_000;
    const effectiveMultiple = commitment > 0 ? totalValueDollars / commitment : 0;

    const point: SizingPoint = {
      commitmentAmount: commitment,
      annualUtilizationPct,
      creditUtilizationPct,
      depreciationUtilizationPct,
      effectiveMultiple,
    };
    curve.push(point);

    // IMPL-120: Select by peak effectiveMultiple (taxSavingsPerDollar), not utilization %
    if (effectiveMultiple > bestEfficiency) {
      bestEfficiency = effectiveMultiple;
      bestIndex = i;
      bestUtilResult = utilResult;
    }
  }

  // Find effective range: points where utilization >= 80%
  const effectivePoints = curve.filter(p => p.annualUtilizationPct >= 80);
  const minimumEffective = effectivePoints.length > 0
    ? effectivePoints[0].commitmentAmount
    : curve[bestIndex]?.commitmentAmount ?? 0;
  const maximumEffective = effectivePoints.length > 0
    ? effectivePoints[effectivePoints.length - 1].commitmentAmount
    : curve[bestIndex]?.commitmentAmount ?? 0;

  // IMPL-120: Determine peak type from efficiency curve shape
  const peakType = determinePeakType(curve, bestIndex);

  // IMPL-120: For plateau/rising curves, use highest commitment in the plateau
  let optimalIndex = bestIndex;
  if (peakType === 'plateau' || peakType === 'rising') {
    // Walk from the end of the curve back to find the highest commitment
    // still within 90% of peak efficiency
    const peakEfficiency = curve[bestIndex]?.effectiveMultiple ?? 0;
    const threshold = peakEfficiency * 0.90;
    for (let i = curve.length - 1; i >= bestIndex; i--) {
      if (curve[i].effectiveMultiple >= threshold) {
        optimalIndex = i;
        break;
      }
    }
  }

  // Recompute utilization result at the actual optimal index if it changed
  if (optimalIndex !== bestIndex && bestUtilResult) {
    const commitment = curve[optimalIndex].commitmentAmount;
    const proRataShare = commitment / dealTotalEquity;
    const scaledStream = scaleStreamByProRata(poolBenefitStream, proRataShare);
    const millionStream = scaleBenefitStreamToMillions(scaledStream);
    bestUtilResult = calculateTaxUtilization(millionStream, profile);
  }

  // Identify binding constraint
  const constraintBinding = bestUtilResult
    ? identifyBindingConstraint(profile, bestUtilResult)
    : 'None — full utilization achievable';

  // IMPL-145: §461(l)-aware REP sizing target
  // For REP+grouped investors, find the commitment where Year 1 depreciation
  // lands at the §461(l) threshold — the point where the investor maximizes
  // current-year deductions without generating excess business loss / NOL.
  const isNonpassive = profile.investorTrack === 'rep' && profile.groupingElection;
  let sec461lOptimalCommitment: number | undefined;
  let sec461lUtilizationPct: number | undefined;

  if (isNonpassive) {
    const threshold = SECTION_461L_LIMITS[profile.filingStatus] / 1_000_000; // in millions
    sec461lOptimalCommitment = findSec461lTargetCommitment(
      poolBenefitStream, profile, dealTotalEquity, threshold, effectiveMin, maxCommitment
    );
    if (sec461lOptimalCommitment !== undefined) {
      // Compute utilization at the §461(l) target
      const proRata = sec461lOptimalCommitment / dealTotalEquity;
      const scaled = scaleStreamByProRata(poolBenefitStream, proRata);
      const millioned = scaleBenefitStreamToMillions(scaled);
      const utilAtTarget = calculateTaxUtilization(millioned, profile);
      const totGen = utilAtTarget.annualUtilization.reduce((s, yr) => s + yr.totalBenefitGenerated, 0);
      const totUsed = utilAtTarget.annualUtilization.reduce((s, yr) => s + yr.totalBenefitUsable, 0);
      sec461lUtilizationPct = totGen > 0 ? (totUsed / totGen) * 100 : 0;
    }
  }

  return {
    optimalCommitment: curve[optimalIndex]?.commitmentAmount ?? 0,
    optimalUtilizationPct: curve[optimalIndex]?.annualUtilizationPct ?? 0,
    minimumEffective,
    maximumEffective,
    utilizationCurve: curve,
    constraintBinding,
    peakType,
    sec461lOptimalCommitment,
    sec461lUtilizationPct,
  };
}

/**
 * IMPL-120: Determine curve shape at the peak efficiency point.
 *
 * - 'peak': efficiency rises then declines by >5% from best
 * - 'plateau': efficiency stays within 5% of best across most of curve
 * - 'rising': efficiency still climbing at the end (best at/near end)
 */
export function determinePeakType(curve: SizingPoint[], bestIndex: number): PeakType {
  if (curve.length === 0) return 'peak';

  const bestEff = curve[bestIndex].effectiveMultiple;
  if (bestEff <= 0) return 'peak';

  const lastEff = curve[curve.length - 1].effectiveMultiple;
  const declineFromPeak = (bestEff - lastEff) / bestEff;
  const isAtEnd = bestIndex >= curve.length - 3;

  if (declineFromPeak > 0.05) return 'peak';
  if (isAtEnd && lastEff > curve[0].effectiveMultiple * 1.05) return 'rising';
  return 'plateau';
}

/**
 * IMPL-145: Find the commitment level where Year 1 depreciation lands at the §461(l) threshold.
 *
 * Uses binary search across the commitment range. Year 1 depreciation is monotonically
 * increasing with commitment, so binary search converges quickly.
 *
 * Returns undefined if Year 1 depreciation never reaches the threshold (pool too small)
 * or if even the minimum commitment exceeds the threshold.
 */
function findSec461lTargetCommitment(
  poolBenefitStream: BenefitStream,
  profile: InvestorProfile,
  dealTotalEquity: number,
  thresholdInMillions: number,
  minCommitment: number,
  maxCommitment: number,
): number | undefined {
  // Helper: compute Year 1 depreciation at a given commitment
  const year1DeprAt = (commitment: number): number => {
    const proRata = commitment / dealTotalEquity;
    const scaled = scaleStreamByProRata(poolBenefitStream, proRata);
    const millioned = scaleBenefitStreamToMillions(scaled);
    const util = calculateTaxUtilization(millioned, profile);
    return util.annualUtilization[0]?.depreciationGenerated ?? 0;
  };

  // Check bounds: if max commitment still below threshold, no target exists
  const deprAtMax = year1DeprAt(maxCommitment);
  if (deprAtMax < thresholdInMillions) return undefined;

  // If min commitment already exceeds threshold, target is at/below min
  const deprAtMin = year1DeprAt(minCommitment);
  if (deprAtMin >= thresholdInMillions) return minCommitment;

  // Binary search for the commitment where Year 1 depr ≈ threshold
  let lo = minCommitment;
  let hi = maxCommitment;
  const tolerance = 10_000; // $10K precision

  for (let iter = 0; iter < 30 && (hi - lo) > tolerance; iter++) {
    const mid = (lo + hi) / 2;
    const deprAtMid = year1DeprAt(mid);
    if (deprAtMid < thresholdInMillions) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Return the midpoint rounded to nearest $1K
  return Math.round((lo + hi) / 2 / 1000) * 1000;
}

/**
 * Identify the binding tax constraint for an investor at their current commitment.
 *
 * Per B3 Spec v2.0 §4.4.
 */
export function identifyBindingConstraint(
  profile: InvestorProfile,
  utilization: TaxUtilizationResult
): string {
  const isREP = profile.investorTrack === 'rep';
  const annuals = utilization.annualUtilization;

  // Check for EBL excess (NOL generation = §461(l) binding)
  const totalNolGenerated = annuals.reduce((s, yr) => s + yr.nolGenerated, 0);
  const totalDeprGenerated = annuals.reduce((s, yr) => s + yr.depreciationGenerated, 0);
  const eblExcessRate = totalDeprGenerated > 0 ? totalNolGenerated / totalDeprGenerated : 0;

  if (isREP && eblExcessRate > 0) {
    return '§461(l) Excess Business Loss';
  }

  if (!isREP && profile.annualPassiveIncome <= 0) {
    return '§469(a) No Passive Income';
  }

  // Check credit suspension rate
  const totalCreditsGen = annuals.reduce((s, yr) => s + yr.lihtcGenerated, 0);
  const totalCreditsUsed = annuals.reduce((s, yr) => s + yr.lihtcUsable, 0);
  const creditSuspensionRate = totalCreditsGen > 0 ? 1 - totalCreditsUsed / totalCreditsGen : 0;

  if (!isREP && creditSuspensionRate > 0.5) {
    return '§469(a)(2) Passive Income Capacity';
  }

  // Check for credit carry (§38(c) floor)
  const totalCreditsCarried = annuals.reduce((s, yr) => s + yr.lihtcCarried, 0);
  if (totalCreditsCarried > 0) {
    return '§38(c) General Business Credit Floor';
  }

  return 'None — full utilization achievable';
}
