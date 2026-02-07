/**
 * IMPL-056: Live Calculation Excel Model - Debt Schedule Sheet
 *
 * Sheet 3: Year-by-year debt amortization with PMT formulas.
 * Tracks senior debt principal/interest, philanthropic debt interest, and PAB debt.
 * ISS-070S: Added PAB columns for Private Activity Bonds
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

  // ISS-070S: PAB parameters
  const pabEnabled = params.pabEnabled && params.lihtcEnabled && (params.lihtcEligibleBasis || 0) > 0;
  const pabAmount = pabEnabled
    ? (params.lihtcEligibleBasis || 0) * ((params.pabPctOfEligibleBasis || 30) / 100)
    : 0;
  const pabRate = (params.pabRate || 4.5) / 100;
  const pabAmortYears = params.pabAmortization || 40;
  const pabIOYears = params.pabIOYears || 0;

  // PAB monthly payment calculation (for P&I periods)
  const pabMonthlyRate = pabRate / 12;
  const pabTotalPayments = pabAmortYears * 12;
  const pabMonthlyPayment = pabAmount > 0 && pabMonthlyRate > 0
    ? (pabAmount * pabMonthlyRate * Math.pow(1 + pabMonthlyRate, pabTotalPayments)) /
      (Math.pow(1 + pabMonthlyRate, pabTotalPayments) - 1)
    : 0;
  const pabAnnualPayment = pabMonthlyPayment * 12;

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

  // Column headers (ISS-070S: Added PAB columns I-M, moved Hard DS to N)
  ws['A3'] = { t: 's', v: 'Year' };
  ws['B3'] = { t: 's', v: 'Senior BOY Balance' };
  ws['C3'] = { t: 's', v: 'Senior Interest' };
  ws['D3'] = { t: 's', v: 'Senior Principal' };
  ws['E3'] = { t: 's', v: 'Senior Payment' };
  ws['F3'] = { t: 's', v: 'Senior EOY Balance' };
  ws['G3'] = { t: 's', v: 'Phil Interest' };
  ws['H3'] = { t: 's', v: 'Phil Balance' };
  // ISS-070S: PAB columns
  ws['I3'] = { t: 's', v: 'PAB BOY Balance' };
  ws['J3'] = { t: 's', v: 'PAB Interest' };
  ws['K3'] = { t: 's', v: 'PAB Principal' };
  ws['L3'] = { t: 's', v: 'PAB Payment' };
  ws['M3'] = { t: 's', v: 'PAB EOY Balance' };
  // Hard DS now in column N
  ws['N3'] = { t: 's', v: 'Hard Debt Service' };

  // Add PABDebt named range (calculated from LIHTC Eligible Basis)
  // Formula: =IF(AND(PABEnabled=1,FedLIHTCEnabled=1),LIHTCEligibleBasis*PABPctOfEligibleBasis/100,0)
  namedRanges.push({
    name: 'PABDebt',
    ref: 'Debt_Schedule!$I$4',
    // Note: The actual formula is in the cell, this ref points to the first BOY Balance
  });

  // ISS-070Y: Helper function for proper monthly amortization balance calculation
  // This matches Excel's PMT-based formula exactly
  const calculateMonthlyAmortizedBalance = (
    principal: number,
    annualRate: number,
    amortYears: number,
    monthsOfPayments: number
  ): number => {
    if (principal === 0 || monthsOfPayments === 0) return principal;
    if (annualRate === 0) return Math.max(0, principal - (monthsOfPayments * principal / (amortYears * 12)));

    const r = annualRate / 12; // Monthly rate
    const n = amortYears * 12; // Total payments

    // Monthly payment using same formula as Excel PMT
    const pmt = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Remaining balance after p payments using closed-form formula
    // Balance = Principal × [(1+r)^n - (1+r)^p] / [(1+r)^n - 1]
    const p = monthsOfPayments;
    const balance = principal * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1);

    return Math.max(0, balance);
  };

  // Year-by-year data using proper monthly amortization
  let seniorBalance = seniorDebt;
  let pabBalance = pabAmount;

  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3; // Data starts at row 4

    // ISS-070Y: Calculate correct balance using monthly amortization
    // During IO period: balance stays at original principal
    // After IO: calculate based on months of P&I payments made
    const monthsOfPIPaymentsThisYear = year <= ioYears ? 0 : (year - ioYears) * 12;
    const correctEoyBalance = monthsOfPIPaymentsThisYear > 0
      ? calculateMonthlyAmortizedBalance(seniorDebt, seniorRate, amortYears, monthsOfPIPaymentsThisYear)
      : seniorDebt;

    // Year
    ws[`A${row}`] = { t: 'n', v: year };

    // Senior Beginning Balance (use previous year's EOY balance or initial debt)
    const boyBalance = year === 1 ? seniorDebt : seniorBalance;
    if (year === 1) {
      ws[`B${row}`] = { t: 'n', v: seniorDebt, f: 'SeniorDebt' } as FormulaCell;
    } else {
      ws[`B${row}`] = { t: 'n', v: seniorBalance, f: `F${row - 1}` } as FormulaCell;
    }

    // Senior Interest (annual interest on BOY balance for display purposes)
    const interest = boyBalance * seniorRate;
    ws[`C${row}`] = { t: 'n', v: interest, f: `B${row}*SeniorDebtRate/100` } as FormulaCell;

    // Senior Principal (0 during IO period)
    // ISS-070Y: Calculate actual principal paid this year using balance difference
    let principal = 0;
    if (year > ioYears && seniorDebt > 0) {
      principal = boyBalance - correctEoyBalance;
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

    // Senior EOY Balance - use correctly calculated balance
    ws[`F${row}`] = { t: 'n', v: correctEoyBalance, f: `B${row}-D${row}` } as FormulaCell;

    // Update seniorBalance for next iteration
    seniorBalance = correctEoyBalance;

    // Phil Interest
    const philInterest = philDebt * philRate;
    ws[`G${row}`] = { t: 'n', v: philInterest, f: 'PhilDebt*PhilDebtRate/100' } as FormulaCell;

    // Phil Balance (no amortization)
    ws[`H${row}`] = { t: 'n', v: philDebt, f: 'PhilDebt' } as FormulaCell;

    // ISS-070S: PAB Beginning Balance
    // Formula: =IF(AND(PABEnabled=1,FedLIHTCEnabled=1), <balance calculation>, 0)
    const pabCondition = 'AND(PABEnabled=1,FedLIHTCEnabled=1)';
    if (year === 1) {
      // Year 1: PAB Amount = LIHTC Eligible Basis * PAB Pct / 100
      const pabAmountFormula = `IF(${pabCondition},LIHTCEligibleBasis*PABPctOfEligibleBasis/100,0)`;
      ws[`I${row}`] = { t: 'n', v: pabAmount, f: pabAmountFormula } as FormulaCell;
    } else {
      // Subsequent years: Previous EOY Balance (only if PAB enabled)
      ws[`I${row}`] = { t: 'n', v: pabBalance, f: `IF(${pabCondition},M${row - 1},0)` } as FormulaCell;
    }

    // PAB Interest
    const pabInterest = pabBalance * pabRate;
    ws[`J${row}`] = { t: 'n', v: pabInterest, f: `I${row}*PABRate/100` } as FormulaCell;

    // PAB Principal (0 during IO period)
    let pabPrincipal = 0;
    if (year > pabIOYears && pabAmount > 0) {
      pabPrincipal = Math.max(0, pabAnnualPayment - pabInterest);
    }
    const pabPrincipalFormula = pabIOYears > 0
      ? `IF(A${row}<=PABIOYears,0,L${row}-J${row})`
      : `L${row}-J${row}`;
    ws[`K${row}`] = { t: 'n', v: pabPrincipal, f: `IF(${pabCondition},${pabPrincipalFormula},0)` } as FormulaCell;

    // PAB Payment
    const pabPaymentValue = year <= pabIOYears ? pabInterest : pabAnnualPayment;
    const pabPaymentFormula = pabIOYears > 0
      ? `IF(A${row}<=PABIOYears,J${row},-PMT(PABRate/100/12,PABAmortization*12,I4)*12)`
      : `-PMT(PABRate/100/12,PABAmortization*12,I4)*12`;
    ws[`L${row}`] = { t: 'n', v: pabEnabled ? pabPaymentValue : 0, f: `IF(${pabCondition},${pabPaymentFormula},0)` } as FormulaCell;

    // PAB EOY Balance
    const pabEoyBalance = pabBalance - pabPrincipal;
    ws[`M${row}`] = { t: 'n', v: pabEnabled ? pabEoyBalance : 0, f: `IF(${pabCondition},I${row}-K${row},0)` } as FormulaCell;

    // ISS-070S: Hard Debt Service (Senior Payment + Phil Interest + PAB Payment if enabled)
    // Formula: =E{row}+G{row}+L{row}
    // Since PAB Payment (L) is already 0 when PAB disabled, we can just add them
    const hardDS = payment + philInterest + (pabEnabled ? pabPaymentValue : 0);
    ws[`N${row}`] = { t: 'n', v: hardDS, f: `E${row}+G${row}+L${row}` } as FormulaCell;

    // Update PAB balance for next iteration
    // Note: seniorBalance is already updated earlier in the loop
    pabBalance = pabEoyBalance;
  }

  // Named ranges for key values
  const lastRow = holdPeriod + 3;
  namedRanges.push({ name: 'SeniorBalanceAtExit', ref: `Debt_Schedule!$F$${lastRow}` });
  namedRanges.push({ name: 'PhilBalanceAtExit', ref: `Debt_Schedule!$H$${lastRow}` });
  // ISS-070S: Add PAB balance at exit
  namedRanges.push({ name: 'PABBalanceAtExit', ref: `Debt_Schedule!$M$${lastRow}` });

  // Add yearly named ranges for Hard Debt Service (now in column N)
  for (let year = 1; year <= holdPeriod; year++) {
    const row = year + 3;
    namedRanges.push({ name: `HardDS_Y${year}`, ref: `Debt_Schedule!$N$${row}` });
  }

  // Set sheet range (now extends to column N)
  ws['!ref'] = `A1:N${lastRow}`;

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // A: Year
    { wch: 18 }, // B: Senior BOY Balance
    { wch: 15 }, // C: Senior Interest
    { wch: 15 }, // D: Senior Principal
    { wch: 15 }, // E: Senior Payment
    { wch: 18 }, // F: Senior EOY Balance
    { wch: 12 }, // G: Phil Interest
    { wch: 12 }, // H: Phil Balance
    { wch: 16 }, // I: PAB BOY Balance
    { wch: 12 }, // J: PAB Interest
    { wch: 12 }, // K: PAB Principal
    { wch: 12 }, // L: PAB Payment
    { wch: 16 }, // M: PAB EOY Balance
    { wch: 15 }, // N: Hard Debt Service
  ];

  return { sheet: ws, namedRanges };
}
