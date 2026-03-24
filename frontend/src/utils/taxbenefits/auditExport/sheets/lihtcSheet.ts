/**
 * IMPL-056: Live Calculation Excel Model - LIHTC Sheet
 * IMPL-079: Added State Credit Duration parameter for variable-duration state programs
 *
 * Sheet 6: LIHTC credit schedule per IRC §42.
 * Federal: 10-year period (Year 1 prorated, Years 2-10 full, Year 11 catch-up)
 * State: Variable duration per state program (e.g., NE is 6 years)
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
  // ISS-016: Use actual state LIHTC annual credit from params instead of deriving from rate
  const annualStateCredit = params.stateLIHTCAnnualCredit || 0;

  // Calculate basis and credits
  // ISS-021: Properly distinguish Eligible Basis (pre-boost) vs Qualified Basis (post-boost)
  // IMPL-083: Use pre-calculated lihtcEligibleBasis from params (includes all exclusions)
  // Fallback to simple calc (Project - Land) for backwards compatibility
  const eligibleBasis = params.lihtcEligibleBasis ?? (projectCost - landValue);
  const qualifiedBasis = eligibleBasis * ddaBoost * applicableFraction; // Post-boost with applicable fraction
  const annualFedCredit = qualifiedBasis * creditRate;
  // ISS-016: annualStateCredit now comes from params (line 28), not calculated from rate

  // IMPL-079: State credit duration (varies by state, e.g., NE is 6 years)
  // Derive from yearlyCredits length - 1 (schedule includes catch-up year)
  const stateCreditDuration = params.stateLIHTCIntegration?.yearlyCredits
    ? Math.max(params.stateLIHTCIntegration.yearlyCredits.length - 1, 1)
    : 10;
  const stateCatchUpYear = stateCreditDuration + 1;

  // Year 1 proration factor: (13 - closing month) / 12
  // §42(f)(1) election: defer credit start → Year 1 gets full credit, no catch-up
  const electDefer = params.electDeferCreditPeriod ?? false;
  const year1Factor = electDefer ? 1.0 : (13 - pisMonth) / 12;
  const year1FedCredit = annualFedCredit * year1Factor;
  const year11FedCredit = electDefer ? 0 : annualFedCredit - year1FedCredit;
  const year1StateCredit = annualStateCredit * year1Factor;
  const stateCatchUpCredit = annualStateCredit - year1StateCredit; // State catch-up in year (duration+1)

  // Header
  ws['A1'] = { t: 's', v: 'LIHTC SCHEDULE' };
  ws['A2'] = { t: 's', v: '' };

  // ISS-021: Basis Calculation Section - Properly distinguish Eligible vs Qualified Basis
  // IMPL-083: Eligible Basis = Project Cost - Land - All Exclusions (pre-boost)
  ws['A3'] = { t: 's', v: 'Eligible Basis' };
  ws['B3'] = { t: 'n', v: eligibleBasis, f: 'LIHTCEligibleBasis' } as FormulaCell;
  ws['C3'] = { t: 's', v: '(Cost - Land - Exclusions)' };
  namedRanges.push({ name: 'LIHTCEligibleBasis', ref: 'LIHTC!$B$3' });

  // DDA/QCT Boost row - only meaningful content when boost > 0
  ws['A4'] = { t: 's', v: 'DDA/QCT Boost' };
  const boostPct = params.ddaQctBoost ? 30 : 0;
  ws['B4'] = { t: 'n', v: boostPct / 100, f: 'IF(QualifiedBasisBoost,0.3,0)' } as FormulaCell;
  ws['C4'] = { t: 's', v: params.ddaQctBoost ? '(130% multiplier)' : '(no boost)' };
  namedRanges.push({ name: 'LIHTCBoostPct', ref: 'LIHTC!$B$4' });

  // Qualified Basis = Eligible Basis × (1 + Boost) × Applicable Fraction
  ws['A5'] = { t: 's', v: 'Qualified Basis' };
  ws['B5'] = { t: 'n', v: qualifiedBasis, f: 'B3*(1+B4)*ApplicableFraction/100' } as FormulaCell;
  ws['C5'] = { t: 's', v: '(post-boost × applicable %)' };
  namedRanges.push({ name: 'LIHTCQualifiedBasis', ref: 'LIHTC!$B$5' });

  ws['A6'] = { t: 's', v: '' };

  ws['A7'] = { t: 's', v: 'Federal Annual Credit' };
  ws['B7'] = { t: 'n', v: annualFedCredit, f: 'IF(FedLIHTCEnabled,B5*LIHTCRate/100,0)' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCAnnualFedCredit', ref: 'LIHTC!$B$7' });

  ws['A8'] = { t: 's', v: 'State Annual Credit' };
  // ISS-016: Use StateLIHTCAnnualCredit from Inputs sheet (pre-calculated, not derived from rate)
  ws['B8'] = { t: 'n', v: annualStateCredit, f: 'IF(StateLIHTCEnabled,StateLIHTCAnnualCredit,0)' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCAnnualStateCredit', ref: 'LIHTC!$B$8' });

  // IMPL-079: State credit duration display (variable already defined above)
  ws['A9'] = { t: 's', v: 'State Credit Duration' };
  ws['B9'] = { t: 'n', v: stateCreditDuration };
  ws['C9'] = { t: 's', v: stateCreditDuration === 10 ? '(standard)' : `(${stateCreditDuration}-year program)` };
  namedRanges.push({ name: 'StateLIHTCDuration', ref: 'LIHTC!$B$9' });

  ws['A10'] = { t: 's', v: '' };

  // Proration Section
  ws['A11'] = { t: 's', v: 'PIS Month' };
  ws['B11'] = { t: 'n', v: pisMonth, f: 'PlacedInServiceMonth' } as FormulaCell;

  ws['A12'] = { t: 's', v: 'Year 1 Proration Factor' };
  ws['B12'] = { t: 'n', v: year1Factor, f: '(13-PlacedInServiceMonth)/12' } as FormulaCell;
  namedRanges.push({ name: 'LIHTCYear1Factor', ref: 'LIHTC!$B$12' });

  ws['A13'] = { t: 's', v: '' };

  // Column headers for schedule
  ws['A14'] = { t: 's', v: 'Year' };
  ws['B14'] = { t: 's', v: 'Federal Credit' };
  ws['C14'] = { t: 's', v: 'State Credit' };
  ws['D14'] = { t: 's', v: 'Total Credit' };
  ws['E14'] = { t: 's', v: 'Notes' };

  // ISS-021: 11-year schedule (rows shifted +1 due to IMPL-079 State Credit Duration row)
  let cumFed = 0;
  let cumState = 0;
  const scheduleStartRow = 15; // Data starts at row 15 (after headers at row 14)

  for (let year = 1; year <= 11; year++) {
    const row = year + scheduleStartRow - 1; // Year 1 at row 14, Year 11 at row 24

    ws[`A${row}`] = { t: 'n', v: year };

    let fedCredit = 0;
    let stateCredit = 0;
    let fedFormula = '';
    let stateFormula = '';
    let notes = '';

    // ISS-024: Handle variable state duration (federal is always 10-year/11-year schedule)
    if (year === 1) {
      // Prorated first year (both federal and state)
      fedCredit = year1FedCredit;
      stateCredit = year1StateCredit;
      fedFormula = 'LIHTCAnnualFedCredit*LIHTCYear1Factor';
      stateFormula = 'LIHTCAnnualStateCredit*LIHTCYear1Factor';
      notes = 'Prorated';
    } else if (year <= 10) {
      // Full years 2-10 for federal
      fedCredit = annualFedCredit;
      fedFormula = 'LIHTCAnnualFedCredit';

      // State: full credit only within duration, catch-up in year (duration+1), then $0
      if (year <= stateCreditDuration) {
        stateCredit = annualStateCredit;
        stateFormula = 'LIHTCAnnualStateCredit';
        notes = 'Full year';
      } else if (year === stateCatchUpYear) {
        stateCredit = stateCatchUpCredit;
        stateFormula = `LIHTCAnnualStateCredit-C${scheduleStartRow}`; // Annual - Year 1
        notes = stateCreditDuration === 10 ? 'Full year' : `State catch-up (Y${stateCatchUpYear})`;
      } else {
        stateCredit = 0;
        stateFormula = '0';
        notes = 'Full year (fed only)';
      }
    } else {
      // Year 11: Federal catch-up
      fedCredit = year11FedCredit;
      fedFormula = `LIHTCAnnualFedCredit-B${scheduleStartRow}`; // Annual - Year 1

      // State: catch-up only if stateCatchUpYear is 11, otherwise $0
      if (stateCatchUpYear === 11) {
        stateCredit = stateCatchUpCredit;
        stateFormula = `LIHTCAnnualStateCredit-C${scheduleStartRow}`;
      } else {
        stateCredit = 0;
        stateFormula = '0';
      }
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

  // Totals row (after Year 11 at row 24)
  const totalRow = scheduleStartRow + 11; // Row 25 (blank)
  ws[`A${totalRow}`] = { t: 's', v: '' };

  const sumRow = totalRow + 1; // Row 26
  ws[`A${sumRow}`] = { t: 's', v: 'TOTALS' };
  ws[`B${sumRow}`] = { t: 'n', v: cumFed, f: `SUM(B${scheduleStartRow}:B${scheduleStartRow + 10})` } as FormulaCell;
  ws[`C${sumRow}`] = { t: 'n', v: cumState, f: `SUM(C${scheduleStartRow}:C${scheduleStartRow + 10})` } as FormulaCell;
  ws[`D${sumRow}`] = { t: 'n', v: cumFed + cumState, f: `SUM(D${scheduleStartRow}:D${scheduleStartRow + 10})` } as FormulaCell;
  // ISS-024: Dynamic label reflecting federal (10yr) and state (variable) durations
  ws[`E${sumRow}`] = { t: 's', v: stateCreditDuration === 10 ? '= 10 × Annual' : `Fed: 10yr, State: ${stateCreditDuration}yr` };

  namedRanges.push({ name: 'TotalFedLIHTC', ref: `LIHTC!$B$${sumRow}` });
  namedRanges.push({ name: 'TotalStateLIHTC', ref: `LIHTC!$C$${sumRow}` });
  namedRanges.push({ name: 'TotalLIHTC', ref: `LIHTC!$D$${sumRow}` });

  // IMPL-073: State LIHTC Syndication Proceeds (capital return model)
  const syndRow = sumRow + 2;
  ws[`A${syndRow}`] = { t: 's', v: 'Syndication Proceeds' };
  // Proceeds = State LIHTC Total * (Syndication Rate / 100)
  const syndProceeds = cumState * (params.syndicationRate ?? 85) / 100;
  ws[`C${syndRow}`] = { t: 'n', v: syndProceeds, f: 'IF(StateLIHTCPath="syndicated",TotalStateLIHTC*StateLIHTCSyndRate/100,0)' } as FormulaCell;
  ws[`E${syndRow}`] = { t: 's', v: '(if syndicated)' };
  namedRanges.push({ name: 'StateLIHTCSyndProceeds', ref: `LIHTC!$C$${syndRow}` });

  // Validation row
  const validRow = syndRow + 2;
  ws[`A${validRow}`] = { t: 's', v: 'Validation (Fed = 10×Annual)' };
  ws[`B${validRow}`] = { t: 's', v: Math.abs(cumFed - annualFedCredit * 10) < 0.001 ? '✓' : '✗', f: `IF(ABS(B${sumRow}-LIHTCAnnualFedCredit*10)<0.001,"✓","✗")` };

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
