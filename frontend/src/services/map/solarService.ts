// Solar API Service
// https://developers.google.com/maps/documentation/solar

import type {
  LatLng,
  BuildingInsightsResponse,
  DataLayersResponse,
  GeoTiff,
  SolarAnalysis,
} from '../../types/map/solar';

const SOLAR_API_BASE_URL = 'https://solar.googleapis.com/v1';

/**
 * Fetches building insights from the Solar API.
 * Returns solar potential, roof segments, and panel configurations.
 *
 * @param location - Latitude and longitude of the building
 * @param apiKey - Google Cloud API key
 * @returns Building insights including solar potential
 */
export async function getBuildingInsights(
  location: LatLng,
  apiKey: string,
): Promise<BuildingInsightsResponse> {
  const args = {
    'location.latitude': location.latitude.toFixed(5),
    'location.longitude': location.longitude.toFixed(5),
    required_quality: 'LOW', // Accept at least LOW quality, API returns highest available
  };

  console.log('GET buildingInsights\n', args);
  const params = new URLSearchParams({ ...args, key: apiKey });

  // https://developers.google.com/maps/documentation/solar/reference/rest/v1/buildingInsights/findClosest
  const response = await fetch(`${SOLAR_API_BASE_URL}/buildingInsights:findClosest?${params}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('getBuildingInsights failed\n', error);
    throw new Error(error.error?.message || 'Failed to fetch building insights');
  }

  const content = await response.json();
  console.log('buildingInsightsResponse', content);
  return content;
}

/**
 * Fetches data layers URLs from the Solar API.
 * Returns URLs for GeoTIFF files with solar flux data, DSM, RGB imagery, etc.
 *
 * @param location - Center point as latitude and longitude
 * @param radiusMeters - Radius of the data layer size in meters
 * @param apiKey - Google Cloud API key
 * @param pixelSizeMeters - Optional pixel size (default 0.5m). Max radius = pixelSize × 1000
 * @returns Data layer URLs for GeoTIFF files
 */
export async function getDataLayerUrls(
  location: LatLng,
  radiusMeters: number,
  apiKey: string,
  pixelSizeMeters?: number,
): Promise<DataLayersResponse> {
  const args: Record<string, string> = {
    'location.latitude': location.latitude.toFixed(5),
    'location.longitude': location.longitude.toFixed(5),
    radius_meters: radiusMeters.toString(),
    required_quality: 'LOW', // Accept at least LOW quality
  };

  // Add pixel_size_meters if specified (required for radius > 500m)
  // Constraint: radius_meters <= pixel_size_meters × 1000
  if (pixelSizeMeters !== undefined) {
    args.pixel_size_meters = pixelSizeMeters.toString();
  }

  console.log('GET dataLayers\n', args);
  const params = new URLSearchParams({ ...args, key: apiKey });

  // https://developers.google.com/maps/documentation/solar/reference/rest/v1/dataLayers/get
  const response = await fetch(`${SOLAR_API_BASE_URL}/dataLayers:get?${params}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('getDataLayerUrls failed\n', error);
    throw new Error(error.error?.message || 'Failed to fetch data layers');
  }

  const content = await response.json();
  console.log('dataLayersResponse', content);
  return content;
}

/**
 * Downloads and parses a GeoTIFF file from a data layer URL.
 * Requires geotiff, geotiff-geokeys-to-proj4, and proj4 packages.
 *
 * @param url - URL from the Data Layers response
 * @param apiKey - Google Cloud API key
 * @returns Pixel values with shape and lat/lon bounds
 */
export async function downloadGeoTIFF(url: string, apiKey: string): Promise<GeoTiff> {
  console.log(`Downloading data layer: ${url}`);

  // Dynamic imports to avoid bundling issues
  const geotiff = await import('geotiff');
  const geokeysToProj4 = await import('geotiff-geokeys-to-proj4');
  const proj4Module = await import('proj4');
  const proj4 = proj4Module.default;

  // Include your Google Cloud API key in the Data Layers URL
  const solarUrl = url.includes('solar.googleapis.com') ? url + `&key=${apiKey}` : url;
  const response = await fetch(solarUrl);

  if (!response.ok) {
    const error = await response.json();
    console.error(`downloadGeoTIFF failed: ${url}\n`, error);
    throw new Error('Failed to download GeoTIFF');
  }

  // Get the GeoTIFF rasters (pixel values for each band)
  const arrayBuffer = await response.arrayBuffer();
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();

  // Reproject the bounding box into lat/lon coordinates
  const geoKeys = image.getGeoKeys();
  const projObj = geokeysToProj4.toProj4(geoKeys);
  const projection = proj4(projObj.proj4, 'WGS84');
  const box = image.getBoundingBox();

  const sw = projection.forward({
    x: box[0] * projObj.coordinatesConversionParameters.x,
    y: box[1] * projObj.coordinatesConversionParameters.y,
  });
  const ne = projection.forward({
    x: box[2] * projObj.coordinatesConversionParameters.x,
    y: box[3] * projObj.coordinatesConversionParameters.y,
  });

  return {
    // Width and height of the data layer image in pixels
    width: rasters.width,
    height: rasters.height,
    // Convert rasters from TypedArrays to plain arrays
    rasters: [...Array(rasters.length).keys()].map((i) =>
      Array.from(rasters[i] as unknown as ArrayLike<number>),
    ),
    // The bounding box as a lat/lon rectangle
    bounds: {
      north: ne.y,
      south: sw.y,
      east: ne.x,
      west: sw.x,
    },
  };
}

/**
 * Get a comprehensive solar analysis for a location.
 * This is a convenience method that fetches building insights and creates a summary.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param apiKey - Google Cloud API key
 * @returns Solar analysis with building insights and summary
 */
export async function getSolarAnalysis(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<SolarAnalysis> {
  const location: LatLng = {
    latitude: lat,
    longitude: lng,
  };

  const buildingInsights = await getBuildingInsights(location, apiKey);

  // Extract key metrics for easy display
  const solarPotential = buildingInsights.solarPotential;
  const maxConfig = solarPotential.solarPanelConfigs?.[solarPotential.solarPanelConfigs.length - 1];

  return {
    buildingInsights,
    summary: {
      maxPanels: solarPotential.maxArrayPanelsCount,
      maxArrayAreaM2: solarPotential.maxArrayAreaMeters2,
      yearlyEnergyKwh: maxConfig?.yearlyEnergyDcKwh || 0,
      carbonOffsetKg: solarPotential.carbonOffsetFactorKgPerMwh * (maxConfig?.yearlyEnergyDcKwh || 0) / 1000,
      roofSegments: solarPotential.roofSegmentStats?.length || 0,
    },
  };
}

/**
 * Format solar data for display in info windows
 */
export function formatSolarDataHtml(analysis: SolarAnalysis): string {
  const { summary, buildingInsights } = analysis;

  return `
    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
      <h4 style="color: #FF9800; margin: 0 0 8px 0;">☀️ Solar Potential</h4>
      <p style="color: #666; font-size: 11px; margin: 0 0 8px 0;">
        Data from ${buildingInsights.imageryDate.month}/${buildingInsights.imageryDate.year}
        (${buildingInsights.imageryQuality} quality)
      </p>
      <p style="color: black; margin: 4px 0; font-size: 12px;">
        <strong>Max Panels:</strong> ${summary.maxPanels}
      </p>
      <p style="color: black; margin: 4px 0; font-size: 12px;">
        <strong>Roof Area:</strong> ${summary.maxArrayAreaM2.toFixed(0)} m²
      </p>
      <p style="color: black; margin: 4px 0; font-size: 12px;">
        <strong>Yearly Energy:</strong> ${summary.yearlyEnergyKwh.toLocaleString()} kWh
      </p>
      <p style="color: black; margin: 4px 0; font-size: 12px;">
        <strong>Carbon Offset:</strong> ${summary.carbonOffsetKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg/year
      </p>
      <p style="color: black; margin: 4px 0; font-size: 12px;">
        <strong>Roof Segments:</strong> ${summary.roofSegments}
      </p>
    </div>
  `;
}

export default {
  getBuildingInsights,
  getDataLayerUrls,
  downloadGeoTIFF,
  getSolarAnalysis,
  formatSolarDataHtml,
};
