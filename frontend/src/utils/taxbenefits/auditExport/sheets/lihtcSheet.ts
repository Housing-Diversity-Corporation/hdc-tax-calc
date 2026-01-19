/**
 * IMPL-056: Live Calculation Excel Model - LIHTC Sheet
 *
 * Sheet 6: 11-year LIHTC credit schedule per IRC §42.
 * Year 1 prorated, Years 2-10 full, Year 11 catch-up.
 */

import * as XLSX from 'xlsx';
import { CalculationParams } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the LIHTC sheet with 11-year schedule
 */
export function buildLIHTCSheet(params: CalculationParams): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const projectCost = params.projectCost;
  const landValue = params.landValue;
  const pisMonth = params.placedInServiceMonth || 7;
  const lihtcEnabled = params.lihtcEnabled ?? false;
  const applicableFraction = (params.applicableFraction || 100) / 100;
  const creditRate = (params.creditRate || 4) / 100;
  const ddaBoost = params.ddaQctBoost ? 1.3 : 1.0;
  const stateLIHTCEnabled = params.stateLIHTCEnabled ?? false;
  const stateLIHTCRate = 0; // Would come from state-specific calculation

  // Calculate basis and credits
  const depreciableBasis = projectCost - landValue;
  const eligibleBasis = depreciableBasis * ddaBoost;
  const qualifiedBasis = eligibleBasis * applicableFraction;
  const annualFedCredit = qualifiedBasis * creditRate;
  const annualStateCredit = qualifiedBasis * stateLIHTCRate;

  // Year 1 proration factor: (13 - closing month) / 12
  const year1Factor = (13 - pisMonth) / 12;
  const year1FedCredit = annualFedCredit * year1Factor;
  const year11FedCredit = annualFedCredit - year1FedCredit; // Catch-up
  const year1StateCredit = annualStateCredit * year1Factor;
  const year11StateCredit = annualStateCredit - year1StateCredit;

  // Header
  ws['A1'] = { t: 's', v: 'LIHTC SCHEDULE' };
  ws['A2'] = { t: 's', v: '' };

  // Basis Calculation Section
  ws['A3'] = { t: 's', v: 'Eligible Basis' };
  const basisFormula = params.ddaQctBoost
    ? 'DepreciableBasis*1.3'
    : 'DepreciableBasis';
  ws['B3'] = { t: 'n', v: eligibleBasis, f: lihtcEnabled ? `IF(QualifiedBasisBoost,DepreciableBasis*1.3,DepreciableBasis)` : '0' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCEligibleBasis', ref: 'LIHTC!$B$3' });

  ws['A4'] = { t: 's', v: 'Qualified Basis' };
  ws['B4'] = { t: 'n', v: qualifiedBasis, f: 'B3*ApplicableFraction/100' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCQualifiedBasis', ref: 'LIHTC!$B$4' });

  ws['A5'] = { t: 's', v: 'Federal Annual Credit' };
  ws['B5'] = { t: 'n', v: annualFedCredit, f: 'IF(FedLIHTCEnabled,B4*LIHTCRate/100,0)' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCAnnualFedCredit', ref: 'LIHTC!$B$5' });

  ws['A6'] = { t: 's', v: 'State Annual Credit' };
  ws['B6'] = { t: 'n', v: annualStateCredit, f: 'IF(StateLIHTCEnabled,B4*StateLIHTCRate/100,0)' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCAnnualStateCredit', ref: 'LIHTC!$B$6' });

  ws['A7'] = { t: 's', v: '' };

  // Proration Section
  ws['A8'] = { t: 's', v: 'PIS Month' };
  ws['B8'] = { t: 'n', v: pisMonth, f: 'ClosingMonth' } as FormulaCell;

  ws['A9'] = { t: 's', v: 'Year 1 Proration Factor' };
  ws['B9'] = { t: 'n', v: year1Factor, f: '(13-ClosingMonth)/12' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCYear1Factor', ref: 'LIHTC!$B$9' });

  ws['A10'] = { t: 's', v: '' };

  // Column headers for schedule
  ws['A11'] = { t: 's', v: 'Year' };
  ws['B11'] = { t: 's', v: 'Federal Credit' };
  ws['C11'] = { t: 's', v: 'State Credit' };
  ws['D11'] = { t: 's', v: 'Total Credit' };
  ws['E11'] = { t: 's', v: 'Notes' };

  // 11-year schedule
  let cumFed = 0;
  let cumState = 0;

  for (let year = 1; year <= 11; year++) {
    const row = year + 11; // Data starts at row 12

    ws[`A${row}`] = { t: 'n', v: year };

    let fedCredit = 0;
    let stateCredit = 0;
    let fedFormula = '';
    let stateFormula = '';
    let notes = '';

    if (year === 1) {
      // Prorated first year
      fedCredit = year1FedCredit;
      stateCredit = year1StateCredit;
      fedFormula = 'LIHTCAnnualFedCredit*LIHTCYear1Factor';
      stateFormula = 'LIHTCAnnualStateCredit*LIHTCYear1Factor';
      notes = 'Prorated';
    } else if (year <= 10) {
      // Full years 2-10
      fedCredit = annualFedCredit;
      stateCredit = annualStateCredit;
      fedFormula = 'LIHTCAnnualFedCredit';
      stateFormula = 'LIHTCAnnualStateCredit';
      notes = 'Full year';
    } else {
      // Year 11 catch-up
      fedCredit = year11FedCredit;
      stateCredit = year11StateCredit;
      fedFormula = 'LIHTCAnnualFedCredit-B12'; // Annual - Year 1
      stateFormula = 'LIHTCAnnualStateCredit-C12';
      notes = 'Catch-up';
    }

    ws[`B${row}`] = { t: 'n', v: lihtcEnabled ? fedCredit : 0, f: `IF(FedLIHTCEnabled,${fedFormula},0)` } as FormulaCell;
    ws[`C${row}`] = { t: 'n', v: stateLIHTCEnabled ? stateCredit : 0, f: `IF(StateLIHTCEnabled,${stateFormula},0)` } as FormulaCell;
    ws[`D${row}`] = { t: 'n', v: (lihtcEnabled ? fedCredit : 0) + (stateLIHTCEnabled ? stateCredit : 0), f: `B${row}+C${row}` } as FormulaCell;
    ws[`E${row}`] = { t: 's', v: notes };

    cumFed += lihtcEnabled ? fedCredit : 0;
    cumState += stateLIHTCEnabled ? stateCredit : 0;

    // Named ranges for credits
    namedRanges.push({ name: `FedLIHTC_Y${year}`, ref: `LIHTC!$B$${row}` });
    namedRanges.push({ name: `StateLIHTC_Y${year}`, ref: `LIHTC!$C$${row}` });
    namedRanges.push({ name: `TotalLIHTC_Y${year}`, ref: `LIHTC!$D$${row}` });
  }

  // Totals row
  const totalRow = 24; // Row after year 11 (row 23)
  ws[`A${totalRow}`] = { t: 's', v: '' };

  const sumRow = 25;
  ws[`A${sumRow}`] = { t: 's', v: 'TOTALS' };
  ws[`B${sumRow}`] = { t: 'n', v: cumFed, f: 'SUM(B12:B22)' } as FormulaCell;
  ws[`C${sumRow}`] = { t: 'n', v: cumState, f: 'SUM(C12:C22)' } as FormulaCell;
  ws[`D${sumRow}`] = { t: 'n', v: cumFed + cumState, f: 'SUM(D12:D22)' } as FormulaCell;
  ws[`E${sumRow}`] = { t: 's', v: '= 10 × Annual' };

  namedRanges.push({ name: 'TotalFedLIHTC', ref: `LIHTC!$B$${sumRow}` });
  namedRanges.push({ name: 'TotalStateLIHTC', ref: `LIHTC!$C$${sumRow}` });
  namedRanges.push({ name: 'TotalLIHTC', ref: `LIHTC!$D$${sumRow}` });

  // Validation row
  const validRow = 27;
  ws[`A${validRow}`] = { t: 's', v: 'Validation (Fed = 10×Annual)' };
  ws[`B${validRow}`] = { t: 's', v: Math.abs(cumFed - annualFedCredit * 10) < 0.001 ? '✓' : '✗', f: 'IF(ABS(B25-LIHTCAnnualFedCredit*10)<0.001,"✓","✗")' };

  // Set sheet range
  ws['!ref'] = `A1:E${validRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Year/Label
    { wch: 15 }, // Federal Credit
    { wch: 15 }, // State Credit
    { wch: 15 }, // Total Credit
    { wch: 12 }, // Notes
  ];

  return { sheet: ws, namedRanges };
}
