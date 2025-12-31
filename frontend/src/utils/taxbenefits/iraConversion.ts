/**
 * IRA Conversion Planning for REP Investors
 *
 * Optimizes Traditional IRA to Roth IRA conversions using HDC tax losses
 * within §461(l) capacity constraints
 */

import {
  CalculationParams,
  REPTaxCapacityModel,
  IRAConversionPlan
} from '../../types/taxbenefits';

/**
 * Optimize IRA to Roth conversion schedule
 *
 * Key strategy: Convert maximum amount each year within available tax capacity
 * to minimize lifetime taxes and maximize tax-free Roth growth
 */
export function optimizeIRAConversion(
  params: CalculationParams,
  repCapacity: REPTaxCapacityModel
): IRAConversionPlan | undefined {
  const {
    iraBalance = 0,
    effectiveTaxRate = 47.9, // Federal + State combined
    holdPeriod = 10
  } = params;

  // No IRA balance to convert
  if (!iraBalance || iraBalance === 0) {
    return undefined;
  }

  // Non-REPs typically don't benefit from IRA conversions with passive losses
  if (params.investorTrack !== 'rep') {
    return undefined;
  }

  const schedule = [];
  let remainingIRA = iraBalance;
  let rothBalance = 0;
  let totalTaxSaved = 0;

  // Target conversion period (typically 5-7 years for optimal tax efficiency)
  const targetYears = Math.min(5, holdPeriod);

  // Annual Roth growth assumption (7% historical average)
  const ROTH_GROWTH_RATE = 0.07;

  // Process each year
  for (let year = 1; year <= targetYears && remainingIRA > 0; year++) {
    // Get available capacity for this year
    const yearCapacity = repCapacity.annualLimitations[year - 1];
    if (!yearCapacity) break;

    // Calculate optimal conversion amount
    // Strategy: Use full IRA conversion capacity, but spread evenly if beneficial
    const evenSpread = remainingIRA / (targetYears - year + 1);
    const capacityLimit = yearCapacity.allowedLoss;

    // Choose smaller of: capacity limit, even spread, or remaining balance
    const conversionAmount = Math.min(
      capacityLimit,
      evenSpread,
      remainingIRA
    );

    // Tax that would be owed without HDC losses
    const taxWithoutHDC = conversionAmount * (effectiveTaxRate / 100);

    // HDC losses offset the conversion income
    const hdcLossOffset = Math.min(conversionAmount, capacityLimit);
    const taxSaved = hdcLossOffset * (effectiveTaxRate / 100);

    // Net tax after HDC offset
    const netTax = taxWithoutHDC - taxSaved;

    // Update balances
    remainingIRA -= conversionAmount;
    rothBalance = (rothBalance * (1 + ROTH_GROWTH_RATE)) + conversionAmount;
    totalTaxSaved += taxSaved;

    schedule.push({
      year,
      recommendedConversion: conversionAmount,
      hdcLossOffset: hdcLossOffset,
      taxSaved: taxSaved,
      rothBalance: rothBalance
    });
  }

  // Calculate total converted
  const totalConverted = iraBalance - remainingIRA;

  // Project Roth value at year 30 (typical retirement timeframe)
  const yearsToRetirement = 30;
  const remainingGrowthYears = yearsToRetirement - targetYears;
  const year30RothValue = rothBalance * Math.pow(1 + ROTH_GROWTH_RATE, remainingGrowthYears);

  return {
    schedule,
    totalConverted,
    totalTaxSaved,
    year30RothValue
  };
}

/**
 * Calculate the lifetime value of Roth conversion
 */
export function calculateRothConversionValue(
  conversionPlan: IRAConversionPlan,
  params: CalculationParams
): {
  immediateValue: number;      // Tax saved on conversion
  futureValue: number;         // Tax-free growth value
  breakEvenYear: number;       // When Roth outperforms Traditional
  lifetimeAdvantage: number;   // Total lifetime benefit
} {
  const {
    effectiveTaxRate = 47.9,
    federalTaxRate = 37
  } = params;

  // Immediate value is the tax saved on conversion
  const immediateValue = conversionPlan.totalTaxSaved;

  // Future value is the tax savings on distributions
  // Roth: 0% tax on distributions
  // Traditional: ordinary income tax on distributions
  const projectedDistributions = conversionPlan.year30RothValue;
  const taxOnTraditionalDistributions = projectedDistributions * (federalTaxRate / 100);
  const futureValue = taxOnTraditionalDistributions;

  // Break-even analysis
  // Roth wins when: tax-free growth > upfront tax cost
  // With HDC losses offsetting conversion tax, break-even is immediate!
  const breakEvenYear = conversionPlan.totalTaxSaved > 0 ? 1 : 5;

  // Lifetime advantage includes both immediate and future benefits
  const lifetimeAdvantage = immediateValue + futureValue;

  return {
    immediateValue,
    futureValue,
    breakEvenYear,
    lifetimeAdvantage
  };
}

