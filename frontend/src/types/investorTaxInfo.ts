/**
 * Investor Tax Information for Portal-side investor profiles.
 *
 * This type is intentionally separate from CalculationParams (HDC-side).
 * Both types map into the shared utilization engine interfaces.
 */
export interface InvestorTaxInfo {
  id?: number;
  userId?: number;

  // Filing Status
  filingStatus?: 'single' | 'married' | 'HoH';  // Single, Married Filing Jointly, Head of Household

  // Income Composition (Phase 0 - Spec v2.1 Section 4.1)
  annualPassiveIncome?: number;         // K-1 from funds, rental income, partnership business income
  annualPassiveOrdinaryIncome?: number; // IMPL-154: Ordinary-rate component of passive income
  annualPassiveLTCGIncome?: number;     // IMPL-154: LTCG-rate component of passive income
  annualOrdinaryIncome?: number;        // W-2, active business, board fees
  annualPortfolioIncome?: number;       // Stock/crypto gains, dividends, interest
  groupingElection?: boolean;           // §469(c)(7)(A)(ii) election, REP only

  // IMPL-157: AMT exposure flag (display-only)
  hasMaterialAmtExposure?: boolean;     // ISO exercises, private activity bonds, or other non-HDC AMT items

  // IMPL-160: NOL discount rate override (decimal, e.g. 0.07 for 7%)
  nolDiscountRate?: number;

  // Backward compatibility: allow additional properties
  [key: string]: any;
}
