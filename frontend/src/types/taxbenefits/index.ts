// HDC Calculator Types and Interfaces

import { PreferredEquityResult } from '../../utils/taxbenefits/preferredEquityCalculations';
import { TaxUtilizationResult } from '../../utils/taxbenefits/investorTaxUtilization';

// Re-export B3 types for convenience
export type { InvestorFitResult, FitWarning, Archetype, FitRating, BenefitTimingProfile } from '../../utils/taxbenefits/investorFit';
export type { SizingResult, SizingPoint } from '../../utils/taxbenefits/investorSizing';

// IMPL-094: Exit Tax Result — §5.12 character-split recapture engine output
export interface ExitTaxResult {
  // §1245 component
  sec1245Recapture: number;       // §1245 ordinary income recapture base amount
  sec1245Rate: number;            // Federal ordinary rate (typically 0.37)
  sec1245Tax: number;             // sec1245Recapture × sec1245Rate

  // §1250 component
  sec1250Recapture: number;       // Unrecaptured §1250 gain base amount
  sec1250Rate: number;            // 0.25 (statutory cap)
  sec1250Tax: number;             // sec1250Recapture × sec1250Rate

  // Appreciation gain (if exit above cost)
  remainingGain: number;          // Gain after recapture (if any) — LTCG
  remainingGainRate: number;      // Federal CG rate (0.20)
  remainingGainTax: number;       // remainingGain × remainingGainRate

  // NIIT — stacks on ALL gain characters for passive investors
  niitRate: number;               // 0.038 per IRC §1411
  niitTax: number;                // 0.038 × (all gain) when niitApplies; $0 when false

  // Totals
  totalFederalExitTax: number;    // sec1245Tax + sec1250Tax + remainingGainTax + niitTax

  // State component
  stateExitTax: number;           // Conformity-aware: $0 if OZ + conforming state
  stateConformity: string;        // Conformity type used (audit trail)
  totalExitTaxWithState: number;  // totalFederalExitTax + stateExitTax

  // OZ overlay
  ozExcludesRecapture: boolean;   // If OZ 10+ years, all recapture = $0 via basis step-up
  ozExcludesAppreciation: boolean; // If OZ 10+ years, appreciation excluded
  netExitTax: number;             // After OZ exclusions ($0 for OZ 10+ year hold)
}

export interface ConformingState {
  name: string;
  rate: number;
  tier: string;
}

export interface ConformingStates {
  [key: string]: ConformingState;
}

export interface CashFlowItem {
  year: number;
  noi: number;
  effectiveOccupancy?: number; // Occupancy percentage during lease-up
  interestReserveDraw?: number; // Amount drawn from interest reserve
  interestReserveBalance?: number; // Remaining interest reserve balance
  excessReserveDistribution?: number; // Excess reserve distributed at stabilization
  operationalDSCR?: number; // DSCR from operations only (before reserve)
  hardDebtService?: number; // Senior + Philanthropic debt service only
  debtService?: number; // Total debt service for reporting
  debtServicePayments: number;
  cashAfterDebtService: number;
  aumFeeAmount: number;
  aumFeePaid?: number;
  aumFeeAccrued?: number;
  aumCatchUpPaid?: number; // IMPL-030: Catch-up payment on deferred AUM
  cashAfterDebtAndFees: number;
  taxBenefit: number;
  operatingCashFlow: number;
  subDebtInterest: number;
  investorSubDebtInterestReceived?: number;
  investorSubDebtPIKAccrued?: number;
  investorPikBalance?: number;
  outsideInvestorCurrentPay?: number;
  outsideInvestorPIKAccrued?: number;
  hdcSubDebtPIKAccrued?: number;
  totalCashFlow: number;
  cumulativeReturns: number;
  dscr?: number; // Debt Service Coverage Ratio (hard debt only)
  targetDscr?: number; // Target DSCR maintained through cash management (1.05x)
  dscrWithCurrentPay?: number; // DSCR including all sub-debt current pay portions
  ozYear5TaxPayment?: number; // Year 5 OZ tax payment (after step-up)
  stepUpTaxSavings?: number; // IMPL-054: Tax savings from OZ step-up basis (Year 5 only)
  ozRecaptureAvoided?: number; // IMPL-048: This year's recapture avoided (OZ 10+ year holds only)
  stateLIHTCCredit?: number; // State LIHTC credit for direct use path (IMPL-018)
  federalLIHTCCredit?: number; // Federal LIHTC credit for this year (IMPL-021b)
  stateLIHTCSyndicationProceeds?: number; // IMPL-073: State LIHTC syndication proceeds (capital return)
  // IMPL-061: Depreciation breakdown for Returns Buildup Strip
  bonusTaxBenefit?: number; // Year 1 bonus depreciation tax benefit
  year1MacrsTaxBenefit?: number; // Year 1 MACRS (partial year) tax benefit
  // TIER 2: Phil Debt Conversion fields
  philConvertedToPIK?: boolean; // Flag that phil current pay was converted to PIK for covenant protection
  stage2DSCR?: number; // DSCR after phil conversion (if TIER 2 triggered)
  // TIER 3: Covenant Status & Cash Shortfall
  covenantStatus?: 'COMPLIANT' | 'VIOLATION' | 'CRITICAL'; // Covenant status after all protection tiers
  cashInfusionRequired?: boolean; // Flag indicating cash infusion is needed
  annualCashShortfall?: number; // Dollar amount needed to achieve 1.05x DSCR
  // IMPL-020a: Waterfall display fields (pre-calculated for UI)
  revenue?: number;                    // Calculated revenue from engine
  opex?: number;                       // Operating expenses from engine
  freeCash?: number;                   // NOI - hardDebtService
  hardDscr?: number;                   // NOI / hardDebtService
  totalSubDebtInterestNet?: number;    // hdcSubDebt + outsideInvestor - investorSubDebt (net outflow)
  totalSubDebtInterestGross?: number;  // All sub-debt for display (absolute values)
  cashAfterSubDebt?: number;           // freeCash - totalSubDebtInterestNet
  subDebtDscr?: number;                // NOI / (hardDebt + totalSubDebtNet)
  finalCash?: number;                  // cashAfterSubDebt - fees paid
  dscrShortfallPct?: number;           // % reduction needed for 1.05x DSCR

