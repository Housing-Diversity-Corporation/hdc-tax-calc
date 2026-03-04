/**
 * IMPL-115: timingGanttSheet Tests
 *
 * Validates:
 *   TG-1: Basic timeline with ComputedTimeline — calendar dates present
 *   TG-2: PIS override flag shown correctly
 *   TG-3: §42(f)(1) election reflected in credit start year
 *   TG-4: Exit extension reflected in exit date
 *   TG-5: OZ disabled hides OZ-related rows
 *   TG-6: Legacy path (no timeline) still works
 */

import { buildTimingGanttSheet } from '../sheets/timingGanttSheet';
import { computeTimeline } from '../../computeTimeline';
import { CalculationParams, ComputedTimeline } from '../../../../types/taxbenefits';

const BASE_PARAMS: Partial<CalculationParams> = {
  projectCost: 10,
  landValue: 2,
  yearOneNOI: 0.8,
  investorEquityPct: 30,
  investorPromoteShare: 50,
  exitCapRate: 5,
  holdPeriod: 10,
  noiGrowthRate: 3,
  placedInServiceMonth: 7,
  constructionDelayMonths: 23,
  exitMonth: 12,
  ozEnabled: true,
};

// Helper: get sheet data as array of arrays
function getSheetData(result: ReturnType<typeof buildTimingGanttSheet>): string[][] {
  const ws = result.sheet;
  const ref = ws['!ref'];
  if (!ref) return [];
  // Extract all cell values into rows
  const rows: string[][] = [];
  const range = ref.split(':');
  const maxRow = parseInt(range[1].replace(/[A-Z]+/, ''));
  const maxColStr = range[1].replace(/[0-9]+/, '');
  const maxCol = maxColStr.split('').reduce((acc, c) => acc * 26 + c.charCodeAt(0) - 64, 0);

  for (let r = 1; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 1; c <= Math.min(maxCol, 5); c++) {
      const colStr = String.fromCharCode(64 + c);
      const cell = ws[`${colStr}${r}`];
      row.push(cell?.v != null ? String(cell.v) : '');
    }
    rows.push(row);
  }
  return rows;
}

// Helper: find row containing text
function findRow(data: string[][], text: string): string[] | undefined {
  return data.find(row => row.some(cell => cell.includes(text)));
}

describe('timingGanttSheet — IMPL-115', () => {

  // TG-1: Basic timeline with ComputedTimeline — calendar dates present
  it('TG-1: shows calendar dates when ComputedTimeline provided', () => {
    const timeline = computeTimeline('2025-07-01', 23, null, true, 0, false);
    const result = buildTimingGanttSheet(BASE_PARAMS as CalculationParams, timeline);
    const data = getSheetData(result);

    // Should have "Date-Driven" in title
    expect(findRow(data, 'Date-Driven')).toBeDefined();

    // KEY DATES section should exist
    expect(findRow(data, 'KEY DATES')).toBeDefined();
    expect(findRow(data, 'Investment Date')).toBeDefined();
    expect(findRow(data, 'PIS Date')).toBeDefined();
    expect(findRow(data, 'Optimal Exit')).toBeDefined();
    expect(findRow(data, 'Actual Exit')).toBeDefined();
    expect(findRow(data, 'Bonus Dep K-1')).toBeDefined();
    expect(findRow(data, 'First LIHTC K-1')).toBeDefined();
  });

  // TG-2: PIS override flag shown correctly
  it('TG-2: shows OVERRIDDEN flag when PIS is overridden', () => {
    const timeline = computeTimeline('2025-07-01', 23, '2027-03-15', true, 0, false);
    const result = buildTimingGanttSheet(BASE_PARAMS as CalculationParams, timeline);
    const data = getSheetData(result);

    const pisRow = findRow(data, 'PIS Date');
    expect(pisRow).toBeDefined();
    expect(pisRow!.some(cell => cell.includes('OVERRIDDEN'))).toBe(true);
  });

  // TG-3: §42(f)(1) election reflected in credit start year
  it('TG-3: §42(f)(1) election defers credit start year', () => {
    // July PIS, election ON → credit start = PIS year + 1
    const timelineWithElection = computeTimeline('2025-07-01', 0, null, true, 0, true);
    const result = buildTimingGanttSheet(BASE_PARAMS as CalculationParams, timelineWithElection);
    const data = getSheetData(result);

    // Election row should appear
    expect(findRow(data, '§42(f)(1) Election')).toBeDefined();
    expect(findRow(data, 'ELECTED')).toBeDefined();

    // Credit start should be 2026 (PIS in 2025, election defers to 2026)
    const creditRow = findRow(data, 'Credit Start');
    expect(creditRow).toBeDefined();
    expect(creditRow!.some(cell => cell.includes('2026'))).toBe(true);
  });

  // TG-4: Exit extension reflected in exit date
  it('TG-4: exit extension extends actual exit date', () => {
    const timelineExtended = computeTimeline('2025-07-01', 23, null, true, 24, false);
    const result = buildTimingGanttSheet(BASE_PARAMS as CalculationParams, timelineExtended);
    const data = getSheetData(result);

    const exitRow = findRow(data, 'Actual Exit');
    expect(exitRow).toBeDefined();
    expect(exitRow!.some(cell => cell.includes('extended'))).toBe(true);
  });

  // TG-5: OZ disabled hides OZ-related rows in KEY DATES
  it('TG-5: OZ disabled does not show OZ minimum date', () => {
    const timelineNoOZ = computeTimeline('2025-07-01', 23, null, false, 0, false);
    const result = buildTimingGanttSheet(
      { ...BASE_PARAMS, ozEnabled: false } as CalculationParams,
      timelineNoOZ
    );
    const data = getSheetData(result);

    expect(findRow(data, 'OZ 10yr Minimum')).toBeUndefined();
  });

  // TG-6: Legacy path (no timeline) still works
  it('TG-6: legacy path produces valid sheet without ComputedTimeline', () => {
    const result = buildTimingGanttSheet(BASE_PARAMS as CalculationParams);
    const data = getSheetData(result);

    // Should NOT have "Date-Driven" in title
    expect(findRow(data, 'Date-Driven')).toBeUndefined();

    // Should have legacy title
    expect(findRow(data, 'Month-Level Precision')).toBeDefined();

    // Should have K-1 Delay row (legacy only)
    expect(findRow(data, 'K-1 Delay')).toBeDefined();

    // Sheet should be valid
    expect(result.sheet['!ref']).toBeDefined();
  });
});
