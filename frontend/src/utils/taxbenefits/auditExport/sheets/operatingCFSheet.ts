/**
 * IMPL-056: Live Calculation Excel Model - Operating Cash Flow Sheet
 * ISS-037: Added DSCR breakdown columns (Must-Pay DSCR, Phil DSCR)
 *
 * Sheet 7: Year-by-year operating cash flows with DSCR tracking.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Operating Cash Flow sheet
 */
export function buildOperatingCFSheet(
  params: CalculationParams,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const yearOneNOI = params.yearOneNOI;
  const noiGrowth = params.revenueGrowth / 100;

  // Header
  ws['A1'] = { t: 's', v: 'OPERATING CASH FLOW' };
  ws['A2'] = { t: 's', v: '' };

  // ISS-037: Check if DSCR breakdown should be shown
  const showDSCRBreakdown = params.philCurrentPayEnabled || params.pabEnabled;

  // Column headers
  ws['A3'] = { t: 's', v: 'Year' };
  ws['B3'] = { t: 's', v: 'Occupancy %' };
  ws['C3'] = { t: 's', v: 'NOI' };
  ws['D3'] = { t: 's', v: 'Hard Debt Service' };
  ws['E3'] = { t: 's', v: 'Cash After Hard DS' };
  ws['F3'] = { t: 's', v: 'DSCR' };
  ws['G3'] = { t: 's', v: 'Req for 1.05x' };
  ws['H3'] = { t: 's', v: 'Available for Soft Pay' };

  // ISS-037: DSCR breakdown columns (when Phil current pay or PAB enabled)
  if (showDSCRBreakdown) {
    ws['I3'] = { t: 's', v: 'Must-Pay DS' };
    ws['J3'] = { t: 's', v: 'Must-Pay DSCR' };
    ws['K3'] = { t: 's', v: 'Phil DSCR' };
  }

  // Year-by-year data
  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3; // Data starts at row 4
    const cf = cashFlows[year - 1];

    ws[`A${row}`] = { t: 'n', v: year };

    // Occupancy (simplified: assume stabilized after lease-up)
    const occupancy = cf?.effectiveOccupancy || 95;
    const occFormula = 'MIN(StabilizedOccupancy,A' + row + '*12/LeaseUpMonths*StabilizedOccupancy)/100';
    ws[`B${row}`] = { t: 'n', v: occupancy / 100, f: year === 1 ? occFormula : 'StabilizedOccupancy/100' } as FormulaCell;

    // NOI
    const noi = cf?.noi || yearOneNOI * Math.pow(1 + noiGrowth, year - 1);
    const noiFormula = year === 1
      ? 'YearOneNOI'
      : `C${row - 1}*(1+NOIGrowthRate/100)`;
    ws[`C${row}`] = { t: 'n', v: noi, f: noiFormula } as FormulaCell;
    namedRanges.push({ name: `NOI_Y${year}`, ref: `Operating_CF!$C$${row}` });

    // Hard Debt Service (reference from Debt_Schedule)
    const hardDS = cf?.hardDebtService || 0;
    ws[`D${row}`] = { t: 'n', v: hardDS, f: `HardDS_Y${year}` } as FormulaCell;

    // Cash After Hard DS
    const cashAfterHardDS = noi - hardDS;
    ws[`E${row}`] = { t: 'n', v: cashAfterHardDS, f: `C${row}-D${row}` } as FormulaCell;
    namedRanges.push({ name: `CashAfterHardDS_Y${year}`, ref: `Operating_CF!$E$${row}` });

    // DSCR
    const dscr = hardDS > 0 ? noi / hardDS : 0;
    ws[`F${row}`] = { t: 'n', v: dscr, f: `IF(D${row}>0,C${row}/D${row},0)` } as FormulaCell;
    namedRanges.push({ name: `DSCR_Y${year}`, ref: `Operating_CF!$F$${row}` });

    // Required for 1.05x DSCR
    const req105 = hardDS * 1.05;
    ws[`G${row}`] = { t: 'n', v: req105, f: `D${row}*1.05` } as FormulaCell;

    // Available for Soft Pay (NOI - required for 1.05x)
    const availForSoft = Math.max(0, noi - req105);
    ws[`H${row}`] = { t: 'n', v: availForSoft, f: `MAX(0,C${row}-G${row})` } as FormulaCell;
    namedRanges.push({ name: `AvailForSoftPay_Y${year}`, ref: `Operating_CF!$H$${row}` });

    // ISS-037: DSCR breakdown columns
    if (showDSCRBreakdown) {
      // Must-Pay Debt Service (Senior + PAB only)
      const mustPayDS = cf?.mustPayDebtService || 0;
      ws[`I${row}`] = { t: 'n', v: mustPayDS, f: `MustPayDS_Y${year}` } as FormulaCell;
      namedRanges.push({ name: `MustPayDS_Y${year}`, ref: `Operating_CF!$I$${row}` });

      // Must-Pay DSCR = NOI / (Senior + PAB)
      const mustPayDSCR = cf?.mustPayDSCR || (mustPayDS > 0 ? noi / mustPayDS : 0);
      ws[`J${row}`] = { t: 'n', v: mustPayDSCR, f: `IF(I${row}>0,C${row}/I${row},0)` } as FormulaCell;
      namedRanges.push({ name: `MustPayDSCR_Y${year}`, ref: `Operating_CF!$J$${row}` });

      // Phil DSCR = NOI / (Senior + PAB + Phil Current Pay)
      const philDSCR = cf?.philDSCR || dscr; // Falls back to overall DSCR
      ws[`K${row}`] = { t: 'n', v: philDSCR, f: `IF(D${row}>0,C${row}/D${row},0)` } as FormulaCell;
      namedRanges.push({ name: `PhilDSCR_Y${year}`, ref: `Operating_CF!$K$${row}` });
    }
  }

  // Summary rows
  const summaryRow = holdPeriod + 5;
  ws[`A${summaryRow}`] = { t: 's', v: '' };

  const metricsRow = summaryRow + 1;
  ws[`A${metricsRow}`] = { t: 's', v: 'METRICS' };

  ws[`A${metricsRow + 1}`] = { t: 's', v: 'Min DSCR' };
  ws[`B${metricsRow + 1}`] = { t: 'n', v: Math.min(...cashFlows.map(cf => cf.dscr || 0).filter(d => d > 0)), f: `MIN(F4:F${holdPeriod + 3})` } as FormulaCell;
  namedRanges.push({ name: 'MinDSCR', ref: `Operating_CF!$B$${metricsRow + 1}` });

  ws[`A${metricsRow + 2}`] = { t: 's', v: 'Avg DSCR' };
  ws[`B${metricsRow + 2}`] = { t: 'n', v: cashFlows.reduce((sum, cf) => sum + (cf.dscr || 0), 0) / cashFlows.length, f: `AVERAGE(F4:F${holdPeriod + 3})` } as FormulaCell;
  namedRanges.push({ name: 'AvgDSCR', ref: `Operating_CF!$B$${metricsRow + 2}` });

  ws[`A${metricsRow + 3}`] = { t: 's', v: 'Total Available for Soft' };
  ws[`B${metricsRow + 3}`] = { t: 'n', v: cashFlows.reduce((sum, cf) => sum + Math.max(0, (cf.noi || 0) - (cf.hardDebtService || 0) * 1.05), 0), f: `SUM(H4:H${holdPeriod + 3})` } as FormulaCell;

  // ISS-037: DSCR breakdown summary metrics
  let finalMetricsRow = metricsRow + 3;
  if (showDSCRBreakdown) {
    finalMetricsRow = metricsRow + 5;

    ws[`A${metricsRow + 4}`] = { t: 's', v: 'Min Must-Pay DSCR' };
    const minMustPayDSCR = Math.min(...cashFlows.map(cf => cf.mustPayDSCR || 0).filter(d => d > 0));
    ws[`B${metricsRow + 4}`] = { t: 'n', v: minMustPayDSCR > 0 ? minMustPayDSCR : 0, f: `MIN(J4:J${holdPeriod + 3})` } as FormulaCell;
    namedRanges.push({ name: 'MinMustPayDSCR', ref: `Operating_CF!$B$${metricsRow + 4}` });

    ws[`A${metricsRow + 5}`] = { t: 's', v: 'Min Phil DSCR' };
    const minPhilDSCR = Math.min(...cashFlows.map(cf => cf.philDSCR || 0).filter(d => d > 0));
    ws[`B${metricsRow + 5}`] = { t: 'n', v: minPhilDSCR > 0 ? minPhilDSCR : 0, f: `MIN(K4:K${holdPeriod + 3})` } as FormulaCell;
    namedRanges.push({ name: 'MinPhilDSCR', ref: `Operating_CF!$B$${metricsRow + 5}` });
  }

  // Set sheet range (ISS-037: extend to K if DSCR breakdown shown)
  const lastCol = showDSCRBreakdown ? 'K' : 'H';
  ws['!ref'] = `A1:${lastCol}${finalMetricsRow}`;

  // Set column widths (ISS-037: add DSCR breakdown columns)
  const cols = [
    { wch: 8 },  // A: Year
    { wch: 12 }, // B: Occupancy
    { wch: 12 }, // C: NOI
    { wch: 15 }, // D: Hard Debt Service
    { wch: 15 }, // E: Cash After Hard DS
    { wch: 10 }, // F: DSCR
    { wch: 12 }, // G: Req for 1.05x
    { wch: 18 }, // H: Available for Soft Pay
  ];
  if (showDSCRBreakdown) {
    cols.push(
      { wch: 14 }, // I: Must-Pay DS
      { wch: 14 }, // J: Must-Pay DSCR
      { wch: 12 }, // K: Phil DSCR
    );
  }
  ws['!cols'] = cols;

  return { sheet: ws, namedRanges };
}
