import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import type { GeoJsonFeatureCollection } from '../../../types/map/geojson';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '../LoadingSpinner';
import axios from 'axios';
import { X, Eye, Trash2, Layers } from 'lucide-react';
import { useContainerWidth, useResponsiveText } from '../../../hooks/useResponsiveText';
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
          // console.log('Fetching favorites and intersections...');

          const [layersResponse, intersectionsResponse] = await Promise.all([
            api.get<string[]>('/favorites/layers'),
            api.get<SavedIntersection[]>('/intersections'),
          ]);

          const layers = layersResponse.data.map(id => ({ id }));
          setFavoriteLayers(layers);
          setSavedIntersections(intersectionsResponse.data);
          // console.log('Successfully fetched data');
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

  const listContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const ResponsiveLayerItem: React.FC<{ layer: FavoriteLayer }> = ({ layer }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    // Subtract icon width (16px) + icon margin (8px) = 24px
    const textWidth = width > 0 ? width - 24 : 0;
    const { displayText, fontSize } = useResponsiveText(layer.id, textWidth, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <div className="flex gap-2 mb-2">
        <Button
          variant="outline"
          className="flex-1 justify-start overflow-hidden min-w-0 px-3"
          onClick={() => handleLayerClick(layer.id)}
        >
          <Layers className="mr-2 h-4 w-4 flex-shrink-0" />
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
          onClick={() => handleDeleteFavoriteLayer(layer.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  };

  const ResponsiveIntersectionItem: React.FC<{ intersection: SavedIntersection }> = ({ intersection }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${intersection.name} (${new Date(intersection.created_at).toLocaleDateString()})`;
    // Subtract icon width (16px) + icon margin (8px) = 24px
    const textWidth = width > 0 ? width - 24 : 0;
    const { displayText, fontSize } = useResponsiveText(fullText, textWidth, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <div className="flex gap-2 mb-2">
        <Button
          variant="outline"
          className="flex-1 justify-start text-left overflow-hidden min-w-0 px-3"
          onClick={() => handleIntersectionClick(intersection.id)}
        >
          <Eye className="mr-2 h-4 w-4 flex-shrink-0" />
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
          onClick={() => handleDeleteIntersection(intersection.id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    return (
      <>
        <h3 className="mt-4 mb-2 font-semibold">Favorite Layers</h3>
        {favoriteLayers.length > 0 ? (
          <div style={listContainerStyle}>
            {favoriteLayers.map(layer => (
              <ResponsiveLayerItem key={layer.id} layer={layer} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No favorite layers yet.</p>
        )}

        <h3 className="mt-6 mb-2 font-semibold">Saved Intersections</h3>
        {savedIntersections.length > 0 ? (
          <div style={listContainerStyle}>
            {savedIntersections.map(intersection => (
              <ResponsiveIntersectionItem key={intersection.id} intersection={intersection} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No saved intersections yet.</p>
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col favorites-panel">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">My Favorites</h2>
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
          {renderContent()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default FavoritesPanel;