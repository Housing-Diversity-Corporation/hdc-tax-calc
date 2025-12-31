import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '../../../contexts/ThemeContext';
import { useResponsiveText, useContainerWidth } from '@/hooks/useResponsiveText';

interface LocationFilterProps {
  locations: ({ name: string; code: string; cities?: { name: string; code: string; }[] })[];
  selectedLocation: { name: string; code: string } | null;
  onLocationChange: (value: { name: string; code: string }) => void;
}

const LocationFilter: React.FC<LocationFilterProps> = ({ locations, selectedLocation, onLocationChange }) => {
  const { isDarkMode } = useTheme();
  const { ref: triggerRef, width: triggerWidth } = useContainerWidth<HTMLButtonElement>();

  const displayName = selectedLocation?.name || "";
  const { displayText, fontSize } = useResponsiveText(displayName || "Filter by location", triggerWidth, {
    minFontSize: 9,
    maxFontSize: 14,
    truncateThreshold: 0.98,
  });

  const handleValueChange = (value: string) => {
    // Parse the value back to find the location object
    for (const state of locations) {
      if (state.code === value) {
        onLocationChange(state);
        return;
      }
      if (state.cities) {
        for (const city of state.cities) {
          if (city.code === value) {
            onLocationChange(city);
            return;
          }
        }
      }
    }
  };

  return (
    <div className="w-full">
      <Select
        value={selectedLocation?.code || ''}
        onValueChange={handleValueChange}
      >
        <SelectTrigger ref={triggerRef} className="w-full min-w-0 map-panel-text-sm">
          {selectedLocation ? (
            <SelectValue asChild>
              <span style={{ fontSize: `${fontSize}px` }}>
                {displayText}
              </span>
            </SelectValue>
          ) : (
            <span className="text-muted-foreground" style={{ fontSize: `${fontSize}px` }}>
              {displayText}
            </span>
          )}
        </SelectTrigger>
        <SelectContent>
          {locations.map((state) => (
            <SelectGroup key={state.code}>
              <SelectLabel>{state.name}</SelectLabel>
              <SelectItem value={state.code}>{state.name} (State)</SelectItem>
              {state.cities && state.cities.map((city) => (
                <SelectItem key={city.code} value={city.code}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationFilter;
