import React from 'react';

interface TaxTimingSectionProps {
  taxBenefitDelayMonths: number;
  setTaxBenefitDelayMonths: (value: number) => void;
  hdcAdvanceFinancing: boolean;
}

const TaxTimingSection: React.FC<TaxTimingSectionProps> = ({
  taxBenefitDelayMonths,
  setTaxBenefitDelayMonths,
  hdcAdvanceFinancing
}) => {
  // Calculate the impact of the delay
  const benefitsStartYear = Math.floor(taxBenefitDelayMonths / 12) + 1;
  const partialYearMonths = taxBenefitDelayMonths > 0 ? (12 - (taxBenefitDelayMonths % 12)) : 12;
  const isPartialYear = taxBenefitDelayMonths % 12 !== 0;

  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">Tax Benefit Timing</h3>

      <div className="hdc-input-group">
        <label className="hdc-input-label">
          Tax Benefit Delay (Months)
          <span className="hdc-tooltip">
            ?
            <span className="hdc-tooltip-text">
              Delay between property acquisition and when tax benefits are realized (0-36 months).
              Property depreciates immediately, but investor may not receive benefits until later.
            </span>
          </span>
        </label>
        <div className="hdc-input-wrapper">
          <input
            type="number"
            min="0"
            max="36"
            step="1"
            value={taxBenefitDelayMonths}
            onChange={(e) => {
              const value = Math.max(0, Math.min(36, Number(e.target.value)));
              setTaxBenefitDelayMonths(value);
            }}
            className="hdc-input"
          />
          <span className="hdc-input-suffix">months</span>
        </div>
      </div>

      {taxBenefitDelayMonths > 0 && (
        <div className="hdc-delay-impact">
          <h4 className="hdc-subsection-header">Delay Impact:</h4>
          <ul className="hdc-impact-list">
            <li>
              <strong>Benefits begin:</strong> Year {benefitsStartYear}
              {isPartialYear && ` (${partialYearMonths} months of benefits)`}
            </li>
            <li>
              <strong>Delay period:</strong> {taxBenefitDelayMonths} months
            </li>
            <li>
              <strong>Impact on IRR:</strong> Reduced due to time value of money
            </li>
          </ul>

          {hdcAdvanceFinancing && (
            <div className="hdc-financing-note">
              <strong>⚡ HDC Advance Financing Active</strong>
              <p>HDC will provide immediate cash to bridge the {taxBenefitDelayMonths}-month delay.</p>
              <p>Additional financing costs will apply based on the delay period.</p>
            </div>
          )}
        </div>
      )}

      {taxBenefitDelayMonths === 0 && (
        <div className="hdc-info-note">
          <p>Tax benefits will be realized immediately in Year 1 (standard timing).</p>
        </div>
      )}
    </div>
  );
};

export default TaxTimingSection;