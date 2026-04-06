/**
 * Deal Benefit Profile Utilities
 *
 * Pure functions for extracting deal benefit profiles from calculator results
 * and converting them back to BenefitStream format for tax utilization analysis.
 */

import type { DealBenefitProfile } from '../../types/dealBenefitProfile';
import type { CalculationParams, InvestorAnalysisResults, CashFlowItem } from '../../types/taxbenefits';
import type { DepreciationSchedule } from './depreciationSchedule';
import type { BenefitStream, ExitEvent } from './investorTaxUtilization';

/**
 * Extracts a DealBenefitProfile from calculator inputs and results.
 *
 * Pure function with no side effects. All inputs are read-only.
 * Portal metadata (dealDescription, dealLocation, etc.) lives on the
 * DealConduit, not the DBP — use the /view endpoint for source context.
 *
 * @param inputs - CalculationParams from the calculator
 * @param results - InvestorAnalysisResults from the calculation
 * @param depreciationSchedule - Full depreciation schedule
 * @param cashFlows - Annual cash flow items
 * @param dealConduitId - ID of the parent DealConduit (from saved configuration)
 * @returns Complete DealBenefitProfile ready for persistence or pooling
 */
export function extractDealBenefitProfile(
  inputs: CalculationParams,
  results: InvestorAnalysisResults,
  depreciationSchedule: DepreciationSchedule,
  cashFlows: CashFlowItem[],
  dealConduitId: number
): DealBenefitProfile {
  // Extract schedule arrays
  const depreciationArray = depreciationSchedule.schedule.map(yr => yr.totalDepreciation);
  const lihtcArray = cashFlows.map(cf => cf.federalLIHTCCredit || 0);
  const stateLihtcArray = cashFlows.map(cf => cf.stateLIHTCCredit || 0);
  const operatingCFArray = cashFlows.map(cf => cf.operatingCashFlow || 0);

  // Calculate derived values
  const grossEquity = results.totalInvestment || 0;
  const syndicationProceeds = results.stateLIHTCSyndicationProceeds || 0;
  const netEquity = grossEquity - (results.syndicatedEquityOffset || 0);
  const cumulativeDepreciation = depreciationSchedule.totalDepreciation || 0;
  // IMPL-095: Read recapture from exitTaxAnalysis (single source of truth) instead of independent 0.25 computation
  const recaptureExposure = results.exitTaxAnalysis
    ? results.exitTaxAnalysis.sec1245Recapture + results.exitTaxAnalysis.sec1250Recapture
    : cumulativeDepreciation * 0.25; // Fallback for backward compat when exitTaxAnalysis not available

  // Calculate projected appreciation and capital gains tax
  const projectedAppreciation =
    results.exitValue && results.adjustedBasis
      ? results.exitValue - results.adjustedBasis
      : 0;
  // Use ltCapitalGainsRate + niitRate for effective federal capital gains rate
  const ltCapGainsRate = (inputs.ltCapitalGainsRate || 20) / 100;
  const niitRate = (inputs.niitRate || 3.8) / 100;
  const federalCapGainsRate = ltCapGainsRate + niitRate;
  const capitalGainsTax = projectedAppreciation * federalCapGainsRate;

  // Current year fallback for pisYear (pisYear does NOT exist on CalculationParams)
  const currentYear = new Date().getFullYear();
  const fundYear = inputs.fundEntryYear || currentYear;
  const holdPeriod = results.holdPeriod || inputs.holdPeriod || 10;

  return {
    // Identity
    dealConduitId,
    dealName: inputs.dealName || 'Unnamed Deal',
    propertyState: inputs.selectedState || 'WA',
    fundYear,

    // Economics
    projectCost: inputs.projectCost || 0,
    grossEquity,
    netEquity,
    syndicationProceeds,

    // Depreciation basis
    costSegregationPercent: inputs.yearOneDepreciationPct || 0,
    depreciableBasis: depreciationSchedule.schedule.length > 0
      ? depreciationArray.reduce((sum, v) => sum + v, 0)
      : 0,

    // Schedules
    depreciationSchedule: depreciationArray,
    lihtcSchedule: lihtcArray,
    stateLihtcSchedule: stateLihtcArray,
    operatingCashFlow: operatingCFArray,

    // Exit
    holdPeriod,
    projectedExitYear: fundYear + holdPeriod,
    exitProceeds: results.exitProceeds || 0,
    cumulativeDepreciation,
    recaptureExposure,
    projectedAppreciation,
    capitalGainsTax,

    // OZ
    ozEnabled: inputs.ozEnabled || false,

    // Timeline config (IMPL-154 — for Timeline Audit Panel on Screen 2)
    investmentDate: inputs.investmentDate || null,
    constructionDelayMonths: inputs.constructionDelayMonths || 0,
    pisDateOverride: inputs.pisDateOverride || null,
    electDeferCreditPeriod: inputs.electDeferCreditPeriod || false,

    // Structure
    pisMonth: inputs.placedInServiceMonth || 1,
    pisYear: currentYear,
    seniorDebtPct: inputs.seniorDebtPct || 0,
    philDebtPct: inputs.philanthropicDebtPct || 0,
    equityPct: inputs.investorEquityPct || 5,
    stateLihtcPath: inputs.stateLIHTCIntegration?.creditPath || 'none',
    syndicationRate: inputs.stateLIHTCIntegration?.syndicationRate || 0,

    // Timestamps
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Converts a saved DealBenefitProfile back into BenefitStream format
 * for the tax utilization engine.
 *
 * @param dbp - DealBenefitProfile to convert
 * @returns BenefitStream ready for calculateTaxUtilization()
 */
export function dealToBenefitStream(dbp: DealBenefitProfile): BenefitStream {
  const exitEvent: ExitEvent = {
    year: dbp.holdPeriod,
    exitProceeds: dbp.exitProceeds,
    cumulativeDepreciation: dbp.cumulativeDepreciation,
    recaptureExposure: dbp.recaptureExposure,
    appreciationGain: dbp.projectedAppreciation,
    ozEnabled: dbp.ozEnabled,
  };

  return {
    annualDepreciation: dbp.depreciationSchedule,
    annualLIHTC: dbp.lihtcSchedule,
    annualStateLIHTC: dbp.stateLihtcSchedule,
    annualOperatingCF: dbp.operatingCashFlow,
    exitEvents: [exitEvent],
    grossEquity: dbp.grossEquity,
    netEquity: dbp.netEquity,
    syndicationOffset: dbp.syndicationProceeds,
  };
}
