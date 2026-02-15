/**
 * Fund Sizing Optimizer (IMPL-085)
 *
 * Given a pooled BenefitStream and an InvestorProfile, iterates across
 * commitment levels to find the optimal investment that maximizes tax
 * savings efficiency. The investor's pro-rata share of the fund scales
 * all benefit stream values linearly.
 *
 * Per Tax Benefits Spec v5.3 §8: the optimizer calls the existing
 * utilization engine — no new tax calculation logic.
 *
 * Handles three curve shapes:
 * - peak: savingsPerDollar rises then declines (benefits start suspending)
 * - plateau: savingsPerDollar stays flat (fully utilized across range)
 * - rising: savingsPerDollar still increasing at max (investor capacity exceeds fund)
 */

import type { BenefitStream, InvestorProfile, TaxUtilizationResult } from './investorTaxUtilization';
import { calculateTaxUtilization } from './investorTaxUtilization';
import { scaleBenefitStreamToMillions } from './poolAggregation';

// =============================================================================
// Types
// =============================================================================

export type PeakType = 'peak' | 'plateau' | 'rising';

export interface SizingDataPoint {
  commitment: number;
  proRataShare: number;
  totalTaxSavings: number;
  savingsPerDollar: number;
  utilizationRate: number;
  fitIndicator: 'green' | 'yellow' | 'red';
  suspendedLosses: number;
  suspendedCredits: number;
}

export interface FundSizingResult {
  optimalCommitment: number;
  optimalProRataShare: number;
  optimalTaxSavings: number;
  optimalSavingsPerDollar: number;
  optimalUtilizationRate: number;
  peakType: PeakType;
  efficiencyCurve: SizingDataPoint[];
  fullUtilizationResult: TaxUtilizationResult;
  capacityExhaustedAt: number | null;
  warningMessage: string | null;
}

