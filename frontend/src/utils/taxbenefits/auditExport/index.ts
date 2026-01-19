/**
 * IMPL-056: Live Calculation Excel Model
 *
 * Replaces the previous audit export with a 14-sheet Excel workbook
 * containing live formulas. Changing any input cell recalculates all outputs.
 *
 * Sheets:
 * 1. Inputs - All input parameters with named ranges
 * 2. Capital_Stack - Sources = Uses verification
 * 3. Debt_Schedule - Year-by-year debt amortization
 * 4. Depreciation - Bonus + MACRS schedule
 * 5. Tax_Benefits - Depreciation × tax rate
 * 6. LIHTC - 11-year credit schedule (IRC §42)
 * 7. Operating_CF - NOI and DSCR tracking
 * 8. PIK_Tracking - 4 PIK debt layers
 * 9. Waterfall - DSCR-enforced distribution
 * 10. Exit - Exit value and equity waterfall
 * 11. Investor_Returns - Complete investor cash flows with OZ benefits
 * 12. HDC_Returns - HDC income streams
 * 13. Summary - Dashboard with IRR/MOIC
 * 14. Validation - Excel vs Platform comparison
 *
 * @version 3.0.0
 * @date 2025-01-18
 * @task IMPL-056 (supersedes IMPL-038)
 */

import * as XLSX from 'xlsx';
import {
  CalculationParams,
  InvestorAnalysisResults,
  HDCAnalysisResults,
  CashFlowItem,
  HDCCashFlowItem,
} from '../../../types/taxbenefits';

import { LiveExcelParams, AuditExportParams, NamedRangeDefinition, SHEET_NAMES } from './types';
import { applyNamedRanges } from './namedRanges';

// Sheet builders
import { buildInputsSheet } from './sheets/inputsSheet';
import { buildCapitalStackSheet } from './sheets/capitalStackSheet';
import { buildDebtScheduleSheet } from './sheets/debtScheduleSheet';
import { buildDepreciationSheet } from './sheets/depreciationSheet';
import { buildTaxBenefitsSheet } from './sheets/taxBenefitsSheet';
import { buildLIHTCSheet } from './sheets/lihtcSheet';
import { buildOperatingCFSheet } from './sheets/operatingCFSheet';
import { buildPIKTrackingSheet } from './sheets/pikTrackingSheet';
import { buildWaterfallSheet } from './sheets/waterfallSheet';
import { buildExitSheet } from './sheets/exitSheet';
import { buildInvestorReturnsSheet } from './sheets/investorReturnsSheet';
import { buildHDCReturnsSheet } from './sheets/hdcReturnsSheet';
import { buildSummarySheet } from './sheets/summarySheet';
import { buildValidationSheet } from './sheets/validationSheet';

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate a live Excel model with working formulas
 */
