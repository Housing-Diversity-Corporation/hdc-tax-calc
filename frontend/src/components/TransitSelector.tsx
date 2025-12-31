import React, { useState } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface TransitSelectorProps {
  map?: google.maps.Map | null;
}

const TransitSelector: React.FC<TransitSelectorProps> = () => {
  const [selectedTransit, setSelectedTransit] = useState<string[]>([]);

  const transitOptions = [
    { value: 'bus', label: 'Bus Station' },
    { value: 'subway', label: 'Subway Station' },
    { value: 'light_rail', label: 'Light Rail Station' },
    { value: 'train', label: 'Train Station' },
    { value: 'transit', label: 'Transit Station' }
  ];

  const handleTransitChange = (e: { value: string[] }) => {
    setSelectedTransit(e.value);
    // Update map markers for transit
  };

  return (
    <div className="control-group">
      <MultiSelect
        value={selectedTransit}
        onChange={handleTransitChange}
        options={transitOptions}
        optionLabel="label"
        optionValue="value"
        placeholder="Select Transit Types"
        display="chip"
        filter
        checkboxIcon="pi pi-check"
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default TransitSelector;