import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { ConformingStates } from '../../../types/taxbenefits';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface ConsolidatedTaxSectionProps {
  // Primary inputs
  federalTaxRate: number;
  setFederalTaxRate: (value: number) => void;
  ltCapitalGainsRate: number;
  setLtCapitalGainsRate: (value: number) => void;
  selectedState: string;
  handleStateChange: (stateCode: string) => void;

  // Auto-calculated values (display only)
  niitRate: number;
  stateCapitalGainsRate: number;
  investorEquityAmount: number;

  // Constants
  CONFORMING_STATES: ConformingStates;
}

const ConsolidatedTaxSection: React.FC<ConsolidatedTaxSectionProps> = ({
  federalTaxRate,
  setFederalTaxRate,
  ltCapitalGainsRate,
  setLtCapitalGainsRate,
  selectedState,
  handleStateChange,
  niitRate,
  stateCapitalGainsRate,
  investorEquityAmount,
  CONFORMING_STATES
}) => {
  // Auto-calculate all derived tax rates
  const effectiveOrdinaryRate = federalTaxRate + (CONFORMING_STATES[selectedState]?.rate || stateCapitalGainsRate);
  const totalCapitalGainsRate = ltCapitalGainsRate + niitRate + stateCapitalGainsRate;

  // NIIT applies to high-income investors (automatic for 20% LTCG bracket)
  const appliedNiitRate = ltCapitalGainsRate === 20 ? 3.8 : 0;

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">
        Investor Tax Configuration
        <span className="hdc-tooltip">
          ?
          <span className="hdc-tooltip-text">
            Configure investor's tax situation. All related rates will auto-calculate based on these settings.
          </span>
        </span>
      </h3>

      {/* Primary Inputs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Federal Ordinary Income Rate */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Federal Tax Rate (%)</label>
          <Select value={String(federalTaxRate)} onValueChange={(value) => setFederalTaxRate(Number(value))}>
            <SelectTrigger className="hdc-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24% (Single $100k-$190k)</SelectItem>
              <SelectItem value="32">32% (Single $190k-$231k)</SelectItem>
              <SelectItem value="35">35% (Single $231k-$578k)</SelectItem>
              <SelectItem value="37">37% (Single $578k+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Long-Term Capital Gains Bracket */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">LTCG Bracket</label>
          <Select value={String(ltCapitalGainsRate)} onValueChange={(value) => setLtCapitalGainsRate(Number(value))}>
            <SelectTrigger className="hdc-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (Low income)</SelectItem>
              <SelectItem value="15">15% (Middle income)</SelectItem>
              <SelectItem value="20">20% (High income + 3.8% NIIT)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State Selection */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">State</label>
          <Select value={selectedState} onValueChange={handleStateChange}>
            <SelectTrigger className="hdc-input">
              <SelectValue placeholder="Select State..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-semibold">Prime OZ States</div>
              <SelectItem value="NY">New York (10.9%)</SelectItem>
              <SelectItem value="NJ">New Jersey (10.75%)</SelectItem>
              <SelectItem value="DC">District of Columbia (10.75%)</SelectItem>
              <SelectItem value="OR">Oregon (9.9%)</SelectItem>
              <SelectItem value="MN">Minnesota (9.85%)</SelectItem>

              <div className="px-2 py-1.5 text-xs font-semibold">Other Conforming States</div>
              <SelectItem value="VT">Vermont (8.75%)</SelectItem>
              <SelectItem value="WI">Wisconsin (7.65%)</SelectItem>
              <SelectItem value="ME">Maine (7.15%)</SelectItem>
              <SelectItem value="SC">South Carolina (7.0%)</SelectItem>
              <SelectItem value="CT">Connecticut (6.99%)</SelectItem>
              <SelectItem value="NE">Nebraska (6.6%)</SelectItem>
              <SelectItem value="WV">West Virginia (6.5%)</SelectItem>

              <div className="px-2 py-1.5 text-xs font-semibold">No State Tax</div>
              <SelectItem value="NONE">No State Tax (FL, TX, WA, etc.)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auto-Calculated Summary Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(64, 127, 127, 0.05) 0%, rgba(146, 195, 194, 0.05) 100%)',
        border: '1px solid var(--hdc-mercury)',
        borderRadius: '8px',
        padding: '0.75rem'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--hdc-cabbage-pont)', marginBottom: '0.5rem' }}>
          Auto-Calculated Tax Rates:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {/* Depreciation Benefits Rate */}
          <div>
            <div className="hdc-result-label" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>
              Depreciation Benefit Rate (Ordinary Income)
            </div>
            <div className="hdc-result-value" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {effectiveOrdinaryRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--hdc-mercury)' }}>
              {federalTaxRate}% Fed + {(CONFORMING_STATES[selectedState]?.rate || stateCapitalGainsRate).toFixed(1)}% State
            </div>
          </div>

          {/* OZ Capital Gains Rate */}
          <div>
            <div className="hdc-result-label" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>
              OZ Deferred Gains Tax Rate
            </div>
            <div className="hdc-result-value" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {totalCapitalGainsRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--hdc-mercury)' }}>
              {ltCapitalGainsRate}% LTCG + {appliedNiitRate}% NIIT + {stateCapitalGainsRate.toFixed(1)}% State
            </div>
          </div>
        </div>

        {/* OZ Investment Info */}
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(146, 195, 194, 0.2)' }}>
          <div className="hdc-result-row">
            <span className="hdc-result-label" style={{ fontSize: '0.7rem' }}>
              OZ Deferred Capital Gains (from Investor Equity):
            </span>
            <span className="hdc-result-value" style={{ fontSize: '0.8rem' }}>
              ${(investorEquityAmount * 1000000).toLocaleString()}
            </span>
          </div>

          {selectedState !== 'NONE' && CONFORMING_STATES[selectedState] && (
            <div style={{ fontSize: '0.65rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
              ✓ {CONFORMING_STATES[selectedState].name} conforms to federal OZ deferral
            </div>
          )}
        </div>
      </div>

      {/* Key Insights Box */}
      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        border: '1px solid var(--hdc-mercury)',
        borderRadius: '4px'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--hdc-strikemaster)' }}>
          <strong>Key Insights:</strong>
          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
            <li>Depreciation saves {effectiveOrdinaryRate.toFixed(1)}% on property losses</li>
            <li>OZ defers {totalCapitalGainsRate.toFixed(1)}% tax for 5 years</li>
            <li>Year 5: Pay deferred tax minus basis step-up benefit</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedTaxSection;