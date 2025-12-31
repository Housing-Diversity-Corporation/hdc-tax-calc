import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import '../styles/keywordSearch.css';

interface KeywordSearchCardProps {
  map: google.maps.Map | null;
  onSearchComplete?: (results: google.maps.places.PlaceResult[]) => void;
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
  onSearchFunctionReady?: (searchFn: (keyword: string, radius: number, centerLat: number, centerLng: number) => void) => void;
}

interface SearchResult extends google.maps.places.PlaceResult {
  distance?: number;
}

const KeywordSearchCard: React.FC<KeywordSearchCardProps> = ({ map, onSearchComplete, onKeywordSearchUpdate, onSearchFunctionReady }) => {
  const [keyword, setKeyword] = useState('');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchCenterMarker, setSearchCenterMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [searchRadiusCircle, setSearchRadiusCircle] = useState<google.maps.Circle | null>(null);
  const [searchResultMarkers, setSearchResultMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const toastRef = useRef<Toast>(null);

  // Use refs to store current marker/circle values for cleanup
  const searchCenterMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchRadiusCircleRef = useRef<google.maps.Circle | null>(null);
  const searchResultMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const searchCenterCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Initialize Places service
  useEffect(() => {
    if (map && !placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }
  }, [map]);

  // Keep refs in sync with state
  useEffect(() => {
    searchCenterMarkerRef.current = searchCenterMarker;
  }, [searchCenterMarker]);

  useEffect(() => {
    searchRadiusCircleRef.current = searchRadiusCircle;
  }, [searchRadiusCircle]);

  useEffect(() => {
    searchResultMarkersRef.current = searchResultMarkers;
  }, [searchResultMarkers]);

  // Helper function to perform search at a specific position
  const performSearchAtPosition = (keywordParam: string, radiusParam: number, lat: number, lng: number) => {
    if (!placesServiceRef.current || !map) return;

    const request: google.maps.places.PlaceSearchRequest = {
      location: { lat, lng },
      radius: radiusParam,
      keyword: keywordParam,
    };

    // Create a custom handler that uses the parameters instead of state
    placesServiceRef.current.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        // Create search radius circle
        const centerLatLng = new google.maps.LatLng(lat, lng);
        createSearchRadiusCircle(centerLatLng, radiusParam);

        // Calculate distance for all results
        const resultsWithDistance: SearchResult[] = results.map(place => {
          if (place.geometry?.location) {
            const placeLocation = place.geometry.location;
            let placeLat: number;
            let placeLng: number;

            if (typeof placeLocation.lat === 'function' && typeof placeLocation.lng === 'function') {
              placeLat = placeLocation.lat();
              placeLng = placeLocation.lng();
            } else {
              placeLat = (placeLocation.lat as unknown as number);
              placeLng = (placeLocation.lng as unknown as number);
            }

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(lat, lng),
              new google.maps.LatLng(placeLat, placeLng)
            );

            return { ...place, distance } as SearchResult;
          }
          return place as SearchResult;
        });

        // Sort results by distance (closest first)
        resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        // Fetch full details for all results
        const resultsWithDetails: SearchResult[] = [];
        let detailsFetched = 0;

        resultsWithDistance.forEach((place, index) => {
          if (!placesServiceRef.current || !place.place_id) {
            resultsWithDetails[index] = place;
            detailsFetched++;
            return;
          }

          placesServiceRef.current.getDetails(
            {
              placeId: place.place_id,
              fields: [
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'user_ratings_total',
                'website',
                'formatted_phone_number',
                'opening_hours',
                'utc_offset_minutes',
                'price_level',
                'business_status',
                'photos',
                'types',
                'place_id',
              ],
            },
            (placeDetails, detailsStatus) => {
              if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                resultsWithDetails[index] = { ...placeDetails, distance: place.distance };
              } else {
                resultsWithDetails[index] = place;
              }
              detailsFetched++;

              // When all details are fetched, update state and notify parent
              if (detailsFetched === resultsWithDistance.length) {
                setSearchResults(resultsWithDetails);

                // Notify parent about results with full details
                if (onKeywordSearchUpdate) {
                  onKeywordSearchUpdate(
                    resultsWithDetails,
                    true,
                    handleResultClick,
                    clearSearchResults,
                    (results) => convertToCSV(results),
                    () => handleSaveSearch(resultsWithDetails),
                    handleSaveLocation,
                    {
                      keyword: keywordParam,
                      radius: radiusParam,
                      centerLat: lat,
                      centerLng: lng
                    }
                  );
                }
              }
            }
          );

          // Create marker for this result
          createPlaceMarker(place);
        });

        // Adjust map bounds to show all results
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat, lng });
        resultsWithDistance.forEach(result => {
          if (result.geometry?.location) {
            bounds.extend(result.geometry.location);
          }
        });
        map.fitBounds(bounds);
      } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'No Results',
          detail: `No places found for "${keywordParam}" within ${radiusParam}m`,
          life: 3000
        });
      } else {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Search Failed',
          detail: 'Failed to search for places. Please try again.',
          life: 3000
        });
      }
    });
  };

  // Programmatic search function that can be called externally
  const executeSearch = useCallback(async (keywordParam: string, radiusParam: number, centerLat: number, centerLng: number) => {
    if (!map || !placesServiceRef.current) return;

    // Update state
    setKeyword(keywordParam);
    setSearchRadius(radiusParam);
    clearSearchResults();

    // Create center marker at specified position
    const position = { lat: centerLat, lng: centerLng };

    // Create the center marker
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const centerElement = document.createElement('div');
    centerElement.className = 'search-center-marker';
    centerElement.style.fontSize = '48px';
    centerElement.textContent = '🤔';

    const newMarker = new AdvancedMarkerElement({
      map: map,
      position: position,
      content: centerElement,
      gmpDraggable: false,
    });

    setSearchCenterMarker(newMarker);
    searchCenterCoordsRef.current = { lat: centerLat, lng: centerLng };

    // Pan map to the location
    map.panTo(position);
    map.setZoom(15);

    // Perform the search immediately
    setTimeout(() => {
      performSearchAtPosition(keywordParam, radiusParam, centerLat, centerLng);
    }, 500);
  }, [map]);

  // Expose the search function to parent
  useEffect(() => {
    if (onSearchFunctionReady && map && placesServiceRef.current) {
      onSearchFunctionReady(executeSearch);
    }
  }, [map, onSearchFunctionReady, executeSearch]);

  const startMarkerPlacement = () => {
    if (!keyword.trim()) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Keyword Required',
        detail: 'Please enter a keyword to search for places.',
        life: 3000
      });
      return;
    }

    clearSearchResults();
    setIsPlacingMarker(true);

    toastRef.current?.show({
      severity: 'info',
      summary: 'Place Search Marker',
      detail: 'Drag the red marker to your desired search center location.',
      life: 4000
    });

    // Create a draggable marker at the center of the map
    if (map) {
      const center = map.getCenter();
      if (center) {
        createDraggableSearchCenterMarker(center);
      }
    }
  };

  const createDraggableSearchCenterMarker = async (position: google.maps.LatLng) => {
    if (!map) return;

    // Remove existing center marker if any
    if (searchCenterMarker) {
      searchCenterMarker.map = null;
    }

    try {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Create the center marker element with a pulse effect and thinking face emoji
      const centerElement = document.createElement('div');
      centerElement.className = 'search-center-marker';
      centerElement.style.fontSize = '48px';
      centerElement.textContent = '🤔';

      const newMarker = new AdvancedMarkerElement({
        map: map,
        position: position,
        content: centerElement,
        gmpDraggable: true,
      });

      setSearchCenterMarker(newMarker);
    } catch (error) {
      console.error('Error creating draggable marker:', error);
    }
  };

  const performKeywordSearch = () => {
    if (!searchCenterMarker || !placesServiceRef.current || !map) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Please place a marker on the map first',
        life: 3000
      });
      return;
    }

    setIsPlacingMarker(false);

    toastRef.current?.show({
      severity: 'info',
      summary: 'Searching...',
      detail: `Searching for "${keyword}" within ${searchRadius}m`,
      life: 2000
    });

    const position = searchCenterMarker.position;

    // Extract lat/lng - handle both LatLng object and LatLngLiteral
    let lat: number;
    let lng: number;

    if (position && 'lat' in position) {
      if (typeof position.lat === 'function' && typeof position.lng === 'function') {
        // It's a LatLng object with methods
        lat = position.lat();
        lng = position.lng();
      } else if (typeof position.lat === 'number' && typeof position.lng === 'number') {
        // It's a LatLngLiteral with properties
        lat = position.lat;
        lng = position.lng;
      } else {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Invalid marker position format',
          life: 3000
        });
        return;
      }
    } else {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid marker position',
        life: 3000
      });
      return;
    }

    // Store coordinates in ref for later use
    searchCenterCoordsRef.current = { lat, lng };

    const request: google.maps.places.PlaceSearchRequest = {
      location: position,
      radius: searchRadius,
      keyword: keyword,
    };

    placesServiceRef.current.nearbySearch(request, handleSearchResults);
  };

  const handleSearchResults = (
    results: google.maps.places.PlaceResult[] | null,
    status: google.maps.places.PlacesServiceStatus
  ) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
      if (!searchCenterMarker || !map) return;

      // Create search radius circle
      createSearchRadiusCircle(searchCenterMarker.position as google.maps.LatLng, searchRadius);

      // Calculate distance for all results
      const resultsWithDistance = addDistanceToResults(results);

      // Sort results by distance (closest first)
      resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      // Fetch full details for all results
      const resultsWithDetails: SearchResult[] = [];
      let detailsFetched = 0;

      resultsWithDistance.forEach((place, index) => {
        if (!placesServiceRef.current || !place.place_id) {
          resultsWithDetails[index] = place;
          detailsFetched++;
          return;
        }

        placesServiceRef.current.getDetails(
          {
            placeId: place.place_id,
            fields: [
              'name',
              'formatted_address',
              'geometry',
              'rating',
              'user_ratings_total',
              'website',
              'formatted_phone_number',
              'opening_hours',
              'utc_offset_minutes',
              'price_level',
              'business_status',
              'photos',
              'types',
              'place_id',
            ],
          },
          (placeDetails, detailsStatus) => {
            if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
              resultsWithDetails[index] = { ...placeDetails, distance: place.distance };
            } else {
              resultsWithDetails[index] = place;
            }
            detailsFetched++;

            // When all details are fetched, update state and notify parent
            if (detailsFetched === resultsWithDistance.length) {
              setSearchResults(resultsWithDetails);

              // Notify parent about results with full details
              if (onKeywordSearchUpdate && searchCenterCoordsRef.current) {
                onKeywordSearchUpdate(
                  resultsWithDetails,
                  true,
                  handleResultClick,
                  clearSearchResults,
                  (results) => convertToCSV(results),
                  () => handleSaveSearch(resultsWithDetails),
                  handleSaveLocation,
                  {
                    keyword,
                    radius: searchRadius,
                    centerLat: searchCenterCoordsRef.current.lat,
                    centerLng: searchCenterCoordsRef.current.lng
                  }
                );
              }
            }
          }
        );

        // Create marker for this result
        createPlaceMarker(place);
      });

      // Adjust map bounds to show all results
      fitMapToSearchResults(resultsWithDistance);

      // Update search center info
      updateSearchCenterInfo(resultsWithDistance.length);

      // Show success toast
      toastRef.current?.show({
        severity: 'success',
        summary: 'Search Complete',
        detail: `Found ${resultsWithDistance.length} place(s) matching "${keyword}"`,
        life: 3000
      });

      // Call callback if provided
      if (onSearchComplete) {
        onSearchComplete(resultsWithDistance);
      }
    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'No Results',
        detail: `No places found matching "${keyword}" within ${searchRadius} meters.`,
        life: 4000
      });

      // Clean up the search center marker since there are no results
      if (searchCenterMarker) {
        searchCenterMarker.map = null;
        setSearchCenterMarker(null);
      }
    } else {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Search Failed',
        detail: `Place search failed: ${status}`,
        life: 4000
      });

      // Clean up on error
      if (searchCenterMarker) {
        searchCenterMarker.map = null;
        setSearchCenterMarker(null);
      }
    }
  };

  const addDistanceToResults = (results: google.maps.places.PlaceResult[]): SearchResult[] => {
    if (!searchCenterMarker) return results;

    const centerPosition = searchCenterMarker.position as google.maps.LatLng;

    return results.map(place => {
      if (place.geometry?.location) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          centerPosition,
          place.geometry.location
        );
        return { ...place, distance };
      }
      return place;
    });
  };

  const createSearchRadiusCircle = (center: google.maps.LatLng, radius: number) => {
    if (!map) return;

    // Remove existing circle
    if (searchRadiusCircle) {
      searchRadiusCircle.setMap(null);
    }

    const newCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.15,
      map: map,
      center: center,
      radius: radius,
      zIndex: 1,
    });

    setSearchRadiusCircle(newCircle);
  };

  const createPlaceMarker = async (place: SearchResult) => {
    if (!map || !place.geometry?.location) return;

    try {
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Determine pin color based on place type
      let pinColor = '#EA4335'; // Default red

      if (place.types) {
        if (place.types.includes('restaurant') || place.types.includes('food')) {
          pinColor = '#DB4437'; // Red for food
        } else if (place.types.includes('store') || place.types.includes('shopping_mall')) {
          pinColor = '#0F9D58'; // Green for shopping
        } else if (place.types.includes('bar') || place.types.includes('night_club')) {
          pinColor = '#F4B400'; // Yellow for nightlife
        }
      }

      // Create a simple pin marker
      const pinElement = new PinElement({
        background: pinColor,
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
      });

      const placeMarker = new AdvancedMarkerElement({
        map,
        content: pinElement.element,
        position: place.geometry.location,
        title: place.name,
      });

      // Add click listener to show info window with details
      placeMarker.addListener('gmp-click', () => {
        if (!placesServiceRef.current || !place.place_id) return;

        placesServiceRef.current.getDetails(
          {
            placeId: place.place_id,
            fields: [
              'name',
              'formatted_address',
              'geometry',
              'rating',
              'user_ratings_total',
              'website',
              'formatted_phone_number',
              'opening_hours',
              'utc_offset_minutes',
              'price_level',
              'business_status',
              'photos',
              'types',
              'place_id',
            ],
          },
          (placeDetails, detailsStatus) => {
            if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
              const detailsWithDistance = { ...placeDetails, distance: place.distance };
              showPlaceDetails(placeMarker, detailsWithDistance);
            }
          }
        );
      });

      setSearchResultMarkers(prev => [...prev, placeMarker]);
    } catch (error) {
      console.error('Error creating place marker:', error);
    }
  };

  const showPlaceDetails = (marker: google.maps.marker.AdvancedMarkerElement, placeDetails: SearchResult) => {
    if (!map) return;

    const distanceText = placeDetails.distance ? formatDistance(placeDetails.distance) : '';

    // Use isOpen() method instead of deprecated open_now
    let openNowText = '';
    if (placeDetails.opening_hours && typeof placeDetails.opening_hours.isOpen === 'function') {
      try {
        const isOpen = placeDetails.opening_hours.isOpen();
        openNowText = isOpen ? 'Open Now' : 'Closed';
      } catch (e) {
        // If isOpen() fails, don't show open/closed status
        openNowText = '';
        console.log("error:", e)
      }
    }

    const content = `
      <div class="info-window">
        <h5 style="margin: 0 0 8px 0; color: black;">${placeDetails.name || 'Unknown Place'}</h5>
        ${distanceText ? `<p style="color: black;"><strong><i class="pi pi-compass"></i> ${distanceText} from search center</strong></p>` : ''}
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

    infoWindow.open(map, marker);
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    } else {
      return (meters / 1000).toFixed(1) + ' km';
    }
  };

  const fitMapToSearchResults = (results: SearchResult[]) => {
    if (!map || !searchCenterMarker || results.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(searchCenterMarker.position as google.maps.LatLng);

    results.forEach(place => {
      if (place.geometry?.location) {
        bounds.extend(place.geometry.location);
      }
    });

    map.fitBounds(bounds);
  };

  const updateSearchCenterInfo = (resultCount: number) => {
    if (!searchCenterMarker || !map) return;

    searchCenterMarker.addListener('gmp-click', () => {
      const content = `
        <div class="info-window">
          <h5 style="color: black;">Search Center</h5>
          <p style="color: black;">Keyword: "${keyword}"</p>
          <p style="color: black;">Radius: ${searchRadius} meters</p>
          <p style="color: black;">Results: ${resultCount}</p>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: content,
      });

      infoWindow.open(map, searchCenterMarker);
    });
  };

  const clearSearchResults = () => {
    // Remove all search result markers using ref
    searchResultMarkersRef.current.forEach(marker => {
      marker.map = null;
    });
    setSearchResultMarkers([]);
    setSearchResults([]);

    // Notify parent to hide results panel
    if (onKeywordSearchUpdate) {
      onKeywordSearchUpdate(
        [],
        false,
        handleResultClick,
        clearSearchResults,
        (results) => convertToCSV(results),
        () => handleSaveSearch([]),
        handleSaveLocation,
        { keyword: '', radius: 0, centerLat: 0, centerLng: 0 }
      );
    }

    // Remove search center marker using ref
    if (searchCenterMarkerRef.current) {
      searchCenterMarkerRef.current.map = null;
      setSearchCenterMarker(null);
    }

    // Remove search radius circle using ref
    if (searchRadiusCircleRef.current) {
      searchRadiusCircleRef.current.setMap(null);
      setSearchRadiusCircle(null);
    }

    // Clear stored coordinates
    searchCenterCoordsRef.current = null;

    setIsPlacingMarker(false);
  };

  const cancelMarkerPlacement = () => {
    setIsPlacingMarker(false);

    if (searchCenterMarker) {
      searchCenterMarker.map = null;
      setSearchCenterMarker(null);
    }
  };

  const convertToCSV = (resultsToExport?: SearchResult[]) => {
    const results = resultsToExport || searchResults;

    if (results.length === 0) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'No Results',
        detail: 'No search results to export. Please perform a search first.',
        life: 3000
      });
      return;
    }

    const headers = [
      'Name',
      'Address',
      'Distance (m)',
      'Distance (mi)',
      'Types',
      'Rating',
      'User Ratings Total',
      'Latitude',
      'Longitude',
      'Place ID',
    ];

    const csvRows = [headers.join(',')];

    results.forEach(place => {
      const distanceInMiles = place.distance ? place.distance / 1609.34 : 0;

      const row = [
        '"' + (place.name || '').replace(/"/g, '""') + '"',
        '"' + (place.vicinity || '').replace(/"/g, '""') + '"',
        place.distance?.toFixed(2) || '',
        distanceInMiles.toFixed(2),
        '"' + (place.types ? place.types.join(';') : '').replace(/"/g, '""') + '"',
        place.rating || '',
        place.user_ratings_total || '',
        place.geometry?.location?.lat() || '',
        place.geometry?.location?.lng() || '',
        place.place_id || '',
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `places_search_${keyword}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastRef.current?.show({
      severity: 'success',
      summary: 'CSV Exported',
      detail: `Exported ${searchResults.length} results to CSV file`,
      life: 3000
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      startMarkerPlacement();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (!map || !result.geometry?.location) return;

    // Center map on the selected result
    map.panTo(result.geometry.location);
    map.setZoom(17);

    // Find the corresponding marker and trigger its click event
    const marker = searchResultMarkers.find(m => m.title === result.name);
    if (marker) {
      google.maps.event.trigger(marker, 'gmp-click');
    }
  };

  const handleSaveSearch = async (resultsToSave?: SearchResult[]) => {
    const results = resultsToSave || searchResults;

    if (!searchCenterCoordsRef.current) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'No Search',
        detail: 'Please perform a search before saving.',
        life: 3000
      });
      return;
    }

    const searchName = prompt('Enter a name for this search:');

    if (!searchName) {
      return; // User cancelled
    }

    try {
      const api = (await import('../services/api')).default;
      await api.post('/keyword-searches/save', {
        searchName,
        keyword,
        searchRadius,
        centerLat: searchCenterCoordsRef.current.lat,
        centerLng: searchCenterCoordsRef.current.lng,
        resultCount: results.length
      });

      toastRef.current?.show({
        severity: 'success',
        summary: 'Search Saved',
        detail: `Search "${searchName}" saved successfully with ${results.length} results!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error saving search:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save search. Please try again.',
        life: 3000
      });
    }
  };

  const handleSaveLocation = async (result: SearchResult) => {
    if (!result.geometry?.location) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Invalid Location',
        detail: 'This location does not have valid coordinates.',
        life: 3000
      });
      return;
    }

    const locationName = prompt('Enter a name for this location:', result.name || 'Saved Location');

    if (!locationName) {
      return; // User cancelled
    }

    try {
      const api = (await import('../services/api')).default;

      // Extract lat/lng - handle both LatLng object and LatLngLiteral
      const location = result.geometry.location;
      const lat: number = typeof location.lat === 'function' ? location.lat() : (location.lat as unknown as number);
      const lng: number = typeof location.lng === 'function' ? location.lng() : (location.lng as unknown as number);

      await api.post('/favorite-locations/save', {
        name: locationName,
        address: result.formatted_address || result.vicinity || 'Unknown Address',
        lat,
        lng,
        placeId: result.place_id || null,
        placeTypes: result.types ? result.types.join(',') : null
      });

      toastRef.current?.show({
        severity: 'success',
        summary: 'Location Favorited',
        detail: `"${locationName}" added to your favorites!`,
        life: 3000
      });
    } catch (error) {
      console.error('Error saving favorite location:', error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save favorite location. Please try again.',
        life: 3000
      });
    }
  };

  return (
    <>
      <Toast ref={toastRef} position="top-center" />

      <div className={`keyword-search-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {!isExpanded && !isPlacingMarker ? (
          /* Collapsed State - Click to Expand */
          <div className="keyword-search-collapsed" onClick={() => setIsExpanded(true)}>
            <i className="pi pi-search" style={{ marginRight: '8px', fontSize: '18px' }}></i>
            <span>Keyword Search</span>
            <i className="pi pi-chevron-down" style={{ marginLeft: 'auto', fontSize: '14px' }}></i>
          </div>
        ) : isPlacingMarker ? (
          /* Placing Marker Mode */
          <div className="marker-placement-mode">
            <div className="placement-instructions">
              <i className="pi pi-info-circle" style={{ marginRight: '8px' }}></i>
              <span>Drag the 🤔 marker to your desired search center</span>
            </div>
            <div className="placement-info">
              <p><strong>Keyword:</strong> {keyword}</p>
              <p><strong>Radius:</strong> {searchRadius} meters</p>
            </div>
            <div className="placement-actions">
              <Button
                label="Confirm Search"
                icon="pi pi-check"
                onClick={performKeywordSearch}
                className="p-button-sm"
                style={{ background: '#276221', color: 'white', border: 'none' }}
              />
              <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={cancelMarkerPlacement}
                className="p-button-sm"
                style={{ background: '#7C0A02', color: 'white', border: 'none' }}
              />
            </div>
          </div>
        ) : (
          /* Expanded State - Normal Search Mode */
          <>
            <div className="keyword-search-header">
              <span>Keyword Search</span>
              <Button
                icon="pi pi-chevron-up"
                onClick={() => setIsExpanded(false)}
                className="p-button-text p-button-sm collapse-button"
                tooltip="Collapse"
              />
            </div>
            <div className="search-input-group">
              <InputText
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., grocery store, coffee shop..."
                className="keyword-input"
              />
              <Button
                icon="pi pi-search"
                onClick={startMarkerPlacement}
                className="search-button"
                tooltip="Search"
                disabled={!keyword.trim()}
                style={{ background: '#276221', color: 'white', border: 'none' }}
              />
            </div>
            <div className="search-controls">
              <div className="radius-input-group">
                <label>Radius (meters):</label>
                <InputNumber
                  value={searchRadius}
                  onValueChange={(e) => setSearchRadius(e.value || 1000)}
                  min={100}
                  max={50000}
                  step={100}
                  showButtons
                  className="radius-input"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default KeywordSearchCard;
