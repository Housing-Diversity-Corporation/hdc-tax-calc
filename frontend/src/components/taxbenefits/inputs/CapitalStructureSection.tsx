import React, { useState } from 'react';
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
  // IMPL-165: Cash sweep percentages
  philSweepPct?: number;
  setPhilSweepPct?: (value: number) => void;
  hdcDebtFundSweepPct?: number;
  setHdcDebtFundSweepPct?: (value: number) => void;
  // IMPL-166: Developer Deferred Fee
  devFeeTotal?: number;
  setDevFeeTotal?: (value: number) => void;
  devFeeClosingAmount?: number;
  setDevFeeClosingAmount?: (value: number) => void;
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
  setInterestReserveEnabled: (value: boolean) => void;
  interestReserveMonths: number;
  setInterestReserveMonths: (value: number) => void;
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
  // Private Activity Bonds (IMPL-080)
  lihtcEnabled?: boolean;
  lihtcEligibleBasis?: number;
  pabEnabled?: boolean;
  setPabEnabled?: (value: boolean) => void;
  pabPctOfEligibleBasis?: number;
  setPabPctOfEligibleBasis?: (value: number) => void;
  pabRate?: number;
  setPabRate?: (value: number) => void;
  pabAmortization?: number;
  setPabAmortization?: (value: number) => void;
  pabIOYears?: number;
  setPabIOYears?: (value: number) => void;
  // HDC Debt Fund (IMPL-082)
  hdcDebtFundPct?: number;
  setHdcDebtFundPct?: (value: number) => void;
  hdcDebtFundPikRate?: number;
  setHdcDebtFundPikRate?: (value: number) => void;
  hdcDebtFundCurrentPayEnabled?: boolean;
  setHdcDebtFundCurrentPayEnabled?: (value: boolean) => void;
  hdcDebtFundCurrentPayPct?: number;
  setHdcDebtFundCurrentPayPct?: (value: number) => void;
  // ISS-040d: Debt editing helpers to prevent PAB adjustment during user input
  startDebtEditing?: () => void;
  endDebtEditing?: () => void;
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
  philSweepPct = 0,
  setPhilSweepPct,
  hdcDebtFundSweepPct = 0,
  setHdcDebtFundSweepPct,
  devFeeTotal = 0,
  setDevFeeTotal,
  devFeeClosingAmount = 0,
  setDevFeeClosingAmount,
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
  setInterestReserveEnabled,
  interestReserveMonths,
  setInterestReserveMonths,
  interestReserveAmount,
  subDebtPriority = { outsideInvestor: 1, hdc: 2, investor: 3 },
  setSubDebtPriority,
  hdcPlatformMode,
  setHdcPlatformMode,
  isReadOnly = false,
  // IMPL-020a: Pre-calculated effective project cost from engine
  effectiveProjectCost: propsEffectiveProjectCost,
  // Private Activity Bonds (IMPL-080)
  lihtcEnabled = false,
  lihtcEligibleBasis = 0,
  pabEnabled = false,
  setPabEnabled,
  pabPctOfEligibleBasis = 30,
  setPabPctOfEligibleBasis,
  pabRate = 4.5,
  setPabRate,
  pabAmortization = 40,
  setPabAmortization,
  pabIOYears = 0,
  setPabIOYears,
  // HDC Debt Fund (IMPL-082)
  hdcDebtFundPct = 0,
  setHdcDebtFundPct,
  hdcDebtFundPikRate = 8,
  setHdcDebtFundPikRate,
  hdcDebtFundCurrentPayEnabled = false,
  setHdcDebtFundCurrentPayEnabled,
  hdcDebtFundCurrentPayPct = 50,
  setHdcDebtFundCurrentPayPct,
  // ISS-040d: Debt editing helpers
  startDebtEditing,
  endDebtEditing
}) => {
  // IMPL-020a: Use pre-calculated value from engine, fall back to local calc for backwards compatibility
  const effectiveProjectCost = propsEffectiveProjectCost ?? (projectCost + predevelopmentCosts + (interestReserveEnabled ? interestReserveAmount : 0));
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <div className="hdc-calculator">
      <div className="hdc-section">
        <h3
          className="hdc-section-header"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              marginRight: '0.5rem',
              fontSize: '0.8rem',
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}>
              ▶
            </span>
            Capital Structure
          </span>
        </h3>
        {isExpanded && (<>
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

        {/* Interest Reserve Toggle and Input */}
        <div className="hdc-input-group" style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
          <HDCCheckbox
            checked={interestReserveEnabled}
            onCheckedChange={setInterestReserveEnabled}
            disabled={isReadOnly}
            label="Include Interest Reserve"
            labelClassName="text-sm font-semibold"
          />
          <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
            Covers debt service during construction/lease-up period
          </div>

          {interestReserveEnabled && (
            <div className="mt-2 p-2 rounded" style={{ border: '1px solid var(--hdc-mercury)', marginLeft: '1.5rem' }}>
              <div className="hdc-input-group">
                <label className="hdc-input-label" style={{ color: 'var(--hdc-cabbage-pont)', fontSize: '0.75rem' }}>
                  Reserve Period (months)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={interestReserveMonths}
                  onChange={(e) => setInterestReserveMonths(Math.min(24, Math.max(1, Number(e.target.value) || 12)))}
                  className="hdc-input"
                  disabled={isReadOnly}
                  style={{ fontSize: '0.75rem' }}
                />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div className="hdc-result-label" style={{ fontSize: '0.7rem', color: 'var(--hdc-faded-jade)' }}>
                  Calculated Reserve Amount
                </div>
                <div className="hdc-result-value" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {formatCurrency(interestReserveAmount)}
                </div>
                <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '0.25rem' }}>
                  Reserve covers shortfall between debt service and ramping NOI using S-curve methodology
                </div>
              </div>
            </div>
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
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setInvestorEquityPct, val);
              }}
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
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setPhilanthropicEquityPct, val);
              }}
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
              onFocus={() => startDebtEditing?.()}
              onBlur={() => endDebtEditing?.()}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setSeniorDebtPct, val);
              }}
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
                      onChange={(e) => {
                        const val = e.target.valueAsNumber;
                        if (!isNaN(val)) setSeniorDebtRate(val);
                      }}
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

          {/* Private Activity Bonds (IMPL-080) - Visible when LIHTC enabled */}
          {lihtcEnabled && (
            <div className="hdc-input-group">
              <div className="flex items-center justify-between">
                <label className="hdc-input-label">Private Activity Bonds (PAB)</label>
                <HDCCheckbox
                  checked={pabEnabled}
                  onCheckedChange={(checked) => setPabEnabled?.(checked)}
                  disabled={isReadOnly}
                />
              </div>
              {pabEnabled && lihtcEligibleBasis > 0 && (
                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem'}}>
                    PAB Amount = LIHTC Eligible Basis × PAB %
                  </div>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>PAB % of Eligible Basis</label>
                    <Slider
                      disabled={isReadOnly}
                      min={25}
                      max={55}
                      step={1}
                      value={[pabPctOfEligibleBasis]}
                      onValueChange={(vals) => setPabPctOfEligibleBasis?.(vals[0])}
                    />
                    <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                      {pabPctOfEligibleBasis}% × {formatCurrency(lihtcEligibleBasis)} = <strong>{formatCurrency(lihtcEligibleBasis * pabPctOfEligibleBasis / 100)}</strong>
                    </div>
                    <div className="hdc-result-label" style={{fontSize: '0.65rem', color: '#888', marginTop: '0.25rem'}}>
                      4% LIHTC requires 50%+ PAB financing of aggregate basis
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="hdc-input-group">
                      <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Rate (%)</label>
                      <Input
                        type="number"
                        disabled={isReadOnly}
                        step="0.1"
                        value={pabRate}
                        onChange={(e) => {
                          const val = e.target.valueAsNumber;
                          if (!isNaN(val)) setPabRate?.(val);
                        }}
                        className="hdc-input" style={{fontSize: '0.75rem'}}
                      />
                    </div>
                    <div className="hdc-input-group">
                      <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Amortization</label>
                      <Select
                        value={pabAmortization.toString()}
                        onValueChange={(value) => setPabAmortization?.(Number(value))}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="hdc-input" style={{fontSize: '0.75rem'}}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 Years</SelectItem>
                          <SelectItem value="35">35 Years</SelectItem>
                          <SelectItem value="40">40 Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="hdc-input-group mt-2">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Interest-Only Years</label>
                    <Select
                      value={pabIOYears.toString()}
                      onValueChange={(value) => setPabIOYears?.(Number(value))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="hdc-input" style={{fontSize: '0.75rem'}}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="2">2 Years</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {pabEnabled && !(lihtcEligibleBasis > 0) && (
                <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-gold)', marginTop: '0.25rem'}}>
                  ⚠ Set project cost and land value in Basic Inputs to calculate eligible basis
                </div>
              )}
            </div>
          )}

          {/* Philanthropic Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">Philanthropic Debt (%) {philDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * philDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={philDebtPct}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setPhilDebtPct, val);
              }}
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
                      onChange={(e) => {
                        const val = e.target.valueAsNumber;
                        if (!isNaN(val)) setPhilDebtRate(val);
                      }}
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

            {/* IMPL-165: Phil Debt Cash Sweep */}
            {philDebtPct > 0 && setPhilSweepPct && (
              <div style={{marginTop: '0.5rem'}}>
                <div className="flex items-center justify-between">
                  <label className="hdc-input-label" style={{color: 'var(--hdc-faded-jade)'}}>Cash Sweep (%)</label>
                </div>
                <Slider
                  disabled={isReadOnly}
                  min={0}
                  max={100}
                  step={5}
                  value={[philSweepPct]}
                  onValueChange={(vals) => setPhilSweepPct(vals[0])}
                />
                <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-faded-jade)', marginTop: '0.25rem'}}>
                  {philSweepPct}% of CADS surplus swept to phil debt principal
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

          {/* HDC Platform Mode Toggle (IMPL-082) */}
          <div className="hdc-input-group" style={{marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)'}}>
            <HDCCheckbox
              checked={hdcPlatformMode === 'leverage'}
              onCheckedChange={(checked) => setHdcPlatformMode?.(checked ? 'leverage' : 'traditional')}
              disabled={isReadOnly}
              label="HDC Platform Mode"
              labelClassName="text-sm font-semibold"
            />
            {hdcPlatformMode === 'leverage' && (
              <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem', paddingLeft: '1.5rem'}}>
                ✓ Enables HDC Debt Fund as separate gap financing layer
              </div>
            )}
          </div>

          {/* Outside Investor Sub-Debt (IMPL-082: No longer relabeled) */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">
              Outside Investor Sub-Debt (%) {outsideInvestorSubDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * outsideInvestorSubDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={outsideInvestorSubDebtPct}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setOutsideInvestorSubDebtPct, val);
              }}
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

          {/* HDC Debt Fund (IMPL-082) - Separate from Outside Investor, visible in leverage mode */}
          {hdcPlatformMode === 'leverage' && (
            <div className="hdc-input-group">
              <label className="hdc-input-label">
                HDC Debt Fund (Gap Financing) (%) {hdcDebtFundPct > 0 && `(${formatCurrency(effectiveProjectCost * hdcDebtFundPct / 100)})`}
              </label>
              <Input
                type="number"
                disabled={isReadOnly}
                step="0.5"
                value={hdcDebtFundPct}
                onChange={(e) => {
                  const val = e.target.valueAsNumber;
                  if (!isNaN(val)) setHdcDebtFundPct?.(val);
                }}
                className="hdc-input"
              />
              {hdcDebtFundPct > 0 && (
                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>PIK Interest Rate (%)</label>
                    <Slider
                      disabled={isReadOnly}
                      min={0}
                      max={20}
                      step={0.5}
                      value={[hdcDebtFundPikRate]}
                      onValueChange={(vals) => setHdcDebtFundPikRate?.(vals[0])}
                    />
                    <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                      {hdcDebtFundPikRate}% annual interest on {formatCurrency(effectiveProjectCost * (hdcDebtFundPct / 100))}
                      {calculatedCashFlows && calculatedCashFlows[1] && (
                        <>
                          <br/>
                          <span style={{fontWeight: 600}}>
                            Year 2 Interest: {formatCurrency((calculatedCashFlows[1].hdcDebtFundCurrentPay || 0) + (calculatedCashFlows[1].hdcDebtFundPIKAccrued || 0))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                    <div className="flex items-center justify-between">
                      <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Current Pay</label>
                      <HDCCheckbox
                        checked={hdcDebtFundCurrentPayEnabled}
                        onCheckedChange={(checked) => setHdcDebtFundCurrentPayEnabled?.(checked)}
                        disabled={isReadOnly}
                      />
                    </div>
                    {hdcDebtFundCurrentPayEnabled && (
                      <div className="mt-2">
                        <Slider
                          disabled={isReadOnly}
                          min={0}
                          max={100}
                          step={5}
                          value={[hdcDebtFundCurrentPayPct]}
                          onValueChange={(vals) => setHdcDebtFundCurrentPayPct?.(vals[0])}
                        />
                        <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                          {hdcDebtFundCurrentPayPct}% paid currently, {100 - hdcDebtFundCurrentPayPct}% compounds as PIK
                          {calculatedCashFlows && calculatedCashFlows[1] && (
                            <>
                              <br/>
                              <span style={{fontWeight: 600}}>Year 2 Current Pay: {formatCurrency(calculatedCashFlows[1].hdcDebtFundCurrentPay || 0)}</span>
                              <br/>
                              <span style={{fontWeight: 600}}>Year 2 PIK Accrual: {formatCurrency(calculatedCashFlows[1].hdcDebtFundPIKAccrued || 0)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* IMPL-165: DDF Cash Sweep */}
                  {setHdcDebtFundSweepPct && (
                    <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                      <label className="hdc-input-label" style={{color: 'var(--hdc-cabbage-pont)'}}>Cash Sweep (%)</label>
                      <Slider
                        disabled={isReadOnly}
                        min={0}
                        max={100}
                        step={5}
                        value={[hdcDebtFundSweepPct]}
                        onValueChange={(vals) => setHdcDebtFundSweepPct(vals[0])}
                      />
                      <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
                        {hdcDebtFundSweepPct}% of CADS surplus swept to DDF principal
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* IMPL-166: Developer Deferred Fee (C Note) */}
          {setDevFeeTotal && (
            <div className="hdc-input-group">
              <label className="hdc-input-label">
                Developer Fee — Total ($M)
              </label>
              <Input
                type="number"
                disabled={isReadOnly}
                step="0.1"
                value={devFeeTotal}
                onChange={(e) => {
                  const val = e.target.valueAsNumber;
                  if (!isNaN(val)) setDevFeeTotal(Math.max(0, val));
                }}
                className="hdc-input"
              />
              {devFeeTotal > 0 && setDevFeeClosingAmount && (
                <div className="mt-2 p-2 rounded" style={{border: '1px solid var(--hdc-mercury)'}}>
                  <div className="hdc-input-group">
                    <label className="hdc-input-label" style={{color: 'var(--hdc-faded-jade)'}}>Closing Piece ($M)</label>
                    <Input
                      type="number"
                      disabled={isReadOnly}
                      step="0.1"
                      value={devFeeClosingAmount}
                      onChange={(e) => {
                        const val = e.target.valueAsNumber;
                        if (!isNaN(val)) setDevFeeClosingAmount(Math.max(0, Math.min(val, devFeeTotal)));
                      }}
                      className="hdc-input"
                    />
                    <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-faded-jade)', marginTop: '0.25rem'}}>
                      Deferred balance: {formatCurrency(devFeeTotal - Math.min(devFeeClosingAmount, devFeeTotal))} (no interest, paid from surplus)
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HDC Sub-Debt */}
          <div className="hdc-input-group">
            <label className="hdc-input-label">HDC Sub-Debt (%) {hdcSubDebtPct > 0 && `(${formatCurrency(effectiveProjectCost * hdcSubDebtPct / 100)})`}</label>
            <Input
              type="number"
              disabled={isReadOnly}
              step="0.5"
              value={hdcSubDebtPct === 1 ? "1.0" : hdcSubDebtPct}
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (isNaN(val)) return;
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
              onChange={(e) => {
                const val = e.target.valueAsNumber;
                if (!isNaN(val)) handlePercentageChange(setInvestorSubDebtPct, val);
              }}
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
        </>)}
      </div>
    </div>
  );
};

export default CapitalStructureSection;