import React, { useMemo } from 'react';
import {
  ALL_JURISDICTIONS,
  getJurisdictionsByTier,
  getJurisdictionLabel,
  getEffectiveTaxRate,
  doesNIITApply
} from '../../../utils/taxbenefits/stateData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface EnhancedStateSelectorProps {
  selectedState: string;
  handleStateChange: (state: string) => void;
  federalTaxRate: number;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (rate: number) => void;
}

const EnhancedStateSelector: React.FC<EnhancedStateSelectorProps> = ({
  selectedState,
  handleStateChange,
  federalTaxRate,
  stateCapitalGainsRate,
  setStateCapitalGainsRate
}) => {
  const groupedJurisdictions = useMemo(() => getJurisdictionsByTier(), []);

  const renderOptGroup = (
    label: string,
    jurisdictions: Array<{code: string, data: any}>,
    showOzIndicator: boolean = true
  ) => {
    if (jurisdictions.length === 0) return null;

    return (
      <React.Fragment key={label}>
        <div className="px-2 py-1.5 text-xs font-semibold">{label}</div>
        {jurisdictions.map(({ code, data }) => {
          const ozIndicator = showOzIndicator ?
            (data.ozConformity === 'full' ? ' ✓' :
             data.ozConformity === 'partial' ? ' ◐' :
             data.ozConformity === 'special' ? ' ★' :
             data.ozConformity === 'none' ? ' ✗' : '') : '';

          const rateDisplay = data.rate === 0 ? 'No Tax' : `${data.rate}%`;
          const capGainsNote = data.capitalGainsRate !== undefined &&
                               data.capitalGainsRate !== data.rate ?
                               ` (CG: ${data.capitalGainsRate}%)` : '';

          return (
            <SelectItem key={code} value={code}>
              {data.name} - {rateDisplay}{capGainsNote}{ozIndicator}
            </SelectItem>
          );
        })}
      </React.Fragment>
    );
  };

  const selectedJurisdiction = ALL_JURISDICTIONS[selectedState];
  const effectiveRate = selectedJurisdiction ?
    getEffectiveTaxRate(selectedState, true) :
    stateCapitalGainsRate;

  const showNIITWarning = selectedJurisdiction?.type === 'territory' && !doesNIITApply(selectedState);

  return (
    <div className="hdc-input-group">
      <label className="hdc-input-label">Target State/Territory</label>

      <Select value={selectedState} onValueChange={handleStateChange}>
        <SelectTrigger className="hdc-input">
          <SelectValue placeholder="Select State/Territory..." />
        </SelectTrigger>
        <SelectContent>
          {renderOptGroup('Prime Targets (High Tax + OZ)', groupedJurisdictions['Prime'])}
          {renderOptGroup('Secondary Targets (Moderate Tax + OZ)', groupedJurisdictions['Secondary'])}
          {renderOptGroup('Standard States', groupedJurisdictions['Standard'])}
          {renderOptGroup('No Tax States', groupedJurisdictions['NoTax'])}
          {renderOptGroup('US Territories', groupedJurisdictions['Territory'])}

          <div className="px-2 py-1.5 text-xs font-semibold">Other Options</div>
          <SelectItem value="NONE">N/A - No State Tax</SelectItem>
          <SelectItem value="CUSTOM">Custom Rate (Manual Entry)</SelectItem>
        </SelectContent>
      </Select>

      {/* Jurisdiction Details Panel */}
      {selectedJurisdiction && (
        <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
          <div className="hdc-result-row">
            <span className="hdc-result-label">Jurisdiction Type:</span>
            <span className="hdc-result-value">
              {selectedJurisdiction.type === 'territory' ? '🏝️ Territory' :
               selectedJurisdiction.type === 'district' ? '🏛️ District' : '📍 State'}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">OZ Conformity:</span>
            <span className={`hdc-result-value ${
              selectedJurisdiction.ozConformity === 'full' ? 'hdc-value-positive' :
              selectedJurisdiction.ozConformity === 'partial' ? 'hdc-value-neutral' :
              selectedJurisdiction.ozConformity === 'special' ? 'hdc-value-positive' :
              'hdc-value-negative'
            }`}>
              {selectedJurisdiction.ozConformity === 'full' ? '✓ Full Conformity' :
               selectedJurisdiction.ozConformity === 'partial' ? '◐ Partial' :
               selectedJurisdiction.ozConformity === 'special' ? '★ Special Rules' :
               '✗ No Conformity'}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Ordinary Income Rate:</span>
            <span className="hdc-result-value">{selectedJurisdiction.rate}%</span>
          </div>

          {selectedJurisdiction.capitalGainsRate !== undefined &&
           selectedJurisdiction.capitalGainsRate !== selectedJurisdiction.rate && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Capital Gains Rate:</span>
              <span className="hdc-result-value hdc-value-positive">
                {selectedJurisdiction.capitalGainsRate}%
              </span>
            </div>
          )}

          <div className="hdc-result-row">
            <span className="hdc-result-label">Combined Tax Rate:</span>
            <span className="hdc-result-value" style={{color: 'var(--hdc-strikemaster)', fontWeight: 'bold'}}>
              {(federalTaxRate + effectiveRate).toFixed(1)}%
            </span>
          </div>

          {showNIITWarning && (
            <div className="hdc-result-row" style={{marginTop: '0.5rem'}}>
              <span className="hdc-result-label" style={{color: 'var(--hdc-faded-jade)'}}>
                ℹ️ NIIT does not apply to territories
              </span>
            </div>
          )}

          {selectedJurisdiction.notes && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'var(--hdc-mercury)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              <strong>Note:</strong> {selectedJurisdiction.notes}
            </div>
          )}
        </div>
      )}

      {/* Custom Rate Input */}
      {selectedState === 'CUSTOM' && (
        <div className="mt-2">
          <div className="hdc-input-group">
            <label className="hdc-input-label">Custom State Capital Gains Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={stateCapitalGainsRate}
              onChange={(e) => setStateCapitalGainsRate(Number(e.target.value) || 0)}
              className="hdc-input"
            />
            <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
              Manual entry for testing or special situations
            </div>
          </div>
        </div>
      )}

      {/* Legend for OZ Conformity Indicators */}
      <div style={{
        marginTop: '1rem',
        padding: '0.5rem',
        background: '#f9f9f9',
        borderRadius: '4px',
        fontSize: '0.7rem',
        color: '#666'
      }}>
        <strong>Legend:</strong>
        <span style={{marginLeft: '0.5rem'}}>✓ Full OZ Conformity</span>
        <span style={{marginLeft: '0.5rem'}}>◐ Partial</span>
        <span style={{marginLeft: '0.5rem'}}>★ Special Rules</span>
        <span style={{marginLeft: '0.5rem'}}>✗ No Conformity</span>
      </div>
    </div>
  );
};

export default EnhancedStateSelector;