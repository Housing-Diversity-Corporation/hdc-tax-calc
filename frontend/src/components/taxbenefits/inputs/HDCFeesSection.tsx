import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { HDCCheckbox } from './shared/HDCCheckbox';
import { Slider } from '../../ui/slider';

interface HDCFeesSectionProps {
  investorPromoteShare: number;
  setInvestorPromoteShare: (value: number) => void;
  hdcFeeRate: number;
  setHdcFeeRate: (value: number) => void;
  hdcDeferredInterestRate: number;
  setHdcDeferredInterestRate: (value: number) => void;
  aumFeeEnabled: boolean;
  setAumFeeEnabled: (value: boolean) => void;
  aumFeeRate: number;
  setAumFeeRate: (value: number) => void;
  aumCurrentPayEnabled: boolean;
  setAumCurrentPayEnabled: (value: boolean) => void;
  aumCurrentPayPct: number;
  setAumCurrentPayPct: (value: number) => void;
  hdcAdvanceFinancing: boolean;
  setHdcAdvanceFinancing: (value: boolean) => void;
  taxAdvanceDiscountRate: number;
  setTaxAdvanceDiscountRate: (value: number) => void;
  advanceFinancingRate: number;
  setAdvanceFinancingRate: (value: number) => void;
  taxDeliveryMonths: number;
  setTaxDeliveryMonths: (value: number) => void;
  formatCurrency: (value: number) => string;
  projectCost: number;
  isReadOnly?: boolean;
}

