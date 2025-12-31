import { GeoJsonFeatureCollection } from '../types/geojson';

type CsvValue = string | number | boolean | null | undefined;

export const exportToCsv = (data: GeoJsonFeatureCollection, filename: string) => {
    const features = data.features;
    if (!features || features.length === 0) {
        alert('No features to export.');
        return;
    }

    // Flatten properties and collect all possible headers
    const allHeaders = new Set<string>();
    const flattenedFeatures = features.map(feature => {
        const flatProperties: { [key: string]: CsvValue } = {};
        if (feature.properties) {
            for (const key in feature.properties) {
                const value = feature.properties[key];
                if (typeof value === 'object' && value !== null) {
                    const valueAsObject = value as Record<string, CsvValue>;
                    for (const propKey in valueAsObject) {
                        if (Object.prototype.hasOwnProperty.call(valueAsObject, propKey)) {
                            const newKey = `${propKey}_${key}`;
                            flatProperties[newKey] = valueAsObject[propKey];
                            allHeaders.add(newKey);
                        }
                    }
                } else {
                    flatProperties[key] = value;
                    allHeaders.add(key);
                }
            }
        }
        return { ...feature, properties: flatProperties };
    });

    const headers = Array.from(allHeaders);
    const csvRows = [
        headers.join(','),
        ...flattenedFeatures.map(feature => {
            const values = headers.map(header => {
                const value = feature.properties?.[header];
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = String(value);
                if (stringValue.includes(',')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            return values.join(',');
        })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};