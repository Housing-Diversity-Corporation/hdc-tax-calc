/**
 * State LIHTC (Low-Income Housing Tax Credit) Calculation Module
 *
 * Implements state-level LIHTC credit mechanics for 25 state programs with:
 * - 4 program types: piggyback, supplement, standalone, grant
 * - Syndication rate application based on transferability
 * - Investor state liability handling
 * - 10-year credit schedule (mirrors federal structure)
 * - Warning system for PW, caps, sunsets, and liability issues
 *
 * @version 7.0.0
 * @date 2025-12-16
 * @task IMPL-7.0-003
 * @dependencies IMPL-7.0-002 (stateProfiles), IMPL-7.0-005 (lihtcCreditCalculations)
 */

import {
  getStateLIHTCProgram,
  type StateLIHTCProgram,
} from './stateProfiles';

import { getYear1ProrationFactor } from './lihtcCreditCalculations';

/**
 * Represents a single year's state LIHTC credit allocation
 */
export interface YearlyStateCredit {
  /** Year number (1-11) */
  year: number;

  /** Credit amount for this year */
  creditAmount: number;

  /** Proration factor (1.0 for full years, < 1.0 for Year 1) */
  prorationFactor: number;

  /** Human-readable description */
  description: string;
}

/**
 * Metadata about the state LIHTC calculation
 */
export interface StateLIHTCMetadata {
  /** Program name (e.g., "State LIHTC", "AHAP", "STCS") */
  programName: string;

  /** Program type */
  programType: 'piggyback' | 'supplement' | 'standalone' | 'grant' | null;

  /** Transferability mechanism */
  transferability: 'certificated' | 'transferable' | 'bifurcated' | 'allocated' | 'grant' | null;

  /** Annual cap in dollars (if applicable) */
  cap: number | null;

  /** Sunset year (if applicable) */
  sunset: number | null;

  /** Prevailing wage required */
  pwRequired: boolean;

  /** Legal authority citation */
  authority: string;

  /** Property state */
  propertyState: string;

  /** Investor state */
  investorState: string;
}

/**
 * Complete state LIHTC credit schedule over 11-year period
 */
export interface StateLIHTCSchedule {
  /** Annual credit amount (full year) */
  annualCredit: number;

  /** Year 1 credit (prorated by PIS month) */
  year1Credit: number;

  /** Credit amount for Years 2-10 (each year) */
  years2to10Credit: number;

  /** Year 11 catch-up credit */
  year11Credit: number;

  /** Total credits over all years (always = 10 × annualCredit) */
  totalCredits: number;

  /** Year-by-year breakdown */
  yearlyBreakdown: YearlyStateCredit[];
}

/**
 * Input parameters for state LIHTC calculation
 */
export interface StateLIHTCCalculationParams {
  /** Federal annual credit (from federal LIHTC calculation) */
  federalAnnualCredit: number;

  /** Property state (2-letter code) */
  propertyState: string;

  /** Investor state (2-letter code) */
  investorState: string;

  /** Placed-in-Service month (1 = January, 12 = December) */
  pisMonth: number;

  /** User-specified percentage for supplement programs (0-100) */
  userPercentage?: number;

  /** User-specified amount for standalone/grant programs */
  userAmount?: number;

  /** Whether investor has tax liability in property state */
  investorHasStateLiability?: boolean;

  /** Override syndication rate (0-100) */
  syndicationRateOverride?: number;
}

/**
 * Result of state LIHTC calculation
 */
export interface StateLIHTCCalculationResult {
  /** Gross state credit before syndication */
  grossCredit: number;

  /** Syndication rate applied (0.0-1.0) */
  syndicationRate: number;

  /** Net benefit after syndication */
  netBenefit: number;

  /** Program type */
  programType: 'piggyback' | 'supplement' | 'standalone' | 'grant' | null;

  /** 11-year credit schedule */
  schedule: StateLIHTCSchedule;

  /** Warnings and notices */
  warnings: string[];

