import React, { useState, useEffect, useMemo } from 'react';
import { investorTaxInfoService } from '../../../services/api';
import { poolService } from '../../../services/poolService';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit } from 'lucide-react';
import TaxUtilizationSection from '../../taxbenefits/results/TaxUtilizationSection';
import FundDetailHeader from './FundDetailHeader';
import FundDealList from './FundDealList';
import OptimalCommitmentCard from './OptimalCommitmentCard';
import EfficiencyCurveChart from './EfficiencyCurveChart';
import CapacityWarning from './CapacityWarning';
import { aggregatePoolToBenefitStream, buildInvestorProfileFromTaxInfo } from '../../../utils/taxbenefits/poolAggregation';
import { optimizeFundCommitment } from '../../../utils/taxbenefits/fundSizingOptimizer';
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
