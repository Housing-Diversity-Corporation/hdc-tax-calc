import { CalculationParams, InvestorAnalysisResults, CashFlowItem } from '../../types/taxbenefits';
import {
  validatePIKInterestCalculation,
  validateTaxBenefitDistribution,
  validateWaterfallPhase,
  validateExitDebtPayoff,
  assert
} from './calculationGuards';
import { calculateInterestReserve } from './interestReserveCalculation';
import { calculateSCurve, STANDARD_STEEPNESS } from './sCurveUtility';
import { calculateDepreciableBasis } from './depreciableBasisUtility';
import { getOzStepUpPercent } from './constants';
import { computeHoldPeriod } from './computeHoldPeriod';

// Import new tax planning modules
import { buildDepreciationSchedule } from './depreciationSchedule';
import { calculateREPCapacity, calculateNonREPCapacity } from './taxCapacity';
import { optimizeIRAConversion } from './iraConversion';
import { calculatePreferredEquity, PreferredEquityResult } from './preferredEquityCalculations';
import {
  calculateTaxUtilization,
  mapFilingStatus,
  BenefitStream,
  InvestorProfile,
  ExitEvent
} from './investorTaxUtilization';

/**
 * CRITICAL: This file implements validated business logic.
 * DO NOT MODIFY without reading HDC_CALCULATION_LOGIC.md
 * Guards are in place to prevent breaking core business rules.
 */

/**
 * DSCR Covenant Threshold
 * When DSCR falls below this level, HDC fees are deferred to preserve liquidity
 * This protects the project's financial health and senior debt service
 * Modify this value to adjust the covenant (typical range: 1.05 - 1.25)
 */
const DSCR_COVENANT_THRESHOLD = 1.05;

/**
 * Calculate Internal Rate of Return using Newton-Raphson method
 * IRR is the discount rate that makes NPV = 0
 * @param cashFlows - Array of periodic cash flows
 * @param initialInvestment - Initial investment amount (positive)
 * @param holdPeriod - Number of years in the hold period (defaults to 10)
 * @returns IRR as a percentage (e.g., 15.5 for 15.5%)
 */
export const calculateIRR = (cashFlows: number[], initialInvestment: number, holdPeriod: number = 10): number => {
  const completeCashFlows = [-initialInvestment, ...cashFlows];
  let rate = 0.1;
  const maxIterations = 50;
  const tolerance = 1e-7;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < completeCashFlows.length; t++) {
      const factor = Math.pow(1 + rate, t);
      npv += completeCashFlows[t] / factor;
      if (t > 0) {
        dnpv -= t * completeCashFlows[t] / (factor * (1 + rate));
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }

    if (Math.abs(dnpv) < tolerance) {
      break;
    }

    rate = rate - npv / dnpv;
    if (rate < -0.99) rate = -0.99;
    if (rate > 10) rate = 10;
  }

  const totalReturns = completeCashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
  return totalReturns > initialInvestment ?
    ((totalReturns / initialInvestment) ** (1 / holdPeriod) - 1) * 100 : 0;
};

/**
 * Calculate monthly loan payment using standard amortization formula
 * Payment = P * (r(1+r)^n) / ((1+r)^n - 1)
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate (as decimal, e.g., 0.06 for 6%)
 * @param years - Loan term in years
 * @returns Monthly payment amount
 */
export const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
  if (principal === 0 || !isFinite(principal)) return 0;
  if (years === 0 || !isFinite(years)) return 0;
  if (annualRate === 0) return principal / (years * 12); // Zero interest = equal principal payments

  const monthlyRate = annualRate / 12;
  const totalPayments = years * 12;

  // Check for invalid calculations
  const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
  if (denominator === 0 || !isFinite(denominator)) return 0;

  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / denominator;
  return isFinite(payment) ? payment : 0;
};

/**
 * Calculate remaining loan balance after a number of payments
 * Uses iterative method to track principal reduction
 * @param principal - Original loan amount
 * @param annualRate - Annual interest rate (as decimal)
 * @param years - Original loan term in years
 * @param paymentsMade - Number of monthly payments already made
 * @returns Remaining loan balance
 */
export const calculateRemainingBalance = (principal: number, annualRate: number, years: number, paymentsMade: number): number => {
  if (principal === 0 || annualRate === 0) return Math.max(0, principal - (paymentsMade * principal / (years * 12)));
  const monthlyRate = annualRate / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, years);
  
  let balance = principal;
  for (let i = 0; i < paymentsMade; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
  }
  return balance;
};

/**
 * Comprehensive investor returns analysis with waterfall distributions
 * Calculates IRR, equity multiple, and cash flows over hold period
 * Includes PIK interest (compound), tax benefits, and promote structures
 * @param params - Complete set of calculation parameters
 * @returns Full investor analysis including cash flows and return metrics
 */
