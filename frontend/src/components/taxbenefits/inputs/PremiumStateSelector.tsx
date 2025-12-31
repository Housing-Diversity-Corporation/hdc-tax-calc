import React, { useMemo, useState } from 'react';
import {
  ALL_JURISDICTIONS,
  getJurisdictionsByTier,
  getEffectiveTaxRate,
  doesNIITApply,
  JurisdictionData
} from '../../../utils/taxbenefits/stateData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface PremiumStateSelectorProps {
  selectedState: string;
  handleStateChange: (state: string) => void;
  federalTaxRate: number;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (rate: number) => void;
  showAdvancedInfo?: boolean;
}

// Visual indicators for different conformity types
const CONFORMITY_BADGES = {
  full: { icon: '✓', color: '#4CAF50', label: 'Full OZ Conformity' },
  partial: { icon: '◐', color: '#FF9800', label: 'Partial Conformity' },
  special: { icon: '★', color: '#9C27B0', label: 'Special OZ Rules' },
  none: { icon: '✗', color: '#F44336', label: 'No OZ Conformity' }
};

// Tier labels with descriptions
const TIER_INFO = {
  Prime: {
    label: '🎯 Prime Targets',
    description: 'Highest tax states with strong OZ conformity',
    color: '#1B5E20'
  },
  Secondary: {
    label: '📍 Secondary Targets',
    description: 'Moderate tax states with OZ benefits',
    color: '#01579B'
  },
  Standard: {
    label: '📋 Standard States',
    description: 'Lower tax states with varying conformity',
    color: '#424242'
  },
  NoTax: {
    label: '🏖️ No Tax States',
    description: 'States with no income tax',
    color: '#00695C'
  },
  Territory: {
    label: '🏝️ US Territories',
    description: 'Special tax jurisdictions with unique rules',
    color: '#6A1B9A'
  }
};

