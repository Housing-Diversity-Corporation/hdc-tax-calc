import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { toast } from 'sonner';
import { investorTaxInfoService } from '../../../services/api';
import { InvestorTaxInfo } from '../../../types/investorTaxInfo';
import { HDC_OZ_STRATEGY, getOzBenefits } from '../../../utils/taxbenefits/hdcOzStrategy';
import { CONFORMING_STATES, doesNIITApply } from '../../../utils/taxbenefits/stateData';

type InvestorTrack = 'rep' | 'non-rep';
type PassiveGainType = 'short-term' | 'long-term';

// Mock bracket data - replace with actual imports
const FEDERAL_TAX_BRACKETS_2024 = [
  { value: 10, label: '10%' },
  { value: 12, label: '12%' },
  { value: 22, label: '22%' },
  { value: 24, label: '24%' },
  { value: 32, label: '32%' },
  { value: 35, label: '35%' },
  { value: 37, label: '37%' },
];

const FEDERAL_CAPITAL_GAINS_BRACKETS_2024 = [
  { value: 0, label: '0%' },
  { value: 15, label: '15%' },
  { value: 20, label: '20%' },
];

// 2024 Tax Brackets for Ordinary Income
const TAX_BRACKETS_2024 = {
  single: [
    { rate: 10, min: 0, max: 11600 },
    { rate: 12, min: 11600, max: 47150 },
    { rate: 22, min: 47150, max: 100525 },
    { rate: 24, min: 100525, max: 191950 },
    { rate: 32, min: 191950, max: 243725 },
    { rate: 35, min: 243725, max: 609350 },
    { rate: 37, min: 609350, max: Infinity }
  ],
  married: [
    { rate: 10, min: 0, max: 23200 },
    { rate: 12, min: 23200, max: 94300 },
    { rate: 22, min: 94300, max: 201050 },
    { rate: 24, min: 201050, max: 383900 },
    { rate: 32, min: 383900, max: 487450 },
    { rate: 35, min: 487450, max: 731200 },
    { rate: 37, min: 731200, max: Infinity }
  ]
};

// 2024 Capital Gains Brackets
const CAPITAL_GAINS_BRACKETS_2024 = {
  single: [
    { rate: 0, min: 0, max: 47025 },
    { rate: 15, min: 47025, max: 518900 },
    { rate: 20, min: 518900, max: Infinity }
  ],
  married: [
    { rate: 0, min: 0, max: 94050 },
    { rate: 15, min: 94050, max: 583750 },
    { rate: 20, min: 583750, max: Infinity }
  ]
};

// Helper function to determine tax rate based on income and filing status
const getTaxRateFromIncome = (income: number, filingStatus: 'single' | 'married', isCapitalGains: boolean = false): number => {
  const brackets = isCapitalGains ? CAPITAL_GAINS_BRACKETS_2024 : TAX_BRACKETS_2024;
  const applicableBrackets = brackets[filingStatus];

  for (const bracket of applicableBrackets) {
    if (income >= bracket.min && income < bracket.max) {
      return bracket.rate;
    }
  }

  return applicableBrackets[applicableBrackets.length - 1].rate;
};

