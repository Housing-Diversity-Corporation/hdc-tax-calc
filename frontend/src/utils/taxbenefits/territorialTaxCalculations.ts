/**
 * Territorial Tax Calculation Utilities
 *
 * Handles special tax rules for US territories including:
 * - Mirror code systems (USVI)
 * - Independent systems (PR)
 * - NIIT exemptions
 * - Special OZ treatments
 */

import { ALL_JURISDICTIONS, JurisdictionData } from './stateData';

export interface TerritorialTaxParams {
  jurisdictionCode: string;
  income: number;
  capitalGains: number;
  isBonaFideResident: boolean;
  qualifiesForAct60?: boolean;  // Puerto Rico specific
  holdPeriod: number;
  ozInvestment: boolean;
}

export interface TerritorialTaxResult {
  federalTax: number;
  territorialTax: number;
  combinedTax: number;
  niitAmount: number;
  specialIncentives: string[];
  warnings: string[];
}

/**
 * Calculate tax for territorial jurisdictions
 */
export function calculateTerritorialTax(params: TerritorialTaxParams): TerritorialTaxResult {
  const jurisdiction = ALL_JURISDICTIONS[params.jurisdictionCode];

  if (!jurisdiction || jurisdiction.type !== 'territory') {
    throw new Error(`Invalid territory code: ${params.jurisdictionCode}`);
  }

  const result: TerritorialTaxResult = {
    federalTax: 0,
    territorialTax: 0,
    combinedTax: 0,
    niitAmount: 0,  // Territories don't have NIIT
    specialIncentives: [],
    warnings: []
  };

  switch (params.jurisdictionCode) {
    case 'PR':
      return calculatePuertoRicoTax(params, jurisdiction, result);
    case 'VI':
      return calculateUSVITax(params, jurisdiction, result);
    case 'GU':
      return calculateGuamTax(params, jurisdiction, result);
    case 'AS':
      return calculateAmericanSamoaTax(params, jurisdiction, result);
    case 'MP':
      return calculateNMITax(params, jurisdiction, result);
    default:
      return calculateGenericTerritorialTax(params, jurisdiction, result);
  }
}

/**
 * Puerto Rico - Special Act 60 benefits
 */
