/**
 * MapContainer - Refactored modular version
 * Uses focused hooks for maintainability
 */
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Eye, EyeOff, Save, X, Search, Sun, Trash2, Home, Download } from 'lucide-react';
import { toast } from '../ui/sonner';
import { useTheme } from '../../contexts/ThemeContext';
// Sheet import removed - mobile layer controls now in PanelLayout
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ClearButton, SaveButton, ExportButton, CancelButton } from './utilities';
import { IntersectionIcon } from '../icons/IntersectionIcon';

// Hooks
import { useMapCore } from '../../hooks/map/useMapCore';
import { useMapMarkers } from '../../hooks/map/useMapMarkers';
import { useMapLayers } from '../../hooks/map/useMapLayers';
import { useResponsive } from '../../hooks/useResponsive';
import { useIntersection } from '../../hooks/map/intersection.ts';
import { useSolarData } from '../../hooks/map/useSolarData';
import { useLayerHierarchy } from '../../contexts/LayerHierarchyContext';

// Utils
import { infoWindowManager } from '../../utils/map/infoWindowManager';

// Components
import { MapCanvas } from './MapCanvas';
import MapControls from './MapControls';
import SearchCard from './search/SearchCard';
import NeighborhoodExplorerCard from './search/NeighborhoodExplorerCard';
import PropertiesList from './properties/PropertiesList';
import LoadingSpinner from './LoadingSpinner';
import InputDialog from './InputDialog';
import { SaveIntersectionDialog, ExportIntersectionDialog } from './intersection';
import SaveMarkerView, { SelectedPropertyType } from './SaveMarkerView';
import FloatingChatContainer from './chat/FloatingChatContainer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Styles
import '../../styles/map/mapControls.css';
import '../../styles/map/pulsatingButton.css';

// Types
import type { GeoJsonFeatureCollection } from '../../types/map/geojson';
import type { SolarAnalysis } from '../../types/map/solar';
import type { SearchResult } from '../../types/map/map.types';
import NeighborhoodExplorerResults from './search/NeighborhoodExplorerResults.tsx';

interface FeatureData {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
  priority: number;
  feature?: google.maps.Data.Feature;
}

