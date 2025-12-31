/**
 * MapLayout - Simple wrapper for MapContainer
 */
import React from 'react';
import MapContainer from './MapContainerRefactored';
import type { GeoJsonFeatureCollection } from '../../types/map/geojson';
import type { SolarAnalysis } from '../../types/map/solar';
import type { SearchResult } from '../../types/map/map.types';

interface FeatureData {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
  priority: number;
  feature?: google.maps.Data.Feature;
}

interface MapLayoutProps {
  onLoad?: (callbacks: {
    addIntersectionLayer: (geoJsonData: GeoJsonFeatureCollection) => void;
    toggleLayer: (layerId: string) => void;
    navigateToLocation: (lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void;
    runTextQuerySearch?: (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void;
  }) => void;
  onLayerControlsReady?: (renderFn: () => React.ReactNode) => void;
  onSolarUpdate?: (
    visible: boolean,
    isLoading: boolean,
    data: SolarAnalysis | null,
    activeTab: 'analysis' | 'layers',
    onTabChange: (tab: 'analysis' | 'layers') => void,
    onClose: () => void,
    onClearAll: () => void,
    loadingOverlay: boolean,
    showFluxOverlay: boolean,
    showMapWideHeatmap: boolean,
    overlayOpacity: number,
    onToggleFluxOverlay: () => void,
    onToggleMapWideHeatmap: () => void,
    onUpdateOverlayOpacity: (value: number) => void,
    onClearAllOverlays: () => void
  ) => void;
  onNeighborhoodExplorerUpdate?: (
    results: SearchResult[],
    visible: boolean,
    metadata: { textQuery: string; radius: number; centerLat: number; centerLng: number } | null,
    onResultClick: (result: SearchResult) => void,
    onClear: () => void,
    onExport: (filename: string) => void,
    onSave: (searchName: string) => void,
    onSaveLocation: (result: SearchResult, locationName: string) => void,
    onDeleteResult: (result: SearchResult) => void,
    onNewSearch: (textQuery: string) => void,
    onMarkerTypeChange: (result: SearchResult, newType: string) => void
  ) => void;
  onFeatureLayerUpdate?: (
    visible: boolean,
    features: FeatureData[],
    onClose: () => void,
    onSetPriority: (layerId: string, priority: number) => void,
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void
  ) => void;
}

const MapLayout: React.FC<MapLayoutProps> = ({
  onLoad,
  onLayerControlsReady,
  onSolarUpdate,
  onNeighborhoodExplorerUpdate,
  onFeatureLayerUpdate
}) => {
  // Log lifecycle to verify map never remounts during viewport transitions
  React.useEffect(() => {
    // console.log('🗺️ [MapLayout] MOUNTED - Map canvas initialized');
    return () => {
      // console.log('🗺️ [MapLayout] UNMOUNTED - This should NEVER happen during viewport resize!');
    };
  }, []);

  return (
    <div className="h-full w-full flex overflow-hidden">
      <MapContainer
        key="stable-map-container" // Stable key prevents unmounting on parent re-renders
        onLoad={onLoad}
        onLayerControlsReady={onLayerControlsReady}
        onSolarUpdate={onSolarUpdate}
        onNeighborhoodExplorerUpdate={onNeighborhoodExplorerUpdate}
        onFeatureLayerUpdate={onFeatureLayerUpdate}
      />
    </div>
  );
};

export default React.memo(MapLayout);
