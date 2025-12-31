import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { toast } from 'sonner';
import { Search, Check, X, Info, Minus, Plus, Binoculars } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createSearchCenterMarker, createEstablishmentMarker, createMarkerByType } from '../../../utils/map/customMarkerSVGs';
import { generateMockPlaces } from '../../../utils/map/mockPlaceData';
import { SearchSession, SearchResult } from '../../../types/map/map.types';
import { NEIGHBORHOOD_CATEGORIES, categoriesToOptions, getTypesFromCategories } from '../../../utils/map/neighborhoodCategories';
import { infoWindowManager } from '../../../utils/map/infoWindowManager';
import '../../../styles/map/neighborhoodExplorer.css';
import '../../../styles/map/pulsatingButton.css';

interface NeighborhoodExplorerCardProps {
  map: google.maps.Map | null;
  onSearchComplete?: (results: google.maps.places.PlaceResult[]) => void;
  onNeighborhoodExplorerUpdate?: (
    results: SearchResult[],
    visible: boolean,
    metadata: { textQuery: string; radius: number; centerLat: number; centerLng: number; selectedCategories?: string[] } | null,
    onResultClick: (result: SearchResult) => void,
    onClear: () => void,
    onExport: (filename: string) => void,
    onSave: (searchName: string) => void,
    onSaveLocation: (result: SearchResult, locationName: string) => void,
    onDeleteResult: (result: SearchResult) => void,
    onNewSearch: (textQuery: string, categories?: string[]) => void,
    onMarkerTypeChange: (result: SearchResult, newType: string) => void
  ) => void;
  onSearchFunctionReady?: (searchFn: (textQuery: string, categories: string[], radius: number, centerLat: number, centerLng: number, isAdditive?: boolean) => Promise<void>) => void;
  onPlacementModeChange?: (isPlacing: boolean, onConfirm?: () => void, onCancel?: () => void) => void;
  searchMarkerLocation?: { lat: number; lng: number } | null;
  shouldPulsate?: boolean;
}

