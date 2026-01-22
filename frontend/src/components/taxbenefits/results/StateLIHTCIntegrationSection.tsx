import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import { StateLIHTCIntegrationResult } from '../../../types/taxbenefits';

interface StateLIHTCIntegrationSectionProps {
  stateLIHTCIntegration: StateLIHTCIntegrationResult | null;
  formatCurrency?: (value: number) => string;
}

/**
 * State LIHTC Integration Section (IMPL-018)
 * Displays the credit path, net value, and treatment of State LIHTC credits.
 * Shows warning when credits cannot be used (syndicationRate = 0).
 */
const StateLIHTCIntegrationSection: React.FC<StateLIHTCIntegrationSectionProps> = ({
  stateLIHTCIntegration,
  formatCurrency = (v) => `$${v.toFixed(2)}M`
}) => {
  if (!stateLIHTCIntegration) {
    return null;
  }

  const {
    creditPath,
    syndicationRate,
    grossCredit,
    netProceeds,
    totalCreditBenefit,
    treatment,
    warnings
  } = stateLIHTCIntegration;

  // Format credit path display
  const getCreditPathDisplay = (): string => {
    switch (creditPath) {
      case 'syndicated':
        return 'Syndicated';
      case 'direct_use':
        return 'Direct Use';
      case 'none':
        return 'Not Available';
      default:
        return 'Unknown';
    }
  };

  // IMPL-045, IMPL-073: Format treatment display with accurate labels
  const getTreatmentDisplay = (): string => {
    switch (treatment) {
      case 'capital_stack':
        return 'Capital Return (Syndicated)';  // IMPL-073: Proceeds are cash return, not equity offset
      case 'tax_benefit':
        return 'Added to Tax Benefits';
      case 'none':
        return 'No Benefit';
      default:
        return 'Unknown';
    }
  };

  // Get net value based on path
  const getNetValue = (): number => {
    if (creditPath === 'direct_use') {
      return totalCreditBenefit;
    } else if (creditPath === 'syndicated') {
      return netProceeds;
    }
    return 0;
  };

  // Warning state when credits cannot be used
  if (creditPath === 'none') {
    return (
      <CollapsibleSection title="State LIHTC Analysis">
        <div style={{
          background: 'rgba(255, 193, 7, 0.15)',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            State LIHTC Credits Not Available
          </div>
          <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Out-of-state investor has no tax liability in the property state.
            State LIHTC credits cannot be syndicated or used directly.
          </div>
          {warnings.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {warnings.map((w, i) => (
                <div key={i}>- {w}</div>
              ))}
            </div>
          )}
        </div>
        <div className="hdc-result-row">
          <span className="hdc-result-label">Gross Credits:</span>
          <span className="hdc-result-value">{formatCurrency(grossCredit)}</span>
        </div>
        <div className="hdc-result-row">
          <span className="hdc-result-label">Syndication Rate:</span>
          <span className="hdc-result-value">0%</span>
        </div>
        <div className="hdc-result-row">
          <span className="hdc-result-label">Net Value:</span>
          <span className="hdc-result-value hdc-value-negative">$0</span>
        </div>
        <div className="hdc-result-row">
          <span className="hdc-result-label">Credit Path:</span>
          <span className="hdc-result-value">Not Available</span>
        </div>
        <div className="hdc-result-row">
          <span className="hdc-result-label">Treatment:</span>
          <span className="hdc-result-value">No Benefit</span>
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="State LIHTC Analysis">
      <div className="hdc-result-row">
        <span className="hdc-result-label">Gross Credits:</span>
        <span className="hdc-result-value">{formatCurrency(grossCredit)}</span>
      </div>
      <div className="hdc-result-row">
        <span className="hdc-result-label">Syndication Rate:</span>
        <span className="hdc-result-value">
          {(syndicationRate * 100).toFixed(0)}%
          {creditPath === 'direct_use' && (
            <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '4px' }}>
              (Direct Use)
            </span>
          )}
        </span>
      </div>
      <div className="hdc-result-row">
        <span className="hdc-result-label">Net Value:</span>
        <span className="hdc-result-value hdc-value-positive">
          {formatCurrency(getNetValue())}
        </span>
      </div>
      <div className="hdc-result-row">
        <span className="hdc-result-label">Credit Path:</span>
        <span className="hdc-result-value" style={{
          color: creditPath === 'direct_use' ? 'var(--hdc-gold)' : 'var(--hdc-faded-jade)'
        }}>
          {getCreditPathDisplay()}
        </span>
      </div>
      <div className="hdc-result-row summary">
        <span className="hdc-result-label">Treatment:</span>
        <span className="hdc-result-value" style={{
          color: treatment === 'tax_benefit' ? 'var(--hdc-gold)' : 'var(--hdc-faded-jade)'
        }}>
          {getTreatmentDisplay()}
        </span>
      </div>

      {/* Warnings if any */}
      {warnings.length > 0 && (
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px dashed var(--hdc-faded-jade)',
          fontSize: '0.75rem',
          color: '#666'
        }}>
          {warnings.map((w, i) => (
            <div key={i}>Note: {w}</div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
};

export default StateLIHTCIntegrationSection;
