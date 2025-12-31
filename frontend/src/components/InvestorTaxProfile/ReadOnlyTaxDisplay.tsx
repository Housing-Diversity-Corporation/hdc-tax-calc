import React, { useState, useEffect } from 'react';
import { investorTaxInfoService } from '../../services/api';
import { InvestorTaxInfo } from '../../types/investorTaxInfo';
import { HDC_OZ_STRATEGY } from '../../utils/taxbenefits/hdcOzStrategy';
import { doesNIITApply } from '../../utils/taxbenefits/stateData';
import '../../styles/taxbenefits/hdcCalculator.css';

interface ReadOnlyTaxDisplayProps {
  onNavigateToTaxProfile: () => void;
}

const ReadOnlyTaxDisplay: React.FC<ReadOnlyTaxDisplayProps> = ({ onNavigateToTaxProfile }) => {
  const [loading, setLoading] = useState(true);
  const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);

  const NIIT_RATE = 3.8;

  useEffect(() => {
    loadTaxProfile();
  }, []);

  const loadTaxProfile = async () => {
    try {
      setLoading(true);
      const profiles = await investorTaxInfoService.getUserTaxInfo();

      // Load default profile or first available
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setTaxProfile(defaultProfile || null);
    } catch (error) {
      console.error('Error loading tax profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="hdc-section">
        <h3 className="hdc-section-header">Tax Profile</h3>
        <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
          Loading tax profile...
        </div>
      </div>
    );
  }

  if (!taxProfile) {
    return (
      <div className="hdc-section">
        <h3 className="hdc-section-header">Tax Profile</h3>
        <div style={{
          padding: '1.5rem',
          background: '#FFF9C4',
          border: '2px solid #FFC107',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>
            No tax profile found
          </p>
          <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.875rem' }}>
            Please create a tax profile to ensure consistent calculations across all tools.
          </p>
          <button
            onClick={onNavigateToTaxProfile}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--hdc-cabbage-pont)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Create Tax Profile
          </button>
        </div>
      </div>
    );
  }

  const selectedJurisdiction = HDC_OZ_STRATEGY[taxProfile.selectedState || ''];
  const isNonConforming = taxProfile.selectedState && selectedJurisdiction?.status === 'NO_GO';
  const niitRate = doesNIITApply(taxProfile.selectedState || '') ? NIIT_RATE : 0;

  // Calculate effective rate
  const effectiveRate = (() => {
    if (taxProfile.investorTrack === 'rep') {
      return (taxProfile.federalOrdinaryRate || 0) + (isNonConforming ? 0 : (taxProfile.stateOrdinaryRate || 0));
    } else {
      if (taxProfile.passiveGainType === 'short-term') {
        return 37 + niitRate + (isNonConforming ? 0 : (taxProfile.stateOrdinaryRate || 0));
      } else {
        return 20 + niitRate + (isNonConforming ? 0 : (taxProfile.stateCapitalGainsRate || 0));
      }
    }
  })();

  return (
    <div className="hdc-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="hdc-section-header" style={{ margin: 0 }}>Tax Profile</h3>
        <button
          onClick={onNavigateToTaxProfile}
          style={{
            padding: '0.5rem 1rem',
            background: 'white',
            color: 'var(--hdc-cabbage-pont)',
            border: '2px solid var(--hdc-cabbage-pont)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          Edit Tax Profile
        </button>
      </div>

      <div style={{
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        border: '1px solid var(--hdc-mercury)',
        borderRadius: '8px'
      }}>
        {/* Investor Type */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            Investor Type
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {taxProfile.investorTrack === 'rep' ? 'Real Estate Professional (REP)' : 'Non-REP Investor'}
          </div>
          {taxProfile.investorTrack === 'non-rep' && (
            <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
              Offsetting {taxProfile.passiveGainType === 'short-term' ? 'Short-Term' : 'Long-Term'} Passive Gains
            </div>
          )}
        </div>

        {/* State/Territory */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            State/Territory
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>
              {selectedJurisdiction?.name || taxProfile.selectedState}
            </div>
            <span style={{
              padding: '2px 8px',
              background: isNonConforming ? '#FFEBEE' : '#E8F5E9',
              color: isNonConforming ? '#C62828' : '#2E7D32',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {isNonConforming ? 'Non-conforming' : 'OZ Conforming'}
            </span>
          </div>
        </div>

        {/* Tax Rates Breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem', fontWeight: 600 }}>
            Tax Rate Breakdown
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: '#666' }}>Federal Rate:</span>
            <span style={{ fontWeight: 500 }}>
              {taxProfile.investorTrack === 'rep' ? `${taxProfile.federalOrdinaryRate}%` :
               taxProfile.passiveGainType === 'short-term' ? '37.0%' : '20.0%'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: '#666' }}>State Rate:</span>
            <span style={{ fontWeight: 500 }}>
              {isNonConforming ? (
                <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Non-conforming)</span>
              ) : (
                `${(taxProfile.stateOrdinaryRate || 0).toFixed(1)}%`
              )}
            </span>
          </div>

          {taxProfile.investorTrack === 'non-rep' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
              <span style={{ color: '#666' }}>NIIT:</span>
              <span style={{ fontWeight: 500 }}>
                {niitRate > 0 ? `${NIIT_RATE}%` :
                 <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Territory)</span>}
              </span>
            </div>
          )}

          <div style={{ borderTop: '2px solid var(--hdc-mercury)', margin: '0.75rem 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ color: 'var(--hdc-strikemaster)', fontWeight: 600 }}>Effective Tax Rate:</span>
            <span style={{ color: 'var(--hdc-cabbage-pont)', fontSize: '1.25rem', fontWeight: 700 }}>
              {effectiveRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* OZ Configuration */}
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            OZ Type
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {taxProfile.ozType === 'rural' ? 'Rural OZ / QROF (30% step-up)' : 'Standard Opportunity Zone (10% step-up)'}
          </div>
        </div>

        {/* Capital Gains Tax Rate for OZ */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--hdc-mercury)' }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
            OZ Capital Gains Tax Rate
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {(taxProfile.capitalGainsTaxRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
            Fed: {taxProfile.federalCapitalGainsRate}% + NIIT: {niitRate}% + State: {(taxProfile.stateCapitalGainsRate || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#E3F2FD',
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#424242',
        textAlign: 'center'
      }}>
        This tax information is managed in your Tax Profile. Click "Edit Tax Profile" to make changes.
      </div>
    </div>
  );
};

export default ReadOnlyTaxDisplay;
