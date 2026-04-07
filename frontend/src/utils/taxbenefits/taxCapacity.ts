/**
 * Tax Capacity Models for REP and Non-REP Investors
 *
 * Implements §461(l) limitation tracking for REPs and
 * unlimited passive loss capacity modeling for Non-REPs
 */

import {
  CalculationParams,
  REPTaxCapacityModel,
  NonREPCapacityModel
} from '../../types/taxbenefits';
import { DepreciationSchedule } from './depreciationSchedule';
import { SECTION_461L_LIMITS } from './investorTaxUtilization';

/**
 * Calculate Real Estate Professional tax capacity with §461(l) limitations
 *
 * REPs can offset ordinary income with rental losses, but are subject to
 * the §461(l) excess business loss limitation against W-2 income
 */
export function calculateREPCapacity(
  params: CalculationParams,
  depreciationSchedule: DepreciationSchedule
): REPTaxCapacityModel {
  const {
    w2Income = 0,
    businessIncome = 0,
    holdPeriod = 10
  } = params;

  // Use MFJ limit as default (most common for high-income investors)
  const section461lLimit = SECTION_461L_LIMITS.MFJ;

  const annualLimitations = [];
  let nolCarryforward = 0;

  // Process each year of the depreciation schedule
  for (let i = 0; i < Math.min(depreciationSchedule.schedule.length, holdPeriod); i++) {
    const yearData = depreciationSchedule.schedule[i];
    const year = yearData.year;

    // Total losses available this year
    const totalLosses = yearData.totalDepreciation;

    // REPs can use losses against business/rental income without limit
    const businessOffset = Math.min(businessIncome, totalLosses);
    const remainingLosses = totalLosses - businessOffset;

    // Against W-2 income, subject to §461(l) limitation
    const w2Offset = Math.min(remainingLosses, section461lLimit);
    const excessLoss = Math.max(0, remainingLosses - section461lLimit);

    // Excess becomes NOL carryforward
    nolCarryforward += excessLoss;

    annualLimitations.push({
      year,
      w2Income,
      section461lLimit,
      allowedLoss: businessOffset + w2Offset,
      disallowedLoss: excessLoss,
      nolGenerated: excessLoss,
      nolCarryforward
    });
  }

  // Calculate total capacity metrics
  const currentYearData = annualLimitations[0] || {
    allowedLoss: 0,
    nolCarryforward: 0
  };

  // IRA conversion capacity is limited to current year allowed losses
  // (can't use NOLs for IRA conversions as they create ordinary income)
  const iraConversionCapacity = Math.min(
    currentYearData.allowedLoss,
    section461lLimit // Can't exceed annual limit for ordinary income offset
  );

  return {
    annualLimitations,
    totalCapacity: {
      currentYear: currentYearData.allowedLoss,
      nolBank: nolCarryforward,
      iraConversionCapacity
    }
  };
}

/**
 * Calculate Non-REP passive investor capacity with unlimited passive gain offset
 *
 * Non-REPs have NO LIMIT on offsetting passive gains with passive losses,
 * but cannot offset ordinary income (except $25K special allowance)
 */
export function calculateNonREPCapacity(
  params: CalculationParams,
  depreciationSchedule: DepreciationSchedule
): NonREPCapacityModel {
  const {
    passiveIncome = 0,
    ltCapitalGainsRate = 20,
    niitRate = 3.8,
    stateCapitalGainsRate = 10.9
  } = params;

  // Total passive losses available over hold period
  const totalPassiveLosses = depreciationSchedule.totalDepreciation;

  // Combined capital gains tax rate
  const totalCapGainsRate = (ltCapitalGainsRate + niitRate + stateCapitalGainsRate) / 100;

  // Analyze common scenarios for Wall Street professionals
  const scenarios = [
    1_000_000,   // Small gain
    5_000_000,   // Medium gain
    10_000_000,  // Large gain
    25_000_000,  // Very large gain
    50_000_000,  // Massive gain
    100_000_000  // Ultra-high net worth
  ].map(gainAmount => {
    const lossesUsed = Math.min(gainAmount, totalPassiveLosses);
    const percentCovered = (lossesUsed / gainAmount) * 100;
    const taxSavings = lossesUsed * totalCapGainsRate;

    return {
      gainAmount,
      percentCovered,
      taxSavings
    };
  });

  return {
    totalPassiveLosses,
    unlimitedCapacity: true, // Key differentiator!
    scenarioAnalysis: scenarios
  };
}

