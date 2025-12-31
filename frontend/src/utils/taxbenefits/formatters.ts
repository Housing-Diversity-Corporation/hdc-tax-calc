/**
 * Number formatting utilities for HDC Calculator
 * Provides consistent formatting across the application
 */

/**
 * Format a number as USD currency
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, decimals = 0): string => {
  if (isNaN(value) || !isFinite(value)) return '$0';
  
  // Don't round the value - preserve full precision
  // The Intl.NumberFormat will handle rounding based on decimals parameter
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a number that's already in millions as USD currency
 * @param value - The numeric value in millions (e.g., 5 for $5M)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatCurrencyMillions = (value: number, decimals = 0): string => {
  if (isNaN(value) || !isFinite(value)) return '$0';
  
  // Convert from millions to actual dollar amount
  const actualValue = value * 1000000;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(actualValue);
};

/**
 * Format a number as a percentage
 * @param value - The numeric value to format (already in percentage, e.g., 5.5 for 5.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number, decimals = 2): string => {
  if (isNaN(value) || !isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a number with thousands separators
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, decimals = 0): string => {
  if (isNaN(value) || !isFinite(value)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a multiple (e.g., 1.5x)
 * @param value - The numeric value to format
 * @returns Formatted multiple string
 */
export const formatMultiple = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0.00x';
  return `${value.toFixed(2)}x`;
};

/**
 * Format IRR or rate of return
 * @param value - The rate value (already in percentage)
 * @returns Formatted rate string
 */
export const formatIRR = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  if (value > 999) return '>999%';
  if (value < -99) return '<-99%';
  return formatPercent(value, 2);
};

/**
 * Format a number for cash flow tables (in millions with 3 decimal places)
 * @param value - The numeric value in millions (e.g., 0.5 for $0.5M)
 * @returns Formatted string with 3 decimal places and leading zeros
 */
export const formatCashFlowMillions = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0.000';
  
  // Format with exactly 3 decimal places
  const formatted = value.toFixed(3);
  
  // Ensure leading zero for values less than 1
  if (Math.abs(value) < 1 && Math.abs(value) > 0) {
    return formatted;
  }
  
  return formatted;
};

/**
 * Format year label
 * @param year - Year number (1, 2, 3, etc.)
 * @returns Formatted year label
 */
export const formatYear = (year: number): string => {
  return `Year ${year}`;
};

/**
 * Abbreviate large numbers (e.g., 1.5M, 2.3B)
 * @param value - The numeric value to abbreviate
 * @returns Abbreviated number string
 */
export const abbreviateNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  }
  
  return `${sign}${absValue.toFixed(0)}`;
};

/**
 * Format a number as abbreviated currency (e.g., $1.50M, $2.30B)
 * IMPL-036: Updated to 2 decimal places for Deal Validation strip
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Abbreviated currency string
 */
export const formatAbbreviatedCurrency = (value: number, decimals = 2): string => {
  if (isNaN(value) || !isFinite(value)) return '$0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(decimals)}K`;
  }

  return `${sign}$${Math.round(absValue)}`;
};