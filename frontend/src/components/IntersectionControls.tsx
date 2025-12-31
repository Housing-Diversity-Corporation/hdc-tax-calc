import React from 'react';

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  apiTableId?: string;
  data?: unknown[];
  intersectionData?: unknown;
}

interface IntersectionControlsProps {
  layers: LayerConfig[];
  onIntersection: () => void;
  onSaveIntersection: () => void;
  onExportCsv: () => void;
  isIntersecting?: boolean;
}

const IntersectionControls: React.FC<IntersectionControlsProps> = ({
  layers,
  onIntersection,
  onSaveIntersection,
  onExportCsv,
  isIntersecting
}) => {
  const enabledLayers = layers.filter(layer => layer.enabled);
  const showIntersectionButton = enabledLayers.length > 1;
  const hasIntersectionResults = layers.some(layer => layer.id === 'intersection' && layer.enabled);

  if (!showIntersectionButton && !hasIntersectionResults) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '50px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {showIntersectionButton && (
        <button
          onClick={onIntersection}
          disabled={isIntersecting}
          style={{
            padding: '12px 15px',
            backgroundColor: isIntersecting ? '#cccccc' : '#bfb05e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isIntersecting ? 'not-allowed' : 'pointer',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.9)',
            minWidth: '80px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          {isIntersecting ? '...' : 'Intersect'}
        </button>
      )}
      
      {hasIntersectionResults && (
        <>
          <button
            onClick={onSaveIntersection}
            style={{
              padding: '12px 15px',
              backgroundColor: '#734968',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.9)',
              minWidth: '80px',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            Save
          </button>
          <button
            onClick={onExportCsv}
            style={{
              padding: '12px 15px',
              backgroundColor: '#43778a',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,.9)',
              minWidth: '80px',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            Export CSV
          </button>
        </>
      )}
    </div>
  );
};

export default IntersectionControls;