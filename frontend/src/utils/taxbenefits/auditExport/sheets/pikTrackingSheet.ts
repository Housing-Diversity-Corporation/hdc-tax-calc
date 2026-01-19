/**
 * IMPL-056: Live Calculation Excel Model - PIK Tracking Sheet
 *
 * Sheet 8: Track all 4 PIK debt layers year-by-year.
 * - HDC Sub-Debt PIK
 * - Investor Sub-Debt PIK
 * - Outside Investor PIK
 * - AUM Fee Deferral
 */

import * as XLSX from 'xlsx';
import { CalculationParams, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the PIK Tracking sheet with all 4 PIK layers
 */
export function buildPIKTrackingSheet(
  params: CalculationParams,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;

  // Calculate initial amounts
  const hdcSubDebt = projectCost * (params.hdcSubDebtPct || 0) / 100;
  const investorSubDebt = projectCost * (params.investorSubDebtPct || 0) / 100;
  const outsideSubDebt = projectCost * (params.outsideInvestorSubDebtPct || 0) / 100;
  const investorEquity = projectCost * params.investorEquityPct / 100;

  // PIK rates
  const hdcPIKRate = params.hdcSubDebtPikRate || 8;
  const invPIKRate = params.investorSubDebtPikRate || 8;
  const outsidePIKRate = params.outsideInvestorSubDebtPikRate || 8;
  const aumRate = params.aumFeeRate || 1;
  const aumDeferredRate = params.hdcDeferredInterestRate || 8;

  // Current pay settings
  const hdcCurrentPayEnabled = params.pikCurrentPayEnabled;
  const hdcCurrentPayPct = params.pikCurrentPayPct || 0;
  const invCurrentPayEnabled = params.investorPikCurrentPayEnabled;
  const invCurrentPayPct = params.investorPikCurrentPayPct || 0;
  const outsideCurrentPayEnabled = params.outsideInvestorPikCurrentPayEnabled;
  const outsideCurrentPayPct = params.outsideInvestorPikCurrentPayPct || 0;
  const aumCurrentPayEnabled = params.aumCurrentPayEnabled;
  const aumCurrentPayPct = params.aumCurrentPayPct || 0;

  let currentRow = 1;

  // === HDC SUB-DEBT PIK ===
  ws[`A${currentRow}`] = { t: 's', v: '=== HDC SUB-DEBT PIK ===' };
  currentRow += 2;

  // HDC Headers
  ws[`A${currentRow}`] = { t: 's', v: 'Year' };
  ws[`B${currentRow}`] = { t: 's', v: 'BOY Balance' };
  ws[`C${currentRow}`] = { t: 's', v: 'Interest Due' };
  ws[`D${currentRow}`] = { t: 's', v: 'Current Pay' };
  ws[`E${currentRow}`] = { t: 's', v: 'PIK Accrued' };
  ws[`F${currentRow}`] = { t: 's', v: 'EOY Balance' };
  const hdcHeaderRow = currentRow;
  currentRow++;

  let hdcBalance = hdcSubDebt;
  for (let year = 1; year <= holdPeriod; year++) {
    const row = hdcHeaderRow + year;
    const cf = cashFlows[year - 1];

    ws[`A${row}`] = { t: 'n', v: year };

    // BOY Balance
    const boyFormula = year === 1 ? 'HDCSubDebt' : `F${row - 1}`;
    ws[`B${row}`] = { t: 'n', v: hdcBalance, f: boyFormula } as FormulaCell;

    // Interest Due
    const interestDue = hdcBalance * hdcPIKRate / 100;
    ws[`C${row}`] = { t: 'n', v: interestDue, f: `B${row}*HDCSubDebtPIKRate/100` } as FormulaCell;

    // Current Pay Due
    const currentPayDue = hdcCurrentPayEnabled ? interestDue * hdcCurrentPayPct / 100 : 0;
    ws[`D${row}`] = { t: 'n', v: currentPayDue, f: `IF(HDCPIKCurrentPayEnabled,C${row}*HDCPIKCurrentPayPct/100,0)` } as FormulaCell;
    namedRanges.push({ name: `HDCCurrentPayDue_Y${year}`, ref: `PIK_Tracking!$D$${row}` });

    // PIK Accrued
    const pikAccrued = interestDue - currentPayDue;
    ws[`E${row}`] = { t: 'n', v: pikAccrued, f: `C${row}-D${row}` } as FormulaCell;

    // EOY Balance
    hdcBalance = hdcBalance + pikAccrued;
    ws[`F${row}`] = { t: 'n', v: hdcBalance, f: `B${row}+E${row}` } as FormulaCell;

    currentRow++;
  }
  namedRanges.push({ name: 'HDCSubDebtAtExit', ref: `PIK_Tracking!$F$${hdcHeaderRow + holdPeriod}` });

  currentRow += 2;

  // === INVESTOR SUB-DEBT PIK ===
  ws[`A${currentRow}`] = { t: 's', v: '=== INVESTOR SUB-DEBT PIK ===' };
  currentRow += 2;

  ws[`A${currentRow}`] = { t: 's', v: 'Year' };
  ws[`B${currentRow}`] = { t: 's', v: 'BOY Balance' };
  ws[`C${currentRow}`] = { t: 's', v: 'Interest Due' };
  ws[`D${currentRow}`] = { t: 's', v: 'Current Pay' };
  ws[`E${currentRow}`] = { t: 's', v: 'PIK Accrued' };
  ws[`F${currentRow}`] = { t: 's', v: 'EOY Balance' };
  const invHeaderRow = currentRow;
  currentRow++;

  let invBalance = investorSubDebt;
  for (let year = 1; year <= holdPeriod; year++) {
    const row = invHeaderRow + year;

    ws[`A${row}`] = { t: 'n', v: year };

    const boyFormula = year === 1 ? 'InvestorSubDebt' : `F${row - 1}`;
    ws[`B${row}`] = { t: 'n', v: invBalance, f: boyFormula } as FormulaCell;

    const interestDue = invBalance * invPIKRate / 100;
    ws[`C${row}`] = { t: 'n', v: interestDue, f: `B${row}*InvestorSubDebtPIKRate/100` } as FormulaCell;

    const currentPayDue = invCurrentPayEnabled ? interestDue * invCurrentPayPct / 100 : 0;
    ws[`D${row}`] = { t: 'n', v: currentPayDue, f: `IF(InvestorPIKCurrentPayEnabled,C${row}*InvestorPIKCurrentPayPct/100,0)` } as FormulaCell;
    namedRanges.push({ name: `InvCurrentPayDue_Y${year}`, ref: `PIK_Tracking!$D$${row}` });

    const pikAccrued = interestDue - currentPayDue;
    ws[`E${row}`] = { t: 'n', v: pikAccrued, f: `C${row}-D${row}` } as FormulaCell;

    invBalance = invBalance + pikAccrued;
    ws[`F${row}`] = { t: 'n', v: invBalance, f: `B${row}+E${row}` } as FormulaCell;

    currentRow++;
  }
  namedRanges.push({ name: 'InvestorSubDebtAtExit', ref: `PIK_Tracking!$F$${invHeaderRow + holdPeriod}` });

  currentRow += 2;

  // === OUTSIDE INVESTOR PIK ===
  ws[`A${currentRow}`] = { t: 's', v: '=== OUTSIDE INVESTOR PIK ===' };
  currentRow += 2;

  ws[`A${currentRow}`] = { t: 's', v: 'Year' };
  ws[`B${currentRow}`] = { t: 's', v: 'BOY Balance' };
  ws[`C${currentRow}`] = { t: 's', v: 'Interest Due' };
  ws[`D${currentRow}`] = { t: 's', v: 'Current Pay' };
  ws[`E${currentRow}`] = { t: 's', v: 'PIK Accrued' };
  ws[`F${currentRow}`] = { t: 's', v: 'EOY Balance' };
  const outsideHeaderRow = currentRow;
  currentRow++;

  let outsideBalance = outsideSubDebt;
  for (let year = 1; year <= holdPeriod; year++) {
    const row = outsideHeaderRow + year;

    ws[`A${row}`] = { t: 'n', v: year };

    const boyFormula = year === 1 ? 'OutsideSubDebt' : `F${row - 1}`;
    ws[`B${row}`] = { t: 'n', v: outsideBalance, f: boyFormula } as FormulaCell;

    const interestDue = outsideBalance * outsidePIKRate / 100;
    ws[`C${row}`] = { t: 'n', v: interestDue, f: `B${row}*OutsidePIKRate/100` } as FormulaCell;

    const currentPayDue = outsideCurrentPayEnabled ? interestDue * outsideCurrentPayPct / 100 : 0;
    ws[`D${row}`] = { t: 'n', v: currentPayDue, f: `IF(OutsideCurrentPayEnabled,C${row}*OutsideCurrentPayPct/100,0)` } as FormulaCell;
    namedRanges.push({ name: `OutsideCurrentPayDue_Y${year}`, ref: `PIK_Tracking!$D$${row}` });

    const pikAccrued = interestDue - currentPayDue;
    ws[`E${row}`] = { t: 'n', v: pikAccrued, f: `C${row}-D${row}` } as FormulaCell;

    outsideBalance = outsideBalance + pikAccrued;
    ws[`F${row}`] = { t: 'n', v: outsideBalance, f: `B${row}+E${row}` } as FormulaCell;

    currentRow++;
  }
  namedRanges.push({ name: 'OutsideSubDebtAtExit', ref: `PIK_Tracking!$F$${outsideHeaderRow + holdPeriod}` });

  currentRow += 2;

  // === AUM FEE DEFERRAL ===
  ws[`A${currentRow}`] = { t: 's', v: '=== AUM FEE DEFERRAL ===' };
  currentRow += 2;

  ws[`A${currentRow}`] = { t: 's', v: 'Year' };
  ws[`B${currentRow}`] = { t: 's', v: 'AUM Fee Due' };
  ws[`C${currentRow}`] = { t: 's', v: 'AUM Paid' };
  ws[`D${currentRow}`] = { t: 's', v: 'Deferred' };
  ws[`E${currentRow}`] = { t: 's', v: 'Interest on Def' };
  ws[`F${currentRow}`] = { t: 's', v: 'Deferred Balance' };
  const aumHeaderRow = currentRow;
  currentRow++;

  let aumDeferredBalance = 0;
  for (let year = 1; year <= holdPeriod; year++) {
    const row = aumHeaderRow + year;
    const cf = cashFlows[year - 1];

    ws[`A${row}`] = { t: 'n', v: year };

    // AUM Fee Due
    const aumFeeDue = investorEquity * aumRate / 100;
    ws[`B${row}`] = { t: 'n', v: aumFeeDue, f: 'InvestorEquity*AUMFeePct/100' } as FormulaCell;
    namedRanges.push({ name: `AUMFeeDue_Y${year}`, ref: `PIK_Tracking!$B$${row}` });

    // AUM Paid (from waterfall - use pre-calculated or formula)
    const aumPaid = cf?.aumFeePaid || (aumCurrentPayEnabled ? aumFeeDue * aumCurrentPayPct / 100 : 0);
    ws[`C${row}`] = { t: 'n', v: aumPaid, f: `IF(AUMCurrentPayEnabled,B${row}*AUMCurrentPayPct/100,0)` } as FormulaCell;

    // Deferred this year
    const deferred = aumFeeDue - aumPaid;
    ws[`D${row}`] = { t: 'n', v: deferred, f: `B${row}-C${row}` } as FormulaCell;

    // Interest on prior deferred
    const interestOnDeferred = year === 1 ? 0 : aumDeferredBalance * aumDeferredRate / 100;
    const interestFormula = year === 1 ? '0' : `F${row - 1}*AUMDeferredRate/100`;
    ws[`E${row}`] = { t: 'n', v: interestOnDeferred, f: interestFormula } as FormulaCell;

    // Deferred Balance
    aumDeferredBalance = (year === 1 ? 0 : aumDeferredBalance) + deferred + interestOnDeferred;
    const balanceFormula = year === 1 ? `D${row}` : `F${row - 1}+D${row}+E${row}`;
    ws[`F${row}`] = { t: 'n', v: aumDeferredBalance, f: balanceFormula } as FormulaCell;

    currentRow++;
  }
  namedRanges.push({ name: 'DeferredAUMAtExit', ref: `PIK_Tracking!$F$${aumHeaderRow + holdPeriod}` });

  // Set sheet range
  ws['!ref'] = `A1:F${currentRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Year
    { wch: 15 }, // BOY Balance
    { wch: 12 }, // Interest Due
    { wch: 12 }, // Current Pay
    { wch: 12 }, // PIK Accrued
    { wch: 15 }, // EOY Balance
  ];

  return { sheet: ws, namedRanges };
}
