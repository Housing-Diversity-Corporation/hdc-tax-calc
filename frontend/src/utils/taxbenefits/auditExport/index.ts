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

// ISS-070f: Import calculation functions to recalculate fresh results at export time
import { calculateFullInvestorAnalysis } from '../calculations';
import { calculateHDCAnalysis } from '../hdcAnalysis';

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
  const { params: rawParams } = data;

  // ISS-070g: Normalize params to ensure consistent defaults between Inputs sheet and calculation
  // The Inputs sheet uses `|| default` which treats 0, null, undefined, "" as falsy
  // The calculation engine uses default parameters which only apply for undefined
  // This normalization ensures both use the same effective values
  const params: CalculationParams = {
    ...rawParams,
    // Apply the same defaults that inputsSheet.ts uses (see lines 28-35)
    noiGrowthRate: rawParams.noiGrowthRate || 3,
    holdPeriod: rawParams.holdPeriod || 10,
    // ISS-070L: Force immediate stabilization for export to match Excel formulas
    // The Excel model represents investor's 10-year hold period starting from stabilized operations
    // Construction delay is a pre-stabilization development consideration not modeled in Excel
    placedInServiceMonth: 1,
    constructionDelayMonths: 0,
    // Ensure other critical params have consistent defaults
    predevelopmentCosts: rawParams.predevelopmentCosts || 0,
    seniorDebtAmortization: rawParams.seniorDebtAmortization || 35,
    philDebtAmortization: rawParams.philDebtAmortization || 35,
  };

  // ISS-070g/i: Diagnostic logging to trace params discrepancy
  const rawParamKeys = Object.keys(rawParams).filter(k => rawParams[k as keyof typeof rawParams] !== undefined);
  console.log('[ISS-070i] params object summary:', {
    totalKeys: rawParamKeys.length,
    definedKeys: rawParamKeys.length,
    // Core params that must be present for calculation
    hasProjectCost: rawParams.projectCost !== undefined,
    hasLandValue: rawParams.landValue !== undefined,
    hasSeniorDebtPct: rawParams.seniorDebtPct !== undefined,
    hasInvestorEquityPct: rawParams.investorEquityPct !== undefined,
  });
  // ISS-070k: Log FULL params objects to see all properties
  console.log('[ISS-070k] rawParams FULL object:', rawParams);
  console.log('[ISS-070k] rawParams key count:', Object.keys(rawParams).length);
  console.log('[ISS-070k] normalized params FULL object:', params);
  console.log('[ISS-070k] normalized params key count:', Object.keys(params).length);
  // Critical params check
  console.log('[ISS-070k] Critical params for cash flow:', {
    yearOneNOI: params.yearOneNOI,
    seniorDebtPct: params.seniorDebtPct,
    seniorDebtRate: params.seniorDebtRate,
    seniorDebtAmortization: params.seniorDebtAmortization,
    investorEquityPct: params.investorEquityPct,
    projectCost: params.projectCost,
    holdPeriod: params.holdPeriod,
  });

  // ISS-070f: Recalculate fresh results from params to avoid stale React state
  // This ensures Column B (Excel formulas) and Column C (Platform values) match
  // ISS-070N: Log params immediately before calculation to compare with inputsSheet
  console.log('[EXPORT ISS-070N] Params going to calculateFullInvestorAnalysis:', {
    projectCost: params.projectCost,
    yearOneNOI: params.yearOneNOI,
    seniorDebtPct: params.seniorDebtPct,
    noiGrowthRate: params.noiGrowthRate,
  });
  // ISS-070Q: Pass isExport flag to enable export-only logging
  const investorResults = calculateFullInvestorAnalysis(params, { isExport: true });
  const cashFlows = investorResults.investorCashFlows || [];
  // ISS-070N: Log what we got back from calculation
  // ISS-070P: Verify calculation used correct params by checking results
  const expectedSeniorDebt = params.projectCost * (params.seniorDebtPct || 0) / 100;
  const expectedInvestorEquity = params.projectCost * (params.investorEquityPct || 0) / 100;
  console.log('[EXPORT ISS-070P] Verification - params vs results:', {
    // What we passed in
    'params.projectCost': params.projectCost,
    'params.seniorDebtPct': params.seniorDebtPct,
    'params.investorEquityPct': params.investorEquityPct,
    'params.yearOneNOI': params.yearOneNOI,
    // What we expect based on params
    expectedSeniorDebt,
    expectedInvestorEquity,
    // What the calculation returned
    'results.investorEquity': investorResults.investorEquity,
    'cashFlows[0].noi': cashFlows[0]?.noi,
    'cashFlows[0].hardDebtService': cashFlows[0]?.hardDebtService,
    // Mismatch detection
    equityMatches: Math.abs((investorResults.investorEquity || 0) - expectedInvestorEquity) < 0.01,
    noiMatches: Math.abs((cashFlows[0]?.noi || 0) - params.yearOneNOI) < 0.01,
  });

  // ISS-070i: Comprehensive structure logging to investigate property names
  console.log('[ISS-070i] investorResults top-level keys:', Object.keys(investorResults).sort());
  console.log('[ISS-070i] cashFlows array length:', cashFlows.length);

  const cf0 = cashFlows[0];
  if (cf0) {
    console.log('[ISS-070i] cashFlows[0] keys:', Object.keys(cf0).sort());
    console.log('[ISS-070i] cashFlows[0] FULL object:', cf0);
  } else {
    console.log('[ISS-070i] WARNING: cashFlows[0] is undefined!');
  }

  // ISS-070g/h: Log calculation results for comparison
  const holdPeriod = params.holdPeriod;
  const y10NOI = cashFlows[holdPeriod - 1]?.noi || 0;
  console.log('[ISS-070g] Calculation results:', {
    exitValue: investorResults.exitValue,
    y10NOI,
    y1NOI: cashFlows[0]?.noi,
    impliedGrowth: cashFlows[0]?.noi ? ((y10NOI / cashFlows[0].noi) ** (1 / (holdPeriod - 1)) - 1) * 100 : 'N/A',
  });

  // ISS-070h: Log cash flow properties that extractPlatformValues reads
  console.log('[ISS-070h] Cash flow Y1 properties:', {
    dscr: cashFlows[0]?.dscr,
    hardDebtService: cashFlows[0]?.hardDebtService,
    noi: cashFlows[0]?.noi,
    taxBenefit: cashFlows[0]?.taxBenefit,
    totalCashFlow: cashFlows[0]?.totalCashFlow,
  });
  console.log('[ISS-070h] InvestorResults key properties:', {
    investorEquity: investorResults.investorEquity,
    exitValue: investorResults.exitValue,
    exitProceeds: investorResults.exitProceeds,
    remainingDebtAtExit: investorResults.remainingDebtAtExit,
    totalInvestment: investorResults.totalInvestment,
    totalReturns: investorResults.totalReturns,
    multiple: investorResults.multiple,
    irr: investorResults.irr,
  });

  // Build HDC results from fresh investor calculation
  const hdcResults = calculateHDCAnalysis({
    projectCost: params.projectCost,
    predevelopmentCosts: params.predevelopmentCosts,
    yearOneNOI: params.yearOneNOI,
    noiGrowthRate: params.noiGrowthRate,
    exitCapRate: params.exitCapRate,
    investorPromoteShare: params.investorPromoteShare,
    hdcSubDebtPct: params.hdcSubDebtPct,
    hdcSubDebtPikRate: params.hdcSubDebtPikRate,
    pikCurrentPayEnabled: params.pikCurrentPayEnabled,
    pikCurrentPayPct: params.pikCurrentPayPct,
    holdPeriod: params.holdPeriod,
    aumFeeEnabled: params.aumFeeEnabled,
    aumFeeRate: params.aumFeeRate,
    philCurrentPayEnabled: params.philCurrentPayEnabled,
    philCurrentPayPct: params.philCurrentPayPct,
    outsideInvestorSubDebtPct: params.outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate: params.outsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled: params.outsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct: params.outsideInvestorPikCurrentPayPct,
    investorSubDebtPct: params.investorSubDebtPct,
    investorSubDebtPikRate: params.investorSubDebtPikRate,
    investorPikCurrentPayEnabled: params.investorPikCurrentPayEnabled,
    investorPikCurrentPayPct: params.investorPikCurrentPayPct,
    seniorDebtPct: params.seniorDebtPct,
    seniorDebtRate: params.seniorDebtRate,
    seniorDebtAmortization: params.seniorDebtAmortization,
    philanthropicDebtPct: params.philanthropicDebtPct,
    philanthropicDebtRate: params.philanthropicDebtRate,
    philDebtAmortization: params.philDebtAmortization,
    interestReserveEnabled: params.interestReserveEnabled,
    interestReserveMonths: params.interestReserveMonths,
    investorEquity: investorResults.investorEquity,
    investorCashFlows: cashFlows,
  });
  const hdcCashFlows = hdcResults.hdcCashFlows || [];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Collect all named ranges
  const allNamedRanges: NamedRangeDefinition[] = [];

  // Build sheets in dependency order
  // Each sheet may reference named ranges from previous sheets

  // 1. Inputs - Foundation (no dependencies)
  // ISS-070M: Log params being passed to inputs sheet to verify same object
  console.log('[ISS-070M] Params going to buildInputsSheet:', {
    projectCost: params.projectCost,
    yearOneNOI: params.yearOneNOI,
    seniorDebtPct: params.seniorDebtPct,
  });
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
