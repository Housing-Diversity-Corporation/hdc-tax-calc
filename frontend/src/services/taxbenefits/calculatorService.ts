import api from '../api';

export interface CalculatorConfiguration {
  id?: number;
  configurationName?: string;
  projectCost: number;
  predevelopmentCosts?: number;
  landValue?: number;
  yearOneNOI: number;
  yearOneDepreciationPct: number;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate?: number;
  exitCapRate: number;
  holdPeriod?: number;
  investorEquityPct: number;
  philanthropicEquityPct: number;
  seniorDebtPct: number;
  seniorDebtRate: number;
  seniorDebtAmortization: number;
  philDebtPct: number;
  philDebtRate: number;
  philDebtAmortization: number;
  philCurrentPayEnabled?: boolean;
  philCurrentPayPct?: number;
  hdcSubDebtPct: number;
  hdcSubDebtPikRate: number;
  pikCurrentPayEnabled?: boolean;
  pikCurrentPayPct?: number;
  investorSubDebtPct: number;
  investorSubDebtPikRate: number;
  investorPikCurrentPayEnabled?: boolean;
  investorPikCurrentPayPct?: number;
  outsideInvestorSubDebtPct?: number;
  outsideInvestorSubDebtPikRate?: number;
  outsideInvestorSubDebtAmortization?: number;
  outsideInvestorPikCurrentPayEnabled?: boolean;
  outsideInvestorPikCurrentPayPct?: number;
  interestReserveEnabled?: boolean;
  interestReserveMonths?: number;
  interestReserveAmount?: number;
  federalTaxRate: number;
  selectedState: string;
  projectLocation?: string;
  stateCapitalGainsRate: number;
  ltCapitalGainsRate: number;
  niitRate: number;
  depreciationRecaptureRate: number;
  deferredGains: number;
  hdcFeeRate: number;
  hdcDeferredInterestRate?: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  aumCurrentPayEnabled?: boolean;
  aumCurrentPayPct?: number;
  investorPromoteShare: number;
  constructionDelayMonths?: number;
  taxBenefitDelayMonths?: number;
  ozEnabled?: boolean;
  ozType?: 'standard' | 'rural';
  ozVersion?: '1.0' | '2.0';  // ISS-043: OZ legislation version
  deferredCapitalGains?: number;
  ozCapitalGainsTaxRate?: number;
  capitalGainsTaxRate?: number;
  stateTaxRate?: number;

  // ISS-043: Senior Debt IO Years
  seniorDebtIOYears?: number;

  // ISS-043: HDC Platform Mode
  hdcPlatformMode?: 'traditional' | 'leverage';

  // ISS-043: Sub-debt payment priority (stored as JSON string)
  subDebtPriority?: string;

  // ISS-043: Private Activity Bonds (PABs)
  pabEnabled?: boolean;
  pabPctOfEligibleBasis?: number;
  pabRate?: number;
  pabTerm?: number;
  pabAmortization?: number;
  pabIOYears?: number;

  // ISS-043: HDC Debt Fund
  hdcDebtFundPct?: number;
  hdcDebtFundPikRate?: number;
  hdcDebtFundCurrentPayEnabled?: boolean;
  hdcDebtFundCurrentPayPct?: number;

  // ISS-043: Federal LIHTC
  lihtcEnabled?: boolean;
  applicableFraction?: number;
  creditRate?: number;
  placedInServiceMonth?: number;
  ddaQctBoost?: boolean;

  // ISS-043: State LIHTC
  stateLIHTCEnabled?: boolean;
  investorState?: string;
  syndicationRate?: number;
  investorHasStateLiability?: boolean;
  stateLIHTCUserPercentage?: number;
  stateLIHTCUserAmount?: number;
  stateLIHTCSyndicationYear?: number;

  // ISS-043: Eligible Basis Exclusions
  commercialSpaceCosts?: number;
  syndicationCosts?: number;
  marketingCosts?: number;
  financingFees?: number;
  bondIssuanceCosts?: number;
  operatingDeficitReserve?: number;
  replacementReserve?: number;
  otherExclusions?: number;