export interface FundSizingConfig {
  minCommitment?: number;
  maxCommitment?: number;
  steps?: number;
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Scale a BenefitStream by a pro-rata share fraction.
 * All monetary values are multiplied by the share.
 */
export function scaleStreamByProRata(stream: BenefitStream, share: number): BenefitStream {
  return {
    annualDepreciation: stream.annualDepreciation.map(v => v * share),
    annualLIHTC: stream.annualLIHTC.map(v => v * share),
    annualStateLIHTC: stream.annualStateLIHTC.map(v => v * share),
    annualOperatingCF: stream.annualOperatingCF.map(v => v * share),
    exitEvents: stream.exitEvents.map(e => ({
      ...e,
      exitProceeds: e.exitProceeds * share,
      cumulativeDepreciation: e.cumulativeDepreciation * share,
      recaptureExposure: e.recaptureExposure * share,
      appreciationGain: e.appreciationGain * share,
    })),
    grossEquity: stream.grossEquity * share,
    netEquity: stream.netEquity * share,
    syndicationOffset: stream.syndicationOffset * share,
  };
}

/**
 * Find optimal commitment for an investor in a fund pool.
 *
 * Iterates across commitment levels, running calculateTaxUtilization()
 * at each level via the investor's pro-rata share of the fund. Finds
 * the commitment that maximizes savingsPerDollar (total tax savings /
 * commitment amount).
 *
 * @param poolBenefitStream - Consolidated BenefitStream in DOLLARS (from aggregatePoolToBenefitStream)
 * @param totalFundEquity - Total pool gross equity in DOLLARS
 * @param investorProfile - Investor tax profile
 * @param config - Optional: min/max commitment and step count
 * @returns Optimal commitment, efficiency curve, and full utilization result at optimal point
 */
export function optimizeFundCommitment(
  poolBenefitStream: BenefitStream,
  totalFundEquity: number,
  investorProfile: InvestorProfile,
  config?: FundSizingConfig
): FundSizingResult {
  const steps = config?.steps ?? 50;
  const minCommitment = config?.minCommitment ?? totalFundEquity * 0.01;
  const maxCommitment = config?.maxCommitment ?? totalFundEquity;
  const stepSize = (maxCommitment - minCommitment) / steps;

  const curve: SizingDataPoint[] = [];
  let bestSavingsPerDollar = -Infinity;
  let bestIndex = 0;
  let bestResult: TaxUtilizationResult | null = null;

  for (let i = 0; i <= steps; i++) {
    const commitment = minCommitment + i * stepSize;
    const proRataShare = commitment / totalFundEquity;

    // Scale pool stream by pro-rata share, then convert to millions
    const scaledStream = scaleStreamByProRata(poolBenefitStream, proRataShare);
    const millionStream = scaleBenefitStreamToMillions(scaledStream);

    // Run tax utilization engine
    const result = calculateTaxUtilization(millionStream, investorProfile);

    // Convert savings back to dollars for display
    // totalDepreciationSavings and totalLIHTCUsed are in millions
    const totalTaxSavings = (result.totalDepreciationSavings + result.totalLIHTCUsed) * 1_000_000;
    const savingsPerDollar = commitment > 0 ? totalTaxSavings / commitment : 0;

    // Extract end-of-hold suspended amounts
    const lastYear = result.annualUtilization.length > 0
      ? result.annualUtilization[result.annualUtilization.length - 1]
      : null;

    const point: SizingDataPoint = {
      commitment,
      proRataShare,
      totalTaxSavings,
      savingsPerDollar,
      utilizationRate: result.overallUtilizationRate,
      fitIndicator: result.fitIndicator,
      suspendedLosses: (lastYear?.cumulativeSuspendedLoss ?? 0) * 1_000_000,
      suspendedCredits: (lastYear?.cumulativeSuspendedCredits ?? 0) * 1_000_000,
    };
    curve.push(point);

    if (savingsPerDollar > bestSavingsPerDollar) {
      bestSavingsPerDollar = savingsPerDollar;
      bestIndex = i;
      bestResult = result;
    }
  }

  // Determine peak type by analyzing the curve shape
  const peakType = determinePeakType(curve, bestIndex);

  // For plateau/rising curves, recommend max commitment
  let optimalIndex = bestIndex;
  if (peakType === 'plateau' || peakType === 'rising') {
    optimalIndex = curve.length - 1;
    bestResult = null; // Need to recompute at max
  }

  // If we need to recompute at the optimal point (plateau/rising case)
  if (!bestResult) {
    const optimalCommitment = curve[optimalIndex].commitment;
    const proRataShare = optimalCommitment / totalFundEquity;
    const scaledStream = scaleStreamByProRata(poolBenefitStream, proRataShare);
    const millionStream = scaleBenefitStreamToMillions(scaledStream);
    bestResult = calculateTaxUtilization(millionStream, investorProfile);
  }

  const optimalPoint = curve[optimalIndex];

  // Find capacity exhaustion: first point where utilization drops below 50%
  const capacityExhaustedAt = curve.find(p => p.utilizationRate < 0.50)?.commitment ?? null;

  // Generate warning message
  let warningMessage: string | null = null;
  if (capacityExhaustedAt !== null && capacityExhaustedAt <= optimalPoint.commitment) {
    warningMessage = `Commitment exceeds tax capacity — benefits begin suspending significantly above $${formatCompact(capacityExhaustedAt)}.`;
  }

  return {
    optimalCommitment: optimalPoint.commitment,
    optimalProRataShare: optimalPoint.proRataShare,
    optimalTaxSavings: optimalPoint.totalTaxSavings,
    optimalSavingsPerDollar: optimalPoint.savingsPerDollar,
    optimalUtilizationRate: optimalPoint.utilizationRate,
    peakType,
    efficiencyCurve: curve,
    fullUtilizationResult: bestResult,
    capacityExhaustedAt,
    warningMessage,
  };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Determine curve shape: peak, plateau, or rising.
 *
 * - peak: savingsPerDollar declines >5% from best to final point
 * - plateau: savingsPerDollar stays within 5% of best across the curve
 * - rising: best point is at/near the end and savingsPerDollar is still climbing
 */
function determinePeakType(curve: SizingDataPoint[], bestIndex: number): PeakType {
  if (curve.length < 2) return 'plateau';

  const bestSpd = curve[bestIndex].savingsPerDollar;
  const lastSpd = curve[curve.length - 1].savingsPerDollar;
  const firstSpd = curve[0].savingsPerDollar;

  if (bestSpd === 0) return 'plateau';

  const declineFromPeak = (bestSpd - lastSpd) / bestSpd;
  const isAtEnd = bestIndex >= curve.length - 3; // Within last 3 points

  if (declineFromPeak > 0.05) {
    // Clear decline after peak
    return 'peak';
  }

  if (isAtEnd && lastSpd > firstSpd * 1.05) {
    // Still rising at the end
    return 'rising';
  }

  // Flat or nearly flat
  return 'plateau';
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
}
