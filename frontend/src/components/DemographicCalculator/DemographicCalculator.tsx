import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { renterIncomeBinsByZcta } from '../../lib/acs';
import { zctaToPumas } from '../../lib/crosswalk';
import { fetchPumsHouseholds, raceEthnicityGroup } from '../../lib/pums';
import { safmrFor } from '../../lib/hud';
import { ACS_RENTER_BINS } from '../../lib/affordability';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import {
  PolicyDriver,
  DemographicImpactBar,
  CostBreakdownSummary,
  LocationSelector,
  IncomeDistributionTable,
  CostAssumptionsPanel,
  ImpactRatioBadge,
  LoadingState,
  EmptyState
} from './components';

import {
  usePolicyCalculations,
  useAffordabilityMetrics,
  useDemographicImpact
} from './hooks';

import type {
  PolicyDriver as PolicyDriverType,
  GroupDist,
  LocationFormData,
  FinanceTerms,
  CostAssumptions
} from './types';

async function getBaselinedRent(zip: string, baseMethod: 'SAFMR' | 'Manual', manualBase: number) {
  if (baseMethod === 'Manual') return manualBase;
  return await safmrFor(zip, '1BR');
}

export default function DemographicCalculator() {
  const s = useAppStore();
  const [loading, setLoading] = useState(false);
  const [acsBins, setAcsBins] = useState<number[] | null>(null);
  const [groupDists, setGroupDists] = useState<GroupDist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseRent, setBaseRent] = useState<number>(0);
  
  const [financeTerms, setFinanceTerms] = useState<FinanceTerms>({
    rate: 0.06,
    termYears: 30
  });
  
  const [formData, setFormData] = useState<LocationFormData>({
    zip: s.zip || '94102',
    stateFips: s.stateFips || '06',
    baseMethod: 'SAFMR',
    manualBaseRent: 2000
  });
  
  const [showCostAssumptions, setShowCostAssumptions] = useState(false);
  const [costAssumptions, setCostAssumptions] = useState<CostAssumptions>({
    parkingCostPerSpace: 50000,
    parkingOperatingCost: 25,
    constructionCostPerSF: 200,
    sfOperatingCost: 0.50,
    openSpaceCapitalCost: 30000,
    openSpaceOperatingCost: 50,
    designMaterialsCost: 0.002
  });

  const [policyDrivers, setPolicyDrivers] = useState<PolicyDriverType[]>([
    {
      id: 'parking',
      name: 'Mandatory Parking',
      icon: '🚗',
      enabled: true,
      description: 'Many cities require 1-2 parking spaces per apartment, even near transit. Each space costs $30-70k to build.',
      value: 1.5,
      min: 0,
      max: 3,
      step: 0.25,
      unit: 'spaces',
      calculateCost: (spaces) => ({
        capital: spaces * costAssumptions.parkingCostPerSpace,
        operating: spaces * costAssumptions.parkingOperatingCost
      })
    },
    {
      id: 'minSize',
      name: 'Minimum Unit Size',
      icon: '📏',
      enabled: true,
      description: 'Regulations often mandate minimum apartment sizes larger than what people might choose, increasing costs.',
      value: 1000,
      min: 600,
      max: 1500,
      step: 50,
      unit: 'sq ft',
      calculateCost: (sqft) => {
        const baseline = 850;
        const extra = Math.max(0, sqft - baseline);
        return {
          capital: extra * costAssumptions.constructionCostPerSF,
          operating: extra * costAssumptions.sfOperatingCost
        };
      }
    },
    {
      id: 'impactFees',
      name: 'Impact/Development Fees',
      icon: '💰',
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
      icon: '🌳',
      enabled: true,
      description: 'Requirements for yards, courtyards, or setbacks reduce the number of homes that can be built on a lot.',
      value: 20,
      min: 10,
      max: 40,
      step: 5,
      unit: '%',
      calculateCost: (percent) => ({
        capital: (percent / 100) * costAssumptions.openSpaceCapitalCost,
        operating: (percent / 100) * costAssumptions.openSpaceOperatingCost
      })
    },
    {
      id: 'inclusionary',
      name: 'Inclusionary Zoning',
      icon: '🏘️',
      enabled: true,
      description: 'Requirements to include below-market units. The cost is typically passed to market-rate renters.',
      value: 15,
      min: 5,
      max: 30,
      step: 5,
      unit: '%',
      calculateCost: (percent, baseRent) => {
        const affordableDiscount = baseRent * 0.5;
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
      icon: '🏛️',
      enabled: true,
      description: 'Requirements for specific materials, architectural features, or aesthetic standards that increase construction costs.',
      value: 15000,
      min: 0,
      max: 50000,
      step: 5000,
      unit: '$',
      calculateCost: (cost) => ({
        capital: cost,
        operating: cost * costAssumptions.designMaterialsCost
      })
    }
  ]);

  const updatePolicyDriver = (id: string, updates: Partial<PolicyDriverType>) => {
    setPolicyDrivers(prev => prev.map(d => 
      d.id === id ? { ...d, ...updates } : d
    ));
  };

  // Use custom hooks for calculations
  const { requiredRent, incomeNeeded } = usePolicyCalculations(
    baseRent,
    policyDrivers,
    financeTerms.rate,
    financeTerms.termYears
  );

  const affordabilityMetrics = useAffordabilityMetrics(acsBins, baseRent, requiredRent);
  const demographicImpact = useDemographicImpact(groupDists, baseRent, requiredRent);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const base = await getBaselinedRent(formData.zip, formData.baseMethod, formData.manualBaseRent);
      setBaseRent(base);
      const bins = await renterIncomeBinsByZcta(formData.zip, import.meta.env.VITE_CENSUS_API_KEY || '');
      setAcsBins(bins);
      
      const geocorrState = formData.stateFips === '06' ? 'ca' : formData.stateFips === '53' ? 'wa' : 'ca';
      const xw = await zctaToPumas(formData.zip, formData.stateFips, geocorrState);
      const groups: GroupDist = {};
      
      for (const g of xw) {
        const rows = await fetchPumsHouseholds(g.statefp, [g.puma], import.meta.env.VITE_CENSUS_API_KEY || '');
        for (const r of rows) {
          if (Number(r.TEN) !== 3) continue;
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

  useEffect(() => {
    if (!baseRent && !loading && !error) {
      handleSubmit();
    }
  }, []);

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
      {/* Header */}
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

      {/* How it Works */}
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
        {/* Left Panel */}
        <div className="lg:col-span-1">
          <LocationSelector
            formData={formData}
            financeTerms={financeTerms}
            loading={loading}
            onFormChange={(updates) => setFormData({ ...formData, ...updates })}
            onFinanceChange={(updates) => setFinanceTerms({ ...financeTerms, ...updates })}
            onSubmit={handleSubmit}
          />
          <CostAssumptionsPanel
            assumptions={costAssumptions}
            onChange={(updates) => setCostAssumptions({ ...costAssumptions, ...updates })}
            isOpen={showCostAssumptions}
            onToggle={() => setShowCostAssumptions(!showCostAssumptions)}
          />
        </div>

        {/* Middle Panel - Policy Drivers */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--hdc-faded-jade)' }}>
              Policy Requirements & Cost Drivers
            </h2>

            {baseRent === 0 && !loading && <EmptyState />}
            {loading && <LoadingState />}
            
            {baseRent > 0 && !loading && (
              <>
                <CostBreakdownSummary
                  baseRent={baseRent}
                  requiredRent={requiredRent}
                  incomeNeeded={incomeNeeded}
                  policyDrivers={policyDrivers}
                  financeRate={financeTerms.rate}
                  financeTerm={financeTerms.termYears}
                  affordabilityMetrics={affordabilityMetrics}
                />
                
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Try this:</strong> Toggle policies on/off and adjust their values to see how each requirement affects housing costs and who gets excluded.
                  </p>
                </div>
                
                <div className="space-y-3">
                  {policyDrivers.map(driver => (
                    <PolicyDriver
                      key={driver.id}
                      driver={driver}
                      baseRent={baseRent}
                      financeRate={financeTerms.rate}
                      financeTerm={financeTerms.termYears}
                      onUpdate={updatePolicyDriver}
                    />
                  ))}
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

            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 mb-2">Impact by Demographic Group</h3>
              
              {/* Explanatory text */}
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-sm">
                <p className="text-blue-900">
                  <strong>Understanding the bars:</strong> Gray shows households already priced out at baseline market rent. 
                  Red stripes show additional households excluded by policy requirements. 
                  Green shows who can still afford housing with all costs included.
                </p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(demographicImpact)
                  .sort((a, b) => b[1].disparityRatio - a[1].disparityRatio)
                  .map(([group, data]) => (
                    <DemographicImpactBar
                      key={group}
                      group={group}
                      data={data}
                      baseRent={baseRent}
                      requiredRent={requiredRent}
                    />
                  ))}
              </div>
              
              <div className="mt-6 p-3 bg-gray-50 rounded flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-600 rounded"></div>
                  <span>Can't afford baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ 
                    background: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 2px, #EF4444 2px, #EF4444 4px)'
                  }}></div>
                  <span className="font-semibold text-red-600">Excluded by policies</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--hdc-faded-jade)' }}></div>
                  <span>Can afford</span>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
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
                    .map(([group, data]) => (
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
                          <ImpactRatioBadge ratio={data.disparityRatio} showLabel={true} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">
                <strong>Impact Ratio:</strong> A ratio {'>'} 1.0 means the group is excluded at a higher rate than their population share. 
                For example, 2.0x means they make up twice as much of the excluded population as they do of the total population.
              </p>
            </div>

            {groupDists && (
              <IncomeDistributionTable
                demographicImpact={demographicImpact}
                groupDists={groupDists}
                baseRent={baseRent}
                requiredRent={requiredRent}
              />
            )}
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