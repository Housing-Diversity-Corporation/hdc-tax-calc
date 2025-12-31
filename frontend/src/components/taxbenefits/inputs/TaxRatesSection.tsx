import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { ConformingStates } from '../../../types/taxbenefits';
import StrategicOzSelector from './StrategicOzSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface TaxRatesSectionProps {
  federalTaxRate: number;
  setFederalTaxRate: (value: number) => void;
  ltCapitalGainsRate: number;
  setLtCapitalGainsRate: (value: number) => void;
  niitRate: number;
  setNiitRate: (value: number) => void;
  selectedState: string;
  stateCapitalGainsRate: number;
  setStateCapitalGainsRate: (value: number) => void;
  handleStateChange: (stateCode: string) => void;
  CONFORMING_STATES: ConformingStates;
  projectLocation?: string;
  setProjectLocation?: (location: string) => void;
}

const TaxRatesSection: React.FC<TaxRatesSectionProps> = ({
  federalTaxRate,
  setFederalTaxRate,
  ltCapitalGainsRate,
  setLtCapitalGainsRate,
  niitRate,
  setNiitRate,
  selectedState,
  stateCapitalGainsRate,
  setStateCapitalGainsRate,
  handleStateChange,
  CONFORMING_STATES,
  projectLocation,
  setProjectLocation
}) => {
  // Auto-apply NIIT for high-income investors
  React.useEffect(() => {
    if (ltCapitalGainsRate === 20 && niitRate !== 3.8) {
      setNiitRate(3.8);
    } else if (ltCapitalGainsRate !== 20 && niitRate !== 0) {
      setNiitRate(0);
    }
  }, [ltCapitalGainsRate, niitRate, setNiitRate]);
  return (
    <div className="hdc-section">
      <h3 className="hdc-section-header">Investor Tax Rates</h3>

      <div className="space-y-4">
        {/* Federal Ordinary Income Rate for Depreciation Benefits */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Federal Tax Rate (%) - For Depreciation Benefits</label>
          <Select value={String(federalTaxRate)} onValueChange={(value) => setFederalTaxRate(Number(value))}>
            <SelectTrigger className="hdc-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24% (Single $100k-$190k)</SelectItem>
              <SelectItem value="32">32% (Single $190k-$231k)</SelectItem>
              <SelectItem value="35">35% (Single $231k-$578k)</SelectItem>
              <SelectItem value="37">37% (Single $578k+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Capital Gains Rate for OZ Tax Calculation */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">Long-Term Capital Gains Rate (%) - For OZ Tax</label>
          <Select value={String(ltCapitalGainsRate)} onValueChange={(value) => setLtCapitalGainsRate(Number(value))}>
            <SelectTrigger className="hdc-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (Low income)</SelectItem>
              <SelectItem value="15">15% (Middle income)</SelectItem>
              <SelectItem value="20">20% (High income)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NIIT - Auto-applied for high income */}
        <div className="hdc-input-group">
          <label className="hdc-input-label">NIIT Rate (%)</label>
          <input
            type="number"
            value={niitRate}
            readOnly
            className="hdc-input"
          />
          <div className="hdc-result-label" style={{fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem'}}>
            Auto-applied for high-income investors (20% LTCG bracket)
          </div>
        </div>

        {/* Strategic OZ Selector with GO/NO_GO System */}
        <StrategicOzSelector
          selectedState={selectedState}
          handleStateChange={handleStateChange}
          projectLocation={projectLocation}
          setProjectLocation={setProjectLocation}
          federalTaxRate={federalTaxRate}
          stateCapitalGainsRate={stateCapitalGainsRate}
          setStateCapitalGainsRate={setStateCapitalGainsRate}
        />
      </div>
    </div>
  );
};

export default TaxRatesSection;