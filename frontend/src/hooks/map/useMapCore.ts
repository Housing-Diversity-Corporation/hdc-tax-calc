/**
 * useMapCore - Core map initialization and management
 * Handles: Map creation, theme, labels, street view
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useGoogleMaps } from './useGoogleMaps';
import { MAP_STYLES, getMapStyle } from '../../utils/map/mapStyles';

interface UseMapCoreProps {
  apiKey?: string;
}

export const useMapCore = ({ apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY }: UseMapCoreProps = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [isStreetViewActive, setIsStreetViewActive] = useState(false);
  const { isDarkMode } = useTheme();
  const { isLoaded, loadError } = useGoogleMaps(apiKey);

  const getMapStyles = useCallback((isDark: boolean, labels: boolean) => {
    const theme = isDark ? 'dark' : 'light';
    const styleKey = getMapStyle(theme, labels);
    return MAP_STYLES[styleKey];
  }, []);

  const toggleLabels = useCallback(() => {
    setShowLabels(prev => !prev);
  }, []);

  // Initialize map (only runs once when isLoaded becomes true)
  useEffect(() => {
    // console.log('🗺️ [MAP EFFECT] Init effect triggered - isLoaded:', isLoaded, ', map exists:', !!map);

    const initializeMap = async () => {
      if (!mapRef.current || map) return;

      // console.log('🗺️ [MAP INIT] Creating new map instance...');
      setIsInitializing(true);

      try {
        const mapNode = mapRef.current;

        // Use traditional google.maps.Map constructor instead of importLibrary
        const newMap = new google.maps.Map(mapNode, {
          center: { lat: 47.606370, lng: -122.320401 },
          zoom: 10,
          minZoom: 6,
          maxZoom: 20,
          mapId: "4504f8b37365c3d0", // Required for Advanced Markers
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Create custom styled map types
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

        // Set initial map type based on theme
        const initialMapType = isDarkMode
          ? (showLabels ? 'dark_with_labels' : 'dark_no_labels')
          : (showLabels ? 'light_with_labels' : 'light_no_labels');
        newMap.setMapTypeId(initialMapType);

        // console.log('✅ [MAP INIT] Map instance created successfully');
        setMap(newMap);
        setIsInitializing(false);

        // Force resize after a short delay to ensure proper rendering
        setTimeout(() => {
          google.maps.event.trigger(newMap, 'resize');
          newMap.setCenter({ lat: 47.606370, lng: -122.320401 });
        }, 100);

        google.maps.event.addListenerOnce(newMap, 'idle', () => {
          google.maps.event.trigger(newMap, 'resize');
        });
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        setIsInitializing(false);
      }
    };

    if (isLoaded && mapRef.current && !map) {
      initializeMap();
    }
    // Only depend on isLoaded and map - theme/label changes handled by separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update map type when theme or labels change
  useEffect(() => {
    if (map) {
      const mapType = isDarkMode
        ? (showLabels ? 'dark_with_labels' : 'dark_no_labels')
        : (showLabels ? 'light_with_labels' : 'light_no_labels');
      map.setMapTypeId(mapType);
    }
  }, [map, isDarkMode, showLabels]);

  // Listen for Street View visibility changes
  useEffect(() => {
    if (!map) return;

    const streetView = map.getStreetView();
    const listener = streetView.addListener('visible_changed', () => {
      setIsStreetViewActive(streetView.getVisible());
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  return {
    mapRef,
    map,
    isLoaded,
    loadError,
    isInitializing,
    showLabels,
    toggleLabels,
    isStreetViewActive,
  };
};
