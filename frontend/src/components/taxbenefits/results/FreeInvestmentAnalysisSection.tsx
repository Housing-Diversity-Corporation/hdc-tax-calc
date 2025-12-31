import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import { DepreciationSchedule } from '../../../utils/taxbenefits/depreciationSchedule';

interface FreeInvestmentAnalysisSectionProps {
  year1TaxBenefit: number;
  hdcFee: number;
  year1NetBenefit: number;
  freeInvestmentHurdle: number;
  formatCurrency: (value: number) => string;
  yearOneDepreciation?: number;
  effectiveTaxRateForDepreciation?: number;
  hdcFeeRate?: number;
  depreciationSchedule?: DepreciationSchedule;
}

const FreeInvestmentAnalysisSection: React.FC<FreeInvestmentAnalysisSectionProps> = ({
  year1TaxBenefit,
  hdcFee,
  year1NetBenefit,
  freeInvestmentHurdle,
  formatCurrency,
  yearOneDepreciation,
  effectiveTaxRateForDepreciation,
  hdcFeeRate,
  depreciationSchedule
}) => {
  const freeInvestmentStatus = year1NetBenefit >= freeInvestmentHurdle ? 'YES' :
                               year1NetBenefit >= freeInvestmentHurdle * 0.75 ? 'PARTIAL' : 'NO';
  const coveragePercent = freeInvestmentHurdle > 0 ? ((year1NetBenefit / freeInvestmentHurdle) * 100).toFixed(0) : 0;

  // Calculate months to free investment using actual depreciation schedule
  const calculateMonthsToFreeInvestment = (): { months: number; display: string } => {
    // If Year 1 benefit covers the entire investment
    if (year1NetBenefit >= freeInvestmentHurdle) {
      // Calculate what fraction of the year it takes
      const monthsNeeded = freeInvestmentHurdle > 0 ? (freeInvestmentHurdle / year1NetBenefit) * 12 : 0;
      return {
        months: Math.ceil(monthsNeeded),
        display: `${Math.ceil(monthsNeeded)}`
      };
    }

    const remainingAfterYear1 = freeInvestmentHurdle - year1NetBenefit;
    if (remainingAfterYear1 <= 0) {
      return { months: 12, display: '12' };
    }

    // Use actual depreciation schedule data if available
    let annualBenefitAfterYear1: number;

    if (depreciationSchedule && depreciationSchedule.annualBenefitAfterYear1) {
      // Use the actual average benefit from years 2+ from the depreciation schedule
      annualBenefitAfterYear1 = depreciationSchedule.annualBenefitAfterYear1;
    } else {
      // Fallback to more accurate estimate based on straight-line depreciation
      // Years 2+ get ~11% of Year 1 benefit (not 20%)
      annualBenefitAfterYear1 = year1NetBenefit * 0.11;
    }

    if (annualBenefitAfterYear1 <= 0) {
      return { months: 999, display: '>120' }; // More than 10 years
    }

    const additionalYearsNeeded = remainingAfterYear1 / annualBenefitAfterYear1;
    const totalMonths = 12 + (additionalYearsNeeded * 12); // 12 months for year 1 + additional months

    if (totalMonths > 120) { // More than 10 years
      return { months: 999, display: '>120' };
    }

    return {
      months: Math.ceil(totalMonths),
      display: `${Math.ceil(totalMonths)}`
    };
  };

  const recoveryTime = calculateMonthsToFreeInvestment();
  
  return (
    <CollapsibleSection title="Free Investment Analysis">
      <div>
        {/* Show calculation breakdown if we have the data */}
        {yearOneDepreciation && effectiveTaxRateForDepreciation && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            border: '1px solid rgba(127, 189, 69, 0.2)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--hdc-faded-jade)' }}>
              Year 1 Tax Benefit Calculation:
            </div>
            <div className="hdc-result-row" style={{ fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <span className="hdc-result-label">Year 1 Depreciation (tax loss):</span>
              <span className="hdc-result-value">{formatCurrency(yearOneDepreciation)}</span>
            </div>
            <div className="hdc-result-row" style={{ fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <span className="hdc-result-label">× Effective Tax Rate:</span>
              <span className="hdc-result-value">{effectiveTaxRateForDepreciation.toFixed(2)}%</span>
            </div>
            <div className="hdc-result-row" style={{
              fontSize: '0.875rem',
              paddingLeft: '1rem',
              borderTop: '1px solid rgba(127, 189, 69, 0.2)',
              paddingTop: '0.25rem',
              marginTop: '0.25rem'
            }}>
              <span className="hdc-result-label" style={{ fontWeight: 600 }}>= Gross Tax Benefit:</span>
              <span className="hdc-result-value" style={{ fontWeight: 600 }}>
                {formatCurrency(year1TaxBenefit)}
              </span>
            </div>
            <div className="hdc-result-row" style={{ fontSize: '0.875rem', paddingLeft: '1rem' }}>
              <span className="hdc-result-label">− HDC Fee ({hdcFeeRate || 10}%):</span>
              <span className="hdc-result-value" style={{ color: 'var(--hdc-strikemaster)' }}>
                ({formatCurrency(hdcFee)})
              </span>
            </div>
            <div className="hdc-result-row" style={{
              fontSize: '0.875rem',
              paddingLeft: '1rem',
              borderTop: '1px solid rgba(127, 189, 69, 0.2)',
              paddingTop: '0.25rem',
              marginTop: '0.25rem'
            }}>
              <span className="hdc-result-label" style={{ fontWeight: 600 }}>= Net to Investor:</span>
              <span className="hdc-result-value hdc-value-positive" style={{ fontWeight: 600 }}>
                {formatCurrency(year1NetBenefit)}
              </span>
            </div>
          </div>
        )}

        <div className="hdc-result-row">
          <span className="hdc-result-label">Year 1 Net Tax Benefit:</span>
          <span className="hdc-result-value hdc-value-positive" style={{
            fontSize: '1.1rem',
            fontWeight: 600
          }}>
            {formatCurrency(year1NetBenefit)}
          </span>
        </div>
        
        <div className="hdc-result-row">
          <span className="hdc-result-label">Investor Equity:</span>
          <span className="hdc-result-value">
            {formatCurrency(freeInvestmentHurdle)}
          </span>
        </div>
        
        <div className="hdc-result-row summary">
          <span className="hdc-result-label">Free Investment Status:</span>
          <span className="hdc-result-value" style={{
            color: freeInvestmentStatus === 'YES' ? 'var(--hdc-brown-rust)' :
                   freeInvestmentStatus === 'PARTIAL' ? 'var(--hdc-cabbage-pont)' : 
                   'var(--hdc-strikemaster)',
            fontWeight: 700
          }}>
            {freeInvestmentStatus}
          </span>
        </div>
        
        <div className="hdc-result-row">
          <span className="hdc-result-label">Year 1 Coverage:</span>
          <span className="hdc-result-value">{coveragePercent}%</span>
        </div>

        {/* NEW: Months to Free Investment */}
        <div className="hdc-result-row" style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--hdc-pale-mint)',
          borderRadius: '4px',
          border: '2px solid var(--hdc-faded-jade)'
        }}>
          <span className="hdc-result-label" style={{ fontWeight: 600 }}>
            Months to Investment Recovery:
          </span>
          <span className="hdc-result-value" style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: recoveryTime.months <= 12 ? 'var(--hdc-brown-rust)' :
                   recoveryTime.months <= 36 ? 'var(--hdc-cabbage-pont)' :
                   recoveryTime.months <= 60 ? 'var(--hdc-faded-jade)' :
                   'var(--hdc-strikemaster)'
          }}>
            {recoveryTime.display === '>120' ? 'Extended (>10 years)' : `${recoveryTime.display} months`}
          </span>
        </div>

        {/* Add insight message */}
        <div style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: recoveryTime.months <= 12 ? 600 : 400,
          color: recoveryTime.months <= 12 ? 'var(--hdc-brown-rust)' :
                 recoveryTime.months <= 36 ? 'var(--hdc-cabbage-pont)' :
                 'var(--hdc-strikemaster)'
        }}>
          {recoveryTime.months <= 12 ?
            `Full investment recovery in ${recoveryTime.display} months - Immediate positive returns` :
           recoveryTime.months <= 36 ?
            `Excellent recovery timeline - Full ownership achieved within ${recoveryTime.display} months` :
           recoveryTime.months <= 60 ?
            'Strong recovery profile - Investment recovered faster than typical real estate' :
            'Consider optimizing capital structure to accelerate recovery timeline'}
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default FreeInvestmentAnalysisSection;