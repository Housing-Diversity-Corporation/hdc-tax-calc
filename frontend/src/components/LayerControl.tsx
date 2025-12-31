import React from 'react';
import { InputSwitch } from 'primereact/inputswitch';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
}

interface LayerControlProps {
  layer: LayerConfig;
  onToggle: (layerId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (layerId: string) => void;
}

const LayerControl: React.FC<LayerControlProps> = ({ layer, onToggle, isFavorite, onToggleFavorite }) => {
  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
    padding: '8px 4px',
    maxWidth: '100%',
  };

  const textStyle: React.CSSProperties = {
    fontSize: 'inherit',
    lineHeight: '1.4',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    flex: 1,
    minWidth: 0,
  };

  const infoIconStyle: React.CSSProperties = {
    marginLeft: '6px',
    cursor: 'pointer',
    color: '#7fbd45',
    fontWeight: 'bold',
    fontSize: '14px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '1px solid #7fbd45',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  };

  const favoriteButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 'auto',
    fontSize: '20px',
    color: isFavorite ? 'gold' : 'lightgray',
  };


  return (
    <>
      <label style={labelStyle}>
        <InputSwitch
          checked={layer.enabled}
          disabled={layer.loading}
          onChange={() => onToggle(layer.id)}
          pt={{
            slider: {
              style: {
                background: layer.enabled ? '#7fbd45' : undefined,
              },
            },
          }}
        />
        <span className='label-text' style={textStyle}>
          {layer.name}
          {layer.loading && ' (Loading...)'}
        </span>
        <button style={favoriteButtonStyle} onClick={() => onToggleFavorite(layer.id)}>
          {isFavorite ? '★' : '☆'}
        </button>
        <span 
          style={infoIconStyle}
          data-tooltip-id={`tooltip-${layer.id}`}
          data-tooltip-content={`${layer.name}: ${layer.description}`}
        >
          i
        </span>
      </label>
      <Tooltip 
        id={`tooltip-${layer.id}`}
        place="right"
        style={{
          zIndex: 10000,
        }}
      />
    </>
  );
};

export default LayerControl;