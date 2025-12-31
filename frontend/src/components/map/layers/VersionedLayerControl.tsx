import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Star, Info, ChevronDown } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';
import { Badge } from '@/components/ui/badge';
import { useResponsiveText, useContainerWidth } from '@/hooks/useResponsiveText';

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  version?: string;
  groupId?: string;
}

interface LayerGroup {
  groupId: string;
  groupName: string;
  description?: string;
  layers: LayerConfig[];
}

interface VersionedLayerControlProps {
  layerGroups: LayerGroup[];
  onToggle: (layerId: string) => void;
  favoriteLayers: Set<string>;
  onToggleFavorite: (layerId: string) => void;
}

// Component for layer name with responsive text
const ResponsiveLayerName: React.FC<{ name: string; className?: string }> = ({ name, className = "map-panel-text-sm text-muted-foreground flex-1 min-w-0 map-panel-label-wrap" }) => {
  const { ref: labelRef, width: labelWidth } = useContainerWidth<HTMLSpanElement>();
  const { displayText, fontSize } = useResponsiveText(name, labelWidth, {
    minFontSize: 9,
    maxFontSize: 14,
    truncateThreshold: 0.98,
  });

  return (
    <span
      ref={labelRef}
      className={className}
      style={{ fontSize: `${fontSize}px` }}
    >
      {displayText}
    </span>
  );
};

