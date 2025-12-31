import type { GeoJsonFeatureCollection } from '../../types/map/geojson';

export const exportToCsv = (data: GeoJsonFeatureCollection, filename: string = 'export.csv') => {
  if (!data || !data.features || data.features.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Extract headers from the first feature's properties
  const firstFeature = data.features[0];
  const properties = firstFeature.properties || {};
  const headers = Object.keys(properties);

  // Add geometry coordinates if available
  if (firstFeature.geometry) {
    headers.push('geometry_type', 'coordinates');
  }

  // Create CSV content
  const csvRows = [];

  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Add data rows
  for (const feature of data.features) {
    const row = headers.map(header => {
      if (header === 'geometry_type' && feature.geometry) {
        return `"${feature.geometry.type}"`;
      }
      if (header === 'coordinates' && feature.geometry) {
        return `"${JSON.stringify(feature.geometry.coordinates)}"`;
      }
      const value = feature.properties?.[header];
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
