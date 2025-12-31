import React, { useState, useMemo } from 'react';
import {
  HDC_OZ_STRATEGY,
  getOzBenefits,
  getStrategicGroups,
  getOzStatusBadge,
  OZStatus
} from '../../../utils/taxbenefits/hdcOzStrategy';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface StrategicOzSelectorProps {
  selectedState: string;
  handleStateChange: (state: string) => void;
  projectLocation?: string;
  setProjectLocation?: (location: string) => void;
  federalTaxRate: number;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (rate: number) => void;
  readOnly?: boolean;
}

const StrategicOzSelector: React.FC<StrategicOzSelectorProps> = ({
  selectedState,
  handleStateChange,
  projectLocation,
  setProjectLocation,
  federalTaxRate,
  stateCapitalGainsRate,
  setStateCapitalGainsRate,
  readOnly = false
}) => {
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  // Get OZ benefits for current selection
  const ozBenefits = useMemo(() =>
    getOzBenefits(selectedState, projectLocation),
    [selectedState, projectLocation]
  );

  // Update project selector visibility when state changes
  React.useEffect(() => {
    setShowProjectSelector(ozBenefits.showProjectSelector || false);
  }, [ozBenefits.showProjectSelector]);

  // Get all jurisdictions sorted alphabetically
  const sortedJurisdictions = useMemo(() => {
    return Object.entries(HDC_OZ_STRATEGY)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([code, data]) => ({ code, data }));
  }, []);

  const selectedJurisdiction = HDC_OZ_STRATEGY[selectedState];

  return (
    <div className="strategic-oz-selector">
      <div className="hdc-input-group">
        <label className="hdc-input-label">
          Investor State/Territory
          <span style={{
            fontSize: '0.75rem',
            color: '#666',
            marginLeft: '8px'
          }}>
            (Where investor files taxes)
          </span>
        </label>

        <Select value={selectedState} onValueChange={handleStateChange} disabled={readOnly}>
          <SelectTrigger className="hdc-input strategic-select" style={{
            fontSize: '0.875rem',
            ...(readOnly ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {})
          }}>
            <SelectValue placeholder="Select State/Territory..." />
          </SelectTrigger>
          <SelectContent>
            {sortedJurisdictions.map(({ code, data }) => (
              <SelectItem key={code} value={code}>
                {data.name} - {data.status === 'NO_GO' ? 'Non-conforming' : `${data.rate}%`}
              </SelectItem>
            ))}
            <SelectItem value="CUSTOM">Custom Rate (Manual Entry)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected State Info */}
      {selectedJurisdiction && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
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

          {selectedJurisdiction.notes && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: '#F5F5F5',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#666'
            }}>
              {selectedJurisdiction.notes}
            </div>
          )}
        </div>
      )}

      {/* Project Location Selector (for GO_IN_STATE) */}
      {showProjectSelector && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#FFF9C4',
          border: '2px solid #FFC107',
          borderRadius: '8px'
        }}>
          <label className="hdc-input-label" style={{ marginBottom: '8px' }}>
            📍 Project Location Required
            <span style={{
              fontSize: '0.75rem',
              color: '#666',
              display: 'block',
              marginTop: '4px'
            }}>
              {selectedJurisdiction?.name} only provides state OZ benefits for in-state projects
            </span>
          </label>

          <Select value={projectLocation || ''} onValueChange={(value) => setProjectLocation?.(value)}>
            <SelectTrigger className="hdc-input" style={{
              borderColor: '#FFC107'
            }}>
              <SelectValue placeholder="Select Project State..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(HDC_OZ_STRATEGY)
                .filter(([_, data]) => data.status === 'GO')
                .map(([code, data]) => (
                  <SelectItem key={code} value={code}>
                    {data.name}
                    {code === selectedState && ' ✅ (Same as investor state)'}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>

          {projectLocation && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              background: projectLocation === selectedState ? '#E8F5E9' : '#FFEBEE',
              borderRadius: '4px',
              fontSize: '0.85rem'
            }}>
              {projectLocation === selectedState ? (
                <span style={{ color: '#2E7D32' }}>
                  ✅ Full state benefits apply - project and investor in same state
                </span>
              ) : (
                <span style={{ color: '#C62828' }}>
                  🚫 Federal benefits only - project not in {selectedJurisdiction?.name}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Rate Entry */}
      {selectedState === 'CUSTOM' && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          border: '1px solid var(--hdc-mercury)',
          borderRadius: '8px'
        }}>
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Custom State Capital Gains Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={stateCapitalGainsRate}
              onChange={(e) => setStateCapitalGainsRate(Number(e.target.value) || 0)}
              className="hdc-input"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default StrategicOzSelector;