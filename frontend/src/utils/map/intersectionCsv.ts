/**
 * Intersection CSV Export Utilities
 * Specialized CSV export for intersection results with table-prefixed columns
 */

interface IntersectionFeature {
  type: string;
  geometry?: unknown;
  properties?: Record<string, unknown>;
}

interface IntersectionFeatureCollection {
  type: string;
  features: IntersectionFeature[];
}

/**
 * Flatten nested properties with table name suffixes
 * Example: { seattle_zoning: { zone: 'LR1' } } becomes { 'zone.seattle_zoning': 'LR1' }
 */
function flattenPropertiesWithTablePrefix(properties: Record<string, unknown>): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  for (const [tableName, value] of Object.entries(properties)) {
    // Skip geometry-related fields
    if (tableName === 'geometry' || tableName === 'geometry_type' || tableName === 'coordinates') {
      continue;
    }

    // If value is an object and looks like table data (not null, not array)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // This is likely a table object - flatten it with table suffix
      const tableData = value as Record<string, unknown>;

      for (const [propertyName, propertyValue] of Object.entries(tableData)) {
        // Skip nested objects and geometry fields
        if (propertyName === 'geometry' || propertyName === 'geometry_type') {
          continue;
        }

        // Create suffixed column name: propertyName.tableName
        const suffixedKey = `${propertyName}.${tableName}`;

        // Only include primitive values
        if (propertyValue !== null && propertyValue !== undefined && typeof propertyValue !== 'object') {
          flattened[suffixedKey] = propertyValue;
        } else if (typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
          // Handle one more level of nesting if needed
          const nestedData = propertyValue as Record<string, unknown>;
          for (const [nestedKey, nestedValue] of Object.entries(nestedData)) {
            if (nestedValue !== null && nestedValue !== undefined && typeof nestedValue !== 'object') {
              flattened[`${nestedKey}.${suffixedKey}`] = nestedValue;
            }
          }
        }
      }
    } else {
      // Simple property - include as-is
      flattened[tableName] = value;
    }
  }

  return flattened;
}

/**
 * Export intersection results to CSV with table-prefixed columns
 * Excludes geometry data, focuses on property attributes
 */
export function exportIntersectionToCsv(
  data: IntersectionFeatureCollection,
  filename: string = 'intersection_export.csv'
): void {
  if (!data || !data.features || data.features.length === 0) {
    console.warn('No intersection data to export');
    throw new Error('No intersection data to export');
  }

  console.log('📊 Exporting intersection data:', {
    featureCount: data.features.length,
    filename
  });

  // Flatten all features to collect all possible headers
  const flattenedFeatures = data.features.map(feature =>
    flattenPropertiesWithTablePrefix(feature.properties || {})
  );

  // Collect all unique headers from all features
  const headersSet = new Set<string>();
  flattenedFeatures.forEach(feature => {
    Object.keys(feature).forEach(key => headersSet.add(key));
  });

  const headers = Array.from(headersSet).sort();

  console.log('📋 CSV Headers:', headers);

  // Create CSV rows
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Add data rows
  for (const flattenedFeature of flattenedFeatures) {
    const row = headers.map(header => {
      const value = flattenedFeature[header];

      if (value === null || value === undefined) {
        return '""';
      }

      // Handle different value types
      if (typeof value === 'number') {
        return String(value);
      }

      if (typeof value === 'boolean') {
        return String(value);
      }

      // String values - escape quotes and wrap in quotes
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    });

    csvRows.push(row.join(','));
  }

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Ensure .csv extension
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);

  console.log('✅ CSV exported successfully:', finalFilename);
}

/**
 * Preview the flattened structure without exporting
 * Useful for debugging
 */
export function previewIntersectionCsvStructure(data: IntersectionFeatureCollection): {
  headers: string[];
  sampleRows: Record<string, unknown>[];
} {
  if (!data || !data.features || data.features.length === 0) {
    return { headers: [], sampleRows: [] };
  }

  const flattenedFeatures = data.features
    .slice(0, 5) // Preview first 5 features
    .map(feature => flattenPropertiesWithTablePrefix(feature.properties || {}));

  const headersSet = new Set<string>();
  flattenedFeatures.forEach(feature => {
    Object.keys(feature).forEach(key => headersSet.add(key));
  });

  return {
    headers: Array.from(headersSet).sort(),
    sampleRows: flattenedFeatures
  };
}
