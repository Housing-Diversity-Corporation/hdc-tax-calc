import React, { useState, useEffect } from 'react';
import { PropertyPreset } from '../../utils/taxbenefits/propertyPresets';
import '../../styles/taxbenefits/hdcCalculator.css';
import { calculatorService, CalculatorConfiguration } from '../../services/calculatorService';
import { useTheme } from '../../contexts/ThemeContext';
import { propertyPresetService } from '../../services/api';
import { transformPresetsFromBackend } from '../../utils/propertyPresetTransform';

interface TaxStrategyResults {
  // Investment
  investmentAmount: number;
  projectName: string;

  // Tax Benefits
  yearOneTaxBenefit: number;
  hdcFee: number;
  netTaxBenefit: number;

  // Free Investment Analysis
  freeInvestmentAmount: number;
  freeInvestmentPercent: number;

  // Excess Planning Capacity
  excessPlanningCapacity: number;

  // Additional metrics
  effectiveTaxRate: number;
  taxSavingsRate: number;
  requiredInvestmentForShelter: number;
}

const TaxStrategyAnalyzer: React.FC = () => {
  // Use global theme
  const { isDarkMode: darkMode } = useTheme();

  // Strategy choice
  const [strategyMode, setStrategyMode] = useState<'invest' | 'shelter'>('invest');
  const [targetAmount, setTargetAmount] = useState<number>(1000000);

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('7324-mlk');

  // Tax situation
  const [annualIncome, setAnnualIncome] = useState<number>(750000);
  const [filingStatus, setFilingStatus] = useState<'single' | 'married'>('married');
  const [state, setState] = useState<string>('CA');

  // Saved configurations
  const [savedConfigs, setSavedConfigs] = useState<CalculatorConfiguration[]>([]);

  // Results
  const [results, setResults] = useState<TaxStrategyResults | null>(null);

  // Property presets from backend
  const [availableProjects, setAvailableProjects] = useState<PropertyPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState<boolean>(true);

  // Fetch property presets from backend
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        setLoadingPresets(true);
        const backendPresets = await propertyPresetService.getAllActivePresets();
        const transformedPresets = transformPresetsFromBackend(backendPresets);
        setAvailableProjects(transformedPresets);

        // Set default project if available
        if (transformedPresets.length > 0 && !selectedProjectId) {
          setSelectedProjectId(transformedPresets[0].id);
        }
      } catch (error) {
        console.error("Error fetching property presets:", error);
        // Fallback to empty array on error
        setAvailableProjects([]);
      } finally {
        setLoadingPresets(false);
      }
    };
    fetchPresets();
  }, []);

  // Fetch saved configurations
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const configs = await calculatorService.getConfigurations();
        setSavedConfigs(configs);
      } catch (error) {
        console.error("Error fetching configurations:", error);
      }
    };
    fetchConfigs();
  }, []);

  useEffect(() => {
    calculateStrategy();
  }, [strategyMode, targetAmount, selectedProjectId, annualIncome, filingStatus, state]);

  const handleSavedConfigChange = (configId: string) => {
    const selectedConfig = savedConfigs.find(c => c.id?.toString() === configId);
    if (selectedConfig) {
      setAnnualIncome(selectedConfig.federalTaxRate * 20000); // Approximate annual income
      setState(selectedConfig.selectedState);

      // Attempt to find a matching preset based on the configuration name.
      // This is an assumption and might need to be adjusted.
      const matchingPreset = availableProjects.find(p => p.name === selectedConfig.configurationName);
      if (matchingPreset) {
        setSelectedProjectId(matchingPreset.id);
      }
    }
  };

  const calculateStrategy = () => {
    const project = availableProjects.find(p => p.id === selectedProjectId);
    if (!project) return;

    const federalRate = getFederalTaxRate(annualIncome, filingStatus);
    const stateRate = getStateTaxRate(state);
    const effectiveTaxRate = federalRate + stateRate;

    const projectCostInDollars = project.values.projectCost * 1000000;
    const maxEquityPercent = project.values.investorEquityPct;
    const maxEquityAmount = projectCostInDollars * (maxEquityPercent / 100);

    if (strategyMode === 'invest') {
      const requestedInvestment = targetAmount;
      const actualInvestment = Math.min(requestedInvestment, maxEquityAmount);
      const investorShareOfEquity = actualInvestment / maxEquityAmount;

      const depreciableBase = (projectCostInDollars - (project.values.landValue * 1000000)) * investorShareOfEquity;
      const yearOneDepreciation = depreciableBase * (project.values.yearOneDepreciationPct / 100);
      const yearOneTaxBenefit = yearOneDepreciation * (effectiveTaxRate / 100);
      const hdcFee = yearOneTaxBenefit * (project.values.hdcFeeRate / 100);
      const netTaxBenefit = yearOneTaxBenefit - hdcFee;

      const freeInvestmentAmount = Math.min(netTaxBenefit, actualInvestment);
      const freeInvestmentPercent = (netTaxBenefit / actualInvestment) * 100;
      const excessPlanningCapacity = Math.max(0, netTaxBenefit - actualInvestment);

      setResults({
        investmentAmount: actualInvestment,
        projectName: project.name,
        yearOneTaxBenefit,
        hdcFee,
        netTaxBenefit,
        freeInvestmentAmount,
        freeInvestmentPercent,
        excessPlanningCapacity,
        effectiveTaxRate,
        taxSavingsRate: (netTaxBenefit / actualInvestment) * 100,
        requiredInvestmentForShelter: 0,
      });

    } else {
      const targetTaxShelter = targetAmount;
      const effectiveTaxRateForShelter = federalRate + stateRate;

      const grossTaxBenefit = targetTaxShelter / (1 - project.values.hdcFeeRate / 100);
      const requiredDepreciation = grossTaxBenefit / (effectiveTaxRateForShelter / 100);

      const depreciableRatio = (project.values.projectCost - project.values.landValue) / project.values.projectCost;
      const requiredInvestment = requiredDepreciation / (project.values.yearOneDepreciationPct / 100) / depreciableRatio;

      const actualInvestment = Math.min(requiredInvestment, maxEquityAmount);
      const investorShareOfEquity = actualInvestment / maxEquityAmount;

      const depreciableBase = (projectCostInDollars - (project.values.landValue * 1000000)) * investorShareOfEquity;
      const yearOneDepreciationAlt = depreciableBase * (project.values.yearOneDepreciationPct / 100);
      const yearOneTaxBenefitAlt = yearOneDepreciationAlt * (effectiveTaxRateForShelter / 100);
      const hdcFeeAlt = yearOneTaxBenefitAlt * (project.values.hdcFeeRate / 100);
      const netTaxBenefitAlt = yearOneTaxBenefitAlt - hdcFeeAlt;

      setResults({
        investmentAmount: actualInvestment,
        projectName: project.name,
        yearOneTaxBenefit: yearOneTaxBenefitAlt,
        hdcFee: hdcFeeAlt,
        netTaxBenefit: netTaxBenefitAlt,
        freeInvestmentAmount: Math.min(netTaxBenefitAlt, actualInvestment),
        freeInvestmentPercent: (Math.min(netTaxBenefitAlt, actualInvestment) / actualInvestment) * 100,
        excessPlanningCapacity: Math.max(0, netTaxBenefitAlt - actualInvestment),
        effectiveTaxRate: effectiveTaxRateForShelter,
        taxSavingsRate: (netTaxBenefitAlt / actualInvestment) * 100,
        requiredInvestmentForShelter: requiredInvestment,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Show loading state
  if (loadingPresets) {
    return (
      <div className="hdc-calculator-container"
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <div style={{ padding: '4rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Loading investment opportunities...</div>
          <div style={{ color: '#666' }}>Please wait while we fetch the latest data</div>
        </div>
      </div>
    );
  }

  // Show error state if no projects available
  if (availableProjects.length === 0) {
    return (
      <div className="hdc-calculator-container"
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <div style={{ padding: '4rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#d32f2f' }}>
            No investment opportunities available
          </div>
          <div style={{ color: '#666' }}>
            Please contact your administrator or try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hdc-calculator-container"
      style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <div className="hdc-calculator-main">
        <div className="hdc-header">
          <h1 className="hdc-title">HDC Tax Strategy Analyzer</h1>
          <p className="hdc-subtitle">
            Calculate your tax benefits from affordable housing investments
          </p>
        </div>

        <div className="hdc-content">
          <div className="hdc-calculator">
            {/* Step 1: Choose Your Strategy */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Step 1: What's Your Goal?</h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                  className={`hdc-strategy-button ${strategyMode === 'invest' ? 'active' : ''}`}
                  onClick={() => setStrategyMode('invest')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: '2px solid var(--hdc-cabbage-pont)',
                    borderRadius: '8px',
                    background: darkMode ?  (strategyMode === 'shelter' ? 'var(--hdc-cabbage-pont)' : '#7fbd45') : (strategyMode === 'shelter' ? 'white' : 'var(--hdc-cabbage-pont)') ,
                    color: darkMode ? (strategyMode === 'shelter' ? 'white' : 'black') : (strategyMode === 'shelter' ? 'black' : 'white'),
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  I want to invest a specific amount
                </button>
                <button
                  className={`hdc-strategy-button ${strategyMode === 'shelter' ? 'active' : ''}`}
                  onClick={() => setStrategyMode('shelter')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    border: '2px solid var(--hdc-cabbage-pont)',
                    borderRadius: '8px',
                    background: darkMode ? (strategyMode === 'shelter' ? '#7fbd45' : 'var(--hdc-cabbage-pont)') : (strategyMode === 'shelter' ? 'var(--hdc-cabbage-pont)' : 'white'),
                    color: darkMode ? (strategyMode === 'shelter' ? 'black' : 'white') : (strategyMode === 'shelter' ? 'white' : 'black'),
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  I want to shelter a specific tax amount
                </button>
              </div>
              <div className="hdc-input-group">
                <label className="hdc-input-label">
                  {strategyMode === 'invest' ? 'Investment Amount' : 'Tax Amount to Shelter'}
                </label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  step="100000"
                  className="hdc-input"
                  style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--hdc-slate)', marginTop: '0.5rem' }}>
                  {strategyMode === 'invest'
                    ? 'How much capital do you want to invest?'
                    : 'How much tax do you want to offset in Year 1?'}
                </div>
              </div>
            </div>

            {/* Step 2: Your Tax Situation */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Step 2: Your Tax Situation</h3>
              <div className="hdc-input-row">
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Annual Income</label>
                  <input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    className="hdc-input"
                  />
                </div>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Filing Status</label>
                  <select
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value as 'single' | 'married')}
                    className="hdc-input"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married Filing Jointly</option>
                  </select>
                </div>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="hdc-input"
                  >
                    <option value="CA">California (13.3%)</option>
                    <option value="NY">New York (10.9%)</option>
                    <option value="TX">Texas (0%)</option>
                    <option value="FL">Florida (0%)</option>
                    <option value="IL">Illinois (4.95%)</option>
                    <option value="PA">Pennsylvania (3.07%)</option>
                    <option value="WA">Washington (0%)</option>
                    <option value="MA">Massachusetts (5%)</option>
                  </select>
                </div>
              </div>
              <div className="hdc-result-row" style={{ marginTop: '1rem', background: 'var(--hdc-athens-gray)', padding: '0.75rem', borderRadius: '6px' }}>
                <span className="hdc-result-label">Your Effective Tax Rate:</span>
                <span className="hdc-result-value" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--hdc-jungle-green)' }}>
                  {formatPercent(getFederalTaxRate(annualIncome, filingStatus) + getStateTaxRate(state))}
                </span>
              </div>
            </div>

            {/* Step 3: Select Your Project */}
            <div className="hdc-section">
              <h3 className="hdc-section-header">Step 3: Select Your Project</h3>
              <div className="hdc-section">
                <h3 className="hdc-section-header">Choose a Preset Project</h3>
                <div className="hdc-input-group">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="hdc-input"
                  >
                    {availableProjects.map(preset => {
                      const projectCost = preset.values.projectCost;
                      const noi = preset.values.yearOneNOI;
                      const depreciation = preset.values.yearOneDepreciationPct;

                      return (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} (Project cost: ${projectCost}M, NOI: ${noi}M, Dep: {depreciation}%)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              {savedConfigs.length > 0 && (
                  <div className="hdc-section">
                    <h3 className="hdc-section-header">Load Saved Configuration</h3>
                    <div className="hdc-input-group">
                      <select
                        onChange={(e) => handleSavedConfigChange(e.target.value)}
                        className="hdc-input"
                      >
                        <option value="">Select a saved configuration</option>
                        {savedConfigs.map(config => {
                          return (
                            <option key={config.id} value={config.id}>
                              {config.configurationName} (Project: ${config.projectCost}M, NOI: ${config.yearOneNOI}M, Dep: {config.yearOneDepreciationPct}%)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}
            </div>

            {/* Results Section */}
            {results && (
              <>
                <div className="hdc-result-section" style={{
                  background: 'rgba(127, 189, 69, 0.1)',
                  border: '2px solid var(--hdc-cabbage-pont)',
                  color: darkMode ? 'white' : 'black',
                  padding: '2rem',
                  borderRadius: '12px',
                  marginTop: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--hdc-jungle-green)' }}>
                    Your Tax Strategy Results
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--hdc-slate)', marginBottom: '0.5rem' }}>
                        Investment Required
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold'}}>
                        {formatCurrency(results.investmentAmount)}
                      </div>
                      {strategyMode === 'shelter' && results.requiredInvestmentForShelter > results.investmentAmount && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--hdc-slate)', marginTop: '0.5rem' }}>
                          (Capped at 20% of project)
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--hdc-slate)', marginBottom: '0.5rem' }}>
                        Year 1 Tax Benefit
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--hdc-jungle-green)' }}>
                        {formatCurrency(results.netTaxBenefit)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--hdc-slate)', marginTop: '0.5rem' }}>
                        After HDC fee of {formatCurrency(results.hdcFee)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--hdc-slate)', marginBottom: '0.5rem' }}>
                        Return on Investment
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--hdc-jungle-green)' }}>
                        {formatPercent(results.taxSavingsRate)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--hdc-slate)', marginTop: '0.5rem' }}>
                        Year 1 tax savings
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hdc-result-section">
                  <h3 className="hdc-section-title" 
                    style={{ 
                      color: darkMode ? '#bfb05e' : 'black' 
                    }}>
                    Free Investment Analysis
                  </h3>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label" style={{ color: 'black' }}>Tax Benefit Covers Investment</span>
                    <span className="hdc-result-value hdc-value-positive" style={{ color: 'var(--hdc-jungle-green)' }}>
                      {formatCurrency(Math.min(results.freeInvestmentAmount, results.investmentAmount))}
                    </span>
                  </div>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label" style={{ color: 'black' }}>Percentage of Investment Covered</span>
                    <span className="hdc-result-value" style={{ color: results.freeInvestmentPercent >= 100 ? 'var(--hdc-jungle-green)' : 'black', fontWeight: 'bold' }}>
                      {formatPercent(results.freeInvestmentPercent)}
                    </span>
                  </div>
                  {results.freeInvestmentPercent >= 100 && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(127, 189, 69, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid var(--hdc-cabbage-pont)',
                      color: darkMode ? 'white' : 'black'
                    }}>
                      <strong>
                        ✓ This is a FREE INVESTMENT!
                      </strong>
                      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        Your Year 1 tax savings completely cover your investment cost.
                      </p>
                    </div>
                  )}
                </div>

                {results.excessPlanningCapacity > 0 && (
                  <div className="hdc-result-section" 
                    style={{
                      color: darkMode ? 'white' : 'black',
                    }}
                  >
                    <h3 className="hdc-section-title" >Excess Tax Planning Capacity</h3>
                    <div className="hdc-result-row summary highlight">
                      <span className="hdc-result-label">Additional Tax Benefits Available</span>
                      <span className="hdc-result-value hdc-value-positive" style={{ color: 'var(--hdc-jungle-green)', fontWeight: 'bold' }}>
                        {formatCurrency(results.excessPlanningCapacity)}
                      </span>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                        You can use this excess capacity for:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.95rem', lineHeight: '1.8' }}>
                        <li><strong>IRA to Roth conversions:</strong> {formatCurrency(results.excessPlanningCapacity)} (tax-free conversion)</li>
                        <li><strong>1031 exchange capital gains:</strong> {formatCurrency(results.excessPlanningCapacity / (results.effectiveTaxRate / 100))} of gains</li>
                        <li><strong>Depreciation recapture offset:</strong> {formatCurrency(results.excessPlanningCapacity / 0.25)} of recapture</li>
                        <li><strong>Additional ordinary income offset:</strong> {formatCurrency(results.excessPlanningCapacity / (results.effectiveTaxRate / 100))} of income</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="hdc-result-section">
                  <h3 className="hdc-section-title" style={{ color: darkMode? '#bfb05e' : 'black' }}>Investment Details: {results.projectName}</h3>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label" style={{ color: 'black' }}>Your Investment</span>
                    <span className="hdc-result-value" style={{ color: 'black' }}>{formatCurrency(results.investmentAmount)}</span>
                  </div>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label" style={{ color: 'black' }}>Gross Tax Benefit</span>
                    <span className="hdc-result-value" style={{ color: 'black' }}>{formatCurrency(results.yearOneTaxBenefit)}</span>
                  </div>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label" style={{ color: 'black' }}>HDC Fee (15%)</span>
                    <span className="hdc-result-value" style={{ color: 'black' }}>-{formatCurrency(results.hdcFee)}</span>
                  </div>
                  <div className="hdc-result-row summary">
                    <span className="hdc-result-label" style={{ color: 'black', fontWeight: 'bold' }}>Net Tax Benefit</span>
                    <span className="hdc-result-value hdc-value-positive" style={{ color: 'var(--hdc-jungle-green)', fontWeight: 'bold' }}>
                      {formatCurrency(results.netTaxBenefit)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getFederalTaxRate(income: number, filingStatus: string): number {
  if (filingStatus === 'married') {
    if (income > 693750) return 37;
    if (income > 462500) return 35;
    if (income > 364200) return 32;
    if (income > 190750) return 24;
    if (income > 89075) return 22;
    if (income > 22000) return 12;
    return 10;
  } else {
    if (income > 578125) return 37;
    if (income > 231250) return 35;
    if (income > 182050) return 32;
    if (income > 95375) return 24;
    if (income > 44725) return 22;
    if (income > 11000) return 12;
    return 10;
  }
}

function getStateTaxRate(state: string): number {
  const rates: Record<string, number> = {
    'CA': 13.3,
    'NY': 10.9,
    'TX': 0,
    'FL': 0,
    'IL': 4.95,
    'PA': 3.07,
    'WA': 0,
    'MA': 5,
  };
  return rates[state] || 5;
}

export default TaxStrategyAnalyzer;