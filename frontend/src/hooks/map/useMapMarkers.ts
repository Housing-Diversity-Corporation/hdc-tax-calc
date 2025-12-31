/**
 * useMapMarkers - Marker management
 * Handles: Search markers, favorite markers, info windows
 */
import { useState, useRef, useCallback } from 'react';
import { createSimpleSearchMarker } from '../../utils/map/customMarkerSVGs';
import { fetchParcelData, formatParcelDataHtml, isKingCountyAddress, getPropertyLinks } from '../../utils/map/parcelUtils';
import { useTheme } from '../../contexts/ThemeContext';

export const useMapMarkers = (map: google.maps.Map | null) => {
  const { isDarkMode } = useTheme();
  const searchMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const favoriteLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.Place | null>(null);
  const [hasFavoriteMarker, setHasFavoriteMarker] = useState(false);
  const [hasSimpleSearchMarker, setHasSimpleSearchMarker] = useState(false);

  const clearSearchMarker = useCallback(() => {
    if (searchMarkerRef.current) {
      searchMarkerRef.current.map = null;
      searchMarkerRef.current = null;
    }
    if (searchInfoWindowRef.current) {
      searchInfoWindowRef.current.close();
      searchInfoWindowRef.current = null;
    }
    setSelectedPlace(null);
    setHasSimpleSearchMarker(false);
  }, []);

  const clearFavoriteMarker = useCallback(() => {
    if (favoriteLocationMarkerRef.current) {
      favoriteLocationMarkerRef.current.map = null;
      favoriteLocationMarkerRef.current = null;
    }
    setHasFavoriteMarker(false);
  }, []);

  const handlePlaceSelected = useCallback(async (place: google.maps.places.Place) => {
    if (!map || !place.location) return;

    clearSearchMarker();

    try {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Create custom marker element
      const markerContent = createSimpleSearchMarker(isDarkMode);

      const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: place.displayName || 'Selected Location',
        content: markerContent,
      });

      searchMarkerRef.current = marker;
      setSelectedPlace(place);
      setHasSimpleSearchMarker(true); // Mark that we have a simple search marker

      map.setCenter(place.location);
      map.setZoom(15);

      // Get lat/lng for parcel lookup
      const lat = (typeof place.location.lat === 'function' ? place.location.lat() : place.location.lat) as number;
      const lng = (typeof place.location.lng === 'function' ? place.location.lng() : place.location.lng) as number;
      const address = place.formattedAddress || '';

      // Build base info window content
      let infoContent = `<div style="padding: 10px; max-width: 300px;">
          <h3 style="margin: 0 0 5px 0; color: black;">${place.displayName || 'Location'}</h3>
          <p style="margin: 0; color: black;">${address}</p>
        </div>`;

      // Fetch King County parcel data if applicable
      let parcelData = null;
      if (isKingCountyAddress(address)) {
        parcelData = await fetchParcelData(address, lat, lng);
        if (parcelData && parcelData.success) {
          infoContent = `<div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 5px 0; color: black;">${place.displayName || 'Location'}</h3>
            <p style="margin: 0; color: black;">${address}</p>
            ${formatParcelDataHtml(parcelData)}
            ${getPropertyLinks(address, parcelData.pin)}
          </div>`;
        }
      }

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        // Position info window above the marker to account for pin height
        pixelOffset: new google.maps.Size(0, -55),
      });

      infoWindow.open({
        map,
        anchor: marker,
      });

      searchInfoWindowRef.current = infoWindow;

      // Allow re-opening info window by clicking marker
      marker.addListener('gmp-click', () => {
        if (searchInfoWindowRef.current) {
          searchInfoWindowRef.current.open({
            map,
            anchor: marker,
          });
        }
      });

    } catch (error) {
      console.error('Error creating marker:', error);
    }
  }, [map, clearSearchMarker]);

  return {
    selectedPlace,
    hasFavoriteMarker,
    hasSimpleSearchMarker,
    searchMarkerRef,
    favoriteLocationMarkerRef,
    handlePlaceSelected,
    clearSearchMarker,
    clearFavoriteMarker,
    setHasFavoriteMarker,
  };
};
