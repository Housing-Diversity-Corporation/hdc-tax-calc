import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import LoadingSpinner from './LoadingSpinner';
import { Message } from 'primereact/message';
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

interface SavedKeywordSearch {
  id: number;
  searchName: string;
  keyword: string;
  searchRadius: number;
  centerLat: number;
  centerLng: number;
  resultCount: number;
  createdAt: string;
}

interface SavedPlacesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLocation?: (lat: number, lng: number, name: string) => void;
  onRunKeywordSearch?: (keyword: string, radius: number, centerLat: number, centerLng: number) => void;
}

const SavedPlacesPanel: React.FC<SavedPlacesPanelProps> = ({
  isOpen,
  onClose,
  onNavigateToLocation,
  onRunKeywordSearch
}) => {
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([]);
  const [savedKeywordSearches, setSavedKeywordSearches] = useState<SavedKeywordSearch[]>([]);
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
          api.get<SavedKeywordSearch[]>('/keyword-searches'),
        ]);

        setFavoriteLocations(locationsResponse.data);
        setSavedKeywordSearches(searchesResponse.data);
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
      onNavigateToLocation(location.lat, location.lng, location.name);
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

  const handleKeywordSearchClick = (search: SavedKeywordSearch) => {
    if (onRunKeywordSearch) {
      onRunKeywordSearch(search.keyword, search.searchRadius, search.centerLat, search.centerLng);
    }
    onClose();
  };

  const handleDeleteKeywordSearch = async (searchId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage saved searches.');
      return;
    }

    try {
      await api.delete(`/keyword-searches/${searchId}`);
      setSavedKeywordSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (error) {
      console.error('Error deleting keyword search:', error);
      alert('Failed to delete saved search.');
    }
  };

  const buttonStyle = {
    backgroundColor: 'transparent',
    color: 'var(--text-color)',
    border: '1px solid var(--surface-border)',
    width: '100%',
    marginBottom: '8px',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  };

  const listContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  };

  return (
    <Sidebar
      visible={isOpen}
      position="right"
      onHide={onClose}
      className="w-full md:w-20rem lg:w-25rem"
      style={{
        backgroundColor: 'var(--surface-ground)',
        borderLeft: '1px solid var(--surface-border)',
      }}
    >
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>Saved Places</h1>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Message severity="error" text={error} />
      ) : (
        <>
          <h3 className="mt-4">Favorite Locations</h3>
          {favoriteLocations.length > 0 ? (
            <div style={listContainerStyle}>
              {favoriteLocations.map((location) => (
                <div key={location.id} style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    label={`${location.name} - ${location.address}`}
                    onClick={() => handleLocationClick(location)}
                    style={{ ...buttonStyle, flex: 1 }}
                    className="p-button-outlined p-button-secondary"
                  />
                  <Button
                    icon="pi pi-trash"
                    onClick={() => handleDeleteFavoriteLocation(location.id)}
                    className="p-button-danger p-button-outlined"
                    tooltip="Delete location"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No favorite locations yet.</p>
          )}

          <h3 className="mt-4">Saved Keyword Searches</h3>
          {savedKeywordSearches.length > 0 ? (
            <div style={listContainerStyle}>
              {savedKeywordSearches.map((search) => (
                <div key={search.id} style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    label={`${search.searchName} (${search.resultCount} results)`}
                    onClick={() => handleKeywordSearchClick(search)}
                    style={{ ...buttonStyle, flex: 1 }}
                    className="p-button-outlined p-button-secondary"
                  />
                  <Button
                    icon="pi pi-trash"
                    onClick={() => handleDeleteKeywordSearch(search.id)}
                    className="p-button-danger p-button-outlined"
                    tooltip="Delete search"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No saved keyword searches yet.</p>
          )}
        </>
      )}
    </Sidebar>
  );
};

export default SavedPlacesPanel;