// Component for group name with responsive text
const ResponsiveGroupName: React.FC<{ name: string }> = ({ name }) => {
  const { ref: labelRef, width: labelWidth } = useContainerWidth<HTMLSpanElement>();
  const { displayText, fontSize } = useResponsiveText(name, labelWidth, {
    minFontSize: 8,
    maxFontSize: 14,
    truncateThreshold: 0.99,
  });

  return (
    <span
      ref={labelRef}
      className="font-medium map-panel-text-sm flex-1"
      style={{
        fontSize: `${fontSize}px`,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      {displayText}
    </span>
  );
};

// Component for version selector with responsive text
const ResponsiveVersionSelector: React.FC<{
  selectedLayerId: string | undefined;
  layers: LayerConfig[];
  groupId: string;
  onVersionChange: (groupId: string, layerId: string) => void;
}> = ({ selectedLayerId, layers, groupId, onVersionChange }) => {
  const { ref: textContainerRef, width: textWidth } = useContainerWidth<HTMLSpanElement>();

  // Find the selected layer to get its version/name
  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const displayName = selectedLayer ? (selectedLayer.version || selectedLayer.name) : "";

  const { displayText, fontSize } = useResponsiveText(displayName || "Select version", textWidth * 3, {
    minFontSize: 9,
    maxFontSize: 14,
    truncateThreshold: 0.85,
  });

  return (
    <Select
      value={selectedLayerId || ""}
      onValueChange={(layerId) => onVersionChange(groupId, layerId)}
    >
      <SelectTrigger className="h-8 map-panel-text-sm w-full version-select-trigger flex items-center justify-between">
        {selectedLayer ? (
          <SelectValue asChild>
            <span ref={textContainerRef} style={{ fontSize: `${fontSize}px` }} className="block truncate text-center">
              {displayText}
              {selectedLayer.loading && ' (Loading...)'}
            </span>
          </SelectValue>
        ) : (
          <span ref={textContainerRef} className="text-muted-foreground block truncate text-center" style={{ fontSize: `${fontSize}px` }}>
            {displayText}
          </span>
        )}
      </SelectTrigger>
      <SelectContent>
        {layers.map(layer => (
          <SelectItem
            key={layer.id}
            value={layer.id}
            className="map-panel-text-sm pr-24 text-center justify-center"
          >
            {layer.version || layer.name}
            {layer.loading && ' (Loading...)'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const VersionedLayerControl: React.FC<VersionedLayerControlProps> = ({
  layerGroups,
  onToggle,
  favoriteLayers,
  onToggleFavorite,
}) => {
  const { isMobile } = useResponsive();
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [openInfoPopover, setOpenInfoPopover] = useState<string | null>(null);

  // Initialize selected versions from enabled layers
  useEffect(() => {
    const newSelectedVersions: Record<string, string> = {};
    layerGroups.forEach(group => {
      const enabledLayer = group.layers.find(layer => layer.enabled);
      if (enabledLayer) {
        newSelectedVersions[group.groupId] = enabledLayer.id;
      }
      // If no enabled layers, clear the selection for this group
      else {
        delete newSelectedVersions[group.groupId];
      }
    });
    setSelectedVersions(newSelectedVersions);
  }, [layerGroups]);

  const handleVersionChange = (groupId: string, layerId: string) => {
    const group = layerGroups.find(g => g.groupId === groupId);
    if (!group) return;

    // Multi-select: Don't disable other versions, just toggle the selected one
    const selectedLayer = group.layers.find(l => l.id === layerId);
    if (selectedLayer) {
      onToggle(layerId);
    }

    // Update primary selected version for the dropdown
    setSelectedVersions(prev => ({ ...prev, [groupId]: layerId }));
  };

  const handleGroupToggle = (groupId: string, enabled: boolean) => {
    const selectedLayerId = selectedVersions[groupId];
    if (!selectedLayerId) {
      // If no version selected, enable the first version
      const group = layerGroups.find(g => g.groupId === groupId);
      if (group && group.layers.length > 0) {
        const firstLayer = group.layers[0];
        handleVersionChange(groupId, firstLayer.id);
      }
    } else {
      onToggle(selectedLayerId);
    }
  };

  return (
    <div className="space-y-1.5 w-full overflow-hidden">
      {layerGroups.map(group => {
        const selectedLayerId = selectedVersions[group.groupId];
        const selectedLayer = group.layers.find(l => l.id === selectedLayerId);
        const isAnyEnabled = group.layers.some(l => l.enabled);
        const enabledCount = group.layers.filter(l => l.enabled).length;

        return (
          <Accordion key={group.groupId} type="single" collapsible className="w-full overflow-hidden">
            <AccordionItem value={group.groupId} className="border rounded-md px-2 overflow-hidden">
              <AccordionTrigger className="py-1.5 hover:no-underline map-panel-text-sm min-w-0 overflow-hidden w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <ResponsiveGroupName name={group.groupName} />
                  {enabledCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] shrink-0 px-1 py-0">
                      {enabledCount}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-1.5 overflow-hidden">
                <div className="space-y-1.5 pl-6 w-full overflow-hidden">
                  {/* Version selector */}
                  <ResponsiveVersionSelector
                    selectedLayerId={selectedLayerId}
                    layers={group.layers}
                    groupId={group.groupId}
                    onVersionChange={handleVersionChange}
                  />

                  {/* Show all enabled layers */}
                  {group.layers.filter(l => l.enabled).map(layer => (
                    <div key={layer.id} className="layer-item-container">
                      <div className="layer-item-left">
                        <ResponsiveLayerName name={layer.name} />
                        <ToggleGroup type="multiple" className="map-panel-toggle-group shrink-0">
                          <ToggleGroupItem
                            value="favorite"
                            aria-label="Toggle favorite"
                            onClick={() => onToggleFavorite(layer.id)}
                            data-state={favoriteLayers.has(layer.id) ? "on" : "off"}
                            className="map-panel-icon-sm map-panel-icon-padding data-[state=on]:text-yellow-500 aspect-square"
                            style={{ aspectRatio: '1/1' }}
                          >
                            <Star className={`w-full h-full ${favoriteLayers.has(layer.id) ? 'fill-current' : ''}`} />
                          </ToggleGroupItem>
                          <Popover
                            open={openInfoPopover === layer.id}
                            onOpenChange={(open) => setOpenInfoPopover(open ? layer.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <ToggleGroupItem
                                value="info"
                                aria-label="Show info"
                                className="map-panel-icon-sm map-panel-icon-padding aspect-square"
                                style={{ aspectRatio: '1/1' }}
                                onMouseEnter={() => setOpenInfoPopover(layer.id)}
                                onMouseLeave={() => setOpenInfoPopover(null)}
                              >
                                <Info className="w-full h-full" />
                              </ToggleGroupItem>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-80"
                              side={isMobile ? "top" : "right"}
                              onMouseEnter={() => setOpenInfoPopover(layer.id)}
                              onMouseLeave={() => setOpenInfoPopover(null)}
                            >
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none text-sm">{layer.name}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {layer.description}
                                </p>
                                {layer.version && (
                                  <p className="text-xs text-muted-foreground">
                                    Version: {layer.version}
                                  </p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </ToggleGroup>
                      </div>
                      <Switch
                        checked={layer.enabled}
                        disabled={layer.loading}
                        onCheckedChange={() => onToggle(layer.id)}
                        className="data-[state=checked]:bg-[#7fbd45] shrink-0 map-panel-switch"
                      />
                    </div>
                  ))}

                  {/* Group description if available */}
                  {group.description && (
                    <p className="map-panel-text-sm text-muted-foreground italic">
                      {group.description}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </div>
  );
};

export default VersionedLayerControl;
