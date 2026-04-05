/**
 * @deprecated IMPL-015: This component has been split into separate panels:
 * - InvestorProfileSection.tsx: Investor State, tax rates, REP/Non-REP toggle
 * - OpportunityZoneSection.tsx: OZ type, deferred capital gains
 * - Property State (selectedState) moved to ProjectDefinitionSection.tsx
 * Keep for backward compatibility but do not use in new code.
 */
import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { CONFORMING_STATES, FEDERAL_TAX_BRACKETS_2024, FEDERAL_CAPITAL_GAINS_BRACKETS_2024 } from '../../../utils/taxbenefits/constants';
import { doesNIITApply } from '../../../utils/taxbenefits/stateData';
import { HDC_OZ_STRATEGY } from '../../../utils/taxbenefits/hdcOzStrategy';
import { roundForDisplay } from '../../../utils/taxbenefits/formatters';
import StrategicOzSelector from './StrategicOzSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

type InvestorTrack = 'rep' | 'non-rep';
type PassiveGainType = 'short-term' | 'long-term';

interface InvestorTaxAndOZSectionProps {
  // Tax Rates
  federalOrdinaryRate: number;
  setFederalOrdinaryRate: (value: number) => void;
  stateOrdinaryRate: number;
  setStateOrdinaryRate: (value: number) => void;
  federalCapitalGainsRate: number;
  setFederalCapitalGainsRate: (value: number) => void;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (value: number) => void;

  // OZ Parameters
  ozType: 'standard' | 'rural';
  setOzType: (value: 'standard' | 'rural') => void;
  deferredCapitalGains: number;
  setDeferredCapitalGains: (value: number) => void;
  capitalGainsTaxRate: number;
  setCapitalGainsTaxRate: (value: number) => void;

  // State selection
  selectedState: string;  // Property state (where project is located)
  setSelectedState: (value: string) => void;
  projectLocation?: string;
  setProjectLocation?: (value: string) => void;
  investorState?: string;  // Investor state (where investor files taxes) - IMPL-014b
  setInvestorState?: (value: string) => void;

  // Investor Track
  investorTrack?: InvestorTrack;
  setInvestorTrack?: (value: InvestorTrack) => void;

  // Passive Gain Type (for Non-REPs)
  passiveGainType?: PassiveGainType;
  setPassiveGainType?: (value: PassiveGainType) => void;

  // Pass-through values
  investorEquityAmount?: number;

  // Annual Income and Filing Status
  annualIncome?: number;
  setAnnualIncome?: (value: number) => void;
  filingStatus?: 'single' | 'married';
  setFilingStatus?: (value: 'single' | 'married') => void;

  // Read-only mode for investor portal
  readOnly?: boolean;
}

