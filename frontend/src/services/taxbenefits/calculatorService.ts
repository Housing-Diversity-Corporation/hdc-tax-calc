import api from '../api';

export interface CalculatorConfiguration {
  id?: number;
  isPreset?: boolean;
  dealName?: string;
  category?: string;
  isActive?: boolean;
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
  deferredGains: number;
  hdcFeeRate: number;
  hdcDeferredInterestRate?: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  aumCurrentPayEnabled?: boolean;
  aumCurrentPayPct?: number;
  investorPromoteShare: number;
  constructionDelayMonths?: number;
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
  // IMPL-117: placedInServiceMonth removed — now engine-internal (CalculationParams only)
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
  // Income Composition (Phase A2 - Tax Utilization)
  annualOrdinaryIncome?: number;
  annualPassiveIncome?: number;
  annualPortfolioIncome?: number;
  groupingElection?: boolean;
  // Tax Planning Analysis
  includeDepreciationSchedule?: boolean;
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;
  isDefault?: boolean;
  completionStatus?: 'in-progress' | 'complete';  // Track configuration completeness
  isShared?: boolean;
  statusCategory?: string;
  tags?: string;  // Comma-separated: "OZ,LIHTC,PAB,Custom Tag"
  userId?: number;
  createdAt?: string;
  updatedAt?: string;

  // Investment Portal fields
  isInvestorFacing?: boolean;          // true = show to investors in portal
  dealDescription?: string;            // Investor-friendly description
  dealLocation?: string;               // "Brooklyn, NY"
  dealLatitude?: number;               // Latitude for map
  dealLongitude?: number;              // Longitude for map
  units?: number;                      // Number of housing units
  affordabilityMix?: string;           // "60% AMI" or "50-80% AMI"
  projectStatus?: 'available' | 'funded' | 'pipeline';
  minimumInvestment?: number;          // Minimum investment amount
  dealImageUrl?: string;               // URL to project rendering/photo
}

export interface CollaboratorInfo {
  userId: number;
  fullName: string;
  profileImageUrl: string | null;
}

export interface ConfigurationWithOwner {
  configuration: CalculatorConfiguration;
  ownerUserId: number | null;
  ownerFullName: string | null;
  ownerProfileImageUrl: string | null;
  collaborators: CollaboratorInfo[];
}

export function autoDetectTags(config: CalculatorConfiguration): string[] {
  const tags: string[] = [];
  if (config.ozEnabled) tags.push('OZ');
  if (config.lihtcEnabled) tags.push('LIHTC');
  if (config.selectedState) tags.push(config.selectedState);
  return tags;
}

export const calculatorService = {
  // Save a new configuration
  saveConfiguration: async (config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.post<CalculatorConfiguration>('/deal-conduits/configurations', config);
    return response.data;
  },

  // Get all saved configurations for the current user
  getConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/deal-conduits/configurations');
    return response.data;
  },

  // Get all configurations from all users (for collaboration)
  getAllConfigurations: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/deal-conduits/configurations/all');
    return response.data;
  },

  // Get a specific configuration by ID
  getConfiguration: async (id: number): Promise<CalculatorConfiguration> => {
    const response = await api.get<CalculatorConfiguration>(`/deal-conduits/configurations/${id}`);
    return response.data;
  },

  // Alias for getConfiguration
  getConfigurationById: async (id: number): Promise<CalculatorConfiguration> => {
    return calculatorService.getConfiguration(id);
  },

  // Update an existing configuration
  updateConfiguration: async (id: number, config: CalculatorConfiguration): Promise<CalculatorConfiguration> => {
    const response = await api.put<CalculatorConfiguration>(`/deal-conduits/configurations/${id}`, config);
    return response.data;
  },

  // Delete a configuration
  deleteConfiguration: async (id: number): Promise<void> => {
    await api.delete(`/deal-conduits/configurations/${id}`);
  },

  // Delete a preset
  deletePreset: async (id: number): Promise<void> => {
    await api.delete(`/deal-conduits/presets/${id}`);
  },

  // Get the user's default configuration
  getDefaultConfiguration: async (): Promise<CalculatorConfiguration | null> => {
    try {
      const response = await api.get<CalculatorConfiguration>('/deal-conduits/configurations/default');
      return response.data;
    } catch (error) {
      console.log('No default configuration set.', error);
      return null;
    }
  },

  // Set a configuration as default
  setDefaultConfiguration: async (id: number): Promise<void> => {
    await api.put(`/deal-conduits/configurations/${id}/set-default`);
  },

  // Get active presets from the database
  getPresets: async (): Promise<CalculatorConfiguration[]> => {
    const response = await api.get<CalculatorConfiguration[]>('/deal-conduits/presets');
    return response.data;
  },

  // Get any conduit by ID (preset or config)
  getConduitById: async (id: number): Promise<CalculatorConfiguration> => {
    const response = await api.get<CalculatorConfiguration>(`/deal-conduits/${id}`);
    return response.data;
  },

  // Get all configurations enriched with owner profile info
  getAllConfigurationsWithOwners: async (): Promise<ConfigurationWithOwner[]> => {
    const response = await api.get<ConfigurationWithOwner[]>('/deal-conduits/configurations/all');
    return response.data;
  },

  // Get IDs of shared configs updated since a given timestamp (for update badge)
  getUpdatedSince: async (sinceISO: string): Promise<number[]> => {
    const response = await api.get<number[]>('/deal-conduits/configurations/updates-since', {
      params: { since: sinceISO }
    });
    return response.data;
  },
};