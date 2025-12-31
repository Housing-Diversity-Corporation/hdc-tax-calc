/**
 * Depreciation Schedule Generator for HDC Tax Planning
 *
 * Implements empirically-validated 25% cost segregation in Year 1
 * with straight-line depreciation for remaining basis over 27.5 years
 */

import { CalculationParams } from '../../types/taxbenefits';
import { calculateDepreciableBasis } from './depreciableBasisUtility';

export interface DepreciationYear {
  year: number;

  // Depreciation breakdown
  costSegregation: number;      // Year 1 only: 25% of building basis
  bonusDepreciation: number;     // Federal bonus on cost seg portion
  straightLineDepreciation: number; // Annual straight-line amount
  totalDepreciation: number;     // Sum for the year

  // Tax benefit calculation
  federalBenefit: number;        // Federal tax savings
  stateBenefit: number;          // State tax savings (before conformity)
  stateConformityAdjustment: number; // Reduction for non-conforming states
  totalTaxBenefit: number;       // Combined tax savings

  // HDC fee and net
  hdcFee: number;                // 10% of tax benefit
  netBenefit: number;            // After HDC fee

  // Running totals
  cumulativeDepreciation: number;
  cumulativeTaxBenefit: number;
  cumulativeNetBenefit: number;
}

export interface DepreciationSchedule {
  schedule: DepreciationYear[];

  // Summary metrics
  totalDepreciation: number;
  totalTaxBenefit: number;
  totalHDCFees: number;
  totalNetBenefit: number;

  // Key insights
  year1Spike: number;           // Year 1 depreciation amount
  averageAnnualBenefit: number; // Average over hold period
  breakEvenYear: number;         // When cumulative benefits exceed investment
  annualBenefitAfterYear1: number; // Average benefit for years 2+
}

/**
 * Build a detailed depreciation schedule for tax planning
 */
export function buildDepreciationSchedule(
  params: CalculationParams
): DepreciationSchedule {
  const {
    projectCost = 86_000_000,
    predevelopmentCosts = 0,
    landValue = 10_000_000,
    federalTaxRate = 37,
    stateTaxRate = 10.9,
    selectedState = 'NY',
    hdcFeeRate = 0, // Fee removed per IMPL-7.0-014
    holdPeriod = 10,
    yearOneDepreciationPct = 20, // Cost segregation percentage (updated to 20% per 2025 standards)
    investorEquityPct = 20, // Investor equity percentage
    interestReserveAmount = 0, // Interest reserve from lease-up period
  } = params;

  // Calculate depreciable basis using shared utility
  // CRITICAL OZ RULE: Excludes land AND investor equity (from Qualified Capital Gains)
  const buildingBasis = calculateDepreciableBasis({
    projectCost,
    predevelopmentCosts,
    landValue,
    investorEquityPct,
    interestReserve: interestReserveAmount
  });
  const schedule: DepreciationYear[] = [];

  let cumulativeDepreciation = 0;
  let cumulativeTaxBenefit = 0;
  let cumulativeNetBenefit = 0;

  // Year 1: Cost segregation with bonus depreciation
  const costSegAmount = buildingBasis * (yearOneDepreciationPct / 100);
  const year1BonusDepreciation = costSegAmount; // 100% bonus on segregated portion

  // Calculate Year 1 benefits
  const year1FederalBenefit = year1BonusDepreciation * (federalTaxRate / 100);
  const year1StateBenefit = calculateStateBenefit(
    year1BonusDepreciation,
    stateTaxRate,
    selectedState,
    true // bonus depreciation
  );
  const year1TotalBenefit = year1FederalBenefit + year1StateBenefit.netBenefit;
  const year1HDCFee = year1TotalBenefit * (hdcFeeRate / 100);
  const year1NetBenefit = year1TotalBenefit - year1HDCFee;

  cumulativeDepreciation += year1BonusDepreciation;
  cumulativeTaxBenefit += year1TotalBenefit;
  cumulativeNetBenefit += year1NetBenefit;

  schedule.push({
    year: 1,
    costSegregation: costSegAmount,
    bonusDepreciation: year1BonusDepreciation,
    straightLineDepreciation: 0,
    totalDepreciation: year1BonusDepreciation,
    federalBenefit: year1FederalBenefit,
    stateBenefit: year1StateBenefit.grossBenefit,
    stateConformityAdjustment: year1StateBenefit.conformityAdjustment,
    totalTaxBenefit: year1TotalBenefit,
    hdcFee: year1HDCFee,
    netBenefit: year1NetBenefit,
    cumulativeDepreciation,
    cumulativeTaxBenefit,
    cumulativeNetBenefit
  });

  // Years 2-10+: Straight-line depreciation on remaining basis
  const remainingBasis = buildingBasis - costSegAmount;
  const annualStraightLine = remainingBasis / 27.5; // 27.5 years for residential

  for (let year = 2; year <= Math.min(holdPeriod, 27.5); year++) {
    // For years beyond 10, only calculate if within hold period
    if (year > 10 && year > holdPeriod) break;

    const federalBenefit = annualStraightLine * (federalTaxRate / 100);
    const stateBenefit = calculateStateBenefit(
      annualStraightLine,
      stateTaxRate,
      selectedState,
      false // no bonus depreciation after year 1
    );
    const totalBenefit = federalBenefit + stateBenefit.netBenefit;
    const hdcFee = totalBenefit * (hdcFeeRate / 100);
    const netBenefit = totalBenefit - hdcFee;

    cumulativeDepreciation += annualStraightLine;
    cumulativeTaxBenefit += totalBenefit;
    cumulativeNetBenefit += netBenefit;

    schedule.push({
      year,
      costSegregation: 0,
      bonusDepreciation: 0,
      straightLineDepreciation: annualStraightLine,
      totalDepreciation: annualStraightLine,
      federalBenefit,
      stateBenefit: stateBenefit.grossBenefit,
      stateConformityAdjustment: stateBenefit.conformityAdjustment,
      totalTaxBenefit: totalBenefit,
      hdcFee,
      netBenefit,
      cumulativeDepreciation,
      cumulativeTaxBenefit,
      cumulativeNetBenefit
    });
  }

  // Calculate summary metrics
  const totalDepreciation = schedule.reduce((sum, year) => sum + year.totalDepreciation, 0);
  const totalTaxBenefit = schedule.reduce((sum, year) => sum + year.totalTaxBenefit, 0);
  const totalHDCFees = schedule.reduce((sum, year) => sum + year.hdcFee, 0);
  const totalNetBenefit = schedule.reduce((sum, year) => sum + year.netBenefit, 0);

  // Calculate average annual benefit for years 2+ (for break-even analysis)
  const years2PlusBenefits = schedule.filter(y => y.year > 1).reduce((sum, y) => sum + y.netBenefit, 0);
  const years2PlusCount = schedule.filter(y => y.year > 1).length;
  const annualBenefitAfterYear1 = years2PlusCount > 0 ? years2PlusBenefits / years2PlusCount : 0;

  // Note: Break-even calculation is done in main calculations.ts to avoid duplication
  // The actual free investment analysis should come from the main calculator

  return {
    schedule,
    totalDepreciation,
    totalTaxBenefit,
    totalHDCFees,
    totalNetBenefit,
    year1Spike: year1BonusDepreciation,
    averageAnnualBenefit: totalNetBenefit / Math.min(holdPeriod, schedule.length),
    breakEvenYear: 0, // This will be populated from main calculations
    annualBenefitAfterYear1
  };
}

