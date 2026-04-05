/**
 * Pool Aggregation Engine (IMPL-085)
 *
 * Consolidates N DealBenefitProfiles into a single calendar-year-aligned
 * BenefitStream for the tax utilization engine. Each deal's schedules are
 * offset by its fundYear to produce a unified fund-level view.
 *
 * Per Tax Benefits Spec v5.3 §2.4, §7: depreciation and LIHTC schedules are
 * staggered by fund entry year. Exit events remain separate (one per deal).
 *
 * Output is in DOLLARS (consistent with dealToBenefitStream). Use
 * scaleBenefitStreamToMillions() before passing to calculateTaxUtilization().
 */

import type { DealBenefitProfile } from '../../types/dealBenefitProfile';
import type { InvestorTaxInfo } from '../../types/investorTaxInfo';
import type { BenefitStream, ExitEvent, InvestorProfile } from './investorTaxUtilization';
import { mapFilingStatus } from './investorTaxUtilization';

// =============================================================================
// Types
// =============================================================================

export interface PoolAggregationConfig {
  /** Override the pool start year (default: min of all deal fundYears) */
  poolStartYear?: number;
}

export interface PoolAggregationMeta {
  poolStartYear: number;
  poolEndYear: number;
  consolidatedHorizon: number;
  dealCount: number;
  totalGrossEquity: number;
  totalNetEquity: number;
  dealSummaries: Array<{
    dealName: string;
    fundYear: number;
    calendarOffset: number;
    holdPeriod: number;
    grossEquity: number;
  }>;
}

export interface PoolAggregationResult {
  benefitStream: BenefitStream;
  meta: PoolAggregationMeta;
}

// =============================================================================
// Pool Aggregation
// =============================================================================

/**
 * Aggregate N DealBenefitProfiles into a single consolidated BenefitStream
 * with calendar-year alignment based on each deal's fundYear.
 *
 * @param deals - Array of DealBenefitProfiles from the pool
 * @param config - Optional configuration overrides
 * @returns Consolidated BenefitStream (in DOLLARS) and aggregation metadata
 */
export function aggregatePoolToBenefitStream(
  deals: DealBenefitProfile[],
  config?: PoolAggregationConfig
): PoolAggregationResult {
  if (deals.length === 0) {
    return {
      benefitStream: {
        annualDepreciation: [],
        annualLIHTC: [],
        annualStateLIHTC: [],
        annualOperatingCF: [],
        exitEvents: [],
        grossEquity: 0,
        netEquity: 0,
        syndicationOffset: 0,
      },
      meta: {
        poolStartYear: 0,
        poolEndYear: 0,
        consolidatedHorizon: 0,
        dealCount: 0,
        totalGrossEquity: 0,
        totalNetEquity: 0,
        dealSummaries: [],
      },
    };
  }

  // Step 1: Determine calendar grid
  const poolStartYear = config?.poolStartYear ?? Math.min(...deals.map(d => d.fundYear));
  const poolEndYear = Math.max(...deals.map(d => d.fundYear + d.holdPeriod));
  const horizon = poolEndYear - poolStartYear;

  // Step 2: Initialize consolidated arrays
  const consolidatedDepreciation = new Array(horizon).fill(0);
  const consolidatedLIHTC = new Array(horizon).fill(0);
  const consolidatedStateLIHTC = new Array(horizon).fill(0);
  const consolidatedOperatingCF = new Array(horizon).fill(0);
  const exitEvents: ExitEvent[] = [];
  let totalGrossEquity = 0;
  let totalNetEquity = 0;
  let totalSyndicationOffset = 0;
  const dealSummaries: PoolAggregationMeta['dealSummaries'] = [];

  // IMPL-148: DBP stores all dollar values in millions (engine convention).
  // Convert to dollars here so the BenefitStream contract ("in DOLLARS") is honored
  // and all downstream consumers (optimizer, utilization engine) receive correct units.
  const M = 1_000_000;

  // Step 3: For each deal, offset schedules by calendar position
  for (const deal of deals) {
    const offset = deal.fundYear - poolStartYear;

    // Sum schedules into consolidated arrays (DBP values in millions → dollars)
    for (let i = 0; i < deal.depreciationSchedule.length; i++) {
      const calendarIndex = offset + i;
      if (calendarIndex < horizon) {
        consolidatedDepreciation[calendarIndex] += (deal.depreciationSchedule[i] || 0) * M;
        consolidatedLIHTC[calendarIndex] += (deal.lihtcSchedule[i] || 0) * M;
        consolidatedStateLIHTC[calendarIndex] += (deal.stateLihtcSchedule[i] || 0) * M;
        consolidatedOperatingCF[calendarIndex] += (deal.operatingCashFlow[i] || 0) * M;
      }
    }

    // Step 4: Exit events stay separate, offset by calendar position
    exitEvents.push({
      year: offset + deal.holdPeriod,
      dealId: deal.dealName || `deal-${deal.id || 'unknown'}`,
      exitProceeds: deal.exitProceeds * M,
      cumulativeDepreciation: deal.cumulativeDepreciation * M,
      recaptureExposure: deal.recaptureExposure * M,
      appreciationGain: deal.projectedAppreciation * M,
      ozEnabled: deal.ozEnabled,
    });

    totalGrossEquity += deal.grossEquity * M;
    totalNetEquity += deal.netEquity * M;
    totalSyndicationOffset += deal.syndicationProceeds * M;

    dealSummaries.push({
      dealName: deal.dealName,
      fundYear: deal.fundYear,
      calendarOffset: offset,
      holdPeriod: deal.holdPeriod,
      grossEquity: deal.grossEquity * M,
    });
  }

  // Step 5: Sort exit events chronologically (§469(g) release depends on order)
  exitEvents.sort((a, b) => a.year - b.year);

  return {
    benefitStream: {
      annualDepreciation: consolidatedDepreciation,
      annualLIHTC: consolidatedLIHTC,
      annualStateLIHTC: consolidatedStateLIHTC,
      annualOperatingCF: consolidatedOperatingCF,
      exitEvents,
      grossEquity: totalGrossEquity,
      netEquity: totalNetEquity,
      syndicationOffset: totalSyndicationOffset,
    },
    meta: {
      poolStartYear,
      poolEndYear,
      consolidatedHorizon: horizon,
      dealCount: deals.length,
      totalGrossEquity,
      totalNetEquity,
      dealSummaries,
    },
  };
}

