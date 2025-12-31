import React, { useMemo, useEffect, useState } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface SeattleBaseZoneFilterProps {
  filters: Set<string>;
  onToggle: (baseZone: string) => void;
  layersRef: Map<string, google.maps.Data>;
  seattleLayerEnabled: boolean;
  categoryFilters: Set<string>;
}

const SeattleBaseZoneFilter: React.FC<SeattleBaseZoneFilterProps> = ({ 
  filters, 
  onToggle,
  layersRef,
  seattleLayerEnabled,
  categoryFilters
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Force refresh when Seattle layer is enabled and features might be loading
  useEffect(() => {
    if (seattleLayerEnabled) {
      const interval = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 1000);

      // Clear interval after 10 seconds (should be enough time for data to load)
      setTimeout(() => clearInterval(interval), 10000);

      return () => clearInterval(interval);
    }
  }, [seattleLayerEnabled]);

  // Get base zones that belong to the currently selected categories only
  const availableBaseZones = useMemo(() => {
    const seattleLayer = layersRef.get('SDCI Zoning');
    if (!seattleLayer) return [];
    
    const baseZones = new Set<string>();
    seattleLayer.forEach(feature => {
      const categoryDesc = feature.getProperty('category_desc') as string;
      const baseZone = feature.getProperty('base_zone') as string;
      
      // Only include base zones from features that match the selected categories
      if (baseZone && categoryDesc && categoryFilters.has(categoryDesc)) {
        baseZones.add(baseZone);
      }
    });
    
    return Array.from(baseZones).sort().map(zone => ({
      label: zone,
      value: zone
    }));
  }, [layersRef, refreshTrigger, categoryFilters]);

  const selectedValues = Array.from(filters);

  const handleSelectionChange = (e: { value: string[] }) => {
    const newSelection = new Set(e.value);
    const currentSelection = filters;
    
    // Find what was added or removed
    for (const baseZone of availableBaseZones.map(z => z.value)) {
      const wasSelected = currentSelection.has(baseZone);
      const isSelected = newSelection.has(baseZone);
      
      if (wasSelected !== isSelected) {
        onToggle(baseZone);
      }
    }
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 'bold', 
        fontSize: '14px' 
      }}>
        Base Zone Filters ({availableBaseZones.length} available)
      </label>
      <MultiSelect
        value={selectedValues}
        onChange={handleSelectionChange}
        options={availableBaseZones}
        optionLabel="label"
        optionValue="value"
        placeholder="Select base zones (LR1, NR3, DMC, etc.)"
        display="chip"
        filter
        checkboxIcon="pi pi-check"
        style={{ width: '100%' }}
        emptyMessage="No base zones available"
      />
      <div style={{ 
        fontSize: '12px', 
        color: '#6c757d', 
        marginTop: '4px' 
      }}>
        {filters.size === 0 
          ? 'All base zones shown' 
          : `${filters.size} base zone(s) selected`
        }
      </div>
    </div>
  );
};

export default SeattleBaseZoneFilter;