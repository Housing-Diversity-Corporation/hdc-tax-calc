import { HDCCalculationParams, HDCAnalysisResults, HDCCashFlowItem } from '../../types/taxbenefits';
import { calculateMonthlyPayment } from './calculations';
import {
  validateHDCZeroInvestment
} from './calculationGuards';

/**
 * CRITICAL: This file implements validated HDC business logic.
 * DO NOT MODIFY without reading HDC_CALCULATION_LOGIC.md
 * HDC has $0 initial investment by design - they are the sponsor.
 *
 * ISS-047: Fixed exit waterfall to use return-of-capital-first logic
 * - HDC promote now applies only to profit (excess above investor equity basis)
 * - Matches investor calculation in calculations.ts for consistency
 * - Ensures HDC and investor exit proceeds respond inversely to promote split changes
 */

/**
 * Calculate HDC-specific returns and cash flows
 * Includes philanthropic equity, AUM fees, and promote structures
 * PIK interest compounds with AUM fee accruals when cash insufficient
 * @param params - HDC calculation parameters
 * @returns HDC analysis results with cash flows and return metrics
 */
export const calculateHDCAnalysis = (params: HDCCalculationParams): HDCAnalysisResults => {
  const {
    projectCost: paramProjectCost,
    predevelopmentCosts: paramPredevelopmentCosts = 0,
    yearOneNOI: paramYearOneNOI,
    // ISS-068c: Single NOI growth rate
    noiGrowthRate: paramNoiGrowthRate = 3,
    exitCapRate: paramExitCapRate,
    investorPromoteShare: paramInvestorPromoteShare,
    hdcSubDebtPct: paramHdcSubDebtPct = 0,
    hdcSubDebtPikRate: paramHdcSubDebtPikRate = 8,
    pikCurrentPayEnabled: paramPikCurrentPayEnabled = false,
    pikCurrentPayPct: paramPikCurrentPayPct = 50,
    holdPeriod: paramHoldPeriod = 10,
    aumFeeEnabled: _paramAumFeeEnabled = false, // Now obtained from investor cash flows
    aumFeeRate: _paramAumFeeRate = 1.5, // Now obtained from investor cash flows
    philCurrentPayEnabled: paramPhilCurrentPayEnabled = false,
    philCurrentPayPct: paramPhilCurrentPayPct = 50,
    outsideInvestorSubDebtPct: paramOutsideInvestorSubDebtPct = 0,
    outsideInvestorSubDebtPikRate: paramOutsideInvestorSubDebtPikRate = 8,
    outsideInvestorPikCurrentPayEnabled: paramOutsideInvestorPikCurrentPayEnabled = false,
    outsideInvestorPikCurrentPayPct: paramOutsideInvestorPikCurrentPayPct = 50,
    investorSubDebtPct: paramInvestorSubDebtPct = 0,
    investorSubDebtPikRate: paramInvestorSubDebtPikRate = 8,
    investorPikCurrentPayEnabled: paramInvestorPikCurrentPayEnabled = false,
    investorPikCurrentPayPct: paramInvestorPikCurrentPayPct = 50,
    investorCashFlows: paramInvestorCashFlows = []
  } = params;

  const hdcPromoteShare = 100 - paramInvestorPromoteShare;
  
  // ISS-051: Simplified waterfall for HDC's promote share
  // HDC gets 0% until investor recovers equity (free investment achieved)
  // Then normal promote split (e.g., 65% HDC, 35% investor)
  // NO catch-up mechanism - promotes are NOT deferred, they simply don't exist during recovery
  // Note: Equity recovery tracked via investor's cumulativeReturns (single source of truth)
  let hurdleMet = false;
  
  // Include predevelopment costs in base project cost
  const baseProjectCost = paramProjectCost + paramPredevelopmentCosts;

  // CRITICAL FIX (Jan 2025): Use investor equity from main calculation engine (single source of truth)
  // Previous bug: Was recalculating using baseProjectCost (without interest reserve)
  // Correct approach: Use value from main engine which includes interest reserve
  // This ensures promote triggers at correct time when investor recovers their actual equity
  // See HDC_CALCULATION_LOGIC.md "Promote Hurdle & Equity Recovery Tracking" section
  const investorEquity = params.investorEquity || 0;
  
  // Calculate interest reserve first if enabled
  const interestReserveEnabled = params.interestReserveEnabled || false;
  const interestReserveMonths = params.interestReserveMonths || 12;
  
  // Calculate base debt amounts using base project cost (includes predevelopment)
  const baseSeniorDebtAmount = baseProjectCost * ((params.seniorDebtPct || 0) / 100);
  const basePhilDebtAmount = baseProjectCost * ((params.philanthropicDebtPct || 0) / 100);
  const hdcSeniorDebtRate = (params.seniorDebtRate || 6) / 100;
  const hdcPhilDebtRate = (params.philanthropicDebtRate || 0) / 100;
  const hdcSeniorDebtAmortYears = params.seniorDebtAmortization || 30;
  const hdcPhilDebtAmortYears = params.philDebtAmortization || 30;
  
  let interestReserveAmount = 0;

  if (interestReserveEnabled && interestReserveMonths > 0) {
    // Calculate monthly debt service that needs to be covered
    const monthlySeniorDebtService = baseSeniorDebtAmount > 0 ?
      calculateMonthlyPayment(baseSeniorDebtAmount, hdcSeniorDebtRate, hdcSeniorDebtAmortYears) : 0;

    const monthlyPhilDebtService = !paramPhilCurrentPayEnabled && basePhilDebtAmount > 0 ?
      calculateMonthlyPayment(basePhilDebtAmount, hdcPhilDebtRate, hdcPhilDebtAmortYears) : 0;

    // Calculate sub-debt current pay portions that need to be covered
    // These are based on the base project cost initially
    const baseHdcSubDebtPrincipal = baseProjectCost * (paramHdcSubDebtPct / 100);
    const baseInvestorSubDebtPrincipal = baseProjectCost * (paramInvestorSubDebtPct / 100);
    const baseOutsideInvestorSubDebtPrincipal = baseProjectCost * (paramOutsideInvestorSubDebtPct / 100);

    // Monthly sub-debt current pay amounts (only if current pay is enabled)
    const monthlyHdcCurrentPay = paramPikCurrentPayEnabled && baseHdcSubDebtPrincipal > 0 ?
      (baseHdcSubDebtPrincipal * (paramHdcSubDebtPikRate / 100) * (paramPikCurrentPayPct / 100)) / 12 : 0;

    // Investor sub-debt current pay is both an expense to the project AND income to the investor
    const monthlyInvestorCurrentPay = paramInvestorPikCurrentPayEnabled && baseInvestorSubDebtPrincipal > 0 ?
      (baseInvestorSubDebtPrincipal * (paramInvestorSubDebtPikRate / 100) * (paramInvestorPikCurrentPayPct / 100)) / 12 : 0;

    const monthlyOutsideInvestorCurrentPay = paramOutsideInvestorPikCurrentPayEnabled && baseOutsideInvestorSubDebtPrincipal > 0 ?
      (baseOutsideInvestorSubDebtPrincipal * (paramOutsideInvestorSubDebtPikRate / 100) * (paramOutsideInvestorPikCurrentPayPct / 100)) / 12 : 0;

    // Calculate total monthly service
    const totalMonthlyService = monthlySeniorDebtService + monthlyPhilDebtService +
                               monthlyHdcCurrentPay + monthlyInvestorCurrentPay + monthlyOutsideInvestorCurrentPay;

    // Interest reserve covers specified months of ALL debt service including sub-debt current pay
    // Note: Even though investor sub-debt current pay comes back as income, it still needs to be funded
    interestReserveAmount = isFinite(totalMonthlyService) ?
      totalMonthlyService * interestReserveMonths : 0;

    // Cap interest reserve at a reasonable maximum (e.g., 10% of project cost)
    const maxReserve = baseProjectCost * 0.1;
    if (interestReserveAmount > maxReserve) {
      interestReserveAmount = maxReserve;
    }
  }

  // Now add interest reserve to effective project cost
  const effectiveProjectCost = baseProjectCost + interestReserveAmount;
  
  const hdcSubDebtPrincipal = effectiveProjectCost * (paramHdcSubDebtPct / 100);

  // Calculate debt parameters based on effective project cost
  const hdcSeniorDebtAmount = effectiveProjectCost * ((params.seniorDebtPct || 0) / 100);
  const hdcPhilDebtAmount = effectiveProjectCost * ((params.philanthropicDebtPct || 0) / 100);
  
  // Calculate senior debt service
  const hdcMonthlyseniorDebtService = calculateMonthlyPayment(hdcSeniorDebtAmount, hdcSeniorDebtRate, hdcSeniorDebtAmortYears);
  const hdcAnnualseniorDebtService = hdcMonthlyseniorDebtService * 12;
  
  // Philanthropic debt is always interest-only (no principal amortization)
  // When current pay is disabled, all interest accrues as PIK (no payments)
  // When current pay is enabled, a portion of interest is paid currently, rest accrues as PIK

  const hdcCashFlows: HDCCashFlowItem[] = [];
  // ISS-068c: Direct NOI growth - no longer tracking revenue/expenses separately
  let currentNOI = paramYearOneNOI;
  let cumulativeReturns = 0;
  let hdcPikAccumulatedInterest = 0;
  let hdcPikBalance = hdcSubDebtPrincipal; // Track PIK balance for compound interest
  let hdcPhilPikBalance = 0; // Track only the PIK portion of philanthropic debt, NOT the principal

  // Track Outside Investor Sub-Debt
  const outsideInvestorSubDebtPrincipal = baseProjectCost * (paramOutsideInvestorSubDebtPct / 100);
  let outsideInvestorPikBalance = outsideInvestorSubDebtPrincipal;

  // Track accumulated unpaid AUM fees (per HDC_CALCULATION_LOGIC.md: AUM fees accrue as PIK debt)
  let accumulatedAumFees = 0;

  // Year 1 DSCR calculation (often 0 or N/A due to construction/stabilization)
  const year1DSCR = 0; // Typically no debt service in Year 1 if interest reserve is used


  hdcCashFlows.push({
    year: 1,
    noi: currentNOI,
    debtServicePayments: 0,
    cashAfterDebtService: 0,
    aumFeeAmount: 0,
    aumFeeIncome: 0,
    aumFeeAccrued: 0,
    cashAfterDebtAndAumFee: 0,
    hdcFeeIncome: 0,
    philanthropicShare: 0,
    hdcSubDebtCurrentPay: 0,
    hdcSubDebtPIKAccrued: 0,
    promoteShare: 0,
    totalCashFlow: 0,
    cumulativeReturns: 0,
    pikBalance: 0,
    dscr: year1DSCR,
    operatingCashFlow: 0
  });

  // Years 2 through hold period
  for (let year = 2; year <= paramHoldPeriod; year++) {
    // ISS-068c: Direct NOI growth
    currentNOI *= (1 + paramNoiGrowthRate / 100);

    // Handle philanthropic debt service calculation (always interest-only)
    let hdcPhilDebtServiceThisYear = 0;
    if (hdcPhilDebtAmount > 0 && hdcPhilDebtRate > 0) {
      // Calculate interest on total outstanding balance (principal + accumulated PIK)
      const hdcPhilTotalBalance = hdcPhilDebtAmount + hdcPhilPikBalance;
      const hdcPhilFullInterest = hdcPhilTotalBalance * hdcPhilDebtRate;

      if (!paramPhilCurrentPayEnabled) {
        // Current pay disabled: All interest accrues as PIK (no payment)
        hdcPhilPikBalance += hdcPhilFullInterest;
        hdcPhilDebtServiceThisYear = 0;
      } else if (year === 1) {
        // Year 1 with current pay: Full interest accrues to PIK, no payment
        hdcPhilPikBalance += hdcPhilFullInterest;
        hdcPhilDebtServiceThisYear = 0;
      } else {
        // Years 2+ with current pay: Pay current portion, rest accrues
        const hdcPhilCurrentPay = hdcPhilFullInterest * (paramPhilCurrentPayPct / 100);
        const hdcPhilPIKAccrued = hdcPhilFullInterest - hdcPhilCurrentPay;
        hdcPhilPikBalance += hdcPhilPIKAccrued;
        hdcPhilDebtServiceThisYear = hdcPhilCurrentPay;
      }
    }
    
    // Calculate Outside Investor current pay for DSCR inclusion
    let outsideInvestorCurrentPayForDSCR = 0;
    if (paramOutsideInvestorSubDebtPct > 0 && outsideInvestorPikBalance > 0) {
      const outsideInvestorFullInterest = outsideInvestorPikBalance * (paramOutsideInvestorSubDebtPikRate / 100);
      if (paramOutsideInvestorPikCurrentPayEnabled && year > 1) {
        outsideInvestorCurrentPayForDSCR = outsideInvestorFullInterest * (paramOutsideInvestorPikCurrentPayPct / 100);
      }
    }

    // Include Outside Investor current pay in total debt service for accurate DSCR
    const debtServicePayments = hdcAnnualseniorDebtService + hdcPhilDebtServiceThisYear + outsideInvestorCurrentPayForDSCR;
    const cashAfterDebtService = Math.max(0, currentNOI - debtServicePayments);
    
    // Get AUM fee values from investor cash flows (calculated in main engine)
    const investorCashFlowForYear = paramInvestorCashFlows[year - 1];
    const aumFeeAmount = investorCashFlowForYear?.aumFeeAmount || 0;
    const aumFeeIncome = investorCashFlowForYear?.aumFeePaid || 0;
    const aumFeeAccrued = investorCashFlowForYear?.aumFeeAccrued || 0;

    // Track accumulated AUM fees
    if (aumFeeAccrued > 0) {
      accumulatedAumFees += aumFeeAccrued;
    }
    
    // ISS-051 v2: Use investor's cashAfterDebtAndFees as promote base (single source of truth)
    // This value already accounts for ALL deductions: hard debt, soft debt current pay, AUM fees
    // Previous bug: Was computing independently, missing hdcSubDebtCurrentPay and other soft-pay items
    const cashAfterDebtAndAumFee = investorCashFlowForYear?.cashAfterDebtAndFees || 0;

    // CRITICAL FIX (Jan 2025): Use investor's cumulative returns to determine equity recovery
    // Single source of truth from main calculation engine - NO duplicate calculations
    // Previous bug: Was recalculating recovery by adding up tax benefits + cash flow
    // Correct approach: Use investor's cumulativeReturns which tracks net cash (after HDC fees)
    // See HDC_CALCULATION_LOGIC.md "Promote Hurdle & Equity Recovery Tracking" section
    const investorCumulativeReturns = investorCashFlowForYear?.cumulativeReturns || 0;

    // Waterfall Distribution for HDC's Promote Share
    // HDC gets their promote share based on waterfall phases
    let hdcPromoteShareOfCF = 0;

    // ISS-051: Simplified two-phase waterfall (no catch-up)
    // Phase 1: Investor recovery - HDC gets 0%
    // Phase 2: Normal promote split - HDC gets their share
    if (!hurdleMet) {
      // PHASE 1: Investor Recovery - HDC gets 0% of operating cash
      // Investor gets 100% of tax benefits + operating cash until they recover their equity
      if (investorCumulativeReturns >= investorEquity) {
        // Equity fully recovered - hurdle met this year
        hurdleMet = true;
        // HDC gets their promote share of operating cash flow ONLY
        // Tax benefits always go 100% to investor, even after recovery (free investment principle)
        hdcPromoteShareOfCF = cashAfterDebtAndAumFee > 0
          ? cashAfterDebtAndAumFee * (hdcPromoteShare / 100)
          : 0;
      } else {
        // Still recovering - HDC gets 0%, investor gets 100%
        hdcPromoteShareOfCF = 0;
      }
    } else {
      // PHASE 2: Normal Promote Split - HDC gets their promote share
      // Conservation of capital: HDC share + Investor share = cashAfterDebtAndAumFee
      hdcPromoteShareOfCF = cashAfterDebtAndAumFee * (hdcPromoteShare / 100);
    }
    
    // Philanthropic equity share of remaining cash flow (goes to separate philanthropic entity, not HDC)
    const philanthropicShareOfCF = 0; // Removed - philanthropic entity is separate from HDC

    // HDC PIK Interest with Compound Accrual:
    // - Interest calculated on current balance (not original principal)
    // - Unpaid interest adds to balance for compounding
    // - AUM fee accruals also added to PIK balance when cash insufficient
    let hdcSubDebtCurrentPayIncome = 0;
    let hdcSubDebtPIKAccrued = 0;
    
    if (paramHdcSubDebtPct > 0) {
      const hdcFullInterest = hdcPikBalance * (paramHdcSubDebtPikRate / 100);
      if (paramPikCurrentPayEnabled) {
        hdcSubDebtCurrentPayIncome = hdcFullInterest * (paramPikCurrentPayPct / 100);
        hdcSubDebtPIKAccrued = hdcFullInterest - hdcSubDebtCurrentPayIncome;
      } else {
        hdcSubDebtPIKAccrued = hdcFullInterest;
        hdcSubDebtCurrentPayIncome = 0;
      }
      hdcPikBalance += hdcSubDebtPIKAccrued;
    }
    
    // Note: AUM fee accrual is already handled in main calculation engine
    // The accrued amounts are tracked separately with proper interest
    hdcPikAccumulatedInterest += hdcSubDebtPIKAccrued;

    // Compound Outside Investor Sub-Debt PIK
    if (paramOutsideInvestorSubDebtPct > 0) {
      const outsideInvestorFullInterest = outsideInvestorPikBalance * (paramOutsideInvestorSubDebtPikRate / 100);
      if (paramOutsideInvestorPikCurrentPayEnabled) {
        const outsideInvestorCurrentPay = outsideInvestorFullInterest * (paramOutsideInvestorPikCurrentPayPct / 100);
        const outsideInvestorPIKAccrued = outsideInvestorFullInterest - outsideInvestorCurrentPay;
        outsideInvestorPikBalance += outsideInvestorPIKAccrued;
      } else {
        outsideInvestorPikBalance += outsideInvestorFullInterest;
      }
    }

    const totalCashFlow = aumFeeIncome + hdcSubDebtCurrentPayIncome + hdcPromoteShareOfCF;
    cumulativeReturns += totalCashFlow;

    // Calculate DSCR (Debt Service Coverage Ratio)
    const dscr = debtServicePayments > 0 ? currentNOI / debtServicePayments : 0;

    // Get deferred HDC tax benefit fee from investor cash flows for this year
    hdcCashFlows.push({
      year,
      noi: currentNOI,
      debtServicePayments,
      cashAfterDebtService,
      aumFeeAmount,
      aumFeeIncome,
      aumFeeAccrued,
      cashAfterDebtAndAumFee,
      hdcFeeIncome: 0,
      philanthropicShare: philanthropicShareOfCF,
      hdcSubDebtCurrentPay: hdcSubDebtCurrentPayIncome,
      hdcSubDebtPIKAccrued: hdcSubDebtPIKAccrued,
      promoteShare: hdcPromoteShareOfCF,
      totalCashFlow: totalCashFlow,
      cumulativeReturns: cumulativeReturns,
      pikBalance: hdcPikAccumulatedInterest,
      dscr,
      operatingCashFlow: hdcPromoteShareOfCF
    });
  }

  // Exit calculations
  const finalYearNOI = hdcCashFlows[paramHoldPeriod - 1].noi;
  const exitValue = finalYearNOI / (paramExitCapRate / 100);
  
  // Calculate remaining senior debt based on amortization
  const seniorDebtPaidOffRatio = Math.min(1, paramHoldPeriod / hdcSeniorDebtAmortYears);
  const remainingSeniorDebt = hdcSeniorDebtAmount * (1 - seniorDebtPaidOffRatio);
  
  // Philanthropic debt is always interest-only, so remaining balance is always principal + accumulated PIK
  const remainingPhilDebt = hdcPhilDebtAmount + hdcPhilPikBalance;
  
  const remainingDebt = remainingSeniorDebt + remainingPhilDebt;
  const hdcSubDebtAtExit = hdcPikBalance;
  const outsideInvestorSubDebtAtExit = outsideInvestorPikBalance;

  // Get investor sub-debt at exit from the passed parameter (single source of truth)
  // This value comes from the main investor calculation which properly accounts for DSCR deferrals
  const investorSubDebtAtExit = params.investorSubDebtAtExit || 0;

  // Philanthropic equity is grant funding - never gets repaid
  // ISS-050: Use passed grossExitProceeds from investor calculation to ensure conservation of capital
  // If not passed, fall back to computed value (but this may differ from investor calculation)
  const computedGrossExitProceeds = Math.max(0, exitValue - remainingDebt - hdcSubDebtAtExit - investorSubDebtAtExit - outsideInvestorSubDebtAtExit);
  const grossExitProceeds = params.grossExitProceeds ?? computedGrossExitProceeds;

  // ISS-047 + ISS-050: Return-of-capital-first waterfall with prior recovery tracking
  // 1. Check how much capital investor already recovered during hold period
  // 2. Only give ROC at exit for remaining unrecovered capital
  // 3. All other exit proceeds are profit, split per promote percentage
  const investorEquityBasis = investorEquity || 0;

  // ISS-050 FIX: Account for investor's capital already recovered during hold period
  // Get cumulative returns from the last year of investor cash flows
  const investorCumulativeReturns = paramInvestorCashFlows.length > 0
    ? paramInvestorCashFlows[paramInvestorCashFlows.length - 1].cumulativeReturns || 0
    : 0;
  const capitalAlreadyRecovered = Math.min(investorCumulativeReturns, investorEquityBasis);
  const remainingCapitalToRecover = Math.max(0, investorEquityBasis - capitalAlreadyRecovered);

  // Profit is everything after the remaining ROC - larger when capital was already recovered
  const profit = Math.max(0, grossExitProceeds - remainingCapitalToRecover);

  // ISS-050: Clean profit split at exit - no catch-up mechanism
  // Catch-up for deferred promote happens during hold period operating cash, not at exit
  // This ensures conservation of capital: Investor share + HDC share = grossExitProceeds
  const hdcPromoteProceeds = profit * (hdcPromoteShare / 100);
  const philanthropicEquityRepayment = 0; // Philanthropic equity is grant funding, never repaid
  const hdcSubDebtRepayment = hdcSubDebtAtExit;
  
  // HDC receives promote proceeds, sub-debt repayment, AND accumulated AUM fees at exit
  const totalHDCExitProceeds = hdcPromoteProceeds + hdcSubDebtRepayment + accumulatedAumFees;

  const totalHDCReturns = cumulativeReturns + totalHDCExitProceeds;
  const hdcCashFlowArray = hdcCashFlows.map(cf => cf.totalCashFlow);
  hdcCashFlowArray.push(totalHDCExitProceeds);
  
  // Calculate HDC IRR (HDC has no initial investment - they're the sponsor/developer)
  const hdcInitialInvestment = 0;
  
  // CRITICAL VALIDATION: HDC must have zero investment
  validateHDCZeroInvestment(hdcInitialInvestment);
  
  const hdcIRR = 0; // Cannot calculate IRR without initial investment
  const hdcMultiple = 0; // Cannot calculate multiple without initial investment

  // Calculate blended debt rate for HDC Platform Mode
  // Weighted average of Philanthropic Debt + HDC Sub-Debt + Outside Investor Sub-Debt
  const philDebtPct = params.philanthropicDebtPct || 0;
  const philDebtAmount = baseProjectCost * (philDebtPct / 100);
  const hdcSubDebtAmount = baseProjectCost * (paramHdcSubDebtPct / 100);
  const outsideInvestorSubDebtAmount = baseProjectCost * (paramOutsideInvestorSubDebtPct / 100);

  const totalDebtAmount = philDebtAmount + hdcSubDebtAmount + outsideInvestorSubDebtAmount;
  const blendedDebtRate = totalDebtAmount > 0
    ? ((philDebtAmount * hdcPhilDebtRate * 100) +
       (hdcSubDebtAmount * (paramHdcSubDebtPikRate || 0)) +
       (outsideInvestorSubDebtAmount * (paramOutsideInvestorSubDebtPikRate || 0))) / totalDebtAmount
    : 0;

  return {
    hdcCashFlows,
    hdcExitProceeds: totalHDCExitProceeds,
    hdcPromoteProceeds,
    philanthropicEquityRepayment,
    hdcSubDebtRepayment,
    totalHDCReturns,
    hdcMultiple,
    hdcIRR,
    hdcFeeIncome: 0, // No tax benefit fee
    hdcPhilanthropicIncome: 0, // Philanthropic equity is separate entity
    hdcOperatingPromoteIncome: hdcCashFlows.reduce((sum, cf) => sum + cf.promoteShare, 0),
    hdcAumFeeIncome: hdcCashFlows.reduce((sum, cf) => sum + cf.aumFeeIncome, 0) + accumulatedAumFees,
    hdcSubDebtCurrentPayIncome: hdcCashFlows.reduce((sum, cf) => sum + cf.hdcSubDebtCurrentPay, 0),
    hdcSubDebtPIKAccrued: hdcPikAccumulatedInterest,
    hdcInitialInvestment,
    totalInvestment: hdcInitialInvestment, // HDC has $0 initial investment
    // Additional properties for HDCCashFlowSection display
    hdcTaxBenefitFromFees: 0, // No tax benefit fee
    hdcAumFees: hdcCashFlows.reduce((sum, cf) => sum + cf.aumFeeIncome, 0) + accumulatedAumFees,
    hdcPromoteShare: hdcCashFlows.reduce((sum, cf) => sum + cf.promoteShare, 0) + hdcPromoteProceeds,
    hdcSubDebtInterest: hdcCashFlows.reduce((sum, cf) => sum + cf.hdcSubDebtCurrentPay, 0) + hdcPikAccumulatedInterest,
    hdcSubDebtAtExit: hdcSubDebtAtExit,
    // Exit breakdown components
    accumulatedAumFeesAtExit: accumulatedAumFees,
    hdcDeferredTaxFeesAtExit: 0, // No tax benefit fee
    exitValue,
    remainingDebt,
    outsideInvestorSubDebtAtExit,
    grossExitProceeds,
    // HDC Platform Mode - Blended Debt Rate
    blendedDebtRate,
    totalDebtAmount
  };
};