import React from 'react';
// IMPL-058: InvestmentSummarySection removed - consolidated into CapitalStructureSection
import CapitalStructureSection from './results/CapitalStructureSection';
import DSCRAnalysisSection from './results/DSCRAnalysisSection';
// IMPL-078: FreeInvestmentAnalysisSection and TaxPlanningCapacitySection merged into InvestmentRecoverySection
import InvestmentRecoverySection from './results/InvestmentRecoverySection';
// Phase A2: Tax Utilization Section (conditionally replaces InvestmentRecoverySection when income composition provided)
import TaxUtilizationSection from './results/TaxUtilizationSection';
import InvestorCashFlowSection from './results/InvestorCashFlowSection';
import HDCCashFlowSection from './results/HDCCashFlowSection';
import DistributableCashFlowTable from './results/DistributableCashFlowTable';
import OutsideInvestorSection from './results/OutsideInvestorSection';
import HDCPlatformSection from './results/HDCPlatformSection';
import { HDCComprehensiveReportButton } from './reports/HDCComprehensiveReport';
import { HDCTaxReportJsPDFButton } from './reports/HDCTaxReportJsPDF';
import { ExportAuditButton } from './results/ExportAuditButton';
import { LIHTCCreditSchedule } from '../taxbenefits/results/LIHTCCreditSchedule';
import StateLIHTCIntegrationSection from './results/StateLIHTCIntegrationSection';
import KPIStrip from './results/KPIStrip';
import ReturnsBuiltupStrip from './results/ReturnsBuiltupStrip';
import type { InvestorAnalysisResults, CashFlowItem, HDCAnalysisResults, HDCCashFlowItem, StateLIHTCIntegrationResult } from '../../types/taxbenefits';
import type { LIHTCCreditSchedule as LIHTCCreditScheduleType } from '../../utils/taxbenefits/lihtcCreditCalculations';

interface HDCResultsComponentProps {
  // Calculated values
  investorEquity: number;
  hdcFee: number;
  year1HdcFee: number;
  investorEquityPct: number;
  philanthropicEquityPct: number;
  seniorDebtPct: number;
  philDebtPct: number;
  hdcSubDebtPct: number;
  investorSubDebtPct: number;
  outsideInvestorSubDebtPct: number;
  totalCapitalStructure: number;
  year1TaxBenefit: number;
  year1NetBenefit: number;
  // ISS-065: Removed freeInvestmentHurdle, investmentRecovered, totalNetTaxBenefitsAfterCG
  totalNetTaxBenefits: number;
  totalCapitalGainsRate: number;
  deferredGains: number;
  deferredGainsTaxDue: number;
  mainAnalysisResults: InvestorAnalysisResults;
  totalInvestment: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  exitProceeds: number;
  investorCashFlows: CashFlowItem[];
  hdcAnalysisResults: HDCAnalysisResults;
  hdcCashFlows: HDCCashFlowItem[];
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;
  total10YearDepreciation: number;
  totalTaxBenefit: number;
  effectiveTaxRateForDepreciation: number;
  // IMPL-068: Split rates for validation sheet export
  effectiveTaxRateForBonus?: number;      // Effective rate for bonus depreciation (conformity-adjusted)
  effectiveTaxRateForStraightLine?: number; // Effective rate for straight-line MACRS (full state rate)
  yearOneDepreciation: number;
  annualStraightLineDepreciation: number;
  years2to10Depreciation: number;
  holdPeriod: number;

  // State values
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  hdcSubDebtPikRate: number;
  investorPikCurrentPayEnabled: boolean;
  investorPikCurrentPayPct: number;
  outsideInvestorSubDebtPikRate: number;
  outsideInvestorPikCurrentPayEnabled: boolean;
  outsideInvestorPikCurrentPayPct: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  projectCost: number;
  depreciableBasis: number;
  investorPromoteShare: number;
  federalTaxRate: number;
  selectedState: string;
  investorState?: string;  // IMPL-064: Investor's state for tax calculations (separate from property state)
  ltCapitalGainsRate: number;
  niitRate: number;
  stateCapitalGainsRate: number;
  yearOneDepreciationPct: number;
  constructionDelayMonths: number;
  ozType: 'standard' | 'rural';
  ozVersion?: '1.0' | '2.0';
  ozCapitalGainsTaxRate: number;

