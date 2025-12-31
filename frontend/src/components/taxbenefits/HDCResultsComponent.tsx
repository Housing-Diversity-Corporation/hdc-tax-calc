import React from 'react';
import InvestmentSummarySection from './results/InvestmentSummarySection';
import CapitalStructureSection from './results/CapitalStructureSection';
import DSCRAnalysisSection from './results/DSCRAnalysisSection';
import FreeInvestmentAnalysisSection from './results/FreeInvestmentAnalysisSection';
import TaxPlanningCapacitySection from './results/TaxPlanningCapacitySection';
import InvestorCashFlowSection from './results/InvestorCashFlowSection';
import HDCCashFlowSection from './results/HDCCashFlowSection';
import DistributableCashFlowTable from './results/DistributableCashFlowTable';
import WaterfallExplanationSection from './results/WaterfallExplanationSection';
import OutsideInvestorSection from './results/OutsideInvestorSection';
import HDCPlatformSection from './results/HDCPlatformSection';
import InvestorSegmentAnalysisSection from './results/InvestorSegmentAnalysisSection';
import TaxStrategyMain from './TaxStrategy/TaxStrategyMain';
import { HDCComprehensiveReportButton } from './reports/HDCComprehensiveReport';
import { HDCTaxReportJsPDFButton } from './reports/HDCTaxReportJsPDF';
import { ExportAuditButton } from './results/ExportAuditButton';
import { LIHTCCreditSchedule } from '../taxbenefits/results/LIHTCCreditSchedule';
import StateLIHTCIntegrationSection from './results/StateLIHTCIntegrationSection';
import DealValidationStrip from './results/DealValidationStrip';
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
  freeInvestmentHurdle: number;
  totalNetTaxBenefits: number;
  totalCapitalGainsRate: number;
  deferredGains: number;
  deferredGainsTaxDue: number;
  investmentRecovered: number;
  totalNetTaxBenefitsAfterCG: number;
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
  ltCapitalGainsRate: number;
  niitRate: number;
  stateCapitalGainsRate: number;
  depreciationRecaptureRate: number;
  yearOneDepreciationPct: number;
  constructionDelayMonths: number;
  taxBenefitDelayMonths: number;
  ozType: 'standard' | 'rural';
  ozVersion?: '1.0' | '2.0';
  ozCapitalGainsTaxRate: number;

  // Additional props needed for comprehensive report
  landValue: number;
  yearOneNOI: number;
  revenueGrowth: number;
  expenseGrowth: number;
  exitCapRate: number;
  opexRatio: number;
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
  placedInServiceMonth?: number;
  subDebtPriority?: 'investor' | 'outside';
  includeOutsideInvestor?: boolean;

  // Additional props for segment analysis
  investorTrack?: 'rep' | 'non-rep';
  passiveGainType?: 'short-term' | 'long-term';
  stateTaxRate: number;
  deferredCapitalGains: number;
  hdcFeeRate: number;
  totalHdcFees: number;

  // Expandable sections state
  taxCalculationExpanded: boolean;
  setTaxCalculationExpanded: (value: boolean) => void;
  taxOffsetExpanded: boolean;
  setTaxOffsetExpanded: (value: boolean) => void;
  depreciationScheduleExpanded: boolean;
  setDepreciationScheduleExpanded: (value: boolean) => void;

  // Tax Planning
  includeDepreciationSchedule?: boolean;
  w2Income?: number;
  businessIncome?: number;
  iraBalance?: number;
  passiveIncome?: number;
  assetSaleGain?: number;

  // Federal LIHTC (v7.0.11)
  lihtcResult?: LIHTCCreditScheduleType | null;

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
  total10YearBenefits?: number;
  benefitMultiple?: number;
  excessBenefits?: number;

  // State LIHTC Integration (IMPL-018)
  stateLIHTCIntegration?: StateLIHTCIntegrationResult | null;
}