const PremiumStateSelector: React.FC<PremiumStateSelectorProps> = ({
  selectedState,
  handleStateChange,
  federalTaxRate,
  stateCapitalGainsRate,
  setStateCapitalGainsRate,
  showAdvancedInfo = true
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  const groupedJurisdictions = useMemo(() => {
    return getJurisdictionsByTier();
  }, []);

  // Filter jurisdictions based on search
  const filteredGroups = useMemo(() => {
    if (!searchFilter) return groupedJurisdictions;

    const filtered: typeof groupedJurisdictions = {};
    Object.entries(groupedJurisdictions).forEach(([tier, jurisdictions]) => {
      const matches = jurisdictions.filter(({ code, data }) =>
        data.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        code.toLowerCase().includes(searchFilter.toLowerCase())
      );
      if (matches.length > 0) {
        filtered[tier] = matches;
      }
    });
    return filtered;
  }, [groupedJurisdictions, searchFilter]);

  const renderJurisdictionOption = (code: string, data: JurisdictionData) => {
    const conformityBadge = CONFORMITY_BADGES[data.ozConformity] || CONFORMITY_BADGES.none;
    const rateDisplay = data.rate === 0 ? 'No Tax' : `${data.rate}%`;
    const capGainsNote = data.capitalGainsRate !== undefined &&
                         data.capitalGainsRate !== data.rate ?
                         ` (CG: ${data.capitalGainsRate}%)` : '';

    // Special formatting for exceptional jurisdictions
    const isExceptional = data.ozConformity === 'special' && data.type === 'territory';

    return (
      <SelectItem
        key={code}
        value={code}
        className={isExceptional ? 'exceptional-option' : ''}
      >
        {data.name} - {rateDisplay}{capGainsNote} {conformityBadge.icon}
      </SelectItem>
    );
  };

  const selectedJurisdiction = ALL_JURISDICTIONS[selectedState];

  return (
    <div className="premium-state-selector">
      <div className="hdc-input-group">
        <label className="hdc-input-label">
          Target State/Territory
          {showAdvancedInfo && (
            <button
              className="info-tooltip-btn"
              onMouseEnter={() => setShowTooltip('main')}
              onMouseLeave={() => setShowTooltip(null)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                cursor: 'help',
                color: 'var(--hdc-cabbage-pont)',
                fontSize: '14px'
              }}
            >
              ⓘ
            </button>
          )}
        </label>

        {showTooltip === 'main' && (
          <div className="tooltip-popup" style={{
            position: 'absolute',
            border: '1px solid var(--hdc-mercury)',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '0.75rem',
            zIndex: 1000,
            maxWidth: '300px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <strong>Jurisdiction Selection Guide:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
              <li>✓ = Full OZ conformity (best for tax benefits)</li>
              <li>★ = Special OZ rules</li>
              <li>◐ = Partial conformity (some limitations)</li>
              <li>✗ = No OZ conformity (state won't recognize benefits)</li>
            </ul>
            <strong>Territories:</strong> Have unique federal tax treatment and no NIIT.
          </div>
        )}

        {/* Search Filter */}
        {showAdvancedInfo && (
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="🔍 Search states/territories..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="hdc-input"
              style={{
                fontSize: '0.875rem',
                padding: '6px 10px',
              }}
            />
          </div>
        )}

        <Select value={selectedState} onValueChange={handleStateChange}>
          <SelectTrigger className="hdc-input premium-select" style={{ fontSize: '0.875rem' }}>
            <SelectValue placeholder="Select State/Territory..." />
          </SelectTrigger>
          <SelectContent>
            {/* Other Tiers */}
            {['Prime', 'Secondary', 'Standard', 'NoTax', 'Territory'].map(tier => {
              const jurisdictions = filteredGroups[tier];
              if (!jurisdictions || jurisdictions.length === 0) return null;

              const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO];
              return (
                <React.Fragment key={tier}>
                  <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: tierInfo.color }}>
                    {tierInfo.label} ({jurisdictions.length})
                  </div>
                  {jurisdictions.map(({ code, data }) =>
                    renderJurisdictionOption(code, data)
                  )}
                </React.Fragment>
              );
            })}

            <div className="px-2 py-1.5 text-xs font-semibold">Other Options</div>
            <SelectItem value="NONE">N/A - No State Tax</SelectItem>
            <SelectItem value="CUSTOM">Custom Rate (Manual Entry)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Jurisdiction Details Panel */}
      {selectedJurisdiction && (
        <div className="jurisdiction-details-panel" style={{
          marginTop: '12px',
          padding: '12px',
          border: '1px solid var(--hdc-mercury)',
          borderRadius: '8px',
          opacity: 0.95
        }}>
          {/* Header with Type Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--hdc-mercury)'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
              {selectedJurisdiction.name}
            </span>
            <span className="jurisdiction-type-badge" style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              background: selectedJurisdiction.type === 'territory' ? '#E1BEE7' :
                         selectedJurisdiction.type === 'district' ? '#C5CAE9' : '#E0F2F1',
              color: '#333'
            }}>
              {selectedJurisdiction.type === 'territory' ? '🏝️ Territory' :
               selectedJurisdiction.type === 'district' ? '🏛️ District' : '📍 State'}
            </span>
          </div>

          {/* OZ Conformity with Visual Badge */}
          <div className="detail-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>OZ Conformity:</span>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: CONFORMITY_BADGES[selectedJurisdiction.ozConformity]?.color + '20',
              color: CONFORMITY_BADGES[selectedJurisdiction.ozConformity]?.color,
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}>
              {CONFORMITY_BADGES[selectedJurisdiction.ozConformity]?.icon}
              {CONFORMITY_BADGES[selectedJurisdiction.ozConformity]?.label}
            </span>
          </div>

          {/* Tax Rates Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: '8px'
          }}>
            <div className="rate-box" style={{
              padding: '8px',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#999' }}>Ordinary Income</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
                {selectedJurisdiction.rate}%
              </div>
            </div>

            <div className="rate-box" style={{
              padding: '8px',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#999' }}>Capital Gains</div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: selectedJurisdiction.capitalGainsRate !== selectedJurisdiction.rate ?
                       'var(--hdc-cabbage-pont)' : '#333'
              }}>
                {selectedJurisdiction.capitalGainsRate ?? selectedJurisdiction.rate}%
              </div>
            </div>
          </div>

          {/* Combined Rate Summary */}
          <div style={{
            marginTop: '12px',
            padding: '8px',
            background: 'var(--hdc-gulf-stream)',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>Combined Federal + State Rate</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--hdc-strikemaster)'
            }}>
              {(federalTaxRate + getEffectiveTaxRate(selectedState, true)).toFixed(1)}%
            </div>
          </div>

          {/* Special Notices */}
          {selectedJurisdiction.type === 'territory' && (
            <div className="notice-box" style={{
              marginTop: '8px',
              padding: '8px',
              background: '#FFF3E0',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#E65100'
            }}>
              <strong>⚠️ Territory Notice:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>NIIT (3.8%) does not apply</li>
                <li>Special federal filing requirements may apply</li>
                {selectedJurisdiction.ozConformity === 'special' && (
                  <li>Unique OZ incentives available</li>
                )}
              </ul>
            </div>
          )}

          {/* Custom Notes */}
          {selectedJurisdiction.notes && (
            <div className="notes-box" style={{
              marginTop: '8px',
              padding: '8px',
              background: '#E8F5E9',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#1B5E20'
            }}>
              <strong>ℹ️ Special Considerations:</strong>
              <p style={{ margin: '4px 0' }}>{selectedJurisdiction.notes}</p>
            </div>
          )}

        </div>
      )}

      {/* Custom Rate Entry */}
      {selectedState === 'CUSTOM' && (
        <div className="custom-rate-section" style={{
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
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--hdc-cabbage-pont)',
              marginTop: '4px'
            }}>
              Use for testing edge cases or jurisdictions not listed
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumStateSelector;