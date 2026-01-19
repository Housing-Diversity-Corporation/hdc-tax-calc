/**
 * IMPL-056: Live Calculation Excel Model - Debt Schedule Sheet
 *
 * Sheet 3: Year-by-year debt amortization with PMT formulas.
 * Tracks senior debt principal/interest and philanthropic debt interest.
 */

import * as XLSX from 'xlsx';
import { CalculationParams, CashFlowItem } from '../../../../types/taxbenefits';
import { SheetResult, NamedRangeDefinition, FormulaCell } from '../types';

/**
 * Build the Debt Schedule sheet with year-by-year amortization
 */
export function buildDebtScheduleSheet(
  params: CalculationParams,
  cashFlows: CashFlowItem[]
): SheetResult {
  const namedRanges: NamedRangeDefinition[] = [];
  const ws: XLSX.WorkSheet = {};

  const holdPeriod = params.holdPeriod || 10;
  const projectCost = params.projectCost;

  // Pre-calculate values
  const seniorDebt = projectCost * (params.seniorDebtPct || 0) / 100;
  const philDebt = projectCost * (params.philanthropicDebtPct || 0) / 100;
  const seniorRate = (params.seniorDebtRate || 5) / 100;
  const philRate = (params.philanthropicDebtRate || 0) / 100;
  const amortYears = params.seniorDebtAmortization || 35;
  const ioYears = params.seniorDebtIOYears || 0;

  // Monthly payment calculation (for P&I periods)
  const monthlyRate = seniorRate / 12;
  const totalPayments = amortYears * 12;
  const monthlyPayment = seniorDebt > 0
    ? (seniorDebt * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    : 0;
  const annualPayment = monthlyPayment * 12;

  // Header
  ws['A1'] = { t: 's', v: 'DEBT SCHEDULE' };
  ws['A2'] = { t: 's', v: '' };

  // Column headers
  ws['A3'] = { t: 's', v: 'Year' };
  ws['B3'] = { t: 's', v: 'Senior BOY Balance' };
  ws['C3'] = { t: 's', v: 'Senior Interest' };
  ws['D3'] = { t: 's', v: 'Senior Principal' };
  ws['E3'] = { t: 's', v: 'Senior Payment' };
  ws['F3'] = { t: 's', v: 'Senior EOY Balance' };
  ws['G3'] = { t: 's', v: 'Phil Interest' };
  ws['H3'] = { t: 's', v: 'Phil Balance' };
  ws['I3'] = { t: 's', v: 'Hard Debt Service' };

  // Year-by-year data
  let seniorBalance = seniorDebt;

  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3; // Data starts at row 4

    // Year
    ws[`A${row}`] = { t: 'n', v: year };

    // Senior Beginning Balance
    if (year === 1) {
      ws[`B${row}`] = { t: 'n', v: seniorDebt, f: 'SeniorDebt' } as FormulaCell;
    } else {
      ws[`B${row}`] = { t: 'n', v: seniorBalance, f: `F${row - 1}` } as FormulaCell;
    }

    // Senior Interest
    const interest = seniorBalance * seniorRate;
    ws[`C${row}`] = { t: 'n', v: interest, f: `B${row}*SeniorDebtRate/100` } as FormulaCell;

    // Senior Principal (0 during IO period)
    let principal = 0;
    if (year > ioYears && seniorDebt > 0) {
      // Simplified: after IO, use amortizing payment minus interest
      principal = Math.max(0, annualPayment - interest);
    }
    const principalFormula = ioYears > 0
      ? `IF(A${row}<=SeniorDebtIOYears,0,E${row}-C${row})`
      : `E${row}-C${row}`;
    ws[`D${row}`] = { t: 'n', v: principal, f: principalFormula } as FormulaCell;

    // Senior Payment
    const payment = year <= ioYears ? interest : annualPayment;
    const paymentFormula = ioYears > 0
      ? `IF(A${row}<=SeniorDebtIOYears,C${row},-PMT(SeniorDebtRate/100/12,SeniorDebtAmort*12,SeniorDebt)*12)`
      : `-PMT(SeniorDebtRate/100/12,SeniorDebtAmort*12,SeniorDebt)*12`;
    ws[`E${row}`] = { t: 'n', v: payment, f: paymentFormula } as FormulaCell;

    // Senior EOY Balance
    const eoyBalance = seniorBalance - principal;
    ws[`F${row}`] = { t: 'n', v: eoyBalance, f: `B${row}-D${row}` } as FormulaCell;

    // Phil Interest
    const philInterest = philDebt * philRate;
    ws[`G${row}`] = { t: 'n', v: philInterest, f: 'PhilDebt*PhilDebtRate/100' } as FormulaCell;

    // Phil Balance (no amortization)
    ws[`H${row}`] = { t: 'n', v: philDebt, f: 'PhilDebt' } as FormulaCell;

    // Hard Debt Service (Senior Payment + Phil Interest)
    const hardDS = payment + philInterest;
    ws[`I${row}`] = { t: 'n', v: hardDS, f: `E${row}+G${row}` } as FormulaCell;

    // Update balance for next iteration
    seniorBalance = eoyBalance;
  }

  // Named ranges for key values
  const lastRow = holdPeriod + 3;
  namedRanges.push({ name: 'SeniorBalanceAtExit', ref: `Debt_Schedule!$F$${lastRow}` });
  namedRanges.push({ name: 'PhilBalanceAtExit', ref: `Debt_Schedule!$H$${lastRow}` });

  // Add yearly named ranges for Hard Debt Service
  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3;
    namedRanges.push({ name: `HardDS_Y${year}`, ref: `Debt_Schedule!$I$${row}` });
  }

  // Set sheet range
  ws['!ref'] = `A1:I${lastRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Year
    { wch: 18 }, // Senior BOY Balance
    { wch: 15 }, // Senior Interest
    { wch: 15 }, // Senior Principal
    { wch: 15 }, // Senior Payment
    { wch: 18 }, // Senior EOY Balance
    { wch: 12 }, // Phil Interest
    { wch: 12 }, // Phil Balance
    { wch: 15 }, // Hard Debt Service
  ];

  return { sheet: ws, namedRanges };
}
