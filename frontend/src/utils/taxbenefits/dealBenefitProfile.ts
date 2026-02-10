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
 * Optional portal metadata from CalculatorConfiguration.
 * These fields live on CalculatorConfiguration, NOT CalculationParams.
 * Pass them when extracting from a saved config context.
 */
export interface PortalMetadata {
  configurationId?: number;
  dealDescription?: string;
  dealLocation?: string;
  units?: number;
  affordabilityMix?: string;
  minimumInvestment?: number;
  dealImageUrl?: string;
  projectStatus?: string;
}

/**
 * Extracts a DealBenefitProfile from calculator inputs and results.
 *
 * Pure function with no side effects. All inputs are read-only.
 *
 * @param inputs - CalculationParams from the calculator
 * @param results - InvestorAnalysisResults from the calculation
 * @param depreciationSchedule - Full depreciation schedule
 * @param cashFlows - Annual cash flow items
 * @param portalMetadata - Optional metadata from CalculatorConfiguration
 * @returns Complete DealBenefitProfile ready for persistence or pooling
 */
export function extractDealBenefitProfile(
  inputs: CalculationParams,
  results: InvestorAnalysisResults,
  depreciationSchedule: DepreciationSchedule,
  cashFlows: CashFlowItem[],
  portalMetadata?: PortalMetadata
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
  const recaptureExposure = cumulativeDepreciation * 0.25;

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

  return {
    // Identity
    configurationId: portalMetadata?.configurationId || 0,
    dealName: inputs.dealName || 'Unnamed Deal',
    propertyState: inputs.selectedState || 'WA',
    fundYear: inputs.fundEntryYear || currentYear,

    // Economics
    projectCost: inputs.projectCost || 0,
    grossEquity,
    netEquity,
    syndicationProceeds,

    // Schedules
    depreciationSchedule: depreciationArray,
    lihtcSchedule: lihtcArray,
    stateLihtcSchedule: stateLihtcArray,
    operatingCashFlow: operatingCFArray,

    // Exit
    holdPeriod: inputs.holdPeriod || 10,
    exitProceeds: results.exitProceeds || 0,
    cumulativeDepreciation,
    recaptureExposure,
    projectedAppreciation,
    capitalGainsTax,

    // OZ
    ozEnabled: inputs.ozEnabled || false,

    // Structure
    pisMonth: inputs.placedInServiceMonth || 1,
    pisYear: currentYear,
    seniorDebtPct: inputs.seniorDebtPct || 0,
    philDebtPct: inputs.philanthropicDebtPct || 0,
    equityPct: inputs.investorEquityPct || 5,
    stateLihtcPath: inputs.stateLIHTCIntegration?.creditPath || 'none',
    syndicationRate: inputs.stateLIHTCIntegration?.syndicationRate || 0,

    // Portal metadata
    dealDescription: portalMetadata?.dealDescription || '',
    dealLocation: portalMetadata?.dealLocation || '',
    numberOfUnits: portalMetadata?.units || 0,
    affordabilityMix: portalMetadata?.affordabilityMix || '',
    minimumInvestment: portalMetadata?.minimumInvestment || 0,
    projectImageUrl: portalMetadata?.dealImageUrl,
    projectStatus: portalMetadata?.projectStatus || 'available',

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
