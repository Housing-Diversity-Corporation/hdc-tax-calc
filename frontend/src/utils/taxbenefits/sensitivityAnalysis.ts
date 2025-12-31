/**
 * Sensitivity analysis utilities for HDC Calculator
 * Analyzes how changes in key variables affect returns
 */

import { CalculationParams, InvestorAnalysisResults } from '../../types/taxbenefits';
import { calculateFullInvestorAnalysis } from './calculations';

export interface SensitivityScenario {
  name: string;
  description: string;
  results: InvestorAnalysisResults;
  variance: number; // Percentage change from base case
}

export interface SensitivityAnalysisResults {
  baseCase: InvestorAnalysisResults;
  scenarios: SensitivityScenario[];
  keyMetrics: {
    metric: string;
    baseValue: number;
    bestCase: number;
    worstCase: number;
    range: number;
  }[];
}

/**
 * Run sensitivity analysis on NOI
 * @param baseParams - Base calculation parameters
 * @param variancePercent - Percentage to vary (default ±10%)
 * @returns Sensitivity analysis results
 */
export const runNOISensitivity = (
  baseParams: CalculationParams,
  variancePercent = 10
): SensitivityAnalysisResults => {
  const baseCase = calculateFullInvestorAnalysis(baseParams);
  
  const scenarios: SensitivityScenario[] = [
    {
      name: 'Optimistic NOI',
      description: `NOI ${variancePercent}% higher`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        yearOneNOI: baseParams.yearOneNOI * (1 + variancePercent / 100)
      }),
      variance: variancePercent
    },
    {
      name: 'Pessimistic NOI',
      description: `NOI ${variancePercent}% lower`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        yearOneNOI: baseParams.yearOneNOI * (1 - variancePercent / 100)
      }),
      variance: -variancePercent
    }
  ];
  
  return compileSensitivityResults(baseCase, scenarios);
};

/**
 * Run sensitivity analysis on exit cap rate
 * @param baseParams - Base calculation parameters
 * @param basisPoints - Basis points to vary (default ±50bp)
 * @returns Sensitivity analysis results
 */
export const runExitCapSensitivity = (
  baseParams: CalculationParams,
  basisPoints = 50
): SensitivityAnalysisResults => {
  const baseCase = calculateFullInvestorAnalysis(baseParams);
  const bpChange = basisPoints / 100;
  
  const scenarios: SensitivityScenario[] = [
    {
      name: 'Lower Exit Cap',
      description: `Exit cap ${basisPoints}bp lower (higher value)`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        exitCapRate: Math.max(0.1, baseParams.exitCapRate - bpChange)
      }),
      variance: -basisPoints / 10
    },
    {
      name: 'Higher Exit Cap',
      description: `Exit cap ${basisPoints}bp higher (lower value)`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        exitCapRate: baseParams.exitCapRate + bpChange
      }),
      variance: basisPoints / 10
    }
  ];
  
  return compileSensitivityResults(baseCase, scenarios);
};

/**
 * Run sensitivity analysis on growth rates
 * @param baseParams - Base calculation parameters
 * @param variancePercent - Percentage points to vary (default ±1%)
 * @returns Sensitivity analysis results
 */
export const runGrowthSensitivity = (
  baseParams: CalculationParams,
  variancePercent = 1
): SensitivityAnalysisResults => {
  const baseCase = calculateFullInvestorAnalysis(baseParams);
  
  const scenarios: SensitivityScenario[] = [
    {
      name: 'Higher Growth',
      description: `Revenue growth ${variancePercent}% higher`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        revenueGrowth: baseParams.revenueGrowth + variancePercent
      }),
      variance: variancePercent
    },
    {
      name: 'Lower Growth',
      description: `Revenue growth ${variancePercent}% lower`,
      results: calculateFullInvestorAnalysis({
        ...baseParams,
        revenueGrowth: baseParams.revenueGrowth - variancePercent
      }),
      variance: -variancePercent
    }
  ];
  
  return compileSensitivityResults(baseCase, scenarios);
};

/**
 * Run comprehensive sensitivity analysis
 * @param baseParams - Base calculation parameters
 * @returns Combined sensitivity analysis results
 */
export const runComprehensiveSensitivity = (
  baseParams: CalculationParams
): Record<string, SensitivityAnalysisResults> => {
  return {
    noi: runNOISensitivity(baseParams),
    exitCap: runExitCapSensitivity(baseParams),
    growth: runGrowthSensitivity(baseParams)
  };
};

/**
 * Compile sensitivity results into structured format
 * @param baseCase - Base case results
 * @param scenarios - Array of sensitivity scenarios
 * @returns Structured sensitivity analysis results
 */
const compileSensitivityResults = (
  baseCase: InvestorAnalysisResults,
  scenarios: SensitivityScenario[]
): SensitivityAnalysisResults => {
  const allResults = [baseCase, ...scenarios.map(s => s.results)];
  
  const keyMetrics = [
    {
      metric: 'IRR',
      baseValue: baseCase.irr,
      bestCase: Math.max(...allResults.map(r => r.irr)),
      worstCase: Math.min(...allResults.map(r => r.irr)),
      range: Math.max(...allResults.map(r => r.irr)) - Math.min(...allResults.map(r => r.irr))
    },
    {
      metric: 'Multiple',
      baseValue: baseCase.multiple,
      bestCase: Math.max(...allResults.map(r => r.multiple)),
      worstCase: Math.min(...allResults.map(r => r.multiple)),
      range: Math.max(...allResults.map(r => r.multiple)) - Math.min(...allResults.map(r => r.multiple))
    },
    {
      metric: 'Total Returns',
      baseValue: baseCase.totalReturns,
      bestCase: Math.max(...allResults.map(r => r.totalReturns)),
      worstCase: Math.min(...allResults.map(r => r.totalReturns)),
      range: Math.max(...allResults.map(r => r.totalReturns)) - Math.min(...allResults.map(r => r.totalReturns))
    }
  ];
  
  return {
    baseCase,
    scenarios,
    keyMetrics
  };
};

/**
 * Generate sensitivity table for a specific variable
 * @param baseParams - Base calculation parameters
 * @param variable - Variable to test ('noi', 'exitCap', 'growth')
 * @param ranges - Array of variation percentages
 * @returns Array of results for each variation
 */
export const generateSensitivityTable = (
  baseParams: CalculationParams,
  variable: 'noi' | 'exitCap' | 'growth',
  ranges: number[] = [-20, -10, -5, 0, 5, 10, 20]
): Array<{ variance: number; irr: number; multiple: number }> => {
  return ranges.map(variance => {
    let adjustedParams = { ...baseParams };
    
    switch (variable) {
      case 'noi':
        adjustedParams.yearOneNOI = baseParams.yearOneNOI * (1 + variance / 100);
        break;
      case 'exitCap':
        adjustedParams.exitCapRate = baseParams.exitCapRate * (1 + variance / 100);
        break;
      case 'growth':
        adjustedParams.revenueGrowth = baseParams.revenueGrowth + variance;
        break;
    }
    
    const results = calculateFullInvestorAnalysis(adjustedParams);
    
    return {
      variance,
      irr: results.irr,
      multiple: results.multiple
    };
  });
};