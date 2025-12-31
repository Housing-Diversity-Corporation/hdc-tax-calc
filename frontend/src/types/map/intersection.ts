export interface IntersectionBoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface IntersectionFilters {
  [tableId: string]: {
    [field: string]: string[];
  };
}

export interface IntersectionPayload {
  tableIds: string[];
  bbox: IntersectionBoundingBox | null;
  filters: IntersectionFilters;
}

export interface IntersectionFeatureCounts {
  [layerId: string]: number;
}

export interface IntersectionResponse {
  featureCollection: import('geojson').FeatureCollection;
  featureCounts: IntersectionFeatureCounts;
}

export interface IntersectionMetrics {
  zoom: number;
  areaSize: number;
  enabledLayersCount: number;
  validTableIdsCount: number;
}

export interface LayerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading?: boolean;
  apiTableId?: string;
  data?: unknown[];
  intersectionData?: unknown;
}