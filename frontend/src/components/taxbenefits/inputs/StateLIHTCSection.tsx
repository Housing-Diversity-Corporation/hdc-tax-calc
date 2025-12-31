/**
 * @deprecated IMPL-015: This component has been consolidated into TaxCreditsSection.tsx
 * State LIHTC is now Panel 3 subsection in TaxCreditsSection.
 * Keep for backward compatibility but do not use in new code.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { getStateLIHTCProgram } from '../../../utils/taxbenefits/stateProfiles';
import { calculateStateLIHTC, StateLIHTCCalculationResult } from '../../../utils/taxbenefits/stateLIHTCCalculations';
import { HDC_OZ_STRATEGY } from '../../../utils/taxbenefits/hdcOzStrategy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface StateLIHTCSectionProps {
  // Enable toggle
  stateLIHTCEnabled: boolean;
  onStateLIHTCEnabledChange: (value: boolean) => void;

  // Auto-populated from property state
  propertyState: string; // 2-letter code from existing selector

  // User inputs
  investorState: string;
  onInvestorStateChange: (value: string) => void;

  syndicationRate: number;
  onSyndicationRateChange: (value: number) => void;

  investorHasStateLiability: boolean;
  onInvestorHasStateLiabilityChange: (value: boolean) => void;

  // For supplement/standalone types only
  stateLIHTCUserPercentage?: number;
  onStateLIHTCUserPercentageChange?: (value: number) => void;

  stateLIHTCUserAmount?: number;
  onStateLIHTCUserAmountChange?: (value: number) => void;

  // For calculated preview
  federalAnnualCredit: number; // From existing federal LIHTC calc

  // Formatting helper
  formatCurrency: (value: number) => string;
}

export const StateLIHTCSection: React.FC<StateLIHTCSectionProps> = ({
  stateLIHTCEnabled,
  onStateLIHTCEnabledChange,
  propertyState,
  investorState,
  onInvestorStateChange,
  syndicationRate,
  onSyndicationRateChange,
  investorHasStateLiability,
  onInvestorHasStateLiabilityChange,
  stateLIHTCUserPercentage,
  onStateLIHTCUserPercentageChange,
  stateLIHTCUserAmount,
  onStateLIHTCUserAmountChange,
  federalAnnualCredit,
  formatCurrency,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get program metadata for property state
  const program = getStateLIHTCProgram(propertyState);

  // Get all jurisdictions sorted alphabetically
  const sortedJurisdictions = useMemo(() => {
    return Object.entries(HDC_OZ_STRATEGY)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([code, data]) => ({ code, name: data.name }));
  }, []);

  // IMPL-014b: Auto-set syndication rate based on in-state vs out-of-state investor
  useEffect(() => {
    if (!stateLIHTCEnabled || !propertyState) return;

    const effectiveInvestorState = investorState || propertyState;

    if (effectiveInvestorState === propertyState) {
      // In-state investor gets 100% syndication
      if (syndicationRate !== 100) {
        onSyndicationRateChange(100);
      }
    } else {
      // Out-of-state: use default 75% (user can adjust)
      if (syndicationRate === 100) {
        onSyndicationRateChange(75);
      }
    }
  }, [stateLIHTCEnabled, propertyState, investorState]);

  // Auto-populate investor state when property state changes (default to same state)
  useEffect(() => {
    if (stateLIHTCEnabled && !investorState && propertyState) {
      onInvestorStateChange(propertyState);
    }
  }, [stateLIHTCEnabled, propertyState]);

  // Determine if user inputs are needed
  const needsUserInputs = program && (program.type === 'supplement' || program.type === 'standalone');

  // Calculate preview if enabled and inputs valid
  const [calculatedResult, setCalculatedResult] = useState<StateLIHTCCalculationResult | null>(null);

  useEffect(() => {
    if (!stateLIHTCEnabled || !program || federalAnnualCredit === 0) {
      setCalculatedResult(null);
      return;
    }

    try {
      const result = calculateStateLIHTC({
        federalAnnualCredit,
        propertyState,
        investorState: investorState || propertyState,
        pisMonth: 1, // Default
        syndicationRateOverride: syndicationRate,
        investorHasStateLiability,
        userPercentage: stateLIHTCUserPercentage,
        userAmount: stateLIHTCUserAmount,
      });

      setCalculatedResult(result);
    } catch (error) {
      setCalculatedResult(null);
    }
  }, [stateLIHTCEnabled, program, federalAnnualCredit, propertyState, investorState, syndicationRate, investorHasStateLiability, stateLIHTCUserPercentage, stateLIHTCUserAmount]);

  // Calculate cumulative credits for schedule display
  const scheduleWithCumulative = useMemo(() => {
    if (!calculatedResult?.schedule?.yearlyBreakdown) return [];

    let cumulative = 0;
    return calculatedResult.schedule.yearlyBreakdown.map((year) => {
      cumulative += year.creditAmount;
      return {
        ...year,
        cumulativeCredits: cumulative,
      };
    });
  }, [calculatedResult]);

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
          State LIHTC Credits (Optional)
        </h3>
      </div>

      {isExpanded && (
        <>
          {/* STEP 5: Enable State LIHTC */}
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
              }}>5</span>
              State LIHTC Configuration
            </h4>

            {/* Enable Toggle */}
            <div className="flex items-center space-x-2" style={{ marginBottom: '1rem' }}>
              <Checkbox
                id="stateLIHTCEnabled"
                checked={stateLIHTCEnabled}
                onCheckedChange={(checked) => onStateLIHTCEnabledChange(checked as boolean)}
                className="h-4 w-4"
              />
              <Label
                htmlFor="stateLIHTCEnabled"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Enable State LIHTC Calculations
              </Label>
            </div>

            {/* Conditional Content */}
            {stateLIHTCEnabled && (
              <>
                {/* Program Info */}
                {program ? (
                  <div style={{
                    padding: '0.75rem',
                    border: '1px solid var(--hdc-mercury)',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    background: 'rgba(127, 189, 69, 0.05)'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--hdc-faded-jade)' }}>
                      {program.program || `${propertyState} State LIHTC`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      Type: {program.type ? program.type.charAt(0).toUpperCase() + program.type.slice(1) : 'N/A'} &bull;
                      Transferability: {program.transferability.charAt(0).toUpperCase() + program.transferability.slice(1)}
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

                {/* Investor State */}
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Investor State</label>
                  <Select
                    value={investorState || ''}
                    onValueChange={onInvestorStateChange}
                  >
                    <SelectTrigger className="hdc-input">
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedJurisdictions.map(jurisdiction => (
                        <SelectItem key={jurisdiction.code} value={jurisdiction.code}>
                          {jurisdiction.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Syndication Rate */}
                <div className="hdc-input-group">
                  <label htmlFor="syndicationRate" className="hdc-input-label">Syndication Rate (%)</label>
                  <input
                    id="syndicationRate"
                    type="number"
                    value={syndicationRate}
                    onChange={(e) => onSyndicationRateChange(Number(e.target.value))}
                    min={60}
                    max={100}
                    step={1}
                    className="hdc-input"
                  />
                </div>

                {/* Has State Liability */}
                <div className="flex items-center space-x-2" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <Checkbox
                    id="investorHasStateLiability"
                    checked={investorHasStateLiability}
                    onCheckedChange={(checked) => onInvestorHasStateLiabilityChange(checked as boolean)}
                    className="h-4 w-4"
                  />
                  <Label
                    htmlFor="investorHasStateLiability"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Investor Has State Tax Liability
                  </Label>
                </div>

                {/* Conditional User Inputs */}
                {needsUserInputs && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="hdc-input-group">
                      <label htmlFor="creditPercentage" className="hdc-input-label">Credit Percentage (%)</label>
                      <input
                        id="creditPercentage"
                        type="number"
                        value={stateLIHTCUserPercentage ?? ''}
                        onChange={(e) => onStateLIHTCUserPercentageChange?.(Number(e.target.value))}
                        min={0}
                        max={100}
                        step={0.1}
                        className="hdc-input"
                        placeholder="Optional"
                      />
                    </div>

                    <div className="hdc-input-group">
                      <label htmlFor="creditAmount" className="hdc-input-label">Credit Amount ($)</label>
                      <input
                        id="creditAmount"
                        type="number"
                        value={stateLIHTCUserAmount ?? ''}
                        onChange={(e) => onStateLIHTCUserAmountChange?.(Number(e.target.value))}
                        min={0}
                        step={1000}
                        className="hdc-input"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                )}

                {/* Calculated Preview */}
                {calculatedResult && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    border: '1px solid var(--hdc-mercury)',
                    borderRadius: '4px'
                  }}>
                    <h4 style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--hdc-faded-jade)',
                      marginBottom: '0.5rem',
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
                      }}>&#10003;</span>
                      Estimated State Credits
                    </h4>

                    <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Year 1 Credit (Prorated):</span>
                      <span className="hdc-result-value">{formatCurrency(calculatedResult.schedule.year1Credit)}</span>
                    </div>
                    <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Annual Credit (Years 2-10):</span>
                      <span className="hdc-result-value">{formatCurrency(calculatedResult.schedule.annualCredit)}</span>
                    </div>
                    <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Year 11 Catch-Up:</span>
                      <span className="hdc-result-value">{formatCurrency(calculatedResult.schedule.year11Credit)}</span>
                    </div>
                    <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Total 10-Year Gross Credits:</span>
                      <span className="hdc-result-value">{formatCurrency(calculatedResult.grossCredit)}</span>
                    </div>
                    <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Net Benefit (After Syndication):</span>
                      <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                        {formatCurrency(calculatedResult.netBenefit)}
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
  );
};
