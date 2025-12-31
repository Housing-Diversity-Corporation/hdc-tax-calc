import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Slider } from 'primereact/slider';
import { Checkbox } from 'primereact/checkbox';
import type { SolarAnalysis } from '../types/solar';
import '../styles/solarPanel.css';

interface SolarPanelProps {
  visible: boolean;
  isLoading: boolean;
  solarData: SolarAnalysis | null;
  activeTab: 'analysis' | 'layers';
  onTabChange: (tab: 'analysis' | 'layers') => void;
  onClose: () => void;
  onClearAll: () => void;

  // Data layers props
  loadingOverlay: boolean;
  showFluxOverlay: boolean;
  showMapWideHeatmap: boolean;
  overlayOpacity: number;
  onToggleFluxOverlay: () => void;
  onToggleMapWideHeatmap: () => void;
  onUpdateOverlayOpacity: (value: number) => void;
  onClearAllOverlays: () => void;
}

const SolarPanel: React.FC<SolarPanelProps> = ({
  visible,
  isLoading,
  solarData,
  activeTab,
  onTabChange,
  onClose,
  onClearAll,
  loadingOverlay,
  showFluxOverlay,
  showMapWideHeatmap,
  overlayOpacity,
  onToggleFluxOverlay,
  onToggleMapWideHeatmap,
  onUpdateOverlayOpacity,
  onClearAllOverlays,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`solar-panel ${visible ? 'visible' : 'hidden'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {isExpanded ? (
        <>
          {/* Panel Header */}
          <div className="solar-panel-header">
            <div className="header-content">
              <i className="pi pi-sun" style={{ fontSize: '24px', color: '#bfb05e' }}></i>
              <div>
                <div className="header-title">Solar Analysis</div>
                <div className="header-subtitle">Powered by Google Solar API</div>
              </div>
            </div>
            <div className="header-actions">
              <button
                onClick={() => {
                  onClearAll();
                  onClose();
                }}
                className="close-button"
                title="Close and Clear All"
              >
                <i className="pi pi-times"></i>
              </button>
              <button onClick={() => setIsExpanded(false)} className="collapse-button" title="Collapse">
                <i className="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>

      {/* Tabs */}
      <div className="solar-tabs">
        <button
          onClick={() => onTabChange('analysis')}
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          disabled={!solarData}
        >
          <i className="pi pi-chart-line"></i>
          Analysis
        </button>
        <button
          onClick={() => onTabChange('layers')}
          className={`tab ${activeTab === 'layers' ? 'active' : ''}`}
          disabled={!solarData}
        >
          <i className="pi pi-map"></i>
          Data Layers
        </button>
      </div>

      {/* Panel Content */}
      <div className="solar-panel-content">
        {isLoading ? (
          <div className="loading-container">
            <ProgressSpinner style={{ width: '60px', height: '60px' }} />
            <p>Analyzing solar potential...</p>
          </div>
        ) : activeTab === 'analysis' && solarData ? (
          <div>
            {/* Data Quality Info */}
            <div className="data-quality-box">
              <div><strong>Data Quality:</strong> {solarData.buildingInsights.imageryQuality}</div>
              <div><strong>Imagery Date:</strong> {solarData.buildingInsights.imageryDate.month}/{solarData.buildingInsights.imageryDate.year}</div>
              <div><strong>Location:</strong> {solarData.buildingInsights.postalCode || 'N/A'}</div>
            </div>

            {/* Key Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric-card metric-orange">
                <div className="metric-value">{solarData.summary.maxPanels}</div>
                <div className="metric-label">Max Solar Panels</div>
              </div>

              <div className="metric-card metric-orange">
                <div className="metric-value">{solarData.summary.maxArrayAreaM2.toFixed(0)}</div>
                <div className="metric-label">Roof Area (m²)</div>
              </div>

              <div className="metric-card metric-green">
                <div className="metric-value">{solarData.summary.yearlyEnergyKwh.toLocaleString()}</div>
                <div className="metric-label">Yearly Energy (kWh)</div>
              </div>

              <div className="metric-card metric-blue">
                <div className="metric-value">{solarData.summary.carbonOffsetKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <div className="metric-label">Carbon Offset (kg/yr)</div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="details-box">
              <div><strong>Roof Segments:</strong> {solarData.summary.roofSegments}</div>
              <div><strong>Max Sunshine Hours:</strong> {solarData.buildingInsights.solarPotential.maxSunshineHoursPerYear.toLocaleString()}/year</div>
            </div>
          </div>
        ) : activeTab === 'layers' ? (
          loadingOverlay ? (
            <div className="loading-container">
              <ProgressSpinner style={{ width: '60px', height: '60px' }} />
              <p>Loading overlay data...</p>
            </div>
          ) : (
            <div>
              <p className="layers-description">
                Visualize solar data as interactive heatmap overlays on the map
              </p>

              {/* Overlay Options */}
              <div className="overlay-options">
                <div
                  className={`overlay-card ${showFluxOverlay ? 'active' : ''}`}
                  onClick={onToggleFluxOverlay}
                >
                  <div className="overlay-card-header">
                    <Checkbox inputId="flux" checked={showFluxOverlay} disabled={loadingOverlay} />
                    <label htmlFor="flux">Solar Flux Heatmap</label>
                  </div>
                  <p className="overlay-description">Annual solar energy potential (kWh/kW/year)</p>
                </div>

                <div
                  className={`overlay-card ${showMapWideHeatmap ? 'active' : ''}`}
                  onClick={onToggleMapWideHeatmap}
                >
                  <div className="overlay-card-header">
                    <Checkbox inputId="mapwide" checked={showMapWideHeatmap} disabled={loadingOverlay} />
                    <label htmlFor="mapwide">Map-Wide Heatmap</label>
                  </div>
                  <p className="overlay-description">Large area solar irradiance (auto-sizes based on coverage)</p>
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="opacity-control">
                <label>Overlay Opacity: {Math.round(overlayOpacity * 100)}%</label>
                <Slider
                  value={overlayOpacity}
                  onChange={(e) => onUpdateOverlayOpacity(e.value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>

              {/* Clear Button */}
              <Button
                label="Clear All Overlays"
                icon="pi pi-times"
                onClick={onClearAllOverlays}
                severity="secondary"
                className="clear-overlays-btn"
              />
            </div>
          )
        ) : null}
      </div>

          {/* Panel Footer */}
          <div className="solar-panel-footer">
            <Button
              label="Close Panel"
              icon="pi pi-times"
              onClick={() => {
                onClearAll();
                onClose();
              }}
              outlined
              className="footer-btn"
              style={{ flex: 1 }}
            />
          </div>
        </>
      ) : (
        /* Collapsed State */
        <div className="solar-collapsed">
          <Button
            icon="pi pi-chevron-left"
            onClick={() => setIsExpanded(true)}
            className="p-button-text expand-button"
            tooltip="Expand Solar Panel"
            style={{ color: '#407f7f' }}
          />
          <div className="solar-icon-collapsed">
            <i className="pi pi-sun" style={{ fontSize: '20px', color: 'white' }}></i>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarPanel;
