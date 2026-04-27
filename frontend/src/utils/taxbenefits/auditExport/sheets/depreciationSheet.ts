/**
 * IMPL-056: Live Calculation Excel Model - Depreciation Sheet
 *
 * Sheet 4: Bonus depreciation + MACRS schedule with mid-month convention.
 */

import * as XLSX from 'xlsx';
import { CalculationParams } from '../../../../types/taxbenefits';
import { ComputedTimeline } from '../../computeTimeline';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Depreciation sheet with bonus + MACRS schedule
 * IMPL-161: Added rawTimeline param per LIVE_EXCEL_SYNC_PROTOCOL Rule 4
 */
export function buildDepreciationSheet(params: CalculationParams, rawTimeline?: ComputedTimeline | null): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;
  const landValue = params.landValue;
  const costSegPct = params.yearOneDepreciationPct || 20;
  const bonusPct = 100; // Full bonus depreciation
  // IMPL-161: Read from rawTimeline per LIVE_EXCEL_SYNC_PROTOCOL Rule 4 (Rule 2: ?? not ||)
  const pisMonth = rawTimeline?.pisCalendarMonth ?? params.placedInServiceMonth ?? 1;

  // Calculate values
  const depreciableBasis = projectCost - landValue;
  const costSegPortion = depreciableBasis * costSegPct / 100;
  const straightLinePortion = depreciableBasis - costSegPortion;
  const bonusDepr = costSegPortion * bonusPct / 100;
  const annualMACRS = straightLinePortion / 27.5;

  // Year 1 MACRS: mid-month convention (months in service / 12)
  const monthsY1 = 12.5 - pisMonth;
  const year1MACRS = annualMACRS * monthsY1 / 12;

  // Header
  ws['A1'] = { t: 's', v: 'DEPRECIATION SCHEDULE' };
  ws['A2'] = { t: 's', v: '' };

  // Basis Calculation
  ws['A3'] = { t: 's', v: 'Depreciable Basis' };
  ws['B3'] = { t: 'n', v: depreciableBasis, f: 'ProjectCost-LandValue' } as FormulaCell;
  namedRanges.push({ name: 'DepreciableBasis', ref: 'Depreciation!$B$3' });

  ws['A4'] = { t: 's', v: 'Cost Seg Portion' };
  ws['B4'] = { t: 'n', v: costSegPortion, f: 'B3*CostSegPct/100' } as FormulaCell;
  namedRanges.push({ name: 'CostSegPortion', ref: 'Depreciation!$B$4' });

  ws['A5'] = { t: 's', v: '27.5-Year Portion' };
  ws['B5'] = { t: 'n', v: straightLinePortion, f: 'B3-B4' } as FormulaCell;
  namedRanges.push({ name: 'StraightLinePortion', ref: 'Depreciation!$B$5' });

  ws['A6'] = { t: 's', v: '' };

  // Column headers for schedule
  ws['A7'] = { t: 's', v: 'Year' };
  ws['B7'] = { t: 's', v: 'Bonus (100%)' };
  ws['C7'] = { t: 's', v: 'MACRS 27.5' };
  ws['D7'] = { t: 's', v: 'Total Depreciation' };

  // Year-by-year depreciation
  let cumulativeDepr = 0;

  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 7; // Data starts at row 8

    ws[`A${row}`] = { t: 'n', v: year };

    // Bonus depreciation (Year 1 only)
    const bonus = year === 1 ? bonusDepr : 0;
    const bonusFormula = year === 1 ? 'CostSegPortion*BonusDepreciationPct/100' : '0';
    ws[`B${row}`] = { t: 'n', v: bonus, f: bonusFormula } as FormulaCell;

    // MACRS depreciation
    let macrs = 0;
    let macrsFormula = '0';
    if (year === 1) {
      macrs = year1MACRS;
      macrsFormula = 'StraightLinePortion/27.5*(12.5-PlacedInServiceMonth)/12';
    } else if (year <= 27) { // Continue for 27.5 years
      macrs = annualMACRS;
      macrsFormula = 'StraightLinePortion/27.5';
    }
    ws[`C${row}`] = { t: 'n', v: macrs, f: macrsFormula } as FormulaCell;

    // Total depreciation
    const total = bonus + macrs;
    ws[`D${row}`] = { t: 'n', v: total, f: `B${row}+C${row}` } as FormulaCell;

    cumulativeDepr += total;

    // Named ranges for key years
    namedRanges.push({ name: `Depr_Y${year}`, ref: `Depreciation!$D$${row}` });
  }

  // Summary row
  const summaryRow = holdPeriod + 8;
  ws[`A${summaryRow}`] = { t: 's', v: '' };

  const totalRow = holdPeriod + 9;
  ws[`A${totalRow}`] = { t: 's', v: 'TOTAL' };
  ws[`B${totalRow}`] = { t: 'n', v: bonusDepr, f: 'SUM(B8:B' + (holdPeriod + 7) + ')' } as FormulaCell;
  ws[`C${totalRow}`] = { t: 'n', v: cumulativeDepr - bonusDepr, f: 'SUM(C8:C' + (holdPeriod + 7) + ')' } as FormulaCell;
  ws[`D${totalRow}`] = { t: 'n', v: cumulativeDepr, f: 'SUM(D8:D' + (holdPeriod + 7) + ')' } as FormulaCell;
  namedRanges.push({ name: 'TotalDepreciation', ref: `Depreciation!$D$${totalRow}` });

  // Set sheet range
  ws['!ref'] = `A1:D${totalRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Year
    { wch: 18 }, // Bonus
    { wch: 15 }, // MACRS
    { wch: 18 }, // Total
  ];

  return { sheet: ws, namedRanges };
}
