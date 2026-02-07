/**
 * IMPL-056: Live Calculation Excel Model - Named Ranges
 *
 * Centralized definition and management of all named ranges.
 * Named ranges enable formula cross-referencing across sheets.
 */

import * as XLSX from 'xlsx';
import { NamedRangeDefinition, COLS } from './types';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get Excel column letter from 0-based index
 * Handles columns beyond Z (AA, AB, etc.)
 */
export function colLetter(index: number): string {
  if (index < 26) return COLS[index];
  return COLS[Math.floor(index / 26) - 1] + COLS[index % 26];
}

/**
 * Create a cell reference with optional absolute markers
 * @param sheet - Sheet name (e.g., 'Inputs')
 * @param col - 0-based column index
 * @param row - 1-based row number
 * @param absolute - Whether to use absolute references ($)
 */
export function cellRef(
  sheet: string,
  col: number,
  row: number,
  absolute: boolean = true
): string {
  const colStr = absolute ? `$${colLetter(col)}` : colLetter(col);
  const rowStr = absolute ? `$${row}` : `${row}`;
  return `${sheet}!${colStr}${rowStr}`;
}

/**
 * Create a named range definition
 */
export function namedRange(name: string, sheet: string, col: number, row: number): NamedRangeDefinition {
  return {
    name,
    ref: cellRef(sheet, col, row),
  };
}

/**
 * Apply named ranges to a workbook
 */
export function applyNamedRanges(wb: XLSX.WorkBook, ranges: NamedRangeDefinition[]): void {
  wb.Workbook = wb.Workbook || {};
  wb.Workbook.Names = wb.Workbook.Names || [];

  ranges.forEach((range) => {
    wb.Workbook!.Names!.push({
      Name: range.name,
      Ref: range.ref,
    });
  });
}

// ============================================================================
// INPUT PARAMETER NAMED RANGES
// ============================================================================

/**
 * All input parameter named ranges
 * Row numbers are 1-based, matching Excel rows
 */
export const INPUT_RANGES = {
  // Project Definition (rows 5-15)
  ProjectCost: { col: 1, row: 5 },
  LandValue: { col: 1, row: 6 },
  Units: { col: 1, row: 7 },
  PlacedInServiceMonth: { col: 1, row: 8 },
  PropertyState: { col: 1, row: 9 },
  HoldPeriod: { col: 1, row: 10 },
  YearOneNOI: { col: 1, row: 11 },
  NOIGrowthRate: { col: 1, row: 12 },
  ExitCapRate: { col: 1, row: 13 },
  StabilizedOccupancy: { col: 1, row: 14 },
  LeaseUpMonths: { col: 1, row: 15 },

  // Capital Structure (rows 18-44)
  SeniorDebtPct: { col: 1, row: 18 },
  SeniorDebtRate: { col: 1, row: 19 },
  SeniorDebtTerm: { col: 1, row: 20 },
  SeniorDebtAmort: { col: 1, row: 21 },
  SeniorDebtIOYears: { col: 1, row: 22 },

  PhilDebtPct: { col: 1, row: 24 },
  PhilDebtRate: { col: 1, row: 25 },
  PhilCurrentPayEnabled: { col: 1, row: 26 },
  PhilCurrentPayPct: { col: 1, row: 27 },

  InvestorEquityPct: { col: 1, row: 29 },

  HDCSubDebtPct: { col: 1, row: 31 },
  HDCSubDebtPIKRate: { col: 1, row: 32 },
  HDCPIKCurrentPayEnabled: { col: 1, row: 33 },
  HDCPIKCurrentPayPct: { col: 1, row: 34 },

  InvestorSubDebtPct: { col: 1, row: 36 },
  InvestorSubDebtPIKRate: { col: 1, row: 37 },
  InvestorPIKCurrentPayEnabled: { col: 1, row: 38 },
  InvestorPIKCurrentPayPct: { col: 1, row: 39 },

  OutsideSubDebtPct: { col: 1, row: 41 },
  OutsidePIKRate: { col: 1, row: 42 },
  OutsideCurrentPayEnabled: { col: 1, row: 43 },
  OutsideCurrentPayPct: { col: 1, row: 44 },

  // Tax Parameters (rows 47-54)
  FederalTaxRate: { col: 1, row: 47 },
  NIITRate: { col: 1, row: 48 },
  StateTaxRate: { col: 1, row: 49 },
  CostSegPct: { col: 1, row: 50 },
  BonusDepreciationPct: { col: 1, row: 51 },
  InvestorState: { col: 1, row: 52 },
  StateConforms: { col: 1, row: 53 },
  IsREP: { col: 1, row: 54 },

  // OZ Parameters (rows 57-60)
  OZEnabled: { col: 1, row: 57 },
  OZVersion: { col: 1, row: 58 },
  DeferredGain: { col: 1, row: 59 },
  OZStepUpPct: { col: 1, row: 60 },

  // LIHTC Parameters (rows 63-71)
  FedLIHTCEnabled: { col: 1, row: 63 },
  ApplicableFraction: { col: 1, row: 64 },
  LIHTCRate: { col: 1, row: 65 },
  QualifiedBasisBoost: { col: 1, row: 66 },
  StateLIHTCEnabled: { col: 1, row: 68 },
  StateLIHTCRate: { col: 1, row: 69 },
  StateLIHTCSyndRate: { col: 1, row: 70 },
  StateLIHTCPath: { col: 1, row: 71 },
  StateLIHTCSyndYear: { col: 1, row: 72 }, // IMPL-073

  // Fee Structure (rows 75-81)
  AUMFeePct: { col: 1, row: 74 },
  AUMCurrentPayEnabled: { col: 1, row: 75 },
  AUMCurrentPayPct: { col: 1, row: 76 },
  HDCDeferredInterestRate: { col: 1, row: 77 },
  InvestorPromoteShare: { col: 1, row: 79 },
  PromoteHurdleRate: { col: 1, row: 80 },

  // Interest Reserve (row 83)
  InterestReserveMonths: { col: 1, row: 83 },

  // Preferred Equity (rows 86-89)
  PrefEquityEnabled: { col: 1, row: 86 },
  PrefEquityPct: { col: 1, row: 87 },
  PrefEquityTargetMOIC: { col: 1, row: 88 },
  PrefEquityAccrualRate: { col: 1, row: 89 },
} as const;

