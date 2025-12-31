/**
 * Shared Interest Reserve Calculation
 *
 * This is the SINGLE SOURCE OF TRUTH for interest reserve calculations.
 * Used by:
 * 1. BasicInputsSection.tsx (UI display)
 * 2. useHDCCalculations.ts (hook)
 * 3. calculations.ts (main engine)
 *
 * CRITICAL RULES:
 * - Philanthropic debt is NEVER included (no payments during lease-up)
 * - Uses S-curve methodology to account for ramping NOI
 * - Calculates actual shortfall, not worst-case
 */

import { calculateSCurve, STANDARD_STEEPNESS } from './sCurveUtility';
import { calculateMonthlyPayment } from './calculations';

export interface InterestReserveParams {
  // Enable/disable
  enabled: boolean;
  months: number;

  // Project parameters
  projectCost: number;
  predevelopmentCosts?: number;
  yearOneNOI: number;

  // Senior debt
  seniorDebtPct: number;
  seniorDebtRate: number;
  seniorDebtAmortization: number;
  seniorDebtIOYears?: number; // Interest-only period (0-10 years)

  // Philanthropic debt (NEVER included in reserve)
  // philDebtPct: number;
  // philDebtRate: number;
  // philCurrentPayEnabled: boolean;
  // philCurrentPayPct: number;

  // Outside Investor Sub-Debt
  outsideInvestorSubDebtPct?: number;
  outsideInvestorSubDebtPikRate?: number;
  outsideInvestorPikCurrentPayEnabled?: boolean;
  outsideInvestorPikCurrentPayPct?: number;

  // HDC Sub-Debt (typically not in reserve, but included for completeness)
  hdcSubDebtPct?: number;
  hdcSubDebtPikRate?: number;
  hdcPikCurrentPayEnabled?: boolean;
  hdcPikCurrentPayPct?: number;

  // Investor Sub-Debt (typically not in reserve, but included for completeness)
  investorSubDebtPct?: number;
  investorSubDebtPikRate?: number;
  investorPikCurrentPayEnabled?: boolean;
  investorPikCurrentPayPct?: number;
}

/**
 * Calculate interest reserve amount using S-curve methodology
 *
 * @param params - Interest reserve parameters
 * @returns Interest reserve amount in dollars
 */
export function calculateInterestReserve(params: InterestReserveParams): number {
  if (!params.enabled || params.months <= 0) return 0;

  const baseProjectCost = params.projectCost + (params.predevelopmentCosts || 0);

  // Calculate senior debt monthly payment
  const seniorDebtAmount = baseProjectCost * (params.seniorDebtPct / 100);
  const seniorDebtRate = params.seniorDebtRate / 100;
  const seniorDebtIOYears = params.seniorDebtIOYears || 0;

  // During interest reserve period (lease-up), if IO period is active, use IO payment
  // Otherwise use P&I payment
  const interestReservePeriodYears = params.months / 12;
  const useIOPayment = seniorDebtIOYears > 0 && interestReservePeriodYears <= seniorDebtIOYears;

  const monthlySeniorDebtService = useIOPayment
    ? (seniorDebtAmount * seniorDebtRate) / 12  // Interest-only payment
    : calculateMonthlyPayment(seniorDebtAmount, seniorDebtRate, params.seniorDebtAmortization);  // P&I payment

  // Philanthropic debt: NEVER included in interest reserve
  // Phil debt doesn't require payments during lease-up regardless of current pay setting
  const monthlyPhilDebtService = 0;

  // Outside Investor Sub-Debt: only include current pay portion if enabled
  let monthlyOutsideInvestorDebtService = 0;
  if (params.outsideInvestorSubDebtPct && params.outsideInvestorPikCurrentPayEnabled && params.outsideInvestorPikCurrentPayPct) {
    const outsideInvestorSubDebtAmount = baseProjectCost * (params.outsideInvestorSubDebtPct / 100);
    const annualInterest = outsideInvestorSubDebtAmount * ((params.outsideInvestorSubDebtPikRate || 0) / 100);
    const currentPayPortion = annualInterest * (params.outsideInvestorPikCurrentPayPct / 100);
    monthlyOutsideInvestorDebtService = currentPayPortion / 12;
  }

  // HDC Sub-Debt: only include current pay portion if enabled
  let monthlyHdcCurrentPay = 0;
  if (params.hdcSubDebtPct && params.hdcPikCurrentPayEnabled && params.hdcPikCurrentPayPct) {
    const hdcSubDebtAmount = baseProjectCost * (params.hdcSubDebtPct / 100);
    const annualInterest = hdcSubDebtAmount * ((params.hdcSubDebtPikRate || 0) / 100);
    const currentPayPortion = annualInterest * (params.hdcPikCurrentPayPct / 100);
    monthlyHdcCurrentPay = currentPayPortion / 12;
  }

  // Investor Sub-Debt: only include current pay portion if enabled
  let monthlyInvestorCurrentPay = 0;
  if (params.investorSubDebtPct && params.investorPikCurrentPayEnabled && params.investorPikCurrentPayPct) {
    const investorSubDebtAmount = baseProjectCost * (params.investorSubDebtPct / 100);
    const annualInterest = investorSubDebtAmount * ((params.investorSubDebtPikRate || 0) / 100);
    const currentPayPortion = annualInterest * (params.investorPikCurrentPayPct / 100);
    monthlyInvestorCurrentPay = currentPayPortion / 12;
  }

  // Total monthly debt service that needs to be covered
  const totalMonthlyService =
    monthlySeniorDebtService +
    monthlyPhilDebtService +
    monthlyOutsideInvestorDebtService +
    monthlyHdcCurrentPay +
    monthlyInvestorCurrentPay;

  // Calculate stabilized NOI (Year 1 NOI = stabilized)
  const stabilizedNOI = params.yearOneNOI;
  const monthlyStabilizedNOI = stabilizedNOI / 12;

  // Calculate shortfall for each month during lease-up using S-curve
  let totalShortfall = 0;
  for (let month = 1; month <= params.months; month++) {
    const progress = Math.min(1, month / params.months);
    const occupancy = calculateSCurve(progress, STANDARD_STEEPNESS);
    const monthlyNOI = monthlyStabilizedNOI * occupancy;

    // Calculate shortfall for this month (debt service minus NOI)
    const monthlyShortfall = Math.max(0, totalMonthlyService - monthlyNOI);
    totalShortfall += monthlyShortfall;
  }

  // Ensure result is finite
  const interestReserveAmount = isFinite(totalShortfall) ? totalShortfall : 0;

  // Cap at 10% of project cost as safety measure
  const maxReserve = baseProjectCost * 0.1;
  return Math.min(interestReserveAmount, maxReserve);
}
