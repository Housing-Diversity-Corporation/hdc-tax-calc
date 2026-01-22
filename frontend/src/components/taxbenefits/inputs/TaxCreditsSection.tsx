import React, { useState, useMemo, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { HDCCheckbox } from './shared/HDCCheckbox';
import { Slider } from '../../ui/slider';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { calculateLIHTCSchedule } from '../../../utils/taxbenefits/lihtcCreditCalculations';
import { calculateLIHTCEligibleBasisBreakdown } from '../../../utils/taxbenefits/depreciableBasisUtility';
import { getStateLIHTCProgram } from '../../../utils/taxbenefits/stateProfiles';
import { calculateStateLIHTC, StateLIHTCCalculationResult } from '../../../utils/taxbenefits/stateLIHTCCalculations';
import { HDC_OZ_STRATEGY } from '../../../utils/taxbenefits/hdcOzStrategy';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface TaxCreditsSectionProps {
  // Federal LIHTC
  lihtcEnabled: boolean;
  setLihtcEnabled: (value: boolean) => void;
  applicableFraction: number;
  setApplicableFraction: (value: number) => void;
  creditRate: number;
  setCreditRate: (value: number) => void;
  placedInServiceMonth: number;
  setPlacedInServiceMonth: (value: number) => void;
  ddaQctBoost: boolean;
  setDdaQctBoost: (value: boolean) => void;
  lihtcEligibleBasis: number;

  // Optional breakdown values (for detailed display)
  projectCost?: number;
  predevelopmentCosts?: number;
  landValue?: number;
  interestReserve?: number;
  leaseUpReserve?: number;
  syndicationCosts?: number;
  marketingCosts?: number;
  commercialSpaceCosts?: number;

  // State LIHTC
  stateLIHTCEnabled: boolean;
  setStateLIHTCEnabled: (value: boolean) => void;
  propertyState: string; // IMPL-014b: from selectedState
  investorState: string; // IMPL-014b: for tax rates
  setInvestorState: (value: string) => void;
  syndicationRate: number;
  setSyndicationRate: (value: number) => void;
  investorHasStateLiability: boolean;
  setInvestorHasStateLiability: (value: boolean) => void;
  stateLIHTCUserPercentage?: number;
  setStateLIHTCUserPercentage?: (value: number) => void;
  stateLIHTCUserAmount?: number;
  setStateLIHTCUserAmount?: (value: number) => void;
  stateLIHTCSyndicationYear?: 0 | 1 | 2; // IMPL-073
  setStateLIHTCSyndicationYear?: (value: 0 | 1 | 2) => void;

  // Formatting
  formatCurrency: (value: number) => string;

  // Read-only mode
  isReadOnly?: boolean;
}

const MONTH_NAMES = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// Format value (in millions) as full dollar amount with commas
const formatFullDollars = (value: number): string => {
  const fullDollars = Math.round(value * 1000000);
  return `$${fullDollars.toLocaleString()}`;
};

const TaxCreditsSection: React.FC<TaxCreditsSectionProps> = ({
  // Federal LIHTC props
  lihtcEnabled,
  setLihtcEnabled,
  applicableFraction,
  setApplicableFraction,
  creditRate,
  setCreditRate,
  placedInServiceMonth,
  setPlacedInServiceMonth,
  ddaQctBoost,
  setDdaQctBoost,
  lihtcEligibleBasis,
  projectCost,
  predevelopmentCosts = 0,
  landValue,
  interestReserve = 0,
  leaseUpReserve = 0,
  syndicationCosts = 0,
  marketingCosts = 0,
  commercialSpaceCosts = 0,
  // State LIHTC props
  stateLIHTCEnabled,
  setStateLIHTCEnabled,
  propertyState,
  investorState,
  setInvestorState,
  syndicationRate,
  setSyndicationRate,
  investorHasStateLiability,
  setInvestorHasStateLiability,
  stateLIHTCUserPercentage,
  setStateLIHTCUserPercentage,
  stateLIHTCUserAmount,
  setStateLIHTCUserAmount,
  stateLIHTCSyndicationYear,
  setStateLIHTCSyndicationYear,
  // Common
  formatCurrency,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // ========== Federal LIHTC Logic ==========

  // Calculate breakdown if we have the required values
  const basisBreakdown = useMemo(() => {
    if (projectCost === undefined || landValue === undefined) return null;

    return calculateLIHTCEligibleBasisBreakdown({
      projectCost,
      predevelopmentCosts,
      landValue,
      interestReserve,
      leaseUpReserve,
      syndicationCosts,
      marketingCosts,
      commercialSpaceCosts,
    });
  }, [projectCost, predevelopmentCosts, landValue, interestReserve, leaseUpReserve, syndicationCosts, marketingCosts, commercialSpaceCosts]);

  // Calculate Federal LIHTC preview if enabled
  const federalPreview = useMemo(() => {
    if (!lihtcEnabled || lihtcEligibleBasis <= 0) return null;

    try {
      const result = calculateLIHTCSchedule({
        eligibleBasis: lihtcEligibleBasis,
        applicableFraction: applicableFraction / 100,
        ddaQctBoost,
        pisMonth: placedInServiceMonth,
        creditRate,
      });

      return {
        annualCredit: result.annualCredit,
        year1Credit: result.year1Credit,
        totalCredits: result.totalCredits,
      };
    } catch {
      return null;
    }
  }, [lihtcEnabled, lihtcEligibleBasis, applicableFraction, ddaQctBoost, placedInServiceMonth, creditRate]);

  // ========== State LIHTC Logic ==========

  // Get program metadata for property state
  const stateProgram = getStateLIHTCProgram(propertyState);

  // IMPL-035: Auto-set syndication rate based on in-state vs out-of-state investor
  // No longer auto-populates investorState from propertyState - states are independent
  useEffect(() => {
    if (!stateLIHTCEnabled || !propertyState || !investorState) return;

    if (investorState === propertyState) {
      // In-state investor gets 100% syndication
      if (syndicationRate !== 100) {
        setSyndicationRate(100);
      }
    } else {
      // Out-of-state: use default 75% (user can adjust)
      if (syndicationRate === 100) {
        setSyndicationRate(75);
      }
    }
  }, [stateLIHTCEnabled, propertyState, investorState]);

  // Determine if user inputs are needed for state LIHTC
  const needsUserInputs = stateProgram && (stateProgram.type === 'supplement' || stateProgram.type === 'standalone');

  // Calculate State LIHTC preview
  const [stateCalculatedResult, setStateCalculatedResult] = useState<StateLIHTCCalculationResult | null>(null);

  useEffect(() => {
    if (!stateLIHTCEnabled || !stateProgram || !federalPreview?.annualCredit) {
      setStateCalculatedResult(null);
      return;
    }

    try {
      const result = calculateStateLIHTC({
        federalAnnualCredit: federalPreview.annualCredit,
        propertyState,
        investorState: investorState || '',
        pisMonth: placedInServiceMonth,
        syndicationRateOverride: syndicationRate,
        investorHasStateLiability,
        userPercentage: stateLIHTCUserPercentage,
        userAmount: stateLIHTCUserAmount,
      });

      setStateCalculatedResult(result);
    } catch {
      setStateCalculatedResult(null);
    }
  }, [stateLIHTCEnabled, stateProgram, federalPreview?.annualCredit, propertyState, investorState, placedInServiceMonth, syndicationRate, investorHasStateLiability, stateLIHTCUserPercentage, stateLIHTCUserAmount]);

  // Calculate cumulative credits for schedule display
  const scheduleWithCumulative = useMemo(() => {
    if (!stateCalculatedResult?.schedule?.yearlyBreakdown) return [];

    let cumulative = 0;
    return stateCalculatedResult.schedule.yearlyBreakdown.map((year) => {
      cumulative += year.creditAmount;
      return {
        ...year,
        cumulativeCredits: cumulative,
      };
    });
  }, [stateCalculatedResult]);

  return (
    <div className="hdc-calculator">
      <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-faded-jade)' }}>
        <h3
          className="hdc-section-header"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.625rem',
            paddingBottom: '0.375rem',
            borderBottom: '2px solid var(--hdc-faded-jade)',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
          3. Tax Credits
        </h3>

        {isExpanded && (
          <>
            {/* ========== FEDERAL LIHTC SUBSECTION ========== */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem',
              }}>
                Federal LIHTC
              </h4>

              {/* Enable Toggle */}
              <div style={{ marginBottom: '1rem' }}>
                <HDCCheckbox
                  checked={lihtcEnabled}
                  onCheckedChange={(checked) => setLihtcEnabled(checked as boolean)}
                  label="Enable Federal LIHTC Calculations"
                  disabled={isReadOnly}
                />
              </div>

              {lihtcEnabled && (
                <>
                  {/* Eligible Basis Display */}
                  <div className="hdc-input-group">
                    <label className="hdc-input-label">LIHTC Eligible Basis (per IRC S42)</label>
                    <div
                      className="hdc-input"
                      style={{
                        backgroundColor: 'var(--hdc-alabaster)',
                        cursor: 'default',
                        color: 'var(--hdc-cabbage-pont)',
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(lihtcEligibleBasis / 1000000)}
                    </div>
                    <span className="text-xs text-gray-500" style={{ marginTop: '0.25rem', display: 'block' }}>
                      Project cost less land, reserves, syndication, marketing, commercial
                    </span>

                    {/* Collapsible Basis Breakdown */}
                    {basisBreakdown && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: 'var(--hdc-faded-jade)' }}>
                          View Basis Breakdown
                        </summary>
                        <div style={{ marginTop: '0.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--hdc-mercury)' }}>
                          <div className="hdc-result-row" style={{ fontSize: '0.8rem' }}>
                            <span className="hdc-result-label">Project Cost:</span>
                            <span className="hdc-result-value">{formatCurrency(basisBreakdown.totalProjectCost / 1000000)}</span>
                          </div>

                          {basisBreakdown.landValue > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Land Value</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.landValue / 1000000)})</span>
                            </div>
                          )}
                          {basisBreakdown.interestReserve > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Interest Reserve</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.interestReserve / 1000000)})</span>
                            </div>
                          )}
                          {basisBreakdown.leaseUpReserve > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Lease-up Reserve</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.leaseUpReserve / 1000000)})</span>
                            </div>
                          )}
                          {basisBreakdown.syndicationCosts > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Syndication Costs</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.syndicationCosts / 1000000)})</span>
                            </div>
                          )}
                          {basisBreakdown.marketingCosts > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Marketing Costs</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.marketingCosts / 1000000)})</span>
                            </div>
                          )}
                          {basisBreakdown.commercialSpaceCosts > 0 && (
                            <div className="hdc-result-row" style={{ fontSize: '0.8rem', color: 'var(--hdc-brown-rust)' }}>
                              <span className="hdc-result-label">Less: Commercial Space</span>
                              <span className="hdc-result-value">({formatCurrency(basisBreakdown.commercialSpaceCosts / 1000000)})</span>
                            </div>
                          )}

                          <div className="hdc-result-row summary" style={{ fontSize: '0.8rem', marginTop: '0.25rem', borderTop: '1px solid var(--hdc-mercury)', paddingTop: '0.25rem' }}>
                            <span className="hdc-result-label" style={{ fontWeight: 600 }}>= LIHTC Eligible Basis:</span>
                            <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                              {formatCurrency(basisBreakdown.eligibleBasis / 1000000)}
                            </span>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Applicable Fraction */}
                  <div className="hdc-input-group">
                    <label className="hdc-input-label">Applicable Fraction (%)</label>
                    <Slider
                      disabled={isReadOnly}
                      min={40}
                      max={100}
                      step={5}
                      value={[applicableFraction]}
                      onValueChange={(vals) => setApplicableFraction(vals[0])}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                      <span>{applicableFraction}% Qualified Units</span>
                    </div>
                  </div>

                  {/* Credit Rate Dropdown */}
                  <div className="hdc-input-group">
                    <label className="hdc-input-label">Credit Rate</label>
                    <Select
                      value={creditRate.toString()}
                      onValueChange={(val) => setCreditRate(parseFloat(val))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.04">4% Credit (Acquisition/Rehab)</SelectItem>
                        <SelectItem value="0.09">9% Credit (New Construction)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PIS Month Dropdown */}
                  <div className="hdc-input-group">
                    <label className="hdc-input-label">Placed-in-Service Month</label>
                    <Select
                      value={placedInServiceMonth.toString()}
                      onValueChange={(val) => setPlacedInServiceMonth(parseInt(val))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* DDA/QCT Boost Toggle */}
                  <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
                    <HDCCheckbox
                      checked={ddaQctBoost}
                      onCheckedChange={(checked) => setDdaQctBoost(checked as boolean)}
                      label="DDA/QCT 130% Basis Boost"
                      disabled={isReadOnly}
                    />
                    <span className="text-xs text-gray-500" style={{ marginLeft: '1.5rem', display: 'block', marginTop: '0.25rem' }}>
                      Difficult Development Area or Qualified Census Tract
                    </span>
                  </div>

                  {/* Federal LIHTC Preview */}
                  {federalPreview && (
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        border: '1px solid var(--hdc-mercury)',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(127, 189, 69, 0.05)',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--hdc-faded-jade)',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Estimated Federal LIHTC
                      </h4>

                      <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Annual Credit:</span>
                        <span className="hdc-result-value">{formatFullDollars(federalPreview.annualCredit)}</span>
                      </div>
                      <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Year 1 Credit (Prorated):</span>
                        <span className="hdc-result-value">{formatFullDollars(federalPreview.year1Credit)}</span>
                      </div>
                      <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Total 10-Year Credits:</span>
                        <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                          {formatFullDollars(federalPreview.totalCredits)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ========== STATE LIHTC SUBSECTION ========== */}
            <div style={{ borderTop: '1px solid var(--hdc-mercury)', paddingTop: '1rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem',
              }}>
                State LIHTC
              </h4>

              {/* Enable Toggle */}
              <div className="flex items-center space-x-2" style={{ marginBottom: '1rem' }}>
                <Checkbox
                  id="stateLIHTCEnabled"
                  checked={stateLIHTCEnabled}
                  onCheckedChange={(checked) => setStateLIHTCEnabled(checked as boolean)}
                  className="h-4 w-4"
                  disabled={isReadOnly}
                />
                <Label
                  htmlFor="stateLIHTCEnabled"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Enable State LIHTC Calculations
                </Label>
              </div>

              {stateLIHTCEnabled && (
                <>
                  {/* Program Info */}
                  {stateProgram ? (
                    <div style={{
                      padding: '0.75rem',
                      border: '1px solid var(--hdc-mercury)',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      background: 'rgba(127, 189, 69, 0.05)'
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--hdc-faded-jade)' }}>
                        {stateProgram.program || `${propertyState} State LIHTC`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        Type: {stateProgram.type ? stateProgram.type.charAt(0).toUpperCase() + stateProgram.type.slice(1) : 'N/A'} &bull;
                        Transferability: {stateProgram.transferability.charAt(0).toUpperCase() + stateProgram.transferability.slice(1)}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.75rem',
                      border: '1px solid var(--hdc-brown-rust)',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      background: 'rgba(255, 200, 100, 0.1)',
                      fontSize: '0.875rem'
                    }}>
                      <strong>Note:</strong> No state LIHTC program available for {propertyState}
                    </div>
                  )}

                  {/* ISS-017: Display investor state from Panel 5 (read-only) with eligibility status */}
                  <div className="hdc-input-group">
                    <label className="hdc-input-label">
                      Investor State Eligibility
                      <span style={{ fontSize: '0.7rem', color: '#666', display: 'block', fontWeight: 'normal' }}>
                        Set in Panel 5 (Investor Profile)
                      </span>
                    </label>
                    <div
                      className="hdc-input"
                      style={{
                        backgroundColor: 'var(--hdc-alabaster)',
                        cursor: 'default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>{investorState ? (HDC_OZ_STRATEGY[investorState]?.name || investorState) : 'Not set'}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        backgroundColor: investorState === propertyState ? 'rgba(127, 189, 69, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                        color: investorState === propertyState ? 'var(--hdc-cabbage-pont)' : '#b86e00',
                      }}>
                        {investorState === propertyState ? 'In-State (100%)' : 'Out-of-State'}
                      </span>
                    </div>
                  </div>

                  {/* Syndication Rate */}
                  <div className="hdc-input-group">
                    <label htmlFor="syndicationRate" className="hdc-input-label">Syndication Rate (%)</label>
                    <input
                      id="syndicationRate"
                      type="number"
                      value={syndicationRate}
                      onChange={(e) => setSyndicationRate(Number(e.target.value))}
                      min={60}
                      max={100}
                      step={1}
                      className="hdc-input"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* IMPL-073: Syndication Year (only for out-of-state syndicated path) */}
                  {investorState !== propertyState && syndicationRate < 100 && (
                    <div className="hdc-input-group">
                      <label htmlFor="syndicationYear" className="hdc-input-label">
                        Syndication Proceeds Year
                        <span style={{ fontSize: '0.65rem', color: '#666', display: 'block', fontWeight: 'normal', marginTop: '2px' }}>
                          Year cash is received from credit sale
                        </span>
                      </label>
                      <Select
                        value={String(stateLIHTCSyndicationYear ?? 1)}
                        onValueChange={(val) => setStateLIHTCSyndicationYear?.(parseInt(val) as 0 | 1 | 2)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="hdc-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">At Close (Year 0)</SelectItem>
                          <SelectItem value="1">Year 1 (Default)</SelectItem>
                          <SelectItem value="2">Year 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Has State Liability */}
                  <div className="flex items-center space-x-2" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                    <Checkbox
                      id="investorHasStateLiability"
                      checked={investorHasStateLiability}
                      onCheckedChange={(checked) => setInvestorHasStateLiability(checked as boolean)}
                      className="h-4 w-4"
                      disabled={isReadOnly}
                    />
                    <Label
                      htmlFor="investorHasStateLiability"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Investor Has State Tax Liability
                    </Label>
                  </div>

                  {/* Conditional User Inputs for supplement/standalone types */}
                  {needsUserInputs && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <div className="hdc-input-group">
                        <label htmlFor="creditPercentage" className="hdc-input-label">Credit Percentage (%)</label>
                        <input
                          id="creditPercentage"
                          type="number"
                          value={stateLIHTCUserPercentage ?? ''}
                          onChange={(e) => setStateLIHTCUserPercentage?.(Number(e.target.value))}
                          min={0}
                          max={100}
                          step={0.1}
                          className="hdc-input"
                          placeholder="Optional"
                          disabled={isReadOnly}
                        />
                      </div>

                      <div className="hdc-input-group">
                        <label htmlFor="creditAmount" className="hdc-input-label">Credit Amount ($)</label>
                        <input
                          id="creditAmount"
                          type="number"
                          value={stateLIHTCUserAmount ?? ''}
                          onChange={(e) => setStateLIHTCUserAmount?.(Number(e.target.value))}
                          min={0}
                          step={1000}
                          className="hdc-input"
                          placeholder="Optional"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  )}

                  {/* State LIHTC Preview */}
                  {stateCalculatedResult && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      border: '1px solid var(--hdc-mercury)',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(127, 189, 69, 0.05)',
                    }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--hdc-faded-jade)',
                        marginBottom: '0.5rem',
                      }}>
                        Estimated State LIHTC
                      </h4>

                      <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Year 1 Credit (Prorated):</span>
                        <span className="hdc-result-value">{formatCurrency(stateCalculatedResult.schedule.year1Credit)}</span>
                      </div>
                      <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Annual Credit (Years 2-10):</span>
                        <span className="hdc-result-value">{formatCurrency(stateCalculatedResult.schedule.annualCredit)}</span>
                      </div>
                      <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Year 11 Catch-Up:</span>
                        <span className="hdc-result-value">{formatCurrency(stateCalculatedResult.schedule.year11Credit)}</span>
                      </div>
                      <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Total 10-Year Gross Credits:</span>
                        <span className="hdc-result-value">{formatCurrency(stateCalculatedResult.grossCredit)}</span>
                      </div>
                      <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                        <span className="hdc-result-label">Net Benefit (After Syndication):</span>
                        <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                          {formatCurrency(stateCalculatedResult.netBenefit)}
                        </span>
                      </div>

                      {/* Expandable Year-by-Year Schedule */}
                      {scheduleWithCumulative.length > 0 && (
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', color: 'var(--hdc-faded-jade)' }}>
                            View Credit Schedule
                          </summary>
                          <table style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--hdc-mercury)', textAlign: 'left' }}>
                                <th style={{ padding: '0.25rem' }}>Year</th>
                                <th style={{ padding: '0.25rem', textAlign: 'right' }}>Credit</th>
                                <th style={{ padding: '0.25rem', textAlign: 'right' }}>Cumulative</th>
                              </tr>
                            </thead>
                            <tbody>
                              {scheduleWithCumulative.map((year) => (
                                <tr key={year.year} style={{ borderBottom: '1px solid var(--hdc-alabaster)' }}>
                                  <td style={{ padding: '0.25rem' }}>Year {year.year}</td>
                                  <td style={{ padding: '0.25rem', textAlign: 'right' }}>{formatCurrency(year.creditAmount)}</td>
                                  <td style={{ padding: '0.25rem', textAlign: 'right' }}>{formatCurrency(year.cumulativeCredits)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </details>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaxCreditsSection;
