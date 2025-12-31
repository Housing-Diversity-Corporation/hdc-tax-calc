import { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface UseMapInitializationProps {
  isLoaded: boolean;
  mapRef: React.RefObject<HTMLDivElement>;
}

export const useMapInitialization = ({ isLoaded, mapRef }: UseMapInitializationProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const initializationAttempted = useRef(false);

  const getMapTypeId = (isDark: boolean, labels: boolean): string => {
    if (!isDark) {
      return labels ? 'roadmap' : 'roadmap';
    }
    return labels ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.HYBRID;
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || initializationAttempted.current) {
        console.log('🗺️ Skipping initialization:', {
          hasMapRef: !!mapRef.current,
          attempted: initializationAttempted.current
        });
        return;
      }

      initializationAttempted.current = true;
      setIsInitializing(true);
      console.log('🗺️ Starting map initialization...');

      try {
        const mapNode = mapRef.current;
        console.log('🗺️ Map node dimensions:', {
          width: mapNode.offsetWidth,
          height: mapNode.offsetHeight,
          clientWidth: mapNode.clientWidth,
          clientHeight: mapNode.clientHeight
        });

        // Import maps library
        const mapsLibrary = await google.maps.importLibrary("maps");
        const Map = (mapsLibrary as google.maps.MapsLibrary).Map;

        console.log('🗺️ Creating map instance...');
        const newMap = new Map(mapNode, {
          center: { lat: 47.606370, lng: -122.320401 }, // Seattle
          zoom: 10,
          minZoom: 6,
          maxZoom: 20,
          mapId: "4504f8b37365c3d0", // Your map ID
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        console.log('✅ Map created successfully');
        setMap(newMap);
        setIsInitializing(false);

        // Wait for map to be idle, then trigger resize
        google.maps.event.addListenerOnce(newMap, 'idle', () => {
          console.log('🗺️ Map is idle');
          google.maps.event.trigger(newMap, 'resize');
        });

      } catch (err) {
        console.error('❌ Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
        setIsInitializing(false);
        initializationAttempted.current = false; // Allow retry
      }
    };

    if (isLoaded && mapRef.current && !map && !isInitializing) {
      console.log('🗺️ Conditions met, initializing map...');
      initializeMap();
    }
  }, [isLoaded, mapRef, map, isInitializing]);

  // Update map type when theme changes
  useEffect(() => {
    if (map) {
      const mapTypeId = getMapTypeId(isDarkMode, true);
      map.setMapTypeId(mapTypeId);
    }
  }, [map, isDarkMode]);

  return { map, isInitializing, error };
};
