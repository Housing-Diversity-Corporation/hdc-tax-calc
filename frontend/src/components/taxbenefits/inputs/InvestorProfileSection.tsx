import React, { useState, useEffect } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { CONFORMING_STATES, FEDERAL_TAX_BRACKETS_2024, FEDERAL_CAPITAL_GAINS_BRACKETS_2024 } from '../../../utils/taxbenefits/constants';
import { doesNIITApply } from '../../../utils/taxbenefits/stateData';
import { HDC_OZ_STRATEGY } from '../../../utils/taxbenefits/hdcOzStrategy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import StrategicOzSelector from './StrategicOzSelector';

type InvestorTrack = 'rep' | 'non-rep';
type PassiveGainType = 'short-term' | 'long-term';

interface InvestorProfileSectionProps {
  // IMPL-014b: Investor State (where investor files taxes)
  investorState: string;
  setInvestorState: (value: string) => void;

  // Tax Rates
  federalOrdinaryRate: number;
  setFederalOrdinaryRate: (value: number) => void;
  stateOrdinaryRate: number;
  setStateOrdinaryRate: (value: number) => void;
  federalCapitalGainsRate: number;
  setFederalCapitalGainsRate: (value: number) => void;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (value: number) => void;

  // Calculated rates (for OZ calculations)
  capitalGainsTaxRate: number;
  setCapitalGainsTaxRate: (value: number) => void;

  // Investor Track
  investorTrack: InvestorTrack;
  setInvestorTrack: (value: InvestorTrack) => void;

  // Passive Gain Type (for Non-REPs)
  passiveGainType: PassiveGainType;
  setPassiveGainType: (value: PassiveGainType) => void;

  // Annual Income and Filing Status
  annualIncome: number;
  setAnnualIncome: (value: number) => void;
  filingStatus: 'single' | 'married';
  setFilingStatus: (value: 'single' | 'married') => void;

  // Income Composition (Phase A2 - Tax Utilization)
  annualOrdinaryIncome?: number;
  setAnnualOrdinaryIncome?: (value: number) => void;
  annualPassiveIncome?: number;
  setAnnualPassiveIncome?: (value: number) => void;
  annualPortfolioIncome?: number;
  setAnnualPortfolioIncome?: (value: number) => void;
  groupingElection?: boolean;
  setGroupingElection?: (value: boolean) => void;
  incomeFieldsEditable?: boolean;  // Allow editing even when taxSectionReadOnly

  // Read-only mode
  isReadOnly?: boolean;
}

// Constants
const NIIT_RATE = 3.8; // Net Investment Income Tax for high earners
const SECTION_461L_LIMIT = 626000; // Annual limitation for REPs against W-2 income

