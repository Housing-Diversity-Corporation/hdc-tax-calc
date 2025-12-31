/**
 * Tax Data Validation & Versioning System
 *
 * Provides:
 * - Version control for tax law changes
 * - Validation of jurisdiction capabilities
 * - Edge case handling
 * - Future-proofing mechanisms
 */

import { ALL_JURISDICTIONS, JurisdictionData } from './stateData';

// Version control for tax data
export const TAX_DATA_VERSION = {
  version: '2024.1.0',
  lastUpdated: '2024-01-15',
  taxYear: 2024,
  changes: [
    { date: '2024-01-15', description: 'Initial comprehensive state/territory data' },
    { date: '2024-01-01', description: 'Updated federal tax brackets for 2024' }
  ]
};

// Validation rules for different investment scenarios
export interface ValidationRule {
  id: string;
  description: string;
  validate: (jurisdiction: string, params: any) => ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

/**
 * Validate jurisdiction selection for specific investment strategy
 */
export function validateJurisdictionStrategy(
  jurisdictionCode: string,
  strategy: {
    type: 'oz' | 'standard' | 'mixed';
    hasDepreciation: boolean;
    hasCapitalGains: boolean;
    holdPeriod: number;
    investmentAmount: number;
  }
): ValidationResult {

  const result: ValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    suggestions: []
  };

  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];

  if (!jurisdiction && jurisdictionCode !== 'CUSTOM' && jurisdictionCode !== 'NONE') {
    result.valid = false;
    result.errors.push(`Invalid jurisdiction code: ${jurisdictionCode}`);
    return result;
  }

  // Custom jurisdiction validation
  if (jurisdictionCode === 'CUSTOM') {
    result.warnings.push('Using custom rates - ensure accuracy for calculations');
    result.suggestions.push('Consider selecting a specific jurisdiction for validated rates');
    return result;
  }

  // No tax state considerations
  if (jurisdictionCode === 'NONE' || jurisdiction?.rate === 0) {
    if (strategy.hasDepreciation) {
      result.warnings.push('No state tax benefit from depreciation in no-tax states');
    }
    if (strategy.type === 'oz') {
      result.suggestions.push('Consider federal OZ benefits still apply');
    }
    return result;
  }

  // OZ Strategy Validation
  if (strategy.type === 'oz') {
    validateOZStrategy(jurisdiction!, strategy, result);
  }

  // Depreciation validation
  if (strategy.hasDepreciation) {
    validateDepreciationStrategy(jurisdiction!, strategy, result);
  }

  // Capital gains validation
  if (strategy.hasCapitalGains) {
    validateCapitalGainsStrategy(jurisdiction!, strategy, result);
  }

  // Territory-specific validation
  if (jurisdiction?.type === 'territory') {
    validateTerritoryStrategy(jurisdiction, strategy, result);
  }

  // Hold period validation
  if (strategy.holdPeriod < 10 && strategy.type === 'oz') {
    result.warnings.push('Full OZ benefits require 10+ year hold period');
  }

  return result;
}

/**
 * Validate OZ investment strategy
 */
function validateOZStrategy(
  jurisdiction: JurisdictionData,
  strategy: any,
  result: ValidationResult
): void {

  switch (jurisdiction.ozConformity) {
    case 'none':
      result.errors.push(`${jurisdiction.name} does not conform to federal OZ rules`);
      result.valid = false;
      result.suggestions.push('Consider alternative jurisdictions with OZ conformity');
      break;

    case 'partial':
      result.warnings.push(`${jurisdiction.name} has partial OZ conformity - some benefits may be limited`);
      result.suggestions.push('Consult state-specific OZ regulations');
      break;

    case 'special':
      if (jurisdiction.type === 'territory') {
        result.warnings.push(`${jurisdiction.name} has special OZ rules that may enhance benefits`);
        result.suggestions.push('Consider consulting local tax advisor for territory-specific benefits');
      }
      break;

    case 'full':
      // Full conformity - no issues
      if (strategy.holdPeriod >= 10) {
        result.suggestions.push(`${jurisdiction.name} offers full OZ benefits for 10+ year holds`);
      }
      break;
  }

  // Large investment considerations
  if (strategy.investmentAmount > 10000000) {  // $10M+
    result.suggestions.push('Large OZ investments may qualify for additional state incentives');
  }
}

/**
 * Validate depreciation strategy
 */
function validateDepreciationStrategy(
  jurisdiction: JurisdictionData,
  strategy: any,
  result: ValidationResult
): void {

  // Check if state decouples from federal depreciation
  const decouplingStates = ['CA', 'NY', 'NJ', 'CT'];  // Examples
  if (decouplingStates.includes(jurisdiction.name)) {
    result.warnings.push(`${jurisdiction.name} may decouple from federal depreciation rules`);
    result.suggestions.push('Verify state-specific depreciation schedules');
  }

  // High tax rate states benefit more from depreciation
  if (jurisdiction.rate > 8) {
    result.suggestions.push(`High state tax rate (${jurisdiction.rate}%) maximizes depreciation benefits`);
  } else if (jurisdiction.rate > 0 && jurisdiction.rate < 4) {
    result.warnings.push(`Low state tax rate (${jurisdiction.rate}%) provides minimal depreciation benefit`);
  }
}

/**
 * Validate capital gains strategy
 */
function validateCapitalGainsStrategy(
  jurisdiction: JurisdictionData,
  strategy: any,
  result: ValidationResult
): void {

  // Check for preferential capital gains rates
  if (jurisdiction.capitalGainsRate !== undefined &&
      jurisdiction.capitalGainsRate < jurisdiction.rate) {
    const savings = jurisdiction.rate - jurisdiction.capitalGainsRate;
    result.suggestions.push(
      `${jurisdiction.name} offers ${savings}% lower rate on capital gains`
    );
  }

  // Special cases
  if (jurisdiction.name === 'Washington' && jurisdiction.capitalGainsRate! > 0) {
    result.warnings.push('Washington has capital gains tax despite no income tax');
    if (strategy.investmentAmount > 250000) {
      result.warnings.push('WA capital gains tax applies to gains over $250k');
    }
  }

  // Hold period considerations
  if (strategy.holdPeriod < 1) {
    result.warnings.push('Short-term gains taxed at ordinary income rates');
  }
}

/**
 * Validate territory-specific strategies
 */
function validateTerritoryStrategy(
  jurisdiction: JurisdictionData,
  strategy: any,
  result: ValidationResult
): void {

  result.warnings.push('Territories have unique federal tax treatment');
  result.warnings.push('NIIT (3.8%) does not apply to territory residents');

  // Puerto Rico specific
  if (jurisdiction.name === 'Puerto Rico') {
    result.suggestions.push('Consider Act 60 for significant tax benefits');
    result.suggestions.push('Bona fide residence required for maximum benefits');
    if (strategy.type === 'oz') {
      result.suggestions.push('PR offers enhanced OZ benefits up to 98% tax exemption');
    }
  }

  // USVI specific
  if (jurisdiction.name === 'US Virgin Islands') {
    result.suggestions.push('Mirror code system - federal taxes paid to USVI');
    result.suggestions.push('EDC benefits available for qualifying businesses');
  }

  result.suggestions.push('Consult territory-specific tax advisor');
}

/**
 * Version-aware data retrieval
 */
export function getVersionedJurisdictionData(
  jurisdictionCode: string,
  taxYear?: number
): JurisdictionData | null {

  // Current year data
  if (!taxYear || taxYear === TAX_DATA_VERSION.taxYear) {
    return ALL_JURISDICTIONS[jurisdictionCode] || null;
  }

  // Historical data would be loaded from versioned sources
  // For now, return current with warning
  console.warn(`Tax data for ${taxYear} not available, using ${TAX_DATA_VERSION.taxYear} rates`);
  return ALL_JURISDICTIONS[jurisdictionCode] || null;
}

/**
 * Validate saved configuration compatibility
 */
export function validateSavedConfiguration(config: any): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    warnings: [],
    errors: [],
    suggestions: []
  };

  // Check version compatibility
  if (config.version && config.version !== TAX_DATA_VERSION.version) {
    result.warnings.push('Configuration uses different tax data version');
    result.suggestions.push('Review calculations with current tax rates');
  }

  // Validate jurisdiction still exists
  if (config.selectedState && !ALL_JURISDICTIONS[config.selectedState] &&
      config.selectedState !== 'CUSTOM' && config.selectedState !== 'NONE') {
    result.errors.push('Saved jurisdiction no longer valid');
    result.valid = false;
  }

  // Check for deprecated fields
  const deprecatedFields = ['stateTaxRate'];  // Example
  deprecatedFields.forEach(field => {
    if (config[field] !== undefined) {
      result.warnings.push(`Configuration contains deprecated field: ${field}`);
    }
  });

  return result;
}

/**
 * Get migration suggestions for tax law changes
 */
export function getTaxLawMigrationSuggestions(
  fromYear: number,
  toYear: number,
  jurisdictionCode: string
): string[] {

  const suggestions: string[] = [];

  // Federal changes
  if (fromYear < 2024 && toYear >= 2024) {
    suggestions.push('Federal tax brackets updated for 2024');
    suggestions.push('Standard deduction increased for inflation');
  }

  // State-specific changes
  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];
  if (jurisdiction) {
    // Check for known state tax changes
    if (jurisdictionCode === 'AZ' && fromYear < 2023) {
      suggestions.push('Arizona reduced flat tax rate to 2.5% in 2023');
    }
    if (jurisdictionCode === 'NC' && fromYear < 2024) {
      suggestions.push('North Carolina continuing phased rate reductions');
    }
    // Add more state-specific changes as needed
  }

  // OZ changes
  if (fromYear < 2024 && toYear >= 2024) {
    suggestions.push('Some OZ designations may have changed - verify fund compliance');
  }

  return suggestions;
}

/**
 * Export validation report
 */
export function generateValidationReport(
  jurisdictionCode: string,
  investment: any
): string {

  const validation = validateJurisdictionStrategy(jurisdictionCode, investment);
  const jurisdiction = ALL_JURISDICTIONS[jurisdictionCode];

  let report = `TAX VALIDATION REPORT\n`;
  report += `=====================\n\n`;
  report += `Jurisdiction: ${jurisdiction?.name || jurisdictionCode}\n`;
  report += `Tax Data Version: ${TAX_DATA_VERSION.version}\n`;
  report += `Report Date: ${new Date().toLocaleDateString()}\n\n`;

  if (validation.errors.length > 0) {
    report += `ERRORS:\n`;
    validation.errors.forEach(error => {
      report += `  ❌ ${error}\n`;
    });
    report += '\n';
  }

  if (validation.warnings.length > 0) {
    report += `WARNINGS:\n`;
    validation.warnings.forEach(warning => {
      report += `  ⚠️ ${warning}\n`;
    });
    report += '\n';
  }

  if (validation.suggestions.length > 0) {
    report += `SUGGESTIONS:\n`;
    validation.suggestions.forEach(suggestion => {
      report += `  💡 ${suggestion}\n`;
    });
    report += '\n';
  }

  report += `VALIDATION STATUS: ${validation.valid ? '✅ VALID' : '❌ INVALID'}\n`;

  return report;
}