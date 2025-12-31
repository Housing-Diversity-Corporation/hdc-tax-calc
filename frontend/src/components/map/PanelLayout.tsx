/**
 * PanelLayout - Centralized Panel Management
 *
 * This component manages ALL panel layouts for the map application in ONE place.
 * Uses a single ResizablePanelGroup with dynamic direction to prevent map remounting.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║ KEY ARCHITECTURE PRINCIPLE: MAP NEVER REMOUNTS                              ║
 * ║                                                                              ║
 * ║ 1. Single ResizablePanelGroup with dynamic direction (vertical/horizontal)  ║
 * ║ 2. MapLayout has stable key: "stable-map-layout"                            ║
 * ║ 3. Panels use CSS display: none instead of conditional rendering            ║
 * ║ 4. Latest-wins logic for mobile panel activation (no priority ordering)     ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * WIDE SCREENS (width > 768px):
 * ┌─────────────────┬──────────────────┬────────────────────┐
 * │  Left: Layers   │   Center: Map    │  Right: Active     │
 * │  (Always shown) │   (Always shown) │  (Latest opened)   │
 * │                 │                  │                    │
 * │  - Map Layers   │  - MapCanvas     │  - Solar           │
 * │  - Layer        │  - Controls      │  - Neighborhood    │
 * │    Controls     │  - Markers       │  - Features        │
 * │  - Filters      │  - Overlays      │  - Favorites       │
 * │                 │                  │  - Saved Places    │
 * └─────────────────┴──────────────────┴────────────────────┘
 *
 * NARROW SCREENS (width ≤ 768px):
 * ┌──────────────────────────────────────┐
 * │  Top Panel - Active Panel            │
 * │  (Latest activated panel shown)      │
 * │                                      │
 * │  When user opens Solar → Shows Solar │
 * │  Then opens Favorites → Shows Fav    │
 * │  Default: Map Layers                 │
 * ├──────────────────────────────────────┤
 * │           Resize Handle              │
 * ├──────────────────────────────────────┤
 * │              Map Panel               │
 * │         (Always rendered)            │
 * │                                      │
 * │  - MapCanvas never remounts          │
 * │  - All map content preserved         │
 * │  - Markers, overlays persist         │
 * └──────────────────────────────────────┘
 *
 * Panel Activation Logic (Latest-Wins):
 * - When a panel opens, it becomes the active mobile panel
 * - Previous panel is hidden (display: none) but stays mounted
 * - When all panels close, defaults back to "layers"
 * - No priority ordering - most recent activation wins
 */

import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useResponsive } from '../../hooks/useResponsive';
import { useLayerHierarchy } from '../../contexts/LayerHierarchyContext';
import MapLayout from './MapLayout';
import FavoritesPanel from './panels/FavoritesPanel';
import SavedPlacesPanel from './panels/SavedPlacesPanel';
import FeatureLayerPanel from './panels/FeatureLayerPanel';
import SolarPanel from './solar/SolarPanel';
import NeighborhoodExplorerResults from './search/NeighborhoodExplorerResults';

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

interface PanelLayoutProps {
  // Panel visibility state
  isFavoritesPanelOpen: boolean;
  isPlacesPanelOpen: boolean;
  onCloseFavorites: () => void;
  onClosePlaces: () => void;