  // DSCR Breakdown (IMPL-081)
  pabDebtService?: number;             // PAB annual debt service
  mustPayDebtService?: number;         // Senior + PAB only (must-pay debt)
  mustPayDSCR?: number;                // NOI / (Senior + PAB) - true hard floor
  philDSCR?: number;                   // NOI / (Senior + PAB + Phil) - Amazon 1.05x

  // HDC Debt Fund (IMPL-082)
  hdcDebtFundCurrentPay?: number;      // HDC Debt Fund current pay
  hdcDebtFundPIKAccrued?: number;      // HDC Debt Fund PIK accrued

  // IMPL-087: Pre-proration annualized NOI (used for trailing 12-month exit valuation)
  annualizedNOI?: number;

  // Investment Portal extended fields
  exitProceeds?: number;
  afterTaxCashFlow?: number;
  cumulativeCashFlow?: number;
}

export interface HDCCashFlowItem {
  year: number;
  noi: number;
  debtServicePayments: number;
  cashAfterDebtService: number;
  aumFeeAmount: number;
  aumFeeIncome: number;
  aumFeeAccrued: number;
  cashAfterDebtAndAumFee: number;
  hdcFeeIncome: number;
  philanthropicShare: number;
  hdcSubDebtCurrentPay: number;
  hdcSubDebtPIKAccrued: number;
  promoteShare: number;
  totalCashFlow: number;
  cumulativeReturns: number;
  pikBalance: number;
  dscr?: number; // Debt Service Coverage Ratio
  operatingCashFlow?: number; // HDC's share of operating cash flow
  hdcFeeDeferred?: number; // Deferred HDC tax benefit fee
}

/**
 * Results from investor analysis calculations.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 100 = $100M).
 * See docs/CONVENTIONS.md for details.
 */
export interface InvestorAnalysisResults {
  investorCashFlows: CashFlowItem[];
  /** Exit proceeds in millions */
  exitProceeds: number;
  /** Total investment amount in millions */
  totalInvestment: number;
  /** Total returns in millions */
  totalReturns: number;
  multiple: number;
  irr: number;
  investorTaxBenefits: number;
  investorOperatingCashFlows: number;
  investorSubDebtInterest: number;
  investorSubDebtInterestReceived: number;
  remainingDebtAtExit: number;
  // ISS-050 v3: Separate senior and phil debt for exit sheet accuracy
  remainingSeniorDebtAtExit?: number;
  remainingPhilDebtAtExit?: number;
  subDebtAtExit: number;
  investorSubDebtAtExit: number;
  outsideInvestorSubDebtAtExit: number;
  outsideInvestorTotalCost?: number;
  outsideInvestorCashPaid?: number;
  outsideInvestorTotalInterest?: number;
  exitValue: number;
  totalExitProceeds: number;
  pikAccumulatedInterest: number;
  // Additional properties used in tests
  investorIRR: number;
  cashFlows: CashFlowItem[];
  leveragedROE: number;
  unleveragedROE: number;
  exitFees: number;
  equityMultiple: number;
  holdPeriod: number;
  interestReserveAmount: number;
  investorEquity: number;
  syndicatedEquityOffset?: number; // IMPL-074: State LIHTC syndication reduces net equity for MOIC/IRR
  netEquity?: number;              // Phase 0: investorEquity - syndicatedEquityOffset (actual cash committed)
  adjustedBasis?: number;          // Phase A1: investorEquity - cumulativeDepreciation (for exit/recapture analysis)
  stateLIHTCSyndicationProceeds?: number; // IMPL-073: State LIHTC syndication proceeds (capital return in Returns Buildup)
  // IMPL-075: Syndication year determines MOIC denominator (Year 0 = net, Year 1+ = gross)
  stateLIHTCSyndicationYear?: 0 | 1 | 2; // Year syndication proceeds are received