/**
 * Generate IRA conversion recommendations
 */
export function generateIRAConversionRecommendations(
  conversionPlan: IRAConversionPlan | undefined,
  params: CalculationParams
): string[] {
  const recommendations: string[] = [];

  if (!conversionPlan) {
    if (params.investorTrack === 'rep' && !params.iraBalance) {
      recommendations.push(
        'Add your Traditional IRA balance to see conversion opportunities'
      );
    }
    if (params.investorTrack !== 'rep') {
      recommendations.push(
        'IRA conversions are most beneficial for REPs who can offset ordinary income'
      );
    }
    return recommendations;
  }

  // Calculate conversion metrics
  const conversionMetrics = calculateRothConversionValue(conversionPlan, params);

  // Primary recommendation
  const totalIRA = params.iraBalance || 0;
  const conversionRate = (conversionPlan.totalConverted / totalIRA) * 100;

  recommendations.push(
    `Convert $${(conversionPlan.totalConverted / 1_000_000).toFixed(1)}M ` +
    `over ${conversionPlan.schedule.length} years (${conversionRate.toFixed(0)}% of IRA)`
  );

  // Tax savings highlight
  recommendations.push(
    `Save $${(conversionPlan.totalTaxSaved / 1_000).toFixed(0)}K ` +
    `in conversion taxes using HDC losses`
  );

  // Long-term value
  recommendations.push(
    `30-year Roth value: $${(conversionPlan.year30RothValue / 1_000_000).toFixed(1)}M ` +
    `(all tax-free distributions)`
  );

  // Break-even insight
  if (conversionMetrics.breakEvenYear === 1) {
    recommendations.push(
      `Immediate win: HDC losses make conversion essentially "free"`
    );
  }

  // Timing optimization
  const firstYearAmount = conversionPlan.schedule[0]?.recommendedConversion || 0;
  if (firstYearAmount > 0) {
    recommendations.push(
      `Year 1 optimal conversion: $${(firstYearAmount / 1_000).toFixed(0)}K`
    );
  }

  // Estate planning benefit
  if (conversionPlan.year30RothValue > 10_000_000) {
    recommendations.push(
      `Estate planning bonus: Roth IRAs have no RMDs and pass tax-free to heirs`
    );
  }

  return recommendations;
}

/**
 * Compare conversion strategies
 */
export function compareConversionStrategies(
  params: CalculationParams,
  repCapacity: REPTaxCapacityModel
): {
  aggressive: IRAConversionPlan | undefined;
  balanced: IRAConversionPlan | undefined;
  conservative: IRAConversionPlan | undefined;
  recommendation: string;
} {
  const iraBalance = params.iraBalance || 0;
  if (!iraBalance) {
    return {
      aggressive: undefined,
      balanced: undefined,
      conservative: undefined,
      recommendation: 'No IRA balance to analyze'
    };
  }

  // Aggressive: Convert in 3 years
  const aggressiveParams = { ...params, holdPeriod: 3 };
  const aggressive = optimizeIRAConversion(aggressiveParams, repCapacity);

  // Balanced: Convert in 5 years (default)
  const balanced = optimizeIRAConversion(params, repCapacity);

  // Conservative: Convert in 7 years
  const conservativeParams = { ...params, holdPeriod: 7 };
  const conservative = optimizeIRAConversion(conservativeParams, repCapacity);

  // Determine best strategy
  let recommendation = '';
  if (aggressive && aggressive.totalTaxSaved > (balanced?.totalTaxSaved || 0)) {
    recommendation = 'Aggressive (3-year) maximizes tax savings with available HDC losses';
  } else if (conservative && conservative.totalConverted > (balanced?.totalConverted || 0)) {
    recommendation = 'Conservative (7-year) allows more complete conversion';
  } else {
    recommendation = 'Balanced (5-year) provides optimal mix of speed and tax efficiency';
  }

  return {
    aggressive,
    balanced,
    conservative,
    recommendation
  };
}