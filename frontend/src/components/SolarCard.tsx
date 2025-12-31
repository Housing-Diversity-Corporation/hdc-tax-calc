import React, { useState, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { getSolarAnalysis } from '../services/solarService';
import type { SolarAnalysis } from '../types/solar';

interface SolarCardProps {
  map: google.maps.Map;
  apiKey: string;
}

const SolarCard: React.FC<SolarCardProps> = ({ map, apiKey }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [solarData, setSolarData] = useState<SolarAnalysis | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const toastRef = useRef<Toast>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAnalyzeSolar = async () => {
    if (!map) return;

    // Change cursor to crosshair for location selection
    map.setOptions({ draggableCursor: 'crosshair' });

    toastRef.current?.show({
      severity: 'info',
      summary: 'Solar Analysis',
      detail: 'Click on a building to analyze its solar potential',
      life: 5000,
    });

    // Listen for map click
    const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      // Remove the click listener
      google.maps.event.removeListener(clickListener);
      map.setOptions({ draggableCursor: null });

      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setIsLoading(true);

      try {
        // Clear previous marker
        if (markerRef.current) {
          markerRef.current.map = null;
        }

        // Fetch solar data
        const analysis = await getSolarAnalysis(lat, lng, apiKey);
        setSolarData(analysis);
        setDialogVisible(true);

        // Create a marker at the analyzed location
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
          detail: error instanceof Error ? error.message : 'Failed to analyze solar potential. The building may not be in our database.',
          life: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const clearSolarMarker = () => {
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
    setSolarData(null);
    setDialogVisible(false);
  };

  const cardTitle = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <i className="pi pi-sun" style={{ color: '#FF9800' }}></i>
      <span>Solar Analysis</span>
    </div>
  );

  const cardContent = (
    <div>
      <p style={{ fontSize: '12px', margin: '0 0 10px 0', color: '#666' }}>
        Click on any building to analyze its solar potential
      </p>
      <Button
        label="Analyze Location"
        icon="pi pi-map-marker"
        onClick={handleAnalyzeSolar}
        disabled={isLoading}
        style={{
          backgroundColor: '#FF9800',
          border: 'none',
          fontSize: '12px',
          padding: '8px 12px',
        }}
      />
    </div>
  );

  return (
    <>
      <Toast ref={toastRef} position="top-right" />

      <Card
        title={cardTitle}
        style={{
          width: isExpanded ? '300px' : 'auto',
          cursor: 'pointer',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
        onClick={isExpanded ? undefined : handleCardClick}
      >
        {isExpanded && (
          <>
            {cardContent}
            <Button
              icon="pi pi-times"
              rounded
              text
              severity="secondary"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '24px',
                height: '24px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            />
          </>
        )}
        {!isExpanded && (
          <div style={{ display: 'none' }}>{cardContent}</div>
        )}
      </Card>

      {/* Solar Data Dialog */}
      <Dialog
        header="☀️ Solar Potential Analysis"
        visible={dialogVisible}
        style={{ width: '450px' }}
        onHide={() => setDialogVisible(false)}
        footer={
          <div>
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={() => setDialogVisible(false)}
              className="p-button-text"
            />
            <Button
              label="Clear Marker"
              icon="pi pi-trash"
              onClick={clearSolarMarker}
              severity="danger"
            />
          </div>
        }
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            <p>Analyzing solar potential...</p>
          </div>
        ) : solarData ? (
          <div>
            <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#FFF3E0', borderRadius: '4px' }}>
              <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
                <strong>Data Quality:</strong> {solarData.buildingInsights.imageryQuality}
                <br />
                <strong>Imagery Date:</strong> {solarData.buildingInsights.imageryDate.month}/{solarData.buildingInsights.imageryDate.year}
                <br />
                <strong>Location:</strong> {solarData.buildingInsights.postalCode || 'N/A'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {solarData.summary.maxPanels}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Max Solar Panels</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                  {solarData.summary.maxArrayAreaM2.toFixed(0)}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Roof Area (m²)</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {solarData.summary.yearlyEnergyKwh.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Yearly Energy (kWh)</div>
              </div>

              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                  {solarData.summary.carbonOffsetKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Carbon Offset (kg/yr)</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#E3F2FD', borderRadius: '4px' }}>
              <p style={{ margin: '0', fontSize: '12px' }}>
                <strong>Roof Segments:</strong> {solarData.summary.roofSegments}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                <strong>Max Sunshine Hours:</strong> {solarData.buildingInsights.solarPotential.maxSunshineHoursPerYear.toLocaleString()}/year
              </p>
            </div>

            {solarData.buildingInsights.solarPotential.financialAnalyses &&
             solarData.buildingInsights.solarPotential.financialAnalyses.length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#F1F8E9', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>💰 Financial Analysis Available</h4>
                <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
                  Financial details include cost savings, payback periods, and incentives.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Dialog>
    </>
  );
};

export default SolarCard;