/**
 * Calculate state tax benefit with conformity adjustments
 */
function calculateStateBenefit(
  depreciation: number,
  stateTaxRate: number,
  state: string,
  isBonusDepreciation: boolean
): { grossBenefit: number; conformityAdjustment: number; netBenefit: number } {
  // State conformity rules for bonus depreciation
  const STATE_BONUS_CONFORMITY: Record<string, number> = {
    'CA': 0.0,    // California doesn't conform to federal bonus
    'NY': 0.5,    // New York partial conformity
    'PA': 0.0,    // Pennsylvania doesn't conform
    'NJ': 0.3,    // New Jersey limited conformity
    'IL': 0.0,    // Illinois doesn't conform
    'DEFAULT': 1.0 // Most states conform fully
  };

  const conformityRate = isBonusDepreciation
    ? (STATE_BONUS_CONFORMITY[state] ?? STATE_BONUS_CONFORMITY.DEFAULT)
    : 1.0; // All states accept straight-line depreciation

  const grossBenefit = depreciation * (stateTaxRate / 100);
  const netBenefit = grossBenefit * conformityRate;
  const conformityAdjustment = grossBenefit - netBenefit;

  return {
    grossBenefit,
    conformityAdjustment,
    netBenefit
  };
}

/**
 * Export utility function to format depreciation schedule for display
 */
export function formatDepreciationSchedule(
  schedule: DepreciationSchedule
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  let output = 'DEPRECIATION SCHEDULE\n';
  output += '=' .repeat(80) + '\n\n';

  output += 'Year | Depreciation | Tax Benefit | HDC Fee | Net Benefit | Cumulative\n';
  output += '-' .repeat(80) + '\n';

  schedule.schedule.forEach(year => {
    output += `${year.year.toString().padStart(4)} | `;
    output += `${formatter.format(year.totalDepreciation).padStart(12)} | `;
    output += `${formatter.format(year.totalTaxBenefit).padStart(11)} | `;
    output += `${formatter.format(year.hdcFee).padStart(8)} | `;
    output += `${formatter.format(year.netBenefit).padStart(11)} | `;
    output += `${formatter.format(year.cumulativeNetBenefit).padStart(12)}\n`;
  });

  output += '-' .repeat(80) + '\n';
  output += `TOTAL| ${formatter.format(schedule.totalDepreciation).padStart(12)} | `;
  output += `${formatter.format(schedule.totalTaxBenefit).padStart(11)} | `;
  output += `${formatter.format(schedule.totalHDCFees).padStart(8)} | `;
  output += `${formatter.format(schedule.totalNetBenefit).padStart(11)}\n`;

  output += '\n' + '=' .repeat(80) + '\n';
  output += `Year 1 Spike: ${formatter.format(schedule.year1Spike)}\n`;
  output += `Average Annual Benefit: ${formatter.format(schedule.averageAnnualBenefit)}\n`;
  output += `Break-Even Year: ${schedule.breakEvenYear || 'Beyond hold period'}\n`;

  return output;
}