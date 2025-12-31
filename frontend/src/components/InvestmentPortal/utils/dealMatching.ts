// Stub file for deal matching utilities - TODO: implement

import { CalculatorConfiguration } from '../../../services/calculatorService';

export interface DealMatchScore {
  dealId: string;
  deal: CalculatorConfiguration;
  meetsGoal: boolean;
  fitScore: number;
  estimatedInvestment: number;
  estimatedOffsetAmount: number;
}

export function calculateDealMatchScore(
  _deal: CalculatorConfiguration,
  _investorGoal: number
): DealMatchScore {
  // TODO: implement
  return {
    dealId: '',
    deal: _deal,
    meetsGoal: false,
    fitScore: 0,
    estimatedInvestment: 0,
    estimatedOffsetAmount: 0,
  };
}
