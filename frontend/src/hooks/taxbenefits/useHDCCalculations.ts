import { useMemo } from 'react';
import {
  calculateFullInvestorAnalysis,
  calculateHDCAnalysis,
  CONFORMING_STATES
} from '../../utils/taxbenefits';
import { calculateInterestReserve } from '../../utils/taxbenefits/interestReserveCalculation';
import { calculateDepreciableBasis, calculateLIHTCEligibleBasis } from '../../utils/taxbenefits/depreciableBasisUtility';
import { getOzBenefits } from '../../utils/taxbenefits/hdcOzStrategy';
import { ALL_JURISDICTIONS, getEffectiveTaxRate, doesNIITApply } from '../../utils/taxbenefits/stateData';
import { getStateBonusConformityRate, getStateTaxRate } from '../../utils/taxbenefits/stateProfiles';
import { getOzStepUpPercent } from '../../utils/taxbenefits/constants';
import { calculateLIHTCSchedule, LIHTCCreditSchedule, DealType } from '../../utils/taxbenefits/lihtcCreditCalculations';
import { calculateStateLIHTC, StateLIHTCCalculationResult } from '../../utils/taxbenefits/stateLIHTCCalculations';
import { InvestorAnalysisResults, HDCAnalysisResults, StateLIHTCIntegrationResult, ComputedTimeline } from '../../types/taxbenefits';

interface UseHDCCalculationsProps {
  // Core project parameters
  projectCost: number;
  predevelopmentCosts?: number;
  landValue: number;
  yearOneNOI: number;
  yearOneDepreciationPct: number;
  totalInvestmentYears: number;
  // exitMonth removed (IMPL-117) — engine auto-derives from timeline or defaults to 7
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  exitCapRate: number;

  // Tax parameters
  federalTaxRate: number;
  selectedState: string;
  projectLocation?: string;
  stateCapitalGainsRate: number;
  ltCapitalGainsRate: number;
  niitRate: number;
  deferredGains: number;

  // Fee parameters
  hdcFeeRate: number;
  hdcDeferredInterestRate?: number;
  hdcAdvanceFinancing: boolean;
  taxAdvanceDiscountRate: number;
  advanceFinancingRate: number;
  taxDeliveryMonths: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  aumCurrentPayEnabled: boolean;
  aumCurrentPayPct: number;

  // Capital structure
  investorEquityPct: number;
  philanthropicEquityPct: number;
  seniorDebtPct: number;
  philDebtPct: number;
  hdcSubDebtPct: number;
  hdcSubDebtPikRate: number;
  investorSubDebtPct: number;
  investorSubDebtPikRate: number;
  outsideInvestorSubDebtPct: number;
  outsideInvestorSubDebtPikRate: number;
  investorPromoteShare: number;

  // Debt settings
  seniorDebtRate: number;
  seniorDebtAmortization: number;
  seniorDebtIOYears: number;
  philDebtRate: number;
  philDebtAmortization: number;

  // PIK settings
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  investorPikCurrentPayEnabled: boolean;
  investorPikCurrentPayPct: number;
  outsideInvestorPikCurrentPayEnabled: boolean;
  outsideInvestorPikCurrentPayPct: number;
  philCurrentPayEnabled: boolean;
  philCurrentPayPct: number;
  philSweepPct?: number;
  hdcDebtFundSweepPct?: number;
  interestReserveEnabled: boolean;
  interestReserveMonths: number;

  // Tax timing
  constructionDelayMonths: number;

  // Opportunity Zone
  ozEnabled?: boolean;
  ozType?: 'standard' | 'rural';
  ozVersion?: '1.0' | '2.0';  // IMPL-017: OZ legislation version
  deferredCapitalGains?: number;
  capitalGainsTaxRate?: number;

  // Investor Track and Passive Gains
  investorTrack?: 'rep' | 'non-rep';
  passiveGainType?: 'short-term' | 'long-term';

  // Income Composition (Phase A2 - Tax Utilization)
  annualOrdinaryIncome?: number;
  annualPassiveIncome?: number;
  annualPortfolioIncome?: number;
  groupingElection?: boolean;
  filingStatus?: 'single' | 'married';

  // Tax Planning Analysis
  includeDepreciationSchedule?: boolean;
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;

  // Federal LIHTC (v7.0.11)
  lihtcEnabled?: boolean;
  applicableFraction?: number;
  creditRate?: number;
  // placedInServiceMonth removed (IMPL-117) — derived from investmentDate+constructionDelay
  ddaQctBoost?: boolean;

  // Private Activity Bonds (IMPL-080)
  pabEnabled?: boolean;
  pabPctOfEligibleBasis?: number;
  pabRate?: number;
  pabAmortization?: number;
  pabIOYears?: number;

  // IMPL-083: Eligible Basis Exclusions
  commercialBasisPct?: number;
  commercialSpaceCosts?: number;
  syndicationCosts?: number;
  marketingCosts?: number;
  financingFees?: number;
  bondIssuanceCosts?: number;
  operatingDeficitReserve?: number;
  replacementReserve?: number;
  otherExclusions?: number;

  // HDC Debt Fund (IMPL-082)
  hdcDebtFundPct?: number;
  hdcDebtFundPikRate?: number;
  hdcDebtFundCurrentPayEnabled?: boolean;
  hdcDebtFundCurrentPayPct?: number;

  // Timing Architecture (IMPL-112)
  investmentDate?: string;
  pisDateOverride?: string | null;
  exitExtensionMonths?: number;
  electDeferCreditPeriod?: boolean;
  dealType?: DealType;
  computedTimeline?: ComputedTimeline | null;

  // State LIHTC (v7.0.14)
  stateLIHTCEnabled?: boolean;
  investorState?: string;
  syndicationRate?: number;
  investorHasStateLiability?: boolean;
  stateLIHTCUserPercentage?: number;
  stateLIHTCUserAmount?: number;
  stateLIHTCSyndicationYear?: 0 | 1 | 2; // IMPL-073
}

