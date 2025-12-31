import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { HDCCheckbox } from './shared/HDCCheckbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface CapitalStructureSectionProps {
  calculatedCashFlows?: any; // Optional calculated cash flows
  autoBalanceCapital: boolean;
  setAutoBalanceCapital: (value: boolean) => void;
  investorEquityRatio: number;
  setInvestorEquityRatio: (value: number) => void;
  investorEquityPct: number;
  setInvestorEquityPct: (value: number) => void;
  philanthropicEquityPct: number;
  setPhilanthropicEquityPct: (value: number) => void;
  seniorDebtPct: number;
  setSeniorDebtPct: (value: number) => void;
  seniorDebtRate: number;
  setSeniorDebtRate: (value: number) => void;
  seniorDebtAmortization: number;
  setSeniorDebtAmortization: (value: number) => void;
  seniorDebtIOYears: number;
  setSeniorDebtIOYears: (value: number) => void;
  philDebtPct: number;
  setPhilDebtPct: (value: number) => void;
  philDebtRate: number;
  setPhilDebtRate: (value: number) => void;
  philDebtAmortization: number;
  setPhilDebtAmortization: (value: number) => void;
  philCurrentPayEnabled: boolean;
  setPhilCurrentPayEnabled: (value: boolean) => void;
  philCurrentPayPct: number;
  setPhilCurrentPayPct: (value: number) => void;
  hdcSubDebtPct: number;
  setHdcSubDebtPct: (value: number) => void;
  hdcSubDebtPikRate: number;
  setHdcSubDebtPikRate: (value: number) => void;
  pikCurrentPayEnabled: boolean;
  setPikCurrentPayEnabled: (value: boolean) => void;
  pikCurrentPayPct: number;
  setPikCurrentPayPct: (value: number) => void;
  investorSubDebtPct: number;
  setInvestorSubDebtPct: (value: number) => void;
  investorSubDebtPikRate: number;
  setInvestorSubDebtPikRate: (value: number) => void;
  investorPikCurrentPayEnabled: boolean;
  setInvestorPikCurrentPayEnabled: (value: boolean) => void;
  investorPikCurrentPayPct: number;
  setInvestorPikCurrentPayPct: (value: number) => void;
  outsideInvestorSubDebtPct: number;
  setOutsideInvestorSubDebtPct: (value: number) => void;
  outsideInvestorSubDebtPikRate: number;
  setOutsideInvestorSubDebtPikRate: (value: number) => void;
  outsideInvestorPikCurrentPayEnabled: boolean;
  setOutsideInvestorPikCurrentPayEnabled: (value: boolean) => void;
  outsideInvestorPikCurrentPayPct: number;
  setOutsideInvestorPikCurrentPayPct: (value: number) => void;
  handlePercentageChange: (setter: (value: number) => void, value: number) => void;
  formatCurrency: (value: number) => string;
  projectCost: number;
  predevelopmentCosts: number;
  totalCapitalStructure: number;
  interestReserveEnabled: boolean;
  interestReserveAmount: number;
  subDebtPriority?: {
    outsideInvestor: number;
    hdc: number;
    investor: number;
  };
  setSubDebtPriority?: (value: {
    outsideInvestor: number;
    hdc: number;
    investor: number;
  }) => void;
  hdcPlatformMode?: 'traditional' | 'leverage';
  setHdcPlatformMode?: (value: 'traditional' | 'leverage') => void;
  calculatedInvestorEquity?: number; // Actual investor equity from calculation engine
  isReadOnly?: boolean;
  // IMPL-020a: Pre-calculated effective project cost from engine (single source of truth)
  effectiveProjectCost?: number;
}

