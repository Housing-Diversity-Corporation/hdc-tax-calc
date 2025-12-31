// MapControls.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LocationFilter from './LocationFilter';
import { CascadeSelectChangeEvent } from 'primereact/cascadeselect';
import LayerControl from './LayerControl';
import SeattleZoningFilter from './SeattleZoningFilter';
import SeattleBaseZoneFilter from './SeattleBaseZoneFilter';
import { Marker } from '../types/marker';

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
}

interface MapControlsProps {
  layers: LayerConfig[];
  toggleLayer: (layerId: string) => void;
  seattleZoningFilters?: Set<string>;
  toggleSeattleZoneFilter?: (zoneCategory: string) => void;
  seattleZoningColors?: Record<string, string>;
  seattleBaseZoneFilters?: Set<string>;
  toggleSeattleBaseZoneFilter?: (baseZone: string) => void;
  layersRef?: Map<string, google.maps.Data>;
  locations: ({ name: string; code: string; cities?: { name: string; code: string; }[] })[];
  selectedLocation: { name: string; code: string } | null;
  onLocationChange: (e: CascadeSelectChangeEvent) => void;
  onMarkerSelect: (markers: Marker[]) => void;
  onMarkerDeselect: (markers: Marker[]) => void;
  onClearAllMarkers: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  layers,
  toggleLayer,
  seattleZoningFilters,
  toggleSeattleZoneFilter,
  seattleZoningColors,
  seattleBaseZoneFilters,
  toggleSeattleBaseZoneFilter,
  layersRef,
  locations,
  selectedLocation,
  onLocationChange,
}) => {
  const [favoriteLayers, setFavoriteLayers] = useState<Set<string>>(new Set());

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

  return (
    <div>
      <LocationFilter
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '20px'
      }}>
        {layers.map(layer => (
          <LayerControl
            key={layer.id}
            layer={layer}
            onToggle={() => toggleLayer(layer.id)}
            isFavorite={favoriteLayers.has(layer.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {/* Show Seattle Zoning Filter when Seattle Zoning layer is enabled */}
      {layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled) &&
       seattleZoningFilters && toggleSeattleZoneFilter && seattleZoningColors && (
        <SeattleZoningFilter
          filters={seattleZoningFilters}
          colors={seattleZoningColors}
          onToggle={toggleSeattleZoneFilter}
        />
      )}

      {/* Show Seattle Base Zone Filter when Seattle Zoning layer is enabled */}
      {layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled) &&
       seattleBaseZoneFilters && toggleSeattleBaseZoneFilter && layersRef && seattleZoningFilters && (
        <SeattleBaseZoneFilter
          filters={seattleBaseZoneFilters}
          onToggle={toggleSeattleBaseZoneFilter}
          layersRef={layersRef}
          seattleLayerEnabled={layers.some(layer => layer.id === 'SDCI Zoning' && layer.enabled)}
          categoryFilters={seattleZoningFilters}
        />
      )}



    </div>
  );
};

export default MapControls;
