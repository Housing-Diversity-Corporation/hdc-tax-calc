/**
 * @deprecated IMPL-015: This component has been replaced by ProjectDefinitionSection.tsx
 * Project cost, land value, NOI, and Property State inputs are now in ProjectDefinitionSection.
 * Depreciation and timing inputs moved to ProjectionsSection.
 * Keep for backward compatibility but do not use in new code.
 */
import React from 'react';
import PresetSelector from './PresetSelector';
import SaveConfiguration, { SaveConfigMetadata } from './SaveConfiguration';
import { calculateInterestReserve } from '../../../utils/taxbenefits/interestReserveCalculation';
import { HDCCheckbox } from './shared/HDCCheckbox';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface BasicInputsSectionProps {
  projectCost: number;
  setProjectCost: (value: number) => void;
  predevelopmentCosts: number;
  setPredevelopmentCosts: (value: number) => void;
  landValue: number;
  setLandValue: (value: number) => void;
  yearOneNOI: number;
  setYearOneNOI: (value: number) => void;
  opexRatio: number;
  setOpexRatio: (value: number) => void;
  yearOneDepreciationPct: number;
  setYearOneDepreciationPct: (value: number) => void;
  interestReserveEnabled: boolean;
  setInterestReserveEnabled: (value: boolean) => void;
  interestReserveMonths: number;
  setInterestReserveMonths: (value: number) => void;
  // For calculating interest reserve amount
  seniorDebtPct: number;
  seniorDebtRate: number;
  seniorDebtAmortization: number;
  seniorDebtIOYears: number;
  philDebtPct: number;
  philDebtRate: number;
  philDebtAmortization: number;
  philCurrentPayEnabled: boolean;
  philCurrentPayPct: number;
  // HDC Sub-Debt properties for interest reserve calculation
  hdcSubDebtPct: number;
  hdcSubDebtPikRate: number;
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  // Investor Sub-Debt properties for interest reserve calculation
  investorSubDebtPct: number;
  investorSubDebtPikRate: number;
  investorPikCurrentPayEnabled: boolean;
  investorPikCurrentPayPct: number;
  // Outside Investor Sub-Debt properties for interest reserve calculation
  outsideInvestorSubDebtPct: number;
  outsideInvestorSubDebtPikRate: number;
  outsideInvestorPikCurrentPayEnabled: boolean;
  outsideInvestorPikCurrentPayPct: number;
  formatCurrency: (value: number) => string;
  onPresetSelect?: (presetId: string) => void;
  onSaveConfiguration?: (configName: string, metadata?: SaveConfigMetadata) => Promise<void>;
  // Timing Parameters
  constructionDelayMonths: number;
  setConstructionDelayMonths: (value: number) => void;
  taxBenefitDelayMonths: number;
  setTaxBenefitDelayMonths: (value: number) => void;
  // Read-only mode
  isReadOnly?: boolean;
}