const InvestorTaxAndOZSection: React.FC<InvestorTaxAndOZSectionProps> = ({
  federalOrdinaryRate,
  setFederalOrdinaryRate,
  stateOrdinaryRate,
  setStateOrdinaryRate,
  federalCapitalGainsRate,
  setFederalCapitalGainsRate,
  stateCapitalGainsRate,
  setStateCapitalGainsRate,
  ozType,
  setOzType,
  deferredCapitalGains,
  setDeferredCapitalGains,
  capitalGainsTaxRate,
  setCapitalGainsTaxRate,
  selectedState,
  setSelectedState,
  projectLocation,
  setProjectLocation,
  investorState,
  setInvestorState,
  investorTrack = 'rep',
  setInvestorTrack,
  passiveGainType = 'short-term',
  setPassiveGainType,
  investorEquityAmount = 0,
  annualIncome = 0,
  setAnnualIncome,
  filingStatus = 'single',
  setFilingStatus,
  readOnly = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded since it's an input section
  const [localInvestorTrack, setLocalInvestorTrack] = useState<InvestorTrack>(investorTrack);
  const [localPassiveGainType, setLocalPassiveGainType] = useState<PassiveGainType>(passiveGainType);

  // Constants
  const NIIT_RATE = 3.8; // Net Investment Income Tax for high earners
  const SECTION_461L_LIMIT = 626000; // Annual limitation for REPs against W-2 income

  // Sync local state with props when they change
  React.useEffect(() => {
    if (passiveGainType && passiveGainType !== localPassiveGainType) {
      setLocalPassiveGainType(passiveGainType);
    }
  }, [passiveGainType]);

  React.useEffect(() => {
    if (investorTrack && investorTrack !== localInvestorTrack) {
      setLocalInvestorTrack(investorTrack);
    }
  }, [investorTrack]);

  // Handle investor track change
  const handleInvestorTrackChange = (track: InvestorTrack) => {
    setLocalInvestorTrack(track);
    if (setInvestorTrack) {
      setInvestorTrack(track);
    }

    // Auto-populate tax rates based on track
    if (track === 'rep') {
      // REPs: Active losses offset ordinary income
      setFederalOrdinaryRate(37); // Top bracket for offsetting W-2 income
      setFederalCapitalGainsRate(20); // For OZ exit gains
    } else {
      // Non-REPs: Passive losses offset passive gains
      if (localPassiveGainType === 'short-term') {
        // Short-term passive gains taxed as ordinary income
        setFederalOrdinaryRate(37); // Short-term gains taxed as ordinary
        setFederalCapitalGainsRate(20); // For OZ exit gains
      } else {
        // Long-term passive gains
        setFederalOrdinaryRate(20); // This represents the LTCG rate being offset
        setFederalCapitalGainsRate(20); // For OZ exit gains
      }
    }
  };

  // Handle passive gain type change (for Non-REPs)
  const handlePassiveGainTypeChange = (type: PassiveGainType) => {
    setLocalPassiveGainType(type);
    if (setPassiveGainType) {
      setPassiveGainType(type);
    }

    // Auto-update tax rates based on passive gain type
    if (localInvestorTrack === 'non-rep') {
      if (type === 'short-term') {
        // Short-term passive gains are taxed as ordinary income
        setFederalOrdinaryRate(37); // Top bracket for ST gains
      } else {
        // Long-term passive gains use capital gains rates
        setFederalCapitalGainsRate(20); // Standard LTCG rate
        // For display purposes, we might want to show this affects the ordinary rate field
        // when calculating benefits since depreciation offsets these gains
        setFederalOrdinaryRate(20); // This represents the rate being offset
      }
    }
  };

  // Initialize tax rates on mount based on current track and gain type
  React.useEffect(() => {
    if (localInvestorTrack === 'rep') {
      setFederalOrdinaryRate(37); // REPs offset ordinary income
    } else {
      if (localPassiveGainType === 'short-term') {
        setFederalOrdinaryRate(37); // ST gains taxed as ordinary
      } else {
        setFederalOrdinaryRate(20); // LT gains rate being offset
      }
    }
    // Always set capital gains rate for OZ calculations
    setFederalCapitalGainsRate(20);
  }, []); // Only run on mount

  // Auto-populate deferred capital gains to match investor equity
  // ISS-066: Round to prevent floating-point display artifacts
  React.useEffect(() => {
    if (investorEquityAmount > 0) {
      setDeferredCapitalGains(roundForDisplay(investorEquityAmount));
    }
  }, [investorEquityAmount, setDeferredCapitalGains]);

  // Auto-update state ordinary rate when state selection changes
  // IMPL-053: Use HDC_OZ_STRATEGY (derived from STATE_TAX_PROFILES) as single source of truth
  React.useEffect(() => {
    if (selectedState && HDC_OZ_STRATEGY[selectedState]) {
      const stateInfo = HDC_OZ_STRATEGY[selectedState];
      setStateOrdinaryRate(stateInfo.rate);
      // State capital gains rate is handled by handleStateChange in parent
    } else if (selectedState === 'NONE' || selectedState === '') {
      setStateOrdinaryRate(0);
    }
  }, [selectedState, setStateOrdinaryRate]);

  // Calculate effective tax rates based on track and gain type
  React.useEffect(() => {
    let effectiveRate = 0;

    const isNonConforming = selectedState && HDC_OZ_STRATEGY[selectedState]?.status === 'NO_GO';

    if (localInvestorTrack === 'rep') {
      // REPs: Active losses offset ordinary income (exclude state if non-conforming)
      effectiveRate = federalOrdinaryRate + (isNonConforming ? 0 : stateOrdinaryRate);
    } else {
      // Non-REPs: Passive losses offset passive gains
      const niitRate = doesNIITApply(selectedState) ? NIIT_RATE : 0; // 0% NIIT for territories

      if (localPassiveGainType === 'short-term') {
        // Short-term passive gains: 37% + NIIT (if applies) + State (if conforming)
        effectiveRate = 37 + niitRate;
        if (!isNonConforming) {
          effectiveRate += stateOrdinaryRate;
        }
      } else {
        // Long-term passive gains: 20% + NIIT (if applies) + State (if conforming)
        effectiveRate = 20 + niitRate;
        if (!isNonConforming) {
          effectiveRate += stateCapitalGainsRate;
        }
      }
    }

    // Set the capital gains tax rate for OZ calculations (exclude state if non-conforming)
    const niitForOZ = doesNIITApply(selectedState) ? NIIT_RATE : 0;
    setCapitalGainsTaxRate(20 + niitForOZ + (isNonConforming ? 0 : stateCapitalGainsRate)); // OZ gains are always LTCG
  }, [
    localInvestorTrack, localPassiveGainType, federalOrdinaryRate, stateOrdinaryRate,
    stateCapitalGainsRate, selectedState, setCapitalGainsTaxRate
  ]);

  // Calculate effective rates (exclude state tax for non-conforming states)
  const isNonConforming = selectedState && HDC_OZ_STRATEGY[selectedState]?.status === 'NO_GO';
  const effectiveOrdinaryRate = federalOrdinaryRate + (isNonConforming ? 0 : stateOrdinaryRate);
  const effectiveCapitalGainsRate = capitalGainsTaxRate;

  // Year 5 OZ tax calculation is handled in the main calculation engine (calculations.ts)
  // and displayed in the results section (Tax Planning Capacity, cash flows, etc.)

  return (
    <div className="hdc-section">
      <div style={{ position: 'relative' }}>
        <h3
          className="hdc-section-header"
          style={{ cursor: 'pointer', position: 'relative' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          Tax Strategy & Opportunity Zone Configuration
        </h3>
      </div>

      {isExpanded && (
        <>
      {/* STEP 1: Investor Information */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center'
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
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="hdc-input-group">
            <label className="hdc-input-label">Gross Annual Income</label>
            <input
              type="number"
              min="0"
              step="10000"
              value={annualIncome}
              onChange={(e) => setAnnualIncome && setAnnualIncome(Number(e.target.value))}
              className="hdc-input"
              placeholder="Enter annual income"
              disabled={readOnly}
              style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
          </div>

          <div className="hdc-input-group">
            <label className="hdc-input-label">Filing Status</label>
            <Select
              value={filingStatus}
              onValueChange={(value) => setFilingStatus && setFilingStatus(value as 'single' | 'married')}
              disabled={readOnly}
            >
              <SelectTrigger className="hdc-input" style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married Filing Jointly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="hdc-input-group">
          <label className="hdc-input-label">Investor Type</label>
          <Select
            value={localInvestorTrack}
            onValueChange={(value) => handleInvestorTrackChange(value as InvestorTrack)}
            disabled={readOnly}
          >
            <SelectTrigger
              className="hdc-input"
              style={{
                fontWeight: 500,
                ...(readOnly ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {})
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rep">Track 1: Real Estate Professional (REP)</SelectItem>
              <SelectItem value="non-rep">Track 2: Non-REP Investor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show passive gain type selector for Non-REPs */}
        {localInvestorTrack === 'non-rep' && (
          <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
            <label className="hdc-input-label">Type of Passive Gains to Offset</label>
            <Select
              value={localPassiveGainType}
              onValueChange={(value) => handlePassiveGainTypeChange(value as PassiveGainType)}
              disabled={readOnly}
            >
              <SelectTrigger className="hdc-input" style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short-term">Short-Term Passive Gains</SelectItem>
                <SelectItem value="long-term">Long-Term Passive Gains</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

      </div>

      {/* STEP 2: Federal Tax Rates */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center'
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
          Select Federal Tax Rate
        </h4>

        <div>
          <label className="hdc-input-label">
            {localInvestorTrack === 'rep' ? 'Federal Ordinary Income Rate' :
             localPassiveGainType === 'short-term' ? 'Federal Short-Term Capital Gains Rate (37% max)' :
             'Federal Long-Term Capital Gains Rate (20% max)'}
          </label>
          <Select
            value={federalOrdinaryRate.toString()}
            onValueChange={(value) => setFederalOrdinaryRate(Number(value))}
            disabled={readOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term')}
          >
            <SelectTrigger
              className="hdc-input"
              style={{
                opacity: readOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term') ? 0.6 : 1,
                cursor: readOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term') ? 'not-allowed' : 'pointer'
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FEDERAL_TAX_BRACKETS_2024.map(bracket => (
                <SelectItem key={bracket.value} value={bracket.value.toString()}>
                  {bracket.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* STEP 3: State/Territory Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center'
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
          State Selection
        </h4>

        {/* Property State */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Property State</label>
          <StrategicOzSelector
            selectedState={selectedState}
            handleStateChange={setSelectedState}
            projectLocation={projectLocation}
            setProjectLocation={setProjectLocation}
            federalTaxRate={federalOrdinaryRate}
            stateCapitalGainsRate={stateCapitalGainsRate}
            setStateCapitalGainsRate={setStateCapitalGainsRate}
            readOnly={readOnly}
          />
          <div className="hdc-result-label" style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#666' }}>
            Where project is located. Determines State LIHTC eligibility.
          </div>
        </div>

        {/* Investor State - IMPL-014b */}
        <div className="hdc-input-group" style={{ marginTop: '1rem' }}>
          <label className="hdc-input-label">Investor State</label>
          <Select
            value={investorState || selectedState}
            onValueChange={(value) => setInvestorState?.(value)}
            disabled={readOnly}
          >
            <SelectTrigger className="hdc-input">
              <SelectValue placeholder="Select investor state..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HDC_OZ_STRATEGY)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .map(([code, data]) => (
                  <SelectItem key={code} value={code}>
                    {data.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className="hdc-result-label" style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#666' }}>
            Where investor files taxes. Determines tax rates.
          </div>
        </div>
      </div>

      {/* STEP 4: Effective Tax Rate Calculation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center'
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
        </h4>

        {/* Tax Rate Breakdown */}
        <div style={{
          padding: '0.75rem',
          border: '1px solid var(--hdc-mercury)',
          borderRadius: '4px',
          opacity: 0.9
        }}>
          {/* Federal Rate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: '#666' }}>Federal Rate:</span>
            <span style={{ fontWeight: 500 }}>
              {localInvestorTrack === 'rep' ? `${federalOrdinaryRate}%` :
               localPassiveGainType === 'short-term' ? '37.0%' : '20.0%'}
            </span>
          </div>

          {/* State Rate - uses investor state for tax calculation */}
          {/* IMPL-066: Always display actual state rate - OZ conformity is independent of income tax */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: '#666' }}>State Rate:</span>
            <span style={{ fontWeight: 500 }}>
              {stateOrdinaryRate === 0 ? (
                <span style={{ color: '#999', fontStyle: 'italic' }}>
                  0.0% (No State Income Tax)
                </span>
              ) : (
                `${stateOrdinaryRate.toFixed(1)}%`
              )}
            </span>
          </div>

          {/* NIIT - show for both REP and Non-REP with explanation */}
          {/* IMPL-068: REP investors are exempt from NIIT per IRC §1411 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
            <span style={{ color: '#666' }}>NIIT:</span>
            <span style={{ fontWeight: 500 }}>
              {localInvestorTrack === 'rep' ? (
                <span style={{ color: '#999', fontStyle: 'italic' }}>
                  0.0% (REP Exempt)
                </span>
              ) : (
                doesNIITApply(investorState || selectedState) ? `${NIIT_RATE}%` :
                <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Territory)</span>
              )}
            </span>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--hdc-mercury)', margin: '0.5rem 0' }}></div>

          {/* Effective Rate Total - uses investor state */}
          {/* IMPL-066: Always use actual state rate - OZ conformity doesn't affect income tax */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--hdc-strikemaster)' }}>Total Effective Rate:</span>
            <span className="hdc-value-positive" style={{ color: 'var(--hdc-cabbage-pont)', fontSize: '1.1rem' }}>
              {(() => {
                const effectiveInvestorState = investorState || selectedState;
                if (localInvestorTrack === 'rep') {
                  return effectiveOrdinaryRate.toFixed(1);
                } else {
                  const niitRate = doesNIITApply(effectiveInvestorState) ? NIIT_RATE : 0;

                  if (localPassiveGainType === 'short-term') {
                    return (37 + niitRate + stateOrdinaryRate).toFixed(1);
                  } else {
                    return (20 + niitRate + stateCapitalGainsRate).toFixed(1);
                  }
                }
              })()}%
            </span>
          </div>

          {/* Strategy Summary */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: localInvestorTrack === 'rep' ? '#E8F5E9' : '#E3F2FD',
            borderRadius: '4px',
            fontSize: '0.8rem',
            color: '#424242'
          }}>
            {localInvestorTrack === 'rep' ? (
              <>
                <strong>REP Strategy:</strong> Active losses offset ordinary income.
                {SECTION_461L_LIMIT && (
                  <span style={{ color: 'var(--hdc-brown-rust)', marginLeft: '8px' }}>
                    (§461(l) limit: ${SECTION_461L_LIMIT.toLocaleString()}/yr)
                  </span>
                )}
              </>
            ) : (
              <>
                <strong>Non-REP Strategy:</strong> Passive losses offset {localPassiveGainType} gains.
                <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '8px' }}>
                  Unlimited offset capacity.
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Capital Gains Tax Rates Section */}
      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '1rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem'
        }}>
          Tax Rates for OZ Capital Gains
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="hdc-input-label">Federal Capital Gains Rate</label>
            <Select
              value={federalCapitalGainsRate.toString()}
              onValueChange={(value) => setFederalCapitalGainsRate(Number(value))}
              disabled={readOnly}
            >
              <SelectTrigger className="hdc-input" style={readOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEDERAL_CAPITAL_GAINS_BRACKETS_2024.map(bracket => (
                  <SelectItem key={bracket.value} value={bracket.value.toString()}>
                    {bracket.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="hdc-input-label">State Capital Gains Rate</label>
            <input
              type="number"
              min="0"
              max="15"
              step="0.1"
              value={stateCapitalGainsRate}
              onChange={(e) => setStateCapitalGainsRate(Number(e.target.value))}
              className="hdc-input"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title={selectedState ? `Auto-set from ${CONFORMING_STATES[selectedState]?.name}` : 'Select a state first'}
            />
          </div>
        </div>

        {/* Breakdown of effective capital gains rate */}
        <div style={{ marginTop: '0.75rem' }}>
          <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
            <span className="hdc-result-label">Federal LTCG:</span>
            <span className="hdc-result-value">{federalCapitalGainsRate.toFixed(1)}%</span>
          </div>
          <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
            <span className="hdc-result-label">Net Investment Income Tax (NIIT):</span>
            <span className="hdc-result-value">
              {doesNIITApply(selectedState) ? `${NIIT_RATE}%` : '0.0% (Territory Exempt)'}
            </span>
          </div>
          <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
            <span className="hdc-result-label">State Capital Gains:</span>
            <span className="hdc-result-value">{stateCapitalGainsRate.toFixed(1)}%</span>
          </div>
          <div className="hdc-result-row" style={{ marginTop: '0.75rem' }}>
            <span className="hdc-result-label" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>Combined Rate (Fed + NIIT + State):</span>
            <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
              {effectiveCapitalGainsRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Opportunity Zone Section */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.75rem'
        }}>
          Opportunity Zone Configuration
        </h4>

        <div className="hdc-input-group">
          <label className="hdc-input-label">OZ Type</label>
          <Select
            value={ozType}
            onValueChange={(value) => setOzType(value as 'standard' | 'rural')}
            disabled={readOnly}
          >
            <SelectTrigger className="hdc-input" style={readOnly ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Opportunity Zone (10% step-up)</SelectItem>
              <SelectItem value="rural">Rural OZ / QROF (30% step-up)</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
        </>
      )}
    </div>
  );
};

export default InvestorTaxAndOZSection;