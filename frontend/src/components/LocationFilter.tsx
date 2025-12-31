import React from 'react';
import { CascadeSelect, CascadeSelectChangeEvent } from 'primereact/cascadeselect';
import { useTheme } from '../contexts/ThemeContext';

interface LocationFilterProps {
  locations: ({ name: string; code: string; cities?: { name: string; code: string; }[] })[];
  selectedLocation: { name: string; code: string } | null;
  onLocationChange: (e: CascadeSelectChangeEvent) => void;
}

const LocationFilter: React.FC<LocationFilterProps> = ({ locations, selectedLocation, onLocationChange }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className="card flex">
      <CascadeSelect
        value={selectedLocation}
        onChange={onLocationChange}
        options={locations}
        optionLabel="name"
        optionGroupLabel="name"
        optionGroupChildren={['cities']}
        className="w-full md:w-14rem"
        breakpoint="767px"
        placeholder="Filter by location"
        style={{
          minWidth: '14rem',
          backgroundColor: isDarkMode ? '#333333' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          border: `1px solid ${isDarkMode ? '#555555' : '#cccccc'}`
        }}
        variant="filled"
      />
    </div>
  );
};

export default LocationFilter;