/**
 * Input validation utilities for HDC Calculator
 * Ensures data integrity and prevents calculation errors
 */

import { CalculationParams, HDCCalculationParams } from '../../types/taxbenefits';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate investor calculation parameters
 * @param params - The calculation parameters to validate
 * @returns Validation result with any errors or warnings
 */
export const validateCalculationParams = (params: CalculationParams): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical validations (errors)
  if (params.projectCost <= 0) {
    errors.push('Project cost must be greater than zero');
  }

  if (params.exitCapRate <= 0) {
    errors.push('Exit cap rate must be greater than zero');
  }

  if (params.exitCapRate > 20) {
    warnings.push('Exit cap rate above 20% is unusually high');
  }

  // Debt validation
  const totalDebt = (params.seniorDebtPct || 0) + 
                    (params.philanthropicDebtPct || 0) + 
                    (params.hdcSubDebtPct || 0) + 
                    (params.investorSubDebtPct || 0);
  
  if (totalDebt > 100) {
    errors.push(`Total debt (${totalDebt}%) cannot exceed 100%`);
  }

  if (totalDebt > 95) {
    warnings.push(`Very high leverage (${totalDebt}%) may increase risk`);
  }

  // Equity validation
  const totalEquity = (params.investorEquityPct || 0);
  
  if (totalEquity > 100) {
    errors.push(`Total equity (${totalEquity}%) cannot exceed 100%`);
  }

  // Hold period validation (fixed at 10 years for this calculator)
  const holdPeriod = 10;
  if (holdPeriod > 30) {
    warnings.push('Hold periods over 30 years may reduce calculation accuracy');
  }

  // Growth rate validation
  if (Math.abs(params.revenueGrowth) > 25) {
    warnings.push(`Revenue growth of ${params.revenueGrowth}% is unusually high`);
  }

  if (Math.abs(params.expenseGrowth) > 25) {
    warnings.push(`Expense growth of ${params.expenseGrowth}% is unusually high`);
  }

  // Interest rate validation
  if (params.seniorDebtRate && params.seniorDebtRate < 0) {
    errors.push('Senior debt rate cannot be negative');
  }

  if (params.seniorDebtRate && params.seniorDebtRate > 15) {
    warnings.push('Senior debt rate above 15% is unusually high');
  }

  // PIK rate validation
  if (params.hdcSubDebtPikRate && (params.hdcSubDebtPikRate < 0 || params.hdcSubDebtPikRate > 25)) {
    warnings.push('PIK rate should typically be between 0% and 25%');
  }

  // Promote share validation
  if (params.investorPromoteShare < 0 || params.investorPromoteShare > 100) {
    errors.push('Investor promote share must be between 0% and 100%');
  }

  // PIK current pay validation
  if (params.pikCurrentPayEnabled && params.pikCurrentPayPct) {
    if (params.pikCurrentPayPct < 0 || params.pikCurrentPayPct > 100) {
      errors.push('PIK current pay percentage must be between 0% and 100%');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate HDC calculation parameters
 * @param params - The HDC calculation parameters to validate
 * @returns Validation result with any errors or warnings
 */
export const validateHDCParams = (params: HDCCalculationParams): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate HDC-specific fields first
  if (params.projectCost <= 0) {
    errors.push('Project cost must be greater than zero');
  }

  if (params.exitCapRate <= 0) {
    errors.push('Exit cap rate must be greater than zero');
  }

  // HDC-specific validations
  // HDC Tax Benefit Fee removed per IMPL-7.0-014 - only warn if non-zero value is set
  if (params.hdcFeeRate && params.hdcFeeRate !== 0) {
    warnings.push('HDC Tax Benefit Fee has been removed - this value will be ignored');
  }

  if (params.aumFeeEnabled && params.aumFeeRate) {
    if (params.aumFeeRate < 0 || params.aumFeeRate > 5) {
      warnings.push('AUM fee rate typically ranges from 0% to 5%');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Sanitize input values to prevent calculation errors
 * @param value - The value to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param defaultValue - Default value if input is invalid
 * @returns Sanitized value
 */
export const sanitizeNumber = (
  value: number | undefined,
  min: number,
  max: number,
  defaultValue: number
): number => {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
};

/**
 * Validate and sanitize percentage input
 * @param value - The percentage value to validate
 * @param defaultValue - Default value if input is invalid
 * @returns Sanitized percentage (0-100)
 */
export const sanitizePercentage = (
  value: number | undefined,
  defaultValue = 0
): number => {
  return sanitizeNumber(value, 0, 100, defaultValue);
};

/**
 * Validate and sanitize currency input
 * @param value - The currency value to validate
 * @param defaultValue - Default value if input is invalid
 * @returns Sanitized currency value (non-negative)
 */
export const sanitizeCurrency = (
  value: number | undefined,
  defaultValue = 0
): number => {
  return sanitizeNumber(value, 0, Number.MAX_SAFE_INTEGER, defaultValue);
};