  // Preferred equity results (IMPL-7.0-009)
  preferredEquityResult?: PreferredEquityResult;
  preferredEquityAtExit?: number;

  // NEW: Tax planning fields
  depreciationSchedule?: DepreciationSchedule;
  repTaxCapacity?: REPTaxCapacityModel;
  nonRepCapacity?: NonREPCapacityModel;
  iraConversionPlan?: IRAConversionPlan;
  assetSaleAnalysis?: AssetSaleAnalysis;
  taxUtilization?: TaxUtilizationResult;  // Phase A1: Tax utilization analysis (when income composition provided)
  exitTaxAnalysis?: ExitTaxResult;         // IMPL-094: Character-split exit tax (§5.12)

  // Investment Portal specific fields
  investorUpfrontCash?: number;
  afterTaxIRR?: number;
  preTaxIRR?: number;
  afterTaxMultiple?: number;
  capitalRecoveryPct?: number;
  totalAfterTaxCashReturned?: number;
  totalTaxBenefit?: number;
  netTaxBenefit?: number;
  yearlyResults?: any[]; // Same as investorCashFlows but for Investment Portal compatibility

  breakEvenYear?: number; // Year when cumulative cash flow turns positive
  investorEquityPct?: number; // For reference

  // IMPL-029: OZ benefits for 10+ year holds
  ozRecaptureAvoided?: number;  // Avoided 25% federal recapture tax on depreciation
  ozDeferralNPV?: number;       // NPV of 5-year capital gains tax deferral (8% discount rate)
  ozExitAppreciation?: number;  // Tax savings from tax-free exit appreciation
  // IMPL-057: OZ step-up basis savings (Year 5 - varies with OZ version)
  ozStepUpSavings?: number;     // Tax savings from step-up basis (10% standard / 30% rural in OZ 2.0)
  // IMPL-048b: Remaining LIHTC credits (Year 11+ catch-up for shorter hold periods)
  remainingLIHTCCredits?: number;
  // ISS-016: Remaining State LIHTC credits separately for Returns Buildup
  remainingStateLIHTCCredits?: number;
  // IMPL-061: Depreciation breakdown for Returns Buildup Strip
  year1BonusTaxBenefit?: number;      // Year 1 bonus depreciation tax benefit
  year1MacrsTaxBenefit?: number;      // Year 1 MACRS (partial year) tax benefit
  years2ExitMacrsTaxBenefit?: number; // Years 2-Exit MACRS tax benefit
  // IMPL-090: Federal/State Depreciation Breakout
  federalDepreciationBenefitYear1?: number;     // Federal rate × Year 1 depreciation
  stateDepreciationBenefitYear1?: number;       // State rate × Year 1 depreciation (0 if non-conforming bonus)
  federalDepreciationBenefitHoldPeriod?: number; // Federal rate × Years 2-N depreciation
  stateDepreciationBenefitHoldPeriod?: number;   // State rate × Years 2-N depreciation
  federalDepreciationBenefitTotal?: number;     // Sum of federal Year 1 + Hold Period
  stateDepreciationBenefitTotal?: number;       // Sum of state Year 1 + Hold Period
  // IMPL-090: Investor Profile Label (e.g., "NJ Non-REP" or "OR REP")
  investorProfileLabel?: string;
  // ISS-050: Exit waterfall prior capital recovery tracking
  grossExitProceeds?: number;         // Exit proceeds after all debt, before equity waterfall
  capitalAlreadyRecovered?: number;   // Capital recovered during hold period (tax benefits + operating cash)
  remainingCapitalToRecover?: number; // investorEquity - capitalAlreadyRecovered
  exitReturnOfCapital?: number;       // ROC paid at exit (only remaining unrecovered portion)
  exitProfitShare?: number;           // Investor's share of profit at exit
}

