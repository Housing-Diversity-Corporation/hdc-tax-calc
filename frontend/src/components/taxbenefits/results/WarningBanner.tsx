import React from 'react';
import { Warning } from '../../../utils/taxbenefits/warningTypes';
import './WarningsPanel.css';

interface WarningBannerProps {
  warnings: Warning[];
  onDismiss?: (id: string) => void;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ warnings, onDismiss }) => {
  if (!warnings || warnings.length === 0) return null;

  const criticalWarnings = warnings.filter(w => w.severity === 'critical');
  const regularWarnings = warnings.filter(w => w.severity === 'warning');

  return (
    <div style={{marginBottom: '1rem'}}>
      {criticalWarnings.length > 0 && (
        <div className="warning-banner critical">
          <div className="warning-icon">⚠️</div>
          <div>
            <div className="warning-title">Critical Issues ({criticalWarnings.length})</div>
            {criticalWarnings.map(w => (
              <div key={w.id} className="warning-message">{w.message}</div>
            ))}
          </div>
        </div>
      )}

      {regularWarnings.length > 0 && (
        <div className="warning-banner warning">
          <div className="warning-icon">ℹ️</div>
          <div>
            <div className="warning-title">Warnings ({regularWarnings.length})</div>
            {regularWarnings.map(w => (
              <div key={w.id} className="warning-message">
                {w.message}
                {onDismiss && (
                  <button onClick={() => onDismiss(w.id)} className="dismiss-btn">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