interface MapContainerProps {
  apiKey?: string;
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
    onMarkerTypeChange: (result: SearchResult, newType: string) => void,
    onSaveDialogOpen?: (openFn: () => void) => void,
    onExportDialogOpen?: (openFn: () => void) => void
  ) => void;
  onFeatureLayerUpdate?: (
    visible: boolean,
    features: FeatureData[],
    onClose: () => void,
    onSetPriority: (layerId: string, priority: number) => void,
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void
  ) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
  apiKey,
  onLoad,
  onLayerControlsReady,
  onSolarUpdate,
  onNeighborhoodExplorerUpdate,
  onFeatureLayerUpdate
}) => {
  const { width, isMobile: isResponsiveMobile, isTablet: isResponsiveTablet } = useResponsive();
  const { isDarkMode } = useTheme();
  const { layerHierarchy, setLayerPriority } = useLayerHierarchy();
  const textQuerySearchFunctionRef = useRef<((textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void) | null>(null);

  // Memoize responsive flags to prevent unnecessary re-renders
  const isMobile = useMemo(() => isResponsiveMobile, [isResponsiveMobile]);
  const isTablet = useMemo(() => isResponsiveTablet, [isResponsiveTablet]);
  const isCompact = useMemo(() => width < 1000, [width]);

  // console.log('🔄 [RENDER] MapContainer - isMobile:', isMobile, 'isTablet:', isTablet, 'width:', width);

  // Mobile layer drawer state - REMOVED: layers now managed by PanelLayout
  // const [mobileLayerDrawerOpen, setMobileLayerDrawerOpen] = useState(false);

  // Properties popover state
  const [propertiesPopoverOpen, setPropertiesPopoverOpen] = useState(false);

  // Initialize CSS variable for responsive panel sizing
  React.useEffect(() => {
    const panelWidth = (20 / 100) * window.innerWidth;
    document.documentElement.style.setProperty('--map-panel-width', `${panelWidth}px`);
  }, []);

  // Solar state
  const [solarLoading, setSolarLoading] = useState(false);
  const [solarData, setSolarData] = useState<SolarAnalysis | null>(null);
  const [solarActiveTab, setSolarActiveTab] = useState<'analysis' | 'layers'>('analysis');
  const [isSolarPlacementMode, setIsSolarPlacementMode] = useState(false);
  const solarClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Solar overlay state
  const [solarOverlays, setSolarOverlays] = useState<{
    flux: google.maps.GroundOverlay | null;
    mapwide: google.maps.GroundOverlay | null;
  }>({ flux: null, mapwide: null });
  const [solarOverlayLoading, setSolarOverlayLoading] = useState(false);
  const [solarOverlayOpacity, setSolarOverlayOpacity] = useState(0.7);
  const [solarLocation, setSolarLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [solarDataLayers, setSolarDataLayers] = useState<any>(null);
  const solarLegendRef = useRef<HTMLDivElement | null>(null);
  const solarMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [showFluxOverlay, setShowFluxOverlay] = useState(false);
  const [showMapWideHeatmap, setShowMapWideHeatmap] = useState(false);

  // Solar data hook
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { fetchSolarData } = useSolarData(googleMapsApiKey);

  // Text query search results state
  const [textQuerySearchResults, setTextQuerySearchResults] = useState<SearchResult[]>([]);
  const [showTextQueryResults, setShowTextQueryResults] = useState(false);
  const [textQuerySearchMetadata, setTextQuerySearchMetadata] = useState<{ textQuery: string; radius: number; centerLat: number; centerLng: number } | null>(null);

  // Feature layer panel state (shows overlapping features at clicked location)
  const [showFeatureLayerPanel, setShowFeatureLayerPanel] = useState(false);
  const [overlappingFeatures, setOverlappingFeatures] = useState<any[]>([]);

  // Core map functionality
  const {
    mapRef,
    map,
    isLoaded,
    loadError,
    isInitializing,
    showLabels,
    toggleLabels,
    isStreetViewActive,
  } = useMapCore({ apiKey });

  // Marker management
  const {
    selectedPlace,
    hasFavoriteMarker,
    hasSimpleSearchMarker,
    handlePlaceSelected,
    clearSearchMarker,
    clearFavoriteMarker,
  } = useMapMarkers(map);

  // Handler for when overlapping features are clicked
  const handleOverlappingFeaturesClick = useCallback((features: any[]) => {
    // Sort features by area (smallest to largest) for proper initial ordering
    const sortedBySize = [...features].sort((a, b) => {
      const areaA = a.properties._area || Infinity;
      const areaB = b.properties._area || Infinity;
      return areaA - areaB; // Smallest first
    });

    // Transform features to include priority from layerHierarchy
    // If a layer doesn't have a priority yet, assign based on size order
    // Smallest feature gets highest priority (features.length), largest gets 1
    const featuresWithPriority = sortedBySize.map((f: any, index: number) => {
      let priority = layerHierarchy.get(f.layerId);

      // If no priority exists, assign initial priority based on size order
      // Smallest (index 0) gets highest priority (features.length)
      if (priority === undefined) {
        priority = features.length - index;
        setLayerPriority(f.layerId, priority);
      }

      return {
        layerId: f.layerId,
        layerName: f.layerName,
        properties: f.properties,
        priority: priority,
        feature: f.feature
      };
    });

    setOverlappingFeatures(featuresWithPriority);
    setShowFeatureLayerPanel(true);
  }, [layerHierarchy, setLayerPriority]);

  // Update overlappingFeatures priorities when layerHierarchy changes
  React.useEffect(() => {
    if (overlappingFeatures.length > 0) {
      const updatedFeatures = overlappingFeatures.map(f => ({
        ...f,
        priority: layerHierarchy.get(f.layerId) || f.priority
      }));
      setOverlappingFeatures(updatedFeatures);
    }
  }, [layerHierarchy]); // Only depend on layerHierarchy to avoid infinite loop

  // Store the currently highlighted feature to reset it later
  // IMPORTANT: This ref must be defined BEFORE useMapLayers so it can be passed to the hook
  // We store feature PROPERTIES instead of the feature object itself, because feature objects
  // become invalid when layers are reloaded (zoom/pan)
  const highlightedFeatureRef = useRef<{ layerId: string; featureProps: any } | null>(null);

  // Store smallest feature ID for use in highlight logic
  const smallestFeatureIdRef = useRef<string | null>(null);

  // Store overlapping features in a ref for access in layer reload scenarios
  const overlappingFeaturesRef = useRef<FeatureData[]>([]);
  React.useEffect(() => {
    overlappingFeaturesRef.current = overlappingFeatures;
  }, [overlappingFeatures]);

  // Layer management
  const {
    layers,
    addIntersectionLayer,
    toggleLayer,
    layersRef,
    seattleZoningFilters,
    setSeattleZoneFilter,
    seattleZoningColors,
    seattleBaseZoneFilters,
    setSeattleBaseZoneFilter,
    locations,
    selectedLocation,
    setSelectedLocation,
    getLayersWithCurrentState,
  } = useMapLayers(map, handleOverlappingFeaturesClick, highlightedFeatureRef, smallestFeatureIdRef, overlappingFeaturesRef);

  // Handler for highlighting a feature (passed to the panel)
  // MUST be defined AFTER useMapLayers since it uses layersRef
  const handleHighlightFeature = useCallback((layerId: string, feature?: google.maps.Data.Feature) => {
    if (!map) {
      return;
    }

    if (!feature) {
      highlightedFeatureRef.current = null;
      return;
    }

    const layer = layersRef.get(layerId);
    if (!layer) {
      return;
    }

    // Get feature properties for storage and matching
    const featureProps: any = {};
    feature.forEachProperty((value, key) => {
      featureProps[key] = value;
    });

    // Re-find the feature in the layer by properties (in case the feature object is stale)
    let currentFeature: google.maps.Data.Feature | null = null;
    layer.forEach((f) => {
      const ogcFid = f.getProperty('ogc_fid');
      if (ogcFid !== undefined && featureProps.ogc_fid === ogcFid) {
        currentFeature = f;
      }
    });

    if (!currentFeature) {
      currentFeature = feature; // Fallback to provided feature
    }

    // Check if we're trying to highlight the EXACT same feature that's already highlighted
    // We check both layerId AND ogc_fid to ensure it's truly the same feature
    const isSameFeature = highlightedFeatureRef.current &&
                          highlightedFeatureRef.current.layerId === layerId &&
                          highlightedFeatureRef.current.featureProps.ogc_fid === featureProps.ogc_fid;

    if (isSameFeature) {
      return;
    }

    // Reset previously highlighted feature's BORDER (only if different)
    if (highlightedFeatureRef.current) {
      const prevLayer = layersRef.get(highlightedFeatureRef.current.layerId);
      const prevLayerId = highlightedFeatureRef.current.layerId;
      const prevFeatureProps = highlightedFeatureRef.current.featureProps;

      if (prevLayer) {
        // Re-find the previous feature by properties
        prevLayer.forEach((f) => {
          const ogcFid = f.getProperty('ogc_fid');
          if (ogcFid !== undefined && prevFeatureProps.ogc_fid === ogcFid) {
            prevLayer.revertStyle(f);

            // Re-apply fill color based on whether it's the smallest
            if (prevLayerId === smallestFeatureIdRef.current) {
              prevLayer.overrideStyle(f, {
                fillColor: 'pink',  // Brighter pink
                fillOpacity: 0.9,     // 35% opacity (more visible)
                zIndex: 1000           // Keep on top
              });
            }
          }
        });
      }
    }

    // Determine if this feature is the smallest (should keep red fill visible)
    const isSmallest = layerId === smallestFeatureIdRef.current;

    // Apply GREEN BORDER highlight using the current (re-found) feature
    if (isSmallest) {
      // Smallest feature: apply green border + keep bright red fill, highest zIndex
      layer.overrideStyle(currentFeature, {
        strokeColor: '#7fbd45', // Green border
        strokeWeight: 4,
        strokeOpacity: 1,
        fillColor: 'pink',   // Brighter red
        fillOpacity: 0.9,      // 35% opacity (more visible)
        zIndex: 1001            // Highest - always on top
      });
    } else {
      // Not smallest: apply green border only, keep original fill
      layer.overrideStyle(currentFeature, {
        strokeColor: '#7fbd45', // Green border
        strokeWeight: 4,
        strokeOpacity: 1,
        // Don't override fillColor or fillOpacity - let original layer style show
        zIndex: 999
      });
    }

    // Store the feature PROPERTIES (not the object itself) for later re-finding
    highlightedFeatureRef.current = { layerId, featureProps };
  }, [map, layersRef]); // layersRef is stable but needed for closure

  // Handler for closing the feature layer panel
  // MUST be defined AFTER useMapLayers since it uses layersRef
  const handleCloseFeatureLayerPanel = useCallback(() => {
    // Clear all highlights before closing
    if (highlightedFeatureRef.current) {
      const { layerId, featureProps } = highlightedFeatureRef.current;
      const layer = layersRef.get(layerId);

      if (layer) {
        // Re-find the feature by properties and revert its style
        layer.forEach((feature) => {
          const ogcFid = feature.getProperty('ogc_fid');
          if (ogcFid !== undefined && featureProps.ogc_fid === ogcFid) {
            layer.revertStyle(feature);
          }
        });
      }
      highlightedFeatureRef.current = null;
    }

    // Clear fill opacity overrides for all overlapping features
    overlappingFeatures.forEach((f: FeatureData) => {
      const layer = layersRef.get(f.layerId);
      if (layer && f.feature) {
        layer.revertStyle(f.feature);
      }
    });

    // Clear the smallest feature ref
    smallestFeatureIdRef.current = null;

    setShowFeatureLayerPanel(false);
    setOverlappingFeatures([]);
  }, [overlappingFeatures, layersRef]);

  // Apply fill opacity based on smallest feature
  React.useEffect(() => {
    if (overlappingFeatures.length === 0) {
      smallestFeatureIdRef.current = null;
      return;
    }

    // Find the smallest feature by area
    let smallestFeature = overlappingFeatures[0];
    let smallestArea = overlappingFeatures[0]?.properties?._area || Infinity;
    overlappingFeatures.forEach(f => {
      const area = f.properties?._area || 0;
      if (area > 0 && area < smallestArea) {
        smallestArea = area;
        smallestFeature = f;
      }
    });

    smallestFeatureIdRef.current = smallestFeature?.layerId || null;

    // Apply fill color to ALL overlapping features
    overlappingFeatures.forEach((f: FeatureData) => {
      const layer = layersRef.get(f.layerId);
      if (!layer || !f.feature) return;

      const isSmallest = f.layerId === smallestFeature?.layerId;

      if (isSmallest) {
        // Smallest feature: apply BRIGHT RED fill with low opacity and high zIndex
        layer.overrideStyle(f.feature, {
          fillColor: 'pink',  // Brighter red
          fillOpacity: 0.9,      // 35% opacity (more visible)
          zIndex: 1000,           // Bring to front
          // Don't touch stroke - that's handled by highlight
        });
      } else {
        // Non-smallest: keep original fill but reduce opacity significantly
        // Don't set fillOpacity to 0 - just reduce it to keep original layer style visible
        // The original layer styles will show through
      }
    });

    // Trigger initial highlight for the top feature (highest priority)
    // This ensures the green border is applied immediately
    const sortedByPriority = [...overlappingFeatures].sort((a, b) => b.priority - a.priority);
    if (sortedByPriority.length > 0) {
      const topFeature = sortedByPriority[0];
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        handleHighlightFeature(topFeature.layerId, topFeature.feature);
      }, 0);
    }
  }, [overlappingFeatures, layersRef, handleHighlightFeature]);

  // Intersection management - using dedicated hook
  const {
    isIntersecting,
    performIntersection,
    saveIntersection,
    exportIntersection,
  } = useIntersection({
    layers,
    map,
    seattleZoningFilters,
    seattleBaseZoneFilters,
    getLayersWithCurrentState,
    toggleLayer,
    addIntersectionLayer: addIntersectionLayer as any,
  });

  // clearIntersectionLayer might not exist, create a simple version
  const clearIntersectionLayer = React.useCallback(() => {
    toggleLayer('intersection');
  }, [toggleLayer]);

  // Dialog state
  const [saveDialogVisible, setSaveDialogVisible] = React.useState(false);
  const [exportDialogVisible, setExportDialogVisible] = React.useState(false);
  const [saveMarkerDialogOpen, setSaveMarkerDialogOpen] = React.useState(false);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = React.useState(false);
  const [exportSearchDialogOpen, setExportSearchDialogOpen] = React.useState(false);
  const [searchNameToSave, setSearchNameToSave] = React.useState('');
  const [exportSearchFilename, setExportSearchFilename] = React.useState('');

  // Text query search placement mode
  const [isTextQuerySearchPlacing, setIsTextQuerySearchPlacing] = React.useState(false);
  const textQuerySearchConfirmRef = React.useRef<(() => void) | null>(null);
  const textQuerySearchCancelRef = React.useRef<(() => void) | null>(null);

  // Marker state for properties list
  const [markersOnMap, setMarkersOnMap] = React.useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Memoize map canvas to prevent remounting on parent re-renders
  // MUST be defined here (before any conditional returns) to follow Rules of Hooks
  const mapCanvasElement = useMemo(() => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <MapCanvas key="stable-map-canvas" mapRef={mapRef} />
    </div>
  ), [mapRef]); // Only recreate if mapRef changes (which it shouldn't)

  // Helper function to get themed colors for info windows
  const getInfoWindowColors = useCallback(() => {
    // Always use black text and light colors for info windows (Google Maps limitation)
    return {
      bgColor: '#ffffff',
      textColor: '#000000',
      mutedColor: '#666666',
      borderColor: '#e0e0e0',
    };
  }, []);

  // Solar overlay handlers (defined first to avoid circular dependency)
  const handleToggleFluxOverlay = useCallback(async () => {
    if (!solarDataLayers || !map) {
      return;
    }

    if (showFluxOverlay) {
      // Remove overlay
      if (solarOverlays.flux) {
        solarOverlays.flux.setMap(null);
        setSolarOverlays(prev => ({ ...prev, flux: null }));
      }
      if (solarLegendRef.current) {
        solarLegendRef.current.style.display = 'none';
      }
      setShowFluxOverlay(false);
    } else {
      // Add overlay
      setSolarOverlayLoading(true);
      try {
        const { downloadGeoTIFF } = await import('../../services/map/solarService');
        const { createSolarOverlay, SOLAR_COLOR_SCALES, createColorScaleLegend } = await import('../../utils/map/solarVisualization');

        const geoTiff = await downloadGeoTIFF(solarDataLayers.annualFluxUrl, googleMapsApiKey);
        const overlay = createSolarOverlay(geoTiff, SOLAR_COLOR_SCALES.FLUX, solarOverlayOpacity, false);
        overlay.setMap(map);
        setSolarOverlays(prev => ({ ...prev, flux: overlay }));

        // Add legend
        if (!solarLegendRef.current) {
          const legend = document.createElement('div');
          legend.style.position = 'absolute';
          legend.style.bottom = '50px';
          legend.style.right = '10px';
          legend.style.backgroundColor = 'white';
          legend.style.padding = '10px';
          legend.style.borderRadius = '4px';
          legend.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          legend.style.zIndex = '1000';

          const canvas = createColorScaleLegend(SOLAR_COLOR_SCALES.FLUX);
          legend.appendChild(canvas);

          map.getDiv().appendChild(legend);
          solarLegendRef.current = legend;
        } else {
          solarLegendRef.current.style.display = 'block';
        }

        setShowFluxOverlay(true);
        toast.success('Solar flux heatmap displayed');
      } catch (error) {
        console.error('Error loading flux overlay:', error);
        toast.error('Failed to load solar flux overlay');
      } finally {
        setSolarOverlayLoading(false);
      }
    }
  }, [solarDataLayers, map, showFluxOverlay, solarOverlays, solarOverlayOpacity, googleMapsApiKey]);

  const handleToggleMapWideHeatmap = useCallback(async () => {
    if (!map || !solarLocation) {
      return;
    }

    if (showMapWideHeatmap) {
      // Remove overlay
      if (solarOverlays.mapwide) {
        solarOverlays.mapwide.setMap(null);
        setSolarOverlays(prev => ({ ...prev, mapwide: null }));
      }
      setShowMapWideHeatmap(false);
    } else {
      // Add map-wide overlay with fallback radii
      setSolarOverlayLoading(true);
      try {
        const { getDataLayerUrls, downloadGeoTIFF } = await import('../../services/map/solarService');
        const { createSolarOverlay, SOLAR_COLOR_SCALES, createColorScaleLegend } = await import('../../utils/map/solarVisualization');

        // Try different coverage levels
        const attempts = [
          { radius: 500, pixelSize: 0.5, description: '500m radius' },
          { radius: 1000, pixelSize: 1.0, description: '1km radius' },
          { radius: 2000, pixelSize: 2.0, description: '2km radius' },
        ];

        let layers = null;
        let successfulAttempt = null;

        for (const attempt of attempts) {
          try {
            layers = await getDataLayerUrls(
              { latitude: solarLocation.lat, longitude: solarLocation.lng },
              attempt.radius,
              googleMapsApiKey,
              attempt.pixelSize
            );
            successfulAttempt = attempt;
            break;
          } catch (err) {
            continue;
          }
        }

        if (!layers || !successfulAttempt) {
          throw new Error('No solar data available in this area at any coverage level');
        }

        // Download the flux data
        const geoTiff = await downloadGeoTIFF(layers.annualFluxUrl, googleMapsApiKey);

        // Create overlay
        const overlay = createSolarOverlay(geoTiff, SOLAR_COLOR_SCALES.FLUX, solarOverlayOpacity, false);
        overlay.setMap(map);
        setSolarOverlays(prev => ({ ...prev, mapwide: overlay }));
        setShowMapWideHeatmap(true);

        // Show legend if not already visible
        if (!solarLegendRef.current) {
          const legend = document.createElement('div');
          legend.style.position = 'absolute';
          legend.style.bottom = '50px';
          legend.style.right = '10px';
          legend.style.backgroundColor = 'white';
          legend.style.padding = '10px';
          legend.style.borderRadius = '4px';
          legend.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          legend.style.zIndex = '1000';

          const canvas = createColorScaleLegend(SOLAR_COLOR_SCALES.FLUX);
          legend.appendChild(canvas);

          map.getDiv().appendChild(legend);
          solarLegendRef.current = legend;
        } else {
          solarLegendRef.current.style.display = 'block';
        }

        toast.success(`Showing ${successfulAttempt.description} solar irradiance`);
      } catch (error) {
        console.error('Error loading map-wide heatmap:', error);

        // Fallback to flux overlay if map-wide fails
        if (solarDataLayers?.annualFluxUrl) {
          try {
            const { downloadGeoTIFF } = await import('../../services/map/solarService');
            const { createSolarOverlay, SOLAR_COLOR_SCALES, createColorScaleLegend } = await import('../../utils/map/solarVisualization');

            const geoTiff = await downloadGeoTIFF(solarDataLayers.annualFluxUrl, googleMapsApiKey);
            const overlay = createSolarOverlay(geoTiff, SOLAR_COLOR_SCALES.FLUX, solarOverlayOpacity, false);
            overlay.setMap(map);
            setSolarOverlays(prev => ({ ...prev, mapwide: overlay }));
            setShowMapWideHeatmap(true);

            // Show legend if not already visible
            if (!solarLegendRef.current) {
              const legend = document.createElement('div');
              legend.style.position = 'absolute';
              legend.style.bottom = '50px';
              legend.style.right = '10px';
              legend.style.backgroundColor = 'white';
              legend.style.padding = '10px';
              legend.style.borderRadius = '4px';
              legend.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              legend.style.zIndex = '1000';

              const canvas = createColorScaleLegend(SOLAR_COLOR_SCALES.FLUX);
              legend.appendChild(canvas);

              map.getDiv().appendChild(legend);
              solarLegendRef.current = legend;
            } else {
              solarLegendRef.current.style.display = 'block';
            }

            toast.info('Map-wide data unavailable, showing building-level heatmap');
          } catch (fallbackError) {
            console.error('Error loading fallback flux overlay:', fallbackError);
            toast.error('Failed to load any solar heatmap data');
          }
        } else {
          toast.error('Failed to load map-wide heatmap');
        }
      } finally {
        setSolarOverlayLoading(false);
      }
    }
  }, [map, solarLocation, showMapWideHeatmap, solarOverlays, solarOverlayOpacity, googleMapsApiKey, solarDataLayers]);

  const handleUpdateOverlayOpacity = useCallback((value: number) => {
    setSolarOverlayOpacity(value);
    if (solarOverlays.flux) {
      solarOverlays.flux.setOpacity(value);
    }
    if (solarOverlays.mapwide) {
      solarOverlays.mapwide.setOpacity(value);
    }
  }, [solarOverlays]);

  const handleClearAllOverlays = useCallback(() => {
    if (solarOverlays.flux) {
      solarOverlays.flux.setMap(null);
      setSolarOverlays(prev => ({ ...prev, flux: null }));
      setShowFluxOverlay(false);
    }
    if (solarOverlays.mapwide) {
      solarOverlays.mapwide.setMap(null);
      setSolarOverlays(prev => ({ ...prev, mapwide: null }));
      setShowMapWideHeatmap(false);
    }
    if (solarLegendRef.current) {
      solarLegendRef.current.style.display = 'none';
    }
  }, [solarOverlays]);

  const handleCloseSolar = useCallback(() => {
    handleClearAllOverlays();
    setSolarData(null);
    setSolarDataLayers(null);
    setSolarLocation(null);
    setIsSolarPlacementMode(false);

    // Remove solar marker
    if (solarMarkerRef.current) {
      solarMarkerRef.current.map = null;
      solarMarkerRef.current = null;
    }

    // Remove legend completely
    if (solarLegendRef.current) {
      solarLegendRef.current.remove();
      solarLegendRef.current = null;
    }

    // Notify parent to close the solar panel
    if (onSolarUpdate) {
      onSolarUpdate(
        false, // visible - close the panel
        false, // isLoading
        null, // data
        'analysis', // activeTab
        () => {}, // onTabChange
        () => {}, // onClose
        () => {}, // onClearAll
        false, // loadingOverlay
        false, // showFluxOverlay
        false, // showMapWideHeatmap
        100, // overlayOpacity
        () => {}, // onToggleFluxOverlay
        () => {}, // onToggleMapWideHeatmap
        () => {}, // onUpdateOverlayOpacity
        () => {} // onClearAllOverlays
      );
    }
  }, [handleClearAllOverlays, onSolarUpdate]);

  const handleClearAllSolar = useCallback(() => {
    handleCloseSolar();
  }, [handleCloseSolar]);

  // Solar button handler - enters placement mode
  const handleSolarClick = useCallback(() => {
    if (!map) return;

    setIsSolarPlacementMode(true);
    map.setOptions({ draggableCursor: 'crosshair' });

    toast.info('Click on a building to analyze solar potential', {
      duration: 5000,
    });
  }, [map]);

  // Handle solar placement
  const handleSolarPlacement = useCallback(async (lat: number, lng: number) => {
    if (!map) return;

    // Exit placement mode
    setIsSolarPlacementMode(false);
    map.setOptions({ draggableCursor: null });

    // Remove click listener
    if (solarClickListenerRef.current) {
      solarClickListenerRef.current.remove();
      solarClickListenerRef.current = null;
    }

    // Clear any existing overlays and reset states
    handleClearAllOverlays();

    setSolarLoading(true);

    // Show loading in panel
    if (onSolarUpdate) {
      onSolarUpdate(
        true, // visible
        true, // isLoading
        null, // data
        solarActiveTab, // activeTab
        (tab) => setSolarActiveTab(tab), // onTabChange
        () => {
          setSolarData(null);
          setIsSolarPlacementMode(false);
        }, // onClose
        () => {
          setSolarData(null);
          setIsSolarPlacementMode(false);
        }, // onClearAll
        false, // loadingOverlay
        false, // showFluxOverlay
        false, // showMapWideHeatmap
        0.7, // overlayOpacity
        () => {}, // onToggleFluxOverlay
        () => {}, // onToggleMapWideHeatmap
        () => {}, // onUpdateOverlayOpacity
        () => {} // onClearAllOverlays
      );
    }

    try {
      const analysis = await fetchSolarData(lat, lng);
      if (analysis) {
        setSolarData(analysis);
        setSolarLocation({ lat, lng });

        // Add marker at solar analysis location
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        // Remove existing solar marker if any
        if (solarMarkerRef.current) {
          solarMarkerRef.current.map = null;
        }

        // Create sun icon marker
        const pinElement = new PinElement({
          background: '#FFA500',
          glyphColor: '#FFFFFF',
          borderColor: '#FF8C00',
          glyph: '☀️',
          scale: 1.2,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat, lng },
          title: 'Solar Analysis Location',
          content: pinElement.element,
        });

        solarMarkerRef.current = marker;

        // Fetch data layers for heatmap overlays
        let fetchedLayers = null;
        try {
          const { getDataLayerUrls } = await import('../../services/map/solarService');
          const layers = await getDataLayerUrls(
            { latitude: lat, longitude: lng },
            100, // radius in meters
            googleMapsApiKey
          );
          fetchedLayers = layers;
          setSolarDataLayers(layers);
        } catch (err) {
          // Continue without data layers - analysis still works
        }

        // Notify parent via onSolarUpdate with proper handlers
        if (onSolarUpdate) {
          onSolarUpdate(
            true, // visible
            false, // isLoading
            analysis, // data
            solarActiveTab, // activeTab
            (tab) => setSolarActiveTab(tab), // onTabChange
            handleCloseSolar, // onClose
            handleClearAllSolar, // onClearAll
            solarOverlayLoading, // loadingOverlay
            showFluxOverlay, // showFluxOverlay
            showMapWideHeatmap, // showMapWideHeatmap
            solarOverlayOpacity, // overlayOpacity
            handleToggleFluxOverlay, // onToggleFluxOverlay
            handleToggleMapWideHeatmap, // onToggleMapWideHeatmap
            handleUpdateOverlayOpacity, // onUpdateOverlayOpacity
            handleClearAllOverlays // onClearAllOverlays
          );
        }

        toast.success('Solar analysis complete!');
      } else {
        toast.error('No solar data available for this location');
      }
    } catch (error) {
      console.error('Solar analysis error:', error);
      toast.error('Failed to fetch solar data');
    } finally {
      setSolarLoading(false);
    }
  }, [map, fetchSolarData, onSolarUpdate, solarActiveTab, solarOverlayLoading, showFluxOverlay, showMapWideHeatmap, solarOverlayOpacity, handleToggleFluxOverlay, handleToggleMapWideHeatmap, handleUpdateOverlayOpacity, handleClearAllOverlays, handleCloseSolar, handleClearAllSolar, googleMapsApiKey]);

  // Cancel solar placement mode
  const handleCancelSolarPlacement = useCallback(() => {
    if (!map) return;

    setIsSolarPlacementMode(false);
    map.setOptions({ draggableCursor: null });

    // Remove click listener
    if (solarClickListenerRef.current) {
      solarClickListenerRef.current.remove();
      solarClickListenerRef.current = null;
    }

    toast.info('Solar analysis cancelled');
  }, [map]);

  // Update parent when data layers are fetched OR when active tab changes
  React.useEffect(() => {
    if (onSolarUpdate && solarData && solarDataLayers) {
      onSolarUpdate(
        true, // visible
        false, // isLoading
        solarData, // data
        solarActiveTab, // activeTab
        (tab) => setSolarActiveTab(tab), // onTabChange
        handleCloseSolar, // onClose
        handleClearAllSolar, // onClearAll
        solarOverlayLoading, // loadingOverlay
        showFluxOverlay, // showFluxOverlay
        showMapWideHeatmap, // showMapWideHeatmap
        solarOverlayOpacity, // overlayOpacity
        handleToggleFluxOverlay, // onToggleFluxOverlay
        handleToggleMapWideHeatmap, // onToggleMapWideHeatmap
        handleUpdateOverlayOpacity, // onUpdateOverlayOpacity
        handleClearAllOverlays // onClearAllOverlays
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarDataLayers, solarActiveTab, solarOverlayLoading]); // Re-run when data layers change OR active tab changes OR loading state changes

  // Setup solar click listener when entering placement mode
  React.useEffect(() => {
    if (!map || !isSolarPlacementMode) return;

    // Add click listener for solar placement
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        handleSolarPlacement(event.latLng.lat(), event.latLng.lng());
      }
    });

    solarClickListenerRef.current = listener;

    return () => {
      if (solarClickListenerRef.current) {
        solarClickListenerRef.current.remove();
        solarClickListenerRef.current = null;
      }
    };
  }, [map, isSolarPlacementMode, handleSolarPlacement]);

  // Marker selection handlers for PropertiesList
  const handleMarkerSelect = useCallback(async (markers: any[]) => {
    if (!map) return;

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const { createSavedPropertyMarker } = await import('../../utils/map/customMarkerSVGs');
    const { isKingCountyAddress, fetchParcelData, formatParcelDataHtml, getPropertyLinks } = await import('../../utils/map/parcelUtils');
    const api = await import('../../services/api').then(module => module.default);

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    markers.forEach(marker => {
        // Check if this marker is already on the map (avoid duplicates)
        const existingMarker = markersOnMap.find(existingMarker => existingMarker.title === marker.name);
        if (existingMarker) {
            return; // Skip this marker as it's already displayed
        }

        // Create custom SVG marker element
        const markerElement = createSavedPropertyMarker(marker.propertyCategory, isDarkMode);

        const newMarker = new AdvancedMarkerElement({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            title: marker.name,
            content: markerElement,
            zIndex: 600, // Higher than neighborhood markers (500) so property markers appear on top
        });

        // Create initial info window content with delete button
        const colors = getInfoWindowColors();
        const initialContent = `
          <div style="color: ${colors.textColor}; min-width: 300px; max-width: 400px; background-color: ${colors.bgColor}; padding: 12px; border-radius: 8px;">
            <h3 style="color: ${colors.textColor}; margin: 0 0 8px 0;">${marker.name}</h3>
            <p style="color: ${colors.textColor}; margin: 0;">${marker.address}</p>
            ${marker.propertyType && marker.propertyCategory ? `
              <div style="margin-top: 8px;">
                <span style="color: ${colors.mutedColor}; font-size: 12px;">Type: ${marker.propertyType} - ${marker.propertyCategory}</span>
              </div>
            ` : ''}
            <div id="parcel-data-${marker.id}" style="min-height: 20px;">
              ${isKingCountyAddress(marker.address) ? `<div style="color: ${colors.mutedColor}; font-size: 12px; margin-top: 8px;">Loading parcel data...</div>` : ''}
            </div>
            ${!marker.isTemplate ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${colors.borderColor};">
                <button id="delete-marker-${marker.id}" style="
                  background-color: #f44336;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  cursor: pointer;
                  border-radius: 4px;
                  font-size: 14px;
                ">Delete Property</button>
              </div>
            ` : ''}
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: initialContent,
            pixelOffset: new google.maps.Size(0, -68), // Offset for property marker (10% lower)
        });

        newMarker.addListener('click', async () => {
            infoWindowManager.openInfoWindow(infoWindow, map, newMarker);

            // Add delete button listener after info window opens
            if (!marker.isTemplate) {
                setTimeout(() => {
                    const deleteBtn = document.getElementById(`delete-marker-${marker.id}`);
                    if (deleteBtn) {
                        deleteBtn.onclick = async () => {
                            if (confirm(`Are you sure you want to delete the marker "${marker.name}"?`)) {
                                try {
                                    await api.delete(`/markers/${marker.id}`);
                                    infoWindow.close();
                                    newMarker.map = null;
                                    setMarkersOnMap(prev => prev.filter(m => m !== newMarker));
                                    toast.success('Success', {
                                        description: 'Marker deleted successfully!',
                                    });
                                    // Trigger refresh of properties list
                                    window.dispatchEvent(new Event('marker-deleted'));
                                } catch (error) {
                                    console.error('Error deleting marker:', error);
                                    toast.error('Error', {
                                        description: 'Failed to delete marker',
                                    });
                                }
                            }
                        };
                    }
                }, 100);
            }

            // Fetch parcel data if it's a King County address
            if (isKingCountyAddress(marker.address)) {
                const parcelData = await fetchParcelData(marker.address, marker.lat, marker.lng);

                // Generate property links with PIN from parcel data
                const propertyLinks = parcelData ? getPropertyLinks(marker.address, parcelData.pin) : '';

                // Update info window content with parcel data and delete button
                const updatedContent = `
                  <div style="color: ${colors.textColor}; min-width: 300px; max-width: 400px; background-color: ${colors.bgColor}; padding: 12px; border-radius: 8px;">
                    <h3 style="color: ${colors.textColor}; margin: 0 0 8px 0;">${marker.name}</h3>
                    <p style="color: ${colors.textColor}; margin: 0;">${marker.address}</p>
                    ${marker.propertyType && marker.propertyCategory ? `
                      <div style="margin-top: 8px;">
                        <span style="color: ${colors.mutedColor}; font-size: 12px;">Type: ${marker.propertyType} - ${marker.propertyCategory}</span>
                      </div>
                    ` : ''}
                    ${parcelData ? formatParcelDataHtml(parcelData) : ''}
                    ${propertyLinks}
                    ${!marker.isTemplate ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid ${colors.borderColor};">
                        <button id="delete-marker-${marker.id}" style="
                          background-color: #f44336;
                          color: white;
                          border: none;
                          padding: 6px 12px;
                          cursor: pointer;
                          border-radius: 4px;
                          font-size: 14px;
                        ">Delete Marker</button>
                      </div>
                    ` : ''}
                  </div>
                `;

                infoWindow.setContent(updatedContent);

                // Re-attach delete button listener
                if (!marker.isTemplate) {
                    setTimeout(() => {
                        const deleteBtn = document.getElementById(`delete-marker-${marker.id}`);
                        if (deleteBtn) {
                            deleteBtn.onclick = async () => {
                                if (confirm(`Are you sure you want to delete the marker "${marker.name}"?`)) {
                                    try {
                                        await api.delete(`/markers/${marker.id}`);
                                        infoWindow.close();
                                        newMarker.map = null;
                                        setMarkersOnMap(prev => prev.filter(m => m !== newMarker));
                                        toast.success('Success', {
                                            description: 'Marker deleted successfully!',
                                        });
                                        // Trigger refresh of properties list
                                        window.dispatchEvent(new Event('marker-deleted'));
                                    } catch (error) {
                                        console.error('Error deleting marker:', error);
                                        toast.error('Error', {
                                            description: 'Failed to delete marker',
                                        });
                                    }
                                }
                            };
                        }
                    }, 100);
                }
            }
        });

        newMarkers.push(newMarker);
    });

    // Add new markers to existing ones (additive behavior)
    setMarkersOnMap([...markersOnMap, ...newMarkers]);

    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(new google.maps.LatLng(marker.lat, marker.lng));
        });
        map.fitBounds(bounds);
    }

    // Close the properties popover after selecting a marker
    setPropertiesPopoverOpen(false);
  }, [map, markersOnMap, getInfoWindowColors]);

  const handleMarkerDeselect = useCallback((markers: any[]) => {
    if (!map) return;

    const markersToRemove = markersOnMap.filter(markerOnMap => markers.some(marker => marker.name === markerOnMap.title));

    markersToRemove.forEach(marker => {
      marker.map = null;
    });

    const remainingMarkers = markersOnMap.filter(markerOnMap => !markers.some(marker => marker.name === markerOnMap.title));
    setMarkersOnMap(remainingMarkers);
  }, [map, markersOnMap]);

  const handleClearAllMarkers = useCallback(() => {
    markersOnMap.forEach(marker => marker.map = null);
    setMarkersOnMap([]);
  }, [markersOnMap]);

  // Store callbacks from TextSearchCard
  const textQuerySearchClearCallbackRef = useRef<(() => void) | null>(null);
  const textQuerySearchExportCallbackRef = useRef<((filename: string) => void) | null>(null);
  const textQuerySearchSaveCallbackRef = useRef<((searchName: string) => void) | null>(null);
  const textQuerySearchSaveLocationCallbackRef = useRef<((result: SearchResult, locationName: string) => void) | null>(null);
  const textQuerySearchDeleteResultCallbackRef = useRef<((result: SearchResult) => void) | null>(null);
  const textQuerySearchMarkerTypeChangeCallbackRef = useRef<((result: SearchResult, newType: string) => void) | null>(null);
  const textQuerySearchOpenSaveDialogRef = useRef<(() => void) | null>(null);
  const textQuerySearchOpenExportDialogRef = useRef<(() => void) | null>(null);

  // Store metadata in ref for reliable access in callbacks
  const textQuerySearchMetadataRef = useRef<{ textQuery: string; radius: number; centerLat: number; centerLng: number } | null>(null);

  // Handle new search from the results panel (same location, different text query)
  const handleNewSearch = useCallback((textQuery: string) => {
    if (textQuerySearchMetadataRef.current && textQuerySearchFunctionRef.current) {
      // Run search at the same location with new text query
      // Pass true for isAdditive to prevent clearing existing results
      textQuerySearchFunctionRef.current(
        textQuery,
        undefined, // categories
        textQuerySearchMetadataRef.current.radius,
        textQuerySearchMetadataRef.current.centerLat,
        textQuerySearchMetadataRef.current.centerLng,
        // true // isAdditive = true (don't clear existing results)
      );
    }
  }, []); // No dependencies - always uses current ref values

  // Text query search update handler
  const handleNeighborhoodExplorerUpdate = useCallback((
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
  ) => {
    console.log('🎨 [MapContainerRefactored] handleNeighborhoodExplorerUpdate called:', {
      resultsCount: results.length,
      visible,
      hasOnMarkerTypeChange: !!onMarkerTypeChange,
      resultsWithCustomTypes: results.filter(r => r.customMarkerType).length
    });

    setTextQuerySearchResults(results);
    setShowTextQueryResults(visible);
    setTextQuerySearchMetadata(metadata);

    // Store metadata in ref for handleNewSearch callback
    textQuerySearchMetadataRef.current = metadata;

    // Store all callbacks so we can call them from the results panel
    textQuerySearchClearCallbackRef.current = onClear;
    textQuerySearchExportCallbackRef.current = onExport;
    textQuerySearchSaveCallbackRef.current = onSave;
    textQuerySearchSaveLocationCallbackRef.current = onSaveLocation;
    textQuerySearchDeleteResultCallbackRef.current = onDeleteResult;
    textQuerySearchMarkerTypeChangeCallbackRef.current = onMarkerTypeChange;

    // console.log('🎨 [MapContainerRefactored] Stored onMarkerTypeChange in ref:', !!onMarkerTypeChange);

    // Notify parent (App -> PanelLayout) about text query search state
    if (onNeighborhoodExplorerUpdate) {
      // console.log('🎨 [MapContainerRefactored] Calling parent onNeighborhoodExplorerUpdate with onMarkerTypeChange:', !!onMarkerTypeChange);
      onNeighborhoodExplorerUpdate(
        results,
        visible,
        metadata,
        onResultClick,
        onClear,
        onExport,
        onSave,
        onSaveLocation,
        onDeleteResult,
        onNewSearch,
        onMarkerTypeChange
      );
    }
  }, [onNeighborhoodExplorerUpdate]);

  // Notify parent when feature layer panel state changes
  React.useEffect(() => {
    if (onFeatureLayerUpdate) {
      onFeatureLayerUpdate(
        showFeatureLayerPanel,
        overlappingFeatures,
        handleCloseFeatureLayerPanel,
        setLayerPriority,
        handleHighlightFeature
      );
    }
  }, [showFeatureLayerPanel, overlappingFeatures, onFeatureLayerUpdate, handleCloseFeatureLayerPanel, setLayerPriority, handleHighlightFeature]);

  const handleSearchFunctionReady = useCallback((searchFn: (textQuery: string, categories: string[], radius: number, centerLat: number, centerLng: number, isAdditive?: boolean) => Promise<void>) => {
    // Wrap the function to handle optional parameters expected by textQuerySearchFunctionRef
    const wrappedSearchFn = (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => {
      return searchFn(textQuery || '', categories || [], radius, centerLat, centerLng);
    };
    textQuerySearchFunctionRef.current = wrappedSearchFn;

    // Update the callbacks if already registered
    if (mapCallbacksRef.current) {
      mapCallbacksRef.current.runTextQuerySearch = wrappedSearchFn;
    }
  }, []);

  const handlePlacementModeChange = useCallback((isPlacing: boolean, onConfirm?: () => void, onCancel?: () => void) => {
    setIsTextQuerySearchPlacing(isPlacing);
    if (isPlacing) {
      textQuerySearchConfirmRef.current = onConfirm || null;
      textQuerySearchCancelRef.current = onCancel || null;
    } else {
      textQuerySearchConfirmRef.current = null;
      textQuerySearchCancelRef.current = null;
    }
  }, []);

  // Create navigateToLocation as a useCallback with proper dependencies
  const navigateToLocation = useCallback(async (
    lat: number,
    lng: number,
    name: string,
    address?: string,
    placeId?: string,
    placeTypes?: string
  ) => {
    if (!map) {
      console.error('Map not initialized');
      return;
    }

    try {
      // Import marker library first
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Set zoom first
      map.setZoom(17);

      // Calculate offset to show marker below the InfoWindow
      // Offset the center point downward so marker appears below InfoWindow
      const scale = Math.pow(2, map.getZoom()!);
      const pixelOffset = 150; // pixels to offset downward
      const latOffset = pixelOffset / scale / 256 * 180; // Convert pixels to latitude degrees

      // Pan to location with offset
      map.setCenter({ lat: lat + latOffset, lng });

      const pinElement = new PinElement({
        background: '#4285F4', // Google blue
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        scale: 1.2,
      });

      const marker = new AdvancedMarkerElement({
        map: map,  // Use the map from closure
        position: { lat, lng },
        title: name,
        content: pinElement.element,
      });

      // Format place types for display
      const typesDisplay = placeTypes
        ? placeTypes.split(',').map(type =>
            type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          ).join(', ')
        : '';

      // Create info window with all available data
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #000000; min-width: 250px; max-width: 350px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${name}</h3>
            ${address ? `
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;">
                <strong>📍 Address:</strong><br/>
                ${address}
              </p>
            ` : ''}
            ${typesDisplay ? `
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">
                <strong>🏷️ Types:</strong> ${typesDisplay}
              </p>
            ` : ''}
            <p style="margin: 0; font-size: 12px; color: #999;">
              <strong>📌 Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>
            ${placeId ? `
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${placeId}"
                   target="_blank"
                   style="color: #4285F4; text-decoration: none;">
                  View on Google Maps →
                </a>
              </p>
            ` : ''}
          </div>
        `,
        pixelOffset: new google.maps.Size(0, -45),
      });

      // Open info window immediately
      infoWindowManager.openInfoWindow(infoWindow, map, marker);

      // Add click listener to reopen info window
      marker.addListener('gmp-click', () => {
        infoWindowManager.openInfoWindow(infoWindow, map, marker);
      });

      // Add marker to state so it persists
      setMarkersOnMap(prev => [...prev, marker]);

      toast.success(`Navigated to ${name}`);
    } catch (error) {
      console.error('Error creating marker:', error);
      toast.error('Failed to create marker');
    }
  }, [map]);

  // Notify parent when map loads - memoize the callbacks object
  const mapCallbacksRef = React.useRef<{
    addIntersectionLayer: (geoJsonData: GeoJsonFeatureCollection) => void;
    toggleLayer: (layerId: string) => void;
    navigateToLocation: (lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void;
    runTextQuerySearch?: (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void;
  } | null>(null);

  React.useEffect(() => {
    if (map && onLoad && !mapCallbacksRef.current) {
      mapCallbacksRef.current = {
        addIntersectionLayer,
        toggleLayer,
        navigateToLocation,  // Just reference the callback
        runTextQuerySearch: textQuerySearchFunctionRef.current || undefined,
      };
      onLoad(mapCallbacksRef.current);
    }
  }, [map, onLoad, navigateToLocation, addIntersectionLayer, toggleLayer]); // Add all dependencies

  // Provide layer controls render function to PanelLayout (memoized to prevent infinite loops)
  const renderLayerControls = useCallback(() => (
    <div className="map-left-panel h-full text-foreground overflow-y-auto relative z-0">
      <MapControls
        layers={layers}
        toggleLayer={toggleLayer}
        seattleZoningFilters={seattleZoningFilters}
        setSeattleZoneFilter={setSeattleZoneFilter}
        seattleZoningColors={seattleZoningColors}
        seattleBaseZoneFilters={seattleBaseZoneFilters}
        setSeattleBaseZoneFilter={setSeattleBaseZoneFilter}
        layersRef={layersRef}
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        onMarkerSelect={handleMarkerSelect}
        onMarkerDeselect={handleMarkerDeselect}
        onClearAllMarkers={handleClearAllMarkers}
      />
    </div>
  ), [layers, toggleLayer, seattleZoningFilters, setSeattleZoneFilter, seattleZoningColors, seattleBaseZoneFilters, setSeattleBaseZoneFilter, layersRef, locations, selectedLocation, handleMarkerSelect, handleMarkerDeselect, handleClearAllMarkers]);

  React.useEffect(() => {
    if (onLayerControlsReady) {
      onLayerControlsReady(renderLayerControls);
    }
  }, [onLayerControlsReady, renderLayerControls]);

  // Intersection handlers - delegate to hook
  const handleIntersection = performIntersection;

  const handleSaveIntersection = useCallback(() => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');

    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      toast.warning('Please sign in to save intersections');
      return;
    }

    setSaveDialogVisible(true);
  }, [layers]);

  const handleSaveConfirm = useCallback(async (name: string) => {
    setSaveDialogVisible(false);
    await saveIntersection(name);
  }, [saveIntersection]);

  const handleExportCsv = useCallback(() => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');
    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      return;
    }
    setExportDialogVisible(true);
  }, [layers]);

  const handleExportConfirm = useCallback(async (filename: string) => {
    setExportDialogVisible(false);
    await exportIntersection(filename);
  }, [exportIntersection]);

  // Handle save marker
  const handleSaveMarker = useCallback(async (name: string, propertyType: SelectedPropertyType) => {
    if (!selectedPlace || !selectedPlace.location) {
      toast.error('Error', {
        description: 'No location selected to save.',
      });
      return;
    }

    try {
      const api = await import('../../services/api').then(module => module.default);
      await api.post('/markers/save', {
        name,
        address: selectedPlace.formattedAddress,
        lat: selectedPlace.location.lat(),
        lng: selectedPlace.location.lng(),
        propertyType: propertyType.parent ? propertyType.parent.code : propertyType.code,
        propertyCategory: propertyType.code,
      });

      toast.success('Success', {
        description: 'Marker saved successfully!',
      });

      // Clear the search marker after saving
      clearSearchMarker();
      setSaveMarkerDialogOpen(false);

      // Trigger refresh of properties list
      window.dispatchEvent(new Event('marker-deleted'));
    } catch (error) {
      console.error('Error saving marker:', error);
      toast.error('Error', {
        description: 'Failed to save marker.',
      });
    }
  }, [selectedPlace, clearSearchMarker]);

  // Error state
  if (loadError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error loading maps</h2>
        <p>{loadError}</p>
        <p style={{ fontSize: '0.9em', marginTop: '10px' }}>Check console for details</p>
      </div>
    );
  }

  // Debug loading state - DISABLED TO REDUCE CONSOLE SPAM
  // console.log('MapContainer render:', {
  //   isLoaded,
  //   isInitializing,
  //   hasMap: !!map,
  //   layersLength: layers.length,
  //   locationsLength: locations.length,
  //   selectedLocation: selectedLocation?.code
  // });

  // Loading state
  if (!isLoaded || isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <LoadingSpinner />
        <p>{!isLoaded ? 'Loading Google Maps...' : 'Initializing map...'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full relative" style={{ display: 'flex', overflow: 'hidden' }}>
        {/* Map Canvas - Always fills container */}
        <div className="map-canvas-panel flex-1 relative" style={{ height: '100%', width: '100%', overflow: 'visible' }}>
          {/* Map fills container - using pre-rendered element */}
          {mapCanvasElement}

          {map && !isStreetViewActive && (
              <>
                {/* Top Controls */}
                <div className="map-top-controls">
                  {/* SearchCard - always show */}
                  <SearchCard map={map} onPlaceSelected={handlePlaceSelected} />
                  {/* PropertiesList - never show in top controls (accessible via sidebar/mobile buttons) */}
                </div>

                {/* Left Side Buttons - Mobile only */}
                {isMobile && (
                  <TooltipProvider>
                    <div className="map-left-controls">
                      {/* Properties Button */}
                      <Popover>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10"
                                style={{
                                  backgroundColor: '#407f7f',
                                  color: 'white',
                                  borderColor: '#407f7f'
                                }}
                              >
                                <Home className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Property Types</p>
                          </TooltipContent>
                        </Tooltip>
                        <PopoverContent side="right" align="start" className="w-[280px] max-h-[400px] overflow-hidden p-0 sidebar-properties-popup">
                          <PropertiesList
                            onMarkerSelect={handleMarkerSelect}
                            onMarkerDeselect={handleMarkerDeselect}
                            onClearAllMarkers={handleClearAllMarkers}
                            alwaysOpen={true}
                            onNeighborhoodExplorer={(textQuery, radius, lat, lng) => {
                              if (textQuerySearchFunctionRef.current) {
                                textQuerySearchFunctionRef.current(textQuery, undefined, radius, lat, lng);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      <div style={{ height: '12px' }} /> {/* Separator */}

                      {/* Neighborhood Explorer Button */}
                      <NeighborhoodExplorerCard
                        map={map}
                        onNeighborhoodExplorerUpdate={handleNeighborhoodExplorerUpdate}
                        onSearchFunctionReady={handleSearchFunctionReady}
                        onPlacementModeChange={handlePlacementModeChange}
                        searchMarkerLocation={(() => {
                          if (selectedPlace && selectedPlace.location) {
                            const latVal = selectedPlace.location.lat;
                            const lngVal = selectedPlace.location.lng;
                            const lat = typeof latVal === 'function' ? latVal() : latVal;
                            const lng = typeof lngVal === 'function' ? lngVal() : lngVal;
                            return { lat, lng };
                          }
                          return null;
                        })() as { lat: number; lng: number } | null}
                      />

                      {/* Solar Analysis Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleSolarClick}
                            disabled={solarLoading}
                            className="h-10 w-10"
                            style={{
                              backgroundColor: '#FFA500',
                              color: 'white',
                              borderColor: '#FFA500'
                            }}
                          >
                            {solarLoading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Sun className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Solar Analysis</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Label Toggle Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={toggleLabels}
                            className="h-10 w-10"
                            style={{
                              backgroundColor: '#73513e',
                              color: 'white',
                              borderColor: '#73513e'
                            }}
                          >
                            {showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{showLabels ? 'Hide Labels' : 'Show Labels'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                )}

                {/* Right Side Buttons - Desktop/Tablet only */}
                {!isMobile && (
                  <TooltipProvider>
                    {/* Top Stack - Properties, Solar, Neighborhood Search, Labels */}
                    <div
                      className={`map-right-top-controls ${
                        !(selectedPlace ||
                          layers.filter(layer => layer.enabled).length > 1 ||
                          layers.some(layer => layer.id === 'intersection' && layer.enabled) ||
                          textQuerySearchResults.length > 0 ||
                          solarData ||
                          markersOnMap.length > 0) ? 'centered' : ''
                      }`}>
                      {/* Properties Icon Button with Inline Popover */}
                      <Popover open={propertiesPopoverOpen} onOpenChange={setPropertiesPopoverOpen}>
                        {markersOnMap.length === 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-10 w-10"
                                  style={{
                                    backgroundColor: '#407f7f',
                                    color: 'white',
                                    borderColor: '#407f7f'
                                  }}
                                >
                                  <Home className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Property Types</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <PopoverTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10"
                              style={{
                                backgroundColor: '#407f7f',
                                color: 'white',
                                borderColor: '#407f7f'
                              }}
                            >
                              <Home className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        )}
                        <PopoverContent side="left" align="start" className="w-[280px] max-h-[400px] overflow-hidden p-0 sidebar-properties-popup">
                          <PropertiesList
                            onMarkerSelect={handleMarkerSelect}
                            onMarkerDeselect={handleMarkerDeselect}
                            onClearAllMarkers={handleClearAllMarkers}
                            alwaysOpen={true}
                            onNeighborhoodExplorer={(textQuery, radius, lat, lng) => {
                              if (textQuerySearchFunctionRef.current) {
                                textQuerySearchFunctionRef.current(textQuery, undefined, radius, lat, lng);
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Solar Analysis Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={handleSolarClick}
                            disabled={solarLoading}
                            className="h-10 w-10"
                            style={{
                              backgroundColor: '#FFA500',
                              color: 'white',
                              borderColor: '#FFA500'
                            }}
                          >
                            {solarLoading ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Sun className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Solar Analysis</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Neighborhood Explorer - embedded directly in right sidebar */}
                      <NeighborhoodExplorerCard
                        map={map}
                        onNeighborhoodExplorerUpdate={handleNeighborhoodExplorerUpdate}
                        onSearchFunctionReady={handleSearchFunctionReady}
                        onPlacementModeChange={handlePlacementModeChange}
                        searchMarkerLocation={(() => {
                          // Use simple search marker location if available
                          if (selectedPlace && selectedPlace.location) {
                            const latVal = selectedPlace.location.lat;
                            const lngVal = selectedPlace.location.lng;
                            const lat = typeof latVal === 'function' ? latVal() : latVal;
                            const lng = typeof lngVal === 'function' ? lngVal() : lngVal;
                            return { lat, lng };
                          }
                          // Otherwise, use property marker location if exactly one marker is active
                          if (markersOnMap.length === 1 && markersOnMap[0].position) {
                            return {
                              lat: markersOnMap[0].position.lat,
                              lng: markersOnMap[0].position.lng
                            };
                          }
                          return null;
                        })() as { lat: number; lng: number } | null}
                        shouldPulsate={!!(selectedPlace || (markersOnMap.length === 1))}
                      />

                      {/* Label Toggle Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={toggleLabels}
                            className="h-10 w-10"
                            style={{
                              backgroundColor: '#73513e',
                              color: 'white',
                              borderColor: '#73513e'
                            }}
                          >
                            {showLabels ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>{showLabels ? 'Hide Labels' : 'Show Labels'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                  </TooltipProvider>
                )}

                {/* Bottom Center Utility Bar - Intersect, Save, Export, Search Here, Clear */}
                <TooltipProvider>
                    <div className="map-bottom-center-controls">
                      {/* Intersection Button */}
                      {layers.filter(layer => layer.enabled).length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={handleIntersection}
                              disabled={isIntersecting}
                              className={`${!isIntersecting ? 'utility-button-breathe' : ''}`}
                              style={{
                                backgroundColor: isIntersecting ? '#cccccc' : '#bfb05e',
                                color: 'white',
                                borderColor: isIntersecting ? '#cccccc' : '#bfb05e'
                              }}
                            >
                              <IntersectionIcon className="!w-5 !h-5" size={20} />
                              <span className="button-text">Intersect</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Intersect Layers</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Save Button */}
                      {(!!selectedPlace || layers.some(layer => layer.id === 'intersection' && layer.enabled) || textQuerySearchResults.length > 0) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <SaveButton
                                hasMarker={!!selectedPlace}
                                hasIntersection={layers.some(layer => layer.id === 'intersection' && layer.enabled)}
                                hasSearchResults={textQuerySearchResults.length > 0}
                                onSaveMarker={() => setSaveMarkerDialogOpen(true)}
                                onSaveIntersection={handleSaveIntersection}
                                onSaveSearchResults={() => {
                                  setSearchNameToSave('');
                                  setSaveSearchDialogOpen(true);
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent >
                            <p>Save</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Export Button */}
                      {(layers.some(layer => layer.id === 'intersection' && layer.enabled) || textQuerySearchResults.length > 0) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ExportButton
                                hasIntersection={layers.some(layer => layer.id === 'intersection' && layer.enabled)}
                                hasSearchResults={textQuerySearchResults.length > 0}
                                onExportIntersection={() => setExportDialogVisible(true)}
                                onExportSearchResults={() => {
                                  const defaultFilename = `search_results_${new Date().toISOString().slice(0, 10)}.csv`;
                                  setExportSearchFilename(defaultFilename);
                                  setExportSearchDialogOpen(true);
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent >
                            <p>Export</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Search Here Button - shown during Neighborhood Explorer search placement */}
                      {isTextQuerySearchPlacing && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => {
                                textQuerySearchConfirmRef.current?.();
                              }}
                              className="text-white"
                              style={{
                                backgroundColor: '#7fbd45',
                                borderColor: '#7fbd45'
                              }}
                            >
                              <Search className="h-5 w-5" />
                              <span className="button-text">Search</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Search Here</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Cancel Button - shown when solar or neighborhood explorer placement is active */}
                      {(isSolarPlacementMode || isTextQuerySearchPlacing) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <CancelButton
                                hasSolarPlacement={isSolarPlacementMode}
                                hasNeighborhoodExplorerPlacement={isTextQuerySearchPlacing}
                                onCancelSolar={handleCancelSolarPlacement}
                                onCancelNeighborhoodExplorer={() => {
                                  textQuerySearchCancelRef.current?.();
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Clear Button */}
                      {(markersOnMap.length > 0 || !!selectedPlace || layers.some(layer => layer.id === 'intersection' && layer.enabled) || textQuerySearchResults.length > 0 || !!solarData) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ClearButton
                                hasMarkers={markersOnMap.length > 0 || !!selectedPlace}
                                hasIntersection={layers.some(layer => layer.id === 'intersection' && layer.enabled)}
                                hasSearchResults={textQuerySearchResults.length > 0}
                                hasSolarData={!!solarData}
                                onClearMarkers={() => {
                                  handleClearAllMarkers();
                                  if (selectedPlace) clearSearchMarker();
                                }}
                                onClearIntersection={() => toggleLayer('intersection')}
                                onClearSearchResults={() => {
                                  textQuerySearchClearCallbackRef.current?.();
                                }}
                                onClearSolar={handleClearAllSolar}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Clear</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                </TooltipProvider>

                {/* Clear Favorite Button */}
                {hasFavoriteMarker && (
                  <div style={{ position: 'absolute', top: '60px', right: '10px', zIndex: 1000 }}>
                    <Button
                      variant="destructive"
                      onClick={clearFavoriteMarker}
                      className="h-10 text-xs"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Favorite
                    </Button>
                  </div>
                )}
              </>
            )}

          {/* Dialogs */}
      {/* Intersection Dialogs */}
      <SaveIntersectionDialog
        open={saveDialogVisible}
        onOpenChange={setSaveDialogVisible}
        onSave={handleSaveConfirm}
      />

      <ExportIntersectionDialog
        open={exportDialogVisible}
        onOpenChange={setExportDialogVisible}
        onExport={handleExportConfirm}
      />

      {/* Save Marker Dialog */}
      <SaveMarkerView
        open={saveMarkerDialogOpen}
        onOpenChange={setSaveMarkerDialogOpen}
        onConfirm={handleSaveMarker}
        onCancel={() => setSaveMarkerDialogOpen(false)}
        defaultName={selectedPlace?.displayName || selectedPlace?.formattedAddress || ''}
      />

      {/* Save Search Dialog */}
      <Dialog open={saveSearchDialogOpen} onOpenChange={setSaveSearchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Save this neighborhood search for easy access later. You found {NeighborhoodExplorerResults.length} results.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., Coffee shops in downtown"
                value={searchNameToSave}
                onChange={(e) => setSearchNameToSave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchNameToSave.trim()) {
                    textQuerySearchSaveCallbackRef.current?.(searchNameToSave);
                    setSaveSearchDialogOpen(false);
                    setSearchNameToSave('');
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSearchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (searchNameToSave.trim()) {
                  textQuerySearchSaveCallbackRef.current?.(searchNameToSave);
                  setSaveSearchDialogOpen(false);
                  setSearchNameToSave('');
                }
              }}
              disabled={!searchNameToSave.trim()}
              className="bg-green-700 hover:bg-green-800"
            >
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Search Dialog */}
      <Dialog open={exportSearchDialogOpen} onOpenChange={setExportSearchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export to CSV</DialogTitle>
            <DialogDescription>
              Export {NeighborhoodExplorerResults.length} search results to a CSV file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder="search_results.csv"
                value={exportSearchFilename}
                onChange={(e) => setExportSearchFilename(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && exportSearchFilename.trim()) {
                    textQuerySearchExportCallbackRef.current?.(exportSearchFilename);
                    setExportSearchDialogOpen(false);
                    setExportSearchFilename('');
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportSearchDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (exportSearchFilename.trim()) {
                  textQuerySearchExportCallbackRef.current?.(exportSearchFilename);
                  setExportSearchDialogOpen(false);
                  setExportSearchFilename('');
                }
              }}
              disabled={!exportSearchFilename.trim()}
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Chat Bot - Bottom Right of Map Canvas */}
      <FloatingChatContainer
        theme="original"
        onToggleLayer={toggleLayer}
        onPerformIntersection={handleIntersection}
        onSearchPlace={async (query: string) => {
          if (!map) {
            console.error('❌ Map not available for search');
            return;
          }

          try {
            // Use Places API (Text Search) instead of Geocoding API
            const service = new google.maps.places.PlacesService(map);

            const request: google.maps.places.TextSearchRequest = {
              query: query
            };

            service.textSearch(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                const place = results[0];
                const location = place.geometry?.location;

                if (location) {
                  const lat = location.lat();
                  const lng = location.lng();

                  console.log(`🔍 Found ${query} at: ${lat}, ${lng}`);

                  // Pan and zoom to the location
                  map.setCenter({ lat, lng });

                  // Set appropriate zoom based on location type
                  const types = place.types || [];
                  let zoomLevel = 10; // Default city-level zoom

                  if (types.includes('country')) zoomLevel = 5;
                  else if (types.includes('administrative_area_level_1')) zoomLevel = 7; // State
                  else if (types.includes('locality') || types.includes('political')) zoomLevel = 11; // City
                  else if (types.includes('neighborhood')) zoomLevel = 14;
                  else if (types.includes('street_address')) zoomLevel = 16;

                  map.setZoom(zoomLevel);
                  console.log(`✅ Navigated to ${query} (zoom: ${zoomLevel})`);
                }
              } else {
                console.warn(`⚠️ No results found for: ${query} (status: ${status})`);
              }
            });
          } catch (error) {
            console.error(`❌ Error searching for ${query}:`, error);
          }
        }}
        onZoomTo={(lat: number, lng: number, zoom: number) => {
          console.log(`🗺️ MapContainer: Received zoom request to lat=${lat}, lng=${lng}, zoom=${zoom}`);
          if (map) {
            console.log(`✅ Map instance exists, applying zoom...`);
            map.setCenter({ lat, lng });
            map.setZoom(zoom);
            console.log(`✅ Zoom applied successfully`);
          } else {
            console.error('❌ Map instance is null/undefined - cannot zoom');
          }
        }}
        getCurrentMapState={() => {
          // Use getLayersWithCurrentState to get the most up-to-date layer state from refs
          const currentLayers = getLayersWithCurrentState();
          return {
            layers: currentLayers.map(l => ({
              id: l.id,
              name: l.name,
              enabled: l.enabled,
              apiTableId: l.apiTableId
            })),
            currentZoom: map?.getZoom(),
            mapBounds: map ? (() => {
              const bounds = map.getBounds();
              if (!bounds) return undefined;
              return {
                minLat: bounds.getSouthWest().lat(),
                maxLat: bounds.getNorthEast().lat(),
                minLng: bounds.getSouthWest().lng(),
                maxLng: bounds.getNorthEast().lng()
              };
            })() : undefined
          };
        }}
      />

        </div>
      </div>

    </>
  );
};

export default MapContainer;
