import React from 'react';
import { Box, Card, Typography } from '@mui/material';
import { formatCurrencyMillions, formatCurrency } from '../../utils/taxbenefits/formatters';
import type { InvestorAnalysisResults } from '../../types/taxbenefits';
import InvestmentSummarySection from '../taxbenefits/results/InvestmentSummarySection';
import SimplifiedFreeInvestmentSection from './SimplifiedFreeInvestmentSection';
import SimplifiedTaxPlanningSection from './SimplifiedTaxPlanningSection';
import InvestorCashFlowSection from '../taxbenefits/results/InvestorCashFlowSection';
import MetricsCharts from './MetricsCharts';

interface InvestorAnalysisHighlevelMetricsProps {
  // Deal Info props
  dealName?: string;
  dealLocation?: string;
  dealLatitude?: number;
  dealLongitude?: number;
  markerId?: number;
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
  year1TaxBenefit?: number;
  year1NetBenefit?: number;
  freeInvestmentHurdle?: number;
  yearOneDepreciation?: number;
  effectiveTaxRateForDepreciation?: number;
  hdcFeeRate?: number;

  // Tax Planning Capacity props
  totalNetTaxBenefits?: number;
  totalCapitalGainsRate?: number;
  investmentRecovered?: number;
  depreciationRecaptureRate?: number;
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
  taxBenefitDelayMonths?: number;

  // Main analysis results
  mainAnalysisResults?: InvestorAnalysisResults | null;
  depreciationSchedule?: any;

  // HDC Analysis props
  hdcCashFlows?: any[];
  hdcAnalysisResults?: any;
  hdcTotalReturns?: number;
  hdcExitProceeds?: number;

  // OZ props
  deferredGains?: number;
  deferredGainsTaxDue?: number;
  ozEnabled?: boolean;
  year5OZTaxDue?: number;
}

const InvestorAnalysisHighlevelMetrics: React.FC<InvestorAnalysisHighlevelMetricsProps> = ({
  // Deal Info
  dealName,
  dealLocation,
  dealLatitude,
  dealLongitude,
  markerId,
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
  year1TaxBenefit = 0,
  year1NetBenefit = 0,
  freeInvestmentHurdle = 0,
  yearOneDepreciation = 0,
  effectiveTaxRateForDepreciation = 0,
  hdcFeeRate = 0,

  // Tax Planning Capacity
  totalNetTaxBenefits = 0,
  totalCapitalGainsRate = 0,
  investmentRecovered = 0,
  depreciationRecaptureRate = 25,
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
  taxBenefitDelayMonths = 0,

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
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', mb: 4 }}>
      <div className="pink-background" style={{ display: 'flex', flexDirection: 'column', gap: 25, width: '100%', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {/* Top Row - Deal Information if available */}
        {(dealName || dealLocation || dealDescription || dealImageUrl) && (
          <Box sx={{ width: '100%' }}>
            <Card sx={{ height: 'fit-content', overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Deal Image - Left side in horizontal layout */}
                {dealImageUrl && (
                  <Box
                    sx={{
                      width: { xs: '100%', lg: '50%' },
                      minHeight: { xs: 200, lg: 300 },
                      maxHeight: { xs: 400, lg: 450 },
                      flexShrink: 0,
                      position: 'relative',
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component="img"
                      src={dealImageUrl}
                      alt={dealName || 'Deal image'}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'left center'
                      }}
                    />
                    {/* Property Details Overlay on Image */}
                    {(units || affordabilityMix || projectStatus) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
                          p: 2.5,
                          color: 'white'
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'white' }}>
                          Property Details
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {units && (
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                Units
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>{units}</Typography>
                            </Box>
                          )}
                          {affordabilityMix && (
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                Affordability Mix
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>{affordabilityMix}</Typography>
                            </Box>
                          )}
                          {projectStatus && (
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                                Status
                              </Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                {projectStatus === 'available' ? 'Available' : projectStatus}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Deal Info - Right side in horizontal layout */}
                <Box sx={{ p: 3, flex: 1, minWidth: 0 }}>
                  {/* Deal Name */}
                  {dealName && (
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#276221', mb: 1 }}>
                      {dealName}
                    </Typography>
                  )}

                  {/* Location  + Investment Amount */}
                  <div>
                    {dealLocation && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', flex: 1 }}>
                          {dealLocation}
                        </Typography>
                        {dealLatitude && dealLongitude && (
                          <a
                            href={markerId
                              ? `/?markerId=${markerId}`
                              : `/?lat=${dealLatitude}&lng=${dealLongitude}&zoom=17`
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.4rem 0.8rem',
                              backgroundColor: '#407f7f',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              fontWeight: 500,
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View on Map
                          </a>
                        )}
                      </Box>
                    )}
                    {minInvestmentAmount && (
                      <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                        Minimum Investment Amount: {formatCurrency(minInvestmentAmount)}
                      </Typography>
                    )}
                  </div>
                

                  {/* Description */}
                  {dealDescription && (
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                      {dealDescription}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        )}


        {/* Container for Investment/Free Investment and Tax Planning sections */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'grid' },
            flexDirection: { xs: 'column' },
            gridTemplateColumns: { md: '1fr 1fr' },
            gridTemplateRows: { md: 'auto' },
            gap: { xs: 2, md: 3 },
            width: '100%',
            alignItems: 'start', // Align items to start
          }}
        >
          {/* Left Column - Investment Amount and Free Investment Analysis */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: 'minmax(150px, 0.45fr) minmax(200px, 0.55fr)',
              gap: 1,
              height: { xs: 'auto', md: '100%' },
            }}
          >
            {/* Investment Amount Section */}
            <InvestmentSummarySection
              investorEquity={investorEquity}
              hdcFee={hdcFee}
              formatCurrency={formatCurrencyMillions}
              compact={true}
            />

            {/* Free Investment Analysis Section */}
            <SimplifiedFreeInvestmentSection
              year1NetBenefit={year1NetBenefit}
              investorEquity={investorEquity}
              formatCurrency={formatCurrencyMillions}
            />
          </Box>

          {/* Right Column - Tax Planning Capacity Section */}
          <Box
            sx={{
              height: '100%',
              width: '100%',
              flex: 1,
            }}
          >
            <SimplifiedTaxPlanningSection
              totalNetTaxBenefits={totalNetTaxBenefits}
              hdcFee={hdcFee}
              hdcFeeRate={hdcFeeRate}
              year1NetBenefit={year1NetBenefit}
              year5OZTaxDue={year5OZTaxDue}
              totalCapitalGainsRate={totalCapitalGainsRate}
              effectiveTaxRateForDepreciation={effectiveTaxRateForDepreciation}
              depreciationRecaptureRate={depreciationRecaptureRate}
              formatCurrency={formatCurrencyMillions}
            />
          </Box>
        </Box>
      </div>
      
      <div className="green-background" style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        

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
              taxBenefitDelayMonths={taxBenefitDelayMonths}
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
    </Box>
  );
};

export default InvestorAnalysisHighlevelMetrics;