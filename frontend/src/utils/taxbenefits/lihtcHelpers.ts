/**
 * LIHTC Helper Functions
 *
 * Shared utilities for LIHTC credit calculations used across:
 * - HDCComprehensiveReport.tsx (PDF export)
 * - InvestorAnalysisCalculator.tsx (portal - future integration)
 *
 * @version 1.0.0
 * @date 2025-12-30
 */

import type { CalculationParams } from '../../types/taxbenefits';

/**
 * Calculate remaining LIHTC credits beyond the hold period.
 *
 * LIHTC credits typically span 10-11 years. If the investor exits before
 * all credits are received, the remaining credits represent "catch-up"
 * value that should be included in total returns.
 *
 * @param params - Calculation parameters containing LIHTC credit arrays
 * @param holdPeriod - Optional override for hold period (defaults to params.holdPeriod)
 * @returns Total remaining LIHTC credits (federal + state) beyond hold period
 *
 * @example
 * // 10-year hold with 11 years of credits
 * const remaining = calculateRemainingLIHTC(params);
 * // Returns Year 11 credits that would be received after exit
 */
export const calculateRemainingLIHTC = (
  params: Pick<CalculationParams, 'holdPeriod' | 'federalLIHTCCredits' | 'stateLIHTCIntegration'> | null,
  holdPeriodOverride?: number
): number => {
  if (!params) return 0;

  const holdPeriod = holdPeriodOverride ?? params.holdPeriod ?? 10;
  let remainingFederal = 0;
  let remainingState = 0;

  // Calculate remaining federal LIHTC credits
  if (params.federalLIHTCCredits && params.federalLIHTCCredits.length > holdPeriod) {
    for (let i = holdPeriod; i < params.federalLIHTCCredits.length; i++) {
      remainingFederal += params.federalLIHTCCredits[i] || 0;
    }
  }

  // Calculate remaining state LIHTC credits (only for direct_use path)
  if (
    params.stateLIHTCIntegration?.creditPath === 'direct_use' &&
    params.stateLIHTCIntegration.yearlyCredits &&
    params.stateLIHTCIntegration.yearlyCredits.length > holdPeriod
  ) {
    for (let i = holdPeriod; i < params.stateLIHTCIntegration.yearlyCredits.length; i++) {
      remainingState += params.stateLIHTCIntegration.yearlyCredits[i] || 0;
    }
  }

  return remainingFederal + remainingState;
};

/**
 * Calculate total LIHTC credits received during hold period.
 *
 * @param params - Calculation parameters containing LIHTC credit arrays
 * @param holdPeriod - Optional override for hold period
 * @returns Total LIHTC credits received during hold period
 */
export const calculateReceivedLIHTC = (
  params: Pick<CalculationParams, 'holdPeriod' | 'federalLIHTCCredits' | 'stateLIHTCIntegration'> | null,
  holdPeriodOverride?: number
): number => {
  if (!params) return 0;

  const holdPeriod = holdPeriodOverride ?? params.holdPeriod ?? 10;
  let receivedFederal = 0;
  let receivedState = 0;

  // Calculate federal LIHTC credits received during hold period
  if (params.federalLIHTCCredits) {
    for (let i = 0; i < Math.min(holdPeriod, params.federalLIHTCCredits.length); i++) {
      receivedFederal += params.federalLIHTCCredits[i] || 0;
    }
  }

  // Calculate state LIHTC credits received (only for direct_use path)
  if (
    params.stateLIHTCIntegration?.creditPath === 'direct_use' &&
    params.stateLIHTCIntegration.yearlyCredits
  ) {
    for (let i = 0; i < Math.min(holdPeriod, params.stateLIHTCIntegration.yearlyCredits.length); i++) {
      receivedState += params.stateLIHTCIntegration.yearlyCredits[i] || 0;
    }
  }

  return receivedFederal + receivedState;
};
