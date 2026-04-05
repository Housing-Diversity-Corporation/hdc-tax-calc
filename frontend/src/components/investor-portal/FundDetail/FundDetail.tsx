import React, { useState, useEffect, useMemo } from 'react';
import { investorTaxInfoService } from '../../../services/api';
import { poolService } from '../../../services/poolService';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit, Download } from 'lucide-react';
import TaxUtilizationSection from '../../taxbenefits/results/TaxUtilizationSection';
import FundDetailHeader from './FundDetailHeader';
import FundDealList from './FundDealList';
import OptimalCommitmentCard from './OptimalCommitmentCard';
import EfficiencyCurveChart from './EfficiencyCurveChart';
import CapacityWarning from './CapacityWarning';
import FitSummaryPanel from './FitSummaryPanel';
import SizingOptimizerPanel from './SizingOptimizerPanel';
import IRAConversionPanel from './IRAConversionPanel';
import { aggregatePoolToBenefitStream, buildInvestorProfileFromTaxInfo } from '../../../utils/taxbenefits/poolAggregation';
import {
  optimizeIRAConversion,
  computeRateCompression,
  compareConversionStrategies,
  calculateRothConversionValue,
  generateIRAConversionRecommendations
} from '../../../utils/taxbenefits/iraConversion';
import { SECTION_461L_LIMITS } from '../../../utils/taxbenefits/investorTaxUtilization';
import { exportWealthManagerSummary } from '../../../utils/exportWealthManagerSummary';
import type { WealthManagerExportData } from '../../../utils/exportWealthManagerSummary';
import type { CalculationParams, REPTaxCapacityModel } from '../../../types/taxbenefits';
import { optimizeFundCommitment } from '../../../utils/taxbenefits/fundSizingOptimizer';
import { useInvestorFit } from '../../../hooks/useInvestorFit';
import { useInvestorSizing } from '../../../hooks/useInvestorSizing';
import type { InvestmentPool, DealBenefitProfile } from '../../../types/dealBenefitProfile';
import type { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import type { FundSizingResult, PoolAggregationMeta } from '../../../types/fundSizing';

interface FundDetailProps {
  poolId: number;
  onBack?: () => void;
  onNavigateToTaxProfile?: () => void;
}

const FundDetail: React.FC<FundDetailProps> = ({ poolId, onBack, onNavigateToTaxProfile }) => {
  const [pool, setPool] = useState<InvestmentPool | null>(null);
  const [deals, setDeals] = useState<DealBenefitProfile[]>([]);
  const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);
  const [allProfiles, setAllProfiles] = useState<InvestorTaxInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sliderCommitment, setSliderCommitment] = useState<number | null>(null);

  // Load pool + deals
  useEffect(() => {
    const loadPool = async () => {
      try {
        const response = await poolService.getWithDeals(poolId);
        setPool(response.pool);
        setDeals(response.deals);
      } catch (err) {
        console.error('Failed to load pool:', err);
        setError('Failed to load fund details. Please try again.');
      }
    };
    loadPool();
  }, [poolId]);

  // Load investor profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profiles = await investorTaxInfoService.getUserTaxInfo();
        if (profiles && profiles.length > 0) {
          setAllProfiles(profiles);
          const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
          setTaxProfile(defaultProfile);
        } else {
          setError('No tax profile found. Please create a tax profile first.');
        }
      } catch (err) {
        console.error('Failed to load tax profiles:', err);
        setError('Failed to load tax profiles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadProfiles();
  }, []);

  const handleProfileChange = (profileId: string) => {
    const selectedProfile = allProfiles.find(p => p.id === Number(profileId));
    if (selectedProfile) {
      setTaxProfile(selectedProfile);
    }
  };

  // Run aggregation and optimization when data is ready
  const { sizingResult, aggregationMeta } = useMemo<{
    sizingResult: FundSizingResult | null;
    aggregationMeta: PoolAggregationMeta | null;
  }>(() => {
    if (deals.length === 0 || !taxProfile) {
      return { sizingResult: null, aggregationMeta: null };
    }

    const { benefitStream, meta } = aggregatePoolToBenefitStream(deals);
    const investorProfile = buildInvestorProfileFromTaxInfo(taxProfile);
    const result = optimizeFundCommitment(
      benefitStream,
      meta.totalGrossEquity,
      investorProfile
    );

    return { sizingResult: result, aggregationMeta: meta };
  }, [deals, taxProfile]);

  // B3: Investor Fit + Sizing (IMPL-102 through IMPL-106)
  const investorProfile = useMemo(() => {
    if (!taxProfile) return null;
    return buildInvestorProfileFromTaxInfo(taxProfile);
  }, [taxProfile]);

  const averageAnnualBenefits = useMemo(() => {
    if (!sizingResult) return 0;
    const util = sizingResult.fullUtilizationResult;
    const years = util.annualUtilization.length;
    return years > 0 ? (util.totalBenefitGenerated / years) * 1_000_000 : 0;
  }, [sizingResult]);

  const fitResult = useInvestorFit(
    sizingResult?.fullUtilizationResult ?? null,
    investorProfile,
    averageAnnualBenefits
  );

  const { benefitStream: poolBenefitStream } = useMemo(() => {
    if (deals.length === 0) return { benefitStream: null };
    const { benefitStream } = aggregatePoolToBenefitStream(deals);
    return { benefitStream };
  }, [deals]);

  const investorSizingResult = useInvestorSizing(
    poolBenefitStream,
    investorProfile,
    aggregationMeta?.totalGrossEquity ?? 0,
    sliderCommitment ?? sizingResult?.optimalCommitment ?? 0
  );

  const holdPeriod = useMemo(() => {
    if (deals.length === 0) return 10;
    return Math.max(...deals.map(d => d.holdPeriod));
  }, [deals]);

  // IMPL-147 + IMPL-150: IRA Conversion Plan for REP investors with IRA balance
  const iraConversionData = useMemo(() => {
    if (!taxProfile || !sizingResult?.fullUtilizationResult) return null;
    const iraBalance = (taxProfile as any).iraBalance ?? 0;
    if (iraBalance <= 0) return null;
    if (taxProfile.investorTrack !== 'rep') return null;

    // Build a REPTaxCapacityModel from utilization annual data
    const annuals = sizingResult.fullUtilizationResult.annualUtilization;
    const filingStatus = taxProfile.filingStatus === 'married' ? 'MFJ'
      : taxProfile.filingStatus === 'single' ? 'Single' : 'HoH';
    const eblLimit = SECTION_461L_LIMITS[filingStatus as keyof typeof SECTION_461L_LIMITS];

    const repCapacity: REPTaxCapacityModel = {
      annualLimitations: annuals.map((yr) => ({
        year: yr.year,
        w2Income: (taxProfile.annualOrdinaryIncome || 0),
        section461lLimit: eblLimit,
        allowedLoss: yr.depreciationAllowed * 1_000_000,
        disallowedLoss: yr.depreciationSuspended * 1_000_000,
        nolGenerated: yr.nolGenerated * 1_000_000,
        nolCarryforward: yr.nolPool * 1_000_000,
      })),
      totalCapacity: {
        currentYear: eblLimit,
        nolBank: annuals.reduce((s, yr) => s + yr.nolPool, 0) * 1_000_000,
        iraConversionCapacity: eblLimit,
      },
    };

    const federalRate = taxProfile.federalOrdinaryRate || 37;
    const stateRate = taxProfile.stateOrdinaryRate || 10.9;
    const effectiveRate = federalRate + stateRate;

    const params: Partial<CalculationParams> = {
      iraBalance,
      effectiveTaxRate: effectiveRate,
      holdPeriod,
      investorTrack: 'rep',
      federalTaxRate: federalRate,
    };

    const plan = optimizeIRAConversion(params as CalculationParams, repCapacity);
    if (!plan) return null;

    // IMPL-150: Use engine function for rate compression (moved from inline calc)
    const rateCompression = computeRateCompression(plan, effectiveRate);

    // IMPL-150: Strategy comparison (aggressive/balanced/conservative)
    const strategies = compareConversionStrategies(params as CalculationParams, repCapacity);

    // IMPL-150: Lifetime value analysis
    const lifetimeValue = calculateRothConversionValue(plan, params as CalculationParams);

    // IMPL-150: Text recommendations
    const recommendations = generateIRAConversionRecommendations(plan, params as CalculationParams);

    return {
      plan,
      preHDCRate: rateCompression.preHDCRate,
      postHDCRate: rateCompression.postHDCRate,
      year1TaxSavings: rateCompression.year1TaxSavings,
      iraBalance,
      strategies,
      lifetimeValue,
      recommendations
    };
  }, [taxProfile, sizingResult, holdPeriod]);

  // Sync slider to optimal when sizing result changes
  const effectiveSliderCommitment = sliderCommitment ?? sizingResult?.optimalCommitment ?? 0;

  // IMPL-151: Wealth Manager Summary Export
  const handleExportSummary = () => {
    if (!sizingResult || !taxProfile || !investorSizingResult) return;

    const util = sizingResult.fullUtilizationResult;
    const yr1 = util.annualUtilization[0];

    const exportData: WealthManagerExportData = {
      fundName: pool?.poolName || 'Fund',
      investorName: taxProfile.profileName || `Profile #${taxProfile.id}`,
      optimalCommitment: investorSizingResult.sec461lOptimalCommitment ?? investorSizingResult.optimalCommitment,
      constraintBinding: investorSizingResult.constraintBinding,
      holdPeriod,
      savingsPerDollar: sizingResult.optimalSavingsPerDollar,
      utilizationRate: util.overallUtilizationRate,
      year1Depreciation: yr1?.depreciationGenerated ?? 0,
      year1TaxSavings: yr1?.depreciationTaxSavings ?? 0,
      preHDCRate: iraConversionData?.preHDCRate ?? ((taxProfile.federalOrdinaryRate || 37) + (taxProfile.stateOrdinaryRate || 0)),
      postHDCRate: iraConversionData?.postHDCRate ?? ((taxProfile.federalOrdinaryRate || 37) + (taxProfile.stateOrdinaryRate || 0)),
      treatment: util.treatmentLabel,
      annualUtilization: util.annualUtilization,
      isNonpassive: util.treatment === 'nonpassive',
      rothConversion: iraConversionData ? {
        iraBalance: iraConversionData.iraBalance,
        optimalConversion: iraConversionData.plan.totalConverted,
        conversionWindow: iraConversionData.plan.schedule.length,
        effectiveRate: iraConversionData.postHDCRate,
        year30RothValue: iraConversionData.plan.year30RothValue,
        lifetimeAdvantage: iraConversionData.lifetimeValue?.lifetimeAdvantage ?? 0,
      } : undefined,
    };

    exportWealthManagerSummary(exportData);
  };

  // Dollar-based currency formatter for B3 panels
  const formatDollarCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Currency formatter for TaxUtilizationSection
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1) return `$${value.toFixed(2)}M`;
    if (Math.abs(value) >= 0.001) return `$${(value * 1000).toFixed(0)}K`;
    return `$${(value * 1_000_000).toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="min-h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-full overflow-x-hidden">
      <div className="flex-1 overflow-auto p-7">
        <FundDetailHeader pool={pool} meta={aggregationMeta} onBack={onBack} />

        {/* Tax Profile Selector */}
        {taxProfile && (
          <div className="mb-6 flex gap-2 items-center">
            <div className="flex-1 max-w-[600px]">
              <Select value={taxProfile?.id?.toString() || ''} onValueChange={handleProfileChange}>
                <SelectTrigger className="hover:border-[#407f7f] focus:border-[#407f7f] focus:ring-[#407f7f]">
                  <SelectValue>
                    <div className="flex items-center">
                      <span className="font-semibold text-[#474a44]">
                        {taxProfile.profileName || `Profile #${taxProfile.id}`}
                      </span>
                      {taxProfile.isDefault && (
                        <span className="ml-2 px-2 py-0.5 text-xs text-white bg-[#7fbd45] rounded font-medium">
                          Default
                        </span>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border border-gray-200 shadow-lg">
                  {allProfiles.map((profile) => {
                    const federalRate = profile.investorTrack !== 'rep' && profile.passiveGainType === 'long-term'
                      ? (profile.federalCapitalGainsRate || 0)
                      : (profile.federalOrdinaryRate || 0);
                    return (
                      <SelectItem
                        key={profile.id || 0}
                        value={profile.id?.toString() || '0'}
                        className="py-3 border-b border-gray-200 last:border-b-0 hover:bg-[#92c3c2]"
                      >
                        <div className="w-full">
                          <div className="flex items-center mb-1">
                            <span className="font-semibold text-[#474a44] text-sm">
                              {profile.profileName || `Profile #${profile.id || 0}`}
                            </span>
                            {profile.isDefault && (
                              <span className="ml-2 px-2 py-0.5 text-[10px] text-white bg-[#7fbd45] rounded font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#474a44] opacity-70 leading-relaxed">
                            <span className="text-[#407f7f] font-medium">Federal Rate:</span> {federalRate.toFixed(1)}% |{' '}
                            <span className="text-[#407f7f] font-medium">State:</span> {profile.selectedState} |{' '}
                            <span className="text-[#407f7f] font-medium">Type:</span> {profile.investorTrack === 'rep' ? 'REP' : 'Non-REP'}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {onNavigateToTaxProfile && (
              <Button
                variant="outline"
                onClick={onNavigateToTaxProfile}
                className="min-w-[140px] h-10 whitespace-nowrap border-[#407f7f] text-[#407f7f] font-medium hover:bg-[#92c3c2] hover:text-[#474a44]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
            {/* IMPL-151: Wealth Manager Summary Export */}
            {sizingResult && investorSizingResult && (
              <Button
                variant="outline"
                onClick={handleExportSummary}
                className="min-w-[140px] h-10 whitespace-nowrap border-[#7fbd45] text-[#7fbd45] font-medium hover:bg-[#7fbd45]/10 hover:text-[#474a44]"
                title="Download one-page investment summary PDF"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Summary
              </Button>
            )}
          </div>
        )}

        {/* Member Deals */}
        <FundDealList deals={deals} poolStartYear={aggregationMeta?.poolStartYear} />

        {/* Capacity Warning */}
        {sizingResult?.warningMessage && (
          <CapacityWarning message={sizingResult.warningMessage} />
        )}

        {/* Optimal Commitment */}
        {sizingResult && <OptimalCommitmentCard result={sizingResult} />}

        {/* Efficiency Curve */}
        {sizingResult && (
          <EfficiencyCurveChart
            curve={sizingResult.efficiencyCurve}
            optimalCommitment={sizingResult.optimalCommitment}
            capacityExhaustedAt={sizingResult.capacityExhaustedAt}
          />
        )}

        {/* B3: Fit Summary Panel */}
        {fitResult && investorSizingResult && (
          <FitSummaryPanel
            fitResult={fitResult}
            recommendedCommitment={investorSizingResult.optimalCommitment}
            currentCommitment={effectiveSliderCommitment !== investorSizingResult.optimalCommitment ? effectiveSliderCommitment : undefined}
            holdPeriod={holdPeriod}
            formatCurrency={formatDollarCurrency}
          />
        )}

        {/* B3: Sizing Optimizer Panel */}
        {fitResult && investorSizingResult && aggregationMeta && (
          <SizingOptimizerPanel
            sizingResult={investorSizingResult}
            fitResult={fitResult}
            currentCommitment={effectiveSliderCommitment}
            onCommitmentChange={setSliderCommitment}
            minSlider={100_000}
            maxSlider={aggregationMeta.totalGrossEquity}
            formatCurrency={formatDollarCurrency}
          />
        )}

        {/* IMPL-147 + IMPL-150: IRA Conversion Panel — REP investors with IRA balance only */}
        {iraConversionData && (
          <IRAConversionPanel
            conversionPlan={iraConversionData.plan}
            preHDCRate={iraConversionData.preHDCRate}
            postHDCRate={iraConversionData.postHDCRate}
            year1TaxSavings={iraConversionData.year1TaxSavings}
            iraBalance={iraConversionData.iraBalance}
            holdPeriod={holdPeriod}
            strategies={iraConversionData.strategies}
            lifetimeValue={iraConversionData.lifetimeValue}
            recommendations={iraConversionData.recommendations}
          />
        )}

        {/* No profile fallback — show CTA when no B3 panels visible */}
        {!taxProfile && !loading && (
          <div className="mb-6 border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <p className="text-sm text-[#474a44]/70">
              Enter your tax profile to see how this deal fits your situation
            </p>
            {onNavigateToTaxProfile && (
              <Button
                variant="outline"
                onClick={onNavigateToTaxProfile}
                className="mt-3 border-[#407f7f] text-[#407f7f] hover:bg-[#92c3c2] hover:text-[#474a44]"
              >
                Create Tax Profile
              </Button>
            )}
          </div>
        )}

        {/* Tax Utilization at Optimal Point */}
        {sizingResult && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#474a44] mb-2">
              Tax Utilization at Recommended Commitment
            </h3>
            <TaxUtilizationSection
              taxUtilization={sizingResult.fullUtilizationResult}
              totalInvestment={sizingResult.optimalCommitment / 1_000_000}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FundDetail;
