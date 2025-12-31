import React, { useState, useEffect, useRef } from 'react';
import { MultiSelect } from '@/components/ui/multi-select';
import { useContainerWidth, useResponsiveText } from '@/hooks/useResponsiveText';

interface SeattleZoningFilterProps {
  filters: Set<string>;
  colors: Record<string, string>;
  onFilterChange: (newFilters: Set<string>) => void;
  categoryToBaseZones?: Map<string, Set<string>>;
}

const SeattleZoningFilter: React.FC<SeattleZoningFilterProps> = ({
  filters,
  colors,
  onFilterChange,
  categoryToBaseZones
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref: placeholderRef, width: containerWidth } = useContainerWidth<HTMLDivElement>();
  const [maxCount, setMaxCount] = useState(2);

  // Calculate available width for placeholder (reserve ~60px for controls: X + | + chevron)
  const availablePlaceholderWidth = Math.max(0, containerWidth - 60);

  // Use responsive text for placeholder
  const fullPlaceholder = 'Select zoning categories';
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
        // Extremely conservative breakpoints - assume ~100px needed for controls (x, pipe, chevron)
        // Category names are long (e.g., "High-Density Multi-Family" = ~180px)
        if (width < 320) {
          setMaxCount(0); // Just show placeholder - too narrow for badges
        } else if (width < 450) {
          setMaxCount(1); // One badge + controls (~180px badge + 100px controls = 280px min)
        } else if (width < 600) {
          setMaxCount(2); // Two badges + controls
        } else if (width < 750) {
          setMaxCount(3);
        } else {
          setMaxCount(4);
        }
      }
    };

    updateMaxCount();
    window.addEventListener('resize', updateMaxCount);
    return () => window.removeEventListener('resize', updateMaxCount);
  }, []);

  const options = Object.keys(colors).map(category => ({
    label: category,
    value: category,
    style: {
      badgeColor: colors[category]
    }
  }));

  const handleValueChange = (selectedValues: string[]) => {
    // Simply set the new filter state
    onFilterChange(new Set(selectedValues));
  };

  return (
    <div ref={containerRef} className="mt-3">
      <label className="block text-sm">
        Seattle Zoning Filters
      </label>

      <div ref={placeholderRef}>
        <MultiSelect
          options={options}
          value={Array.from(filters)}
          onValueChange={handleValueChange}
          placeholder={responsivePlaceholder}
          searchable={true}
          searchPlaceholder="Search categories..."
          emptyMessage="No categories found."
          showClearAll={true}
          showSelectAll={true}
          maxCount={maxCount}
          className="w-full"
        />
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        {filters.size === 0
          ? 'No categories selected'
          : filters.size === 1
            ? `${filters.size} category selected`
            : `${filters.size} categories selected`
        }
      </div>
    </div>
  );
};

export default SeattleZoningFilter;