function calculatePuertoRicoTax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  if (params.isBonaFideResident) {
    // Bona fide residents don't pay federal tax on PR-sourced income
    result.federalTax = 0;

    if (params.qualifiesForAct60) {
      // Act 60 benefits
      result.specialIncentives.push('Act 60: 4% corporate tax rate');
      result.specialIncentives.push('Act 60: 0% capital gains tax');
      result.specialIncentives.push('Act 60: 100% dividend exemption');

      // Calculate with Act 60 rates
      result.territorialTax = params.income * 0.04;  // 4% flat rate
      result.territorialTax += params.capitalGains * 0;  // 0% on capital gains
    } else {
      // Regular PR rates
      result.territorialTax = params.income * (jurisdiction.rate / 100);
      result.territorialTax += params.capitalGains * ((jurisdiction.capitalGainsRate || 15) / 100);
    }

    if (params.ozInvestment) {
      result.specialIncentives.push('Enhanced OZ benefits available in PR');
      result.specialIncentives.push('Potential 98% tax exemption on OZ gains');
    }
  } else {
    // Non-residents pay federal tax
    result.warnings.push('Non-residents must file federal returns');
    result.federalTax = calculateStandardFederalTax(params);
    result.territorialTax = params.income * (jurisdiction.rate / 100);
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * US Virgin Islands - Mirror code system
 */
function calculateUSVITax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  if (params.isBonaFideResident) {
    // USVI uses mirror code - same as federal but paid to USVI
    result.territorialTax = calculateStandardFederalTax(params);
    result.federalTax = 0;  // Paid to USVI instead

    result.specialIncentives.push('Mirror code: Federal taxes paid to USVI');
    result.specialIncentives.push('90% income tax reduction available for qualifying businesses');

    if (params.ozInvestment) {
      result.specialIncentives.push('USVI OZ: Additional local incentives');
      result.territorialTax *= 0.9;  // 10% additional reduction
    }
  } else {
    result.warnings.push('Complex filing requirements for non-residents');
    result.federalTax = calculateStandardFederalTax(params);
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * Guam - Partial mirror code
 */
function calculateGuamTax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  if (params.isBonaFideResident) {
    result.territorialTax = params.income * (jurisdiction.rate / 100);
    result.territorialTax += params.capitalGains * ((jurisdiction.capitalGainsRate || jurisdiction.rate) / 100);
    result.federalTax = 0;

    result.specialIncentives.push('No federal tax on Guam-sourced income');
  } else {
    result.federalTax = calculateStandardFederalTax(params);
    result.warnings.push('Must file both federal and Guam returns');
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * American Samoa - Independent system
 */
function calculateAmericanSamoaTax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  // American Samoa has its own tax system
  result.territorialTax = params.income * (jurisdiction.rate / 100);
  result.territorialTax += params.capitalGains * ((jurisdiction.capitalGainsRate || jurisdiction.rate) / 100);

  if (!params.isBonaFideResident) {
    result.federalTax = calculateStandardFederalTax(params);
    result.warnings.push('Non-residents subject to both federal and AS tax');
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * Northern Mariana Islands
 */
function calculateNMITax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  if (params.isBonaFideResident) {
    result.territorialTax = calculateStandardFederalTax(params);
    result.federalTax = 0;  // Mirror system

    result.specialIncentives.push('Mirror code system with local modifications');
  } else {
    result.federalTax = calculateStandardFederalTax(params);
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * Generic territorial calculation
 */
function calculateGenericTerritorialTax(
  params: TerritorialTaxParams,
  jurisdiction: JurisdictionData,
  result: TerritorialTaxResult
): TerritorialTaxResult {

  result.territorialTax = params.income * (jurisdiction.rate / 100);
  result.territorialTax += params.capitalGains * ((jurisdiction.capitalGainsRate || jurisdiction.rate) / 100);

  if (!params.isBonaFideResident) {
    result.federalTax = calculateStandardFederalTax(params);
  }

  result.combinedTax = result.federalTax + result.territorialTax;
  return result;
}

/**
 * Calculate standard federal tax (simplified)
 */
function calculateStandardFederalTax(params: TerritorialTaxParams): number {
  // Simplified federal tax calculation
  const ordinaryRate = 0.37;  // Top rate
  const capitalGainsRate = params.holdPeriod >= 1 ? 0.20 : 0.37;

  let tax = params.income * ordinaryRate;
  tax += params.capitalGains * capitalGainsRate;

  // OZ benefits
  if (params.ozInvestment && params.holdPeriod >= 10) {
    tax *= 0.9;  // 10% reduction for OZ
  }

  return tax;
}

/**
 * Check if NIIT applies (it doesn't for territories)
 */
export function territorialNIITApplies(jurisdictionCode: string): boolean {
  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];
  return jurisdiction?.type !== 'territory';
}

/**
 * Get special incentive programs for a territory
 */
export function getTerritorialIncentives(jurisdictionCode: string): string[] {
  const incentives: string[] = [];

  switch (jurisdictionCode) {
    case 'PR':
      incentives.push('Act 20/22 (now Act 60) - Export Services & Investor Resident');
      incentives.push('Act 73 - Economic Incentives for Development');
      incentives.push('OZ Enhanced Benefits - Up to 98% tax exemption');
      incentives.push('No federal tax on PR-sourced income for residents');
      break;
    case 'VI':
      incentives.push('Economic Development Commission benefits');
      incentives.push('90% reduction in income tax for qualifying businesses');
      incentives.push('100% exemption on gross receipts tax');
      incentives.push('OZ benefits with local enhancements');
      break;
    case 'GU':
      incentives.push('Qualifying Certificate program');
      incentives.push('Tax rebates for new businesses');
      incentives.push('Special economic zones');
      break;
    case 'AS':
      incentives.push('Tax credits for local employment');
      incentives.push('Investment incentive credits');
      break;
    case 'MP':
      incentives.push('Foreign investor tax benefits');
      incentives.push('Saipan special economic zones');
      break;
  }

  return incentives;
}

/**
 * Validate if a jurisdiction can use certain tax strategies
 */
export function validateTerritorialStrategy(
  jurisdictionCode: string,
  strategy: 'oz' | 'depreciation' | 'credits'
): { valid: boolean; reason?: string } {

  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];

  if (!jurisdiction) {
    return { valid: false, reason: 'Invalid jurisdiction' };
  }

  if (jurisdiction.type !== 'territory') {
    return { valid: true };  // States can use all strategies
  }

  switch (strategy) {
    case 'oz':
      if (jurisdiction.ozConformity === 'none') {
        return { valid: false, reason: 'Territory does not conform to OZ rules' };
      }
      if (jurisdiction.ozConformity === 'special') {
        return { valid: true, reason: 'Special OZ rules apply - consult local regulations' };
      }
      return { valid: true };

    case 'depreciation':
      // Territories may have different depreciation rules
      if (jurisdictionCode === 'PR') {
        return { valid: true, reason: 'PR allows accelerated depreciation with modifications' };
      }
      return { valid: true };

    case 'credits':
      // Some territories have unique credit systems
      return { valid: true, reason: 'Territory-specific credits may apply' };

    default:
      return { valid: true };
  }
}