/**
 * IMPL-7.0-006: Preferred Equity Calculations
 *
 * Calculates preferred equity layer with target MOIC, accrual schedule,
 * and waterfall priority above common equity.
 *
 * Key Formula: exitPayment = min(principal × targetMOIC, availableProceeds)
 *
 * @version 7.0.0
 * @date 2025-12-16
 * @task IMPL-7.0-006
 */

/**
 * Custom error for preferred equity validation failures
 */
export class PreferredEquityValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreferredEquityValidationError';
  }
}

/**
 * Parameters for preferred equity calculation
 */
export interface PreferredEquityParams {
  /** Whether preferred equity layer is enabled */
  prefEquityEnabled: boolean;

  /** Preferred equity as percentage of total capitalization (0-40%) */
  prefEquityPct: number;

  /** Target MOIC - multiple on invested capital (1.0-3.0x) */
  prefEquityTargetMOIC: number;

  /** Target IRR - internal rate of return (6-20%) */
  prefEquityTargetIRR: number;

  /** Annual accrual rate for priority tracking (6-20%) */
  prefEquityAccrualRate: number;

  /** Whether preferred can be structured as OZ-eligible */
  prefEquityOzEligible?: boolean;

  /** Hold period in years */
  holdPeriod: number;

  /** Total project capitalization */
  totalCapitalization: number;
}

/**
 * Represents a single year's accrual in the preferred equity schedule
 */
export interface PreferredEquityYearlyAccrual {
  /** Year number (1-based) */
  year: number;

  /** Beginning balance */
  beginningBalance: number;

  /** Accrual amount this year */
  accrual: number;

  /** Ending balance after accrual */
  endingBalance: number;

  /** Effective accrual rate this year */
  effectiveRate: number;
}

/**
 * Complete preferred equity calculation result
 */
export interface PreferredEquityResult {
  /** Preferred equity principal amount */
  principal: number;

  /** Target amount at exit (principal × MOIC) */
  targetAmount: number;

  /** Accrued balance at exit (for priority tracking) */
  accruedBalance: number;

  /** Actual payment at exit (min of target and available) */
  paymentAtExit: number;

  /** Achieved MOIC (payment / principal) */
  achievedMOIC: number;

  /** Achieved IRR */
  achievedIRR: number;

  /** MOIC shortfall (target - achieved) */
  moicShortfall: number;

  /** Dollar shortfall (target - payment) */
  dollarShortfall: number;

  /** Year-by-year accrual schedule (for priority tracking) */
  schedule: PreferredEquityYearlyAccrual[];

  /** Whether target MOIC was fully achieved */
  targetAchieved: boolean;

  /** Metadata */
  metadata: {
    prefEquityPct: number;
    targetMOIC: number;
    targetIRR: number;
    accrualRate: number;
    holdPeriod: number;
  };
}

/**
 * Validates preferred equity parameters
 *
 * @param params - Preferred equity parameters
 * @throws {PreferredEquityValidationError} If validation fails
 */
export function validatePreferredEquityParams(
  params: PreferredEquityParams
): void {
  // Percentage validation
  if (params.prefEquityPct < 0 || params.prefEquityPct > 40) {
    throw new PreferredEquityValidationError(
      `Preferred equity percentage must be 0-40%, got ${params.prefEquityPct}%`
    );
  }

  // MOIC validation
  if (params.prefEquityTargetMOIC < 1.0 || params.prefEquityTargetMOIC > 3.0) {
    throw new PreferredEquityValidationError(
      `Target MOIC must be 1.0-3.0x, got ${params.prefEquityTargetMOIC}x`
    );
  }

  // Target IRR validation
  if (params.prefEquityTargetIRR < 6 || params.prefEquityTargetIRR > 20) {
    throw new PreferredEquityValidationError(
      `Target IRR must be 6-20%, got ${params.prefEquityTargetIRR}%`
    );
  }

  // Accrual rate validation
  if (
    params.prefEquityAccrualRate < 6 ||
    params.prefEquityAccrualRate > 20
  ) {
    throw new PreferredEquityValidationError(
      `Accrual rate must be 6-20%, got ${params.prefEquityAccrualRate}%`
    );
  }

  // Hold period validation
  if (params.holdPeriod <= 0 || params.holdPeriod > 15) {
    throw new PreferredEquityValidationError(
      `Hold period must be 1-15 years, got ${params.holdPeriod}`
    );
  }

  // Capitalization validation
  if (params.totalCapitalization <= 0) {
    throw new PreferredEquityValidationError(
      `Total capitalization must be positive, got ${params.totalCapitalization}`
    );
  }
}