const BasicInputsSection: React.FC<BasicInputsSectionProps> = ({
  projectCost,
  setProjectCost,
  predevelopmentCosts,
  setPredevelopmentCosts,
  landValue,
  setLandValue,
  yearOneNOI,
  setYearOneNOI,
  opexRatio,
  setOpexRatio,
  yearOneDepreciationPct,
  setYearOneDepreciationPct,
  interestReserveEnabled,
  setInterestReserveEnabled,
  interestReserveMonths,
  setInterestReserveMonths,
  seniorDebtPct,
  seniorDebtRate,
  seniorDebtAmortization,
  seniorDebtIOYears,
  philDebtPct,
  philDebtRate,
  philDebtAmortization,
  philCurrentPayEnabled,
  philCurrentPayPct,
  hdcSubDebtPct,
  hdcSubDebtPikRate,
  pikCurrentPayEnabled,
  pikCurrentPayPct,
  investorSubDebtPct,
  investorSubDebtPikRate,
  investorPikCurrentPayEnabled,
  investorPikCurrentPayPct,
  outsideInvestorSubDebtPct,
  outsideInvestorSubDebtPikRate,
  outsideInvestorPikCurrentPayEnabled,
  outsideInvestorPikCurrentPayPct,
  formatCurrency,
  onPresetSelect,
  onSaveConfiguration,
  constructionDelayMonths,
  setConstructionDelayMonths,
  taxBenefitDelayMonths,
  setTaxBenefitDelayMonths,
  isReadOnly = false,
}) => {
  // Calculate interest reserve amount using shared function (single source of truth)
  const interestReserveAmount = calculateInterestReserve({
    enabled: interestReserveEnabled,
    months: interestReserveMonths,
    projectCost,
    predevelopmentCosts,
    yearOneNOI,
    seniorDebtPct,
    seniorDebtRate,
    seniorDebtAmortization,
    seniorDebtIOYears,
    outsideInvestorSubDebtPct,
    outsideInvestorSubDebtPikRate,
    outsideInvestorPikCurrentPayEnabled,
    outsideInvestorPikCurrentPayPct,
    hdcSubDebtPct: 0, // Not typically in reserve, but pass for completeness
    investorSubDebtPct: 0, // Not typically in reserve, but pass for completeness
  });
  const totalProjectCost = projectCost + predevelopmentCosts + interestReserveAmount;

  // Calculate monthly debt service breakdown for display
  const calculateDebtServiceBreakdown = () => {
    const baseProjectCost = projectCost + predevelopmentCosts;
    const seniorDebtAmount = baseProjectCost * (seniorDebtPct / 100);
    const philDebtAmount = baseProjectCost * (philDebtPct / 100);
    const outsideInvestorSubDebtAmount = baseProjectCost * (outsideInvestorSubDebtPct / 100);

    // Senior debt monthly payment
    const seniorMonthlyRate = seniorDebtRate / 100 / 12;
    const seniorMonths = seniorDebtAmortization * 12;
    const monthlySeniorDebtService = seniorDebtAmount > 0 && seniorMonthlyRate > 0 ?
      seniorDebtAmount * seniorMonthlyRate * Math.pow(1 + seniorMonthlyRate, seniorMonths) /
      (Math.pow(1 + seniorMonthlyRate, seniorMonths) - 1) : 0;

    // Philanthropic debt monthly payment (interest-only, current pay portion only)
    const monthlyPhilDebtService = philCurrentPayEnabled && philDebtAmount > 0 && philDebtRate > 0 ?
      (philDebtAmount * (philDebtRate / 100) * (philCurrentPayPct / 100)) / 12 : 0;

    // Outside Investor Sub-Debt monthly payment (current pay portion only)
    let monthlyOutsideInvestorDebtService = 0;
    if (outsideInvestorSubDebtAmount > 0 && outsideInvestorPikCurrentPayEnabled && outsideInvestorPikCurrentPayPct > 0) {
      const annualInterest = outsideInvestorSubDebtAmount * (outsideInvestorSubDebtPikRate / 100);
      const currentPayPortion = annualInterest * (outsideInvestorPikCurrentPayPct / 100);
      monthlyOutsideInvestorDebtService = currentPayPortion / 12;
    }

    return {
      senior: monthlySeniorDebtService,
      phil: monthlyPhilDebtService,
      outsideInvestor: monthlyOutsideInvestorDebtService,
      total: monthlySeniorDebtService + monthlyPhilDebtService + monthlyOutsideInvestorDebtService
    };
  };

  const debtServiceBreakdown = interestReserveEnabled ? calculateDebtServiceBreakdown() : null;
  return (
    <div className="hdc-calculator">
      <div className="hdc-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem', paddingBottom: '0.375rem', borderBottom: '2px solid var(--hdc-gulf-stream)' }}>
          <h3 className="hdc-section-header" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>Basic Inputs</h3>
          {onSaveConfiguration && (
            <SaveConfiguration
              onSaveConfiguration={onSaveConfiguration}
              buttonStyle="compact"
            />
          )}
        </div>
        
        {/* Preset Selection Section - Only show if not read-only */}
        {!isReadOnly && (
          <div className="preset-selection-wrapper" style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid rgba(127, 189, 69, 0.2)',
          }}>
            <PresetSelector
              onPresetSelect={onPresetSelect}
            />
          </div>
        )}
        
        {/* Project Cost */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Project Cost ($M)</label>
          <Input
            type="number"
            value={projectCost}
            onChange={(e) => setProjectCost(Number(e.target.value) || 0)}
            className="hdc-input"
            disabled={isReadOnly}
          />
        </div>

        {/* Predevelopment Costs */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">
            Predevelopment Costs ($M)
            <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', fontWeight: 'normal', marginTop: '0.25rem' }}>
              Architecture, engineering, permits, etc. (added to depreciable basis)
            </span>
          </label>
          <Input
            type="number"
            step="0.1"
            value={predevelopmentCosts}
            onChange={(e) => setPredevelopmentCosts(Number(e.target.value) || 0)}
            className="hdc-input"
            disabled={isReadOnly}
            placeholder="0"
          />
        </div>

        {/* Interest Reserve */}
        <div className="hdc-input-group">
          <label className="flex items-center" style={{color: 'var(--hdc-cabbage-pont)', fontSize: '0.875rem', fontWeight: 600}}>
            <HDCCheckbox
              checked={interestReserveEnabled}
              onCheckedChange={setInterestReserveEnabled}
              disabled={isReadOnly}
              className="mr-2"
            />
            Include Interest Reserve
            <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '0.5rem', fontWeight: 'normal' }}>
              (Covers debt during construction/lease-up)
            </span>
          </label>
          
          {interestReserveEnabled && (
            <div className="mt-3 p-3 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
              <div className="hdc-input-group">
                <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>
                  Reserve Period (months)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={interestReserveMonths}
                  onChange={(e) => setInterestReserveMonths(Math.min(24, Math.max(1, Number(e.target.value) || 12)))}
                  className="hdc-input"
            disabled={isReadOnly} style={{fontSize: '0.75rem'}}
                />
              </div>
              
              <div className="mt-2">
                <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-faded-jade)'}}>
                  Interest Reserve Amount
                </div>
                <div className="hdc-result-value" style={{fontSize: '0.9rem', fontWeight: 'bold'}}>
                  {formatCurrency(interestReserveAmount)}
                </div>

                {/* Debt Service Breakdown */}
                {debtServiceBreakdown && debtServiceBreakdown.total > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem'
                  }}>
                    <div style={{fontWeight: 600, marginBottom: '0.25rem', color: 'var(--hdc-cabbage-pont)'}}>
                      Monthly Debt Service at Start:
                    </div>
                    {debtServiceBreakdown.senior > 0 && (
                      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.125rem 0'}}>
                        <span>Senior Debt ({seniorDebtPct}% @ {seniorDebtRate}%):</span>
                        <span style={{fontWeight: 500}}>${(debtServiceBreakdown.senior * 1000).toFixed(0)}K/mo</span>
                      </div>
                    )}
                    {debtServiceBreakdown.phil > 0 && (
                      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.125rem 0'}}>
                        <span>Phil Debt ({philDebtPct}% @ {philDebtRate}%, {philCurrentPayPct}% current):</span>
                        <span style={{fontWeight: 500}}>${(debtServiceBreakdown.phil * 1000).toFixed(0)}K/mo</span>
                      </div>
                    )}
                    {debtServiceBreakdown.outsideInvestor > 0 && (
                      <div style={{display: 'flex', justifyContent: 'space-between', padding: '0.125rem 0'}}>
                        <span>Outside Investor ({outsideInvestorSubDebtPct}% @ {outsideInvestorSubDebtPikRate}%, {outsideInvestorPikCurrentPayPct}% current):</span>
                        <span style={{fontWeight: 500}}>${(debtServiceBreakdown.outsideInvestor * 1000).toFixed(0)}K/mo</span>
                      </div>
                    )}
                    <div style={{
                      borderTop: '1px solid var(--hdc-mercury)',
                      marginTop: '0.25rem',
                      paddingTop: '0.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: 600
                    }}>
                      <span>Total Monthly Service:</span>
                      <span>${(debtServiceBreakdown.total * 1000).toFixed(0)}K/mo</span>
                    </div>
                    <div style={{fontSize: '0.6rem', color: '#666', marginTop: '0.25rem'}}>
                      Reserve covers shortfall between debt service and ramping NOI during {interestReserveMonths}-month lease-up
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Total Project Cost */}
        {interestReserveEnabled && (
          <div className="hdc-result-row summary highlight" style={{marginTop: '0.5rem', marginBottom: '0.5rem'}}>
            <span className="hdc-result-label" style={{fontWeight: 700}}>Total Project Cost:</span>
            <span className="hdc-result-value hdc-value-positive" style={{fontWeight: 700}}>
              {formatCurrency(totalProjectCost)}
            </span>
          </div>
        )}

        {/* Construction/Development Timing */}
        <div className="hdc-input-group" style={{marginTop: '1rem'}}>
          <label className="hdc-input-label">
            Construction/Development Period (Months)
            <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', fontWeight: 'normal' }}>
              Time between investment and building placed in service
            </span>
          </label>
          <Input
            type="number"
            min="0"
            max="36"
            step="1"
            value={constructionDelayMonths}
            onChange={(e) => setConstructionDelayMonths(Number(e.target.value))}
            className="hdc-input"
            disabled={isReadOnly}
            placeholder="0"
          />
          {constructionDelayMonths > 0 && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <strong>Construction Period: {constructionDelayMonths} months</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem', fontSize: '0.8rem' }}>
                <li>No rental income (NOI) during construction</li>
                <li>Interest reserve should cover debt payments</li>
                <li>Depreciation starts after placed in service</li>
              </ul>
            </div>
          )}
        </div>

        {/* Tax Loss Realization Timing */}
        <div className="hdc-input-group" style={{marginTop: '1rem'}}>
          <label className="hdc-input-label">
            Tax Loss Realization Delay (Months)
            <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', fontWeight: 'normal' }}>
              Time from investment until investor receives tax benefits
            </span>
          </label>
          <Input
            type="number"
            min="0"
            max="24"
            step="1"
            value={taxBenefitDelayMonths}
            onChange={(e) => setTaxBenefitDelayMonths(Number(e.target.value))}
            className="hdc-input"
            disabled={isReadOnly}
            placeholder="0"
          />
          {taxBenefitDelayMonths > 0 && (
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: '#666',
              fontWeight: 'normal'
            }}>
              <strong>Note:</strong> Tax benefits delayed {taxBenefitDelayMonths} months due to:
              <ul style={{
                margin: '0.25rem 0 0 1rem',
                paddingLeft: '1.25rem',
                listStyleType: 'disc',
                listStylePosition: 'outside'
              }}>
                <li style={{ marginBottom: '0.125rem' }}>K-1 processing time</li>
                <li style={{ marginBottom: '0.125rem' }}>Tax year timing</li>
                <li style={{ marginBottom: '0.125rem' }}>Partnership structure requirements</li>
              </ul>
            </div>
          )}
        </div>

        {/* Land Value */}
        <div className="hdc-input-group">    
          <label className="hdc-input-label">Land Value ($M)</label>    
          <Input    
            type="number"    
            step="0.1"    
            value={landValue}    
            onChange={(e) => setLandValue(Number(e.target.value) || 0)}    
            className="hdc-input"
            disabled={isReadOnly}    
          />    
          <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
            Non-depreciable portion of project cost
          </div>
        </div>

        {/* Stabilized NOI */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Stabilized NOI ($M)</label>    
          <Input    
            type="number"    
            step="0.1"    
            value={yearOneNOI}    
            onChange={(e) => setYearOneNOI(Number(e.target.value) || 0)}    
            className="hdc-input"
            disabled={isReadOnly}    
          />    
        </div>

        {/* Operating Expense Ratio */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Operating Expense Ratio (%)</label>
          <Slider
            disabled={isReadOnly}
            min={10}
            max={80}
            step={5}
            value={[opexRatio]}
            onValueChange={(vals) => setOpexRatio(vals[0])}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
            {opexRatio}% of Year 1 Revenue
          </div>
          <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
            Sets initial operating expenses relative to revenue
          </div>
        </div>

        {/* Depreciation Schedule */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Year 1 Bonus Depreciation (%)</label>
          <Slider
            disabled={isReadOnly}
            min={0}
            max={100}
            step={1}
            value={[yearOneDepreciationPct]}
            onValueChange={(vals) => setYearOneDepreciationPct(vals[0])}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
            {yearOneDepreciationPct}% bonus depreciation in Year 1
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)' }}>
            Remaining {100 - yearOneDepreciationPct}% over 27.5 years straight-line (MACRS)
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInputsSection;