import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchCardProps {
  map: google.maps.Map | null;
  onPlaceSelected?: (place: google.maps.places.Place) => void;
}

const SearchCard: React.FC<SearchCardProps> = ({ map, onPlaceSelected }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteElementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const { isDarkMode } = useTheme();
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    // Capture the container ref value at the start of the effect
    const container = containerRef.current;

    const initializeAutocomplete = async () => {
      if (!map || !container) return;

      try {
        // Import the Places library
        await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        // Create the new PlaceAutocompleteElement
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({});

        // Style the element to match our design
        placeAutocomplete.id = 'place-autocomplete-input';

        // Clear any existing autocomplete element
        if (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        // Add it to our container
        container.appendChild(placeAutocomplete);

        // Set color scheme for proper text colors
        const colorScheme = isDarkMode ? 'dark' : 'light';
        placeAutocomplete.style.colorScheme = colorScheme;

        // Set placeholder text using internal input element
        setTimeout(() => {
          const placeholderText = 'Search for a location...';
          // Access internal input via Dg property (undocumented but works)
          const elementWithInternals = placeAutocomplete as unknown as Record<string, unknown>;
          const internalInput = elementWithInternals.Dg;

          if (internalInput && typeof internalInput === 'object' && 'setAttribute' in internalInput) {
            (internalInput as HTMLElement).setAttribute('placeholder', placeholderText);
          } else {
            // Fallback: try setting on the element itself
            placeAutocomplete.setAttribute('placeholder', placeholderText);
          }
        }, 300);

        // Handle place selection for gmp-select event
        const handlePlaceSelection = async (event: Event & { Fg?: unknown; Dg?: unknown; place?: unknown; detail?: { place?: unknown } }) => {
          // Try multiple possible locations for the place data
          const eventObj = event as unknown as Record<string, unknown>;
          let place = event.Fg || event.Dg || event.place || event.detail?.place;

          // If still not found, search through all properties for an object with place-like properties
          if (!place) {
            for (const key in eventObj) {
              const value = eventObj[key];
              if (value && typeof value === 'object' && ('toPlace' in (value as object) || 'location' in (value as object) || 'displayName' in (value as object))) {
                place = value;
                console.log(`Found place data in event.${key}`);
                break;
              }
            }
          }

          if (!place) {
            console.warn('No place found in event. Event structure:', event);
            console.warn('Event keys:', Object.keys(eventObj));
            return;
          }
          console.log('Place selected:', place);

          try {
            const placeObj = place as Record<string, unknown>;
            let location = (placeObj.location as google.maps.LatLng) || ((placeObj.geometry as Record<string, unknown>)?.location as google.maps.LatLng);
            let displayName = (placeObj.displayName as string) || (placeObj.name as string);
            let formattedAddress = (placeObj.formattedAddress as string) || (placeObj.formatted_address as string);
            let viewport = placeObj.viewport as google.maps.LatLngBounds;

            // If it's a placePrediction, convert to place
            if (placeObj.toPlace && typeof placeObj.toPlace === 'function') {
              console.log('Converting placePrediction to place...');
              const fullPlace = await placeObj.toPlace();
              console.log('Full place object before fetchFields:', fullPlace);

              await fullPlace.fetchFields({
                fields: ['displayName', 'formattedAddress', 'location', 'viewport']
              });

              console.log('Full place object after fetchFields:', fullPlace);

              location = fullPlace.location;
              displayName = fullPlace.displayName;
              formattedAddress = fullPlace.formattedAddress;
              viewport = fullPlace.viewport;
              console.log('Place converted successfully:', { location, displayName, formattedAddress });
            }

            if (!location) {
              console.error('No location found for place. Place object:', placeObj);
              console.error('Attempted to extract location from:', {
                'placeObj.location': placeObj.location,
                'placeObj.geometry': placeObj.geometry
              });
              return;
            }

            // Update map view
            if (viewport) {
              map.fitBounds(viewport);
            } else {
              map.setCenter(location);
              map.setZoom(17);
            }

            // Create a place object for the callback
            const placeForCallback = {
              location,
              displayName,
              formattedAddress
            };

            // Call the callback to create marker in MapContainer
            if (onPlaceSelected) {
              onPlaceSelected(placeForCallback as google.maps.places.Place);
            }
          } catch (err) {
            console.error('Error processing place:', err);
          }
        };

        // Add event listener for place selection
        placeAutocomplete.addEventListener('gmp-select', handlePlaceSelection);


        autocompleteElementRef.current = placeAutocomplete;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    initializeAutocomplete();

    // Cleanup
    return () => {
      // Use the captured container variable from the effect scope
      const autocompleteElement = autocompleteElementRef.current;
      
      if (autocompleteElement && container) {
        try {
          container.removeChild(autocompleteElement);
        } catch {
          // Element might already be removed
        }
        autocompleteElementRef.current = null;
      }
    };
  }, [map, onPlaceSelected, isDarkMode]);

  const handleIconClick = () => {
    setShowAutocomplete(true);
    // Focus the input after showing
    setTimeout(() => {
      const input = containerRef.current?.querySelector('input');
      if (input) input.focus();
    }, 100);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Only hide if focus is leaving the autocomplete entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setShowAutocomplete(false);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const button = document.querySelector('.search-icon-button');
        if (button && !button.contains(event.target as Node)) {
          setShowAutocomplete(false);
        }
      }
    };

    if (showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAutocomplete]);

  return (
    <TooltipProvider>
      <div className="search-card-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Search Icon Button - only shown in narrow mode */}
        <Tooltip open={showAutocomplete ? false : undefined}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleIconClick}
              className="h-[40px] w-[40px] flex-shrink-0 search-icon-button"
              style={{
                backgroundColor: isDarkMode ? 'hsl(180 30% 8%)' : 'hsl(180 50% 98%)',
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Search for a location</p>
          </TooltipContent>
        </Tooltip>

        {/* Single Autocomplete Card - responsive behavior via CSS */}
        <div
          className="place-autocomplete-card search-card-responsive"
          ref={containerRef}
          onBlur={handleBlur}
          style={{
            '--gmp-primary-color': isDarkMode ? '#ffffff' : '#000000',
            backgroundColor: isDarkMode ? 'hsl(180 30% 8%)' : 'hsl(180 50% 98%)',
            borderRadius: '8px',
            display: showAutocomplete ? 'block' : 'none',
          } as React.CSSProperties}
        >
          {/* The PlaceAutocompleteElement will be inserted here */}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SearchCard;