/**
 * Tax Efficiency Map Calculation Engine (IMPL-123, Layer 1)
 *
 * Iterates income × investment × investor type to produce a typed result matrix
 * by calling calculateTaxUtilization() for each cell. Returns data only — no JSX.
 *
 * Uses the same pipeline as fundSizingOptimizer:
 *   poolStream (dollars) → scale by proRata → scaleBenefitStreamToMillions → calculateTaxUtilization
 */

import { useMemo } from 'react';
import type { BenefitStream, InvestorProfile, TaxUtilizationResult } from '../../utils/taxbenefits/investorTaxUtilization';
import { calculateTaxUtilization } from '../../utils/taxbenefits/investorTaxUtilization';
import { scaleStreamByProRata } from '../../utils/taxbenefits/fundSizingOptimizer';
import { scaleBenefitStreamToMillions } from '../../utils/taxbenefits/poolAggregation';
import { getStateTaxRate } from '../../utils/taxbenefits/stateProfiles';

// =============================================================================
// Constants
// =============================================================================

/** 12 income levels matching batch runner */
export const INCOME_LEVELS = [
  250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000,
  3_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000,
] as const;

/** 10 investment levels matching batch runner */
export const INVESTMENT_LEVELS = [
  100_000, 200_000, 500_000, 750_000, 1_000_000,
  1_500_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
] as const;

/** 3 investor types */
export type InvestorType = 'rep_grouped' | 'non_rep_passive' | 'w2_only';

export const INVESTOR_TYPES: InvestorType[] = ['rep_grouped', 'non_rep_passive', 'w2_only'];

// =============================================================================
// Output Types
// =============================================================================

export interface CellResult {
  income: number;
  investment: number;
  investorType: InvestorType;
  totalTaxSavings: number;       // in dollars
  utilizationRate: number;       // 0–1
  taxSavingsPerDollar: number;   // totalTaxSavings / investment
  moic: number;                  // (totalTaxSavings + exitProceeds + ozBenefits) / investment
  bindingConstraint: string;
  isOptimal: boolean;            // peak taxSavingsPerDollar for this income/type
  isBelowFundCeiling: boolean;   // investment ≤ fundEquity × concentrationLimit
}

export interface TaxEfficiencyMapResult {
  cells: CellResult[];
  byType: Record<InvestorType, CellResult[]>;
  incomeLevels: readonly number[];
  investmentLevels: readonly number[];
  fundCeiling: number;           // per-investor ceiling in dollars
}

// =============================================================================
// Hook Parameters
// =============================================================================

export interface TaxEfficiencyMapParams {
  /** Pool-level BenefitStream in DOLLARS (from aggregatePoolToBenefitStream) */
  benefitStream: BenefitStream | null;
  /** Total fund equity in DOLLARS */
  fundEquity: number;
  /** Max fraction of fund per investor (default 0.20) */
  concentrationLimit?: number;
  /** Filing status (default MFJ) */
  defaultFilingStatus?: 'MFJ' | 'Single' | 'HoH';
  /** Investor state code (default 'WA') */
  defaultState?: string;
}

// =============================================================================
// Core Computation (exported for direct testing)
// =============================================================================

/**
 * Build an InvestorProfile for a heatmap cell.
 * Mirrors the batch runner's buildProfile() logic exactly:
 * - federalOrdinaryRate: 0 → let engine compute from brackets
 * - federalCapGainsRate: 23.8 (20% + 3.8% NIIT)
 * - stateRates from getStateTaxRate (percentage form, e.g., 10.9)
 */
function buildCellProfile(
  income: number,
  investment: number,
  investorType: InvestorType,
  filingStatus: 'MFJ' | 'Single' | 'HoH',
  state: string,
): InvestorProfile {
  const stateRate = getStateTaxRate(state);

  switch (investorType) {
    case 'rep_grouped':
      return {
        annualOrdinaryIncome: income,
        annualPassiveIncome: 0,
        annualPortfolioIncome: 0,
        investorTrack: 'rep',
        groupingElection: true,
        filingStatus,
        investorState: state,
        investorEquity: investment,
        federalOrdinaryRate: 0,
        federalCapGainsRate: 23.8,
        stateOrdinaryRate: stateRate,
        stateCapGainsRate: stateRate,
      };
    case 'non_rep_passive':
      return {
        annualOrdinaryIncome: 0,
        annualPassiveIncome: income,
        annualPortfolioIncome: 0,
        investorTrack: 'non-rep',
        groupingElection: false,
        filingStatus,
        investorState: state,
        investorEquity: investment,
        federalOrdinaryRate: 0,
        federalCapGainsRate: 23.8,
        stateOrdinaryRate: stateRate,
        stateCapGainsRate: stateRate,
      };
    case 'w2_only':
      return {
        annualOrdinaryIncome: income,
        annualPassiveIncome: 0,
        annualPortfolioIncome: 0,
        investorTrack: 'non-rep',
        groupingElection: false,
        filingStatus,
        investorState: state,
        investorEquity: investment,
        federalOrdinaryRate: 0,
        federalCapGainsRate: 23.8,
        stateOrdinaryRate: stateRate,
        stateCapGainsRate: stateRate,
      };
  }
}

// IMPL-127: extractExitValues removed — recaptureExposure is a tax liability, not exit proceeds.
// Tax Efficiency Map shows tax-benefit MOIC only. Full MOIC including exit equity
// proceeds is shown on the main deal analysis screen (Investor_Returns sheet).

/**
 * Determine binding constraint label from the TaxUtilizationResult.
 */
