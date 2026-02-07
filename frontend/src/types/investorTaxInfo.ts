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
  annualOrdinaryIncome?: number;        // W-2, active business, board fees
  annualPortfolioIncome?: number;       // Stock/crypto gains, dividends, interest
  groupingElection?: boolean;           // §469(c)(7)(A)(ii) election, REP only

  // Backward compatibility: allow additional properties
  [key: string]: any;
}