  hdcAdvanceFinancing?: boolean;
  taxAdvanceDiscountRate?: number;
  advanceFinancingRate?: number;
  taxDeliveryMonths?: number;
  autoBalanceCapital?: boolean;
  investorEquityRatio?: number;
  // Investor Tax Strategy
  investorTrack?: 'rep' | 'non-rep';
  passiveGainType?: 'short-term' | 'long-term';
  // ISS-057: Investor Information
  annualIncome?: number;
  filingStatus?: 'single' | 'married';
  // Tax Planning Analysis
  includeDepreciationSchedule?: boolean;
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;
  isDefault?: boolean;
  completionStatus?: 'in-progress' | 'complete';  // Track configuration completeness
  createdAt?: string;
  updatedAt?: string;

  // Investment Portal fields
  isInvestorFacing?: boolean;          // true = show to investors in portal
  dealDescription?: string;            // Investor-friendly description
  dealLocation?: string;               // "Brooklyn, NY"
  dealLatitude?: number;               // Latitude for map
  dealLongitude?: number;              // Longitude for map
  markerId?: number;                   // Map marker ID for location reference
  units?: number;                      // Number of housing units
  affordabilityMix?: string;           // "60% AMI" or "50-80% AMI"
  projectStatus?: 'available' | 'funded' | 'pipeline';
  minimumInvestment?: number;          // Minimum investment amount
  dealImageUrl?: string;               // URL to project rendering/photo

  // Pre-calculated results from main HDC Calculator (stored to avoid recalculation in Investment Portal)
  // Complete analysis stored as JSON (includes tax details, yearly breakdowns, etc.)
  calculatedResultsJson?: string;      // Full InvestorAnalysisResults as JSON string

  // Quick-access summary fields (for filtering/display without parsing JSON)
  calculatedInvestorEquity?: number;   // Total investor equity in the deal (in dollars, not millions)
  calculatedIRR?: number;              // Investor IRR (percentage, e.g., 15.5)
  calculatedMultiple?: number;         // Equity multiple (e.g., 2.5x)
  calculatedTotalReturns?: number;     // Total cash returned to investors (in dollars)
  calculatedExitProceeds?: number;     // Exit proceeds (in dollars)
  calculatedTaxBenefits?: number;      // Total tax benefits (in dollars)
  calculatedOperatingCashFlows?: number; // Operating cash flows (in dollars)
}

export const calculatorService = {
  // Save a new configuration
  saveConfiguration: async (config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.post<CalculatorConfiguration>('/calculator/configurations', config);
    return response.data;
  },

  // Get all saved configurations for the current user
  getConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/calculator/configurations');
    return response.data;
  },

  // Get all configurations from all users (for collaboration)
  getAllConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/calculator/configurations/all');
    return response.data;
  },

  // Get a specific configuration by ID
  getConfiguration: async (id: number): Promise<CalculatorConfiguration> => {
    const response = await api.get<CalculatorConfiguration>(`/calculator/configurations/${id}`);
    return response.data;
  },

  // Alias for getConfiguration
  getConfigurationById: async (id: number): Promise<CalculatorConfiguration> => {
    return calculatorService.getConfiguration(id);
  },

  // Update an existing configuration
  updateConfiguration: async (id: number, config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.put<CalculatorConfiguration>(`/calculator/configurations/${id}`, config);
    return response.data;
  },

  // Delete a configuration
  deleteConfiguration: async (id: number): Promise<void> => {
    await api.delete(`/calculator/configurations/${id}`);
  },

  // Get the user's default configuration
  getDefaultConfiguration: async (): Promise<CalculatorConfiguration | null> => {
    try {
      const response = await api.get<CalculatorConfiguration>('/calculator/configurations/default');
      return response.data;
    } catch (error) {
      console.log('No default configuration set.', error);
      return null;
    }
  },

  // Set a configuration as default
  setDefaultConfiguration: async (id: number): Promise<void> => {
    await api.put(`/calculator/configurations/${id}/set-default`);
  }
};