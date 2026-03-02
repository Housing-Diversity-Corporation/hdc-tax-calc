/**
 * Timing Clock Gantt Chart — Excel Sheet Builder
 *
 * Visual Gantt chart at MONTH-level resolution. Each column = 1 month.
 * Horizontal bars formed by Unicode block characters (████) show when
 * each clock is active. Auditors can visually trace clock interactions
 * and verify month-level precision.
 *
 * Layout:
 *   Section 1: Input summary + computed timing values
 *   Section 2: Stacked bar chart data (for Excel charting — select & insert stacked bar)
 *   Section 3: Visual Gantt grid (month columns with █/░ block characters)
 */

import * as XLSX from 'xlsx';
import { CalculationParams } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition } from '../types';
import { computeHoldPeriod } from '../../computeHoldPeriod';

const MONTH_ABBR = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Block characters for visual bars
const FULL = '██';    // Active period
const HALF = '▓▓';    // Partial (prorated) period
const SPILL = '░░';   // Delay spillover
const EXIT_MARK = '▼▼';  // Exit marker
const EMPTY = '';

export function buildTimingGanttSheet(rawParams: CalculationParams): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];

  const pisMonth = rawParams.placedInServiceMonth || 7;
  const constructionDevMonths = rawParams.constructionDelayMonths || 0;
  const taxBenefitDelayMonths = rawParams.taxBenefitDelayMonths || 0;
  const exitMonth = rawParams.exitMonth || 12;
  const ozEnabled = rawParams.ozEnabled || false;

  const {
    holdFromPIS,
    totalInvestmentYears,
    exitYear,
    delaySpilloverYears,
  } = computeHoldPeriod(pisMonth, constructionDevMonths, taxBenefitDelayMonths);

  const creditPeriodFromPIS = pisMonth > 1 ? 11 : 10;
  const prePISYears = Math.floor(constructionDevMonths / 12);
  const placedInServiceYear = prePISYears + 1;
  const totalMonths = totalInvestmentYears * 12;
  const lastCreditYear = placedInServiceYear + creditPeriodFromPIS - 1;

  const data: (string | number | null)[][] = [];

  // ==================== SECTION 1: Summary ====================
  data.push(['TIMING CLOCK GANTT CHART']);
  data.push(['Month-Level Precision Audit — All 4 Clocks Visualized']);
  data.push([]);

  data.push(['INPUTS', '', 'Value', '', 'COMPUTED', '', 'Value']);
  data.push(['Construction Period', '', `${constructionDevMonths} mo`, '', 'PIS Year', '', placedInServiceYear]);
  data.push(['PIS Month', '', MONTH_NAMES[pisMonth - 1], '', 'Credit Period', '', `${creditPeriodFromPIS} yr`]);
  data.push(['K-1 Delay', '', `${taxBenefitDelayMonths} mo`, '', 'Exit Year', '', exitYear]);
  data.push(['Exit Month', '', MONTH_NAMES[exitMonth - 1], '', 'Total Duration', '', `${totalInvestmentYears} yr`]);
  data.push(['OZ Enabled', '', ozEnabled ? 'Yes' : 'No', '', 'Delay Spillover', '', `${delaySpilloverYears} yr`]);
  data.push([]);

  // ==================== SECTION 2: Chart-Ready Data ====================
  // Stacked bar data: select rows 11-16 + column headers → Insert → Stacked Bar = instant Gantt
  data.push(['CHART DATA (select this block → Insert → Stacked Bar Chart)']);
  data.push(['Phase', 'Start (months)', 'Duration (months)']);

  const ozStartMo = 0;
  const ozDurationMo = Math.min(120, totalMonths);
  const constStartMo = 0;
  const constDurationMo = constructionDevMonths;
  const creditStartMo = constructionDevMonths;
  const creditDurationMo = creditPeriodFromPIS * 12;
  const delayStartMo = constructionDevMonths + creditDurationMo;
  const delayDurationMo = taxBenefitDelayMonths;
  const exitStartMo = (exitYear - 1) * 12;
  const exitDurationMo = exitMonth;

  if (ozEnabled) data.push(['OZ Hold (10yr)', ozStartMo, ozDurationMo]);
  data.push(['Construction', constStartMo, constDurationMo]);
  data.push(['LIHTC Credits', creditStartMo, creditDurationMo]);
  if (taxBenefitDelayMonths > 0) data.push(['K-1 Delay', delayStartMo, delayDurationMo]);
  data.push(['Disposition', exitStartMo, exitDurationMo]);
  data.push([]);

  // ==================== SECTION 3: Visual Gantt Grid ====================
  data.push(['VISUAL GANTT — Each column = 1 month    ██ = active    ▓▓ = prorated    ░░ = delay spillover    ▼▼ = exit']);
  data.push([]);

  // Month header row: Year 1 (J F M A M J J A S O N D) | Year 2 (J F M ...) | ...
  const monthHeader: (string | number | null)[] = [''];
  for (let y = 1; y <= totalInvestmentYears; y++) {
    for (let m = 0; m < 12; m++) {
      monthHeader.push(MONTH_ABBR[m]);
    }
  }
  data.push(monthHeader);

  // Year label row (merged across 12 columns each)
  const yearHeader: (string | number | null)[] = [''];
  for (let y = 1; y <= totalInvestmentYears; y++) {
    yearHeader.push(`── Year ${y} ──`);
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
  const creditStartAbsMo = constructionDevMonths;
  const creditEndAbsMo = constructionDevMonths + (creditPeriodFromPIS * 12);
  for (let mo = 0; mo < totalMonths; mo++) {
    if (mo >= creditStartAbsMo && mo < creditEndAbsMo) {
      // First partial year
      if (mo === creditStartAbsMo) {
        lihtcGantt.push(HALF);
      } else if (mo < creditStartAbsMo + (13 - pisMonth)) {
        // First year months in service
        lihtcGantt.push(FULL);
      } else if (mo === creditStartAbsMo + (13 - pisMonth) && pisMonth > 1) {
        // Transition to Year 2
        lihtcGantt.push(FULL);
      } else if (mo >= creditEndAbsMo - (pisMonth - 1) && pisMonth > 1) {
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

  // --- Clock 4: K-1 Delay Shift ---
  const delayGantt: (string | null)[] = ['Clock 4: K-1 Delay'];
  const exitAbsMo = absMonth(exitYear, exitMonth);
  for (let mo = 0; mo < totalMonths; mo++) {
    if (taxBenefitDelayMonths > 0 && mo >= creditEndAbsMo && mo < creditEndAbsMo + taxBenefitDelayMonths) {
      delayGantt.push(SPILL);
    } else {
      delayGantt.push(EMPTY);
    }
  }
  data.push(delayGantt);

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
    } else if (taxBenefitDelayMonths > 0 && mo >= creditEndAbsMo && mo < creditEndAbsMo + taxBenefitDelayMonths) {
      combinedGantt.push('D');   // Delay
    } else if (mo >= absMonth(exitYear, 1) && mo <= exitAbsMo) {
      combinedGantt.push('X');   // Exit
    } else {
      combinedGantt.push('·');   // Inactive
    }
  }
  data.push(combinedGantt);

  data.push([]);

  // ==================== SECTION 4: Month-precise formula ====================
  data.push(['MONTH-PRECISE CALCULATION']);
  const totalMonthsCalc = constructionDevMonths + (creditPeriodFromPIS * 12) + taxBenefitDelayMonths;
  data.push([`Construction: ${constructionDevMonths} mo + Credits: ${creditPeriodFromPIS}×12=${creditPeriodFromPIS * 12} mo + Delay: ${taxBenefitDelayMonths} mo = ${totalMonthsCalc} months`]);
  data.push([`ceil(${totalMonthsCalc} / 12) + 1 disposition = ${Math.ceil(totalMonthsCalc / 12) + 1} years total investment duration`]);
  data.push([`Exit year: floor(${constructionDevMonths}/12) + ${creditPeriodFromPIS} + 1 = ${exitYear} (property sold, proceeds received)`]);
  if (delaySpilloverYears > 0) {
    data.push([`Delay spillover: ${delaySpilloverYears} additional year(s) for delayed K-1 benefit realization (IRR accuracy)`]);
  }
  data.push([]);
  data.push(['LEGEND: C = Construction | L = LIHTC Credits | D = K-1 Delay Spillover | X = Exit/Disposition | · = No activity']);

  // Convert to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths: label column wide, month columns narrow (3 chars each)
  ws['!cols'] = [
    { wch: 24 },  // Label
    ...Array(totalMonths).fill({ wch: 3 }),  // Month columns
  ];

  return { sheet: ws, namedRanges };
}