/**
 * Calculates preferred equity principal amount
 *
 * @param totalCapitalization - Total project capitalization
 * @param prefEquityPct - Preferred equity percentage (0-40%)
 * @returns Preferred equity principal amount
 */
export function calculatePreferredEquityPrincipal(
  totalCapitalization: number,
  prefEquityPct: number
): number {
  return totalCapitalization * (prefEquityPct / 100);
}

/**
 * Calculates target amount at exit (principal × MOIC)
 *
 * @param principal - Preferred equity principal
 * @param targetMOIC - Target multiple on invested capital
 * @returns Target amount at exit
 */
export function calculateTargetAmount(
  principal: number,
  targetMOIC: number
): number {
  return principal * targetMOIC;
}

/**
 * Calculates yearly accrual for a single year
 *
 * @param beginningBalance - Balance at start of year
 * @param accrualRate - Annual accrual rate (as percentage, e.g., 12)
 * @returns Accrual amount for the year
 */
export function calculateYearlyAccrual(
  beginningBalance: number,
  accrualRate: number
): number {
  return beginningBalance * (accrualRate / 100);
}

/**
 * Generates complete accrual schedule for preferred equity
 *
 * This schedule is used for priority tracking if there are interim distributions.
 * The final exit payment is capped at target MOIC, not the accrued balance.
 *
 * @param principal - Preferred equity principal
 * @param accrualRate - Annual accrual rate (6-20%)
 * @param holdPeriod - Hold period in years
 * @returns Year-by-year accrual schedule
 */
export function generateAccrualSchedule(
  principal: number,
  accrualRate: number,
  holdPeriod: number
): PreferredEquityYearlyAccrual[] {
  const schedule: PreferredEquityYearlyAccrual[] = [];
  let balance = principal;

  for (let year = 1; year <= holdPeriod; year++) {
    const beginningBalance = balance;
    const accrual = calculateYearlyAccrual(beginningBalance, accrualRate);
    const endingBalance = beginningBalance + accrual;

    schedule.push({
      year,
      beginningBalance,
      accrual,
      endingBalance,
      effectiveRate: accrualRate,
    });

    balance = endingBalance;
  }

  return schedule;
}

/**
 * Calculates exit payment for preferred equity
 *
 * KEY FORMULA: exitPayment = min(principal × targetMOIC, availableProceeds)
 *
 * The accrual schedule is for priority tracking, but exit payment caps at target MOIC.
 *
 * @param principal - Preferred equity principal
 * @param targetMOIC - Target multiple on invested capital
 * @param availableProceeds - Available exit proceeds after senior/phil debt
 * @returns Actual payment to preferred equity at exit
 */
export function calculateExitPayment(
  principal: number,
  targetMOIC: number,
  availableProceeds: number
): number {
  const targetAmount = calculateTargetAmount(principal, targetMOIC);
  return Math.min(targetAmount, Math.max(0, availableProceeds));
}

/**
 * Calculates achieved MOIC
 *
 * @param payment - Actual payment received
 * @param principal - Original principal invested
 * @returns Achieved multiple on invested capital
 */
export function calculateAchievedMOIC(
  payment: number,
  principal: number
): number {
  if (principal === 0) return 0;
  return payment / principal;
}

/**
 * Calculates IRR for preferred equity investment
 *
 * Uses Newton-Raphson method to solve: NPV = 0
 *
 * @param principal - Initial investment (negative cash flow)
 * @param exitPayment - Exit payment (positive cash flow)
 * @param holdPeriod - Hold period in years
 * @returns Internal rate of return (as percentage, e.g., 12.5)
 */
export function calculateIRR(
  principal: number,
  exitPayment: number,
  holdPeriod: number
): number {
  if (principal === 0 || holdPeriod === 0) return 0;

  // Simple IRR calculation for single cash flow at exit
  // (exitPayment / principal) = (1 + IRR)^holdPeriod
  // IRR = (exitPayment / principal)^(1/holdPeriod) - 1

  const ratio = exitPayment / principal;
  if (ratio <= 0) return -100; // Total loss

  const irr = Math.pow(ratio, 1 / holdPeriod) - 1;
  return irr * 100; // Convert to percentage
}

