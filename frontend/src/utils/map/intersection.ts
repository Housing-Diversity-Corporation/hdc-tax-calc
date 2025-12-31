import type { LayerConfig, IntersectionBoundingBox, IntersectionFilters, IntersectionPayload, IntersectionMetrics } from '../../types/map/intersection';

/**
 * Intersection Utilities
 * Helper functions for intersection operations
 */
export class IntersectionUtils {
  /**
   * Extract valid table IDs from enabled layers
   */
  static extractTableIds(layers: LayerConfig[]): string[] {
    return layers
      .map(layer => layer.apiTableId)
      .filter((id): id is string => id !== undefined && id !== null);
  }

  /**
   * Calculate bounding box from Google Maps bounds
   */
  static calculateBoundingBox(bounds: google.maps.LatLngBounds): IntersectionBoundingBox {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    return {
      minLng: sw.lng(),
      minLat: sw.lat(),
      maxLng: ne.lng(),
      maxLat: ne.lat()
    };
  }

  /**
   * Calculate approximate area in square degrees
   */
  static calculateAreaSize(bbox: IntersectionBoundingBox): number {
    return (bbox.maxLng - bbox.minLng) * (bbox.maxLat - bbox.minLat);
  }

  /**
   * Build filters for specific layers (e.g., Seattle zoning)
   */
  static buildFilters(
    tableIds: string[],
    seattleZoningFilters: Set<string>,
    seattleBaseZoneFilters: Set<string>
  ): IntersectionFilters {
    const filters: IntersectionFilters = {};

    if (tableIds.includes('seattle_zoning_code')) {
      filters['seattle_zoning_code'] = {
        'category_desc': Array.from(seattleZoningFilters),
        'base_zone': Array.from(seattleBaseZoneFilters)
      };
    }

    return filters;
  }

  /**
   * Create intersection payload
   */
  static createPayload(
    tableIds: string[],
    bbox: IntersectionBoundingBox | null,
    filters: IntersectionFilters
  ): IntersectionPayload {
    return { tableIds, bbox, filters };
  }

  /**
   * Calculate intersection metrics for logging/monitoring
   */
  static calculateMetrics(
    map: google.maps.Map | null,
    bbox: IntersectionBoundingBox | null,
    enabledLayersCount: number,
    validTableIdsCount: number
  ): IntersectionMetrics {
    const zoom = map?.getZoom() || 0;
    const areaSize = bbox ? this.calculateAreaSize(bbox) : 0;

    return {
      zoom,
      areaSize,
      enabledLayersCount,
      validTableIdsCount
    };
  }

  /**
   * Check if area is too large for optimal performance
   */
  static isAreaTooLarge(zoom: number, areaSize: number): boolean {
    return zoom < 11 || areaSize > 1;
  }

  /**
   * Format feature counts for display
   */
  static formatFeatureCounts(featureCounts: Record<string, number>): string {
    return Object.entries(featureCounts)
      .map(([layer, count]) => `${layer}: ${count} features`)
      .join('\n');
  }

  /**
   * Validate intersection requirements
   */
  static validateIntersectionRequirements(
    enabledLayersCount: number,
    validTableIdsCount: number
  ): { valid: boolean; message?: string } {
    if (enabledLayersCount < 2) {
      return {
        valid: false,
        message: 'Please enable at least 2 layers to perform intersection'
      };
    }

    if (validTableIdsCount < 2) {
      return {
        valid: false,
        message: `Selected layers must have backend data sources. Found ${validTableIdsCount} valid table IDs`
      };
    }

    return { valid: true };
  }
}