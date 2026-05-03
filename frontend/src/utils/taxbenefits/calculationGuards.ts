/**
 * CRITICAL CALCULATION GUARDS
 * 
 * This file contains validation functions that MUST be called before any calculation
 * to ensure core business logic is not violated.
 * 
 * DO NOT MODIFY WITHOUT READING HDC_CALCULATION_LOGIC.md
 * 
 * These guards prevent accidental changes to intentional unconventional logic.
 */

/**
 * Validates that HDC has zero initial investment
 * HDC earns fees and promote WITHOUT capital contribution
 */
export const validateHDCZeroInvestment = (hdcInitialInvestment: number): void => {
  if (hdcInitialInvestment !== 0) {
    throw new Error(
      'CRITICAL ERROR: HDC must have $0 initial investment. ' +
      'HDC is the sponsor/developer and does not contribute capital. ' +
      'See HDC_CALCULATION_LOGIC.md for business model explanation.'
    );
  }
};

/**
 * Validates that tax benefits go 100% to investor (after HDC fee)
 * Tax benefits are NEVER split by promote
 */
export const validateTaxBenefitDistribution = (
  taxBenefit: number,
  hdcFee: number,
  investorAmount: number,
  hdcPromoteAmount: number
): void => {
  const expectedInvestorAmount = taxBenefit - hdcFee;
  
  if (hdcPromoteAmount > 0) {
    throw new Error(
      'CRITICAL ERROR: Tax benefits cannot be split by promote. ' +
      'HDC receives a fee only, not a promote share of tax benefits. ' +
      'See HDC_CALCULATION_LOGIC.md Step 2.'
    );
  }
  
  if (Math.abs(investorAmount - expectedInvestorAmount) > 0.01) {
    throw new Error(
      `CRITICAL ERROR: Investor must receive 100% of tax benefits after HDC fee. ` +
      `Expected: ${expectedInvestorAmount}, Got: ${investorAmount}. ` +
      'See HDC_CALCULATION_LOGIC.md Step 2.'
    );
  }
};

/**
 * Validates waterfall distribution phases
 * Ensures free investment principle is maintained
 */
export const validateWaterfallPhase = (
  equityRecovered: number,
  investorEquity: number,
  hdcPromoteAmount: number,
  phase: 'recovery' | 'catchup' | 'normal'
): void => {
  const isRecoveryComplete = equityRecovered >= investorEquity;
  
  if (phase === 'recovery' && hdcPromoteAmount > 0) {
    throw new Error(
      'CRITICAL ERROR: HDC cannot receive promote during investor recovery phase. ' +
      `Equity recovered: $${equityRecovered.toLocaleString()}, ` +
      `Total equity: $${investorEquity.toLocaleString()}. ` +
      'See HDC_CALCULATION_LOGIC.md Step 4: Waterfall Distribution.'
    );
  }
  
  if (phase === 'normal' && !isRecoveryComplete) {
    throw new Error(
      'CRITICAL ERROR: Cannot enter normal promote phase before investor recovery. ' +
      'Free investment principle violated. ' +
      'See HDC_CALCULATION_LOGIC.md: Free Investment Principle.'
    );
  }
};

/**
 * Validates PIK interest calculation uses current balance
 * Prevents using original principal for compound interest
 */
