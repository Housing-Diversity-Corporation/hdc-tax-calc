/**
 * IMPL-056: Live Calculation Excel Model - Waterfall Sheet
 *
 * Sheet 9: DSCR-enforced soft pay distribution waterfall.
 * Priority order: Outside Inv → HDC → Investor → AUM Fee → Promote Split
 */

import * as XLSX from 'xlsx';
import { CalculationParams, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Waterfall sheet with DSCR-enforced distributions
 */
export function buildWaterfallSheet(
  params: CalculationParams,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const promotePct = (100 - params.investorPromoteShare) / 100;
  const investorPct = params.investorPromoteShare / 100;

  // Header
  ws['A1'] = { t: 's', v: 'OPERATING WATERFALL' };
  ws['A2'] = { t: 's', v: '' };

  // Column headers
  ws['A3'] = { t: 's', v: 'Year' };
  ws['B3'] = { t: 's', v: 'Available Cash' };
  ws['C3'] = { t: 's', v: 'Outside Pay Due' };
  ws['D3'] = { t: 's', v: 'Outside Paid' };
  ws['E3'] = { t: 's', v: 'After Outside' };
  ws['F3'] = { t: 's', v: 'HDC Pay Due' };
  ws['G3'] = { t: 's', v: 'HDC Paid' };
  ws['H3'] = { t: 's', v: 'After HDC' };
  ws['I3'] = { t: 's', v: 'Inv Pay Due' };
  ws['J3'] = { t: 's', v: 'Inv Paid' };
  ws['K3'] = { t: 's', v: 'After Inv' };
  ws['L3'] = { t: 's', v: 'AUM Due' };
  ws['M3'] = { t: 's', v: 'AUM Paid' };
  ws['N3'] = { t: 's', v: 'After AUM' };
  ws['O3'] = { t: 's', v: 'Inv Op Cash' };
  ws['P3'] = { t: 's', v: 'HDC Promote' };

  // Year-by-year waterfall
  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3; // Data starts at row 4
    const cf = cashFlows[year - 1];

    ws[`A${row}`] = { t: 'n', v: year };

    // Available Cash (from Operating_CF)
    const availableCash = cf ? Math.max(0, cf.noi - (cf.hardDebtService || 0) * 1.05) : 0;
    ws[`B${row}`] = { t: 'n', v: availableCash, f: `AvailForSoftPay_Y${year}` } as FormulaCell;

    // Outside Investor Current Pay Due
    ws[`C${row}`] = { t: 'n', v: cf?.outsideInvestorCurrentPay || 0, f: `OutsideCurrentPayDue_Y${year}` } as FormulaCell;

    // Outside Investor Paid (min of due and available)
    const outsidePaid = Math.min(availableCash, cf?.outsideInvestorCurrentPay || 0);
    ws[`D${row}`] = { t: 'n', v: outsidePaid, f: `MIN(B${row},C${row})` } as FormulaCell;
    namedRanges.push({ name: `OutsidePaid_Y${year}`, ref: `Waterfall!$D$${row}` });

    // After Outside
    const afterOutside = availableCash - outsidePaid;
    ws[`E${row}`] = { t: 'n', v: afterOutside, f: `B${row}-D${row}` } as FormulaCell;

    // HDC Current Pay Due
    ws[`F${row}`] = { t: 'n', v: cf?.hdcSubDebtPIKAccrued || 0, f: `HDCCurrentPayDue_Y${year}` } as FormulaCell;

    // HDC Paid
    const hdcPaid = Math.min(afterOutside, cf?.hdcSubDebtPIKAccrued || 0);
    ws[`G${row}`] = { t: 'n', v: hdcPaid, f: `MIN(E${row},F${row})` } as FormulaCell;
    namedRanges.push({ name: `HDCPaid_Y${year}`, ref: `Waterfall!$G$${row}` });

    // After HDC
    const afterHDC = afterOutside - hdcPaid;
    ws[`H${row}`] = { t: 'n', v: afterHDC, f: `E${row}-G${row}` } as FormulaCell;

    // Investor Current Pay Due
    ws[`I${row}`] = { t: 'n', v: cf?.investorSubDebtInterestReceived || 0, f: `InvCurrentPayDue_Y${year}` } as FormulaCell;

    // Investor Paid
    const invPaid = Math.min(afterHDC, cf?.investorSubDebtInterestReceived || 0);
    ws[`J${row}`] = { t: 'n', v: invPaid, f: `MIN(H${row},I${row})` } as FormulaCell;
    namedRanges.push({ name: `InvSubDebtPaid_Y${year}`, ref: `Waterfall!$J$${row}` });

    // After Investor
    const afterInv = afterHDC - invPaid;
    ws[`K${row}`] = { t: 'n', v: afterInv, f: `H${row}-J${row}` } as FormulaCell;

    // AUM Fee Due
    ws[`L${row}`] = { t: 'n', v: cf?.aumFeeAmount || 0, f: `AUMFeeDue_Y${year}` } as FormulaCell;

    // AUM Paid
    const aumPaid = Math.min(afterInv, cf?.aumFeePaid || 0);
    ws[`M${row}`] = { t: 'n', v: aumPaid, f: `MIN(K${row},L${row})` } as FormulaCell;
    namedRanges.push({ name: `AUMPaid_Y${year}`, ref: `Waterfall!$M$${row}` });

    // After AUM
    const afterAUM = afterInv - aumPaid;
    ws[`N${row}`] = { t: 'n', v: afterAUM, f: `K${row}-M${row}` } as FormulaCell;

    // Investor Operating Cash (after promote split)
    const invOpCash = afterAUM * investorPct;
    ws[`O${row}`] = { t: 'n', v: invOpCash, f: `N${row}*(1-PromotePct/100)` } as FormulaCell;
    namedRanges.push({ name: `InvOpCash_Y${year}`, ref: `Waterfall!$O$${row}` });

    // HDC Operating Promote
    const hdcPromote = afterAUM * promotePct;
    ws[`P${row}`] = { t: 'n', v: hdcPromote, f: `N${row}*PromotePct/100` } as FormulaCell;
    namedRanges.push({ name: `HDCOpPromote_Y${year}`, ref: `Waterfall!$P$${row}` });
  }

  // Totals row
  const totalRow = holdPeriod + 5;
  ws[`A${totalRow}`] = { t: 's', v: 'TOTALS' };
  ws[`B${totalRow}`] = { t: 'n', v: 0, f: `SUM(B4:B${holdPeriod + 3})` } as FormulaCell;
  ws[`D${totalRow}`] = { t: 'n', v: 0, f: `SUM(D4:D${holdPeriod + 3})` } as FormulaCell;
  ws[`G${totalRow}`] = { t: 'n', v: 0, f: `SUM(G4:G${holdPeriod + 3})` } as FormulaCell;
  ws[`J${totalRow}`] = { t: 'n', v: 0, f: `SUM(J4:J${holdPeriod + 3})` } as FormulaCell;
  ws[`M${totalRow}`] = { t: 'n', v: 0, f: `SUM(M4:M${holdPeriod + 3})` } as FormulaCell;
  ws[`O${totalRow}`] = { t: 'n', v: 0, f: `SUM(O4:O${holdPeriod + 3})` } as FormulaCell;
  ws[`P${totalRow}`] = { t: 'n', v: 0, f: `SUM(P4:P${holdPeriod + 3})` } as FormulaCell;

  namedRanges.push({ name: 'TotalInvOpCash', ref: `Waterfall!$O$${totalRow}` });
  namedRanges.push({ name: 'TotalHDCOpPromote', ref: `Waterfall!$P$${totalRow}` });

  // Set sheet range
  ws['!ref'] = `A1:P${totalRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // Year
    { wch: 12 }, // Available Cash
    { wch: 12 }, // Outside Pay Due
    { wch: 10 }, // Outside Paid
    { wch: 10 }, // After Outside
    { wch: 10 }, // HDC Pay Due
    { wch: 10 }, // HDC Paid
    { wch: 10 }, // After HDC
    { wch: 10 }, // Inv Pay Due
    { wch: 10 }, // Inv Paid
    { wch: 10 }, // After Inv
    { wch: 10 }, // AUM Due
    { wch: 10 }, // AUM Paid
    { wch: 10 }, // After AUM
    { wch: 12 }, // Inv Op Cash
    { wch: 12 }, // HDC Promote
  ];

  return { sheet: ws, namedRanges };
}
