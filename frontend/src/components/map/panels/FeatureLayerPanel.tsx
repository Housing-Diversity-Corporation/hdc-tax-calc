import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FeatureData {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
  priority: number;
  feature?: google.maps.Data.Feature;
}

interface FeatureLayerPanelProps {
  visible: boolean;
  onClose: () => void;
  features: FeatureData[];
  onSetPriority: (layerId: string, priority: number) => void;
  layerHierarchy: Map<string, number>;
  onHighlightFeature?: (layerId: string, feature?: google.maps.Data.Feature) => void;
}

const formatKey = (key: string): string => {
  if (typeof key !== 'string' || key.length === 0) return '';
  const words = key.split('_');
  const capitalizedWords = words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  return capitalizedWords.join(' ');
};

const FeatureLayerPanel: React.FC<FeatureLayerPanelProps> = ({
  visible,
  onClose,
  features,
  onSetPriority,
  layerHierarchy,
  onHighlightFeature
}) => {
  // console.log('🎨 [STEP 11] FeatureLayerPanel render');
  // console.log('🎨 [STEP 11] visible prop:', visible);
  // console.log('🎨 [STEP 11] features count:', features.length);
  // console.log('🎨 [STEP 11] features:', features);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [parcelData, setParcelData] = useState<{ [layerId: string]: Record<string, string | number | boolean> }>({});

  // Sort features by priority (higher priority = shown on top)
  const sortedFeatures = [...features].sort((a, b) => b.priority - a.priority);
  // console.log('🎨 [STEP 11] sortedFeatures:', sortedFeatures);
  // console.log('🎨 [STEP 11] Detailed priorities:', sortedFeatures.map(f => ({ layerId: f.layerId, priority: f.priority })));

  // Create a stable identifier for the top feature to use as dependency
  const topFeatureId = sortedFeatures.length > 0 ? sortedFeatures[0].layerId : null;
  const topFeature = sortedFeatures.length > 0 ? sortedFeatures[0].feature : null;

  // Store the callback in a ref to avoid dependency issues
  const onHighlightFeatureRef = useRef(onHighlightFeature);
  useEffect(() => {
    onHighlightFeatureRef.current = onHighlightFeature;
  }, [onHighlightFeature]);

  // Highlight the top feature when features change or order changes
  useEffect(() => {
    // console.log('🎨 [HIGHLIGHT] useEffect triggered');
    // console.log('🎨 [HIGHLIGHT] visible:', visible);
    // console.log('🎨 [HIGHLIGHT] sortedFeatures.length:', sortedFeatures.length);
    // console.log('🎨 [HIGHLIGHT] topFeatureId:', topFeatureId);

    if (visible && sortedFeatures.length > 0 && onHighlightFeatureRef.current) {
      // console.log('🎨 [HIGHLIGHT] Calling onHighlightFeature for:', sortedFeatures[0].layerId);
      onHighlightFeatureRef.current(sortedFeatures[0].layerId, sortedFeatures[0].feature);
    }
  }, [visible, topFeatureId, topFeature]); // Removed onHighlightFeature from deps, using ref instead

  // Fetch King County parcel data for KC Parcels layer
  useEffect(() => {
    if (!visible) return;

    const fetchParcelDataForLayers = async () => {
      // Dynamically import api to use the configured base URL
      const api = (await import('../../../services/api')).default;

      for (const feature of features) {
        if (feature.layerId === 'King County Parcels' && feature.properties.pin) {
          try {
            const response = await api.get(`/geodata/proxy/parcel-info?pin=${feature.properties.pin}`);
            const data = response.data;
            if (data.items && data.items.length > 0) {
              setParcelData(prev => ({
                ...prev,
                [feature.layerId]: data.items[0]
              }));
            }
          } catch (error) {
            console.error('Error fetching parcel data:', error);
          }
        }
      }
    };
    fetchParcelDataForLayers();
  }, [visible, features]);

  if (!visible) {
    // console.log('❌ [STEP 11] Panel not visible - returning null');
    return null;
  }

  // console.log('✅ [STEP 12] Panel IS visible - rendering content');

  const handlePriorityChange = (layerId: string, direction: 'up' | 'down') => {
    // Find the current feature and the one to swap with
    const currentIndex = sortedFeatures.findIndex(f => f.layerId === layerId);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (swapIndex < 0 || swapIndex >= sortedFeatures.length) return;

    const currentFeature = sortedFeatures[currentIndex];
    const swapFeature = sortedFeatures[swapIndex];

    // console.log('⬆️⬇️ [PRIORITY] Swapping priorities:');
    // console.log('⬆️⬇️ [PRIORITY]  -', currentFeature.layerId, '(priority', currentFeature.priority, ') →', swapFeature.priority);
    // console.log('⬆️⬇️ [PRIORITY]  -', swapFeature.layerId, '(priority', swapFeature.priority, ') →', currentFeature.priority);

    // Swap priorities
    onSetPriority(currentFeature.layerId, swapFeature.priority);
    onSetPriority(swapFeature.layerId, currentFeature.priority);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // console.log('🎯 [DRAG] Dropped card from index', draggedIndex, 'to', dropIndex);

    // Swap priorities
    const draggedFeature = sortedFeatures[draggedIndex];
    const droppedFeature = sortedFeatures[dropIndex];

    // console.log('🎯 [DRAG] Swapping priorities:');
    // console.log('🎯 [DRAG]  -', draggedFeature.layerId, '→', droppedFeature.priority);
    // console.log('🎯 [DRAG]  -', droppedFeature.layerId, '→', draggedFeature.priority);

    onSetPriority(draggedFeature.layerId, droppedFeature.priority);
    onSetPriority(droppedFeature.layerId, draggedFeature.priority);

    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Feature Layers</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sortedFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Click on a feature to see details
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {sortedFeatures.length} feature{sortedFeatures.length > 1 ? 's' : ''} at this location
              </p>

              {sortedFeatures.map((feature, index) => (
                <Card
                  key={`${feature.layerId}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`cursor-grab transition-all ${
                    index === 0 ? 'border-[#7fbd45] border-2 bg-[#7fbd45]/5' : ''
                  }`}
                >
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <CardHeader
                          className="p-4 cursor-pointer hover:bg-accent/50"
                          onClick={() => {
                            if (onHighlightFeature) {
                              onHighlightFeature(feature.layerId, feature.feature);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium">
                                  {feature.layerName}
                                </h3>
                                {index === 0 && (
                                  <Badge variant="default" className="bg-[#7fbd45] hover:bg-[#7fbd45]/90">
                                    TOP
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Only show chevrons if there are 2+ features */}
                            {sortedFeatures.length > 1 && (
                              <div className="flex gap-1">
                                {/* Show up chevron only if not the first card */}
                                {index !== 0 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePriorityChange(feature.layerId, 'up');
                                    }}
                                    title="Move layer up"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </Button>
                                )}
                                {/* Show down chevron only if not the last card */}
                                {index !== sortedFeatures.length - 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePriorityChange(feature.layerId, 'down');
                                    }}
                                    title="Move layer down"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-xs">Click to highlight this feature on the map</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator />

                  <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                      {/* Show King County parcel data if available */}
                      {feature.layerId === 'King County Parcels' && parcelData[feature.layerId] && (
                        <div className="p-3 bg-primary/5 rounded-md space-y-2">
                          <strong className="text-sm text-primary">King County Parcel Info:</strong>
                          {Object.entries(parcelData[feature.layerId]).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="font-medium">{key}:</span>
                              <span className="text-muted-foreground">
                                {value?.toString() || 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Feature properties */}
                      {Object.entries(feature.properties)
                        .filter(([key]) => key !== 'geom' && key !== 'geometry')
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-2 gap-2 text-xs"
                          >
                            <span className="font-medium">
                              {formatKey(key)}:
                            </span>
                            <span className="text-muted-foreground break-words">
                              {value?.toString() || 'N/A'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FeatureLayerPanel;
