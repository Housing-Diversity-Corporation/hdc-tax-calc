import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { formatCurrencyMillions, formatCurrency } from '../../../utils/taxbenefits/formatters';
import type { InvestorAnalysisResults, CalculationParams, HDCAnalysisResults } from '../../../types/taxbenefits';
// IMPL-058: InvestmentSummarySection removed - duplicate info shown in SimplifiedFreeInvestmentSection
import SimplifiedFreeInvestmentSection from './SimplifiedFreeInvestmentSection';
import SimplifiedTaxPlanningSection from './SimplifiedTaxPlanningSection';
// Phase B1-2: Tax Utilization Section (conditionally replaces SimplifiedTaxPlanningSection when income composition provided)
import TaxUtilizationSection from '../../taxbenefits/results/TaxUtilizationSection';
import InvestorCashFlowSection from '../../taxbenefits/results/InvestorCashFlowSection';
import MetricsCharts from './MetricsCharts';
import { HDCComprehensiveReportButton } from '../../taxbenefits/reports/HDCComprehensiveReport';
import { HDCTaxReportJsPDFButton } from '../../taxbenefits/reports/HDCTaxReportJsPDF';

interface InvestorAnalysisHighlevelMetricsProps {
  // Deal Info props
  dealName?: string;
  dealLocation?: string;
  dealLatitude?: number;
  dealLongitude?: number;
  dealDescription?: string;
  dealImageUrl?: string;
  units?: number;
  affordabilityMix?: string;
  projectStatus?: string;
  minInvestmentAmount?: number;

  // Investment Amount props
  investorEquity: number;
  hdcFee: number;

  // Free Investment Analysis props
  // ISS-065: Removed freeInvestmentHurdle, investmentRecovered (Excess Capacity section removed)
  year1TaxBenefit?: number;
  year1NetBenefit?: number;
  yearOneDepreciation?: number;
  effectiveTaxRateForDepreciation?: number;
  hdcFeeRate?: number;

  // Tax Planning Capacity props
  totalNetTaxBenefits?: number;
  totalCapitalGainsRate?: number;
  yearOneDepreciationPct?: number;
  years2to10Depreciation?: number;
  total10YearDepreciation?: number;
  depreciableBasis?: number;
  annualStraightLineDepreciation?: number;
  totalTaxBenefit?: number;

  // Investor Analysis props
  totalInvestment?: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  exitProceeds: number;
  investorSubDebtPct?: number;

  // Cash Flow props
  investorCashFlows?: any[];
  holdPeriod?: number;
  hdcSubDebtPct?: number;
  pikCurrentPayEnabled?: boolean;
  pikCurrentPayPct?: number;
  investorPikCurrentPayEnabled?: boolean;
  investorPikCurrentPayPct?: number;

  // Main analysis results
  mainAnalysisResults?: InvestorAnalysisResults | null;
  depreciationSchedule?: any;

  // HDC Analysis props
  hdcCashFlows?: any[];
  hdcAnalysisResults?: HDCAnalysisResults | null;
  hdcTotalReturns?: number;
  hdcExitProceeds?: number;

  // OZ props
  deferredGains?: number;
  deferredGainsTaxDue?: number;
  ozEnabled?: boolean;
  year5OZTaxDue?: number;

  // IMPL-044: Returns breakdown components
  investorSubDebtAtExit?: number;
  ozRecaptureAvoided?: number;
  ozDeferralNPV?: number;
  ozExitAppreciation?: number;
  remainingLIHTCCredits?: number;
  investorTaxBenefits?: number;
  investorOperatingCashFlows?: number;

  // IMPL-044b: PDF export props
  params?: CalculationParams;
}

