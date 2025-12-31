import React, { useState, useEffect, useMemo, useRef } from 'react';
import { investorTaxInfoService } from '../../services/api';
import { InvestorTaxInfo } from '../../types/investorTaxInfo';
import { HDC_OZ_STRATEGY, getOzBenefits } from '../../utils/taxbenefits/hdcOzStrategy';
import { FEDERAL_TAX_BRACKETS_2024, FEDERAL_CAPITAL_GAINS_BRACKETS_2024, CONFORMING_STATES } from '../../utils/taxbenefits/constants';
import { doesNIITApply } from '../../utils/taxbenefits/stateData';
import { Toast } from 'primereact/toast';
import '../../styles/taxbenefits/hdcCalculator.css';

type InvestorTrack = 'rep' | 'non-rep';
type PassiveGainType = 'short-term' | 'long-term';

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

const InvestorTaxProfilePage: React.FC = () => {
  const toastRef = useRef<Toast>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profiles, setProfiles] = useState<InvestorTaxInfo[]>([]);
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
  });

  const NIIT_RATE = 3.8;

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await investorTaxInfoService.getUserTaxInfo();
      setProfiles(data);

      const defaultProfile = data.find(p => p.isDefault);
      if (defaultProfile) {
        setCurrentProfile(defaultProfile);
      } else if (data.length > 0) {
        setCurrentProfile(data[0]);
      }
    } catch (error) {
      console.error('Error loading tax profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-update rates when state changes
  useEffect(() => {
    if (currentProfile.selectedState && CONFORMING_STATES[currentProfile.selectedState]) {
      const stateInfo = CONFORMING_STATES[currentProfile.selectedState];
      setCurrentProfile(prev => ({
        ...prev,
        stateOrdinaryRate: stateInfo.rate,
        stateCapitalGainsRate: stateInfo.rate,
      }));
    }
  }, [currentProfile.selectedState]);

  // Auto-update federal tax rates when annual income or filing status changes
  useEffect(() => {
    // Allow 0 as valid income, but skip if undefined
    if (currentProfile.annualIncome === undefined || !currentProfile.filingStatus) return;

    const income = currentProfile.annualIncome;
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
    }));
  }, [currentProfile.annualIncome, currentProfile.filingStatus]);

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
      if (currentProfile.id) {
        await investorTaxInfoService.updateTaxInfo(currentProfile.id, currentProfile);
      } else {
        await investorTaxInfoService.saveTaxInfo(currentProfile);
      }
      await loadProfiles();
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Tax profile saved successfully!',
        life: 3000
      });
    } catch (error) {
      console.error('Error saving tax profile:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save tax profile. Please try again.',
        life: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await investorTaxInfoService.setAsDefault(id);
      await loadProfiles();
    } catch (error) {
      console.error('Error setting default:', error);
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
    setCurrentProfile(profile);
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
      <div className="hdc-calculator-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading tax profiles...</h2>
      </div>
    );
  }

  return (
    <div className="hdc-calculator-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Toast ref={toastRef} />
      <div className="hdc-header">
        <h1 className="hdc-title">Investor Tax Profile</h1>
        <p className="hdc-subtitle">
          Manage your tax information for consistent calculations across all tools
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Saved Profiles Sidebar */}
        <div>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Saved Profiles</h3>
            <button
              onClick={handleCreateNew}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--hdc-cabbage-pont)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              + New
            </button>
          </div>

          {profiles.length === 0 ? (
            <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
              No saved profiles
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  style={{
                    padding: '1rem',
                    background: profile.id === currentProfile.id ? 'var(--hdc-athens-gray)' : 'white',
                    border: '1px solid var(--hdc-mercury)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleLoadProfile(profile)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {profile.selectedState} - {profile.investorTrack === 'rep' ? 'REP' : 'Non-REP'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {profile.federalOrdinaryRate}% Federal
                      </div>
                    </div>
                    {profile.isDefault && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'var(--hdc-cabbage-pont)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        Default
                      </span>
                    )}
                  </div>
                  {profile.id && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      {!profile.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(profile.id!);
                          }}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            background: 'white',
                            border: '1px solid var(--hdc-mercury)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(profile.id!);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: 'white',
                          border: '1px solid #d32f2f',
                          color: '#d32f2f',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Editor */}
        <div>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0 }}>
              {currentProfile.id ? 'Edit Profile' : 'New Profile'}
            </h2>

            {/* STEP 0: Basic Investor Information */}
            <div className="hdc-section">
              <h3 className="hdc-section-header" style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--hdc-faded-jade)',
              }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--hdc-faded-jade)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  marginRight: '8px'
                }}>1</span>
                Investor Information
              </h3>

              <div className="hdc-input-group">
                <label className="hdc-input-label">Gross Annual Income</label>
                <input
                  type="number"
                  value={currentProfile.annualIncome ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    // Prevent negative values
                    if (value !== '' && numValue < 0) return;
                    setCurrentProfile({
                      ...currentProfile,
                      annualIncome: value === '' ? undefined : numValue
                    });
                  }}
                  className="hdc-input"
                  placeholder="e.g., 750000"
                  style={{ fontFamily: 'monospace' }}
                  min="0"
                  onKeyDown={(e) => {
                    // Prevent minus key and scientific notation
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                />
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                  Enter your total annual income to auto-calculate federal tax rates
                </div>
              </div>

              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Filing Status</label>
                <select
                  value={currentProfile.filingStatus || 'married'}
                  onChange={(e) => setCurrentProfile({ ...currentProfile, filingStatus: e.target.value as 'single' | 'married' })}
                  className="hdc-input"
                >
                  <option value="single">Single</option>
                  <option value="married">Married Filing Jointly</option>
                </select>
              </div>
            </div>

            {/* STEP 1: Investor Track Selection */}
            <div className="hdc-section">
              <h3 className="hdc-section-header" style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--hdc-faded-jade)',
              }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--hdc-faded-jade)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  marginRight: '8px'
                }}>2</span>
                Select Investor Type
              </h3>

              <div className="hdc-input-group">
                <select
                  value={currentProfile.investorTrack || 'rep'}
                  onChange={(e) => handleInvestorTrackChange(e.target.value as InvestorTrack)}
                  className="hdc-input"
                  style={{ fontWeight: 500 }}
                >
                  <option value="rep">Track 1: Real Estate Professional (REP)</option>
                  <option value="non-rep">Track 2: Non-REP Investor</option>
                </select>
              </div>

              {currentProfile.investorTrack === 'non-rep' && (
                <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                  <label className="hdc-input-label">Type of Passive Gains to Offset</label>
                  <select
                    value={currentProfile.passiveGainType || 'long-term'}
                    onChange={(e) => handlePassiveGainTypeChange(e.target.value as PassiveGainType)}
                    className="hdc-input"
                  >
                    <option value="short-term">Short-Term Passive Gains</option>
                    <option value="long-term">Long-Term Passive Gains</option>
                  </select>
                </div>
              )}
            </div>

            {/* STEP 2: Federal Tax Rates */}
            <div className="hdc-section">
              <h3 className="hdc-section-header" style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--hdc-faded-jade)',
              }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--hdc-faded-jade)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  marginRight: '8px'
                }}>3</span>
                Select Federal Tax Rate
              </h3>

              <div className="hdc-input-group">
                <label className="hdc-input-label">
                  {currentProfile.investorTrack === 'rep' ? 'Federal Ordinary Income Rate' :
                   currentProfile.passiveGainType === 'short-term' ? 'Federal Short-Term Capital Gains Rate (37% max)' :
                   'Federal Long-Term Capital Gains Rate (20% max)'}
                </label>
                <select
                  value={currentProfile.federalOrdinaryRate || 37}
                  onChange={(e) => setCurrentProfile({ ...currentProfile, federalOrdinaryRate: Number(e.target.value) })}
                  className="hdc-input"
                  disabled={
                    // Disabled in two cases:
                    // 1. Non-REP with short-term gains: Uses ordinary income rates (not a separate capital gains rate)
                    //    This field is locked because short-term passive gains are taxed as ordinary income
                    // 2. Annual income provided: Auto-calculated from income brackets
                    (currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term') ||
                    currentProfile.annualIncome !== undefined
                  }
                  style={{
                    backgroundColor:
                      (currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term') ||
                      currentProfile.annualIncome !== undefined
                        ? '#f3f4f6'
                        : 'white',
                    cursor:
                      (currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term') ||
                      currentProfile.annualIncome !== undefined
                        ? 'not-allowed'
                        : 'pointer'
                  }}
                >
                  {FEDERAL_TAX_BRACKETS_2024.map(bracket => (
                    <option key={bracket.value} value={bracket.value}>
                      {bracket.label}
                    </option>
                  ))}
                </select>
                {currentProfile.investorTrack === 'non-rep' && currentProfile.passiveGainType === 'short-term' ? (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.5rem',
                    fontStyle: 'italic'
                  }}>
                    Note: Short-term passive gains are taxed as ordinary income (same as regular income, not capital gains)
                  </div>
                ) : currentProfile.annualIncome !== undefined ? (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#059669',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span>✓</span>
                    <span>Auto-calculated based on ${currentProfile.annualIncome.toLocaleString()} annual income ({currentProfile.filingStatus === 'married' ? 'Married' : 'Single'}). Clear income to edit manually.</span>
                  </div>
                ) : (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginTop: '0.5rem'
                  }}>
                    Enter annual income above to auto-calculate, or select manually
                  </div>
                )}
              </div>
            </div>

            {/* STEP 3: State/Territory Selection */}
            <div className="hdc-section">
              <h3 className="hdc-section-header" style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--hdc-faded-jade)',
              }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--hdc-faded-jade)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  marginRight: '8px'
                }}>4</span>
                Select State/Territory
              </h3>

              <div className="hdc-input-group">
                <label className="hdc-input-label">
                  Investor State/Territory
                  <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '8px' }}>
                    (Where investor files taxes)
                  </span>
                </label>
                <select
                  value={currentProfile.selectedState || ''}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="hdc-input"
                >
                  <option value="">Select State/Territory...</option>
                  {sortedJurisdictions.map(({ code, data }) => (
                    <option key={code} value={code}>
                      {data.name} - {data.status === 'NO_GO' ? 'Non-conforming' : `${data.rate}%`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJurisdiction && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'white',
                  border: '1px solid var(--hdc-mercury)',
                  borderRadius: '4px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: 600 }}>{selectedJurisdiction.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: ozBenefits.status === 'GO' ? '#E8F5E9' :
                                 ozBenefits.status === 'GO_IN_STATE' ? '#FFF9C4' :
                                 '#FFEBEE',
                      color: ozBenefits.status === 'GO' ? '#2E7D32' :
                             ozBenefits.status === 'GO_IN_STATE' ? '#F57C00' :
                             '#C62828',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {ozBenefits.status === 'NO_GO' ? 'Non-conforming' :
                       ozBenefits.status === 'GO_IN_STATE' ? 'In-State Only' :
                       'OZ Conforming'}
                    </span>
                  </div>

                  {selectedJurisdiction.status !== 'NO_GO' && (
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>
                      State Tax Rate: {selectedJurisdiction.rate}%
                    </div>
                  )}
                </div>
              )}

              {ozBenefits.showProjectSelector && (
                <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                  <label className="hdc-input-label">
                    📍 Project Location (Required for {selectedJurisdiction?.name})
                  </label>
                  <select
                    value={currentProfile.projectLocation || ''}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, projectLocation: e.target.value })}
                    className="hdc-input"
                  >
                    <option value="">Select project location...</option>
                    <option value={currentProfile.selectedState}>In-State ({selectedJurisdiction?.name})</option>
                    <option value="OUT_OF_STATE">Out of State</option>
                  </select>
                </div>
              )}
            </div>

            {/* STEP 4: Effective Tax Rate Display */}
            <div className="hdc-section">
              <h3 className="hdc-section-header" style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--hdc-cabbage-pont)',
              }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--hdc-cabbage-pont)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  marginRight: '8px'
                }}>✓</span>
                Effective Tax Rate Calculation
              </h3>

              <div style={{
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                border: '1px solid var(--hdc-mercury)',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                  <span style={{ color: '#666' }}>Federal Rate:</span>
                  <span style={{ fontWeight: 500 }}>
                    {currentProfile.investorTrack === 'rep' ? `${currentProfile.federalOrdinaryRate}%` :
                     currentProfile.passiveGainType === 'short-term' ? '37.0%' : '20.0%'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                  <span style={{ color: '#666' }}>State Rate:</span>
                  <span style={{ fontWeight: 500 }}>
                    {isNonConforming ? (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Non-conforming)</span>
                    ) : (
                      `${(currentProfile.stateOrdinaryRate || 0).toFixed(1)}%`
                    )}
                  </span>
                </div>

                {currentProfile.investorTrack === 'non-rep' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                    <span style={{ color: '#666' }}>NIIT:</span>
                    <span style={{ fontWeight: 500 }}>
                      {niitForDisplay > 0 ? `${NIIT_RATE}%` :
                       <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Territory)</span>}
                    </span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--hdc-mercury)', margin: '0.5rem 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--hdc-strikemaster)' }}>Total Effective Rate:</span>
                  <span className="hdc-value-positive" style={{ color: 'var(--hdc-cabbage-pont)', fontSize: '1.1rem' }}>
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
              </div>
            </div>

            {/* Capital Gains Tax Rates */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Tax Rates for OZ Capital Gains</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Federal Capital Gains Rate</label>
                  <select
                    value={currentProfile.federalCapitalGainsRate ?? 20}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, federalCapitalGainsRate: Number(e.target.value) })}
                    className="hdc-input"
                    disabled={currentProfile.annualIncome !== undefined}
                    style={{
                      backgroundColor: currentProfile.annualIncome !== undefined ? '#f3f4f6' : 'white',
                      cursor: currentProfile.annualIncome !== undefined ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {FEDERAL_CAPITAL_GAINS_BRACKETS_2024.map(bracket => (
                      <option key={bracket.value} value={bracket.value}>
                        {bracket.label}
                      </option>
                    ))}
                  </select>
                  {currentProfile.annualIncome !== undefined ? (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#059669',
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span>✓</span>
                      <span>Auto-calculated from income. Clear income to edit manually.</span>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      marginTop: '0.5rem'
                    }}>
                      Enter annual income to auto-calculate, or select manually
                    </div>
                  )}
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">State Capital Gains Rate</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentProfile.stateCapitalGainsRate || 0}
                    className="hdc-input"
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    title={currentProfile.selectedState ? `Auto-set from ${selectedJurisdiction?.name}` : 'Select a state first'}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>Federal LTCG:</span>
                  <span>{(currentProfile.federalCapitalGainsRate || 20).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>NIIT:</span>
                  <span>{niitForDisplay > 0 ? `${NIIT_RATE}%` : '0.0% (Territory Exempt)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span>State Capital Gains:</span>
                  <span>{(currentProfile.stateCapitalGainsRate || 0).toFixed(1)}%</span>
                </div>
                <div style={{ borderTop: '1px solid var(--hdc-mercury)', margin: '0.5rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontWeight: 600 }}>
                  <span style={{ color: 'var(--hdc-cabbage-pont)' }}>Combined Rate (Fed + NIIT + State):</span>
                  <span style={{ color: 'var(--hdc-cabbage-pont)' }}>
                    {(currentProfile.capitalGainsTaxRate || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* OZ Configuration */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Opportunity Zone Configuration</h3>

              <div className="hdc-input-group">
                <label className="hdc-input-label">OZ Type</label>
                <select
                  value={currentProfile.ozType || 'standard'}
                  onChange={(e) => setCurrentProfile({ ...currentProfile, ozType: e.target.value })}
                  className="hdc-input"
                >
                  <option value="standard">Standard Opportunity Zone (10% step-up)</option>
                  <option value="rural">Rural OZ / QROF (30% step-up)</option>
                </select>
              </div>
            </div>

            {/* Profile Name */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Profile Name (Optional)</h3>
              <div className="hdc-input-group">
                <input
                  type="text"
                  value={currentProfile.profileName || ''}
                  onChange={(e) => setCurrentProfile({ ...currentProfile, profileName: e.target.value })}
                  className="hdc-input"
                  placeholder="e.g., High Income REP, Non-REP Long-Term, etc."
                />
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                  Give this profile a memorable name to easily identify it later
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'var(--hdc-cabbage-pont)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : currentProfile.id ? 'Update Profile' : 'Save Profile'}
              </button>

              {currentProfile.id && !currentProfile.isDefault && (
                <button
                  onClick={() => handleSetDefault(currentProfile.id!)}
                  style={{
                    padding: '1rem',
                    background: 'white',
                    color: 'var(--hdc-cabbage-pont)',
                    border: '2px solid var(--hdc-cabbage-pont)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorTaxProfilePage;