export interface HDCAnalysisResults {
  hdcCashFlows: HDCCashFlowItem[];
  hdcExitProceeds: number;
  hdcPromoteProceeds: number;
  philanthropicEquityRepayment: number;
  hdcSubDebtRepayment: number;
  totalHDCReturns: number;
  hdcMultiple: number;
  hdcIRR: number;
  hdcFeeIncome: number;
  hdcPhilanthropicIncome: number;
  hdcOperatingPromoteIncome: number;
  hdcAumFeeIncome: number;
  hdcSubDebtCurrentPayIncome: number;
  hdcSubDebtPIKAccrued: number;
  hdcInitialInvestment: number;
  totalInvestment?: number; // HDC has $0 initial investment
  // Additional properties used in HDCCashFlowSection
  hdcTaxBenefitFromFees?: number;
  hdcAumFees?: number;
  hdcPromoteShare?: number;
  hdcSubDebtInterest?: number;
  hdcSubDebtAtExit?: number;
  // Exit breakdown components
  accumulatedAumFeesAtExit?: number;
  hdcDeferredTaxFeesAtExit?: number;
  exitValue?: number;
  remainingDebt?: number;
  outsideInvestorSubDebtAtExit?: number;
  grossExitProceeds?: number;
  // HDC Platform Mode - Blended Debt Rate
  blendedDebtRate?: number;
  totalDebtAmount?: number;
}

/**
 * Core calculation parameters for HDC investor analysis.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 100 = $100M).
 * See docs/CONVENTIONS.md for details.
 */
export interface CalculationParams {
  /** Project cost in millions (e.g., 100 = $100M) */
  projectCost: number;
  /** Predevelopment costs in millions - architecture, engineering, permits, etc. */
  predevelopmentCosts?: number;
  /** Land value in millions (e.g., 10 = $10M) */
  landValue: number;
  /** Year 1 Net Operating Income in millions (e.g., 5.5 = $5.5M) */
  yearOneNOI: number;
  yearOneDepreciationPct?: number;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  exitCapRate: number;
  investorEquityPct: number;
  hdcFeeRate: number;
  hdcDeferredInterestRate?: number;
  hdcAdvanceFinancing: boolean;
  /** Investor upfront cash contribution in millions */
  investorUpfrontCash: number;
  /** Total tax benefit in millions */
  totalTaxBenefit: number;
  /** Net tax benefit in millions */
  netTaxBenefit: number;
  /** HDC fee amount in millions */
  hdcFee: number;
  year1NetBenefit?: number;
  investorPromoteShare: number;
  constructionDelayMonths?: number; // 0-36 months construction delay before NOI
  taxBenefitDelayMonths?: number; // 0-36 months delay before tax benefits realized
  hdcSubDebtPct?: number;
  hdcSubDebtPikRate?: number;
  pikCurrentPayEnabled?: boolean;
  pikCurrentPayPct?: number;
  investorSubDebtPct?: number;
  investorSubDebtPikRate?: number;
  investorPikCurrentPayEnabled?: boolean;
  investorPikCurrentPayPct?: number;
  outsideInvestorSubDebtPct?: number;
  outsideInvestorSubDebtPikRate?: number;
  outsideInvestorPikCurrentPayEnabled?: boolean;
  outsideInvestorPikCurrentPayPct?: number;

  // HDC Debt Fund Parameters (IMPL-082)
  hdcDebtFundPct?: number;             // HDC Debt Fund as % of project cost
  hdcDebtFundPikRate?: number;         // HDC Debt Fund PIK rate
  hdcDebtFundCurrentPayEnabled?: boolean;
  hdcDebtFundCurrentPayPct?: number;

  subDebtPriority?: {
    outsideInvestor: number;
    hdc: number;
    investor: number;
  };
  aumFeeEnabled?: boolean;
  aumFeeRate?: number;
  aumCurrentPayEnabled?: boolean;
  aumCurrentPayPct?: number;
  seniorDebtPct?: number;
  philanthropicDebtPct?: number;
  seniorDebtRate?: number;
  philanthropicDebtRate?: number;
  seniorDebtAmortization?: number;
  seniorDebtIOYears?: number;           // Years of interest-only period (0-10), default 0
  philDebtAmortization?: number;
  seniorLoanAmount?: number;
  philCurrentPayEnabled?: boolean;
  philCurrentPayPct?: number;
  interestReserveEnabled?: boolean;
  interestReserveMonths?: number;
  interestReserveAmount?: number;      // Calculated interest reserve amount
  taxAdvanceDiscountRate?: number;
  advanceFinancingRate?: number;
  taxDeliveryMonths?: number;
  /** @deprecated Engine computes via computeHoldPeriod(). Ignored on input. */
  holdPeriod?: number;
  yearOneDepreciation?: number;
  annualStraightLineDepreciation?: number;
  effectiveTaxRate?: number;
  effectiveTaxRateForBonus?: number;    // Effective rate for bonus depreciation (conformity-adjusted)
  effectiveTaxRateForStraightLine?: number; // Effective rate for straight-line MACRS (full state rate)
  bonusConformityRate?: number;         // State bonus depreciation conformity rate (0.0 to 1.0)
  placedInServiceMonth?: number;        // Month property placed in service (1-12), default 7 for mid-year
  exitMonth?: number;                    // IMPL-087: Month of exit/disposition (1-12), default matches pisMonth

