import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { getSolarAnalysis, getDataLayerUrls, downloadGeoTIFF } from '../services/solarService';
import { createSolarOverlay, SOLAR_COLOR_SCALES, createColorScaleLegend } from '../utils/solarVisualization';
import type { SolarAnalysis, DataLayersResponse } from '../types/solar';

interface SolarCardEnhancedProps {
  map: google.maps.Map;
  apiKey: string;
  onSolarUpdate?: (
    visible: boolean,
    isLoading: boolean,
    solarData: SolarAnalysis | null,
    activeTab: 'analysis' | 'layers',
    onTabChange: (tab: 'analysis' | 'layers') => void,
    onClose: () => void,
    onClearAll: () => void,
    // Data layers props
    loadingOverlay: boolean,
    showFluxOverlay: boolean,
    showMapWideHeatmap: boolean,
    overlayOpacity: number,
    onToggleFluxOverlay: () => void,
    onToggleMapWideHeatmap: () => void,
    onUpdateOverlayOpacity: (value: number) => void,
    onClearAllOverlays: () => void
  ) => void;
}

const SolarCardEnhanced: React.FC<SolarCardEnhancedProps> = ({ map, apiKey, onSolarUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solarData, setSolarData] = useState<SolarAnalysis | null>(null);
  const [dataLayers, setDataLayers] = useState<DataLayersResponse | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.7);
  const [showFluxOverlay, setShowFluxOverlay] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [showMapWideHeatmap, setShowMapWideHeatmap] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'layers'>('analysis');

  const toastRef = useRef<Toast>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const fluxOverlayRef = useRef<google.maps.GroundOverlay | null>(null);
  const mapWideOverlayRef = useRef<google.maps.GroundOverlay | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const currentLatLng = useRef<{ lat: number; lng: number } | null>(null);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAnalyzeSolar = async () => {
    if (!map) return;

    map.setOptions({ draggableCursor: 'crosshair' });

    toastRef.current?.show({
      severity: 'info',
      summary: 'Solar Analysis',
      detail: 'Click on a building to analyze its solar potential',
      life: 5000,
    });

    const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      google.maps.event.removeListener(clickListener);
      map.setOptions({ draggableCursor: null });

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      currentLatLng.current = { lat, lng };

      setIsLoading(true);

      try {
        // Clear previous marker
        if (markerRef.current) {
          markerRef.current.map = null;
        }

        // Fetch solar data
        const analysis = await getSolarAnalysis(lat, lng, apiKey);
        setSolarData(analysis);
        setPanelVisible(true);
        setActiveTab('analysis');

        // Create a marker
        const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        const pinElement = new PinElement({
          background: '#FF9800',
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          glyph: '☀',
        });

        const marker = new AdvancedMarkerElement({
          map: map,
          position: { lat, lng },
          content: pinElement.element,
          title: 'Solar Analysis',
        });

        markerRef.current = marker;

        toastRef.current?.show({
          severity: 'success',
          summary: 'Analysis Complete',
          detail: 'Solar potential data retrieved',
          life: 3000,
        });
      } catch (error) {
        console.error('Error analyzing solar potential:', error);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Analysis Failed',
          detail: error instanceof Error ? error.message : 'Failed to analyze solar potential',
          life: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleShowDataLayers = async () => {
    if (!currentLatLng.current) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'No Location',
        detail: 'Please analyze a location first',
        life: 3000,
      });
      return;
    }

    setActiveTab('layers');

    // Fetch data layers if not already loaded
    if (!dataLayers) {
      setLoadingOverlay(true);
      try {
        const layers = await getDataLayerUrls(
          {
            latitude: currentLatLng.current.lat,
            longitude: currentLatLng.current.lng,
          },
          50, // 50 meter radius
          apiKey
        );
        setDataLayers(layers);
      } catch (error) {
        console.error('Error fetching data layers:', error);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch data layer URLs',
          life: 3000,
        });
      } finally {
        setLoadingOverlay(false);
      }
    }
  };

  const toggleFluxOverlay = async () => {
    if (!dataLayers || !map) return;

    if (showFluxOverlay) {
      // Remove overlay
      if (fluxOverlayRef.current) {
        fluxOverlayRef.current.setMap(null);
        fluxOverlayRef.current = null;
      }
      if (legendRef.current) {
        legendRef.current.style.display = 'none';
      }
      setShowFluxOverlay(false);
    } else {
      // Add overlay
      setLoadingOverlay(true);
      try {
        const geoTiff = await downloadGeoTIFF(dataLayers.annualFluxUrl, apiKey);
        const overlay = createSolarOverlay(geoTiff, SOLAR_COLOR_SCALES.FLUX, overlayOpacity, false);
        overlay.setMap(map);
        fluxOverlayRef.current = overlay;

        // Add legend
        if (!legendRef.current) {
          const legend = document.createElement('div');
          legend.style.position = 'absolute';
          legend.style.bottom = '50px';
          legend.style.right = '10px';
          legend.style.backgroundColor = 'white';
          legend.style.padding = '10px';
          legend.style.borderRadius = '4px';
          legend.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          legend.style.zIndex = '1000';

          const canvas = createColorScaleLegend(SOLAR_COLOR_SCALES.FLUX);
          legend.appendChild(canvas);

          map.getDiv().appendChild(legend);
          legendRef.current = legend;
        } else {
          legendRef.current.style.display = 'block';
        }

        setShowFluxOverlay(true);

        toastRef.current?.show({
          severity: 'success',
          summary: 'Overlay Added',
          detail: 'Solar flux heatmap displayed',
          life: 3000,
        });
      } catch (error) {
        console.error('Error loading flux overlay:', error);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load solar flux overlay',
          life: 3000,
        });
      } finally {
        setLoadingOverlay(false);
      }
    }
  };


  const toggleMapWideHeatmap = async () => {
    if (!map) return;

    if (showMapWideHeatmap) {
      // Remove map-wide overlay
      if (mapWideOverlayRef.current) {
        mapWideOverlayRef.current.setMap(null);
        mapWideOverlayRef.current = null;
      }
      setShowMapWideHeatmap(false);
    } else {
      // Add map-wide heatmap
      setLoadingOverlay(true);
      try {
        const center = map.getCenter();
        if (!center) {
          throw new Error('Could not get map center');
        }

        toastRef.current?.show({
          severity: 'info',
          summary: 'Loading Map-Wide Heatmap',
          detail: 'Trying large area coverage...',
          life: 3000,
        });

        // Try progressively smaller radii with appropriate pixel sizes
        // Constraint: radius_meters <= pixel_size_meters × 1000
        const attempts = [
          { radius: 1000, pixelSize: 1.0, description: '2km x 2km' },
          { radius: 500, pixelSize: 0.5, description: '1km x 1km' },
          { radius: 250, pixelSize: 0.5, description: '500m x 500m' },
          { radius: 100, pixelSize: 0.5, description: '200m x 200m' },
        ];

        let layers = null;
        let successfulAttempt = null;

        for (const attempt of attempts) {
          try {
            layers = await getDataLayerUrls(
              {
                latitude: center.lat(),
                longitude: center.lng(),
              },
              attempt.radius,
              apiKey,
              attempt.pixelSize
            );
            successfulAttempt = attempt;
            break;
          } catch (error) {
            // Try next smaller radius
            console.log(`Solar data not available at ${attempt.radius}m radius, trying smaller...`);
            continue;
          }
        }

        if (!layers || !successfulAttempt) {
          throw new Error('No solar data available in this area at any coverage level');
        }

        // Download the flux data
        const fluxUrl = layers.annualFluxUrl;
        const geoTiff = await downloadGeoTIFF(fluxUrl, apiKey);

        // Create overlay
        const overlay = createSolarOverlay(geoTiff, SOLAR_COLOR_SCALES.FLUX, overlayOpacity, false);
        overlay.setMap(map);
        mapWideOverlayRef.current = overlay;
        setShowMapWideHeatmap(true);

        // Show legend if not already visible
        if (!legendRef.current) {
          const legend = document.createElement('div');
          legend.style.position = 'absolute';
          legend.style.bottom = '50px';
          legend.style.right = '10px';
          legend.style.backgroundColor = 'white';
          legend.style.padding = '10px';
          legend.style.borderRadius = '4px';
          legend.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          legend.style.zIndex = '1000';

          const canvas = createColorScaleLegend(SOLAR_COLOR_SCALES.FLUX);
          legend.appendChild(canvas);

          map.getDiv().appendChild(legend);
          legendRef.current = legend;
        } else {
          legendRef.current.style.display = 'block';
        }

        toastRef.current?.show({
          severity: 'success',
          summary: 'Heatmap Loaded',
          detail: `Showing ${successfulAttempt.description} solar irradiance`,
          life: 3000,
        });
      } catch (error) {
        console.error('Error loading map-wide heatmap:', error);
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load map-wide heatmap',
          life: 3000,
        });
      } finally {
        setLoadingOverlay(false);
      }
    }
  };

  const updateOverlayOpacity = (value: number) => {
    setOverlayOpacity(value);
    if (fluxOverlayRef.current) {
      fluxOverlayRef.current.setOpacity(value);
    }
    if (mapWideOverlayRef.current) {
      mapWideOverlayRef.current.setOpacity(value);
    }
  };

  const clearAllOverlays = () => {
    if (fluxOverlayRef.current) {
      fluxOverlayRef.current.setMap(null);
      fluxOverlayRef.current = null;
      setShowFluxOverlay(false);
    }
    if (mapWideOverlayRef.current) {
      mapWideOverlayRef.current.setMap(null);
      mapWideOverlayRef.current = null;
      setShowMapWideHeatmap(false);
    }
    if (legendRef.current) {
      legendRef.current.style.display = 'none';
    }
  };

  const clearSolarMarker = () => {
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    clearAllOverlays();
    setSolarData(null);
    setDataLayers(null);
    setPanelVisible(false);
    currentLatLng.current = null;
  };

  const handleTabChange = (tab: 'analysis' | 'layers') => {
    setActiveTab(tab);
    if (tab === 'layers') {
      handleShowDataLayers();
    }
  };

  const handleClose = () => {
    setPanelVisible(false);
    setIsExpanded(false); // Collapse the button when panel closes
  };

  // Notify parent when panel state changes
  useEffect(() => {
    onSolarUpdate?.(
      panelVisible,
      isLoading,
      solarData,
      activeTab,
      handleTabChange,
      handleClose,
      clearSolarMarker,
      loadingOverlay,
      showFluxOverlay,
      showMapWideHeatmap,
      overlayOpacity,
      toggleFluxOverlay,
      toggleMapWideHeatmap,
      updateOverlayOpacity,
      clearAllOverlays
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    panelVisible,
    isLoading,
    solarData,
    activeTab,
    loadingOverlay,
    showFluxOverlay,
    showMapWideHeatmap,
    overlayOpacity,
  ]);

  return (
    <>
      <Toast ref={toastRef} position="top-right" />

      <div
        style={{
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: isExpanded ? '320px' : '48px',
          height: isExpanded ? 'auto' : '48px',
          display: panelVisible ? 'none' : 'block', // Hide when panel is open
        }}
      >
        {/* Collapsed: Icon Button */}
        {!isExpanded && (
          <button
            onClick={handleCardClick}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #bfb05e 0%, #73513e 100%)',
              boxShadow: '0 4px 12px rgba(191, 176, 94, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              color: 'white',
              fontSize: '20px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(191, 176, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(191, 176, 94, 0.3)';
            }}
            title="Solar Analysis"
          >
            <i className="pi pi-sun"></i>
          </button>
        )}

        {/* Expanded: Full Panel */}
        {isExpanded && (
          <div
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(191, 176, 94, 0.3)',
              overflow: 'hidden',
              animation: 'slideIn 0.3s ease',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #407f7f 0%, #1c3333 100%)',
                padding: '16px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="pi pi-sun" style={{ fontSize: '20px', color: '#bfb05e' }}></i>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>Solar Analysis</div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Powered by Google Solar API</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                <i className="pi pi-times"></i>
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#666', lineHeight: '1.5' }}>
                Click on any building to analyze its solar potential and visualize data with heatmap overlays
              </p>
              <Button
                label="Analyze Location"
                icon="pi pi-map-marker"
                onClick={handleAnalyzeSolar}
                disabled={isLoading}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #bfb05e 0%, #73513e 100%)',
                  border: 'none',
                  fontSize: '13px',
                  padding: '10px',
                  fontWeight: '500',
                  borderRadius: '8px',
                  color: 'white',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default SolarCardEnhanced;
