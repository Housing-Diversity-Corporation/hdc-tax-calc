/**
 * Timing Clock Gantt Chart — Excel Sheet Builder
 * IMPL-115: Updated to consume ComputedTimeline (calendar dates) when available.
 * Falls back to legacy computeHoldPeriod path when no investmentDate.
 *
 * Visual Gantt chart at MONTH-level resolution. Each column = 1 month.
 * Horizontal bars formed by Unicode block characters (████) show when
 * each clock is active. Auditors can visually trace clock interactions
 * and verify month-level precision.
 *
 * Layout:
 *   Section 1: Key dates summary (calendar dates when available)
 *   Section 2: Input summary + computed timing values
 *   Section 3: Stacked bar chart data (for Excel charting)
 *   Section 4: Visual Gantt grid (month columns with █/░ block characters)
 *   Section 5: Month-precise calculation formula + legend
 */

import * as XLSX from 'xlsx';
import { CalculationParams, ComputedTimeline } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition } from '../types';
// computeHoldPeriod import removed (IMPL-117) — logic inlined below

const MONTH_ABBR = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: Date): string =>
  `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

// Block characters for visual bars
const FULL = '██';    // Active period
const HALF = '▓▓';    // Partial (prorated) period
const EXIT_MARK = '▼▼';  // Exit marker
const EMPTY = '';

export function buildTimingGanttSheet(rawParams: CalculationParams, timeline?: ComputedTimeline | null): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const data: (string | number | null)[][] = [];

  // === Resolve timing values (new path vs legacy) ===
  const ozEnabled = rawParams.ozEnabled || false;

  let pisMonth: number;
  let constructionDevMonths: number;
  let exitMonth: number;
  let totalInvestmentYears: number;
  let exitYear: number;
  let holdFromPIS: number;
  let creditPeriodFromPIS: number;
  let placedInServiceYear: number;
  let creditStartYear: number;

  if (timeline) {
    pisMonth = timeline.pisCalendarMonth;
    constructionDevMonths = rawParams.constructionDelayMonths || 0;
    exitMonth = timeline.actualExitDate.getMonth() + 1;
    totalInvestmentYears = timeline.totalInvestmentYears;
    exitYear = timeline.exitYear;
    holdFromPIS = timeline.holdFromPIS;
    creditPeriodFromPIS = timeline.lihtcCreditYears;
    placedInServiceYear = timeline.placedInServiceYear;
    creditStartYear = timeline.creditStartYear;
  } else {
    // Legacy path — IMPL-117: placedInServiceMonth is engine-internal; hardcode default
    pisMonth = 7;
    constructionDevMonths = rawParams.constructionDelayMonths || 0;
    exitMonth = 12; // IMPL-117: exitMonth is now engine-internal; legacy path defaults to December

    // IMPL-117: Inlined from deleted computeHoldPeriod.ts
    creditPeriodFromPIS = pisMonth > 1 ? 11 : 10;
    holdFromPIS = creditPeriodFromPIS;
    const prePIS = Math.floor(constructionDevMonths / 12);
    const totalMonths = constructionDevMonths + (creditPeriodFromPIS * 12);
    totalInvestmentYears = Math.ceil(totalMonths / 12) + 1;
    exitYear = prePIS + creditPeriodFromPIS + 1;
    placedInServiceYear = Math.floor(constructionDevMonths / 12) + 1;
    creditStartYear = placedInServiceYear; // Legacy: no election support
  }

  const totalMonths = totalInvestmentYears * 12;
  const lastCreditYear = creditStartYear + creditPeriodFromPIS - 1;

  // ==================== SECTION 1: Key Dates (new path only) ====================
  if (timeline) {
    data.push(['TIMING CLOCK GANTT CHART — Date-Driven']);
    data.push(['Calendar-precise timing from ComputedTimeline']);
    data.push([]);

    data.push(['KEY DATES']);
    data.push(['Investment Date', '', formatDate(timeline.investmentDate)]);
    data.push(['PIS Date', '', formatDate(timeline.pisDate) + (timeline.pisIsOverridden ? ' (OVERRIDDEN)' : '')]);
    data.push(['Credit Start Year', '', timeline.creditStartYear]);
    data.push(['Last Credit Year', '', timeline.lastCreditYear]);
    data.push(['Optimal Exit Date', '', formatDate(timeline.optimalExitDate)]);
    data.push(['Actual Exit Date', '', formatDate(timeline.actualExitDate) + (timeline.isExtended ? ` (+extended)` : '')]);
    data.push(['Bonus Dep K-1', '', formatDate(timeline.bonusDepK1Date) + ` (${timeline.bonusDepLagMonths} mo from PIS)`]);
    data.push(['First LIHTC K-1', '', formatDate(timeline.firstLihtcK1Date)]);
    if (ozEnabled && timeline.ozMinimumDate) {
      data.push(['OZ 10yr Minimum', '', formatDate(timeline.ozMinimumDate) + (timeline.ozFloorBinding ? ' (BINDING)' : '')]);
    }
    if (timeline.electDeferCreditPeriod) {
      data.push(['§42(f)(1) Election', '', 'ELECTED — credit period deferred to year after PIS']);
    }
    data.push([]);
  } else {
    data.push(['TIMING CLOCK GANTT CHART']);
    data.push(['Month-Level Precision Audit — All 4 Clocks Visualized']);
    data.push([]);
  }

  // ==================== SECTION 2: Summary ====================
  data.push(['INPUTS', '', 'Value', '', 'COMPUTED', '', 'Value']);
  data.push(['Construction Period', '', `${constructionDevMonths} mo`, '', 'PIS Year', '', placedInServiceYear]);
  data.push(['PIS Month', '', MONTH_NAMES[pisMonth - 1], '', 'Credit Period', '', `${creditPeriodFromPIS} yr`]);
  if (!timeline) {
    data.push(['', '', '', '', 'Exit Year', '', exitYear]);
  } else {
    data.push(['Credit Start', '', creditStartYear, '', 'Exit Year', '', exitYear]);
  }
  data.push(['Exit Month', '', MONTH_NAMES[exitMonth - 1], '', 'Total Duration', '', `${totalInvestmentYears} yr`]);
  data.push(['OZ Enabled', '', ozEnabled ? 'Yes' : 'No', '', 'Hold from PIS', '', `${holdFromPIS} yr`]);
  data.push([]);

  // ==================== SECTION 3: Chart-Ready Data ====================
  data.push(['CHART DATA (select this block → Insert → Stacked Bar Chart)']);
  data.push(['Phase', 'Start (months)', 'Duration (months)']);

  const ozStartMo = 0;
  const ozDurationMo = Math.min(120, totalMonths);
  const constStartMo = 0;
  const constDurationMo = constructionDevMonths;
  // Credit start: account for election deferral (creditStartYear vs pisYear)
  const creditOffsetYears = timeline ? (creditStartYear - timeline.pisYear) : 0;
  const creditStartMo = constructionDevMonths + (creditOffsetYears * 12);
  const creditDurationMo = creditPeriodFromPIS * 12;
  const exitStartMo = (exitYear - 1) * 12;
  const exitDurationMo = exitMonth;

  if (ozEnabled) data.push(['OZ Hold (10yr)', ozStartMo, ozDurationMo]);
  data.push(['Construction', constStartMo, constDurationMo]);
  data.push(['LIHTC Credits', creditStartMo, creditDurationMo]);
  // K-1 realization rows (new path only)
  if (timeline) {
    const bonusDepK1Mo = (timeline.bonusDepK1Date.getFullYear() - timeline.investmentDate.getFullYear()) * 12
      + (timeline.bonusDepK1Date.getMonth() - timeline.investmentDate.getMonth());
    const firstLihtcK1Mo = (timeline.firstLihtcK1Date.getFullYear() - timeline.investmentDate.getFullYear()) * 12
      + (timeline.firstLihtcK1Date.getMonth() - timeline.investmentDate.getMonth());
    data.push(['Bonus Dep K-1', bonusDepK1Mo, 1]);
    data.push(['First LIHTC K-1', firstLihtcK1Mo, 1]);
  }
  data.push(['Disposition', exitStartMo, exitDurationMo]);
  // Depreciation row
  data.push(['MACRS 27.5yr', constructionDevMonths, Math.min(330, totalMonths - constructionDevMonths)]);
  data.push([]);

  // ==================== SECTION 4: Visual Gantt Grid ====================
  data.push(['VISUAL GANTT — Each column = 1 month    ██ = active    ▓▓ = prorated    ▼▼ = exit']);
  data.push([]);

  // Month header row
  const monthHeader: (string | number | null)[] = [''];
  for (let y = 1; y <= totalInvestmentYears; y++) {
    for (let m = 0; m < 12; m++) {
      monthHeader.push(MONTH_ABBR[m]);
    }
  }
  data.push(monthHeader);

  // Year label row (with calendar years when available)
  const yearHeader: (string | number | null)[] = [''];
  for (let y = 1; y <= totalInvestmentYears; y++) {
    const calendarYear = timeline ? timeline.investmentDate.getFullYear() + y - 1 : null;
    const label = calendarYear ? `── Year ${y} (${calendarYear}) ──` : `── Year ${y} ──`;
    yearHeader.push(label);
    for (let m = 1; m < 12; m++) {
      yearHeader.push('');
    }
  }
  data.push(yearHeader);

  // Helper: convert (year, month1-12) to absolute month index (0-based)
  const absMonth = (year: number, month: number) => (year - 1) * 12 + (month - 1);

  // --- Clock 1: OZ Hold ---
  const ozGantt: (string | null)[] = ['Clock 1: OZ Hold'];
  for (let mo = 0; mo < totalMonths; mo++) {
    if (ozEnabled && mo < 120) {
      ozGantt.push(FULL);
    } else if (ozEnabled) {
      ozGantt.push('✓');
    } else {
      ozGantt.push(EMPTY);
    }
  }
  data.push(ozGantt);

  // --- Clock 2: Construction/PIS Gate ---
  const constGantt: (string | null)[] = ['Clock 2: Construction'];
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo < constructionDevMonths) {
      constGantt.push(FULL);
    } else if (mo === constructionDevMonths) {
      constGantt.push('PIS');
    } else {
      constGantt.push(EMPTY);
    }
  }
  data.push(constGantt);

  // --- Clock 3: LIHTC Credit Period ---
  const lihtcGantt: (string | null)[] = ['Clock 3: LIHTC Credits'];
  const creditStartAbsMo = creditStartMo;
  const creditEndAbsMo = creditStartMo + (creditPeriodFromPIS * 12);
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo >= creditStartAbsMo && mo < creditEndAbsMo) {
      // First partial year (only if no election)
      if (mo === creditStartAbsMo && !timeline?.electDeferCreditPeriod) {
        lihtcGantt.push(HALF);
      } else if (mo < creditStartAbsMo + (13 - pisMonth) && !timeline?.electDeferCreditPeriod) {
        lihtcGantt.push(FULL);
      } else if (mo >= creditEndAbsMo - (pisMonth - 1) && pisMonth > 1 && !timeline?.electDeferCreditPeriod) {
        // Catch-up months in final year
        lihtcGantt.push(HALF);
      } else {
        lihtcGantt.push(FULL);
      }
    } else {
      lihtcGantt.push(EMPTY);
    }
  }
  data.push(lihtcGantt);

  // --- Clock 4: Depreciation (MACRS 27.5yr) ---
  const depGantt: (string | null)[] = ['Clock 4: Depreciation'];
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo >= constructionDevMonths && mo < constructionDevMonths + 330) {
      depGantt.push(FULL);
    } else {
      depGantt.push(EMPTY);
    }
  }
  data.push(depGantt);

  // --- Exit/Disposition marker ---
  const exitGantt: (string | null)[] = ['Exit/Disposition'];
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo >= absMonth(exitYear, 1) && mo < absMonth(exitYear, exitMonth + 1)) {
      exitGantt.push(EXIT_MARK);
    } else {
      exitGantt.push(EMPTY);
    }
  }
  data.push(exitGantt);

  // --- Combined timeline bar ---
  const combinedGantt: (string | null)[] = ['Combined Timeline'];
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo < constructionDevMonths) {
      combinedGantt.push('C');   // Construction
    } else if (mo >= creditStartAbsMo && mo < creditEndAbsMo) {
      combinedGantt.push('L');   // LIHTC
    } else if (mo >= absMonth(exitYear, 1) && mo <= absMonth(exitYear, exitMonth)) {
      combinedGantt.push('X');   // Exit
    } else {
      combinedGantt.push('·');   // Inactive
    }
  }
  data.push(combinedGantt);

  data.push([]);

  // ==================== SECTION 5: Month-precise formula ====================
  data.push(['MONTH-PRECISE CALCULATION']);
  if (timeline) {
    data.push([`Investment: ${formatDate(timeline.investmentDate)} → PIS: ${formatDate(timeline.pisDate)} (${constructionDevMonths} mo construction)`]);
    data.push([`Credit Period: ${creditPeriodFromPIS} years (${creditStartYear}–${lastCreditYear})${timeline.electDeferCreditPeriod ? ' [§42(f)(1) election]' : ''}`]);
    data.push([`Total Hold: ${timeline.totalHoldMonths} months = ${totalInvestmentYears} investment years`]);
    data.push([`Exit: ${formatDate(timeline.actualExitDate)}${timeline.isExtended ? ' (extended)' : ' (optimal)'}`]);
  } else {
    const totalMonthsCalc = constructionDevMonths + (creditPeriodFromPIS * 12);
    data.push([`Construction: ${constructionDevMonths} mo + Credits: ${creditPeriodFromPIS}×12=${creditPeriodFromPIS * 12} mo = ${totalMonthsCalc} months`]);
    data.push([`ceil(${totalMonthsCalc} / 12) + 1 disposition = ${Math.ceil(totalMonthsCalc / 12) + 1} years total investment duration`]);
    data.push([`Exit year: floor(${constructionDevMonths}/12) + ${creditPeriodFromPIS} + 1 = ${exitYear} (property sold, proceeds received)`]);
  }
  data.push([]);
  data.push(['LEGEND: C = Construction | L = LIHTC Credits | X = Exit/Disposition | · = No activity']);

  // Convert to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths: label column wide, month columns narrow (3 chars each)
  ws['!cols'] = [
    { wch: 24 },  // Label
    ...Array(totalMonths).fill({ wch: 3 }),  // Month columns
  ];

  return { sheet: ws, namedRanges };
}