/**
 * Generate input named ranges for a workbook
 */
export function generateInputNamedRanges(): NamedRangeDefinition[] {
  const ranges: NamedRangeDefinition[] = [];

  Object.entries(INPUT_RANGES).forEach(([name, { col, row }]) => {
    ranges.push(namedRange(name, 'Inputs', col, row));
  });

  return ranges;
}

// ============================================================================
// CALCULATED VALUE NAMED RANGES
// ============================================================================

/**
 * Capital Stack calculated values
 */
export const CAPITAL_STACK_RANGES = {
  SeniorDebt: { col: 1, row: 4 },
  PhilDebt: { col: 1, row: 5 },
  InvestorEquity: { col: 1, row: 6 },
  HDCSubDebt: { col: 1, row: 7 },
  InvestorSubDebt: { col: 1, row: 8 },
  OutsideSubDebt: { col: 1, row: 9 },
  TotalSources: { col: 1, row: 10 },
} as const;

/**
 * Depreciation calculated values
 */
export const DEPRECIATION_RANGES = {
  DepreciableBasis: { col: 1, row: 3 },
  CostSegPortion: { col: 1, row: 4 },
  StraightLinePortion: { col: 1, row: 5 },
} as const;

/**
 * Tax Benefits calculated values
 */
export const TAX_BENEFITS_RANGES = {
  EffectiveTaxRate: { col: 1, row: 3 },
} as const;

/**
 * Summary calculated values
 */
export const SUMMARY_RANGES = {
  TotalInvestment: { col: 1, row: 7 },
  InvestorMOIC: { col: 1, row: 10 },
  InvestorIRR: { col: 1, row: 11 },
  TotalReturns: { col: 1, row: 12 },
} as const;

/**
 * Generate all calculated named ranges
 */
export function generateCalculatedNamedRanges(): NamedRangeDefinition[] {
  const ranges: NamedRangeDefinition[] = [];

  // Capital Stack
  Object.entries(CAPITAL_STACK_RANGES).forEach(([name, { col, row }]) => {
    ranges.push(namedRange(name, 'Capital_Stack', col, row));
  });

  // Depreciation
  Object.entries(DEPRECIATION_RANGES).forEach(([name, { col, row }]) => {
    ranges.push(namedRange(name, 'Depreciation', col, row));
  });

  // Tax Benefits
  Object.entries(TAX_BENEFITS_RANGES).forEach(([name, { col, row }]) => {
    ranges.push(namedRange(name, 'Tax_Benefits', col, row));
  });

  // Summary
  Object.entries(SUMMARY_RANGES).forEach(([name, { col, row }]) => {
    ranges.push(namedRange(name, 'Summary', col, row));
  });

  return ranges;
}

// ============================================================================
// YEAR-BY-YEAR NAMED RANGES
// ============================================================================

/**
 * Generate named ranges for year-by-year data
 * Creates ranges like NOI_Y1, NOI_Y2, ..., NOI_Y10
 */
export function generateYearlyNamedRanges(
  prefix: string,
  sheet: string,
  col: number,
  startRow: number,
  years: number = 10
): NamedRangeDefinition[] {
  const ranges: NamedRangeDefinition[] = [];

  for (let year = 1; year <= years; year++) {
    ranges.push(namedRange(`${prefix}_Y${year}`, sheet, col, startRow + year - 1));
  }

  return ranges;
}
