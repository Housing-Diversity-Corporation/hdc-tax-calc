import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MarkerPreview from './MarkerPreview';
import {
  MARKER_TYPES,
  MARKER_CATEGORIES,
  getMarkerTypesByCategory,
  type MarkerTypeDefinition,
} from '../../../utils/map/markerTypes';

interface MarkerTypeSelectorProps {
  currentType: string | string[]; // Current auto-detected types
  customType?: string; // User's custom selection (if any)
  onTypeChange: (newType: string) => void;
}

/**
 * MarkerTypeSelector - Popover-based selector for choosing marker types
 * Allows users to override auto-detected marker types with custom selection
 */
const MarkerTypeSelector: React.FC<MarkerTypeSelectorProps> = ({
  currentType,
  customType,
  onTypeChange,
}) => {
  const [open, setOpen] = useState(false);

  // Determine the display type (custom takes priority)
  const displayType = customType || (Array.isArray(currentType) ? currentType[0] : currentType) || 'default';

  // Get the marker type definition
  const currentMarkerType = MARKER_TYPES[displayType] || MARKER_TYPES.default;

  // Group marker types by category
  const groupedTypes = getMarkerTypesByCategory();

  const handleSelect = (typeId: string) => {
    console.log('🎨 [MarkerTypeSelector] handleSelect called:', {
      typeId,
      currentType,
      customType,
      displayType
    });
    onTypeChange(typeId);
    setOpen(false);
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div
                className="w-12 h-12 relative hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md cursor-pointer flex items-center justify-center transition-colors"
                role="button"
                tabIndex={0}
              >
                <MarkerPreview markerType={displayType} size={36} className="flex items-center justify-center" />
                {customType && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" />
                )}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{customType ? `Custom: ${currentMarkerType.label}` : `Auto: ${currentMarkerType.label}`}</p>
            <p className="text-xs text-muted-foreground">Click to change marker type</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search marker types..." />
            <CommandList>
              <CommandEmpty>No marker type found.</CommandEmpty>

              {Object.entries(groupedTypes).map(([categoryId, types]) => {
                const category = MARKER_CATEGORIES[categoryId as keyof typeof MARKER_CATEGORIES];
                if (!category || types.length === 0) return null;

                return (
                  <CommandGroup key={categoryId} heading={`${category.icon} ${category.label}`}>
                    {types.map((type: MarkerTypeDefinition) => (
                      <CommandItem
                        key={type.id}
                        value={`${type.label} ${type.keywords.join(' ')}`}
                        onSelect={() => handleSelect(type.id)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <MarkerPreview markerType={type.id} size={20} />
                        <span className="flex-1">{type.label}</span>
                        {displayType === type.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default MarkerTypeSelector;
