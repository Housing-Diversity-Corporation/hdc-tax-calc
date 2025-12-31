import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface ExpandableDetailsSectionProps {
  taxCalculationExpanded: boolean;
  setTaxCalculationExpanded: (value: boolean) => void;
  depreciationScheduleExpanded: boolean;
  setDepreciationScheduleExpanded: (value: boolean) => void;
  total10YearDepreciation: number;
  totalTaxBenefit: number;
  hdcFee: number;
  totalNetTaxBenefits: number;
  effectiveTaxRateForDepreciation: number;
  yearOneDepreciation: number;
  annualStraightLineDepreciation: number;
  years2to10Depreciation: number;
  yearOneDepreciationPct: number;
  projectCost: number;
  formatCurrency: (value: number) => string;
}

const ExpandableDetailsSection: React.FC<ExpandableDetailsSectionProps> = ({
  taxCalculationExpanded,
  setTaxCalculationExpanded,
  depreciationScheduleExpanded,
  setDepreciationScheduleExpanded,
  total10YearDepreciation,
  totalTaxBenefit,
  hdcFee,
  totalNetTaxBenefits,
  effectiveTaxRateForDepreciation,
  yearOneDepreciation,
  annualStraightLineDepreciation,
  years2to10Depreciation,
  yearOneDepreciationPct,
  projectCost,
  formatCurrency
}) => {

  return (
    <div className="hdc-calculator">
      {/* Tax Calculation Details */}
      <div className="hdc-section">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setTaxCalculationExpanded(!taxCalculationExpanded)}
          style={{ marginBottom: taxCalculationExpanded ? '1rem' : 0, alignItems: 'center' }}
        >
          <h3 className="hdc-section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            10-Year Tax Benefit Summary
          </h3>
          <span style={{ color: 'var(--hdc-faded-jade)', fontSize: '1.2rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
            {taxCalculationExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {taxCalculationExpanded && (
          <div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Total Depreciation (10-Year):</span>
              <span className="hdc-result-value">{formatCurrency(total10YearDepreciation)}</span>
            </div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Effective Tax Rate:</span>
              <span className="hdc-result-value">{effectiveTaxRateForDepreciation.toFixed(1)}%</span>
            </div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Total Gross Tax Benefit (10-Year):</span>
              <span className="hdc-result-value">{formatCurrency(totalTaxBenefit)}</span>
            </div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Less: Total HDC Fees (10-Year):</span>
              <span className="hdc-result-value hdc-value-negative">({formatCurrency(hdcFee)})</span>
            </div>
            <div className="hdc-result-row summary">
              <span className="hdc-result-label">Total Net Tax Benefit (10-Year):</span>
              <span className="hdc-result-value hdc-value-positive">{formatCurrency(totalNetTaxBenefits)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Year Depreciation Schedule */}
      <div className="hdc-section">
        <div 
          className="flex items-center justify-between cursor-pointer" 
          onClick={() => setDepreciationScheduleExpanded(!depreciationScheduleExpanded)}
          style={{ marginBottom: depreciationScheduleExpanded ? '1rem' : 0, alignItems: 'center' }}
        >
          <h3 className="hdc-section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
            Multi-Year Depreciation Schedule
          </h3>
          <span style={{ color: 'var(--hdc-faded-jade)', fontSize: '1.2rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
            {depreciationScheduleExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {depreciationScheduleExpanded && (
          <div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Year 1 ({yearOneDepreciationPct}% bonus):</span>
              <span className="hdc-result-value">{formatCurrency(yearOneDepreciation)}</span>
            </div>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Years 2-10 (straight-line):</span>
              <span className="hdc-result-value">{formatCurrency(years2to10Depreciation)}</span>
            </div>
            <div className="hdc-result-row summary">
              <span className="hdc-result-label">Total 10-Year:</span>
              <span className="hdc-result-value hdc-value-positive">{formatCurrency(total10YearDepreciation)}</span>
            </div>
            
            <div style={{ marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)' }}>
              Base: {formatCurrency(projectCost)} | Annual: {formatCurrency(annualStraightLineDepreciation)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableDetailsSection;