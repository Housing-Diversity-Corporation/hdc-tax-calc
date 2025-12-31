import React, { useState, useEffect } from 'react';
import api from '../services/api';
import type { GeoJsonFeatureCollection } from '../types/geojson';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import LoadingSpinner from './LoadingSpinner';
import { Message } from 'primereact/message';
import axios from 'axios';
import './FavoritesPanel.css';

interface FavoriteLayer {
  id: string;
}

interface SavedIntersection {
  id: number;
  name: string;
  created_at: string;
}

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDisplayIntersection: ((geoJsonData: GeoJsonFeatureCollection) => void) | null;
  onToggleLayer: ((layerId: string) => void) | null;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({ isOpen, onClose, onDisplayIntersection, onToggleLayer }) => {
  const [favoriteLayers, setFavoriteLayers] = useState<FavoriteLayer[]>([]);
  const [savedIntersections, setSavedIntersections] = useState<SavedIntersection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIntersectionClick = async (intersectionId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to access saved intersections.');
      return;
    }

    try {
      const response = await api.get<{ intersection_result: string }>(`/intersections/${intersectionId}`);
      const intersectionResult = JSON.parse(response.data.intersection_result);
      if (onDisplayIntersection) {
        onDisplayIntersection(intersectionResult);
      }
      onClose(); // Close the panel after displaying the intersection
    } catch (error) {
      console.error('Error fetching intersection:', error);
      alert('Failed to fetch intersection data.');
    }
  };

  const handleLayerClick = (layerId: string) => {
    if (onToggleLayer) {
      onToggleLayer(layerId);
    }
    onClose();
  };

  const handleDeleteFavoriteLayer = async (layerId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage favorite layers.');
      return;
    }

    try {
      await api.delete(`/favorites/layers/${layerId}`);
      setFavoriteLayers(prev => prev.filter(l => l.id !== layerId));
    } catch (error) {
      console.error('Error deleting favorite layer:', error);
      alert('Failed to delete favorite layer.');
    }
  };

  const handleDeleteIntersection = async (intersectionId: number) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please sign in to manage saved intersections.');
      return;
    }

    try {
      await api.delete(`/intersections/${intersectionId}`);
      setSavedIntersections(prev => prev.filter(i => i.id !== intersectionId));
    } catch (error) {
      console.error('Error deleting intersection:', error);
      alert('Failed to delete intersection.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please sign in to view favorites.');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          console.log('Fetching favorites and intersections...');

          const [layersResponse, intersectionsResponse] = await Promise.all([
            api.get<string[]>('/favorites/layers'),
            api.get<SavedIntersection[]>('/intersections'),
          ]);

          const layers = layersResponse.data.map(id => ({ id }));
          setFavoriteLayers(layers);
          setSavedIntersections(intersectionsResponse.data);
          console.log('Successfully fetched data');
        } catch (err) {
          console.error('Error fetching favorites data:', err);
          if (axios.isAxiosError(err) && err.response?.status === 403) {
            setError('Authentication failed. Please sign in again.');
          } else {
            setError('Failed to fetch favorites.');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  const buttonStyle = {
    backgroundColor: 'transparent',
    color: 'var(--text-color)',
    border: '1px solid var(--surface-border)',
    width: '100%',
    marginBottom: '8px',
    textAlign: 'left' as const,
    transition: 'all 0.2s ease',
  };

  const listContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const textWrapPt = {
    label: { style: { whiteSpace: 'normal', wordBreak: 'break-all' } }
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return <Message severity="error" text={error} className="w-full" />;
    }
    return (
      <>
        <h2>Favorite Layers</h2>
        {favoriteLayers.length > 0 ? (
          <div style={listContainerStyle}>
            {favoriteLayers.map(layer => (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px' }} key={layer.id}>
                <Button
                  label={layer.id}
                  className="p-button-outlined p-button-secondary"
                  style={{ ...buttonStyle, flexGrow: 1, marginRight: '8px' }}
                  onClick={() => handleLayerClick(layer.id)}
                  pt={textWrapPt}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger p-button-text"
                  onClick={() => handleDeleteFavoriteLayer(layer.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p>No favorite layers yet.</p>
        )}

        <h2 className="mt-4">Saved Intersections</h2>
        {savedIntersections.length > 0 ? (
          <div style={listContainerStyle}>
            {savedIntersections.map(intersection => (
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px' }} key={intersection.id}>
                <Button
                  label={`${intersection.name} (created at ${new Date(intersection.created_at).toLocaleDateString()})`}
                  className="p-button-outlined p-button-secondary"
                  style={{ ...buttonStyle, flexGrow: 1, marginRight: '8px' }}
                  onClick={() => handleIntersectionClick(intersection.id)}
                  pt={textWrapPt}
                />
                <Button
                  icon="pi pi-trash"
                  className="p-button-rounded p-button-danger p-button-text"
                  onClick={() => handleDeleteIntersection(intersection.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p>No saved intersections yet.</p>
        )}
      </>
    );
  };

  return (
    <Sidebar
      visible={isOpen}
      onHide={onClose}
      position="right"
      className="w-full md:w-20rem lg:w-25rem"
      style={{
        backgroundColor: 'var(--surface-ground)',
        borderLeft: '1px solid var(--surface-border)',
      }}
    >
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>My Favorites</h1>
      <div className="p-3">
        {renderContent()}
      </div>
    </Sidebar>
  );
};

export default FavoritesPanel;