  // Additional props needed for comprehensive report
  landValue: number;
  yearOneNOI: number;
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  exitCapRate: number;
  seniorDebtRate: number;
  seniorDebtAmortization: number;
  seniorDebtIOYears?: number;
  philDebtRate: number;
  philDebtAmortization?: number;
  investorSubDebtPikRate: number;
  aumCurrentPayEnabled: boolean;
  aumCurrentPayPct: number;
  hdcDeferredInterestRate: number;
  philCurrentPayEnabled: boolean;
  philCurrentPayPct: number;
  projectName?: string;
  projectLocation?: string;
  predevelopmentCosts?: number;
  interestReserveEnabled?: boolean;
  interestReserveMonths?: number;
  hdcAdvanceFinancing?: boolean;
  taxAdvanceDiscountRate?: number;
  advanceFinancingRate?: number;
  taxDeliveryMonths?: number;
  // placedInServiceMonth removed (IMPL-117) — now engine-internal, auto-derived from timeline
  // exitMonth removed (IMPL-117) — now engine-internal, auto-derived from timeline
  subDebtPriority?: 'investor' | 'outside';
  includeOutsideInvestor?: boolean;

  // Additional props for segment analysis
  investorTrack?: 'rep' | 'non-rep';
  stateTaxRate: number;
  deferredCapitalGains: number;
  hdcFeeRate: number;

  // Expandable sections state
  taxCalculationExpanded: boolean;
  setTaxCalculationExpanded: (value: boolean) => void;
  taxOffsetExpanded: boolean;
  setTaxOffsetExpanded: (value: boolean) => void;
  depreciationScheduleExpanded: boolean;
  setDepreciationScheduleExpanded: (value: boolean) => void;

  // Tax Planning
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;

  // Federal LIHTC (v7.0.11)
  lihtcResult?: LIHTCCreditScheduleType | null;

  // Private Activity Bonds (IMPL-080 / ISS-030 / ISS-031)
  pabEnabled?: boolean;
  pabPctOfEligibleBasis?: number;
  pabRate?: number;
  pabAmortization?: number;
  pabIOYears?: number;
  lihtcEligibleBasis?: number;
  // ISS-031: PAB as % of project cost (for capital stack display)
  pabPctOfProject?: number;
  pabFundingAmount?: number;

  // ISS-034: HDC Debt Fund params for export
  hdcDebtFundPct?: number;
  hdcDebtFundPikRate?: number;
  hdcDebtFundCurrentPayEnabled?: boolean;
  hdcDebtFundCurrentPayPct?: number;

  // ISS-035: LIHTC Eligible Basis Exclusions for export
  commercialSpaceCosts?: number;
  syndicationCosts?: number;
  marketingCosts?: number;
  financingFees?: number;
  bondIssuanceCosts?: number;
  operatingDeficitReserve?: number;
  replacementReserve?: number;
  otherExclusions?: number;

  // Helper functions
  formatCurrency: (value: number) => string;

  // Constants
  CONFORMING_STATES: { [key: string]: { name: string; rate: number; tier: string } };
  isConformingState: boolean;

  // Platform mode
  hdcPlatformMode?: 'traditional' | 'leverage';
  setHdcPlatformMode?: (value: 'traditional' | 'leverage') => void;

  // Unified Benefits Summary (v7.0.14)
  federalLihtcTotalCredits?: number;
  stateLihtcTotalCredits?: number;
  stateLihtcEnabled?: boolean;
  ozDeferralNPV?: number;
  ozEnabled?: boolean;

