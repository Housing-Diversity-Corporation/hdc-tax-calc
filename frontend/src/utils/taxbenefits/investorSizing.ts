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
import { calculateTaxUtilization } from './investorTaxUtilization';
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

export interface SizingResult {
  optimalCommitment: number;
  optimalUtilizationPct: number;
  minimumEffective: number;     // lowest commitment with >80% utilization
  maximumEffective: number;     // highest commitment before util drops below 80%
  utilizationCurve: SizingPoint[];
  constraintBinding: string;
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
    };
  }

  const samplePoints = config?.samplePoints ?? 20;
  const minCommitment = config?.minCommitment ?? 100_000;
  const maxCommitment = Math.min(config?.maxCommitment ?? dealTotalEquity, dealTotalEquity);

  // Clamp range
  const effectiveMin = Math.min(minCommitment, maxCommitment);
  const stepSize = samplePoints > 1 ? (maxCommitment - effectiveMin) / (samplePoints - 1) : 0;

  const curve: SizingPoint[] = [];
  let bestUtilization = -1;
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

    if (annualUtilizationPct > bestUtilization) {
      bestUtilization = annualUtilizationPct;
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

  // Identify binding constraint
  const constraintBinding = bestUtilResult
    ? identifyBindingConstraint(profile, bestUtilResult)
    : 'None — full utilization achievable';

  return {
    optimalCommitment: curve[bestIndex]?.commitmentAmount ?? 0,
    optimalUtilizationPct: bestUtilization,
    minimumEffective,
    maximumEffective,
    utilizationCurve: curve,
    constraintBinding,
  };
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
