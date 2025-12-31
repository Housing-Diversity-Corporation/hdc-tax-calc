import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';

interface FeatureData {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
  priority: number;
  feature?: google.maps.Data.Feature;
}

interface RightPanelProps {
  visible: boolean;
  onClose: () => void;
  features: FeatureData[];
  onSetPriority: (layerId: string, priority: number) => void;
  layerHierarchy: Map<string, number>;
  onHighlightFeature?: (layerId: string, feature?: google.maps.Data.Feature) => void;
}

const formatKey = (key: string): string => {
  if (typeof key !== 'string' || key.length === 0) return '';
  const words = key.split('_');
  const capitalizedWords = words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  return capitalizedWords.join(' ');
};

const RightPanel: React.FC<RightPanelProps> = ({
  visible,
  onClose,
  features,
  onSetPriority,
  layerHierarchy,
  onHighlightFeature
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [parcelData, setParcelData] = useState<{ [layerId: string]: Record<string, string | number | boolean> }>({});

  // Sort features by priority (higher priority = shown on top)
  const sortedFeatures = [...features].sort((a, b) => b.priority - a.priority);

  // Create a stable identifier for the top feature to use as dependency
  const topFeatureId = sortedFeatures.length > 0 ? sortedFeatures[0].layerId : null;
  const topFeature = sortedFeatures.length > 0 ? sortedFeatures[0].feature : null;

  // Highlight the top feature when features change or order changes
  useEffect(() => {
    if (visible && sortedFeatures.length > 0 && onHighlightFeature) {
      onHighlightFeature(sortedFeatures[0].layerId, sortedFeatures[0].feature);
    }
  }, [visible, topFeatureId, topFeature, onHighlightFeature]); // Track both ID and feature

  // Fetch King County parcel data for KC Parcels layer
  useEffect(() => {
    if (!visible) return;

    const fetchParcelDataForLayers = async () => {
      // Dynamically import api to use the configured base URL
      const api = (await import('../services/api')).default;

      for (const feature of features) {
        if (feature.layerId === 'King County Parcels' && feature.properties.pin) {
          try {
            const response = await api.get(`/geodata/proxy/parcel-info?pin=${feature.properties.pin}`);
            const data = response.data;
            if (data.items && data.items.length > 0) {
              setParcelData(prev => ({
                ...prev,
                [feature.layerId]: data.items[0]
              }));
            }
          } catch (error) {
            console.error('Error fetching parcel data:', error);
          }
        }
      }
    };
    fetchParcelDataForLayers();
  }, [visible, features]);

  if (!visible) return null;

  const handlePriorityChange = (layerId: string, direction: 'up' | 'down') => {
    const currentPriority = layerHierarchy.get(layerId) || 0;
    const newPriority = direction === 'up' ? currentPriority + 1 : currentPriority - 1;
    onSetPriority(layerId, newPriority);

    // After priority change, the useEffect will automatically highlight the new top feature
    // due to the topFeatureId dependency change
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Swap priorities
    const draggedFeature = sortedFeatures[draggedIndex];
    const droppedFeature = sortedFeatures[dropIndex];

    onSetPriority(draggedFeature.layerId, droppedFeature.priority);
    onSetPriority(droppedFeature.layerId, draggedFeature.priority);

    setDraggedIndex(null);
  };

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      height: '100vh',
      width: '400px',
      backgroundColor: 'var(--surface-ground)',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      zIndex: 2000,
      overflowY: 'auto',
      padding: '20px',
      transition: 'transform 0.3s ease-in-out',
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--surface-border)'
      }}>
        <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.2rem' }}>
          Overlapping Features
        </h2>
        <Button
          icon="pi pi-times"
          onClick={onClose}
          text
          rounded
          severity="secondary"
        />
      </div>

      {sortedFeatures.length === 0 ? (
        <p style={{ color: 'var(--text-color-secondary)' }}>
          Click on a feature to see details
        </p>
      ) : (
        <>
          <p style={{
            color: 'var(--text-color-secondary)',
            fontSize: '0.9rem',
            marginBottom: '15px'
          }}>
            {sortedFeatures.length} feature{sortedFeatures.length > 1 ? 's' : ''} at this location
          </p>

          {sortedFeatures.map((feature, index) => (
            <Card
              key={`${feature.layerId}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                marginBottom: '15px',
                border: index === 0 ? '3px solid #7fbd45' : '1px solid #3e5d80',
                backgroundColor: index === 0 ? 'var(--primary-color-alpha-10)' : 'var(--surface-card)',
                cursor: 'grab',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                onClick={() => {
                  // Allow manual highlighting by clicking on the card
                  if (onHighlightFeature) {
                    onHighlightFeature(feature.layerId, feature.feature);
                  }
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <h3 style={{
                  margin: 0,
                  color: 'var(--text-color)',
                  fontSize: '1rem'
                }}>
                  {feature.layerName}
                  {index === 0 && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.75rem',
                      color: '#7fbd45',
                      fontWeight: 'bold'
                    }}>
                      TOP
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <Button
                    icon="pi pi-arrow-up"
                    size="small"
                    text
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePriorityChange(feature.layerId, 'up');
                    }}
                    tooltip="Move layer up"
                    tooltipOptions={{ position: 'left' }}
                    style={{ color: '#92c3c2' }}
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    size="small"
                    text
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePriorityChange(feature.layerId, 'down');
                    }}
                    tooltip="Move layer down"
                    tooltipOptions={{ position: 'left' }}
                    style={{ color: '#92c3c2' }}
                  />
                </div>
              </div>

              <Divider />

              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                fontSize: '0.85rem'
              }}>
                {/* Show King County parcel data if available */}
                {feature.layerId === 'King County Parcels' && parcelData[feature.layerId] && (
                  <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'var(--surface-50)', borderRadius: '4px' }}>
                    <strong style={{ color: 'var(--primary-color)' }}>King County Parcel Info:</strong>
                    {Object.entries(parcelData[feature.layerId]).map(([key, value]) => (
                      <div key={key} style={{ marginTop: '4px' }}>
                        <strong style={{ color: 'var(--text-color)', fontSize: '0.8rem' }}>{key}:</strong>{' '}
                        <span style={{ color: 'var(--text-color-secondary)', fontSize: '0.8rem' }}>
                          {value?.toString() || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {Object.entries(feature.properties)
                  .filter(([key]) => key !== 'geom' && key !== 'geometry')
                  .map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        marginBottom: '8px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                      }}
                    >
                      <strong style={{ color: 'var(--text-color)' }}>
                        {formatKey(key)}:
                      </strong>
                      <span style={{
                        color: 'var(--text-color-secondary)',
                        wordBreak: 'break-word'
                      }}>
                        {value?.toString() || 'N/A'}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};

export default RightPanel;