const CapitalStructureSection: React.FC<CapitalStructureSectionProps> = ({
  calculatedCashFlows,
  calculatedInvestorEquity,
  autoBalanceCapital,
  setAutoBalanceCapital,
  investorEquityRatio,
  setInvestorEquityRatio,
  investorEquityPct,
  setInvestorEquityPct,
  philanthropicEquityPct,
  setPhilanthropicEquityPct,
  seniorDebtPct,
  setSeniorDebtPct,
  seniorDebtRate,
  setSeniorDebtRate,
  seniorDebtAmortization,
  setSeniorDebtAmortization,
  seniorDebtIOYears,
  setSeniorDebtIOYears,
  philDebtPct,
  setPhilDebtPct,
  philDebtRate,
  setPhilDebtRate,
  philDebtAmortization,
  setPhilDebtAmortization,
  philCurrentPayEnabled,
  setPhilCurrentPayEnabled,
  philCurrentPayPct,
  setPhilCurrentPayPct,
  hdcSubDebtPct,
  setHdcSubDebtPct,
  hdcSubDebtPikRate,
  setHdcSubDebtPikRate,
  pikCurrentPayEnabled,
  setPikCurrentPayEnabled,
  pikCurrentPayPct,
  setPikCurrentPayPct,
  investorSubDebtPct,
  setInvestorSubDebtPct,
  investorSubDebtPikRate,
  setInvestorSubDebtPikRate,
  investorPikCurrentPayEnabled,
  setInvestorPikCurrentPayEnabled,
  investorPikCurrentPayPct,
  setInvestorPikCurrentPayPct,
  outsideInvestorSubDebtPct,
  setOutsideInvestorSubDebtPct,
  outsideInvestorSubDebtPikRate,
  setOutsideInvestorSubDebtPikRate,
  outsideInvestorPikCurrentPayEnabled,
  setOutsideInvestorPikCurrentPayEnabled,
  outsideInvestorPikCurrentPayPct,
  setOutsideInvestorPikCurrentPayPct,
  handlePercentageChange,
  formatCurrency,
  projectCost,
  predevelopmentCosts,
  totalCapitalStructure,
  interestReserveEnabled,
  interestReserveAmount,
  subDebtPriority = { outsideInvestor: 1, hdc: 2, investor: 3 },
  setSubDebtPriority,
  hdcPlatformMode,
  setHdcPlatformMode,
  isReadOnly = false,
  // IMPL-020a: Pre-calculated effective project cost from engine
  effectiveProjectCost: propsEffectiveProjectCost
}) => {
  // IMPL-020a: Use pre-calculated value from engine, fall back to local calc for backwards compatibility
  const effectiveProjectCost = propsEffectiveProjectCost ?? (projectCost + predevelopmentCosts + (interestReserveEnabled ? interestReserveAmount : 0));
  return (
    <div className="hdc-calculator">
      <div className="hdc-section">    
        <h3 className="hdc-section-header">Capital Structure</h3>
        <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginBottom: '0.5rem' }}>
          Percentages apply to Total Project Cost from Basic Inputs
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem', fontWeight: 600 }}>
          Total Project Cost: {formatCurrency(effectiveProjectCost)}
          {interestReserveEnabled && (
            <span style={{ fontSize: '0.7rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
              (includes {formatCurrency(interestReserveAmount)} interest reserve)
            </span>
          )}
        </div>
        
        <div className="hdc-input-group">
          <HDCCheckbox
            checked={autoBalanceCapital}
            onCheckedChange={setAutoBalanceCapital}
            disabled={isReadOnly}
            label="Auto-balance equity when debt changes"
          />
        </div>    
        
        {autoBalanceCapital && (
          <div className="hdc-input-group">
            <label className="hdc-input-label">Investor Equity Share (%)</label>
            <Slider
              disabled={isReadOnly}
              min={0}
              max={100}
              step={1}
              value={[investorEquityRatio]}
              onValueChange={(vals) => handlePercentageChange(setInvestorEquityRatio, vals[0])}
            />
            <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)'}}>
              {investorEquityRatio}% to investor, {100 - investorEquityRatio}% to philanthropic
            </div>
          </div>
        )}    
        
        <div className="space-y-4">    
          {/* Investor Equity */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Investor Equity (%) {investorEquityPct > 0 && (calculatedInvestorEquity != null ? `(${formatCurrency(calculatedInvestorEquity)})` : `(${formatCurrency(effectiveProjectCost * investorEquityPct / 100)})`)}</label>    
            <Input
              type="number"
              disabled={isReadOnly || autoBalanceCapital}
              step="0.5"
              value={investorEquityPct}
              onChange={(e) => handlePercentageChange(setInvestorEquityPct, Number(e.target.value) || 0)}
              className={cn("hdc-input", autoBalanceCapital && "bg-gray-100")}
            />    
          </div>    
          
          {/* Philanthropic Equity */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Philanthropic Equity (%) {philanthropicEquityPct > 0 && `(${formatCurrency(effectiveProjectCost * philanthropicEquityPct / 100)})`}</label>    
            <Input
              type="number"
              disabled={isReadOnly || autoBalanceCapital}
              step="0.5"
              value={philanthropicEquityPct}
              onChange={(e) => handlePercentageChange(setPhilanthropicEquityPct, Number(e.target.value) || 0)}
              className={cn("hdc-input", autoBalanceCapital && "bg-gray-100")}
            />    
          </div>    
          
          {/* Senior Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Senior Debt (%) {seniorDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * seniorDebtPct / 100)})`}
              {/* Show calculated annual debt service if available */}
              {calculatedCashFlows && calculatedCashFlows[1] && calculatedCashFlows[1].hardDebtService && seniorDebtPct > 0 && (
                <span style={{display: 'block', fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                  Annual Debt Service: {formatCurrency(calculatedCashFlows[1].hardDebtService)}
                </span>
              )}
            </label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={seniorDebtPct}
              onChange={(e) => handlePercentageChange(setSeniorDebtPct, Number(e.target.value) || 0)}
              className="hdc-input"
            />
            {seniorDebtPct > 0 && (
              <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Rate (%)</label>
            <Input
                      type="number"
              disabled={isReadOnly}
                      step="0.1"
                      value={seniorDebtRate}
                      onChange={(e) => setSeniorDebtRate(Number(e.target.value) || 0)}
                      className="hdc-input" style={{fontSize: '0.75rem'}}
                    />
                  </div>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Amortization</label>
                    <Select
                      value={seniorDebtAmortization.toString()}
                      onValueChange={(value) => setSeniorDebtAmortization(Number(value))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input" style={{fontSize: '0.75rem'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Years</SelectItem>
                        <SelectItem value="20">20 Years</SelectItem>
                        <SelectItem value="25">25 Years</SelectItem>
                        <SelectItem value="30">30 Years</SelectItem>
                        <SelectItem value="35">35 Years</SelectItem>
                        <SelectItem value="40">40 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>
                      Interest-Only Years
                      <span style={{ fontSize: '0.65rem', color: '#666', display: 'block', fontWeight: 'normal', marginTop: '0.125rem' }}>
                        IO period starts at placed in service
                      </span>
                    </label>
                    <Select
                      value={seniorDebtIOYears.toString()}
                      onValueChange={(value) => setSeniorDebtIOYears(Number(value))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input" style={{fontSize: '0.75rem'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None (Full P&I)</SelectItem>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="2">2 Years</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="4">4 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                        <SelectItem value="6">6 Years</SelectItem>
                        <SelectItem value="7">7 Years</SelectItem>
                        <SelectItem value="8">8 Years</SelectItem>
                        <SelectItem value="9">9 Years</SelectItem>
                        <SelectItem value="10">10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                    {seniorDebtIOYears > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--hdc-pale-mint)',
                        borderRadius: '4px',
                        fontSize: '0.7rem'
                      }}>
                        <strong>Interest-Only Period: {seniorDebtIOYears} year{seniorDebtIOYears > 1 ? 's' : ''}</strong>
                        <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem', fontSize: '0.65rem' }}>
                          <li>Lower payments during IO period</li>
                          <li>No principal paydown during IO</li>
                          <li>P&I amortization begins Year {seniorDebtIOYears + 1}</li>
                          <li>Reduces interest reserve requirement</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>    
          
          {/* Philanthropic Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Philanthropic Debt (%) {philDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * philDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={philDebtPct}
              onChange={(e) => handlePercentageChange(setPhilDebtPct, Number(e.target.value) || 0)}
              className="hdc-input"
            />
            {philDebtPct > 0 && (
              <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Rate (%)</label>
            <Input
                      type="number"
              disabled={isReadOnly}
                      step="0.1"
                      value={philDebtRate}
                      onChange={(e) => setPhilDebtRate(Number(e.target.value) || 0)}
                      className="hdc-input" style={{fontSize: '0.75rem'}}
                    />
                  </div>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Amortization</label>
                    <Select
                      value={philDebtAmortization.toString()}
                      onValueChange={(value) => setPhilDebtAmortization(Number(value))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input" style={{fontSize: '0.75rem'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Years</SelectItem>
                        <SelectItem value="20">20 Years</SelectItem>
                        <SelectItem value="25">25 Years</SelectItem>
                        <SelectItem value="30">30 Years</SelectItem>
                        <SelectItem value="35">35 Years</SelectItem>
                        <SelectItem value="40">40 Years</SelectItem>
                        <SelectItem value="60">60 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Current Pay Option */}
                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="flex items-center justify-between">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-faded-jade)'}}>Current Pay</label>
                    <HDCCheckbox
                      checked={philCurrentPayEnabled}
                      onCheckedChange={setPhilCurrentPayEnabled}
                      disabled={isReadOnly}
                    />
                  </div>
                  {philCurrentPayEnabled && (
                    <div className="mt-2">
                      <Slider
                        disabled={isReadOnly}
                        min={0}
                        max={100}
                        step={5}
                        value={[philCurrentPayPct]}
                        onValueChange={(vals) => setPhilCurrentPayPct(vals[0])}
                      />
                      <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-faded-jade)', marginTop: '0.25rem'}}>
                        {philCurrentPayPct}% current pay, {100 - philCurrentPayPct}% deferred
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sub-Debt Payment Priority Configuration */}
          {(outsideInvestorPikCurrentPayEnabled || pikCurrentPayEnabled || investorPikCurrentPayEnabled) && (
            outsideInvestorSubDebtPct > 0 || hdcSubDebtPct > 0 || investorSubDebtPct > 0
          ) && setSubDebtPriority && (() => {
            // Count active sub-debts
            const activeSubDebts = [
              outsideInvestorSubDebtPct > 0 && outsideInvestorPikCurrentPayEnabled,
              hdcSubDebtPct > 0 && pikCurrentPayEnabled,
              investorSubDebtPct > 0 && investorPikCurrentPayEnabled
            ].filter(Boolean).length;

            if (activeSubDebts < 2) return null; // No priority needed with only one sub-debt

            return (
              <div className="hdc-input-group" style={{marginTop: '1.5rem', marginBottom: '1.5rem'}}>
                <label className="hdc-input-label" style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
                  Sub-Debt Payment Priority (Soft Pay Waterfall)
                </label>
                <div style={{fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem'}}>
                  Configure the payment order for sub-debts when cash is available after hard debt service.
                  Each active sub-debt must have a unique priority.
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem'}}>
                  {outsideInvestorSubDebtPct > 0 && outsideInvestorPikCurrentPayEnabled && (
                    <div>
                      <label className="hdc-input-label" style={{fontSize: '0.85rem'}}>Outside Investor Priority</label>
                      <Select
                        value={subDebtPriority.outsideInvestor.toString()}
                        onValueChange={(value) => {
                          const newPriority = Number(value);
                          const updatedPriority = { ...subDebtPriority };

                          // Find which sub-debt currently has this priority and swap
                          Object.keys(updatedPriority).forEach(key => {
                            const k = key as keyof typeof updatedPriority;
                            if (updatedPriority[k] === newPriority && k !== 'outsideInvestor') {
                              // Only swap if this sub-debt is active
                              if (k === 'hdc' && hdcSubDebtPct > 0 && pikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.outsideInvestor;
                              } else if (k === 'investor' && investorSubDebtPct > 0 && investorPikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.outsideInvestor;
                              }
                            }
                          });

                          updatedPriority.outsideInvestor = newPriority;
                          setSubDebtPriority(updatedPriority);
                        }}
                      >
                        <SelectTrigger className="hdc-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSubDebts >= 1 && <SelectItem value="1">1st (Highest)</SelectItem>}
                          {activeSubDebts >= 2 && <SelectItem value="2">2nd</SelectItem>}
                          {activeSubDebts >= 3 && <SelectItem value="3">3rd (Lowest)</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                    <div>
                      <label className="hdc-input-label" style={{fontSize: '0.85rem'}}>HDC Priority</label>
                      <Select
                        value={subDebtPriority.hdc.toString()}
                        onValueChange={(value) => {
                          const newPriority = Number(value);
                          const updatedPriority = { ...subDebtPriority };

                          // Find which sub-debt currently has this priority and swap
                          Object.keys(updatedPriority).forEach(key => {
                            const k = key as keyof typeof updatedPriority;
                            if (updatedPriority[k] === newPriority && k !== 'hdc') {
                              // Only swap if this sub-debt is active
                              if (k === 'outsideInvestor' && outsideInvestorSubDebtPct > 0 && outsideInvestorPikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.hdc;
                              } else if (k === 'investor' && investorSubDebtPct > 0 && investorPikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.hdc;
                              }
                            }
                          });

                          updatedPriority.hdc = newPriority;
                          setSubDebtPriority(updatedPriority);
                        }}
                      >
                        <SelectTrigger className="hdc-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSubDebts >= 1 && <SelectItem value="1">1st (Highest)</SelectItem>}
                          {activeSubDebts >= 2 && <SelectItem value="2">2nd</SelectItem>}
                          {activeSubDebts >= 3 && <SelectItem value="3">3rd (Lowest)</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
                    <div>
                      <label className="hdc-input-label" style={{fontSize: '0.85rem'}}>Investor Priority</label>
                      <Select
                        value={subDebtPriority.investor.toString()}
                        onValueChange={(value) => {
                          const newPriority = Number(value);
                          const updatedPriority = { ...subDebtPriority };

                          // Find which sub-debt currently has this priority and swap
                          Object.keys(updatedPriority).forEach(key => {
                            const k = key as keyof typeof updatedPriority;
                            if (updatedPriority[k] === newPriority && k !== 'investor') {
                              // Only swap if this sub-debt is active
                              if (k === 'outsideInvestor' && outsideInvestorSubDebtPct > 0 && outsideInvestorPikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.investor;
                              } else if (k === 'hdc' && hdcSubDebtPct > 0 && pikCurrentPayEnabled) {
                                updatedPriority[k] = subDebtPriority.investor;
                              }
                            }
                          });

                          updatedPriority.investor = newPriority;
                          setSubDebtPriority(updatedPriority);
                        }}
                      >
                        <SelectTrigger className="hdc-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSubDebts >= 1 && <SelectItem value="1">1st (Highest)</SelectItem>}
                          {activeSubDebts >= 2 && <SelectItem value="2">2nd</SelectItem>}
                          {activeSubDebts >= 3 && <SelectItem value="3">3rd (Lowest)</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* HDC Platform Mode Toggle */}
          <div className="hdc-input-group" style={{marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)'}}>
            <HDCCheckbox
              checked={hdcPlatformMode === 'leverage'}
              onCheckedChange={(checked) => setHdcPlatformMode?.(checked ? 'leverage' : 'traditional')}
              disabled={isReadOnly}
              label="HDC Platform Mode (Outside Investor = HDC Debt Fund)"
              labelClassName="text-sm font-semibold"
            />
            {hdcPlatformMode === 'leverage' && (
              <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem', paddingLeft: '1.5rem'}}>
                ✓ Outside Investor debt represents HDC Debt Fund gap financing
              </div>
            )}
          </div>

          {/* Outside Investor Sub-Debt - Relabeled as HDC Debt Fund when platform mode is on */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              {hdcPlatformMode ? 'HDC Debt Fund (Gap Financing)' : 'Outside Investor Sub-Debt'} (%) {outsideInvestorSubDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * outsideInvestorSubDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={outsideInvestorSubDebtPct}
              onChange={(e) => handlePercentageChange(setOutsideInvestorSubDebtPct, Number(e.target.value) || 0)}
              className="hdc-input"
            />
            {outsideInvestorSubDebtPct > 0 && (
              <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>PIK Interest Rate (%)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={0}
                    max={20}
                    step={0.5}
                    value={[outsideInvestorSubDebtPikRate]}
                    onValueChange={(vals) => setOutsideInvestorSubDebtPikRate(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    {outsideInvestorSubDebtPikRate}% annual interest on {formatCurrency(effectiveProjectCost * (outsideInvestorSubDebtPct / 100))}
                    {/* Show calculated amounts from engine if available */}
                    {calculatedCashFlows && calculatedCashFlows[1] && (
                      <>
                        <br/>
                        <span style={{fontWeight: 600}}>
                          Year 2 Interest: {formatCurrency((calculatedCashFlows[1].outsideInvestorCurrentPay || 0) + (calculatedCashFlows[1].outsideInvestorPIKAccrued || 0))}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="flex items-center justify-between">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Current Pay</label>
                    <HDCCheckbox
                      checked={outsideInvestorPikCurrentPayEnabled}
                      onCheckedChange={setOutsideInvestorPikCurrentPayEnabled}
                      disabled={isReadOnly}
                    />
                  </div>
                  {outsideInvestorPikCurrentPayEnabled && (
                    <div className="mt-2">
                      <Slider
                        disabled={isReadOnly}
                        min={0}
                        max={100}
                        step={5}
                        value={[outsideInvestorPikCurrentPayPct]}
                        onValueChange={(vals) => setOutsideInvestorPikCurrentPayPct(vals[0])}
                      />
                      <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                        {outsideInvestorPikCurrentPayPct}% paid to outside investor, {100 - outsideInvestorPikCurrentPayPct}% compounds as PIK
                        {/* Show actual calculated amounts from engine */}
                        {calculatedCashFlows && calculatedCashFlows[1] && (
                          <>
                            <br/>
                            <span style={{fontWeight: 600}}>Year 2 Current Pay: {formatCurrency(calculatedCashFlows[1].outsideInvestorCurrentPay || 0)}</span>
                            <br/>
                            <span style={{fontWeight: 600}}>Year 2 PIK Accrual: {formatCurrency(calculatedCashFlows[1].outsideInvestorPIKAccrued || 0)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* HDC Sub-Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">HDC Sub-Debt (%) {hdcSubDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * hdcSubDebtPct / 100)})`}</label>    
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={hdcSubDebtPct === 1 ? "1.0" : hdcSubDebtPct}    
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                if (val === 1) {
                  console.log('HDC Sub-debt onChange: value is exactly 1');
                }
                handlePercentageChange(setHdcSubDebtPct, val);
              }}    
              className="hdc-input"    
            />
            {hdcSubDebtPct > 0 && (
              <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>PIK Interest Rate (%)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={0}
                    max={20}
                    step={0.5}
                    value={[hdcSubDebtPikRate]}
                    onValueChange={(vals) => setHdcSubDebtPikRate(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    {hdcSubDebtPikRate}% annual interest on {formatCurrency(effectiveProjectCost * (hdcSubDebtPct / 100))}
                  </div>
                </div>

                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="flex items-center justify-between">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Current Pay</label>
                    <HDCCheckbox
                      checked={pikCurrentPayEnabled}
                      onCheckedChange={setPikCurrentPayEnabled}
                      disabled={isReadOnly}
                    />
                  </div>
                  {pikCurrentPayEnabled && (
                    <div className="mt-2">
                      <Slider
                        disabled={isReadOnly}
                        min={0}
                        max={100}
                        step={5}
                        value={[pikCurrentPayPct]}
                        onValueChange={(vals) => setPikCurrentPayPct(vals[0])}
                      />
                      <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                        {pikCurrentPayPct}% paid by investor, {100 - pikCurrentPayPct}% compounds as PIK
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Investor Sub-Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Investor Sub-Debt (%) {investorSubDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * investorSubDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={investorSubDebtPct}
              onChange={(e) => handlePercentageChange(setInvestorSubDebtPct, Number(e.target.value) || 0)}
              className="hdc-input"
            />
            {investorSubDebtPct > 0 && (
              <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>PIK Interest Rate (%)</label>
                  <Slider
                    disabled={isReadOnly}
                    min={0}
                    max={20}
                    step={0.5}
                    value={[investorSubDebtPikRate]}
                    onValueChange={(vals) => setInvestorSubDebtPikRate(vals[0])}
                  />
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                    {investorSubDebtPikRate}% annual interest on {formatCurrency(effectiveProjectCost * (investorSubDebtPct / 100))}
                    {/* Show calculated amounts from engine if available */}
                    {calculatedCashFlows && calculatedCashFlows[1] && (
                      <>
                        <br/>
                        <span style={{fontWeight: 600}}>
                          Year 2 Interest: {formatCurrency((calculatedCashFlows[1].investorSubDebtInterestReceived || 0) + (calculatedCashFlows[1].investorSubDebtPIKAccrued || 0))}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="flex items-center justify-between">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Current Pay</label>
                    <HDCCheckbox
                      checked={investorPikCurrentPayEnabled}
                      onCheckedChange={setInvestorPikCurrentPayEnabled}
                      disabled={isReadOnly}
                    />
                  </div>
                  {investorPikCurrentPayEnabled && (
                    <div className="mt-2">
                      <Slider
                        disabled={isReadOnly}
                        min={0}
                        max={100}
                        step={5}
                        value={[investorPikCurrentPayPct]}
                        onValueChange={(vals) => setInvestorPikCurrentPayPct(vals[0])}
                      />
                      <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                        {investorPikCurrentPayPct}% paid to investor, {100 - investorPikCurrentPayPct}% compounds as PIK
                        {/* Show actual calculated amounts from engine */}
                        {calculatedCashFlows && calculatedCashFlows[1] && (
                          <>
                            <br/>
                            <span style={{fontWeight: 600}}>Year 2 Current Pay (Income): {formatCurrency(calculatedCashFlows[1].investorSubDebtInterestReceived || 0)}</span>
                            <br/>
                            <span style={{fontWeight: 600}}>Year 2 PIK Accrual: {formatCurrency(calculatedCashFlows[1].investorSubDebtPIKAccrued || 0)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Capital Structure Total */}
        <div className="hdc-result-row summary highlight" style={{marginTop: '1rem'}}>
          <span className="hdc-result-label">Total:</span>
          <span className={`hdc-result-value ${Math.abs(totalCapitalStructure - 100) <= 0.1 ? 'hdc-value-positive' : 'hdc-value-negative'}`}>{totalCapitalStructure.toFixed(1)}%</span>
        </div>
        {Math.abs(totalCapitalStructure - 100) > 0.1 && (
          <div className="hdc-result-label hdc-value-negative" style={{fontSize: '0.7rem', marginTop: '0.5rem'}}>
            Capital structure must total 100%
          </div>
        )}
      </div>
    </div>
  );
};

export default CapitalStructureSection;