const InvestorAnalysisHighlevelMetrics: React.FC<InvestorAnalysisHighlevelMetricsProps> = ({
  // Deal Info
  dealName,
  dealLocation,
  dealLatitude,
  dealLongitude,
  dealDescription,
  dealImageUrl,
  units,
  affordabilityMix,
  projectStatus,
  minInvestmentAmount,

  // Investment Amount
  investorEquity,
  hdcFee,

  // Free Investment Analysis
  // ISS-065: Removed freeInvestmentHurdle, investmentRecovered
  year1TaxBenefit = 0,
  year1NetBenefit = 0,
  yearOneDepreciation = 0,
  effectiveTaxRateForDepreciation = 0,
  hdcFeeRate = 0,

  // Tax Planning Capacity
  totalNetTaxBenefits = 0,
  totalCapitalGainsRate = 0,
  yearOneDepreciationPct = 0,
  years2to10Depreciation = 0,
  total10YearDepreciation = 0,
  depreciableBasis = 0,
  annualStraightLineDepreciation = 0,
  totalTaxBenefit = 0,

  // Investor Analysis
  totalInvestment = 0,
  totalReturns,
  multipleOnInvested,
  investorIRR,
  exitProceeds,
  investorSubDebtPct = 0,

  // Cash Flow props
  investorCashFlows = [],
  holdPeriod = 10,
  hdcSubDebtPct = 0,
  pikCurrentPayEnabled = false,
  pikCurrentPayPct = 0,
  investorPikCurrentPayEnabled = false,
  investorPikCurrentPayPct = 0,

  // Other
  mainAnalysisResults,
  depreciationSchedule,

  // HDC Analysis
  hdcCashFlows = [],
  hdcAnalysisResults,
  hdcTotalReturns = 0,
  hdcExitProceeds = 0,

  ozEnabled = false,
  year5OZTaxDue = 0,

  // IMPL-044: Returns breakdown components
  investorSubDebtAtExit = 0,
  ozRecaptureAvoided = 0,
  ozDeferralNPV = 0,
  ozExitAppreciation = 0,
  remainingLIHTCCredits = 0,
  investorTaxBenefits = 0,
  investorOperatingCashFlows = 0,

  // IMPL-044: PDF export props
  params,
}) => {
  // IMPL-044: Calculate total OZ benefits
  const totalOzBenefits = ozRecaptureAvoided + ozDeferralNPV + ozExitAppreciation;
  return (
    <div className="flex flex-col gap-6 w-full mb-8">
      <div className="pink-background flex flex-col gap-6 w-full p-4 rounded-lg shadow-sm">
        {/* Top Row - Deal Information if available */}
        {(dealName || dealLocation || dealDescription || dealImageUrl) && (
          <div className="w-full">
            <Card className="h-fit overflow-hidden bg-transparent">
              <div className="flex flex-col lg:flex-row lg:items-stretch">
                {/* Deal Image - Left side in horizontal layout */}
                {dealImageUrl && (
                  <div className="w-full lg:w-1/2 min-h-[400px] lg:min-h-[500px] flex-shrink-0 relative bg-gray-100 overflow-hidden">
                    <img
                      src={dealImageUrl}
                      alt={dealName || 'Deal image'}
                      className="w-full h-full object-cover"
                    />
                    {/* Property Details Overlay on Image */}
                    {(units || affordabilityMix || projectStatus) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white" style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)'
                      }}>
                        <p className="text-sm font-semibold mb-3">Property Details</p>
                        <div className="flex gap-6 flex-wrap">
                          {units && (
                            <div>
                              <span className="text-xs opacity-70 block">Units</span>
                              <span className="text-sm font-semibold">{units}</span>
                            </div>
                          )}
                          {affordabilityMix && (
                            <div>
                              <span className="text-xs opacity-70 block">Affordability Mix</span>
                              <span className="text-sm font-semibold">{affordabilityMix}</span>
                            </div>
                          )}
                          {projectStatus && (
                            <div>
                              <span className="text-xs opacity-70 block">Status</span>
                              <span className="text-sm font-semibold capitalize">
                                {projectStatus === 'available' ? 'Available' : projectStatus}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Deal Info - Right side in horizontal layout */}
                <div className="p-6 flex-1 min-w-0 flex flex-col lg:h-full">
                  {/* Deal Name */}
                  {dealName && (
                    <h5 className="text-2xl font-semibold text-[#276221] mb-2">
                      {dealName}
                    </h5>
                  )}

                  {/* Location  + Investment Amount */}
                  <div>
                    {dealLocation && (
                      <div className="flex items-center gap-2 mb-4">
                        <p className="text-sm text-gray-600 flex-1">
                          {dealLocation}
                        </p>
                      </div>
                    )}
                    {minInvestmentAmount && (
                      <p className="text-sm text-gray-600 mb-4">
                        Minimum Investment Amount: {formatCurrency(minInvestmentAmount)}
                      </p>
                    )}
                  </div>


                  {/* Description - flexible scrollable area */}
                  {dealDescription && (
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-sm md:text-xs lg:text-sm text-gray-600 leading-relaxed">
                        {dealDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}


        {/* Container for Free Investment and Tax Planning sections */}
        {/* IMPL-058: InvestmentSummarySection removed - investor equity shown in Free Investment section */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 w-full items-start">
          {/* Left Column - Free Investment Analysis (includes Investor Equity) */}
          <div className="w-full h-auto md:h-full">
            <SimplifiedFreeInvestmentSection
              year1NetBenefit={year1NetBenefit}
              investorEquity={investorEquity}
              formatCurrency={formatCurrencyMillions}
            />
          </div>

          {/* Right Column - Tax Planning Capacity Section */}
          {/* Phase B1-2: Conditional Tax Utilization / Simplified Tax Planning Section */}
          {/* When income composition is provided, taxUtilization is computed and we show the detailed analysis */}
          {/* Otherwise, show the original Simplified Tax Planning section */}
          <div className="h-full w-full flex-1">
            {mainAnalysisResults?.taxUtilization ? (
              <TaxUtilizationSection
                taxUtilization={mainAnalysisResults.taxUtilization}
                totalInvestment={totalInvestment || 0}
                formatCurrency={formatCurrencyMillions}
              />
            ) : (
              <SimplifiedTaxPlanningSection
                totalNetTaxBenefits={totalNetTaxBenefits}
                hdcFee={hdcFee}
                hdcFeeRate={hdcFeeRate}
                year1NetBenefit={year1NetBenefit}
                year5OZTaxDue={year5OZTaxDue}
                totalCapitalGainsRate={totalCapitalGainsRate}
                effectiveTaxRateForDepreciation={effectiveTaxRateForDepreciation}
                formatCurrency={formatCurrencyMillions}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full p-4 rounded-lg shadow-sm">

          {/* IMPL-044: Returns Breakdown Section */}
          {mainAnalysisResults && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-[#276221] mb-4">Returns Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Tax Benefits</span>
                  <span className="text-sm font-medium">{formatCurrencyMillions(investorTaxBenefits)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Operating Cash Flows</span>
                  <span className="text-sm font-medium">{formatCurrencyMillions(investorOperatingCashFlows)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Exit Proceeds</span>
                  <span className="text-sm font-medium">{formatCurrencyMillions(exitProceeds)}</span>
                </div>
                {investorSubDebtAtExit > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Sub-Debt Repayment</span>
                    <span className="text-sm font-medium">{formatCurrencyMillions(investorSubDebtAtExit)}</span>
                  </div>
                )}
                {ozEnabled && holdPeriod >= 10 && totalOzBenefits > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-gray-600">OZ Tax Benefits</span>
                    <span className="text-sm font-medium">{formatCurrencyMillions(totalOzBenefits)}</span>
                  </div>
                )}
                {remainingLIHTCCredits > 0 && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm text-gray-600">LIHTC Catch-up</span>
                    <span className="text-sm font-medium">{formatCurrencyMillions(remainingLIHTCCredits)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 mt-2 border-t-2 border-gray-300">
                  <span className="text-sm font-semibold text-gray-800">Total Returns</span>
                  <span className="text-sm font-bold text-[#276221]">{formatCurrencyMillions(totalReturns)}</span>
                </div>
              </div>

              {/* IMPL-044b: PDF Export Buttons */}
              {params && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <HDCComprehensiveReportButton
                    params={params}
                    investorResults={mainAnalysisResults}
                    hdcResults={hdcAnalysisResults ?? null}
                    projectName={dealName}
                    projectLocation={dealLocation}
                  />
                  <HDCTaxReportJsPDFButton
                    params={params}
                    investorResults={mainAnalysisResults}
                    hdcResults={hdcAnalysisResults ?? null}
                    projectName={dealName}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Fourth Row - 10-Year Investor Analysis Section */}
          {mainAnalysisResults && (
            <InvestorCashFlowSection
              investorCashFlows={investorCashFlows}
              holdPeriod={holdPeriod}
              hdcSubDebtPct={hdcSubDebtPct}
              pikCurrentPayEnabled={pikCurrentPayEnabled}
              pikCurrentPayPct={pikCurrentPayPct}
              investorSubDebtPct={investorSubDebtPct}
              investorPikCurrentPayEnabled={investorPikCurrentPayEnabled}
              investorPikCurrentPayPct={investorPikCurrentPayPct}
              exitProceeds={exitProceeds}
              mainAnalysisResults={mainAnalysisResults}
              totalReturns={totalReturns}
              multipleOnInvested={multipleOnInvested}
              investorIRR={investorIRR}
              totalInvestment={totalInvestment || investorEquity}
              formatCurrency={formatCurrencyMillions}
            />
          )}

          {/* Metrics Charts Section */}
          {mainAnalysisResults && (
            <MetricsCharts
              investorEquity={investorEquity}
              totalReturns={totalReturns}
              multipleOnInvested={multipleOnInvested}
              investorIRR={investorIRR}
              investorCashFlows={investorCashFlows}
              exitProceeds={exitProceeds}
              totalTaxBenefit={totalTaxBenefit}
              year1TaxBenefit={year1TaxBenefit}
              hdcCashFlows={hdcCashFlows}
              hdcTotalReturns={hdcTotalReturns}
              hdcExitProceeds={hdcExitProceeds}
              mainAnalysisResults={mainAnalysisResults}
              hdcAnalysisResults={hdcAnalysisResults}
            />
          )}
      </div>
    </div>
  );
};

export default InvestorAnalysisHighlevelMetrics;