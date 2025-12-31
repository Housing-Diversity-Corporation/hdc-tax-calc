import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, Info } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { useResponsiveText, useContainerWidth } from '@/hooks/useResponsiveText';

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
}

interface LayerControlProps {
  layer: LayerConfig;
  onToggle: (layerId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (layerId: string) => void;
}

const LayerControl: React.FC<LayerControlProps> = ({ layer, onToggle, isFavorite, onToggleFavorite }) => {
  const { isMobile } = useResponsive();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Use responsive text hooks
  const { ref: labelRef, width: labelWidth } = useContainerWidth<HTMLSpanElement>();
  const { displayText, fontSize } = useResponsiveText(layer.name, labelWidth, {
    minFontSize: 9,
    maxFontSize: 14,
    truncateThreshold: 0.98,
  });


  const textStyle: React.CSSProperties = {
    lineHeight: '1.3',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    flex: 1,
    minWidth: 0,
    fontSize: `${fontSize}px`,
  };

  return (
    <div className="w-full py-1.5 px-1 flex items-start justify-between gap-2 cursor-pointer layer-control-container">
      <span ref={labelRef} className="label-text map-panel-text-sm flex-1 min-w-0 layer-control-label" style={textStyle}>
        {displayText}
        {layer.loading && ' (Loading...)'}
      </span>
      <div className="flex items-start gap-0.5 shrink-0 layer-control-actions">
        <ToggleGroup type="multiple" className="map-panel-toggle-group shrink-0">
          <ToggleGroupItem
            value="favorite"
            aria-label="Toggle favorite"
            onClick={() => onToggleFavorite(layer.id)}
            data-state={isFavorite ? "on" : "off"}
            className="map-panel-icon-sm map-panel-icon-padding data-[state=on]:text-yellow-500 aspect-square"
            style={{ aspectRatio: '1/1', minWidth: 0, width: 'auto', minHeight: 0, height: 'auto' }}
          >
            <Star className={`w-full h-full ${isFavorite ? 'fill-current' : ''}`} />
          </ToggleGroupItem>
          <Popover open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <PopoverTrigger asChild>
              <ToggleGroupItem
                value="info"
                aria-label="Show info"
                className="map-panel-icon-sm map-panel-icon-padding aspect-square"
                style={{ aspectRatio: '1/1', minWidth: 0, width: 'auto', minHeight: 0, height: 'auto' }}
                onMouseEnter={() => setIsInfoOpen(true)}
                onMouseLeave={() => setIsInfoOpen(false)}
              >
                <Info className="w-full h-full" />
              </ToggleGroupItem>
            </PopoverTrigger>
            <PopoverContent
              className="w-80"
              side={isMobile ? "top" : "right"}
              onMouseEnter={() => setIsInfoOpen(true)}
              onMouseLeave={() => setIsInfoOpen(false)}
            >
              <div className="space-y-2">
                <h4 className="font-medium leading-none text-sm">{layer.name}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {layer.description}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </ToggleGroup>
        <Switch
          checked={layer.enabled}
          disabled={layer.loading}
          onCheckedChange={() => onToggle(layer.id)}
          className="data-[state=checked]:bg-[#7fbd45] shrink-0 map-panel-switch"
        />
      </div>
    </div>
  );
};

export default LayerControl;