  // Basis Adjustments (v7.0.7)
  loanFeesPercent?: number;             // Loan origination fees as % of total debt (0.5-3%, default 1%)
  legalStructuringCosts?: number;       // Legal and structuring costs ($50K-$500K, default $150K)
  organizationCosts?: number;           // Organization and formation costs ($25K-$150K, default $50K)

  // LIHTC Structure (v7.0.5)
  lihtcEnabled?: boolean;               // Enable LIHTC credit calculations
  lihtcEligibleBasis?: number;          // LIHTC eligible basis in $ (for PAB calculations)
  applicableFraction?: number;          // Percentage of units that are qualified (40-100%, default 100%)
  creditRate?: number;                  // 4% or 9% credit rate (default 4%)
  ddaQctBoost?: boolean;                // DDA/QCT 30% boost (default false)

  // State LIHTC (v7.0.3)
  stateLIHTCEnabled?: boolean;          // Enable state LIHTC calculations
  syndicationRate?: number;             // State credit syndication rate (60-100%, default 85%)
  stateLIHTCAnnualCredit?: number;      // State LIHTC annual credit ($M) for export (ISS-016)
  investorHasStateLiability?: boolean;  // Whether investor has state tax liability (default true)
  investorState?: string;               // Investor's state code for state LIHTC calculations (2-letter code)
  stateLIHTCUserPercentage?: number;    // User-specified percentage for supplement/standalone programs
  stateLIHTCUserAmount?: number;        // User-specified dollar amount for supplement/standalone programs
  stateLIHTCSyndicationYear?: 0 | 1 | 2; // IMPL-073: Year syndication proceeds are received (default 1)

  // Private Activity Bonds (IMPL-080)
  pabEnabled?: boolean;                // Enable PAB financing (requires LIHTC)
  pabPctOfEligibleBasis?: number;      // PAB as % of LIHTC eligible basis (25-50%, default 30%)
  pabRate?: number;                    // PAB interest rate (default 4.5%)
  pabTerm?: number;                    // PAB term in years (default 40)
  pabAmortization?: number;            // PAB amortization in years (default 40)
  pabIOYears?: number;                 // PAB interest-only years (default 0)

  // IMPL-083: Eligible Basis Exclusions (all in millions)
  commercialSpaceCosts?: number;       // Non-residential space costs
  syndicationCosts?: number;           // LIHTC syndication costs
  marketingCosts?: number;             // Marketing and organizational costs
  financingFees?: number;              // Loan fees, legal costs
  bondIssuanceCosts?: number;          // PAB issuance costs
  operatingDeficitReserve?: number;    // Operating deficit reserve
  replacementReserve?: number;         // Replacement reserve
  otherExclusions?: number;            // Other non-qualifying costs

  // Preferred Equity (v7.0.6)
  prefEquityEnabled?: boolean;          // Enable preferred equity layer
  prefEquityPct?: number;               // Preferred equity as % of total equity (0-40%, default 0%)
  prefEquityTargetMOIC?: number;        // Target multiple on invested capital (1.0-3.0x, default 1.7x)
  prefEquityAccrualRate?: number;       // Annual accrual rate for priority tracking (6-20%, default 12%)
  prefEquityOzEligible?: boolean;       // Whether preferred equity is OZ-eligible (default false)

  // Opportunity Zone parameters
  ozEnabled?: boolean;
  ozType?: 'standard' | 'rural';
  ozVersion?: '1.0' | '2.0';  // IMPL-017: OZ legislation version
  /** Deferred capital gains in millions (e.g., 5 = $5M deferred gain) */
  deferredCapitalGains?: number;
  capitalGainsTaxRate?: number;