  // Map callbacks passed from App
  addIntersectionLayer: ((geoJsonData: GeoJsonFeatureCollection) => void) | null;
  toggleLayer: ((layerId: string) => void) | null;
  navigateToLocation: ((lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void) | null;
  runNeighborhoodExplorer: ((textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void) | null;

  // Map load callback
  onMapLoad?: (callbacks: {
    addIntersectionLayer: (geoJsonData: GeoJsonFeatureCollection) => void;
    toggleLayer: (layerId: string) => void;
    navigateToLocation: (lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void;
    runTextQuerySearch?: (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void;
  }) => void;

  // Layer controls callback (from MapContainer -> App -> PanelLayout)
  onLayerControlsReady?: (renderFn: () => React.ReactNode) => void;
  renderLayerControls?: () => React.ReactNode;

  // Solar state (managed by MapContainer, displayed in right panel)
  solarCallbacks: {
    visible: boolean;
    isLoading: boolean;
    data: SolarAnalysis | null;
    activeTab: 'analysis' | 'layers';
    onTabChange: (tab: 'analysis' | 'layers') => void;
    onClose: () => void;
    onClearAll: () => void;
    loadingOverlay: boolean;
    showFluxOverlay: boolean;
    showMapWideHeatmap: boolean;
    overlayOpacity: number;
    onToggleFluxOverlay: () => void;
    onToggleMapWideHeatmap: () => void;
    onUpdateOverlayOpacity: (value: number) => void;
    onClearAllOverlays: () => void;
  } | null;

  // Neighborhood Explorer results (managed by MapContainer, displayed in right panel)
  neighborhoodExplorerState: {
    results: SearchResult[];
    visible: boolean;
    metadata: { textQuery: string; radius: number; centerLat: number; centerLng: number } | null;
    onResultClick: (result: SearchResult) => void;
    onClear: () => void;
    onExport: (filename: string) => void;
    onSave: (searchName: string) => void;
    onSaveLocation: (result: SearchResult, locationName: string) => void;
    onDeleteResult: (result: SearchResult) => void;
    onMarkerTypeChange: (result: SearchResult, newType: string) => void;
    onNewSearch?: (textQuery: string) => void;
    onSaveDialogOpen?: (openFn: () => void) => void;
    onExportDialogOpen?: (openFn: () => void) => void;
  } | null;

  // Feature layer panel state (shows overlapping features at clicked location)
  featureLayerState: {
    visible: boolean;
    features: FeatureData[];
    onClose: () => void;
    onSetPriority: (layerId: string, priority: number) => void;
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void;
  } | null;

  // Solar update callback (from MapContainer to App to PanelLayout)
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

  // Neighborhood Explorer update callback (from MapContainer to App to PanelLayout)
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

  // Feature layer update callback (from MapContainer to App to PanelLayout)
  onFeatureLayerUpdate?: (
    visible: boolean,
    features: FeatureData[],
    onClose: () => void,
    onSetPriority: (layerId: string, priority: number) => void,
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void
  ) => void;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({
  isFavoritesPanelOpen,
  isPlacesPanelOpen,
  onCloseFavorites,
  onClosePlaces,
  addIntersectionLayer,
  toggleLayer,
  navigateToLocation,
  runNeighborhoodExplorer,
  onMapLoad,
  onLayerControlsReady,
  renderLayerControls,
  solarCallbacks,
  neighborhoodExplorerState,
  featureLayerState,
  onSolarUpdate,
  onNeighborhoodExplorerUpdate,
  onFeatureLayerUpdate,
}) => {
  const { width } = useResponsive();
  const isNarrow = width <= 768; // Hamburger menu breakpoint
  const { layerHierarchy, setLayerPriority } = useLayerHierarchy();

  // Track the most recently activated panel (latest-wins logic for mobile)
  const [activeMobilePanel, setActiveMobilePanel] = React.useState<string>('layers');

  // Track which panel was most recently opened by watching visibility changes
  React.useEffect(() => {
    if (isFavoritesPanelOpen) {
      setActiveMobilePanel('favorites');
    } else if (isPlacesPanelOpen) {
      setActiveMobilePanel('places');
    } else if (featureLayerState?.visible) {
      setActiveMobilePanel('features');
    } else if (neighborhoodExplorerState?.visible) {
      setActiveMobilePanel('neighborhoodExplorer');
    } else if (solarCallbacks?.visible) {
      setActiveMobilePanel('solar');
    } else {
      // Default to layers when all panels are closed
      setActiveMobilePanel('layers');
    }
  }, [
    isFavoritesPanelOpen,
    isPlacesPanelOpen,
    featureLayerState?.visible,
    neighborhoodExplorerState?.visible,
    solarCallbacks?.visible,
  ]);

  const activePanel = activeMobilePanel;

  // In wide view, determine if right panel should be shown
  const hasRightPanel = !isNarrow && (
    solarCallbacks?.visible ||
    neighborhoodExplorerState?.visible ||
    featureLayerState?.visible ||
    isFavoritesPanelOpen ||
    isPlacesPanelOpen
  );

  // SINGLE RESIZABLE PANEL GROUP - Dynamic direction based on viewport
  // MapLayout stays mounted with stable key
  return (
    <ResizablePanelGroup
      direction={isNarrow ? "vertical" : "horizontal"}
      className="h-full w-full"
    >
      {isNarrow ? (
        /* NARROW VIEW: Vertical panels */
        <>
          {/* Top Panel - shows active panel content */}
          <ResizablePanel
            id="top-panel"
            defaultSize={30}
            minSize={20}
            maxSize={50}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => console.log('Top panel collapsed')}
            onExpand={() => console.log('Top panel expanded')}
            order={1}
          >
            <div className="h-full overflow-y-auto backdrop-blur-xl bg-background/60 border-b border-white/10">
              {/* Layer controls - shown when activePanel is 'layers' */}
              <div style={{ display: activePanel === 'layers' ? 'block' : 'none' }} className="h-full">
                {renderLayerControls ? renderLayerControls() : (
                  <div className="p-4 text-sm text-muted-foreground">Loading layers...</div>
                )}
              </div>

              {/* Other panels - shown when they are active */}
              <div style={{ display: activePanel === 'favorites' ? 'block' : 'none' }} className="h-full">
                <FavoritesPanel
                  isOpen={isFavoritesPanelOpen}
                  onClose={onCloseFavorites}
                  onDisplayIntersection={addIntersectionLayer}
                  onToggleLayer={toggleLayer}
                />
              </div>

              <div style={{ display: activePanel === 'places' ? 'block' : 'none' }} className="h-full">
                <SavedPlacesPanel
                  isOpen={isPlacesPanelOpen}
                  onClose={onClosePlaces}
                  onNavigateToLocation={navigateToLocation || undefined}
                  onRunNeighborhoodExplorer={runNeighborhoodExplorer || undefined}
                />
              </div>

              {featureLayerState && (
                <div style={{ display: activePanel === 'features' ? 'block' : 'none' }} className="h-full">
                  <FeatureLayerPanel
                    visible={featureLayerState.visible}
                    onClose={featureLayerState.onClose}
                    features={featureLayerState.features}
                    onSetPriority={featureLayerState.onSetPriority}
                    layerHierarchy={layerHierarchy}
                    onHighlightFeature={featureLayerState.onHighlightFeature}
                  />
                </div>
              )}

              {neighborhoodExplorerState && (
                <div style={{ display: activePanel === 'neighborhoodExplorer' ? 'block' : 'none' }} className="h-full">
                  <NeighborhoodExplorerResults
                    results={neighborhoodExplorerState.results}
                    visible={neighborhoodExplorerState.visible}
                    onResultClick={neighborhoodExplorerState.onResultClick}
                    onClearResults={neighborhoodExplorerState.onClear}
                    onExportCsv={neighborhoodExplorerState.onExport}
                    onSaveDialogOpen={neighborhoodExplorerState.onSaveDialogOpen}
                    onExportDialogOpen={neighborhoodExplorerState.onExportDialogOpen}
                    onSaveSearch={neighborhoodExplorerState.onSave}
                    onSaveLocation={neighborhoodExplorerState.onSaveLocation}
                    onDeleteResult={neighborhoodExplorerState.onDeleteResult}
                    onMarkerTypeChange={neighborhoodExplorerState.onMarkerTypeChange}
                    searchMetadata={neighborhoodExplorerState.metadata || undefined}
                    onNewSearch={neighborhoodExplorerState.onNewSearch}
                  />
                </div>
              )}

              {solarCallbacks && (
                <div style={{ display: activePanel === 'solar' ? 'block' : 'none' }} className="h-full">
                  <SolarPanel
                    visible={solarCallbacks.visible}
                    isLoading={solarCallbacks.isLoading}
                    solarData={solarCallbacks.data}
                    activeTab={solarCallbacks.activeTab}
                    onTabChange={solarCallbacks.onTabChange}
                    onClose={solarCallbacks.onClose}
                    onClearAll={solarCallbacks.onClearAll}
                    loadingOverlay={solarCallbacks.loadingOverlay}
                    showFluxOverlay={solarCallbacks.showFluxOverlay}
                    showMapWideHeatmap={solarCallbacks.showMapWideHeatmap}
                    overlayOpacity={solarCallbacks.overlayOpacity}
                    onToggleFluxOverlay={solarCallbacks.onToggleFluxOverlay}
                    onToggleMapWideHeatmap={solarCallbacks.onToggleMapWideHeatmap}
                    onUpdateOverlayOpacity={solarCallbacks.onUpdateOverlayOpacity}
                    onClearAllOverlays={solarCallbacks.onClearAllOverlays}
                  />
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Map Panel */}
          <ResizablePanel
            id="map-panel"
            defaultSize={70}
            minSize={50}
            order={2}
          >
            <MapLayout
              key="stable-map-layout"
              onLoad={onMapLoad}
              onLayerControlsReady={onLayerControlsReady}
              onSolarUpdate={onSolarUpdate}
              onNeighborhoodExplorerUpdate={onNeighborhoodExplorerUpdate}
              onFeatureLayerUpdate={onFeatureLayerUpdate}
            />
          </ResizablePanel>
        </>
      ) : (
        /* WIDE VIEW: Horizontal panels */
        <>
          {/* Left Panel - Layer Controls */}
          <ResizablePanel
            id="left-panel"
            defaultSize={20}
            minSize={15}
            maxSize={25}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => console.log('Left panel collapsed')}
            onExpand={() => console.log('Left panel expanded')}
            order={1}
          >
            <div className="h-full overflow-y-auto backdrop-blur-xl bg-background/60 border-r border-white/10">
              {renderLayerControls ? renderLayerControls() : (
                <div className="p-4 text-sm text-muted-foreground">Loading layers...</div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Map Panel */}
          <ResizablePanel
            id="map-panel"
            defaultSize={hasRightPanel ? 55 : 75}
            minSize={40}
            order={2}
          >
            <MapLayout
              key="stable-map-layout"
              onLoad={onMapLoad}
              onLayerControlsReady={onLayerControlsReady}
              onSolarUpdate={onSolarUpdate}
              onNeighborhoodExplorerUpdate={onNeighborhoodExplorerUpdate}
              onFeatureLayerUpdate={onFeatureLayerUpdate}
            />
          </ResizablePanel>

          {hasRightPanel && (
            <>
              <ResizableHandle withHandle />

              {/* Right Panel */}
              <ResizablePanel
                id="right-panel"
                defaultSize={25}
                minSize={20}
                maxSize={35}
                collapsible={true}
                collapsedSize={0}
                onCollapse={() => console.log('Right panel collapsed')}
                onExpand={() => console.log('Right panel expanded')}
                order={3}
              >
                <div className="h-full overflow-y-auto backdrop-blur-xl bg-background/60 border-l border-white/10">
                  {/* Solar Panel - highest priority */}
                  {solarCallbacks?.visible && (
                    <SolarPanel
                      visible={solarCallbacks.visible}
                      isLoading={solarCallbacks.isLoading}
                      solarData={solarCallbacks.data}
                      activeTab={solarCallbacks.activeTab}
                      onTabChange={solarCallbacks.onTabChange}
                      onClose={solarCallbacks.onClose}
                      onClearAll={solarCallbacks.onClearAll}
                      loadingOverlay={solarCallbacks.loadingOverlay}
                      showFluxOverlay={solarCallbacks.showFluxOverlay}
                      showMapWideHeatmap={solarCallbacks.showMapWideHeatmap}
                      overlayOpacity={solarCallbacks.overlayOpacity}
                      onToggleFluxOverlay={solarCallbacks.onToggleFluxOverlay}
                      onToggleMapWideHeatmap={solarCallbacks.onToggleMapWideHeatmap}
                      onUpdateOverlayOpacity={solarCallbacks.onUpdateOverlayOpacity}
                      onClearAllOverlays={solarCallbacks.onClearAllOverlays}
                    />
                  )}

                  {/* Neighborhood Explorer Results */}
                  {!solarCallbacks?.visible && neighborhoodExplorerState?.visible && (
                    <NeighborhoodExplorerResults
                      results={neighborhoodExplorerState.results}
                      visible={neighborhoodExplorerState.visible}
                      onResultClick={neighborhoodExplorerState.onResultClick}
                      onClearResults={neighborhoodExplorerState.onClear}
                      onExportCsv={neighborhoodExplorerState.onExport}
                      onSaveDialogOpen={neighborhoodExplorerState.onSaveDialogOpen}
                      onExportDialogOpen={neighborhoodExplorerState.onExportDialogOpen}
                      onSaveSearch={neighborhoodExplorerState.onSave}
                      onSaveLocation={neighborhoodExplorerState.onSaveLocation}
                      onDeleteResult={neighborhoodExplorerState.onDeleteResult}
                      onMarkerTypeChange={neighborhoodExplorerState.onMarkerTypeChange}
                      searchMetadata={neighborhoodExplorerState.metadata || undefined}
                      onNewSearch={neighborhoodExplorerState.onNewSearch}
                    />
                  )}

                  {/* Feature Layer Panel */}
                  {!solarCallbacks?.visible && !neighborhoodExplorerState?.visible && featureLayerState?.visible && (
                    <FeatureLayerPanel
                      visible={featureLayerState.visible}
                      onClose={featureLayerState.onClose}
                      features={featureLayerState.features}
                      onSetPriority={featureLayerState.onSetPriority}
                      layerHierarchy={layerHierarchy}
                      onHighlightFeature={featureLayerState.onHighlightFeature}
                    />
                  )}

                  {/* Favorites Panel */}
                  {!solarCallbacks?.visible && !neighborhoodExplorerState?.visible && !featureLayerState?.visible && isFavoritesPanelOpen && (
                    <FavoritesPanel
                      isOpen={isFavoritesPanelOpen}
                      onClose={onCloseFavorites}
                      onDisplayIntersection={addIntersectionLayer}
                      onToggleLayer={toggleLayer}
                    />
                  )}

                  {/* Saved Places Panel */}
                  {!solarCallbacks?.visible && !neighborhoodExplorerState?.visible && !featureLayerState?.visible && !isFavoritesPanelOpen && isPlacesPanelOpen && (
                    <SavedPlacesPanel
                      isOpen={isPlacesPanelOpen}
                      onClose={onClosePlaces}
                      onNavigateToLocation={navigateToLocation || undefined}
                      onRunNeighborhoodExplorer={runNeighborhoodExplorer || undefined}
                    />
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </>
      )}
    </ResizablePanelGroup>
  );
};

export default PanelLayout;
