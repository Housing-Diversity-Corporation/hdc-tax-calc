// useLLMActions.tsx
import { useCallback, useRef } from 'react';
import { Toast } from 'primereact/toast';

interface LayerConfig {
  id: string;
  enabled: boolean;
  styleFunction?: (feature: google.maps.Data.Feature) => google.maps.Data.StyleOptions;
}

interface UseLLMActionsProps {
  map: google.maps.Map | null;
  layers: LayerConfig[];
  layersRef: Map<string, google.maps.Data>;
  seattleZoningFilters: Set<string>;
  toggleSeattleZoneFilter: (zone: string) => void;
  seattleBaseZoneFilters: Set<string>;
  toggleSeattleBaseZoneFilter: (zone: string) => void;
}

export const useLLMActions = ({
  map,
  layers,
  layersRef,
  seattleZoningFilters,
  toggleSeattleZoneFilter,
  seattleBaseZoneFilters,
  toggleSeattleBaseZoneFilter
}: UseLLMActionsProps) => {
  const toastRef = useRef<Toast>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Initialize Places service
  const initPlacesService = useCallback(() => {
    if (map && !placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [map]);

  // Search for a place using Google Places
  const searchPlace = useCallback(async (query: string) => {
    if (!map || !placesServiceRef.current) {
      initPlacesService();
      if (!placesServiceRef.current) return;
    }

    return new Promise<google.maps.places.PlaceResult | null>((resolve) => {
      const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address', 'place_id']
      };

      placesServiceRef.current!.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          
          // Pan to location
          if (place.geometry?.location && map) {
            map.panTo(place.geometry.location);
            
            // Add a temporary marker with animation
            addAnimatedMarker(place);
            
            // Show info
            toastRef.current?.show({
              severity: 'success',
              summary: 'Location Found',
              detail: `Found: ${place.name}`,
              life: 3000
            });
          }
          
          resolve(place);
        } else {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Not Found',
            detail: `Could not find: ${query}`,
            life: 3000
          });
          resolve(null);
        }
      });
    });
  }, [map]);

  // Add animated marker for visual feedback
  const addAnimatedMarker = useCallback(async (place: google.maps.places.PlaceResult) => {
    if (!map || !place.geometry?.location) return;

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    
    // Create a custom marker element with animation
    const markerElement = document.createElement('div');
    markerElement.innerHTML = `
      <div style="
        width: 30px;
        height: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        animation: bounce 0.5s ease-out;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      map,
      position: place.geometry.location,
      content: markerElement,
      title: place.name
    });

    // Store marker for cleanup
    if (place.place_id) {
      // Remove old marker if exists
      const oldMarker = markersRef.current.get(place.place_id);
      if (oldMarker) {
        oldMarker.map = null;
      }
      markersRef.current.set(place.place_id, marker);
    }

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h4 style="margin: 0 0 5px 0;">${place.name}</h4>
          <p style="margin: 0; color: #666; font-size: 14px;">
            ${place.formatted_address || ''}
          </p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Auto-open info window
    setTimeout(() => {
      infoWindow.open(map, marker);
    }, 500);
  }, [map]);

  // Zoom to specific location with animation
  const zoomToLocation = useCallback(async (lat: number, lng: number, targetZoom: number = 15) => {
    if (!map) return;

    const currentZoom = map.getZoom() || 10;
    
    // Pan to location first
    map.panTo({ lat, lng });
    
    // Smooth zoom animation
    const zoomSteps = Math.abs(targetZoom - currentZoom);
    const zoomDirection = targetZoom > currentZoom ? 1 : -1;
    
    for (let i = 0; i <= zoomSteps; i++) {
      setTimeout(() => {
        map.setZoom(currentZoom + (zoomDirection * i));
      }, i * 100);
    }
  }, [map]);

  // Perform intersection with visual feedback
  const performIntersection = useCallback(async () => {
    const enabledLayers = layers.filter(l => l.enabled);
    
    if (enabledLayers.length < 2) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Insufficient Layers',
        detail: 'Please enable at least 2 layers to perform intersection',
        life: 4000
      });
      return;
    }

    // Highlight enabled layers
    enabledLayers.forEach(layer => {
      const layerData = layersRef.get(layer.id);
      if (layerData) {
        // Add temporary highlight style
        layerData.setStyle(() => ({
          fillColor: '#ff6b6b',
          fillOpacity: 0.3,
          strokeColor: '#ff0000',
          strokeWeight: 2,
          strokeOpacity: 0.8
        }));
        
        // Reset style after 2 seconds
        setTimeout(() => {
          if (layer.styleFunction) {
            layerData.setStyle(layer.styleFunction);
          }
        }, 2000);
      }
    });

    // Call actual intersection endpoint
    // This would integrate with your existing intersection logic
    toastRef.current?.show({
      severity: 'info',
      summary: 'Processing Intersection',
      detail: `Calculating overlaps between ${enabledLayers.length} layers...`,
      life: 3000
    });
  }, [layers, layersRef]);

  // Apply filters with animation
  const applyFilter = useCallback((filterType: string, values: string[]) => {
    if (filterType === 'seattle_zoning') {
      // Clear all filters first
      Array.from(seattleZoningFilters).forEach(zone => {
        toggleSeattleZoneFilter(zone);
      });
      
      // Apply new filters
      values.forEach(zone => {
        if (!seattleZoningFilters.has(zone)) {
          toggleSeattleZoneFilter(zone);
        }
      });
      
      toastRef.current?.show({
        severity: 'success',
        summary: 'Filters Applied',
        detail: `Showing ${values.join(', ')} zones`,
        life: 3000
      });
    } else if (filterType === 'base_zone') {
      values.forEach(zone => {
        if (!seattleBaseZoneFilters.has(zone)) {
          toggleSeattleBaseZoneFilter(zone);
        }
      });
    }
  }, [seattleZoningFilters, toggleSeattleZoneFilter, seattleBaseZoneFilters, toggleSeattleBaseZoneFilter]);

  // Create marker with animation
  const createMarker = useCallback(async (lat: number, lng: number, name: string) => {
    if (!map) return;

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    
    // Create ripple effect at location
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: 100px;
      height: 100px;
      border: 2px solid #667eea;
      border-radius: 50%;
      animation: ripple 1s ease-out;
      pointer-events: none;
    `;

    const marker = new AdvancedMarkerElement({
      map,
      position: { lat, lng },
      title: name
    });

    // Add bounce animation
    const content = document.createElement('div');
    content.innerHTML = `
      <div style="
        animation: dropIn 0.5s ease-out;
        width: 40px;
        height: 40px;
      ">
        📍
      </div>
    `;
    marker.content = content;

    toastRef.current?.show({
      severity: 'success',
      summary: 'Marker Added',
      detail: `Created marker: ${name}`,
      life: 2000
    });
  }, [map]);

  // Clear all LLM-created elements
  const clearLLMElements = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current.clear();
  }, []);

  return {
    searchPlace,
    zoomToLocation,
    performIntersection,
    applyFilter,
    createMarker,
    clearLLMElements,
    toastRef
  };
};