  // NEW: Tax planning parameters
  w2Income?: number;                    // For REP 461(l) calculations
  businessIncome?: number;              // Business/rental income
  passiveIncome?: number;               // Passive income for Non-REPs
  iraBalance?: number;                  // Traditional IRA balance for conversion planning
  assetSaleGain?: number;               // Capital gain for sale timing analysis
  includeDepreciationSchedule?: boolean; // Flag to generate detailed schedule
  investorTrack?: 'rep' | 'non-rep';    // Investor track for tax planning
  federalTaxRate?: number;              // Federal tax rate
  stateTaxRate?: number;                // State tax rate
  ltCapitalGainsRate?: number;          // Long-term capital gains rate
  niitRate?: number;                    // Net investment income tax
  stateCapitalGainsRate?: number;       // State capital gains rate
  selectedState?: string;               // Selected state code
  // IMPL-096: depreciationRecaptureRate removed — rates derived inside calculateExitTax() from character split
  philanthropicEquityPct?: number;      // Philanthropic equity percentage (0-100%)
  investorEquityRatio?: number;         // Ratio of investor equity to total equity (0-100%)
  autoBalanceCapital?: boolean;         // Auto-balance capital structure
  outsideInvestorSubDebtAmortization?: number; // Outside investor sub-debt amortization (years)
  projectLocation?: string;             // Project location address
  passiveGainType?: 'short-term' | 'long-term'; // Passive gain type
  investorType?: 'ordinary' | 'stcg' | 'ltcg' | 'custom'; // Investor type classification
  annualIncome?: number;                // Annual income for tax calculations
  filingStatus?: 'single' | 'married' | 'HoH';  // Tax filing status (Single, Married Filing Jointly, Head of Household)
  ozCapitalGainsTaxRate?: number;       // OZ-specific capital gains tax rate

  // Income Composition (Phase 0 - Spec v2.1 Section 4.1)
  annualPassiveIncome?: number;         // K-1 from funds, rental income, partnership business income
  annualOrdinaryIncome?: number;        // W-2, active business, board fees
  annualPortfolioIncome?: number;       // Stock/crypto gains, dividends, interest
  groupingElection?: boolean;           // §469(c)(7)(A)(ii) election, REP only
  niitApplies?: boolean;                // IMPL-096: NIIT applies (default true, false for territory/REP aggregation)

  // Fund/Pool Integration (Phase 0 - Spec v2.1 Section 6.1)
  fundEntryYear?: number;               // Calendar year deal enters the fund (for pool staggering)
  dealName?: string;                    // Human-readable deal name (for DBP identification)
  hdcPlatformMode?: 'traditional' | 'leverage'; // HDC platform mode

  // DSCR Cash Management parameters
  hdcDeferralInterestRate?: number;     // Annual interest rate on deferred HDC fees (e.g., 8%)
  subDebtDefaultPremium?: number;       // Additional rate on deferred sub-debt payments (e.g., 2%)

  // State LIHTC Integration (IMPL-018)
  stateLIHTCIntegration?: StateLIHTCIntegrationResult | null;

  // Federal LIHTC Credits (IMPL-021b)
  federalLIHTCCredits?: number[];  // 11-year credit schedule from lihtcResult
}

/**
 * Parameters for HDC platform analysis.
 *
 * IMPORTANT: All monetary values are in MILLIONS (e.g., 100 = $100M).
 * See docs/CONVENTIONS.md for details.
 */
export interface HDCCalculationParams {
  /** Project cost in millions (e.g., 100 = $100M) */
  projectCost: number;
  /** Predevelopment costs in millions */
  predevelopmentCosts?: number;
  /** Stabilized NOI in millions (actual Year 1 NOI is reduced by S-curve during lease-up) */
  yearOneNOI: number;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  exitCapRate: number;
  philanthropicEquityPct: number;
  hdcFeeRate: number;
  hdcFee: number;
  investorPromoteShare: number;
  constructionDelayMonths?: number; // 0-36 months construction delay before NOI
  taxBenefitDelayMonths?: number;
  hdcSubDebtPct?: number;
  hdcSubDebtPikRate?: number;
  pikCurrentPayEnabled?: boolean;
  pikCurrentPayPct?: number;
  outsideInvestorSubDebtPct?: number;
  outsideInvestorSubDebtPikRate?: number;
  outsideInvestorPikCurrentPayEnabled?: boolean;
  outsideInvestorPikCurrentPayPct?: number;
  investorSubDebtPct?: number;
  investorSubDebtPikRate?: number;
  investorPikCurrentPayEnabled?: boolean;
  investorPikCurrentPayPct?: number;
  holdPeriod?: number;
  aumFeeEnabled?: boolean;
  aumFeeRate?: number;
  aumCurrentPayEnabled?: boolean;
  aumCurrentPayPct?: number;
  seniorDebtPct?: number;
  philanthropicDebtPct?: number;
  seniorDebtRate?: number;
  philanthropicDebtRate?: number;
  seniorDebtAmortization?: number;
  seniorDebtIOYears?: number;           // Years of interest-only period (0-10), default 0
  philDebtAmortization?: number;
  yearOneDepreciation?: number;
  annualStraightLineDepreciation?: number;
  effectiveTaxRate?: number;
  placedInServiceMonth?: number;        // Month property placed in service (1-12), default 7 for mid-year
  exitMonth?: number;                    // IMPL-087: Month of exit/disposition (1-12)
  philCurrentPayEnabled?: boolean;
  philCurrentPayPct?: number;
  interestReserveEnabled?: boolean;
  interestReserveMonths?: number;
  investorCashFlows?: CashFlowItem[]; // Pass investor cash flows to access deferred fee data
  investorSubDebtAtExit?: number; // Pass from investor calculation for single source of truth
  investorEquity?: number; // Pass from investor calculation for equity recovery hurdle (includes interest reserve)
  // ISS-050: Pass from investor calculation to ensure conservation of capital
  grossExitProceeds?: number; // Use same value as investor calculation for consistent waterfall
}

