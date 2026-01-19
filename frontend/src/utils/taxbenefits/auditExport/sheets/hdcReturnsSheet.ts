/**
 * IMPL-056: Live Calculation Excel Model - HDC Returns Sheet
 *
 * Sheet 12: HDC income streams summary.
 * HDC has no initial investment, so no IRR/MOIC.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, HDCAnalysisResults, HDCCashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the HDC Returns sheet
 */
export function buildHDCReturnsSheet(
  params: CalculationParams,
  hdcResults: HDCAnalysisResults,
  hdcCashFlows: HDCCashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;

  // Header
  ws['A1'] = { t: 's', v: 'HDC RETURNS' };
  ws['A2'] = { t: 's', v: '' };

  // Column headers
  const headerRow = 3;
  ws[`A${headerRow}`] = { t: 's', v: 'Component' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year); // B, C, D, ...
    ws[`${col}${headerRow}`] = { t: 's', v: `Year ${year}` };
  }

  let currentRow = 4;

  // === OPERATING INCOME ===
  ws[`A${currentRow}`] = { t: 's', v: '=== OPERATING INCOME ===' };
  currentRow++;

  // AUM Fees Received
  ws[`A${currentRow}`] = { t: 's', v: 'AUM Fees Received' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const cf = hdcCashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.aumFeeIncome || 0, f: `AUMPaid_Y${year}` } as FormulaCell;
  }
  const aumRow = currentRow;
  currentRow++;

  // HDC Sub-Debt Current Pay
  ws[`A${currentRow}`] = { t: 's', v: 'HDC Sub-Debt Current Pay' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const cf = hdcCashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.hdcSubDebtCurrentPay || 0, f: `HDCPaid_Y${year}` } as FormulaCell;
  }
  const hdcSubDebtRow = currentRow;
  currentRow++;

  // Operating Promote
  ws[`A${currentRow}`] = { t: 's', v: 'Operating Promote' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const cf = hdcCashFlows[year - 1];
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.promoteShare || 0, f: `HDCOpPromote_Y${year}` } as FormulaCell;
  }
  const promoteRow = currentRow;
  currentRow += 2;

  // === EXIT INCOME ===
  ws[`A${currentRow}`] = { t: 's', v: '=== EXIT INCOME ===' };
  currentRow++;

  // Sub-Debt Repayment (final year only)
  ws[`A${currentRow}`] = { t: 's', v: 'Sub-Debt Repayment' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const isExitYear = year === holdPeriod;
    ws[`${col}${currentRow}`] = { t: 'n', v: isExitYear ? hdcResults.hdcSubDebtRepayment : 0, f: isExitYear ? 'HDCSubDebtAtExit' : '0' } as FormulaCell;
  }
  const subDebtRepayRow = currentRow;
  currentRow++;

  // Deferred AUM Collected (final year only)
  ws[`A${currentRow}`] = { t: 's', v: 'Deferred AUM Collected' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const isExitYear = year === holdPeriod;
    ws[`${col}${currentRow}`] = { t: 'n', v: isExitYear ? (hdcResults.accumulatedAumFeesAtExit || 0) : 0, f: isExitYear ? 'DeferredAUMAtExit' : '0' } as FormulaCell;
  }
  const deferredAUMRow = currentRow;
  currentRow++;

  // Exit Promote (final year only)
  ws[`A${currentRow}`] = { t: 's', v: 'Exit Promote' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const isExitYear = year === holdPeriod;
    ws[`${col}${currentRow}`] = { t: 'n', v: isExitYear ? hdcResults.hdcPromoteProceeds : 0, f: isExitYear ? 'HDCCatchUpPaid+HDCPromoteShare' : '0' } as FormulaCell;
  }
  const exitPromoteRow = currentRow;
  currentRow += 2;

  // TOTAL CASH FLOW
  ws[`A${currentRow}`] = { t: 's', v: 'TOTAL CASH FLOW' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const cf = hdcCashFlows[year - 1];
    const sumRange = `${col}${aumRow}:${col}${exitPromoteRow}`;
    ws[`${col}${currentRow}`] = { t: 'n', v: cf?.totalCashFlow || 0, f: `SUM(${sumRange})` } as FormulaCell;
    namedRanges.push({ name: `HDCTotalCF_Y${year}`, ref: `HDC_Returns!$${col}$${currentRow}` });
  }
  const totalCFRow = currentRow;
  currentRow++;

  // Cumulative
  ws[`A${currentRow}`] = { t: 's', v: 'Cumulative' };
  for (let year = 1; year <= holdPeriod; year++) {
    const col = String.fromCharCode(65 + year);
    const prevCol = year === 1 ? '' : String.fromCharCode(64 + year);
    const cumFormula = year === 1 ? `${col}${totalCFRow}` : `${prevCol}${currentRow}+${col}${totalCFRow}`;
    const cumValue = hdcCashFlows.slice(0, year).reduce((sum, cf) => sum + (cf?.totalCashFlow || 0), 0);
    ws[`${col}${currentRow}`] = { t: 'n', v: cumValue, f: cumFormula } as FormulaCell;
  }
  const cumulativeRow = currentRow;
  currentRow += 2;

  // === SUMMARY ===
  ws[`A${currentRow}`] = { t: 's', v: '=== SUMMARY ===' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'Total HDC Returns' };
  const lastCol = String.fromCharCode(65 + holdPeriod);
  ws[`B${currentRow}`] = { t: 'n', v: hdcResults.totalHDCReturns, f: `${lastCol}${cumulativeRow}` } as FormulaCell;
  namedRanges.push({ name: 'TotalHDCReturns', ref: `HDC_Returns!$B$${currentRow}` });
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Initial Investment' };
  ws[`B${currentRow}`] = { t: 'n', v: 0 };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC Multiple' };
  ws[`B${currentRow}`] = { t: 's', v: 'N/A (no investment)' };
  currentRow++;

  ws[`A${currentRow}`] = { t: 's', v: 'HDC IRR' };
  ws[`B${currentRow}`] = { t: 's', v: 'N/A (no investment)' };

  // Set sheet range
  const finalCol = String.fromCharCode(65 + holdPeriod);
  ws['!ref'] = `A1:${finalCol}${currentRow}`;

  // Set column widths
  const cols = [{ wch: 25 }]; // Label column
  for (let i = 0; i < holdPeriod; i++) {
    cols.push({ wch: 12 });
  }
  ws['!cols'] = cols;

  return { sheet: ws, namedRanges };
}