export const useHDCCalculations = (props: UseHDCCalculationsProps) => {
  // Read pisMonth from ComputedTimeline when available (single source of truth).
  // Fall back to inline derivation for legacy path (no investmentDate).
  const pisMonth = useMemo(() => {
    if (props.computedTimeline) {
      return props.computedTimeline.pisCalendarMonth;
    }
    if (props.investmentDate && props.pisDateOverride) {
      return new Date(props.pisDateOverride + 'T00:00:00').getMonth() + 1;
    }
    if (props.investmentDate) {
      const d = new Date(props.investmentDate + 'T00:00:00');
      d.setMonth(d.getMonth() + (props.constructionDelayMonths || 0));
      return d.getMonth() + 1;
    }
    return 7; // Default for legacy path
  }, [props.computedTimeline, props.investmentDate, props.pisDateOverride, props.constructionDelayMonths]);

  // Calculate interest reserve amount using shared function (single source of truth)
  const interestReserveAmount = useMemo(() => {
    return calculateInterestReserve({
      enabled: props.interestReserveEnabled,
      months: props.interestReserveMonths,
      projectCost: props.projectCost,
      predevelopmentCosts: props.predevelopmentCosts,
      yearOneNOI: props.yearOneNOI,
      seniorDebtPct: props.seniorDebtPct,
      seniorDebtRate: props.seniorDebtRate,
      seniorDebtAmortization: props.seniorDebtAmortization,
      seniorDebtIOYears: props.seniorDebtIOYears,
      outsideInvestorSubDebtPct: props.outsideInvestorSubDebtPct,
      outsideInvestorSubDebtPikRate: props.outsideInvestorSubDebtPikRate,
      outsideInvestorPikCurrentPayEnabled: props.outsideInvestorPikCurrentPayEnabled,
      outsideInvestorPikCurrentPayPct: props.outsideInvestorPikCurrentPayPct,
      hdcSubDebtPct: props.hdcSubDebtPct,
      hdcSubDebtPikRate: props.hdcSubDebtPikRate,
      hdcPikCurrentPayEnabled: props.pikCurrentPayEnabled,
      hdcPikCurrentPayPct: props.pikCurrentPayPct,
      investorSubDebtPct: props.investorSubDebtPct,
      investorSubDebtPikRate: props.investorSubDebtPikRate,
      investorPikCurrentPayEnabled: props.investorPikCurrentPayEnabled,
      investorPikCurrentPayPct: props.investorPikCurrentPayPct,
    });
  }, [
    props.interestReserveEnabled,
    props.interestReserveMonths,
    props.projectCost,
    props.predevelopmentCosts,
    props.yearOneNOI,
    props.seniorDebtPct,
    props.seniorDebtRate,
    props.seniorDebtAmortization,
    props.seniorDebtIOYears,
    props.outsideInvestorSubDebtPct,
    props.outsideInvestorSubDebtPikRate,
    props.outsideInvestorPikCurrentPayEnabled,
    props.outsideInvestorPikCurrentPayPct,
    props.hdcSubDebtPct,
    props.hdcSubDebtPikRate,
    props.pikCurrentPayEnabled,
    props.pikCurrentPayPct,
    props.investorSubDebtPct,
    props.investorSubDebtPikRate,
    props.investorPikCurrentPayEnabled,
    props.investorPikCurrentPayPct
  ]);

  // Calculate effective project cost including interest reserve
  const effectiveProjectCost = props.projectCost + (props.predevelopmentCosts || 0) + interestReserveAmount;

  // Multi-year depreciation calculations
  const depreciationCalculations = useMemo(() => {
    // Include predevelopment costs in total project cost for depreciable basis
    const totalProjectCost = props.projectCost + (props.predevelopmentCosts || 0);

    // CRITICAL OZ RULE: Exclude investor equity (QCGs) from depreciable basis
    // In OZ investments, investor equity is 100% from Qualified Capital Gains
    // which cannot be included in depreciable basis per IRS rules
    // Use effective project cost (including interest reserve) for investor equity calculation
    const investorEquity = effectiveProjectCost * (props.investorEquityPct / 100);

    // Calculate depreciable basis using shared utility
    // CRITICAL OZ RULE: Excludes land AND investor equity (from Qualified Capital Gains)
    // Note: Interest reserve is NOT included in depreciable basis as it's a financing cost,
    // but IS included in the base for calculating investor equity amount (per Step 1 docs)
    const depreciableBasis = calculateDepreciableBasis({
      projectCost: props.projectCost,
      predevelopmentCosts: props.predevelopmentCosts,
      landValue: props.landValue,
      investorEquityPct: props.investorEquityPct,
      interestReserve: interestReserveAmount
    });

    // Year 1: MACRS with mid-month convention (IRS Pub 946, Table A-6)
    // Year 1 includes BOTH bonus depreciation AND partial straight-line
    const bonusDepreciation = depreciableBasis * (props.yearOneDepreciationPct / 100);
    const remainingBasis = depreciableBasis - bonusDepreciation;
    const annualMACRS = remainingBasis / 27.5; // IRS MACRS: 27.5 years for residential rental

    // Mid-month convention: property treated as placed in service at midpoint of month
    const monthsInYear1 = 12.5 - pisMonth;
    const year1MACRS = (monthsInYear1 / 12) * annualMACRS;
    const yearOneDepreciation = bonusDepreciation + year1MACRS;

    const remainingDepreciableBasis = depreciableBasis - yearOneDepreciation;
    const annualStraightLineDepreciation = annualMACRS; // Same as calculated above

    // Calculate depreciation for years 2 through N (holdPeriod)
    // Maximum 27.5 years of depreciation for residential rental (IRS Pub 946, Table A-6)
    const remainingYears = props.totalInvestmentYears - 1; // Years 2 through N
    const depreciationYearsRemaining = Math.min(remainingYears, 27.5);
    const years2toNDepreciation = annualStraightLineDepreciation * depreciationYearsRemaining;
    const totalDepreciation = yearOneDepreciation + years2toNDepreciation;

    return {
      depreciableBasis,
      yearOneDepreciation,
      remainingDepreciableBasis,
      annualStraightLineDepreciation,
      years2to10Depreciation: years2toNDepreciation, // Keep name for compatibility but it's really 2 to N
      total10YearDepreciation: totalDepreciation, // Keep name for compatibility but it's really total for hold period
      years2toNDepreciation,
      totalDepreciation
    };
  }, [props.projectCost, props.predevelopmentCosts, props.landValue, props.yearOneDepreciationPct, props.totalInvestmentYears, props.investorEquityPct, effectiveProjectCost]);

  // Tax rate calculations
  // IMPL-035: Use investorState for tax calculations (where investor files taxes)
  // selectedState remains the property state (where project is located)
  // States are now independent - no fallback coupling
  // IMPL-041: Split rates for bonus vs straight-line depreciation based on state conformity
  const taxCalculations = useMemo(() => {
    const investorStateForTax = props.investorState || '';
    const isConformingState = investorStateForTax !== '' && investorStateForTax !== 'NONE' && investorStateForTax !== 'CUSTOM' && !!CONFORMING_STATES[investorStateForTax];

    // IMPL-041: Get state bonus depreciation conformity rate (0.0 to 1.0)
    // NJ = 0.3 (30%), CA = 0.0 (0%), NY = 0.5 (50%), most states = 1.0 (100%)
    const bonusConformityRate = getStateBonusConformityRate(investorStateForTax);

    const NIIT_RATE = 3.8; // Net Investment Income Tax

    // IMPL-066: Removed isNonConforming check - OZ conformity is independent of state income tax
    // OZ conformity affects OZ benefits (deferral, step-up), NOT state income tax rates

    // IMPL-119: NIIT applies when (1) not a territory AND (2) depreciation offsets passive income.
    // REP + grouped: losses are non-passive (Section 1411(c)(1)(A) exception) -> no NIIT
    // REP ungrouped: losses remain passive -> NIIT applies
    // Non-REP: losses are passive -> NIIT applies
    const niitApplies = doesNIITApply(investorStateForTax || '');
    const depreciationNiitApplies = niitApplies && !(props.investorTrack === 'rep' && props.groupingElection);
    const niitRate = depreciationNiitApplies ? NIIT_RATE : 0;

    // IMPL-041: Calculate TWO effective rates:
    // 1. effectiveTaxRateForBonus - Federal + NIIT (if applicable) + (State x Conformity Rate)
    // 2. effectiveTaxRateForStraightLine - Federal + NIIT (if applicable) + State (full rate)
    let effectiveTaxRateForBonus: number;
    let effectiveTaxRateForStraightLine: number;
    let effectiveTaxRateForDepreciation: number; // Keep for backward compatibility (weighted average)

    if (props.investorTrack === 'rep' || props.investorTrack === undefined) {
      // Track 1: REPs
      // IMPL-066: State income tax rate is INDEPENDENT of OZ conformity
      // Use getStateTaxRate() directly - returns topRate (ordinary income rate)
      const stateRate = getStateTaxRate(investorStateForTax);

      // IMPL-119: REP + grouped -> no NIIT; REP ungrouped -> NIIT on passive losses
      // Straight-line: Full state rate (all states accept straight-line depreciation)
      effectiveTaxRateForStraightLine = props.federalTaxRate + niitRate + stateRate;

      // Bonus: State rate x conformity rate (NJ = 30% of state rate, CA = 0%, etc.)
      effectiveTaxRateForBonus = props.federalTaxRate + niitRate + (stateRate * bonusConformityRate);

      // For backward compatibility: use weighted average based on depreciation split
      // Year 1 is mostly bonus, Years 2+ are all straight-line
      effectiveTaxRateForDepreciation = effectiveTaxRateForStraightLine; // Default to straight-line for legacy calcs
    } else {
      // Track 2: Non-REPs - Passive losses offset passive gains (NIIT always applies if not territory)
      // IMPL-066: State income tax rate is INDEPENDENT of OZ conformity
      // For passive gains, use stateCapitalGainsRate for long-term, ordinary rate for short-term
      const stateRate = props.passiveGainType === 'long-term'
        ? props.stateCapitalGainsRate
        : getStateTaxRate(investorStateForTax);

      // Straight-line: Full state rate
      effectiveTaxRateForStraightLine = props.federalTaxRate + niitRate + stateRate;

      // Bonus: State rate x conformity rate
      effectiveTaxRateForBonus = props.federalTaxRate + niitRate + (stateRate * bonusConformityRate);

      // For backward compatibility
      effectiveTaxRateForDepreciation = effectiveTaxRateForStraightLine;
    }

    // Calculate total tax benefit using split rates for accuracy
    // Year 1 benefit: bonus portion uses bonus rate, MACRS portion uses straight-line rate
    // Years 2-N benefit: all straight-line rate
    const bonusDepreciation = depreciationCalculations.yearOneDepreciation - depreciationCalculations.years2toNDepreciation;
    const year1MACRS = depreciationCalculations.years2toNDepreciation; // First year MACRS is similar to annual
    const years2toNTotal = depreciationCalculations.years2toNDepreciation * (props.totalInvestmentYears - 1);

    const bonusTaxBenefit = bonusDepreciation * (effectiveTaxRateForBonus / 100);
    const year1MACRSTaxBenefit = year1MACRS * (effectiveTaxRateForStraightLine / 100);
    const years2toNTaxBenefit = years2toNTotal * (effectiveTaxRateForStraightLine / 100);

    const totalTaxBenefit = bonusTaxBenefit + year1MACRSTaxBenefit + years2toNTaxBenefit;
    const hdcFee = totalTaxBenefit * (props.hdcFeeRate / 100);
    const netTaxBenefit = totalTaxBenefit - hdcFee;

    const totalCapitalGainsRate = props.ltCapitalGainsRate + props.niitRate + props.stateCapitalGainsRate;

    // Apply OZ step-up for Year 5 tax calculation
    // IMPL-017: Use centralized helper for OZ version support
    const ozStepUpPercent = getOzStepUpPercent(props.ozVersion || '2.0', props.ozType || 'standard');
    const taxableGainsAfterStepUp = props.deferredGains * (1 - ozStepUpPercent);
    const deferredGainsTaxDue = taxableGainsAfterStepUp * (totalCapitalGainsRate / 100);

    // Calculate the tax savings from step-up
    const stepUpTaxSavings = props.deferredGains * ozStepUpPercent * (totalCapitalGainsRate / 100);

    return {
      isConformingState,
      effectiveTaxRateForDepreciation,
      // IMPL-041: Split rates for bonus vs straight-line depreciation
      effectiveTaxRateForBonus,
      effectiveTaxRateForStraightLine,
      bonusConformityRate,
      // IMPL-119: Expose for engine call
      depreciationNiitApplies,
      totalTaxBenefit,
      hdcFee,
      netTaxBenefit,
      totalCapitalGainsRate,
      deferredGainsTaxDue,
      ozStepUpPercent,
      taxableGainsAfterStepUp,
      stepUpTaxSavings
    };
  }, [
    depreciationCalculations.total10YearDepreciation,
    depreciationCalculations.yearOneDepreciation,
    depreciationCalculations.years2toNDepreciation,
    props.federalTaxRate,
    props.investorState,
    props.selectedState,
    props.stateCapitalGainsRate,
    props.hdcFeeRate,
    props.ltCapitalGainsRate,
    props.niitRate,
    props.deferredGains,
    props.investorTrack,
    props.groupingElection,
    props.passiveGainType,
    props.ozType,
    props.ozVersion,
    props.totalInvestmentYears
  ]);

  // Advance financing calculations
  const advanceFinancingCalculations = useMemo(() => {
    let investorUpfrontCash = 0;
    let hdcAdvanceOutlay = 0;

    if (props.hdcAdvanceFinancing) {
      const advancePayment = taxCalculations.netTaxBenefit * (1 - props.taxAdvanceDiscountRate / 100);
      investorUpfrontCash = advancePayment;
      hdcAdvanceOutlay = advancePayment;
      const hdcFinancingCost = hdcAdvanceOutlay * (props.advanceFinancingRate / 100) * (props.taxDeliveryMonths / 12);
      hdcAdvanceOutlay += hdcFinancingCost;
    }

    return {
      investorUpfrontCash,
      hdcAdvanceOutlay
    };
  }, [
    props.hdcAdvanceFinancing,
    taxCalculations.netTaxBenefit,
    props.taxAdvanceDiscountRate,
    props.advanceFinancingRate,
    props.taxDeliveryMonths
  ]);

  // Preliminary year 1 calculations needed for mainAnalysisResults
  const year1TaxBenefit = depreciationCalculations.yearOneDepreciation * (taxCalculations.effectiveTaxRateForDepreciation / 100);
  const year1HdcFee = year1TaxBenefit * (props.hdcFeeRate / 100);
  const year1NetBenefit = year1TaxBenefit - year1HdcFee;

  // Calculate LIHTC Eligible Basis (separate from OZ depreciable basis per IRC §42)
  // MOVED: Before mainAnalysisResults to enable State LIHTC integration (IMPL-018)
  // IMPL-083: Full exclusions list
  const lihtcEligibleBasis = useMemo(() => {
    return calculateLIHTCEligibleBasis({
      projectCost: props.projectCost,
      predevelopmentCosts: props.predevelopmentCosts,
      landValue: props.landValue,
      interestReserve: interestReserveAmount,
      // IMPL-083: All eligible basis exclusions
      commercialBasisPct: props.commercialBasisPct,
      commercialSpaceCosts: props.commercialSpaceCosts || 0,
      syndicationCosts: props.syndicationCosts || 0,
      marketingCosts: props.marketingCosts || 0,
      financingFees: props.financingFees || 0,
      bondIssuanceCosts: props.bondIssuanceCosts || 0,
      operatingDeficitReserve: props.operatingDeficitReserve || 0,
      replacementReserve: props.replacementReserve || 0,
      otherExclusions: props.otherExclusions || 0
    });
  }, [
    props.projectCost,
    props.predevelopmentCosts,
    props.landValue,
    interestReserveAmount,
    // IMPL-083: Dependencies for exclusions
    props.commercialBasisPct,
    props.commercialSpaceCosts,
    props.syndicationCosts,
    props.marketingCosts,
    props.financingFees,
    props.bondIssuanceCosts,
    props.operatingDeficitReserve,
    props.replacementReserve,
    props.otherExclusions
  ]);

  // ISS-029: Calculate PAB amount for capital stack integration
  // PAB = Eligible Basis × PAB % (only when both LIHTC and PAB are enabled)
  const pabAmount = useMemo(() => {
    if (!props.pabEnabled || !props.lihtcEnabled || lihtcEligibleBasis <= 0) {
      return 0;
    }
    return lihtcEligibleBasis * ((props.pabPctOfEligibleBasis || 30) / 100);
  }, [props.pabEnabled, props.lihtcEnabled, lihtcEligibleBasis, props.pabPctOfEligibleBasis]);

  // Calculate Federal LIHTC schedule (v7.0.11)
  // MOVED: Before mainAnalysisResults to enable State LIHTC integration (IMPL-018)
  const lihtcResult: LIHTCCreditSchedule | null = useMemo(() => {
    if (!props.lihtcEnabled) return null;

    try {
      return calculateLIHTCSchedule({
        eligibleBasis: lihtcEligibleBasis,
        stabilizedApplicableFraction: (props.applicableFraction || 100) / 100,
        ddaQctBoost: props.ddaQctBoost || false,
        pisMonth,
        creditRate: props.creditRate || 0.04,
        electDeferCreditPeriod: (props.electDeferCreditPeriod ?? false) && pisMonth !== 1,
        dealType: props.dealType ?? 'new_construction',
        leaseUpRampInput: { leaseUpMonths: props.interestReserveMonths ?? 6 },
      });
    } catch (error) {
      console.error('LIHTC calculation error:', error);
      return null;
    }
  }, [
    props.lihtcEnabled,
    lihtcEligibleBasis,
    props.applicableFraction,
    props.ddaQctBoost,
    pisMonth,
    props.creditRate,
    props.electDeferCreditPeriod,
    props.dealType,
    props.interestReserveMonths
  ]);

  // Calculate State LIHTC (v7.0.14)
  // MOVED: Before mainAnalysisResults to enable State LIHTC integration (IMPL-018)
  const stateLIHTCResult: StateLIHTCCalculationResult | null = useMemo(() => {
    if (!props.stateLIHTCEnabled || !lihtcResult) return null;

    // ISS-019 CORRECTED: Credits exist if PROPERTY STATE has program (not investor state)
    // - Property state program check is done inside calculateStateLIHTC (returns $0 if no program)
    // - Investor's home state LIHTC program is IRRELEVANT
    // - Monetization path (direct vs syndicated) determined by investorHasStateLiability checkbox

    try {
      // IMPL-035: investorState is independent - no fallback to selectedState
      return calculateStateLIHTC({
        federalAnnualCredit: lihtcResult.annualCredit,
        propertyState: props.selectedState,
        investorState: props.investorState || '',
        pisMonth,
        syndicationRateOverride: props.syndicationRate || 75, // Default 75%
        investorHasStateLiability: props.investorHasStateLiability,
        userPercentage: props.stateLIHTCUserPercentage,
        userAmount: props.stateLIHTCUserAmount,
      });
    } catch (error) {
      console.error('State LIHTC calculation error:', error);
      return null;
    }
  }, [
    props.stateLIHTCEnabled,
    lihtcResult,
    props.selectedState,
    props.investorState,
    pisMonth,
    props.syndicationRate,
    props.investorHasStateLiability,
    props.stateLIHTCUserPercentage,
    props.stateLIHTCUserAmount
  ]);

  // Calculate State LIHTC Integration (IMPL-018)
  // Determines credit path (syndicated vs direct use) and prepares data for calculation
  const stateLIHTCIntegration: StateLIHTCIntegrationResult | null = useMemo(() => {
    if (!stateLIHTCResult || !props.stateLIHTCEnabled) return null;

    const { syndicationRate, grossCredit, netBenefit, schedule, warnings } = stateLIHTCResult;

    // Determine credit path based on syndication rate
    // syndicationRate is 0.0-1.0 (e.g., 0.75 = 75%)
    let creditPath: 'syndicated' | 'direct_use' | 'none';
    if (syndicationRate === 0) {
      creditPath = 'none';
    } else if (syndicationRate === 1.0) {
      creditPath = 'direct_use';
    } else {
      creditPath = 'syndicated';
    }

    // Build yearly credits from schedule for direct use path
    const yearlyCredits = schedule.yearlyBreakdown.map(y => y.creditAmount);

    return {
      creditPath,
      syndicationRate,
      grossCredit,
      netProceeds: netBenefit,
      yearlyCredits,
      totalCreditBenefit: creditPath === 'direct_use' ? grossCredit : 0,
      treatment: creditPath === 'syndicated' ? 'capital_stack' :
                 creditPath === 'direct_use' ? 'tax_benefit' : 'none',
      warnings
    };
  }, [stateLIHTCResult, props.stateLIHTCEnabled]);

  // Main investor analysis
  const mainAnalysisResults: InvestorAnalysisResults = useMemo(() => {
    return calculateFullInvestorAnalysis({
      projectCost: props.projectCost,
      predevelopmentCosts: props.predevelopmentCosts,
      landValue: props.landValue,
      yearOneNOI: props.yearOneNOI,
      // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
      noiGrowthRate: props.noiGrowthRate,
      exitCapRate: props.exitCapRate,
      investorEquityPct: props.investorEquityPct,
      hdcFeeRate: props.hdcFeeRate,
      hdcDeferredInterestRate: props.hdcDeferredInterestRate || 0,
      hdcAdvanceFinancing: props.hdcAdvanceFinancing,
      investorUpfrontCash: advanceFinancingCalculations.investorUpfrontCash,
      totalTaxBenefit: taxCalculations.totalTaxBenefit,
      netTaxBenefit: taxCalculations.netTaxBenefit,
      hdcFee: taxCalculations.hdcFee,
      year1NetBenefit: year1NetBenefit,
      investorPromoteShare: props.investorPromoteShare,
      aumFeeEnabled: props.aumFeeEnabled,
      aumFeeRate: props.aumFeeRate,
      aumCurrentPayEnabled: props.aumCurrentPayEnabled,
      aumCurrentPayPct: props.aumCurrentPayPct,
      seniorDebtPct: props.seniorDebtPct,
      philanthropicDebtPct: props.philDebtPct,
      seniorDebtRate: props.seniorDebtRate,
      philanthropicDebtRate: props.philDebtRate,
      seniorDebtAmortization: props.seniorDebtAmortization,
      seniorDebtIOYears: props.seniorDebtIOYears,  // ISS-060: Pass IO years to main calculation
      philDebtAmortization: props.philDebtAmortization,
      hdcSubDebtPct: props.hdcSubDebtPct,
      hdcSubDebtPikRate: props.hdcSubDebtPikRate,
      pikCurrentPayEnabled: props.pikCurrentPayEnabled,
      pikCurrentPayPct: props.pikCurrentPayPct,
      investorSubDebtPct: props.investorSubDebtPct,
      investorSubDebtPikRate: props.investorSubDebtPikRate,
      investorPikCurrentPayEnabled: props.investorPikCurrentPayEnabled,
      investorPikCurrentPayPct: props.investorPikCurrentPayPct,
      outsideInvestorSubDebtPct: props.outsideInvestorSubDebtPct,
      outsideInvestorSubDebtPikRate: props.outsideInvestorSubDebtPikRate,
      outsideInvestorPikCurrentPayEnabled: props.outsideInvestorPikCurrentPayEnabled,
      outsideInvestorPikCurrentPayPct: props.outsideInvestorPikCurrentPayPct,
      // HDC Debt Fund (IMPL-082)
      hdcDebtFundPct: props.hdcDebtFundPct,
      hdcDebtFundPikRate: props.hdcDebtFundPikRate,
      hdcDebtFundCurrentPayEnabled: props.hdcDebtFundCurrentPayEnabled,
      hdcDebtFundCurrentPayPct: props.hdcDebtFundCurrentPayPct,
      // Private Activity Bonds (IMPL-080)
      pabEnabled: props.pabEnabled,
      pabPctOfEligibleBasis: props.pabPctOfEligibleBasis,
      pabRate: props.pabRate,
      pabAmortization: props.pabAmortization,
      pabIOYears: props.pabIOYears,
      lihtcEnabled: props.lihtcEnabled,
      lihtcEligibleBasis: lihtcEligibleBasis,
      philCurrentPayEnabled: props.philCurrentPayEnabled,
      philCurrentPayPct: props.philCurrentPayPct,
      philSweepPct: props.philSweepPct,
      hdcDebtFundSweepPct: props.hdcDebtFundSweepPct,
      interestReserveEnabled: props.interestReserveEnabled,
      interestReserveMonths: props.interestReserveMonths,
      holdPeriod: props.totalInvestmentYears,
      // DON'T pass yearOneDepreciation/annualStraightLineDepreciation - let engine auto-calculate
      // to avoid circular dependency (depreciation depends on interest reserve)
      yearOneDepreciationPct: props.yearOneDepreciationPct,
      effectiveTaxRate: taxCalculations.effectiveTaxRateForDepreciation,
      // IMPL-041: Split rates for bonus vs straight-line depreciation
      effectiveTaxRateForBonus: taxCalculations.effectiveTaxRateForBonus,
      effectiveTaxRateForStraightLine: taxCalculations.effectiveTaxRateForStraightLine,
      bonusConformityRate: taxCalculations.bonusConformityRate,
      constructionDelayMonths: props.constructionDelayMonths,
      // placedInServiceMonth removed (IMPL-117) — engine auto-derives from timeline
      // exitMonth removed (IMPL-117) — engine auto-derives from timeline
      // Timing Architecture (IMPL-112+113)
      investmentDate: props.investmentDate || undefined,
      pisDateOverride: props.pisDateOverride || undefined,
      exitExtensionMonths: props.exitExtensionMonths || undefined,
      electDeferCreditPeriod: props.electDeferCreditPeriod || undefined,
      ozEnabled: props.ozEnabled,
      ozType: props.ozType,
      ozVersion: props.ozVersion,
      deferredCapitalGains: props.deferredCapitalGains,
      capitalGainsTaxRate: props.capitalGainsTaxRate,
      // Tax Planning Analysis
      includeDepreciationSchedule: props.includeDepreciationSchedule,
      investorTrack: props.investorTrack,
      w2Income: props.w2Income,
      businessIncome: props.businessIncome,
      iraBalance: props.iraBalance,
      passiveIncome: props.passiveIncome,
      // Income Composition (Phase A2 - Tax Utilization)
      annualOrdinaryIncome: props.annualOrdinaryIncome,
      annualPassiveIncome: props.annualPassiveIncome,
      annualPortfolioIncome: props.annualPortfolioIncome,
      groupingElection: props.groupingElection,
      // IMPL-119: Pass computed niitApplies so engine default path + exit tax are correct
      niitApplies: taxCalculations.depreciationNiitApplies,
      filingStatus: props.filingStatus,
      federalTaxRate: props.federalTaxRate,
      stateTaxRate: getEffectiveTaxRate(props.selectedState, false),
      ltCapitalGainsRate: props.ltCapitalGainsRate,
      niitRate: props.niitRate,
      stateCapitalGainsRate: props.stateCapitalGainsRate,
      selectedState: props.selectedState,
      // IMPL-136: Pass investorState so engine uses investor's filing state
      investorState: props.investorState || '',
      // State LIHTC Integration (IMPL-018)
      stateLIHTCIntegration: stateLIHTCIntegration,
      // IMPL-073: State LIHTC syndication year for capital return model
      stateLIHTCSyndicationYear: props.stateLIHTCSyndicationYear,
      // Federal LIHTC Credits (IMPL-021b) - 100% to investor, no promote split
      federalLIHTCCredits: lihtcResult?.yearlyBreakdown?.map(y => y.creditAmount) || []
    });
  }, [
    props,
    // ISS-070d: Explicit dependencies for key inputs that affect MOIC/Exit Value
    // React's useMemo compares objects by reference, so we need explicit deps for value changes
    props.projectCost,
    props.predevelopmentCosts,
    props.landValue,
    props.yearOneNOI,
    props.noiGrowthRate,
    props.exitCapRate,
    props.investorEquityPct,
    props.totalInvestmentYears,
    // Capital structure
    props.seniorDebtPct,
    props.seniorDebtRate,
    props.philDebtPct,
    props.philDebtRate,
    props.hdcSubDebtPct,
    props.investorSubDebtPct,
    // Existing explicit dependencies
    props.hdcDeferredInterestRate,
    props.aumFeeEnabled,
    props.aumFeeRate,
    props.aumCurrentPayEnabled,
    props.aumCurrentPayPct,
    props.investorPromoteShare, // ISS-047b: Explicit dependency for promote split changes
    // Hold period inputs: all three feed computeHoldPeriod() inside engine
    pisMonth,
    props.constructionDelayMonths,
    taxCalculations.totalTaxBenefit,
    taxCalculations.netTaxBenefit,
    taxCalculations.hdcFee,
    taxCalculations.effectiveTaxRateForDepreciation,
    advanceFinancingCalculations.investorUpfrontCash,
    depreciationCalculations.yearOneDepreciation,
    year1NetBenefit,
    stateLIHTCIntegration,
    lihtcResult,
    // Income Composition (Phase A2 - Tax Utilization) - must be in deps for recalc on change
    props.annualOrdinaryIncome,
    props.annualPassiveIncome,
    props.annualPortfolioIncome,
    props.investorTrack,
    props.groupingElection,
    props.filingStatus,
    // IMPL-136: investorState + selectedState must be explicit deps
    props.investorState,
    props.selectedState,
    // Timing Architecture (IMPL-112+113)
    props.investmentDate,
    props.pisDateOverride,
    props.exitExtensionMonths,
    props.electDeferCreditPeriod
  ]);

  // Investment calculations using investor equity from main analysis (single source of truth)
  // ISS-065: Removed freeInvestmentHurdle, investmentRecovered, totalNetTaxBenefitsAfterCG
  // (these were only used for the removed Excess Capacity section)
  const investmentCalculations = useMemo(() => {
    const investorEquity = mainAnalysisResults.investorEquity;

    // IMPL-057: Use engine value (single source of truth) instead of hook calculation
    const totalNetTaxBenefits = mainAnalysisResults.investorTaxBenefits;
    // IMPL-057: Use year 1 tax benefit from engine cash flows
    const year1TaxBenefitFromEngine = mainAnalysisResults.investorCashFlows[0]?.taxBenefit || 0;

    // IMPL-057: Use engine values for year 1 tax benefit (single source of truth)
    // Note: year1TaxBenefit and year1NetBenefit now come from engine for consistency
    // hdcFee is 0 per IMPL-7.0-014, so year1NetBenefit = year1TaxBenefit
    const year1TaxBenefitForReturn = year1TaxBenefitFromEngine;
    const year1NetBenefitForReturn = year1TaxBenefitFromEngine; // hdcFee = 0

    return {
      investorEquity,
      year1TaxBenefit: year1TaxBenefitForReturn,
      year1HdcFee: 0, // Fee removed per IMPL-7.0-014
      year1NetBenefit: year1NetBenefitForReturn,
      totalNetTaxBenefits,
      // Get these from main engine (single source of truth), not from hook's local calculation
      interestReserveAmount: mainAnalysisResults.interestReserveAmount || interestReserveAmount,
      effectiveProjectCost: (props.projectCost + (props.predevelopmentCosts || 0) + (mainAnalysisResults.interestReserveAmount || interestReserveAmount))
    };
  }, [
    mainAnalysisResults.investorEquity,
    mainAnalysisResults.interestReserveAmount,
    mainAnalysisResults.investorTaxBenefits, // IMPL-057: Use engine value
    mainAnalysisResults.investorCashFlows, // IMPL-057: For year 1 tax benefit
    year1TaxBenefit,
    year1HdcFee,
    year1NetBenefit,
    taxCalculations.deferredGainsTaxDue,
    interestReserveAmount,
    effectiveProjectCost,
    props.projectCost,
    props.predevelopmentCosts
  ]);

  // HDC analysis
  const hdcAnalysisResults: HDCAnalysisResults = useMemo(() => {
    return calculateHDCAnalysis({
      projectCost: props.projectCost,
      predevelopmentCosts: props.predevelopmentCosts,
      yearOneNOI: props.yearOneNOI,
      // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
      noiGrowthRate: props.noiGrowthRate,
      exitCapRate: props.exitCapRate,
      philanthropicEquityPct: props.philanthropicEquityPct,
      hdcFeeRate: props.hdcFeeRate,
      hdcFee: taxCalculations.hdcFee,
      investorPromoteShare: props.investorPromoteShare,
      aumFeeEnabled: props.aumFeeEnabled,
      aumFeeRate: props.aumFeeRate,
      aumCurrentPayEnabled: props.aumCurrentPayEnabled,
      aumCurrentPayPct: props.aumCurrentPayPct,
      seniorDebtPct: props.seniorDebtPct,
      philanthropicDebtPct: props.philDebtPct,
      seniorDebtRate: props.seniorDebtRate,
      philanthropicDebtRate: props.philDebtRate,
      seniorDebtAmortization: props.seniorDebtAmortization,
      seniorDebtIOYears: props.seniorDebtIOYears,  // ISS-060: Pass IO years to HDC calculation
      philDebtAmortization: props.philDebtAmortization,
      hdcSubDebtPct: props.hdcSubDebtPct,
      hdcSubDebtPikRate: props.hdcSubDebtPikRate,
      pikCurrentPayEnabled: props.pikCurrentPayEnabled,
      pikCurrentPayPct: props.pikCurrentPayPct,
      outsideInvestorSubDebtPct: props.outsideInvestorSubDebtPct,
      outsideInvestorSubDebtPikRate: props.outsideInvestorSubDebtPikRate,
      outsideInvestorPikCurrentPayEnabled: props.outsideInvestorPikCurrentPayEnabled,
      outsideInvestorPikCurrentPayPct: props.outsideInvestorPikCurrentPayPct,
      investorSubDebtPct: props.investorSubDebtPct,
      investorSubDebtPikRate: props.investorSubDebtPikRate,
      investorPikCurrentPayEnabled: props.investorPikCurrentPayEnabled,
      investorPikCurrentPayPct: props.investorPikCurrentPayPct,
      investorSubDebtAtExit: mainAnalysisResults.investorSubDebtAtExit, // Pass from investor calc for single source of truth
      investorEquity: mainAnalysisResults.investorEquity, // Pass from investor calc for equity recovery hurdle
      grossExitProceeds: mainAnalysisResults.grossExitProceeds || mainAnalysisResults.totalExitProceeds, // ISS-050: Pass for conservation of capital
      yearOneDepreciation: depreciationCalculations.yearOneDepreciation,
      annualStraightLineDepreciation: depreciationCalculations.annualStraightLineDepreciation,
      effectiveTaxRate: taxCalculations.effectiveTaxRateForDepreciation,
      philCurrentPayEnabled: props.philCurrentPayEnabled,
      philCurrentPayPct: props.philCurrentPayPct,
      philSweepPct: props.philSweepPct,
      hdcDebtFundSweepPct: props.hdcDebtFundSweepPct,
      holdPeriod: mainAnalysisResults?.holdPeriod || props.totalInvestmentYears,
      // exitMonth removed (IMPL-117) — engine auto-derives from timeline
      constructionDelayMonths: props.constructionDelayMonths || 0,
      interestReserveEnabled: props.interestReserveEnabled,
      interestReserveMonths: props.interestReserveMonths,
      investorCashFlows: mainAnalysisResults.investorCashFlows
    });
  }, [
    props,
    taxCalculations.hdcFee,
    taxCalculations.effectiveTaxRateForDepreciation,
    depreciationCalculations.yearOneDepreciation,
    depreciationCalculations.annualStraightLineDepreciation,
    mainAnalysisResults.investorCashFlows,
    mainAnalysisResults.grossExitProceeds,
    mainAnalysisResults.totalExitProceeds
  ]);

  // Calculate OZ benefits based on GO/NO_GO system
  const ozBenefitStatus = useMemo(() => {
    const benefits = getOzBenefits(props.selectedState, props.projectLocation);
    const jurisdiction = ALL_JURISDICTIONS[props.selectedState];

    return {
      status: benefits.status,
      message: benefits.message,
      effectiveSavings: benefits.effectiveSavings,
      showProjectSelector: benefits.showProjectSelector,
      jurisdictionName: jurisdiction?.name || props.selectedState,
      jurisdictionRate: jurisdiction?.rate || 0,
      ozConformity: jurisdiction?.ozConformity || 'none'
    };
  }, [props.selectedState, props.projectLocation]);

  // IMPL-065: OZ Deferral NPV now comes from engine (single source of truth)
  // Engine uses 8% discount rate (calculations.ts:1529)
  // Previously hook used 10% - this was inconsistent

  // IMPL-020a: Unified benefits summary (fixes TaxPlanningCapacitySection violations)
  // Single source of truth for all investor benefit calculations
  // ISS-022: Use engine's investorTaxBenefits (correct) instead of hook's taxCalculations.netTaxBenefit (buggy)
  // The hook calculation had a double-counting bug in years2toNDepreciation × (holdPeriod - 1)
  const unifiedBenefitsSummary = useMemo(() => {
    // IMPL-065: Use engine's ozDeferralNPV (8% discount rate)
    const engineOzDeferralNPV = mainAnalysisResults?.ozDeferralNPV || 0;

    // ISS-022: Use engine's investorTaxBenefits (single source of truth)
    const engineTaxBenefits = mainAnalysisResults?.investorTaxBenefits || 0;

    const total10YearBenefits =
      engineTaxBenefits +
      (lihtcResult?.totalCredits || 0) +
      (props.stateLIHTCEnabled ? (stateLIHTCResult?.netBenefit || 0) : 0) +
      (props.ozEnabled ? engineOzDeferralNPV : 0);

    const investorEquity = mainAnalysisResults?.investorEquity || 0;
    const benefitMultiple = investorEquity > 0 ? total10YearBenefits / investorEquity : 0;

    // ISS-065: Removed excessBenefits calculation (Excess Capacity section removed from UI)
    return { total10YearBenefits, benefitMultiple };
  }, [
    lihtcResult,
    stateLIHTCResult,
    props.stateLIHTCEnabled,
    props.ozEnabled,
    mainAnalysisResults
  ]);

  console.log('📊 Returning Investor Metrics:', {
    irr: mainAnalysisResults.irr,
    multiple: mainAnalysisResults.multiple,
    exitProceeds: mainAnalysisResults.exitProceeds,
    totalReturns: mainAnalysisResults.totalReturns
  });

  return {
    // Depreciation
    ...depreciationCalculations,

    // Tax calculations
    ...taxCalculations,
    // IMPL-057: Override with engine value (single source of truth)
    // Note: netTaxBenefit is NOT overridden here because advanceFinancingCalculations
    // depends on the pre-engine value for internal consistency. The advance financing
    // feature may need its own fix in a future IMPL.
    totalTaxBenefit: mainAnalysisResults.investorTaxBenefits,

    // Advance financing
    ...advanceFinancingCalculations,

    // Investment calculations
    ...investmentCalculations,

    // Analysis results
    mainAnalysisResults,
    hdcAnalysisResults,

    // Convenience properties
    investorCashFlows: mainAnalysisResults.investorCashFlows,
    exitProceeds: mainAnalysisResults.exitProceeds,
    totalInvestment: mainAnalysisResults.totalInvestment,
    totalReturns: mainAnalysisResults.totalReturns,
    multipleOnInvested: mainAnalysisResults.multiple,
    investorIRR: mainAnalysisResults.irr,
    
    hdcCashFlows: hdcAnalysisResults.hdcCashFlows,
    hdcExitProceeds: hdcAnalysisResults.hdcExitProceeds,
    hdcTotalReturns: hdcAnalysisResults.totalHDCReturns,
    hdcMultiple: hdcAnalysisResults.hdcMultiple,
    hdcIRR: hdcAnalysisResults.hdcIRR,

    // OZ Benefits Status
    ozBenefitStatus,

    // Federal LIHTC (v7.0.11)
    lihtcEligibleBasis,
    lihtcResult,
    // ISS-029: PAB amount for capital stack
    pabAmount,

    // State LIHTC (v7.0.14)
    stateLIHTCResult,

    // State LIHTC Integration (IMPL-018)
    stateLIHTCIntegration,

    // OZ Deferral NPV (v7.0.14) - IMPL-065: From engine (single source of truth)
    ozDeferralNPV: mainAnalysisResults.ozDeferralNPV || 0,

    // IMPL-020a: Unified benefits summary for UI components
    unifiedBenefitsSummary,
    effectiveProjectCost
  };
};