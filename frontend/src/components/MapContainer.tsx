import { Dialog } from 'primereact/dialog';

// MapContainer.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { useMapLayers } from '../hooks/useMapLayers';
import { useResponsive } from '../hooks/useResponsive';
import MapControls from './MapControls';
import SearchCard from './SearchCard';
import KeywordSearchCard from './KeywordSearchCard';
import LoadingSpinner from './LoadingSpinner';
import IntersectionControls from './IntersectionControls';
import InputDialog from './InputDialog';
import { CascadeSelectChangeEvent } from 'primereact/cascadeselect';
import { Toast } from 'primereact/toast';
import type { GeoJsonFeatureCollection } from '../types/geojson';
import { Button } from 'primereact/button';
import SaveMarkerView, { SelectedPropertyType } from './SaveMarkerView';
import { Marker } from '../types/marker';
import PropertiesList from './PropertiesList';
import { useLLMActions } from '../hooks/useLLMActions';
import ChatInterface from './ChatInterface';
import { getPropertyLinks, fetchParcelData, formatParcelDataHtml, isKingCountyAddress } from '../utils/parcelUtils';
import { getMarkerColor } from '../utils/markerColors';
import api from '../services/api';
import { MAP_STYLES } from '../utils/mapStyles';
import { useTheme } from '../contexts/ThemeContext';
import { useLayerHierarchy } from '../contexts/LayerHierarchyContext';
import RightPanel from './RightPanel';
import type { OverlappingFeature } from '../hooks/useMapLayers';
import SolarCardEnhanced from './SolarCardEnhanced';

interface ExtendedMarker extends Marker {
    isTemplate?: boolean;
}

interface SearchResult extends google.maps.places.PlaceResult {
  distance?: number;
}

interface MapContainerProps {
  apiKey?: string;
  onLoad: (callbacks: {
    addIntersectionLayer: (geoJsonData: GeoJsonFeatureCollection) => void;
    toggleLayer: (layerId: string) => void;
    navigateToLocation: (lat: number, lng: number, name: string) => void;
    runKeywordSearch?: (keyword: string, radius: number, centerLat: number, centerLng: number) => void;
  }) => void;
  onKeywordSearchUpdate?: (
    results: SearchResult[],
    visible: boolean,
    onResultClick: (result: SearchResult) => void,
    onClear: () => void,
    onExport: (results: SearchResult[]) => void,
    onSave: () => void,
    onSaveLocation: (result: SearchResult) => void,
    searchMetadata: { keyword: string; radius: number; centerLat: number; centerLng: number }
  ) => void;
  onSolarUpdate?: (
    visible: boolean,
    isLoading: boolean,
    solarData: any,
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
}



const MapContainer: React.FC<MapContainerProps> = ({ apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY, onLoad, onKeywordSearchUpdate, onSolarUpdate }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showDelayedSpinner, setShowDelayedSpinner] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [saveDialogVisible, setSaveDialogVisible] = useState(false);
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const { isDarkMode } = useTheme();
  const [showLabels, setShowLabels] = useState(false);

  // Get markerId from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const initialMarkerIdParam = urlParams.get('markerId');
  const initialMarkerId = initialMarkerIdParam ? parseInt(initialMarkerIdParam) : undefined;
  const toastRef = useRef<Toast>(null);
  const { isLoaded, loadError } = useGoogleMaps(apiKey);
  const { layerHierarchy, setLayerPriority } = useLayerHierarchy();
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [overlappingFeatures, setOverlappingFeatures] = useState<OverlappingFeature[]>([]);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  
  const searchMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const keywordSearchFunctionRef = useRef<((keyword: string, radius: number, centerLat: number, centerLng: number) => void) | null>(null);
  const favoriteLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [saveMarkerDialogVisible, setSaveMarkerDialogVisible] = useState(false);
  const [hasFavoriteMarker, setHasFavoriteMarker] = useState(false);

  const handleOverlappingFeaturesClick = useCallback((features: OverlappingFeature[]) => {
    setOverlappingFeatures(features);
    setRightPanelVisible(true);
  }, []);

  const {
    layers,
    toggleLayer,
    addIntersectionLayer,
    seattleZoningFilters,
    toggleSeattleZoneFilter,
    seattleZoningColors,
    seattleBaseZoneFilters,
    toggleSeattleBaseZoneFilter,
    layersRef,
    locations,
    selectedLocation,
    setSelectedLocation,
    getLayersWithCurrentState,
    updateLayerZIndex
  } = useMapLayers(map, handleOverlappingFeaturesClick);
  const { width } = useResponsive();

  const llmActions = useLLMActions({
    map,
    layers,
    layersRef: layersRef,
    seattleZoningFilters,
    toggleSeattleZoneFilter,
    seattleBaseZoneFilters,
    toggleSeattleBaseZoneFilter,
  });

