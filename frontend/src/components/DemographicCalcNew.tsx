import { useMemo, useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { annualIncomeNeededForRent, ACS_RENTER_BINS } from '../lib/affordability';
import { renterIncomeBinsByZcta } from '../lib/acs';
import { zctaToPumas } from '../lib/crosswalk';
import { fetchPumsHouseholds, raceEthnicityGroup } from '../lib/pums';
import { safmrFor } from '../lib/hud';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type GroupDist = Record<string, number[]>;

interface PolicyDriver {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  calculateCost: (value: number, baseRent: number) => { capital: number; operating: number };
}

async function getBaselinedRent(zip: string, baseMethod: 'SAFMR' | 'Manual', manualBase: number) {
  if (baseMethod === 'Manual') return manualBase;
  // Use 1BR as the baseline apartment type
  return await safmrFor(zip, '1BR');
}

export default function DemographicCalcNew() {
  const s = useAppStore();
  const [loading, setLoading] = useState(false);
  const [acsBins, setAcsBins] = useState<number[] | null>(null);
  const [groupDists, setGroupDists] = useState<GroupDist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseRent, setBaseRent] = useState<number>(0);
  const [financeRate, setFinanceRate] = useState(0.06);
  const [financeTerm, setFinanceTerm] = useState(30);
  const [formData, setFormData] = useState({
    zip: s.zip || '94102',
    stateFips: s.stateFips || '06',
    baseMethod: 'SAFMR' as 'SAFMR' | 'Manual',
    manualBaseRent: 2000
  });
  
  const [showCostAssumptions, setShowCostAssumptions] = useState(false);
  const [parkingCostPerSpace, setParkingCostPerSpace] = useState(50000);
  const [parkingOperatingCost, setParkingOperatingCost] = useState(25);
  const [constructionCostPerSF, setConstructionCostPerSF] = useState(200);
  const [sfOperatingCost, setSfOperatingCost] = useState(0.50);
  const [openSpaceCapitalCost, setOpenSpaceCapitalCost] = useState(30000);
  const [openSpaceOperatingCost, setOpenSpaceOperatingCost] = useState(50);
  const [designMaterialsCost, setDesignMaterialsCost] = useState(0.002);

  // Policy drivers with their cost calculation logic
  const [policyDrivers, setPolicyDrivers] = useState<PolicyDriver[]>([
    {
      id: 'parking',
      name: 'Mandatory Parking',
      icon: '',
      enabled: true,
      description: 'Many cities require 1-2 parking spaces per apartment, even near transit. Each space costs $30-70k to build.',
      value: 1.5,
      min: 0,
      max: 3,
      step: 0.25,
      unit: 'spaces',
      calculateCost: (spaces) => ({
        capital: spaces * parkingCostPerSpace,
        operating: spaces * parkingOperatingCost
      })
    },
    {
      id: 'minSize',
      name: 'Minimum Unit Size',
      icon: '',
      enabled: true,
      description: 'Regulations often mandate minimum apartment sizes larger than what people might choose, increasing costs.',
      value: 1000,
      min: 600,
      max: 1500,
      step: 50,
      unit: 'sq ft',
      calculateCost: (sqft) => {
        const baseline = 850; // baseline apartment size
        const extra = Math.max(0, sqft - baseline);
        return {
          capital: extra * constructionCostPerSF,
          operating: extra * sfOperatingCost
        };
      }
    },
    {
      id: 'impactFees',
      name: 'Impact/Development Fees',
      icon: '',
      enabled: true,
      description: 'Cities charge fees for new housing to fund infrastructure, schools, parks. Often $10-50k per unit.',
      value: 25000,
      min: 0,
      max: 75000,
      step: 5000,
      unit: '$',
      calculateCost: (fees) => ({
        capital: fees,
        operating: 0
      })
    },
    {
      id: 'openSpace',
      name: 'Open Space Requirements',
      icon: '',
      enabled: true,
      description: 'Requirements for yards, courtyards, or setbacks reduce the number of homes that can be built on a lot.',
      value: 20,
      min: 10,
      max: 40,
      step: 5,
      unit: '%',
      calculateCost: (percent) => ({
        capital: (percent / 100) * openSpaceCapitalCost,
        operating: (percent / 100) * openSpaceOperatingCost
      })
    },
    {
      id: 'inclusionary',
      name: 'Inclusionary Zoning',
      icon: '',
      enabled: true,
      description: 'Requirements to include below-market units. The cost is typically passed to market-rate renters.',
      value: 15,
      min: 5,
      max: 30,
      step: 5,
      unit: '%',
      calculateCost: (percent, baseRent) => {
        // Cost spread across market-rate units
        const affordableDiscount = baseRent * 0.5; // Affordable at 50% of market
        const costPerMarketUnit = (percent / 100) * affordableDiscount / (1 - percent / 100);
        return {
          capital: 0,
          operating: costPerMarketUnit
        };
      }
    },
    {
      id: 'designReview',
      name: 'Design Standards',
      icon: '',
      enabled: true,
      description: 'Requirements for specific materials, architectural features, or aesthetic standards that increase construction costs.',
      value: 15000,
      min: 0,
      max: 50000,
      step: 5000,
      unit: '$',
      calculateCost: (cost) => ({
        capital: cost, // Additional design/material costs
        operating: cost * designMaterialsCost // Higher maintenance for premium materials
      })
    }
  ]);

  const updatePolicyDriver = (id: string, updates: Partial<PolicyDriver>) => {
    setPolicyDrivers(prev => prev.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ));
  };

  // Calculate total monthly rent including all policy costs
  const requiredRent = useMemo(() => {
    if (!baseRent) return 0;
    
    let totalCapital = 0;
    let totalOperating = 0;
    
    policyDrivers.forEach(driver => {
      if (driver.enabled) {
        const costs = driver.calculateCost(driver.value, baseRent);
        totalCapital += costs.capital;
        totalOperating += costs.operating;
      }
    });
    
    // Amortize capital costs over loan term
    const monthlyRate = financeRate / 12;
    const numPayments = financeTerm * 12;
    const amortizedCapital = totalCapital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                             (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return baseRent + amortizedCapital + totalOperating;
  }, [baseRent, policyDrivers, financeRate, financeTerm, parkingCostPerSpace, parkingOperatingCost, 
      constructionCostPerSF, sfOperatingCost, openSpaceCapitalCost, openSpaceOperatingCost, designMaterialsCost]);

  const incomeNeeded = useMemo(() => annualIncomeNeededForRent(requiredRent, 0.30), [requiredRent]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const base = await getBaselinedRent(formData.zip, formData.baseMethod, formData.manualBaseRent);
      setBaseRent(base);
      const bins = await renterIncomeBinsByZcta(formData.zip, import.meta.env.VITE_CENSUS_API_KEY || '');
      setAcsBins(bins);
      
      // Fetch demographic data
      const geocorrState = formData.stateFips === '06' ? 'ca' : formData.stateFips === '53' ? 'wa' : 'ca';
      const xw = await zctaToPumas(formData.zip, formData.stateFips, geocorrState);
      const groups: GroupDist = {};
      
      for (const g of xw) {
        const rows = await fetchPumsHouseholds(g.statefp, [g.puma], import.meta.env.VITE_CENSUS_API_KEY || '');
        for (const r of rows) {
          if (Number(r.TEN) !== 3) continue; // Renters only
          const grp = raceEthnicityGroup(Number(r.RAC1P), Number(r.HISP));
          const h = Number(r.HINCP);
          const w = Number(r.WGTP);
          let idx = -1;
          for (let i = 0; i < ACS_RENTER_BINS.length; i++) {
            const [lo, hi] = ACS_RENTER_BINS[i];
            if (hi === null) { if (h >= lo) { idx = i; break; } }
            else if (h >= lo && h <= hi) { idx = i; break; }
          }
          if (idx < 0) continue;
          groups[grp] = groups[grp] || Array(11).fill(0);
          groups[grp][idx] += w * g.weight;
        }
      }
      setGroupDists(groups);
    } catch (e: unknown) {
      console.error(e);
      setError((e as Error).message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load data on component mount
  useEffect(() => {
    // Auto-load with default ZIP on first render
    if (!baseRent && !loading && !error) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Calculate affordability metrics
  const calculateAffordability = useMemo(() => {
    if (!acsBins) return null;
    
    const baseAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      const midIncome = hi ? (lo + hi) / 2 : lo;
      const maxAffordableRent = (midIncome * 0.30) / 12;
      if (maxAffordableRent >= baseRent) return sum + count;
      return sum;
    }, 0);
    
    const totalHouseholds = acsBins.reduce((a, b) => a + b, 0);
    const requiredAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      const midIncome = hi ? (lo + hi) / 2 : lo;
      const maxAffordableRent = (midIncome * 0.30) / 12;
      if (maxAffordableRent >= requiredRent) return sum + count;
      return sum;
    }, 0);
    
    const excluded = baseAffordable - requiredAffordable;
    const excludedPct = totalHouseholds > 0 ? (excluded / totalHouseholds) * 100 : 0;
    
    return {
      totalHouseholds,
      baseAffordable,
      requiredAffordable,
      excluded,
      excludedPct
    };
  }, [acsBins, baseRent, requiredRent]);

  // Calculate demographic impact - who gets excluded when costs increase
  const demographicImpact = useMemo(() => {
    if (!groupDists || !baseRent || !requiredRent) return null;
    
    const result: Record<string, { 
      total: number; 
      canAffordBase: number; 
      canAffordRequired: number; 
      excluded: number;
      shareOfTotal: number;
      shareOfExcluded: number;
      disparityRatio: number;
    }> = {};
    
    let grandTotal = 0;
    let totalExcluded = 0;
    
    for (const [group, distribution] of Object.entries(groupDists)) {
      let total = 0;
      let canAffordBase = 0;
      let canAffordRequired = 0;
      
      distribution.forEach((count, idx) => {
        const [lo, hi] = ACS_RENTER_BINS[idx];
        const midIncome = hi ? (lo + hi) / 2 : lo;
        const maxAffordableRent = (midIncome * 0.30) / 12;
        
        total += count;
        if (maxAffordableRent >= baseRent) canAffordBase += count;
        if (maxAffordableRent >= requiredRent) canAffordRequired += count;
      });
      
      const excluded = canAffordBase - canAffordRequired;
      grandTotal += total;
      totalExcluded += excluded;
      
      result[group] = {
        total,
        canAffordBase,
        canAffordRequired,
        excluded,
        shareOfTotal: 0,
        shareOfExcluded: 0,
        disparityRatio: 0
      };
    }
    
    // Calculate proportional metrics
    for (const data of Object.values(result)) {
      data.shareOfTotal = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
      data.shareOfExcluded = totalExcluded > 0 ? (data.excluded / totalExcluded) * 100 : 0;
      data.disparityRatio = data.shareOfTotal > 0 ? data.shareOfExcluded / data.shareOfTotal : 0;
    }
    
    return result;
  }, [groupDists, baseRent, requiredRent]);

  const pdfRef = useRef<HTMLDivElement>(null);
  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height / canvas.width) * w;
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.save(`housing_policy_impact_${formData.zip}.pdf`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50" style={{ fontFamily: 'Arial, sans-serif' }} ref={pdfRef}>
      <div className="text-center mb-3" style={{ backgroundColor: 'white', borderRadius: '8px', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src="/HDCLOGO.png" alt="HDC Logo" style={{ width: '280px', height: 'auto' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--hdc-faded-jade)', letterSpacing: '0.5px', marginTop: '0.125rem' }}>
            Housing Policy Impact Calculator
          </h1>
        </div>
      </div>

      <div className="text-center text-xl mb-4" style={{
        fontWeight: '600',
        color: 'white',
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--hdc-faded-jade)',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        See how regulatory requirements affect housing affordability
      </div>

      {/* How it Works Section */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 How This Calculator Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded p-3">
            <div className="font-semibold text-blue-800 mb-1">1️⃣ Enter Your Location</div>
            <p className="text-gray-600">Enter a ZIP code and click "Calculate Impact" to load local housing cost and demographic data.</p>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-semibold text-blue-800 mb-1">2️⃣ Toggle Policy Requirements</div>
            <p className="text-gray-600">Turn on/off different regulatory requirements (parking, unit size, fees) to see their cost impact.</p>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-semibold text-blue-800 mb-1">3️⃣ See Who Gets Excluded</div>
            <p className="text-gray-600">View how many households are priced out and which demographic groups are disproportionately affected.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Location & Base Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--hdc-faded-jade)' }}>Location & Baseline</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">ZIP Code</label>
                <input 
                  value={formData.zip} 
                  onChange={e => setFormData({ ...formData, zip: e.target.value })} 
                  className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                />
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">State</label>
                <select 
                  value={formData.stateFips} 
                  onChange={e => setFormData({ ...formData, stateFips: e.target.value })} 
                  className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="06">California</option>
                  <option value="53">Washington</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Baseline Method</label>
                <select 
                  value={formData.baseMethod} 
                  onChange={e => setFormData({ ...formData, baseMethod: e.target.value as 'SAFMR' | 'Manual' })} 
                  className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="SAFMR">HUD Fair Market Rent</option>
                  <option value="Manual">Manual Entry</option>
                </select>
              </div>
              
              {formData.baseMethod === 'Manual' && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Base Rent ($/mo)</label>
                  <input 
                    type="number" 
                    value={formData.manualBaseRent} 
                    onChange={e => setFormData({ ...formData, manualBaseRent: Number(e.target.value) })} 
                    className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                  />
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Financing Assumptions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      value={financeRate * 100} 
                      onChange={e => setFinanceRate(Number(e.target.value) / 100)} 
                      className="border border-gray-300 px-2 py-1 w-full rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                      step="0.25"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600">Loan Term (years)</label>
                    <input 
                      type="number" 
                      value={financeTerm} 
                      onChange={e => setFinanceTerm(Number(e.target.value))} 
                      className="border border-gray-300 px-2 py-1 w-full rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500" 
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full px-4 py-3 rounded-md font-medium text-white transition-colors mt-4"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : 'var(--hdc-faded-jade)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Calculating...' : 'Calculate Impact'}
              </button>
            </div>
          </div>

          {/* Cost Assumptions Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-gray-700">Cost Assumptions</h3>
              <button
                onClick={() => setShowCostAssumptions(!showCostAssumptions)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showCostAssumptions ? '▼ Hide' : '▶ Show'}
              </button>
            </div>
            
            {showCostAssumptions && (
              <div className="space-y-4">
                {/* Parking Costs */}
                <div className="pb-3 border-b">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Parking</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Capital ($/space)</label>
                      <input 
                        type="number" 
                        value={parkingCostPerSpace} 
                        onChange={e => setParkingCostPerSpace(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="5000"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Operating ($/mo)</label>
                      <input 
                        type="number" 
                        value={parkingOperatingCost} 
                        onChange={e => setParkingOperatingCost(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="5"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Unit Size Costs */}
                <div className="pb-3 border-b">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Extra Square Footage</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Capital ($/sf)</label>
                      <input 
                        type="number" 
                        value={constructionCostPerSF} 
                        onChange={e => setConstructionCostPerSF(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="10"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Operating ($/sf/mo)</label>
                      <input 
                        type="number" 
                        value={sfOperatingCost} 
                        onChange={e => setSfOperatingCost(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="0.10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Open Space Costs */}
                <div className="pb-3 border-b">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Open Space (per % of lot)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Opportunity Cost ($)</label>
                      <input 
                        type="number" 
                        value={openSpaceCapitalCost} 
                        onChange={e => setOpenSpaceCapitalCost(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs text-gray-600">Maintenance ($/mo)</label>
                      <input 
                        type="number" 
                        value={openSpaceOperatingCost} 
                        onChange={e => setOpenSpaceOperatingCost(Number(e.target.value))} 
                        className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                        step="10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Design Standards */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Design Standards</h4>
                  <div>
                    <label className="block mb-1 text-xs text-gray-600">Maintenance Factor</label>
                    <input 
                      type="number" 
                      value={designMaterialsCost} 
                      onChange={e => setDesignMaterialsCost(Number(e.target.value))} 
                      className="border border-gray-300 px-2 py-1 w-full rounded text-sm" 
                      step="0.001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Monthly maintenance as % of capital cost</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Policy Drivers */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--hdc-faded-jade)' }}>
              Policy Requirements & Cost Drivers
            </h2>

            {/* Show message when no data is loaded */}
            {baseRent === 0 && !loading && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Loaded</h3>
                <p className="text-gray-500 mb-4">Enter your location and click "Calculate Impact" to begin</p>
                <div className="text-left max-w-md mx-auto bg-white p-4 rounded border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Once loaded, you'll be able to:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Toggle different policy requirements on/off</li>
                    <li>✓ Adjust values to model different scenarios</li>
                    <li>✓ See real-time cost impacts</li>
                    <li>✓ View demographic exclusion analysis</li>
                  </ul>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="mt-4 text-gray-600">Loading housing and demographic data...</p>
              </div>
            )}
            
            {/* Cost Summary Bar */}
            {baseRent > 0 && !loading && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Base Apartment Rent</span>
                  <span className="text-lg font-semibold">${baseRent.toFixed(0)}/mo</span>
                </div>
                
                {policyDrivers.filter(d => d.enabled).map(driver => {
                  const costs = driver.calculateCost(driver.value, baseRent);
                  const monthlyRate = financeRate / 12;
                  const numPayments = financeTerm * 12;
                  const monthlyCapital = costs.capital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                        (Math.pow(1 + monthlyRate, numPayments) - 1);
                  const totalMonthly = monthlyCapital + costs.operating;
                  
                  return (
                    <div key={driver.id} className="flex items-center justify-between text-sm py-1">
                      <span className="text-gray-600">+ {driver.name}</span>
                      <span className="font-medium text-red-600">+${totalMonthly.toFixed(0)}/mo</span>
                    </div>
                  );
                })}
                
                <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-gray-300">
                  <span className="font-semibold text-gray-700">Total Required Rent</span>
                  <span className="text-xl font-bold" style={{ color: requiredRent > baseRent * 1.3 ? '#DC2626' : 'var(--hdc-faded-jade)' }}>
                    ${requiredRent.toFixed(0)}/mo
                  </span>
                </div>
                
                {calculateAffordability && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Households Excluded</span>
                      <span className="text-lg font-bold text-red-600">
                        {calculateAffordability.excluded.toLocaleString()} ({calculateAffordability.excludedPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-500">Income Needed (30% burden)</span>
                      <span className="font-medium">${incomeNeeded.toFixed(0)}/year</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Policy Drivers List */}
            {baseRent > 0 && !loading && (
              <>
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Try this:</strong> Toggle policies on/off and adjust their values to see how each requirement affects housing costs and who gets excluded.
                  </p>
                </div>
                <div className="space-y-3">
                  {policyDrivers.map(driver => {
                const costs = driver.enabled ? driver.calculateCost(driver.value, baseRent) : { capital: 0, operating: 0 };
                const monthlyRate = financeRate / 12;
                const numPayments = financeTerm * 12;
                const monthlyCapital = costs.capital * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                      (Math.pow(1 + monthlyRate, numPayments) - 1);
                const totalMonthly = monthlyCapital + costs.operating;
                
                return (
                  <div 
                    key={driver.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      driver.enabled ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            id={`policy-${driver.id}`}
                            checked={driver.enabled}
                            onChange={() => updatePolicyDriver(driver.id, { enabled: !driver.enabled })}
                            className="text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                            style={{
                              accentColor: 'var(--hdc-faded-jade)',
                              width: '20px',
                              height: '20px',
                              transform: 'scale(1.25)',
                              transformOrigin: 'left center',
                              marginRight: '8px'
                            }}
                          />
                        </div>
                        <label htmlFor={`policy-${driver.id}`} className="flex-1 cursor-pointer">
                          <div>
                            <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{driver.description}</p>
                        </label>
                      </div>
                      {driver.enabled && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">+${totalMonthly.toFixed(0)}/mo</div>
                          <div className="text-xs text-gray-500">
                            {costs.capital > 0 && `$${(costs.capital / 1000).toFixed(0)}k capital`}
                            {costs.capital > 0 && costs.operating > 0 && ' + '}
                            {costs.operating > 0 && `$${costs.operating.toFixed(0)}/mo operating`}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {driver.enabled && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={driver.min}
                            max={driver.max}
                            step={driver.step}
                            value={driver.value}
                            onChange={e => updatePolicyDriver(driver.id, { value: Number(e.target.value) })}
                            className="flex-1"
                            style={{
                              accentColor: 'var(--hdc-faded-jade)'
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={driver.min}
                              max={driver.max}
                              step={driver.step}
                              value={driver.value}
                              onChange={e => updatePolicyDriver(driver.id, { value: Number(e.target.value) })}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-600">{driver.unit}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demographic Impact Section */}
      {demographicImpact && baseRent > 0 && (
        <div className="mt-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--hdc-faded-jade)' }}>
              Who Gets Excluded? The Housing Squeeze
            </h2>

            {/* Income thresholds display */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600">Baseline Rent</div>
                  <div className="text-xl font-bold" style={{ color: 'var(--hdc-faded-jade)' }}>
                    ${baseRent.toFixed(0)}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    Needs ${(baseRent * 12 / 0.30).toFixed(0).toLocaleString()} income
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">With Policy Costs</div>
                  <div className="text-xl font-bold text-red-600">
                    ${requiredRent.toFixed(0)}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    Needs ${(requiredRent * 12 / 0.30).toFixed(0).toLocaleString()} income
                  </div>
                </div>
              </div>
            </div>

            {/* Squeeze Visualization */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-4">Impact by Demographic Group</h3>
              <div className="space-y-4">
                {Object.entries(demographicImpact)
                  .sort((a, b) => b[1].disparityRatio - a[1].disparityRatio)
                  .map(([group, data]) => {
                    const totalHouseholds = data.total;
                    const cantAffordBase = totalHouseholds - data.canAffordBase;
                    const excluded = data.excluded;
                    const canAfford = data.canAffordRequired;
                    
                    // Calculate percentages for bar segments
                    const tooLowPct = (cantAffordBase / totalHouseholds) * 100;
                    const excludedPct = (excluded / totalHouseholds) * 100;
                    const canAffordPct = (canAfford / totalHouseholds) * 100;
                    
                    return (
                      <div key={group} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{group}</span>
                            {data.disparityRatio > 1.5 && (
                              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                                {data.disparityRatio.toFixed(1)}x impact
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-red-600">
                            {excludedPct.toFixed(1)}% excluded
                          </span>
                        </div>
                        
                        {/* Stacked bar */}
                        <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
                          {/* Can't afford baseline - dark gray */}
                          {tooLowPct > 0 && (
                            <div 
                              className="absolute left-0 h-full bg-gray-500"
                              style={{ width: `${tooLowPct}%` }}
                              title={`${cantAffordBase.toFixed(0)} households can't afford baseline`}
                            />
                          )}
                          
                          {/* Excluded by policies - red with stripes */}
                          {excludedPct > 0 && (
                            <div 
                              className="absolute h-full"
                              style={{ 
                                left: `${tooLowPct}%`,
                                width: `${excludedPct}%`,
                                background: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 4px, #EF4444 4px, #EF4444 8px)'
                              }}
                              title={`${excluded.toFixed(0)} households excluded by policy costs`}
                            />
                          )}
                          
                          {/* Can afford with policies - green */}
                          {canAffordPct > 0 && (
                            <div 
                              className="absolute right-0 h-full"
                              style={{ 
                                width: `${canAffordPct}%`,
                                backgroundColor: 'var(--hdc-faded-jade)'
                              }}
                              title={`${canAfford.toFixed(0)} households can still afford`}
                            />
                          )}
                          
                          {/* Labels inside bar if space permits */}
                          <div className="relative h-full flex items-center px-2">
                            {tooLowPct > 15 && (
                              <span className="text-xs text-white font-medium">
                                {tooLowPct.toFixed(0)}%
                              </span>
                            )}
                            {excludedPct > 15 && (
                              <span className="text-xs text-white font-bold ml-auto mr-auto">
                                {excludedPct.toFixed(0)}% EXCLUDED
                              </span>
                            )}
                            {canAffordPct > 15 && (
                              <span className="text-xs text-white font-medium ml-auto">
                                {canAffordPct.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Income range indicators */}
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">$0</span>
                          <span className="text-xs text-gray-600 font-medium">
                            ${(baseRent * 12 / 0.30 / 1000).toFixed(0)}k
                          </span>
                          <span className="text-xs text-red-600 font-medium">
                            ${(requiredRent * 12 / 0.30 / 1000).toFixed(0)}k
                          </span>
                          <span className="text-xs text-gray-500">$150k+</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 p-3 bg-gray-50 rounded flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span>Too low income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ 
                    background: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 2px, #EF4444 2px, #EF4444 4px)'
                  }}></div>
                  <span className="font-semibold">Excluded by policies</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--hdc-faded-jade)' }}></div>
                  <span>Can afford</span>
                </div>
              </div>
            </div>
            

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Group</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">% of Population</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Can Afford Base</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Can Afford w/ Policies</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Excluded</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">% of All Excluded</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">Impact Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(demographicImpact)
                    .sort((a, b) => b[1].disparityRatio - a[1].disparityRatio)
                    .map(([group, data]) => {
                      
                      return (
                        <tr 
                          key={group} 
                          className={`border-b border-gray-100 ${
                            data.disparityRatio > 1.5 ? 'bg-red-100' :
                            data.disparityRatio > 1.2 ? 'bg-red-50' : 
                            data.disparityRatio > 1.0 ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-medium">
                            {group}
                            {data.disparityRatio > 1.5 && (
                              <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded">
                                HIGH IMPACT
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">{data.shareOfTotal.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-center text-gray-600">{data.canAffordBase.toFixed(0)}</td>
                          <td className="py-2 px-3 text-center text-gray-600">{data.canAffordRequired.toFixed(0)}</td>
                          <td className="py-2 px-3 text-center text-gray-600">
                            {data.excluded.toFixed(0)}
                            {data.excluded > 0 && (
                              <div className="text-xs text-gray-500">
                                ({((data.excluded / data.canAffordBase) * 100).toFixed(0)}% of group)
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">{data.shareOfExcluded.toFixed(1)}%</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-bold text-lg ${
                              data.disparityRatio > 1.5 ? 'text-red-600' :
                              data.disparityRatio > 1.0 ? 'text-orange-600' :
                              data.disparityRatio < 0.8 ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              {data.disparityRatio.toFixed(2)}x
                            </span>
                            {data.disparityRatio > 1.5 && <div className="text-xs text-red-600">⚠️ Disparate Impact</div>}
                            {data.disparityRatio < 0.8 && <div className="text-xs text-green-600">Less Affected</div>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">
                <strong>Impact Ratio:</strong> A ratio {'>'} 1.0 means the group is excluded at a higher rate than their population share. 
                For example, 2.0x means they make up twice as much of the excluded population as they do of the total population.
              </p>
            </div>

            {/* Income Distribution by Race/Ethnicity */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-md font-semibold text-blue-900 mb-3">
                Income Distribution by Race/Ethnicity
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Number of households in each income bracket, by demographic group
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-2 font-medium text-gray-700">Income Range</th>
                      <th className="text-center py-2 px-2 font-medium text-gray-600">
                        Max Rent<br/>(30% income)
                      </th>
                      {Object.keys(demographicImpact).map(group => (
                        <th key={group} className="text-center py-2 px-2 font-medium text-gray-700">
                          {group.split(' ').map(word => word.substring(0, 3)).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACS_RENTER_BINS.map((bin, idx) => {
                      const [lo, hi] = bin;
                      const midIncome = hi ? (lo + hi) / 2 : lo;
                      const maxRent = (midIncome * 0.30) / 12;
                      const canAffordBase = maxRent >= baseRent;
                      const canAffordRequired = maxRent >= requiredRent;
                      
                      // Determine if this income bracket is in the "exclusion zone"
                      const inExclusionZone = canAffordBase && !canAffordRequired;
                      
                      return (
                        <tr key={idx} className={`border-b ${
                          inExclusionZone ? 'bg-red-100' :
                          canAffordRequired ? 'bg-green-50' :
                          'bg-gray-50'
                        }`}>
                          <td className="py-1 px-2 text-xs font-medium">
                            ${lo.toLocaleString()}{hi ? `-${hi.toLocaleString()}` : '+'}
                          </td>
                          <td className="py-1 px-2 text-center text-xs">
                            ${maxRent.toFixed(0)}
                            {inExclusionZone && (
                              <div className="text-red-600 font-semibold">EXCLUDED</div>
                            )}
                          </td>
                          {Object.entries(demographicImpact).map(([group, data]) => {
                            const groupDist = groupDists?.[group];
                            const count = groupDist?.[idx] || 0;
                            const pctOfGroup = data.total > 0 ? (count / data.total) * 100 : 0;
                            
                            return (
                              <td key={group} className="py-1 px-2 text-center text-xs">
                                {count > 0 ? (
                                  <>
                                    <div className="font-medium">{count.toFixed(0)}</div>
                                    <div className="text-gray-500">({pctOfGroup.toFixed(0)}%)</div>
                                  </>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr className="border-t-2 border-gray-400 font-semibold">
                      <td className="py-2 px-2 text-xs">TOTAL</td>
                      <td className="py-2 px-2"></td>
                      {Object.entries(demographicImpact).map(([group, data]) => (
                        <td key={group} className="py-2 px-2 text-center text-xs">
                          {data.total.toFixed(0)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-3 p-2 bg-white rounded">
                <p className="text-xs text-gray-600">
                  <span className="inline-block w-4 h-3 bg-red-100 rounded mr-1"></span> 
                  <strong>Red rows</strong> = Income levels that can afford baseline rent but NOT the required rent (excluded by policies)
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="inline-block w-4 h-3 bg-green-50 rounded mr-1"></span> 
                  <strong>Green rows</strong> = Can afford even with policy costs added
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {baseRent > 0 && !loading && (
        <div className="mt-4 text-center">
          <button 
            onClick={downloadPDF} 
            className="px-6 py-2 rounded-md text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: 'var(--hdc-faded-jade)',
              cursor: 'pointer'
            }}
          >
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
}