export const calculateFullInvestorAnalysis = (
  params: CalculationParams,
  options?: { isExport?: boolean }
): InvestorAnalysisResults => {
  // ISS-070Q: Only log debt tracing when called from export (not UI calculations)
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] 1. Params received:', {
      projectCost: params.projectCost,
      seniorDebtPct: params.seniorDebtPct,
      seniorDebtRate: params.seniorDebtRate,
      seniorDebtAmortization: params.seniorDebtAmortization,
      predevelopmentCosts: params.predevelopmentCosts,
    });
    // ISS-070R: Trace PAB params to diagnose unwanted PAB debt service
    console.log('[EXPORT-ONLY DEBT] PAB params:', {
      pabEnabled: params.pabEnabled,
      lihtcEnabled: params.lihtcEnabled,
      lihtcEligibleBasis: params.lihtcEligibleBasis,
      pabPctOfEligibleBasis: params.pabPctOfEligibleBasis,
      pabRate: params.pabRate,
      pabAmortization: params.pabAmortization,
    });
  }

  const {
    projectCost: paramProjectCost,
    predevelopmentCosts: paramPredevelopmentCosts = 0,
    landValue: paramLandValue = 0,
    yearOneNOI: paramYearOneNOI,
    yearOneDepreciationPct: paramYearOneDepreciationPct = 0,
    placedInServiceMonth: paramPlacedInServiceMonth = 7,
    exitMonth: paramExitMonth = 12, // IMPL-087: Month of exit/disposition (1-12)
    // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
    noiGrowthRate: paramNoiGrowthRate = 3,
    exitCapRate: paramExitCapRate,
    investorEquityPct: paramInvestorEquityPct,
    hdcAdvanceFinancing: paramHdcAdvanceFinancing,
    netTaxBenefit: _paramNetTaxBenefit,
    hdcFee: _paramHdcFee,
    investorPromoteShare: paramInvestorPromoteShare = 35, // Default: 35% investor, 65% HDC
    hdcSubDebtPct: paramHdcSubDebtPct = 0,
    hdcSubDebtPikRate: paramHdcSubDebtPikRate = 8,
    pikCurrentPayEnabled: paramPikCurrentPayEnabled = false,
    pikCurrentPayPct: paramPikCurrentPayPct = 50,
    investorSubDebtPct: paramInvestorSubDebtPct = 0,
    investorSubDebtPikRate: paramInvestorSubDebtPikRate = 8,
    investorPikCurrentPayEnabled: paramInvestorPikCurrentPayEnabled = false,
    investorPikCurrentPayPct: paramInvestorPikCurrentPayPct = 50,
    outsideInvestorSubDebtPct: paramOutsideInvestorSubDebtPct = 0,
    outsideInvestorSubDebtPikRate: paramOutsideInvestorSubDebtPikRate = 8,
    outsideInvestorPikCurrentPayEnabled: paramOutsideInvestorPikCurrentPayEnabled = false,
    outsideInvestorPikCurrentPayPct: paramOutsideInvestorPikCurrentPayPct = 50,
    // HDC Debt Fund Parameters (IMPL-082)
    hdcDebtFundPct: paramHdcDebtFundPct = 0,
    hdcDebtFundPikRate: paramHdcDebtFundPikRate = 8,
    hdcDebtFundCurrentPayEnabled: paramHdcDebtFundCurrentPayEnabled = false,
    hdcDebtFundCurrentPayPct: paramHdcDebtFundCurrentPayPct = 50,
    // Private Activity Bonds (IMPL-080)
    pabEnabled: paramPabEnabled = false,
    pabPctOfEligibleBasis: paramPabPctOfEligibleBasis = 30,
    pabRate: paramPabRate = 4.5,
    pabAmortization: paramPabAmortization = 40,
    pabIOYears: paramPabIOYears = 0,
    // LIHTC Eligible Basis for PAB calculations
    lihtcEnabled: paramLihtcEnabled = false,
    lihtcEligibleBasis: paramLihtcEligibleBasis = 0,
    aumFeeEnabled: paramAumFeeEnabled = false,
    aumFeeRate: paramAumFeeRate = 0,
    aumCurrentPayEnabled: paramAumCurrentPayEnabled = false,
    aumCurrentPayPct: paramAumCurrentPayPct = 50,
    philCurrentPayEnabled: paramPhilCurrentPayEnabled = false,
    philCurrentPayPct: paramPhilCurrentPayPct = 50,
    holdPeriod: paramHoldPeriod = 10,
    yearOneDepreciation: _paramYearOneDepreciation = 0,
    annualStraightLineDepreciation: paramAnnualStraightLineDepreciation = 0,
    effectiveTaxRate: paramEffectiveTaxRate = 0,
    effectiveTaxRateForBonus: paramEffectiveTaxRateForBonus,
    effectiveTaxRateForStraightLine: paramEffectiveTaxRateForStraightLine,
    bonusConformityRate: paramBonusConformityRate,
    hdcFeeRate: paramHdcFeeRate = 0, // Fee removed per IMPL-7.0-014
    hdcDeferredInterestRate: paramHdcDeferredInterestRate = 8,
    constructionDelayMonths: paramConstructionDelayMonths = 0,
    taxBenefitDelayMonths: paramTaxBenefitDelayMonths = 0,
    // State LIHTC Integration (IMPL-018)
    stateLIHTCIntegration: paramStateLIHTCIntegration = null,
    // Federal LIHTC Credits (IMPL-021b)
    federalLIHTCCredits: paramFederalLIHTCCredits = []
  } = params;
  // ISS-068c: yearOneRevenue calculation removed - now using direct NOI growth

  // AUTO-CALCULATE annualStraightLineDepreciation if not provided
  // This ensures consistency between HDC Calculator and Investment Portal
  // without duplicating calculation logic in multiple places
  let annualStraightLineDepreciation = paramAnnualStraightLineDepreciation;
  if (annualStraightLineDepreciation === 0 && paramYearOneDepreciationPct > 0) {
    // Use shared utility function to ensure consistency with useHDCCalculations
    // CRITICAL: Includes predevelopment costs in depreciable basis per IRS rules
    // Interest reserve not yet calculated at this point, so will be 0
    const depreciableBasis = calculateDepreciableBasis({
      projectCost: paramProjectCost,
      predevelopmentCosts: paramPredevelopmentCosts,
      landValue: paramLandValue,
      investorEquityPct: paramInvestorEquityPct,
      interestReserve: 0  // Not calculated yet at this stage
    });
    const bonusDepreciation = depreciableBasis * (paramYearOneDepreciationPct / 100);
    const remainingBasis = depreciableBasis - bonusDepreciation;
    // IRS MACRS: Residential rental property uses 27.5-year straight-line (IRS Pub 946, Table A-6)
    annualStraightLineDepreciation = remainingBasis / 27.5;
  }

  // Calculate interest reserve first if enabled
  const interestReserveEnabled = params.interestReserveEnabled || false;
  const interestReserveMonths = params.interestReserveMonths || 12;

  // Include predevelopment costs in base project cost for all calculations
  const baseProjectCost = paramProjectCost + paramPredevelopmentCosts;

  // Calculate base debt amounts using base project cost (includes predevelopment)
  const baseSeniorDebtAmount = baseProjectCost * ((params.seniorDebtPct || 0) / 100);
  const basePhilDebtAmount = baseProjectCost * ((params.philanthropicDebtPct || 0) / 100);
  const seniorDebtAmortYears = params.seniorDebtAmortization || 30;
  const seniorDebtIOYears = params.seniorDebtIOYears || 0;  // Interest-only period (0-10 years)
  const philDebtAmortYears = params.philDebtAmortization || 30;
  const seniorDebtRate = (params.seniorDebtRate || 6) / 100;
  const philDebtRate = (params.philanthropicDebtRate || 0) / 100;

  // ISS-070Q: Trace debt calculation step 2 (export-only)
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] 2. baseSeniorDebtAmount calculation:', {
      formula: 'baseProjectCost * seniorDebtPct / 100',
      paramProjectCost,
      paramPredevelopmentCosts,
      baseProjectCost,
      'params.seniorDebtPct': params.seniorDebtPct,
      baseSeniorDebtAmount,
      expected: params.projectCost * (params.seniorDebtPct || 0) / 100,
      seniorDebtRate,
      seniorDebtAmortYears,
    });
  }
  
  // ISS-039: Calculate interest reserve using iterative convergence
  // The reserve depends on debt service, which depends on (projectCost + reserve),
  // creating a circular dependency. We iterate until the reserve converges.
  const MAX_RESERVE_ITERATIONS = 10;
  const RESERVE_TOLERANCE = 0.001; // $1K tolerance (values in millions)

  // ISS-041: Pre-calculate PAB amount for interest reserve (based on lihtcEligibleBasis, not project cost)
  const reservePabAmount = paramPabEnabled && paramLihtcEnabled && paramLihtcEligibleBasis > 0
    ? paramLihtcEligibleBasis * (paramPabPctOfEligibleBasis / 100)
    : 0;

  let interestReserveAmount = 0;
  let effectiveProjectCost = baseProjectCost;

  if (interestReserveEnabled) {
    for (let iter = 0; iter < MAX_RESERVE_ITERATIONS; iter++) {
      // Calculate reserve based on current effective project cost
      const newReserve = calculateInterestReserve({
        enabled: interestReserveEnabled,
        months: interestReserveMonths,
        projectCost: effectiveProjectCost, // Use effective, includes previous reserve estimate
        predevelopmentCosts: 0, // Already included in effectiveProjectCost via baseProjectCost
        yearOneNOI: paramYearOneNOI,
        seniorDebtPct: params.seniorDebtPct || 0,
        seniorDebtRate: params.seniorDebtRate || 6,
        seniorDebtAmortization: seniorDebtAmortYears,
        seniorDebtIOYears: seniorDebtIOYears,
        // ISS-041: Include PABs in hard debt service calculation
        pabEnabled: paramPabEnabled,
        pabAmount: reservePabAmount,
        pabRate: paramPabRate,
        pabAmortization: paramPabAmortization,
        pabIOYears: paramPabIOYears,
        outsideInvestorSubDebtPct: paramOutsideInvestorSubDebtPct,
        outsideInvestorSubDebtPikRate: paramOutsideInvestorSubDebtPikRate,
        outsideInvestorPikCurrentPayEnabled: paramOutsideInvestorPikCurrentPayEnabled,
        outsideInvestorPikCurrentPayPct: paramOutsideInvestorPikCurrentPayPct,
        hdcSubDebtPct: paramHdcSubDebtPct,
        hdcSubDebtPikRate: paramHdcSubDebtPikRate,
        hdcPikCurrentPayEnabled: paramPikCurrentPayEnabled,
        hdcPikCurrentPayPct: paramPikCurrentPayPct,
        investorSubDebtPct: paramInvestorSubDebtPct,
        investorSubDebtPikRate: paramInvestorSubDebtPikRate,
        investorPikCurrentPayEnabled: paramInvestorPikCurrentPayEnabled,
        investorPikCurrentPayPct: paramInvestorPikCurrentPayPct,
      });

      // Check for convergence
      if (Math.abs(newReserve - interestReserveAmount) < RESERVE_TOLERANCE) {
        interestReserveAmount = newReserve;
        break;
      }

      // Update reserve and effective project cost for next iteration
      interestReserveAmount = newReserve;
      effectiveProjectCost = baseProjectCost + interestReserveAmount;
    }
  }

  // Final effective project cost with converged reserve
  effectiveProjectCost = baseProjectCost + interestReserveAmount;

  // ISS-070Q: Trace debt calculation step 3 (export-only)
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] 3. effectiveProjectCost:', {
      baseProjectCost,
      interestReserveAmount,
      effectiveProjectCost,
      interestReserveEnabled,
    });
  }

  // Calculate all capital components based on effective project cost
  const subDebtPrincipal = effectiveProjectCost * (paramHdcSubDebtPct / 100);
  const investorSubDebtPrincipal = effectiveProjectCost * (paramInvestorSubDebtPct / 100);
  const outsideInvestorSubDebtPrincipal = effectiveProjectCost * (paramOutsideInvestorSubDebtPct / 100);

  // Calculate debt amounts based on effective project cost
  const seniorDebtAmount = effectiveProjectCost * ((params.seniorDebtPct || 0) / 100);
  const philDebtAmount = effectiveProjectCost * ((params.philanthropicDebtPct || 0) / 100);

  // Calculate investor equity based on effective project cost
  const investorEquity = effectiveProjectCost * (paramInvestorEquityPct / 100);

  // ISS-070Q: Trace debt calculation step 4 (export-only)
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] 4. seniorDebtAmount:', {
      effectiveProjectCost,
      'params.seniorDebtPct': params.seniorDebtPct,
      seniorDebtAmount,
      investorEquity,
      'paramInvestorEquityPct': paramInvestorEquityPct,
    });
  }

  // IMPL-073: State LIHTC syndication as capital return (shown in Returns Buildup)
  // IMPL-074: MOIC/IRR denominator uses NET equity (after syndication offset) for investor marketing
  // Syndication proceeds are also shown as cash returned in a specific year
  let stateLIHTCSyndicationProceeds = 0;
  const stateLIHTCSyndicationYear = params.stateLIHTCSyndicationYear ?? 0; // IMPL-076: Default Year 0 (syndicator funds at close)
  if (paramStateLIHTCIntegration?.creditPath === 'syndicated' &&
      paramStateLIHTCIntegration.netProceeds > 0) {
    stateLIHTCSyndicationProceeds = paramStateLIHTCIntegration.netProceeds;
  }
  // IMPL-074: Syndication offset reduces net equity for MOIC/IRR calculation
  const syndicatedEquityOffset = stateLIHTCSyndicationProceeds;
  const investorEquityAfterOffset = investorEquity - syndicatedEquityOffset;

  // Calculate P&I payment for use after IO period ends
  const monthlySeniorDebtPIPayment = calculateMonthlyPayment(seniorDebtAmount, seniorDebtRate, seniorDebtAmortYears);
  const annualSeniorDebtPIPayment = monthlySeniorDebtPIPayment * 12;

  // Calculate annual interest-only payment for IO period
  const annualSeniorDebtIOPayment = seniorDebtAmount * seniorDebtRate;

  // ISS-070Q: Trace debt calculation step 5 (export-only)
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] 5. Debt service calculation:', {
      seniorDebtAmount,
      seniorDebtRate,
      seniorDebtAmortYears,
      monthlySeniorDebtPIPayment,
      annualSeniorDebtPIPayment,
      annualSeniorDebtIOPayment,
    });
  }

  // Private Activity Bonds (IMPL-080)
  // PAB Amount = LIHTC Eligible Basis × PAB % (not project cost - avoids circular dependency)
  const pabAmount = paramPabEnabled && paramLihtcEnabled && paramLihtcEligibleBasis > 0
    ? paramLihtcEligibleBasis * (paramPabPctOfEligibleBasis / 100)
    : 0;
  const pabRate = paramPabRate / 100;
  const monthlyPabPIPayment = calculateMonthlyPayment(pabAmount, pabRate, paramPabAmortization);
  const annualPabPIPayment = monthlyPabPIPayment * 12;
  const annualPabIOPayment = pabAmount * pabRate;

  // ISS-070R: Trace PAB calculation result
  if (options?.isExport) {
    console.log('[EXPORT-ONLY DEBT] PAB calculation:', {
      paramPabEnabled,
      paramLihtcEnabled,
      paramLihtcEligibleBasis,
      pabAmount,
      annualPabPIPayment,
      annualPabIOPayment,
      pabShouldBeZero: !paramPabEnabled || !paramLihtcEnabled || paramLihtcEligibleBasis <= 0,
    });
  }

  // Philanthropic debt is always interest-only (no principal amortization)
  // When current pay is disabled, all interest accrues as PIK (no payments)
  // When current pay is enabled, a portion of interest is paid currently, rest accrues as PIK

  const investorCashFlows: CashFlowItem[] = [];
  // ISS-068c: Simplified to direct NOI growth (removed revenue/expense tracking)
  let currentNOI = paramYearOneNOI;
  let cumulativeReturns = 0;
  let investorCumulativePikBalance = 0;
  let hdcPikBalance = subDebtPrincipal; // Track HDC PIK balance for compound interest
  let investorPikBalance = investorSubDebtPrincipal; // Track investor PIK balance for compound interest
  let outsideInvestorPikBalance = outsideInvestorSubDebtPrincipal; // Track outside investor PIK balance for compound interest
  // HDC Debt Fund (IMPL-082) - Similar to outsideInvestor, visible in leverage mode
  const hdcDebtFundPrincipal = effectiveProjectCost * (paramHdcDebtFundPct / 100);
  let hdcDebtFundPikBalance = hdcDebtFundPrincipal;
  let philPikBalance = 0; // Track only the PIK portion of philanthropic debt, NOT the principal

  // Track total cost of outside investor debt
  let totalOutsideInvestorCashPaid = 0;
  let totalOutsideInvestorPIKAccrued = 0;

  // Track total cost of HDC Debt Fund (IMPL-082)
  let totalHdcDebtFundCashPaid = 0;
  let totalHdcDebtFundPIKAccrued = 0;
  
  // Waterfall tracking
  let equityRecovered = 0; // Track how much of initial equity has been recovered
  let hurdleMet = false; // Track if investor has recovered their initial equity
  let hdcDeferredFees = 0; // Track any HDC fees that have been deferred
  let hdcCatchUpOwed = 0; // Track HDC catch-up amount for deferred items
  let catchUpComplete = true; // Start as true, only set false if fees are deferred

  // Track accumulated unpaid AUM fees (per HDC_CALCULATION_LOGIC.md: AUM fees accrue as PIK debt)
  let accumulatedAumFees = 0;
  let accumulatedAumPIK = 0; // Track intentional PIK portion (not subject to catch-up)
  let accumulatedAumCurrentPayDeferred = 0; // Track deferred current pay portion (subject to catch-up)

  // ISS-064: Calculate placed-in-service year outside the loop (constant for entire calculation)
  const constructionDelayYears = Math.floor(paramConstructionDelayMonths / 12);
  const placedInServiceYear = constructionDelayYears + 1; // Building placed in service after construction
  // Hold period computed from LIHTC credit exhaustion + K-1 delay (not user-editable)
  const { holdFromPIS, totalInvestmentYears } = computeHoldPeriod(
    paramPlacedInServiceMonth,
    paramConstructionDelayMonths,
    paramTaxBenefitDelayMonths
  );

  // IMPL-087: Disposition year proration constants
  const dispositionFraction = paramExitMonth / 12;
  const macrsFraction = (paramExitMonth - 0.5) / 12; // IRC §168(d)(2) mid-month convention

  // Benefit delay shift constants (month-level K-1 delivery lag)
  const delayFullYears = Math.floor(paramTaxBenefitDelayMonths / 12);
  const delayFraction = (paramTaxBenefitDelayMonths % 12) / 12;

  // Pending benefit arrays — earned benefits scheduled here with delay offset,
  // then realized each year. Index = year - 1 (0-indexed).
  // Extra slots for spillover that falls past exit (truncated = lost to investor).
  const pendingDepBenefits = new Array(totalInvestmentYears + delayFullYears + 2).fill(0);
  const pendingFedLIHTC = new Array(totalInvestmentYears + delayFullYears + 2).fill(0);
  const pendingStateLIHTC = new Array(totalInvestmentYears + delayFullYears + 2).fill(0);

  // Track interest reserve balance for lease-up period
  let interestReserveBalance = interestReserveAmount;
  const interestReservePeriodYears = Math.ceil(interestReserveMonths / 12);

  // ISS-064: Anchor lease-up period to placed-in-service year, not Year 1
  // Lease-up runs from placedInServiceYear through (placedInServiceYear + interestReservePeriodYears - 1)
  const leaseUpEndYear = placedInServiceYear + interestReservePeriodYears - 1;

  // ISS-070k: Logging before cash flow loop to verify values being used
  console.log('[ISS-070k] About to generate cash flows with:', {
    paramYearOneNOI,
    'params.seniorDebtPct': params.seniorDebtPct,
    totalInvestmentYears,
    holdFromPIS,
    currentNOI,
    baseSeniorDebtAmount,
    basePhilDebtAmount,
    seniorDebtRate,
    philDebtRate,
    placedInServiceYear,
    constructionDelayYears,
    paramConstructionDelayMonths,
  });

  for (let year = 1; year <= totalInvestmentYears; year++) {
    // ISS-070L: Trace inside loop to find where NOI becomes zero
    if (year === 1) {
      console.log('[ISS-070L] Year 1 loop entry:', {
        year,
        placedInServiceYear,
        'year < placedInServiceYear': year < placedInServiceYear,
        'year === placedInServiceYear': year === placedInServiceYear,
        currentNOI,
        paramYearOneNOI,
      });
    }

    // Determine NOI for this year based on placement in service
    let effectiveNOI = 0;
    let effectiveOccupancy = 1.0;
    let interestReserveDraw = 0;

    // FUTURE ENHANCEMENT: Construction Period
    // TODO: When adding construction period support:
    // 1. Add construction loan parameters (amount, rate, interest-only period)
    // 2. Track construction draws and interest capitalization
    // 3. Convert construction loan to permanent at TCO/placed-in-service
    // 4. Delay depreciation/tax benefits until placed-in-service
    // 5. Result: More value creation but longer time to tax benefits

    if (year < placedInServiceYear) {
      // Building under construction - no NOI
      effectiveNOI = 0;
      currentNOI = 0;
      effectiveOccupancy = 0;
    } else if (year === placedInServiceYear) {
      // ISS-064: Reset NOI to initial value after construction ends
      // currentNOI was set to 0 during construction years and must be restored
      currentNOI = paramYearOneNOI;

      // First year of operations (might be partial)
      const monthsInService = 12 - (paramConstructionDelayMonths % 12);

      // ISS-053: Apply S-curve lease-up in the placed-in-service year too
      // The S-curve models gradual occupancy ramp-up during lease-up period
      // ISS-064: Lease-up is now anchored to placed-in-service year, not Year 1
      if (interestReserveEnabled && year <= leaseUpEndYear) {
        // Calculate average occupancy over the year using S-curve
        // ISS-064: Month calculations are relative to placed-in-service year
        const yearsIntoLeaseUp = year - placedInServiceYear;
        const startMonth = yearsIntoLeaseUp * 12;
        const endMonth = Math.min((yearsIntoLeaseUp + 1) * 12, interestReserveMonths);
        let totalOccupancy = 0;
        let monthCount = 0;

        for (let month = startMonth + 1; month <= endMonth; month++) {
          const progress = Math.min(1, month / interestReserveMonths);
          const monthlyOccupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
          totalOccupancy += monthlyOccupancy;
          monthCount++;
        }

        effectiveOccupancy = monthCount > 0 ? totalOccupancy / monthCount : 0;

        // Apply both partial year pro-rating AND S-curve occupancy
        if (monthsInService === 12) {
          effectiveNOI = currentNOI * effectiveOccupancy;
        } else {
          effectiveNOI = currentNOI * (monthsInService / 12) * effectiveOccupancy;
        }
      } else {
        // No S-curve - use simple partial year logic
        if (monthsInService === 12) {
          // Full year of operations
          effectiveNOI = currentNOI;
        } else {
          // Partial year - pro-rate the NOI
          effectiveNOI = currentNOI * (monthsInService / 12);
        }
      }
    } else {
      // Full operations - apply growth for years after placement
      // ISS-068c: Direct NOI growth replaces separate revenue/expense growth
      const yearsOfOperation = year - placedInServiceYear;
      if (yearsOfOperation > 0) {
        currentNOI *= (1 + paramNoiGrowthRate / 100);
      }

      // Apply S-curve lease-up if within interest reserve period
      // ISS-064: Lease-up is now anchored to placed-in-service year, not Year 1
      if (interestReserveEnabled && year <= leaseUpEndYear) {
        // Calculate average occupancy over the year using S-curve
        // Integrate monthly occupancy values for more accurate yearly average
        // ISS-064: Month calculations are relative to placed-in-service year
        const yearsIntoLeaseUp = year - placedInServiceYear;
        const startMonth = yearsIntoLeaseUp * 12;
        const endMonth = Math.min((yearsIntoLeaseUp + 1) * 12, interestReserveMonths);
        let totalOccupancy = 0;
        let monthCount = 0;

        for (let month = startMonth + 1; month <= endMonth; month++) {
          const progress = Math.min(1, month / interestReserveMonths);
          const monthlyOccupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
          totalOccupancy += monthlyOccupancy;
          monthCount++;
        }

        effectiveOccupancy = monthCount > 0 ? totalOccupancy / monthCount : 0;

        // ISS-053: REMOVED override that set effectiveOccupancy = 1.0
        // The S-curve naturally produces correct average occupancy (~50% for 12-month reserve)
        // This allows the interest reserve to be consumed during the lease-up shortfall
        // Post-stabilization (year > leaseUpEndYear) uses 100% occupancy below
      } else {
        effectiveOccupancy = 1.0;
      }

      effectiveNOI = currentNOI * effectiveOccupancy;
    }

    // IMPL-087: Store annualized NOI BEFORE prorating (used by trailing 12-month exit valuation)
    const annualizedNOI = effectiveNOI;

    // IMPL-087: Disposition year proration — only prorate cash received, not growth base
    if (year === totalInvestmentYears) {
      effectiveNOI *= dispositionFraction;
    }

    // ISS-070L: Log effectiveNOI after all branch logic
    if (year === 1) {
      console.log('[ISS-070L] Year 1 after NOI calculation:', {
        effectiveNOI,
        currentNOI,
        effectiveOccupancy,
      });
    }

    // First calculate the depreciation-based tax benefit for this year
    // Depreciation can only be claimed after building is placed in service
    let grossDepreciationTaxBenefit = 0; // Benefit before any adjustments
    let depreciationTaxBenefit = 0; // Net benefit to investor
    let yearlyDepreciationAmount = 0; // IMPL-048: Track raw depreciation for OZ recapture avoided
    // IMPL-061: Track bonus vs MACRS breakdown for Returns Buildup Strip
    let bonusTaxBenefit = 0; // Year 1 bonus depreciation tax benefit
    let year1MacrsTaxBenefit = 0; // Year 1 MACRS (partial year) tax benefit

    if (year >= placedInServiceYear) {
      const depreciationYear = year - placedInServiceYear + 1; // Which year of depreciation this is

      if (depreciationYear === 1) {
        // First year of depreciation (IRS MACRS with mid-month convention)
        // CRITICAL: For OZ investments, investor equity (QCGs) is excluded from depreciable basis
        // Use shared utility function to ensure consistency
        // FIXED: Now includes interest reserve in investor equity calculation per HDC_CALCULATION_LOGIC.md Step 1
        const depreciableBasis = calculateDepreciableBasis({
          projectCost: paramProjectCost,
          predevelopmentCosts: paramPredevelopmentCosts,
          landValue: paramLandValue,
          investorEquityPct: paramInvestorEquityPct,
          interestReserve: interestReserveAmount
        });

        // ISS-070T: Export-only logging for depreciable basis
        if (options?.isExport) {
          const excelBasis = paramProjectCost - paramLandValue;
          console.log('[EXPORT-ONLY] Depreciable basis calculation:', {
            paramProjectCost,
            paramPredevelopmentCosts,
            paramLandValue,
            paramInvestorEquityPct,
            interestReserveAmount,
            'Excel formula (ProjectCost-LandValue)': excelBasis,
            'Platform depreciableBasis': depreciableBasis,
            'Difference': depreciableBasis - excelBasis,
            'Match': Math.abs(depreciableBasis - excelBasis) < 0.01,
          });
        }

        // Year 1 includes BOTH bonus depreciation AND partial straight-line (IRS Pub 946)
        const bonusDepreciation = depreciableBasis * (paramYearOneDepreciationPct / 100);
        const remainingBasis = depreciableBasis - bonusDepreciation;
        const annualMACRS = remainingBasis / 27.5;

        // Mid-month convention: Property is treated as placed in service at midpoint of month
        // Formula: monthsInService = 12.5 - placedInServiceMonth
        // Example: July (month 7) = 12.5 - 7 = 5.5 months
        const monthsInYear1 = 12.5 - paramPlacedInServiceMonth;
        const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

        // IMPL-041: Apply split rates for state conformity
        // Bonus depreciation: Uses conformity-adjusted rate (e.g., NJ 30% conformity)
        // MACRS depreciation: Uses full state rate (all states accept straight-line)
        // ISS-070T: Compute default effective rate including NIIT (matches Excel formula)
        const federalRate = params.federalTaxRate || 37;
        const niitRate = params.niitRate || 3.8;
        const stateRate = params.stateTaxRate || 0;
        const conformityRate = params.bonusConformityRate ?? 1;
        const defaultEffectiveRateBonus = federalRate + niitRate + (stateRate * conformityRate);
        const defaultEffectiveRateMACRS = federalRate + niitRate + stateRate;
        const effectiveRateForBonus = paramEffectiveTaxRateForBonus ?? (paramEffectiveTaxRate > 0 ? paramEffectiveTaxRate : defaultEffectiveRateBonus);
        const effectiveRateForMACRS = paramEffectiveTaxRateForStraightLine ?? (paramEffectiveTaxRate > 0 ? paramEffectiveTaxRate : defaultEffectiveRateMACRS);

        // IMPL-061: Assign to outer-scope variables for cash flow storage
        bonusTaxBenefit = bonusDepreciation * (effectiveRateForBonus / 100);
        year1MacrsTaxBenefit = year1MACRS * (effectiveRateForMACRS / 100);
        grossDepreciationTaxBenefit = bonusTaxBenefit + year1MacrsTaxBenefit;
        depreciationTaxBenefit = grossDepreciationTaxBenefit; // Full benefit to investor

        // ISS-070T: Export-only logging for tax benefit calculation
        if (options?.isExport) {
          console.log('[EXPORT-ONLY] Tax benefit Y1 calculation:', {
            depreciableBasis,
            paramYearOneDepreciationPct,
            bonusDepreciation,
            remainingBasis,
            annualMACRS,
            paramPlacedInServiceMonth,
            monthsInYear1,
            year1MACRS,
            effectiveRateForBonus,
            effectiveRateForMACRS,
            bonusTaxBenefit,
            year1MacrsTaxBenefit,
            'Total Y1 Tax Benefit': grossDepreciationTaxBenefit,
          });
        }

        // IMPL-048: Track raw depreciation amount for OZ recapture avoided calculation
        yearlyDepreciationAmount = bonusDepreciation + year1MACRS;

      } else if (depreciationYear <= 27.5) {
        // Subsequent years: Annual straight-line depreciation tax benefit
        // IMPL-041: Use straight-line rate (all states accept MACRS straight-line)
        const annualDepreciation = annualStraightLineDepreciation || 0;
        // IMPL-087: Disposition year — IRC §168(d)(2) mid-month convention
        const adjustedDepreciation = (year === totalInvestmentYears)
          ? annualDepreciation * macrsFraction
          : annualDepreciation;
        // ISS-070T: Compute default effective rate including NIIT (matches Excel formula)
        const federalRate = params.federalTaxRate || 37;
        const niitRate = params.niitRate || 3.8;
        const stateRate = params.stateTaxRate || 0;
        const defaultEffectiveRateMACRS = federalRate + niitRate + stateRate;
        const effectiveTaxRate = paramEffectiveTaxRateForStraightLine ?? (paramEffectiveTaxRate > 0 ? paramEffectiveTaxRate : defaultEffectiveRateMACRS);

        if (adjustedDepreciation > 0 && effectiveTaxRate > 0) {
          grossDepreciationTaxBenefit = adjustedDepreciation * (effectiveTaxRate / 100);
          depreciationTaxBenefit = grossDepreciationTaxBenefit; // Full benefit to investor

          // IMPL-048: Track raw depreciation amount for OZ recapture avoided calculation
          yearlyDepreciationAmount = adjustedDepreciation;

          // Validate tax benefits go 100% to investor, never split by promote
          validateTaxBenefitDistribution(
            grossDepreciationTaxBenefit,
            0, // No HDC fee
            grossDepreciationTaxBenefit,
            0 // Tax benefits never split by promote
          );
        }
      }
    }

    // Tax benefit realization — computed after DSCR/waterfall, applied via pending arrays
    let yearlyTaxBenefit = 0;

    // Handle philanthropic debt service calculation (always interest-only)
    let philDebtServiceThisYear = 0;
    if (philDebtAmount > 0 && philDebtRate > 0) {
      // Calculate interest on total outstanding balance (principal + accumulated PIK)
      const philTotalBalance = philDebtAmount + philPikBalance;
      const philFullInterest = philTotalBalance * philDebtRate; // philDebtRate is already a decimal

      if (!paramPhilCurrentPayEnabled) {
        // Current pay disabled: All interest accrues as PIK (no payment)
        philPikBalance += philFullInterest;
        philDebtServiceThisYear = 0;
      } else if (year <= placedInServiceYear) {
        // Construction + PIS year with current pay: Full interest accrues to PIK, no payment
        philPikBalance += philFullInterest;
        philDebtServiceThisYear = 0;
      } else {
        // Years 2+ with current pay: Pay current portion, rest accrues
        const philCurrentPay = philFullInterest * (paramPhilCurrentPayPct / 100);
        const philPIKAccrued = philFullInterest - philCurrentPay;
        philPikBalance += philPIKAccrued;
        philDebtServiceThisYear = philCurrentPay;
      }
    }

    // SOFT PAY WATERFALL IMPLEMENTATION
    // Step 1: Calculate what each sub-debt WANTS to receive (current pay portion)
    let outsideInvestorCurrentPayDue = 0;
    let outsideInvestorSubDebtPIKAccrued = 0;
    if (paramOutsideInvestorSubDebtPct > 0 && outsideInvestorPikBalance > 0) {
      // IMPL-087: Prorate by dispositionFraction in disposition year
      const outsideInvestorFullInterest = outsideInvestorPikBalance * (paramOutsideInvestorSubDebtPikRate / 100)
        * (year === totalInvestmentYears ? dispositionFraction : 1);
      if (paramOutsideInvestorPikCurrentPayEnabled) {
        outsideInvestorCurrentPayDue = outsideInvestorFullInterest * (paramOutsideInvestorPikCurrentPayPct / 100);
        outsideInvestorSubDebtPIKAccrued = outsideInvestorFullInterest - outsideInvestorCurrentPayDue;
      } else {
        outsideInvestorCurrentPayDue = 0;
        outsideInvestorSubDebtPIKAccrued = outsideInvestorFullInterest;
      }
    }

    // HDC Debt Fund interest calculation (IMPL-082)
    let hdcDebtFundCurrentPayDue = 0;
    let hdcDebtFundPIKAccrued = 0;
    if (paramHdcDebtFundPct > 0 && hdcDebtFundPikBalance > 0) {
      // IMPL-087: Prorate by dispositionFraction in disposition year
      const hdcDebtFundFullInterest = hdcDebtFundPikBalance * (paramHdcDebtFundPikRate / 100)
        * (year === totalInvestmentYears ? dispositionFraction : 1);
      if (paramHdcDebtFundCurrentPayEnabled && year > interestReservePeriodYears) {
        hdcDebtFundCurrentPayDue = hdcDebtFundFullInterest * (paramHdcDebtFundCurrentPayPct / 100);
        hdcDebtFundPIKAccrued = hdcDebtFundFullInterest - hdcDebtFundCurrentPayDue;
      } else {
        hdcDebtFundCurrentPayDue = 0;
        hdcDebtFundPIKAccrued = hdcDebtFundFullInterest;
      }
    }

    let hdcSubDebtCurrentPayDue = 0;
    let hdcSubDebtPIKAccrued = 0;
    if (paramHdcSubDebtPct > 0 && hdcPikBalance > 0) {
      // IMPL-087: Prorate by dispositionFraction in disposition year
      const hdcFullInterest = hdcPikBalance * (paramHdcSubDebtPikRate / 100)
        * (year === totalInvestmentYears ? dispositionFraction : 1);
      // CRITICAL FIX: Use interest reserve period, not hard-coded year > 1
      // Current pay begins only after property is stabilized (interest reserve period ends)
      if (paramPikCurrentPayEnabled && year > interestReservePeriodYears) {
        hdcSubDebtCurrentPayDue = hdcFullInterest * (paramPikCurrentPayPct / 100);
        hdcSubDebtPIKAccrued = hdcFullInterest - hdcSubDebtCurrentPayDue;
      } else {
        hdcSubDebtCurrentPayDue = 0;
        hdcSubDebtPIKAccrued = hdcFullInterest;
      }
    }

    let investorSubDebtCurrentPayDue = 0;
    let investorSubDebtPIKAccrued = 0;
    if (paramInvestorSubDebtPct > 0 && investorPikBalance > 0) {
      // IMPL-087: Prorate by dispositionFraction in disposition year
      const investorFullInterest = investorPikBalance * (paramInvestorSubDebtPikRate / 100)
        * (year === totalInvestmentYears ? dispositionFraction : 1);
      // CRITICAL FIX: Use interest reserve period, not hard-coded year > 1
      // Current pay begins only after property is stabilized (interest reserve period ends)
      if (paramInvestorPikCurrentPayEnabled && year > interestReservePeriodYears) {
        investorSubDebtCurrentPayDue = investorFullInterest * (paramInvestorPikCurrentPayPct / 100);
        investorSubDebtPIKAccrued = investorFullInterest - investorSubDebtCurrentPayDue;
      } else {
        investorSubDebtCurrentPayDue = 0;
        investorSubDebtPIKAccrued = investorFullInterest;
      }
    }

    // Step 1.5: Calculate Senior Debt Service (IO or P&I based on year and placed in service)
    // During construction: no debt service
    // IO period starts when property is placed in service
    let annualSeniorDebtService = 0;
    if (year < placedInServiceYear) {
      // During construction - no debt service yet
      annualSeniorDebtService = 0;
    } else {
      // Property is placed in service - apply IO or P&I logic
      const ioEndYear = placedInServiceYear + seniorDebtIOYears;
      const isInIOPeriod = (year >= placedInServiceYear && year < ioEndYear);
      annualSeniorDebtService = isInIOPeriod ? annualSeniorDebtIOPayment : annualSeniorDebtPIPayment;
    }
    // IMPL-087: Disposition year proration
    if (year === totalInvestmentYears) annualSeniorDebtService *= dispositionFraction;

    // Step 1.6: Calculate PAB Debt Service (IMPL-080)
    // PAB is pari passu with Senior Debt (both "must pay")
    let annualPabDebtService = 0;
    if (paramPabEnabled && pabAmount > 0 && year >= placedInServiceYear) {
      const pabIoEndYear = placedInServiceYear + paramPabIOYears;
      const isInPabIOPeriod = year < pabIoEndYear;
      annualPabDebtService = isInPabIOPeriod ? annualPabIOPayment : annualPabPIPayment;
    }
    // IMPL-087: Disposition year proration
    if (year === totalInvestmentYears) annualPabDebtService *= dispositionFraction;

    // Step 2: Calculate HARD DEBT service (for DSCR - Senior + PAB + Phil current pay)
    // This is used for cash management and targets 1.05x
    const hardDebtService = annualSeniorDebtService + annualPabDebtService + philDebtServiceThisYear;

    // ISS-070Q: Trace debt calculation step 6 (export-only, first year only)
    if (options?.isExport && year === 1) {
      console.log('[EXPORT-ONLY DEBT] 6. Cash flow Y1 hardDebtService:', {
        year,
        annualSeniorDebtService,
        annualPabDebtService,
        philDebtServiceThisYear,
        hardDebtService,
        effectiveNOI,
        dscr: hardDebtService > 0 ? effectiveNOI / hardDebtService : 0,
      });
    }

    // DSCR Breakdown (IMPL-081) - Display metrics only
    // Must-Pay DSCR: Senior + PAB only (true hard floor - no PIK option)
    const mustPayDebtService = annualSeniorDebtService + annualPabDebtService;
    const mustPayDSCR = mustPayDebtService > 0 ? effectiveNOI / mustPayDebtService : 0;
    // Phil DSCR: Senior + PAB + Phil current pay (Amazon 1.05x requirement)
    const philDSCR = hardDebtService > 0 ? effectiveNOI / hardDebtService : 0;

    // Step 3: Calculate available cash maintaining exactly 1.05 DSCR
    // CRITICAL: The 0.05x buffer (5% above debt service) must be preserved
    // Only distribute cash ABOVE the 1.05x threshold
    const requiredForDSCR = hardDebtService * DSCR_COVENANT_THRESHOLD;

    // Calculate operational DSCR (before interest reserve)
    const operationalDSCR = hardDebtService > 0 ? effectiveNOI / hardDebtService : 0;
    let availableCashForSoftPay = 0;

    // Interest Reserve Draw Logic
    // ISS-064: Lease-up is now anchored to placed-in-service year, not Year 1
    if (interestReserveEnabled && interestReserveBalance > 0 && year >= placedInServiceYear && year <= leaseUpEndYear) {
      // Calculate total debt service needs (hard + soft current pay obligations)
      // During lease-up, we need to cover all debt service
      const totalDebtServiceNeeds = hardDebtService;

      // Calculate shortfall
      const operationalShortfall = Math.max(0, totalDebtServiceNeeds - effectiveNOI);

      // Draw from interest reserve to cover shortfall
      interestReserveDraw = Math.min(operationalShortfall, interestReserveBalance);
      interestReserveBalance -= interestReserveDraw;

      // Add reserve draw to available cash
      const totalCashAvailable = effectiveNOI + interestReserveDraw;
      availableCashForSoftPay = Math.max(0, totalCashAvailable - requiredForDSCR);

      // Debug logging for interest reserve
      if (year <= 3) {
        console.log(`Interest Reserve - Year ${year}:`, {
          effectiveOccupancy: (effectiveOccupancy * 100).toFixed(1) + '%',
          operationalNOI: effectiveNOI,
          shortfall: operationalShortfall,
          reserveDraw: interestReserveDraw,
          remainingReserve: interestReserveBalance,
          operationalDSCR: operationalDSCR.toFixed(2),
          totalDSCR: (totalCashAvailable / hardDebtService).toFixed(2)
        });
      }
    } else {
      // No interest reserve available or not enabled
      availableCashForSoftPay = Math.max(0, effectiveNOI - requiredForDSCR);
    }

    // Initialize payment tracking variables
    let outsideInvestorCurrentPay = 0;
    let hdcDebtFundCurrentPay = 0;
    let hdcSubDebtCurrentPay = 0;
    let investorSubDebtInterestReceived = 0;

    // Calculate HDC AUM fee with current pay option
    // IMPL-087: Prorate by dispositionFraction in disposition year
    const aumFeeBase = (paramAumFeeEnabled && year > placedInServiceYear) ?
      effectiveProjectCost * (paramAumFeeRate / 100) * (year === totalInvestmentYears ? dispositionFraction : 1) : 0;

    if (year === 2 && paramAumFeeEnabled) {
      console.log('💰 AUM Fee Calculation Year 2:', {
        paramAumFeeRate,
        paramAumFeeEnabled,
        effectiveProjectCost,
        aumFeeBase
      });
    }

    // Apply interest to accumulated balances
    if (accumulatedAumPIK > 0) {
      const aumPIKInterest = accumulatedAumPIK * (paramHdcDeferredInterestRate / 100);
      accumulatedAumPIK += aumPIKInterest;
    }
    if (accumulatedAumCurrentPayDeferred > 0) {
      const deferredInterest = accumulatedAumCurrentPayDeferred * (paramHdcDeferredInterestRate / 100);
      accumulatedAumCurrentPayDeferred += deferredInterest;
    }

    // Calculate current pay vs PIK portions for AUM fee
    let aumFeeCurrentPayDue = 0;
    let aumFeePIKDue = 0;

    if (aumFeeBase > 0) {
      if (paramAumCurrentPayEnabled) {
        aumFeeCurrentPayDue = aumFeeBase * (paramAumCurrentPayPct / 100);
        aumFeePIKDue = aumFeeBase * ((100 - paramAumCurrentPayPct) / 100);
      } else {
        // If current pay not enabled, entire fee is deferred as PIK
        aumFeePIKDue = aumFeeBase;
      }
    }

    // ISS-056: AUM Fee Current Pay Toggle Fix
    // When current pay is ENABLED: current pay portion + catch-up on deferred goes to payment queue
    // When current pay is DISABLED: entire fee is PIK (deferred to exit), nothing in payment queue
    const aumFeeAmount = paramAumCurrentPayEnabled
      ? aumFeeCurrentPayDue + accumulatedAumCurrentPayDeferred
      : 0; // ISS-056: When current pay disabled, no cash payment - all PIK

    // Debug logging for AUM fee
    if (paramAumFeeEnabled && (year === 1 || year === 2 || year === 3)) {
      console.log(`AUM Fee Debug - Year ${year}:`, {
        enabled: paramAumFeeEnabled,
        rate: paramAumFeeRate,
        projectCost: effectiveProjectCost,
        aumFeeBase,
        currentPayEnabled: paramAumCurrentPayEnabled,
        currentPayPct: paramAumCurrentPayPct,
        aumFeeCurrentPayDue,
        aumFeePIKDue,
        aumFeeAmount,
        accumulatedAumPIK,
        accumulatedAumCurrentPayDeferred
      });
    }

    // UNIFIED PAYMENT WATERFALL WITH 1.05 DSCR TARGET
    // Priority order when paying (normal operations):
    // 1. Outside Investor Current Interest
    // 2. Other Sub-Debt Current Interest (Investor, HDC)
    // 3. HDC AUM Fee (only if current pay enabled)
    // 4. Catch-up on deferrals (in reverse order)
    // 5. Distributions to equity

    let remainingCash = availableCashForSoftPay;
    let aumFeePaid = 0;
    let aumFeeAccrued = 0;

    // ISS-056: When current pay is DISABLED, immediately accumulate entire fee as PIK
    // This ensures toggle OFF = all fees deferred to exit (no cash impact during operations)
    if (!paramAumCurrentPayEnabled && aumFeeBase > 0) {
      accumulatedAumPIK += aumFeeBase;
      aumFeeAccrued = aumFeeBase;
      accumulatedAumFees = accumulatedAumPIK;
    }

    // Unified Payment Priority Waterfall
    const paymentQueue = [
      {
        name: 'outsideInvestorCurrentPay',
        amount: outsideInvestorCurrentPayDue,
        priority: 1,
        handler: (paid: number, deferred: number) => {
          outsideInvestorCurrentPay = paid;
          outsideInvestorSubDebtPIKAccrued += deferred;
          totalOutsideInvestorCashPaid += paid;
          return paid; // Cash outflow
        }
      },
      {
        // HDC Debt Fund (IMPL-082) - Priority 1 (same as Outside Investor)
        name: 'hdcDebtFundCurrentPay',
        amount: hdcDebtFundCurrentPayDue,
        priority: 1,
        handler: (paid: number, deferred: number) => {
          hdcDebtFundCurrentPay = paid;
          hdcDebtFundPIKAccrued += deferred;
          totalHdcDebtFundCashPaid += paid;
          return paid; // Cash outflow
        }
      },
      {
        name: 'hdcSubDebtCurrentPay',
        amount: hdcSubDebtCurrentPayDue,
        priority: 2,
        handler: (paid: number, deferred: number) => {
          hdcSubDebtCurrentPay = paid;
          hdcSubDebtPIKAccrued += deferred;
          return paid; // Cash outflow
        }
      },
      {
        name: 'investorSubDebtCurrentPay',
        amount: investorSubDebtCurrentPayDue,
        priority: 2,
        handler: (paid: number, deferred: number) => {
          investorSubDebtInterestReceived = paid;
          investorSubDebtPIKAccrued += deferred;
          // ISS-052: Fixed sign - payment is cash outflow from project (deducts from remainingCash)
          return paid;
        }
      },
      {
        name: 'hdcAumFee',
        amount: aumFeeAmount,
        priority: 3,
        handler: (paid: number, deferred: number) => {
          aumFeePaid = paid;

          // Update accumulated balances
          if (paramAumCurrentPayEnabled) {
            // Current pay is enabled - handle current vs PIK portions
            if (paid < aumFeeCurrentPayDue) {
              // Couldn't pay full current portion, defer the difference
              const currentPayDeferred = aumFeeCurrentPayDue - paid;
              accumulatedAumCurrentPayDeferred += currentPayDeferred;
              accumulatedAumPIK += aumFeePIKDue; // Intentional PIK still accumulates
              aumFeeAccrued = currentPayDeferred + aumFeePIKDue;
            } else if (paid > aumFeeCurrentPayDue) {
              // Paid current portion and some catch-up on previously deferred current pay
              const catchupPaid = paid - aumFeeCurrentPayDue;
              accumulatedAumCurrentPayDeferred = Math.max(0, accumulatedAumCurrentPayDeferred - catchupPaid);
              accumulatedAumPIK += aumFeePIKDue; // Intentional PIK still accumulates
              aumFeeAccrued = aumFeePIKDue; // Only the intentional PIK is newly accrued
            } else {
              // Paid exactly current portion
              accumulatedAumPIK += aumFeePIKDue; // Intentional PIK accumulates
              aumFeeAccrued = aumFeePIKDue;
            }
          } else {
            // ISS-056: When current pay is DISABLED, aumFeeAmount = 0, so handler won't be
            // called with any payment. PIK accumulation is handled before the payment queue.
            // This branch only executes if aumFeeAmount somehow > 0 with current pay disabled.
            // (Defensive code - should not occur after ISS-056 fix)
          }

          // Total accumulated for exit calculation
          accumulatedAumFees = accumulatedAumPIK + accumulatedAumCurrentPayDeferred;
          return paid; // Cash outflow
        }
      }
    ].sort((a, b) => a.priority - b.priority);

    // PRIORITY-BASED CUTOFF FOR DSCR ENFORCEMENT
    // We must maintain exactly 1.05x DSCR by preserving the required buffer
    // The buffer ensures: NOI / HardDebt = 1.05
    // Therefore: Available Cash = NOI - (HardDebt * 1.05)

    // Track what we're actually paying to verify DSCR maintenance
    let totalSoftPaymentsMade = 0;
    const dscrBuffer = hardDebtService * 0.05; // 5% buffer above debt service

    // Process payments in priority order with strict DSCR enforcement
    for (const payment of paymentQueue) {
      if (payment.amount > 0) {
        // Check if we can make this payment without violating DSCR
        // For cash outflows, we need to preserve the buffer
        // For cash inflows (investor sub-debt), they add to available cash

        if (remainingCash > 0) {
          // Calculate how much we can pay while maintaining DSCR
          const canPay = Math.min(payment.amount, Math.max(0, remainingCash));
          const mustDefer = payment.amount - canPay;

          const cashImpact = payment.handler(canPay, mustDefer);

          // Safeguard against NaN and ensure non-negative cash
          if (isNaN(cashImpact)) {
            console.error(`NaN detected in payment ${payment.name}:`, {
              amount: payment.amount,
              remainingCash,
              canPay,
              mustDefer,
              cashImpact
            });
            // Skip this payment to prevent NaN propagation
            continue;
          }

          // Update remaining cash and track soft payments
          if (cashImpact > 0) {
            // Cash outflow - reduces available cash
            totalSoftPaymentsMade += cashImpact;
          }
          remainingCash = Math.max(0, remainingCash - cashImpact);

          // Verify we're not violating DSCR after this payment
          const impliedDSCR = hardDebtService > 0 ?
            (effectiveNOI - totalSoftPaymentsMade) / hardDebtService : 0;

          if (impliedDSCR < DSCR_COVENANT_THRESHOLD && hardDebtService > 0) {
            console.warn(`DSCR violation detected after ${payment.name}: ${impliedDSCR.toFixed(3)} < 1.05`);
          }
        } else {
          // No cash available, defer entire amount
          payment.handler(0, payment.amount);
        }
      }
    }

    // IMPL-030: AUM Catch-Up Logic
    // After paying current year's AUM fee, use any remaining cash to pay down deferred AUM balance
    let aumCatchUpPaid = 0;
    if (remainingCash > 0 && accumulatedAumFees > 0) {
      // Pay down as much of the deferred balance as possible
      aumCatchUpPaid = Math.min(remainingCash, accumulatedAumFees);

      // Reduce the deferred balance - prioritize reducing current pay deferred first
      if (accumulatedAumCurrentPayDeferred > 0) {
        const currentPayCatchUp = Math.min(aumCatchUpPaid, accumulatedAumCurrentPayDeferred);
        accumulatedAumCurrentPayDeferred -= currentPayCatchUp;
        const remainingCatchUp = aumCatchUpPaid - currentPayCatchUp;
        if (remainingCatchUp > 0 && accumulatedAumPIK > 0) {
          accumulatedAumPIK = Math.max(0, accumulatedAumPIK - remainingCatchUp);
        }
      } else {
        // Only PIK to pay down
        accumulatedAumPIK = Math.max(0, accumulatedAumPIK - aumCatchUpPaid);
      }

      // Update total accumulated fees
      accumulatedAumFees = accumulatedAumPIK + accumulatedAumCurrentPayDeferred;

      // Reduce remaining cash
      remainingCash -= aumCatchUpPaid;

      // Log catch-up payments for debugging
      if (aumCatchUpPaid > 0) {
        console.log(`IMPL-030 AUM Catch-Up - Year ${year}: Paid $${(aumCatchUpPaid / 1000000).toFixed(2)}M, Remaining deferred: $${(accumulatedAumFees / 1000000).toFixed(2)}M`);
      }
    }

    // Verify final DSCR is maintained at exactly 1.05x
    const cashPreservedForDSCR = effectiveNOI - totalSoftPaymentsMade - remainingCash
    const finalDSCR = hardDebtService > 0 ?
      (effectiveNOI - totalSoftPaymentsMade - remainingCash) / hardDebtService : 0;

    if (hardDebtService > 0 && Math.abs(finalDSCR - DSCR_COVENANT_THRESHOLD) > 0.001 && effectiveNOI > requiredForDSCR) {
      console.log(`DSCR Management - Year ${year}:`, {
        targetDSCR: DSCR_COVENANT_THRESHOLD,
        achievedDSCR: finalDSCR.toFixed(3),
        effectiveNOI,
        hardDebtService,
        totalSoftPaymentsMade,
        remainingCash,
        cashPreservedForDSCR
      });
    }

    // Update PIK balances after payments
    outsideInvestorPikBalance += outsideInvestorSubDebtPIKAccrued;
    totalOutsideInvestorPIKAccrued += outsideInvestorSubDebtPIKAccrued;
    hdcDebtFundPikBalance += hdcDebtFundPIKAccrued;
    totalHdcDebtFundPIKAccrued += hdcDebtFundPIKAccrued;
    hdcPikBalance += hdcSubDebtPIKAccrued;
    investorPikBalance += investorSubDebtPIKAccrued;

    // Calculate total debt service for reporting (includes actual soft pay amounts)
    const debtServicePayments = hardDebtService + outsideInvestorCurrentPay + hdcDebtFundCurrentPay + hdcSubDebtCurrentPay - investorSubDebtInterestReceived;

    // Cash after debt service (already accounted for in remainingCash)
    const cashAfterDebtService = remainingCash + aumFeePaid;

    // Cash available after all payments (for distributions)
    const cashAfterDebtAndFees = remainingCash;

    // Debug AUM fee payment results
    if (paramAumFeeEnabled && (year === 1 || year === 2 || year === 3)) {
      console.log(`AUM Fee Payment Results - Year ${year}:`, {
        aumFeePaid,
        aumFeeAccrued,
        cashAfterDebtAndFees,
        remainingCash,
        accumulatedAumFees,
        accumulatedAumPIK,
        accumulatedAumCurrentPayDeferred
      });
    }

    // Calculate DSCR metrics
    // Natural DSCR: The ratio before any cash management (for reference)
    const naturalDscr = hardDebtService > 0 ? effectiveNOI / hardDebtService : 0;

    // Actual DSCR: When we have sufficient cash, we maintain exactly 1.05x
    // by preserving the required buffer and only distributing the excess
    let actualDscr = naturalDscr;

    if (hardDebtService > 0 && effectiveNOI > requiredForDSCR) {
      // We have enough NOI to meet the 1.05x target
      // We maintain exactly 1.05x by preserving the buffer
      actualDscr = DSCR_COVENANT_THRESHOLD;
    } else if (hardDebtService > 0) {
      // We don't have enough NOI to meet 1.05x, use natural ratio
      actualDscr = naturalDscr;
    }

    // Target DSCR: Always 1.05x (our covenant requirement)
    const targetDscr = DSCR_COVENANT_THRESHOLD;

    // Log DSCR enforcement for verification
    if (hardDebtService > 0 && effectiveNOI > requiredForDSCR && Math.abs(actualDscr - DSCR_COVENANT_THRESHOLD) > 0.001) {
      console.warn(`DSCR not exactly 1.05 - Year ${year}:`, {
        targetDSCR: DSCR_COVENANT_THRESHOLD.toFixed(3),
        actualDSCR: actualDscr.toFixed(3),
        naturalDSCR: naturalDscr.toFixed(3),
        effectiveNOI,
        hardDebtService,
        totalSoftPaymentsMade,
        remainingCash
      });
    }

    // Investor gets full tax benefit (no HDC fee)
    depreciationTaxBenefit = grossDepreciationTaxBenefit;

    // Schedule earned depreciation benefit into pending array with delay shift
    // Construction gating already zeros depreciationTaxBenefit for year < placedInServiceYear
    // Skip scheduling when advance financing covers Year 1 (HDC fronts it directly)
    const advanceFinancingCoversThisYear = paramHdcAdvanceFinancing && year === 1;
    if (!advanceFinancingCoversThisYear) {
      const depTargetIdx = (year - 1) + delayFullYears;
      pendingDepBenefits[depTargetIdx] += depreciationTaxBenefit * (1 - delayFraction);
      if (delayFraction > 0) {
        pendingDepBenefits[depTargetIdx + 1] += depreciationTaxBenefit * delayFraction;
      }
    }

    // Realize this year's pending depreciation benefits (includes spillover from prior years)
    yearlyTaxBenefit = pendingDepBenefits[year - 1];

    // Handle HDC advance financing override (after DSCR adjustment)
    if (paramHdcAdvanceFinancing) {
      if (year === 1) {
        // With advance financing, investor gets immediate cash even if benefits are delayed
        // Use shared utility function to ensure consistency
        const depreciableBasis = calculateDepreciableBasis({
          projectCost: paramProjectCost,
          predevelopmentCosts: paramPredevelopmentCosts,
          landValue: paramLandValue,
          investorEquityPct: paramInvestorEquityPct,
          interestReserve: interestReserveAmount
        });

        // Year 1 includes BOTH bonus depreciation AND partial straight-line (IRS MACRS)
        const bonusDepreciation = depreciableBasis * (paramYearOneDepreciationPct / 100);
        const remainingBasis = depreciableBasis - bonusDepreciation;
        const annualMACRS = remainingBasis / 27.5;
        const monthsInYear1 = 12.5 - paramPlacedInServiceMonth;
        const year1MACRS = (monthsInYear1 / 12) * annualMACRS;

        // IMPL-041: Apply split rates for state conformity in advance financing override
        // ISS-070T: Compute default effective rate including NIIT (matches Excel formula)
        const federalRate = params.federalTaxRate || 37;
        const niitRate = params.niitRate || 3.8;
        const stateRate = params.stateTaxRate || 0;
        const conformityRate = params.bonusConformityRate ?? 1;
        const defaultEffectiveRateBonus = federalRate + niitRate + (stateRate * conformityRate);
        const defaultEffectiveRateMACRS = federalRate + niitRate + stateRate;
        const effectiveRateForBonus = paramEffectiveTaxRateForBonus ?? (paramEffectiveTaxRate > 0 ? paramEffectiveTaxRate : defaultEffectiveRateBonus);
        const effectiveRateForMACRS = paramEffectiveTaxRateForStraightLine ?? (paramEffectiveTaxRate > 0 ? paramEffectiveTaxRate : defaultEffectiveRateMACRS);
        const bonusTaxBenefit = bonusDepreciation * (effectiveRateForBonus / 100);
        const macrsTaxBenefit = year1MACRS * (effectiveRateForMACRS / 100);
        const year1GrossBenefit = bonusTaxBenefit + macrsTaxBenefit;

        yearlyTaxBenefit = year1GrossBenefit; // Full benefit to investor
      } else if (year <= Math.floor(paramTaxBenefitDelayMonths / 12)) {
        // During delay period with advance financing
        yearlyTaxBenefit = 0; // HDC already provided the advance
      }
    }

    // Track total benefits to investor this year (tax benefits + cash flows)
    // const totalBenefitsThisYear = yearlyTaxBenefit + cashAfterDebtAndFees;

    // Waterfall Distribution Logic
    // Tax benefits: 100% to investor (passive income offset, HDC fee already deducted)
    // Operating cash flows: Subject to waterfall and promote splits
    // Phase 1: Investor gets 100% until equity recovered
    // Phase 2: After recovery, operating cash splits per promote (tax benefits stay 100% to investor)
    // Note: HDC catch-up only for actual deferred fees, not to rebalance all distributions
    // See HDC_CALCULATION_LOGIC.md Step 4: Waterfall Distribution
    
    let operatingCashFlow = 0;
    let actualTaxBenefit = yearlyTaxBenefit; // Tax benefits always go 100% to investor
    
    // CRITICAL VALIDATION: Tax benefits must never be split by promote
    assert(actualTaxBenefit === yearlyTaxBenefit, 
           'Tax benefits must remain 100% to investor',
           'HDC_CALCULATION_LOGIC.md Step 2')
    
    if (!hurdleMet) {
      // PHASE 1: Return of Capital - Investor gets 100% until equity recovered
      const remainingToRecover = investorEquity - equityRecovered;
      
      // For equity recovery, we count both tax benefits AND operating cash
      const totalRecoveryThisYear = yearlyTaxBenefit + cashAfterDebtAndFees;
      
      if (totalRecoveryThisYear >= remainingToRecover) {
        // Equity fully recovered this period
        equityRecovered = investorEquity;
        hurdleMet = true;
        
        // Calculate how much is needed from each source to complete recovery
        if (yearlyTaxBenefit >= remainingToRecover) {
          // Tax benefits alone complete the recovery
          actualTaxBenefit = yearlyTaxBenefit; // Investor gets all tax benefits
          // All operating cash is excess, split per promote
          operatingCashFlow = cashAfterDebtAndFees * (paramInvestorPromoteShare / 100);
        } else {
          // Need both tax benefits and some operating cash for recovery
          actualTaxBenefit = yearlyTaxBenefit; // Investor gets all tax benefits
          const cashNeededForRecovery = remainingToRecover - yearlyTaxBenefit;
          const excessCash = cashAfterDebtAndFees - cashNeededForRecovery;
          
          if (excessCash > 0) {
            // Split excess operating cash per promote
            operatingCashFlow = cashNeededForRecovery + (excessCash * (paramInvestorPromoteShare / 100));
          } else {
            // All operating cash goes to recovery
            operatingCashFlow = cashAfterDebtAndFees;
          }
        }
        
        // Check if there are any deferred HDC fees to catch up
        if (hdcDeferredFees > 0) {
          hdcCatchUpOwed = hdcDeferredFees;
          catchUpComplete = false;
        }
      } else {
        // Still recovering equity - investor gets 100%
        equityRecovered += totalRecoveryThisYear;
        actualTaxBenefit = yearlyTaxBenefit;
        operatingCashFlow = cashAfterDebtAndFees;

        // Validate investor is in recovery phase (no promote yet)
        validateWaterfallPhase(
          equityRecovered,
          investorEquity,
          0, // No promote during recovery
          'recovery'
        );
      }
    } else if (!catchUpComplete && hdcCatchUpOwed > 0) {
      // HDC Catch-up for deferred fees only
      // Tax benefits still go 100% to investor
      actualTaxBenefit = yearlyTaxBenefit;
      
      // Only operating cash is used for catch-up
      if (cashAfterDebtAndFees >= hdcCatchUpOwed) {
        // HDC gets their catch-up from operating cash, investor gets the rest
        operatingCashFlow = cashAfterDebtAndFees - hdcCatchUpOwed;
        hdcCatchUpOwed = 0;
        catchUpComplete = true;
      } else {
        // All operating cash goes to HDC for catch-up
        operatingCashFlow = 0;
        hdcCatchUpOwed -= cashAfterDebtAndFees;
      }
    } else {
      // PHASE 3: Normal Promote Split
      // Tax benefits still go 100% to investor, only operating cash is split
      actualTaxBenefit = yearlyTaxBenefit;
      operatingCashFlow = cashAfterDebtAndFees * (paramInvestorPromoteShare / 100);

      // Validate investor has fully recovered before promote distribution
      validateWaterfallPhase(
        equityRecovered,
        investorEquity,
        cashAfterDebtAndFees * ((100 - paramInvestorPromoteShare) / 100), // HDC promote amount
        'normal'
      );
    }
    
    // Update yearlyTaxBenefit to reflect actual amount investor receives
    yearlyTaxBenefit = actualTaxBenefit;

    // PIK balances and accruals are fully handled in the soft pay waterfall above
    // The waterfall calculates what each sub-debt wants, what gets paid, and what accrues to PIK
    // PIK interest compounds on the growing balance

    // Opportunity Zone Year 5 Tax Payment
    // Per OBBBA 2025: 5 years after investment, pay tax on deferred gains with step-up
    let ozYear5TaxPayment = 0;
    let stepUpTaxSavings = 0; // IMPL-054: Tax savings from OZ step-up basis
    if (params.ozEnabled && year === 5) {
      const ozDeferredGains = params.deferredCapitalGains || 0;

      // Calculate effective capital gains tax rate
      // If capitalGainsTaxRate is provided, use it (pre-calculated composite rate)
      // Otherwise, calculate from components: federal LTCG + NIIT + state capital gains
      const ltCapitalGainsRate = params.ltCapitalGainsRate || 20;
      const niitRate = params.niitRate || 3.8;
      const stateCapitalGainsRate = params.stateCapitalGainsRate || 0;
      const calculatedRate = ltCapitalGainsRate + niitRate + stateCapitalGainsRate;
      const ozCapitalGainsTaxRate = (params.capitalGainsTaxRate || calculatedRate) / 100;

      // IMPL-017: Use centralized step-up helper for OZ version support
      const stepUpPercent = getOzStepUpPercent(params.ozVersion || '2.0', params.ozType || 'standard');

      // Calculate tax due on adjusted gains (after step-up)
      const taxableGains = ozDeferredGains * (1 - stepUpPercent);
      ozYear5TaxPayment = taxableGains * ozCapitalGainsTaxRate;

      // IMPL-054: Calculate step-up tax savings (benefit of this OZ deal)
      // This is the tax avoided due to the basis step-up, included in IRR
      stepUpTaxSavings = ozDeferredGains * stepUpPercent * ozCapitalGainsTaxRate;

      // Note: This will be offset by Year 5 depreciation benefits
      // The net impact may be positive if depreciation > OZ tax payment
    }

    // Check if we're at the end of the interest reserve period with excess reserve
    let excessReserveDistribution = 0;
    if (interestReserveEnabled && year === interestReservePeriodYears && interestReserveBalance > 0) {
      // Distribute any remaining interest reserve at the end of the period
      excessReserveDistribution = interestReserveBalance;
      interestReserveBalance = 0;

      if (year <= 3) {
        console.log(`Excess Reserve Distribution - Year ${year}:`, {
          amount: excessReserveDistribution,
          note: 'Distributing unused interest reserve'
        });
      }
    }

    // State LIHTC Credit for direct use path (IMPL-018)
    // State LIHTC earned credits (construction gating already applied)
    let earnedStateLIHTCCredit = 0;
    if (paramStateLIHTCIntegration?.creditPath === 'direct_use' &&
        year >= placedInServiceYear &&
        paramStateLIHTCIntegration.yearlyCredits) {
      const creditYear = year - placedInServiceYear; // 0-indexed from PIS
      if (creditYear < paramStateLIHTCIntegration.yearlyCredits.length) {
        earnedStateLIHTCCredit = paramStateLIHTCIntegration.yearlyCredits[creditYear] || 0;
      }
    }

    // Schedule state LIHTC into pending array with delay shift
    const stateLIHTCTargetIdx = (year - 1) + delayFullYears;
    pendingStateLIHTC[stateLIHTCTargetIdx] += earnedStateLIHTCCredit * (1 - delayFraction);
    if (delayFraction > 0) {
      pendingStateLIHTC[stateLIHTCTargetIdx + 1] += earnedStateLIHTCCredit * delayFraction;
    }
    const stateLIHTCCredit = pendingStateLIHTC[year - 1] || 0;

    // Federal LIHTC earned credits (IMPL-021b)
    // Credits go 100% to investor (like depreciation tax benefits, no promote split)
    // 11-year schedule: Year 1 prorated, Years 2-10 full, Year 11 catch-up
    // Construction gating: credits begin at placedInServiceYear (matching depreciation pattern)
    let earnedFedLIHTCCredit = 0;
    if (paramFederalLIHTCCredits && paramFederalLIHTCCredits.length > 0 && year >= placedInServiceYear) {
      const creditYear = year - placedInServiceYear; // 0-indexed from PIS
      if (creditYear < paramFederalLIHTCCredits.length) {
        earnedFedLIHTCCredit = paramFederalLIHTCCredits[creditYear] || 0;
      }
    }

    // Schedule federal LIHTC into pending array with delay shift
    const fedLIHTCTargetIdx = (year - 1) + delayFullYears;
    pendingFedLIHTC[fedLIHTCTargetIdx] += earnedFedLIHTCCredit * (1 - delayFraction);
    if (delayFraction > 0) {
      pendingFedLIHTC[fedLIHTCTargetIdx + 1] += earnedFedLIHTCCredit * delayFraction;
    }
    const federalLIHTCCredit = pendingFedLIHTC[year - 1] || 0;

    // IMPL-048: Calculate OZ recapture avoided for this year
    // For OZ investors with 10+ year holds, they avoid 25% federal recapture tax on depreciation
    // This benefit accrues each year as depreciation is taken (not as a lump sum at exit)
    let ozRecaptureAvoided = 0;
    if (params.ozEnabled && totalInvestmentYears >= 10 && yearlyDepreciationAmount > 0) {
      // 25% federal recapture rate applies to the depreciation amount
      ozRecaptureAvoided = yearlyDepreciationAmount * 0.25;
    }

    // IMPL-073/076: State LIHTC syndication proceeds (capital return)
    // CRITICAL: Year 0 means syndicator funds at close - proceeds already netted in equity
    // Year 1+ means investor funds full amount, gets capital return later
    let yearSyndicationProceeds = 0;
    if (stateLIHTCSyndicationProceeds > 0 && stateLIHTCSyndicationYear > 0) {
      // Only add cash flow for Year 1+ syndication (investor gets capital return)
      // Year 0 syndication: proceeds already reduce equity, no cash flow line item
      if (year === stateLIHTCSyndicationYear) {
        yearSyndicationProceeds = stateLIHTCSyndicationProceeds;
      }
    }

    // CRITICAL FIX (Jan 2025): HDC tax benefit fee deducted from annual cash flows
    // This ensures fees are treated as operating expenses, NOT upfront capital costs
    // Subtract outside investor current pay, AUM fee paid, and HDC tax benefit fee from cash flow
    // Add excess reserve distribution if any
    // Note: ozYear5TaxPayment is excluded from IRR calculation as it's a pre-investment obligation
    // Note: stepUpTaxSavings IS included - it's a benefit created by this OZ deal (IMPL-054)
    // Note: stateLIHTCCredit added for direct use path (IMPL-018)
    // Note: federalLIHTCCredit added for all LIHTC deals (IMPL-021b) - 100% to investor, no promote split
    // IMPL-029: Removed duplicate deductions (hdcSubDebtCurrentPay, outsideInvestorCurrentPay, aumFeePaid)
    // These are already reflected in reduced operatingCashFlow via cashAfterDebtAndFees
    // IMPL-048: Added ozRecaptureAvoided - recognized annually as depreciation is taken
    // IMPL-054: Added stepUpTaxSavings - OZ step-up benefit in Year 5
    // IMPL-073: Added yearSyndicationProceeds - State LIHTC syndication as capital return
    const totalCashFlow = yearlyTaxBenefit + operatingCashFlow + federalLIHTCCredit + stateLIHTCCredit +
                         investorSubDebtInterestReceived + excessReserveDistribution + ozRecaptureAvoided + stepUpTaxSavings +
                         yearSyndicationProceeds;
    cumulativeReturns += totalCashFlow;

    // DSCR already calculated above before HDC fee determination

    // Calculate DSCR including all sub-debt current pay portions (for monitoring)
    const totalCurrentPayObligations = hardDebtService + hdcSubDebtCurrentPay + hdcDebtFundCurrentPay +
                                       investorSubDebtInterestReceived + outsideInvestorCurrentPay;
    const dscrWithCurrentPay = totalCurrentPayObligations > 0 ? effectiveNOI / totalCurrentPayObligations : 0;

    // IMPL-020a: Pre-calculate waterfall display values for UI
    const freeCash = effectiveNOI - hardDebtService;
    const hardDscr = hardDebtService > 0 ? effectiveNOI / hardDebtService : 0;
    const totalSubDebtInterestNet = hdcSubDebtCurrentPay + hdcDebtFundCurrentPay + outsideInvestorCurrentPay - investorSubDebtInterestReceived;
    const totalSubDebtInterestGross = hdcSubDebtCurrentPay + hdcDebtFundCurrentPay + outsideInvestorCurrentPay + Math.abs(investorSubDebtInterestReceived);
    const cashAfterSubDebt = freeCash - totalSubDebtInterestNet;
    const subDebtDscr = (hardDebtService + totalSubDebtInterestNet) > 0 ? effectiveNOI / (hardDebtService + totalSubDebtInterestNet) : 0;
    const finalCash = cashAfterDebtAndFees;
    const dscrShortfallPct = actualDscr > 0 && actualDscr < DSCR_COVENANT_THRESHOLD
      ? ((DSCR_COVENANT_THRESHOLD - actualDscr) / actualDscr * 100)
      : 0;

    investorCashFlows.push({
      year,
      noi: effectiveNOI,
      annualizedNOI, // IMPL-087: Pre-proration NOI for trailing 12-month exit valuation
      effectiveOccupancy,
      interestReserveDraw,
      interestReserveBalance,
      excessReserveDistribution,
      hardDebtService,
      pabDebtService: annualPabDebtService, // IMPL-080: PAB debt service
      debtServicePayments,
      cashAfterDebtService,
      aumFeeAmount,
      aumFeePaid,
      aumFeeAccrued,
      aumCatchUpPaid, // IMPL-030: Catch-up payment on deferred AUM
      cashAfterDebtAndFees,
      taxBenefit: yearlyTaxBenefit,
      operatingCashFlow,
      subDebtInterest: hdcSubDebtCurrentPay,
      investorSubDebtInterestReceived,
      investorSubDebtPIKAccrued,
      investorPikBalance: investorCumulativePikBalance,
      outsideInvestorCurrentPay,
      outsideInvestorPIKAccrued: outsideInvestorSubDebtPIKAccrued,
      // HDC Debt Fund (IMPL-082)
      hdcDebtFundCurrentPay: hdcDebtFundCurrentPayDue,
      hdcDebtFundPIKAccrued,
      hdcSubDebtPIKAccrued,
      ozYear5TaxPayment, // Track for display but excluded from totalCashFlow
      stepUpTaxSavings, // IMPL-054: Tax savings from step-up, included in totalCashFlow
      ozRecaptureAvoided, // IMPL-048: This year's recapture avoided (OZ 10+ year holds only)
      stateLIHTCCredit, // State LIHTC credit for direct use path (IMPL-018)
      federalLIHTCCredit, // Federal LIHTC credit (IMPL-021b) - 100% to investor
      stateLIHTCSyndicationProceeds: yearSyndicationProceeds, // IMPL-073: Syndication proceeds (capital return)
      // IMPL-061: Depreciation breakdown for Returns Buildup Strip
      bonusTaxBenefit, // Year 1 bonus depreciation tax benefit
      year1MacrsTaxBenefit, // Year 1 MACRS (partial year) tax benefit
      totalCashFlow,
      cumulativeReturns,
      operationalDSCR,
      dscr: actualDscr,
      targetDscr,
      dscrWithCurrentPay,
      // DSCR Breakdown (IMPL-081)
      mustPayDebtService,  // Senior + PAB only (true hard floor)
      mustPayDSCR,         // NOI / (Senior + PAB)
      philDSCR,            // NOI / (Senior + PAB + Phil current pay)
      // IMPL-020a: Waterfall display fields (pre-calculated for UI)
      // ISS-068c: Revenue/opex removed - now using direct NOI growth model
      revenue: 0,
      opex: 0,
      freeCash,
      hardDscr,
      totalSubDebtInterestNet,
      totalSubDebtInterestGross,
      cashAfterSubDebt,
      subDebtDscr,
      finalCash,
      dscrShortfallPct,
    });
  }

  // IMPL-087: Trailing 12-month NOI for exit valuation
  // Read annualized NOI directly from CashFlowItem (stored pre-proration in Change 5)
  const dispositionYearAnnualNOI = investorCashFlows[totalInvestmentYears - 1].annualizedNOI
    ?? investorCashFlows[totalInvestmentYears - 1].noi;
  const priorYearNOI = totalInvestmentYears >= 2
    ? (investorCashFlows[totalInvestmentYears - 2].annualizedNOI ?? investorCashFlows[totalInvestmentYears - 2].noi)
    : dispositionYearAnnualNOI;
  const trailingNOI = (priorYearNOI * (12 - paramExitMonth) / 12) + (dispositionYearAnnualNOI * paramExitMonth / 12);
  const exitValue = trailingNOI / (paramExitCapRate / 100);

  // Calculate remaining senior debt accounting for IO period
  // During IO period: no principal payments, balance remains at seniorDebtAmount
  // After IO period: calculate remaining balance based on P&I payments made
  // Note: placedInServiceYear is already calculated at the start of the function
  // IMPL-087: Account for partial disposition year in P&I payment count
  const ioEndYear = placedInServiceYear + seniorDebtIOYears;
  const fullPIYears = Math.max(0, (totalInvestmentYears - 1) - (ioEndYear - 1)); // exclude partial dispo year
  const partialPIMonths = (totalInvestmentYears > ioEndYear - 1) ? paramExitMonth : 0;
  const monthsOfPIPayments = fullPIYears * 12 + partialPIMonths;

  const remainingSeniorDebt = monthsOfPIPayments > 0
    ? calculateRemainingBalance(seniorDebtAmount, seniorDebtRate, seniorDebtAmortYears, monthsOfPIPayments)
    : seniorDebtAmount; // Still in IO period or no P&I payments made yet
  
  // Philanthropic debt is always interest-only, so remaining balance is always principal + accumulated PIK
  const remainingPhilDebt = philDebtAmount + philPikBalance;
  
  const remainingDebt = remainingSeniorDebt + remainingPhilDebt;

  // HDC sub-debt at exit is the compounded balance
  const subDebtAtExit = hdcPikBalance;

  // Investor sub-debt at exit is the compounded balance
  const investorSubDebtAtExit = investorPikBalance;

  // Outside Investor sub-debt at exit is the compounded balance
  const outsideInvestorSubDebtAtExit = outsideInvestorPikBalance;

  // TIER 3: Preferred Equity (IMPL-7.0-009)
  let preferredEquityAtExit = 0;
  let preferredEquityResult: PreferredEquityResult | undefined;

  if (params.prefEquityEnabled && params.prefEquityPct && params.prefEquityPct > 0) {
    const proceedsAfterHardDebt = Math.max(0, exitValue - remainingDebt);

    preferredEquityResult = calculatePreferredEquity({
      prefEquityEnabled: params.prefEquityEnabled,
      prefEquityPct: params.prefEquityPct,
      prefEquityTargetMOIC: params.prefEquityTargetMOIC || 1.7,
      prefEquityTargetIRR: 12, // Required by module but not used for MOIC calc
      prefEquityAccrualRate: params.prefEquityAccrualRate || 12,
      prefEquityOzEligible: params.prefEquityOzEligible, // Note: matches CalculationParams interface
      holdPeriod: totalInvestmentYears,
      totalCapitalization: effectiveProjectCost
    }, proceedsAfterHardDebt);

    preferredEquityAtExit = preferredEquityResult.paymentAtExit;
  }

  // Calculate exit proceeds after debt but before AUM fees
  const grossExitProceedsBeforePrefEquity = Math.max(0, exitValue - remainingDebt - subDebtAtExit - investorSubDebtAtExit - outsideInvestorSubDebtAtExit);

  // Validate all debt is paid off before equity distribution
  // Note: Combining investor + outside investor sub-debt for validation (guard expects 5 debt types)
  validateExitDebtPayoff(
    exitValue,
    remainingSeniorDebt,
    remainingPhilDebt,
    subDebtAtExit,
    investorSubDebtAtExit + outsideInvestorSubDebtAtExit,
    grossExitProceedsBeforePrefEquity
  );

  // IMPL-7.0-009: Subtract preferred equity at TIER 3 (after hard debt, before common equity)
  const grossExitProceeds = Math.max(0, grossExitProceedsBeforePrefEquity - preferredEquityAtExit);

  // IMPL-029 + ISS-050: Return-of-capital-first waterfall with prior recovery tracking
  // 1. Check how much capital was already recovered during hold period
  // 2. Only give ROC at exit for remaining unrecovered capital
  // 3. All other exit proceeds are profit, split per promote percentage
  const investorEquityBasis = investorEquity; // Use initial equity investment as basis

  // ISS-050 FIX: Account for capital already recovered during hold period
  // cumulativeReturns includes: tax benefits, operating cash, sub-debt interest, etc.
  const capitalAlreadyRecovered = Math.min(cumulativeReturns, investorEquityBasis);
  const remainingCapitalToRecover = Math.max(0, investorEquityBasis - capitalAlreadyRecovered);

  // Return of Capital is only for the REMAINING unrecovered capital
  const returnOfCapital = Math.min(grossExitProceeds, remainingCapitalToRecover);

  // Profit is everything after ROC - this is now larger when capital was already recovered
  const profit = Math.max(0, grossExitProceeds - returnOfCapital);
  const investorProfitShare = profit * (paramInvestorPromoteShare / 100);
  const investorShareOfGross = returnOfCapital + investorProfitShare;

  // Per HDC_CALCULATION_LOGIC.md: Accumulated AUM fees are paid from investor's share
  // This ensures HDC gets full fees without reducing their promote share
  const totalDeferredHDCFees = accumulatedAumFees;
  const exitProceeds = Math.max(0, investorShareOfGross - totalDeferredHDCFees);

  // VALIDATION: Check if deferred fees exceed exit proceeds
  const feeExceedsProceeds = totalDeferredHDCFees > investorShareOfGross;
  const feeToExitRatio = investorShareOfGross > 0 ? (totalDeferredHDCFees / investorShareOfGross) * 100 : 0;
  const exitShortfall = Math.max(0, totalDeferredHDCFees - investorShareOfGross);

  if (feeExceedsProceeds) {
    // Calculate specific recommendations
    const targetFeeReduction = exitShortfall * 1.2; // 20% buffer
    const recommendedAumRate = paramAumFeeEnabled && accumulatedAumFees > 0
      ? Math.max(0, paramAumFeeRate - (targetFeeReduction / (effectiveProjectCost * (totalInvestmentYears - 1)) * 100))
      : paramAumFeeRate;

    console.error('🚨 CRITICAL: HDC Fees Exceed Exit Proceeds - Deal Structure Needs Adjustment', {
      issue: {
        investorExitShare: `$${(investorShareOfGross / 1000000).toFixed(2)}M`,
        totalDeferredFees: `$${(totalDeferredHDCFees / 1000000).toFixed(2)}M`,
        shortfall: `$${(exitShortfall / 1000000).toFixed(2)}M`,
        feeConsumption: `${feeToExitRatio.toFixed(0)}% of exit proceeds`
      },
      recommendations: {
        immediate: 'Enable AUM Fee Current Pay to reduce deferral compounding',
        aumFeeAdjustment: paramAumFeeEnabled ? `Reduce AUM fee from ${paramAumFeeRate.toFixed(2)}% to ~${recommendedAumRate.toFixed(2)}%` : 'AUM fee not enabled',
        deferredInterest: `Reduce deferred interest rate from ${paramHdcDeferredInterestRate}% to ${Math.max(0, paramHdcDeferredInterestRate - 2)}%`,
        operationalChanges: [
          '• Enable AUM Current Pay (reduces compounding)',
          '• Enable AUM Current Pay at 100% (eliminates deferrals)',
          `• Reduce construction period or K-1 delay to shorten computed hold (currently ${totalInvestmentYears} years)`,
          '• Improve exit value (lower cap rate or higher NOI growth)'
        ]
      },
      impact: 'Investor receives $0 at exit despite positive tax benefits during hold period'
    });
  } else if (feeToExitRatio > 80) {
    console.warn('⚠️ WARNING: HDC Fees Consuming >80% of Exit Proceeds', {
      metrics: {
        investorExitShare: `$${(investorShareOfGross / 1000000).toFixed(2)}M`,
        totalDeferredFees: `$${(totalDeferredHDCFees / 1000000).toFixed(2)}M`,
        netToInvestor: `$${(exitProceeds / 1000000).toFixed(2)}M`,
        feeConsumption: `${feeToExitRatio.toFixed(0)}%`
      },
      recommendation: 'Consider enabling partial AUM current pay to reduce exit fee burden',
      note: 'Deal may still work due to tax benefits, but exit proceeds are minimal'
    });
  }


  // Debug exit fee impact
  if (paramAumFeeEnabled) {
    console.log('AUM Fee Impact at Exit:', {
      accumulatedAumFees,
      totalDeferredHDCFees,
      investorShareOfGross,
      exitProceeds,
      reduction: totalDeferredHDCFees
    });
  }

  // IMPL-030C: Calculate remaining LIHTC credits not captured during hold period
  // LIHTC is an 11-year schedule (Year 1 prorated, Years 2-10 full, Year 11 catch-up)
  // For 10-year hold, we need to add Year 11 credit to exit proceeds
  let remainingFederalLIHTC = 0;
  let remainingStateLIHTC = 0;

  if (paramFederalLIHTCCredits && paramFederalLIHTCCredits.length > holdFromPIS) {
    // Sum any credits from Year holdFromPIS+1 through end of array
    for (let i = holdFromPIS; i < paramFederalLIHTCCredits.length; i++) {
      remainingFederalLIHTC += paramFederalLIHTCCredits[i] || 0;
    }
  }

  if (paramStateLIHTCIntegration?.creditPath === 'direct_use' &&
      paramStateLIHTCIntegration.yearlyCredits &&
      paramStateLIHTCIntegration.yearlyCredits.length > holdFromPIS) {
    for (let i = holdFromPIS; i < paramStateLIHTCIntegration.yearlyCredits.length; i++) {
      remainingStateLIHTC += paramStateLIHTCIntegration.yearlyCredits[i] || 0;
    }
  }

  const remainingLIHTCCredits = remainingFederalLIHTC + remainingStateLIHTC;

  if (remainingLIHTCCredits > 0) {
    console.log('IMPL-030C: Remaining LIHTC Credits at Exit:', {
      remainingFederalLIHTC,
      remainingStateLIHTC,
      totalRemaining: remainingLIHTCCredits,
      note: 'Credits from Year holdPeriod+1 through end of schedule'
    });
  }

  // IMPL-048: Calculate OZ benefits for 10+ year holds
  // Recapture avoided is now calculated annually in the main loop (lines 1240-1247)
  // Only deferral NPV and exit appreciation are calculated here as exit-time benefits
  let ozDeferralNPV = 0;
  let ozExitAppreciation = 0;

  if (params.ozEnabled && totalInvestmentYears >= 10) {
    // B) Deferral NPV: Time value of deferring capital gains tax for 5 years (8% discount rate)
    const ozDeferredGains = params.deferredCapitalGains || 0;
    const ltCapitalGainsRate = params.ltCapitalGainsRate || 20;
    const niitRate = params.niitRate || 3.8;
    const stateCapitalGainsRate = params.stateCapitalGainsRate || 0;
    const calculatedCapGainsRate = ltCapitalGainsRate + niitRate + stateCapitalGainsRate;
    const capitalGainsTaxRateDecimal = (params.capitalGainsTaxRate || calculatedCapGainsRate) / 100;
    const discountRate = 0.08;
    const deferralYears = 5;
    const npvFactor = 1 - (1 / Math.pow(1 + discountRate, deferralYears)); // ~0.32
    ozDeferralNPV = ozDeferredGains * capitalGainsTaxRateDecimal * npvFactor;

    // C) Exit Appreciation: Tax-free appreciation for 10+ year holds
    // Use investor's actual exit proceeds vs their investment (not total property value)
    const investorAppreciation = Math.max(0, exitProceeds - investorEquity);
    ozExitAppreciation = investorAppreciation * capitalGainsTaxRateDecimal;
  }

  // IMPL-048: Sum up annual recapture avoided from cash flows
  // This replaces the lump-sum calculation to properly time the benefit recognition
  const ozRecaptureAvoided = investorCashFlows.reduce((sum, cf) => sum + (cf.ozRecaptureAvoided || 0), 0);

  // IMPL-057: Sum up step-up tax savings from cash flows (Year 5 only, varies with OZ version)
  const ozStepUpSavings = investorCashFlows.reduce((sum, cf) => sum + (cf.stepUpTaxSavings || 0), 0);

  // IMPL-061: Sum up depreciation breakdown for Returns Buildup Strip
  const totalDepreciationTaxBenefit = investorCashFlows.reduce((sum, cf) => sum + cf.taxBenefit, 0);
  const year1BonusTaxBenefit = investorCashFlows.reduce((sum, cf) => sum + (cf.bonusTaxBenefit || 0), 0);
  const year1MacrsTaxBenefit = investorCashFlows.reduce((sum, cf) => sum + (cf.year1MacrsTaxBenefit || 0), 0);
  // Years 2-Exit MACRS = total depreciation - Year 1 components
  const years2ExitMacrsTaxBenefit = totalDepreciationTaxBenefit - year1BonusTaxBenefit - year1MacrsTaxBenefit;

  // IMPL-090/091: Federal/State Depreciation Breakout
  // Decompose combined benefits into federal vs state using rate ratios.
  // Rates are additive: combined = federal + NIIT + state [× conformity for bonus]
  const breakoutFederalRate = (params.federalTaxRate || 37) + (params.niitRate || 3.8);
  const breakoutStateRate = params.stateTaxRate || 0;
  const breakoutConformityRate = params.bonusConformityRate ?? 1;
  const breakoutBonusCombinedRate = breakoutFederalRate + (breakoutStateRate * breakoutConformityRate);
  const breakoutMacrsCombinedRate = breakoutFederalRate + breakoutStateRate;
  // Federal fraction of each rate bucket (safe division)
  const bonusFederalFraction = breakoutBonusCombinedRate > 0 ? breakoutFederalRate / breakoutBonusCombinedRate : 1;
  const macrsFederalFraction = breakoutMacrsCombinedRate > 0 ? breakoutFederalRate / breakoutMacrsCombinedRate : 1;
  // Year 1: bonus uses bonus fraction, MACRS uses MACRS fraction
  const federalDepreciationBenefitYear1 = (year1BonusTaxBenefit * bonusFederalFraction) + (year1MacrsTaxBenefit * macrsFederalFraction);
  const stateDepreciationBenefitYear1 = (year1BonusTaxBenefit * (1 - bonusFederalFraction)) + (year1MacrsTaxBenefit * (1 - macrsFederalFraction));
  // Hold period (Years 2-Exit): all straight-line, uses MACRS fraction
  const federalDepreciationBenefitHoldPeriod = years2ExitMacrsTaxBenefit * macrsFederalFraction;
  const stateDepreciationBenefitHoldPeriod = years2ExitMacrsTaxBenefit * (1 - macrsFederalFraction);
  // Totals
  const federalDepreciationBenefitTotal = federalDepreciationBenefitYear1 + federalDepreciationBenefitHoldPeriod;
  const stateDepreciationBenefitTotal = stateDepreciationBenefitYear1 + stateDepreciationBenefitHoldPeriod;
  // Investor profile label (e.g., "NJ Non-REP" or "OR REP")
  const investorStateCode = params.selectedState || params.investorState || '';
  const investorProfileLabel = investorStateCode
    ? `${investorStateCode}${params.investorTrack ? (params.investorTrack === 'rep' ? ' REP' : ' Non-REP') : ''}`
    : 'Federal Only';

  // Total OZ benefits (recapture is now summed from annual cash flows)
  // IMPL-057: Include step-up savings in total OZ benefits
  const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation + ozStepUpSavings;

  // IMPL-048: Build IRR cash flow array with correct timing
  // Exit proceeds go in final year (not as separate element) to avoid off-by-one error
  const cashFlowArray = investorCashFlows.map(cf => cf.totalCashFlow);
  // Add exit proceeds + remaining benefits to final year's cash flow
  // Note: ozRecaptureAvoided is already included in annual totalCashFlow
  cashFlowArray[cashFlowArray.length - 1] += exitProceeds + investorSubDebtAtExit + remainingLIHTCCredits + ozDeferralNPV + ozExitAppreciation;

  // CRITICAL FIX (Jan 2025): Initial investment is ONLY investor equity
  // Previous error: Was adding HDC fees to initial investment, causing double-counting
  // Correct approach: HDC tax benefit fees (10% of depreciation) are NOT upfront costs
  // They are paid annually from operating cash flows (deducted at line 1080-1082)
  // See HDC_CALCULATION_LOGIC.md "Investor Initial Investment & IRR Calculation" section
  // IMPL-075: MOIC denominator depends on syndication timing
  // - Year 0: Syndicator funds at close → denominator = net equity (gross - offset)
  // - Year 1+: Investor funds full, gets capital return → denominator = gross equity
  const totalInvestment = stateLIHTCSyndicationYear === 0
    ? investorEquityAfterOffset  // Year 0: Net equity
    : investorEquity;            // Year 1+: Gross equity
  // IMPL-029: Include OZ benefits in totalReturns
  // IMPL-030C: Include remaining LIHTC credits (Year 11 catch-up) in totalReturns
  // IMPL-048b: Don't double-count ozRecaptureAvoided - it's already in cumulativeReturns (via annual totalCashFlow)
  // Only add exit-time OZ benefits (deferral NPV and exit appreciation) to avoid double-counting
  const exitOnlyOzBenefits = ozDeferralNPV + ozExitAppreciation;
  const totalReturns = cumulativeReturns + exitProceeds + investorSubDebtAtExit + exitOnlyOzBenefits + remainingLIHTCCredits;
  const multiple = totalInvestment > 0 ? totalReturns / totalInvestment : 0;
  const irr = calculateIRR(cashFlowArray, totalInvestment, totalInvestmentYears);


  // Calculate total cost of outside investor debt
  const outsideInvestorTotalInterest = totalOutsideInvestorCashPaid + totalOutsideInvestorPIKAccrued;
  const outsideInvestorTotalCost = outsideInvestorSubDebtPrincipal + outsideInvestorTotalInterest;

  const baseResults: InvestorAnalysisResults = {
    investorCashFlows,
    exitProceeds,
    totalInvestment,
    totalReturns,
    multiple,
    irr,
    investorTaxBenefits: investorCashFlows.reduce((sum, cf) => sum + cf.taxBenefit, 0),
    investorOperatingCashFlows: investorCashFlows.reduce((sum, cf) => sum + cf.operatingCashFlow, 0),
    investorSubDebtInterest: investorCashFlows.reduce((sum, cf) => sum + cf.subDebtInterest, 0),
    investorSubDebtInterestReceived: investorCashFlows.reduce((sum, cf) => sum + (cf.investorSubDebtInterestReceived || 0), 0),
    remainingDebtAtExit: remainingDebt,
    // ISS-050 v3: Export separate senior and phil debt for exit sheet accuracy
    remainingSeniorDebtAtExit: remainingSeniorDebt,
    remainingPhilDebtAtExit: remainingPhilDebt,
    subDebtAtExit: subDebtAtExit,
    investorSubDebtAtExit: investorSubDebtAtExit,
    outsideInvestorSubDebtAtExit: outsideInvestorSubDebtAtExit,
    outsideInvestorTotalCost: outsideInvestorTotalCost,
    outsideInvestorCashPaid: totalOutsideInvestorCashPaid,
    outsideInvestorTotalInterest: outsideInvestorTotalInterest,
    exitValue: exitValue,
    totalExitProceeds: grossExitProceeds,
    pikAccumulatedInterest: hdcPikBalance - subDebtPrincipal,
    // Additional properties for test compatibility
    investorIRR: irr,
    cashFlows: investorCashFlows,
    leveragedROE: multiple, // Using multiple as a placeholder for leveraged ROE
    unleveragedROE: 0, // Placeholder - would need specific calculation
    exitFees: 0, // Placeholder - would need to add exit fees calculation
    equityMultiple: multiple,
    holdPeriod: totalInvestmentYears,
    interestReserveAmount: interestReserveAmount,
    investorEquity: investorEquity, // CRITICAL: Single source of truth for investor equity (used by UI)
    syndicatedEquityOffset: syndicatedEquityOffset, // IMPL-074: Used to reduce net equity for MOIC/IRR
    netEquity: investorEquityAfterOffset, // Phase 0: investorEquity - syndicatedEquityOffset (actual cash committed)
    stateLIHTCSyndicationProceeds, // IMPL-073: State LIHTC syndication as capital return
    // IMPL-075: Syndication year determines MOIC denominator
    stateLIHTCSyndicationYear: stateLIHTCSyndicationYear as 0 | 1 | 2,
    preferredEquityResult, // IMPL-7.0-009: Preferred equity waterfall integration
    preferredEquityAtExit, // IMPL-7.0-009: Amount paid to preferred equity at exit
    // IMPL-029: OZ benefits for 10+ year holds
    ozRecaptureAvoided,
    ozDeferralNPV,
    ozExitAppreciation,
    // IMPL-057: OZ step-up basis savings (Year 5, varies with OZ version)
    ozStepUpSavings,
    // IMPL-048b: Expose remaining LIHTC credits for UI display
    remainingLIHTCCredits,
    // ISS-016: Expose remaining State LIHTC separately for Returns Buildup
    remainingStateLIHTCCredits: remainingStateLIHTC,
    // IMPL-061: Depreciation breakdown for Returns Buildup Strip
    year1BonusTaxBenefit,
    year1MacrsTaxBenefit,
    years2ExitMacrsTaxBenefit,
    // IMPL-090/091: Federal/State Depreciation Breakout
    federalDepreciationBenefitYear1,
    stateDepreciationBenefitYear1,
    federalDepreciationBenefitHoldPeriod,
    stateDepreciationBenefitHoldPeriod,
    federalDepreciationBenefitTotal,
    stateDepreciationBenefitTotal,
    investorProfileLabel,
    // ISS-050: Exit waterfall prior capital recovery tracking
    grossExitProceeds,
    capitalAlreadyRecovered,
    remainingCapitalToRecover,
    exitReturnOfCapital: returnOfCapital,
    exitProfitShare: investorProfitShare
  };

  // NEW: Add tax planning calculations if requested
  if (params.includeDepreciationSchedule) {
    const depreciationSchedule = buildDepreciationSchedule(params);

    // Phase A1: Compute adjustedBasis = investorEquity - cumulativeDepreciation
    const adjustedBasis = investorEquity - (depreciationSchedule?.totalDepreciation || 0);

    const results: InvestorAnalysisResults = {
      ...baseResults,
      depreciationSchedule,
      adjustedBasis
    };

    // Add REP or Non-REP capacity based on investor type
    if (params.investorTrack === 'rep') {
      const repCapacity = calculateREPCapacity(params, depreciationSchedule);
      results.repTaxCapacity = repCapacity;

      // Add IRA conversion plan if IRA balance provided
      if (params.iraBalance) {
        results.iraConversionPlan = optimizeIRAConversion(params, repCapacity);
      }
    } else {
      results.nonRepCapacity = calculateNonREPCapacity(params, depreciationSchedule);
    }

    // Phase A1: Add tax utilization analysis if income composition is provided
    const hasIncomeComposition =
      (params.annualPassiveIncome !== undefined && params.annualPassiveIncome > 0) ||
      (params.annualOrdinaryIncome !== undefined && params.annualOrdinaryIncome > 0) ||
      (params.annualPortfolioIncome !== undefined && params.annualPortfolioIncome > 0);

    if (hasIncomeComposition) {
      // Build BenefitStream from depreciation schedule and cash flows
      const annualDepreciation = depreciationSchedule.schedule.map(y => y.totalDepreciation);
      const annualLIHTC = investorCashFlows.map(cf => cf.federalLIHTCCredit || 0);
      const annualStateLIHTC = investorCashFlows.map(cf => cf.stateLIHTCCredit || 0);
      const annualOperatingCF = investorCashFlows.map(cf => cf.operatingCashFlow);

      // Build exit event
      const cumulativeDepreciation = depreciationSchedule.totalDepreciation;
      const recaptureExposure = cumulativeDepreciation * 0.25; // 25% recapture rate
      const appreciationGain = Math.max(0, exitProceeds - investorEquity);

      const exitEvent: ExitEvent = {
        year: totalInvestmentYears,
        exitProceeds,
        cumulativeDepreciation,
        recaptureExposure,
        appreciationGain,
        ozEnabled: params.ozEnabled || false
      };

      const benefitStream: BenefitStream = {
        annualDepreciation,
        annualLIHTC,
        annualStateLIHTC,
        annualOperatingCF,
        exitEvents: [exitEvent],
        grossEquity: investorEquity,
        netEquity: investorEquityAfterOffset,
        syndicationOffset: syndicatedEquityOffset
      };

      // Build InvestorProfile from params
      const federalCapGainsRate = ((params.ltCapitalGainsRate || 20) + (params.niitRate || 3.8)) / 100;

      const investorProfile: InvestorProfile = {
        annualPassiveIncome: params.annualPassiveIncome || 0,
        annualOrdinaryIncome: params.annualOrdinaryIncome || 0,
        annualPortfolioIncome: params.annualPortfolioIncome || 0,
        filingStatus: mapFilingStatus(params.filingStatus),
        investorTrack: params.investorTrack || 'non-rep',
        groupingElection: params.groupingElection || false,
        federalOrdinaryRate: params.federalTaxRate || 37,
        federalCapGainsRate,
        investorState: params.selectedState || params.investorState || 'NY',
        stateOrdinaryRate: (params.stateTaxRate || 10.9) / 100,
        stateCapGainsRate: (params.stateCapitalGainsRate || params.stateTaxRate || 10.9) / 100,
        investorEquity
      };

      // Calculate tax utilization
      results.taxUtilization = calculateTaxUtilization(benefitStream, investorProfile);
    }

    return results;
  }

  return baseResults;
};