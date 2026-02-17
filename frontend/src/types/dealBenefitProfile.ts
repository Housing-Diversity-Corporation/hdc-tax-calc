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
  dealConduitId: number;
  dealName: string;
  propertyState: string;
  fundYear: number;

  // Economics
  projectCost: number;
  grossEquity: number;
  netEquity: number;
  syndicationProceeds: number;

  // Depreciation basis
  costSegregationPercent?: number;
  depreciableBasis?: number;

  // Schedules (one entry per hold year)
  depreciationSchedule: number[];
  lihtcSchedule: number[];
  stateLihtcSchedule: number[];
  operatingCashFlow: number[];

  // Exit
  holdPeriod: number;
  projectedExitYear?: number;
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

  // Timestamps
  extractedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * View DTO returned by GET /deal-benefit-profiles/{id}/view
 * Includes source conduit context alongside the profile.
 */
export interface DealBenefitProfileView {
  profile: DealBenefitProfile;
  sourceDealName: string | null;
  sourceConduitId: number | null;
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
