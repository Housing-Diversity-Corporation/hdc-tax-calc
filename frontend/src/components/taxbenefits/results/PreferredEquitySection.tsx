import React from 'react';
import { PreferredEquityResult } from '../../../utils/taxbenefits/preferredEquityCalculations';

interface PreferredEquitySectionProps {
  result: PreferredEquityResult | null;
  formatCurrency: (value: number) => string;
}

export const PreferredEquitySection: React.FC<PreferredEquitySectionProps> = ({ result, formatCurrency }) => {
  if (!result || result.principal === 0) return null;

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">Preferred Equity Returns</h3>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Principal Invested:</span>
        <span className="hdc-result-value">{formatCurrency(result.principal)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Target Amount (@ {result.metadata.targetMOIC}x):</span>
        <span className="hdc-result-value">{formatCurrency(result.targetAmount)}</span>
      </div>

      <div className="hdc-result-row summary highlight">
        <span className="hdc-result-label">Payment at Exit:</span>
        <span className="hdc-result-value hdc-value-positive">{formatCurrency(result.paymentAtExit)}</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Achieved MOIC:</span>
        <span className="hdc-result-value">{result.achievedMOIC.toFixed(2)}x</span>
      </div>

      <div className="hdc-result-row">
        <span className="hdc-result-label">Achieved IRR:</span>
        <span className="hdc-result-value">{result.achievedIRR.toFixed(2)}%</span>
      </div>

      {!result.targetAchieved && (
        <div className="warning-box" style={{marginTop: '0.5rem'}}>
          <strong>Shortfall:</strong> {formatCurrency(result.dollarShortfall)}
          ({result.moicShortfall.toFixed(2)}x below target)
        </div>
      )}
    </div>
  );
};
