/**
 * Location Analysis Section
 *
 * Displays property location with:
 * - Google Maps link
 * - King County parcel data (if available)
 * - Overlapping data layer features (zoning, opportunity zones, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Separator } from '../../ui/separator';
import { fetchParcelData, formatParcelDataHtml, type ParcelInfo } from '../../../utils/map/parcelUtils';
import api from '../../../services/api';

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#407f7f] text-lg">
              King County Parcel Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
              {parcelData.pin && (
                <tr>
                  <td className="p-2 font-semibold">PIN:</td>
                  <td className="p-2 text-gray-600">{parcelData.pin}</td>
                </tr>
              )}
              {parcelData.owner && (
                <tr>
                  <td className="p-2 font-semibold">Owner:</td>
                  <td className="p-2 text-gray-600">{parcelData.owner}</td>
                </tr>
              )}
              {parcelData.presentUse && (
                <tr>
                  <td className="p-2 font-semibold">Present Use:</td>
                  <td className="p-2 text-gray-600">{parcelData.presentUse}</td>
                </tr>
              )}
              {parcelData.zoning && (
                <tr>
                  <td className="p-2 font-semibold">Zoning:</td>
                  <td className="p-2 text-gray-600">{parcelData.zoning}</td>
                </tr>
              )}
              {parcelData.appraisedValue && (
                <tr>
                  <td className="p-2 font-semibold">Appraised Value:</td>
                  <td className="p-2 text-gray-600">
                    ${parseInt(parcelData.appraisedValue).toLocaleString()}
                  </td>
                </tr>
              )}
              {parcelData.lotSqft && (
                <tr>
                  <td className="p-2 font-semibold">Lot Size:</td>
                  <td className="p-2 text-gray-600">
                    {parseInt(parcelData.lotSqft).toLocaleString()} sq ft
                  </td>
                </tr>
              )}
              {parcelData.yearBuilt && parcelData.yearBuilt !== '0' && (
                <tr>
                  <td className="p-2 font-semibold">Year Built:</td>
                  <td className="p-2 text-gray-600">{parcelData.yearBuilt}</td>
                </tr>
              )}
            </tbody>
          </table>
          {parcelData.pin && (
            <div className="mt-4">
              <a
                href={`https://gismaps.kingcounty.gov/parcelviewer2/?pin=${parcelData.pin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#407f7f] hover:text-[#276221] no-underline text-sm"
              >
                View Full Parcel Details →
              </a>
            </div>
          )}
          </CardContent>
        </Card>
      )}

      {/* Data Layer Features */}
      {dataLayerFeatures.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div
              onClick={() => setDataLayersExpanded(!dataLayersExpanded)}
              className="flex items-center justify-between cursor-pointer mb-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <h3 className="m-0 text-2xl font-semibold text-[#276221]">
                Overlapping Data Layers
              </h3>
              <span className="text-2xl text-[#276221]">
                {dataLayersExpanded ? '−' : '+'}
              </span>
            </div>

            {dataLayersExpanded && (
              <>
                <p className="text-sm text-gray-600 mb-6">
                  {dataLayerFeatures.length} data layer{dataLayerFeatures.length > 1 ? 's' : ''} at this location
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="border-2 border-[#407f7f] shadow-sm h-fit"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-[#407f7f] text-lg font-semibold">
                            {displayName}
                          </CardTitle>
                        </CardHeader>
                        <Separator className="mb-4" />
                        <CardContent>
                          <div className="h-[200px] overflow-y-auto text-sm">
                            {Object.entries(displayProperties)
                              .filter(([key]) => key !== 'geom' && key !== 'geometry' && key !== 'type' && key !== 'null')
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className="mb-2 grid grid-cols-2 gap-3 items-start"
                                >
                                  <strong className="text-sm">
                                    {formatKey(key)}:
                                  </strong>
                                  <span className="text-gray-600 break-words text-sm">
                                    {value?.toString() || 'N/A'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center p-8 text-gray-600">
          Loading location data...
        </div>
      )}
    </div>
  );
};

export default LocationAnalysisSection;
