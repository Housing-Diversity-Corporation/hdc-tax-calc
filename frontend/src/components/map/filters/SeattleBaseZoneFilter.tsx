import React, { useMemo, useEffect, useState, useRef } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { useContainerWidth, useResponsiveText } from '@/hooks/useResponsiveText';

interface SeattleBaseZoneFilterProps {
  filters: Set<string>;
  onFilterChange: (newFilters: Set<string>) => void;
  layersRef: Map<string, google.maps.Data>;
  seattleLayerEnabled: boolean;
  categoryFilters: Set<string>;
}

const SeattleBaseZoneFilter: React.FC<SeattleBaseZoneFilterProps> = ({
  filters,
  onFilterChange,
  layersRef,
  seattleLayerEnabled,
  categoryFilters
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: placeholderRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();
  const [maxCount, setMaxCount] = useState(3);

  // Calculate available width for placeholder (reserve ~60px for controls: X + | + chevron)
  const availablePlaceholderWidth = Math.max(0, containerWidth - 60);

  // Use responsive text for placeholder
  const fullPlaceholder = 'Select base zones (LR1, NR3, DMC, etc.)';
  const { displayText: responsivePlaceholder } = useResponsiveText(
    fullPlaceholder,
    availablePlaceholderWidth,
    {
      minFontSize: 12,
      maxFontSize: 14,
      truncateThreshold: 0.9,
    }
  );

  // Adjust maxCount based on container width
  useEffect(() => {
    const updateMaxCount = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Extremely conservative breakpoints - assume ~100px needed for controls
        // Base zone codes are shorter (e.g., "LR1" = ~50px, "MPC-YT" = ~70px)
        if (width < 280) {
          setMaxCount(0); // Just show placeholder - too narrow
        } else if (width < 360) {
          setMaxCount(1); // One badge + controls (~70px badge + 100px controls = 170px min)
        } else if (width < 460) {
          setMaxCount(2); // Two badges + controls
        } else if (width < 560) {
          setMaxCount(3);
        } else if (width < 660) {
          setMaxCount(4);
        } else {
          setMaxCount(5);
        }
      }
    };

    updateMaxCount();
    window.addEventListener('resize', updateMaxCount);
    return () => window.removeEventListener('resize', updateMaxCount);
  }, []);

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

  // Build dynamic mappings and get available base zones
  const { availableBaseZones, categoryToBaseZones, baseZoneToCategory } = useMemo(() => {
    const seattleLayer = layersRef.get('SDCI Zoning');
    if (!seattleLayer) return { availableBaseZones: [], categoryToBaseZones: new Map(), baseZoneToCategory: new Map() };

    const baseZones = new Set<string>();
    const catToZones = new Map<string, Set<string>>();
    const zoneToCat = new Map<string, string>();

    seattleLayer.forEach(feature => {
      const categoryDesc = feature.getProperty('category_desc') as string;
      const baseZone = feature.getProperty('base_zone') as string;

      if (categoryDesc && baseZone) {
        // Build category -> base zones map
        if (!catToZones.has(categoryDesc)) {
          catToZones.set(categoryDesc, new Set());
        }
        catToZones.get(categoryDesc)!.add(baseZone);

        // Build base zone -> category map (reverse lookup)
        zoneToCat.set(baseZone, categoryDesc);

        // If no categories selected, show ALL base zones
        // If some categories selected, only show zones from those categories
        if (categoryFilters.size === 0 || categoryFilters.has(categoryDesc)) {
          baseZones.add(baseZone);
        }
      }
    });

    return {
      availableBaseZones: Array.from(baseZones).sort(),
      categoryToBaseZones: catToZones,
      baseZoneToCategory: zoneToCat
    };
  }, [layersRef, refreshTrigger, categoryFilters]);

  const options = availableBaseZones.map(zone => ({
    label: zone,
    value: zone
  }));

  // Filter the current selections to only include zones that are in available options
  // This prevents showing selected zones that belong to unselected categories
  const filteredSelectedValues = React.useMemo(() => {
    const availableSet = new Set(availableBaseZones);
    return Array.from(filters).filter(zone => availableSet.has(zone));
  }, [filters, availableBaseZones]);

  const handleValueChange = (selectedValues: string[]) => {
    // Simply set the new filter state
    onFilterChange(new Set(selectedValues));
  };

  return (
    <div ref={containerRef} className="mt-3">
      <label className="block text-sm">
        Base Zone Filters
      </label>

      <div ref={placeholderRef}>
        <MultiSelect
          options={options}
          value={filteredSelectedValues}
          onValueChange={handleValueChange}
          placeholder={responsivePlaceholder}
          searchable={true}
          searchPlaceholder="Search zones..."
          emptyMessage="No base zones available."
          showClearAll={true}
          showSelectAll={true}
          maxCount={maxCount}
          className="w-full"
        />
      </div>

        <div className="text-xs text-muted-foreground mt-1">
        {filters.size === 0
          ? 'No zones selected'
          : filters.size === 1
            ? `${filters.size}  zone selected`
            : `${filters.size}  zones selected`
        }
      </div>
    </div>
  );
};

export default SeattleBaseZoneFilter;
