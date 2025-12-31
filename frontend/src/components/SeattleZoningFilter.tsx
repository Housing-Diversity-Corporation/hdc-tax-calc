import React from 'react';
import { MultiSelect } from 'primereact/multiselect';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface SeattleZoningFilterProps {
  filters: Set<string>;
  colors: Record<string, string>;
  onToggle: (zoneCategory: string) => void;
}

const SeattleZoningFilter: React.FC<SeattleZoningFilterProps> = ({ 
  filters, 
  colors, 
  onToggle 
}) => {
  const options = Object.keys(colors).map(category => ({
    label: category,
    value: category,
    color: colors[category]
  }));

  const selectedValues = Array.from(filters);

  const handleSelectionChange = (e: { value: string[] }) => {
    const newSelection = new Set(e.value);
    const currentSelection = filters;
    
    // Find what was added or removed
    for (const category of Object.keys(colors)) {
      const wasSelected = currentSelection.has(category);
      const isSelected = newSelection.has(category);
      
      if (wasSelected !== isSelected) {
        onToggle(category);
      }
    }
  };

  const itemTemplate = (option: { label: string; value: string; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '16px',
          height: '16px',
          backgroundColor: option.color,
          border: '1px solid #000',
          borderRadius: '2px'
        }}
      />
      <span>{option.label}</span>
    </div>
  );

  return (
    <div style={{ marginTop: '12px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 'bold', 
        fontSize: '14px' 
      }}>
        Seattle Zoning Filters
      </label>
      <MultiSelect
        value={selectedValues}
        onChange={handleSelectionChange}
        options={options}
        optionLabel="label"
        optionValue="value"
        placeholder="Select zoning categories"
        itemTemplate={itemTemplate}
        display="chip"
        filter
        checkboxIcon="pi pi-check"
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default SeattleZoningFilter;