const HDCResultsComponent: React.FC<HDCResultsComponentProps> = (props) => {
  // Get Year 5 OZ Tax from cash flows (calculated in main engine)
  const year5CashFlow = props.investorCashFlows?.[4]; // Year 5 is index 4
  const year5OZTaxDue = year5CashFlow?.ozYear5TaxPayment || 0;

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
                opexRatio: props.opexRatio,
                revenueGrowth: props.revenueGrowth,
                expenseGrowth: props.expenseGrowth,
                exitCapRate: props.exitCapRate,
                holdPeriod: props.holdPeriod,
                constructionDelayMonths: props.constructionDelayMonths,
                taxBenefitDelayMonths: props.taxBenefitDelayMonths,
                placedInServiceMonth: props.placedInServiceMonth || 7,

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
                depreciationRecaptureRate: props.depreciationRecaptureRate,
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
                opexRatio: props.opexRatio,
                revenueGrowth: props.revenueGrowth,
                expenseGrowth: props.expenseGrowth,
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
                assetGain: props.assetSaleGain || 0,
                ozEnabled: props.ozEnabled,
                deferredCapitalGains: props.deferredCapitalGains || 0,
                taxBenefitDelayMonths: props.taxBenefitDelayMonths || 0,
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
                opexRatio: props.opexRatio,

                // Tax Parameters
                yearOneDepreciationPct: props.yearOneDepreciationPct,
                federalTaxRate: props.federalTaxRate,
                stateTaxRate: props.stateTaxRate,
                ltCapitalGainsRate: props.ltCapitalGainsRate,
                niitRate: props.niitRate,
                stateCapitalGainsRate: props.stateCapitalGainsRate,
                selectedState: props.selectedState,
                placedInServiceMonth: props.placedInServiceMonth || 7,

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
                revenueGrowth: props.revenueGrowth,
                expenseGrowth: props.expenseGrowth,
                exitCapRate: props.exitCapRate,
                investorPromoteShare: props.investorPromoteShare,
                constructionDelayMonths: props.constructionDelayMonths,
                taxBenefitDelayMonths: props.taxBenefitDelayMonths,

                // Opportunity Zone
                ozEnabled: props.ozEnabled || (props.ozType !== undefined && props.deferredCapitalGains > 0),
                ozVersion: props.ozVersion || '2.0',
                ozType: props.ozType,
                deferredCapitalGains: props.deferredCapitalGains,
                capitalGainsTaxRate: props.ozCapitalGainsTaxRate,

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

        {/* IMPL-036b: Sticky container for both validation strips */}
        {/* Wrapping both in a single sticky container ensures they stay together */}
        <div className="sticky top-0 z-40" style={{ backgroundColor: 'var(--hdc-aqua-haze)' }}>
          {/* Deal Validation Strip - Conductor's Dashboard (IMPL-025) */}
          {props.mainAnalysisResults && props.hdcAnalysisResults && (
            <DealValidationStrip
              mainAnalysisResults={props.mainAnalysisResults}
              hdcAnalysisResults={props.hdcAnalysisResults}
              cashFlows={props.investorCashFlows}
              subDebtPct={props.hdcSubDebtPct}
              investorSubDebtPct={props.investorSubDebtPct}
              outsideInvestorSubDebtPct={props.outsideInvestorSubDebtPct}
              philDebtPct={props.philDebtPct}
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

        <InvestmentSummarySection 
          investorEquity={props.investorEquity}
          hdcFee={props.hdcFee}
          formatCurrency={props.formatCurrency}
        />

        <CapitalStructureSection
          investorEquityPct={props.investorEquityPct}
          philanthropicEquityPct={props.philanthropicEquityPct}
          seniorDebtPct={props.seniorDebtPct}
          philDebtPct={props.philDebtPct}
          hdcSubDebtPct={props.hdcSubDebtPct}
          investorSubDebtPct={props.investorSubDebtPct}
          totalCapitalStructure={props.totalCapitalStructure}
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

        <FreeInvestmentAnalysisSection
          year1TaxBenefit={props.year1TaxBenefit}
          hdcFee={props.year1HdcFee}
          year1NetBenefit={props.year1NetBenefit}
          freeInvestmentHurdle={props.freeInvestmentHurdle}
          formatCurrency={props.formatCurrency}
          yearOneDepreciation={props.yearOneDepreciation}
          effectiveTaxRateForDepreciation={props.effectiveTaxRateForDepreciation}
          hdcFeeRate={props.hdcFeeRate}
          depreciationSchedule={props.mainAnalysisResults?.depreciationSchedule}
        />

        <TaxPlanningCapacitySection
          totalNetTaxBenefits={props.totalNetTaxBenefits}
          totalCapitalGainsRate={props.totalCapitalGainsRate}
          investmentRecovered={props.investmentRecovered}
          effectiveTaxRateForDepreciation={props.effectiveTaxRateForDepreciation}
          depreciationRecaptureRate={props.depreciationRecaptureRate}
          year5OZTaxDue={year5OZTaxDue}
          formatCurrency={props.formatCurrency}
          // New props for depreciation details
          yearOneDepreciation={props.yearOneDepreciation}
          yearOneDepreciationPct={props.yearOneDepreciationPct}
          years2to10Depreciation={props.years2to10Depreciation}
          total10YearDepreciation={props.total10YearDepreciation}
          depreciableBasis={props.depreciableBasis}
          annualStraightLineDepreciation={props.annualStraightLineDepreciation}
          totalTaxBenefit={props.totalTaxBenefit}
          hdcFee={props.hdcFee}
          // Unified Benefits Summary (v7.0.14)
          investorEquity={props.investorEquity}
          federalLihtcTotalCredits={props.federalLihtcTotalCredits}
          stateLihtcTotalCredits={props.stateLihtcTotalCredits}
          stateLihtcEnabled={props.stateLihtcEnabled}
          ozDeferralNPV={props.ozDeferralNPV}
          ozEnabled={props.ozEnabled}
          // IMPL-020a: Pre-calculated benefits from engine (single source of truth)
          total10YearBenefits={props.total10YearBenefits}
          benefitMultiple={props.benefitMultiple}
          excessBenefits={props.excessBenefits}
        />

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
          taxBenefitDelayMonths={props.taxBenefitDelayMonths}
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

        <InvestorSegmentAnalysisSection
          investorTrack={props.investorTrack}
          passiveGainType={props.passiveGainType}
          projectCost={props.projectCost}
          investorEquityAmount={props.investorEquity / 1000000}
          holdPeriod={props.holdPeriod}
          yearOneDepreciationPct={props.yearOneDepreciationPct}
          federalOrdinaryRate={props.federalTaxRate}
          stateOrdinaryRate={props.stateTaxRate}
          federalCapitalGainsRate={props.ltCapitalGainsRate}
          stateCapitalGainsRate={props.stateCapitalGainsRate}
          selectedState={props.selectedState}
          ozType={props.ozType}
          deferredCapitalGains={props.deferredCapitalGains}
          hdcFeeRate={props.hdcFeeRate}
          aumFeeEnabled={props.aumFeeEnabled}
          aumFeeRate={props.aumFeeRate}
          totalTaxBenefits={props.totalTaxBenefit}
          investorIRR={props.investorIRR}
          hdcTotalFees={props.totalHdcFees}
        />

        <WaterfallExplanationSection
          investorPromoteShare={props.investorPromoteShare}
          yearOneDepreciationPct={props.yearOneDepreciationPct}
        />

        {/* Tax Strategy Analysis - Only show when enabled */}
        {props.includeDepreciationSchedule && props.mainAnalysisResults && (
          <TaxStrategyMain
            hdcResults={props.mainAnalysisResults}
            investorTrack={props.investorTrack || 'rep'}
            year1NetBenefit={props.year1NetBenefit}
            freeInvestmentHurdle={props.freeInvestmentHurdle}
            formatCurrency={props.formatCurrency}
          />
        )}
    </div>
  );
};

export default HDCResultsComponent;