  /** Calculation metadata */
  metadata: StateLIHTCMetadata;
}

/**
 * Validation error for state LIHTC calculations
 */
export class StateLIHTCValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateLIHTCValidationError';
  }
}

/**
 * Validates state LIHTC calculation parameters
 *
 * @param params - Calculation parameters to validate
 * @throws {StateLIHTCValidationError} If parameters are invalid
 */
function validateStateLIHTCParams(params: StateLIHTCCalculationParams): void {
  const {
    federalAnnualCredit,
    propertyState,
    investorState,
    pisMonth,
    userPercentage,
    userAmount,
  } = params;

  if (federalAnnualCredit < 0) {
    throw new StateLIHTCValidationError('Federal annual credit cannot be negative');
  }

  if (!propertyState || propertyState.length !== 2) {
    throw new StateLIHTCValidationError('Property state must be a 2-letter code');
  }

  if (!investorState || investorState.length !== 2) {
    throw new StateLIHTCValidationError('Investor state must be a 2-letter code');
  }

  if (!Number.isInteger(pisMonth) || pisMonth < 1 || pisMonth > 12) {
    throw new StateLIHTCValidationError('PIS month must be an integer between 1 and 12');
  }

  if (userPercentage !== undefined && (userPercentage < 0 || userPercentage > 100)) {
    throw new StateLIHTCValidationError('User percentage must be between 0 and 100');
  }

  if (userAmount !== undefined && userAmount < 0) {
    throw new StateLIHTCValidationError('User amount cannot be negative');
  }
}

/**
 * Determines the syndication rate based on program transferability and investor state liability
 *
 * IMPL-047: Toggle controls credit path for ALL program types
 * - If investorHasStateLiability is TRUE → 100% direct use (investor uses credits directly)
 * - If investorHasStateLiability is FALSE → syndicate at program rate (85-90%)
 * - Grant programs: always 100% (direct to project, regardless of toggle)
 *
 * @param program - State LIHTC program
 * @param investorState - Investor state code (unused after IMPL-047, kept for API compatibility)
 * @param propertyState - Property state code (unused after IMPL-047, kept for API compatibility)
 * @param investorHasStateLiability - Whether investor has tax liability in property state
 * @param syndicationRateOverride - Optional override rate (0-100)
 * @returns Syndication rate (0.0-1.0)
 */
export function determineSyndicationRate(
  program: StateLIHTCProgram,
  investorState: string,
  propertyState: string,
  investorHasStateLiability: boolean,
  syndicationRateOverride?: number
): number {
  // If override provided, use it
  if (syndicationRateOverride !== undefined) {
    return syndicationRateOverride / 100;
  }

  // Grant programs: always 100% (direct to project)
  if (program.transferability === 'grant') {
    return 1.0;
  }

  // IMPL-047: Toggle overrides in-state/out-of-state logic for ALL program types
  // If investor has state tax liability → 100% direct use
  // If investor does NOT have liability → syndicate at program rate
  if (investorHasStateLiability) {
    return 1.0;  // Direct use - investor can use credits directly
  } else {
    return program.syndicationRate / 100;  // Syndicated path
  }
}

/**
 * Calculates piggyback state credit
 *
 * Piggyback: State Credit = Federal Credit × (stateLIHTCPercent / 100)
 *
 * @param federalAnnualCredit - Federal annual credit
 * @param program - State LIHTC program
 * @returns Gross state credit
 */
export function calculatePiggybackCredit(
  federalAnnualCredit: number,
  program: StateLIHTCProgram
): number {
  return federalAnnualCredit * (program.percent / 100);
}

/**
 * Calculates supplement state credit
 *
 * Supplement: State Credit = Federal Credit × (userPercentage / 100)
 *
 * @param federalAnnualCredit - Federal annual credit
 * @param userPercentage - User-specified percentage (0-100)
 * @returns Gross state credit
 */