const InvestorProfileSection: React.FC<InvestorProfileSectionProps> = ({
  investorState,
  setInvestorState,
  federalOrdinaryRate,
  setFederalOrdinaryRate,
  stateOrdinaryRate,
  setStateOrdinaryRate,
  federalCapitalGainsRate,
  setFederalCapitalGainsRate,
  stateCapitalGainsRate,
  setStateCapitalGainsRate,
  capitalGainsTaxRate,
  setCapitalGainsTaxRate,
  investorTrack,
  setInvestorTrack,
  passiveGainType,
  setPassiveGainType,
  annualIncome,
  setAnnualIncome,
  filingStatus,
  setFilingStatus,
  annualOrdinaryIncome = 750000,
  setAnnualOrdinaryIncome,
  annualPassiveIncome = 0,
  setAnnualPassiveIncome,
  annualPortfolioIncome = 0,
  setAnnualPortfolioIncome,
  groupingElection = false,
  setGroupingElection,
  incomeFieldsEditable = false,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localInvestorTrack, setLocalInvestorTrack] = useState<InvestorTrack>(investorTrack);
  const [localPassiveGainType, setLocalPassiveGainType] = useState<PassiveGainType>(passiveGainType);

  // Sync local state with props when they change
  useEffect(() => {
    if (passiveGainType && passiveGainType !== localPassiveGainType) {
      setLocalPassiveGainType(passiveGainType);
    }
  }, [passiveGainType]);

  useEffect(() => {
    if (investorTrack && investorTrack !== localInvestorTrack) {
      setLocalInvestorTrack(investorTrack);
    }
  }, [investorTrack]);

  // Handle investor track change
  const handleInvestorTrackChange = (track: InvestorTrack) => {
    setLocalInvestorTrack(track);
    setInvestorTrack(track);

    // Auto-populate tax rates based on track
    if (track === 'rep') {
      // REPs: Active losses offset ordinary income
      setFederalOrdinaryRate(37); // Top bracket for offsetting W-2 income
      setFederalCapitalGainsRate(20); // For OZ exit gains
    } else {
      // Non-REPs: Passive losses offset passive gains
      if (localPassiveGainType === 'short-term') {
        setFederalOrdinaryRate(37); // Short-term gains taxed as ordinary
        setFederalCapitalGainsRate(20);
      } else {
        setFederalOrdinaryRate(20); // This represents the LTCG rate being offset
        setFederalCapitalGainsRate(20);
      }
    }
  };

  // Handle passive gain type change (for Non-REPs)
  const handlePassiveGainTypeChange = (type: PassiveGainType) => {
    setLocalPassiveGainType(type);
    setPassiveGainType(type);

    // Auto-update tax rates based on passive gain type
    if (localInvestorTrack === 'non-rep') {
      if (type === 'short-term') {
        setFederalOrdinaryRate(37); // Top bracket for ST gains
      } else {
        setFederalCapitalGainsRate(20);
        setFederalOrdinaryRate(20); // This represents the rate being offset
      }
    }
  };

  // Auto-update state rates when investor state changes
  // IMPL-053: Use HDC_OZ_STRATEGY (derived from STATE_TAX_PROFILES) as single source of truth
  useEffect(() => {
    if (investorState && HDC_OZ_STRATEGY[investorState]) {
      const stateInfo = HDC_OZ_STRATEGY[investorState];
      setStateOrdinaryRate(stateInfo.rate);
      setStateCapitalGainsRate(stateInfo.rate); // Most states tax cap gains as ordinary income
    } else if (investorState === 'NONE' || investorState === '') {
      setStateOrdinaryRate(0);
      setStateCapitalGainsRate(0);
    }
  }, [investorState, setStateOrdinaryRate, setStateCapitalGainsRate]);

  // Calculate effective capital gains tax rate for OZ calculations
  useEffect(() => {
    const isNonConforming = investorState && HDC_OZ_STRATEGY[investorState]?.status === 'NO_GO';
    const niitRate = doesNIITApply(investorState) ? NIIT_RATE : 0;
    setCapitalGainsTaxRate(federalCapitalGainsRate + niitRate + (isNonConforming ? 0 : stateCapitalGainsRate));
  }, [investorState, federalCapitalGainsRate, stateCapitalGainsRate, setCapitalGainsTaxRate]);

  // Calculate effective rates
  // IMPL-066: OZ conformity affects OZ benefits, not ordinary income tax rate
  // isNonConforming is still used for OZ-related capital gains calculations below
  const isNonConforming = investorState && HDC_OZ_STRATEGY[investorState]?.status === 'NO_GO';
  const effectiveOrdinaryRate = federalOrdinaryRate + stateOrdinaryRate; // IMPL-066: Always include state rate
  const effectiveCapitalGainsRate = capitalGainsTaxRate;

  return (
    <div className="hdc-calculator">
      <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-strikemaster)' }}>
        <h3
          className="hdc-section-header"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.625rem',
            paddingBottom: '0.375rem',
            borderBottom: '2px solid var(--hdc-strikemaster)',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
          6. Investor Profile
        </h3>

        {isExpanded && (
          <>
            {/* Investor State - IMPL-035: StrategicOzSelector shows OZ conformity info */}
            <StrategicOzSelector
              selectedState={investorState}
              handleStateChange={setInvestorState}
              federalTaxRate={federalCapitalGainsRate}
              stateCapitalGainsRate={stateCapitalGainsRate}
              setStateCapitalGainsRate={setStateCapitalGainsRate}
              readOnly={isReadOnly}
            />

            {/* Investor Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <div className="hdc-input-group">
                <label className="hdc-input-label">Gross Annual Income ($)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(Number(e.target.value))}
                  className="hdc-input"
                  placeholder="Enter annual income"
                  disabled={isReadOnly}
                  style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
              </div>

              <div className="hdc-input-group">
                <label className="hdc-input-label">Filing Status</label>
                <Select
                  value={filingStatus}
                  onValueChange={(value) => setFilingStatus(value as 'single' | 'married')}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="hdc-input" style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Income Composition (Phase A2 - Tax Utilization) */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '1rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem',
              }}>
                Income Composition (Tax Utilization)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Ordinary Income ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={annualOrdinaryIncome}
                    onChange={(e) => setAnnualOrdinaryIncome?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="W-2, active business"
                    disabled={isReadOnly && !incomeFieldsEditable}
                    style={(isReadOnly && !incomeFieldsEditable) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                    W-2, active business, board fees
                  </span>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">Passive Income ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={annualPassiveIncome}
                    onChange={(e) => setAnnualPassiveIncome?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="K-1 from funds"
                    disabled={isReadOnly && !incomeFieldsEditable}
                    style={(isReadOnly && !incomeFieldsEditable) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                    K-1 from funds, rental income
                  </span>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">Portfolio Income ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={annualPortfolioIncome}
                    onChange={(e) => setAnnualPortfolioIncome?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="Stock/crypto gains"
                    disabled={isReadOnly && !incomeFieldsEditable}
                    style={(isReadOnly && !incomeFieldsEditable) ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                    Stock/crypto gains, dividends
                  </span>
                </div>
              </div>

              {/* Grouping Election - REP only */}
              {localInvestorTrack === 'rep' && (
                <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: (isReadOnly && !incomeFieldsEditable) ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={groupingElection}
                      onChange={(e) => setGroupingElection?.(e.target.checked)}
                      disabled={isReadOnly && !incomeFieldsEditable}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span className="hdc-input-label" style={{ marginBottom: 0 }}>§469(c)(7)(A)(ii) Grouping Election</span>
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem', marginLeft: '24px' }}>
                    Treat all rental activities as a single activity
                  </span>
                </div>
              )}
            </div>

            {/* Investor Type */}
            <div className="hdc-input-group" style={{ marginTop: '1rem' }}>
              <label className="hdc-input-label">Investor Type</label>
              <Select
                value={localInvestorTrack}
                onValueChange={(value) => handleInvestorTrackChange(value as InvestorTrack)}
                disabled={isReadOnly}
              >
                <SelectTrigger
                  className="hdc-input"
                  style={{
                    fontWeight: 500,
                    ...(isReadOnly ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {})
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
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="hdc-input" style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-Term Passive Gains</SelectItem>
                    <SelectItem value="long-term">Long-Term Passive Gains</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Federal Tax Rate */}
            <div className="hdc-input-group" style={{ marginTop: '1rem' }}>
              <label className="hdc-input-label">
                {localInvestorTrack === 'rep' ? 'Federal Ordinary Income Rate' :
                 localPassiveGainType === 'short-term' ? 'Federal Short-Term Capital Gains Rate (37% max)' :
                 'Federal Long-Term Capital Gains Rate (20% max)'}
              </label>
              <Select
                value={federalOrdinaryRate.toString()}
                onValueChange={(value) => setFederalOrdinaryRate(Number(value))}
                disabled={isReadOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term')}
              >
                <SelectTrigger
                  className="hdc-input"
                  style={{
                    opacity: isReadOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term') ? 0.6 : 1,
                    cursor: isReadOnly || (localInvestorTrack === 'non-rep' && localPassiveGainType === 'short-term') ? 'not-allowed' : 'pointer'
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

            {/* Effective Tax Rate Calculation */}
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem',
              }}>
                Effective Tax Rate Calculation
              </h4>

              <div style={{
                padding: '0.75rem',
                border: '1px solid var(--hdc-mercury)',
                borderRadius: '4px',
              }}>
                {/* Federal Rate */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem' }}>
                  <span style={{ color: '#666' }}>Federal Rate:</span>
                  <span style={{ fontWeight: 500 }}>
                    {localInvestorTrack === 'rep' ? `${federalOrdinaryRate}%` :
                     localPassiveGainType === 'short-term' ? '37.0%' : '20.0%'}
                  </span>
                </div>

                {/* State Rate */}
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
                      doesNIITApply(investorState) ? `${NIIT_RATE}%` :
                      <span style={{ color: '#999', fontStyle: 'italic' }}>0.0% (Territory)</span>
                    )}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--hdc-mercury)', margin: '0.5rem 0' }}></div>

                {/* Effective Rate Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--hdc-strikemaster)' }}>Total Effective Rate:</span>
                  <span style={{ color: 'var(--hdc-cabbage-pont)', fontSize: '1.1rem' }}>
                    {(() => {
                      if (localInvestorTrack === 'rep') {
                        return effectiveOrdinaryRate.toFixed(1);
                      } else {
                        const niitRate = doesNIITApply(investorState) ? NIIT_RATE : 0;

                        if (localPassiveGainType === 'short-term') {
                          return (37 + niitRate + (isNonConforming ? 0 : stateOrdinaryRate)).toFixed(1);
                        } else {
                          return (20 + niitRate + (isNonConforming ? 0 : stateCapitalGainsRate)).toFixed(1);
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
                      <span style={{ color: 'var(--hdc-brown-rust)', marginLeft: '8px' }}>
                        (S461(l) limit: ${SECTION_461L_LIMIT.toLocaleString()}/yr)
                      </span>
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

            {/* Capital Gains Tax Rates for OZ */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '1rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem'
              }}>
                Capital Gains Rates (for OZ Exit)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="hdc-input-label">Federal Capital Gains Rate</label>
                  <Select
                    value={federalCapitalGainsRate.toString()}
                    onValueChange={(value) => setFederalCapitalGainsRate(Number(value))}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="hdc-input" style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
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
                    title={investorState ? `Auto-set from ${CONFORMING_STATES[investorState]?.name || investorState}` : 'Select a state first'}
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
                  <span className="hdc-result-label">NIIT:</span>
                  <span className="hdc-result-value">
                    {doesNIITApply(investorState) ? `${NIIT_RATE}%` : '0.0% (Exempt)'}
                  </span>
                </div>
                <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                  <span className="hdc-result-label">State Capital Gains:</span>
                  <span className="hdc-result-value">
                    {isNonConforming ? '0.0% (Non-conforming)' : `${stateCapitalGainsRate.toFixed(1)}%`}
                  </span>
                </div>
                <div className="hdc-result-row" style={{ marginTop: '0.75rem' }}>
                  <span className="hdc-result-label" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                    Combined OZ Exit Rate:
                  </span>
                  <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                    {effectiveCapitalGainsRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvestorProfileSection;
