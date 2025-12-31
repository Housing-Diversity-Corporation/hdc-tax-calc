import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '../LoadingSpinner';
import axios from 'axios';
import { MapPin, Trash2, Search, X } from 'lucide-react';
import { useContainerWidth, useResponsiveText } from '../../../hooks/useResponsiveText';
import './SavedPlacesPanel.css';

interface FavoriteLocation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  placeTypes: string;
  createdAt: string;
}

interface SavedNeighborhoodExplorer {
  id: number;
  searchName: string;
  textQuery?: string;
  selectedCategories?: string;
  searchRadius: number;
  centerLat: number;
  centerLng: number;
  centerAddress?: string;
  resultCount: number;
  createdAt: string;
}

interface SavedPlacesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLocation?: (lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void;
  onRunNeighborhoodExplorer?: (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void;
}

const SavedPlacesPanel: React.FC<SavedPlacesPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToLocation,
  onRunNeighborhoodExplorer
}) => {
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([]);
  const [savedNeighborhoodExplorers, setSavedNeighborhoodExploreres] = useState<SavedNeighborhoodExplorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [locationsResponse, searchesResponse] = await Promise.all([
          api.get<FavoriteLocation[]>('/favorite-locations'),
          api.get<SavedNeighborhoodExplorer[]>('/neighborhood-searches'),
        ]);

        setFavoriteLocations(locationsResponse.data);
        setSavedNeighborhoodExploreres(searchesResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching saved places:', err);
        setError('Failed to load saved places');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSavedPlaces();
    }
  }, [isOpen]);

  const handleLocationClick = (location: FavoriteLocation) => {
    if (onNavigateToLocation) {
      onNavigateToLocation(
        location.lat,
        location.lng,
        location.name,
        location.address,
        location.placeId,
        location.placeTypes
      );
    }
    onClose();
  };

  const handleDeleteFavoriteLocation = async (locationId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage favorite locations.');
      return;
    }

    try {
      await api.delete(`/favorite-locations/${locationId}`);
      setFavoriteLocations(prev => prev.filter(l => l.id !== locationId));
    } catch (error) {
      console.error('Error deleting favorite location:', error);
      alert('Failed to delete favorite location.');
    }
  };

  const handleNeighborhoodExplorerClick = (search: SavedNeighborhoodExplorer) => {
    if (onRunNeighborhoodExplorer) {
      const categories = search.selectedCategories ? search.selectedCategories.split(',') : undefined;
      onRunNeighborhoodExplorer(search.textQuery, categories, search.searchRadius, search.centerLat, search.centerLng);
    }
    onClose();
  };

  const handleDeleteNeighborhoodExplorer = async (searchId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage saved searches.');
      return;
    }

    try {
      await api.delete(`/neighborhood-searches/${searchId}`);
      setSavedNeighborhoodExploreres(prev => prev.filter(s => s.id !== searchId));
    } catch (error) {
      console.error('Error deleting neighborhood search:', error);
      alert('Failed to delete saved search.');
    }
  };

  const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  };

  const ResponsiveFavoriteLocationItem: React.FC<{ location: FavoriteLocation }> = ({ location }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${location.name} ${location.address}`;
    // Subtract icon width (16px) + icon margin (8px) = 24px
    const textWidth = width > 0 ? width - 24 : 0;
    const { displayText, fontSize } = useResponsiveText(fullText, textWidth, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <div key={location.id} className="flex gap-2 mb-2">
        <Button
          variant="outline"
          className="flex-1 justify-start overflow-hidden min-w-0 px-3"
          onClick={() => handleLocationClick(location)}
        >
          <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
          <div ref={ref} className="flex-1 overflow-hidden min-w-0">
            <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
              {displayText}
            </span>
          </div>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => handleDeleteFavoriteLocation(location.id)}
          title="Delete location"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  };

  const ResponsiveNeighborhoodExplorerItem: React.FC<{ search: SavedNeighborhoodExplorer }> = ({ search }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${search.searchName} (${search.resultCount} results)`;
    // Subtract icon width (16px) + icon margin (8px) = 24px
    const textWidth = width > 0 ? width - 24 : 0;
    const { displayText, fontSize } = useResponsiveText(fullText, textWidth, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <div key={search.id} className="flex gap-2 mb-2">
        <Button
          variant="outline"
          className="flex-1 justify-start overflow-hidden min-w-0 px-3"
          onClick={() => handleNeighborhoodExplorerClick(search)}
        >
          <Search className="mr-2 h-4 w-4 flex-shrink-0" />
          <div ref={ref} className="flex-1 overflow-hidden min-w-0">
            <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
              {displayText}
            </span>
          </div>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => handleDeleteNeighborhoodExplorer(search.id)}
          title="Delete search"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col saved-places-panel">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Saved Places</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          title="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <h3 className="mt-4 mb-2 font-semibold">Favorite Locations</h3>
              {favoriteLocations.length > 0 ? (
                <div style={listContainerStyle}>
                  {favoriteLocations.map((location) => (
                    <ResponsiveFavoriteLocationItem key={location.id} location={location} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No favorite locations yet.</p>
              )}

              <h3 className="mt-6 mb-2 font-semibold">Neighboorhood Searches</h3>
              {savedNeighborhoodExplorers.length > 0 ? (
                <div style={listContainerStyle}>
                  {savedNeighborhoodExplorers.map((search) => (
                    <ResponsiveNeighborhoodExplorerItem key={search.id} search={search} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No neighoborhood searches yet.</p>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SavedPlacesPanel;
