// Investment Portal Types

export type GoalType = string; // Extensible - any goal can register

// Tax rates structure
export interface TaxRates {
  federalRate: number;
  stateRate: number;
  effectiveRate: number;
  ltCapitalGainsRate: number;
  stateCapitalGainsRate: number;
  niitRate: number;
}

// Investor profile
export interface InvestorProfile {
  state: string;
  filingStatus: 'single' | 'married';
  repStatus: boolean;
  profession?: string;
  // Income sources (annual)
  w2Income?: number;
  businessIncome?: number;
  rentalIncome?: number;
  k1PassiveIncome?: number;
  otherPassiveIncome?: number;
  // IRA information (REP only)
  iraBalance?: number;
  rothConversionGoal?: number;
  conversionYears?: number;
}

// Calculated requirements (what investor needs to achieve goal)
export interface Requirements {
  deductionsNeeded: number;        // Amount of tax deductions needed
  investmentRequired: number;      // Estimated investment amount needed
  year1RecoveryTarget: number;     // Goal recovery percentage (usually 100%)
  projectedRecovery: number;       // Actual projected recovery based on tax rates
  deductionPurpose?: string;       // Optional: What the deductions are for (display purposes)
}

// Base session state
export interface SessionState {
  goalType: GoalType;
  goalCreatedAt: string;
  investorProfile: InvestorProfile;
  taxRates: TaxRates;
  goalData: any; // Goal-specific data (extensible per goal)
  requirements?: Requirements;
}

// Goal flow component props
export interface GoalFlowProps {
  onComplete: (goalData: any, requirements: Requirements) => void;
  onBack: () => void;
  initialData?: any;
  // NEW: Pass existing profile and tax rates from session
  investorProfile: InvestorProfile;
  taxRates: TaxRates;
}

// Goal definition (registry entry)
export interface GoalDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  shortDescription: string;
  applicableTo: 'rep' | 'non-rep' | 'both';  // NEW: Filter goals by investor type
  Flow: React.ComponentType<GoalFlowProps>;
  calculateRequirements: (
    goalData: any,
    investorProfile: InvestorProfile,
    taxRates: TaxRates
  ) => Requirements;
  matchDeals?: (
    deal: any,
    requirements: Requirements
  ) => number; // fit score 0-100
}

// Deal match result
export interface DealMatch {
  dealId: string | number;
  fitScore: number;
  projectedOffsetAmount: number;
  requiredInvestment: number;
  meetsGoal: boolean;
}
