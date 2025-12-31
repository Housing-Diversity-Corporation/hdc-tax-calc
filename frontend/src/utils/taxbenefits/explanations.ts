/**
 * Calculation explanations and tooltips for HDC Calculator
 * Provides user-friendly descriptions of financial metrics
 */

export const CALCULATION_EXPLANATIONS = {
  // Return Metrics
  irr: {
    label: 'IRR (Internal Rate of Return)',
    short: 'Annualized return rate',
    detailed: 'The discount rate that makes the net present value (NPV) of all cash flows equal to zero. Higher IRR indicates better investment performance.'
  },
  
  roe: {
    label: 'ROE (Return on Equity)',
    short: 'Return on equity invested',
    detailed: 'Net income divided by shareholder equity. Measures the profitability relative to equity investment.'
  },
  
  multiple: {
    label: 'Equity Multiple',
    short: 'Total return divided by investment',
    detailed: 'Total cash distributions divided by total invested capital. A multiple of 2.0x means doubling your investment.'
  },

  // Debt Metrics
  dscr: {
    label: 'DSCR (Debt Service Coverage Ratio)',
    short: 'NOI divided by debt payments',
    detailed: 'Net Operating Income divided by total debt service. A DSCR above 1.0 indicates sufficient cash flow to cover debt payments.'
  },
  
  ltv: {
    label: 'LTV (Loan-to-Value)',
    short: 'Loan amount divided by property value',
    detailed: 'Total debt divided by project cost or value. Lower LTV indicates less leverage and lower risk.'
  },

  // Income Metrics
  noi: {
    label: 'NOI (Net Operating Income)',
    short: 'Revenue minus operating expenses',
    detailed: 'Total revenue minus operating expenses, before debt service and taxes. Key metric for property performance.'
  },
  
  cashFlow: {
    label: 'Cash Flow',
    short: 'Cash available for distribution',
    detailed: 'NOI minus debt service and other obligations. The actual cash available for equity distributions.'
  },

  // PIK Interest
  pikInterest: {
    label: 'PIK Interest',
    short: 'Payment-in-Kind interest',
    detailed: 'Interest that accrues and compounds rather than being paid in cash. PIK interest is added to the principal balance and paid at exit.'
  },
  
  pikCurrentPay: {
    label: 'PIK Current Pay',
    short: 'Cash portion of PIK interest',
    detailed: 'The percentage of PIK interest paid in cash currently, with the remainder accruing to the balance.'
  },

  // Exit Metrics
  exitValue: {
    label: 'Exit Value',
    short: 'Property value at sale',
    detailed: 'Estimated property value at exit, calculated by dividing the final year NOI by the exit cap rate.'
  },
  
  exitCapRate: {
    label: 'Exit Cap Rate',
    short: 'NOI yield at exit',
    detailed: 'The capitalization rate used to determine exit value. Lower cap rates result in higher valuations.'
  },

  // Promote/Waterfall
  promoteShare: {
    label: 'Promote Share',
    short: 'GP/LP profit split',
    detailed: 'The percentage of profits allocated to each party after return of capital. Typically structured as a waterfall with hurdles.'
  },
  
  preferredReturn: {
    label: 'Preferred Return',
    short: 'Minimum return threshold',
    detailed: 'The minimum annual return that must be achieved before profit sharing. Common preferred returns range from 6-10%.'
  },

  // Fee Structures
  hdcFee: {
    label: 'HDC Fee',
    short: 'Development fee',
    detailed: 'One-time fee paid to HDC for structuring and managing the development project.'
  },
  
  aumFee: {
    label: 'AUM Fee',
    short: 'Asset management fee',
    detailed: 'Annual fee based on assets under management, typically 1-2% of project cost. May accrue if cash flow insufficient.'
  },

  // Tax Benefits
  taxBenefit: {
    label: 'Tax Benefit',
    short: 'Tax credits and deductions',
    detailed: 'Value of tax credits, depreciation, and other tax benefits passed through to investors.'
  },
  
  depreciation: {
    label: 'Depreciation',
    short: 'Non-cash tax deduction',
    detailed: 'Annual tax deduction for property wear and tear. Residential: 27.5 years, Commercial: 39 years.'
  },

  // Growth Assumptions
  revenueGrowth: {
    label: 'Revenue Growth',
    short: 'Annual revenue increase',
    detailed: 'Expected annual percentage increase in rental income and other revenue. Typically 2-4% for stabilized properties.'
  },
  
  expenseGrowth: {
    label: 'Expense Growth',
    short: 'Annual expense increase',
    detailed: 'Expected annual percentage increase in operating expenses. Often tracks inflation at 2-3%.'
  },

  // Capital Structure
  seniorDebt: {
    label: 'Senior Debt',
    short: 'First-priority loan',
    detailed: 'Primary mortgage with first claim on property and cash flows. Typically 60-75% of project cost at lowest rates.'
  },
  
  subordinateDebt: {
    label: 'Subordinate Debt',
    short: 'Second-position loan',
    detailed: 'Debt with lower priority than senior debt. Higher interest rates due to increased risk.'
  },
  
  philanthropicEquity: {
    label: 'Philanthropic Equity',
    short: 'Impact investment equity',
    detailed: 'Equity investment from philanthropic sources, often with below-market return expectations for social impact.'
  }
};

/**
 * Get explanation for a calculation metric
 * @param key - The metric key
 * @param level - Level of detail ('short' or 'detailed')
 * @returns The explanation text
 */
export const getExplanation = (
  key: keyof typeof CALCULATION_EXPLANATIONS,
  level: 'short' | 'detailed' = 'short'
): string => {
  const explanation = CALCULATION_EXPLANATIONS[key];
  if (!explanation) return '';
  return level === 'short' ? explanation.short : explanation.detailed;
};

/**
 * Get all metric labels for display
 * @returns Object with metric keys and their display labels
 */
export const getMetricLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {};
  
  Object.entries(CALCULATION_EXPLANATIONS).forEach(([key, value]) => {
    labels[key] = value.label;
  });
  
  return labels;
};