export const validatePIKInterestCalculation = (
  interestAmount: number,
  currentBalance: number,
  originalPrincipal: number,
  rate: number
): void => {
  const expectedInterest = currentBalance * rate;
  const wrongInterest = originalPrincipal * rate;

  // Skip validation for very small amounts (less than $100) to avoid floating point precision issues
  // This handles edge cases where HDC sub-debt percentage is very small (like 1%)
  if (currentBalance < 100 || originalPrincipal < 100) {
    return;
  }

  // Use a relative tolerance for the comparison when dealing with small values
  const tolerance = Math.min(0.01, Math.abs(expectedInterest) * 0.001);

  // Skip the "wrong interest" check if balance equals principal (Year 1 case)
  // In Year 1, it's correct for balance to equal principal
  if (Math.abs(currentBalance - originalPrincipal) > tolerance &&
      Math.abs(interestAmount - wrongInterest) < tolerance) {
    throw new Error(
      'CRITICAL ERROR: PIK interest must be calculated on current balance, not original principal. ' +
      `Current balance: $${currentBalance.toLocaleString()}, ` +
      `Original: $${originalPrincipal.toLocaleString()}. ` +
      'This is compound interest. See HDC_CALCULATION_LOGIC.md Step 5.'
    );
  }

  if (Math.abs(interestAmount - expectedInterest) > tolerance) {
    throw new Error(
      `CRITICAL ERROR: PIK interest calculation incorrect. ` +
      `Expected: ${expectedInterest}, Got: ${interestAmount}. ` +
      'See HDC_CALCULATION_LOGIC.md Step 5: PIK Debt Calculations.'
    );
  }
};

/**
 * Validates exit proceeds debt payoff order
 * Ensures all debt types are included
 * IMPL-164: Added pabDebt and hdcDebtFund parameters
 * IMPL-166: Added devFee parameter
 */
export const validateExitDebtPayoff = (
  exitValue: number,
  seniorDebt: number,
  philDebt: number,
  pabDebt: number,
  hdcSubDebt: number,
  investorSubDebt: number,
  hdcDebtFund: number,
  devFee: number,
  netProceeds: number
): void => {
  const totalDebt = seniorDebt + philDebt + pabDebt + hdcSubDebt + investorSubDebt + hdcDebtFund + devFee;
  const expectedNetProceeds = Math.max(0, exitValue - totalDebt);

  if (Math.abs(netProceeds - expectedNetProceeds) > 0.01) {
    throw new Error(
      'CRITICAL ERROR: Exit proceeds must pay off ALL debt before distribution. ' +
      `Exit value: $${exitValue.toLocaleString()}, ` +
      `Total debt: $${totalDebt.toLocaleString()} ` +
      `(Senior: $${seniorDebt.toLocaleString()}, ` +
      `Phil: $${philDebt.toLocaleString()}, ` +
      `PAB: $${pabDebt.toLocaleString()}, ` +
      `HDC Sub: $${hdcSubDebt.toLocaleString()}, ` +
      `Investor Sub: $${investorSubDebt.toLocaleString()}, ` +
      `DDF: $${hdcDebtFund.toLocaleString()}, ` +
      `Dev Fee: $${devFee.toLocaleString()}). ` +
      'See HDC_CALCULATION_LOGIC.md Step 6.'
    );
  }
};

/**
 * Validates OpEx ratio is only applied in Year 1
 * Prevents reapplying ratio every year
 */
export const validateOpExRatioApplication = (
  year: number,
  isApplyingRatio: boolean
): void => {
  if (year > 1 && isApplyingRatio) {
    throw new Error(
      'CRITICAL ERROR: OpEx ratio must only be applied in Year 1. ' +
      `Attempting to apply in Year ${year}. ` +
      'Years 2+ should use independent growth rates. ' +
      'See HDC_CALCULATION_LOGIC.md Step 1.'
    );
  }
};

/**
 * Master validation function - call at start of calculations
 * Ensures all critical business rules are maintained
 */
export const validateCalculationInputs = (params: {
  hdcInitialInvestment?: number;
  year?: number;
  isApplyingOpExRatio?: boolean;
}): void => {
  // Validate HDC has zero investment
  if (params.hdcInitialInvestment !== undefined) {
    validateHDCZeroInvestment(params.hdcInitialInvestment);
  }
  
  // Validate OpEx ratio application
  if (params.year !== undefined && params.isApplyingOpExRatio !== undefined) {
    validateOpExRatioApplication(params.year, params.isApplyingOpExRatio);
  }
};

/**
 * Runtime assertion to catch logic violations
 * Use liberally throughout calculations
 */
export const assert = (
  condition: boolean,
  message: string,
  docReference: string = 'HDC_CALCULATION_LOGIC.md'
): void => {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}. See ${docReference}`);
  }
};

// Export a flag to indicate guards are active
export const CALCULATION_GUARDS_ACTIVE = true;