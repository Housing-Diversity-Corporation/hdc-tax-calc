/**
 * Investor Fit Classification Engine (IMPL-102)
 *
 * Classifies investors into archetypes A–E based on their tax profile
 * and the deal's benefit stream. Produces fit scores, warnings, and
 * utilization-adjusted metrics.
 *
 * Pure functions only — no state, no side effects, no API calls.
 *
 * Per Investor Archetype & Utilization Spec v1.0 and Phase B3 Specification v2.0.
 */

import type {
  InvestorProfile,
  TaxUtilizationResult,
  AnnualUtilization,
} from './investorTaxUtilization';
import { SECTION_461L_LIMITS } from './investorTaxUtilization';

// =============================================================================
// Types
// =============================================================================

export type Archetype = 'A' | 'B' | 'C' | 'D' | 'E';

export type FitRating = 'excellent' | 'very_good' | 'good' | 'moderate' | 'poor_annual';

export type BenefitTimingProfile = 'front_loaded' | 'steady' | 'back_loaded';

export interface FitWarning {
  severity: 'high' | 'medium' | 'low';
  code: string;
  message: string;
  statutoryRef: string;
}

export interface InvestorFitResult {
  archetype: Archetype;
  archetypeLabel: string;
  fitRating: FitRating;
  fitScore: number;
  annualUtilizationPct: number;
  annualCreditUtilizationPct: number;
  annualDepreciationUtilizationPct: number;
  cumulativeSuspendedLosses: number;
  cumulativeSuspendedCredits: number;
  dispositionReleaseEstimate: number;
  benefitTimingProfile: BenefitTimingProfile;
  warnings: FitWarning[];
  effectiveMultiple: number;
  utilizationAdjustedIRR: number;
}

// =============================================================================
// Constants
// =============================================================================

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  A: 'REP with Rental Portfolio',
  B: 'High-Income REP',
  C: 'Passive Income Investor',
  D: 'Limited Passive Income',
  E: 'W-2 Only (Disposition Release)',
};

const FIT_RATINGS: Record<Archetype, FitRating> = {
  A: 'excellent',
  B: 'very_good',
  C: 'good',
  D: 'moderate',
  E: 'poor_annual',
};