// =============================================================================
// Scaling Helpers
// =============================================================================

const SCALE_FACTOR = 1_000_000;

/**
 * Scale a BenefitStream from dollars to millions for calculateTaxUtilization().
 */
export function scaleBenefitStreamToMillions(stream: BenefitStream): BenefitStream {
  return {
    annualDepreciation: stream.annualDepreciation.map(v => v / SCALE_FACTOR),
    annualLIHTC: stream.annualLIHTC.map(v => v / SCALE_FACTOR),
    annualStateLIHTC: stream.annualStateLIHTC.map(v => v / SCALE_FACTOR),
    annualOperatingCF: stream.annualOperatingCF.map(v => v / SCALE_FACTOR),
    exitEvents: stream.exitEvents.map(e => ({
      ...e,
      exitProceeds: e.exitProceeds / SCALE_FACTOR,
      cumulativeDepreciation: e.cumulativeDepreciation / SCALE_FACTOR,
      recaptureExposure: e.recaptureExposure / SCALE_FACTOR,
      appreciationGain: e.appreciationGain / SCALE_FACTOR,
    })),
    grossEquity: stream.grossEquity / SCALE_FACTOR,
    netEquity: stream.netEquity / SCALE_FACTOR,
    syndicationOffset: stream.syndicationOffset / SCALE_FACTOR,
  };
}

// =============================================================================
// Investor Profile Builder
// =============================================================================

/**
 * Convert a portal-side InvestorTaxInfo into the engine's InvestorProfile.
 *
 * Handles missing fields with conservative defaults:
 * - Missing income fields → 0
 * - Missing investorTrack → 'non-rep' (conservative)
 * - Missing filingStatus → 'MFJ' (most common for target investors)
 */
export function buildInvestorProfileFromTaxInfo(
  taxInfo: InvestorTaxInfo,
  investorEquity: number = 0
): InvestorProfile {
  const federalCapGainsRate = ((taxInfo.federalCapitalGainsRate || 20) + (taxInfo.niitRate || 3.8)) / 100;

  return {
    annualPassiveIncome: taxInfo.annualPassiveIncome || 0,
    annualOrdinaryIncome: taxInfo.annualOrdinaryIncome || 0,
    annualPortfolioIncome: taxInfo.annualPortfolioIncome || 0,
    filingStatus: mapFilingStatus(taxInfo.filingStatus),
    investorTrack: taxInfo.investorTrack || 'non-rep',
    groupingElection: taxInfo.groupingElection || false,
    federalOrdinaryRate: taxInfo.federalOrdinaryRate || 37,
    federalCapGainsRate,
    investorState: taxInfo.selectedState || 'NY',
    stateOrdinaryRate: (taxInfo.stateOrdinaryRate || 10.9) / 100,
    stateCapGainsRate: (taxInfo.stateCapitalGainsRate || 10.9) / 100,
    investorEquity,
  };
}
