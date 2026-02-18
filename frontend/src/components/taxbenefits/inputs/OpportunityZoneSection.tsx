import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { getOzStepUpPercent } from '../../../utils/taxbenefits/constants';
import { roundForDisplay } from '../../../utils/taxbenefits/formatters';

interface OpportunityZoneSectionProps {
  // IMPL-071: OZ enabled toggle
  ozEnabled?: boolean;
  setOzEnabled?: (value: boolean) => void;
  ozType: 'standard' | 'rural';
  setOzType: (value: 'standard' | 'rural') => void;
  ozVersion: '1.0' | '2.0';  // IMPL-017: OZ legislation version
  setOzVersion: (value: '1.0' | '2.0') => void;
  deferredCapitalGains: number;
  setDeferredCapitalGains: (value: number) => void;
  capitalGainsTaxRate: number;
  setCapitalGainsTaxRate: (value: number) => void;
  investorEquityAmount?: number; // Pass in the actual investor equity amount for auto-population
  ltCapitalGainsRate?: number; // Federal LTCG rate
  niitRate?: number; // Net Investment Income Tax
  stateCapitalGainsRate?: number; // State capital gains rate
  // IMPL-071: Depreciation info for recapture display when OZ disabled
  totalDepreciation?: number;

  // Read-only mode
  isReadOnly?: boolean;
}

const OpportunityZoneSection: React.FC<OpportunityZoneSectionProps> = ({
  ozEnabled = true,
  setOzEnabled,
  ozType,
  setOzType,
  ozVersion,
  setOzVersion,
  deferredCapitalGains,
  setDeferredCapitalGains,
  capitalGainsTaxRate,
  setCapitalGainsTaxRate,
  investorEquityAmount = 0,
  ltCapitalGainsRate = 20,
  niitRate = 3.8,
  stateCapitalGainsRate = 0,
  totalDepreciation = 0,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-populate deferred capital gains to match investor equity
  // ISS-066: Round to prevent floating-point display artifacts (e.g., 29.099999999999998 → 29.1)
  React.useEffect(() => {
    if (investorEquityAmount > 0) {
      // Set deferred gains to match investor equity (in millions)
      // This assumes 100% of investor equity comes from qualified capital gains
      setDeferredCapitalGains(roundForDisplay(investorEquityAmount));
    }
  }, [investorEquityAmount, setDeferredCapitalGains]);

  // Auto-calculate total capital gains tax rate
  React.useEffect(() => {
    const totalRate = ltCapitalGainsRate + niitRate + stateCapitalGainsRate;
    setCapitalGainsTaxRate(totalRate);
  }, [ltCapitalGainsRate, niitRate, stateCapitalGainsRate, setCapitalGainsTaxRate]);

  // Preview Year 5 tax impact (actual calculation happens in engine)
  // IMPL-017: Use centralized helper for OZ version support
  const stepUpPercent = getOzStepUpPercent(ozVersion, ozType);
  const taxableGains = deferredCapitalGains * (1 - stepUpPercent);
  const year5TaxDue = taxableGains * (capitalGainsTaxRate / 100);

  return (
    <div className="hdc-calculator">
      <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-brown-rust)' }}>
        <h3
          className="hdc-section-header"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.625rem',
            paddingBottom: '0.375rem',
            borderBottom: '2px solid var(--hdc-brown-rust)',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
          5. Opportunity Zone
        </h3>

        {isExpanded && (
          <>
            {/* IMPL-071: OZ Enabled Toggle */}
            <div className="hdc-input-group" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="hdc-input-label" style={{ marginBottom: 0 }}>
                  Enable Opportunity Zone Benefits
                </label>
                <Switch
                  checked={ozEnabled}
                  onCheckedChange={(checked) => setOzEnabled?.(checked)}
                  disabled={isReadOnly}
                />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                {ozEnabled
                  ? 'OZ benefits active: capital gains deferral, step-up basis, and recapture avoidance'
                  : 'OZ disabled: standard depreciation recapture applies at exit'}
              </div>
            </div>

            {/* Show depreciation recapture warning when OZ is disabled */}
            {!ozEnabled && totalDepreciation > 0 && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '1px solid var(--hdc-brown-rust)',
                borderRadius: '4px',
                backgroundColor: 'rgba(139, 69, 19, 0.05)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--hdc-brown-rust)', marginBottom: '0.5rem' }}>
                  Depreciation Recapture at Exit
                </div>
                <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                  <span className="hdc-result-label">Cumulative Depreciation:</span>
                  <span className="hdc-result-value">
                    ${(totalDepreciation * 1000000).toLocaleString()}
                  </span>
                </div>
                <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                  <span className="hdc-result-label">Recapture Rate (§1250 cap):</span>
                  <span className="hdc-result-value">25%</span>
                </div>
                <div className="hdc-result-row summary" style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--hdc-mercury)'
                }}>
                  <span className="hdc-result-label" style={{ fontWeight: 600 }}>
                    Estimated Recapture Tax:
                  </span>
                  <span className="hdc-result-value" style={{ fontWeight: 700, color: 'var(--hdc-brown-rust)' }}>
                    ${(totalDepreciation * 0.25 * 1000000).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* OZ Version (IMPL-017) */}
            <div className="hdc-input-group" style={{ opacity: ozEnabled ? 1 : 0.5 }}>
              <label className="hdc-input-label">OZ Legislation Version</label>
              <Select
                value={ozVersion}
                onValueChange={(value) => setOzVersion(value as '1.0' | '2.0')}
                disabled={isReadOnly || !ozEnabled}
              >
                <SelectTrigger className="hdc-input" style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2.0">OZ 2.0 - OBBBA 2025 (10%/30% step-up)</SelectItem>
                  <SelectItem value="1.0">OZ 1.0 - TCJA 2017 (0% step-up)</SelectItem>
                </SelectContent>
              </Select>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                {ozVersion === '2.0'
                  ? 'Current law: 10% standard, 30% rural basis step-up'
                  : 'Original law: No basis step-up on deferred gains'}
              </div>
            </div>

            {/* OZ Type */}
            <div className="hdc-input-group" style={{ marginTop: '1rem', opacity: ozEnabled ? 1 : 0.5 }}>
              <label className="hdc-input-label">OZ Type</label>
              <Select
                value={ozType}
                onValueChange={(value) => setOzType(value as 'standard' | 'rural')}
                disabled={isReadOnly || !ozEnabled}
              >
                <SelectTrigger className="hdc-input" style={isReadOnly ? { opacity: 0.6, cursor: 'not-allowed' } : {}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Opportunity Zone {ozVersion === '2.0' ? '(10% step-up)' : '(0% step-up)'}</SelectItem>
                  <SelectItem value="rural">Rural OZ / QROF {ozVersion === '2.0' ? '(30% step-up)' : '(0% step-up)'}</SelectItem>
                </SelectContent>
              </Select>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                {ozVersion === '2.0'
                  ? 'Rural OZ provides 30% basis step-up vs 10% for standard OZ'
                  : 'Under OZ 1.0, no step-up applies regardless of zone type'}
              </div>
            </div>

            {/* Deferred Capital Gains */}
            <div className="hdc-input-group" style={{ marginTop: '1rem', opacity: ozEnabled ? 1 : 0.5 }}>
              <label className="hdc-input-label">
                Deferred Capital Gains ($M)
                <span style={{ fontSize: '0.7rem', color: '#666', display: 'block', fontWeight: 'normal' }}>
                  Auto-populated from investor equity amount
                </span>
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={deferredCapitalGains}
                onChange={(e) => setDeferredCapitalGains(Number(e.target.value) || 0)}
                className="hdc-input"
                disabled={isReadOnly || !ozEnabled}
              />
            </div>

            {/* Capital Gains Tax Rate Display */}
            <div className="hdc-input-group" style={{ marginTop: '1rem' }}>
              <label className="hdc-input-label">Combined Capital Gains Tax Rate</label>
              <div
                className="hdc-input"
                style={{
                  backgroundColor: 'var(--hdc-alabaster)',
                  cursor: 'default',
                  color: 'var(--hdc-cabbage-pont)',
                  fontWeight: 600,
                }}
              >
                {capitalGainsTaxRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                Federal {ltCapitalGainsRate}% + NIIT {niitRate}% + State {stateCapitalGainsRate.toFixed(1)}%
              </div>
            </div>

            {/* Year 5 Tax Preview - only show when OZ is enabled */}
            {ozEnabled && deferredCapitalGains > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--hdc-strikemaster)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--hdc-mercury)',
                  paddingBottom: '0.5rem'
                }}>
                  Year 5 OZ Tax Payment Preview
                </h4>

                <div style={{
                  padding: '0.75rem',
                  border: '1px solid var(--hdc-mercury)',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 200, 100, 0.05)',
                }}>
                  <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                    <span className="hdc-result-label">Deferred Capital Gains:</span>
                    <span className="hdc-result-value">
                      ${(deferredCapitalGains * 1000000).toLocaleString()}
                    </span>
                  </div>

                  <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                    <span className="hdc-result-label">Basis Step-Up ({(stepUpPercent * 100).toFixed(0)}%):</span>
                    <span className="hdc-result-value" style={{ color: 'var(--hdc-cabbage-pont)' }}>
                      -${((deferredCapitalGains * stepUpPercent) * 1000000).toLocaleString()}
                    </span>
                  </div>

                  <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                    <span className="hdc-result-label">Taxable Gains After Step-Up:</span>
                    <span className="hdc-result-value">
                      ${(taxableGains * 1000000).toLocaleString()}
                    </span>
                  </div>

                  <div className="hdc-result-row" style={{ fontSize: '0.875rem' }}>
                    <span className="hdc-result-label">Capital Gains Tax Rate:</span>
                    <span className="hdc-result-value">
                      {capitalGainsTaxRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="hdc-result-row summary" style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--hdc-mercury)'
                  }}>
                    <span className="hdc-result-label" style={{ fontWeight: 600 }}>
                      Year 5 Tax Due:
                    </span>
                    <span className="hdc-result-value" style={{ fontWeight: 700, color: 'var(--hdc-brown-rust)' }}>
                      ${(year5TaxDue * 1000000).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OpportunityZoneSection;
