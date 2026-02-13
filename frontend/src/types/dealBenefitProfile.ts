/**
 * Deal Benefit Profile Types
 *
 * Captures the complete financial profile of a single deal extracted from
 * calculator results, enabling multi-deal modeling and investor-specific
 * tax utilization analysis.
 */

export interface DealBenefitProfile {
  // Identity
  id?: number;
  configurationId: number;
  dealName: string;
  propertyState: string;
  fundYear: number;

  // Economics
  projectCost: number;
  grossEquity: number;
  netEquity: number;
  syndicationProceeds: number;

  // Schedules (one entry per hold year)
  depreciationSchedule: number[];
  lihtcSchedule: number[];
  stateLihtcSchedule: number[];
  operatingCashFlow: number[];

  // Exit
  holdPeriod: number;
  exitProceeds: number;
  cumulativeDepreciation: number;
  recaptureExposure: number;
  projectedAppreciation: number;
  capitalGainsTax: number;

  // OZ
  ozEnabled: boolean;

  // Structure
  pisMonth: number;
  pisYear: number;
  seniorDebtPct: number;
  philDebtPct: number;
  equityPct: number;
  stateLihtcPath: string;
  syndicationRate: number;

  // Portal metadata (optional — from CalculatorConfiguration, not CalculationParams)
  dealDescription?: string;
  dealLocation?: string;
  numberOfUnits?: number;
  affordabilityMix?: string;
  minimumInvestment?: number;
  projectImageUrl?: string;
  projectStatus?: string;

  // Timestamps
  extractedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentPool {
  id?: number;
  poolName: string;
  description?: string;
  status: 'modeling' | 'committed' | 'funded';
  startYear?: number;
  createdAt?: string;
  updatedAt?: string;
}