// Phase B1-5: Helper function to format income values compactly for profile cards
const formatIncomeCompact = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}K`;
  }
  return `$${value}`;
};

const InvestorTaxProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<InvestorTaxInfo[]>([]);
  const [draggedProfileId, setDraggedProfileId] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [currentProfile, setCurrentProfile] = useState<InvestorTaxInfo>({
    annualIncome: 750000,
    filingStatus: 'married',
    federalOrdinaryRate: 37,
    stateOrdinaryRate: 10.9,
    federalCapitalGainsRate: 20,
    stateCapitalGainsRate: 10.9,
    selectedState: 'NY',
    investorTrack: 'rep',
    passiveGainType: 'long-term',
    repStatus: true,
    ozType: 'standard',
    deferredCapitalGains: 0,
    capitalGainsTaxRate: 23.8,
    isDefault: false,
    // Phase B1-3: Income Composition fields
    annualOrdinaryIncome: 750000,
    annualPassiveIncome: 0,
    annualPortfolioIncome: 0,
    // IMPL-159: Passive income character split
    annualPassiveOrdinaryIncome: 0,
    annualPassiveLTCGIncome: 0,
    // Phase B1-4: Grouping Election (REP only)
    groupingElection: false,
  });

  const NIIT_RATE = 3.8;

  useEffect(() => {
    loadProfiles();
  }, []);

  // IMPL-159: Migrate legacy profiles — if annualPassiveIncome > 0 but both
  // character fields are 0/absent, treat the total as ordinary (conservative assumption)
  const migratePassiveCharacterSplit = (profile: InvestorTaxInfo): InvestorTaxInfo => {
    const hasLegacyPassive = (profile.annualPassiveIncome || 0) > 0;
    const hasCharacterSplit = (profile.annualPassiveOrdinaryIncome || 0) > 0 ||
                               (profile.annualPassiveLTCGIncome || 0) > 0;
    if (hasLegacyPassive && !hasCharacterSplit) {
      return {
        ...profile,
        annualPassiveOrdinaryIncome: profile.annualPassiveIncome || 0,
        annualPassiveLTCGIncome: 0,
      };
    }
    return profile;
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await investorTaxInfoService.getUserTaxInfo();

      // Sort profiles: default first, then by profile name or creation order
      const sortedData = [...data].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });

      setProfiles(sortedData);

      const defaultProfile = data.find(p => p.isDefault);
      if (defaultProfile) {
        setCurrentProfile(migratePassiveCharacterSplit(defaultProfile));
      } else if (data.length > 0) {
        setCurrentProfile(migratePassiveCharacterSplit(data[0]));
      }
    } catch (error) {
      console.error('Error loading tax profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-update rates when state changes
  // IMPL-053: Use HDC_OZ_STRATEGY (derived from STATE_TAX_PROFILES) as single source of truth
  useEffect(() => {
    if (currentProfile.selectedState && HDC_OZ_STRATEGY[currentProfile.selectedState]) {
      const stateInfo = HDC_OZ_STRATEGY[currentProfile.selectedState];
      setCurrentProfile(prev => ({
        ...prev,
        stateOrdinaryRate: stateInfo.rate,
        stateCapitalGainsRate: stateInfo.rate,
      }));
    } else if (currentProfile.selectedState === 'NONE' || currentProfile.selectedState === '') {
      setCurrentProfile(prev => ({
        ...prev,
        stateOrdinaryRate: 0,
        stateCapitalGainsRate: 0,
      }));
    }
  }, [currentProfile.selectedState]);

  // IMPL-159: Compute total passive income from character split fields
  const computedPassiveTotal = useMemo(() => {
    return (currentProfile.annualPassiveOrdinaryIncome || 0) +
           (currentProfile.annualPassiveLTCGIncome || 0);
  }, [currentProfile.annualPassiveOrdinaryIncome, currentProfile.annualPassiveLTCGIncome]);

  // IMPL-159: Keep annualPassiveIncome in sync with character split total for backward compat
  // Sync happens on save via handleSave instead of reactive useEffect to avoid render cycles

  // Phase B1-3: Compute total annual income from income composition fields
  // This is used for auto-rate calculation and saved for backward compatibility
  // IMPL-159: annualPassiveIncome is now derived from character split total
  const computedAnnualIncome = useMemo(() => {
    return (currentProfile.annualOrdinaryIncome || 0) +
           computedPassiveTotal +
           (currentProfile.annualPortfolioIncome || 0);
  }, [currentProfile.annualOrdinaryIncome, computedPassiveTotal, currentProfile.annualPortfolioIncome]);

  // Auto-update federal tax rates when income composition or filing status changes
  useEffect(() => {
    // Skip if no filing status
    if (!currentProfile.filingStatus) return;

    const income = computedAnnualIncome;
    const filingStatus = currentProfile.filingStatus as 'single' | 'married';

    // Calculate ordinary income rate
    const ordinaryRate = getTaxRateFromIncome(income, filingStatus, false);

    // Calculate capital gains rate
    const capitalGainsRate = getTaxRateFromIncome(income, filingStatus, true);

    console.log(`💰 Auto-calculating tax rates for ${filingStatus} with income $${income.toLocaleString()}: Ordinary ${ordinaryRate}%, Capital Gains ${capitalGainsRate}%`);

    setCurrentProfile(prev => ({
      ...prev,
      federalOrdinaryRate: ordinaryRate,
      federalCapitalGainsRate: capitalGainsRate,
      // Phase B1-3: Keep annualIncome in sync for backward compatibility
      annualIncome: income,
    }));
  }, [computedAnnualIncome, currentProfile.filingStatus]);

  // Calculate effective rates
  useEffect(() => {
    const isNonConforming = currentProfile.selectedState && HDC_OZ_STRATEGY[currentProfile.selectedState]?.status === 'NO_GO';
    const niitRate = doesNIITApply(currentProfile.selectedState || '') ? NIIT_RATE : 0;

    // Calculate OZ capital gains tax rate
    const ozRate = 20 + niitRate + (isNonConforming ? 0 : (currentProfile.stateCapitalGainsRate || 0));

    setCurrentProfile(prev => ({
      ...prev,
      capitalGainsTaxRate: ozRate,
    }));
  }, [currentProfile.selectedState, currentProfile.stateCapitalGainsRate]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // IMPL-159: Sync annualPassiveIncome from character split before saving
      const profileToSave = {
        ...currentProfile,
        annualPassiveIncome: computedPassiveTotal,
      };
      if (profileToSave.id) {
        await investorTaxInfoService.updateTaxInfo(profileToSave.id, profileToSave);
      } else {
        await investorTaxInfoService.saveTaxInfo(profileToSave);
      }
      await loadProfiles();
      toast.success('Tax profile saved successfully!');
    } catch (error) {
      console.error('Error saving tax profile:', error);
      toast.error('Failed to save tax profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await investorTaxInfoService.setAsDefault(id);
      await loadProfiles();
      toast.success('Default profile updated!');
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default profile');
    }
  };

  const handleDragStart = (e: React.DragEvent, profileId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('profileId', String(profileId));
    setDraggedProfileId(profileId);
  };

  const handleDragEnd = () => {
    setDraggedProfileId(null);
    setDropTargetIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (index: number) => {
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const droppedProfileId = Number(e.dataTransfer.getData('profileId'));

    setDraggedProfileId(null);
    setDropTargetIndex(null);

    // Only make profile default if dropped at index 0 (first position)
    if (dropIndex === 0 && droppedProfileId) {
      const droppedProfile = profiles.find(p => p.id === droppedProfileId);

      // Don't do anything if it's already the default
      if (droppedProfile && !droppedProfile.isDefault) {
        try {
          // Optimistically update UI before API call
          const updatedProfiles = profiles.map(p => ({
            ...p,
            isDefault: p.id === droppedProfileId
          }));

          // Sort so new default is first
          const sortedProfiles = [...updatedProfiles].sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            return 0;
          });

          setProfiles(sortedProfiles);

          // Make API call in background
          await investorTaxInfoService.setAsDefault(droppedProfileId);
          toast.success(`${droppedProfile.profileName || 'Profile'} is now your default profile!`);
        } catch (error) {
          console.error('Error setting default:', error);
          toast.error('Failed to set default profile');
          // Revert on error
          await loadProfiles();
        }
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tax profile?')) return;
    try {
      await investorTaxInfoService.deleteTaxInfo(id);
      await loadProfiles();
    } catch (error) {
      console.error('Error deleting tax profile:', error);
    }
  };

  const handleLoadProfile = (profile: InvestorTaxInfo) => {
    setCurrentProfile(migratePassiveCharacterSplit(profile));
  };

  const handleCreateNew = () => {
    setCurrentProfile({
      annualIncome: 750000,
      filingStatus: 'married',
      federalOrdinaryRate: 37,
      stateOrdinaryRate: 10.9,
      federalCapitalGainsRate: 20,
      stateCapitalGainsRate: 10.9,
      selectedState: 'NY',
      investorTrack: 'rep',
      passiveGainType: 'long-term',
      repStatus: true,
      ozType: 'standard',
      deferredCapitalGains: 0,
      capitalGainsTaxRate: 23.8,
      isDefault: false,
      // Phase B1-3: Income Composition fields
      annualOrdinaryIncome: 750000,
      annualPassiveIncome: 0,
      annualPortfolioIncome: 0,
      // IMPL-159: Passive income character split
      annualPassiveOrdinaryIncome: 0,
      annualPassiveLTCGIncome: 0,
      // Phase B1-4: Grouping Election (REP only)
      groupingElection: false,
    });
  };

  const handleInvestorTrackChange = (track: InvestorTrack) => {
    const isRep = track === 'rep';
    setCurrentProfile(prev => ({
      ...prev,
      investorTrack: track,
      repStatus: isRep,
      federalOrdinaryRate: isRep ? 37 : (prev.passiveGainType === 'short-term' ? 37 : 20),
      federalCapitalGainsRate: 20,
    }));
  };

  const handlePassiveGainTypeChange = (type: PassiveGainType) => {
    setCurrentProfile(prev => ({
      ...prev,
      passiveGainType: type,
      federalOrdinaryRate: type === 'short-term' ? 37 : 20,
    }));
  };

  const handleStateChange = (state: string) => {
    setCurrentProfile(prev => ({ ...prev, selectedState: state }));
  };

  // Sort jurisdictions alphabetically
  const sortedJurisdictions = useMemo(() => {
    return Object.entries(HDC_OZ_STRATEGY)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([code, data]) => ({ code, data }));
  }, []);

  const selectedJurisdiction = HDC_OZ_STRATEGY[currentProfile.selectedState || ''];
  const ozBenefits = useMemo(() =>
    getOzBenefits(currentProfile.selectedState || '', currentProfile.projectLocation),
    [currentProfile.selectedState, currentProfile.projectLocation]
  );

  // Calculate effective rates for display
  const isNonConforming = currentProfile.selectedState && HDC_OZ_STRATEGY[currentProfile.selectedState]?.status === 'NO_GO';
  const effectiveOrdinaryRate = (currentProfile.federalOrdinaryRate || 0) + (isNonConforming ? 0 : (currentProfile.stateOrdinaryRate || 0));
  const niitForDisplay = doesNIITApply(currentProfile.selectedState || '') ? NIIT_RATE : 0;

  if (loading) {
    return (
      <div className="w-full flex justify-center min-h-full">
        <div className="w-full max-w-[85vw] px-4 sm:px-6 md:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Loading tax profiles...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center min-h-full">
      <div className="w-full max-w-[85vw] px-4 sm:px-6 md:px-8 py-8">
        <div className="mb-8 text-center">
          <h4 className="text-2xl font-bold text-[var(--hdc-faded-jade)] mb-2">Investor Tax Profile</h4>
        </div>

      {/* Saved Profiles Section */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Saved Profiles</CardTitle>
            <Button onClick={handleCreateNew} size="sm" variant="outline">
              + New Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No saved profiles. Create your first profile above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profiles.map((profile, index) => {
                // Calculate effective rate for display
                const profileNiit = doesNIITApply(profile.selectedState || '') ? NIIT_RATE : 0;
                const profileIsNonConforming = profile.selectedState && HDC_OZ_STRATEGY[profile.selectedState]?.status === 'NO_GO';
                const profileEffectiveRate = (() => {
                  if (profile.investorTrack === 'rep') {
                    return (profile.federalOrdinaryRate || 0) + (profileIsNonConforming ? 0 : (profile.stateOrdinaryRate || 0));
                  } else {
                    if (profile.passiveGainType === 'short-term') {
                      return 37 + profileNiit + (profileIsNonConforming ? 0 : (profile.stateOrdinaryRate || 0));
                    } else {
                      return 20 + profileNiit + (profileIsNonConforming ? 0 : (profile.stateCapitalGainsRate || 0));
                    }
                  }
                })();

                const isDragging = draggedProfileId === profile.id;
                const isDropTarget = dropTargetIndex === index && index === 0 && !profile.isDefault;

                return (
                  <div
                    key={profile.id}
                    className={`relative transition-all ${isDragging ? 'opacity-50' : 'opacity-100'}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, profile.id!)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    {profile.isDefault && (
                      <Badge variant="secondary" className="absolute -top-3 left-3 z-10 pointer-events-none">
                        Default
                      </Badge>
                    )}
                    <Card
                      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        profile.id === currentProfile.id ? 'ring-2 ring-primary' : ''
                      } ${isDropTarget ? 'ring-4 ring-blue-400 bg-blue-50 dark:bg-blue-950' : ''}`}
                      onClick={() => handleLoadProfile(profile)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                        <div>
                          <div className="font-semibold text-lg mb-1">
                            {profile.profileName || `${profile.selectedState} - ${profile.investorTrack === 'rep' ? 'REP' : 'Non-REP'}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {/* Phase B1-5: Enhanced summary with income composition */}
                            {profile.selectedState} • {profile.investorTrack === 'rep' ? 'REP' : 'Non-REP'}
                            {/* Show income composition if any field has a value > 0 */}
                            {((profile.annualOrdinaryIncome && profile.annualOrdinaryIncome > 0) ||
                              (profile.annualPassiveIncome && profile.annualPassiveIncome > 0) ||
                              (profile.annualPortfolioIncome && profile.annualPortfolioIncome > 0)) && (
                              <span>
                                {profile.annualOrdinaryIncome && profile.annualOrdinaryIncome > 0 && ` • ${formatIncomeCompact(profile.annualOrdinaryIncome)} ordinary`}
                                {profile.annualPassiveIncome && profile.annualPassiveIncome > 0 && ` • ${formatIncomeCompact(profile.annualPassiveIncome)} passive`}
                              </span>
                            )}
                            {` • ${profileEffectiveRate.toFixed(1)}%`}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Federal:</span>
                            <span>{profile.federalOrdinaryRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">State:</span>
                            <span>{profileIsNonConforming ? '0.0%' : `${(profile.stateOrdinaryRate || 0).toFixed(1)}%`}</span>
                          </div>
                          {profile.investorTrack === 'non-rep' && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">NIIT:</span>
                              <span>{profileNiit > 0 ? `${NIIT_RATE}%` : '0.0%'}</span>
                            </div>
                          )}
                          <Separator className="my-1" />
                          <div className="flex justify-between font-semibold">
                            <span>Effective Rate:</span>
                            <span>{profileEffectiveRate.toFixed(1)}%</span>
                          </div>
                        </div>

                        {profile.id && (
                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            {!profile.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetDefault(profile.id!);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(profile.id!);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Editor */}
      <Card className="shadow-lg mb-16">
          <CardHeader className="bg-gradient-to-r">
            <CardTitle className="text-2xl">
              {currentProfile.id ? 'Edit Profile' : 'New Profile'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 p-6">

            {/* STEP 0: Basic Investor Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    color: 'var(--hdc-faded-jade)',
                    flexShrink: 0,
                    flexGrow: 0,
                  }}
                >
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--hdc-faded-jade)]">
                  Investor Information
                </h3>
              </div>

              {/* Phase B1-3: Income Composition Fields */}
              <div className="space-y-2">
                <Label htmlFor="annual-ordinary-income">Annual Ordinary Income</Label>
                <Input
                  id="annual-ordinary-income"
                  type="number"
                  value={currentProfile.annualOrdinaryIncome ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    if (value !== '' && numValue < 0) return;
                    setCurrentProfile({
                      ...currentProfile,
                      annualOrdinaryIncome: value === '' ? 0 : numValue
                    });
                  }}
                  placeholder="e.g., 750000"
                  className="font-mono"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  W-2 salary, active business income, board fees. HDC depreciation can offset this only for REP investors (subject to §461(l) cap).
                </p>
              </div>

              {/* IMPL-159: Passive Income Character Split */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Passive Income</Label>

                <div className="space-y-2 pl-3 border-l-2 border-muted">
                  <div className="space-y-1">
                    <Label htmlFor="annual-passive-ordinary-income" className="text-sm">
                      Ordinary passive income
                      <span className="text-muted-foreground font-normal ml-1">(partnership business, short-term K-1)</span>
                    </Label>
                    <Input
                      id="annual-passive-ordinary-income"
                      type="number"
                      value={currentProfile.annualPassiveOrdinaryIncome ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = Number(value);
                        if (value !== '' && numValue < 0) return;
                        setCurrentProfile({
                          ...currentProfile,
                          annualPassiveOrdinaryIncome: value === '' ? 0 : numValue
                        });
                      }}
                      placeholder="e.g., 500000"
                      className="font-mono"
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ordinary passive income includes partnership business income, rental income, and short-term capital gain K-1 distributions taxed at ordinary rates. If unsure, enter total here and leave LTCG at zero — this is the conservative assumption.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="annual-passive-ltcg-income" className="text-sm">
                      Long-term capital gains passive income
                      <span className="text-muted-foreground font-normal ml-1">(PE funds, hedge funds)</span>
                    </Label>
                    <Input
                      id="annual-passive-ltcg-income"
                      type="number"
                      value={currentProfile.annualPassiveLTCGIncome ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = Number(value);
                        if (value !== '' && numValue < 0) return;
                        setCurrentProfile({
                          ...currentProfile,
                          annualPassiveLTCGIncome: value === '' ? 0 : numValue
                        });
                      }}
                      placeholder="e.g., 500000"
                      className="font-mono"
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Long-term capital gains passive income includes private equity fund distributions, hedge fund long-term gains, and real estate fund capital gain distributions taxed at preferential rates.
                    </p>
                  </div>

                  {/* Computed total — read-only */}
                  <div className="p-2 bg-muted/50 rounded-md">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Total passive income:</span>
                      <span className="font-semibold font-mono">${computedPassiveTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual-portfolio-income">Annual Portfolio Income</Label>
                <Input
                  id="annual-portfolio-income"
                  type="number"
                  value={currentProfile.annualPortfolioIncome ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    if (value !== '' && numValue < 0) return;
                    setCurrentProfile({
                      ...currentProfile,
                      annualPortfolioIncome: value === '' ? 0 : numValue
                    });
                  }}
                  placeholder="e.g., 100000"
                  className="font-mono"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Personal stock sales, crypto gains, dividends, interest. HDC passive losses cannot offset this income regardless of investor type.
                </p>
              </div>

              {/* Computed Total Display */}
              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Annual Income:</span>
                  <span className="font-semibold font-mono">${computedAnnualIncome.toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Federal tax rates are auto-calculated based on this total
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filing-status">Filing Status</Label>
                <Select
                  value={currentProfile.filingStatus || 'married'}
                  onValueChange={(value) => setCurrentProfile({ ...currentProfile, filingStatus: value as 'single' | 'married' })}
                >
                  <SelectTrigger id="filing-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IMPL-146: Traditional IRA Balance for Roth conversion planning */}
              <div className="space-y-2">
                <Label htmlFor="ira-balance">Traditional IRA Balance</Label>
                <Input
                  id="ira-balance"
                  type="number"
                  value={currentProfile.iraBalance ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    if (value !== '' && numValue < 0) return;
                    setCurrentProfile({
                      ...currentProfile,
                      iraBalance: value === '' ? 0 : numValue
                    });
                  }}
                  placeholder="e.g., 500000"
                  className="font-mono"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Total balance in Traditional, Rollover, SEP, or SIMPLE IRAs available for Roth conversion. Roth IRA balances are already tax-free and should not be included.
                </p>
              </div>
            </div>

            {/* STEP 1: Investor Track Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    color: 'var(--hdc-faded-jade)',
                    flexShrink: 0,
                    flexGrow: 0,
                  }}
                >
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--hdc-faded-jade)]">
                  Select Investor Type
                </h3>
              </div>

              <div className="space-y-2">
                <Select
                  value={currentProfile.investorTrack || 'rep'}
                  onValueChange={(value) => handleInvestorTrackChange(value as InvestorTrack)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rep">Track 1: Real Estate Professional (REP)</SelectItem>
                    <SelectItem value="non-rep">Track 2: Non-REP Investor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phase B1-4: Grouping Election Toggle (REP only) */}
              {currentProfile.investorTrack === 'rep' && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="grouping-election"
                      checked={currentProfile.groupingElection || false}
                      onChange={(e) => setCurrentProfile({
                        ...currentProfile,
                        groupingElection: e.target.checked
                      })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="grouping-election" className="text-sm font-medium cursor-pointer">
                      §469(c)(7)(A)(ii) Grouping Election
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-7">
                    If you've elected to treat all rental activities as a single activity under §469(c)(7)(A)(ii), toggle this on. This makes HDC losses nonpassive. If unsure, leave off and consult your tax advisor.
                  </p>
                </div>
              )}

              {currentProfile.investorTrack === 'non-rep' && (
                <div className="space-y-2">
                  <Label htmlFor="passive-gain-type">Type of Passive Gains to Offset</Label>
                  <Select
                    value={currentProfile.passiveGainType || 'long-term'}
                    onValueChange={(value) => handlePassiveGainTypeChange(value as PassiveGainType)}
                  >
                    <SelectTrigger id="passive-gain-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-term">Short-Term Passive Gains</SelectItem>
                      <SelectItem value="long-term">Long-Term Passive Gains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* IMPL-157: Material AMT Exposure flag */}
              <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="amt-exposure"
                    checked={currentProfile.hasMaterialAmtExposure || false}
                    onChange={(e) => setCurrentProfile({
                      ...currentProfile,
                      hasMaterialAmtExposure: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="amt-exposure" className="text-sm font-medium cursor-pointer">
                    This investor has material AMT exposure from non-HDC sources
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                  ISO exercises, private activity bonds, or other AMT preference items.
                  If checked, an advisor note will appear in the sizing analysis.
                </p>
              </div>
            </div>

            {/* STEP 2: Federal Tax Rates */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    color: 'var(--hdc-faded-jade)',
                    flexShrink: 0,
                    flexGrow: 0,
                  }}
                >
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--hdc-faded-jade)]">
                  Select Federal Tax Rate
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="federal-rate">
                  {currentProfile.investorTrack === 'rep' ? 'Federal Ordinary Income Rate' :
                   currentProfile.passiveGainType === 'short-term' ? 'Federal Short-Term Capital Gains Rate (37% max)' :
                   'Federal Long-Term Capital Gains Rate (20% max)'}
                </Label>
                <Select
                  value={String(currentProfile.federalOrdinaryRate || 37)}
                  onValueChange={(value) => setCurrentProfile({ ...currentProfile, federalOrdinaryRate: Number(value) })}
                  disabled={
                    (currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term') ||
                    currentProfile.annualIncome !== undefined
                  }
                >
                  <SelectTrigger id="federal-rate" className={
                    (currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term') ||
                    currentProfile.annualIncome !== undefined
                      ? 'bg-muted cursor-not-allowed'
                      : ''
                  }>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEDERAL_TAX_BRACKETS_2024.map(bracket => (
                      <SelectItem key={bracket.value} value={String(bracket.value)}>
                        {bracket.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term' ? (
                  <p className="text-sm text-muted-foreground italic">
                    Note: Short-term passive gains are taxed as ordinary income (same as regular income, not capital gains)
                  </p>
                ) : currentProfile.annualIncome != null ? (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <span>✓</span>
                    <span>Auto-calculated based on ${currentProfile.annualIncome.toLocaleString()} annual income ({currentProfile.filingStatus === 'married' ? 'Married' : 'Single'}). Clear income to edit manually.</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter annual income above to auto-calculate, or select manually
                  </p>
                )}
              </div>
            </div>

            {/* STEP 3: State/Territory Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    color: 'var(--hdc-faded-jade)',
                    flexShrink: 0,
                    flexGrow: 0,
                  }}
                >
                  4
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--hdc-faded-jade)]">
                  Select State/Territory
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state-territory">
                  Investor State/Territory
                  <span className="text-xs text-muted-foreground ml-2">
                    (Where investor files taxes)
                  </span>
                </Label>
                <Select
                  value={currentProfile.selectedState || ''}
                  onValueChange={(value) => handleStateChange(value)}
                >
                  <SelectTrigger id="state-territory">
                    <SelectValue placeholder="Select State/Territory..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedJurisdictions.map(({ code, data }) => (
                      <SelectItem key={code} value={code}>
                        {data.name} - {data.status === 'NO_GO' ? 'Non-conforming' : `${data.rate}%`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedJurisdiction && (
                <Card className="mt-3 border-2 bg-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{selectedJurisdiction.name}</span>
                      <Badge
                        variant={
                          ozBenefits.status === 'GO' ? 'default' :
                          ozBenefits.status === 'GO_IN_STATE' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {ozBenefits.status === 'NO_GO' ? 'Non-conforming' :
                         ozBenefits.status === 'GO_IN_STATE' ? 'In-State Only' :
                         'OZ Conforming'}
                      </Badge>
                    </div>

                    {selectedJurisdiction.status !== 'NO_GO' && (
                      <p className="text-sm text-muted-foreground">
                        State Tax Rate: {selectedJurisdiction.rate}%
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {ozBenefits.showProjectSelector && (
                <div className="space-y-2">
                  <Label htmlFor="project-location">
                    📍 Project Location (Required for {selectedJurisdiction?.name})
                  </Label>
                  <Select
                    value={currentProfile.projectLocation || ''}
                    onValueChange={(value) => setCurrentProfile({ ...currentProfile, projectLocation: value })}
                  >
                    <SelectTrigger id="project-location">
                      <SelectValue placeholder="Select project location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={currentProfile.selectedState || 'in-state'}>
                        In-State ({selectedJurisdiction?.name})
                      </SelectItem>
                      <SelectItem value="OUT_OF_STATE">Out of State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* STEP 4: Effective Tax Rate Display */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center text-sm font-semibold"
                  style={{
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px',
                    aspectRatio: '1/1',
                    borderRadius: '50%',
                    color: 'var(--hdc-cabbage-pont)',
                    flexShrink: 0,
                    flexGrow: 0,
                  }}
                >
                  ✓
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--hdc-cabbage-pont)]">
                  Effective Tax Rate Calculation
                </h3>
              </div>

              <Card className="border-2 shadow-md bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Federal Rate:</span>
                    <span className="font-medium">
                      {currentProfile.investorTrack === 'rep' ? `${currentProfile.federalOrdinaryRate}%` :
                       currentProfile.passiveGainType === 'short-term' ? '37.0%' : '20.0%'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">State Rate:</span>
                    <span className="font-medium">
                      {isNonConforming ? (
                        <span className="text-muted-foreground italic">0.0% (Non-conforming)</span>
                      ) : (
                        `${(currentProfile.stateOrdinaryRate || 0).toFixed(1)}%`
                      )}
                    </span>
                  </div>

                  {currentProfile.investorTrack === 'non-rep' && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">NIIT:</span>
                      <span className="font-medium">
                        {niitForDisplay > 0 ? `${NIIT_RATE}%` :
                         <span className="text-muted-foreground italic">0.0% (Territory)</span>}
                      </span>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-semibold text-[var(--hdc-strikemaster)]">Total Effective Rate:</span>
                    <span className="font-medium text-[var(--hdc-cabbage-pont)]">
                      {(() => {
                        if (currentProfile.investorTrack === 'rep') {
                          return effectiveOrdinaryRate.toFixed(1);
                        } else {
                          if (currentProfile.passiveGainType === 'short-term') {
                            return (37 + niitForDisplay + (isNonConforming ? 0 : (currentProfile.stateOrdinaryRate || 0))).toFixed(1);
                          } else {
                            return (20 + niitForDisplay + (isNonConforming ? 0 : (currentProfile.stateCapitalGainsRate || 0))).toFixed(1);
                          }
                        }
                      })()}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Capital Gains Tax Rates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tax Rates for OZ Capital Gains</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="federal-capital-gains">Federal Capital Gains Rate</Label>
                  <Select
                    value={String(currentProfile.federalCapitalGainsRate ?? 20)}
                    onValueChange={(value) => setCurrentProfile({ ...currentProfile, federalCapitalGainsRate: Number(value) })}
                    disabled={currentProfile.annualIncome !== undefined}
                  >
                    <SelectTrigger id="federal-capital-gains" className={currentProfile.annualIncome !== undefined ? 'bg-muted cursor-not-allowed' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEDERAL_CAPITAL_GAINS_BRACKETS_2024.map(bracket => (
                        <SelectItem key={bracket.value} value={String(bracket.value)}>
                          {bracket.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentProfile.annualIncome !== undefined ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span>✓</span>
                      <span>Auto-calculated from income. Clear income to edit manually.</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enter annual income to auto-calculate, or select manually
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state-capital-gains">State Capital Gains Rate</Label>
                  <Input
                    id="state-capital-gains"
                    type="number"
                    step="0.1"
                    value={currentProfile.stateCapitalGainsRate || 0}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    title={currentProfile.selectedState ? `Auto-set from ${selectedJurisdiction?.name}` : 'Select a state first'}
                  />
                </div>
              </div>

              <Card className="border-2 shadow-md bg-card">
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Federal LTCG:</span>
                    <span className="font-medium">{(currentProfile.federalCapitalGainsRate || 20).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIIT:</span>
                    <span className="font-medium">{niitForDisplay > 0 ? `${NIIT_RATE}%` : '0.0% (Territory Exempt)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State Capital Gains:</span>
                    <span className="font-medium">{(currentProfile.stateCapitalGainsRate || 0).toFixed(1)}%</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-[var(--hdc-cabbage-pont)]">
                    <span>Combined Rate (Fed + NIIT + State):</span>
                    <span>{(currentProfile.capitalGainsTaxRate || 0).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* OZ Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Opportunity Zone Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="oz-type">OZ Type</Label>
                <Select
                  value={currentProfile.ozType || 'standard'}
                  onValueChange={(value) => setCurrentProfile({ ...currentProfile, ozType: value })}
                >
                  <SelectTrigger id="oz-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Opportunity Zone (10% step-up)</SelectItem>
                    <SelectItem value="rural">Rural OZ / QROF (30% step-up)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* IMPL-160: Advanced section — advisor-overrideable parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--hdc-faded-jade)]">Advanced</h3>
              <div className="space-y-2">
                <Label htmlFor="nol-discount-rate" className="text-sm">
                  NOL discount rate (default 7%)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="nol-discount-rate"
                    type="number"
                    value={currentProfile.nolDiscountRate != null ? (currentProfile.nolDiscountRate * 100) : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setCurrentProfile({ ...currentProfile, nolDiscountRate: undefined });
                      } else {
                        const numValue = Number(value);
                        if (numValue < 0 || numValue > 100) return;
                        setCurrentProfile({ ...currentProfile, nolDiscountRate: numValue / 100 });
                      }
                    }}
                    placeholder="7"
                    className="font-mono w-24"
                    min="0"
                    max="100"
                    step="0.5"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rate used to discount future NOL carryforward tax savings to present value. Leave blank for the default 7%. Lower rates increase the present value of NOL benefits.
                </p>
              </div>
            </div>

            {/* Profile Name */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profile Name (Optional)</h3>
              <div className="space-y-2">
                <Input
                  id="profile-name"
                  type="text"
                  value={currentProfile.profileName || ''}
                  onChange={(e) => setCurrentProfile({ ...currentProfile, profileName: e.target.value })}
                  placeholder="e.g., High Income REP, Non-REP Long-Term, etc."
                />
                <p className="text-sm text-muted-foreground">
                  Give this profile a memorable name to easily identify it later
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                {saving ? 'Saving...' : currentProfile.id ? 'Update Profile' : 'Save Profile'}
              </Button>

              {currentProfile.id && !currentProfile.isDefault && (
                <Button
                  onClick={() => handleSetDefault(currentProfile.id!)}
                  variant="outline"
                  size="lg"
                >
                  Set as Default
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvestorTaxProfilePage;
