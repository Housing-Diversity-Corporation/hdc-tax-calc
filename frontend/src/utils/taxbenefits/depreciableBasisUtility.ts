/**
 * Basis Calculation Utilities
 *
 * Provides two distinct basis calculations:
 * 1. OZ Depreciable Basis - For OZ depreciation deductions
 * 2. LIHTC Eligible Basis - For LIHTC credit calculations per IRC §42
 *
 * IMPORTANT: These are different calculations with different exclusions.
 */

/**
 * Parameters for OZ Depreciable Basis calculation.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 100 = $100M).
 * See docs/CONVENTIONS.md for details.
 */
export interface DepreciableBasisParams {
  /** Project cost in millions (e.g., 100 = $100M) */
  projectCost: number;
  /** Predevelopment costs in millions */
  predevelopmentCosts?: number;
  /** Land value in millions (e.g., 10 = $10M) */
  landValue: number;
  /** Investor equity percentage (0-100). NOT excluded from basis - kept for debt calculation */
  investorEquityPct: number;
  /** Interest reserve in millions - excluded from depreciable basis (financing cost) */
  interestReserve?: number;
  /** Lease-up reserve in millions - excluded from depreciable basis (financing cost) */
  leaseUpReserve?: number;
  /** Loan origination fees as % of total debt (0-3%) - included in basis */
  loanFeesPercent?: number;
  /** Legal and structuring costs in millions - included in basis */
  legalStructuringCosts?: number;
  /** Organization and formation costs in millions - included in basis */
  organizationCosts?: number;
}

/**
 * Calculate OZ Depreciable Basis
 *
 * Formula: (Project Cost + Predevelopment + Loan Fees + Legal + Org)
 *          - Land - Interest Reserve - Lease-up Reserve
 *
 * NOTE: Investor equity is NOT excluded - it's a funding source, not a cost exclusion.
 * Interest and lease-up reserves ARE excluded as financing costs.
 *
 * @param params - Depreciable basis calculation parameters
 * @returns Depreciable basis amount
 */
export function calculateDepreciableBasis(params: DepreciableBasisParams): number {
  const {
    projectCost,
    predevelopmentCosts = 0,
    landValue,
    investorEquityPct,
    interestReserve = 0,
    leaseUpReserve = 0,
    loanFeesPercent = 0,
    legalStructuringCosts = 0,
    organizationCosts = 0
  } = params;

  // Calculate total project cost (for depreciable basis calculation)
  const totalProjectCost = projectCost + predevelopmentCosts;

  // Calculate effective project cost (includes reserves for equity/debt split)
  const effectiveProjectCost = totalProjectCost + interestReserve + leaseUpReserve;

  // Calculate investor equity (used for debt calculation, NOT excluded from basis)
  const investorEquity = effectiveProjectCost * (investorEquityPct / 100);

  // Calculate loan fees based on total debt
  const totalDebt = effectiveProjectCost - investorEquity;
  const loanFees = totalDebt * (loanFeesPercent / 100);

  // Calculate total basis adjustments (costs that increase depreciable basis)
  const basisAdjustments = loanFees + legalStructuringCosts + organizationCosts;

  // OZ Depreciable Basis:
  // - Includes: project cost, predevelopment, loan fees, legal, org costs
  // - Excludes: land, interest reserve, lease-up reserve
  // - Does NOT exclude: investor equity (it's a funding source)
  const depreciableBasis = totalProjectCost + basisAdjustments - landValue;

  return Math.max(0, depreciableBasis); // Cannot be negative
}

/**
 * Calculate depreciable basis breakdown with all components
 *
 * Useful for debugging and display purposes
 */
export function calculateDepreciableBasisBreakdown(params: DepreciableBasisParams) {
  const {
    projectCost,
    predevelopmentCosts = 0,
    landValue,
    investorEquityPct,
    interestReserve = 0,
    leaseUpReserve = 0,
    loanFeesPercent = 0,
    legalStructuringCosts = 0,
    organizationCosts = 0
  } = params;

  const totalProjectCost = projectCost + predevelopmentCosts;
  const effectiveProjectCost = totalProjectCost + interestReserve + leaseUpReserve;
  const investorEquity = effectiveProjectCost * (investorEquityPct / 100);
  const totalDebt = effectiveProjectCost - investorEquity;
  const loanFees = totalDebt * (loanFeesPercent / 100);
  const basisAdjustments = loanFees + legalStructuringCosts + organizationCosts;
  const depreciableBasis = Math.max(0, totalProjectCost + basisAdjustments - landValue);

  return {
    totalProjectCost,
    effectiveProjectCost,
    interestReserve,
    leaseUpReserve,
    totalDebt,
    loanFees,
    loanFeesPercent,
    legalStructuringCosts,
    organizationCosts,
    basisAdjustments,
    landValue,
    investorEquity,
    depreciableBasis,
    // Helpful ratios
    depreciableBasisPct: totalProjectCost > 0 ? (depreciableBasis / totalProjectCost) * 100 : 0,
    landPct: totalProjectCost > 0 ? (landValue / totalProjectCost) * 100 : 0,
    investorEquityPct
  };
}

