import React, { useState, useEffect } from 'react';
import InvestorAnalysisCalculator from './InvestorAnalysisCalculator';
import { investorTaxInfoService } from '../../../services/api';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit } from 'lucide-react';
import type { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import './InvestorAnalysis.css';

/**
 * Investor-specific Analysis page that auto-fills tax information
 * from the investor's tax profile and uses the same calculation engine
 * and database configurations as the main calculator.
 *
 * This page allows investors to analyze deals in the investment portal
 * with their personalized tax information pre-populated.
 */
interface InvestorAnalysisProps {
  onNavigateToTaxProfile?: () => void;
  dealId?: string | number; // Optional deal ID to load a specific configuration
  onBack?: () => void; // Optional back button handler
}

const InvestorAnalysis: React.FC<InvestorAnalysisProps> = ({ onNavigateToTaxProfile, dealId, onBack }) => {
  const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);
  const [allProfiles, setAllProfiles] = useState<InvestorTaxInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvestorTaxProfile();
  }, []);

  const loadInvestorTaxProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all profiles
      const profiles = await investorTaxInfoService.getUserTaxInfo();
      if (profiles && profiles.length > 0) {
        setAllProfiles(profiles);
        // Find default profile or use the first one
        const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
        setTaxProfile(defaultProfile);
      } else {
        setError('No tax profile found. Please create a tax profile first.');
      }
    } catch (err) {
      console.error('Failed to load tax profile:', err);
      setError('Failed to load tax profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profileId: string) => {
    const selectedProfile = allProfiles.find(p => p.id === Number(profileId));
    if (selectedProfile) {
      console.log('🔄 Switching to profile:', selectedProfile.profileName || `Profile #${profileId}`);
      setTaxProfile(selectedProfile);
    }
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
        <Alert>
          <AlertDescription>
            Please go to the Tax Profile page to create your tax profile before using the Analysis tool.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="investor-analysis-container h-full flex flex-col max-w-full overflow-x-hidden">
      {taxProfile && (
        <div className="mt-8 mb-0 mx-7 flex gap-2 items-center justify-between">
          {/* Tax Profile Selector */}
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
                        ✓ Default
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
                              ✓ Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#474a44] opacity-70 leading-relaxed">
                          <span className="text-[#407f7f] font-medium">Federal Rate:</span> {federalRate.toFixed(1)}% |{' '}
                          <span className="text-[#407f7f] font-medium">State:</span> {profile.selectedState} (Ord: {(profile.stateOrdinaryRate || 0).toFixed(1)}%, CG: {(profile.stateCapitalGainsRate || 0).toFixed(1)}%) |{' '}
                          <span className="text-[#407f7f] font-medium">Type:</span> {profile.investorTrack === 'rep' ? 'REP' : `Non-REP (${profile.passiveGainType || 'short-term'})`} |{' '}
                          <span className="text-[#407f7f] font-medium">OZ:</span> {profile.ozType === 'rural' ? 'Rural (30%)' : 'Standard (10%)'}
                          {profile.investorTrack !== 'rep' && ' | NIIT: 3.8%'}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Edit Tax Profile Button */}
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

      <div className="flex-1 overflow-auto">
        <InvestorAnalysisCalculator
          taxProfile={taxProfile}
          dealId={dealId}
          isReadOnly={!!dealId} // Make read-only when viewing a specific deal
        />
      </div>
    </div>
  );
};

export default InvestorAnalysis;
