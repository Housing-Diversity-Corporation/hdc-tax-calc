import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { BASELINE_MIN_SF, UnitType, requiredMonthlyRent, annualIncomeNeededForRent, ACS_RENTER_BINS } from '../lib/affordability';
import { renterIncomeBinsByZcta } from '../lib/acs';
import { zctaToPumas } from '../lib/crosswalk';
import { fetchPumsHouseholds, raceEthnicityGroup } from '../lib/pums';
import { safmrFor } from '../lib/hud';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type GroupDist = Record<string, number[]>;
function bedroomsCount(ut: UnitType){ return (ut==='Micro' || ut==='Studio') ? 0 : Number(ut[0]); }
async function getBaselinedRent(zip:string, unit:UnitType, baseMethod:'SAFMR'|'Manual', manualBase:number){
  if (baseMethod === 'Manual') return manualBase;
  const bedFor = unit==='Micro' ? 'Studio' : unit;
  return await safmrFor(zip, bedFor as 'Studio' | '1BR' | '2BR' | '3BR' | '4BR');
}

export default function DemographicCalc(){
  const s = useAppStore();
  const [loading, setLoading] = useState(false);
  const [acsBins, setAcsBins] = useState<number[] | null>(null);
  const [groupDists, setGroupDists] = useState<GroupDist | null>(null);
  const [error, setError] = useState<string|null>(null);
  const [baseRent, setBaseRent] = useState<number>(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [formData, setFormData] = useState({
    zip: s.zip,
    stateFips: s.stateFips,
    unit: s.unit,
    baseMethod: s.baseMethod,
    manualBaseRent: s.manualBaseRent
  });

  const handleSubmit = async () => {
    try{
      setLoading(true);
      setError(null);
      
      // Map state FIPS to geocorr state
      const geocorrState = formData.stateFips === '06' ? 'ca' : formData.stateFips === '53' ? 'wa' : 'ca';
      
      const base = await getBaselinedRent(formData.zip, formData.unit, formData.baseMethod, formData.manualBaseRent);
      setBaseRent(base);
      const bins = await renterIncomeBinsByZcta(formData.zip, import.meta.env.VITE_CENSUS_API_KEY || '');
      setAcsBins(bins);
      const xw = await zctaToPumas(formData.zip, formData.stateFips, geocorrState);
      const groups:GroupDist = {};
      for (const g of xw){
        const rows = await fetchPumsHouseholds(g.statefp, [g.puma], import.meta.env.VITE_CENSUS_API_KEY || '');
        for (const r of rows){
          if (Number(r.TEN) !== 3) continue;
          const grp = raceEthnicityGroup(Number(r.RAC1P), Number(r.HISP));
          const h = Number(r.HINCP);
          const w = Number(r.WGTP);
          let idx = -1;
          for (let i=0;i<ACS_RENTER_BINS.length;i++){
            const [lo, hi] = ACS_RENTER_BINS[i];
            if (hi===null){ if (h>=lo) { idx=i; break; } }
            else if (h>=lo && h<=hi){ idx=i; break; }
          }
          if (idx<0) continue;
          groups[grp] = groups[grp] || Array(11).fill(0);
          groups[grp][idx] += w * g.weight;
        }
      }
      setGroupDists(groups);
      
      // Update the store with the form data
      s.set('zip', formData.zip);
      s.set('stateFips', formData.stateFips);
      s.set('unit', formData.unit);
      s.set('baseMethod', formData.baseMethod);
      s.set('manualBaseRent', formData.manualBaseRent);
    } catch(e: unknown) {
      console.error(e);
      setError((e as Error).message || 'Failed to load data');
    }finally{
      setLoading(false);
    }
  };

  const requiredRent = useMemo(() => {
    const ut:UnitType = s.unit;
    const stalls = s.parkingRules[ut] ?? 0;
    const parkCap = stalls * (s.parkingCosts.capexPerStall[ut] || 0);
    const parkOpx = stalls * (s.parkingCosts.opexPerStall[ut] || 0);
    const feeOverride = s.impact.perTypeOverride[ut] || 0;
    const impactCap = feeOverride>0 ? feeOverride : (s.impact.perUnitGlobal + s.impact.perBedroomGlobal * bedroomsCount(ut));
    const baseSF = BASELINE_MIN_SF[ut];
    const statSF = s.perTypeSF.statutorySF[ut];
    const targetSF = s.perTypeSF.targetSF[ut];
    const extraStatSF = Math.max(0, statSF - baseSF);
    const extraElecSF = Math.max(0, targetSF - Math.max(baseSF, statSF));
    const extraCap = (extraStatSF + extraElecSF) * (s.perTypeSF.capexPerSF[ut] || 0);
    const extraOpx = (extraStatSF + extraElecSF) * (s.perTypeSF.opexPerSF[ut] || 0);
    const capitalAdds = [parkCap, impactCap, extraCap, s.otherCapex];
    const opexAdds = [parkOpx, extraOpx, s.otherOpexMonthly];
    return requiredMonthlyRent(baseRent, capitalAdds, opexAdds, s.finance.annualInterestRate, s.finance.termYears);
  }, [s, baseRent]);

  const incomeNeeded = useMemo(() => annualIncomeNeededForRent(requiredRent, 0.30), [requiredRent]);

  // Simple readouts + unit mix CSV
  const pdfRef = useRef<HTMLDivElement>(null);
  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation:'portrait', unit:'pt', format:'letter' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height / canvas.width) * w;
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    pdf.save(`housing_impact_${s.zip}_${s.unit}.pdf`);
  };

  // Calculate how many households can afford at different rent levels
  const calculateAffordability = useMemo(() => {
    if (!acsBins) return null;
    
    const baseAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      // Use midpoint of income range for more accurate calculation
      const midIncome = hi ? (lo + hi) / 2 : lo;
      const maxAffordableRent = (midIncome * 0.30) / 12; // 30% of income for rent
      if (maxAffordableRent >= baseRent) return sum + count;
      return sum;
    }, 0);
    
    const totalHouseholds = acsBins.reduce((a, b) => a + b, 0);
    const requiredAffordable = acsBins.reduce((sum, count, idx) => {
      const [lo, hi] = ACS_RENTER_BINS[idx];
      // Use midpoint of income range for more accurate calculation
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

  // Calculate demographic impact - which groups are excluded when costs increase
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
    
    // First pass: calculate basic metrics
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
        shareOfTotal: 0, // Will calculate in second pass
        shareOfExcluded: 0, // Will calculate in second pass
        disparityRatio: 0 // Will calculate in second pass
      };
    }
    
    // Second pass: calculate proportional metrics
    for (const data of Object.values(result)) {
      data.shareOfTotal = grandTotal > 0 ? (data.total / grandTotal) * 100 : 0;
      data.shareOfExcluded = totalExcluded > 0 ? (data.excluded / totalExcluded) * 100 : 0;
      // Disparity ratio: if a group is 20% of population but 40% of excluded, ratio is 2.0
      data.disparityRatio = data.shareOfTotal > 0 ? data.shareOfExcluded / data.shareOfTotal : 0;
    }
    
    return result;
  }, [groupDists, baseRent, requiredRent]);

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50" style={{fontFamily: 'Arial, sans-serif'}} ref={pdfRef}>
      <div className="text-center mb-3" style={{backgroundColor: 'white', borderRadius: '8px', paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '1rem', paddingRight: '1rem'}}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/HDCLOGO.png" 
            alt="HDC Logo" 
            style={{ 
              width: '280px', 
              height: 'auto', 
              display: 'block'
            }} 
          />
          <h1 className="text-3xl font-bold" style={{ 
            color: 'var(--hdc-faded-jade)',
            letterSpacing: '0.5px',
            marginTop: '0.125rem'
          }}>Housing Affordability Calculator</h1>
        </div>
      </div>
      
      <div className="text-center text-2xl mb-2" style={{
        fontWeight: '600',
        color: 'white',
        padding: '1rem 2rem',
        backgroundColor: 'var(--hdc-faded-jade)',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>    
        Analyze who gets excluded when housing costs increase    
      </div>

      <div className="gap-4 md:gap-6" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Inputs Section */}
        <div className="flex-1 min-w-0" style={{borderRadius:'8px', backgroundColor:'#e5e5e5', padding: '1.5rem'}}>
          <h2 className="text-2xl font-semibold mb-6" style={{color: 'var(--hdc-faded-jade)'}}>Inputs</h2>
          
          <div className="bg-white rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-4" style={{color: '#333'}}>Basic Inputs</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">ZIP Code</label>
                <input value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">State</label>
                <select value={formData.stateFips} onChange={e => setFormData({...formData, stateFips: e.target.value})} className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="06">California</option>
                  <option value="53">Washington</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Unit Type</label>
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value as UnitType})} className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  {['Micro','Studio','1BR','2BR','3BR','4BR'].map(u=> <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Baseline Method</label>
                <select value={formData.baseMethod} onChange={e => setFormData({...formData, baseMethod: e.target.value as 'SAFMR' | 'Manual'})} className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="SAFMR">HUD SAFMR</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              {formData.baseMethod === 'Manual' && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Manual Baseline ($/mo)</label>
                  <input type="number" value={formData.manualBaseRent} onChange={e => setFormData({...formData, manualBaseRent: Number(e.target.value)})} className="border border-gray-300 px-3 py-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-6 py-3 rounded-md font-medium text-white transition-colors"
                style={{
                  backgroundColor: loading ? '#9CA3AF' : 'var(--hdc-faded-jade)',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#4a9b8e')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--hdc-faded-jade)')}
              >
                {loading ? 'Loading...' : 'Calculate Impact'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{color: '#333'}}>Cost Drivers</h3>
            <p className="text-sm text-gray-600 mb-4">Additional costs that increase housing prices</p>
            
            <div className="mb-4">
              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="font-medium flex items-center gap-2 transition-colors"
                style={{color: 'var(--hdc-faded-jade)'}}
              >
                {showAdvancedSettings ? '▼' : '▶'} {showAdvancedSettings ? 'Hide' : 'Show'} Detailed Settings
              </button>
            </div>
            
            {showAdvancedSettings && (
            <>
            <h4 className="text-md font-semibold text-gray-700 mb-3 mt-6">Parking Configuration</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Stalls per Unit</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.parkingRules[ut]} onChange={e=> s.set('parkingRules', { ...s.parkingRules, [ut]: Number(e.target.value) })} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Capital Cost per Stall ($)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.parkingCosts.capexPerStall[ut]} onChange={e=> s.set('parkingCosts', { ...s.parkingCosts, capexPerStall: { ...s.parkingCosts.capexPerStall, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Operating Cost per Stall ($/mo)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.parkingCosts.opexPerStall[ut]} onChange={e=> s.set('parkingCosts', { ...s.parkingCosts, opexPerStall: { ...s.parkingCosts.opexPerStall, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-700 mb-3 mt-6">Impact Fees</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600">Global per-unit ($)</label>
                  <input type="number" value={s.impact.perUnitGlobal} onChange={e=> s.set('impact', { ...s.impact, perUnitGlobal: Number(e.target.value) })} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-600">Global per-bedroom ($)</label>
                  <input type="number" value={s.impact.perBedroomGlobal} onChange={e=> s.set('impact', { ...s.impact, perBedroomGlobal: Number(e.target.value) })} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Schedule Override per Unit Type ($)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.impact.perTypeOverride[ut]} onChange={e=> s.set('impact', { ...s.impact, perTypeOverride: { ...s.impact.perTypeOverride, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-700 mb-3 mt-6">Extra Floor Area Requirements</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Target Square Footage</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.perTypeSF.targetSF[ut]} onChange={e=> s.set('perTypeSF', { ...s.perTypeSF, targetSF: { ...s.perTypeSF.targetSF, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Statutory Square Footage</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.perTypeSF.statutorySF[ut]} onChange={e=> s.set('perTypeSF', { ...s.perTypeSF, statutorySF: { ...s.perTypeSF.statutorySF, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Capital Cost per SF ($)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.perTypeSF.capexPerSF[ut]} onChange={e=> s.set('perTypeSF', { ...s.perTypeSF, capexPerSF: { ...s.perTypeSF.capexPerSF, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Operating Cost per SF ($/mo)</h5>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Micro','Studio','1BR','2BR','3BR','4BR'] as UnitType[]).map(ut=> (
                    <div key={ut}>
                      <label className="block mb-1 text-xs font-medium text-gray-500">{ut}</label>
                      <input type="number" value={s.perTypeSF.opexPerSF[ut]} onChange={e=> s.set('perTypeSF', { ...s.perTypeSF, opexPerSF: { ...s.perTypeSF.opexPerSF, [ut]: Number(e.target.value) }})} className="border border-gray-300 px-2 py-1 w-full rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-700 mb-3 mt-6">Additional Costs & Financing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600">Other Capital Costs ($)</label>
                <input type="number" value={s.otherCapex} onChange={e=> s.set('otherCapex', Number(e.target.value))} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600">Other Monthly O&M ($/mo)</label>
                <input type="number" value={s.otherOpexMonthly} onChange={e=> s.set('otherOpexMonthly', Number(e.target.value))} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600">Interest Rate (%)</label>
                <input type="number" value={s.finance.annualInterestRate*100} onChange={e => s.set('finance', { ...s.finance, annualInterestRate: Number(e.target.value)/100 })} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-600">Loan Term (years)</label>
                <input type="number" value={s.finance.termYears} onChange={e => s.set('finance', { ...s.finance, termYears: Number(e.target.value) })} className="border border-gray-300 px-3 py-2 w-full rounded-md" />
              </div>
            </div>
            </>
            )}
          </div>
        </div>

        {/* Results Section */}
        {!loading && !error && baseRent > 0 && (
        <div className="flex-1 min-w-0" style={{borderRadius:'8px', backgroundColor:'#e5e5e5', padding: '1.5rem'}}>
          <h2 className="text-2xl font-semibold mb-6" style={{color: 'var(--hdc-faded-jade)'}}>Results</h2>
          
          <div className="bg-white rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--hdc-faded-jade)'}}>Housing Affordability Impact</h3>
            
            {calculateAffordability && (
              <>
              <div className="mb-4">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Households Excluded:</td>
                      <td className="py-2 text-right font-semibold text-red-600">
                        {calculateAffordability.excluded.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-sm text-gray-600">Percentage of All Renters:</td>
                      <td className="py-2 text-right font-semibold">
                        {calculateAffordability.excludedPct.toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500">Baseline Rent</div>
                  <div className="text-lg font-semibold" style={{color: 'var(--hdc-faded-jade)'}}>${baseRent.toFixed(0)}/mo</div>
                  <div className="text-xs text-gray-500">{calculateAffordability.baseAffordable.toLocaleString()} can afford</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Required Rent</div>
                  <div className="text-lg font-semibold text-red-600">${requiredRent.toFixed(0)}/mo</div>
                  <div className="text-xs text-gray-500">{calculateAffordability.requiredAffordable.toLocaleString()} can afford</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Income Needed</div>
                  <div className="text-lg font-semibold">${incomeNeeded.toFixed(0)}/yr</div>
                  <div className="text-xs text-gray-500">30% rent burden</div>
                </div>
              </div>
              </>
            )}

            {acsBins && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Income Distribution Analysis</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left font-medium text-gray-600">Income Range</th>
                        <th className="py-1 text-center font-medium text-gray-600">Households</th>
                        <th className="py-1 text-center font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acsBins.map((count, i) => {
                        const [lo, hi] = ACS_RENTER_BINS[i];
                        // Use the midpoint of the income range for more accurate calculation
                        const midIncome = hi ? (lo + hi) / 2 : lo;
                        const maxAffordableRent = (midIncome * 0.30) / 12;
                        const canAffordBase = maxAffordableRent >= baseRent;
                        const canAffordRequired = maxAffordableRent >= requiredRent;
                        const excluded = canAffordBase && !canAffordRequired;
                        
                        return (
                          <tr key={i} className={`border-b ${
                            excluded ? 'bg-red-50' : ''
                          }`}>
                            <td className="py-1 text-xs">
                              ${lo.toLocaleString()}-{hi ? `$${hi.toLocaleString()}` : '+'}
                            </td>
                            <td className="py-1 text-center text-xs">{count.toLocaleString()}</td>
                            <td className="py-1 text-center text-xs">
                              {excluded && <span className="text-red-600 font-semibold">Excluded</span>}
                              {!excluded && canAffordRequired && <span className="text-green-600">✓</span>}
                              {!excluded && !canAffordRequired && <span className="text-gray-400">-</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {demographicImpact && (
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--hdc-faded-jade)'}}>Demographic Impact Analysis</h3>
            
            {/* Disparity Summary Table */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Disproportionate Impact Summary</h4>
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 text-left font-medium text-gray-600">Top Impacted Groups</th>
                    <th className="py-1 text-center font-medium text-gray-600">Disparity Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(demographicImpact)
                    .filter(([_, data]) => data.excluded > 0)
                    .sort((a, b) => b[1].disparityRatio - a[1].disparityRatio)
                    .slice(0, 3)
                    .map(([group, data]) => (
                      <tr key={group} className="border-b">
                        <td className="py-1 text-xs">{group}</td>
                        <td className="py-1 text-center">
                          <span className={`font-semibold text-xs ${
                            data.disparityRatio > 1.5 ? 'text-red-600' :
                            data.disparityRatio > 1.2 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {data.disparityRatio.toFixed(2)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="text-xs text-gray-500">
                Ratio &gt;1.0 indicates group is excluded at higher rate than population share
              </div>
            </div>
            
            {/* Detailed breakdown */}
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Breakdown by Group</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 text-left font-medium text-gray-600">Group</th>
                    <th className="py-1 text-center font-medium text-gray-600">% of Pop</th>
                    <th className="py-1 text-center font-medium text-gray-600">Excluded</th>
                    <th className="py-1 text-center font-medium text-gray-600">% of Excluded</th>
                    <th className="py-1 text-center font-medium text-gray-600">Disparity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(demographicImpact)
                    .sort((a, b) => b[1].disparityRatio - a[1].disparityRatio)
                    .map(([group, data]) => {
                      const isDisproportionate = data.disparityRatio > 1.2;
                      
                      return (
                        <tr key={group} className={`border-b ${
                          isDisproportionate ? 'bg-red-50' :
                          data.excluded > 0 ? 'bg-yellow-50' : ''
                        }`}>
                          <td className="py-1 text-xs font-medium">
                            {group}
                          </td>
                          <td className="py-1 text-center text-xs">
                            {data.shareOfTotal.toFixed(1)}%
                          </td>
                          <td className="py-1 text-center text-xs font-semibold">
                            {data.excluded.toFixed(0)}
                          </td>
                          <td className="py-1 text-center text-xs">
                            {data.shareOfExcluded.toFixed(1)}%
                          </td>
                          <td className="py-1 text-center">
                            <span className={`font-semibold text-xs ${
                              data.disparityRatio > 1.5 ? 'text-red-600' :
                              data.disparityRatio > 1.0 ? 'text-orange-600' :
                              'text-gray-600'
                            }`}>
                              {data.disparityRatio.toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
          )}
          
          <div className="mt-4 flex justify-center">
            <button 
              onClick={downloadPDF} 
              className="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: 'var(--hdc-faded-jade)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a9b8e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--hdc-faded-jade)'}
            >
              Download PDF Report
            </button>
          </div>
        </div>
        )}

        {error && <div className="text-red-600 text-center mt-4">{error}</div>}
        {loading && <div className="text-center mt-4">Loading...</div>}
      </div>
    </div>
  );
}