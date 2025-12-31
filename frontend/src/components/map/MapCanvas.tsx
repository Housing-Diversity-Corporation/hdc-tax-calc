import React, { useEffect, useRef } from 'react';

interface MapCanvasProps {
  mapRef: React.RefObject<HTMLDivElement | null>;
}

const MapCanvasComponent: React.FC<MapCanvasProps> = ({ mapRef }) => {
  const mountCountRef = useRef(0);

  useEffect(() => {
    mountCountRef.current += 1;
    // console.log('🗺️ [MAP CANVAS] Mounted (count:', mountCountRef.current, ')');

    return () => {
      // console.log('🗺️ [MAP CANVAS] Unmounted');
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: '300px',
        position: 'relative',
        zIndex: 1,
        backgroundColor: '#5f9ea0',
      }}
      data-testid="map-canvas"
    />
  );
};

// Memoize to prevent unnecessary re-renders
// Only re-render if mapRef identity changes
export const MapCanvas = React.memo(MapCanvasComponent, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  // Return false if props changed (allow re-render)
  return prevProps.mapRef === nextProps.mapRef;
});
