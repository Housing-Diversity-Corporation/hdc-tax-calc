/**
 * Location Analysis Section
 *
 * Displays property location with:
 * - Google Maps link
 * - King County parcel data (if available)
 * - Overlapping data layer features (zoning, opportunity zones, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { fetchParcelData, formatParcelDataHtml, type ParcelInfo } from '../../utils/parcelUtils';
import api from '../../services/api';

interface DataLayerFeature {
  layerId: string;
  layerName: string;
  properties: { [key: string]: string | number | boolean | null };
}

interface LocationAnalysisSectionProps {
  dealLocation?: string;
  dealLatitude?: number;
  dealLongitude?: number;
  markerId?: number;
}

// Map database table names to UI display names
const TABLE_NAME_TO_DISPLAY_NAME: { [key: string]: string } = {
  'ca_wa_tracts': 'Census Tracts',
  'public.ca_wa_tracts': 'Census Tracts',
  'us_cities': 'Cities',
  'public.us_cities': 'Cities',
  'la_seattle_council_districts': 'Council Districts',
  'public.la_seattle_council_districts': 'Council Districts',
  'ca_wa_counties': 'Counties',
  'public.ca_wa_counties': 'Counties',
  'difficult_development_area': 'DDA',
  'public.difficult_development_area': 'DDA',
  'fmr_zipcode': 'FMR - MSA',
  'public.fmr_zipcode': 'FMR - MSA',
  'safmr_zipcode': 'FMR - Small Area',
  'public.safmr_zipcode': 'FMR - Small Area',
  'frequent_transit_area': 'Frequent Transit',
  'public.frequent_transit_area': 'Frequent Transit',
  'hacla_delta': 'HACLA Delta',
  'public.hacla_delta': 'HACLA Delta',
  'hacla_vps': 'HACLA VPS',
  'public.hacla_vps': 'HACLA VPS',
  'hoa_affh': 'HOA - AFFH',
  'public.hoa_affh': 'HOA - AFFH',
  'hoa': 'HOA - FHFA',
  'public.hoa': 'HOA - FHFA',
  'parcel_address_area': 'KC Parcels',
  'public.parcel_address_area': 'KC Parcels',
  'mha': 'MHA',
  'public.mha': 'MHA',
  'ca_wa_oz': 'OZ',
  'public.ca_wa_oz': 'OZ',
  'eig_oz_lgbl': 'OZ 2.0',
  'public.eig_oz_lgbl': 'OZ 2.0',
  'qualified_census_tract': 'QCT',
  'public.qualified_census_tract': 'QCT',
  'seattle_zoning_code': 'SDCI Zoning',
  'public.seattle_zoning_code': 'SDCI Zoning',
  'urban_villages': 'Urban Village',
  'public.urban_villages': 'Urban Village',
  'usda': 'USDA Ineligible',
  'public.usda': 'USDA Ineligible',
};

const formatKey = (key: string): string => {
  if (typeof key !== 'string' || key.length === 0) return '';
  const words = key.split('_');
  const capitalizedWords = words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  return capitalizedWords.join(' ');
};

const LocationAnalysisSection: React.FC<LocationAnalysisSectionProps> = ({
  dealLocation,
  dealLatitude,
  dealLongitude,
  markerId,
}) => {
  const [parcelData, setParcelData] = useState<ParcelInfo | null>(null);
  const [dataLayerFeatures, setDataLayerFeatures] = useState<DataLayerFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLayersExpanded, setDataLayersExpanded] = useState(true);

  useEffect(() => {
    if (!dealLatitude || !dealLongitude) return;

    const fetchLocationData = async () => {
      setLoading(true);

      // Fetch parcel data
      if (dealLocation) {
        try {
          const parcel = await fetchParcelData(dealLocation, dealLatitude, dealLongitude);
          setParcelData(parcel);
        } catch (error) {
          console.error('Error fetching parcel data:', error);
        }
      }

      // Fetch data layer features
      try {
        const response = await api.get(`/geodata/point-features`, {
          params: {
            lat: dealLatitude,
            lng: dealLongitude,
          },
        });
        setDataLayerFeatures(response.data || []);
      } catch (error) {
        console.error('Error fetching data layer features:', error);
      }

      setLoading(false);
    };

    fetchLocationData();
  }, [dealLatitude, dealLongitude, dealLocation]);

  if (!dealLatitude && !dealLongitude && dataLayerFeatures.length === 0 && !parcelData) {
    return null;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--hdc-spectra)',
        marginBottom: '1rem'
      }}>
        Location Analysis
      </h2>

      {/* Parcel Data */}
      {parcelData && parcelData.success && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--hdc-faded-jade)', fontSize: '1.1rem' }}>
            King County Parcel Information
          </h3>
          <table style={{ width: '100%', fontSize: '0.9rem' }}>
            <tbody>
              {parcelData.pin && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>PIN:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>{parcelData.pin}</td>
                </tr>
              )}
              {parcelData.owner && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Owner:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>{parcelData.owner}</td>
                </tr>
              )}
              {parcelData.presentUse && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Present Use:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>{parcelData.presentUse}</td>
                </tr>
              )}
              {parcelData.zoning && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Zoning:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>{parcelData.zoning}</td>
                </tr>
              )}
              {parcelData.appraisedValue && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Appraised Value:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>
                    ${parseInt(parcelData.appraisedValue).toLocaleString()}
                  </td>
                </tr>
              )}
              {parcelData.lotSqft && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Lot Size:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>
                    {parseInt(parcelData.lotSqft).toLocaleString()} sq ft
                  </td>
                </tr>
              )}
              {parcelData.yearBuilt && parcelData.yearBuilt !== '0' && (
                <tr>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-color)' }}>Year Built:</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-color-secondary)' }}>{parcelData.yearBuilt}</td>
                </tr>
              )}
            </tbody>
          </table>
          {parcelData.pin && (
            <div style={{ marginTop: '1rem' }}>
              <a
                href={`https://gismaps.kingcounty.gov/parcelviewer2/?pin=${parcelData.pin}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--hdc-faded-jade)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                }}
              >
                View Full Parcel Details →
              </a>
            </div>
          )}
        </Card>
      )}

      {/* Data Layer Features */}
      {dataLayerFeatures.length > 0 && (
        <Card>
          <div
            onClick={() => setDataLayersExpanded(!dataLayersExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}
          >
            <h3 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#276221'
            }}>
              Overlapping Data Layers
            </h3>
            <span style={{
              fontSize: '1.5rem',
              color: '#276221'
            }}>
              {dataLayersExpanded ? '−' : '+'}
            </span>
          </div>

          {dataLayersExpanded && (
            <>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-color-secondary)', marginBottom: '1.5rem' }}>
                {dataLayerFeatures.length} data layer{dataLayerFeatures.length > 1 ? 's' : ''} at this location
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1rem',
              }}>
                {dataLayerFeatures.map((feature, index) => {
                // Parse the properties - if 'value' exists and is a string, parse it as JSON
                let displayProperties = feature.properties;
                if (feature.properties.value && typeof feature.properties.value === 'string') {
                  try {
                    displayProperties = JSON.parse(feature.properties.value as string);
                  } catch (e) {
                    // If parsing fails, use the original properties
                    displayProperties = feature.properties;
                  }
                } else if (feature.properties.value && typeof feature.properties.value === 'object') {
                  // If value is already an object, use it directly
                  displayProperties = feature.properties.value as Record<string, string | number | boolean | null>;
                }

                // Get display name from mapping, fallback to layerName or layerId
                const displayName = TABLE_NAME_TO_DISPLAY_NAME[feature.layerId] || feature.layerName;

                return (
                  <Card
                    key={index}
                    style={{
                      border: '2px solid #407f7f',
                      backgroundColor: 'var(--surface-card)',
                      boxShadow: '0 2px 4px rgba(64, 127, 127, 0.1)',
                      height: 'fit-content',
                    }}
                  >
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      color: '#407f7f',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      paddingBottom: '0.5rem',
                    }}>
                      {displayName}
                    </h4>

                    <Divider style={{ margin: '0.5rem 0 1rem 0' }} />

                    <div style={{
                      height: '200px',
                      overflowY: 'auto',
                      fontSize: '0.85rem'
                    }}>
                      {Object.entries(displayProperties)
                        .filter(([key]) => key !== 'geom' && key !== 'geometry' && key !== 'type' && key !== 'null')
                        .map(([key, value]) => (
                          <div
                            key={key}
                            style={{
                              marginBottom: '8px',
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '12px',
                              alignItems: 'start',
                            }}
                          >
                            <strong style={{
                              color: 'var(--text-color)',
                              fontSize: '0.9rem',
                            }}>
                              {formatKey(key)}:
                            </strong>
                            <span style={{
                              color: 'var(--text-color-secondary)',
                              wordBreak: 'break-word',
                              fontSize: '0.9rem',
                            }}>
                              {value?.toString() || 'N/A'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                );
              })}
              </div>
            </>
          )}
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color-secondary)' }}>
          Loading location data...
        </div>
      )}
    </div>
  );
};

export default LocationAnalysisSection;
