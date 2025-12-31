// MapControls.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import LocationFilter from './filters/LocationFilter';
import LayerControl from './layers/LayerControl';
import VersionedLayerControl from './layers/VersionedLayerControl';
import SeattleZoningFilter from './filters/SeattleZoningFilter';
import SeattleBaseZoneFilter from './filters/SeattleBaseZoneFilter';
import { Marker } from '../../types/map/marker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface GeodataFeature {
  ogcFid: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  apiTableId?: string;
  data?: GeodataFeature[];
  intersectionData?: object;
  groupId?: string;
  version?: string;
}

interface MapControlsProps {
  layers: LayerConfig[];
  toggleLayer: (layerId: string) => void;
  seattleZoningFilters?: Set<string>;
  setSeattleZoneFilter?: (newFilters: Set<string>) => void;
  seattleZoningColors?: Record<string, string>;
  seattleBaseZoneFilters?: Set<string>;
  setSeattleBaseZoneFilter?: (newFilters: Set<string>) => void;
  layersRef?: Map<string, google.maps.Data>;
  locations: ({ name: string; code: string; cities?: { name: string; code: string; }[] })[];
  selectedLocation: { name: string; code: string } | null;
  onLocationChange: (location: { name: string; code: string }) => void;
  onMarkerSelect: (markers: Marker[]) => void;
  onMarkerDeselect: (markers: Marker[]) => void;
  onClearAllMarkers: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  layers,
  toggleLayer,
  seattleZoningFilters,
  setSeattleZoneFilter,
  seattleZoningColors,
  seattleBaseZoneFilters,
  setSeattleBaseZoneFilter,
  layersRef,
  locations,
  selectedLocation,
  onLocationChange,
}) => {
  const [favoriteLayers, setFavoriteLayers] = useState<Set<string>>(new Set());
  const [categoryToBaseZones, setCategoryToBaseZones] = useState<Map<string, Set<string>>>(new Map());

  // Build mapping when layer data is available
  useEffect(() => {
    const seattleLayer = layersRef?.get('SDCI Zoning');
    if (seattleLayer && layers.some(l => l.id === 'SDCI Zoning' && l.enabled)) {
      const catToZones = new Map<string, Set<string>>();

      seattleLayer.forEach(feature => {
        const category = feature.getProperty('category_desc') as string;
        const baseZone = feature.getProperty('base_zone') as string;

        if (category && baseZone) {
          if (!catToZones.has(category)) {
            catToZones.set(category, new Set());
          }
          catToZones.get(category)!.add(baseZone);
        }
      });

      setCategoryToBaseZones(catToZones);
    }
  }, [layers, layersRef]);

  useEffect(() => {
    const fetchFavoriteLayers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('User not authenticated, skipping favorites fetch');
          return;
        }
        const response = await api.get<string[]>('/favorites/layers');
        setFavoriteLayers(new Set(response.data));
      } catch (error) {
        console.error('Error fetching favorite layers:', error);
      }
    };

    fetchFavoriteLayers();
  }, []);

  const handleToggleFavorite = async (layerId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage favorites');
      return;
    }

    const isFavorite = favoriteLayers.has(layerId);
    try {
      if (isFavorite) {
        await api.delete(`/favorites/layers/${layerId}`);
        setFavoriteLayers(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(layerId);
          return newFavorites;
        });
      } else {
        await api.post('/favorites/layers', { layerId });
        setFavoriteLayers(prev => new Set(prev).add(layerId));
      }
    } catch (error) {
      console.error('Error updating favorite layers:', error);
    }
  };

  // Group versioned layers hierarchically by groupId
  const { hierarchicalVersionedLayers, standaloneLayersToRender } = useMemo(() => {
    const groups = new Map<string, LayerConfig[]>();
    const standalone: LayerConfig[] = [];

    layers.forEach(layer => {
      if (layer.groupId) {
        if (!groups.has(layer.groupId)) {
          groups.set(layer.groupId, []);
        }
        groups.get(layer.groupId)!.push(layer);
      } else {
        standalone.push(layer);
      }
    });

    // Convert to hierarchical structure with friendly group names
    const hierarchicalGroups = Array.from(groups.entries()).map(([groupId, groupLayers]) => {
      let groupName = groupId;

      // Create user-friendly group names
      if (groupId === 'opportunity-zones') {
        groupName = 'Opportunity Zones (OZ)';
      } else if (groupId === 'safmr') {
        groupName = 'Small Area FMR (SAFMR)';
      } else if (groupId === 'fmr') {
        groupName = 'Fair Market Rents (FMR)';
      } else if (groupId === 'hacla') {
        groupName = 'HACLA';
      }

      return {
        groupId,
        groupName,
        layers: groupLayers.sort((a, b) => (a.version || '').localeCompare(b.version || '')),
      };
    });

    return {
      hierarchicalVersionedLayers: hierarchicalGroups.length > 0 ? hierarchicalGroups : null,
      standaloneLayersToRender: standalone,
    };
  }, [layers]);

  return (
    <div className="flex flex-col h-full w-full space-y-2 px-2 py-3">
      <div className="flex-shrink-0">
        <LocationFilter
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationChange={onLocationChange}
        />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardContent className="map-panel-spacing-sm flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="space-y-1.5 pr-2 pb-1 overflow-y-auto flex-1 min-h-0">
                {/* Render hierarchical versioned layers dropdown */}
                {hierarchicalVersionedLayers && (
                  <VersionedLayerControl
                    key="all-versioned-layers"
                    layerGroups={hierarchicalVersionedLayers}
                    onToggle={toggleLayer}
                    favoriteLayers={favoriteLayers}
                    onToggleFavorite={handleToggleFavorite}
                  />
                )}

                {/* Render standalone layers */}
                {standaloneLayersToRender.map(layer => (
                  <LayerControl
                    key={layer.id}
                    layer={layer}
                    onToggle={() => toggleLayer(layer.id)}
                    isFavorite={favoriteLayers.has(layer.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}

                {/* Show Seattle Zoning Filter when Seattle Zoning layer is enabled */}
                {layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled) &&
                 seattleZoningFilters && setSeattleZoneFilter && seattleZoningColors && (
                  <SeattleZoningFilter
                    filters={seattleZoningFilters}
                    colors={seattleZoningColors}
                    onFilterChange={setSeattleZoneFilter}
                    categoryToBaseZones={categoryToBaseZones}
                  />
                )}

                {/* Show Seattle Base Zone Filter when Seattle Zoning layer is enabled */}
                {layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled) &&
                 seattleBaseZoneFilters && setSeattleBaseZoneFilter && layersRef && seattleZoningFilters && (
                  <SeattleBaseZoneFilter
                    filters={seattleBaseZoneFilters}
                    onFilterChange={setSeattleBaseZoneFilter}
                    layersRef={layersRef}
                    seattleLayerEnabled={layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled)}
                    categoryFilters={seattleZoningFilters}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapControls;
