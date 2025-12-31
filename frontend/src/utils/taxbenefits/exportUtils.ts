/**
 * Export utilities for HDC Calculator
 * Provides CSV and other export functionality
 */

import { InvestorAnalysisResults, HDCAnalysisResults } from '../../types/taxbenefits';
import { formatCurrency, formatPercent } from './formatters';

/**
 * Convert investor analysis results to CSV format
 * @param results - The investor analysis results
 * @param fileName - Optional file name (without extension)
 * @returns CSV string
 */
export const exportInvestorResultsToCSV = (
  results: InvestorAnalysisResults
): string => {
  const headers = [
    'Year',
    'NOI',
    'Debt Service',
    'Cash After Debt',
    'AUM Fee',
    'Cash After Fees',
    'Tax Benefit',
    'Operating Cash Flow',
    'Sub-Debt Interest Paid',
    'Investor Sub-Debt Received',
    'PIK Accrued',
    'PIK Balance',
    'Total Cash Flow',
    'Cumulative Returns'
  ];

  const rows = results.investorCashFlows.map(cf => [
    cf.year,
    formatCurrency(cf.noi),
    formatCurrency(cf.debtServicePayments),
    formatCurrency(cf.cashAfterDebtService),
    formatCurrency(cf.aumFeeAmount),
    formatCurrency(cf.cashAfterDebtAndFees),
    formatCurrency(cf.taxBenefit),
    formatCurrency(cf.operatingCashFlow),
    formatCurrency(cf.subDebtInterest),
    formatCurrency(cf.investorSubDebtInterestReceived || 0),
    formatCurrency(cf.investorSubDebtPIKAccrued || 0),
    formatCurrency(cf.investorPikBalance || 0),
    formatCurrency(cf.totalCashFlow),
    formatCurrency(cf.cumulativeReturns)
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['Summary Metrics', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Total Investment', formatCurrency(results.totalInvestment), '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Total Returns', formatCurrency(results.totalReturns), '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Exit Proceeds', formatCurrency(results.exitProceeds), '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Equity Multiple', `${results.multiple.toFixed(2)}x`, '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['IRR', formatPercent(results.irr), '', '', '', '', '', '', '', '', '', '', '', '']);

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Convert HDC analysis results to CSV format
 * @param results - The HDC analysis results
 * @param fileName - Optional file name (without extension)
 * @returns CSV string
 */
export const exportHDCResultsToCSV = (
  results: HDCAnalysisResults
): string => {
  const headers = [
    'Year',
    'NOI',
    'Debt Service',
    'Cash After Debt',
    'AUM Fee Amount',
    'AUM Fee Income',
    'AUM Fee Accrued',
    'Cash After Fees',
    'HDC Fee Income',
    'Philanthropic Share',
    'HDC Sub-Debt Current Pay',
    'HDC PIK Accrued',
    'Promote Share',
    'Total Cash Flow',
    'Cumulative Returns',
    'PIK Balance'
  ];

  const rows = results.hdcCashFlows.map(cf => [
    cf.year,
    formatCurrency(cf.noi),
    formatCurrency(cf.debtServicePayments),
    formatCurrency(cf.cashAfterDebtService),
    formatCurrency(cf.aumFeeAmount),
    formatCurrency(cf.aumFeeIncome),
    formatCurrency(cf.aumFeeAccrued),
    formatCurrency(cf.cashAfterDebtAndAumFee),
    formatCurrency(cf.hdcFeeIncome),
    formatCurrency(cf.philanthropicShare),
    formatCurrency(cf.hdcSubDebtCurrentPay),
    formatCurrency(cf.hdcSubDebtPIKAccrued),
    formatCurrency(cf.promoteShare),
    formatCurrency(cf.totalCashFlow),
    formatCurrency(cf.cumulativeReturns),
    formatCurrency(cf.pikBalance)
  ]);

  // Add summary row
  rows.push([]);
  rows.push(['Summary Metrics', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['HDC Initial Investment', formatCurrency(results.hdcInitialInvestment), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Total HDC Returns', formatCurrency(results.totalHDCReturns), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['HDC Exit Proceeds', formatCurrency(results.hdcExitProceeds), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['HDC Multiple', `${results.hdcMultiple.toFixed(2)}x`, '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['HDC IRR', formatPercent(results.hdcIRR), '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Download CSV file to user's computer
 * @param csvContent - The CSV content string
 * @param fileName - The file name (without extension)
 */
export const downloadCSV = (csvContent: string, fileName: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};

/**
 * Export both investor and HDC results to a single CSV
 * @param investorResults - The investor analysis results
 * @param hdcResults - The HDC analysis results
 * @param fileName - Optional file name (without extension)
 */
export const exportCombinedResultsToCSV = (
  investorResults: InvestorAnalysisResults | null,
  hdcResults: HDCAnalysisResults | null,
  fileName = 'hdc-calculator-results'
): void => {
  let csvContent = '';
  
  if (investorResults) {
    csvContent += 'INVESTOR ANALYSIS\n';
    csvContent += exportInvestorResultsToCSV(investorResults);
  }
  
  if (hdcResults) {
    if (csvContent) csvContent += '\n\n';
    csvContent += 'HDC ANALYSIS\n';
    csvContent += exportHDCResultsToCSV(hdcResults);
  }
  
  if (csvContent) {
    downloadCSV(csvContent, fileName);
  }
};

/**
 * Format results as JSON for export
 * @param investorResults - The investor analysis results
 * @param hdcResults - The HDC analysis results
 * @returns JSON string
 */
export const exportResultsToJSON = (
  investorResults: InvestorAnalysisResults | null,
  hdcResults: HDCAnalysisResults | null
): string => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    investorAnalysis: investorResults,
    hdcAnalysis: hdcResults
  }, null, 2);
};