export function calculateSupplementCredit(
  federalAnnualCredit: number,
  userPercentage: number
): number {
  return federalAnnualCredit * (userPercentage / 100);
}

/**
 * Calculates standalone state credit
 *
 * Standalone: State Credit = userAmount (independent of federal)
 *
 * @param userAmount - User-specified total allocation
 * @returns Annual state credit (amortized over 10 years)
 */
export function calculateStandaloneCredit(userAmount: number): number {
  // Standalone credits are allocated as a total amount
  // Amortize over 10 years to get annual credit
  return userAmount / 10;
}

/**
 * Calculates grant state credit
 *
 * Grant: Direct allocation to project (not transferable)
 *
 * @param grantAmount - Grant amount
 * @returns Annual grant (amortized over 10 years)
 */
export function calculateGrantCredit(grantAmount: number): number {
  // Grants are allocated as a total amount
  // Amortize over 10 years to get annual credit
  return grantAmount / 10;
}

/**
 * Generates 11-year state LIHTC credit schedule
 *
 * Mirrors federal LIHTC structure:
 * - Year 1: Prorated by PIS month
 * - Years 2-10: Full annual credit
 * - Year 11: Catch-up to ensure total = 10 × annual
 *
 * @param annualCredit - Annual state credit
 * @param pisMonth - Placed-in-Service month (1-12)
 * @returns Complete state LIHTC schedule
 */
export function generateStateLIHTCSchedule(
  annualCredit: number,
  pisMonth: number
): StateLIHTCSchedule {
  // Calculate Year 1 proration
  const year1ProrationFactor = getYear1ProrationFactor(pisMonth);
  const year1Credit = annualCredit * year1ProrationFactor;

  // Years 2-10: full annual credit
  const years2to10Credit = annualCredit;

  // Year 11: catch-up
  const year11Credit = annualCredit - year1Credit;

  // Total credits
  const totalCredits = year1Credit + 9 * annualCredit + year11Credit;

  // Build yearly breakdown
  const yearlyBreakdown: YearlyStateCredit[] = [];

  // Year 1
  const monthsInService = 13 - pisMonth;
  yearlyBreakdown.push({
    year: 1,
    creditAmount: year1Credit,
    prorationFactor: year1ProrationFactor,
    description: `Year 1 (${monthsInService} months in service, ${(year1ProrationFactor * 100).toFixed(1)}% proration)`,
  });

  // Years 2-10
  for (let year = 2; year <= 10; year++) {
    yearlyBreakdown.push({
      year,
      creditAmount: years2to10Credit,
      prorationFactor: 1.0,
      description: `Year ${year} (full year)`,
    });
  }

  // Year 11
  const year11ProrationFactor = year11Credit / annualCredit;
  yearlyBreakdown.push({
    year: 11,
    creditAmount: year11Credit,
    prorationFactor: year11ProrationFactor,
    description: `Year 11 (catch-up, ${(year11ProrationFactor * 100).toFixed(1)}% of annual)`,
  });

  return {
    annualCredit,
    year1Credit,
    years2to10Credit,
    year11Credit,
    totalCredits,
    yearlyBreakdown,
  };
}

/**
 * Generates warnings based on program characteristics and parameters
 *
 * @param program - State LIHTC program
 * @param params - Calculation parameters
 * @param syndicationRate - Calculated syndication rate
 * @returns Array of warning messages
 */
export function generateWarnings(
  program: StateLIHTCProgram | null,
  params: StateLIHTCCalculationParams,
  syndicationRate: number
): string[] {
  const warnings: string[] = [];

  // No program exists
  if (!program) {
    warnings.push(`No state LIHTC program in ${params.propertyState}`);
    return warnings;
  }

  // Prevailing wage required
  if (program.pw) {
    warnings.push(
      `State prevailing wage required for ${program.program} in ${params.propertyState}`
    );
  }

  // Sunset approaching
  if (program.sunset) {
    const currentYear = new Date().getFullYear();
    const yearsUntilSunset = program.sunset - currentYear;

    if (yearsUntilSunset <= 0) {
      warnings.push(`Program ${program.program} has sunset (${program.sunset})`);
    } else if (yearsUntilSunset <= 3) {
      warnings.push(
        `Program ${program.program} sunsets ${program.sunset} - only ${yearsUntilSunset} year(s) remaining`
      );
    }
  }

  // Cap exceeded (for standalone/supplement with user input)
  if (program.cap && params.userAmount && params.userAmount > program.cap) {
    warnings.push(
      `Requested amount $${params.userAmount.toLocaleString()} exceeds annual cap of $${program.cap.toLocaleString()}`
    );
  }

  // IMPL-047: Removed warning about allocated credits without liability
  // Toggle OFF now syndicates at program rate instead of 0%, so credits are always usable

  return warnings;
}

/**
 * Determines if investor has state tax liability
 *
 * Logic:
 * - If explicitly provided, use that value
 * - If investor state = property state, assume yes (in-state investor)
 * - Otherwise, assume no (out-of-state investor without liability)
 *
 * @param investorState - Investor state
 * @param propertyState - Property state
 * @param explicitLiability - Explicitly provided liability status
 * @returns Whether investor has state tax liability
 */
export function determineStateLiability(
  investorState: string,
  propertyState: string,
  explicitLiability?: boolean
): boolean {
  // If explicitly provided, use that
  if (explicitLiability !== undefined) {
    return explicitLiability;
  }

  // If in-state investor, assume yes
  if (investorState === propertyState) {
    return true;
  }

  // Out-of-state investor, assume no liability in property state
  return false;
}

/**
 * Calculates complete state LIHTC credit schedule and net benefit
 *
 * Supports 4 program types:
 * 1. Piggyback: State Credit = Federal Credit × stateLIHTCPercent
 * 2. Supplement: State Credit = Federal Credit × userPercentage
 * 3. Standalone: State Credit = userAmount (independent of federal)
 * 4. Grant: Direct allocation (100% syndication)
 *
 * @param params - Calculation parameters
 * @returns Complete state LIHTC calculation result
 * @throws {StateLIHTCValidationError} If parameters are invalid
 *
 * @example
 * ```typescript
 * // Georgia piggyback example
 * const result = calculateStateLIHTC({
 *   federalAnnualCredit: 1950000,
 *   propertyState: 'GA',
 *   investorState: 'NY',
 *   pisMonth: 7,
 *   investorHasStateLiability: false
 * });
 * // result.grossCredit = $1,950,000
 * // result.syndicationRate = 0.85
 * // result.netBenefit = $1,657,500
 * ```
 */