  // IMPL-020a: Pre-calculated benefits from engine (single source of truth)
  // ISS-065: Removed excessBenefits (Excess Capacity section removed)
  total10YearBenefits?: number;
  benefitMultiple?: number;

  // State LIHTC Integration (IMPL-018)
  stateLIHTCIntegration?: StateLIHTCIntegrationResult | null;
}

const HDCResultsComponent: React.FC<HDCResultsComponentProps> = (props) => {
  // IMPL-078: year5OZTaxDue removed - no longer needed after merging sections

  return (
    <div className="p-4 md:p-6 rounded-lg shadow h-full hdc-results-container"
         style={{
          borderTop: '4px solid #7FBD45',
          borderBottom: '4px solid #7FBD45',
          borderRadius:'5px',
          background: 'rgba(127, 189, 69, 0.1)'}}
    >
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold" style={{margin: 0, color: '#407F7F'}}>Results</h2>
        {props.mainAnalysisResults && (
          <div className="flex flex-wrap gap-2">
            {/* IMPL-033: Refactored to use engine results directly */}
            <HDCComprehensiveReportButton
              params={{
                // Project Parameters
                projectCost: props.projectCost,
                predevelopmentCosts: props.predevelopmentCosts || 0,
                landValue: props.landValue,
                yearOneNOI: props.yearOneNOI,
                // ISS-068c: Single NOI growth rate
                noiGrowthRate: props.noiGrowthRate,
                exitCapRate: props.exitCapRate,
                holdPeriod: props.holdPeriod,
                constructionDelayMonths: props.constructionDelayMonths,

                // Capital Structure
                investorEquityPct: props.investorEquityPct,
                philanthropicEquityPct: props.philanthropicEquityPct,
                seniorDebtPct: props.seniorDebtPct,
                seniorDebtRate: props.seniorDebtRate,
                seniorDebtAmortization: props.seniorDebtAmortization,
                philanthropicDebtPct: props.philDebtPct,
                philanthropicDebtRate: props.philDebtRate,
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

                // Tax Parameters
                investorTrack: props.investorTrack,
                selectedState: props.selectedState,
                federalTaxRate: props.federalTaxRate,
                stateTaxRate: props.stateTaxRate,
                ltCapitalGainsRate: props.ltCapitalGainsRate,
                stateCapitalGainsRate: props.stateCapitalGainsRate,
                niitRate: props.niitRate,
                yearOneDepreciationPct: props.yearOneDepreciationPct,

                // OZ Settings
                ozEnabled: props.ozEnabled || (props.ozType !== undefined && props.deferredCapitalGains > 0),
                ozType: props.ozType,
                deferredCapitalGains: props.deferredCapitalGains,

                // Fee Settings
                hdcFeeRate: props.hdcFeeRate,
                aumFeeEnabled: props.aumFeeEnabled,
                aumFeeRate: props.aumFeeRate,
                aumCurrentPayEnabled: props.aumCurrentPayEnabled,
                aumCurrentPayPct: props.aumCurrentPayPct,
                hdcDeferredInterestRate: props.hdcDeferredInterestRate,
                investorPromoteShare: props.investorPromoteShare,

                // Required CalculationParams fields
                hdcAdvanceFinancing: props.hdcAdvanceFinancing || false,
                investorUpfrontCash: 0,
                totalTaxBenefit: props.totalTaxBenefit,
                netTaxBenefit: props.year1NetBenefit,
                hdcFee: props.hdcFee,
              }}
              investorResults={props.mainAnalysisResults}
              hdcResults={props.hdcAnalysisResults}
              projectName={props.projectName}
              projectLocation={props.projectLocation}
            />
            {/* IMPL-033 Step 3: Refactored to use engine results pattern */}
            <HDCTaxReportJsPDFButton
              params={{
                projectCost: props.projectCost,
                predevelopmentCosts: props.predevelopmentCosts || 0,
                landValue: props.landValue,
                yearOneNOI: props.yearOneNOI,
                // ISS-068c: Single NOI growth rate
                noiGrowthRate: props.noiGrowthRate,
                exitCapRate: props.exitCapRate,
                holdPeriod: props.holdPeriod,
                investorEquityPct: props.investorEquityPct,
                philanthropicEquityPct: props.philanthropicEquityPct || 0,
                seniorDebtPct: props.seniorDebtPct,
                seniorDebtRate: props.seniorDebtRate,
                seniorDebtAmortization: props.seniorDebtAmortization,
                seniorDebtIOYears: props.seniorDebtIOYears || 0,
                philanthropicDebtPct: props.philDebtPct,
                philanthropicDebtRate: props.philDebtRate,
                philDebtAmortization: props.philDebtAmortization || 60,
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
                federalTaxRate: props.federalTaxRate || 37,
                stateTaxRate: props.stateTaxRate || 10.75,
                hdcFeeRate: props.hdcFeeRate,
                aumFeeEnabled: props.aumFeeEnabled,
                aumFeeRate: props.aumFeeRate,
                aumCurrentPayEnabled: props.aumCurrentPayEnabled,
                aumCurrentPayPct: props.aumCurrentPayPct,
                hdcDeferredInterestRate: props.hdcDeferredInterestRate || 0.08,
                investorTrack: props.investorTrack || 'non-rep',
                selectedState: props.selectedState || 'CA',
                w2Income: props.w2Income || 0,
                businessIncome: props.businessIncome || 0,
                iraBalance: props.iraBalance || 0,
                passiveIncome: props.passiveIncome || 0,
                assetSaleGain: props.assetSaleGain || 0,
                ozEnabled: props.ozEnabled,
                deferredCapitalGains: props.deferredCapitalGains || 0,
                interestReserveEnabled: props.interestReserveEnabled,
                interestReserveMonths: props.interestReserveMonths || 0,
                investorPromoteShare: props.investorPromoteShare,
                hdcAdvanceFinancing: props.hdcAdvanceFinancing || false,
                investorUpfrontCash: 0,
                totalTaxBenefit: props.totalTaxBenefit,
                netTaxBenefit: props.year1NetBenefit,
                hdcFee: props.hdcFee,
              }}
              investorResults={props.mainAnalysisResults}
              hdcResults={props.hdcAnalysisResults}
              projectName={props.projectName}
            />
            <ExportAuditButton
              params={{
                // Project Parameters
                projectCost: props.projectCost,
                predevelopmentCosts: props.predevelopmentCosts || 0,
                landValue: props.landValue,
                yearOneNOI: props.yearOneNOI,

                // Tax Parameters
                yearOneDepreciationPct: props.yearOneDepreciationPct,
                federalTaxRate: props.federalTaxRate,
                stateTaxRate: props.stateTaxRate,
                ltCapitalGainsRate: props.ltCapitalGainsRate,
                niitRate: props.niitRate,
                stateCapitalGainsRate: props.stateCapitalGainsRate,
                selectedState: props.selectedState,
                // IMPL-064: Add missing investor tax params
                investorState: props.investorState || props.selectedState, // Use investorState, fallback to selectedState
                investorTrack: props.investorTrack,
                bonusConformityRate: props.isConformingState ? 1 : 0, // TODO: Pass actual rate from hook

                // IMPL-068: Pass actual effective tax rates (not hardcoded)
                effectiveTaxRate: props.effectiveTaxRateForDepreciation,
                effectiveTaxRateForBonus: props.effectiveTaxRateForBonus ?? props.effectiveTaxRateForDepreciation,
                effectiveTaxRateForStraightLine: props.effectiveTaxRateForStraightLine ?? props.effectiveTaxRateForDepreciation,

                // Capital Structure - Equity
                investorEquityPct: props.investorEquityPct,

                // Capital Structure - Senior Debt
                seniorDebtPct: props.seniorDebtPct,
                seniorDebtRate: props.seniorDebtRate,
                seniorDebtAmortization: props.seniorDebtAmortization,
                seniorDebtIOYears: props.seniorDebtIOYears || 0,

                // Capital Structure - Phil Debt
                philanthropicDebtPct: props.philDebtPct,
                philanthropicDebtRate: props.philDebtRate,
                philDebtAmortization: props.philDebtAmortization || 60,
                philCurrentPayEnabled: props.philCurrentPayEnabled,
                philCurrentPayPct: props.philCurrentPayPct,

                // Capital Structure - HDC Sub-Debt
                hdcSubDebtPct: props.hdcSubDebtPct,
                hdcSubDebtPikRate: props.hdcSubDebtPikRate,
                pikCurrentPayEnabled: props.pikCurrentPayEnabled,
                pikCurrentPayPct: props.pikCurrentPayPct,

                // Capital Structure - Investor Sub-Debt
                investorSubDebtPct: props.investorSubDebtPct,
                investorSubDebtPikRate: props.investorSubDebtPikRate,
                investorPikCurrentPayEnabled: props.investorPikCurrentPayEnabled,
                investorPikCurrentPayPct: props.investorPikCurrentPayPct,

                // Capital Structure - Outside Investor Sub-Debt
                outsideInvestorSubDebtPct: props.outsideInvestorSubDebtPct,
                outsideInvestorSubDebtPikRate: props.outsideInvestorSubDebtPikRate,
                outsideInvestorPikCurrentPayEnabled: props.outsideInvestorPikCurrentPayEnabled,
                outsideInvestorPikCurrentPayPct: props.outsideInvestorPikCurrentPayPct,

                // Interest Reserve
                interestReserveEnabled: props.interestReserveEnabled,
                interestReserveMonths: props.interestReserveMonths,

                // Operating Projections
                holdPeriod: props.holdPeriod,
                // ISS-068c: Single NOI growth rate
                noiGrowthRate: props.noiGrowthRate,
                exitCapRate: props.exitCapRate,
                investorPromoteShare: props.investorPromoteShare,
                constructionDelayMonths: props.constructionDelayMonths,

                // Opportunity Zone
                ozEnabled: props.ozEnabled || (props.ozType !== undefined && props.deferredCapitalGains > 0),
                ozVersion: props.ozVersion || '2.0',
                ozType: props.ozType,
                deferredCapitalGains: props.deferredCapitalGains,
                capitalGainsTaxRate: props.ozCapitalGainsTaxRate,

                // IMPL-064: Add missing LIHTC params (metadata uses decimals, params expect percentages)
                lihtcEnabled: props.lihtcResult != null,
                // IMPL-129: Pass pre-computed LIHTC credit schedule for cash flow calculation
                federalLIHTCCredits: props.lihtcResult?.yearlyBreakdown?.map(y => y.creditAmount) || [],
                applicableFraction: props.lihtcResult?.metadata?.stabilizedApplicableFraction != null
                  ? props.lihtcResult.metadata.stabilizedApplicableFraction * 100 : undefined,
                creditRate: props.lihtcResult?.metadata?.creditRate != null
                  ? props.lihtcResult.metadata.creditRate * 100 : undefined,
                ddaQctBoost: props.lihtcResult?.metadata?.boostMultiplier === 1.3,
                stateLIHTCEnabled: props.stateLihtcEnabled,
                // ISS-024: Pass full stateLIHTCIntegration for yearlyCredits access in export
                stateLIHTCIntegration: props.stateLIHTCIntegration,
                // ISS-015: Pass actual syndicationRate for export (convert 0.0-1.0 to percentage 0-100)
                syndicationRate: props.stateLIHTCIntegration?.syndicationRate != null
                  ? props.stateLIHTCIntegration.syndicationRate * 100 : undefined,
                // ISS-016/ISS-024: Pass State LIHTC annual credit using actual duration from yearlyCredits
                stateLIHTCAnnualCredit: props.stateLIHTCIntegration?.grossCredit != null && props.stateLIHTCIntegration?.yearlyCredits
                  ? props.stateLIHTCIntegration.grossCredit / Math.max(props.stateLIHTCIntegration.yearlyCredits.length - 1, 1)
                  : undefined,
                // IMPL-077: Pass Syndication Year from engine results
                stateLIHTCSyndicationYear: props.mainAnalysisResults.stateLIHTCSyndicationYear,

                // ISS-030: Pass PAB params for export
                pabEnabled: props.pabEnabled,
                pabPctOfEligibleBasis: props.pabPctOfEligibleBasis,
                pabRate: props.pabRate,
                pabAmortization: props.pabAmortization,
                pabIOYears: props.pabIOYears,
                lihtcEligibleBasis: props.lihtcEligibleBasis,

                // ISS-034: Pass HDC Debt Fund params for export
                hdcDebtFundPct: props.hdcDebtFundPct,
                hdcDebtFundPikRate: props.hdcDebtFundPikRate,
                hdcDebtFundCurrentPayEnabled: props.hdcDebtFundCurrentPayEnabled,
                hdcDebtFundCurrentPayPct: props.hdcDebtFundCurrentPayPct,

                // ISS-035: Pass exclusions for export
                commercialSpaceCosts: props.commercialSpaceCosts,
                syndicationCosts: props.syndicationCosts,
                marketingCosts: props.marketingCosts,
                financingFees: props.financingFees,
                bondIssuanceCosts: props.bondIssuanceCosts,
                operatingDeficitReserve: props.operatingDeficitReserve,
                replacementReserve: props.replacementReserve,
                otherExclusions: props.otherExclusions,

                // HDC Fees
                hdcFeeRate: props.hdcFeeRate,
                hdcDeferredInterestRate: props.hdcDeferredInterestRate,
                hdcAdvanceFinancing: props.hdcAdvanceFinancing || false,
                taxAdvanceDiscountRate: props.taxAdvanceDiscountRate,
                advanceFinancingRate: props.advanceFinancingRate,
                taxDeliveryMonths: props.taxDeliveryMonths,

                // AUM Fees
                aumFeeEnabled: props.aumFeeEnabled,
                aumFeeRate: props.aumFeeRate,
                aumCurrentPayEnabled: props.aumCurrentPayEnabled,
                aumCurrentPayPct: props.aumCurrentPayPct,

                // IMPL-129: Enable exit tax analysis for OZ recapture avoided calculation
                includeDepreciationSchedule: true,

                // Legacy/Computed fields
                investorUpfrontCash: 0,
                totalTaxBenefit: props.totalTaxBenefit,
                netTaxBenefit: props.year1NetBenefit,
                hdcFee: props.hdcFee,
              }}
              investorResults={props.mainAnalysisResults}
              hdcResults={props.hdcAnalysisResults}
              projectName={props.projectName}
            />
          </div>
        )}
      </div>

        {/* IMPL-036b: Sticky container for KPI and Returns strips */}
        {/* Wrapping both in a single sticky container ensures they stay together */}
        <div className="sticky top-0 z-40" style={{ backgroundColor: 'var(--hdc-aqua-haze)' }}>
          {/* IMPL-026: KPI Strip - Investor-focused metrics */}
          {props.mainAnalysisResults && props.investorCashFlows && (
            <KPIStrip
              mainAnalysisResults={props.mainAnalysisResults}
              cashFlows={props.investorCashFlows}
              investorEquity={props.investorEquity}
              totalProjectCost={props.projectCost + (props.predevelopmentCosts || 0)}
              stateLIHTCIntegration={props.stateLIHTCIntegration}
            />
          )}

          {/* Returns Buildup Strip - Component-by-component multiple breakdown (IMPL-028) */}
          {props.mainAnalysisResults && props.investorCashFlows && (
            <ReturnsBuiltupStrip
              mainAnalysisResults={props.mainAnalysisResults}
              cashFlows={props.investorCashFlows}
            />
          )}
        </div>

        {/* IMPL-058: InvestmentSummarySection removed - info consolidated below */}
        <CapitalStructureSection
          investorEquityPct={props.investorEquityPct}
          philanthropicEquityPct={props.philanthropicEquityPct}
          seniorDebtPct={props.seniorDebtPct}
          philDebtPct={props.philDebtPct}
          hdcSubDebtPct={props.hdcSubDebtPct}
          investorSubDebtPct={props.investorSubDebtPct}
          outsideInvestorSubDebtPct={props.outsideInvestorSubDebtPct}
          totalCapitalStructure={props.totalCapitalStructure}
          // IMPL-058: Dollar amounts for consolidated display
          investorEquity={props.investorEquity}
          syndicatedEquityOffset={props.mainAnalysisResults?.syndicatedEquityOffset}
          // ISS-031: PAB display
          pabPctOfProject={props.pabPctOfProject}
          pabFundingAmount={props.pabFundingAmount}
          // State LIHTC Integration (IMPL-018)
          stateLIHTCProceeds={props.stateLIHTCIntegration?.netProceeds}
          stateLIHTCEnabled={props.stateLihtcEnabled}
          syndicationRate={props.stateLIHTCIntegration?.syndicationRate}
          projectCost={props.projectCost}
          formatCurrency={props.formatCurrency}
        />

        {/* Federal LIHTC Credit Schedule (v7.0.11) */}
        {props.lihtcResult && (
          <LIHTCCreditSchedule
            result={props.lihtcResult}
            formatCurrency={props.formatCurrency}
          />
        )}

        {/* State LIHTC Integration (IMPL-018) */}
        {props.stateLIHTCIntegration && (
          <StateLIHTCIntegrationSection
            stateLIHTCIntegration={props.stateLIHTCIntegration}
            formatCurrency={props.formatCurrency}
          />
        )}

        <DSCRAnalysisSection 
          investorCashFlows={props.investorCashFlows}
          holdPeriod={props.holdPeriod}
          formatCurrency={props.formatCurrency}
        />

        {/* Phase A2: Conditional Tax Utilization / Investment Recovery Section */}
        {/* When income composition is provided, taxUtilization is computed and we show the detailed analysis */}
        {/* Otherwise, show the original Investment Recovery section */}
        {props.mainAnalysisResults?.taxUtilization ? (
          <TaxUtilizationSection
            taxUtilization={props.mainAnalysisResults.taxUtilization}
            totalInvestment={props.totalInvestment}
            formatCurrency={props.formatCurrency}
          />
        ) : (
          /* IMPL-078: Merged Investment Recovery & Tax Planning Section */
          /* ISS-023: totalInvestment is MOIC basis (net for Y0 syndication, gross otherwise) */
          <InvestmentRecoverySection
            totalInvestment={props.totalInvestment}
            year1TaxBenefit={props.investorCashFlows?.[0]?.taxBenefit || 0}
            total10YearBenefits={props.total10YearBenefits || 0}
            benefitMultiple={props.benefitMultiple || 0}
            investorCashFlows={props.investorCashFlows}
            formatCurrency={props.formatCurrency}
          />
        )}

        <InvestorCashFlowSection
          investorCashFlows={props.investorCashFlows}
          holdPeriod={props.holdPeriod}
          hdcSubDebtPct={props.hdcSubDebtPct}
          pikCurrentPayEnabled={props.pikCurrentPayEnabled}
          pikCurrentPayPct={props.pikCurrentPayPct}
          investorSubDebtPct={props.investorSubDebtPct}
          investorPikCurrentPayEnabled={props.investorPikCurrentPayEnabled}
          investorPikCurrentPayPct={props.investorPikCurrentPayPct}
          exitProceeds={props.exitProceeds}
          mainAnalysisResults={props.mainAnalysisResults}
          totalReturns={props.totalReturns}
          multipleOnInvested={props.multipleOnInvested}
          investorIRR={props.investorIRR}
          totalInvestment={props.totalInvestment}
          formatCurrency={props.formatCurrency}
          // State LIHTC Integration (IMPL-018)
          hasStateLIHTCDirectUse={props.stateLIHTCIntegration?.creditPath === 'direct_use'}
        />

        <DistributableCashFlowTable
          investorCashFlows={props.investorCashFlows}
          holdPeriod={props.holdPeriod}
          formatCurrency={props.formatCurrency}
          aumFeeEnabled={props.aumFeeEnabled}
          aumFeeRate={props.aumFeeRate}
          constructionDelayMonths={props.constructionDelayMonths}
          hdcFeeRate={props.hdcFeeRate}
          yearOneDepreciation={props.yearOneDepreciation}
          annualStraightLineDepreciation={props.annualStraightLineDepreciation}
          effectiveTaxRate={props.effectiveTaxRateForDepreciation}
        />

        <HDCCashFlowSection 
          hdcCashFlows={props.hdcCashFlows}
          holdPeriod={props.holdPeriod}
          aumFeeEnabled={props.aumFeeEnabled}
          aumFeeRate={props.aumFeeRate}
          hdcAnalysisResults={props.hdcAnalysisResults}
          hdcExitProceeds={props.hdcExitProceeds}
          hdcTotalReturns={props.hdcTotalReturns}
          hdcMultiple={props.hdcMultiple}
          hdcIRR={props.hdcIRR}
          hdcSubDebtPct={props.hdcSubDebtPct}
          hdcSubDebtPikRate={props.hdcSubDebtPikRate}
          pikCurrentPayEnabled={props.pikCurrentPayEnabled}
          pikCurrentPayPct={props.pikCurrentPayPct}
          investorPromoteShare={props.investorPromoteShare}
          formatCurrency={props.formatCurrency}
        />

        {/* Show HDC Platform Section when in platform mode, otherwise show Outside Investor */}
        {props.hdcPlatformMode === 'leverage' ? (
          <HDCPlatformSection
            hdcPlatformMode={props.hdcPlatformMode}
            outsideInvestorSubDebtPct={props.outsideInvestorSubDebtPct}
            outsideInvestorSubDebtPikRate={props.outsideInvestorSubDebtPikRate}
            outsideInvestorPikCurrentPayEnabled={props.outsideInvestorPikCurrentPayEnabled}
            outsideInvestorPikCurrentPayPct={props.outsideInvestorPikCurrentPayPct}
            projectCost={props.projectCost}
            mainAnalysisResults={props.mainAnalysisResults}
            hdcAnalysisResults={props.hdcAnalysisResults}
            hdcTotalReturns={props.hdcTotalReturns}
            hdcMultiple={props.hdcMultiple}
            hdcIRR={props.hdcIRR}
            investorCashFlows={props.investorCashFlows}
            formatCurrency={props.formatCurrency}
            holdPeriod={props.holdPeriod}
          />
        ) : (
          <OutsideInvestorSection
            outsideInvestorSubDebtPct={props.outsideInvestorSubDebtPct}
            outsideInvestorSubDebtPikRate={props.outsideInvestorSubDebtPikRate}
            outsideInvestorPikCurrentPayEnabled={props.outsideInvestorPikCurrentPayEnabled}
            outsideInvestorPikCurrentPayPct={props.outsideInvestorPikCurrentPayPct}
            projectCost={props.projectCost}
            holdPeriod={props.holdPeriod}
            mainAnalysisResults={props.mainAnalysisResults}
            formatCurrency={props.formatCurrency}
          />
        )}
    </div>
  );
};

export default HDCResultsComponent;