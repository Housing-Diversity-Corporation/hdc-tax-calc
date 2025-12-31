export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export interface GeoJsonProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: GeoJsonProperties;
  id?: string | number;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export type GeoJsonData = GeoJsonFeature | GeoJsonFeatureCollection;