const NeighborhoodExplorerCard: React.FC<NeighborhoodExplorerCardProps> = ({ map, onSearchComplete, onNeighborhoodExplorerUpdate, onSearchFunctionReady, onPlacementModeChange, searchMarkerLocation, shouldPulsate }) => {
  const { isDarkMode } = useTheme();
  const [textQuery, setTextQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchRadius, setSearchRadius] = useState(1000);
  const [circleOpacity, setCircleOpacity] = useState(0.15);
  const [circleBorderOpacity, setCircleBorderOpacity] = useState(0.8);
  const [isPlacingMarker, setIsPlacingMarker] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [useMockData, setUseMockData] = useState(true); // Default to mock mode to save API costs
  const [showPulsatingTooltip, setShowPulsatingTooltip] = useState(false);

  // Multi-search state
  const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);
  const searchSessionsRef = useRef<SearchSession[]>([]);
  const sessionMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement[]>>(new Map());
  const sessionCirclesRef = useRef<Map<string, google.maps.Circle>>(new Map());
  const sessionCenterMarkersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Legacy refs for backward compatibility
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchCenterMarker, setSearchCenterMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [searchRadiusCircle, setSearchRadiusCircle] = useState<google.maps.Circle | null>(null);
  const [searchResultMarkers, setSearchResultMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);
  const searchCenterMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchRadiusCircleRef = useRef<google.maps.Circle | null>(null);
  const searchResultMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const searchCenterCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const currentInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Color palette for different search sessions
  const colorPalette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Keep refs in sync with state
  useEffect(() => {
    searchSessionsRef.current = searchSessions;
  }, [searchSessions]);

  useEffect(() => {
    searchCenterMarkerRef.current = searchCenterMarker;
  }, [searchCenterMarker]);

  useEffect(() => {
    searchRadiusCircleRef.current = searchRadiusCircle;
  }, [searchRadiusCircle]);

  useEffect(() => {
    searchResultMarkersRef.current = searchResultMarkers;
  }, [searchResultMarkers]);

  // Update circle opacity when slider changes
  useEffect(() => {
    // Update legacy single-search circle
    if (searchRadiusCircle) {
      searchRadiusCircle.setOptions({
        fillOpacity: circleOpacity,
        strokeOpacity: circleOpacity === 0 ? 0 : circleBorderOpacity,
        strokeWeight: circleOpacity === 0 ? 0 : 2,
      });
    }

    // Update all session circles
    sessionCirclesRef.current.forEach((circle) => {
      circle.setOptions({
        fillOpacity: circleOpacity,
        strokeOpacity: circleOpacity === 0 ? 0 : circleBorderOpacity,
        strokeWeight: circleOpacity === 0 ? 0 : 2,
      });
    });
  }, [circleOpacity, circleBorderOpacity, searchRadiusCircle, searchSessions]);

  // Handle pulsating tooltip state with 15-second timer
  useEffect(() => {
    if (shouldPulsate) {
      setShowPulsatingTooltip(true);
      const timer = setTimeout(() => {
        setShowPulsatingTooltip(false);
      }, 15000); // 15 seconds

      return () => clearTimeout(timer);
    } else {
      setShowPulsatingTooltip(false);
    }
  }, [shouldPulsate]);

    const createSearchRadiusCircleForSession = (center: google.maps.LatLng, radius: number, color: string): google.maps.Circle => {
    if (!map) return new google.maps.Circle();

    const newCircle = new google.maps.Circle({
      strokeColor: color,
      strokeOpacity: circleOpacity === 0 ? 0 : circleBorderOpacity,
      strokeWeight: circleOpacity === 0 ? 0 : 2,
      fillColor: color,
      fillOpacity: circleOpacity,
      map: map,
      center: center,
      radius: radius,
      zIndex: 1,
    });

    return newCircle;
  };


  const createPlaceMarkerForSession = async (place: SearchResult, color: string): Promise<google.maps.marker.AdvancedMarkerElement | null> => {
    if (!map || !place.geometry?.location) return null;

    try {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Create custom establishment marker with appropriate icon
      // Use customMarkerType if set by user, otherwise use auto-detected types
      const markerElement = place.customMarkerType
        ? createMarkerByType(place.customMarkerType, 46, isDarkMode)
        : createEstablishmentMarker(place.types || [], isDarkMode);

      const location = getLatLng(place.geometry.location);

      const placeMarker = new AdvancedMarkerElement({
        map,
        content: markerElement,
        position: location,
        title: place.name,
        zIndex: 500, // Lower than property markers
      });

      // Add click listener to show info window with details
      placeMarker.addListener('gmp-click', () => {
        showPlaceDetails(placeMarker, place);
      });

      return placeMarker;
    } catch (error) {
      console.error('Error creating place marker:', error);
      return null;
    }
  };

  // Helper function to perform search at a specific position using new Places API or mock data
  const performSearchAtPosition = useCallback(async (textQueryParam: string, categoriesParam: string[], radiusParam: number, centerLat: number, centerLng: number) => {
    if (!map) return;

    try {
      let resultsWithDistance: SearchResult[] = [];
      let searchType: 'text' | 'nearby' | 'hybrid' = 'text';

      // Split text query by comma to support multiple queries (e.g., "boba, tea")
      const textQueries = textQueryParam && textQueryParam.trim().length > 0
        ? textQueryParam.split(',').map(q => q.trim()).filter(q => q.length > 0)
        : [];

      const hasTextQuery = textQueries.length > 0;
      const hasCategories = categoriesParam && categoriesParam.length > 0;

      // Debug log
      console.log('🔧 DEBUG - performSearchAtPosition called:', {
        useMockData,
        textQuery: textQueryParam,
        textQueries,
        categories: categoriesParam,
        hasTextQuery,
        hasCategories,
        searchType: hasTextQuery && hasCategories ? 'hybrid' : hasTextQuery ? 'text' : 'nearby'
      });

      // Check if we should use mock data
      if (useMockData) {
        console.log('🎭 MOCK DATA MODE - Generating mock places with pagination support');

        // Generate mock data for each text query (up to 20 results each)
        const mockResultsMap = new Map<string, SearchResult>();

        if (hasTextQuery) {
          textQueries.forEach(query => {
            const mockResults = generateMockPlaces(query, centerLat, centerLng, radiusParam, 20);
            mockResults.forEach(result => {
              if (result.place_id && !mockResultsMap.has(result.place_id)) {
                mockResultsMap.set(result.place_id, result);
              }
            });
          });
        }

        // Generate mock data for each category (up to 20 results each)
        if (hasCategories) {
          categoriesParam.forEach(category => {
            const mockResults = generateMockPlaces(category, centerLat, centerLng, radiusParam, 20);
            mockResults.forEach(result => {
              if (result.place_id && !mockResultsMap.has(result.place_id)) {
                mockResultsMap.set(result.place_id, result);
              }
            });
          });
        }

        resultsWithDistance = Array.from(mockResultsMap.values());
        searchType = hasTextQuery && hasCategories ? 'hybrid' : hasTextQuery ? 'text' : 'nearby';

        console.log('🎭 MOCK DATA - Pagination Results:', {
          textQueries,
          categories: categoriesParam,
          totalMockResults: resultsWithDistance.length,
          note: `Generated ${resultsWithDistance.length} unique mock places from ${textQueries.length} queries + ${categoriesParam.length} categories`
        });
      } else {
        // Use real Places API - DUAL SEARCH SYSTEM
        let textSearchResults: SearchResult[] = [];
        let categorySearchResults: SearchResult[] = [];

        // TEXT SEARCH: Use searchByText with locationBias
        // Support multiple queries (e.g., "boba, tea") by making parallel API calls
        if (hasTextQuery) {
          searchType = 'text';

          console.log('🔍 NEW PLACES API - Multiple Text Search Requests:', {
            apiMethod: 'Place.searchByText()',
            apiVersion: 'Places API (New)',
            textQueries,
            totalQueries: textQueries.length,
            locationBias: { centerLat, centerLng, radius: radiusParam },
            maxResultCountPerQuery: 20,
            timestamp: new Date().toISOString(),
            note: `Making ${textQueries.length} parallel API calls for pagination support`
          });

          // Create LatLng object for center (required by JavaScript SDK)
          const centerLatLng = new google.maps.LatLng(centerLat, centerLng);

          // Make parallel API calls for each text query
          const allTextSearchPlaces = await Promise.all(
            textQueries.map(async (query) => {
              const request: any = {
                textQuery: query,
                fields: ['id', 'displayName', 'location', 'types'],
                locationBias: {
                  center: centerLatLng,
                  radius: radiusParam,
                },
                maxResultCount: 20,
              };

              console.log(`🚀 CALLING API: Place.searchByText() for query "${query}"`, {
                textQuery: request.textQuery,
                maxResultCount: request.maxResultCount
              });

              try {
                const { places } = await google.maps.places.Place.searchByText(request);
                console.log(`✅ Text Search Response for "${query}":`, {
                  totalPlaces: places?.length || 0,
                  placeNames: places?.map(p => p.displayName) || []
                });
                return places || [];
              } catch (error) {
                console.error(`❌ Text search failed for "${query}":`, error);
                return [];
              }
            })
          );

          // Flatten and deduplicate places by ID
          const placesMap = new Map();
          allTextSearchPlaces.flat().forEach(place => {
            if (place.id && !placesMap.has(place.id)) {
              placesMap.set(place.id, place);
            }
          });
          let places = Array.from(placesMap.values());

          console.log('📊 Combined Text Search Results:', {
            totalQueriesMade: textQueries.length,
            totalPlacesBeforeDedup: allTextSearchPlaces.flat().length,
            totalPlacesAfterDedup: places.length,
            placeNames: places.map(p => p.displayName)
          });

        if (!places || places.length === 0) {
          toast.warning('No Results', {
            description: `No places found for "${textQueries.join(', ')}" within ${radiusParam}m`,
          });
          return;
        }

        // Step 2: Fetch detailed information for each place using Place Details (New) API
        console.log('📍 NEW PLACES API - Starting Place Details Fetch:', {
          apiMethod: 'Place.fetchFields()',
          totalPlacesToFetch: places.length,
          placeNames: places.map(p => p.displayName),
          fieldsRequested: [
            'displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount',
            'websiteURI', 'nationalPhoneNumber', 'businessStatus', 'photos', 'types',
            'addressComponents', 'addressDescriptor', 'regularOpeningHours', 'currentOpeningHours',
            'reviews', 'priceLevel', 'takeout', 'delivery', 'dineIn', 'outdoorSeating',
            'paymentOptions', 'generativeSummary', 'reviewSummary', 'googleMapsLinks'
          ],
          note: 'Fetching comprehensive Place Details for each result...'
        });

        // Fetch comprehensive details for all places
        const detailedPlaces = await Promise.all(
          places.map(async (place) => {
            try {
              // Step 1: Fetch ALL available fields using wildcard
              await place.fetchFields({
                fields: ['*']
              });

              console.log(`✅ Core Place Details Fetched: ${place.displayName}`, {
                placeId: place.id,
                hasPhotos: !!(place as any).photos?.length,
                hasReviews: !!(place as any).reviews?.length,
                hasOpeningHours: !!(place as any).regularOpeningHours,
              });

              // Step 2: Try to fetch AI summaries separately (may fail for some places)
              try {
                const placeAny = place as any;

                // Attempt to fetch editorial summary if available
                if (!placeAny.editorialSummary) {
                  await place.fetchFields({
                    fields: ['editorialSummary']
                  });
                }

                // Attempt to fetch AI-generated summaries (may not be available)
                if (!placeAny.generativeSummary || !placeAny.reviewSummary) {
                  await place.fetchFields({
                    fields: ['generativeSummary', 'reviewSummary']
                  });
                }

                console.log(`🤖 AI Summaries for: ${place.displayName}`, {
                  hasEditorialSummary: !!placeAny.editorialSummary,
                  hasGenerativeSummary: !!placeAny.generativeSummary,
                  hasReviewSummary: !!placeAny.reviewSummary,
                });
              } catch (aiError) {
                console.log(`ℹ️ AI summaries not available for: ${place.displayName}`, {
                  note: 'This is normal - AI summaries may not be available for all places or may require special API access'
                });
              }

              // Log the complete place object to see what fields are available
              console.log(`📦 Complete Place Object for: ${place.displayName}`, {
                placeId: place.id,
                allFields: Object.keys(place).filter(key => !key.startsWith('_')),
                rawPlaceObject: place
              });

              return place;
            } catch (error) {
              console.error(`❌ Failed to fetch Place Details for: ${place.displayName}`, {
                placeId: place.id,
                error: error,
                errorMessage: error instanceof Error ? error.message : String(error)
              });
              return place; // Return basic place data if details fetch fails
            }
          })
        );

        // Use detailed places for the rest of the logic
        places = detailedPlaces;

        // Convert new Place objects to SearchResult format and calculate distance
        resultsWithDistance = places
          .map(place => {
            const placeLat = place.location?.lat();
            const placeLng = place.location?.lng();

            let distance: number | undefined;
            if (placeLat !== undefined && placeLng !== undefined) {
              distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(centerLat, centerLng),
                new google.maps.LatLng(placeLat, placeLng)
              );
            }

            // Map new API format to legacy format for compatibility + rich Place Details data
            // Cast to any since we're fetching all fields with ['*'] and don't know exact type
            const placeAny = place as any;

            return {
              name: place.displayName,
              formatted_address: place.formattedAddress,
              geometry: place.location ? { location: place.location } : undefined,
              rating: place.rating,
              user_ratings_total: place.userRatingCount,
              website: place.websiteURI,
              formatted_phone_number: place.nationalPhoneNumber,
              business_status: place.businessStatus,
              photos: place.photos,
              types: place.types,
              place_id: place.id,
              distance: distance,
              // Rich data from Place Details (New) API - accessing via any cast
              opening_hours: placeAny.regularOpeningHours,
              current_opening_hours: placeAny.currentOpeningHours,
              reviews: placeAny.reviews,
              price_level: placeAny.priceLevel,
              address_components: placeAny.addressComponents,
              plus_code: placeAny.plusCode,
              viewport: placeAny.viewport,
              // Amenities
              takeout: placeAny.takeout,
              delivery: placeAny.delivery,
              dine_in: placeAny.dineIn,
              outdoor_seating: placeAny.outdoorSeating,
              allows_dogs: placeAny.allowsDogs,
              // Additional rich data
              payment_options: placeAny.paymentOptions,
              editorial_summary: placeAny.editorialSummary,
              generative_summary: placeAny.generativeSummary,
              review_summary: placeAny.reviewSummary,
              google_maps_links: placeAny.googleMapsLinks,
              address_descriptor: placeAny.addressDescriptor,
            } as SearchResult;
          })
          .filter(result => result.distance !== undefined && result.distance <= radiusParam); // Filter to radius

        // Store text search results
        textSearchResults = resultsWithDistance;

        // Sort results by distance (closest first)
        textSearchResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        // NEARBY SEARCH: Use searchNearby with includedTypes
        // Support multiple categories by making parallel API calls (one per category)
        if (hasCategories) {
          searchType = hasTextQuery ? 'hybrid' : 'nearby';

          console.log('📍 NEW PLACES API - Multiple Nearby Search Requests:', {
            apiMethod: 'Place.searchNearby()',
            apiVersion: 'Places API (New)',
            categories: categoriesParam,
            totalCategories: categoriesParam.length,
            locationRestriction: { centerLat, centerLng, radius: radiusParam },
            maxResultCountPerCategory: 20,
            timestamp: new Date().toISOString(),
            note: `Making ${categoriesParam.length} parallel API calls for pagination support`
          });

          // Create LatLng object for center (required by JavaScript SDK)
          const centerLatLng = new google.maps.LatLng(centerLat, centerLng);

          // Make parallel API calls for each category
          const allCategorySearchPlaces = await Promise.all(
            categoriesParam.map(async (category) => {
              // Get place types for this specific category
              const includedTypes = getTypesFromCategories([category]);

              const nearbyRequest: any = {
                fields: ['id', 'displayName', 'location', 'types'],
                locationRestriction: {
                  center: centerLatLng,
                  radius: radiusParam,
                },
                includedTypes,
                maxResultCount: 20,
              };

              console.log(`🚀 CALLING API: Place.searchNearby() for category "${category}"`, {
                includedTypes,
                maxResultCount: nearbyRequest.maxResultCount
              });

              try {
                const { places } = await google.maps.places.Place.searchNearby(nearbyRequest);
                console.log(`✅ Nearby Search Response for "${category}":`, {
                  totalPlaces: places?.length || 0,
                  placeNames: places?.map(p => p.displayName) || []
                });
                return places || [];
              } catch (error) {
                console.error(`❌ Nearby search failed for "${category}":`, error);
                return [];
              }
            })
          );

          // Flatten and deduplicate places by ID
          const placesMap = new Map();
          allCategorySearchPlaces.flat().forEach(place => {
            if (place.id && !placesMap.has(place.id)) {
              placesMap.set(place.id, place);
            }
          });
          const nearbyPlaces = Array.from(placesMap.values());

          console.log('📊 Combined Nearby Search Results:', {
            totalCategoriesMade: categoriesParam.length,
            totalPlacesBeforeDedup: allCategorySearchPlaces.flat().length,
            totalPlacesAfterDedup: nearbyPlaces.length,
            placeNames: nearbyPlaces.map(p => p.displayName)
          });

          if (nearbyPlaces && nearbyPlaces.length > 0) {
            // Fetch detailed information for each place
            const detailedNearbyPlaces = await Promise.all(
              nearbyPlaces.map(async (place) => {
                try {
                  await place.fetchFields({ fields: ['*'] });

                  // Try to fetch AI summaries
                  try {
                    const placeAny = place as any;
                    if (!placeAny.editorialSummary) {
                      await place.fetchFields({ fields: ['editorialSummary'] });
                    }
                    if (!placeAny.generativeSummary || !placeAny.reviewSummary) {
                      await place.fetchFields({ fields: ['generativeSummary', 'reviewSummary'] });
                    }
                  } catch (aiError) {
                    console.log(`ℹ️ AI summaries not available for: ${place.displayName}`);
                  }

                  return place;
                } catch (error) {
                  console.error(`❌ Failed to fetch Place Details for: ${place.displayName}`, error);
                  return place;
                }
              })
            );

            // Convert nearby places to SearchResult format
            categorySearchResults = detailedNearbyPlaces
              .map(place => {
                const placeLat = place.location?.lat();
                const placeLng = place.location?.lng();

                let distance: number | undefined;
                if (placeLat !== undefined && placeLng !== undefined) {
                  distance = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(centerLat, centerLng),
                    new google.maps.LatLng(placeLat, placeLng)
                  );
                }

                const placeAny = place as any;

                return {
                  name: place.displayName,
                  formatted_address: place.formattedAddress,
                  geometry: place.location ? { location: place.location } : undefined,
                  rating: place.rating,
                  user_ratings_total: place.userRatingCount,
                  website: place.websiteURI,
                  formatted_phone_number: place.nationalPhoneNumber,
                  business_status: place.businessStatus,
                  photos: place.photos,
                  types: place.types,
                  place_id: place.id,
                  distance: distance,
                  opening_hours: placeAny.regularOpeningHours,
                  current_opening_hours: placeAny.currentOpeningHours,
                  reviews: placeAny.reviews,
                  price_level: placeAny.priceLevel,
                  address_components: placeAny.addressComponents,
                  plus_code: placeAny.plusCode,
                  viewport: placeAny.viewport,
                  takeout: placeAny.takeout,
                  delivery: placeAny.delivery,
                  dine_in: placeAny.dineIn,
                  outdoor_seating: placeAny.outdoorSeating,
                  allows_dogs: placeAny.allowsDogs,
                  payment_options: placeAny.paymentOptions,
                  editorial_summary: placeAny.editorialSummary,
                  generative_summary: placeAny.generativeSummary,
                  review_summary: placeAny.reviewSummary,
                  google_maps_links: placeAny.googleMapsLinks,
                  address_descriptor: placeAny.addressDescriptor,
                } as SearchResult;
              })
              .filter(result => result.distance !== undefined && result.distance <= radiusParam);

            categorySearchResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        }

        // Combine text and category search results
        if (hasTextQuery && hasCategories) {
          // Hybrid search: merge and deduplicate by place_id
          const combinedMap = new Map<string, SearchResult>();

          [...textSearchResults, ...categorySearchResults].forEach(result => {
            if (result.place_id && !combinedMap.has(result.place_id)) {
              combinedMap.set(result.place_id, result);
            }
          });

          resultsWithDistance = Array.from(combinedMap.values());
          resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        } else if (hasTextQuery) {
          resultsWithDistance = textSearchResults;
        } else {
          resultsWithDistance = categorySearchResults;
        }
      }

      // Create SearchSession for this search
      const sessionId = `session_${Date.now()}`;
      // Use ref to get current session count for color selection
      const sessionColor = colorPalette[searchSessionsRef.current.length % colorPalette.length];

      const newSession: SearchSession = {
        id: sessionId,
        textQuery: textQueryParam,
        radius: radiusParam,
        centerLat: centerLat,
        centerLng: centerLng,
        results: resultsWithDistance,
        timestamp: Date.now(),
        color: sessionColor,
        isMockData: useMockData,
        selectedCategories: categoriesParam,
        searchType: hasTextQuery && hasCategories ? 'hybrid' : hasTextQuery ? 'text' : 'nearby'
      };

      // Use ref to get the most up-to-date sessions array (not stale state)
      const updatedSessions = [...searchSessionsRef.current, newSession];
      setSearchSessions(updatedSessions);

      if (resultsWithDistance && resultsWithDistance.length > 0) {
        // Create search radius circle with session color
        const centerLatLng = new google.maps.LatLng(centerLat, centerLng);
        const sessionCircle = createSearchRadiusCircleForSession(centerLatLng, radiusParam, sessionColor);
        sessionCirclesRef.current.set(sessionId, sessionCircle);

        // Update state with results (for backward compatibility)
        setSearchResults(resultsWithDistance);

        // Console log the text query search results for debugging
        console.log('🔍 Text Query Search Results:', {
          textQuery: textQueryParam,
          radius: radiusParam,
          centerLocation: { centerLat, centerLng },
          totalResults: resultsWithDistance.length,
          results: resultsWithDistance.map(r => ({
            name: r.name,
            types: r.types,
            address: r.formatted_address,
            rating: r.rating,
            distance: r.distance ? `${Math.round(r.distance)}m` : 'N/A',
            place_id: r.place_id
          }))
        });

        // Make the center target marker fully transparent after search completes
        if (searchCenterMarkerRef.current && searchCenterMarkerRef.current.content) {
          const content = searchCenterMarkerRef.current.content as HTMLElement;
          content.style.opacity = '0';
        }

        // Create center marker for this session (fully transparent to avoid confusion)
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const centerElement = createSearchCenterMarker(isDarkMode);
        centerElement.style.opacity = '0'; // Fully transparent after search completes
        centerElement.style.transform = 'scale(0.7)';

        const sessionCenterMarker = new AdvancedMarkerElement({
          map: map,
          position: centerLatLng,
          content: centerElement,
          gmpDraggable: false,
        });
        sessionCenterMarkersRef.current.set(sessionId, sessionCenterMarker);

        // Create markers for all results with session color
        const sessionMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
        for (const place of resultsWithDistance) {
          const marker = await createPlaceMarkerForSession(place, sessionColor);
          if (marker) {
            sessionMarkers.push(marker);
          }
        }
        sessionMarkersRef.current.set(sessionId, sessionMarkers);

        // Aggregate ALL results from ALL sessions
        const allResults = updatedSessions.flatMap(session => session.results);

        console.log('📊 Aggregated Results from All Sessions:', {
          totalSessions: updatedSessions.length,
          totalResults: allResults.length,
          sessions: updatedSessions.map(s => ({
            textQuery: s.textQuery,
            resultsCount: s.results.length
          }))
        });

        // Notify parent about ALL aggregated results
        if (onNeighborhoodExplorerUpdate) {
          onNeighborhoodExplorerUpdate(
            allResults, // Send ALL results, not just current session
            true,
            {
              textQuery: textQueryParam,
              radius: radiusParam,
              centerLat: centerLat,
              centerLng: centerLng,
              selectedCategories: categoriesParam
            },
            handleResultClick,
            clearSearchResults,
            (filename) => convertToCSV(filename, allResults), // Export all results
            (searchName) => handleSaveSearch(searchName, allResults), // Save all results
            handleSaveLocation,
            handleDeleteResult,
            handleNewSearch,
            handleMarkerTypeChange
          );
        }

        // Adjust map bounds to show all results
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: centerLat, lng: centerLng });
        resultsWithDistance.forEach(result => {
          if (result.geometry?.location) {
            const location = getLatLng(result.geometry.location);
            bounds.extend(location);
          }
        });
        map.fitBounds(bounds);

        toast.success('Search Complete', {
          description: `Found ${resultsWithDistance.length} place(s)`,
        });

      } else {
        // Build appropriate message based on search type
        let searchDescription = '';
        if (hasTextQuery && hasCategories) {
          searchDescription = `No places found for "${textQueryParam}" in selected categories within ${radiusParam}m`;
        } else if (hasTextQuery) {
          searchDescription = `No places found for "${textQueryParam}" within ${radiusParam}m`;
        } else if (hasCategories) {
          const categoryLabels = categoriesParam.map(id => NEIGHBORHOOD_CATEGORIES[id]?.label || id).join(', ');
          searchDescription = `No places found in categories: ${categoryLabels} within ${radiusParam}m`;
        } else {
          searchDescription = `No places found within ${radiusParam}m`;
        }

        toast.warning('No Results', {
          description: searchDescription,
        });

        // Clean up the search center marker since there are no results
        if (searchCenterMarkerRef.current) {
          searchCenterMarkerRef.current.map = null;
          setSearchCenterMarker(null);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search Failed', {
        description: 'Failed to search for places. Please try again.',
      });

      // Clean up the search center marker on error
      if (searchCenterMarkerRef.current) {
        searchCenterMarkerRef.current.map = null;
        setSearchCenterMarker(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, useMockData, isDarkMode, onNeighborhoodExplorerUpdate]);

  // Programmatic search function that can be called externally
  const executeSearch = useCallback(async (textQueryParam: string, categoriesParam: string[], radiusParam: number, centerLat: number, centerLng: number, isAdditive: boolean = false) => {
    if (!map) return;

    // Update state
    setTextQuery(textQueryParam);
    setSelectedCategories(categoriesParam);
    setSearchRadius(radiusParam);

    // Only clear results if this is NOT an additive search
    if (!isAdditive) {
      clearSearchResults();
    }

    // Create center marker at specified position
    const position = { lat: centerLat, lng: centerLng };

    // Create the center marker - make it smaller and semi-transparent to avoid covering property markers
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const centerElement = createSearchCenterMarker(isDarkMode);
    centerElement.style.opacity = '0.6'; // Semi-transparent
    centerElement.style.transform = 'scale(0.7)'; // Smaller

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
      performSearchAtPosition(textQueryParam, categoriesParam, radiusParam, centerLat, centerLng);
    }, 500);
  }, [map, isDarkMode, performSearchAtPosition]);

  // Expose the search function to parent
  useEffect(() => {
    if (onSearchFunctionReady && map) {
      onSearchFunctionReady(executeSearch);
    }
  }, [map, onSearchFunctionReady, executeSearch]);

  // When dialog opens with a search marker location, use it automatically
  useEffect(() => {
    if (isOpen && searchMarkerLocation && !isPlacingMarker) {
      // If we have a search marker location and the dialog just opened,
      // skip the placement mode and go straight to showing the search centered there
      // This will be triggered when user clicks text query search button while search marker is present
    }
  }, [isOpen, searchMarkerLocation, isPlacingMarker]);

  const startMarkerPlacement = () => {
    // Require either a text query OR selected categories
    if (!textQuery.trim() && selectedCategories.length === 0) {
      toast.warning('Search Input Required', {
        description: 'Please enter a text query or select at least one category.',
      });
      return;
    }

    // If we have a search marker location, use it directly
    if (searchMarkerLocation) {
      executeSearch(textQuery, selectedCategories, searchRadius, searchMarkerLocation.lat, searchMarkerLocation.lng);
      setIsOpen(false);
      return;
    }

    // Store the text query, categories, and radius before clearing
    const textQueryToSearch = textQuery;
    const categoriesToSearch = selectedCategories;
    const radiusToSearch = searchRadius;

    clearSearchResults();
    setIsPlacingMarker(true);

    // Restore text query, categories, and radius after clearing
    setTextQuery(textQueryToSearch);
    setSelectedCategories(categoriesToSearch);
    setSearchRadius(radiusToSearch);

    toast.info('Place Search Marker', {
      description: 'Drag the target marker to your desired search center location. Click "Search Here" button when ready.',
      duration: 5000,
    });

    // Create a draggable marker at the center of the map
    if (map) {
      const center = map.getCenter();
      if (center) {
        createDraggableSearchCenterMarker(center).then(() => {
          // Only close dialog and notify parent after marker is created
          setIsOpen(false); // Close dialog to allow map interaction

          // Notify parent about placement mode
          if (onPlacementModeChange) {
            onPlacementModeChange(true, performTextQuerySearch, cancelMarkerPlacement);
          }
        });
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

      // Create the center marker element with a target icon
      const centerElement = createSearchCenterMarker(isDarkMode);
      centerElement.style.cursor = 'move';

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

  const performTextQuerySearch = () => {
    console.log('performTextQuerySearch called', {
      hasMarker: !!searchCenterMarker,
      hasMarkerRef: !!searchCenterMarkerRef.current,
      hasMap: !!map
    });

    // Use the ref instead of state to avoid stale closure issues
    const marker = searchCenterMarkerRef.current;

    if (!marker || !map) {
      toast.error('Error', {
        description: 'Please place a marker on the map first',
      });
      return;
    }

    setIsPlacingMarker(false);

    // Notify parent about exiting placement mode
    if (onPlacementModeChange) {
      onPlacementModeChange(false);
    }

    toast.info('Searching...', {
      description: `Searching for "${textQuery}" within ${searchRadius}m`,
      duration: 2000,
    });

    const position = marker.position;

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
        toast.error('Error', {
          description: 'Invalid marker position format',
        });
        return;
      }
    } else {
      toast.error('Error', {
        description: 'Invalid marker position',
      });
      return;
    }

    // Store coordinates in ref for later use
    searchCenterCoordsRef.current = { lat, lng };

    // Use new Places API
    performSearchAtPosition(textQuery, selectedCategories, searchRadius, lat, lng);
  };


  const createSearchRadiusCircle = (center: google.maps.LatLng, radius: number) => {
    if (!map) return;

    // Remove existing circle
    if (searchRadiusCircle) {
      searchRadiusCircle.setMap(null);
    }

    const newCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: circleOpacity === 0 ? 0 : circleBorderOpacity,
      strokeWeight: circleOpacity === 0 ? 0 : 2,
      fillColor: '#FF0000',
      fillOpacity: circleOpacity,
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
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // Create custom establishment marker with appropriate icon
      // Use customMarkerType if set by user, otherwise use auto-detected types
      const markerElement = place.customMarkerType
        ? createMarkerByType(place.customMarkerType, 46, isDarkMode)
        : createEstablishmentMarker(place.types || [], isDarkMode);

      const location = getLatLng(place.geometry.location);

      const placeMarker = new AdvancedMarkerElement({
        map,
        content: markerElement,
        position: location,
        title: place.name,
        zIndex: 500, // Lower than property markers
      });

      // Add click listener to show info window with details (no need for getDetails with new API)
      placeMarker.addListener('gmp-click', () => {
        showPlaceDetails(placeMarker, place);
      });

      setSearchResultMarkers(prev => [...prev, placeMarker]);
    } catch (error) {
      console.error('Error creating place marker:', error);
    }
  };

  const showPlaceDetails = (marker: google.maps.marker.AdvancedMarkerElement, placeDetails: SearchResult) => {
    if (!map) return;

    const distanceText = placeDetails.distance ? formatDistance(placeDetails.distance) : '';

    // Check if place is currently open
    let openNowText = '';
    let openStatusColor = '';
    if (placeDetails.current_opening_hours?.openNow !== undefined) {
      openNowText = placeDetails.current_opening_hours.openNow ? '🟢 Open Now' : '🔴 Closed';
      openStatusColor = placeDetails.current_opening_hours.openNow ? '#16a34a' : '#dc2626';
    } else if (placeDetails.opening_hours && typeof placeDetails.opening_hours.isOpen === 'function') {
      try {
        const isOpen = placeDetails.opening_hours.isOpen();
        openNowText = isOpen ? '🟢 Open Now' : '🔴 Closed';
        openStatusColor = isOpen ? '#16a34a' : '#dc2626';
      } catch (e) {
        console.log("error checking hours:", e);
      }
    }

    // Build amenities badges
    const amenities = [];
    if (placeDetails.takeout) amenities.push('🥡 Takeout');
    if (placeDetails.delivery) amenities.push('🚚 Delivery');
    if (placeDetails.dine_in) amenities.push('🍽️ Dine-in');
    if (placeDetails.outdoor_seating) amenities.push('🌳 Outdoor');
    if (placeDetails.allows_dogs) amenities.push('🐕 Dog-friendly');

    // Price level display
    let priceDisplay = '';
    if (placeDetails.price_level !== undefined) {
      const priceMap: Record<string, string> = {
        'FREE': 'Free',
        'INEXPENSIVE': '$',
        'MODERATE': '$$',
        'EXPENSIVE': '$$$',
        'VERY_EXPENSIVE': '$$$$'
      };

      // Handle both string enum and number formats
      if (typeof placeDetails.price_level === 'string') {
        priceDisplay = priceMap[placeDetails.price_level] || placeDetails.price_level;
      } else {
        // Number format (0-4)
        priceDisplay = Array(placeDetails.price_level + 1).fill('$').join('');
      }
    }

    const content = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 320px; padding: 4px;">
        <!-- Header -->
        <div style="margin-bottom: 12px;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600; color: #111827; line-height: 1.3;">
            ${placeDetails.name || 'Unknown Place'}
          </h3>
          ${distanceText ? `
            <div style="display: flex; align-items: center; gap: 4px; color: #6b7280; font-size: 13px; margin-bottom: 4px;">
              <span style="font-weight: 500;">📍 ${distanceText}</span> from search center
            </div>
          ` : ''}
        </div>

        <!-- Rating & Price -->
        ${(placeDetails.rating || priceDisplay) ? `
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
            ${placeDetails.rating ? `
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="color: #facc15; font-size: 14px;">⭐</span>
                <span style="font-weight: 600; color: #111827;">${placeDetails.rating}</span>
                <span style="color: #6b7280; font-size: 13px;">(${placeDetails.user_ratings_total || 0})</span>
              </div>
            ` : ''}
            ${priceDisplay ? `
              <div style="font-weight: 600; color: #16a34a; font-size: 14px;">
                ${priceDisplay}
              </div>
            ` : ''}
            ${openNowText ? `
              <div style="font-weight: 600; font-size: 13px; color: ${openStatusColor};">
                ${openNowText}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Amenities -->
        ${amenities.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
            ${amenities.map(a => `
              <span style="background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-size: 12px; color: #374151;">
                ${a}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Address -->
        ${placeDetails.formatted_address ? `
          <div style="color: #6b7280; font-size: 13px; margin-bottom: 10px; line-height: 1.4;">
            ${placeDetails.formatted_address}
          </div>
        ` : ''}

        <!-- Contact -->
        <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          ${placeDetails.formatted_phone_number ? `
            <a href="tel:${placeDetails.formatted_phone_number}"
               style="display: flex; align-items: center; gap: 6px; color: #2563eb; text-decoration: none; font-size: 13px;">
              <span>📞</span>
              <span>${placeDetails.formatted_phone_number}</span>
            </a>
          ` : ''}
          ${placeDetails.website ? `
            <a href="${placeDetails.website}" target="_blank" rel="noopener noreferrer"
               style="display: flex; align-items: center; gap: 6px; color: #2563eb; text-decoration: none; font-size: 13px;">
              <span>🌐</span>
              <span>Visit Website</span>
            </a>
          ` : ''}
          ${placeDetails.google_maps_links?.directionsUri ? `
            <a href="${placeDetails.google_maps_links.directionsUri}" target="_blank" rel="noopener noreferrer"
               style="display: flex; align-items: center; gap: 6px; color: #2563eb; text-decoration: none; font-size: 13px;">
              <span>🗺️</span>
              <span>Get Directions</span>
            </a>
          ` : ''}
        </div>
      </div>
    `;

    // Close any existing InfoWindow
    if (currentInfoWindowRef.current) {
      currentInfoWindowRef.current.close();
    }

    const infoWindow = new google.maps.InfoWindow({
      content: content,
      maxWidth: 350,
      pixelOffset: new google.maps.Size(0, -49), // Offset above marker (works correctly with position-based opening)
    });

    currentInfoWindowRef.current = infoWindow;

    // Get marker's exact position (lat/lng) - no geographic offset needed
    // The pixelOffset will handle the visual positioning above the marker
    const markerPosition = marker.position;
    infoWindowManager.openInfoWindow(infoWindow, map, marker, markerPosition);
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    } else {
      return (meters / 1000).toFixed(1) + ' km';
    }
  };

  // Helper function to get lat/lng values (supports both function and property access)
  const getLatLng = (location: { lat: (() => number) | number; lng: (() => number) | number }): { lat: number; lng: number } => {
    const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
    const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
    return { lat, lng };
  };

  const fitMapToSearchResults = (results: SearchResult[]) => {
    const marker = searchCenterMarkerRef.current;
    if (!map || !marker || results.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(marker.position as google.maps.LatLng);

    results.forEach(place => {
      if (place.geometry?.location) {
        const location = getLatLng(place.geometry.location);
        bounds.extend(location);
      }
    });

    map.fitBounds(bounds);
  };

  const updateSearchCenterInfo = (resultCount: number) => {
    const marker = searchCenterMarkerRef.current;
    if (!marker || !map) return;

    marker.addListener('gmp-click', () => {
      const content = `
        <div class="info-window">
          <h5 style="color: black;">Search Center</h5>
          <p style="color: black;">TextQuery: "${textQuery}"</p>
          <p style="color: black;">Radius: ${searchRadius} meters</p>
          <p style="color: black;">Results: ${resultCount}</p>
        </div>
      `;

      // Close any existing InfoWindow
      if (currentInfoWindowRef.current) {
        currentInfoWindowRef.current.close();
      }

      const infoWindow = new google.maps.InfoWindow({
        content: content,
        pixelOffset: new google.maps.Size(0, -50), // Offset up 15% higher for establishment marker
      });

      currentInfoWindowRef.current = infoWindow;
      infoWindowManager.openInfoWindow(infoWindow, map, marker);
    });
  };

  const deleteSession = (sessionId: string) => {
    console.log('🗑️ Deleting search session:', sessionId);

    // Remove markers for this session
    const markers = sessionMarkersRef.current.get(sessionId);
    if (markers) {
      markers.forEach(marker => {
        marker.map = null;
      });
      sessionMarkersRef.current.delete(sessionId);
    }

    // Remove circle for this session
    const circle = sessionCirclesRef.current.get(sessionId);
    if (circle) {
      circle.setMap(null);
      sessionCirclesRef.current.delete(sessionId);
    }

    // Remove center marker for this session
    const centerMarker = sessionCenterMarkersRef.current.get(sessionId);
    if (centerMarker) {
      centerMarker.map = null;
      sessionCenterMarkersRef.current.delete(sessionId);
    }

    // Remove session from state
    setSearchSessions(prev => prev.filter(s => s.id !== sessionId));

    toast.success('Session Deleted', {
      description: 'Search session removed from map',
    });
  };

  const clearAllSessions = () => {
    console.log('🗑️ Clearing all search sessions');

    // Remove all session markers
    sessionMarkersRef.current.forEach((markers) => {
      markers.forEach(marker => {
        marker.map = null;
      });
    });
    sessionMarkersRef.current.clear();

    // Remove all session circles
    sessionCirclesRef.current.forEach((circle) => {
      circle.setMap(null);
    });
    sessionCirclesRef.current.clear();

    // Remove all session center markers
    sessionCenterMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    sessionCenterMarkersRef.current.clear();

    // Clear sessions state
    setSearchSessions([]);

    toast.success('All Sessions Cleared', {
      description: 'All search sessions removed from map',
    });
  };

  const clearSearchResults = () => {
    console.log('🗑️ clearSearchResults called - clearing ALL sessions and legacy data');

    // Clear all multi-search sessions (new system)
    // Remove all session markers
    sessionMarkersRef.current.forEach((markers) => {
      markers.forEach(marker => {
        marker.map = null;
      });
    });
    sessionMarkersRef.current.clear();

    // Remove all session circles
    sessionCirclesRef.current.forEach((circle) => {
      circle.setMap(null);
    });
    sessionCirclesRef.current.clear();

    // Remove all session center markers
    sessionCenterMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    sessionCenterMarkersRef.current.clear();

    // Clear sessions state
    setSearchSessions([]);

    // Clear legacy single-search data (for backward compatibility)
    searchResultMarkersRef.current.forEach(marker => {
      marker.map = null;
    });
    setSearchResultMarkers([]);
    setSearchResults([]);

    // Only clear textQuery and radius if not in placement mode
    // This allows textQuery/radius to persist during marker placement
    if (!isPlacingMarker) {
      setTextQuery('');
      setSearchRadius(1000);
    }

    // Notify parent to hide results panel
    if (onNeighborhoodExplorerUpdate) {
      onNeighborhoodExplorerUpdate(
        [],
        false,
        null,
        handleResultClick,
        clearSearchResults,
        (filename) => convertToCSV(filename, []),
        (searchName) => handleSaveSearch(searchName, []),
        handleSaveLocation,
        handleDeleteResult,
        handleNewSearch,
        handleMarkerTypeChange
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

    toast.success('Text Query Search Cleared', {
      description: 'All search results and markers removed',
    });
  };

  const cancelMarkerPlacement = () => {
    console.log('🔍 Cancel marker placement called', { hasMarker: !!searchCenterMarkerRef.current });
    setIsPlacingMarker(false);

    // Use ref instead of state to avoid stale closure
    if (searchCenterMarkerRef.current) {
      searchCenterMarkerRef.current.map = null;
      searchCenterMarkerRef.current = null;
      setSearchCenterMarker(null);
    }

    // Notify parent about exiting placement mode
    if (onPlacementModeChange) {
      onPlacementModeChange(false);
    }

    // Show toast notification
    toast.info('Search Cancelled', {
      description: 'Text query search cancelled',
      duration: 2000,
    });
  };

  const convertToCSV = (filename: string, resultsToExport?: SearchResult[]) => {
    const results = resultsToExport || searchResults;

    if (results.length === 0) {
      toast.warning('No Results', {
        description: 'No search results to export. Please perform a search first.',
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
      const location = place.geometry?.location ? getLatLng(place.geometry.location) : { lat: 0, lng: 0 };

      const address = place.formatted_address || place.vicinity || '';

      const row = [
        '"' + (place.name || '').replace(/"/g, '""') + '"',
        '"' + address.replace(/"/g, '""') + '"',
        place.distance?.toFixed(2) || '',
        distanceInMiles.toFixed(2),
        '"' + (place.types ? place.types.join(';') : '').replace(/"/g, '""') + '"',
        place.rating || '',
        place.user_ratings_total || '',
        location.lat || '',
        location.lng || '',
        place.place_id || '',
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    // Ensure filename has .csv extension
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV Exported', {
      description: `Exported ${results.length} results to ${finalFilename}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      startMarkerPlacement();
    }
  };

  // Handle new search with a different text query at the same location
  const handleNewSearch = (newTextQuery: string, categories?: string[]) => {
    if (searchCenterCoordsRef.current) {
      console.log('🔍 handleNewSearch - Using searchRadius:', searchRadius);
      setTextQuery(newTextQuery);
      const categoriesToUse = categories !== undefined ? categories : selectedCategories;
      if (categories !== undefined) {
        setSelectedCategories(categories);
      }
      performSearchAtPosition(
        newTextQuery,
        categoriesToUse,
        searchRadius, // This uses the current searchRadius from state
        searchCenterCoordsRef.current.lat,
        searchCenterCoordsRef.current.lng
      );
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (!map || !result.geometry?.location) return;

    // Center map on the selected result
    const location = getLatLng(result.geometry.location);
    map.panTo(location);
    map.setZoom(17);

    // Find the corresponding marker and trigger its click event
    const marker = searchResultMarkers.find(m => m.title === result.name);
    if (marker) {
      google.maps.event.trigger(marker, 'gmp-click');
    }
  };

  const handleDeleteResult = (result: SearchResult) => {
    console.log('🗑️ DELETE RESULT - Called with:', {
      place_id: result.place_id,
      name: result.name,
      totalSessions: searchSessionsRef.current.length
    });

    // Find and update the session containing this result
    let targetSessionId: string | null = null;
    const updatedSessions = searchSessionsRef.current.map(session => {
      const hasResult = session.results.some(r => r.place_id === result.place_id);
      if (hasResult) {
        targetSessionId = session.id;
        console.log('🗑️ Found result in session:', session.id);
        return {
          ...session,
          results: session.results.filter(r => r.place_id !== result.place_id)
        };
      }
      return session;
    });

    // Remove marker from session's markers array
    if (targetSessionId) {
      const sessionMarkers = sessionMarkersRef.current.get(targetSessionId);
      if (sessionMarkers) {
        const markerIndex = sessionMarkers.findIndex(m => m.title === result.name);
        console.log('🗑️ Marker search in session:', {
          sessionId: targetSessionId,
          markerIndex,
          totalMarkers: sessionMarkers.length
        });

        if (markerIndex !== -1) {
          sessionMarkers[markerIndex].map = null; // Remove from map
          sessionMarkers.splice(markerIndex, 1);
          console.log('🗑️ Marker removed from map');
        }
      }
    }

    // Update sessions state
    setSearchSessions(updatedSessions);

    // Combine all results from all sessions
    const allResults = updatedSessions.flatMap(s => s.results);
    setSearchResults(allResults);

    console.log('🗑️ After delete:', {
      totalResults: allResults.length,
      totalSessions: updatedSessions.length
    });

    // Keep panel visible if ANY results remain
    const hasResults = allResults.length > 0;

    // Notify parent with updated results
    if (onNeighborhoodExplorerUpdate && searchCenterCoordsRef.current) {
      onNeighborhoodExplorerUpdate(
        allResults,
        hasResults,
        {
          textQuery: textQuery,
          radius: searchRadius,
          centerLat: searchCenterCoordsRef.current.lat,
          centerLng: searchCenterCoordsRef.current.lng,
          selectedCategories: selectedCategories
        },
        handleResultClick,
        clearSearchResults,
        (filename) => convertToCSV(filename, allResults),
        (searchName) => handleSaveSearch(searchName, allResults),
        handleSaveLocation,
        handleDeleteResult,
        handleNewSearch,
        handleMarkerTypeChange
      );

      console.log('🗑️ DELETE RESULT - Parent notified');
    }

    toast.success('Place Removed', {
      description: `${result.name} removed from results`,
    });

    console.log('🗑️ DELETE RESULT - Complete');
  };

  const handleMarkerTypeChange = async (result: SearchResult, newType: string) => {
    console.log('🎨 MARKER TYPE CHANGE - Called with:', {
      place_id: result.place_id,
      name: result.name,
      newType,
      oldType: result.customMarkerType || result.types?.[0]
    });

    // Find and update the session containing this result
    const updatedSessions = searchSessionsRef.current.map(session => {
      const hasResult = session.results.some(r => r.place_id === result.place_id);
      if (hasResult) {
        return {
          ...session,
          results: session.results.map(r =>
            r.place_id === result.place_id ? { ...r, customMarkerType: newType } : r
          )
        };
      }
      return session;
    });

    // Update sessions state
    setSearchSessions(updatedSessions);

    // Force ref sync to ensure immediate access to updated state
    searchSessionsRef.current = updatedSessions;

    // Combine all results from all sessions
    const allResults = updatedSessions.flatMap(s => s.results);
    setSearchResults(allResults);

    // Find the marker and update it on the map
    for (const [sessionId, markers] of sessionMarkersRef.current.entries()) {
      const markerIndex = markers.findIndex(m => m.title === result.name);
      if (markerIndex !== -1) {
        const oldMarker = markers[markerIndex];
        const position = oldMarker.position;

        // Remove old marker from map
        oldMarker.map = null;

        // Create new marker with updated type
        try {
          const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

          // Create new marker element with the new type
          const newMarkerElement = createMarkerByType(newType, 46, isDarkMode);

          const location = position && 'lat' in position
            ? (typeof position.lat === 'function' ? { lat: position.lat(), lng: (position as any).lng() } : position as { lat: number; lng: number })
            : null;

          if (location) {
            const newMarker = new AdvancedMarkerElement({
              map,
              content: newMarkerElement,
              position: location,
              title: result.name,
            });

            // Add click listener
            newMarker.addListener('gmp-click', () => {
              showPlaceDetails(newMarker, result);
            });

            // Replace marker in array
            markers[markerIndex] = newMarker;

            console.log('🎨 Marker updated on map:', {
              sessionId,
              markerIndex,
              newType,
              position: location
            });
          }
        } catch (error) {
          console.error('Error updating marker:', error);
        }
        break;
      }
    }

    // Notify parent with updated results
    if (onNeighborhoodExplorerUpdate && searchCenterCoordsRef.current) {
      onNeighborhoodExplorerUpdate(
        allResults,
        true,
        {
          textQuery: textQuery,
          radius: searchRadius,
          centerLat: searchCenterCoordsRef.current.lat,
          centerLng: searchCenterCoordsRef.current.lng,
          selectedCategories: selectedCategories
        },
        handleResultClick,
        clearSearchResults,
        (filename) => convertToCSV(filename, allResults),
        (searchName) => handleSaveSearch(searchName, allResults),
        handleSaveLocation,
        handleDeleteResult,
        handleNewSearch,
        handleMarkerTypeChange
      );
    }

    toast.success('Marker Updated', {
      description: `Marker type changed for ${result.name}`,
    });

    console.log('🎨 MARKER TYPE CHANGE - Complete');
  };

  const handleSaveSearch = async (searchName: string, resultsToSave?: SearchResult[]) => {
    const results = resultsToSave || searchResults;

    if (!searchCenterCoordsRef.current) {
      toast.warning('No Search', {
        description: 'Please perform a search before saving.',
      });
      return;
    }

    if (!searchName || !searchName.trim()) {
      toast.warning('Name Required', {
        description: 'Please enter a name for the search.',
      });
      return;
    }

    // Collect all unique text queries and categories from all search sessions
    const allTextQueries = searchSessionsRef.current
      .map(session => session.textQuery)
      .filter(q => q && q.trim())
      .filter((q, index, self) => self.indexOf(q) === index); // unique values

    const allCategories = searchSessionsRef.current
      .flatMap(session => session.selectedCategories || [])
      .filter((c, index, self) => self.indexOf(c) === index); // unique values

    // Get the average or most common center and radius
    const mostRecentSession = searchSessionsRef.current.length > 0
      ? searchSessionsRef.current[searchSessionsRef.current.length - 1]
      : null;

    const searchRadiusValue = mostRecentSession?.radius || searchRadius;

    // Combine all text queries into a single comma-separated string
    const combinedTextQuery = allTextQueries.length > 0 ? allTextQueries.join(', ') : null;
    const combinedCategories = allCategories.length > 0 ? allCategories.join(',') : null;

    try {
      const api = (await import('../../../services/api')).default;

      const payload = {
        searchName: searchName.trim(),
        textQuery: combinedTextQuery,
        selectedCategories: combinedCategories,
        searchRadius: searchRadiusValue,
        centerLat: searchCenterCoordsRef.current.lat,
        centerLng: searchCenterCoordsRef.current.lng,
        resultCount: results.length
      };

      console.log('Saving neighborhood search with payload:', payload);
      console.log('All search sessions:', searchSessionsRef.current);
      console.log('Combined text queries:', allTextQueries);
      console.log('Combined categories:', allCategories);

      await api.post('/neighborhood-searches/save', payload);

      toast.success('Search Saved', {
        description: `Search "${searchName}" saved successfully with ${results.length} results!`,
      });

      // Clear all searches and close results panel after successful save
      clearSearchResults();

      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Save Failed', {
        description: 'Failed to save search. Please try again.',
      });
    }
  };

  const handleSaveLocation = async (result: SearchResult, locationName: string) => {
    if (!result.geometry?.location) {
      toast.warning('Invalid Location', {
        description: 'This location does not have valid coordinates.',
      });
      return;
    }

    if (!locationName || !locationName.trim()) {
      toast.warning('Name Required', {
        description: 'Please enter a name for the location.',
      });
      return;
    }

    try {
      const api = (await import('../../../services/api')).default;

      // Extract lat/lng - handle both LatLng object and LatLngLiteral
      const location = result.geometry.location;
      const lat: number = typeof location.lat === 'function' ? location.lat() : (location.lat as unknown as number);
      const lng: number = typeof location.lng === 'function' ? location.lng() : (location.lng as unknown as number);

      await api.post('/favorite-locations/save', {
        name: locationName.trim(),
        address: result.formatted_address || result.vicinity || 'Unknown Address',
        lat,
        lng,
        placeId: result.place_id || null,
        placeTypes: result.types ? result.types.join(',') : null
      })

      toast.success('Location Favorited', {
        description: `"${locationName}" added to your favorites!`,
      });
    } catch (error) {
      console.error('Error saving favorite location:', error);
      toast.error('Save Failed', {
        description: 'Failed to save favorite location. Please try again.',
      });
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip open={showPulsatingTooltip ? true : undefined} delayDuration={showPulsatingTooltip ? 0 : 700}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className={`h-10 w-10 ${shouldPulsate ? 'pulsating-button' : ''}`}
                style={{
                  backgroundColor: '#3e5d80',
                  color: 'white',
                  borderColor: '#3e5d80'
                }}
              >
                <Binoculars className={`h-6 w-6 ${shouldPulsate ? 'icon' : ''}`} />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="left" className={showPulsatingTooltip ? 'pulsating-tooltip' : ''}>
            <p>Neighborhood Explorer</p>
          </TooltipContent>
        </Tooltip>
      <DialogContent className="sm:max-w-[425px]">
        {isPlacingMarker ? (
          /* Placing Marker Mode */
          <>
            <DialogHeader>
              <DialogTitle>Place Search Marker</DialogTitle>
              <DialogDescription>
                Drag the 🤔 marker on the map to your desired search center location
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="placement-info space-y-2 text-sm">
                <p><strong>TextQuery:</strong> {textQuery}</p>
                <p><strong>Radius:</strong> {searchRadius} meters</p>
              </div>
              <div className="placement-actions flex gap-2">
                <Button
                  onClick={performTextQuerySearch}
                  size="sm"
                  className="bg-map-green hover:bg-[#1a4a17] text-white flex-1 transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Search
                </Button>
                <Button
                  onClick={cancelMarkerPlacement}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Normal Search Mode */
          <>
            <DialogHeader>
              <DialogTitle>Neighboorhood Explorer</DialogTitle>
              <DialogDescription>
                Search for places near a location on the map
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                <Checkbox
                  id="mock-data"
                  checked={useMockData}
                  onCheckedChange={(checked) => setUseMockData(checked as boolean)}
                />
                <Label
                  htmlFor="mock-data"
                  className="text-sm font-medium cursor-pointer"
                >
                  Use Mock Data (avoid API costs)
                </Label>
              </div>
              <div className="space-y-3">
                <div className="search-input-group">
                  <Input
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g., grocery store, coffee shop..."
                    className="w-full"
                  />
                </div>

                {/* Category MultiSelect */}
                <div className="category-select space-y-2">
                  <Label className="text-sm font-medium">
                    Browse by Category (optional)
                  </Label>
                  <MultiSelect
                    options={categoriesToOptions()}
                    value={selectedCategories}
                    onValueChange={setSelectedCategories}
                    placeholder="Select categories..."
                    maxCount={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use text search for specific places, or browse by category for general exploration
                  </p>
                </div>
              </div>

              {/* Active Search Sessions Display */}
              {searchSessions.length > 0 && (
                <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Active Searches ({searchSessions.length})</h4>
                    <Button
                      onClick={clearAllSessions}
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {searchSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                        style={{ borderLeft: `3px solid ${session.color}` }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {session.textQuery}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.results.length} results • {session.radius}m
                            {session.isMockData && ' • Mock'}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteSession(session.id)}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="search-controls space-y-4">
                <div className="radius-control-wrapper flex flex-col gap-2">
                  <div className="text-sm font-medium text-left">
                    Search Radius: {searchRadius}m
                  </div>
                  <Slider
                    id="radius"
                    min={100}
                    max={5000}
                    step={100}
                    value={[searchRadius]}
                    onValueChange={(value) => setSearchRadius(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>100m</span>
                    <span>5km</span>
                  </div>
                </div>

                <div className="opacity-control space-y-2">
                  <Label htmlFor="opacity" className="text-sm font-medium">
                    Circle Opacity: {Math.round(circleOpacity * 100)}%
                  </Label>
                  <Slider
                    id="opacity"
                    min={0}
                    max={100}
                    step={5}
                    value={[circleOpacity * 100]}
                    onValueChange={(value) => {
                      const opacity = value[0] / 100;
                      setCircleOpacity(opacity);
                      setCircleBorderOpacity(Math.min(1, opacity + 0.3)); // Border slightly more visible
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Transparent</span>
                    <span>Solid</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={startMarkerPlacement}
                  disabled={!textQuery.trim() && selectedCategories.length === 0}
                  className="flex-1 bg-map-green hover:bg-[#1a4a17] text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default NeighborhoodExplorerCard;
