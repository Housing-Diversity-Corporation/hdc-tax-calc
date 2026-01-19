/**
 * IMPL-056: Live Calculation Excel Model - Types
 *
 * Type definitions for the live Excel export with working formulas.
 */

import * as XLSX from 'xlsx';
import {
  CalculationParams,
  InvestorAnalysisResults,
  HDCAnalysisResults,
  CashFlowItem,
  HDCCashFlowItem,
} from '../../../types/taxbenefits';

// ============================================================================
// EXPORT PARAMETERS
// ============================================================================

/**
 * Parameters for generating a live Excel model
 */
export interface LiveExcelParams {
  /** Calculator input parameters */
  params: CalculationParams;
  /** Calculated investor results */
  investorResults: InvestorAnalysisResults;
  /** HDC analysis results */
  hdcResults: HDCAnalysisResults;
  /** Year-by-year investor cash flows */
  cashFlows: CashFlowItem[];
  /** Year-by-year HDC cash flows */
  hdcCashFlows: HDCCashFlowItem[];
  /** Project name for filename */
  projectName?: string;
}

/**
 * Legacy interface for backward compatibility
 */
export interface AuditExportParams {
  params: CalculationParams;
  results: InvestorAnalysisResults;
  hdcResults?: HDCAnalysisResults;
  projectName?: string;
}

// ============================================================================
// SHEET BUILDING TYPES
// ============================================================================

/**
 * Result from building a single sheet
 */
export interface SheetResult {
  /** The built worksheet */
  sheet: XLSX.WorkSheet;
  /** Named ranges defined in this sheet */
  namedRanges: NamedRangeDefinition[];
}

/**
 * Named range definition for Excel
 */
export interface NamedRangeDefinition {
  /** Name of the range (e.g., 'ProjectCost') */
  name: string;
  /** Cell reference (e.g., 'Inputs!$B$5') */
  ref: string;
  /** Optional scope (sheet index, omit for workbook scope) */
  scope?: number;
}

/**
 * Input parameter row definition
 */
export interface InputRow {
  /** Display label */
  label: string;
  /** Named range name */
  rangeName: string;
  /** Cell value */
  value: number | string | boolean;
  /** Unit description */
  units?: string;
  /** Optional description */
  description?: string;
}

// ============================================================================
// CELL TYPES
// ============================================================================

/**
 * Cell with a live formula
 */
export interface FormulaCell {
  /** Cell type: 'n' for number, 's' for string */
  t: 'n' | 's';
  /** Pre-calculated value (for display before Excel recalculates) */
  v: number | string;
  /** Excel formula WITHOUT leading '=' */
  f: string;
}

/**
 * Create a formula cell with pre-calculated value
 */
export function formulaCell(value: number, formula: string): FormulaCell {
  return { t: 'n', v: value, f: formula };
}

/**
 * Create a text formula cell
 */
export function textFormulaCell(value: string, formula: string): FormulaCell {
  return { t: 's', v: value, f: formula };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Excel column letters for reference */
export const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Default hold period in years */
export const DEFAULT_HOLD_PERIOD = 10;

/** Sheet names in order */
export const SHEET_NAMES = [
  'Inputs',
  'Capital_Stack',
  'Debt_Schedule',
  'Depreciation',
  'Tax_Benefits',
  'LIHTC',
  'Operating_CF',
  'PIK_Tracking',
  'Waterfall',
  'Exit',
  'Investor_Returns',
  'HDC_Returns',
  'Summary',
  'Validation',
] as const;

export type SheetName = (typeof SHEET_NAMES)[number];

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Row data type for sheet building
 * Can be a string, number, boolean, or formula cell
 */
export type CellValue = string | number | boolean | FormulaCell | null | undefined;

/**
 * Row data array
 */
export type RowData = CellValue[];

/**
 * Sheet data as 2D array
 */
export type SheetData = RowData[];