// ============================================================================
// LIHTC Eligible Basis Calculation (per IRC §42)
// ============================================================================

/**
 * Parameters for LIHTC Eligible Basis calculation per IRC §42.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 100 = $100M).
 * See docs/CONVENTIONS.md for details.
 */
export interface LIHTCEligibleBasisParams {
  /** Project cost in millions (e.g., 100 = $100M) */
  projectCost: number;
  /** Predevelopment costs in millions */
  predevelopmentCosts?: number;
  /** Land value in millions - excluded from eligible basis */
  landValue: number;
  /** Interest reserve in millions - excluded (financing cost) */
  interestReserve?: number;
  /** Lease-up reserve in millions - excluded (financing cost) */
  leaseUpReserve?: number;
  /** Syndication costs in millions - excluded per IRC §42 */
  syndicationCosts?: number;
  /** Marketing costs in millions - excluded per IRC §42 */
  marketingCosts?: number;
  /** Commercial space costs in millions - excluded (non-residential) */
  commercialSpaceCosts?: number;
}

/**
 * Calculate LIHTC Eligible Basis per IRC §42
 *
 * Formula: (Project Cost + Predevelopment)
 *          - Land - Interest Reserve - Lease-up Reserve
 *          - Syndication - Marketing - Commercial Space
 *
 * NOTE: Does NOT include financing costs (loan fees, legal, org costs)
 * that are included in OZ depreciable basis.
 *
 * @param params - LIHTC eligible basis calculation parameters
 * @returns LIHTC eligible basis amount
 */
export function calculateLIHTCEligibleBasis(params: LIHTCEligibleBasisParams): number {
  const {
    projectCost,
    predevelopmentCosts = 0,
    landValue,
    interestReserve = 0,
    leaseUpReserve = 0,
    syndicationCosts = 0,
    marketingCosts = 0,
    commercialSpaceCosts = 0
  } = params;

  // Total project cost (base for eligible basis)
  const totalProjectCost = projectCost + predevelopmentCosts;

  // LIHTC Eligible Basis:
  // - Includes: project cost, predevelopment costs
  // - Excludes: land, reserves, syndication, marketing, commercial space
  // - Does NOT include: loan fees, legal costs, org costs (financing costs)
  const eligibleBasis = totalProjectCost
    - landValue
    - interestReserve
    - leaseUpReserve
    - syndicationCosts
    - marketingCosts
    - commercialSpaceCosts;

  return Math.max(0, eligibleBasis); // Cannot be negative
}

/**
 * Calculate LIHTC eligible basis breakdown with all components
 *
 * Useful for debugging and display purposes
 */
export function calculateLIHTCEligibleBasisBreakdown(params: LIHTCEligibleBasisParams) {
  const {
    projectCost,
    predevelopmentCosts = 0,
    landValue,
    interestReserve = 0,
    leaseUpReserve = 0,
    syndicationCosts = 0,
    marketingCosts = 0,
    commercialSpaceCosts = 0
  } = params;

  const totalProjectCost = projectCost + predevelopmentCosts;
  const totalExclusions = landValue + interestReserve + leaseUpReserve +
    syndicationCosts + marketingCosts + commercialSpaceCosts;
  const eligibleBasis = Math.max(0, totalProjectCost - totalExclusions);

  return {
    totalProjectCost,
    landValue,
    interestReserve,
    leaseUpReserve,
    syndicationCosts,
    marketingCosts,
    commercialSpaceCosts,
    totalExclusions,
    eligibleBasis,
    // Helpful ratios
    eligibleBasisPct: totalProjectCost > 0 ? (eligibleBasis / totalProjectCost) * 100 : 0,
    landPct: totalProjectCost > 0 ? (landValue / totalProjectCost) * 100 : 0
  };
}