export interface HDCInputsProps {
  scenarioAnalysisEnabled: boolean;
  setScenarioAnalysisEnabled: (value: boolean) => void;
  rollingStrategyEnabled: boolean;
  setRollingStrategyEnabled: (value: boolean) => void;
  projectCost: number;
  setProjectCost: (value: number) => void;
  autoBalanceCapital: boolean;
  setAutoBalanceCapital: (value: boolean) => void;
  investorEquityRatio: number;
  setInvestorEquityRatio: (value: number) => void;
  investorEquityPct: number;
  setInvestorEquityPct: (value: number) => void;
  philanthropicEquityPct: number;
  setPhilanthropicEquityPct: (value: number) => void;
  seniorDebtPct: number;
  setSeniorDebtPct: (value: number) => void;
  seniorDebtRate: number;
  setSeniorDebtRate: (value: number) => void;
  seniorDebtAmortization: number;
  setSeniorDebtAmortization: (value: number) => void;
  seniorDebtIOYears: number;
  setSeniorDebtIOYears: (value: number) => void;
  philDebtPct: number;
  setPhilDebtPct: (value: number) => void;
  philDebtRate: number;
  setPhilDebtRate: (value: number) => void;
  philDebtAmortization: number;
  setPhilDebtAmortization: (value: number) => void;
  philCurrentPayEnabled: boolean;
  setPhilCurrentPayEnabled: (value: boolean) => void;
  philCurrentPayPct: number;
  setPhilCurrentPayPct: (value: number) => void;
  hdcSubDebtPct: number;
  setHdcSubDebtPct: (value: number) => void;
  hdcSubDebtPikRate: number;
  setHdcSubDebtPikRate: (value: number) => void;
  pikCurrentPayEnabled: boolean;
  setPikCurrentPayEnabled: (value: boolean) => void;
  pikCurrentPayPct: number;
  setPikCurrentPayPct: (value: number) => void;
  investorSubDebtPct: number;
  setInvestorSubDebtPct: (value: number) => void;
  investorSubDebtPikRate: number;
  setInvestorSubDebtPikRate: (value: number) => void;
  investorPikCurrentPayEnabled: boolean;
  setInvestorPikCurrentPayEnabled: (value: boolean) => void;
  investorPikCurrentPayPct: number;
  setInvestorPikCurrentPayPct: (value: number) => void;
  yearOneDepreciationPct: number;
  setYearOneDepreciationPct: (value: number) => void;
  yearOneNOI: number;
  setYearOneNOI: (value: number) => void;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  setNoiGrowthRate: (value: number) => void;
  exitCapRate: number;
  setExitCapRate: (value: number) => void;
  investorPromoteShare: number;
  setInvestorPromoteShare: (value: number) => void;
  deferredGains: number;
  setDeferredGains: (value: number) => void;
  federalTaxRate: number;
  setFederalTaxRate: (value: number) => void;
  ltCapitalGainsRate: number;
  setLtCapitalGainsRate: (value: number) => void;
  niitRate: number;
  setNiitRate: (value: number) => void;
  selectedState: string;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (value: number) => void;
  hdcFeeRate: number;
  setHdcFeeRate: (value: number) => void;
  aumFeeEnabled: boolean;
  setAumFeeEnabled: (value: boolean) => void;
  aumFeeRate: number;
  setAumFeeRate: (value: number) => void;
  hdcAdvanceFinancing: boolean;
  setHdcAdvanceFinancing: (value: boolean) => void;
  taxAdvanceDiscountRate: number;
  setTaxAdvanceDiscountRate: (value: number) => void;
  advanceFinancingRate: number;
  setAdvanceFinancingRate: (value: number) => void;
  taxDeliveryMonths: number;
  setTaxDeliveryMonths: (value: number) => void;
  handlePercentageChange: (setter: (value: number) => void, value: number) => void;
  handleStateChange: (stateCode: string) => void;
  formatCurrency: (value: number) => string;
  CONFORMING_STATES: ConformingStates;
  totalCapitalStructure: number;
}

