import { PropertyPreset } from './taxbenefits/propertyPresets';
import { PropertyPresetBackend } from '../types/propertyPreset';

/**
 * Transform backend property preset to frontend format
 */
export const transformPresetFromBackend = (backendPreset: PropertyPresetBackend): PropertyPreset => {
  return {
    id: backendPreset.presetId,
    name: backendPreset.name,
    category: backendPreset.category,
    description: backendPreset.description,
    values: {
      // Project Fundamentals
      projectCost: backendPreset.projectCost,
      landValue: backendPreset.landValue,
      yearOneNOI: backendPreset.yearOneNoi,
      yearOneDepreciationPct: backendPreset.yearOneDepreciationPct,
      revenueGrowth: backendPreset.revenueGrowth,
      opexRatio: backendPreset.opexRatio,
      exitCapRate: backendPreset.exitCapRate,

      // Capital Structure
      investorEquityPct: backendPreset.investorEquityPct,
      philanthropicEquityPct: backendPreset.philanthropicEquityPct,
      seniorDebtPct: backendPreset.seniorDebtPct,
      seniorDebtRate: backendPreset.seniorDebtRate,
      seniorDebtAmortization: backendPreset.seniorDebtAmortization,
      philDebtPct: backendPreset.philDebtPct,
      philDebtRate: backendPreset.philDebtRate,
      philDebtAmortization: backendPreset.philDebtAmortization,
      hdcSubDebtPct: backendPreset.hdcSubDebtPct,
      hdcSubDebtPikRate: backendPreset.hdcSubDebtPikRate,
      investorSubDebtPct: backendPreset.investorSubDebtPct,
      investorSubDebtPikRate: backendPreset.investorSubDebtPikRate,
      outsideInvestorSubDebtPct: backendPreset.outsideInvestorSubDebtPct,
      outsideInvestorSubDebtPikRate: backendPreset.outsideInvestorSubDebtPikRate,

      // Tax Parameters
      federalTaxRate: backendPreset.federalTaxRate,
      selectedState: backendPreset.selectedState,
      stateCapitalGainsRate: backendPreset.stateCapitalGainsRate,
      ltCapitalGainsRate: backendPreset.ltCapitalGainsRate,
      niitRate: backendPreset.niitRate,
      depreciationRecaptureRate: backendPreset.depreciationRecaptureRate,
      deferredGains: backendPreset.deferredGains,

      // HDC Fees
      hdcFeeRate: backendPreset.hdcFeeRate,
      aumFeeEnabled: backendPreset.aumFeeEnabled,
      aumFeeRate: backendPreset.aumFeeRate,

      // Exit & Promote
      investorPromoteShare: backendPreset.investorPromoteShare,
    },
  };
};

/**
 * Transform array of backend presets to frontend format
 */
export const transformPresetsFromBackend = (backendPresets: PropertyPresetBackend[]): PropertyPreset[] => {
  return backendPresets.map(transformPresetFromBackend);
};
