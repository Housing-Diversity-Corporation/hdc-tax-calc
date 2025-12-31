/**
 * Free Investment Timeline Calculator
 *
 * Calculates how many years it will take for an investor to fully recover
 * their initial investment through tax benefits and operating cash flows.
 */

export interface RecoveryProjection {
  yearsToFreeInvestment: number;
  monthsToFreeInvestment: number;
  recoveryByYear: YearlyRecovery[];
  recoveryComplete: boolean;
  recoveryYear: number;
  fractionalYear: number;
  totalInvestment: number;
  finalRecoveryAmount: number;
}

export interface YearlyRecovery {
  year: number;
  taxBenefits: number;
  operatingCash: number;
  annualTotal: number;
  cumulativeRecovery: number;
  percentRecovered: number;
  isRecoveryYear: boolean;
}

interface TimelineParams {
  // Initial investment
  investorEquity: number;
  hdcUpfrontFee: number;

  // Year 1 special
  year1NetTaxBenefit: number;
  year1OperatingCash: number;

  // Annual (Years 2+)
  annualDepreciation: number;
  effectiveTaxRate: number;
  hdcTaxFeeRate: number;

  // Operating cash flow projections
  baseNOI: number;
  noiGrowthRate: number;
  annualDebtService: number;
  aumFee: number;

  // Optional: OZ tax in Year 5
  includeYear5OZTax: boolean;
  year5OZTaxPayment?: number;
}

/**
 * Calculate the timeline to achieve free investment
 */
export function calculateFreeInvestmentTimeline(params: TimelineParams): RecoveryProjection {
  const totalInvestment = params.investorEquity + params.hdcUpfrontFee;
  let cumulativeRecovery = 0;
  const recoveryByYear: YearlyRecovery[] = [];
  let recoveryAchieved = false;
  let recoveryYear = 0;
  let fractionalYear = 0;

  // Calculate up to 27.5 years (full depreciation period)
  for (let year = 1; year <= 27.5 && !recoveryAchieved; year++) {
    let taxBenefits = 0;
    let operatingCash = 0;

    if (year === 1) {
      // Year 1: Special handling for bonus depreciation
      taxBenefits = params.year1NetTaxBenefit;
      operatingCash = params.year1OperatingCash;
    } else if (year <= 27.5) {
      // Years 2-27.5: Straight-line depreciation
      const grossTaxBenefit = params.annualDepreciation * (params.effectiveTaxRate / 100);
      const hdcFee = grossTaxBenefit * (params.hdcTaxFeeRate / 100);
      taxBenefits = grossTaxBenefit - hdcFee;

      // Calculate operating cash flow
      const noi = params.baseNOI * Math.pow(1 + params.noiGrowthRate / 100, year - 1);
      const cashAfterDebt = Math.max(0, noi - params.annualDebtService);
      const cashAfterAUM = Math.max(0, cashAfterDebt - params.aumFee);

      // During recovery phase, investor gets 100% of operating cash
      operatingCash = cashAfterAUM;
    }

    // Handle Year 5 OZ tax payment if applicable
    if (year === 5 && params.includeYear5OZTax && params.year5OZTaxPayment) {
      // OZ tax reduces Year 5 recovery
      operatingCash -= params.year5OZTaxPayment;
    }

    const annualTotal = taxBenefits + operatingCash;
    const previousCumulative = cumulativeRecovery;
    cumulativeRecovery += annualTotal;

    const percentRecovered = (cumulativeRecovery / totalInvestment) * 100;

    // Check if recovery completes this year
    if (!recoveryAchieved && cumulativeRecovery >= totalInvestment) {
      recoveryAchieved = true;
      recoveryYear = year;

      // Calculate fractional year
      const remainingNeeded = totalInvestment - previousCumulative;
      const fractionOfYear = remainingNeeded / annualTotal;
      fractionalYear = year - 1 + fractionOfYear;
    }

    recoveryByYear.push({
      year,
      taxBenefits,
      operatingCash,
      annualTotal,
      cumulativeRecovery: Math.min(cumulativeRecovery, totalInvestment),
      percentRecovered: Math.min(percentRecovered, 100),
      isRecoveryYear: year === recoveryYear
    });
  }

  // Convert fractional year to years and months
  const yearsToFreeInvestment = recoveryAchieved ? fractionalYear : 99; // 99 = never
  const monthsToFreeInvestment = recoveryAchieved
    ? Math.round((fractionalYear % 1) * 12)
    : 0;

  return {
    yearsToFreeInvestment,
    monthsToFreeInvestment,
    recoveryByYear,
    recoveryComplete: recoveryAchieved,
    recoveryYear: recoveryAchieved ? recoveryYear : 0,
    fractionalYear,
    totalInvestment,
    finalRecoveryAmount: cumulativeRecovery
  };
}