// Import tax planning types
import { DepreciationSchedule } from '../../utils/taxbenefits/depreciationSchedule';

// Tax planning model types (will be defined in their respective files)
export interface REPTaxCapacityModel {
  annualLimitations: Array<{
    year: number;
    w2Income: number;
    section461lLimit: number;
    allowedLoss: number;
    disallowedLoss: number;
    nolGenerated: number;
    nolCarryforward: number;
  }>;
  totalCapacity: {
    currentYear: number;
    nolBank: number;
    iraConversionCapacity: number;
  };
}

export interface NonREPCapacityModel {
  totalPassiveLosses: number;
  unlimitedCapacity: true;
  scenarioAnalysis: Array<{
    gainAmount: number;
    percentCovered: number;
    taxSavings: number;
  }>;
}

export interface IRAConversionPlan {
  schedule: Array<{
    year: number;
    recommendedConversion: number;
    hdcLossOffset: number;
    taxSaved: number;
    rothBalance: number;
  }>;
  totalConverted: number;
  totalTaxSaved: number;
  year30RothValue: number;
}

export interface AssetSaleAnalysis {
  scenarios: Array<{
    sellYear: number;
    lossesAvailable: number;
    percentCovered: number;
    taxSavings: number;
    recommendation: 'SELL' | 'WAIT';
  }>;
  optimalYear: number;
}

/**
 * State LIHTC Integration Result (IMPL-018)
 * Represents the integration of State LIHTC credits into capital stack or investor benefits.
 */
export interface StateLIHTCIntegrationResult {
  /** Credit path: syndicated (out-of-state), direct_use (in-state), or none (no benefit) */
  creditPath: 'syndicated' | 'direct_use' | 'none';
  /** Syndication rate applied (0.0-1.0) */
  syndicationRate: number;
  /** Gross credit amount before syndication */
  grossCredit: number;
  /** Net proceeds for syndication path (display in Additional Sources) */
  netProceeds: number;
  /** 11-year credit schedule for direct use path */
  yearlyCredits: number[];
  /** Total credit benefit for direct use path */
  totalCreditBenefit: number;
  /** Treatment: capital_stack (syndication), tax_benefit (direct use), or none */
  treatment: 'capital_stack' | 'tax_benefit' | 'none';
  /** Warnings from State LIHTC calculation */
  warnings: string[];
}

export interface HDCResultsProps {
  investorEquity: number;
  hdcFee: number;
  investorEquityPct: number;
  philanthropicEquityPct: number;
  seniorDebtPct: number;
  philDebtPct: number;
  hdcSubDebtPct: number;
  investorSubDebtPct: number;
  totalCapitalStructure: number;
  year1TaxBenefit: number;
  year1NetBenefit: number;
  freeInvestmentHurdle: number;
  totalNetTaxBenefits: number;
  totalCapitalGainsRate: number;
  deferredGains: number;
  deferredGainsTaxDue: number;
  investmentRecovered: number;
  totalNetTaxBenefitsAfterCG: number;
  mainAnalysisResults: InvestorAnalysisResults;
  totalInvestment: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  exitProceeds: number;
  investorCashFlows: CashFlowItem[];
  hdcAnalysisResults: HDCAnalysisResults;
  hdcCashFlows: HDCCashFlowItem[];
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;
  total10YearDepreciation: number;
  totalTaxBenefit: number;
  effectiveTaxRateForDepreciation: number;
  yearOneDepreciation: number;
  annualStraightLineDepreciation: number;
  years2to10Depreciation: number;
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  hdcSubDebtPikRate: number;
  investorPikCurrentPayEnabled: boolean;
  investorPikCurrentPayPct: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  projectCost: number;
  investorPromoteShare: number;
  federalTaxRate: number;
  selectedState: string;
  ltCapitalGainsRate: number;
  niitRate: number;
  stateCapitalGainsRate: number;
  // IMPL-096: depreciationRecaptureRate removed from HDCResultsProps
  yearOneDepreciationPct: number;
  taxCalculationExpanded: boolean;
  setTaxCalculationExpanded: (value: boolean) => void;
  taxOffsetExpanded: boolean;
  setTaxOffsetExpanded: (value: boolean) => void;
  depreciationScheduleExpanded: boolean;
  setDepreciationScheduleExpanded: (value: boolean) => void;
  formatCurrency: (value: number) => string;
  CONFORMING_STATES: ConformingStates;
  isConformingState: boolean;
}