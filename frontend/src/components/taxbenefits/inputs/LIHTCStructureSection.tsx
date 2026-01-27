/**
 * @deprecated IMPL-015: This component has been consolidated into TaxCreditsSection.tsx
 * Federal LIHTC is now Panel 3 subsection in TaxCreditsSection.
 * Keep for backward compatibility but do not use in new code.
 */
import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { HDCCheckbox } from './shared/HDCCheckbox';
import { Slider } from '../../ui/slider';
import { calculateLIHTCSchedule } from '../../../utils/taxbenefits/lihtcCreditCalculations';
import { calculateLIHTCEligibleBasisBreakdown } from '../../../utils/taxbenefits/depreciableBasisUtility';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface LIHTCStructureSectionProps {
  // Enable toggle
  lihtcEnabled: boolean;
  setLihtcEnabled: (value: boolean) => void;

  // LIHTC inputs
  applicableFraction: number;
  setApplicableFraction: (value: number) => void;
  creditRate: number;
  setCreditRate: (value: number) => void;
  placedInServiceMonth: number;
  setPlacedInServiceMonth: (value: number) => void;
  ddaQctBoost: boolean;
  setDdaQctBoost: (value: boolean) => void;

  // Calculated values for display
  lihtcEligibleBasis: number;

  // Optional breakdown values (for detailed display)
  projectCost?: number;
  predevelopmentCosts?: number;
  landValue?: number;
  interestReserve?: number;
  syndicationCosts?: number;
  marketingCosts?: number;
  commercialSpaceCosts?: number;

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

const LIHTCStructureSection: React.FC<LIHTCStructureSectionProps> = ({
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
  syndicationCosts = 0,
  marketingCosts = 0,
  commercialSpaceCosts = 0,
  formatCurrency,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate breakdown if we have the required values
  const basisBreakdown = useMemo(() => {
    if (projectCost === undefined || landValue === undefined) return null;

    return calculateLIHTCEligibleBasisBreakdown({
      projectCost,
      predevelopmentCosts,
      landValue,
      interestReserve,
      syndicationCosts,
      marketingCosts,
      commercialSpaceCosts,
    });
  }, [projectCost, predevelopmentCosts, landValue, interestReserve, syndicationCosts, marketingCosts, commercialSpaceCosts]);

  // Calculate preview if enabled
  const preview = useMemo(() => {
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

  return (
    <div className="hdc-calculator">
      <div className="hdc-section">
        <h3
          className="hdc-section-header"
          style={{ cursor: 'pointer', position: 'relative' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          Federal LIHTC Configuration
        </h3>

        {isExpanded && (
          <>
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
                  <label className="hdc-input-label">LIHTC Eligible Basis (per IRC §42)</label>
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
                        {/* Starting point */}
                        <div className="hdc-result-row" style={{ fontSize: '0.8rem' }}>
                          <span className="hdc-result-label">Project Cost:</span>
                          <span className="hdc-result-value">{formatCurrency(basisBreakdown.totalProjectCost / 1000000)}</span>
                        </div>

                        {/* Exclusions - only show non-zero values */}
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

                        {/* Total */}
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

                {/* Calculated Preview */}
                {preview && (
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
                      <span className="hdc-result-value">{formatFullDollars(preview.annualCredit)}</span>
                    </div>
                    <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Year 1 Credit (Prorated):</span>
                      <span className="hdc-result-value">{formatFullDollars(preview.year1Credit)}</span>
                    </div>
                    <div className="hdc-result-row summary" style={{ fontSize: '0.875rem' }}>
                      <span className="hdc-result-label">Total 10-Year Credits:</span>
                      <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                        {formatFullDollars(preview.totalCredits)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LIHTCStructureSection;