export function generateLiveExcelModel(data: LiveExcelParams): XLSX.WorkBook {
  const { params, investorResults, hdcResults, cashFlows, hdcCashFlows } = data;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Collect all named ranges
  const allNamedRanges: NamedRangeDefinition[] = [];

  // Build sheets in dependency order
  // Each sheet may reference named ranges from previous sheets

  // 1. Inputs - Foundation (no dependencies)
  const inputsResult = buildInputsSheet(params);
  XLSX.utils.book_append_sheet(wb, inputsResult.sheet, 'Inputs');
  allNamedRanges.push(...inputsResult.namedRanges);

  // 2. Capital Stack (depends on: Inputs)
  const capitalStackResult = buildCapitalStackSheet(params);
  XLSX.utils.book_append_sheet(wb, capitalStackResult.sheet, 'Capital_Stack');
  allNamedRanges.push(...capitalStackResult.namedRanges);

  // 3. Debt Schedule (depends on: Inputs, Capital_Stack)
  const debtScheduleResult = buildDebtScheduleSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, debtScheduleResult.sheet, 'Debt_Schedule');
  allNamedRanges.push(...debtScheduleResult.namedRanges);

  // 4. Depreciation (depends on: Inputs, Capital_Stack)
  const depreciationResult = buildDepreciationSheet(params);
  XLSX.utils.book_append_sheet(wb, depreciationResult.sheet, 'Depreciation');
  allNamedRanges.push(...depreciationResult.namedRanges);

  // 5. Tax Benefits (depends on: Inputs, Depreciation)
  const taxBenefitsResult = buildTaxBenefitsSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, taxBenefitsResult.sheet, 'Tax_Benefits');
  allNamedRanges.push(...taxBenefitsResult.namedRanges);

  // 6. LIHTC (depends on: Inputs, Capital_Stack, Depreciation)
  const lihtcResult = buildLIHTCSheet(params);
  XLSX.utils.book_append_sheet(wb, lihtcResult.sheet, 'LIHTC');
  allNamedRanges.push(...lihtcResult.namedRanges);

  // 7. Operating CF (depends on: Inputs, Debt_Schedule)
  const operatingCFResult = buildOperatingCFSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, operatingCFResult.sheet, 'Operating_CF');
  allNamedRanges.push(...operatingCFResult.namedRanges);

  // 8. PIK Tracking (depends on: Inputs, Capital_Stack, Operating_CF)
  const pikTrackingResult = buildPIKTrackingSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, pikTrackingResult.sheet, 'PIK_Tracking');
  allNamedRanges.push(...pikTrackingResult.namedRanges);

  // 9. Waterfall (depends on: Operating_CF, Tax_Benefits, PIK_Tracking)
  const waterfallResult = buildWaterfallSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, waterfallResult.sheet, 'Waterfall');
  allNamedRanges.push(...waterfallResult.namedRanges);

  // 10. Exit (depends on: Debt_Schedule, PIK_Tracking, Waterfall)
  const exitResult = buildExitSheet(params, investorResults);
  XLSX.utils.book_append_sheet(wb, exitResult.sheet, 'Exit');
  allNamedRanges.push(...exitResult.namedRanges);

  // 11. Investor Returns (depends on: all above)
  const investorReturnsResult = buildInvestorReturnsSheet(params, investorResults, cashFlows);
  XLSX.utils.book_append_sheet(wb, investorReturnsResult.sheet, 'Investor_Returns');
  allNamedRanges.push(...investorReturnsResult.namedRanges);

  // 12. HDC Returns (depends on: all above)
  const hdcReturnsResult = buildHDCReturnsSheet(params, hdcResults, hdcCashFlows);
  XLSX.utils.book_append_sheet(wb, hdcReturnsResult.sheet, 'HDC_Returns');
  allNamedRanges.push(...hdcReturnsResult.namedRanges);

  // 13. Summary (depends on: Investor_Returns, HDC_Returns)
  const summaryResult = buildSummarySheet(params, investorResults, hdcResults);
  XLSX.utils.book_append_sheet(wb, summaryResult.sheet, 'Summary');
  allNamedRanges.push(...summaryResult.namedRanges);

  // 14. Validation (depends on: all sheets)
  const validationResult = buildValidationSheet(params, investorResults, hdcResults, cashFlows);
  XLSX.utils.book_append_sheet(wb, validationResult.sheet, 'Validation');
  allNamedRanges.push(...validationResult.namedRanges);

  // Apply all named ranges to workbook
  applyNamedRanges(wb, allNamedRanges);

  return wb;
}

/**
 * Generate an audit workbook (backward compatible with old interface)
 */
export function generateAuditWorkbook(exportParams: AuditExportParams): XLSX.WorkBook {
  const { params, results, hdcResults, projectName } = exportParams;

  // Convert to new interface
  const liveParams: LiveExcelParams = {
    params,
    investorResults: results,
    hdcResults: hdcResults || {
      hdcCashFlows: [],
      hdcExitProceeds: 0,
      hdcPromoteProceeds: 0,
      philanthropicEquityRepayment: 0,
      hdcSubDebtRepayment: 0,
      totalHDCReturns: 0,
      hdcMultiple: 0,
      hdcIRR: 0,
      hdcFeeIncome: 0,
      hdcPhilanthropicIncome: 0,
      hdcOperatingPromoteIncome: 0,
      hdcAumFeeIncome: 0,
      hdcSubDebtCurrentPayIncome: 0,
      hdcSubDebtPIKAccrued: 0,
      hdcInitialInvestment: 0,
    },
    cashFlows: results.investorCashFlows || results.cashFlows || [],
    hdcCashFlows: hdcResults?.hdcCashFlows || [],
    projectName,
  };

  return generateLiveExcelModel(liveParams);
}

/**
 * Download a workbook as an Excel file
 */
export function downloadAuditWorkbook(workbook: XLSX.WorkBook, projectName: string = 'HDC_Project'): void {
  const date = new Date().toISOString().split('T')[0];
  const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `HDC_Live_Model_${safeName}_${date}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Export audit workbook (convenience function)
 */
export function exportAuditWorkbook(exportParams: AuditExportParams): void {
  const workbook = generateAuditWorkbook(exportParams);
  downloadAuditWorkbook(workbook, exportParams.projectName);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { LiveExcelParams, AuditExportParams, SheetResult, NamedRangeDefinition } from './types';
export { SHEET_NAMES } from './types';
