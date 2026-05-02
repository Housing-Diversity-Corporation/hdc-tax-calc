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

import { calculateHDCAnalysis } from '../hdcAnalysis';
// IMPL-115: Import computeTimeline for rawParams-based timing (not affected by normalization)
import { computeTimeline } from '../computeTimeline';
import { ComputedTimeline } from '../../../types/taxbenefits';

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
import { buildTaxUtilizationSheet } from './sheets/taxUtilizationSheet';
import { buildTimingGanttSheet } from './sheets/timingGanttSheet';

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
    noiGrowthRate: rawParams.noiGrowthRate ?? 3,
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

  // IMPL-115: Compute timeline from rawParams (before normalization) for timing-aware sheets
  // Must be computed from rawParams because normalization forces constructionDelayMonths=0
  const rawTimeline: ComputedTimeline | null = rawParams.investmentDate
    ? computeTimeline(
        rawParams.investmentDate,
        rawParams.constructionDelayMonths || 0,
        rawParams.pisDateOverride || null,
        rawParams.ozEnabled !== false,
        rawParams.exitExtensionMonths || 0,
        rawParams.electDeferCreditPeriod || false,
        rawParams.ozVersion || '2.0'
      )
    : null;

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

  // IMPL-137/ISS-070: Use the passed-in engine results (mainAnalysisResults) directly.
  // Previous approach recalculated from normalized params (placedInServiceMonth=1,
  // constructionDelayMonths=0) which diverged from the UI's actual engine output.
  // The passed-in results ARE the live engine output — single source of truth.
  const investorResults = data.investorResults;
  const cashFlows = investorResults.investorCashFlows || [];
  const holdPeriod = params.holdPeriod || 10;

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
    philanthropicEquityPct: params.philanthropicEquityPct || 0,
    hdcFeeRate: params.hdcFeeRate,
    hdcFee: params.hdcFee,
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
  const inputsResult = buildInputsSheet(params, rawTimeline);
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
  // IMPL-161: Pass rawTimeline per LIVE_EXCEL_SYNC_PROTOCOL Rule 4
  const depreciationResult = buildDepreciationSheet(params, rawTimeline);
  XLSX.utils.book_append_sheet(wb, depreciationResult.sheet, 'Depreciation');
  allNamedRanges.push(...depreciationResult.namedRanges);

  // 5. Tax Benefits (depends on: Inputs, Depreciation)
  const taxBenefitsResult = buildTaxBenefitsSheet(params, cashFlows);
  XLSX.utils.book_append_sheet(wb, taxBenefitsResult.sheet, 'Tax_Benefits');
  allNamedRanges.push(...taxBenefitsResult.namedRanges);

  // 6. LIHTC (depends on: Inputs, Capital_Stack, Depreciation)
  // IMPL-161: Pass rawTimeline per LIVE_EXCEL_SYNC_PROTOCOL Rule 4
  const lihtcResult = buildLIHTCSheet(params, rawTimeline);
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
  const investorReturnsResult = buildInvestorReturnsSheet(params, investorResults, cashFlows, rawTimeline);
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

  // 14. Tax Utilization (conditional - only when taxUtilization exists)
  // Phase A2: Income-adjusted utilization analysis
  console.log('[TAX_UTIL_EXPORT] taxUtilization exists:', !!investorResults.taxUtilization);
  if (investorResults.taxUtilization) {
    // Calculate totalInvestment same as Summary sheet
    const syndicationOffset = investorResults.syndicatedEquityOffset || 0;
    const syndicationYear = investorResults.stateLIHTCSyndicationYear ?? params.stateLIHTCSyndicationYear ?? 0;
    const investorEquityGross = params.projectCost * params.investorEquityPct / 100;
    const investorEquityNet = investorEquityGross - syndicationOffset;
    const investorSubDebt = params.projectCost * (params.investorSubDebtPct || 0) / 100;
    const totalInvestmentForUtil = (syndicationYear === 0 ? investorEquityNet : investorEquityGross) + investorSubDebt;

    const taxUtilizationResult = buildTaxUtilizationSheet(investorResults, totalInvestmentForUtil, params);
    XLSX.utils.book_append_sheet(wb, taxUtilizationResult.sheet, 'Tax_Utilization');
    allNamedRanges.push(...taxUtilizationResult.namedRanges);
  }

  // 15. Timing Gantt Chart — uses rawParams + ComputedTimeline for actual timing
  const timingGanttResult = buildTimingGanttSheet(rawParams, rawTimeline);
  XLSX.utils.book_append_sheet(wb, timingGanttResult.sheet, 'Timing_Gantt');
  allNamedRanges.push(...timingGanttResult.namedRanges);

  // 16. Validation (depends on: all sheets)
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