/**
 * Generate recommendations based on investor type and capacity
 */
export function generateTaxCapacityRecommendations(
  isREP: boolean,
  capacity: REPTaxCapacityModel | NonREPCapacityModel,
  params: CalculationParams
): string[] {
  const recommendations: string[] = [];

  if (isREP) {
    const repCapacity = capacity as REPTaxCapacityModel;

    // REP-specific recommendations
    if (repCapacity.totalCapacity.nolBank > 0) {
      recommendations.push(
        `You have $${(repCapacity.totalCapacity.nolBank / 1_000_000).toFixed(1)}M ` +
        `in NOL carryforward - consider large asset sales or business income to utilize`
      );
    }

    if (repCapacity.totalCapacity.iraConversionCapacity > 0) {
      recommendations.push(
        `Optimal IRA→Roth conversion capacity: ` +
        `$${(repCapacity.totalCapacity.iraConversionCapacity / 1_000).toFixed(0)}K this year`
      );
    }

    if (params.w2Income && params.w2Income > 2_000_000) {
      recommendations.push(
        `High W-2 income limits your annual benefit to $626K - ` +
        `excess losses become NOLs for future use`
      );
    }

    recommendations.push(
      `Consider timing strategies: defer income to low-income years ` +
      `or accelerate deductions to high-income years`
    );

  } else {
    const nonRepCapacity = capacity as NonREPCapacityModel;

    // Non-REP recommendations
    recommendations.push(
      `UNLIMITED capacity advantage: You can offset ` +
      `$${(nonRepCapacity.totalPassiveLosses / 1_000_000).toFixed(1)}M ` +
      `in passive gains with NO annual limit`
    );

    const scenario50M = nonRepCapacity.scenarioAnalysis.find(s => s.gainAmount === 50_000_000);
    if (scenario50M && scenario50M.percentCovered > 50) {
      recommendations.push(
        `You could eliminate ${scenario50M.percentCovered.toFixed(0)}% ` +
        `of taxes on a $50M gain - saving $${(scenario50M.taxSavings / 1_000_000).toFixed(1)}M`
      );
    }

    if (params.passiveIncome && params.passiveIncome > 0) {
      const annualSavings = params.passiveIncome * 0.348; // Typical cap gains rate
      recommendations.push(
        `Your passive income of $${(params.passiveIncome / 1_000).toFixed(0)}K ` +
        `can be fully offset, saving $${(annualSavings / 1_000).toFixed(0)}K annually`
      );
    }

    recommendations.push(
      `Consider generating more passive income through REITs, ` +
      `private equity, or hedge funds to maximize loss utilization`
    );

    recommendations.push(
      `No §461(l) limitation applies - this is your key advantage over REPs`
    );
  }

  return recommendations;
}

/**
 * Calculate optimal strategy based on investor profile
 */
export function calculateOptimalStrategy(
  params: CalculationParams,
  depreciationSchedule: DepreciationSchedule
): {
  strategy: string;
  keyBenefit: string;
  annualCapacity: number;
  totalCapacity: number;
  recommendations: string[];
} {
  const isREP = params.investorTrack === 'rep';

  if (isREP) {
    const capacity = calculateREPCapacity(params, depreciationSchedule);

    return {
      strategy: 'Maximize annual utilization within §461(l) limits',
      keyBenefit: 'Offset W-2 and business income up to $626K/year',
      annualCapacity: capacity.totalCapacity.currentYear,
      totalCapacity: capacity.totalCapacity.currentYear + capacity.totalCapacity.nolBank,
      recommendations: generateTaxCapacityRecommendations(true, capacity, params)
    };
  } else {
    const capacity = calculateNonREPCapacity(params, depreciationSchedule);

    return {
      strategy: 'Leverage unlimited passive loss capacity',
      keyBenefit: 'NO LIMIT on offsetting passive gains',
      annualCapacity: capacity.totalPassiveLosses, // Can use it all at once!
      totalCapacity: capacity.totalPassiveLosses,
      recommendations: generateTaxCapacityRecommendations(false, capacity, params)
    };
  }
}