const BASE_SCORES: Record<Archetype, number> = {
  A: 90,
  B: 80,
  C: 70,
  D: 40,
  E: 10,
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Classify investor into archetype A–E based on tax profile and deal metrics.
 *
 * Decision tree (Archetype Spec v1.0 §2.2):
 *   REP + (ord + pass) < §461(l) threshold → A
 *   REP + (ord + pass) ≥ §461(l) threshold → B
 *   Non-REP + passive ≥ avgAnnualBenefits → C
 *   Non-REP + passive > 0 but < avgAnnualBenefits → D
 *   Non-REP + passive = 0 → E
 */
export function classifyArchetype(
  profile: InvestorProfile,
  averageAnnualBenefitsGenerated: number
): Archetype {
  const isREP = profile.investorTrack === 'rep';

  if (isREP) {
    const eblThreshold = SECTION_461L_LIMITS[profile.filingStatus];
    const totalIncome = profile.annualOrdinaryIncome + profile.annualPassiveIncome;
    return totalIncome < eblThreshold ? 'A' : 'B';
  }

  // Non-REP path
  if (profile.annualPassiveIncome <= 0) return 'E';
  if (profile.annualPassiveIncome >= averageAnnualBenefitsGenerated) return 'C';
  return 'D';
}

/**
 * Calculate fit score 0–100 from archetype and utilization percentages.
 *
 * base score + up to 10 bonus points for high annual utilization.
 */
export function calculateFitScore(
  archetype: Archetype,
  annualUtilizationPct: number,
  _creditUtilizationPct: number
): number {
  const base = BASE_SCORES[archetype];
  const utilizationBonus = (annualUtilizationPct / 100) * 10;
  return Math.min(100, Math.round(base + utilizationBonus));
}

/**
 * Generate fit warnings based on archetype, utilization metrics, and profile.
 *
 * Per Archetype Spec v1.0 §3.3.
 */
export function generateFitWarnings(
  archetype: Archetype,
  _utilization: TaxUtilizationResult,
  profile: InvestorProfile,
  creditSuspensionRate: number,
  eblExcessRate: number
): FitWarning[] {
  const warnings: FitWarning[] = [];

  // Archetype E: all benefits suspended
  if (archetype === 'E') {
    warnings.push({
      severity: 'high',
      code: 'ARCHETYPE_E_ALL_SUSPENDED',
      message:
        'Your income composition indicates all annual tax benefits would be suspended. Benefits release at disposition. See full hold-period analysis.',
      statutoryRef: '§469(a)',
    });
  }

  // Non-REP with $0 passive income
  if (profile.investorTrack !== 'rep' && profile.annualPassiveIncome <= 0) {
    warnings.push({
      severity: 'high',
      code: 'NO_PASSIVE_INCOME',
      message:
        'As a non-REP investor with no passive income, depreciation and LIHTC credits cannot offset your W-2/active income annually. All benefits suspend until disposition.',
      statutoryRef: '§469(a)(1)',
    });
  }

  // Archetype D + high credit suspension
  if (archetype === 'D' && creditSuspensionRate > 0.60) {
    warnings.push({
      severity: 'medium',
      code: 'HIGH_CREDIT_SUSPENSION',
      message: `Approximately ${Math.round(creditSuspensionRate * 100)}% of annual LIHTC credits would be suspended due to limited passive income.`,
      statutoryRef: '§469(a)(2)',
    });
  }

  // Archetype B + significant EBL excess
  if (archetype === 'B' && eblExcessRate > 0.30) {
    warnings.push({
      severity: 'low',
      code: 'EBL_EXCESS_SIGNIFICANT',
      message: `Approximately ${Math.round(eblExcessRate * 100)}% of annual depreciation converts to NOL carryforward under §461(l).`,
      statutoryRef: '§461(l)',
    });
  }

  return warnings;
}

// =============================================================================
// Utilization Metric Derivation
// =============================================================================

/**
 * Compute average annual utilization metrics from year-by-year data.
 */
function computeUtilizationMetrics(annualUtil: AnnualUtilization[]): {
  annualUtilizationPct: number;
  annualCreditUtilizationPct: number;
  annualDepreciationUtilizationPct: number;
  creditSuspensionRate: number;
  eblExcessRate: number;
} {
  if (annualUtil.length === 0) {
    return {
      annualUtilizationPct: 0,
      annualCreditUtilizationPct: 0,
      annualDepreciationUtilizationPct: 0,
      creditSuspensionRate: 0,
      eblExcessRate: 0,
    };
  }

  let totalBenefitGen = 0;
  let totalBenefitUsed = 0;
  let totalCreditsGen = 0;
  let totalCreditsUsed = 0;
  let totalDeprGen = 0;
  let totalDeprAllowed = 0;
  let totalNolGenerated = 0;

  for (const yr of annualUtil) {
    totalBenefitGen += yr.totalBenefitGenerated;
    totalBenefitUsed += yr.totalBenefitUsable;
    totalCreditsGen += yr.lihtcGenerated;
    totalCreditsUsed += yr.lihtcUsable;
    totalDeprGen += yr.depreciationGenerated;
    totalDeprAllowed += yr.depreciationAllowed;
    totalNolGenerated += yr.nolGenerated;
  }

  const annualUtilizationPct =
    totalBenefitGen > 0 ? (totalBenefitUsed / totalBenefitGen) * 100 : 0;
  const annualCreditUtilizationPct =
    totalCreditsGen > 0 ? (totalCreditsUsed / totalCreditsGen) * 100 : 0;
  const annualDepreciationUtilizationPct =
    totalDeprGen > 0 ? (totalDeprAllowed / totalDeprGen) * 100 : 0;

  // Credit suspension rate: fraction of credits NOT utilized
  const creditSuspensionRate =
    totalCreditsGen > 0 ? 1 - totalCreditsUsed / totalCreditsGen : 0;

  // EBL excess rate: fraction of depreciation that converts to NOL
  const eblExcessRate =
    totalDeprGen > 0 ? totalNolGenerated / totalDeprGen : 0;

  return {
    annualUtilizationPct,
    annualCreditUtilizationPct,
    annualDepreciationUtilizationPct,
    creditSuspensionRate,
    eblExcessRate,
  };
}

/**
 * Determine benefit timing profile from annual utilization data.
 */
function determineBenefitTimingProfile(
  annualUtil: AnnualUtilization[],
  dispositionReleaseEstimate: number,
  totalBenefitGenerated: number
): BenefitTimingProfile {
  if (annualUtil.length === 0) return 'steady';

  // Check if >70% of total benefits come in Years 1-3
  const years1to3 = annualUtil.slice(0, 3);
  const earlyBenefits = years1to3.reduce((sum, yr) => sum + yr.totalBenefitGenerated, 0);

  if (totalBenefitGenerated > 0 && earlyBenefits / totalBenefitGenerated > 0.70) {
    return 'front_loaded';
  }

  // Check if disposition release is >50% of total utilized economic value
  // Use usable (annual) + disposition as total economic value, not generated
  const totalUsable = annualUtil.reduce((sum, yr) => sum + yr.totalBenefitUsable, 0);
  const totalEconomicValue = totalUsable + dispositionReleaseEstimate;
  if (totalEconomicValue > 0 && dispositionReleaseEstimate / totalEconomicValue >= 0.50) {
    return 'back_loaded';
  }

  return 'steady';
}

// =============================================================================
// Orchestrator
// =============================================================================

/**
 * Master orchestrator: classifies archetype, computes fit score, generates warnings,
 * and assembles the complete InvestorFitResult.
 *
 * @param utilization - TaxUtilizationResult from the utilization engine
 * @param profile - InvestorProfile
 * @param averageAnnualBenefits - Average annual benefits generated (deal-specific, pre-computed)
 */
export function classifyInvestorFit(
  utilization: TaxUtilizationResult,
  profile: InvestorProfile,
  averageAnnualBenefits: number
): InvestorFitResult {
  const metrics = computeUtilizationMetrics(utilization.annualUtilization);

  const archetype = classifyArchetype(profile, averageAnnualBenefits);
  const fitScore = calculateFitScore(archetype, metrics.annualUtilizationPct, metrics.annualCreditUtilizationPct);
  const warnings = generateFitWarnings(
    archetype,
    utilization,
    profile,
    metrics.creditSuspensionRate,
    metrics.eblExcessRate
  );

  // Cumulative suspended amounts from last year of utilization
  const lastYear =
    utilization.annualUtilization.length > 0
      ? utilization.annualUtilization[utilization.annualUtilization.length - 1]
      : null;

  const cumulativeSuspendedLosses = lastYear?.cumulativeSuspendedLoss ?? 0;
  const cumulativeSuspendedCredits = lastYear?.cumulativeSuspendedCredits ?? 0;

  // Disposition release estimate: suspended losses × marginal rate + suspended credits
  const marginalRate = utilization.computedMarginalRate > 0
    ? utilization.computedMarginalRate
    : profile.federalOrdinaryRate / 100;
  const dispositionReleaseEstimate =
    cumulativeSuspendedLosses * marginalRate + cumulativeSuspendedCredits;

  // Benefit timing
  const benefitTimingProfile = determineBenefitTimingProfile(
    utilization.annualUtilization,
    dispositionReleaseEstimate,
    utilization.totalBenefitGenerated
  );

  // Effective multiple: total benefit usable / investment
  const investment = profile.investorEquity > 0 ? profile.investorEquity : 1;
  const totalValue = utilization.totalBenefitUsable + dispositionReleaseEstimate;
  const effectiveMultiple = totalValue / investment;

  // Utilization-adjusted IRR approximation:
  // Simple annualized return using overall utilization and hold period
  const holdPeriod = utilization.annualUtilization.length || 1;
  const utilizationAdjustedIRR =
    holdPeriod > 0
      ? (Math.pow(1 + totalValue / investment, 1 / holdPeriod) - 1) * 100
      : 0;

  return {
    archetype,
    archetypeLabel: ARCHETYPE_LABELS[archetype],
    fitRating: FIT_RATINGS[archetype],
    fitScore,
    annualUtilizationPct: metrics.annualUtilizationPct,
    annualCreditUtilizationPct: metrics.annualCreditUtilizationPct,
    annualDepreciationUtilizationPct: metrics.annualDepreciationUtilizationPct,
    cumulativeSuspendedLosses,
    cumulativeSuspendedCredits,
    dispositionReleaseEstimate,
    benefitTimingProfile,
    warnings,
    effectiveMultiple,
    utilizationAdjustedIRR,
  };
}
