/**
 * useInvestorFit Hook (IMPL-104)
 *
 * Memoized hook wrapping classifyInvestorFit().
 * No calculation logic — delegates entirely to the engine.
 */

import { useMemo } from 'react';
import type { TaxUtilizationResult, InvestorProfile } from '../utils/taxbenefits/investorTaxUtilization';
import type { InvestorFitResult } from '../utils/taxbenefits/investorFit';
import { classifyInvestorFit } from '../utils/taxbenefits/investorFit';

export function useInvestorFit(
  utilizationResult: TaxUtilizationResult | null,
  investorProfile: InvestorProfile | null,
  averageAnnualBenefits: number
): InvestorFitResult | null {
  return useMemo(() => {
    if (!utilizationResult || !investorProfile) return null;
    return classifyInvestorFit(utilizationResult, investorProfile, averageAnnualBenefits);
  }, [utilizationResult, investorProfile, averageAnnualBenefits]);
}