const HDCFeesSection: React.FC<HDCFeesSectionProps> = ({
  investorPromoteShare,
  setInvestorPromoteShare,
  hdcFeeRate,
  setHdcFeeRate,
  hdcDeferredInterestRate,
  setHdcDeferredInterestRate,
  aumFeeEnabled,
  setAumFeeEnabled,
  aumFeeRate,
  setAumFeeRate,
  aumCurrentPayEnabled,
  setAumCurrentPayEnabled,
  aumCurrentPayPct,
  setAumCurrentPayPct,
  hdcAdvanceFinancing,
  setHdcAdvanceFinancing,
  taxAdvanceDiscountRate,
  setTaxAdvanceDiscountRate,
  advanceFinancingRate,
  setAdvanceFinancingRate,
  taxDeliveryMonths,
  setTaxDeliveryMonths,
  formatCurrency,
  projectCost,
  isReadOnly = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded since it's an input section

  return (
    <div className="hdc-calculator">
      {/* Combined HDC Income Section */}
      <div className="hdc-section">
        <h3
          className="hdc-section-header"
          style={{ cursor: 'pointer', position: 'relative' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          HDC Income
        </h3>

        {isExpanded && (
          <>
        {/* Fee Structure Subsection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>Fee Structure</h4>

          {/* HDC Carried Interest */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">HDC Carried Interest (%)</label>
            <Slider
              disabled={isReadOnly}
              min={0}
              max={100}
              step={5}
              value={[100 - investorPromoteShare]}
              onValueChange={(vals) => setInvestorPromoteShare(100 - vals[0])}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
              <span className="hdc-result-label">{100 - investorPromoteShare}% HDC</span>
              <span className="hdc-result-label">{investorPromoteShare}% Investor</span>
            </div>
          </div>

          {/* HDC Fee Rate - REMOVED per IMPL-7.0-014 (fee no longer part of business model) */}

          {/* HDC Deferred Fee Interest Rate */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Deferred Fee Interest Rate (%)</label>
            <Slider
              disabled={isReadOnly}
              min={0}
              max={15}
              step={0.5}
              value={[hdcDeferredInterestRate]}
              onValueChange={(vals) => setHdcDeferredInterestRate(vals[0])}
            />
            <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
              {hdcDeferredInterestRate}% - Interest charged on deferred HDC fees when DSCR covenant requires deferral
            </div>
          </div>
        </div>

        {/* AUM Fee Subsection */}
        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>AUM Fee (Years 2-10)</h4>

          <div className="hdc-input-group">
            <HDCCheckbox
              checked={aumFeeEnabled}
              onCheckedChange={setAumFeeEnabled}
              label="HDC charges AUM fee in years 2-10 (preserves free investment test)"
              disabled={isReadOnly}
            />
          </div>

          {aumFeeEnabled && (
            <div className="mt-4 p-3 rounded" style={{border: '1px solid var(--hdc-mercury)', borderLeft: '4px solid var(--hdc-faded-jade)'}}>
              <div className="hdc-input-group">
                <label className="hdc-input-label">AUM Fee Rate (% of Project Cost)</label>
                <Slider
                  disabled={isReadOnly}
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={[aumFeeRate]}
                  onValueChange={(vals) => setAumFeeRate(vals[0])}
                />
                <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                  {aumFeeRate.toFixed(1)}% annually ({formatCurrency(projectCost * aumFeeRate / 100)}/year)
                </div>
              </div>

              {/* Current Pay Option for AUM Fee */}
              <div className="hdc-input-group" style={{marginTop: '1rem'}}>
                <HDCCheckbox
                  checked={aumCurrentPayEnabled}
                  onCheckedChange={setAumCurrentPayEnabled}
                  label="Enable Current Pay for AUM Fee"
                  disabled={isReadOnly}
                />
              </div>

              {aumCurrentPayEnabled && (
                <div className="hdc-input-group">
                  <label className="hdc-input-label">AUM Current Pay Portion (%)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={0}
                    max={100}
                    step={10}
                    value={[aumCurrentPayPct]}
                    onValueChange={(vals) => setAumCurrentPayPct(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    {aumCurrentPayPct}% paid currently when cash available, {100 - aumCurrentPayPct}% deferred
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 rounded" style={{border: '1px solid var(--hdc-faded-jade)'}}>
                <div className="hdc-result-label" style={{fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem'}}>AUM Fee Structure:</div>
                <div className="space-y-1">
                  <div className="hdc-result-label">• Year 1: No AUM fee (preserves free investment status)</div>
                  <div className="hdc-result-label">• Years 2-10: {aumFeeRate.toFixed(1)}% of ${projectCost}M project annually</div>
                  {aumCurrentPayEnabled && (
                    <>
                      <div className="hdc-result-label">• Current Pay: {aumCurrentPayPct}% paid when cash available</div>
                      <div className="hdc-result-label">• Deferred: {100 - aumCurrentPayPct}% accrues at {hdcDeferredInterestRate}% interest</div>
                    </>
                  )}
                  <div className="hdc-result-label">• 9-year total: {formatCurrency(projectCost * aumFeeRate / 100 * 9)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tax Advance Financing Subsection */}
        <div style={{ borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>Tax Advance Financing</h4>

          <div className="hdc-input-group">
            <HDCCheckbox
              checked={hdcAdvanceFinancing}
              onCheckedChange={setHdcAdvanceFinancing}
              label="HDC provides upfront tax benefit financing"
              disabled={isReadOnly}
            />
          </div>

          {hdcAdvanceFinancing && (
            <div className="mt-4 p-3 rounded" style={{border: '1px solid var(--hdc-mercury)', borderLeft: '4px solid var(--hdc-faded-jade)'}}>
              <div className="space-y-4">
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Advance Fee Rate (%)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={10}
                    max={35}
                    step={1}
                    value={[taxAdvanceDiscountRate]}
                    onValueChange={(vals) => setTaxAdvanceDiscountRate(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    HDC charges {taxAdvanceDiscountRate}% fee for providing upfront financing
                  </div>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">HDC Financing Rate (%)</label>
                  <input
                    type="number"
              disabled={isReadOnly}
                    step="0.5"
                    min="5"
                    max="15"
                    value={advanceFinancingRate}
                    onChange={(e) => setAdvanceFinancingRate(Number(e.target.value) || 8)}
                    className="hdc-input"
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    Cost of capital for HDC to advance funds
                  </div>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">Tax Delivery (Months)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={6}
                    max={24}
                    step={3}
                    value={[taxDeliveryMonths]}
                    onValueChange={(vals) => setTaxDeliveryMonths(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    {taxDeliveryMonths} months until tax benefits realized
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HDCFeesSection;