export function calculateStateLIHTC(
  params: StateLIHTCCalculationParams
): StateLIHTCCalculationResult {
  // Step 1: Validate inputs
  validateStateLIHTCParams(params);

  const {
    federalAnnualCredit,
    propertyState,
    investorState,
    pisMonth,
    userPercentage,
    userAmount,
    syndicationRateOverride,
  } = params;

  // Step 2: Look up state LIHTC program
  const program = getStateLIHTCProgram(propertyState);

  // If no program, return zero credits
  if (!program) {
    const warnings = generateWarnings(null, params, 0);

    return {
      grossCredit: 0,
      syndicationRate: 0,
      netBenefit: 0,
      programType: null,
      schedule: generateStateLIHTCSchedule(0, pisMonth),
      warnings,
      metadata: {
        programName: 'N/A',
        programType: null,
        transferability: null,
        cap: null,
        sunset: null,
        pwRequired: false,
        authority: 'N/A',
        propertyState,
        investorState,
      },
    };
  }

  // Step 3: Determine investor state liability
  const investorHasStateLiability = determineStateLiability(
    investorState,
    propertyState,
    params.investorHasStateLiability
  );

  // Step 4: Calculate gross credit based on program type
  let grossAnnualCredit: number;
  let programType: 'piggyback' | 'supplement' | 'standalone' | 'grant';

  if (program.type === 'piggyback') {
    grossAnnualCredit = calculatePiggybackCredit(federalAnnualCredit, program);
    programType = 'piggyback';
  } else if (program.type === 'supplement') {
    if (userPercentage === undefined) {
      throw new StateLIHTCValidationError(
        'User percentage required for supplement programs'
      );
    }
    grossAnnualCredit = calculateSupplementCredit(federalAnnualCredit, userPercentage);
    programType = 'supplement';
  } else if (program.type === 'standalone') {
    if (userAmount === undefined) {
      throw new StateLIHTCValidationError('User amount required for standalone programs');
    }
    grossAnnualCredit = calculateStandaloneCredit(userAmount);
    programType = 'standalone';
  } else if (program.type === 'grant') {
    if (userAmount === undefined) {
      throw new StateLIHTCValidationError('Grant amount required for grant programs');
    }
    grossAnnualCredit = calculateGrantCredit(userAmount);
    programType = 'grant';
  } else {
    throw new StateLIHTCValidationError(`Unknown program type: ${program.type}`);
  }

  // Step 5: Determine syndication rate
  const syndicationRate = determineSyndicationRate(
    program,
    investorState,
    propertyState,
    investorHasStateLiability,
    syndicationRateOverride
  );

  // Step 6: Calculate net benefit
  const netAnnualBenefit = grossAnnualCredit * syndicationRate;

  // Step 7: Generate 11-year schedule
  const schedule = generateStateLIHTCSchedule(grossAnnualCredit, pisMonth);

  // Step 8: Generate warnings
  const warnings = generateWarnings(program, params, syndicationRate);

  // Step 9: Build metadata
  const metadata: StateLIHTCMetadata = {
    programName: program.program,
    programType,
    transferability: program.transferability,
    cap: program.cap ?? null,
    sunset: program.sunset ?? null,
    pwRequired: program.pw,
    authority: program.authority,
    propertyState,
    investorState,
  };

  return {
    grossCredit: schedule.totalCredits,
    syndicationRate,
    netBenefit: netAnnualBenefit * 10, // Total over 10 years
    programType,
    schedule,
    warnings,
    metadata,
  };
}

/**
 * Formats state LIHTC calculation result for display
 *
 * @param result - Calculation result to format
 * @returns Formatted string representation
 */
export function formatStateLIHTCResult(result: StateLIHTCCalculationResult): string {
  const { metadata, grossCredit, syndicationRate, netBenefit, schedule, warnings } = result;

  const lines: string[] = [];
  lines.push('=== State LIHTC Calculation ===');
  lines.push('');
  lines.push('PROGRAM:');
  lines.push(`  State: ${metadata.propertyState}`);
  lines.push(`  Program: ${metadata.programName}`);
  lines.push(`  Type: ${metadata.programType ?? 'N/A'}`);
  lines.push(`  Transferability: ${metadata.transferability ?? 'N/A'}`);
  lines.push('');
  lines.push('CREDITS:');
  lines.push(`  Gross State Credit (10 years): $${grossCredit.toLocaleString()}`);
  lines.push(`  Annual Credit: $${schedule.annualCredit.toLocaleString()}`);
  lines.push(`  Syndication Rate: ${(syndicationRate * 100).toFixed(1)}%`);
  lines.push(`  Net Benefit (10 years): $${netBenefit.toLocaleString()}`);
  lines.push('');

  if (warnings.length > 0) {
    lines.push('WARNINGS:');
    warnings.forEach((warning) => {
      lines.push(`  ⚠️  ${warning}`);
    });
    lines.push('');
  }

  lines.push('SCHEDULE:');
  schedule.yearlyBreakdown.forEach(({ year, creditAmount, description }) => {
    lines.push(
      `  Year ${year.toString().padStart(2)}: $${creditAmount.toLocaleString().padStart(15)} - ${description}`
    );
  });

  return lines.join('\n');
}