function deriveConstraint(result: TaxUtilizationResult, investorType: InvestorType): string {
  if (investorType === 'w2_only') {
    if (result.totalDepreciationSavings === 0 && result.totalLIHTCUsed === 0) {
      return '§469(a) No Passive Income';
    }
  }

  const util = result.overallUtilizationRate;
  if (util >= 0.98) return 'None — full utilization achievable';

  // Check which channel is more constrained
  const annuals = result.annualUtilization;
  const totalDepGen = annuals.reduce((s, yr) => s + yr.depreciationGenerated, 0);
  const totalDepAllow = annuals.reduce((s, yr) => s + yr.depreciationAllowed, 0);
  const totalCredGen = annuals.reduce((s, yr) => s + yr.lihtcGenerated, 0);
  const totalCredUsed = result.totalLIHTCUsed;

  const depUtil = totalDepGen > 0 ? totalDepAllow / totalDepGen : 1;
  const credUtil = totalCredGen > 0 ? totalCredUsed / totalCredGen : 1;

  if (result.treatment === 'passive') {
    if (depUtil < credUtil) return '§469 Passive Loss Limitation';
    return '§38(c) General Business Credit Floor';
  }

  // Nonpassive
  if (depUtil < credUtil) {
    const lastYear = annuals[annuals.length - 1];
    if (lastYear && lastYear.nolPool > 0) return '§461(l) + NOL carryforward';
    return '§461(l) Excess Business Loss';
  }
  return '§38(c) General Business Credit Ceiling';
}

/**
 * Compute all 360 cells of the efficiency map.
 * Exported for direct testing without React hooks.
 */
export function computeEfficiencyMap(
  poolBenefitStreamDollars: BenefitStream,
  fundEquityDollars: number,
  concentrationLimit: number,
  filingStatus: 'MFJ' | 'Single' | 'HoH',
  state: string,
): TaxEfficiencyMapResult {
  const fundCeiling = fundEquityDollars * concentrationLimit;
  const allCells: CellResult[] = [];

  for (const investorType of INVESTOR_TYPES) {
    for (const income of INCOME_LEVELS) {
      for (const investment of INVESTMENT_LEVELS) {
        // Scale pool stream to investor's pro-rata share
        const proRataShare = investment / fundEquityDollars;
        const scaledDollars = scaleStreamByProRata(poolBenefitStreamDollars, proRataShare);
        const scaledMillions = scaleBenefitStreamToMillions(scaledDollars);

        // Build investor profile
        const profile = buildCellProfile(income, investment, investorType, filingStatus, state);

        // Run engine
        const result = calculateTaxUtilization(scaledMillions, profile);

        // Extract metrics (engine returns values in millions)
        const totalTaxSavingsM = result.totalDepreciationSavings + result.totalLIHTCUsed;
        const totalTaxSavings = totalTaxSavingsM * 1_000_000;
        const taxSavingsPerDollar = investment > 0 ? totalTaxSavings / investment : 0;

        // IMPL-127: Tax-benefit-only MOIC — (investment + tax savings) / investment
        // Exit equity proceeds are excluded — recaptureExposure is a liability, not a return.
        // Full MOIC including exit proceeds is shown on the main deal analysis screen.
        const moic = investment > 0
          ? (investment + totalTaxSavings) / investment
          : 0;

        allCells.push({
          income,
          investment,
          investorType,
          totalTaxSavings,
          utilizationRate: result.overallUtilizationRate,
          taxSavingsPerDollar,
          moic,
          bindingConstraint: deriveConstraint(result, investorType),
          isOptimal: false, // Set below
          isBelowFundCeiling: investment <= fundCeiling,
        });
      }
    }
  }

  // Mark ★OPT: per income row + investor type, find peak taxSavingsPerDollar
  const byType: Record<InvestorType, CellResult[]> = {
    rep_grouped: [],
    non_rep_passive: [],
    w2_only: [],
  };

  for (const cell of allCells) {
    byType[cell.investorType].push(cell);
  }

  for (const type of INVESTOR_TYPES) {
    const typeCells = byType[type];
    for (const income of INCOME_LEVELS) {
      const rowCells = typeCells.filter(c => c.income === income);
      if (rowCells.length === 0) continue;

      let bestIdx = 0;
      let bestSpd = -Infinity;
      for (let i = 0; i < rowCells.length; i++) {
        if (rowCells[i].taxSavingsPerDollar > bestSpd) {
          bestSpd = rowCells[i].taxSavingsPerDollar;
          bestIdx = i;
        }
      }
      rowCells[bestIdx].isOptimal = true;
    }
  }

  return {
    cells: allCells,
    byType,
    incomeLevels: INCOME_LEVELS,
    investmentLevels: INVESTMENT_LEVELS,
    fundCeiling,
  };
}

// =============================================================================
// React Hook
// =============================================================================

export function useTaxEfficiencyMap(params: TaxEfficiencyMapParams): TaxEfficiencyMapResult | null {
  const {
    benefitStream,
    fundEquity,
    concentrationLimit = 0.20,
    defaultFilingStatus = 'MFJ',
    defaultState = 'WA',
  } = params;

  return useMemo(() => {
    if (!benefitStream || fundEquity <= 0) return null;

    return computeEfficiencyMap(
      benefitStream,
      fundEquity,
      concentrationLimit,
      defaultFilingStatus,
      defaultState,
    );
  }, [benefitStream, fundEquity, concentrationLimit, defaultFilingStatus, defaultState]);
}