  const initializeMap = async (mapNode: HTMLDivElement) => {
    setIsInitializing(true);

    try {
      const mapsLibrary = await google.maps.importLibrary("maps");
      const Map = (mapsLibrary as google.maps.MapsLibrary).Map;

      const newMap = new Map(mapNode, {
        center: { lat: 47.606370, lng: -122.320401 },
        zoom: 10,
        minZoom: 6,
        maxZoom: 20,
        mapId: "4504f8b37365c3d0",
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT
        }
      });

      // Create styled map types for each theme/label combination
      const lightNoLabelsType = new google.maps.StyledMapType(
        MAP_STYLES.lightNoLabels,
        { name: 'Light (No Labels)' }
      );
      const lightWithLabelsType = new google.maps.StyledMapType(
        MAP_STYLES.lightWithLabels,
        { name: 'Light (With Labels)' }
      );
      const darkNoLabelsType = new google.maps.StyledMapType(
        MAP_STYLES.darkNoLabels,
        { name: 'Dark (No Labels)' }
      );
      const darkWithLabelsType = new google.maps.StyledMapType(
        MAP_STYLES.darkWithLabels,
        { name: 'Dark (With Labels)' }
      );

      // Register the styled map types
      newMap.mapTypes.set('light_no_labels', lightNoLabelsType);
      newMap.mapTypes.set('light_with_labels', lightWithLabelsType);
      newMap.mapTypes.set('dark_no_labels', darkNoLabelsType);
      newMap.mapTypes.set('dark_with_labels', darkWithLabelsType);

      // Set the initial map type
      newMap.setMapTypeId('light_no_labels');

      setMap(newMap);
      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setIsInitializing(false);
    }
  };

  const getMapTypeId = useCallback((isDark: boolean, labels: boolean): string => {
    if (!isDark) {
      return labels ? 'light_with_labels' : 'light_no_labels';
    }
    return labels ? 'dark_with_labels' : 'dark_no_labels';
  }, []);

  const toggleLabels = useCallback(() => {
    const newShowLabels = !showLabels;
    setShowLabels(newShowLabels);
    if (map) {
      map.setMapTypeId(getMapTypeId(isDarkMode, newShowLabels));
    }
  }, [map, isDarkMode, showLabels, getMapTypeId]);

  // Update map when global theme changes
  useEffect(() => {
    if (map) {
      map.setMapTypeId(getMapTypeId(isDarkMode, showLabels));
    }
  }, [map, isDarkMode, showLabels, getMapTypeId]);

  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      initializeMap(mapRef.current);
    }
  }, [isLoaded, map]);

  // Listen for Street View visibility changes
  useEffect(() => {
    if (!map) return;

    const streetView = map.getStreetView();

    const visibilityListener = streetView.addListener('visible_changed', () => {
      const isVisible = streetView.getVisible();
      setIsStreetViewActive(isVisible);
    });

    return () => {
      google.maps.event.removeListener(visibilityListener);
    };
  }, [map]);

  // Handle markerId URL parameter to automatically show a specific marker
  useEffect(() => {
    if (!map) return;

    const urlParams = new URLSearchParams(window.location.search);
    const markerIdParam = urlParams.get('markerId');

    if (markerIdParam) {
      const markerId = parseInt(markerIdParam);

      // Fetch the specific marker from the API
      api.get(`/markers/${markerId}`)
        .then(response => {
          const marker = response.data;

          // Center map on the marker
          map.setCenter({ lat: marker.lat, lng: marker.lng });
          map.setZoom(17);

          // Load the marker on the map
          handleMarkerSelect([{ ...marker, isTemplate: marker.userId === 8 }]);
        })
        .catch(error => {
          console.error('Error loading marker from URL:', error);
        });
    }
  }, [map]);

  // Listen for map type changes and restore custom styling when switching back to roadmap
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('maptypeid_changed', () => {
      const currentMapType = map.getMapTypeId();

      // If user switched to satellite, terrain, or hybrid, let it be
      if (currentMapType === 'satellite' || currentMapType === 'terrain' || currentMapType === 'hybrid') {
        return;
      }

      // If user switched back to roadmap (the default), apply our custom style
      if (currentMapType === 'roadmap') {
        map.setMapTypeId(getMapTypeId(isDarkMode, showLabels));
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, isDarkMode, showLabels, getMapTypeId]);

  const clearFavoriteMarker = useCallback(() => {
    if (favoriteLocationMarkerRef.current) {
      favoriteLocationMarkerRef.current.map = null;
      favoriteLocationMarkerRef.current = null;
      setHasFavoriteMarker(false);
    }
  }, []);

  const navigateToFavoriteLocation = useCallback(async (lat: number, lng: number, name: string) => {
    if (!map) return;

    // Clear any existing favorite location marker
    if (favoriteLocationMarkerRef.current) {
      favoriteLocationMarkerRef.current.map = null;
      favoriteLocationMarkerRef.current = null;
      setHasFavoriteMarker(false);
    }

    // Pan and zoom to location
    map.panTo({ lat, lng });
    map.setZoom(17);

    // Create a marker at the location using the same style as keyword search
    try {
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const { PlacesService } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

      // Create a pin marker (default red color for favorite locations)
      const pinElement = new PinElement({
        background: '#EA4335',
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
      });

      const marker = new AdvancedMarkerElement({
        map: map,
        position: { lat, lng },
        content: pinElement.element,
        title: name,
      });

      // Store the marker in ref for later cleanup
      favoriteLocationMarkerRef.current = marker;
      setHasFavoriteMarker(true);

      // Create Places Service to fetch place details
      const placesService = new PlacesService(map);

      // Try to find the place by location to get full details
      const request = {
        location: { lat, lng },
        radius: 50, // Search within 50 meters
        keyword: name,
      };

      placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Get the first result (closest match)
          const place = results[0];

          if (place.place_id) {
            // Fetch full details
            placesService.getDetails(
              {
                placeId: place.place_id,
                fields: [
                  'name',
                  'formatted_address',
                  'rating',
                  'user_ratings_total',
                  'website',
                  'formatted_phone_number',
                  'opening_hours',
                  'price_level',
                  'business_status',
                ],
              },
              (placeDetails, detailsStatus) => {
                if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                  showFavoriteLocationDetails(marker, placeDetails);
                } else {
                  // Fallback to simple info window
                  showSimpleInfoWindow(marker, name);
                }
              }
            );
          } else {
            showSimpleInfoWindow(marker, name);
          }
        } else {
          // Fallback to simple info window if no place found
          showSimpleInfoWindow(marker, name);
        }
      });

      // Show toast notification
      toastRef.current?.show({
        severity: 'success',
        summary: 'Favorite Location',
        detail: `Navigated to ${name}`,
        life: 3000
      });
    } catch (error) {
      console.error('Error creating marker:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create location marker',
        life: 3000
      });
    }
  }, [map]);

  const showFavoriteLocationDetails = (marker: google.maps.marker.AdvancedMarkerElement, placeDetails: google.maps.places.PlaceResult) => {
    if (!map) return;

    // Use isOpen() method for opening hours
    let openNowText = '';
    if (placeDetails.opening_hours && typeof placeDetails.opening_hours.isOpen === 'function') {
      try {
        const isOpen = placeDetails.opening_hours.isOpen();
        openNowText = isOpen ? 'Open Now' : 'Closed';
      } catch (e) {
        openNowText = '';
        console.log(e);
      }
    }

    const content = `
      <div class="info-window">
        <h5 style="margin: 0 0 8px 0; color: black;">${placeDetails.name || 'Unknown Place'}</h5>
        <p style="color: black;">${placeDetails.formatted_address || ''}</p>
        ${placeDetails.rating ? `<p style="color: black;">Rating: ${placeDetails.rating}/5 (${placeDetails.user_ratings_total} reviews)</p>` : ''}
        ${placeDetails.formatted_phone_number ? `<p style="color: black;">Phone: ${placeDetails.formatted_phone_number}</p>` : ''}
        ${placeDetails.website ? `<p style="color: black;"><a href="${placeDetails.website}" target="_blank">Website</a></p>` : ''}
        ${openNowText ? `<p style="color: black;">${openNowText}</p>` : ''}
        ${placeDetails.price_level ? `<p style="color: black;">Price level: ${Array(placeDetails.price_level + 1).join('$')}</p>` : ''}
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: content,
    });

    marker.addListener('gmp-click', () => {
      infoWindow.open(map, marker);
    });

    // Auto-open info window
    infoWindow.open(map, marker);
  };

  const showSimpleInfoWindow = (marker: google.maps.marker.AdvancedMarkerElement, name: string) => {
    if (!map) return;

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 8px; color: black;"><strong>${name}</strong></div>`,
    });

    marker.addListener('gmp-click', () => {
      infoWindow.open(map, marker);
    });

    // Auto-open info window
    infoWindow.open(map, marker);
  };

  useEffect(() => {
    if (onLoad) {
      onLoad({
        addIntersectionLayer,
        toggleLayer,
        navigateToLocation: navigateToFavoriteLocation,
        runKeywordSearch: keywordSearchFunctionRef.current ? keywordSearchFunctionRef.current : undefined
      });
    }
  }, [onLoad, addIntersectionLayer, toggleLayer, navigateToFavoriteLocation, keywordSearchFunctionRef.current]);

  useEffect(() => {
    const isAnyLayerLoading = layers.some(layer => layer.loading);
    
    if (isAnyLayerLoading || isIntersecting) {
      const timer = setTimeout(() => {
        setShowDelayedSpinner(true);
      }, 2500);
      
      return () => clearTimeout(timer);
    } else {
      setShowDelayedSpinner(false);
    }
  }, [layers, isIntersecting]);

  const handleLocationChange = (e: CascadeSelectChangeEvent) => {
    if (e.value !== undefined) {
      setSelectedLocation(e.value);
    }
  };

  const handlePlaceSelected = async (place: google.maps.places.Place) => {
    console.log('handlePlaceSelected called with place:', place);
    
    if (!map) {
      console.error('Map is not initialized');
      return;
    }
    
    if (!place.location) {
      console.error('Place has no location:', place);
      return;
    }

    setSelectedPlace(place);

    // Clear existing search marker
    if (searchMarkerRef.current) {
      console.log('Clearing existing search marker');
      searchMarkerRef.current.map = null;
    }

    // Clear existing info window
    if (searchInfoWindowRef.current) {
      searchInfoWindowRef.current.close();
    }

    try {
      // Import the marker library
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      console.log('Creating new marker at:', place.location.lat(), place.location.lng());
      
      // Create a new marker for the search result
      const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: place.displayName || 'Search Result',
      });

      searchMarkerRef.current = marker;
      console.log('Marker created successfully');

      // Create initial content without parcel data
      const initialContent = `
        <div style="color: black; min-width: 250px;">
          <h3 style="color: black; margin: 0 0 8px 0;">${place.displayName || 'Unknown Place'}</h3>
          <p style="color: black; margin: 0;">${place.formattedAddress || 'No address available'}</p>
          <div id="parcel-data-container" style="min-height: 20px;">
            ${place.formattedAddress && isKingCountyAddress(place.formattedAddress) ? '<div style="color: #666; font-size: 12px; margin-top: 8px;">Loading parcel data...</div>' : ''}
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: initialContent,
      });

      searchInfoWindowRef.current = infoWindow;

      // Add click listener to show info window
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Open the info window immediately
      infoWindow.open(map, marker);

      // Fetch parcel data if it's a King County address
      let parcelDataHtml = '';
      let propertyLinks = '';
      if (place.formattedAddress && isKingCountyAddress(place.formattedAddress)) {
        const parcelData = await fetchParcelData(
          place.formattedAddress,
          place.location.lat(),
          place.location.lng()
        );

        // Generate property links with PIN from parcel data
        propertyLinks = parcelData ? getPropertyLinks(place.formattedAddress, parcelData.pin) : '';
        parcelDataHtml = parcelData ? formatParcelDataHtml(parcelData) : '';
      }

      // Update info window with all data
      const updatedContent = `
        <div style="color: black; min-width: 250px;">
          <h3 style="color: black; margin: 0 0 8px 0;">${place.displayName || 'Unknown Place'}</h3>
          <p style="color: black; margin: 0;">${place.formattedAddress || 'No address available'}</p>
          ${parcelDataHtml}
          ${propertyLinks}
        </div>
      `;

      infoWindow.setContent(updatedContent);

    } catch (error) {
      console.error('Error creating search marker:', error);
      toastRef.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to create marker for the selected place' 
      });
    }
  };

  const handleIntersection = async () => {
    const currentLayers = getLayersWithCurrentState();
    const enabledLayers = currentLayers.filter(layer => layer.enabled);
    console.log('🔍 Intersection Debug - Enabled Layers:', enabledLayers.map(l => ({
      id: l.id,
      name: l.name,
      enabled: l.enabled,
      apiTableId: l.apiTableId
    })));

    if (enabledLayers.length < 2) {
      console.log('❌ Not enough layers enabled:', enabledLayers.length);
      toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please enable at least 2 layers to perform intersection' });
      return;
    }

    setIsIntersecting(true);

    try {
      const tableIds = enabledLayers
        .map(layer => layer.apiTableId)
        .filter(id => id);

      console.log('🔍 Table IDs for intersection:', tableIds);

      if (tableIds.length < 2) {
        console.log('❌ Not enough table IDs:', tableIds.length);
        console.log('Enabled layers without apiTableId:', enabledLayers.filter(l => !l.apiTableId));
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: `Selected layers must have backend data sources. Found ${tableIds.length} valid table IDs: ${tableIds.join(', ')}`
        });
        setIsIntersecting(false);
        return;
      }

      let bbox = null;
      if (map) {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          bbox = {
            minLng: sw.lng(),
            minLat: sw.lat(),
            maxLng: ne.lng(),
            maxLat: ne.lat()
          };
        }
      }

      const filters: { [key: string]: { [key: string]: string[] } } = {};
      if (tableIds.includes('seattle_zoning_code')) {
        filters['seattle_zoning_code'] = {
          'category_desc': Array.from(seattleZoningFilters),
          'base_zone': Array.from(seattleBaseZoneFilters)
        };
      }

      const payload = { tableIds, bbox, filters };
      console.log('🚀 Sending intersection request with payload:', payload);

      const response = await import('../services/api').then(module =>
        module.default.post('/geodata/intersection', payload, {
          timeout: 300000 // 5 minutes
        })
      );

      console.log('✅ Intersection response received:', response.data);

      const { featureCollection, featureCounts } = response.data;

      let countDetails = '';
      for (const [layer, count] of Object.entries(featureCounts)) {
        countDetails += `${layer}: ${count} features
`;
      }
      toastRef.current?.show({ severity: 'info', summary: 'Intersection Details', detail: countDetails, life: 6000 });

      if (featureCollection.features && featureCollection.features.length > 0) {
        enabledLayers.forEach(layer => {
          toggleLayer(layer.id);
        });
        addIntersectionLayer(featureCollection);
      } else {
        toastRef.current?.show({ severity: 'info', summary: 'Info', detail: 'No intersections found' });
      }
    } catch (error) {
      console.error('Error performing intersection:', error);
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to perform intersection' });
    } finally {
      setIsIntersecting(false);
    }
  };

  const handleSaveIntersection = () => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');
    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No intersection data to save.' });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      toastRef.current?.show({ severity: 'warn', summary: 'Sign In Required', detail: 'Please sign in to save intersections' });
      return;
    }

    setSaveDialogVisible(true);
  };

  const handleSaveConfirm = async (name: string) => {
    setSaveDialogVisible(false);
    
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');
    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      return;
    }

    try {
      const api = await import('../services/api').then(module => module.default);
      await api.post('/intersections/save', {
        name,
        intersectionResult: JSON.stringify(intersectionLayer.intersectionData),
      });
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Intersection saved successfully!' });
    } catch (error) {
      console.error('Error saving intersection:', error);
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save intersection.' });
    }
  };

  const handleExportCsv = () => {
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');
    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No intersection data to export.' });
      return;
    }

    setExportDialogVisible(true);
  };

  const handleExportConfirm = (filename: string) => {
    setExportDialogVisible(false);
    
    const intersectionLayer = layers.find(layer => layer.id === 'intersection');
    if (!intersectionLayer || !intersectionLayer.intersectionData) {
      return;
    }

    import('../utils/csv').then(({ exportToCsv }) => {
      exportToCsv(intersectionLayer.intersectionData as GeoJsonFeatureCollection, filename);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `CSV exported as ${filename}` });
    });
  };

  const handleSaveMarker = () => {
    if (!selectedPlace) {
      toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No place selected to save.' });
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      toastRef.current?.show({ severity: 'warn', summary: 'Sign In Required', detail: 'Please sign in to save markers' });
      return;
    }

    setSaveMarkerDialogVisible(true);
  };

  const handleSaveMarkerConfirm = async (name: string, propertyType: SelectedPropertyType) => {
    setSaveMarkerDialogVisible(false);

    if (!selectedPlace || !selectedPlace.location) {
      return;
    }

    try {
      const api = await import('../services/api').then(module => module.default);
      await api.post('/markers/save', {
        name,
        address: selectedPlace.formattedAddress,
        lat: selectedPlace.location.lat(),
        lng: selectedPlace.location.lng(),
        propertyType: propertyType.parent ? propertyType.parent.code : propertyType.code,
        propertyCategory: propertyType.code,
      });
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Marker saved successfully!' });
      if (searchMarkerRef.current) {
        searchMarkerRef.current.map = null;
      }
      setSelectedPlace(null);
    } catch (error) {
      console.error('Error saving marker:', error);
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save marker.' });
    }
  };

  const handleCancelSaveMarker = () => {
    setSaveMarkerDialogVisible(false);
    if (searchMarkerRef.current) {
      searchMarkerRef.current.map = null;
    }
    setSelectedPlace(null);
  };

  const handleClearSearchMarker = () => {
    if (searchMarkerRef.current) {
      searchMarkerRef.current.map = null;
      searchMarkerRef.current = null;
    }
    if (searchInfoWindowRef.current) {
      searchInfoWindowRef.current.close();
      searchInfoWindowRef.current = null;
    }
    setSelectedPlace(null);
  };

  const [markersOnMap, setMarkersOnMap] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  const handleMarkerSelect = async (markers: ExtendedMarker[]) => {
    if (!map) return;

    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    markers.forEach(marker => {
        // Check if this marker is already on the map (avoid duplicates)
        const existingMarker = markersOnMap.find(existingMarker => existingMarker.title === marker.name);
        if (existingMarker) {
            return; // Skip this marker as it's already displayed
        }

        const pinElement = new PinElement({
            background: getMarkerColor(marker.propertyCategory),
            borderColor: '#666',
            glyph: marker.isTemplate ? 'BP' : '',
        });

        const newMarker = new AdvancedMarkerElement({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            title: marker.name,
            content: pinElement.element,
        });

        // Create initial info window content with delete button
        const initialContent = `
          <div style="color: black; min-width: 300px; max-width: 400px;">
            <h3 style="color: black; margin: 0 0 8px 0;">${marker.name}</h3>
            <p style="color: black; margin: 0;">${marker.address}</p>
            ${marker.propertyType && marker.propertyCategory ? `
              <div style="margin-top: 8px;">
                <span style="color: #666; font-size: 12px;">Type: ${marker.propertyType} - ${marker.propertyCategory}</span>
              </div>
            ` : ''}
            <div id="parcel-data-${marker.id}" style="min-height: 20px;">
              ${isKingCountyAddress(marker.address) ? '<div style="color: #666; font-size: 12px; margin-top: 8px;">Loading parcel data...</div>' : ''}
            </div>
            ${!marker.isTemplate ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
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
        });

        newMarker.addListener('click', async () => {
            infoWindow.open(map, newMarker);

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
                                    toastRef.current?.show({
                                        severity: 'success',
                                        summary: 'Success',
                                        detail: 'Marker deleted successfully!'
                                    });
                                    // Trigger refresh of properties list
                                    window.dispatchEvent(new Event('marker-deleted'));
                                } catch (error) {
                                    console.error('Error deleting marker:', error);
                                    toastRef.current?.show({
                                        severity: 'error',
                                        summary: 'Error',
                                        detail: 'Failed to delete marker'
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
                  <div style="color: black; min-width: 300px; max-width: 400px;">
                    <h3 style="color: black; margin: 0 0 8px 0;">${marker.name}</h3>
                    <p style="color: black; margin: 0;">${marker.address}</p>
                    ${marker.propertyType && marker.propertyCategory ? `
                      <div style="margin-top: 8px;">
                        <span style="color: #666; font-size: 12px;">Type: ${marker.propertyType} - ${marker.propertyCategory}</span>
                      </div>
                    ` : ''}
                    ${parcelData ? formatParcelDataHtml(parcelData) : ''}
                    ${propertyLinks}
                    ${!marker.isTemplate ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
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
                                        toastRef.current?.show({
                                            severity: 'success',
                                            summary: 'Success',
                                            detail: 'Marker deleted successfully!'
                                        });
                                        // Trigger refresh of properties list
                                        window.dispatchEvent(new Event('marker-deleted'));
                                    } catch (error) {
                                        console.error('Error deleting marker:', error);
                                        toastRef.current?.show({
                                            severity: 'error',
                                            summary: 'Error',
                                            detail: 'Failed to delete marker'
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
  };

  const handleMarkerDeselect = (markers: ExtendedMarker[]) => {
    if (!map) return;

    const markersToRemove = markersOnMap.filter(markerOnMap => markers.some(marker => marker.name === markerOnMap.title));

    markersToRemove.forEach(marker => {
      marker.map = null;
    });

    const remainingMarkers = markersOnMap.filter(markerOnMap => !markers.some(marker => marker.name === markerOnMap.title));
    setMarkersOnMap(remainingMarkers);
  };

  const clearAllMarkersFromMap = () => {
    markersOnMap.forEach(marker => marker.map = null);
    setMarkersOnMap([]);
  };

  const handleSetPriority = useCallback((layerId: string, priority: number) => {
    setLayerPriority(layerId, priority);
    updateLayerZIndex(layerId, priority);

    // Update the overlapping features with new priorities
    setOverlappingFeatures(prev =>
      prev.map(feature =>
        
        feature.layerId === layerId
          ? { ...feature, priority }
          : feature
      ) as OverlappingFeature[]
    );
  }, [setLayerPriority, updateLayerZIndex]);

  const highlightedFeatureRef = useRef<{
    layerId: string;
    feature: google.maps.Data.Feature;
    properties: { [key: string]: string | number | boolean | null };
  } | null>(null);

  const applyHighlight = useCallback(() => {
    if (!highlightedFeatureRef.current || !map) return;

    const { layerId, properties } = highlightedFeatureRef.current;
    const layer = layersRef.get(layerId);

    if (!layer) return;

    // Find the feature with matching properties
    let foundFeature: google.maps.Data.Feature | null = null;
    layer.forEach(feature => {
      let matches = true;
      for (const key in properties) {
        if (feature.getProperty(key) !== properties[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        foundFeature = feature;
        return; // break forEach
      }
    });

    // Apply highlight to the found feature
    if (foundFeature) {
      layer.overrideStyle(foundFeature, {
        strokeWeight: 4,
        strokeOpacity: 1,
        strokeColor: '#FF0000',
        fillColor: '#54bfbf',
        fillOpacity: 0.9,
        zIndex: 9999
      });
      // Update the feature reference
      highlightedFeatureRef.current.feature = foundFeature;
    }
  }, [layersRef, map]);

  const handleHighlightFeature = useCallback((layerId: string, targetFeature?: google.maps.Data.Feature) => {
    if (!map) return;

    // Reset previously highlighted feature to normal styling
    if (highlightedFeatureRef.current) {
      const prevLayer = layersRef.get(highlightedFeatureRef.current.layerId);
      if (prevLayer) {
        prevLayer.revertStyle(highlightedFeatureRef.current.feature);
      }
      highlightedFeatureRef.current = null;
    }

    // Highlight the specific feature if provided
    if (targetFeature) {
      const layer = layersRef.get(layerId);

      if (layer) {
        layer.overrideStyle(targetFeature, {
          strokeWeight: 4,
          strokeOpacity: 1,
          strokeColor: '#FF0000',
          fillColor: '#54bfbf',
          fillOpacity: 0.9,
          zIndex: 9999
        });

        // Store reference to highlighted feature with its properties for re-identification
        const properties: { [key: string]: string | number | boolean | null } = {};
        targetFeature.forEachProperty((value, key) => {
          properties[key] = value as string | number | boolean | null;
        });

        highlightedFeatureRef.current = { layerId, feature: targetFeature, properties };
      }
    }
  }, [layers, layersRef, map]);

  // Re-apply highlight when layers update (e.g., after zoom)
  useEffect(() => {
    if (highlightedFeatureRef.current) {
      // Add a small delay to ensure layer data is loaded
      const timeoutId = setTimeout(() => {
        applyHighlight();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [layers, applyHighlight]);

  if (loadError) {
    return <div className="error">Error loading maps: {loadError}</div>;
  }

  if (!isLoaded || isInitializing) {
    return <LoadingSpinner />;
  }

  const isCompact = width < 1200;
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isCompact ? 'column' : 'row',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#407f7f',
    color: '#ffffff',
    gap: 0,
  };

  const mapStyle: React.CSSProperties = {
    width: isCompact ? '100%' : '80%',
    height: isCompact ? '70vh' : '100%',
    overflow: 'hidden',
    border: 'thin solid white',
  };

  const controlsStyle: React.CSSProperties = {
    width: isCompact ? '100%' : '20%',
    height: isCompact ? '30vh' : '100vh',
    fontSize: isCompact ? '20px' : '16px',
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: isCompact ? 'rgba(64, 127, 127, 0.95)' : 'transparent',
    zIndex: isCompact ? 1000 : 'auto',
  };

  return (
    <div style={containerStyle}>
      <div style={controlsStyle}>
        <MapControls 
          layers={layers} 
          toggleLayer={toggleLayer} 
          seattleZoningFilters={seattleZoningFilters}
          toggleSeattleZoneFilter={toggleSeattleZoneFilter}
          seattleZoningColors={seattleZoningColors}
          seattleBaseZoneFilters={seattleBaseZoneFilters}
          toggleSeattleBaseZoneFilter={toggleSeattleBaseZoneFilter}
          layersRef={layersRef}
          locations={locations}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          onMarkerSelect={handleMarkerSelect}
          onMarkerDeselect={handleMarkerDeselect}
          onClearAllMarkers={clearAllMarkersFromMap}
        />
      </div>
      <div style={{ position: 'relative', ...mapStyle }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
        {map && (
          <>
            {!isStreetViewActive && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  zIndex: 1000,
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <SearchCard map={map} onPlaceSelected={handlePlaceSelected} />
                  <KeywordSearchCard
                    map={map}
                    onKeywordSearchUpdate={onKeywordSearchUpdate}
                    onSearchFunctionReady={(searchFn) => {
                      keywordSearchFunctionRef.current = searchFn;
                    }}
                  />
                  <PropertiesList
                    onMarkerSelect={handleMarkerSelect}
                    onMarkerDeselect={handleMarkerDeselect}
                    onClearAllMarkers={clearAllMarkersFromMap}
                    initialSelectedMarkerId={initialMarkerId}
                  />
                  <SolarCardEnhanced map={map} apiKey={apiKey} onSolarUpdate={onSolarUpdate} />
                </div>
              </>
            )}
            <div style={{ position: 'absolute', top: '120px', right: '10px', zIndex: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Button
                icon={showLabels ? 'pi pi-eye-slash' : 'pi pi-eye'}
                onClick={toggleLabels}
                tooltip={showLabels ? 'Hide Labels' : 'Show Labels'}
                tooltipOptions={{ position: 'left' }}
                style={{
                  backgroundColor: isDarkMode ? '#333333' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#333333',
                  border: `1px solid ${isDarkMode ? '#555555' : '#cccccc'}`,
                  height: '40px',
                  width: '40px'
                }}
              />
            </div>
          </>
        )}
        {selectedPlace && (
          <div style={{ position: 'absolute', top: '10px', right: '200px', zIndex: 1000, display: 'flex', gap: '8px' }}>
            <Button
              label="Save Marker"
              icon="pi pi-save"
              onClick={handleSaveMarker}
              style={{ backgroundColor: '#73513e', color: 'white', height: '40px', fontSize: '12px' }}
            />
            <Button
              label="Clear Marker"
              icon="pi pi-times"
              onClick={handleClearSearchMarker}
              className="p-button-danger"
              style={{ height: '40px', fontSize: '12px' }}
            />
          </div>
        )}
        {hasFavoriteMarker && (
          <div style={{ position: 'absolute', top: '60px', right: '10px', zIndex: 1000 }}>
            <Button
              label="Clear Favorite Marker"
              icon="pi pi-times"
              onClick={clearFavoriteMarker}
              className="p-button-danger"
              style={{ height: '40px', fontSize: '12px' }}
            />
          </div>
        )}
        <IntersectionControls
          layers={layers}
          onIntersection={() => handleIntersection()}
          onSaveIntersection={() => handleSaveIntersection()}
          onExportCsv={() => handleExportCsv()}
          isIntersecting={isIntersecting}
        />
      </div>
      {showDelayedSpinner && <LoadingSpinner />}
      
      <Toast ref={toastRef} position="top-right" />
      
      <InputDialog
        visible={saveDialogVisible}
        title="Save Intersection"
        placeholder="Enter a name for this intersection"
        onConfirm={handleSaveConfirm}
        onCancel={() => setSaveDialogVisible(false)}
      />
      
      <InputDialog
        visible={exportDialogVisible}
        title="Export to CSV"
        placeholder="Enter filename (e.g., intersection_data.csv)"
        defaultValue="intersection_data.csv"
        onConfirm={handleExportConfirm}
        onCancel={() => setExportDialogVisible(false)}
      />

      <Dialog header="Save Marker" visible={saveMarkerDialogVisible} style={{ width: '600px' }} onHide={handleCancelSaveMarker} modal draggable={false} resizable={false}>
        <SaveMarkerView 
          onConfirm={handleSaveMarkerConfirm} 
          onCancel={handleCancelSaveMarker} 
          defaultName={selectedPlace?.displayName || ''} 
        />
      </Dialog>

      <RightPanel
        visible={rightPanelVisible}
        onClose={() => setRightPanelVisible(false)}
        features={overlappingFeatures.map(f => ({
          ...f,
          priority: layerHierarchy.get(f.layerId) || 0
        }))}
        onSetPriority={handleSetPriority}
        layerHierarchy={layerHierarchy}
        onHighlightFeature={handleHighlightFeature}
      />

      <ChatInterface
        onToggleLayer={(layerId) => toggleLayer(layerId)}
        onSearchPlace={llmActions.searchPlace}
        onPerformIntersection={handleIntersection}
        onZoomTo={llmActions.zoomToLocation}
        onApplyFilter={llmActions.applyFilter}
        onCreateMarker={llmActions.createMarker}
        getCurrentMapState={() => {
          const currentLayers = getLayersWithCurrentState();
          const enabledCount = currentLayers.filter(layer => layer.enabled).length;
          console.log(`🔍 MapContainer Debug: getCurrentMapState() called - ${enabledCount} enabled out of ${currentLayers.length}`);
          currentLayers.forEach((layer, i) => {
            if (layer.enabled) {
              console.log(`🔍 MapContainer Debug: Enabled layer ${i}: ${layer.name} (${layer.id}) - enabled: ${layer.enabled}`);
            }
          });

          return {
            layers: currentLayers.map(layer => ({
              id: layer.id,
              name: layer.name,
              enabled: layer.enabled,
              apiTableId: layer.apiTableId
            })),
            currentZoom: map?.getZoom(),
            mapBounds: map?.getBounds() ? (() => {
              const bounds = map.getBounds()!;
              const ne = bounds.getNorthEast();
              const sw = bounds.getSouthWest();
              return {
                minLat: sw.lat(),
                maxLat: ne.lat(),
                minLng: sw.lng(),
                maxLng: ne.lng()
              };
            })() : undefined
          };
        }}
      />
    </div>
  );
};

export default MapContainer;