/**
 * Main function: Calculates complete preferred equity result
 *
 * @param params - Preferred equity parameters
 * @param availableProceeds - Available exit proceeds after senior/phil debt
 * @returns Complete preferred equity calculation result
 */
export function calculatePreferredEquity(
  params: PreferredEquityParams,
  availableProceeds: number
): PreferredEquityResult {
  // Step 1: Validate parameters
  validatePreferredEquityParams(params);

  // Step 2: Calculate principal amount
  const principal = calculatePreferredEquityPrincipal(
    params.totalCapitalization,
    params.prefEquityPct
  );

  // Step 3: Calculate target amount (principal × MOIC)
  const targetAmount = calculateTargetAmount(
    principal,
    params.prefEquityTargetMOIC
  );

  // Step 4: Generate accrual schedule (for priority tracking)
  const schedule = generateAccrualSchedule(
    principal,
    params.prefEquityAccrualRate,
    params.holdPeriod
  );

  // Step 5: Calculate accrued balance at exit (last year ending balance)
  const accruedBalance =
    schedule.length > 0
      ? schedule[schedule.length - 1].endingBalance
      : principal;

  // Step 6: Calculate actual exit payment
  // KEY: Payment capped at target MOIC, not accrued balance
  const paymentAtExit = calculateExitPayment(
    principal,
    params.prefEquityTargetMOIC,
    availableProceeds
  );

  // Step 7: Calculate achieved MOIC
  const achievedMOIC = calculateAchievedMOIC(paymentAtExit, principal);

  // Step 8: Calculate achieved IRR
  const achievedIRR = calculateIRR(principal, paymentAtExit, params.holdPeriod);

  // Step 9: Calculate shortfalls
  const moicShortfall = Math.max(0, params.prefEquityTargetMOIC - achievedMOIC);
  const dollarShortfall = Math.max(0, targetAmount - paymentAtExit);

  // Step 10: Determine if target achieved
  const targetAchieved = paymentAtExit >= targetAmount;

  // Step 11: Return complete result
  return {
    principal,
    targetAmount,
    accruedBalance,
    paymentAtExit,
    achievedMOIC,
    achievedIRR,
    moicShortfall,
    dollarShortfall,
    schedule,
    targetAchieved,
    metadata: {
      prefEquityPct: params.prefEquityPct,
      targetMOIC: params.prefEquityTargetMOIC,
      targetIRR: params.prefEquityTargetIRR,
      accrualRate: params.prefEquityAccrualRate,
      holdPeriod: params.holdPeriod,
    },
  };
}

/**
 * Formats preferred equity result for display
 *
 * @param result - Preferred equity calculation result
 * @returns Formatted string representation
 */
export function formatPreferredEquityResult(
  result: PreferredEquityResult
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const lines: string[] = [];

  lines.push('Preferred Equity Analysis:');
  lines.push(`  Principal: ${formatter.format(result.principal)}`);
  lines.push(
    `  Target (${result.metadata.targetMOIC.toFixed(1)}x MOIC): ${formatter.format(result.targetAmount)}`
  );
  lines.push(
    `  Accrued Balance: ${formatter.format(result.accruedBalance)} (priority tracking)`
  );
  lines.push(`  Exit Payment: ${formatter.format(result.paymentAtExit)}`);
  lines.push(
    `  Achieved MOIC: ${result.achievedMOIC.toFixed(2)}x (Target: ${result.metadata.targetMOIC.toFixed(1)}x)`
  );
  lines.push(
    `  Achieved IRR: ${result.achievedIRR.toFixed(1)}% (Target: ${result.metadata.targetIRR.toFixed(1)}%)`
  );

  if (!result.targetAchieved) {
    lines.push(
      `  ⚠️ Shortfall: ${formatter.format(result.dollarShortfall)} (${result.moicShortfall.toFixed(2)}x MOIC)`
    );
  } else {
    lines.push('  ✓ Target MOIC achieved');
  }

  return lines.join('\n');
}

/**
 * Checks if preferred equity is enabled and has non-zero principal
 *
 * @param params - Preferred equity parameters
 * @returns True if preferred equity should be calculated
 */
export function isPreferredEquityEnabled(
  params: PreferredEquityParams
): boolean {
  return params.prefEquityEnabled && params.prefEquityPct > 0;
}
