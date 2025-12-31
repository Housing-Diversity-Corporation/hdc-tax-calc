/**
 * Audit Trace Generator for HDC Calculator
 * Produces a detailed audit trail of all calculations
 */

import { calculateFullInvestorAnalysis } from './calculations';
import { CalculationParams } from '../../types/taxbenefits';

export interface AuditTraceEntry {
  year: number;
  category: string;
  item: string;
  amount: number;
  formula?: string;
  notes?: string;
}

export interface AuditReport {
  parameters: CalculationParams;
  calculations: AuditTraceEntry[];
  summaries: {
    totalTaxBenefits: number;
    totalDeferredFees: number;
    totalInterestPaid: number;
    finalIRR: number;
    dscrCompliance: boolean[];
  };
  warnings: string[];
}

export function generateAuditTrace(params: CalculationParams): AuditReport {
  const results = calculateFullInvestorAnalysis(params);
  const auditEntries: AuditTraceEntry[] = [];
  const warnings: string[] = [];
  const dscrCompliance: boolean[] = [];

  // Trace each year's calculations
  results.investorCashFlows.forEach((cf: any, index: number) => {
    const year = index + 1;

    // Revenue & Operations
    auditEntries.push({
      year,
      category: 'Revenue',
      item: 'NOI',
      amount: cf.noi || 0,
      formula: `Year ${year - 1} NOI * growth rate`,
      notes: 'Net Operating Income'
    });

    // Debt Service
    if (cf.hardDebtService) {
      auditEntries.push({
        year,
        category: 'Debt Service',
        item: 'Senior Debt Payment',
        amount: cf.hardDebtService,
        formula: `Principal + Interest`,
        notes: 'Hard debt service payment'
      });
    }

    // Tax Benefits
    if (cf.taxBenefit) {
      auditEntries.push({
        year,
        category: 'Tax Benefits',
        item: 'Depreciation Tax Benefit',
        amount: cf.taxBenefit,
        formula: `Depreciation * Effective Tax Rate`,
        notes: year === 1 ? 'Includes bonus depreciation' : 'Straight-line depreciation'
      });
    }

    // HDC Fees
    if (cf.aumFeePaid || cf.aumFeeAccrued) {
      auditEntries.push({
        year,
        category: 'HDC Fees',
        item: 'AUM Fee',
        amount: (cf.aumFeePaid || 0) + (cf.aumFeeAccrued || 0),
        formula: `Project Cost * AUM Fee Rate`,
        notes: `Paid: ${cf.aumFeePaid || 0}, Deferred: ${cf.aumFeeAccrued || 0}`
      });
    }

    // OZ Tax Payment
    if (cf.ozYear5TaxPayment) {
      auditEntries.push({
        year,
        category: 'OZ Taxes',
        item: 'Year 5 OZ Tax Payment',
        amount: cf.ozYear5TaxPayment,
        formula: `Deferred Gains * (1 - StepUp%) * CapGainsRate`,
        notes: `Step-up: ${params.ozType === 'rural' ? '30%' : '10%'}`
      });
    }

    // DSCR Check
    dscrCompliance.push(cf.dscr >= 1.05);
    if (cf.dscr < 1.05) {
      warnings.push(`Year ${year}: DSCR ${cf.dscr.toFixed(2)} below 1.05 target`);
    }

    // Sub-debt and PIK tracking
    if (cf.outsideInvestorCurrentPay) {
      auditEntries.push({
        year,
        category: 'Sub-Debt',
        item: 'Outside Investor Current Pay',
        amount: cf.outsideInvestorCurrentPay,
        notes: 'Priority 1 payment'
      });
    }

    if (cf.outsideInvestorPIKAccrued) {
      auditEntries.push({
        year,
        category: 'Sub-Debt',
        item: 'Outside Investor PIK Accrued',
        amount: cf.outsideInvestorPIKAccrued,
        formula: `Balance * Sub-Debt PIK Rate`,
        notes: 'Deferred and compounding'
      });
    }
  });

  // Calculate summaries
  const summaries = {
    totalTaxBenefits: results.investorCashFlows.reduce(
      (sum: number, cf: any) => sum + (cf.taxBenefit || 0), 0
    ),
    totalDeferredFees: results.investorCashFlows.reduce(
      (sum: number, cf: any) => sum + (cf.aumFeeAccrued || 0), 0
    ),
    totalInterestPaid: results.investorCashFlows.reduce(
      (sum: number, cf: any) => sum + (cf.hardDebtService || 0), 0
    ),
    finalIRR: results.investorIRR || 0,
    dscrCompliance
  };

  // Add warnings for key audit concerns
  if ((params as any).ozEnabled && !(params as any).deferredCapitalGains) {
    warnings.push('OZ enabled but no deferred capital gains specified');
  }

  if ((params as any).aumFeeEnabled && (params as any).aumCurrentPayEnabled) {
    warnings.push(`AUM fee current pay enabled - verify DSCR impact`);
  }

  return {
    parameters: params,
    calculations: auditEntries,
    summaries,
    warnings
  };
}

/**
 * Export audit report to CSV format for spreadsheet analysis
 */
export function exportAuditToCSV(report: AuditReport): string {
  const headers = ['Year', 'Category', 'Item', 'Amount', 'Formula', 'Notes'];
  const rows = report.calculations.map(entry => [
    entry.year,
    entry.category,
    entry.item,
    entry.amount.toFixed(2),
    entry.formula || '',
    entry.notes || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * Generate a comprehensive audit package
 */
export function generateFullAuditPackage(params: CalculationParams) {
  const auditTrace = generateAuditTrace(params);
  const csvExport = exportAuditToCSV(auditTrace);

  return {
    trace: auditTrace,
    csv: csvExport,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    enginePath: '/src/utils/taxbenefits/calculations.ts'
  };
}