/**
 * Format the timeline for display
 */
export function formatTimelineDisplay(projection: RecoveryProjection): string {
  if (!projection.recoveryComplete) {
    return "Recovery extends beyond depreciation period";
  }

  if (projection.yearsToFreeInvestment <= 1) {
    return "Full investment recovery achieved in Year 1";
  }

  const years = Math.floor(projection.yearsToFreeInvestment);
  const months = projection.monthsToFreeInvestment;

  if (months === 0) {
    return `Full recovery in ${years} years`;
  }

  return `Full recovery in ${years} years, ${months} months`;
}

/**
 * Get a color class based on recovery timeline
 */
export function getTimelineColorClass(yearsToRecovery: number): string {
  if (yearsToRecovery <= 1) return 'recovery-instant'; // green
  if (yearsToRecovery <= 3) return 'recovery-fast';    // blue
  if (yearsToRecovery <= 5) return 'recovery-normal';  // yellow
  if (yearsToRecovery <= 10) return 'recovery-slow';   // orange
  return 'recovery-extended'; // red
}

/**
 * Calculate recovery timeline for different leverage scenarios
 */
export interface LeverageScenario {
  name: string;
  equityPercent: number;
  yearsToRecovery: number;
  year1Coverage: number;
}

export function compareLeverageScenarios(
  baseParams: TimelineParams,
  projectCost: number
): LeverageScenario[] {
  const scenarios: LeverageScenario[] = [];
  const leverageLevels = [
    { name: 'Conservative', percent: 25 },
    { name: 'Standard', percent: 20 },
    { name: 'Optimized', percent: 10 },
    { name: 'Aggressive', percent: 5 }
  ];

  for (const level of leverageLevels) {
    const equity = projectCost * (level.percent / 100);
    const modifiedParams = {
      ...baseParams,
      investorEquity: equity
    };

    const projection = calculateFreeInvestmentTimeline(modifiedParams);

    scenarios.push({
      name: level.name,
      equityPercent: level.percent,
      yearsToRecovery: projection.yearsToFreeInvestment,
      year1Coverage: projection.recoveryByYear[0]?.percentRecovered || 0
    });
  }

  return scenarios;
}

/**
 * Generate insights based on the timeline
 */
export function generateTimelineInsights(projection: RecoveryProjection): string[] {
  const insights: string[] = [];

  if (projection.yearsToFreeInvestment <= 1) {
    insights.push("Investment recovered in Year 1 through tax benefits alone");
  } else if (projection.yearsToFreeInvestment <= 3) {
    insights.push("Excellent recovery timeline - faster than most real estate investments");
  } else if (projection.yearsToFreeInvestment <= 5) {
    insights.push("Solid recovery timeline - full ownership achieved by Year " + Math.ceil(projection.yearsToFreeInvestment));
  }

  // Analyze what drives recovery
  const year1 = projection.recoveryByYear[0];
  if (year1) {
    const taxPortion = (year1.taxBenefits / year1.annualTotal) * 100;
    if (taxPortion > 90) {
      insights.push("Tax benefits drive over 90% of recovery - operational performance provides additional upside");
    } else if (taxPortion > 70) {
      insights.push("Balanced recovery profile with strong tax benefits supplemented by operating cash flow");
    }
  }

  // Year 5 OZ tax impact
  const year5 = projection.recoveryByYear[4];
  if (year5 && year5.operatingCash < 0) {
    insights.push("Year 5 includes OZ tax payment, temporarily affecting recovery pace");
  }

  return insights;
}