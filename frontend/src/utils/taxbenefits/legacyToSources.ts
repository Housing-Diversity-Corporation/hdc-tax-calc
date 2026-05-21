/**
 * IMPL-188: legacyToSources migration
 *
 * Converts legacy fixed-field CalculationParams capital structure
 * to a CapitalSource[] array (composable model).
 *
 * Used for:
 *   1. IMPL-189 parallel validation (prove new composable engine
 *      produces identical output to legacy fixed-field engine)
 *   2. IMPL-191 config migration (load old saved deals in the
 *      new composable UI)
 *
 * Zero behavior change. Pure function. Engine still uses legacy
 * params today — this is reference data for the new architecture.
 */

import type { CalculationParams, CapitalSource } from '../../types/taxbenefits';

export function legacyToSources(
  params: CalculationParams,
  effectiveProjectCost: number,
  lihtcEligibleBasis: number,
): CapitalSource[] {
  const sources: CapitalSource[] = [];
  let id = 1;
  const nextId = () => `legacy-${id++}`;

  // Senior Debt — hard pay, in DSCR
  if ((params.seniorDebtPct ?? 0) > 0) {
    sources.push({
      id: nextId(),
      label: 'Senior Debt',
      sourceType: 'senior_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.seniorDebtPct,
      amount: effectiveProjectCost * ((params.seniorDebtPct ?? 0) / 100),
      rate: params.seniorDebtRate ?? 0,
      hardPayPct: 100,
      softPayPct: 0,
      pikPct: 0,
      amortYears: params.seniorDebtAmortization,
      ioPeriodYears: params.seniorDebtIOYears ?? 0,
      isEquity: false,
      isGrant: false,
      dscrIncluded: true,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 1,
      includeIn100PctSum: true,
    });
  }

  // Private Activity Bonds — hard pay, in DSCR, sized from eligible basis
  if ((params.pabPctOfEligibleBasis ?? 0) > 0) {
    sources.push({
      id: nextId(),
      label: 'Private Activity Bonds (PAB)',
      sourceType: 'pab',
      amountBasis: 'pct_eligible_basis',
      amountPct: params.pabPctOfEligibleBasis,
      amount: lihtcEligibleBasis * ((params.pabPctOfEligibleBasis ?? 0) / 100),
      rate: params.pabRate ?? 0,
      hardPayPct: 100,
      softPayPct: 0,
      pikPct: 0,
      amortYears: params.pabAmortization,
      ioPeriodYears: params.pabIOYears ?? 0,
      isEquity: false,
      isGrant: false,
      dscrIncluded: true,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 2,
      includeIn100PctSum: true,
    });
  }

  // Philanthropic Debt — soft, not in DSCR; optional forgiveness at exit
  if ((params.philanthropicDebtPct ?? 0) > 0) {
    const hasCurrentPay = params.philCurrentPayEnabled ?? false;
    const currentPayPct = hasCurrentPay ? (params.philCurrentPayPct ?? 25) : 0;
    sources.push({
      id: nextId(),
      label: 'Philanthropic Debt',
      sourceType: 'soft_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.philanthropicDebtPct,
      amount: effectiveProjectCost * ((params.philanthropicDebtPct ?? 0) / 100),
      rate: params.philanthropicDebtRate ?? 0,
      hardPayPct: 0,
      softPayPct: currentPayPct,
      pikPct: 100 - currentPayPct,
      amortYears: params.philDebtAmortization,
      ioPeriodYears: 0,
      isEquity: false,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: params.philDebtForgivenessEnabled ?? false,
      forgivenessTriggerType: 'silent_expected',
      affectsEligibleBasis: false,
      waterfallPriority: 3,
      includeIn100PctSum: true,
    });
  }

  // LP Investor Equity
  if ((params.investorEquityPct ?? 0) > 0) {
    sources.push({
      id: nextId(),
      label: 'Investor Equity',
      sourceType: 'lp_equity',
      amountBasis: 'pct_project_cost',
      amountPct: params.investorEquityPct,
      amount: effectiveProjectCost * ((params.investorEquityPct ?? 0) / 100),
      rate: 0,
      hardPayPct: 0,
      softPayPct: 0,
      pikPct: 0,
      isEquity: true,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 8,
      includeIn100PctSum: true,
    });
  }

  // Philanthropic Equity (grants)
  if ((params.philanthropicEquityPct ?? 0) > 0) {
    sources.push({
      id: nextId(),
      label: 'Philanthropic Equity',
      sourceType: 'grant',
      amountBasis: 'pct_project_cost',
      amountPct: params.philanthropicEquityPct,
      amount: effectiveProjectCost * ((params.philanthropicEquityPct ?? 0) / 100),
      rate: 0,
      hardPayPct: 0,
      softPayPct: 0,
      pikPct: 0,
      isEquity: false,
      isGrant: true,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 9,
      includeIn100PctSum: true,
    });
  }

  // HDC Sub-Debt — PIK with optional current pay
  if ((params.hdcSubDebtPct ?? 0) > 0) {
    const hasCurrentPay = params.pikCurrentPayEnabled ?? false;
    const cpPct = hasCurrentPay ? (params.pikCurrentPayPct ?? 0) : 0;
    sources.push({
      id: nextId(),
      label: 'HDC Sub-Debt',
      sourceType: 'pik_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.hdcSubDebtPct,
      amount: effectiveProjectCost * ((params.hdcSubDebtPct ?? 0) / 100),
      rate: params.hdcSubDebtPikRate ?? 0,
      hardPayPct: 0,
      softPayPct: cpPct,
      pikPct: 100 - cpPct,
      isEquity: false,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 5,
      includeIn100PctSum: true,
    });
  }

  // Investor Sub-Debt — PIK with optional current pay
  if ((params.investorSubDebtPct ?? 0) > 0) {
    const hasCurrentPay = params.investorPikCurrentPayEnabled ?? false;
    const cpPct = hasCurrentPay ? (params.investorPikCurrentPayPct ?? 0) : 0;
    sources.push({
      id: nextId(),
      label: 'Investor Sub-Debt',
      sourceType: 'pik_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.investorSubDebtPct,
      amount: effectiveProjectCost * ((params.investorSubDebtPct ?? 0) / 100),
      rate: params.investorSubDebtPikRate ?? 0,
      hardPayPct: 0,
      softPayPct: cpPct,
      pikPct: 100 - cpPct,
      isEquity: false,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 5,
      includeIn100PctSum: true,
    });
  }

  // Outside Investor Sub-Debt — PIK with optional current pay
  if ((params.outsideInvestorSubDebtPct ?? 0) > 0) {
    const hasCurrentPay = params.outsideInvestorPikCurrentPayEnabled ?? false;
    const cpPct = hasCurrentPay ? (params.outsideInvestorPikCurrentPayPct ?? 0) : 0;
    sources.push({
      id: nextId(),
      label: 'Outside Investor Sub-Debt',
      sourceType: 'pik_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.outsideInvestorSubDebtPct,
      amount: effectiveProjectCost * ((params.outsideInvestorSubDebtPct ?? 0) / 100),
      rate: params.outsideInvestorSubDebtPikRate ?? 0,
      hardPayPct: 0,
      softPayPct: cpPct,
      pikPct: 100 - cpPct,
      isEquity: false,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 5,
      includeIn100PctSum: true,
    });
  }

  // HDC Debt Fund — PIK with optional current pay
  if ((params.hdcDebtFundPct ?? 0) > 0) {
    const hasCurrentPay = params.hdcDebtFundCurrentPayEnabled ?? false;
    const cpPct = hasCurrentPay ? (params.hdcDebtFundCurrentPayPct ?? 0) : 0;
    sources.push({
      id: nextId(),
      label: 'HDC Debt Fund',
      sourceType: 'pik_debt',
      amountBasis: 'pct_project_cost',
      amountPct: params.hdcDebtFundPct,
      amount: effectiveProjectCost * ((params.hdcDebtFundPct ?? 0) / 100),
      rate: params.hdcDebtFundPikRate ?? 0,
      hardPayPct: 0,
      softPayPct: cpPct,
      pikPct: 100 - cpPct,
      isEquity: false,
      isGrant: false,
      dscrIncluded: false,
      forgivenessEnabled: false,
      affectsEligibleBasis: false,
      waterfallPriority: 4,
      cashSweepPriority: 3,
      includeIn100PctSum: true,
    });
  }

  // Deferred Developer Fee (C Note) — only if a deferred balance exists
  if ((params.devFeeTotal ?? 0) > 0) {
    const deferred = Math.max(
      0,
      (params.devFeeTotal ?? 0) - (params.devFeeClosingAmount ?? 0),
    );
    if (deferred > 0) {
      sources.push({
        id: nextId(),
        label: 'Deferred Developer Fee',
        sourceType: 'deferred_dev_fee',
        amountBasis: 'dollars',
        amount: deferred,
        rate: 0,
        hardPayPct: 0,
        softPayPct: 0,
        pikPct: 0,
        isEquity: false,
        isGrant: false,
        dscrIncluded: false,
        forgivenessEnabled: false,
        affectsEligibleBasis: false,
        cashSweepPriority: 4,
        waterfallPriority: 4,
        includeIn100PctSum: true,
      });
    }
  }

  return sources;
}
